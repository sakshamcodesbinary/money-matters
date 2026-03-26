async function listModels() {
  const apiKey = "AIzaSyBa0PNEiSg2FmTp43HMn8n1BJqcbk4uwto";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok) {
      console.error("API Error:", data.error || data);
      return;
    }

    console.log("\n--- AVAILABLE GOOGLE AI MODELS ---\n");
    data.models.forEach((m) => {
      console.log(`MODEL ID: ${m.name}`);
      console.log(`DISPLAY NAME: ${m.displayName}`);
      console.log(`METHODS: ${m.supportedGenerationMethods.join(", ")}`);
      console.log('-----------------------------------\n');
    });
  } catch (error) {
    console.error("Fetch Error:", error.message);
  }
}

listModels();
