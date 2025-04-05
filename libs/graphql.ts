import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://indexer.mainnet.aptoslabs.com/v1/graphql');

export default client;