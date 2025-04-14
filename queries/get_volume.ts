import axios from "axios";
import prisma from "../libs/prisma";

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

  return await prisma.volume.createMany({
    data: volumeData,
  });
};
