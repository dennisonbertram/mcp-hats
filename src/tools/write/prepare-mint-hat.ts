/**
 * prepare-mint-hat tool
 * Prepares a transaction to mint (assign) a hat to a wearer
 */

import { z } from 'zod';
import type { Address } from 'viem';
import { getNetworkConfig, resolveNetworkConfig } from '../../networks/index.js';
import {
  prepareHatsContractCall,
  validateAddress,
  validateHatId,
  generateTransactionInstructions,
  TransactionError,
  type PreparedTransaction
} from '../../utils/transaction-builder.js';

// Input validation schema
export const MintHatInputSchema = z.object({
  networkName: z.string().min(1, 'Network name is required'),
  hatId: z.string().min(1, 'Hat ID is required'),
  wearer: z.string().optional(), // Single wearer
  wearers: z.array(z.string()).optional(), // Multiple wearers for batch
  fromAddress: z.string().optional(),
  gasEstimateMultiplier: z.number().optional().default(1.2)
}).refine(
  (data) => Boolean(data.wearer) !== Boolean(data.wearers),
  { message: 'Provide either "wearer" (single) or "wearers" (batch), not both' }
);

export type MintHatInput = z.infer<typeof MintHatInputSchema>;

/**
 * Prepare a transaction to mint a hat to one or more wearers
 */
export async function prepareMintHat(input: MintHatInput): Promise<PreparedTransaction> {
  try {
    // Validate input
    const validatedInput = MintHatInputSchema.parse(input);
    
    // Get network configuration
    const networkConfig = getNetworkConfig(validatedInput.networkName);
    const resolvedConfig = await resolveNetworkConfig(networkConfig);
    
    // Validate hat ID
    let hatIdBigInt: bigint;
    try {
      hatIdBigInt = validateHatId(validatedInput.hatId);
    } catch (error) {
      throw new TransactionError(
        'Invalid hat ID',
        'INVALID_HAT_ID',
        { hatId: validatedInput.hatId }
      );
    }
    
    // Validate optional from address
    let fromAddress: Address | undefined;
    if (validatedInput.fromAddress) {
      try {
        fromAddress = validateAddress(validatedInput.fromAddress);
      } catch (error) {
        throw new TransactionError(
          'Invalid from address',
          'INVALID_FROM_ADDRESS',
          { fromAddress: validatedInput.fromAddress }
        );
      }
    }
    
    // Handle single wearer or batch
    let functionName: string;
    let args: any[];
    
    if (validatedInput.wearer) {
      // Single wearer
      let wearerAddress: Address;
      try {
        wearerAddress = validateAddress(validatedInput.wearer);
      } catch (error) {
        throw new TransactionError(
          'Invalid wearer address',
          'INVALID_WEARER_ADDRESS',
          { wearer: validatedInput.wearer }
        );
      }
      
      // Check for zero address
      if (wearerAddress === '0x0000000000000000000000000000000000000000') {
        throw new TransactionError(
          'Cannot mint to zero address',
          'ZERO_ADDRESS',
          { wearer: wearerAddress }
        );
      }
      
      functionName = 'mintHat';
      args = [hatIdBigInt, wearerAddress];
      
    } else if (validatedInput.wearers) {
      // Batch minting
      const wearerAddresses: Address[] = [];
      const uniqueAddresses = new Set<string>();
      
      for (const wearer of validatedInput.wearers) {
        let wearerAddress: Address;
        try {
          wearerAddress = validateAddress(wearer);
        } catch (error) {
          throw new TransactionError(
            'Invalid wearer address in batch',
            'INVALID_WEARER_ADDRESS',
            { wearer }
          );
        }
        
        // Check for zero address
        if (wearerAddress === '0x0000000000000000000000000000000000000000') {
          throw new TransactionError(
            'Cannot mint to zero address',
            'ZERO_ADDRESS',
            { wearer: wearerAddress }
          );
        }
        
        // Check for duplicates
        const normalized = wearerAddress.toLowerCase();
        if (uniqueAddresses.has(normalized)) {
          throw new TransactionError(
            'Duplicate wearer addresses not allowed',
            'DUPLICATE_WEARER',
            { wearer: wearerAddress }
          );
        }
        uniqueAddresses.add(normalized);
        wearerAddresses.push(wearerAddress);
      }
      
      // If only one wearer in array, use regular mintHat
      if (wearerAddresses.length === 1) {
        functionName = 'mintHat';
        args = [hatIdBigInt, wearerAddresses[0]];
      } else {
        // Use batch minting function
        functionName = 'batchMintHats';
        // For batch minting, we need to pass the hat ID for each wearer
        const hatIds = new Array(wearerAddresses.length).fill(hatIdBigInt);
        args = [hatIds, wearerAddresses];
      }
    } else {
      throw new TransactionError(
        'No wearer(s) specified',
        'NO_WEARER',
        {}
      );
    }
    
    // Prepare the transaction
    const preparedTx = await prepareHatsContractCall({
      networkConfig: resolvedConfig,
      functionName,
      args,
      fromAddress,
      gasEstimateMultiplier: validatedInput.gasEstimateMultiplier
    });
    
    // Add specific metadata for mint hat
    const wearerCount = validatedInput.wearers?.length || 1;
    preparedTx.metadata.description = wearerCount > 1
      ? `Mint hat ${validatedInput.hatId} to ${wearerCount} wearers`
      : `Mint hat ${validatedInput.hatId} to wearer`;
    
    return preparedTx;
    
  } catch (error: any) {
    if (error instanceof TransactionError) {
      throw error;
    }
    
    throw new TransactionError(
      `Failed to prepare mint hat transaction: ${error.message}`,
      'PREPARATION_ERROR',
      { error: error.message }
    );
  }
}

/**
 * Generate user-friendly instructions for minting a hat
 */
export function generateMintHatInstructions(
  preparedTx: PreparedTransaction,
  input: MintHatInput
): string {
  const additionalInfo: Record<string, any> = {
    'Hat ID': input.hatId
  };
  
  if (input.wearer) {
    additionalInfo['Wearer'] = input.wearer;
  } else if (input.wearers) {
    additionalInfo['Number of Wearers'] = input.wearers.length.toString();
    if (input.wearers.length <= 5) {
      additionalInfo['Wearers'] = input.wearers.join(', ');
    } else {
      additionalInfo['First 5 Wearers'] = input.wearers.slice(0, 5).join(', ') + '...';
    }
  }
  
  additionalInfo['Operation'] = preparedTx.metadata.functionName === 'batchMintHats' 
    ? 'Batch Mint' 
    : 'Single Mint';
  
  return generateTransactionInstructions(preparedTx, additionalInfo);
}