import Redis from 'ioredis';

async function fixRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('REDIS_URL not set');
    return;
  }

  try {
    const redis = new Redis(redisUrl);
    console.log('Connecting to Redis...');
    
    const result = await redis.config('SET', 'stop-writes-on-bgsave-error', 'no');
    console.log('Result of config set:', result);
    
    await redis.quit();
  } catch (error) {
    console.error('Failed to fix Redis:', error);
  }
}

fixRedis();
