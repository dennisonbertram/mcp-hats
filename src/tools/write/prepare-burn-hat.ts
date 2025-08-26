/**
 * prepare-burn-hat tool
 * Prepares a transaction to burn (remove) a hat from a wearer
 * Supports both self-renouncing and admin removal
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
export const BurnHatInputSchema = z.object({
  networkName: z.string().min(1, 'Network name is required'),
  hatId: z.string().min(1, 'Hat ID is required'),
  wearer: z.string().min(1, 'Wearer address is required'),
  fromAddress: z.string().optional(),
  adminBurn: z.boolean().optional().default(false),
  gasEstimateMultiplier: z.number().optional().default(1.2)
});

export type BurnHatInput = z.infer<typeof BurnHatInputSchema>;

/**
 * Prepare a transaction to burn/remove a hat from a wearer
 * Uses renounceHat for self-removal or setHatWearerStatus for admin removal
 */
export async function prepareBurnHat(input: BurnHatInput): Promise<PreparedTransaction> {
  try {
    // Validate input
    const validatedInput = BurnHatInputSchema.parse(input);
    
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
    
    // Validate wearer address
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
    
    // Determine which function to use based on who is removing the hat
    let functionName: string;
    let args: any[];
    let description: string;
    
    // Check if this is a self-renounce or admin burn
    const isSelfRenounce = !fromAddress || 
                          fromAddress.toLowerCase() === wearerAddress.toLowerCase();
    
    if (isSelfRenounce && !validatedInput.adminBurn) {
      // Self-renouncing: wearer is renouncing their own hat
      functionName = 'renounceHat';
      args = [hatIdBigInt];
      description = `Wearer renouncing hat ${validatedInput.hatId}`;
      
      // Use wearer as from address for self-renounce
      fromAddress = wearerAddress;
    } else {
      // Admin burn: admin is removing the hat from the wearer
      // Uses setHatWearerStatus to set eligible=false and standing=false
      functionName = 'setHatWearerStatus';
      args = [
        hatIdBigInt,
        wearerAddress,
        false, // eligible = false (removes hat)
        false  // standing = false (not in good standing)
      ];
      description = `Remove hat ${validatedInput.hatId} from wearer ${validatedInput.wearer}`;
    }
    
    // Prepare the transaction
    const preparedTx = await prepareHatsContractCall({
      networkConfig: resolvedConfig,
      functionName,
      args,
      fromAddress,
      gasEstimateMultiplier: validatedInput.gasEstimateMultiplier
    });
    
    // Update description in metadata
    preparedTx.metadata.description = description;
    
    return preparedTx;
    
  } catch (error: any) {
    if (error instanceof TransactionError) {
      throw error;
    }
    
    throw new TransactionError(
      `Failed to prepare burn hat transaction: ${error.message}`,
      'PREPARATION_ERROR',
      { error: error.message }
    );
  }
}

/**
 * Generate user-friendly instructions for burning/removing a hat
 */
export function generateBurnHatInstructions(
  preparedTx: PreparedTransaction,
  input: BurnHatInput
): string {
  const isSelfRenounce = preparedTx.metadata.functionName === 'renounceHat';
  
  const additionalInfo: Record<string, any> = {
    'Hat ID': input.hatId,
    'Wearer': input.wearer,
    'Operation Type': isSelfRenounce ? 'Self-Renounce' : 'Admin Removal',
    'Function': preparedTx.metadata.functionName
  };
  
  if (!isSelfRenounce && input.fromAddress) {
    additionalInfo['Admin Address'] = input.fromAddress;
  }
  
  const instructions = generateTransactionInstructions(preparedTx, additionalInfo);
  
  // Add specific warnings
  const warnings = [
    '',
    '## ⚠️ Important Notes',
    ''
  ];
  
  if (isSelfRenounce) {
    warnings.push(
      '- This action is irreversible - the wearer is voluntarily renouncing their hat',
      '- The wearer will lose all permissions associated with this hat',
      '- Ensure this transaction is signed by the wearer address'
    );
  } else {
    warnings.push(
      '- This action will forcibly remove the hat from the wearer',
      '- Only authorized admins can perform this action',
      '- The wearer will lose all permissions associated with this hat',
      '- Ensure you have admin permissions for this hat hierarchy'
    );
  }
  
  return instructions + '\n' + warnings.join('\n');
}