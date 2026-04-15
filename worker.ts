import { Worker } from 'bullmq';
import { processPhotoshootJob } from './jobProcessor';

const worker = new Worker('photoshoot', async (job) => {
  return await processPhotoshootJob(job);
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
