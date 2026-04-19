import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import { auth } from "../firebase";

export async function analyzeGarment(base64Image: string) {
  let retries = 1;
  let delay = 1000;

  while (retries >= 0) {
    try {
      const prompt = `Analyze this garment image deeply. 
Identify:
1. Garment Type (e.g., Saree, Sherwani, Kurti, Trousers, etc.)
2. Gender (Male, Female, Unisex)
3. Age Group (Infant, Toddler, Child (specify approx age), Teen, Adult)
4. Style (Traditional, Formal, Casual, Western, etc.)
5. Key Features (Color, Pattern, Material, Detailing)
6. Category: Is this a "top", "bottom", or a "full_set"?
7. Complementary Options: Provide 4 to 6 distinct AI-suggested options for the "other half" (e.g., if it's a top, suggest bottoms; if it's a bottom, suggest tops; if it's a full set, suggest accessories or layering). The color and design should be AI-based and best suited to the input product.
8. Footwear Options: Provide 4 to 6 distinct AI-suggested footwear options (e.g., Sandal, Jutti, Sneaker, Heels, Loafers) that best suit the overall garment style.

Return the result in JSON format.`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-3.1-pro-preview',
          image: base64Image,
          base64Image: base64Image,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.debug) {
            errorMessage += `\n\n[DEBUG INFO]:\nKey Prefix Sent: ${errorData.debug.keyPrefix}\nKey Length: ${errorData.debug.keyLength}\nIs Firebase Key: ${errorData.debug.isFirebaseKey}`;
          }
        } catch (e) {
          if (response.status === 413) {
            errorMessage = "Image is too large. Please upload a smaller image (under 4MB).";
          }
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Gemini API Error in analyzeGarment:", error);
      const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error)) + (error?.message || "");
      if (errorString.includes("503") || errorString.includes("UNAVAILABLE") || errorString.includes("high demand") || errorString.includes("Failed to fetch")) {
        if (retries === 0) throw new Error("The AI model is currently experiencing high demand. Please try again in a few moments.");
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Less aggressive backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to analyze image after multiple attempts.");
}

export interface GenerationConfig {
  garmentType: string;
  gender: string;
  ageGroup: string;
  style: string;
  description: string;
  matchingSuggestions?: string;
  category: "top" | "bottom" | "full_set";
  quality: "1K" | "2K" | "4K";
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16";
  backdrop: string;
  poses: string[];
  referenceImages?: string[];
  userNote?: string;
  isMagicRef?: boolean;
  complementaryPart?: {
    label: string;
    description: string;
  };
  footwear?: {
    label: string;
    description: string;
  };
}

export async function generatePhotoshoot(config: GenerationConfig, mainImageBase64: string, currentPose: string) {
  const { 
    garmentType, 
    gender, 
    ageGroup, 
    style, 
    description, 
    matchingSuggestions, 
    category,
    quality, 
    aspectRatio,
    backdrop, 
    referenceImages = [],
    userNote,
    complementaryPart,
    footwear,
    isMagicRef
  } = config;

  const qualityPrompt = quality === "4K" 
    ? "ULTRA HIGH RESOLUTION 4K. Masterpiece, 8k resolution, highest detailing and fidelity, sharp focus, professional photography, macro details on fabric, cinematic lighting. Utmost detailing subject to 4k pixels." 
    : quality === "2K"
    ? "HIGH RESOLUTION 2K. Moderate to great high fidelity and detailing. Professional photography, detailed, sharp focus, good lighting. Utmost detailing subject to 2k pixels."
    : "STANDARD RESOLUTION 1K. Moderate low fidelity but clearly visible details. Optimized for speed and fast processing. Utmost detailing subject to 1k pixels.";

  let poseInstruction = currentPose;
  if (currentPose === "Product Focus") {
    if (category === "bottom") {
      poseInstruction = "Close-up detail shot focusing strictly on the lower body (waist to ankles), highlighting the bottom garment. The upper body and face should be cropped out or out of focus.";
    } else if (category === "top") {
      poseInstruction = "Close-up detail shot focusing strictly on the upper body (torso and chest), highlighting the top garment. The lower body should be cropped out or out of focus.";
    } else {
      poseInstruction = "Close-up detail shot focusing strictly on the main details of the garment, filling the frame with the product.";
    }
  } else if (currentPose === "Half Portrait") {
    poseInstruction = "Half portrait shot focusing on the upper body from the waist up. Ensure the face and upper garment are clearly visible.";
  } else if (currentPose === "Hands in Pockets") {
    poseInstruction = "Casual full body pose with both hands correctly placed in garment pockets. If there are no pockets, rest hands casually near the waist. CRITICAL: Ensure the framing captures the FULL model body from head to toe. Do not crop the head or feet.";
  } else {
    poseInstruction = `${currentPose}. CRITICAL: Ensure the framing captures the FULL model body from head to toe. Do not crop the head or feet. The entire outfit and model must be fully visible in the frame.`;
  }

  // Generate a random seed to ensure face reset when product changes
  const randomSeed = Math.floor(Math.random() * 1000000);

  let prompt = `CRITICAL INSTRUCTION: Absolute 1:1 Product and Model Consistency.
  
  You are an expert AI photographer generating a multi-view photoshoot. Your task is to generate a ${currentPose} of the exact same model wearing the EXACT SAME physical garment as shown in the reference images.
  
  GARMENT TO SHOWCASE: ${garmentType}.
  GARMENT DETAILS: ${description}.
  STYLE: ${style}.
  
  ${complementaryPart ? `OUTFIT COMPLETION: The model is wearing the main garment along with a complementary ${complementaryPart.label === "Matching Co-ord Set" ? "matching" : "contrasting"} part. 
  STYLING INSTRUCTION: ${complementaryPart.description}. Ensure the overall look is a complete, professional outfit.` : ""}

  ${footwear ? `FOOTWEAR: The model is wearing ${footwear.label}. ${footwear.description}. Ensure the footwear perfectly matches the outfit's style.` : ""}

  ${userNote ? `SPECIAL USER INSTRUCTION / HIGHLIGHT: ${userNote}. You MUST incorporate this specific instruction into the final image.` : ""}

  POSE: ${poseInstruction}.
  POSE INSTRUCTION: Ensure the poses are non-identical to the input, highly professional, non-robotic, and natural. The model should pose in different angles and view directions that look like a pro professional model photoshoot. ${currentPose !== "Product Focus" && currentPose !== "Half Portrait" ? "CRITICAL: The camera framing MUST be a wide shot capturing the FULL BODY of the model from head to toe. Do not crop out the head, face, or feet." : ""}
  BACKDROP: ${backdrop}.
  
  MANDATORY CONSISTENCY RULES:
  1. PRODUCT CONSISTENCY (NON-NEGOTIABLE): The garment MUST be identical to the reference image. If the pose is a back or side view, you must accurately extrapolate the design based on the front reference, maintaining the exact same color, fabric, pattern, embroidery, and silhouette perfectly. Do not hallucinate different designs for the back.
  2. MODEL CONSISTENCY: The model's facial features, ethnicity (PURE INDIAN), skin tone, hairstyle, and body type must exactly match the provided reference images.
  3. REALISM: The model's face MUST look hyper-realistic, ultra-realistic, and next-to-real. It must be completely natural, high-fidelity, and indistinguishable from a real human photograph. No AI artifacts.
  4. FACE RESET: Generate a completely NEW, UNIQUE face for this specific garment input [Seed: ${randomSeed}]. Do NOT reuse faces from previous unrelated generations.
  
  CONTEXTUAL COMPLETION: ${matchingSuggestions || "Ensure the model is fully dressed in a way that complements the main garment."}
  
  QUALITY: ${qualityPrompt} No studio assets or tools visible. Utmost detailing on fabric texture and embroidery.`;

  if (isMagicRef) {
    prompt = `CRITICAL INSTRUCTION: MAGIC REFERENCE MODE.
    
    You are an expert AI photo editor. The user has provided an existing generated image as a Magic Reference.
    Your task is to generate the EXACT SAME IMAGE (100% identical model, face, hairstyle, exact garment, and exact background) BUT in a NEW POSE: ${poseInstruction}.
    
    DO NOT change the background. DO NOT change the outfit. DO NOT change the model's identity.
    The new pose MUST NOT be the same as the input image's pose. Make it a professional, natural fashion pose.
    Ensure the poses are non-identical, highly professional, non-robotic, and natural. The model should pose in different angles and view directions.
    ${currentPose !== "Product Focus" && currentPose !== "Half Portrait" ? "CRITICAL: The camera framing MUST be a wide shot capturing the FULL BODY of the model from head to toe. Do not crop out the head, face, or feet." : ""}
    
    ${userNote ? `SPECIAL USER INSTRUCTION / HIGHLIGHT: ${userNote}. You MUST incorporate this specific instruction into the final image.` : ""}
    
    QUALITY: ${qualityPrompt}`;
  }

  const parts = [
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: mainImageBase64 } },
    ...referenceImages.map(img => ({ inlineData: { mimeType: "image/jpeg", data: img } })),
  ];

  // If no reference images provided, create a minimal valid placeholder
  // so Gemini knows this is a generation task not analysis task
  const finalReferenceImages = (referenceImages && referenceImages.length > 0) 
    ? referenceImages 
    : [];

  // Log what we are sending
  console.log('Sending to analyze:', {
    hasImage: !!mainImageBase64,
    referenceCount: finalReferenceImages.length,
    model: 'gemini-3.1-flash-image-preview'
  });

  const finalPrompt = finalReferenceImages.length === 0
    ? `Create a photorealistic fashion photograph. Generate a new image from scratch showing a model wearing this exact garment. ${prompt}`
    : prompt;

  let retries = 1;
  let delay = 1000;
  
  while (retries >= 0) {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.currentUser?.uid || "anonymous",
          userEmail: auth.currentUser?.email || "",
          prompt: finalPrompt,
          model: "gemini-3.1-flash-image-preview",
          image: mainImageBase64,
          base64Image: mainImageBase64,
          referenceImagesBase64: finalReferenceImages,
          aspectRatio,
          quality,
          response_modalities: ["IMAGE", "TEXT"]
        }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (response.status === 413) {
            errorMessage = "Image is too large. Please upload a smaller image (under 4MB).";
          }
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Robust response handling: handle both synchronous and asynchronous responses
      if (responseData.candidates) {
        // Direct response (forwarded from web server directly)
        const parts = responseData.candidates[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData || p.inline_data);
        if (imagePart) {
          const data = imagePart.inlineData?.data || imagePart.inline_data?.data;
          return `data:image/jpeg;base64,${data}`;
        }
        throw new Error("No image data found in synchronous response");
      }

      const { jobId } = responseData;
      if (!jobId) {
        throw new Error("No Job ID or Image data received from server");
      }

      const result = await new Promise<string>((resolve, reject) => {
        const eventSource = new EventSource(`/api/status/${jobId}`);
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.state === 'completed') {
              eventSource.close();
              const b64 = data.returnvalue?.image_base64 || data.returnvalue;
              resolve(`data:image/jpeg;base64,${b64}`);
            } else if (data.state === 'failed') {
              eventSource.close();
              reject(new Error(data.failedReason || 'Generation failed'));
            }
          } catch (e) {
            console.error("Error parsing SSE data", e);
          }
        };
        eventSource.onerror = (err) => {
          eventSource.close();
          reject(new Error('SSE connection error'));
        };
      });

      const dataUrl = `data:image/jpeg;base64,${result.image_base64}`;

      try {
        // Ultra-fast lossless PNG conversion using createImageBitmap and OffscreenCanvas
        const fetchResponse = await fetch(dataUrl);
        const blob = await fetchResponse.blob();
        const bitmap = await createImageBitmap(blob);
        
        if (typeof OffscreenCanvas !== 'undefined') {
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
            return await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(pngBlob);
            });
          }
        }
        
        // Fallback to async DOM canvas if OffscreenCanvas is not supported
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
          return await new Promise<string>((resolve, reject) => {
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(pngBlob);
              } else {
                resolve(dataUrl); // fallback
              }
            }, 'image/png');
          });
        }
      } catch (e) {
        console.error("Fast PNG conversion failed, falling back to original", e);
        return dataUrl;
      }
      
      return dataUrl;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error)) + (error?.message || "");
      if (errorString.includes("503") || errorString.includes("UNAVAILABLE") || errorString.includes("high demand") || errorString.includes("Failed to fetch")) {
        if (retries === 0) throw new Error("The AI model is currently experiencing high demand. Please try again in a few moments.");
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Less aggressive backoff
      } else {
        throw error;
      }
    }
  }

  throw new Error("Failed to generate image after multiple attempts.");
}
