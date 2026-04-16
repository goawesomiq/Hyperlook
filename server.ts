import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import { Queue } from 'bullmq';
import { processPhotoshootJob } from './jobProcessor';
import { updateUserCredits } from './firestoreRest';

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
          console.log(`ANALYZE: Received 503. Retrying in ${delays[attempt]}ms...`);
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
      throw error;
    }
  }
  throw new Error('AI servers are busy. Please try again in 2 minutes.');
}

let app: any;

if (process.env.WORKER_MODE === 'true') {
  console.log('Starting in WORKER mode...');
  import('./worker.ts');
} else {

const hasRedis = !!process.env.REDIS_URL;
let imageQueue: any;

if (hasRedis) {
  imageQueue = new Queue('photoshoot', {
    connection: { url: process.env.REDIS_URL }
  });
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
          const result = await processPhotoshootJob(job);
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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_secret",
});

app = express();

async function setupApp() {
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      const options = {
        amount: amount * 100, // amount in smallest currency unit
        currency,
        receipt: `receipt_${Date.now()}`,
      };
      
      if (process.env.RAZORPAY_KEY_ID) {
        const order = await razorpay.orders.create(options);
        res.json(order);
      } else {
        // Mock order for preview environment
        res.json({
          id: `order_mock_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
        });
      }
    } catch (error) {
      console.error(error);
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
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const apiKey = process.env.FIREBASE_API_KEY;
        if (projectId && apiKey && userId) {
          try {
            await updateUserCredits(projectId, userId, creditsToAdd, apiKey);
          } catch (e) {
            console.error("Failed to update credits in Firestore", e);
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
      const { base64Image } = req.body;
      
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
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
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

      const fetchResponse = await fetchWithRetryAndTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }, 60000); // 60 seconds timeout

      const responseData = await fetchResponse.json();
      const textResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      res.json(JSON.parse(textResult));
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

  app.post("/api/generate", async (req, res) => {
    try {
      const { userId, userEmail, config, mainImageBase64, currentPose, prompt, referenceImagesBase64, aspectRatio, quality } = req.body;
      
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
    
    const job = await imageQueue.getJob(req.params.jobId);
    if (!job) {
      res.write(`data: ${JSON.stringify({ state: 'failed', error: 'Job not found' })}\n\n`);
      res.end();
      return;
    }
    
    const interval = setInterval(async () => {
      try {
        const state = await job.getState();
        const progress = job.progress;
        const returnvalue = job.returnvalue;
        const failedReason = job.failedReason;
        
        res.write(`data: ${JSON.stringify({ state, progress, returnvalue, failedReason })}\n\n`);
        
        if (state === 'completed' || state === 'failed') {
          clearInterval(interval);
          res.end();
        }
      } catch (e) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);
    
    req.on('close', () => {
      clearInterval(interval);
    });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

}

export default app;
