import { FloorType, getFloorValues, storeFloorValues } from "../queries/get_floor_price";

const MAX_FETCHING = 100;

export const runFloorPrice = async () => {
  console.info("Running floor price fetch...");
  const batchSize = 10;
  const total = MAX_FETCHING;
  const allValues: FloorType[] = [];

  try {
    console.info(`Starting floor price fetch with batch size ${batchSize}`);

    const offsets = Array.from(
      { length: Math.ceil(total / batchSize) },
      (_, i) => i * batchSize
    );

    for (const offset of offsets) {
      const result = await getFloorValues(batchSize, offset);
      if (result && Array.isArray(result)) {
        allValues.push(...result);
        console.info(`Fetched batch at offset ${offset}, total items: ${allValues.length}`);
      }
    }

    console.info(`Successfully fetched ${allValues.length} floor values`);
    await storeFloorValues(allValues);
    console.info('Successfully stored floor values in database');
    return allValues;
  } catch (error) {
    console.error("Error fetching floor prices:", error);
    throw error;
  }
};
