/**
 * Integration test for prepare-mint-top-hat tool
 * Tests the complete flow with mocked dependencies
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareMintTopHat, generateMintTopHatInstructions } from '../../src/tools/write/prepare-mint-top-hat.js';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    estimateGas: vi.fn(() => Promise.resolve(150000n)),
    getGasPrice: vi.fn(() => Promise.resolve(30000000000n)), // 30 gwei
    getChainId: vi.fn(() => Promise.resolve(11155111))  // Sepolia chain ID
  })),
  http: vi.fn(),
  encodeFunctionData: vi.fn(() => '0x1a64dfad00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8')
}));

// Mock network resolution
vi.mock('../../src/networks/index.js', () => ({
  getNetworkConfig: vi.fn((name: string) => {
    if (name === 'sepolia') {
      return {
        chainId: 11155111,
        name: 'Sepolia',
        rpcUrl: 'https://rpc.sepolia.org',
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'SEP',
          decimals: 18
        },
        hatsContractAddress: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137'
      };
    }
    throw new Error(`Unsupported network: ${name}`);
  }),
  resolveNetworkConfig: vi.fn((config: any) => Promise.resolve(config))
}));

describe('prepare-mint-top-hat integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully prepare a mint top hat transaction', async () => {
    const input = {
      networkName: 'sepolia',
      target: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      details: 'Test DAO - A new decentralized organization',
      imageURI: 'https://example.com/dao-logo.png',
      gasEstimateMultiplier: 1.2
    };

    const result = await prepareMintTopHat(input);

    // Validate transaction structure
    expect(result.transactionType).toBe('contract_call');
    expect(result.metadata.functionName).toBe('mintTopHat');
    expect(result.metadata.networkName).toBe('Sepolia');
    expect(result.metadata.contractAddress).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
    
    // Validate transaction data
    expect(result.unsignedTransaction.to).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
    expect(result.unsignedTransaction.value).toBe('0');
    expect(result.unsignedTransaction.data).toBeDefined();
    expect(result.unsignedTransaction.chainId).toBe(11155111);
    
    // Validate gas estimation (150000 * 1.2 = 180000)
    expect(result.unsignedTransaction.gas).toBe('180000');
    expect(result.unsignedTransaction.gasPrice).toBe('30000000000');
    
    // Validate metadata
    expect(result.metadata.args).toEqual([
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      'Test DAO - A new decentralized organization',
      'https://example.com/dao-logo.png'
    ]);
    
    expect(result.metadata.description).toContain('Create new hat tree');
    expect(result.metadata.estimatedCostEth).toBeDefined();
  });

  it('should generate proper instructions', async () => {
    const input = {
      networkName: 'sepolia',
      target: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      details: 'Test DAO - A new decentralized organization',
      imageURI: 'https://example.com/dao-logo.png'
    };

    const preparedTx = await prepareMintTopHat(input);
    const instructions = generateMintTopHatInstructions(preparedTx, input);

    expect(instructions).toContain('Hats Protocol Transaction Instructions');
    expect(instructions).toContain('mintTopHat');
    expect(instructions).toContain('Sepolia');
    expect(instructions).toContain('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    expect(instructions).toContain('Test DAO - A new decentralized organization');
    expect(instructions).toContain('https://example.com/dao-logo.png');
    expect(instructions).toContain('Create New Hat Tree');
    expect(instructions).toContain('entirely new hat tree');
  });

  it('should handle minimal input (no imageURI)', async () => {
    const input = {
      networkName: 'sepolia',
      target: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      details: 'Minimal DAO'
    };

    const result = await prepareMintTopHat(input);

    expect(result.metadata.functionName).toBe('mintTopHat');
    expect(result.metadata.args[2]).toBe(''); // Empty imageURI
  });

  it('should use custom gas multiplier', async () => {
    const input = {
      networkName: 'sepolia',
      target: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      details: 'Test DAO',
      gasEstimateMultiplier: 1.5
    };

    const result = await prepareMintTopHat(input);
    
    // 150000 * 1.5 = 225000
    expect(result.unsignedTransaction.gas).toBe('225000');
  });

  it('should properly serialize for JSON output', async () => {
    const input = {
      networkName: 'sepolia',
      target: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      details: 'Test DAO'
    };

    const result = await prepareMintTopHat(input);
    
    // Should be able to serialize to JSON without errors
    const json = JSON.stringify(result, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    
    expect(json).toBeDefined();
    const parsed = JSON.parse(json);
    expect(parsed.transactionType).toBe('contract_call');
  });
});