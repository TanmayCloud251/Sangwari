import fs from 'fs';

// Read API keys from .env file
const envText = fs.readFileSync('.env', 'utf-8');
const matchGemini = envText.match(/GEMINI_API_KEY=(.*)/);
const apiKeyGemini = matchGemini ? matchGemini[1].trim() : null;
const matchGroq = envText.match(/GROQ_API_KEY=(.*)/);
const apiKeyGroq = matchGroq ? matchGroq[1].trim() : null;

if (!apiKeyGroq) {
  console.error("Groq API Key not found in .env");
  process.exit(1);
}

// Function to add WAV header to PCM bytes (16-bit, mono, 24000Hz)
function addWavHeader(pcmBuffer, sampleRate = 24000) {
  const len = pcmBuffer.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);
  
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + len, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16-bit
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, len, true);
  
  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(new Uint8Array(pcmBuffer));
  
  return Buffer.from(buffer);
}

async function run() {
  try {
    if (!fs.existsSync('latency-audio.wav')) {
      console.error("latency-audio.wav not found. Please run test-latency.js first.");
      process.exit(1);
    }
    const rawPcm = fs.readFileSync('latency-audio.wav');
    const wavBuffer = addWavHeader(rawPcm);
    
    // Save to a temporary wav file
    fs.writeFileSync('temp-whisper.wav', wavBuffer);
    
    console.log("Sending WAV file to Groq Whisper...");
    const t0 = performance.now();
    
    const formData = new FormData();
    formData.append('file', new Blob([wavBuffer], { type: 'audio/wav' }), 'temp-whisper.wav');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'hi'); // Hindi language model is best for Chhattisgarhi Devanagari
    
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyGroq}`
      },
      body: formData
    });
    
    const result = await response.json();
    const t1 = performance.now();
    
    console.log("Transcription status:", response.status);
    console.log("Transcription result:", JSON.stringify(result, null, 2));
    console.log(`Groq Whisper Time: ${((t1 - t0) / 1000).toFixed(2)}s`);
  } catch (err) {
    console.error("Error during run:", err);
  }
}

run();
