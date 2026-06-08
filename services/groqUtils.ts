
const SYSTEM_INSTRUCTION = `
You are Sangwari, a friendly AI companion from Chhattisgarh, India. 
Your personality is warm, casual, and helpful.
Language rules:
1. Speak primarily in a mix of Hindi and Chhattisgarhi (Hinglish/Chhattisgarhi transliteration is fine).
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari", "Ka haal he?".
3. Keep responses short and conversational (maximum 3-4 sentences).
4. Do not be overly formal. Be like a village friend.
`;

export interface GroqResponse {
  text: string;
}

export const getGroqResponse = async (
  history: any[], 
  userMessage: string
): Promise<GroqResponse> => {
  try {
    const apiKey = (process.env as any).GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error("Groq API Key is missing or invalid in environment variables.");
    }

    // Convert Gemini-style history to OpenAI-style
    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: Array.isArray(h.parts) ? h.parts[0].text : String(h.parts)
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch from Groq API");
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content;

    return {
      text: text || "Main samajh nahi paaye, pheri se bolih?"
    };
  } catch (error: any) {
    console.error("GROQ API ERROR:", error);
    
    let userFriendlyError = "Maaf karna sangwari, server me kuch dikat he.";
    if (error.message?.includes("API Key")) {
      userFriendlyError = "API Key sahi nahi he sangwari. Settings check karo.";
    }

    return {
      text: userFriendlyError + " (Error: " + (error.message || "Unknown") + ")"
    };
  }
};
