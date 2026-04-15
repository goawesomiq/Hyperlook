import { getUserCredits, updateUserCredits } from './firestoreRest';

export async function processPhotoshootJob(job: any) {
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

  const fetchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text();
    throw new Error(`Gemini API Error: ${fetchResponse.status} - ${errorText}`);
  }

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

  if (!isAdmin && projectId && firebaseApiKey && userId) {
    await updateUserCredits(projectId, userId, -cost, firebaseApiKey);
  }

  if (job.updateProgress) await job.updateProgress(100);

  return { image_base64 };
}
