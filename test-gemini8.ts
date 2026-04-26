import fetch from "node-fetch";

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const promptText = `Analyze this garment image deeply.`;

  // A tiny real 1x1 JPEG image base64
  const b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  const requestBody = {
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
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
