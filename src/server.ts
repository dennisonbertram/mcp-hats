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

// Import read-only tool implementations
import { checkHatWearer } from './tools/read/check-hat-wearer.js';
import { getHatDetails } from './tools/read/get-hat-details.js';
import { queryHatsByWearer } from './tools/read/query-hats-by-wearer.js';
import { getTreeStructure } from './tools/read/get-tree-structure.js';

// Import write tool implementations
import { prepareCreateHat } from './tools/write/prepare-create-hat.js';
import { prepareMintTopHat } from './tools/write/prepare-mint-top-hat.js';
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
      description: 'Model Context Protocol server for Hats Protocol operations - role management, permissions, and organizational structures on EVM chains'
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
        // Read Tools
        {
          name: 'check-hat-wearer',
          description: 'Check if an address is currently wearing a specific hat and in good standing',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network (e.g., "ethereum", "polygon", "arbitrum")'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID in hex format (0x...) or pretty format (0x00000001.0001.0001)'
              },
              wearer: {
                type: 'string',
                description: 'Address to check for hat wearing status'
              }
            },
            required: ['networkName', 'hatId', 'wearer']
          }
        },
        {
          name: 'get-hat-details',
          description: 'Get comprehensive details about a specific hat including metadata, supply, modules, and hierarchy',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              hatId: {
                type: 'string',
                description: 'Hat ID in hex format (0x...) or pretty format (0x00000001.0001.0001)'
              }
            },
            required: ['networkName', 'hatId']
          }
        },
        {
          name: 'query-hats-by-wearer',
          description: 'Find all hats currently worn by a specific address, grouped by tree with metadata',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              wearer: {
                type: 'string',
                description: 'Address to find hats for'
              },
              includeInactive: {
                type: 'boolean',
                description: 'Whether to include inactive or burned hats',
                default: false
              },
              limit: {
                type: 'number',
                description: 'Maximum number of hats to return (pagination)',
                default: 50,
                minimum: 1,
                maximum: 200
              }
            },
            required: ['networkName', 'wearer']
          }
        },
        {
          name: 'get-tree-structure',
          description: 'Visualize the hierarchical structure of a hat tree with multiple output formats',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network'
              },
              treeId: {
                type: 'string',
                description: 'Tree ID (first 4 bytes of top hat ID, e.g., "0x00000001")'
              },
              format: {
                type: 'string',
                enum: ['json', 'ascii-tree', 'flat'],
                description: 'Output format for tree visualization',
                default: 'ascii-tree'
              },
              maxDepth: {
                type: 'number',
                description: 'Maximum depth to traverse (limits large trees)',
                default: 10,
                minimum: 1,
                maximum: 20
              }
            },
            required: ['networkName', 'treeId']
          }
        },

        // Write Tools - Transaction Preparation
        {
          name: 'prepare-mint-top-hat',
          description: 'Prepare a transaction to create an entirely new hat tree with a top hat',
          inputSchema: {
            type: 'object',
            properties: {
              networkName: {
                type: 'string',
                description: 'Target blockchain network (e.g., "ethereum", "polygon", "arbitrum")'
              },
              target: {
                type: 'string',
                description: 'Address to receive the top hat'
              },
              details: {
                type: 'string',
                description: 'Tree/organization name and description'
              },
              imageURI: {
                type: 'string',
                description: 'Optional image URI for the top hat'
              },
              fromAddress: {
                type: 'string',
                description: 'Optional sender address for gas estimation'
              },
              gasEstimateMultiplier: {
                type: 'number',
                description: 'Gas estimate multiplier (default: 1.2)',
                default: 1.2
              }
            },
            required: ['networkName', 'target', 'details']
          }
        },
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
                description: 'Hat ID to mint (256-bit hex or pretty format)'
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
                description: 'Hat ID to burn (256-bit hex or pretty format)'
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
                description: 'Hat ID to transfer (256-bit hex or pretty format)'
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

        // Network and Configuration Tools
        {
          name: 'list-networks',
          description: 'List all supported blockchain networks with their configurations',
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
          description: 'Set an API key for RPC or subgraph services (stored securely)',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                enum: ['alchemy', 'infura', 'thegraph'],
                description: 'Service to set API key for'
              },
              apiKey: {
                type: 'string',
                description: 'API key value'
              }
            },
            required: ['service', 'apiKey']
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
        // Read Tools
        case 'check-hat-wearer': {
          const result = await checkHatWearer(args as any);
          if (result.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: result.data!
                }
              ]
            };
          } else {
            throw new McpError(
              ErrorCode.InternalError,
              result.error?.message || 'Tool execution failed'
            );
          }
        }
          
        case 'get-hat-details': {
          const result = await getHatDetails(args as any);
          if (result.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: result.data!
                }
              ]
            };
          } else {
            throw new McpError(
              ErrorCode.InternalError,
              result.error?.message || 'Tool execution failed'
            );
          }
        }
          
        case 'query-hats-by-wearer': {
          const result = await queryHatsByWearer(args as any);
          if (result.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: result.data!
                }
              ]
            };
          } else {
            throw new McpError(
              ErrorCode.InternalError,
              result.error?.message || 'Tool execution failed'
            );
          }
        }
          
        case 'get-tree-structure': {
          const result = await getTreeStructure(args as any);
          if (result.success) {
            return {
              content: [
                {
                  type: 'text',
                  text: result.data!
                }
              ]
            };
          } else {
            throw new McpError(
              ErrorCode.InternalError,
              result.error?.message || 'Tool execution failed'
            );
          }
        }

        // Write Tools - Transaction Preparation
        case 'prepare-mint-top-hat': {
          const result = await prepareMintTopHat(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, (_key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2)
              }
            ]
          };
        }

        case 'prepare-create-hat': {
          const result = await prepareCreateHat(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, (_key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2)
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
                text: JSON.stringify(result, (_key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2)
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
                text: JSON.stringify(result, (_key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2)
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
                text: JSON.stringify(result, (_key, value) => 
                  typeof value === 'bigint' ? value.toString() : value, 2)
              }
            ]
          };
        }
        
        case 'list-networks': {
          // Temporary implementation for testing
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  mainnet: [
                    'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'gnosis'
                  ],
                  testnet: [
                    'sepolia', 'base-sepolia'
                  ]
                }, null, 2)
              }
            ]
          };
        }

        case 'set-api-key': {
          // Temporary implementation
          return {
            content: [
              {
                type: 'text',
                text: `API key for ${(args as any).service} set successfully (this is a placeholder implementation)`
              }
            ]
          };
        }

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

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await listResources();
    return { resources };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = await readResource(uri);
    
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: content
        }
      ]
    };
  });

  return server;
}

/**
 * Start the server with stdio transport
 */
export async function startServer(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error('Hats Protocol MCP server started on stdio');
}