/**
 * Resource management for Hats Protocol MCP Server
 * Provides access to documentation, network configurations, and other resources
 */

import type { 
  ListResourcesResult,
  ReadResourceResult,
  Resource 
} from '@modelcontextprotocol/sdk/types.js';
import { SUPPORTED_NETWORKS } from '../networks/index.js';

/**
 * Available resources in the Hats Protocol MCP Server
 */
const RESOURCES: Record<string, Resource> = {
  'networks': {
    uri: 'hats://networks',
    name: 'Supported Networks',
    description: 'List of blockchain networks supported by Hats Protocol',
    mimeType: 'application/json'
  },
  'documentation': {
    uri: 'hats://documentation',
    name: 'Hats Protocol Documentation',
    description: 'Links to official Hats Protocol documentation and resources',
    mimeType: 'application/json'
  },
  'contracts': {
    uri: 'hats://contracts',
    name: 'Contract Addresses',
    description: 'Hats Protocol contract addresses for all supported networks',
    mimeType: 'application/json'
  },
  'subgraph-endpoints': {
    uri: 'hats://subgraph-endpoints',
    name: 'Subgraph Endpoints',
    description: 'GraphQL endpoints for querying Hats Protocol data',
    mimeType: 'application/json'
  },
  'examples': {
    uri: 'hats://examples',
    name: 'Usage Examples',
    description: 'Example commands and workflows for common Hats Protocol operations',
    mimeType: 'application/json'
  }
};

/**
 * List all available resources
 */
export async function listResources(): Promise<ListResourcesResult> {
  return {
    resources: Object.values(RESOURCES)
  };
}

/**
 * Read a specific resource by URI
 */
export async function readResource(uri: string): Promise<ReadResourceResult> {
  switch (uri) {
    case 'hats://networks':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              description: 'Blockchain networks where Hats Protocol is deployed',
              networks: Object.entries(SUPPORTED_NETWORKS).map(([key, config]) => ({
                key,
                name: config.name,
                chainId: config.chainId,
                testnet: config.testnet,
                rpcUrl: config.rpcUrl.replace('${ALCHEMY_API_KEY}', '[API_KEY]'),
                explorerUrl: config.explorerUrl,
                subgraphUrl: config.subgraphUrl
              }))
            }, null, 2)
          }
        ]
      };

    case 'hats://documentation':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              description: 'Official Hats Protocol documentation and resources',
              links: {
                'Main Documentation': 'https://docs.hatsprotocol.xyz/',
                'SDK Documentation': 'https://github.com/Hats-Protocol/sdk-v1-core',
                'Subgraph Documentation': 'https://github.com/Hats-Protocol/subgraph',
                'Core Contracts': 'https://github.com/Hats-Protocol/hats-protocol',
                'Module Registry': 'https://github.com/Hats-Protocol/modules-registry',
                'Discord Community': 'https://discord.gg/hatsprotocol'
              }
            }, null, 2)
          }
        ]
      };

    case 'hats://contracts':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              description: 'Hats Protocol V1 contract addresses',
              mainnet: {
                ethereum: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
                polygon: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
                arbitrum: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
                optimism: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
                base: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
                gnosis: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137'
              },
              testnet: {
                sepolia: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
                'base-sepolia': '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137'
              }
            }, null, 2)
          }
        ]
      };

    case 'hats://subgraph-endpoints':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              description: 'GraphQL endpoints for querying Hats Protocol data',
              endpoints: {
                ethereum: 'https://api.studio.thegraph.com/query/55784/hats-v1-ethereum/version/latest',
                polygon: 'https://api.studio.thegraph.com/query/55784/hats-v1-polygon/version/latest',
                arbitrum: 'https://api.studio.thegraph.com/query/55784/hats-v1-arbitrum/version/latest',
                optimism: 'https://api.studio.thegraph.com/query/55784/hats-v1-optimism/version/latest',
                base: 'https://api.studio.thegraph.com/query/55784/hats-v1-base/version/latest',
                gnosis: 'https://api.studio.thegraph.com/query/55784/hats-v1-gnosis/version/latest',
                sepolia: 'https://api.studio.thegraph.com/query/55784/hats-v1-sepolia/version/latest'
              }
            }, null, 2)
          }
        ]
      };

    case 'hats://examples':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              description: 'Example commands for common Hats Protocol operations',
              examples: {
                'Create a new hat': {
                  tool: 'create-hat',
                  args: {
                    networkName: 'ethereum',
                    admin: '0x0000000100000000000000000000000000000000000000000000000000000000',
                    details: 'Engineering Team Lead',
                    maxSupply: 1,
                    eligibility: '0x0000000000000000000000000000000000000000',
                    toggle: '0x0000000000000000000000000000000000000000',
                    mutable: true,
                    imageURI: 'https://example.com/hat-image.png'
                  }
                },
                'Mint a hat to a wearer': {
                  tool: 'mint-hat',
                  args: {
                    networkName: 'ethereum',
                    hatId: '0x0000000100010000000000000000000000000000000000000000000000000000',
                    wearer: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571'
                  }
                },
                'Check if address wears a hat': {
                  tool: 'check-hat-wearer',
                  args: {
                    networkName: 'ethereum',
                    wearer: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571',
                    hatId: '0x0000000100010000000000000000000000000000000000000000000000000000'
                  }
                },
                'Get all hats worn by an address': {
                  tool: 'query-hats-by-wearer',
                  args: {
                    networkName: 'ethereum',
                    wearer: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571',
                    includeDetails: true
                  }
                },
                'Get tree structure': {
                  tool: 'get-tree-structure',
                  args: {
                    networkName: 'ethereum',
                    treeId: '0x00000001',
                    maxDepth: 5
                  }
                }
              }
            }, null, 2)
          }
        ]
      };

    default:
      throw new Error(`Resource not found: ${uri}`);
  }
}