import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { executeReasoningTurn, testReasoningServerConnection, getReasoningConfig } from "./server/reasoningAdapter.ts";
import { verifyMath, verifyDimensionalConsistency } from "./server/mathEngine.ts";
import { buildCodingSystemInstruction, executeCodeSafely } from "./server/codingEngine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory fallback and safe persistent store in /tmp
let usersCache: Record<string, any> = {};
const USERS_FILE = path.join(process.env.TMPDIR || "/tmp", "users.json");

try {
  if (fs.existsSync(USERS_FILE)) {
    usersCache = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } else {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));
  }
} catch (e) {
  // If filesystem write fails on read-only container root, continue with in-memory store
}

async function startServer() {
  const app = express();

  // Differentiate between local dev server (port 3000) and deployed Cloud Run container (PORT or 8080)
  const isDevProcess = 
    process.argv.includes('--port') || 
    process.argv.some(arg => arg.includes('tsx')) || 
    process.env.npm_lifecycle_event === 'dev';

  const isDev = isDevProcess;
  const PORT = isDev 
    ? (process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3000)
    : (process.env.PORT ? parseInt(process.env.PORT, 10) : 8080);

  app.use(express.json());

  // Health check routes for Cloud Run / deployment verification
  app.get(["/health", "/_health", "/status", "/api/health"], (req, res) => {
    res.json({ status: "healthy", ready: true, uptime: process.uptime() });
  });

  // Helper to read/write users
  const getUsers = () => {
    try {
      if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      }
    } catch (e) {}
    return usersCache;
  };

  const saveUsers = (users: any) => {
    usersCache = users;
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {}
  };

  // --- API Routes ---

  // Get user profile
  app.get("/api/user/profile/:email", (req, res) => {
    const { email } = req.params;
    const users = getUsers();
    const user = users[email];
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Login / Register
  app.post("/api/auth/login", (req, res) => {
    const { email, password, name } = req.body;
    const users = getUsers();
    
    if (users[email]) {
      if (users[email].password === password) {
        return res.json(users[email]);
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    }

    // New user
    const newUser = {
      email,
      name: name || email.split('@')[0],
      password,
      gender: 'other',
      location: '',
      avatar: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%2250%%22 x=%2250%%22 font-size=%2270%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>🎃</text></svg>`,
      isLoggedIn: true
    };
    users[email] = newUser;
    saveUsers(users);
    res.json(newUser);
  });

  // Update profile
  app.post("/api/user/update", (req, res) => {
    const { email, updates } = req.body;
    const users = getUsers();
    if (!users[email]) return res.status(404).json({ error: "User not found" });

    // Handle avatar update based on gender
    if (updates.gender && updates.gender !== users[email].gender) {
      const emojis: any = {
        male: "👨",
        female: "👩",
        other: "🎃"
      };
      const emoji = emojis[updates.gender] || "🎃";
      updates.avatar = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%2250%%22 x=%2250%%22 font-size=%2270%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>${emoji}</text></svg>`;
    }

    users[email] = { ...users[email], ...updates };
    saveUsers(users);
    res.json(users[email]);
  });

  // Simple OTP Store (In-memory)
  const otpStore = new Map<string, string>();

  // OTP for Email Change or Forgot Password
  app.post("/api/auth/otp-request", (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);
    console.log(`[SIMULATED CLOUD] OTP for ${email}: ${otp}`);
    res.json({ message: "OTP sent to email (Check server console in this applet)" });
  });

  app.post("/api/auth/otp-verify", (req, res) => {
    const { email, otp } = req.body;
    if (otpStore.get(email) === otp) {
      otpStore.delete(email);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  });

  // --- AI Proxy Routes ---

  // Helper to construct authoritative real-time temporal ground truth
  const buildTemporalInstruction = (userContext?: any) => {
    const now = new Date();
    const tz = userContext?.timezone || "UTC";
    
    let formattedDate = userContext?.formattedDate;
    let formattedTime = userContext?.formattedTime;
    let dayOfWeek = userContext?.dayOfWeek;
    const year = userContext?.year || now.getFullYear();

    if (!formattedDate || !formattedTime || !dayOfWeek) {
      try {
        formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: tz
        }).format(now);

        formattedTime = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true,
          timeZone: tz,
          timeZoneName: 'short'
        }).format(now);

        dayOfWeek = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          timeZone: tz
        }).format(now);
      } catch (e) {
        formattedDate = now.toDateString();
        formattedTime = now.toTimeString();
        dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      }
    }

    return `
AUTHORITATIVE REAL-TIME TEMPORAL GROUND TRUTH:
- Today's Date: ${formattedDate}
- Day of the Week: ${dayOfWeek}
- Current Local Time: ${formattedTime}
- User Timezone: ${tz}
- Current Year: ${year}
- Current ISO 8601 Timestamp: ${now.toISOString()}

TEMPORAL ACCURACY RULES:
1. Always treat the above date, time, year, and day of week as absolute ground truth.
2. The current year is ${year}. Never output an older year (such as 2023, 2024, or 2025) when asked about the present date or year.
3. When asked "What is today's date?", "What day is it today?", "What time is it?", "What year are we in?", or any relative date/time question (yesterday, today, tomorrow, next week, days until a date), ALWAYS answer accurately according to the reference above.
4. You have live, real-time access to the user's current clock. Never state that you cannot access real-time information or that your knowledge is limited by a training cutoff date.
`.trim();
  };

// Ensure valid GEMINI_API_KEY is used by the system and @google/genai SDK
if (process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

  const getCleanApiKey = () => {
    let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    return apiKey.trim().replace(/["']/g, "").replace(/^(API Key:|Key:)\s*/i, "");
  };

  app.post("/api/ai/text", async (req, res) => {
    const { model, contents, systemInstruction, userContext } = req.body;
    const apiKey = getCleanApiKey();

    if (!apiKey || apiKey === "undefined") {
      return res.status(500).json({ error: "Zinnia API Key is missing. Please add GOOGLE_API_KEY or GEMINI_API_KEY in the Settings menu." });
    }

    try {
      const temporalAnchor = buildTemporalInstruction(userContext);
      const combinedInstruction = systemInstruction
        ? `${temporalAnchor}\n\n${systemInstruction}`
        : temporalAnchor;

      // Specialized instructions for the 2 dedicated numerical AI models
      let specializedInstruction = combinedInstruction;
      let effectiveCandidates = [
        model || "gemini-3-flash-preview",
        "gemini-3-flash-preview",
        "gemini-flash-latest"
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      const isNumericalModel = model === 'zinnia-numeric-solver';
      const isDeepMathModel = model === 'zinnia-deep-math';
      const isCodingModel = model === 'zinnia-code-architect' || req.body.coding?.isCodingQuery;

      if (isCodingModel) {
        const codingTask = req.body.coding?.task || 'generator';
        const codingLang = req.body.coding?.language;
        const targetLang = req.body.coding?.targetLanguage;
        const codingInstruction = buildCodingSystemInstruction(codingTask, codingLang, targetLang);
        specializedInstruction = `${codingInstruction}\n\n${combinedInstruction}`.trim();
        effectiveCandidates = ["gemini-3-flash-preview", "gemini-flash-latest"];
      } else if (isNumericalModel) {
        specializedInstruction = `You are Zinnia Numerical Solver, a world-class mathematical and scientific computing AI specialized in solving numerical-type questions with exact calculations, dimensional consistency, and high precision.

NUMERICAL SOLVER DIRECTIVES:
1. Identify Given Parameters: Extract every given numerical value, parameter, constant, and unit from the problem.
2. Formulate Governing Equations: State the exact mathematical, physical, or engineering equation in standard LaTeX ($$...$$ for block, $...$ for inline).
3. Step-by-Step Numerical Arithmetic: Show each intermediate arithmetic step explicitly. Substitute numerical values with exact units and calculate step-by-step without skipping.
4. Unit Conversions: Ensure dimensional consistency (e.g. km/h to m/s, g to kg, degrees to radians) before substitution.
5. Highlighted Final Answer: Conclude with a clear, prominent final answer section:
### 🎯 Final Numerical Result:
**[Value] [Units]**
(Provide exact fraction or radical form along with decimal rounded to 4 significant digits when appropriate).
6. Verification: Briefly verify that the magnitude and sign of the result are physically and mathematically valid.

${combinedInstruction}`.trim();

        effectiveCandidates = ["gemini-3-flash-preview", "gemini-flash-latest"];
      } else if (isDeepMathModel) {
        specializedInstruction = `You are Zinnia Deep Math & STEM, an advanced mathematical reasoning intelligence specialized in multi-step quantitative proofs, calculus, linear algebra, differential equations, and analytical STEM derivations.

DEEP MATHEMATICAL DERIVATION DIRECTIVES:
1. Problem Formalization: State the mathematical problem, variables, domain, and boundary conditions.
2. Theoretical Framework: Explicitly identify the mathematical theorems, lemmas, identities, or principles applied.
3. Analytical Step-by-Step Derivation: Provide a rigorous mathematical progression using block LaTeX equations ($$...$$) and intermediate algebraic reductions.
4. Numerical & Symbolic Solutions: Provide closed-form symbolic solutions alongside evaluated numerical roots or values.
5. Verification & Limit Checks: Check the result via back-substitution or limiting behavior.
6. Boxed Result: Conclude with the final answer:
$$\\boxed{\\text{Answer}}$$

${combinedInstruction}`.trim();

        effectiveCandidates = ["gemini-3-flash-preview", "gemini-flash-latest"];
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Format contents for @google/genai SDK
      const sdkContents = Array.isArray(contents) ? contents.map((c: any) => ({
        role: c.role === 'model' || c.role === 'assistant' ? 'model' : 'user',
        parts: Array.isArray(c.parts) ? c.parts : [{ text: c.content || c.text || "" }]
      })) : [{ role: 'user', parts: [{ text: String(contents) }] }];

      let lastError: any = null;

      for (const candidate of effectiveCandidates) {
        try {
          const config: any = {
            systemInstruction: specializedInstruction,
          };

          // For numerical models and coding assistant, configure high thinking depth for precise reasoning
          if (isNumericalModel || isDeepMathModel || isCodingModel) {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          }

          // If pro model requested, attempt search if not rate limited
          if (candidate === 'gemini-3.1-pro-preview') {
            config.tools = [{ googleSearch: {} }];
          }

          const response = await ai.models.generateContent({
            model: candidate,
            contents: sdkContents,
            config
          });

          const replyText = response.text;
          if (replyText) {
            return res.json({
              candidates: [
                {
                  content: {
                    parts: [{ text: replyText }],
                    role: "model"
                  },
                  finishReason: "STOP",
                  index: 0
                }
              ],
              modelVersion: model || candidate
            });
          }
        } catch (err: any) {
          console.warn(`Model ${candidate} notice in chat text:`, err?.message || err);
          lastError = err;
          
          // If pro failed with search tool quota, retry immediately with flash
          if (candidate === 'gemini-3.1-pro-preview') {
            try {
              const retryRes = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: sdkContents,
                config: { systemInstruction: combinedInstruction }
              });
              if (retryRes.text) {
                return res.json({
                  candidates: [
                    {
                      content: {
                        parts: [{ text: retryRes.text }],
                        role: "model"
                      },
                      finishReason: "STOP",
                      index: 0
                    }
                  ],
                  modelVersion: "gemini-3-flash-preview"
                });
              }
            } catch (retryErr) {}
          }
        }
      }

      throw lastError || new Error("All conversational model options exhausted");
    } catch (error: any) {
      console.error("AI text endpoint error:", error?.message || error);
      res.status(500).json({ 
        error: error.message || "Failed to generate AI response. Please check your connection." 
      });
    }
  });

  // --- Secure Code Execution Sandbox Route (Python 3 & Node.js) ---
  app.post("/api/code/execute", async (req, res) => {
    try {
      const { code, language, stdin } = req.body;
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: "Code string is required for execution" });
      }
      const result = await executeCodeSafely(code, language || 'python', stdin);
      res.json(result);
    } catch (err: any) {
      console.error("Code execution endpoint error:", err);
      res.status(500).json({ error: err?.message || "Execution error in sandbox" });
    }
  });

  // Reasoning model connection status & active configuration
  app.get("/api/ai/reasoning/status", async (req, res) => {
    try {
      const status = await testReasoningServerConnection();
      const config = getReasoningConfig();
      res.json({
        ...status,
        config: {
          provider: config.provider,
          model: config.model,
          baseUrl: config.baseUrl
        }
      });
    } catch (err: any) {
      res.status(500).json({
        connected: false,
        error: err.message || "Failed to check reasoning server status"
      });
    }
  });

  // Execute advanced reasoning turn with 9-step STEM workflow and independent verification
  app.post("/api/ai/reasoning-turn", async (req, res) => {
    try {
      const { prompt, history, style, attachment, userContext, enableVerification } = req.body;
      if (!prompt && (!attachment || !attachment.data)) {
        return res.status(400).json({ error: "A question, equation, or document attachment is required." });
      }

      const result = await executeReasoningTurn({
        prompt: prompt || "Analyze and solve this problem step-by-step with full derivation and verification.",
        history,
        style,
        attachment,
        userContext,
        enableVerification: enableVerification !== false
      });

      res.json(result);
    } catch (err: any) {
      console.error("Reasoning turn endpoint error:", err);
      res.status(500).json({
        answer: `⚠️ **Mathematical Analysis Notice**: Zinnia encountered an error during reasoning: ${err?.message || "Internal server error"}`,
        provider: 'Zinnia Reasoning',
        model: 'unknown',
        style: req.body?.style || 'step-by-step',
        verifiedResults: [],
        status: 'error',
        errorMessage: err?.message
      });
    }
  });

  // Dedicated independent mathematical verification endpoint
  app.post("/api/ai/math-verify", async (req, res) => {
    try {
      const result = await verifyMath(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        verified: false,
        verificationType: 'unverified',
        details: err.message || "Mathematical verification failed",
        error: err.message
      });
    }
  });

  // --- Automated Quality & Verification Benchmark Endpoint (Section 14) ---
  app.post("/api/evaluation/run", async (req, res) => {
    const startTime = Date.now();
    const suiteResults = [];

    // Test 1: Mathematical Calculus Derivative
    const t1Start = Date.now();
    try {
      const mathResult = await verifyMath({
        operation: 'diff',
        expression: '3*x^3 - 5*x + 2',
        variable: 'x'
      });
      const passed = mathResult.success && (mathResult.symbolicResult?.includes('9') ?? false);
      suiteResults.push({
        id: 'math-calculus',
        category: 'Mathematics & Calculus',
        name: 'Symbolic Derivative (3x³ - 5x + 2)',
        expected: '9 * x ^ 2 - 5',
        actual: mathResult.symbolicResult,
        passed,
        durationMs: Date.now() - t1Start,
        details: mathResult.details
      });
    } catch (e: any) {
      suiteResults.push({
        id: 'math-calculus',
        category: 'Mathematics & Calculus',
        name: 'Symbolic Derivative (3x³ - 5x + 2)',
        passed: false,
        durationMs: Date.now() - t1Start,
        details: e.message
      });
    }

    // Test 2: Electrical Engineering (Ohm's Law Dimensional Check)
    const t2Start = Date.now();
    try {
      const dimResult = verifyDimensionalConsistency('4.5 A * 24 ohm', 'V');
      const passed = dimResult.consistent && (dimResult.computedValue?.includes('108') ?? false);
      suiteResults.push({
        id: 'eng-electrical',
        category: 'Electrical Engineering',
        name: "Ohm's Law V = I * R (4.5 A * 24 Ω)",
        expected: '108 V',
        actual: dimResult.computedValue,
        passed,
        durationMs: Date.now() - t2Start,
        details: dimResult.details
      });
    } catch (e: any) {
      suiteResults.push({
        id: 'eng-electrical',
        category: 'Electrical Engineering',
        name: "Ohm's Law V = I * R (4.5 A * 24 Ω)",
        passed: false,
        durationMs: Date.now() - t2Start,
        details: e.message
      });
    }

    // Test 3: Mechanical Engineering (Kinetic Energy & SI Units)
    const t3Start = Date.now();
    try {
      const dimResult = verifyDimensionalConsistency('0.5 * 1500 kg * (20 m/s)^2', 'kJ');
      const passed = dimResult.consistent && (dimResult.computedValue?.includes('300') ?? false);
      suiteResults.push({
        id: 'eng-mechanical',
        category: 'Mechanical Engineering',
        name: 'Kinetic Energy E = 1/2 m v² (1500 kg @ 20 m/s)',
        expected: '300 kJ',
        actual: dimResult.computedValue,
        passed,
        durationMs: Date.now() - t3Start,
        details: dimResult.details
      });
    } catch (e: any) {
      suiteResults.push({
        id: 'eng-mechanical',
        category: 'Mechanical Engineering',
        name: 'Kinetic Energy E = 1/2 m v² (1500 kg @ 20 m/s)',
        passed: false,
        durationMs: Date.now() - t3Start,
        details: e.message
      });
    }

    // Test 4: Python 3 Sandbox Execution
    const t4Start = Date.now();
    try {
      const pyCode = `
def fib(n):
    res = [0, 1]
    while len(res) < n:
        res.append(res[-1] + res[-2])
    return res
print(fib(8))
`.trim();
      const execResult = await executeCodeSafely(pyCode, 'python');
      const passed = execResult.success && execResult.output.trim() === '[0, 1, 1, 2, 3, 5, 8, 13]';
      suiteResults.push({
        id: 'code-python',
        category: 'Software Engineering',
        name: 'Python 3 Isolated Sandbox (Fibonacci)',
        expected: '[0, 1, 1, 2, 3, 5, 8, 13]',
        actual: execResult.output.trim(),
        passed,
        durationMs: execResult.durationMs,
        details: `Subprocess executed in ${execResult.durationMs}ms with sandboxed isolation.`
      });
    } catch (e: any) {
      suiteResults.push({
        id: 'code-python',
        category: 'Software Engineering',
        name: 'Python 3 Isolated Sandbox (Fibonacci)',
        passed: false,
        durationMs: Date.now() - t4Start,
        details: e.message
      });
    }

    // Test 5: JavaScript Runtime Execution & Sorting
    const t5Start = Date.now();
    try {
      const jsCode = `
const nums = [42, 17, 89, 3, 26];
const sorted = nums.slice().sort((a, b) => a - b);
console.log(JSON.stringify({ min: sorted[0], max: sorted[sorted.length - 1], sorted }));
`.trim();
      const execResult = await executeCodeSafely(jsCode, 'javascript');
      const passed = execResult.success && execResult.output.includes('"min":3') && execResult.output.includes('"max":89');
      suiteResults.push({
        id: 'code-javascript',
        category: 'Software Engineering',
        name: 'Node.js Sandbox Array Transformation',
        expected: 'min: 3, max: 89',
        actual: execResult.output.trim(),
        passed,
        durationMs: execResult.durationMs,
        details: `Node.js v22 subprocess finished in ${execResult.durationMs}ms.`
      });
    } catch (e: any) {
      suiteResults.push({
        id: 'code-javascript',
        category: 'Software Engineering',
        name: 'Node.js Sandbox Array Transformation',
        passed: false,
        durationMs: Date.now() - t5Start,
        details: e.message
      });
    }

    // Test 6: Bug Diagnosis & Edge Case Guard Clause
    const t6Start = Date.now();
    try {
      const guardCode = `
def avg(nums):
    if not nums:
        return 0.0
    return sum(nums) / len(nums)
print(avg([]), avg([10, 20, 30]))
`.trim();
      const execResult = await executeCodeSafely(guardCode, 'python');
      const passed = execResult.success && execResult.output.trim() === '0.0 20.0';
      suiteResults.push({
        id: 'code-guard-clause',
        category: 'Code Repair & Boundary Tests',
        name: 'Zero-Division Guard Clause Verification',
        expected: '0.0 20.0',
        actual: execResult.output.trim(),
        passed,
        durationMs: execResult.durationMs,
        details: 'Verified boundary case of empty list handling without ZeroDivisionError.'
      });
    } catch (e: any) {
      suiteResults.push({
        id: 'code-guard-clause',
        category: 'Code Repair & Boundary Tests',
        name: 'Zero-Division Guard Clause Verification',
        passed: false,
        durationMs: Date.now() - t6Start,
        details: e.message
      });
    }

    // Test 7: Temporal Grounding
    const t7Start = Date.now();
    const currentYear = new Date().getFullYear();
    const isYearSynchronized = currentYear === 2026;
    suiteResults.push({
      id: 'temporal-grounding',
      category: 'Temporal Accuracy',
      name: 'Real-Time Clock & Year Synchronization',
      expected: '2026',
      actual: String(currentYear),
      passed: isYearSynchronized,
      durationMs: Date.now() - t7Start,
      details: `Authoritative clock checked. Current year = ${currentYear}`
    });

    const passedCount = suiteResults.filter(r => r.passed).length;
    const totalCount = suiteResults.length;
    const passRate = Math.round((passedCount / totalCount) * 100);
    const totalDurationMs = Date.now() - startTime;

    res.json({
      timestamp: Date.now(),
      totalTests: totalCount,
      passedTests: passedCount,
      failedTests: totalCount - passedCount,
      passRatePercent: passRate,
      totalDurationMs,
      results: suiteResults
    });
  });

  // Real-time meteorological weather API endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      const q = req.query.q as string | undefined;
      const lat = req.query.lat as string | undefined;
      const lon = req.query.lon as string | undefined;

      let latitude = lat ? parseFloat(lat) : undefined;
      let longitude = lon ? parseFloat(lon) : undefined;
      let cityName = q || "Current Location";
      let countryName = "";

      if (q && (!latitude || !longitude)) {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=1&language=en&format=json`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            const top = geoData.results[0];
            latitude = top.latitude;
            longitude = top.longitude;
            cityName = top.name;
            countryName = top.country || "";
          }
        }
      } else if (!q && latitude !== undefined && longitude !== undefined) {
        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
            {
              headers: {
                "User-Agent": "ZinniaWeatherApp/1.0 (contact@zinnia.app)",
                "Accept-Language": "en"
              }
            }
          );
          if (revRes.ok) {
            const revData = await revRes.json();
            const addr = revData.address || {};
            const foundCity = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || addr.state_district || revData.name;
            if (foundCity) {
              cityName = foundCity;
            }
            if (addr.country) {
              countryName = addr.country;
            }
          }
        } catch (e) {
          console.warn("Reverse geocode in /api/weather warning:", e);
        }
      }

      if (latitude === undefined || longitude === undefined) {
        return res.status(404).json({ error: "Location coordinates or city name could not be resolved." });
      }

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        return res.status(weatherRes.status).json({ error: "Failed to fetch forecast from meteorological service." });
      }

      const raw = await weatherRes.json();
      res.json({
        city: cityName,
        country: countryName,
        latitude,
        longitude,
        timezone: raw.timezone,
        raw
      });
    } catch (err: any) {
      console.warn("Weather endpoint error:", err);
      res.status(500).json({ error: err.message || "Failed to process weather request" });
    }
  });

  // Dedicated reverse geocoding API endpoint
  app.get("/api/reverse-geocode", async (req, res) => {
    try {
      const lat = req.query.lat as string | undefined;
      const lon = req.query.lon as string | undefined;

      if (!lat || !lon) {
        return res.status(400).json({ error: "Missing lat/lon parameters" });
      }

      const revRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        {
          headers: {
            "User-Agent": "ZinniaWeatherApp/1.0 (contact@zinnia.app)",
            "Accept-Language": "en"
          }
        }
      );

      if (revRes.ok) {
        const revData = await revRes.json();
        const addr = revData.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || addr.state_district || revData.name || "Local Area";
        const state = addr.state || addr.state_district || "";
        const country = addr.country || "";
        return res.json({
          city,
          state,
          country,
          displayName: revData.display_name || city
        });
      }

      res.status(502).json({ error: "Reverse geocode provider unavailable" });
    } catch (err: any) {
      console.warn("Reverse geocode endpoint error:", err);
      res.status(500).json({ error: err.message || "Failed to reverse geocode" });
    }
  });

  // Turn endpoint for conversational Live Voice Mode
  app.post("/api/ai/live-turn", async (req, res) => {
    const { message, voice = "Zephyr", history = [], userContext } = req.body;
    const apiKey = getCleanApiKey();

    if (!apiKey || apiKey === "undefined") {
      return res.status(500).json({ error: "Zinnia API Key is missing. Please add GOOGLE_API_KEY or GEMINI_API_KEY in the Settings menu." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare conversation history
      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const temporalAnchor = buildTemporalInstruction(userContext);

      // Multi-model fallback with fast model priority for ultra-low latency voice responses
      const candidateModels = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-flash-latest"];
      let replyText = "";

      for (const m of candidateModels) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout on model ${m}`)), 4000)
          );

          const generatePromise = ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction: `You are Zinnia, an AI companion in an active, real-time Live Voice Call with the user.
${temporalAnchor}
Rules for Live Voice:
1. Speak directly to the user in a natural, warm, friendly tone.
2. Keep your answers brief (1 to 2 sentences maximum) so the voice conversation feels snappy, natural, and engaging like a real phone call.
3. NEVER use asterisks, markdown, emojis, numbered lists, bullet points, or code formatting. Everything you say will be spoken out loud.
4. Never mention Google, OpenAI, ChatGPT, or Gemini. You are Zinnia.
5. Answer questions directly and ask a brief natural follow-up when relevant.
6. When asked about current date, day, month, year, or time, answer accurately according to the temporal anchor above.`,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MINIMAL
              },
              maxOutputTokens: 180,
              temperature: 0.6,
            }
          });

          const response = await Promise.race([generatePromise, timeoutPromise]);
          const txt = response.text?.trim();
          if (txt) {
            replyText = txt;
            break;
          }
        } catch (modelErr: any) {
          console.warn(`Live turn model ${m} notice:`, modelErr?.message || modelErr);
        }
      }

      if (!replyText) {
        replyText = "I'm right here with you! What's on your mind?";
      }

      // Synthesize audio with Gemini TTS with 3.0s cap; if delayed, client speaks instantly via browser TTS
      const base64Audio = await synthesizeSpeech(ai, replyText, voice);

      return res.json({
        text: replyText,
        audio: base64Audio
      });
    } catch (error: any) {
      console.error("Live turn error:", error?.message || "Internal error");
      // Provide graceful fallback reply instead of 500 so call does not break
      const fallbackText = "I'm right here with you! Could you say that once more?";
      return res.json({
        text: fallbackText,
        audio: null
      });
    }
  });

  // Helper for resilient Gemini speech synthesis with strict timeout and fallback
  async function synthesizeSpeech(ai: GoogleGenAI, text: string, voice?: string): Promise<string | null> {
    const validVoices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];
    const chosenVoice = voice && validVoices.includes(voice) ? voice : 'Zephyr';
    const ttsModels = ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"];

    for (const model of ttsModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`TTS timeout for ${model}`)), 3000)
        );

        const ttsPromise = ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text }]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice }
              }
            }
          }
        });

        const ttsResponse = await Promise.race([ttsPromise, timeoutPromise]);
        const audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) return audioData;
      } catch (err: any) {
        // Continue to next TTS model if available or return null for instant client fallback
      }
    }
    return null;
  }

  // Dedicated TTS Endpoint
  app.post("/api/ai/tts", async (req, res) => {
    const { text, voice = "Zephyr" } = req.body;
    const apiKey = getCleanApiKey();

    if (!apiKey || apiKey === "undefined") {
      return res.status(500).json({ error: "Zinnia API Key is missing." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const base64Audio = await synthesizeSpeech(ai, text, voice);
      res.json({ audio: base64Audio, fallback: !base64Audio });
    } catch (error: any) {
      // Gracefully return fallback indication rather than failing 500
      res.json({ audio: null, fallback: true });
    }
  });

  // --- Vite / Frontend Setup ---
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("<!doctype html><html><body><div id='root'></div><script>setTimeout(()=>location.reload(), 1500);</script></body></html>");
      }
    });
  }

  const server = http.createServer(app);

  // WebSocket Server for Live Real-time Streaming
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    try {
      const { pathname } = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      if (pathname === "/api/live-ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (err) {
      console.error("WS upgrade error:", err);
    }
  });

  wss.on("connection", async (clientWs, req) => {
    const apiKey = getCleanApiKey();
    if (!apiKey) {
      clientWs.send(JSON.stringify({ error: "API Key missing" }));
      clientWs.close();
      return;
    }

    let session: any = null;
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const voice = url.searchParams.get("voice") || "Zephyr";

      session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
          systemInstruction: `You are Zinnia in a live voice phone call. Be very concise, friendly, and warm. Answer in 1 or 2 spoken sentences without formatting. ${buildTemporalInstruction()}`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
            const userText = (message.serverContent as any)?.userContent?.parts?.find((p: any) => p.text)?.text;
            const interrupted = !!message.serverContent?.interrupted;

            if (audio || text || userText || interrupted) {
              if (clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify({
                  audio,
                  text,
                  userText,
                  interrupted
                }));
              }
            }
          },
          onerror: (err: any) => {
            console.error("Live session server error:", err);
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ error: err.message || "Live error" }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ closed: true }));
            }
          }
        }
      });

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            session?.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
            });
          } else if (msg.text) {
            session?.sendRealtimeInput({
              text: msg.text
            });
          }
        } catch (err) {
          console.error("Error processing client WS message:", err);
        }
      });

      clientWs.on("close", () => {
        if (session) {
          try { session.close(); } catch(e) {}
          session = null;
        }
      });
    } catch (err: any) {
      console.error("Failed to start Live session on server:", err);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ error: err.message || "Failed to initialize Live session" }));
        clientWs.close();
      }
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
