import Redis from "ioredis";

// family: 0 lets DNS resolve IPv4 or IPv6. Railway's private network
// (redis.railway.internal) is IPv6, and ioredis defaults to IPv4 only.
export const redis = new Redis(process.env.REDIS_URL!, { family: 0 });
