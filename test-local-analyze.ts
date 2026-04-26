async function test() {
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAAByTgbEAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAABPSURBVDhPpc2xCQAgDATAMbKI00j1H+XIBXyFIn7T6wscOclMv2n9Z2yV631+6wXFikKxolCsoLDEwBIHSwQ0WCFghQEDFggwYEDAAgEGBH4Zl2vB45c1AAAAAElFTkSuQmCC";

  try {
    const response = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: b64,
        model: "gemini-2.5-flash",
        prompt: "Analyze this garment image deeply. \n Identify..."
      })
    });
    console.log(response.status);
    console.log(await response.text());
  } catch (e) {
    console.error(e);
  }
}
test();
