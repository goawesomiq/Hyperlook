import { Queue } from 'bullmq';
import Redis from 'ioredis';

async function cleanupRedisJobs() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL environment variable is not set.');
    process.exit(1);
  }

  console.log('Connecting to Redis...');

  const queue = new Queue('photoshoot', {
    connection: { url: redisUrl },
  });

  try {
    console.log('Cleaning up completed jobs...');
    const completedCount = await queue.clean(0, 0, 'completed');
    console.log(`Deleted ${completedCount.length} completed jobs.`);

    console.log('Cleaning up failed jobs...');
    const failedCount = await queue.clean(0, 0, 'failed');
    console.log(`Deleted ${failedCount.length} failed jobs.`);

    const totalDeleted = completedCount.length + failedCount.length;
    console.log(`Done. Total jobs deleted: ${totalDeleted}`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await queue.close();
    console.log('Redis connection closed.');
  }
}

cleanupRedisJobs();
