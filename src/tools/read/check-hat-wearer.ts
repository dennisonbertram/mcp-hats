/**
 * Tool for checking if an address is wearing a specific hat
 */

import type { ToolResponse, HatId } from '../../types/index.js';
import { 
  getHatsClient, 
  formatHatId, 
  hatIdToPretty, 
  getHatLevel, 
  getTreeId,
  prettyToHatId
} from '../../clients/hats-client.js';
import { queryHatDetails } from '../../clients/subgraph-client.js';
import { getNetworkConfig } from '../../networks/index.js';
import { isAddress } from 'viem';

/**
 * Input parameters for check-hat-wearer tool
 */
export interface CheckHatWearerInput {
  networkName: string;
  hatId: string;
  wearer: string;
}

/**
 * Output data for check-hat-wearer tool
 */
export interface CheckHatWearerOutput {
  isWearer: boolean;
  isInGoodStanding: boolean;
  hatDetails: {
    id: string;
    prettyId: string;
    name: string;
    description?: string;
    level: number;
    status: boolean;
  };
  treeInfo: {
    treeId: string;
    topHatId: string;
    adminHat?: {
      id: string;
      prettyId: string;
      name?: string;
    };
    totalHatsInTree?: number;
  };
  metadata?: {
    supply?: {
      current: number;
      max: number;
      percentage: number;
    };
    modules?: {
      eligibility?: string;
      toggle?: string;
    };
    imageUri?: string;
    mutable?: boolean;
    totalWearers?: number;
  };
  summary: string;
}

/**
 * Validate input parameters
 */
function validateInput(input: CheckHatWearerInput): { valid: boolean; error?: string } {
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

  // Validate hat ID format (basic check)
  // Allow both full hex (64 chars) and pretty format (dotted notation)
  const hatIdPattern = /^(0x[0-9a-fA-F]{64}|0x[0-9a-fA-F]{8}(\.[0-9a-fA-F]{4,8})*)$/;
  if (!hatIdPattern.test(input.hatId)) {
    return { valid: false, error: `Invalid hat ID format: ${input.hatId}` };
  }

  return { valid: true };
}

/**
 * Check if an address is wearing a specific hat
 */
export async function checkHatWearer(
  input: CheckHatWearerInput
): Promise<ToolResponse<CheckHatWearerOutput>> {
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
      // Pretty format - convert to full hex
      normalizedHatId = prettyToHatId(input.hatId);
    } else {
      normalizedHatId = formatHatId(input.hatId);
    }

    // Get Hats client
    const hatsClient = await getHatsClient(input.networkName);

    // Check if wearer has the hat
    const isWearer = await hatsClient.isWearerOfHat({
      wearer: input.wearer as `0x${string}`,
      hatId: BigInt(normalizedHatId)
    });

    // Check good standing
    const isInGoodStanding = await hatsClient.isInGoodStanding({
      wearer: input.wearer as `0x${string}`,
      hatId: BigInt(normalizedHatId)
    });

    // Get hat details from SDK
    const hatData = await hatsClient.getHat(BigInt(normalizedHatId));

    // Initialize response data
    const responseData: CheckHatWearerOutput = {
      isWearer,
      isInGoodStanding,
      hatDetails: {
        id: normalizedHatId,
        prettyId: hatIdToPretty(normalizedHatId),
        name: hatData.details || 'Unnamed Hat',
        description: hatData.details,
        level: getHatLevel(normalizedHatId),
        status: hatData.status
      },
      treeInfo: {
        treeId: getTreeId(normalizedHatId),
        topHatId: getTreeId(normalizedHatId) + '0'.repeat(56) // Padded tree ID
      },
      summary: ''
    };

    // Try to enrich with subgraph data
    let subgraphWarning: string | undefined;
    try {
      const subgraphData = await queryHatDetails(input.networkName, normalizedHatId);
      
      if (subgraphData) {
        // Enhance hat details with subgraph data
        if (subgraphData.details) {
          responseData.hatDetails.name = subgraphData.details;
          responseData.hatDetails.description = subgraphData.details;
        }
        
        // Add tree information
        if (subgraphData.tree) {
          responseData.treeInfo.treeId = subgraphData.tree.id;
          if (subgraphData.tree.hats) {
            responseData.treeInfo.totalHatsInTree = subgraphData.tree.hats.length;
          }
        }
        
        // Add admin hat information
        if (subgraphData.admin) {
          responseData.treeInfo.adminHat = {
            id: subgraphData.admin.id,
            prettyId: subgraphData.admin.prettyId || hatIdToPretty(subgraphData.admin.id),
            name: subgraphData.admin.details
          };
        }
        
        // Add metadata
        responseData.metadata = {
          supply: {
            current: parseInt(subgraphData.currentSupply || hatData.supply || '0'),
            max: parseInt(subgraphData.maxSupply || hatData.maxSupply || '0'),
            percentage: 0
          },
          modules: {
            eligibility: subgraphData.eligibility || hatData.eligibility,
            toggle: subgraphData.toggle || hatData.toggle
          },
          imageUri: subgraphData.imageUri || hatData.imageUri,
          mutable: subgraphData.mutable !== undefined ? subgraphData.mutable : hatData.mutable,
          totalWearers: subgraphData.wearers ? subgraphData.wearers.length : undefined
        };
        
        // Calculate supply percentage
        if (responseData.metadata.supply && responseData.metadata.supply.max > 0) {
          responseData.metadata.supply.percentage = 
            (responseData.metadata.supply.current / responseData.metadata.supply.max) * 100;
        }
      }
    } catch (error) {
      // Subgraph failed, but we can continue with SDK data
      subgraphWarning = 'Subgraph data unavailable - using on-chain data only';
      console.warn('Subgraph query failed:', error);
    }

    // Generate summary
    const wearerShort = `${input.wearer.slice(0, 6)}...${input.wearer.slice(-4)}`;
    const hatName = responseData.hatDetails.name;
    
    if (isWearer) {
      if (isInGoodStanding) {
        responseData.summary = `Address ${wearerShort} is wearing the hat "${hatName}" and is in good standing.`;
      } else {
        responseData.summary = `Address ${wearerShort} is wearing the hat "${hatName}" but is not in good standing.`;
      }
    } else {
      responseData.summary = `Address ${wearerShort} is not wearing the hat "${hatName}".`;
    }

    // Add metadata from SDK if not from subgraph
    if (!responseData.metadata) {
      responseData.metadata = {
        supply: {
          current: hatData.supply || 0,
          max: hatData.maxSupply || 0,
          percentage: hatData.maxSupply > 0 ? ((hatData.supply || 0) / hatData.maxSupply) * 100 : 0
        },
        modules: {
          eligibility: hatData.eligibility,
          toggle: hatData.toggle
        },
        imageUri: hatData.imageUri,
        mutable: hatData.mutable
      };
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
        message: error.message || 'Failed to check hat wearer',
        code: error.code || 'CHECK_WEARER_ERROR',
        details: error
      }
    };
  }
}