/**
 * Subgraph client for querying Hats Protocol data via GraphQL
 */

import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-request';
import { getNetworkConfig, resolveNetworkConfig } from '../networks/index.js';

/**
 * Cache for GraphQL clients
 */
const clientCache = new Map<string, GraphQLClient>();

/**
 * Get or create GraphQL client for a network
 */
export async function getSubgraphClient(networkName: string): Promise<GraphQLClient> {
  const cacheKey = `subgraph-${networkName}`;
  
  // Check cache first
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  
  // Get network configuration
  const networkConfig = getNetworkConfig(networkName);
  const resolvedConfig = await resolveNetworkConfig(networkConfig);
  
  if (!resolvedConfig.subgraphUrl) {
    throw new Error(`No subgraph URL configured for network: ${networkName}`);
  }
  
  // Create GraphQL client
  const client = new GraphQLClient(resolvedConfig.subgraphUrl, {
    headers: {
      // Add API key if needed
    },
  });
  
  // Cache the client
  clientCache.set(cacheKey, client);
  
  return client;
}

// ==================== Query Definitions ====================

/**
 * Query for hat details
 */
export const HAT_DETAILS_QUERY = gql`
  query GetHatDetails($hatId: ID!) {
    hat(id: $hatId) {
      id
      prettyId
      status
      details
      maxSupply
      eligibility
      toggle
      mutable
      imageUri
      createdAt
      levelAtLocalTree
      currentSupply
      tree {
        id
      }
      admin {
        id
        prettyId
      }
      wearers {
        id
      }
      subHats {
        id
        prettyId
        details
      }
    }
  }
`;

/**
 * Query for tree structure
 */
export const TREE_STRUCTURE_QUERY = gql`
  query GetTreeStructure($treeId: ID!) {
    tree(id: $treeId) {
      id
      hats {
        id
        prettyId
        details
        status
        maxSupply
        currentSupply
        levelAtLocalTree
        admin {
          id
        }
        subHats {
          id
        }
        wearers {
          id
        }
      }
      childOfTree {
        id
      }
      linkedToHat {
        id
      }
      parentOfTrees {
        id
      }
    }
  }
`;

/**
 * Query for wearer's hats
 */
export const WEARER_HATS_QUERY = gql`
  query GetWearerHats($wearer: ID!) {
    wearer(id: $wearer) {
      id
      currentHats {
        id
        prettyId
        details
        status
        imageUri
        tree {
          id
        }
      }
    }
  }
`;

/**
 * Query for hat wearers
 */
export const HAT_WEARERS_QUERY = gql`
  query GetHatWearers($hatId: ID!) {
    hat(id: $hatId) {
      id
      wearers {
        id
      }
      currentSupply
    }
  }
`;

/**
 * Query for recent events
 */
export const RECENT_EVENTS_QUERY = gql`
  query GetRecentEvents($first: Int!, $skip: Int) {
    hatCreatedEvents(first: $first, skip: $skip, orderBy: blockNumber, orderDirection: desc) {
      id
      blockNumber
      timestamp
      transactionID
      hat {
        id
        prettyId
      }
      hatDetails
      hatMaxSupply
    }
    hatMintedEvents(first: $first, skip: $skip, orderBy: blockNumber, orderDirection: desc) {
      id
      blockNumber
      timestamp
      transactionID
      hat {
        id
        prettyId
      }
      wearer {
        id
      }
    }
    hatBurnedEvents(first: $first, skip: $skip, orderBy: blockNumber, orderDirection: desc) {
      id
      blockNumber
      timestamp
      transactionID
      hat {
        id
        prettyId
      }
      wearer {
        id
      }
    }
  }
`;

/**
 * Query for tree events
 */
export const TREE_EVENTS_QUERY = gql`
  query GetTreeEvents($treeId: ID!, $first: Int!, $skip: Int) {
    tree(id: $treeId) {
      id
      events(first: $first, skip: $skip, orderBy: blockNumber, orderDirection: desc) {
        ... on HatCreatedEvent {
          id
          blockNumber
          timestamp
          transactionID
          hatDetails
          hatMaxSupply
        }
        ... on HatMintedEvent {
          id
          blockNumber
          timestamp
          transactionID
          wearer {
            id
          }
        }
        ... on HatBurnedEvent {
          id
          blockNumber
          timestamp
          transactionID
          wearer {
            id
          }
        }
        ... on HatStatusChangedEvent {
          id
          blockNumber
          timestamp
          transactionID
          hatNewStatus
        }
      }
    }
  }
`;

/**
 * Query for hats with filters
 */
export const SEARCH_HATS_QUERY = gql`
  query SearchHats($where: Hat_filter, $first: Int!, $skip: Int) {
    hats(where: $where, first: $first, skip: $skip) {
      id
      prettyId
      details
      status
      maxSupply
      currentSupply
      eligibility
      toggle
      mutable
      imageUri
      tree {
        id
      }
    }
  }
`;

/**
 * Query for multiple hats by IDs
 */
export const HATS_BY_IDS_QUERY = gql`
  query GetHatsByIds($ids: [ID!]!) {
    hats(where: { id_in: $ids }) {
      id
      prettyId
      details
      status
      maxSupply
      currentSupply
      eligibility
      toggle
      mutable
      imageUri
      tree {
        id
      }
      wearers {
        id
      }
    }
  }
`;

/**
 * Query for all trees
 */
export const ALL_TREES_QUERY = gql`
  query GetAllTrees($first: Int!, $skip: Int) {
    trees(first: $first, skip: $skip) {
      id
      hats {
        id
      }
    }
  }
`;

// ==================== Query Helper Functions ====================

/**
 * Get hat details from subgraph
 */
export async function queryHatDetails(networkName: string, hatId: string): Promise<any> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(HAT_DETAILS_QUERY, { hatId: hatId.toLowerCase() }) as any;
  return result.hat;
}

/**
 * Get tree structure from subgraph
 */
export async function queryTreeStructure(networkName: string, treeId: string): Promise<any> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(TREE_STRUCTURE_QUERY, { treeId: treeId.toLowerCase() }) as any;
  return result.tree;
}

/**
 * Get wearer's hats from subgraph
 */
export async function queryWearerHats(networkName: string, wearer: string): Promise<any> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(WEARER_HATS_QUERY, { wearer: wearer.toLowerCase() }) as any;
  return result.wearer;
}

/**
 * Get hat wearers from subgraph
 */
export async function queryHatWearers(networkName: string, hatId: string): Promise<any> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(HAT_WEARERS_QUERY, { hatId: hatId.toLowerCase() }) as any;
  return result.hat;
}

/**
 * Search hats with filters
 */
export async function searchHats(
  networkName: string,
  filters: any,
  limit = 100,
  offset = 0
): Promise<any[]> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(SEARCH_HATS_QUERY, {
    where: filters,
    first: limit,
    skip: offset,
  }) as any;
  return result.hats;
}

/**
 * Get recent events
 */
export async function queryRecentEvents(
  networkName: string,
  limit = 50,
  offset = 0
): Promise<any> {
  const client = await getSubgraphClient(networkName);
  return await client.request(RECENT_EVENTS_QUERY, {
    first: limit,
    skip: offset,
  }) as any;
}

/**
 * Get tree events
 */
export async function queryTreeEvents(
  networkName: string,
  treeId: string,
  limit = 50,
  offset = 0
): Promise<any> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(TREE_EVENTS_QUERY, {
    treeId: treeId.toLowerCase(),
    first: limit,
    skip: offset,
  }) as any;
  return result.tree?.events || [];
}

/**
 * Get multiple hats by IDs
 */
export async function queryHatsByIds(networkName: string, hatIds: string[]): Promise<any[]> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(HATS_BY_IDS_QUERY, {
    ids: hatIds.map(id => id.toLowerCase()),
  }) as any;
  return result.hats;
}

/**
 * Get all trees
 */
export async function queryAllTrees(
  networkName: string,
  limit = 100,
  offset = 0
): Promise<any[]> {
  const client = await getSubgraphClient(networkName);
  const result = await client.request(ALL_TREES_QUERY, {
    first: limit,
    skip: offset,
  }) as any;
  return result.trees;
}

/**
 * Clear client cache
 */
export function clearSubgraphCache(): void {
  clientCache.clear();
}