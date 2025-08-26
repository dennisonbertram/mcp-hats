/**
 * Tool for getting the hierarchical structure of a hat tree
 */

import type { ToolResponse } from '../../types/index.js';
import { hatIdToPretty, getHatLevel } from '../../clients/hats-client.js';
import { queryTreeStructure } from '../../clients/subgraph-client.js';
import { getNetworkConfig } from '../../networks/index.js';

/**
 * Input parameters for get-tree-structure tool
 */
export interface GetTreeStructureInput {
  networkName: string;
  treeId: string;
  maxDepth?: number;
  format?: 'tree' | 'flat' | 'json';
  includeWearers?: boolean;
}

/**
 * Tree node structure
 */
export interface TreeNode {
  id: string;
  prettyId: string;
  name: string;
  level: number;
  isActive: boolean;
  supply?: {
    current: number;
    max: number;
  };
  wearers?: string[];
  wearerCount: number;
  children?: TreeNode[];
}

/**
 * Output data for get-tree-structure tool
 */
export interface GetTreeStructureOutput {
  treeId: string;
  structure: TreeNode;
  flatList?: TreeNode[];
  visualization?: string;
  stats: {
    totalHats: number;
    totalWearers: number;
    maxDepth: number;
    activeHats: number;
    inactiveHats: number;
  };
}

/**
 * Validate input parameters
 */
function validateInput(input: GetTreeStructureInput): { valid: boolean; error?: string } {
  // Validate network
  try {
    getNetworkConfig(input.networkName);
  } catch (error) {
    return { valid: false, error: `Unsupported network: ${input.networkName}` };
  }

  // Validate tree ID format (should be 4 bytes / 8 hex chars)
  const treeIdPattern = /^0x[0-9a-fA-F]{8}$/;
  if (!treeIdPattern.test(input.treeId)) {
    return { valid: false, error: `Invalid tree ID format: ${input.treeId}. Should be 4 bytes hex (e.g., 0x00000001)` };
  }

  // Validate maxDepth
  if (input.maxDepth !== undefined && (input.maxDepth <= 0 || input.maxDepth > 14)) {
    return { valid: false, error: 'Max depth must be between 1 and 14' };
  }

  return { valid: true };
}

/**
 * Build tree structure from flat hat list
 */
function buildTreeStructure(
  hats: any[],
  maxDepth: number,
  includeWearers: boolean
): { root: TreeNode | null; flatList: TreeNode[]; stats: any } {
  const hatMap = new Map<string, TreeNode>();
  const flatList: TreeNode[] = [];
  let totalWearers = 0;
  let maxTreeDepth = 0;
  let activeHats = 0;
  let inactiveHats = 0;

  // First pass: create all nodes
  for (const hat of hats) {
    const level = hat.levelAtLocalTree || getHatLevel(hat.id);
    const isActive = hat.status !== false;
    
    if (isActive) activeHats++;
    else inactiveHats++;

    if (level > maxTreeDepth) maxTreeDepth = level;
    
    const wearerCount = hat.wearers ? hat.wearers.length : 0;
    totalWearers += wearerCount;

    const node: TreeNode = {
      id: hat.id,
      prettyId: hat.prettyId || hatIdToPretty(hat.id),
      name: hat.details || 'Unnamed Hat',
      level,
      isActive,
      wearerCount,
      children: []
    };

    if (hat.maxSupply !== undefined || hat.currentSupply !== undefined) {
      node.supply = {
        current: parseInt(hat.currentSupply || '0'),
        max: parseInt(hat.maxSupply || '0')
      };
    }

    if (includeWearers && hat.wearers) {
      node.wearers = hat.wearers.map((w: any) => w.id || w);
    }

    hatMap.set(hat.id, node);
    flatList.push(node);
  }

  // Second pass: build hierarchy
  let root: TreeNode | null = null;
  
  for (const hat of hats) {
    const node = hatMap.get(hat.id)!;
    
    // Apply maxDepth filter
    if (maxDepth && node.level > maxDepth) {
      // Remove from flat list and skip
      const index = flatList.indexOf(node);
      if (index > -1) flatList.splice(index, 1);
      hatMap.delete(hat.id);
      continue;
    }

    if (hat.admin && hat.admin.id) {
      // This hat has an admin, so it's a child
      const parentNode = hatMap.get(hat.admin.id);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      }
    } else if (node.level === 1) {
      // Top-level hat (no admin)
      root = node;
    }
  }

  // Sort children by ID for consistent ordering
  const sortChildren = (node: TreeNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => a.id.localeCompare(b.id));
      node.children.forEach(sortChildren);
    }
  };

  if (root) {
    sortChildren(root);
  }

  return {
    root,
    flatList,
    stats: {
      totalHats: flatList.length,
      totalWearers,
      maxDepth: Math.min(maxTreeDepth, maxDepth || maxTreeDepth),
      activeHats,
      inactiveHats
    }
  };
}

/**
 * Generate ASCII tree visualization
 */
function generateTreeVisualization(node: TreeNode, prefix = '', isLast = true): string {
  let result = '';
  
  // Add current node
  const connector = isLast ? '└── ' : '├── ';
  const nodeInfo = `${node.name} (${node.prettyId})`;
  const wearerInfo = node.wearerCount > 0 ? ` [${node.wearerCount} wearers]` : '';
  const statusInfo = !node.isActive ? ' [INACTIVE]' : '';
  
  result += prefix + connector + nodeInfo + wearerInfo + statusInfo + '\n';
  
  // Add children
  if (node.children && node.children.length > 0) {
    const extension = isLast ? '    ' : '│   ';
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children!.length - 1;
      result += generateTreeVisualization(child, prefix + extension, isLastChild);
    });
  }
  
  return result;
}

/**
 * Get the hierarchical structure of a hat tree
 */
export async function getTreeStructure(
  input: GetTreeStructureInput
): Promise<ToolResponse<GetTreeStructureOutput>> {
  try {
    // Validate input
    const validation = validateInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: validation.error!,
          code: 'INVALID_INPUT'
        }
      };
    }

    // Set defaults
    const format = input.format || 'json';
    const maxDepth = input.maxDepth || 14; // Hats Protocol max depth
    const includeWearers = input.includeWearers || false;

    // Query tree structure from subgraph
    const treeData = await queryTreeStructure(input.networkName, input.treeId);

    if (!treeData) {
      return {
        success: false,
        error: {
          message: `Tree not found: ${input.treeId}`,
          code: 'TREE_NOT_FOUND'
        }
      };
    }

    // Build tree structure
    const { root, flatList, stats } = buildTreeStructure(
      treeData.hats || [],
      maxDepth,
      includeWearers
    );

    // Handle empty tree
    if (!root && flatList.length === 0) {
      return {
        success: true,
        data: {
          treeId: input.treeId,
          structure: {
            id: input.treeId + '0'.repeat(56),
            prettyId: input.treeId,
            name: 'Empty Tree',
            level: 1,
            isActive: false,
            wearerCount: 0,
            children: []
          },
          stats: {
            totalHats: 0,
            totalWearers: 0,
            maxDepth: 0,
            activeHats: 0,
            inactiveHats: 0
          }
        },
        metadata: {
          network: input.networkName,
          timestamp: Date.now(),
          warning: 'Tree has no hats'
        }
      };
    }

    // If no root found but has hats, create a virtual root
    let finalRoot = root;
    if (!finalRoot && flatList.length > 0) {
      // Find the hat with the lowest level
      const lowestLevel = Math.min(...flatList.map(h => h.level));
      const rootCandidates = flatList.filter(h => h.level === lowestLevel);
      
      if (rootCandidates.length === 1) {
        finalRoot = rootCandidates[0];
      } else {
        // Create a virtual root to hold multiple top-level hats
        finalRoot = {
          id: input.treeId + '0'.repeat(56),
          prettyId: input.treeId,
          name: 'Tree Root',
          level: 0,
          isActive: true,
          wearerCount: 0,
          children: rootCandidates
        };
      }
    }

    // Prepare response based on format
    const responseData: GetTreeStructureOutput = {
      treeId: input.treeId,
      structure: finalRoot!,
      stats
    };

    if (format === 'flat') {
      responseData.flatList = flatList;
    }

    if (format === 'tree') {
      responseData.visualization = finalRoot ? generateTreeVisualization(finalRoot, '', true) : 'Empty tree';
    }

    return {
      success: true,
      data: responseData,
      metadata: {
        network: input.networkName,
        timestamp: Date.now(),
        format
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Failed to get tree structure',
        code: error.code || 'GET_TREE_ERROR',
        details: error
      }
    };
  }
}