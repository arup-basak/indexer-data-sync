import { getFloorValues, storeFloorValues } from "../queries/get_floor_price";
import PQueue from "p-queue";

const MAX_FETCHING = 1000;
const BATCH_SIZE = 10;
const INTERVAL_MS = 10_000;

const queue = new PQueue({
  concurrency: 1,
  interval: INTERVAL_MS,
  intervalCap: 1,
});

export const processFloorBatch = async (
  batchOffset: number,
  batchSize: number
) => {
  try {
    const result = await getFloorValues(batchSize, batchOffset);
    if (result && Array.isArray(result)) {
      await storeFloorValues(result);
      console.info(
        `Processed and stored batch at offset ${batchOffset}, items: ${result.length}`
      );
      return result;
    }
    return [];
  } catch (error) {
    console.error(
      `Error processing floor batch at offset ${batchOffset}:`,
      error
    );
    throw error;
  }
};

export const startThrottledFloorProcessing = async () => {
  console.info("Starting throttled floor batch processing...");

  const totalBatches = Math.ceil(MAX_FETCHING / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const offset = i * BATCH_SIZE;

    queue.add(() => processFloorBatch(offset, BATCH_SIZE));
  }

  await queue.onIdle();

  console.info("All floor batches processed.");
};
