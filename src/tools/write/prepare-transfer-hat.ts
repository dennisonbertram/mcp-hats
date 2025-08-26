/**
 * prepare-transfer-hat tool
 * Prepares a transaction to transfer a hat from one address to another
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
export const TransferHatInputSchema = z.object({
  networkName: z.string().min(1, 'Network name is required'),
  hatId: z.string().min(1, 'Hat ID is required'),
  from: z.string().min(1, 'From address is required'),
  to: z.string().min(1, 'To address is required'),
  fromAddress: z.string().optional(), // Transaction sender (if different from 'from')
  gasEstimateMultiplier: z.number().optional().default(1.2)
});

export type TransferHatInput = z.infer<typeof TransferHatInputSchema>;

/**
 * Prepare a transaction to transfer a hat between addresses
 */
export async function prepareTransferHat(input: TransferHatInput): Promise<PreparedTransaction> {
  try {
    // Validate input
    const validatedInput = TransferHatInputSchema.parse(input);
    
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
    
    // Validate from address
    let fromWearerAddress: Address;
    try {
      fromWearerAddress = validateAddress(validatedInput.from);
    } catch (error) {
      throw new TransactionError(
        'Invalid from address',
        'INVALID_FROM_ADDRESS',
        { from: validatedInput.from }
      );
    }
    
    // Validate to address
    let toWearerAddress: Address;
    try {
      toWearerAddress = validateAddress(validatedInput.to);
    } catch (error) {
      throw new TransactionError(
        'Invalid to address',
        'INVALID_TO_ADDRESS',
        { to: validatedInput.to }
      );
    }
    
    // Check for zero addresses
    if (fromWearerAddress === '0x0000000000000000000000000000000000000000') {
      throw new TransactionError(
        'Cannot transfer from zero address',
        'ZERO_ADDRESS_FROM',
        { from: fromWearerAddress }
      );
    }
    
    if (toWearerAddress === '0x0000000000000000000000000000000000000000') {
      throw new TransactionError(
        'Cannot transfer to zero address',
        'ZERO_ADDRESS_TO',
        { to: toWearerAddress }
      );
    }
    
    // Check if transferring to same address
    if (fromWearerAddress.toLowerCase() === toWearerAddress.toLowerCase()) {
      throw new TransactionError(
        'Cannot transfer to same address',
        'SAME_ADDRESS',
        { from: fromWearerAddress, to: toWearerAddress }
      );
    }
    
    // Validate optional transaction sender address
    let transactionSender: Address | undefined;
    if (validatedInput.fromAddress) {
      try {
        transactionSender = validateAddress(validatedInput.fromAddress);
      } catch (error) {
        throw new TransactionError(
          'Invalid transaction sender address',
          'INVALID_SENDER_ADDRESS',
          { fromAddress: validatedInput.fromAddress }
        );
      }
    } else {
      // If not specified, assume the 'from' wearer is sending the transaction
      transactionSender = fromWearerAddress;
    }
    
    // Prepare function arguments for transferHat
    const args = [
      hatIdBigInt,
      fromWearerAddress,
      toWearerAddress
    ];
    
    // Prepare the transaction
    const preparedTx = await prepareHatsContractCall({
      networkConfig: resolvedConfig,
      functionName: 'transferHat',
      args,
      fromAddress: transactionSender,
      gasEstimateMultiplier: validatedInput.gasEstimateMultiplier
    });
    
    // Update description in metadata
    preparedTx.metadata.description = `Transfer hat ${validatedInput.hatId} from ${validatedInput.from} to ${validatedInput.to}`;
    
    return preparedTx;
    
  } catch (error: any) {
    if (error instanceof TransactionError) {
      throw error;
    }
    
    throw new TransactionError(
      `Failed to prepare transfer hat transaction: ${error.message}`,
      'PREPARATION_ERROR',
      { error: error.message }
    );
  }
}

/**
 * Generate user-friendly instructions for transferring a hat
 */
export function generateTransferHatInstructions(
  preparedTx: PreparedTransaction,
  input: TransferHatInput
): string {
  const additionalInfo: Record<string, any> = {
    'Hat ID': input.hatId,
    'From Address': input.from,
    'To Address': input.to,
    'Function': 'transferHat'
  };
  
  if (input.fromAddress && input.fromAddress.toLowerCase() !== input.from.toLowerCase()) {
    additionalInfo['Transaction Sender'] = input.fromAddress;
    additionalInfo['Note'] = 'Transaction will be sent by a different address than the current wearer';
  }
  
  const instructions = generateTransactionInstructions(preparedTx, additionalInfo);
  
  // Add important notes about hat transfers
  const notes = [
    '',
    '## 📝 Transfer Requirements',
    '',
    '- The hat must be marked as transferable',
    '- The sender must have permission to transfer (usually the current wearer or an admin)',
    '- The recipient address must be eligible to receive the hat',
    '- Any eligibility modules must allow the transfer',
    '- The hat must currently be worn by the "from" address',
    '',
    '## ⚠️ Important Notes',
    '',
    '- This action will move all permissions associated with the hat',
    '- The original wearer will lose access immediately upon transfer',
    '- Ensure the recipient address is ready to receive the hat',
    '- Some hats may have restrictions on who can receive them'
  ];
  
  return instructions + '\n' + notes.join('\n');
}