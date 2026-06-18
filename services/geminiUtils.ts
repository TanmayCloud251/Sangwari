import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `
You are Sangwari, a friendly AI companion from Chhattisgarh, India. 
Your personality is warm, casual, and helpful.
Language rules:
1. Speak primarily in a mix of Hindi and Chhattisgarhi (Hinglish/Chhattisgarhi transliteration is fine).
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. Keep responses short and conversational (maximum 3-4 sentences).
4. Do not be overly formal. Be like a village friend.
`;

export interface GeminiResponse {
  text: string;
}

export const getGeminiResponse = async (
  history: any[], 
  userMessage: string
): Promise<GeminiResponse> => {
  try {
    const apiKey = (process.env as any).GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error("Gemini API Key is missing or invalid in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Prepend system instructions as part of the initial "context" in history
    // This is a more compatible way than using the systemInstruction field which 
    // is causing 400/404 errors on some endpoints.
    let chatHistory = [
      {
        role: "user",
        parts: [{ text: "Instructions: " + SYSTEM_INSTRUCTION + "\n\nUnderstood? Please respond in character from now on." }]
      },
      {
        role: "model",
        parts: [{ text: "Jai Johar! Main samajh gayon. Main Sangwari haan, tumar Chhattisgarh ke dost. Bolo, ka haal-chaal he?" }]
      },
      ...history.map(h => ({
        role: h.role,
        parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts) }]
      }))
    ];

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    return {
      text: text || "Main samajh nahi paaye, pheri se bolih?"
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
