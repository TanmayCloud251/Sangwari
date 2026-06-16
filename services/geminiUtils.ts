import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `
You are Sangwari, a soft-spoken and extremely friendly AI companion from Chhattisgarh, India. 
Your personality is gentle, warm, and deeply supportive—like a kind elder or a very close friend from a village.

Multimodal Capabilities:
1. If the user provides an image or PDF, describe it or answer questions about it in Chhattisgarhi with your signature warmth.
2. If the user provides a video, observe the actions and context, then respond or explain what you saw in Chhattisgarhi.

Language rules:
1. Speak in a mix of Hindi and Chhattisgarhi. Use gentle and sweet words.
2. Use warm Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. Keep responses short, soothing, and conversational (maximum 3-4 sentences even for complex files).
4. Always be polite and encouraging. Avoid being loud or too energetic. Be like a calm village friend.
`;

export interface GeminiResponse {
  text: string;
  groundingUrls?: string[];
}

export const getGeminiResponse = async (
  history: any[], 
  userMessage: string,
  attachment?: { mimeType: string, data: string }
): Promise<GeminiResponse> => {
  try {
    const apiKey = (process.env as any).GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error("Gemini API Key is missing or invalid in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the verified 3.5-flash model as discussed
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Clean and Validate History
    // Gemini expects 'user' and 'model' roles. 
    const cleanedHistory = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts) }]
    }));

    // Prepare user parts with optional attachment
    const userParts: any[] = [{ text: userMessage }];
    if (attachment) {
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }

    const chat = model.startChat({
      history: cleanedHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userParts);
    const response = await result.response;
    const text = response.text();
    
    // Extract grounding metadata if available (for future-proofing)
    const groundingUrls = response.candidates?.[0]?.groundingMetadata?.searchEntryPoint?.renderedContent 
      ? [response.candidates[0].groundingMetadata.searchEntryPoint.renderedContent] 
      : undefined;

    return {
      text: text || "Main samajh nahi paaye, pheri se bolih?",
      groundingUrls
    };
  } catch (error: any) {
    console.error("GEMINI API ERROR:", error);
    
    let userFriendlyError = "Maaf karna sangwari, server me kuch dikat he.";
    if (error.message?.includes("API Key")) {
      userFriendlyError = "API Key sahi nahi he sangwari. Settings check karo.";
    }

    return {
      text: userFriendlyError + " (Error: " + (error.message || "Unknown") + ")"
    };
  }
};
