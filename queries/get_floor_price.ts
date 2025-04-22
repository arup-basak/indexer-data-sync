import axios from "axios";
import prisma from "../libs/prisma";

export interface FloorType {
  collection_id: string;
  collection_name: string;
  floor_price_apt: string;
  total_listings: string;
}

interface IResponse {
  data: FloorType[];
}

const get_floor_url = (limit: number, offset: number, time_period: string = "1d") =>
  `https://api.mainnet.aptoslabs.com/v1/analytics/nft/collection/list_by_floor_price?limit=${limit}&offset=${offset}&time_period=${time_period}`;

export const getFloorValues = async (
  limit: number,
  offset: number
): Promise<FloorType[]> => {
  const url = get_floor_url(limit, offset);

  const headers = {
    "content-type": "application/json",
    "X-API-Key": "aptoslabs_5rzM7HdjgUv_P6ahx3wZ7Ah9MousAZQ6QhXavFrasUgAU"
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

export const storeFloorValues = async (floors: FloorType[]) => {
  const floorData = floors.map((floor) => ({
    collection_id: floor.collection_id,
    collection_name: floor.collection_name,
    floor_price_apt: parseFloat(floor.floor_price_apt),
    total_listings: floor.total_listings,
  }));

  const promises = floorData.map((floor) =>
    prisma.collection.upsert({
      create: {
        collection_id: floor.collection_id,
        collection_name: floor.collection_name,
        floor_price_apt: floor.floor_price_apt,
        total_listings: floor.total_listings
      },
      update: {
        floor_price_apt: floor.floor_price_apt,
        total_listings: floor.total_listings
      },
      where: {
        collection_id: floor.collection_id
      }
    })
  );

  return await Promise.all(promises);
};
