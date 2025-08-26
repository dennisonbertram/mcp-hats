import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Import resource implementations
import { listResources, readResource } from './resources/index.js';

// Import write tool implementations
import { prepareCreateHat } from './tools/write/prepare-create-hat.js';
import { prepareMintHat } from './tools/write/prepare-mint-hat.js';
import { prepareBurnHat } from './tools/write/prepare-burn-hat.js';
import { prepareTransferHat } from './tools/write/prepare-transfer-hat.js';

/**
 * Create and configure the Hats Protocol MCP server
 */
export async function createServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'hats-protocol-mcp-server',
      version: '1.0.0',
      description: 'Model Context Protocol server for comprehensive Hats Protocol operations including role management, permissions, and analytics'
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // Hat Management Tools - Write (Transaction Preparation)
        {
          name: 'prepare-create-hat',
          description: 'Prepare a transaction to create a new hat in the Hats Protocol hierarchy',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network (e.g., "ethereum", "polygon", "arbitrum")'
              },
              admin: {
                type: 'string',
                description: 'Admin hat ID (256-bit hex) that will control this hat'
              },
              details: {
                type: 'string',
                description: 'Hat name or description'
              },
              maxSupply: {
                type: 'number',
                description: 'Maximum number of wearers for this hat',
                minimum: 1
              },
              eligibility: {
                type: 'string',
                description: 'Eligibility module address (optional, use zero address for none)'
              },
              toggle: {
                type: 'string',
                description: 'Toggle module address (optional, use zero address for none)'
              },
              mutable: {
                type: 'boolean',
                description: 'Whether hat properties can be changed after creation',
                default: true
              },
              imageURI: {
                type: 'string',
                description: 'URI for hat image/logo'
              }
            },
            required: ['networkName', 'admin', 'details', 'maxSupply']
          }
        },
        {
          name: 'prepare-mint-hat',
          description: 'Prepare a transaction to mint (assign) a hat to a wearer',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID to mint (256-bit hex)'
              },
              wearer: {
                type: 'string',
                description: 'Address to receive the hat'
              }
            },
            required: ['networkName', 'hatId', 'wearer']
          }
        },
        {
          name: 'prepare-burn-hat',
          description: 'Prepare a transaction to burn (remove) a hat from a wearer',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID to burn (256-bit hex)'
              },
              wearer: {
                type: 'string',
                description: 'Address to remove the hat from'
              }
            },
            required: ['networkName', 'hatId', 'wearer']
          }
        },
        {
          name: 'prepare-transfer-hat',
          description: 'Prepare a transaction to transfer a hat from one wearer to another',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID to transfer (256-bit hex)'
              },
              from: {
                type: 'string',
                description: 'Current wearer address'
              },
              to: {
                type: 'string',
                description: 'New wearer address'
              }
            },
            required: ['networkName', 'hatId', 'from', 'to']
          }
        },

        // Permission Checking Tools
        {
          name: 'check-hat-wearer',
          description: 'Check if an address is wearing a specific hat',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              wearer: {
                type: 'string',
                description: 'Address to check'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID to check (256-bit hex)'
              }
            },
            required: ['networkName', 'wearer', 'hatId']
          }
        },
        {
          name: 'check-hat-standing',
          description: 'Check if a wearer is in good standing for a hat',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              wearer: {
                type: 'string',
                description: 'Address to check'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID to check (256-bit hex)'
              }
            },
            required: ['networkName', 'wearer', 'hatId']
          }
        },

        // Query Tools
        {
          name: 'get-hat-details',
          description: 'Get detailed information about a hat',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID to query (256-bit hex)'
              },
              includeWearers: {
                type: 'boolean',
                description: 'Include list of current wearers',
                default: false
              }
            },
            required: ['networkName', 'hatId']
          }
        },
        {
          name: 'query-hats-by-wearer',
          description: 'Get all hats worn by an address',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              wearer: {
                type: 'string',
                description: 'Address to query'
              },
              includeDetails: {
                type: 'boolean',
                description: 'Include hat details in response',
                default: true
              }
            },
            required: ['networkName', 'wearer']
          }
        },
        {
          name: 'get-tree-structure',
          description: 'Get the hierarchical structure of a hat tree',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              treeId: {
                type: 'string',
                description: 'Tree ID (first 4 bytes of top hat ID)'
              },
              maxDepth: {
                type: 'number',
                description: 'Maximum depth to traverse',
                default: 10
              }
            },
            required: ['networkName', 'treeId']
          }
        },

        // Network and Configuration Tools
        {
          name: 'list-networks',
          description: 'List all supported blockchain networks for Hats Protocol',
          inputSchema: {
            type: 'object',
            properties: {
              includeTestnets: {
                type: 'boolean',
                description: 'Include testnet networks in the list',
                default: true
              }
            }
          }
        },
        {
          name: 'set-api-key',
          description: 'Set an API key for RPC or block explorer services',
          inputSchema: {
            type: 'object',
            properties: {
              keyName: {
                type: 'string',
                enum: ['ALCHEMY_API_KEY', 'INFURA_API_KEY', 'ETHERSCAN_API_KEY', 'POLYGONSCAN_API_KEY', 'ARBISCAN_API_KEY', 'OPTIMISTIC_ETHERSCAN_API_KEY', 'BASESCAN_API_KEY', 'GNOSISSCAN_API_KEY'],
                description: 'Name of the API key to set'
              },
              value: {
                type: 'string',
                description: 'The API key value'
              }
            },
            required: ['keyName', 'value']
          }
        }
      ]
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // Write Tools - Transaction Preparation
        case 'prepare-create-hat': {
          const result = await prepareCreateHat(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case 'prepare-mint-hat': {
          const result = await prepareMintHat(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case 'prepare-burn-hat': {
          const result = await prepareBurnHat(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case 'prepare-transfer-hat': {
          const result = await prepareTransferHat(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        
        case 'list-networks':
          // Temporary implementation for testing
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  mainnet: [
                    { name: 'Ethereum', chainId: 1 },
                    { name: 'Polygon', chainId: 137 },
                    { name: 'Arbitrum', chainId: 42161 },
                    { name: 'Optimism', chainId: 10 },
                    { name: 'Base', chainId: 8453 },
                    { name: 'Gnosis', chainId: 100 }
                  ],
                  testnet: [
                    { name: 'Sepolia', chainId: 11155111 },
                    { name: 'Base Sepolia', chainId: 84532 }
                  ]
                }, null, 2)
              }
            ]
          };

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool '${name}' not found or not yet implemented`
          );
      }
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }
      
      throw new McpError(
        ErrorCode.InternalError,
        `Error executing tool '${name}': ${error.message}`
      );
    }
  });

  // Handle resource listing
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return await listResources();
  });

  // Handle resource reading
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return await readResource(request.params.uri);
  });

  return server;
}

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  
  // Server will run until interrupted
  console.error('Hats Protocol MCP Server started successfully');
}