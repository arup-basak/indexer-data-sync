import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://indexer.mainnet.aptoslabs.com/v1/graphql');
const client2 = new GraphQLClient('https://api.mainnet.aptoslabs.com/nft-aggregator-staging/v1/graphql');

export { client, client2 };