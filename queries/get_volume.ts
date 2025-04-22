import axios from "axios";
import prisma from "../libs/prisma";
import { fetchUniqueOwners } from "./get_unique_users";

export interface VolumeType {
  collection_id: string;
  collection_name: string;
  total_sales: string;
  total_volume_apt: string;
}

interface IResponse {
  data: VolumeType[];
}

const get_volume_url = (limit: number, offset: number, time_period: string = "1d") =>
  `https://api.mainnet.aptoslabs.com/v1/analytics/nft/collection/list_by_volume?limit=${limit}&offset=${offset}&time_period=${time_period}`;

export const getVolumeValues = async (
  limit: number,
  offset: number
): Promise<VolumeType[]> => {
  const url = get_volume_url(limit, offset);

  const headers = {
    "content-type": "application/json",
    "Authorization": "Bearer aptoslabs_5rzM7HdjgUv_P6ahx3wZ7Ah9MousAZQ6QhXavFrasUgAU"
  };

  const response = await axios.get<IResponse>(url, {
    headers,
  });

  const jsonRes = response.data;
  if (jsonRes.data && jsonRes.data.length > 0) {
    return jsonRes.data;
  }
  return [];
};

export const storeVolumeValues = async (volumes: VolumeType[]) => {
  const volumeData = volumes.map((volume) => ({
    collection_id: volume.collection_id,
    collection_name: volume.collection_name,
    total_sales: volume.total_sales,
    total_volume_apt: volume.total_volume_apt,
  }));

  const promises = volumeData.map(async (volume) => {
    const owners = await fetchUniqueOwners(volume.collection_id);
    return prisma.collection.upsert({
      create: {
        collection_id: volume.collection_id,
        collection_name: volume.collection_name,
        total_sales: volume.total_sales,
        total_volume_apt: parseInt(volume.total_volume_apt),
      },
      update: {
        collection_name: volume.collection_name,
        total_sales: volume.total_sales,
        total_volume_apt: parseInt(volume.total_volume_apt),
        owners: owners
      },
      where: {
        collection_id: volume.collection_id,
      },
    });
  });

  return await Promise.all(promises);
};
