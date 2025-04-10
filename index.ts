import { runFloorPrice } from "./func/floor";
import jobWrapper from "./utils/job-wrapper";
import { connection, queue } from "./libs/redis";
import { Worker } from "bullmq";

const QUEUE_NAME = "function-executor";
const functionQueue = queue(QUEUE_NAME);

// Register periodic jobs
async function registerJobs() {
  await functionQueue.add(
    "floor-price",
    { fn: "runFloorPrice" },
    {
      repeat: {
        every: 5000, // 5 seconds
      },
    }
  );
}

const functions: FunctionMap = { runFloorPrice };

type FunctionMap = {
  runFloorPrice: typeof runFloorPrice;
};

type JobData = {
  fn: keyof FunctionMap;
};

const worker = new Worker<JobData>(
  QUEUE_NAME,
  async (job) => {
    const { fn } = job.data;
    const functionToRun = functions[fn];

    if (!functionToRun) {
      throw new Error(`Function ${fn} is not registered`);
    }

    return await jobWrapper(functionToRun);
  },
  { connection }
);

// Register jobs and handle events
registerJobs().catch(console.error);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log("Job Failed", err);
});
