import https from 'https';

function testEndpoint(modelName) {
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/vertex-master-engine/locations/us-central1/publishers/google/models/${modelName}:predict`;
  
  https.request(url, { method: 'POST', headers: { 'Authorization': 'Bearer ya29.mock' } }, (res) => {
    console.log(`${modelName}: ${res.statusCode}`);
  }).end();
}

testEndpoint('image-generation@006');
testEndpoint('imagegeneration@006');
testEndpoint('imagen-3.0-generate-002');
testEndpoint('imagegeneration@005');
