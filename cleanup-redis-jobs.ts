import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function cleanupOldJobs() {
  console.log('--- Starting Redis/BullMQ Cleanup ---');
  
  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  try {
    // We need to identify any queues used in the app. 
    // Looking at the codebase standard, common queue name is 'image-generation' or similar.
    // To be safe, we can try to clean the known ones or list types if possible.
    const queueNames = ['image-generation', 'default'];

    for (const name of queueNames) {
      console.log(`Cleaning queue: ${name}`);
      const queue = new Queue(name, { connection });

      const completed = await queue.getJobs(['completed']);
      const failed = await queue.getJobs(['failed']);

      console.log(`Found ${completed.length} completed jobs and ${failed.length} failed jobs in ${name}.`);

      for (const job of completed) {
        await job.remove();
      }
      for (const job of failed) {
        await job.remove();
      }

      console.log(`Successfully removed old jobs from ${name}.`);
      await queue.close();
    }

    console.log('--- Cleanup Finished Successfully ---');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    connection.disconnect();
    process.exit(0);
  }
}

cleanupOldJobs();
