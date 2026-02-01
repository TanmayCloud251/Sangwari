
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are Sangwari, a friendly AI companion from Chhattisgarh, India. 
Your personality is warm, casual, and helpful.
Language rules:
1. Speak primarily in a mix of Hindi and Chhattisgarhi (Hinglish/Chhattisgarhi transliteration is fine).
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. Keep responses short and conversational (maximum 3-4 sentences).
4. Do not be overly formal. Be like a village friend.

Multimodal Capabilities:
1. If the user provides an image or PDF, describe it or answer questions about it in Chhattisgarhi.
2. If the user provides a video link (YouTube, Dailymotion, etc.), use your Google Search tool to find information about the video and summarize its content clearly.
`;

export interface GeminiResponse {
  text: string;
  groundingUrls?: { title: string; uri: string }[];
}

export const getGeminiResponse = async (
  history: any[], 
  userMessage: string, 
  attachment?: { mimeType: string, data: string }
): Promise<GeminiResponse> => {
  try {
    // 1. Initialize API
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing in environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 2. Prepare User Parts
    const userParts: any[] = [];
    if (userMessage.trim()) {
      userParts.push({ text: userMessage });
    }
    
    if (attachment) {
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }

    // Ensure we have at least something to send
    if (userParts.length === 0) {
      userParts.push({ text: "Describe this file" });
    }

    // 3. Clean and Validate History
    // Gemini expects 'user' and 'model' roles. 
    const cleanedHistory = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts) }]
    })).filter(h => h.parts && h.parts.length > 0);

    console.log("DEBUG: Sending request to Gemini...", {
      historyLength: cleanedHistory.length,
      currentParts: userParts
    });

    // 4. Call Generate Content
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...cleanedHistory,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // If chat fails, try commenting out the tools line below to check if Search is the issue
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    // 5. Process Output
    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingUrls = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })).filter((item: any) => item.uri !== '') || [];

    return {
      text: text || "Main samajh nahi paaye, pheri se bolih?",
      groundingUrls
    };
  } catch (error: any) {
    // Log the full error to the browser console for user diagnostics
    console.error("GEMINI API ERROR:", error);
    
    let userFriendlyError = "Maaf karna sangwari, server me kuch dikat he.";
    
    if (error.message?.includes("API_KEY_INVALID")) {
      userFriendlyError = "API Key sahi nahi he sangwari. Settings check karo.";
    } else if (error.message?.includes("model not found")) {
      userFriendlyError = "Model nahi milat he. Dusra model koshish kar saktho.";
    }

    return {
      text: userFriendlyError + " (Error: " + (error.message || "Unknown") + ")",
      groundingUrls: []
    };
  }
};
