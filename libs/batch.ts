import PQueue from "p-queue";
import { withErrorHandling } from "./error";

interface BatchProcessorOptions<T> {
  maxItems: number;
  batchSize: number;
  intervalMs: number;
  fetchBatch: (batchSize: number, offset: number) => Promise<T[]>;
  storeBatch: (items: T[]) => Promise<void>;
  label?: string;
}

export const createThrottledBatchProcessor = <T>({
  maxItems,
  batchSize,
  intervalMs,
  fetchBatch,
  storeBatch,
  label = "Batch",
}: BatchProcessorOptions<T>) => {
  const queue = new PQueue({
    concurrency: 1,
    interval: intervalMs,
    intervalCap: 1,
  });

  const processBatch = async (offset: number) => {
    try {
      const items = await withErrorHandling(
        () => fetchBatch(batchSize, offset),
        `[${label}] Fetching batch`
      );
      if (items && Array.isArray(items)) {
        await withErrorHandling(
          () => storeBatch(items),
          `[${label}] Storing batch`
        );
        console.info(
          `[${label}] Processed offset ${offset}, count: ${items.length}`
        );
        return items;
      }
      return [];
    } catch (error) {
      console.error(`[${label}] Error processing offset ${offset}:`, error);
      throw error;
    }
  };

  const start = async () => {
    console.info(`[${label}] Starting throttled processing...`);
    const totalBatches = Math.ceil(maxItems / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const offset = i * batchSize;
      queue.add(() => processBatch(offset));
    }

    await queue.onIdle();
    console.info(`[${label}] All batches processed.`);
  };

  return { start };
};
