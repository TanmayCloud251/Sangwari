import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION_AUDIO = `
You are Sangwari, a warm and friendly AI companion from Chhattisgarh, India.
Your personality is casual, helpful, and like a village friend.
Language rules:
1. You MUST speak in correct, natural Chhattisgarhi language.
2. Use warm Chhattisgarhi greetings like "Jai Johar", "Sangwari".
3. You MUST respond in Devanagari script (Hindi/Chhattisgarhi script characters) so that the Text-to-Speech reader can pronounce it correctly with a natural native accent. Do not use English/Latin letters.
4. Keep responses extremely short and conversational (maximum 1 to 2 short sentences, under 15 words). This is for a live voice call, so be brief and natural.
5. Do not be overly formal.
`;

const SYSTEM_INSTRUCTION_TEXT = `
You are Sangwari, a friendly AI companion from Chhattisgarh, India. 
Your personality is warm, casual, and helpful.
Language rules:
1. Speak in a mix of Hindi and Chhattisgarhi.
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. You MUST respond in Hinglish (Hindi/Chhattisgarhi written in Roman/Latin script, e.g., "Jai Johar Sangwari! Main badhiya hoan. Aap man kaisa ho?"). Do not write in Devanagari script.
4. Keep responses short and conversational.
5. Do not be overly formal. Be like a village friend.
`;

export interface GeminiResponse {
  text: string;
}

export const getGeminiResponse = async (
  history: any[], 
  userMessage: string,
  voiceName?: string,
  isAudio = false
): Promise<GeminiResponse> => {
  try {
    const apiKey = (process.env as any).GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error("Gemini API Key is missing or invalid in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const instruction = isAudio ? SYSTEM_INSTRUCTION_AUDIO : SYSTEM_INSTRUCTION_TEXT;

    let chatHistory = [
      {
        role: "user",
        parts: [{ text: "Instructions: " + instruction + "\n\nUnderstood? Please respond in character and in the correct script from now on." }]
      },
      {
        role: "model",
        parts: [{ 
          text: isAudio 
            ? "जय जोहार! मैं समझ गयूँ। मैं संगवारी हंव, तुम्हर छत्तीसगढ़ के गोठियाए बर दोस्त। बोलो, का हाल-चाल हे?" 
            : "Jai Johar! Main samajh gayahun. Main Sangwari hoan, tumhar Chhattisgarh ke dost. Bolo, ka haal-chaal he?"
        }]
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
      text: text || (isAudio ? "मैं समझ नहीं पाएंव, फेर से बोलिहू?" : "Main samajh nahi payan, phir se bolihu?")
    };
  } catch (error: any) {
    console.error("GEMINI API ERROR:", error);
    
    let userFriendlyError = isAudio ? "माफ़ करना संगवारी, सर्वर में कुछ दिक्कत हे।" : "Maaf karna sangwari, server me kuch dikkat he.";
    if (error.message?.includes("API Key")) {
      userFriendlyError = isAudio ? "API Key सही नहीं हे संगवारी। सेटिंग्स चेक करो।" : "API Key sahi nahi he sangwari. Settings check karo.";
    }

    return {
      text: userFriendlyError
    };
  }
};

export const getGeminiTTS = async (
  text: string,
  voiceName = "Aoede"
): Promise<string> => {
  try {
    const apiKey = (process.env as any).GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error("Gemini API Key is missing or invalid.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `कृप्या इसे पढ़ें: ${text}` }] }],
      generationConfig: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName,
            }
          }
        }
      }
    });

    const response = await result.response;
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data; // returns base64 PCM string
        }
      }
    }
    
    throw new Error("No audio data returned from Gemini TTS.");
  } catch (error) {
    console.error("GEMINI TTS ERROR:", error);
    throw error;
  }
};

