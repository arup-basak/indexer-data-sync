import {
  FloorType,
  getFloorValues,
  storeFloorValues,
} from "../queries/get_floor_price";
import { queue } from "../libs/redis";

const MAX_FETCHING = 100;
const FLOOR_BATCH_QUEUE = "floor-batch-queue";

const floorBatchQueue = queue(FLOOR_BATCH_QUEUE);

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

export const runFloorPrice = async (): Promise<FloorType[]> => {
  console.info("Running floor price fetch...");
  const batchSize = 10;
  const total = MAX_FETCHING;

  try {
    console.info(`Starting floor price fetch with batch size ${batchSize}`);

    const offsets = Array.from(
      { length: Math.ceil(total / batchSize) },
      (_, i) => i * batchSize
    );

    // Process each batch directly
    const batchResults = await Promise.all(
      offsets.map((offset) => processFloorBatch(offset, batchSize))
    );

    const flattenedResults = batchResults.flat();
    console.info(
      `Successfully processed ${flattenedResults.length} floor price items`
    );

    return flattenedResults;
  } catch (error) {
    console.error("Error processing floor price batches:", error);
    throw error;
  }
};
