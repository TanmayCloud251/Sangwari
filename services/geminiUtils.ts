
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [{ text: userMessage }];
    if (attachment) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const groundingUrls = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })).filter((item: any) => item.uri !== '') || [];

    return {
      text: response.text || "Kuch gadbad ho gaya sangwari.",
      groundingUrls
    };
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return {
      text: "Maaf karna sangwari, server me kuch dikat he. Thoda deri baad koshish karo.",
      groundingUrls: []
    };
  }
};
