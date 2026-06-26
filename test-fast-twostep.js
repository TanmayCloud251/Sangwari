import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const t0 = performance.now();
  try {
    // Step 1: Generate short text
    console.log("Generating short text...");
    const textModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are Sangwari, a companion from Chhattisgarh.
Respond in exactly one short sentence of correct Chhattisgarhi in Devanagari script. Keep it under 10 words.`
    });
    
    const textResult = await textModel.generateContent("जय जोहार संगवारी! आप कैसे हो? छत्तीसगढ़ी में बताओ।");
    const textResponse = await textResult.response;
    const generatedText = textResponse.text().trim();
    const t1 = performance.now();
    console.log(`Text generated: "${generatedText}" in ${((t1 - t0) / 1000).toFixed(2)}s`);
    
    // Step 2: Generate audio for short text
    console.log("Generating audio...");
    const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });
    const audioResult = await ttsModel.generateContent({
      contents: [{ role: "user", parts: [{ text: `कृप्या इसे पढ़ें: ${generatedText}` }] }],
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
    const audioResponse = await audioResult.response;
    const parts = audioResponse.candidates?.[0]?.content?.parts;
    const t2 = performance.now();
    console.log(`Audio generated in ${((t2 - t1) / 1000).toFixed(2)}s`);
    console.log(`Total Time: ${((t2 - t0) / 1000).toFixed(2)}s`);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
