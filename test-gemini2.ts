import fetch from "node-fetch";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key");
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  console.log(response.status);
  const data = await response.json();
  console.log(data.models.map(m => m.name).filter(n => n.includes("gemini")));
}
test();
