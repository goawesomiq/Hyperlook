import { Worker } from 'bullmq';
import admin from 'firebase-admin';
import { processPhotoshootJob } from './jobProcessor';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
  } catch (e) {
    console.warn("Failed to initialize Firebase Admin SDK:", e);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

const worker = new Worker('photoshoot', async (job) => {
  return await processPhotoshootJob(job, db);
}, {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' }
});

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

console.log("Worker started");
