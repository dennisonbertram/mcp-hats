/**
 * Type definitions for Hats Protocol MCP Server
 */

import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { z } from 'zod';

// ==================== Hats Protocol Types ====================

/**
 * Hat ID is a 256-bit hex string
 */
export type HatId = Hex;

/**
 * Tree ID is the first 4 bytes of a top hat ID
 */
export type TreeId = Hex;

/**
 * Pretty ID format for readability (e.g., "0x00000001.0001.0002")
 */
export type PrettyId = string;

/**
 * Hat properties from the protocol
 */
export interface Hat {
  id: HatId;
  prettyId: PrettyId;
  status: boolean;
  details: string;
  maxSupply: number;
  supply: number;
  eligibility: Address;
  toggle: Address;
  mutable: boolean;
  imageUri: string;
  createdAt: bigint;
  lastHatId: number;
}

/**
 * Wearer information
 */
export interface Wearer {
  address: Address;
  hatId: HatId;
  balance: bigint;
  isActive: boolean;
  inGoodStanding: boolean;
}

/**
 * Tree structure information
 */
export interface Tree {
  id: TreeId;
  topHatId: HatId;
  hats: Hat[];
  childTrees: Tree[];
  linkedToHat?: HatId;
  requestedLinkToHat?: HatId;
}

// ==================== Network Configuration ====================

/**
 * Network configuration for blockchain connections
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  fallbackRpcUrls?: string[];
  explorerUrl?: string;
  explorerApiUrl?: string;
  explorerApiKey?: string;
  subgraphUrl?: string;
  gasMultiplier?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
  hatsContractAddress?: Address;
}

// ==================== Transaction Types ====================

/**
 * Prepared transaction for external signing
 */
export interface PreparedTransaction {
  unsignedTransaction: {
    to?: Address;
    from?: Address;
    data: Hex;
    value?: bigint;
    gas?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
    chainId: number;
  };
  metadata: {
    contractName: string;
    functionName: string;
    args: any[];
    networkName: string;
    estimatedGasUsage: bigint;
    estimatedCostEth: string;
    expectedContractAddress?: Address;
  };
}

/**
 * Transaction result after execution
 */
export interface TransactionResult {
  hash: Hex;
  blockNumber?: bigint;
  blockHash?: Hex;
  status?: 'pending' | 'success' | 'failed';
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  contractAddress?: Address;
  logs?: any[];
}

// ==================== Client Configuration ====================

/**
 * Configuration for Hats Protocol clients
 */
export interface HatsClientConfig {
  chainId: number;
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

/**
 * Configuration for subgraph client
 */
export interface SubgraphClientConfig {
  endpoint: string;
  apiKey?: string;
}

// ==================== Tool Input Schemas ====================

// Hat Management Schemas
export const CreateHatInputSchema = z.object({
  networkName: z.string(),
  admin: z.string(),
  details: z.string(),
  maxSupply: z.number().min(1),
  eligibility: z.string().optional(),
  toggle: z.string().optional(),
  mutable: z.boolean().default(true),
  imageURI: z.string().optional(),
});

export const MintHatInputSchema = z.object({
  networkName: z.string(),
  hatId: z.string(),
  wearer: z.string(),
});

export const BurnHatInputSchema = z.object({
  networkName: z.string(),
  hatId: z.string(),
  wearer: z.string(),
});

export const TransferHatInputSchema = z.object({
  networkName: z.string(),
  hatId: z.string(),
  from: z.string(),
  to: z.string(),
});

// Permission Checking Schemas
export const CheckWearerInputSchema = z.object({
  networkName: z.string(),
  wearer: z.string(),
  hatId: z.string(),
});

export const CheckStandingInputSchema = z.object({
  networkName: z.string(),
  wearer: z.string(),
  hatId: z.string(),
});

// Query Schemas
export const GetHatDetailsInputSchema = z.object({
  networkName: z.string(),
  hatId: z.string(),
  includeWearers: z.boolean().default(false),
});

export const QueryHatsByWearerInputSchema = z.object({
  networkName: z.string(),
  wearer: z.string(),
  includeDetails: z.boolean().default(true),
});

export const GetTreeStructureInputSchema = z.object({
  networkName: z.string(),
  treeId: z.string(),
  maxDepth: z.number().default(10),
});

// Configuration Schemas
export const SetAPIKeyInputSchema = z.object({
  keyName: z.enum([
    'ALCHEMY_API_KEY',
    'INFURA_API_KEY',
    'ETHERSCAN_API_KEY',
    'POLYGONSCAN_API_KEY',
    'ARBISCAN_API_KEY',
    'OPTIMISTIC_ETHERSCAN_API_KEY',
    'BASESCAN_API_KEY',
    'GNOSISSCAN_API_KEY'
  ]),
  value: z.string(),
});

// ==================== Error Types ====================

/**
 * Custom error class for transaction errors
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Custom error class for network errors
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public networkName?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Custom error class for Hats Protocol errors
 */
export class HatsProtocolError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HatsProtocolError';
  }
}

// ==================== Response Types ====================

/**
 * Standard response format for tools
 */
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metadata?: {
    network?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

// ==================== Utility Types ====================

/**
 * API key types
 */
export type APIKeyType = 
  | 'ALCHEMY_API_KEY'
  | 'INFURA_API_KEY'
  | 'ETHERSCAN_API_KEY'
  | 'POLYGONSCAN_API_KEY'
  | 'ARBISCAN_API_KEY'
  | 'OPTIMISTIC_ETHERSCAN_API_KEY'
  | 'BASESCAN_API_KEY'
  | 'GNOSISSCAN_API_KEY';

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ==================== Event Types ====================

/**
 * Hats Protocol event types
 */
export type HatsEvent = 
  | HatCreatedEvent
  | HatMintedEvent
  | HatBurnedEvent
  | HatStatusChangedEvent
  | HatDetailsChangedEvent
  | WearerStandingChangedEvent;

export interface HatCreatedEvent {
  type: 'HatCreated';
  hatId: HatId;
  details: string;
  maxSupply: number;
  eligibility: Address;
  toggle: Address;
  mutable: boolean;
  imageUri: string;
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface HatMintedEvent {
  type: 'HatMinted';
  hatId: HatId;
  wearer: Address;
  operator: Address;
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface HatBurnedEvent {
  type: 'HatBurned';
  hatId: HatId;
  wearer: Address;
  operator: Address;
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface HatStatusChangedEvent {
  type: 'HatStatusChanged';
  hatId: HatId;
  newStatus: boolean;
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface HatDetailsChangedEvent {
  type: 'HatDetailsChanged';
  hatId: HatId;
  newDetails: string;
  blockNumber: bigint;
  transactionHash: Hex;
}

export interface WearerStandingChangedEvent {
  type: 'WearerStandingChanged';
  hatId: HatId;
  wearer: Address;
  standing: boolean;
  blockNumber: bigint;
  transactionHash: Hex;
}