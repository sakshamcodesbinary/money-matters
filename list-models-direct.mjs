import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the API key provided in the conversation
const apiKey = "AIzaSyBa0PNEiSg2FmTp43HMn8n1BJqcbk4uwto";

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const list = await genAI.listModels();
    console.log("\n--- AVAILABLE GOOGLE AI MODELS ---\n");
    list.models.forEach((m) => {
      console.log(`MODEL ID: ${m.name}`);
      console.log(`DISPLAY NAME: ${m.displayName}`);
      console.log(`METHODS: ${m.supportedGenerationMethods.join(", ")}`);
      console.log('-----------------------------------\n');
    });
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
