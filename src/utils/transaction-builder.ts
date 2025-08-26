/**
 * Transaction builder utilities for Hats Protocol operations
 * Provides common patterns for preparing transactions for external signing
 */

import {
  createPublicClient,
  http,
  encodeFunctionData,
  type Hex,
  type Address,
  type PublicClient
} from 'viem';
import { HATS_ABI, HATS_V1 } from '@hatsprotocol/sdk-v1-core';
import type { NetworkConfig } from '../types/index.js';

// Export types for transaction preparation
export interface UnsignedTransaction {
  to: Address | null;
  value: bigint;
  data: Hex;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  chainId: number;
}

export interface PreparedTransaction {
  transactionType: 'contract_call';
  unsignedTransaction: {
    to: string;
    value: string;
    data: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
    chainId: number;
  };
  metadata: {
    networkName: string;
    networkChainId: number;
    contractAddress: string;
    functionName: string;
    args: any[];
    description: string;
    estimatedGasUsage: string;
    estimatedCostEth: string;
  };
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Create a public client for transaction preparation
 */
export function createTransactionClient(networkConfig: NetworkConfig): PublicClient {
  return createPublicClient({
    chain: {
      id: networkConfig.chainId,
      name: networkConfig.name,
      nativeCurrency: networkConfig.nativeCurrency,
      rpcUrls: {
        default: {
          http: [networkConfig.rpcUrl]
        }
      }
    },
    transport: http(networkConfig.rpcUrl)
  });
}

/**
 * Get Hats contract address for a specific network
 */
export function getHatsContractAddress(_chainId: number): Address {
  // Hats V1 is deployed at the same address on all networks
  // The chainId parameter is kept for future compatibility if addresses differ by chain
  return HATS_V1 as Address;
}

/**
 * Prepare a Hats Protocol contract call transaction
 */
export async function prepareHatsContractCall(params: {
  networkConfig: NetworkConfig;
  functionName: string;
  args: any[];
  fromAddress?: Address;
  gasEstimateMultiplier?: number;
}): Promise<PreparedTransaction> {
  const {
    networkConfig,
    functionName,
    args,
    fromAddress,
    gasEstimateMultiplier = 1.2
  } = params;

  try {
    const publicClient = createTransactionClient(networkConfig);
    const contractAddress = getHatsContractAddress(networkConfig.chainId);

    // Encode function data with proper typing
    const data = encodeFunctionData({
      abi: HATS_ABI,
      functionName: functionName as any, // Type assertion needed for dynamic function names
      args: args as any // Type assertion needed for dynamic args
    }) as Hex;

    // Estimate gas
    let gasEstimate: bigint;
    try {
      gasEstimate = await publicClient.estimateGas({
        account: fromAddress,
        to: contractAddress,
        data,
        value: 0n
      });
    } catch (error: any) {
      // If estimation fails, provide a reasonable default
      console.warn(`Gas estimation failed for ${functionName}, using default:`, error.message);
      gasEstimate = 200000n; // Default gas limit for most operations
    }

    const adjustedGas = BigInt(Math.ceil(Number(gasEstimate) * gasEstimateMultiplier));

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();
    const estimatedCostWei = adjustedGas * gasPrice;
    const estimatedCostEth = (Number(estimatedCostWei) / 1e18).toFixed(6);

    // Get chain ID (using networkConfig.chainId instead of fetching)
    const chainId = networkConfig.chainId;

    const unsignedTransaction: UnsignedTransaction = {
      to: contractAddress,
      value: 0n,
      data,
      gas: adjustedGas,
      gasPrice,
      chainId
    };

    return {
      transactionType: 'contract_call',
      unsignedTransaction: {
        to: unsignedTransaction.to || '', // Convert null to empty string for type safety
        value: unsignedTransaction.value.toString(),
        data: unsignedTransaction.data,
        gas: unsignedTransaction.gas?.toString(),
        gasPrice: unsignedTransaction.gasPrice?.toString(),
        maxFeePerGas: unsignedTransaction.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: unsignedTransaction.maxPriorityFeePerGas?.toString(),
        nonce: unsignedTransaction.nonce,
        chainId: unsignedTransaction.chainId
      },
      metadata: {
        networkName: networkConfig.name,
        networkChainId: chainId,
        contractAddress,
        functionName,
        args,
        description: `Call ${functionName} on Hats Protocol`,
        estimatedGasUsage: adjustedGas.toString(),
        estimatedCostEth
      }
    };
  } catch (error: any) {
    throw new TransactionError(
      `Failed to prepare ${functionName} transaction: ${error.message}`,
      'PREPARATION_ERROR',
      { functionName, args, error: error.message }
    );
  }
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): Address {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    throw new TransactionError(
      `Invalid Ethereum address: ${address}`,
      'INVALID_ADDRESS',
      { address }
    );
  }
  return address as Address;
}

/**
 * Validate hat ID (256-bit uint)
 */
export function validateHatId(hatId: string): bigint {
  try {
    const id = BigInt(hatId);
    if (id < 0n || id >= 2n ** 256n) {
      throw new Error('Hat ID out of valid range');
    }
    return id;
  } catch (error) {
    throw new TransactionError(
      `Invalid hat ID: ${hatId}`,
      'INVALID_HAT_ID',
      { hatId }
    );
  }
}

/**
 * Generate transaction instructions for the user
 */
export function generateTransactionInstructions(
  preparedTx: PreparedTransaction,
  additionalInfo?: Record<string, any>
): string {
  const sections = [
    '# 🎩 Hats Protocol Transaction Instructions',
    '',
    `**Network:** ${preparedTx.metadata.networkName}`,
    `**Contract:** ${preparedTx.metadata.contractAddress}`,
    `**Function:** ${preparedTx.metadata.functionName}`,
    '',
    '## 📊 Transaction Details',
    '',
    '```json',
    JSON.stringify({
      to: preparedTx.unsignedTransaction.to,
      value: preparedTx.unsignedTransaction.value,
      data: preparedTx.unsignedTransaction.data.slice(0, 100) + '...',
      gas: preparedTx.unsignedTransaction.gas,
      gasPrice: preparedTx.unsignedTransaction.gasPrice,
      chainId: preparedTx.unsignedTransaction.chainId
    }, null, 2),
    '```',
    '',
    '## 💰 Cost Estimation',
    `- **Gas Limit:** ${parseInt(preparedTx.metadata.estimatedGasUsage).toLocaleString()}`,
    `- **Gas Price:** ${preparedTx.unsignedTransaction.gasPrice ? (Number(preparedTx.unsignedTransaction.gasPrice) / 1e9).toFixed(2) + ' gwei' : 'Dynamic'}`,
    `- **Estimated Cost:** ${preparedTx.metadata.estimatedCostEth} ETH`,
    ''
  ];

  if (additionalInfo) {
    sections.push('## ℹ️ Additional Information');
    for (const [key, value] of Object.entries(additionalInfo)) {
      sections.push(`- **${key}:** ${value}`);
    }
    sections.push('');
  }

  sections.push(
    '## 📋 Next Steps',
    '',
    '1. **Sign Transaction:** Use your MCP Ledger server or hardware wallet to sign',
    '2. **Broadcast:** Send the signed transaction to the network',
    '3. **Verify:** Check the transaction status on the block explorer'
  );

  return sections.join('\n');
}