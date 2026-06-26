import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

async function run() {
  try {
    const result = await model.generateContent({
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

    const response = await result.response;
    console.log("Response JSON:", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
