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
  },
  'tool-documentation': {
    uri: 'hats://tool-documentation',
    name: 'Tool Documentation',
    description: 'Comprehensive documentation for all Hats Protocol MCP tools',
    mimeType: 'application/json'
  },
  'common-patterns': {
    uri: 'hats://common-patterns',
    name: 'Common Patterns',
    description: 'Best practices and common workflow patterns for Hats Protocol operations',
    mimeType: 'application/json'
  },
  'error-handling': {
    uri: 'hats://error-handling',
    name: 'Error Handling Guide',
    description: 'Common errors, their causes, and solutions for Hats Protocol operations',
    mimeType: 'application/json'
  },
  'parameter-formats': {
    uri: 'hats://parameter-formats',
    name: 'Parameter Formats',
    description: 'Required formats and validation rules for Hats Protocol parameters',
    mimeType: 'application/json'
  },
  'real-world-scenarios': {
    uri: 'hats://real-world-scenarios',
    name: 'Real-World Scenarios',
    description: 'Practical examples of Hats Protocol implementation in various organizational contexts',
    mimeType: 'application/json'
  },
  'integration-guide': {
    uri: 'hats://integration-guide',
    name: 'Integration Guide',
    description: 'Guide for integrating Hats Protocol with external systems and applications',
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

    case 'hats://tool-documentation':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getToolDocumentation(), null, 2)
          }
        ]
      };

    case 'hats://common-patterns':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getCommonPatterns(), null, 2)
          }
        ]
      };

    case 'hats://error-handling':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getErrorHandlingGuide(), null, 2)
          }
        ]
      };

    case 'hats://parameter-formats':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getParameterFormats(), null, 2)
          }
        ]
      };

    case 'hats://real-world-scenarios':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getRealWorldScenarios(), null, 2)
          }
        ]
      };

    case 'hats://integration-guide':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getIntegrationGuide(), null, 2)
          }
        ]
      };

    default:
      throw new Error(`Resource not found: ${uri}`);
  }
}

/**
 * Helper functions for generating resource content
 */

function getToolDocumentation() {
  return {
    description: 'Comprehensive documentation for all Hats Protocol MCP tools',
    categories: {
      'read-tools': {
        description: 'Tools for querying Hats Protocol data',
        tools: {
          'check-hat-wearer': {
            purpose: 'Verify if an address is currently wearing a specific hat',
            parameters: {
              networkName: 'Target blockchain network',
              hatId: 'Hat ID in hex format (0x...) or pretty format', 
              wearer: 'Address to check for hat wearing status'
            },
            returns: 'Boolean status with detailed information about hat wearing state',
            commonUse: 'Verify permissions before allowing actions in external systems'
          },
          'get-hat-details': {
            purpose: 'Get comprehensive details about a specific hat including metadata and hierarchy',
            parameters: {
              networkName: 'Target blockchain network',
              hatId: 'Hat ID in hex format or pretty format'
            },
            returns: 'Complete hat information including supply, modules, and current wearers',
            commonUse: 'Understanding role configuration, capacity, and current assignments'
          },
          'query-hats-by-wearer': {
            purpose: 'Find all hats currently worn by a specific address',
            parameters: {
              networkName: 'Target blockchain network',
              wearer: 'Address to find hats for',
              includeInactive: 'Whether to include inactive/burned hats (optional)',
              limit: 'Maximum number of hats to return (optional)'
            },
            returns: 'List of all hats worn by the address, grouped by organization tree',
            commonUse: 'User profile pages, permission audits, role portfolio management'
          },
          'get-tree-structure': {
            purpose: 'Visualize the hierarchical structure of an organization tree',
            parameters: {
              networkName: 'Target blockchain network',
              treeId: 'Tree ID (first 4 bytes of top hat ID)',
              format: 'Output format: json, ascii-tree, or flat (optional)',
              maxDepth: 'Maximum depth to traverse (optional)'
            },
            returns: 'Organization structure in specified format',
            commonUse: 'Org charts, understanding hierarchies, planning role changes'
          }
        }
      },
      'write-tools': {
        description: 'Tools for preparing blockchain transactions to modify Hats Protocol state',
        tools: {
          'prepare-mint-top-hat': {
            purpose: 'Prepare transaction to create a new organization with a top hat',
            parameters: {
              networkName: 'Target blockchain network',
              target: 'Address to receive the top hat',
              details: 'Organization name and description',
              imageURI: 'Optional image URI for the top hat',
              gasEstimateMultiplier: 'Gas estimate multiplier (default: 1.2)'
            },
            returns: 'Prepared transaction data ready for signing and broadcasting',
            commonUse: 'Founding new organizations, starting new governance structures'
          },
          'prepare-create-hat': {
            purpose: 'Prepare transaction to create a new role in an existing organization',
            parameters: {
              networkName: 'Target blockchain network',
              admin: 'Admin hat ID that will control this new role',
              details: 'Role name and description',
              maxSupply: 'Maximum number of wearers for this role',
              eligibility: 'Eligibility module address (optional)',
              toggle: 'Toggle module address (optional)',
              mutable: 'Whether role properties can be changed (optional)',
              imageURI: 'URI for role image/logo (optional)'
            },
            returns: 'Prepared transaction data for role creation',
            commonUse: 'Adding new positions, organizational growth, role specialization'
          },
          'prepare-mint-hat': {
            purpose: 'Prepare transaction to assign a role to an address',
            parameters: {
              networkName: 'Target blockchain network',
              hatId: 'Role to assign (256-bit hex or pretty format)',
              wearer: 'Address to receive the role'
            },
            returns: 'Prepared transaction data for role assignment',
            commonUse: 'Onboarding new members, promoting employees, delegating authority'
          }
        }
      }
    }
  };
}

function getCommonPatterns() {
  return {
    description: 'Common workflow patterns and best practices for Hats Protocol operations',
    patterns: {
      'organization-setup': {
        name: 'New Organization Setup',
        description: 'Complete workflow for creating a new organizational structure',
        steps: [
          'Create Top Hat - Establish organizational root',
          'Create Executive Roles - Set up leadership layer',
          'Create Department Roles - Establish departmental structure', 
          'Create Team Roles - Set up individual contributor positions',
          'Assign Initial Team - Distribute roles to founding members',
          'Verify Structure - Confirm organizational hierarchy'
        ]
      },
      'employee-onboarding': {
        name: 'New Employee Onboarding',
        description: 'Standard process for adding new team members',
        steps: [
          'Identify Required Roles - Understand available positions',
          'Check Role Availability - Verify capacity and requirements',
          'Verify Admin Permissions - Confirm assignment authority',
          'Assign Primary Role - Give employee main position',
          'Assign Additional Roles - Add secondary or committee roles',
          'Verify Assignment - Confirm all roles assigned correctly'
        ]
      }
    }
  };
}

function getErrorHandlingGuide() {
  return {
    description: 'Common errors in Hats Protocol operations and their solutions',
    categories: {
      'permission-errors': {
        'not-authorized': {
          message: 'Not authorized to perform this action',
          causes: ['Insufficient admin rights', 'Inactive admin role', 'Wrong hierarchy level'],
          solutions: ['Verify admin role assignment', 'Check role activity status', 'Request proper permissions']
        },
        'not-eligible': {
          message: 'Address not eligible for this role',
          causes: ['Eligibility module requirements not met', 'Insufficient token balance', 'Missing prerequisite roles'],
          solutions: ['Check eligibility requirements', 'Ensure criteria compliance', 'Assign prerequisite roles first']
        }
      },
      'supply-errors': {
        'max-supply-exceeded': {
          message: 'Role is at maximum capacity',
          causes: ['All role slots filled', 'MaxSupply set too low'],
          solutions: ['Remove inactive assignments', 'Increase maxSupply if mutable', 'Create additional similar roles']
        }
      },
      'transaction-errors': {
        'out-of-gas': {
          message: 'Transaction failed due to insufficient gas',
          causes: ['Gas limit too low', 'Complex operations', 'Network congestion'],
          solutions: ['Increase gas limit', 'Use higher gas multiplier', 'Try during low congestion']
        }
      }
    }
  };
}

function getParameterFormats() {
  return {
    description: 'Required formats and validation rules for Hats Protocol parameters',
    formats: {
      'addresses': {
        format: '42-character hexadecimal string starting with 0x',
        example: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571',
        validation: 'Must match pattern ^0x[a-fA-F0-9]{40}$'
      },
      'hatIds': {
        format: '64-character hexadecimal string (256-bit)',
        example: '0x0000000100010000000000000000000000000000000000000000000000000000',
        validation: 'Must match pattern ^0x[a-fA-F0-9]{64}$'
      },
      'networkNames': {
        format: 'Lowercase string matching supported networks',
        examples: ['ethereum', 'polygon', 'arbitrum', 'base-sepolia'],
        validation: 'Must be lowercase and in supported networks list'
      }
    }
  };
}

function getRealWorldScenarios() {
  return {
    description: 'Practical examples of Hats Protocol implementation in various organizational contexts',
    scenarios: {
      'tech-startup': {
        name: 'Technology Startup',
        size: '15 employees',
        structure: {
          'founder': 'Top hat holder with ultimate authority',
          'executives': 'CTO, COO roles with department oversight',
          'team-leads': 'Senior roles with team management',
          'contributors': 'Individual contributor roles'
        },
        challenges: ['Rapid growth', 'Maintaining culture', 'Investor transparency'],
        solutions: ['Mutable roles', 'Clear documentation', 'Regular reviews']
      },
      'dao-governance': {
        name: 'DAO Governance Structure',
        size: '500+ community members',
        structure: {
          'council': 'Governance council with token-based eligibility',
          'working-groups': 'Specialized groups with nomination-based roles',
          'contributors': 'Community contributors with activity-based roles'
        },
        challenges: ['Balancing decentralization', 'Managing incentives', 'Preventing concentration'],
        solutions: ['Multi-layered governance', 'Automated management', 'Regular distribution']
      }
    }
  };
}

function getIntegrationGuide() {
  return {
    description: 'Guide for integrating Hats Protocol with external systems and applications',
    integrationTypes: {
      'authentication': {
        name: 'Authentication Systems',
        description: 'Using Hats roles for user authentication and authorization',
        patterns: ['Role-based auth', 'Middleware integration', 'Permission mapping']
      },
      'database-sync': {
        name: 'Database Synchronization', 
        description: 'Keeping application databases in sync with role changes',
        patterns: ['Event-driven sync', 'Periodic sync', 'Hybrid approaches']
      },
      'access-control': {
        name: 'Access Control Systems',
        description: 'Implementing role-based access control',
        patterns: ['Permission mapping', 'Resource protection', 'Hierarchical access']
      }
    },
    bestPractices: [
      'Design for blockchain constraints (latency, cost, reliability)',
      'Implement comprehensive error handling and fallbacks',
      'Use caching strategically for performance',
      'Monitor integration health continuously'
    ]
  };
}