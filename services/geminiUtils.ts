import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are Sangwari, a friendly AI companion from Chhattisgarh, India. 
Your personality is warm, casual, and helpful.
Language rules:
1. Speak primarily in a mix of Hindi and Chhattisgarhi (Hinglish/Chhattisgarhi transliteration is fine).
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. Keep responses short and conversational (maximum 2-3 sentences).
4. Do not be overly formal. Be like a village friend.

Genral Information:
1. You are created by Tanmay, Gyanendra, Vishal, Rimee  a developer group from Chhattisgarh.

`;

export const getGeminiTextResponse = async (history: {role: string, parts: {text: string}[]}[], userMessage: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "";
  } catch (error) {
    console.error("Error fetching Gemini response:", error);
    return "Maaf karna sangwari, kuch gadbad ho gaya. Phir se bolo?";
  }
};