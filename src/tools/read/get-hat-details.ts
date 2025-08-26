/**
 * Tool for getting comprehensive information about a specific hat
 */

import type { ToolResponse, HatId } from '../../types/index.js';
import {
  getHatsClient,
  formatHatId,
  hatIdToPretty,
  prettyToHatId,
  getHatLevel,
  getTreeId,
  isTopHat,
  getParentHatId
} from '../../clients/hats-client.js';
import { queryHatDetails, queryHatWearers } from '../../clients/subgraph-client.js';
import { getNetworkConfig } from '../../networks/index.js';

/**
 * Input parameters for get-hat-details tool
 */
export interface GetHatDetailsInput {
  networkName: string;
  hatId: string;
  includeWearers?: boolean;
}

/**
 * Output data for get-hat-details tool
 */
export interface GetHatDetailsOutput {
  hatId: string;
  prettyId: string;
  details: {
    name: string;
    description?: string;
    imageUri?: string;
  };
  supply: {
    current: number;
    max: number;
    available: number;
    percentageUsed: number;
  };
  status: {
    active: boolean;
    mutable: boolean;
  };
  modules: {
    eligibility?: string;
    toggle?: string;
  };
  tree: {
    treeId: string;
    topHatId: string;
    level: number;
    isTopHat: boolean;
    parentHatId?: string;
  };
  admin?: {
    id: string;
    prettyId: string;
    name?: string;
  };
  subHats?: Array<{
    id: string;
    prettyId: string;
    name?: string;
  }>;
  wearers?: Array<{
    address: string;
    ensName?: string;
  }>;
  metadata?: {
    createdAt?: number;
    lastModified?: number;
    totalWearers?: number;
  };
}

/**
 * Validate input parameters
 */
function validateInput(input: GetHatDetailsInput): { valid: boolean; error?: string } {
  // Validate network
  try {
    getNetworkConfig(input.networkName);
  } catch (error) {
    return { valid: false, error: `Unsupported network: ${input.networkName}` };
  }

  // Validate hat ID format
  const hatIdPattern = /^(0x[0-9a-fA-F]{64}|0x[0-9a-fA-F]{8}(\.[0-9a-fA-F]{4,8})*)$/;
  if (!hatIdPattern.test(input.hatId)) {
    return { valid: false, error: `Invalid hat ID format: ${input.hatId}` };
  }

  return { valid: true };
}

/**
 * Get comprehensive information about a hat
 */
export async function getHatDetails(
  input: GetHatDetailsInput
): Promise<ToolResponse<GetHatDetailsOutput>> {
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

    // Convert hat ID to proper format if needed
    let normalizedHatId: HatId;
    if (input.hatId.includes('.')) {
      normalizedHatId = prettyToHatId(input.hatId);
    } else {
      normalizedHatId = formatHatId(input.hatId);
    }

    // Get Hats client
    const hatsClient = await getHatsClient(input.networkName);

    // Get hat data from SDK
    const hatData = await hatsClient.viewHat(BigInt(normalizedHatId));

    // Check if hat is active
    const isActive = await hatsClient.isActive(BigInt(normalizedHatId));

    // Get tree information
    const treeId = getTreeId(normalizedHatId);
    const topHatId = treeId + '0'.repeat(56);
    const hatLevel = getHatLevel(normalizedHatId);
    const isTop = isTopHat(normalizedHatId);
    const parentId = getParentHatId(normalizedHatId);

    // Initialize response data
    const responseData: GetHatDetailsOutput = {
      hatId: normalizedHatId,
      prettyId: hatIdToPretty(normalizedHatId),
      details: {
        name: hatData.details || 'Unnamed Hat',
        description: hatData.details,
        imageUri: hatData.imageUri
      },
      supply: {
        current: hatData.supply || 0,
        max: hatData.maxSupply || 0,
        available: 0,
        percentageUsed: 0
      },
      status: {
        active: isActive,
        mutable: hatData.mutable || false
      },
      modules: {
        eligibility: hatData.eligibility,
        toggle: hatData.toggle
      },
      tree: {
        treeId,
        topHatId,
        level: hatLevel,
        isTopHat: isTop,
        ...(parentId && { parentHatId: parentId })
      }
    };

    // Calculate supply availability
    if (responseData.supply.max === 0) {
      // 0 max supply means unlimited
      responseData.supply.available = -1; // Indicate unlimited
      responseData.supply.percentageUsed = 0;
    } else {
      responseData.supply.available = Math.max(0, responseData.supply.max - responseData.supply.current);
      responseData.supply.percentageUsed = (responseData.supply.current / responseData.supply.max) * 100;
    }

    // Try to enrich with subgraph data
    let subgraphWarning: string | undefined;
    let totalWearers = 0;

    try {
      const subgraphData = await queryHatDetails(input.networkName, normalizedHatId);

      if (subgraphData) {
        // Update details with subgraph data
        if (subgraphData.details) {
          responseData.details.name = subgraphData.details;
          responseData.details.description = subgraphData.details;
        }
        if (subgraphData.imageUri) {
          responseData.details.imageUri = subgraphData.imageUri;
        }

        // Update supply with more accurate data
        if (subgraphData.currentSupply !== undefined) {
          responseData.supply.current = parseInt(subgraphData.currentSupply);
        }
        if (subgraphData.maxSupply !== undefined) {
          responseData.supply.max = parseInt(subgraphData.maxSupply);
          // Recalculate availability
          if (responseData.supply.max === 0) {
            responseData.supply.available = -1;
            responseData.supply.percentageUsed = 0;
          } else {
            responseData.supply.available = Math.max(0, responseData.supply.max - responseData.supply.current);
            responseData.supply.percentageUsed = (responseData.supply.current / responseData.supply.max) * 100;
          }
        }

        // Add admin information
        if (subgraphData.admin && !isTop) {
          responseData.admin = {
            id: subgraphData.admin.id,
            prettyId: subgraphData.admin.prettyId || hatIdToPretty(subgraphData.admin.id),
            name: subgraphData.admin.details
          };
        }

        // Add sub hats
        if (subgraphData.subHats && subgraphData.subHats.length > 0) {
          responseData.subHats = subgraphData.subHats.map((subHat: any) => ({
            id: subHat.id,
            prettyId: subHat.prettyId || hatIdToPretty(subHat.id),
            name: subHat.details
          }));
        }

        // Add metadata
        responseData.metadata = {
          createdAt: subgraphData.createdAt ? parseInt(subgraphData.createdAt) : undefined,
          totalWearers: subgraphData.wearers ? subgraphData.wearers.length : 0
        };

        totalWearers = subgraphData.wearers ? subgraphData.wearers.length : 0;

        // Add wearers if requested
        if (input.includeWearers && subgraphData.wearers) {
          responseData.wearers = subgraphData.wearers.map((wearer: any) => ({
            address: wearer.id,
            ensName: wearer.ensName // If available from subgraph
          }));
        }
      }
    } catch (error) {
      // Subgraph failed, but we can continue with SDK data
      subgraphWarning = 'Subgraph data unavailable - using on-chain data only';
      console.warn('Subgraph query failed:', error);
    }

    // If no details found, add warning
    if (!hatData.details && !hatData.status) {
      subgraphWarning = (subgraphWarning ? subgraphWarning + '. ' : '') + 
                       'Hat may not exist or has no details set';
    }

    // If includeWearers but no subgraph data, try alternative query
    if (input.includeWearers && !responseData.wearers && !subgraphWarning) {
      try {
        const wearersData = await queryHatWearers(input.networkName, normalizedHatId);
        if (wearersData && wearersData.wearers) {
          responseData.wearers = wearersData.wearers.map((wearer: any) => ({
            address: wearer.id
          }));
          totalWearers = wearersData.wearers.length;
        }
      } catch (error) {
        console.warn('Failed to fetch wearers:', error);
      }
    }

    // Ensure metadata exists if we have wearer count
    if (!responseData.metadata && totalWearers > 0) {
      responseData.metadata = { totalWearers };
    }

    return {
      success: true,
      data: responseData,
      metadata: {
        network: input.networkName,
        timestamp: Date.now(),
        ...(subgraphWarning && { warning: subgraphWarning })
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Failed to get hat details',
        code: error.code || 'GET_DETAILS_ERROR',
        details: error
      }
    };
  }
}