import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

// Redis connection configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectionName: "bullmq",
};

export const connection = new IORedis(REDIS_CONFIG)

export const queue = (queueName: string) => new Queue(queueName, {
  connection: REDIS_CONFIG,
});

// Create a new worker instance
export const createWorker = (
  queueName: string,
  processor: (job: any) => Promise<any>
) => {
  return new Worker(queueName, processor, {
    connection: REDIS_CONFIG,
  });
};
