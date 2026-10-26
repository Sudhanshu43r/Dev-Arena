import { Redis, type RedisOptions } from "ioredis";

const redisUrl =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

export const redisClient =
  globalForRedis.redisClient ?? new Redis(redisUrl, redisOptions);

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redisClient;
}

redisClient.on("connect", () => {
  console.log(" Redis connecting...");
});

redisClient.on("ready", () => {
  console.log(" Redis connected and ready");
});

redisClient.on("error", (err) => {
  console.error(" Redis connection error:", err);
});

export async function connectRedis(): Promise<void> {
  try {
    const ping = await redisClient.ping();
    if (ping === "PONG") {
      console.log(" Redis ping successful");
    }
  } catch (error) {
    console.error(" Failed to connect to Redis:", error);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    console.log(" Redis disconnected gracefully");
  } catch (error) {
    console.error(" Error disconnecting Redis:", error);
  }
}
