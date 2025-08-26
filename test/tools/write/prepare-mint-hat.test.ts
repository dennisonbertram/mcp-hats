/**
 * Tests for prepare-mint-hat tool
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareMintHat } from '../../../src/tools/write/prepare-mint-hat.js';
import { PreparedTransaction } from '../../../src/utils/transaction-builder.js';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    estimateGas: vi.fn(() => Promise.resolve(100000n)),
    getGasPrice: vi.fn(() => Promise.resolve(30000000000n)), // 30 gwei
    getChainId: vi.fn(() => Promise.resolve(1))
  })),
  http: vi.fn(),
  encodeFunctionData: vi.fn(() => '0xabcdef1234567890')
}));

// Mock network resolution
vi.mock('../../../src/networks/index.js', () => ({
  getNetworkConfig: vi.fn((name: string) => ({
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.rpc.test',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    hatsContractAddress: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137'
  })),
  resolveNetworkConfig: vi.fn((config: any) => Promise.resolve(config))
}));

describe('prepare-mint-hat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should reject missing required fields', async () => {
      const invalidInput = {
        networkName: 'ethereum'
        // Missing required fields
      };

      await expect(prepareMintHat(invalidInput as any)).rejects.toThrow();
    });

    it('should reject invalid hat ID', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: 'invalid-hat-id', // Not a valid uint256
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      await expect(prepareMintHat(invalidInput)).rejects.toThrow('Invalid hat ID');
    });

    it('should reject invalid wearer address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: 'not-an-address'
      };

      await expect(prepareMintHat(invalidInput)).rejects.toThrow('Invalid wearer address');
    });

    it('should reject zero address for wearer', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x0000000000000000000000000000000000000000'
      };

      await expect(prepareMintHat(invalidInput)).rejects.toThrow('Cannot mint to zero address');
    });

    it('should reject unsupported network', async () => {
      const invalidInput = {
        networkName: 'unsupported-network',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const { getNetworkConfig } = await import('../../../src/networks/index.js');
      (getNetworkConfig as any).mockImplementation(() => {
        throw new Error('Unsupported network');
      });

      await expect(prepareMintHat(invalidInput)).rejects.toThrow('Unsupported network');
    });
  });

  describe('transaction preparation', () => {
    it('should prepare a valid mint hat transaction', async () => {
      const validInput = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const result = await prepareMintHat(validInput);

      expect(result).toBeDefined();
      expect(result.transactionType).toBe('contract_call');
      expect(result.unsignedTransaction).toBeDefined();
      expect(result.unsignedTransaction.to).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
      expect(result.unsignedTransaction.value).toBe('0');
      expect(result.unsignedTransaction.data).toBeDefined();
      expect(result.unsignedTransaction.gas).toBeDefined();
      expect(result.unsignedTransaction.gasPrice).toBeDefined();
      expect(result.unsignedTransaction.chainId).toBe(1);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.networkName).toBe('Ethereum Mainnet');
      expect(result.metadata.functionName).toBe('mintHat');
      expect(result.metadata.contractAddress).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
      expect(result.metadata.estimatedCostEth).toBeDefined();
    });

    it('should apply gas multiplier correctly', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        gasEstimateMultiplier: 1.5
      };

      const result = await prepareMintHat(input);
      
      // Gas estimate was 100000n, with 1.5x multiplier = 150000
      expect(result.unsignedTransaction.gas).toBe('150000');
    });

    it('should include from address when provided', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        fromAddress: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      
      // Verify that the mock client was called with the from address
      const { createPublicClient } = await import('viem');
      const mockClient = (createPublicClient as any).mock.results[0].value;
      expect(mockClient.estimateGas).toHaveBeenCalledWith(
        expect.objectContaining({
          account: '0x1234567890123456789012345678901234567890'
        })
      );
    });

    it('should handle very large hat IDs', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[0]).toBe(BigInt(input.hatId));
    });
  });

  describe('batch minting', () => {
    it('should prepare batch mint for multiple wearers', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearers: [
          '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          '0x1234567890123456789012345678901234567890',
          '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa'
        ]
      };

      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('batchMintHats');
      // batchMintHats expects [hatIds[], wearers[]]
      expect(result.metadata.args[0]).toEqual([1n, 1n, 1n]); // Hat IDs array
      expect(result.metadata.args[1]).toEqual(input.wearers); // Wearers array
    });

    it('should reject batch mint with invalid addresses', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearers: [
          '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          'invalid-address'
        ]
      };

      await expect(prepareMintHat(input)).rejects.toThrow('Invalid wearer address');
    });

    it('should reject batch mint with duplicate addresses', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearers: [
          '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7' // Duplicate
        ]
      };

      await expect(prepareMintHat(input)).rejects.toThrow('Duplicate wearer addresses');
    });

    it('should handle single wearer in wearers array', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearers: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7']
      };

      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      // Should use regular mintHat for single wearer
      expect(result.metadata.functionName).toBe('mintHat');
    });
  });

  describe('edge cases', () => {
    it('should handle network with high gas prices', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(100000n)),
        getGasPrice: vi.fn(() => Promise.resolve(500000000000n)), // 500 gwei - very high
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      expect(parseFloat(result.metadata.estimatedCostEth)).toBeGreaterThan(0.04); // High cost expected
    });

    it('should handle checksum addresses', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7' // Checksum address
      };

      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[1].toLowerCase()).toBe(input.wearer.toLowerCase());
    });
  });

  describe('error handling', () => {
    it('should handle gas estimation failure gracefully', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.reject(new Error('Gas estimation failed'))),
        getGasPrice: vi.fn(() => Promise.resolve(30000000000n)),
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      // Should not throw, but use default gas
      const result = await prepareMintHat(input);
      expect(result).toBeDefined();
      expect(result.unsignedTransaction.gas).toBeDefined();
    });

    it('should handle RPC connection failure', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(100000n)),
        getGasPrice: vi.fn(() => Promise.reject(new Error('RPC connection failed'))),
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      await expect(prepareMintHat(input)).rejects.toThrow('RPC connection failed');
    });
  });
});