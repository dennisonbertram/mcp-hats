/**
 * Prompt management for Hats Protocol MCP Server
 * Provides guided workflows for common Hats Protocol operations
 */

import type { 
  Prompt,
  GetPromptResult,
  ListPromptsResult
} from '@modelcontextprotocol/sdk/types.js';

// Import individual prompt implementations
import { organizationSetupPrompt } from './organization-setup.js';
import { roleManagementPrompt } from './role-management.js';
import { permissionAuditPrompt } from './permission-audit.js';
import { transactionPrepPrompt } from './transaction-prep.js';
import { troubleshootingPrompt } from './troubleshooting.js';

/**
 * Available prompts in the Hats Protocol MCP Server
 */
export const PROMPTS: Record<string, Prompt> = {
  'organization-setup': {
    name: 'organization-setup',
    description: 'Guide through creating a new organizational structure with Hats Protocol',
    arguments: [
      {
        name: 'networkName',
        description: 'Target blockchain network (e.g., "ethereum", "polygon", "arbitrum")',
        required: true
      },
      {
        name: 'organizationName',
        description: 'Name of the organization/DAO being created',
        required: true
      },
      {
        name: 'founderAddress',
        description: 'Address that will receive the top hat and initial control',
        required: true
      },
      {
        name: 'initialRoles',
        description: 'JSON array of initial roles to create (optional)',
        required: false
      }
    ]
  },
  
  'role-management': {
    name: 'role-management',
    description: 'Help with assigning, transferring, and managing organizational roles',
    arguments: [
      {
        name: 'networkName',
        description: 'Target blockchain network',
        required: true
      },
      {
        name: 'operation',
        description: 'Type of operation: "assign", "transfer", "remove", "modify"',
        required: true
      },
      {
        name: 'targetAddress',
        description: 'Address of the person to assign/modify roles for',
        required: false
      },
      {
        name: 'hatId',
        description: 'Specific hat ID to work with (if known)',
        required: false
      },
      {
        name: 'treeId',
        description: 'Organization tree ID to work within',
        required: false
      }
    ]
  },
  
  'permission-audit': {
    name: 'permission-audit',
    description: 'Analyze and audit organizational permissions and role hierarchies',
    arguments: [
      {
        name: 'networkName',
        description: 'Target blockchain network',
        required: true
      },
      {
        name: 'scope',
        description: 'Audit scope: "organization", "individual", "role", "tree"',
        required: true
      },
      {
        name: 'target',
        description: 'Address, hat ID, or tree ID to audit',
        required: true
      },
      {
        name: 'includeInactive',
        description: 'Include inactive/burned hats in audit',
        required: false
      }
    ]
  },
  
  'transaction-prep': {
    name: 'transaction-prep',
    description: 'Help prepare and understand blockchain transactions for Hats operations',
    arguments: [
      {
        name: 'networkName',
        description: 'Target blockchain network',
        required: true
      },
      {
        name: 'operation',
        description: 'Operation type: "create-org", "create-hat", "assign-role", "batch-operations"',
        required: true
      },
      {
        name: 'parameters',
        description: 'JSON object with operation-specific parameters',
        required: false
      }
    ]
  },
  
  'troubleshooting': {
    name: 'troubleshooting',
    description: 'Diagnose and resolve common issues with Hats Protocol operations',
    arguments: [
      {
        name: 'networkName',
        description: 'Target blockchain network',
        required: true
      },
      {
        name: 'issue',
        description: 'Type of issue: "transaction-failed", "role-not-working", "permissions", "gas-estimation"',
        required: true
      },
      {
        name: 'errorDetails',
        description: 'Error message or description of the problem',
        required: false
      },
      {
        name: 'transactionHash',
        description: 'Transaction hash if applicable',
        required: false
      }
    ]
  }
};

/**
 * List all available prompts
 */
export async function listPrompts(): Promise<ListPromptsResult> {
  return {
    prompts: Object.values(PROMPTS)
  };
}

/**
 * Get a specific prompt with generated content
 */
export async function getPrompt(name: string, args?: Record<string, unknown>): Promise<GetPromptResult> {
  switch (name) {
    case 'organization-setup':
      return organizationSetupPrompt(args);
      
    case 'role-management':
      return roleManagementPrompt(args);
      
    case 'permission-audit':
      return permissionAuditPrompt(args);
      
    case 'transaction-prep':
      return transactionPrepPrompt(args);
      
    case 'troubleshooting':
      return troubleshootingPrompt(args);
      
    default:
      throw new Error(`Prompt '${name}' not found`);
  }
}