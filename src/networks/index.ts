/**
 * Network configuration for Hats Protocol supported chains
 */

import type { NetworkConfig } from '../types/index.js';
import { resolveAPIKey } from '../utils/config.js';

// Hats Protocol V1 contract address (same on all networks)
const HATS_V1_ADDRESS = '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137';

// Supported blockchain networks configuration
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  // ==================== Mainnet Networks ====================
  
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum.rpc.blxrbdn.com',
      'https://cloudflare-eth.com',
      'https://eth.public-rpc.com'
    ],
    explorerUrl: 'https://etherscan.io',
    explorerApiUrl: 'https://api.etherscan.io/api',
    explorerApiKey: '${ETHERSCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-ethereum/version/latest',
    gasMultiplier: 1.2,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://rpc.ankr.com/polygon',
      'https://polygon-rpc.com',
      'https://rpc-mainnet.matic.network',
      'https://polygon.llamarpc.com'
    ],
    explorerUrl: 'https://polygonscan.com',
    explorerApiUrl: 'https://api.polygonscan.com/api',
    explorerApiKey: '${POLYGONSCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-polygon/version/latest',
    gasMultiplier: 1.2,
    maxFeePerGas: '100000000000', // 100 gwei
    maxPriorityFeePerGas: '30000000000', // 30 gwei
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    testnet: false,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum.llamarpc.com'
    ],
    explorerUrl: 'https://arbiscan.io',
    explorerApiUrl: 'https://api.arbiscan.io/api',
    explorerApiKey: '${ARBISCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-arbitrum/version/latest',
    gasMultiplier: 1.1,
    nativeCurrency: {
      name: 'Arbitrum Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  optimism: {
    chainId: 10,
    name: 'Optimism Mainnet',
    rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
      'https://optimism.llamarpc.com'
    ],
    explorerUrl: 'https://optimistic.etherscan.io',
    explorerApiUrl: 'https://api-optimistic.etherscan.io/api',
    explorerApiKey: '${OPTIMISTIC_ETHERSCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-optimism/version/latest',
    gasMultiplier: 1.1,
    nativeCurrency: {
      name: 'Optimism Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  base: {
    chainId: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://mainnet.base.org',
      'https://rpc.ankr.com/base',
      'https://base.llamarpc.com'
    ],
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    explorerApiKey: '${BASESCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-base/version/latest',
    gasMultiplier: 1.1,
    nativeCurrency: {
      name: 'Base Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  gnosis: {
    chainId: 100,
    name: 'Gnosis Chain',
    rpcUrl: 'https://rpc.gnosischain.com',
    fallbackRpcUrls: [
      'https://rpc.ankr.com/gnosis',
      'https://gnosis.publicnode.com',
      'https://gnosis.drpc.org'
    ],
    explorerUrl: 'https://gnosisscan.io',
    explorerApiUrl: 'https://api.gnosisscan.io/api',
    explorerApiKey: '${GNOSISSCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-gnosis/version/latest',
    gasMultiplier: 1.2,
    nativeCurrency: {
      name: 'xDAI',
      symbol: 'xDAI',
      decimals: 18
    },
    testnet: false,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  // ==================== Testnet Networks ====================

  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://rpc.sepolia.org',
      'https://endpoints.omniatech.io/v1/eth/sepolia/public',
      'https://ethereum-sepolia.publicnode.com'
    ],
    explorerUrl: 'https://sepolia.etherscan.io',
    explorerApiUrl: 'https://api-sepolia.etherscan.io/api',
    explorerApiKey: '${ETHERSCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-sepolia/version/latest',
    gasMultiplier: 1.5,
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP ETH',
      decimals: 18
    },
    testnet: true,
    hatsContractAddress: HATS_V1_ADDRESS
  },

  'base-sepolia': {
    chainId: 84532,
    name: 'Base Sepolia Testnet',
    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
    fallbackRpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia-rpc.publicnode.com'
    ],
    explorerUrl: 'https://sepolia.basescan.org',
    explorerApiUrl: 'https://api-sepolia.basescan.org/api',
    explorerApiKey: '${BASESCAN_API_KEY}',
    subgraphUrl: 'https://api.studio.thegraph.com/query/55784/hats-v1-base-sepolia/version/latest',
    gasMultiplier: 1.5,
    nativeCurrency: {
      name: 'Base Sepolia Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: true,
    hatsContractAddress: HATS_V1_ADDRESS
  }
};

/**
 * Get network configuration by name
 */
export function getNetworkConfig(networkName: string): NetworkConfig {
  const config = SUPPORTED_NETWORKS[networkName.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported network: ${networkName}. Supported networks: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`);
  }
  return config;
}

/**
 * Resolve network configuration with API keys
 */
export async function resolveNetworkConfig(config: NetworkConfig): Promise<NetworkConfig> {
  const resolved = { ...config };
  
  // Resolve RPC URL
  if (resolved.rpcUrl.includes('${')) {
    const apiKey = await resolveAPIKey(resolved.rpcUrl);
    if (apiKey) {
      resolved.rpcUrl = resolved.rpcUrl.replace(/\$\{[^}]+\}/g, apiKey);
    } else if (resolved.fallbackRpcUrls && resolved.fallbackRpcUrls.length > 0) {
      // Use first fallback URL if API key is not available
      resolved.rpcUrl = resolved.fallbackRpcUrls[0];
    }
  }
  
  // Resolve explorer API key
  if (resolved.explorerApiKey && resolved.explorerApiKey.includes('${')) {
    const apiKey = await resolveAPIKey(resolved.explorerApiKey);
    if (apiKey) {
      resolved.explorerApiKey = apiKey;
    } else {
      // Remove explorer API features if key is not available
      delete resolved.explorerApiKey;
      delete resolved.explorerApiUrl;
    }
  }
  
  return resolved;
}

/**
 * Get all supported networks
 */
export function getAllNetworks(includeTestnets = true): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS).filter(
    network => includeTestnets || !network.testnet
  );
}

/**
 * Get network by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(SUPPORTED_NETWORKS).find(
    network => network.chainId === chainId
  );
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(networkName: string): boolean {
  return networkName.toLowerCase() in SUPPORTED_NETWORKS;
}

/**
 * Get mainnet networks only
 */
export function getMainnetNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS).filter(network => !network.testnet);
}

/**
 * Get testnet networks only
 */
export function getTestnetNetworks(): NetworkConfig[] {
  return Object.values(SUPPORTED_NETWORKS).filter(network => network.testnet);
}