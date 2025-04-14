import { VolumeType, getVolumeValues, storeVolumeValues } from "../queries/get_volume";
import { queue } from "../libs/redis";

const MAX_FETCHING = 100;
const VOLUME_BATCH_QUEUE = "volume-batch-queue";

const volumeBatchQueue = queue(VOLUME_BATCH_QUEUE);

export const processVolumeBatch = async (batchOffset: number, batchSize: number) => {
  try {
    const result = await getVolumeValues(batchSize, batchOffset);
    if (result && Array.isArray(result)) {
      await storeVolumeValues(result);
      console.info(`Processed and stored batch at offset ${batchOffset}, items: ${result.length}`);
      return result;
    }
    return [];
  } catch (error) {
    console.error(`Error processing volume batch at offset ${batchOffset}:`, error);
    throw error;
  }
};

export const runVolume = async (): Promise<VolumeType[]> => {
  console.info("Running volume fetch...");
  const batchSize = 10;
  const total = MAX_FETCHING;

  try {
    console.info(`Starting volume fetch with batch size ${batchSize}`);

    const offsets = Array.from(
      { length: Math.ceil(total / batchSize) },
      (_, i) => i * batchSize
    );

    const batchResults = await Promise.all(
      offsets.map(offset => processVolumeBatch(offset, batchSize))
    );

    const flattened = batchResults.flat();
    return flattened;
  } catch (error) {
    console.error("Error processing volume batches:", error);
    throw error;
  }
};
