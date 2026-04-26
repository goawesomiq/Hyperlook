import fetch from "node-fetch";
import fs from "fs";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("No API key");
    return;
  }
  const promptText = `Analyze this garment image deeply.`;

  // Provide a real image base64 here if possible, but 1x1 might be rejected.
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAAByTgbEAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAABPSURBVDhPpc2xCQAgDATAMbKI00j1H+XIBXyFIn7T6wscOclMv2n9Z2yV631+6wXFikKxolCsoLDEwBIHSwQ0WCFghQEDFggwYEDAAgEGBH4Zl2vB45c1AAAAAElFTkSuQmCC";

  const requestBody = {
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: b64
                  }
                }
              ]
            }
          ]
        };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  console.log(response.status);
  console.log(await response.text());
}
test();
