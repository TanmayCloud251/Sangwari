import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

const inputs = [
  "जय जोहार!",
  "जय जोहार संगवारी! आप मन कइसे हव?",
  "जय जोहार संगवारी! मैं बने हावों। आप मन कइसे हव? आज मैं आपके का मदद कर सकत हंव?"
];

async function run() {
  for (let i = 0; i < inputs.length; i++) {
    const text = inputs[i];
    console.log(`\nTesting length: ${text.length} chars ("${text}")`);
    const t0 = performance.now();
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `कृप्या इसे पढ़ें: ${text}` }] }],
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
      const parts = response.candidates?.[0]?.content?.parts;
      const t1 = performance.now();
      console.log(`Time taken: ${((t1 - t0) / 1000).toFixed(2)}s, parts: ${parts?.length}`);
    } catch (e) {
      console.error("Error:", e.message);
    }
  }
}

run();
