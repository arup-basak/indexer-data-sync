import { gql } from "graphql-request";
import { client2 as client } from "../libs/graphql";
import prisma from "../libs/prisma";
import { fetchCurrentTokenDataV2 } from "./get_current_token_data_v2";
import { getTokenMetadata } from "../utils/attributes";
import { calculateNormalizedRarityScore } from "../libs/rairity";
interface ICollection {
  collection_id: string;
  collection_data?: {
    collection_name: string;
    uri: string;
  };
}

const query = gql`
  query MyQuery($limit: Int, $offset: Int) {
    current_nft_marketplace_collection_offers(
      limit: $limit
      offset: $offset
    ) {
      collection_id
      current_collection {
        collection_name
        uri
      }
    }
  }
`;

export const getCollectionList = async (limit: number, offset: number) => {
  const response = await client.request<{
    current_nft_marketplace_collection_offers: ICollection[];
  }>(query, { limit, offset });
  return response.current_nft_marketplace_collection_offers;
};

export const storeCollectionList = async (collections: ICollection[]): Promise<void> => {
  const promises = collections.map(async (collection) => {
    try {
      const tokenData = await fetchCurrentTokenDataV2(collection.collection_id);
      if (!tokenData || tokenData.length === 0) {
        console.warn(`No token data found for collection ${collection.collection_id}`);
        return null;
      }

      const attributesPromises = tokenData.map((token) =>
        getTokenMetadata(token)
      );
      const attributesResults = await Promise.all(attributesPromises);

      const token_data_db = tokenData.map((token, index) => {
        // Safely access cdn_asset_uris with null checks
        const imageUrl = token?.cdn_asset_uris?.cdn_image_uri ?? "";
        
        // Calculate rarity only if we have valid attributes
        const rarity = attributesResults.length > 0 && attributesResults[index]?.length > 0
          ? calculateNormalizedRarityScore(
              index,
              attributesResults.map((attrArr) =>
                Object.fromEntries(
                  attrArr.map((attr) => [attr.trait_type, attr.value])
                )
              ),
              tokenData.length
            )
          : 0;

        return {
          image_url: imageUrl,
          rairity: rarity,
          attributes: {
            create: attributesResults[index] || [],
          },
        };
      });

      prisma.collection.upsert({
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
    } catch (error) {
      console.error(`Error processing collection ${collection.collection_id}:`, error);
      return null;
    }
  });

  // Filter out null results and wait for all promises
  const results = await Promise.all(promises);
  // return results.filter((result) => result !== null);
};
