import { AIModel } from "../types";

export async function chatWithGemini(
  prompt: string, 
  history: any[] = [], 
  modelId: string = "gemini-3-flash-preview",
  systemInstruction?: string,
  userContext?: any,
  coding?: any
) {
  const contents = [...history, { role: "user", parts: [{ text: prompt }] }];
  
  const response = await fetch("/api/ai/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: modelId, 
      contents,
      systemInstruction,
      userContext,
      coding
    }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const rawMsg = errorData.error?.message || errorData.error || "";
      if (response.status === 429 || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('limit')) {
        throw new Error("QUOTA_EXHAUSTED");
      }
      if (rawMsg.toLowerCase().includes('safety')) {
        throw new Error("SAFETY_FILTER");
      }
      if (rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('not found') || response.status === 401 || response.status === 403 || response.status === 404) {
        throw new Error("CONFIGURATION_ISSUE: " + rawMsg);
      }
    } catch (e: any) {
      if (["QUOTA_EXHAUSTED", "SAFETY_FILTER"].includes(e.message) || e.message.startsWith("CONFIGURATION_ISSUE")) throw e;
    }
    throw new Error("ZINNIA_ERROR");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error("⚠️ Zinnia is taking a moment. Please try again.");
  return text;
}

export async function analyzeImage(
  prompt: string, 
  base64Image: string, 
  mimeType: string, 
  modelId: string = "gemini-3-flash-preview",
  systemInstruction?: string,
  userContext?: any
) {
  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Image.split(',')[1] || base64Image,
    },
  };
  const textPart = { text: prompt };
  const contents = [{ role: "user", parts: [imagePart, textPart] }];

  const response = await fetch("/api/ai/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model: modelId, 
      contents,
      systemInstruction,
      userContext
    }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const rawMsg = errorData.error?.message || errorData.error || "";
      if (response.status === 429 || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('limit')) {
        throw new Error("QUOTA_EXHAUSTED");
      }
      if (rawMsg.toLowerCase().includes('safety')) {
        throw new Error("SAFETY_FILTER");
      }
      if (rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('not found') || response.status === 401 || response.status === 403 || response.status === 404) {
        throw new Error("CONFIGURATION_ISSUE: " + rawMsg);
      }
    } catch (e: any) {
      if (["QUOTA_EXHAUSTED", "SAFETY_FILTER"].includes(e.message) || e.message.startsWith("CONFIGURATION_ISSUE")) throw e;
    }
    throw new Error("ZINNIA_ERROR");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis available";
}
