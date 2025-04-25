import { FloorType } from "./queries/get_floor_price";
import { getVolumeValues, storeVolumeValues, VolumeType } from "./queries/get_volume";
import { getFloorValues, storeFloorValues } from "./queries/get_floor_price";
import { createThrottledBatchProcessor } from "./libs/batch";
import { getCollectionList, storeCollectionList } from "./queries/get_collection_list";

const floorProcessor = createThrottledBatchProcessor<FloorType>({
  maxItems: 1000,
  batchSize: 10,
  intervalMs: 10_00,
  fetchBatch: getFloorValues,
  storeBatch: storeFloorValues,
  label: "FloorPrice",
});

const volumeProcessor = createThrottledBatchProcessor<VolumeType>({
  maxItems: 1000,
  batchSize: 10,
  intervalMs: 10_00,
  fetchBatch: getVolumeValues,
  storeBatch: storeVolumeValues,
  label: "Volume",
});

const collectionProcessor = createThrottledBatchProcessor<any>({
  maxItems: 1000000,
  batchSize: 10,
  intervalMs: 5000,
  fetchBatch: getCollectionList,
  storeBatch: storeCollectionList,
  label: "Collection",
});


// floorProcessor.start();
// volumeProcessor.start();
collectionProcessor.start();
