import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const list = await genAI.listModels();
    console.log("--- AVAILABLE MODELS ---");
    list.models.forEach((m) => {
      console.log(`- ${m.name}`);
      console.log(`  Display: ${m.displayName}`);
      console.log(`  Methods: ${m.supportedGenerationMethods.join(", ")}`);
      console.log('---');
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
