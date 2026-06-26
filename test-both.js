import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-tts-preview" });

async function run() {
  try {
    console.log("Trying gemini-3.1-flash-tts-preview with ['text', 'audio']...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "जय जोहार संगवारी! आप कैसे हो? छत्तीसगढ़ी में बताओ।" }] }],
      generationConfig: {
        responseModalities: ["text", "audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede",
            }
          }
        }
      }
    });

    const response = await result.response;
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;
    
    console.log("Parts returned count:", parts?.length);
    if (parts) {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`Part ${i}:`);
        if (part.text) {
          console.log(`  text: "${part.text}"`);
        }
        if (part.inlineData) {
          console.log(`  inlineData mimeType: "${part.inlineData.mimeType}", data length: ${part.inlineData.data.length}`);
        }
      }
    }
  } catch (err) {
    console.error("Failed with ['text', 'audio']:", err.message);
    try {
      console.log("\nTrying gemini-3.1-flash-tts-preview with ['audio'] only...");
      const result2 = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "जय जोहार संगवारी! आप कैसे हो? छत्तीसगढ़ी में बताओ।" }] }],
        generationConfig: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              }
            }
          }
        }
      });
      const response2 = await result2.response;
      const parts2 = response2.candidates?.[0]?.content?.parts;
      console.log("Parts returned for ['audio'] count:", parts2?.length);
      if (parts2) {
        for (let i = 0; i < parts2.length; i++) {
          const part = parts2[i];
          if (part.inlineData) {
            console.log(`  inlineData mimeType: "${part.inlineData.mimeType}", data length: ${part.inlineData.data.length}`);
          }
          if (part.text) {
            console.log(`  text: "${part.text}"`);
          }
        }
      }
    } catch (err2) {
      console.error("Failed with ['audio'] as well:", err2.message);
    }
  }
}

run();
