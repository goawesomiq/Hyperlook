import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import { Queue, Worker } from 'bullmq';
import { getUserCredits, updateUserCredits } from './firestoreRest';
import { GoogleAuth } from 'google-auth-library';

const WORKER_MODE = process.env.WORKER_MODE === 'true';
const PORT = Number(process.env.PORT || 3000);

const WORKER_URL = process.env.WORKER_URL || process.env.RAILWAY_PRIVATE_DOMAIN;
console.log('Worker URL configured as:', WORKER_URL);

// ============ HELPER FUNCTIONS ============

async function callGeminiWithRetry(model: string, requestBody: any, timeoutMs: number, maxRetries = 3) {
  let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("No Gemini API key found");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini call attempt ${attempt}/${maxRetries} for model ${model}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errMsg = responseData.error?.message || JSON.stringify(responseData.error) || response.statusText;
        throw new Error(`HTTP_${response.status} ${errMsg}`);
      }

      // Format response to match SDK expectations
      return {
        text: responseData.candidates?.[0]?.content?.parts?.[0]?.text || null,
        candidates: responseData.candidates
      };
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
         if (attempt === maxRetries) throw new Error(`Request timed out after ${timeoutMs/1000}s`);
      } else {
         if (attempt === maxRetries) throw error;
      }
      
      // Don't retry client errors like 400, 403, 404
      if (error.message && (error.message.includes('HTTP_400') || error.message.includes('HTTP_403') || error.message.includes('HTTP_404'))) {
         console.log(`Failed immediately with client error: ${error.message}`);
         throw error;
      }

      const waitTime = attempt * 5000;
      console.log(`Error: ${error.message}. Retrying in ${waitTime/1000}s...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
  throw new Error('AI servers are busy. Please try again in 2 minutes.');
}

async function processPhotoshootJob(job: any) {
  console.log('GENERATE: Job received', job.id);
  const { userId, userEmail, config, currentPose, prompt, referenceImagesBase64, aspectRatio, quality } = job.data;
  
  // Strip data URI prefix if present - Gemini needs raw base64 only
  const cleanBase64 = (b64: any): string => {
    if (!b64 || b64 === "undefined" || b64 === "null" || (typeof b64 === 'string' && b64.length < 50)) {
      return "";
    }
    const b64Str = String(b64);
    if (b64Str.includes(',')) {
      return b64Str.split(',')[1];
    }
    return b64Str;
  };

  const mainImageBase64 = cleanBase64(
    job.data.mainImageBase64 || job.data.image || job.data.base64Image
  );
  
  const cleanedReferenceImages = (referenceImagesBase64 || []).map(cleanBase64).filter(Boolean);
  
  const cleanedMain = cleanBase64(mainImageBase64);
  const cleanedRefs = cleanedReferenceImages;

  console.log('Images received:', {
    hasMainImage: !!cleanedMain,
    mainLength: cleanedMain?.length || 0,
    referenceImagesCount: cleanedRefs.length
  });

  if (!cleanedMain) {
    throw new Error("No valid main garment image received. Please check your upload.");
  }

  const ADMIN_EMAILS = ["goawesomiq@gmail.com", "kunalrajput1717@gmail.com"];
  const emailToSafe = (userEmail || "").toLowerCase();
  let isAdmin = ADMIN_EMAILS.includes(emailToSafe);
  const cost = quality === "4K" ? 2 : quality === "2K" ? 1.5 : 1;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  if (!isAdmin && projectId && firebaseApiKey && userId) {
    const credits = await getUserCredits(projectId, userId, firebaseApiKey);
    if (credits < cost) {
      throw new Error(`Insufficient credits. This generation requires ${cost} coins. Please purchase more.`);
    }
  }

  console.log('Building Gemini request:', {
    hasMain: !!cleanedMain,
    mainLength: cleanedMain?.length,
    refCount: cleanedRefs.length
  });

  // Build parts array
  const imageParts: any[] = [];

  // Add main garment image
  if (cleanedMain) {
    imageParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanedMain
      }
    });
  }

  // Add reference images
  cleanedRefs.forEach((ref: string) => {
    imageParts.push({
      inlineData: {
        mimeType: 'image/jpeg', 
        data: ref
      }
    });
  });

  // Force generative intent at the start for the Worker
  const generativeForcePrefix = "GENERATE PHOTOREALISTIC IMAGE. DO NOT ANALYZE. ";
  const finalPromptForGemini = prompt.startsWith(generativeForcePrefix) ? prompt : generativeForcePrefix + prompt;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          ...imageParts,
          { 
            text: finalPromptForGemini
          }
        ]
      }
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio: aspectRatio || "1:1",
        imageSize: "1K"
      },
      temperature: 1,
      topP: 0.95,
      topK: 40,
    }
  };

  if (job.updateProgress) await job.updateProgress(10);

  console.log('GENERATE: Request body:', JSON.stringify({
    model: 'gemini-3.1-flash-image-preview',
    hasImage: !!mainImageBase64,
    promptLength: prompt?.length,
    quality: quality
  }));

  console.log('GENERATE: Calling Gemini API');
  console.log('GENERATE: API Key available:', !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY));
  console.log('GENERATE: Waiting for response...');

  const responseData = await callGeminiWithRetry(
    'gemini-3.1-flash-image-preview',
    requestBody,
    180000 // 180 seconds
  );

  console.log('GENERATE: Response received!');
  console.log('GENERATE: Has candidates:', !!responseData.candidates);
  console.log('GENERATE: Parts count:', 
    responseData.candidates?.[0]?.content?.parts?.length);

  if (job.updateProgress) await job.updateProgress(80);
  
  let image_base64 = null;
  let parts: any[] = [];

  if (responseData.candidates && 
      responseData.candidates[0] && 
      responseData.candidates[0].content &&
      responseData.candidates[0].content.parts) {
    
    parts = responseData.candidates[0].content.parts;
  }

  console.log('All parts received:', JSON.stringify(parts.map(p => ({
    hasText: !!p.text,
    hasInlineData: !!(p.inlineData || p.inline_data),
    keys: Object.keys(p)
  }))));

  const imagePart = parts.find(p => p.inlineData || p.inline_data);

  if (!imagePart) {
    // Log what we got instead
    const textPart = parts.find(p => p.text);
    console.error('No image in response. Part details:', JSON.stringify(parts));
    console.error('This means the prompt is asking for analysis not generation or Safety Filter blocked it');
    
    if (textPart?.text) {
      throw new Error(`No image generated - Gemini returned text instead. This usually happens if the prompt is too clinical or descriptive. Content: ${textPart.text.substring(0, 500)}`);
    } else {
      throw new Error(`No image generated and no text found. This often indicates a Safety Filter block or a model error. Full response keys: ${Object.keys(responseData)}`);
    }
  }
  
  image_base64 = (imagePart.inlineData?.data || imagePart.inline_data?.data || "").toString().replace(/\s/g, '');
  
  // High-fidelity validation: Ensure we have actual base64 data
  if (image_base64.length < 1000) {
     console.error('Invalid image data length:', image_base64.length);
     throw new Error("Gemini returned invalid or corrupted image data. Please try a different prompt.");
  }

  console.log('GENERATE: Image validated! Length:', image_base64.length);

  if (!isAdmin && projectId && firebaseApiKey && userId) {
    await updateUserCredits(projectId, userId, -cost, firebaseApiKey);
  }

  if (job.updateProgress) await job.updateProgress(100);
  console.log('GENERATE: Progress updated');
  console.log('GENERATE: Job completed!');

  return { image_base64 };
}

async function processUpscaleJob(job: any) {
  console.log('UPSCALE: Job received', job.id);
  const { userId, userEmail, imageBase64, quality } = job.data;
  
  const cleanBase64 = (b64: any): string => {
    if (!b64 || typeof b64 !== 'string') return "";
    if (b64.includes(',')) return b64.split(',')[1];
    return b64;
  };
  
  const cleanImg = cleanBase64(imageBase64);
  if (!cleanImg) throw new Error("No image provided for upscaling.");

  // Deduct Credits
  const ADMIN_EMAILS = ["goawesomiq@gmail.com", "kunalrajput1717@gmail.com"];
  const emailToSafe = (userEmail || "").toLowerCase();
  let isAdmin = ADMIN_EMAILS.includes(emailToSafe);
  const cost = quality === "4k" ? 2 : 1; 

  const projectIdFB = process.env.FIREBASE_PROJECT_ID;
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  if (!isAdmin && projectIdFB && firebaseApiKey && userId) {
    const credits = await getUserCredits(projectIdFB, userId, firebaseApiKey);
    if (credits < cost) {
      throw new Error(`Insufficient credits. Upscaling to ${quality} requires ${cost} coins.`);
    }
  }

  if (job.updateProgress) await job.updateProgress(10);

  let finalImageUrl = "";
  const credentialsBase64 = process.env.VERTEX_CREDENTIALS_BASE64;
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';

  if (!credentialsBase64 || !projectId) {
    console.log("UPSCALE [MOCK MODE]: No VERTEX_CREDENTIALS_BASE64 found. Simulating 5s upscale delay...");
    await new Promise(r => setTimeout(r, 5000));
    finalImageUrl = `data:image/jpeg;base64,${cleanImg}`;
  } else {
    try {
      console.log(`UPSCALE: Contacting Vertex AI (project: ${projectId}, location: ${location})...`);
      if (job.updateProgress) await job.updateProgress(20);

      let buffer = Buffer.from(cleanImg, 'base64');
      
      // Ensure image is at most 1,048,576 pixels (max size for optimal Vertex upscaling constraints)
      // Since sharp was causing OOM, we rely on the frontend or backend Vertex limits directly.
      // Vertex Imagen Upscale can usually handle up to its max payload.
      // If it fails, the error will just be caught and returned, rather than crashing the node process.

      const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf-8'));
      
      const auth = new GoogleAuth({
        credentials: credentialsJson,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      const client = await auth.getClient();
      const token = await client.getAccessToken();

      if (!token.token) {
        throw new Error("Failed to authenticate with Google Cloud via JSON Service Account.");
      }

      if (job.updateProgress) await job.updateProgress(40);

      // Testing the latest dedicated upscale endpoint suggested by user
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-4.0-upscale-preview:predict`;
      
      const upscaleFactor = String(quality).toLowerCase() === '4k' ? 'x4' : 'x2';
      console.log(`UPSCALE: Using true diffusion factor ${upscaleFactor} for requested quality ${quality}`);

      // "Swap the Paradigm": Force the upscaler to hallucinate ultra-details by injecting a very aggressive 'Detail Prompt' 
      // and maxing out the prompt adherence (guidanceScale).
      const detailPrompt = "UPSCALE AND ENHANCE DETAILS: Inject massive high-fidelity micro-detailing, extreme photorealistic textures, ultra-sharp focus, cinematic lighting, 8k resolution macro details, intricate linework and fabric grain. Transform this reference image into a breathtaking, perfectly crisp photographic masterwork with vivid fidelity.";

      const payload = {
        instances: [
          {
            prompt: detailPrompt,
            image: {
              bytesBase64Encoded: buffer.toString('base64')
            }
          }
        ],
        parameters: {
          sampleCount: 1,
          mode: "upscale",
          upscaleConfig: {
            upscaleFactor: upscaleFactor
          },
          negativePrompt: "blurry, low quality, pixelated, distorted, compression artifacts, jpeg artifacts, noise, smooth, plastic, low detail",
          guidanceScale: 25, // Significantly increase guidance to FORCE detailing from the prompt into the upscale
          outputOptions: {
            mimeType: "image/png"
          }
        }
      };

      if (job.updateProgress) await job.updateProgress(50);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Vertex AI Error: ${response.status} ${await response.text()}`);
      }
      if (job.updateProgress) await job.updateProgress(70);

      const responseData = await response.json();
      
      if (!responseData.predictions || !responseData.predictions[0] || !responseData.predictions[0].bytesBase64Encoded) {
        throw new Error("Invalid response format from Vertex AI");
      }

      console.log('UPSCALE: Got successful latent-diffusion base64 response from Vertex AI in strict PNG format!');
      finalImageUrl = `data:image/png;base64,${responseData.predictions[0].bytesBase64Encoded}`;

    } catch (e: any) {
      console.error("UPSCALE ERROR:", e.message);
      throw e;
    }
  }

  if (!isAdmin && projectIdFB && firebaseApiKey && userId) {
    await updateUserCredits(projectIdFB, userId, -cost, firebaseApiKey);
  }

  if (job.updateProgress) await job.updateProgress(100);
  console.log('UPSCALE: Job completed!');

  return { imageUrl: finalImageUrl };
}

// ============ WORKER MODE ============

if (WORKER_MODE) {
  console.log('Starting in WORKER mode...');
  
  // Mini health check server for Railway
  const healthApp = express();
  const PORT = Number(process.env.PORT || 3000);
  
  healthApp.use(express.json({ limit: "50mb" }));

  healthApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'worker' });
  });
  
  // HTTP endpoint for synchronous generation from Hyperlook (Web Server)
  healthApp.post('/generate', async (req, res) => {
    try {
      console.log('Worker /generate accessed synchronously');
      const job = {
        id: 'sync-' + Date.now(),
        data: req.body,
        updateProgress: async (p: number) => console.log('Worker sync progress:', p)
      };
      const result = await processPhotoshootJob(job);
      
      // Return exactly what the Web Server expects for forwarding checks
      return res.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: result.image_base64.replace(/\s/g, '')
                  }
                }
              ]
            }
          }
        ]
      });
    } catch (error: any) {
      console.error('Worker /generate error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // HTTP endpoint for synchronous upscale from Hyperlook (Web Server)
  healthApp.post('/upscale', async (req, res) => {
    try {
      console.log('Worker /upscale accessed synchronously');
      const job = {
        id: 'sync-up-' + Date.now(),
        data: req.body,
        updateProgress: async (p: number) => console.log('Worker sync upscale progress:', p)
      };
      const result = await processUpscaleJob(job);
      return res.json(result); // { imageUrl: "..." }
    } catch (error: any) {
      console.error('Worker /upscale error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  healthApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Worker health check on port ${PORT}`);
  });
  
  if (!process.env.REDIS_URL) {
    console.error("CRITICAL: REDIS_URL is required for WORKER_MODE");
    process.exit(1);
  }

  // Fix for MISCONF Redis error: Disable write stopping when background save fails
  const Redis = (await import('ioredis')).default;
  const redisConfigFixer = new Redis(process.env.REDIS_URL!);
  redisConfigFixer.config('SET', 'stop-writes-on-bgsave-error', 'no')
    .then(() => console.log('✅ Worker: Redis write-protection disabled (MISCONF fix)'))
    .catch(err => console.error('❌ Worker: Failed to set Redis config:', err))
    .finally(() => redisConfigFixer.quit());

  const worker = new Worker('photoshoot', async (job) => {
    if (job.name === 'upscale') {
      return await processUpscaleJob(job);
    }
    // Default to generate
    return await processPhotoshootJob(job);
  }, {
    connection: { url: process.env.REDIS_URL }
  });

  worker.on('error', (err) => {
    console.error('BullMQ Worker Error:', err.message);
  });

  worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
  });

  console.log('Worker started and listening for jobs');

} else {
  // ============ WEB SERVER MODE ============
  console.log('Starting in WEB SERVER mode...');
  
  const hasRedis = !!process.env.REDIS_URL;
  let imageQueue: any;

  if (hasRedis) {
    imageQueue = new Queue('photoshoot', {
      connection: { url: process.env.REDIS_URL }
    });
    
    imageQueue.on('error', (err: any) => {
      console.error('BullMQ Queue Error:', err.message);
    });
    
    // Fix for MISCONF Redis error: Disable write stopping when background save fails
    // This allows the queue to continue working even if disk persistence is failing
    const Redis = (await import('ioredis')).default;
    const redisConfigFixer = new Redis(process.env.REDIS_URL!);
    redisConfigFixer.config('SET', 'stop-writes-on-bgsave-error', 'no')
      .then(() => console.log('✅ Redis write-protection disabled (MISCONF fix)'))
      .catch(err => console.error('❌ Failed to set Redis config:', err))
      .finally(() => redisConfigFixer.quit());
  } else {
    console.warn("REDIS_URL not found. Using in-memory mock queue for development.");
    
    class MockJob {
      id: string;
      data: any;
      progress: number = 0;
      returnvalue: any = null;
      failedReason: string | null = null;
      state: string = 'queued';
      
      constructor(id: string, data: any) {
        this.id = id;
        this.data = data;
      }
      
      async updateProgress(progress: number) {
        this.progress = progress;
      }
      
      async getState() {
        return this.state;
      }
    }

    const jobs = new Map<string, MockJob>();
    
    imageQueue = {
      add: async (name: string, data: any) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(7);
        const job = new MockJob(id, data);
        jobs.set(id, job);
        
        // Process asynchronously
        setTimeout(async () => {
          job.state = 'active';
          try {
            const result = name === 'upscale' ? await processUpscaleJob(job) : await processPhotoshootJob(job);
            job.returnvalue = result;
            job.state = 'completed';
          } catch (err: any) {
            job.failedReason = err.message;
            job.state = 'failed';
          }
        }, 0);
        
        return job;
      },
      getJob: async (id: string) => {
        return jobs.get(id) || null;
      }
    };
  }

  // Helper to read firebase config
  let firebaseConfig: any = null;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.warn("Could not read firebase-applet-config.json");
  }

  let razorpayInstance: Razorpay | null = null;
  const getRazorpay = () => {
    if (!razorpayInstance) {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay credentials missing from environment variables");
      }
      razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
    return razorpayInstance;
  };

  const app = express();

  async function setupApp() {
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    // API routes FIRST
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok" });
    });

    app.get("/api/config", (req, res) => {
      res.json({
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mock"
      });
    });

    app.post("/api/create-order", async (req, res) => {
      try {
        const { planId, amount, currency = "INR" } = req.body;
        
        // Final verification of amount on server side
        // In a real app, you'd fetch the price from a database based on planId
        
        const options = {
          amount: Math.round(amount * 100), // amount in smallest currency unit
          currency,
          receipt: `receipt_${Date.now()}`,
          notes: {
            planId
          }
        };
        
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
          const razorpay = getRazorpay();
          const order = await razorpay.orders.create(options);
          res.json(order);
        } else {
          // Mock order for preview environment
          console.log("RAZORPAY_KEY_ID not found, returning mock order");
          res.json({
            id: `order_mock_${Date.now()}`,
            amount: options.amount,
            currency: options.currency,
          });
        }
      } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ error: "Failed to create order" });
      }
    });

    app.post("/api/verify-payment", async (req, res) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, creditsToAdd } = req.body;
        
        let isValid = false;
        
        if (process.env.RAZORPAY_KEY_SECRET) {
          const body = razorpay_order_id + "|" + razorpay_payment_id;
          const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");
          isValid = expectedSignature === razorpay_signature;
        } else {
          // Mock validation for preview
          isValid = true;
        }

        if (isValid) {
          const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig?.projectId;
          const apiKey = process.env.FIREBASE_API_KEY || firebaseConfig?.apiKey;
          if (projectId && apiKey && userId) {
            try {
              const { planId, amount } = req.body; // Extract additional details sent from frontend
              
              // 1. Update Credits
              await updateUserCredits(projectId, userId, creditsToAdd, apiKey);
              
              // 2. Record Payment History
              const paymentUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/payments?key=${apiKey}`;
              await fetch(paymentUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    userId: { stringValue: userId },
                    orderId: { stringValue: razorpay_order_id },
                    paymentId: { stringValue: razorpay_payment_id },
                    amount: { doubleValue: amount },
                    creditsAdded: { integerValue: creditsToAdd.toString() },
                    planId: { stringValue: planId || "credits_topup" },
                    timestamp: { timestampValue: new Date().toISOString() }
                  }
                })
              });

              // 3. Update User's Active Plan in their profile
              const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=lastPlan&key=${apiKey}`;
              await fetch(userUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    lastPlan: { stringValue: planId || "Basic" }
                  }
                })
              });

            } catch (e) {
              console.error("Failed to update credits or record payment in Firestore", e);
            }
          }
          res.json({ success: true });
        } else {
          res.status(400).json({ success: false, error: "Invalid signature" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Payment verification failed" });
      }
    });

    app.get("/api/env", (req, res) => {
      res.json({
        keys: Object.keys(process.env).filter(k => k.includes("KEY") || k.includes("GEMINI") || k.includes("API") || k.includes("VITE")),
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasApiKey: !!process.env.API_KEY,
        hasViteGeminiKey: !!process.env.VITE_GEMINI_API_KEY
      });
    });

    app.post("/api/analyze", async (req, res) => {
      try {
        console.log('=== ANALYZE ENDPOINT HIT ===');
        const body = req.body;
        
        console.log('📝 Using text model for analysis');
        const rawImage = req.body.image || req.body.base64Image || "";
        const base64Image = String(rawImage).includes(',') ? String(rawImage).split(',')[1] : String(rawImage);
        
        let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

        console.log("Analyze endpoint - API Key prefix:", apiKey ? apiKey.substring(0, 8) + "..." : "none");
        console.log("Analyze endpoint - GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
        console.log("Analyze endpoint - VITE_GEMINI_API_KEY exists:", !!process.env.VITE_GEMINI_API_KEY);

        if (apiKey && (apiKey === process.env.FIREBASE_API_KEY || (firebaseConfig && apiKey === firebaseConfig.apiKey))) {
          return res.status(500).json({ error: "Configuration Error: Your GEMINI_API_KEY is identical to your Firebase API Key. You have accidentally pasted your Firebase key into the Gemini API Key slot. Please generate a real Gemini API key from Google AI Studio (https://aistudio.google.com/app/apikey) and update your Environment Variables." });
        }

        if (!apiKey || apiKey === "TODO_KEYHERE" || apiKey === "") {
          return res.status(500).json({ error: "GEMINI_API_KEY is missing or invalid on the server. Please check your Environment Variables. Make sure you have added GEMINI_API_KEY." });
        }
        
        const promptText = `Analyze this garment image deeply. 
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

        const requestBody = {
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                garmentType: { type: "STRING" },
                gender: { type: "STRING" },
                ageGroup: { type: "STRING" },
                style: { type: "STRING" },
                description: { type: "STRING" },
                matchingSuggestions: { type: "STRING" },
                category: { 
                  type: "STRING",
                  enum: ["top", "bottom", "full_set"]
                },
                complementaryOptions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: { type: "STRING" },
                      description: { type: "STRING" }
                    },
                    required: ["label", "description"]
                  }
                },
                footwearOptions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: { type: "STRING" },
                      description: { type: "STRING" }
                    },
                    required: ["label", "description"]
                  }
                },
                features: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
              required: ["garmentType", "gender", "ageGroup", "style", "description", "category", "complementaryOptions", "footwearOptions"],
            }
          }
        };

        try {
          console.log(`Starting GEMINI 3 FLASH text analysis for uploaded image...`);
          const startTime = Date.now();
          const responseData = await callGeminiWithRetry(
            'gemini-3-flash-preview',
            requestBody,
            25000 // 25 seconds for text analysis
          );
          console.log(`GEMINI 3 FLASH analysis succeeded in ${Date.now() - startTime}ms`);

          const textResult = responseData.text || "{}";
          res.json(JSON.parse(textResult));
        } catch (err: any) {
          console.log(`Gemini Text Analysis Failed: ${err.message}`);
          if (err.message.includes('AI servers are busy') || err.message.includes('timed out')) {
            return res.status(503).json({ error: 'AI servers busy, try again in 2 minutes' });
          }
          throw err;
        }
      } catch (error: any) {
        console.error("Analyze error:", error);
        res.status(500).json({ 
          error: error.message || "Failed to analyze image",
          debug: {
            hasGeminiKey: !!process.env.GEMINI_API_KEY,
            keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "none",
            keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
            isFirebaseKey: process.env.GEMINI_API_KEY === process.env.FIREBASE_API_KEY
          }
        });
      }
    });

    app.post('/api/generate-image', async (req, res) => {
      console.log('=== GENERATE-IMAGE ENDPOINT HIT ===');
      
      if (!WORKER_URL) {
        return res.status(500).json({ error: 'WORKER_URL not configured' });
      }
      
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 200000);
        
        const formattedUrl = WORKER_URL.startsWith('http') ? WORKER_URL : `http://${WORKER_URL}`;
        const workerRes = await fetch(`${formattedUrl}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        const result = await workerRes.json();
        console.log('✅ Worker response received via generate-image endpoint');
        return res.json(result);
        
      } catch (error: any) {
        console.error('❌ generate-image failed:', error.message);
        return res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/upscale-image', async (req, res) => {
      console.log('=== UPSCALE-IMAGE ENDPOINT HIT (SYNC) ===');
      if (!WORKER_URL) {
        return res.status(500).json({ error: 'WORKER_URL not configured' });
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 200000);
        
        const formattedUrl = WORKER_URL.startsWith('http') ? WORKER_URL : `http://${WORKER_URL}`;
        const workerRes = await fetch(`${formattedUrl}/upscale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body),
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        const result = await workerRes.json();
        return res.json(result);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });

    app.post("/api/upscale", async (req, res) => {
      try {
        const { userId, userEmail, imageBase64, quality, isDesign } = req.body;
        
        // Check user has enough coins before queueing
        const ADMIN_EMAILS = ["goawesomiq@gmail.com", "kunalrajput1717@gmail.com"];
        const emailToSafe = (userEmail || "").toLowerCase();
        let isAdmin = ADMIN_EMAILS.includes(emailToSafe);
        const cost = quality === "4k" ? (isDesign ? 3 : 2) : (isDesign ? 2.5 : 1.5); 

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const apiKey = process.env.FIREBASE_API_KEY;

        if (!isAdmin && projectId && apiKey && userId) {
          try {
            const credits = await getUserCredits(projectId, userId, apiKey);
            if (credits < cost) {
              return res.status(400).json({ error: `Insufficient credits. Upscaling requires ${cost} coins. Please purchase more.` });
            }
          } catch (e) {
            console.error("Failed to check credits before queueing upscale:", e);
          }
        }

        const job = await imageQueue.add('upscale', {
          userId,
          userEmail,
          imageBase64,
          quality
        });
        
        res.json({ 
          jobId: job.id,
          status: 'queued'
        });

      } catch (error: any) {
        console.error("Upscale error:", error);
        res.status(500).json({ 
          error: error.message || "Failed to queue image upscale",
        });
      }
    });

    app.post("/api/generate", async (req, res) => {
      try {
        const { userId, userEmail, config, currentPose, prompt, referenceImagesBase64, aspectRatio, quality } = req.body;
        const mainImageBase64 = req.body.mainImageBase64 || req.body.image || req.body.base64Image;
        
        // Check user has enough coins before queueing
        const ADMIN_EMAILS = ["goawesomiq@gmail.com", "kunalrajput1717@gmail.com"];
        const emailToSafe = (userEmail || "").toLowerCase();
        let isAdmin = ADMIN_EMAILS.includes(emailToSafe);
        const cost = quality === "4K" ? 2 : quality === "2K" ? 1.5 : 1;
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const firebaseApiKey = process.env.FIREBASE_API_KEY;

        if (!isAdmin && projectId && firebaseApiKey && userId) {
          try {
            const credits = await getUserCredits(projectId, userId, firebaseApiKey);
            if (credits < cost) {
              return res.status(400).json({ error: `Insufficient credits. This generation requires ${cost} coins. Please purchase more.` });
            }
          } catch (e) {
            console.error("Failed to check credits before queueing:", e);
            // Allow to proceed if we can't check, worker will check again
          }
        }

        const job = await imageQueue.add('generate', {
          userId,
          userEmail,
          config,
          mainImageBase64,
          currentPose,
          prompt,
          referenceImagesBase64,
          aspectRatio,
          quality
        });
        
        res.json({ 
          jobId: job.id,
          status: 'queued'
        });

      } catch (error: any) {
        console.error("Generation error:", error);
        res.status(500).json({ 
          error: error.message || "Failed to queue image generation",
        });
      }
    });

    app.get('/api/status/:jobId', async (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering for SSE
      
      const jobId = req.params.jobId;
      console.log(`SSE: Client connected for job ${jobId}`);

      const job = await imageQueue.getJob(jobId);
      if (!job) {
        console.error(`SSE: Job ${jobId} not found`);
        res.write(`data: ${JSON.stringify({ state: 'failed', error: 'Job not found' })}\n\n`);
        res.end();
        return;
      }
      
      // Send initial state immediately
      const initialState = await job.getState();
      console.log(`SSE: Sending initial state for ${jobId}: ${initialState}`);
      res.write(`data: ${JSON.stringify({ 
        state: initialState, 
        progress: job.progress, 
        failedReason: job.failedReason 
      })}\n\n`);

      if (initialState === 'completed' || initialState === 'failed') {
        res.end();
        return;
      }

      const interval = setInterval(async () => {
        try {
          const currentJob = await imageQueue.getJob(jobId);
          if (!currentJob) {
            clearInterval(interval);
            res.end();
            return;
          }

          const state = await currentJob.getState();
          const progress = currentJob.progress;
          const failedReason = currentJob.failedReason;
          
          res.write(`data: ${JSON.stringify({ state, progress, failedReason })}\n\n`);
          
          if (state === 'completed' || state === 'failed') {
            console.log(`SSE: Job ${jobId} finished with state: ${state}.`);
            clearInterval(interval);
            res.end();
          }
        } catch (e) {
          console.error(`SSE Loop Error for ${jobId}:`, e);
          clearInterval(interval);
          res.end();
        }
      }, 1000);
      
      req.on('close', () => {
        console.log(`SSE: Connection closed for ${jobId}`);
        clearInterval(interval);
      });
    });

    app.get('/api/result/:jobId', async (req, res) => {
      try {
        const jobId = req.params.jobId;
        const job = await imageQueue.getJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ returnvalue: job.returnvalue });
      } catch (error) {
        console.error("Result fetch error:", error);
        res.status(500).json({ error: "Failed to fetch job result" });
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  setupApp();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
