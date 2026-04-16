import { getUserCredits, updateUserCredits } from './firestoreRest';

async function fetchWithRetryAndTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const delays = [5000, 10000, 15000];
  for (let attempt = 0; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 503) {
        if (attempt < 3) {
          console.log(`GENERATE: Received 503. Retrying in ${delays[attempt]}ms...`);
          await new Promise(res => setTimeout(res, delays[attempt]));
          continue;
        } else {
          throw new Error('AI servers are busy. Please try again in 2 minutes.');
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      if (attempt === 3) throw error;
      // Re-throw if it's not a 503 (handled above) and not an abort, unless we want to retry network errors too.
      // The prompt specifically asked to retry on 503, so we only retry 503s.
      throw error;
    }
  }
  throw new Error('AI servers are busy. Please try again in 2 minutes.');
}

export async function processPhotoshootJob(job: any) {
  console.log('GENERATE: Job received');
  const { userId, userEmail, config, mainImageBase64, currentPose, prompt, referenceImagesBase64, aspectRatio, quality } = job.data;
  
  const ADMIN_EMAIL = "goawesomiq@gmail.com";
  let isAdmin = userEmail === ADMIN_EMAIL;
  const cost = quality === "4K" ? 2 : quality === "2K" ? 1.5 : 1;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  if (!isAdmin && projectId && firebaseApiKey && userId) {
    const credits = await getUserCredits(projectId, userId, firebaseApiKey);
    if (credits < cost) {
      throw new Error(`Insufficient credits. This generation requires ${cost} coins. Please purchase more.`);
    }
  }

  let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

  if (!apiKey || apiKey === "TODO_KEYHERE" || apiKey === "") {
    throw new Error("GEMINI_API_KEY is missing or invalid on the server.");
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: mainImageBase64
            }
          },
          ...(referenceImagesBase64 || []).map((b64: string) => ({
            inline_data: {
              mime_type: "image/jpeg",
              data: b64
            }
          }))
        ]
      }
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio: aspectRatio || "3:4",
        imageSize: quality === "4K" ? "4K" : quality === "2K" ? "2K" : "1K",
      }
    }
  };

  if (job.updateProgress) await job.updateProgress(10);

  console.log('GENERATE: Calling Gemini API');
  console.log('GENERATE: Waiting for response...');

  const fetchResponse = await fetchWithRetryAndTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  }, 180000); // 180 seconds timeout

  console.log('GENERATE: Response received!');

  if (job.updateProgress) await job.updateProgress(80);

  const responseData = await fetchResponse.json();
  
  let image_base64 = null;
  for (const part of responseData.candidates[0].content.parts) {
    if (part.inline_data) {
      image_base64 = part.inline_data.data;
      break;
    }
  }

  if (!image_base64) {
    throw new Error("No image generated");
  }
  console.log('GENERATE: Image saved');

  if (!isAdmin && projectId && firebaseApiKey && userId) {
    await updateUserCredits(projectId, userId, -cost, firebaseApiKey);
  }

  if (job.updateProgress) await job.updateProgress(100);
  console.log('GENERATE: Progress updated');
  console.log('GENERATE: Job completed!');

  return { image_base64 };
}
