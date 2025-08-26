/**
 * prepare-create-hat tool
 * Prepares a transaction to create a new hat in the Hats Protocol hierarchy
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
export const CreateHatInputSchema = z.object({
  networkName: z.string().min(1, 'Network name is required'),
  admin: z.string().min(1, 'Admin hat ID is required'),
  details: z.string(),
  maxSupply: z.number().int().min(1, 'Max supply must be at least 1').max(4294967295, 'Max supply exceeds uint32 limit'),
  eligibility: z.string().optional().default('0x0000000000000000000000000000000000000000'),
  toggle: z.string().optional().default('0x0000000000000000000000000000000000000000'),
  mutable: z.boolean().optional().default(true),
  imageURI: z.string().optional().default(''),
  fromAddress: z.string().optional(),
  gasEstimateMultiplier: z.number().optional().default(1.2)
});

export type CreateHatInput = z.infer<typeof CreateHatInputSchema>;

/**
 * Prepare a transaction to create a new hat
 */
export async function prepareCreateHat(input: CreateHatInput): Promise<PreparedTransaction> {
  try {
    // Validate input
    const validatedInput = CreateHatInputSchema.parse(input);
    
    // Get network configuration
    const networkConfig = getNetworkConfig(validatedInput.networkName);
    const resolvedConfig = await resolveNetworkConfig(networkConfig);
    
    // Validate admin hat ID
    let adminHatId: bigint;
    try {
      adminHatId = validateHatId(validatedInput.admin);
    } catch (error) {
      throw new TransactionError(
        'Invalid admin hat ID',
        'INVALID_ADMIN_HAT_ID',
        { admin: validatedInput.admin }
      );
    }
    
    // Validate addresses
    let eligibilityAddress: Address;
    let toggleAddress: Address;
    
    try {
      eligibilityAddress = validateAddress(validatedInput.eligibility);
    } catch (error) {
      throw new TransactionError(
        'Invalid eligibility address',
        'INVALID_ELIGIBILITY_ADDRESS',
        { eligibility: validatedInput.eligibility }
      );
    }
    
    try {
      toggleAddress = validateAddress(validatedInput.toggle);
    } catch (error) {
      throw new TransactionError(
        'Invalid toggle address',
        'INVALID_TOGGLE_ADDRESS',
        { toggle: validatedInput.toggle }
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
    
    // Prepare function arguments
    const args = [
      adminHatId,
      validatedInput.details,
      validatedInput.maxSupply,
      eligibilityAddress,
      toggleAddress,
      validatedInput.mutable,
      validatedInput.imageURI
    ];
    
    // Prepare the transaction
    const preparedTx = await prepareHatsContractCall({
      networkConfig: resolvedConfig,
      functionName: 'createHat',
      args,
      fromAddress,
      gasEstimateMultiplier: validatedInput.gasEstimateMultiplier
    });
    
    // Add specific metadata for create hat
    preparedTx.metadata.description = `Create new hat under admin hat ${validatedInput.admin}`;
    
    return preparedTx;
    
  } catch (error: any) {
    if (error instanceof TransactionError) {
      throw error;
    }
    
    throw new TransactionError(
      `Failed to prepare create hat transaction: ${error.message}`,
      'PREPARATION_ERROR',
      { error: error.message }
    );
  }
}

/**
 * Generate user-friendly instructions for creating a hat
 */
export function generateCreateHatInstructions(
  preparedTx: PreparedTransaction,
  input: CreateHatInput
): string {
  const additionalInfo: Record<string, any> = {
    'Admin Hat ID': input.admin,
    'Hat Details': input.details || '(empty)',
    'Max Supply': input.maxSupply.toString(),
    'Mutable': input.mutable ? 'Yes' : 'No',
    'Eligibility Module': input.eligibility === '0x0000000000000000000000000000000000000000' 
      ? 'None (open eligibility)' 
      : input.eligibility,
    'Toggle Module': input.toggle === '0x0000000000000000000000000000000000000000'
      ? 'None (always active)'
      : input.toggle
  };
  
  if (input.imageURI) {
    additionalInfo['Image URI'] = input.imageURI;
  }
  
  return generateTransactionInstructions(preparedTx, additionalInfo);
}