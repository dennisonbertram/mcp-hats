/**
 * Tool for finding all hats worn by a specific address
 */

import type { ToolResponse } from '../../types/index.js';
import { getHatsClient, hatIdToPretty, getTreeId, getHatLevel } from '../../clients/hats-client.js';
import { queryWearerHats } from '../../clients/subgraph-client.js';
import { getNetworkConfig } from '../../networks/index.js';
import { isAddress } from 'viem';

/**
 * Input parameters for query-hats-by-wearer tool
 */
export interface QueryHatsByWearerInput {
  networkName: string;
  wearer: string;
  includeDetails?: boolean;
  includeInactive?: boolean;
  groupByTree?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Hat information in the response
 */
export interface WearerHatInfo {
  hatId: string;
  prettyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  inGoodStanding?: boolean;
  treeId: string;
  level: number;
  imageUri?: string;
  supply?: {
    current: number;
    max: number;
  };
  modules?: {
    eligibility?: string;
    toggle?: string;
  };
}

/**
 * Output data for query-hats-by-wearer tool
 */
export interface QueryHatsByWearerOutput {
  totalHats: number;
  hats: WearerHatInfo[];
  trees?: Record<string, WearerHatInfo[]>;
  metadata?: {
    activeCount?: number;
    inactiveCount?: number;
    inGoodStandingCount?: number;
    notInGoodStandingCount?: number;
    treeCount?: number;
  };
  summary: string;
}

/**
 * Validate input parameters
 */
function validateInput(input: QueryHatsByWearerInput): { valid: boolean; error?: string } {
  // Validate network
  try {
    getNetworkConfig(input.networkName);
  } catch (error) {
    return { valid: false, error: `Unsupported network: ${input.networkName}` };
  }

  // Validate wearer address
  if (!isAddress(input.wearer)) {
    return { valid: false, error: `Invalid wearer address: ${input.wearer}` };
  }

  // Validate pagination
  if (input.limit !== undefined && input.limit <= 0) {
    return { valid: false, error: 'Limit must be greater than 0' };
  }
  if (input.offset !== undefined && input.offset < 0) {
    return { valid: false, error: 'Offset must be non-negative' };
  }

  return { valid: true };
}

/**
 * Query all hats worn by an address
 */
export async function queryHatsByWearer(
  input: QueryHatsByWearerInput
): Promise<ToolResponse<QueryHatsByWearerOutput>> {
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
    const limit = input.limit || 100;
    const offset = input.offset || 0;
    const groupByTree = input.groupByTree !== false; // Default true
    const includeDetails = input.includeDetails !== false; // Default true

    // Query wearer's hats from subgraph
    const wearerData = await queryWearerHats(input.networkName, input.wearer);

    // Handle case where wearer has no hats or doesn't exist
    if (!wearerData || (!wearerData.currentHats && !wearerData.allHats)) {
      const wearerShort = `${input.wearer.slice(0, 6)}...${input.wearer.slice(-4)}`;
      return {
        success: true,
        data: {
          totalHats: 0,
          hats: [],
          summary: `Address ${wearerShort} is not wearing any hats.`
        },
        metadata: {
          network: input.networkName,
          timestamp: Date.now()
        }
      };
    }

    // Get the appropriate hat list based on includeInactive flag
    const hatsList = input.includeInactive 
      ? (wearerData.allHats || wearerData.currentHats || [])
      : (wearerData.currentHats || []);

    // Apply pagination
    const paginatedHats = hatsList.slice(offset, offset + limit);

    // Get Hats client for good standing checks
    const hatsClient = await getHatsClient(input.networkName);

    // Process each hat
    const processedHats: WearerHatInfo[] = [];
    let goodStandingWarning: string | undefined;
    let activeCount = 0;
    let inactiveCount = 0;
    let inGoodStandingCount = 0;
    let notInGoodStandingCount = 0;

    for (const hat of paginatedHats) {
      const treeId = getTreeId(hat.id);
      const level = getHatLevel(hat.id);
      const isActive = hat.status !== false;

      // Check good standing
      let inGoodStanding: boolean | undefined;
      try {
        inGoodStanding = await hatsClient.isInGoodStanding({
          wearer: input.wearer as `0x${string}`,
          hatId: BigInt(hat.id)
        });
        if (inGoodStanding) {
          inGoodStandingCount++;
        } else {
          notInGoodStandingCount++;
        }
      } catch (error) {
        console.warn(`Failed to check good standing for hat ${hat.id}:`, error);
        goodStandingWarning = 'Failed to check good standing for some hats';
      }

      if (isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }

      const hatInfo: WearerHatInfo = {
        hatId: hat.id,
        prettyId: hat.prettyId || hatIdToPretty(hat.id),
        name: hat.details || 'Unnamed Hat',
        description: hat.details,
        isActive,
        inGoodStanding,
        treeId,
        level,
        ...(hat.imageUri && { imageUri: hat.imageUri })
      };

      // Add additional details if requested
      if (includeDetails) {
        if (hat.maxSupply !== undefined || hat.currentSupply !== undefined) {
          hatInfo.supply = {
            current: parseInt(hat.currentSupply || '0'),
            max: parseInt(hat.maxSupply || '0')
          };
        }
        if (hat.eligibility || hat.toggle) {
          hatInfo.modules = {
            eligibility: hat.eligibility,
            toggle: hat.toggle
          };
        }
      }

      processedHats.push(hatInfo);
    }

    // Group by tree if requested
    let trees: Record<string, WearerHatInfo[]> | undefined;
    let treeCount = 0;

    if (groupByTree) {
      trees = {};
      for (const hat of processedHats) {
        if (!trees[hat.treeId]) {
          trees[hat.treeId] = [];
          treeCount++;
        }
        trees[hat.treeId].push(hat);
      }
    } else {
      // Count unique trees even if not grouping
      const uniqueTrees = new Set(processedHats.map(h => h.treeId));
      treeCount = uniqueTrees.size;
    }

    // Generate summary
    const wearerShort = `${input.wearer.slice(0, 6)}...${input.wearer.slice(-4)}`;
    let summary: string;

    if (processedHats.length === 0) {
      summary = `Address ${wearerShort} is not wearing any hats.`;
    } else if (processedHats.length === 1) {
      summary = `Address ${wearerShort} is wearing 1 hat: "${processedHats[0].name}".`;
    } else {
      summary = `Address ${wearerShort} is wearing ${processedHats.length} hats`;
      if (treeCount > 1) {
        summary += ` across ${treeCount} trees`;
      }
      summary += '.';
      if (inGoodStandingCount > 0 && notInGoodStandingCount > 0) {
        summary += ` ${inGoodStandingCount} in good standing, ${notInGoodStandingCount} not in good standing.`;
      }
    }

    // Prepare response
    const responseData: QueryHatsByWearerOutput = {
      totalHats: processedHats.length,
      hats: processedHats,
      ...(trees && { trees }),
      metadata: {
        activeCount,
        ...(inactiveCount > 0 && { inactiveCount }),
        ...(inGoodStandingCount > 0 && { inGoodStandingCount }),
        ...(notInGoodStandingCount > 0 && { notInGoodStandingCount }),
        treeCount
      },
      summary
    };

    return {
      success: true,
      data: responseData,
      metadata: {
        network: input.networkName,
        timestamp: Date.now(),
        ...(goodStandingWarning && { warning: goodStandingWarning }),
        ...(input.limit !== undefined && {
          pagination: {
            limit,
            offset,
            hasMore: hatsList.length > offset + limit
          }
        })
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error.message || 'Failed to query hats by wearer',
        code: error.code || 'QUERY_ERROR',
        details: error
      }
    };
  }
}