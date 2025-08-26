/**
 * prepare-mint-top-hat tool
 * Prepares a transaction to create a new hat tree with a top hat in the Hats Protocol
 */

import { z } from 'zod';
import type { Address } from 'viem';
import { getNetworkConfig, resolveNetworkConfig } from '../../networks/index.js';
import {
  prepareHatsContractCall,
  validateAddress,
  generateTransactionInstructions,
  TransactionError,
  type PreparedTransaction
} from '../../utils/transaction-builder.js';

// Input validation schema
export const MintTopHatInputSchema = z.object({
  networkName: z.string().min(1, 'Network name is required'),
  target: z.string().min(1, 'Target address is required'),
  details: z.string(),
  imageURI: z.string().optional().default(''),
  fromAddress: z.string().optional(),
  gasEstimateMultiplier: z.number().optional().default(1.2)
});

export type MintTopHatInput = z.infer<typeof MintTopHatInputSchema>;

/**
 * Prepare a transaction to mint a new top hat (create a new hat tree)
 */
export async function prepareMintTopHat(input: MintTopHatInput): Promise<PreparedTransaction> {
  try {
    // Validate input
    const validatedInput = MintTopHatInputSchema.parse(input);
    
    // Get network configuration
    const networkConfig = getNetworkConfig(validatedInput.networkName);
    const resolvedConfig = await resolveNetworkConfig(networkConfig);
    
    // Validate target address
    let targetAddress: Address;
    try {
      targetAddress = validateAddress(validatedInput.target);
    } catch (error) {
      throw new TransactionError(
        'Invalid target address',
        'INVALID_TARGET_ADDRESS',
        { target: validatedInput.target }
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
    
    // Prepare function arguments for mintTopHat
    // mintTopHat(address _target, string calldata _details, string calldata _imageURI)
    const args = [
      targetAddress,
      validatedInput.details,
      validatedInput.imageURI
    ];
    
    // Prepare the transaction
    const preparedTx = await prepareHatsContractCall({
      networkConfig: resolvedConfig,
      functionName: 'mintTopHat',
      args,
      fromAddress,
      gasEstimateMultiplier: validatedInput.gasEstimateMultiplier
    });
    
    // Add specific metadata for mint top hat
    preparedTx.metadata.description = `Create new hat tree with top hat for ${validatedInput.target}`;
    
    return preparedTx;
    
  } catch (error: any) {
    if (error instanceof TransactionError) {
      throw error;
    }
    
    throw new TransactionError(
      `Failed to prepare mint top hat transaction: ${error.message}`,
      'PREPARATION_ERROR',
      { error: error.message }
    );
  }
}

/**
 * Generate user-friendly instructions for minting a top hat
 */
export function generateMintTopHatInstructions(
  preparedTx: PreparedTransaction,
  input: MintTopHatInput
): string {
  const additionalInfo: Record<string, any> = {
    'Target Address': input.target,
    'Tree/Organization Details': input.details || '(empty)',
    'Operation': 'Create New Hat Tree'
  };
  
  if (input.imageURI) {
    additionalInfo['Image URI'] = input.imageURI;
  }
  
  additionalInfo['Note'] = 'This will create an entirely new hat tree. The target address will receive the top hat.';
  
  return generateTransactionInstructions(preparedTx, additionalInfo);
}