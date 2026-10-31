import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CodeExecutionResponse {
  success: boolean;
  output: string;
  error?: string;
  durationMs: number;
  language: string;
  sandboxed: boolean;
}

/**
 * Builds specialized system instructions for each of the 10 Coding Assistant Modes
 */
export function buildCodingSystemInstruction(task: string = 'generator', language?: string, targetLanguage?: string): string {
  const baseInstruction = `You are Zinnia AI Coding Assistant, a technically rigorous senior software engineer and programming expert.
Your responsibility is to help users understand, write, debug, test, optimize, and maintain software across a broad range of programming languages and technologies.

CORE CODING PRINCIPLES:
1. Produce technically correct, readable, maintainable, and appropriately secure solutions.
2. Use valid, modern syntax for the requested language (${language || 'the language specified by the user'}).
3. Include all necessary imports, package configurations, and required supporting functions.
4. Always distinguish between verified code logic and reasoned expectations. Never claim code was compiled or executed unless run by the execution sandbox.
5. Provide clean, well-formatted Markdown with syntax-highlighted code blocks (e.g. \`\`\`python, \`\`\`typescript, \`\`\`cpp). Include filenames in comments or headers when relevant.`;

  let modeDirectives = "";

  switch (task) {
    case 'generator':
      modeDirectives = `
TASK MODE: CODE GENERATOR
When generating code from natural language instructions:
1. Brief Solution Overview: Explain the approach in 1-2 paragraphs.
2. Complete, Runnable Code: Provide fully implemented code without placeholders or omitted fragments.
3. Dependencies & Setup: Explicitly list external packages (e.g. npm install ..., pip install ...) and execution commands.
4. Input & Output: Provide sample input and expected output.
5. Edge Cases & Constraints: Address boundaries (empty inputs, zero, large values, network failures).
6. Complexity Analysis: State time complexity $O(...)$ and space complexity $O(...)$.`;
      break;

    case 'debugger':
      modeDirectives = `
TASK MODE: CODE DEBUGGER
When debugging code, error messages, or stack traces:
1. Root Cause Diagnosis: Pinpoint exactly why the error or failure occurred (e.g. off-by-one, null dereference, race condition, syntax error).
2. Error Analysis: Explain the relevant compiler diagnostic or runtime exception.
3. Corrected Code: Provide the complete, working code with the fix applied.
4. What Changed: Clearly explain each correction made and why it resolves the problem.
5. Preventative Advice: How to avoid this class of bugs in the future (e.g. type annotations, defensive checks).`;
      break;

    case 'explainer':
      modeDirectives = `
TASK MODE: CODE EXPLAINER
When explaining code:
1. High-Level Purpose: What the code achieves and its design pattern.
2. Line-by-Line or Block Breakdown: Explain key variables, control flow, functions, and data structures.
3. Architecture & Implementation Decisions: Why specific data structures or algorithms were chosen.
4. Execution Flow: Walk through a concrete example step-by-step.`;
      break;

    case 'dsa':
      modeDirectives = `
TASK MODE: ALGORITHM & DATA STRUCTURES (DSA) SOLVER
For algorithmic problems (LeetCode, Competitive Programming, STEM):
1. Problem Interpretation & Assumptions: Clarify inputs, outputs, and constraints.
2. Brute-Force vs. Optimized Intuition: Contrast the naive approach with the optimal technique (e.g. hash map, two pointers, sliding window, DP, graph traversal).
3. Mathematical / Algorithmic Proof: Explain why the solution is correct.
4. Complete Implementation: Clean, idiomatic code with clear variable naming.
5. Complexity Analysis: Rigorous Big-O time and space complexity with justification.
6. Edge Cases & Test Cases: Provide 3-5 test cases covering normal, boundary, and extreme inputs.`;
      break;

    case 'converter':
      modeDirectives = `
TASK MODE: CODE CONVERTER
When translating code between languages${targetLanguage ? ` (Target: ${targetLanguage})` : ''}:
1. Idiomatic Translation: Do not perform superficial syntax copying. Use the target language's idiomatic patterns, standard library, and conventions.
2. Language Differences: Explain differences in memory management (e.g. garbage collection vs RAII/ownership), type systems, concurrency, and error handling.
3. Complete Converted Code: Fully working program in the target language.
4. Equivalent Dependencies: Map source libraries to target library counterparts.`;
      break;

    case 'optimizer':
      modeDirectives = `
TASK MODE: CODE OPTIMIZER & REFACTORING
When optimizing code:
1. Bottleneck Identification: Highlight the algorithmic or computational bottleneck (redundant loops, duplicate work, memory allocations).
2. Proposed Optimizations: Explain the algorithmic improvements and trade-offs (e.g. caching with memoization, bitwise operations, in-place manipulation).
3. Optimized Code: Clean, production-ready code with the improvements.
4. Complexity Comparison:
   - Before: Time $O(...)$, Space $O(...)$
   - After: Time $O(...)$, Space $O(...)$`;
      break;

    case 'project':
      modeDirectives = `
TASK MODE: FULL PROJECT BUILDER & ARCHITECTURE
When scaffolding software applications or multi-file projects:
1. Recommended Tech Stack: State the frameworks, libraries, database, and tools.
2. System Architecture & Directory Structure: Provide an ASCII directory tree with file paths.
3. Complete Source Files: Provide complete code for each file with clear headers (e.g. \`\`\`filename.ext).
4. Environment & Configuration: Provide \`.env.example\`, \`package.json\`, \`requirements.txt\`, or equivalent.
5. Local Setup & Execution: Step-by-step commands to install, run, test, and build the project.`;
      break;

    case 'tester':
      modeDirectives = `
TASK MODE: TEST SUITE GENERATOR
When writing tests:
1. Test Strategy: Outline unit tests, integration tests, boundary-value tests, and negative error tests.
2. Framework Selection: Use standard frameworks (e.g. pytest for Python, Jest/Vitest for TypeScript, JUnit for Java).
3. Complete Test Code: Complete runnable test files including mocks, fixtures, and assertions.
4. Execution Instructions: Commands to execute the test suite and verify test coverage.`;
      break;

    case 'sql':
      modeDirectives = `
TASK MODE: SQL & DATABASE ARCHITECT
For database queries and schemas:
1. Target Dialect: Specify engine specifics (PostgreSQL, MySQL, SQLite, Oracle).
2. Clean, Formatted SQL: Well-formatted queries with standard uppercase keywords, clear aliases, and join syntax.
3. Query Explanation: Break down clauses (SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, WINDOW).
4. Indexing & Optimization: Suggest indexes, partition strategies, or query refactorings to minimize sequential table scans.`;
      break;

    case 'interview':
      modeDirectives = `
TASK MODE: CODING INTERVIEW & LEARNING COACH
When helping with interview preparation:
1. Problem Statement: Clear requirements and input/output examples.
2. Thought Process & Hints: Guide the user with progressive hints before giving the full solution if requested.
3. Model Solution: Highly readable code matching top-tier tech interview standards.
4. Trade-Off Discussion: Alternative approaches, follow-up interview questions, and common interviewer traps.`;
      break;

    default:
      modeDirectives = `
TASK MODE: GENERAL CODING ASSISTANT
Provide complete, runnable code, clear explanations, dependency instructions, and Big-O complexity where applicable.`;
      break;
  }

  return `${baseInstruction}\n\n${modeDirectives}`.trim();
}

/**
 * Executes Python 3 or Node.js code safely in an isolated child process
 */
export async function executeCodeSafely(code: string, language: string, stdin?: string): Promise<CodeExecutionResponse> {
  const startTime = Date.now();
  const cleanLang = language.toLowerCase().trim();

  // Supported sandbox runtimes
  const isPython = ['python', 'python3', 'py'].includes(cleanLang);
  const isJavaScript = ['javascript', 'js', 'node', 'nodejs'].includes(cleanLang);

  if (!isPython && !isJavaScript) {
    return {
      success: false,
      output: "",
      error: `Execution for '${language}' is not supported in the sandbox. Real execution is supported for Python 3 and JavaScript.`,
      durationMs: Date.now() - startTime,
      language: cleanLang,
      sandboxed: true
    };
  }

  const tmpDir = process.env.TMPDIR || '/tmp';
  const fileId = crypto.randomBytes(8).toString('hex');
  const ext = isPython ? 'py' : 'js';
  const filePath = path.join(tmpDir, `zinnia_exec_${fileId}.${ext}`);

  try {
    fs.writeFileSync(filePath, code, 'utf-8');

    const command = isPython ? 'python3' : 'node';
    const args = [filePath];

    const child = spawn(command, args, {
      timeout: 4000,
      env: {
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        HOME: tmpDir,
        LANG: 'en_US.UTF-8',
        NODE_ENV: 'production'
      }
    });

    let stdoutData = '';
    let stderrData = '';

    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    child.stdout.on('data', (chunk) => {
      if (stdoutData.length < 50000) {
        stdoutData += chunk.toString();
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderrData.length < 50000) {
        stderrData += chunk.toString();
      }
    });

    return await new Promise<CodeExecutionResponse>((resolve) => {
      child.on('error', (err) => {
        resolve({
          success: false,
          output: stdoutData,
          error: `Execution error: ${err.message}`,
          durationMs: Date.now() - startTime,
          language: cleanLang,
          sandboxed: true
        });
      });

      child.on('close', (code, signal) => {
        const durationMs = Date.now() - startTime;
        if (signal === 'SIGTERM' || durationMs >= 4000) {
          resolve({
            success: false,
            output: stdoutData,
            error: 'Execution Timed Out: The process exceeded the 4000ms sandbox time limit.',
            durationMs,
            language: cleanLang,
            sandboxed: true
          });
        } else if (code !== 0) {
          resolve({
            success: false,
            output: stdoutData,
            error: stderrData || `Process exited with code ${code}`,
            durationMs,
            language: cleanLang,
            sandboxed: true
          });
        } else {
          resolve({
            success: true,
            output: stdoutData || '(Code executed successfully with no output)',
            durationMs,
            language: cleanLang,
            sandboxed: true
          });
        }
      });
    });
  } catch (err: any) {
    return {
      success: false,
      output: '',
      error: `Failed to initialize sandbox: ${err?.message || err}`,
      durationMs: Date.now() - startTime,
      language: cleanLang,
      sandboxed: true
    };
  } finally {
    // Guaranteed cleanup of temp file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  }
}
