import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const t0 = performance.now();
  try {
    // Step 1: Generate text
    console.log("Starting Step 1: Text Generation...");
    const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const textResult = await textModel.generateContent({
      contents: [{ role: "user", parts: [{ text: "जय जोहार संगवारी! आप कैसे हो? छत्तीसगढ़ी में एक छोटा सा उत्तर दो।" }] }],
      systemInstruction: "You are Sangwari, a companion from Chhattisgarh. Respond in 1-2 sentences of correct Chhattisgarhi in Devanagari script."
    });
    const textResponse = await textResult.response;
    const generatedText = textResponse.text();
    const t1 = performance.now();
    console.log(`Step 1 Complete. Text: "${generatedText.trim()}"`);
    console.log(`Step 1 Time: ${((t1 - t0) / 1000).toFixed(2)}s`);

    // Step 2: Generate audio
    console.log("Starting Step 2: Audio Generation...");
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
    console.log(`Step 2 Complete. Audio parts: ${parts?.length}`);
    console.log(`Step 2 Time: ${((t2 - t1) / 1000).toFixed(2)}s`);
    console.log(`Total Time: ${((t2 - t0) / 1000).toFixed(2)}s`);

    if (parts?.[0]?.inlineData) {
      fs.writeFileSync('latency-audio.wav', Buffer.from(parts[0].inlineData.data, 'base64'));
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
