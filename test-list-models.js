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

async function run() {
  try {
    // Note: genAI doesn't have a direct listModels, but we can do a fetch to the endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available models:");
    for (const model of data.models || []) {
      console.log(`- ${model.name}: ${model.displayName} (methods: ${model.supportedGenerationMethods})`);
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

run();
