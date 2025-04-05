import { gql } from "graphql-request";
import client from "../libs/graphql";

export interface TokenData {
    token_data_id: string;
    token_name: string;
    cdn_asset_uris: {
      cdn_image_uri: string;
      cdn_json_uri: string | null;
      animation_optimizer_retry_count: number;
      asset_uri: string;
      cdn_animation_uri: string | null;
      image_optimizer_retry_count: number;
      json_parser_retry_count: number;
      raw_animation_uri: string | null;
      raw_image_uri: string | null;
    };
    token_properties?: {
      [key: string]: string;
    };
    token_standard?: string;
    token_uri?: string;
    supply?: string | null;
    maximum?: string | null;
    is_fungible_v2?: boolean;
    is_deleted_v2?: boolean | null;
    description?: string;
    decimals?: number;
  }

const current_token_data_v2 = gql`
  query GetCurrentTokenDataV2($collectionId: String!) {
    current_token_datas_v2(where: { collection_id: { _eq: $collectionId } }) {
      token_data_id
      token_name
      cdn_asset_uris {
        cdn_image_uri
        cdn_animation_uri
        asset_uri
        animation_optimizer_retry_count
        cdn_json_uri
        image_optimizer_retry_count
        json_parser_retry_count
        raw_animation_uri
        raw_image_uri
      }
      token_properties
      token_standard
      token_uri
      supply
      maximum
      last_transaction_version
      last_transaction_timestamp
      largest_property_version_v1
      is_fungible_v2
      is_deleted_v2
      description
      decimals
    }
  }
`;

export async function fetchCurrentTokenDataV2(collectionId: string) {
  try {
    const response = await client.request<{current_token_datas_v2: TokenData[]}>(current_token_data_v2, {
      collectionId,
    });
    return response.current_token_datas_v2;
  } catch (error) {
    console.error("Error fetching current token data v2:", error);
    throw error;
  }
}
