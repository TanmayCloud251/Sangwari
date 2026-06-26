import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Read API key from .env file
const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey) {
  console.error("API Key not found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTry = [
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-pro-preview-tts"
];

async function run() {
  for (const modelName of modelsToTry) {
    try {
      console.log(`\n--- Trying model: ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "जय जोहार संगवारी! आप कैसे हो? छत्तीसगढ़ी में बताओ।" }] }],
        generationConfig: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede", // Puck, Charon, Kore, Fenrir, Aoede
              }
            }
          }
        }
      });

      console.log(`Success with model ${modelName}!`);
      const response = await result.response;
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType;
            const data = part.inlineData.data;
            console.log(`Found inlineData: ${mimeType}, data length: ${data.length}`);
            fs.writeFileSync(`test-audio-${modelName.replace(/\//g, '-')}.mp3`, Buffer.from(data, 'base64'));
            console.log(`Wrote test-audio-${modelName.replace(/\//g, '-')}.mp3 successfully!`);
          }
          if (part.text) {
            console.log(`Text response: "${part.text}"`);
          }
        }
      }
      break; // stop on first success
    } catch (err) {
      console.error(`Failed with model ${modelName}:`, err.message);
    }
  }
}

run();
