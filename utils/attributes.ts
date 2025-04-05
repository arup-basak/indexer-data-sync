import { TokenData } from "../queries/get_current_token_data_v2";
import axios from "axios";

interface Attribute {
  trait_type: string;
  value: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Attribute[];
}

const fetchNFTMetadata = async (url: string): Promise<Attribute[]> => {
  const response = await axios.get<NFTMetadata>(url);
  if (
    "data" in response &&
    "attributes" in response.data &&
    Array.isArray(response.data.attributes)
  ) {
    return response.data.attributes;
  }
  return [];
};

export const getTokenMetadata = async (tokenData: TokenData) => {
  if (tokenData.token_properties) {
    const attributes: Attribute[] = Object.entries(
      tokenData.token_properties
    ).map(([trait_type, value]) => ({
      trait_type,
      value,
    }));

    return attributes;
  }

  if (tokenData.cdn_asset_uris.cdn_json_uri) {
    const url = tokenData.cdn_asset_uris.cdn_json_uri;
    const attributes = await fetchNFTMetadata(url);
    return attributes;
  }

  return [];
};
