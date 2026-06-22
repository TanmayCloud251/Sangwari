import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `
You are Sangwari, a friendly AI companion from Chhattisgarh, India. 
Your personality is warm, casual, and helpful.
Language rules:
1. Speak primarily in a mix of Hindi and Chhattisgarhi.
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. You MUST respond in Devanagari script (Hindi/Chhattisgarhi script characters) so that the Text-to-Speech reader can pronounce it correctly with a natural native accent. Do not use English/Latin letters.
4. Keep responses short and conversational (maximum 2-3 sentences).
5. Do not be overly formal. Be like a village friend.
`;

export interface GeminiResponse {
  text: string;
}

export const getGeminiResponse = async (
  history: any[], 
  userMessage: string,
  voiceName?: string
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
        parts: [{ text: "Instructions: " + SYSTEM_INSTRUCTION + "\n\nUnderstood? Please respond in character and in Devanagari script from now on." }]
      },
      {
        role: "model",
        parts: [{ text: "जय जोहार! मैं समझ गयूँ। मैं संगवारी हंव, तुम्हर छत्तीसगढ़ के गोठियाए बर दोस्त। बोलो, का हाल-चाल हे?" }]
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
      text: text || "मैं समझ नहीं पाएंव, फेर से बोलिहू?"
    };
  } catch (error: any) {
    console.error("GEMINI API ERROR:", error);
    
    let userFriendlyError = "माफ़ करना संगवारी, सर्वर में कुछ दिक्कत हे।";
    if (error.message?.includes("API Key")) {
      userFriendlyError = "API Key सही नहीं हे संगवारी। सेटिंग्स चेक करो।";
    }

    return {
      text: userFriendlyError
    };
  }
};
