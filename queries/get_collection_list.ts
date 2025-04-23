import { gql } from "graphql-request";
import { client2 as client } from "../libs/graphql";
import prisma from "../libs/prisma";
import { fetchCurrentTokenDataV2 } from "./get_current_token_data_v2";
import { getTokenMetadata } from "../utils/attributes";

interface ICollection {
  collection_id: string;
  collection_data?: {
    collection_name: string;
    uri: string;
  };
}

const query = gql`
  query MyQuery($limit: Int, $offset: Int) {
    current_nft_marketplace_listings(
      limit: $limit
      offset: $offset
      distinct_on: collection_id
    ) {
      collection_id
      collection_data {
        collection_name
        uri
      }
    }
  }
`;

export const getCollectionList = async (limit: number, offset: number) => {
  const response = await client.request<{
    current_nft_marketplace_listings: ICollection[];
  }>(query, { limit, offset });
  return response.current_nft_marketplace_listings;
};

export const storeCollectionList = async (collections: ICollection[]) => {
  const promises = collections.map(async (collection) => {
    const tokenData = await fetchCurrentTokenDataV2(collection.collection_id);
    const attributesPromises = tokenData.map((token) =>
      getTokenMetadata(token)
    );
    const attributesResults = await Promise.all(attributesPromises);

    const token_data_db = tokenData.map((token, index) => ({
      image_url: token.cdn_asset_uris.cdn_image_uri,
      rairity: 0,
      attributes: {
        create: attributesResults[index],
      },
    }));
    return prisma.collection.upsert({
      where: {
        collection_id: collection.collection_id,
      },
      update: {
        collection_name:
          collection.collection_data?.collection_name ?? "NO Data",
        uri: collection.collection_data?.uri ?? "",
        Token: {
          create: token_data_db,
        },
      },
      create: {
        collection_id: collection.collection_id,
        collection_name:
          collection.collection_data?.collection_name ?? "NO Data",
        uri: collection.collection_data?.uri ?? "",
        Token: {
          create: token_data_db,
        },
      },
    });
  });
  await Promise.all(promises);
};
