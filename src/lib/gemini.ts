import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import { auth } from "../firebase";

export async function resizeBase64ForAnalysis(base64Str: string, maxDim: number = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        resolve(base64Str);
        return;
      }
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export async function analyzeGarment(base64Image: string) {
  let retries = 1;
  let delay = 1000;

  console.log("Resizing image for analysis...");
  const resizedBase64 = await resizeBase64ForAnalysis(base64Image, 800);
  console.log("Resize complete.");

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
          model: 'gemini-3-flash-preview',
          image: resizedBase64,
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
  isMagicVariation?: boolean;
  colorVariationType?: 'text' | 'code' | 'image';
  colorVariationValue?: string;
  magicVariationModelAction?: 'same' | 'different';
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
    isMagicRef,
    isMagicVariation,
    colorVariationType,
    colorVariationValue,
    magicVariationModelAction
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
  const randomSeed = Math.floor(Math.random() * 10000000);

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
    prompt = `
    CRITICAL INSTRUCTION: POSE VARIATION MODE.

    You are an expert AI photo editor. The FIRST primary image provided is an ALREADY GENERATED AI photoshoot image (or a high-quality reference photo).
    Your task is to generate the EXACT SAME SCENE (100% identical face, 100% identical body features, 100% identical background) BUT in a NEW POSE: ${poseInstruction}.

    STRICT CONSTRAINTS (NON-NEGOTIABLE):
    1. FACE, BODY & IDENTITY: The model's face, complete body features, identity, and hairstyle MUST perfectly match the FIRST primary input image.
    2. BACKGROUND: The environment and background MUST perfectly match the FIRST primary input image. DO NOT change it.
    3. GARMENT: The physical clothing/garment MUST be 100% identical to the reference image in fabric, pattern, embroidery, color, and silhouette. YOU MUST incorporate EVERY SINGLE reference image piece exactly as described.
    4. IGNORE RAW REFERENCES: DO NOT revert to the face or background of any secondary, raw clothing photos provided. Only use secondary references to understand the garment details.
    
    QUALITY: ${qualityPrompt}`;
  }

  if (isMagicVariation) {
    let garmentConsistencyRule = "";

    if (colorVariationType === "text" || colorVariationType === "code") {
      garmentConsistencyRule = `
      STRICT GARMENT CONSISTENCY (COLOR VARIATION MODE): The physical clothing/garment MUST be 100% perfectly identical to the reference image in fabric, pattern, silhouette, styling, and embroidery design, BUT THE COLOR MUST BE CHANGED. 
      TARGET NEW COLOR: You must perfectly recolor the garment to match ${colorVariationValue} exactly. Retain all original textures, embroideries, and patterns but shift the base and accent hues to perfectly match this target color.`;
    } else if (colorVariationType === "image") {
      garmentConsistencyRule = `
      STRICT GARMENT CONSISTENCY (COLOR VARIATION MODE): The physical clothing/garment MUST be 100% perfectly identical to the reference image in fabric, pattern, silhouette, styling, and embroidery design, BUT THE COLOR MUST BE CHANGED. 
      TARGET NEW COLOR: Look at the LAST reference image provided in the list (this is our 'TARGET COLOR REFERENCE IMAGE'). Extract the EXACT color tone, shade, and gradient from that LAST image and apply it to the garment. Retain all original textures of the garment but recolor it perfectly.`;
    }

    const keepIdentity = (magicVariationModelAction === "same");

    if (keepIdentity) {
      prompt = `
      CRITICAL INSTRUCTION: POSE & COLOR VARIATION MODE.

      You are an expert AI photo editor. The FIRST primary image provided is an ALREADY GENERATED AI photoshoot image (or a high-quality reference photo).
      Your task is to generate the EXACT SAME SCENE (100% identical face, 100% identical body features, 100% identical background) BUT in a NEW POSE: ${poseInstruction}.

      STRICT CONSTRAINTS (NON-NEGOTIABLE):
      1. FACE, BODY & IDENTITY: The model's face, complete body features, identity, and hairstyle MUST perfectly match the FIRST primary input image.
      2. BACKGROUND: The environment and background MUST perfectly match the FIRST primary input image. DO NOT change it.
      
      ${garmentConsistencyRule}

      4. IGNORE RAW REFERENCES: DO NOT revert to the face or background of any secondary, raw clothing photos provided. Only use secondary references to understand the garment details.
      
      QUALITY: ${qualityPrompt}`;
    } else {
      prompt = `
      CRITICAL INSTRUCTION: 100% NEW FACE & BACKGROUND, 100% IDENTICAL GARMENT BUT RECOLORED.
    
      You are an expert AI photographer generating a multi-view photoshoot. Your EXACT task is to extract ONLY the garment from the reference images and place it on a COMPLETELY NEW fashion model in a COMPLETELY NEW environment.
      
      ${garmentConsistencyRule}
      
      STRICT MODEL DISCARD (REPLACE FACE AND BODY): YOU MUST 100% IGNORE the face, body type, identity, hair, and head of the person in the input images. Generate a COMPLETELY NEW, completely unique, attractive, highly professional fashion model face and body features (Digital Seed: ${randomSeed}). This generated model must be entirely distinct from any other image. DO NOT copy the original input model's face or body under any circumstances.
      
      STRICT BACKGROUND DISCARD: YOU MUST 100% IGNORE the background in the input images. You MUST place the new model entirely in the environment described in BACKDROP.
      
      QUALITY: ${qualityPrompt}`;
    }
  }

  if (garmentType === "design_print") {
    prompt = `CRITICAL INSTRUCTION: Generate a High-Fidelity Digital Print Template.
    
    You are an expert AI fabric designer. The user has uploaded a raw fabric/garment design or pattern. 
    Your task is to take the essence, motifs, color palette, and style of the input reference and output a beautiful, continuous, high-definition digital print pattern template.
    
    ASPECT RATIO TARGET: This is intended for a long stretch horizontal format (21:9). The output must be styled as a seamless or aesthetically stretched digital print perfect for the entire length of a garment (like a Kurti or Saree print).
    
    MANDATORY RULES:
    1. EXTREME DETAIL: The fabric print must have extreme macro-level detailing. We need to see thread-level sharpness, dye characteristics, and crisp motifs up to 4K resolution fidelity.
    2. CONSISTENCY: The design language, style, and core visual elements MUST exactly match the uploaded reference image. Do not invent a completely different style.
    3. NO HUMAN MODELS: Do NOT show any humans, models, mannequins, or backgrounds. The entire image MUST ONLY be the flat digital print fabric pattern stretching corner to corner.
    4. NO CREASES: The fabric should appear perfectly flat and pressed, as a raw digital graphic template ready for manufacturing.
    
    QUALITY: ${qualityPrompt}`;
  }

  const finalReferenceImages = (referenceImages && referenceImages.length > 0) 
    ? referenceImages 
    : [];

  // If it's a Magic Variation with an image swatch, we need to pass that swatch as a reference image
  const extraReferenceImages = [];
  if (isMagicVariation && colorVariationType === "image" && colorVariationValue) {
    extraReferenceImages.push(colorVariationValue);
  }

  const allReferenceImages = [...finalReferenceImages, ...extraReferenceImages];

  // Log what we are sending
  console.log('Sending to generate:', {
    hasImage: !!mainImageBase64,
    referenceCount: allReferenceImages.length,
    model: 'gemini-2.5-pro',
    isMagicRef,
    isMagicVariation
  });

  const finalPrompt = allReferenceImages.length === 0 && !isMagicRef && !isMagicVariation
    ? `Create a photorealistic fashion photograph. Generate a new image from scratch showing a model wearing this exact garment. ${prompt}`
    : prompt;

  console.log("Resizing main image for generation to meet 1MP vertex limit...");
  const resizedMainImage = await resizeBase64ForAnalysis(mainImageBase64, 1024);
  
  const resizedReferenceImages = await Promise.all(
    allReferenceImages.map(img => resizeBase64ForAnalysis(img, 1024))
  );
  console.log("Resize complete.");

  let retries = 1;
  let delay = 1000;
  
  while (retries >= 0) {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: auth.currentUser?.uid || "anonymous",
          userEmail: auth.currentUser?.email || auth.currentUser?.phoneNumber || "",
          prompt: finalPrompt,
          model: "gemini-3.1-flash-image-preview",
          image: resizedMainImage,
          referenceImagesBase64: resizedReferenceImages,
          aspectRatio,
          quality,
          responseModalities: ["IMAGE"]
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
          const rawData = imagePart.inlineData?.data || imagePart.inline_data?.data;
          const data = String(rawData || "").replace(/\s/g, '');
          if (data.length > 100) {
            return `data:image/jpeg;base64,${data}`;
          }
        }
        throw new Error("No valid image data found in synchronous response");
      }

      const { jobId } = responseData;
      if (!jobId) {
        throw new Error("No Job ID or Image data received from server");
      }

      const resultDataUrl = await new Promise<string>((resolve, reject) => {
        // High-end image models can take up to 4 minutes during peak times. Increase timeout to 10 minutes.
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error("Photoshoot generation timed out (10 min limit). Please check your internet and try again."));
        }, 600000); 

        const eventSource = new EventSource(`/api/status/${jobId}`);
        console.log(`SSE: Connected to /api/status/${jobId}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`SSE: Received update for ${jobId}:`, data.state);
            
            if (data.state === 'completed') {
              clearTimeout(timeout);
              eventSource.close();
              
              // Now fetch the actual huge image safely via normal HTTP
              fetch(`/api/result/${jobId}`)
                .then(res => res.json())
                .then(resultData => {
                  const b64Raw = resultData.returnvalue?.image_base64 || resultData.returnvalue;
                  if (typeof b64Raw !== 'string' || !b64Raw) {
                     reject(new Error("Worker returned invalid image data format."));
                     return;
                  }
                  const b64 = b64Raw.replace(/\s/g, '');
                  resolve(`data:image/jpeg;base64,${b64}`);
                })
                .catch(err => reject(new Error("Failed to fetch final image data: " + err.message)));
              
            } else if (data.state === 'failed') {
              clearTimeout(timeout);
              eventSource.close();
              reject(new Error(data.failedReason || 'Generation failed on AI server'));
            }
          } catch (e) {
            console.error("SSE: Error parsing data", e);
          }
        };

        eventSource.onerror = (err) => {
          console.error(`SSE: Connection error for ${jobId}`, err);
          // Don't reject immediately on transient SSE errors as browser might retry
          // The timeout will catch permanent hangs
        };
      });

      return resultDataUrl;
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
