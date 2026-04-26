import "dotenv/config";
import fetch from "node-fetch";

async function test() {
  const b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  const response = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: b64,
      model: "gemini-3-flash-preview",
      prompt: "Analyze this garment image deeply."
    })
  });
  console.log(response.status);
  console.log(await response.text());
}
test();
