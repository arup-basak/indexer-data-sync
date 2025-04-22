import { runFloorPrice, processFloorBatch } from "./func/floor";
import { runVolume, processVolumeBatch } from "./func/volume";
import { FloorType } from "./queries/get_floor_price";
import { VolumeType } from "./queries/get_volume";
import jobWrapper from "./utils/job-wrapper";
import { connection, queue } from "./libs/redis";
import { Worker } from "bullmq";

const QUEUE_NAME = "function-executor";
const FLOOR_BATCH_QUEUE = "floor-batch-queue";
const VOLUME_BATCH_QUEUE = "volume-batch-queue";

const functionQueue = queue(QUEUE_NAME);

// Register periodic jobs
async function registerJobs() {
  await functionQueue.add(
    "floor-price",
    { fn: "runFloorPrice" },
    {
      repeat: {
        every: 10000,
      },
    }
  );
  
  await functionQueue.add(
    "volume",
    { fn: "runVolume" },
    {
      repeat: {
        every: 10000,
      },
    }
  );
}

const functions: FunctionMap = { runFloorPrice, runVolume };

type FunctionMap = {
  runFloorPrice: () => Promise<FloorType[]>;
  runVolume: () => Promise<VolumeType[]>;
};

type JobData = {
  fn: keyof FunctionMap;
};

type BatchJobData = {
  offset: number;
  batchSize: number;
};

// Main function worker
const worker = new Worker<JobData, any>(
  QUEUE_NAME,
  async (job) => {
    const { fn } = job.data;
    const functionToRun = functions[fn];

    if (!functionToRun) {
      throw new Error(`Function ${fn} is not registered`);
    }

    // @ts-ignore
    return await jobWrapper(functionToRun);
  },
  { connection }
);

// Floor batch worker
const floorBatchWorker = new Worker<BatchJobData>(
  FLOOR_BATCH_QUEUE,
  async (job) => {
    const { offset, batchSize } = job.data;
    return await jobWrapper(() => processFloorBatch(offset, batchSize));
  },
  { connection }
);

// Volume batch worker
const volumeBatchWorker = new Worker<BatchJobData>(
  VOLUME_BATCH_QUEUE,
  async (job) => {
    const { offset, batchSize } = job.data;
    return await jobWrapper(() => processVolumeBatch(offset, batchSize));
  },
  { connection }
);

// Register jobs and handle events
registerJobs().catch(console.error);

// Event handlers for main worker
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log("Job Failed", err);
});

// Event handlers for batch workers
[floorBatchWorker, volumeBatchWorker].forEach(worker => {
  worker.on("completed", (job) => {
    console.log(`✅ Batch job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.log(`Batch job failed:`, err);
  });
});
