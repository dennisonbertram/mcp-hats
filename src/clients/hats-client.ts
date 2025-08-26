/**
 * Hats Protocol client wrapper for SDK integration
 */

import { HatsClient as SDKHatsClient } from '@hatsprotocol/sdk-v1-core';
import type { WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import type { HatId } from '../types/index.js';
import { getNetworkConfig, resolveNetworkConfig } from '../networks/index.js';

/**
 * Cache for Hats client instances
 */
const clientCache = new Map<string, SDKHatsClient>();

/**
 * Get VIEM chain configuration by chain ID
 */
function getViemChain(chainId: number): any {
  switch (chainId) {
    case 1:
      return chains.mainnet;
    case 137:
      return chains.polygon;
    case 42161:
      return chains.arbitrum;
    case 10:
      return chains.optimism;
    case 8453:
      return chains.base;
    case 100:
      return chains.gnosis;
    case 11155111:
      return chains.sepolia;
    case 84532:
      return chains.baseSepolia;
    default:
      // Create custom chain if not found
      return {
        id: chainId,
        name: `Chain ${chainId}`,
        network: `chain-${chainId}`,
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
        rpcUrls: {
          default: { http: [''] },
          public: { http: [''] },
        },
      };
  }
}

/**
 * Create or get cached Hats client for a network
 */
export async function getHatsClient(networkName: string): Promise<SDKHatsClient> {
  const cacheKey = `hats-${networkName}`;
  
  // Check cache first
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }
  
  // Get and resolve network configuration
  const networkConfig = getNetworkConfig(networkName);
  const resolvedConfig = await resolveNetworkConfig(networkConfig);
  
  // Create VIEM clients
  const chain = getViemChain(resolvedConfig.chainId);
  
  const publicClient = createPublicClient({
    chain,
    transport: http(resolvedConfig.rpcUrl),
  });
  
  // Create Hats client (read-only for now)
  const hatsClient = new SDKHatsClient({
    chainId: resolvedConfig.chainId,
    publicClient,
  });
  
  // Cache the client
  clientCache.set(cacheKey, hatsClient);
  
  return hatsClient;
}

/**
 * Create a Hats client with wallet for write operations
 */
export async function getHatsClientWithWallet(
  networkName: string,
  walletClient: WalletClient
): Promise<SDKHatsClient> {
  const networkConfig = getNetworkConfig(networkName);
  const resolvedConfig = await resolveNetworkConfig(networkConfig);
  
  const chain = getViemChain(resolvedConfig.chainId);
  
  const publicClient = createPublicClient({
    chain,
    transport: http(resolvedConfig.rpcUrl),
  });
  
  return new SDKHatsClient({
    chainId: resolvedConfig.chainId,
    publicClient,
    walletClient,
  });
}

/**
 * Helper function to format hat ID
 */
export function formatHatId(hatId: string): HatId {
  // Ensure hat ID is properly formatted as 256-bit hex
  if (!hatId.startsWith('0x')) {
    hatId = '0x' + hatId;
  }
  
  // Pad to 256 bits (64 hex chars + 0x prefix = 66 chars total)
  if (hatId.length < 66) {
    hatId = hatId + '0'.repeat(66 - hatId.length);
  }
  
  return hatId as HatId;
}

/**
 * Helper function to convert hat ID to pretty format
 */
export function hatIdToPretty(hatId: HatId): string {
  // Remove 0x prefix
  const hex = hatId.slice(2);
  
  // Split into 4-byte chunks
  const chunks: string[] = [];
  for (let i = 0; i < hex.length; i += 8) {
    const chunk = hex.slice(i, i + 8);
    // Skip empty chunks
    if (chunk !== '00000000') {
      chunks.push(chunk);
    } else {
      break; // Stop at first empty chunk
    }
  }
  
  // Format as dotted notation
  return '0x' + chunks.join('.');
}

/**
 * Helper function to convert pretty format to hat ID
 */
export function prettyToHatId(prettyId: string): HatId {
  // Remove 0x prefix
  let hex = prettyId.startsWith('0x') ? prettyId.slice(2) : prettyId;
  
  // Replace dots and pad to 256 bits
  hex = hex.replace(/\./g, '');
  
  // Pad to 64 hex characters
  if (hex.length < 64) {
    hex = hex + '0'.repeat(64 - hex.length);
  }
  
  return ('0x' + hex) as HatId;
}

/**
 * Get tree ID from hat ID
 */
export function getTreeId(hatId: HatId): string {
  // Tree ID is the first 4 bytes (8 hex chars)
  return hatId.slice(0, 10); // 0x + 8 chars
}

/**
 * Check if a hat ID is a top hat (tree root)
 */
export function isTopHat(hatId: HatId): boolean {
  // Top hat has only the first 4 bytes set, rest are zeros
  const hex = hatId.slice(2);
  return hex.slice(8).match(/^0+$/) !== null;
}

/**
 * Get parent hat ID from a child hat ID
 */
export function getParentHatId(hatId: HatId): HatId | null {
  const hex = hatId.slice(2);
  
  // Find the last non-zero 4-byte chunk
  let lastNonZeroIndex = -1;
  for (let i = 0; i < hex.length; i += 8) {
    const chunk = hex.slice(i, i + 8);
    if (chunk !== '00000000') {
      lastNonZeroIndex = i;
    }
  }
  
  // If it's a top hat or invalid, return null
  if (lastNonZeroIndex <= 0) {
    return null;
  }
  
  // Zero out the last non-zero chunk to get parent
  const parentHex = 
    hex.slice(0, lastNonZeroIndex) + 
    '0'.repeat(hex.length - lastNonZeroIndex);
  
  return ('0x' + parentHex) as HatId;
}

/**
 * Calculate the level of a hat in the tree
 */
export function getHatLevel(hatId: HatId): number {
  const hex = hatId.slice(2);
  let level = 0;
  
  for (let i = 0; i < hex.length; i += 8) {
    const chunk = hex.slice(i, i + 8);
    if (chunk !== '00000000') {
      level++;
    } else {
      break;
    }
  }
  
  return level;
}

/**
 * Batch query helper for multiple operations
 */
export async function batchQuery<T>(
  _client: SDKHatsClient,
  operations: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(operations.map(op => op()));
}

/**
 * Clear client cache (useful for testing or when switching accounts)
 */
export function clearClientCache(): void {
  clientCache.clear();
}

/**
 * Get all cached client keys
 */
export function getCachedClientKeys(): string[] {
  return Array.from(clientCache.keys());
}