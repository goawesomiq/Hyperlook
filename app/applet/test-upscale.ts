import { GoogleAuth } from 'google-auth-library';

async function testEndpoint() {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';
  
  if (!projectId) { console.log('no project id'); return; }

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  // Create a tiny valid base64 image (actually need a proper one to avoid image format issues, lets use a simple 64x64 valid jpeg base64)
  const pixel = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  const models = [
    'imagegeneration@005',
    'imagegeneration@002',
    'imagen-3.0-capability-001',
    'imagen-3.0-generate-002'
  ];

  for (const model of models) {
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
    const payload = {
      instances: [{ image: { bytesBase64Encoded: pixel } }],
      parameters: { upscaleConfig: { upscaleFactor: "x2" } }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    console.log(`${model}: ${res.status}`);
    if (!res.ok) console.log((await res.text()).substring(0, 200));
  }
}

testEndpoint();
