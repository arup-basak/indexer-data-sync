import { gql } from "graphql-request";
import { client } from "../libs/graphql";

const getUniqueOwnersQuery = gql`
  query GetUniqueOwners($collectionId: String!) {
    current_collection_ownership_v2_view_aggregate(
      distinct_on: owner_address
      where: { collection_id: { _eq: $collectionId } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

interface UniqueOwnersResponse {
  current_collection_ownership_v2_view_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export async function fetchUniqueOwners(collectionId: string): Promise<number> {
  try {
    const response = await client.request<UniqueOwnersResponse>(
      getUniqueOwnersQuery,
      { collectionId }
    );
    return response.current_collection_ownership_v2_view_aggregate.aggregate
      .count;
  } catch (error) {
    console.error("Error fetching unique owners:", error);
    return 0;
  }
}
