import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const match = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `You are Sangwari, a warm AI companion from Chhattisgarh.
Language rules:
1. Speak primarily in Chhattisgarhi.
2. Use Chhattisgarhi greetings like "Jai Johar", "Sangwari".
3. Respond in Devanagari script.
4. Keep responses extremely short and conversational (maximum 1 sentence).`
  });

  console.log(`Testing direct audio generation with ${modelName}...`);
  const t0 = performance.now();
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
    const parts = response.candidates?.[0]?.content?.parts;
    const t1 = performance.now();
    console.log(`Success with ${modelName}. Time: ${((t1 - t0) / 1000).toFixed(2)}s, parts: ${parts?.length}`);
    if (parts?.[0]?.inlineData) {
      console.log(`  Audio size: ${parts[0].inlineData.data.length} bytes`);
      fs.writeFileSync(`direct-audio-${modelName.replace(/\//g, '-')}.wav`, Buffer.from(parts[0].inlineData.data, 'base64'));
    }
  } catch (err) {
    console.error(`Failed with ${modelName}:`, err.message);
  }
}

async function run() {
  await testModel("gemini-2.5-flash-preview-tts");
  await testModel("gemini-3.1-flash-tts-preview");
}

run();
