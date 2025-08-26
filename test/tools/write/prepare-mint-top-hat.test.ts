/**
 * Tests for prepare-mint-top-hat tool
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareMintTopHat } from '../../../src/tools/write/prepare-mint-top-hat.js';
import { PreparedTransaction } from '../../../src/utils/transaction-builder.js';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    estimateGas: vi.fn(() => Promise.resolve(150000n)),
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

describe('prepare-mint-top-hat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should reject missing required fields', async () => {
      const invalidInput = {
        networkName: 'ethereum'
        // Missing required fields
      };

      await expect(prepareMintTopHat(invalidInput as any)).rejects.toThrow();
    });

    it('should reject missing target address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        details: 'Test DAO'
        // Missing target
      };

      await expect(prepareMintTopHat(invalidInput as any)).rejects.toThrow();
    });

    it('should reject invalid target address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        target: 'not-an-address',
        details: 'Test DAO'
      };

      await expect(prepareMintTopHat(invalidInput)).rejects.toThrow('Invalid target address');
    });

    it('should reject invalid from address when provided', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO',
        fromAddress: 'invalid-address'
      };

      await expect(prepareMintTopHat(invalidInput)).rejects.toThrow('Invalid from address');
    });

    it('should reject unsupported network', async () => {
      const invalidInput = {
        networkName: 'unsupported-network',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO'
      };

      const { getNetworkConfig } = await import('../../../src/networks/index.js');
      (getNetworkConfig as any).mockImplementation(() => {
        throw new Error('Unsupported network');
      });

      await expect(prepareMintTopHat(invalidInput)).rejects.toThrow('Unsupported network');
    });
  });

  describe('transaction preparation', () => {
    it('should prepare a valid mint top hat transaction', async () => {
      const validInput = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO - A decentralized autonomous organization',
        imageURI: 'https://example.com/dao-logo.png'
      };

      const result = await prepareMintTopHat(validInput);

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
      expect(result.metadata.functionName).toBe('mintTopHat');
      expect(result.metadata.contractAddress).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
      expect(result.metadata.estimatedCostEth).toBeDefined();
      expect(result.metadata.description).toContain('new hat tree');
    });

    it('should use default empty string for optional imageURI', async () => {
      const minimalInput = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO'
        // imageURI not provided
      };

      const result = await prepareMintTopHat(minimalInput);

      expect(result).toBeDefined();
      expect(result.metadata.args).toContain('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');
      expect(result.metadata.args).toContain('Test DAO');
      expect(result.metadata.args[2]).toBe(''); // Default empty string for imageURI
    });

    it('should apply gas multiplier correctly', async () => {
      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO',
        gasEstimateMultiplier: 1.5
      };

      const result = await prepareMintTopHat(input);
      
      // Gas estimate was 150000n, with 1.5x multiplier = 225000
      expect(result.unsignedTransaction.gas).toBe('225000');
    });

    it('should include from address when provided', async () => {
      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO',
        fromAddress: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareMintTopHat(input);
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
  });

  describe('edge cases', () => {
    it('should handle network with high gas prices', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(150000n)),
        getGasPrice: vi.fn(() => Promise.resolve(500000000000n)), // 500 gwei - very high
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO'
      };

      const result = await prepareMintTopHat(input);
      expect(result).toBeDefined();
      expect(parseFloat(result.metadata.estimatedCostEth)).toBeGreaterThan(0.05); // High cost expected
    });

    it('should handle empty details string', async () => {
      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: '' // Empty details
      };

      const result = await prepareMintTopHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[1]).toBe('');
    });

    it('should handle very long details string', async () => {
      const longDetails = 'A'.repeat(1000); // Very long string
      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: longDetails
      };

      const result = await prepareMintTopHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[1]).toBe(longDetails);
    });

    it('should handle zero address as target', async () => {
      const input = {
        networkName: 'ethereum',
        target: '0x0000000000000000000000000000000000000000',
        details: 'Test DAO'
      };

      const result = await prepareMintTopHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[0]).toBe('0x0000000000000000000000000000000000000000');
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
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO'
      };

      // Should not throw, but use default gas
      const result = await prepareMintTopHat(input);
      expect(result).toBeDefined();
      expect(result.unsignedTransaction.gas).toBeDefined();
    });

    it('should handle RPC connection failure', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(150000n)),
        getGasPrice: vi.fn(() => Promise.reject(new Error('RPC connection failed'))),
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO'
      };

      await expect(prepareMintTopHat(input)).rejects.toThrow('RPC connection failed');
    });

    it('should wrap unknown errors properly', async () => {
      const { encodeFunctionData } = await import('viem');
      (encodeFunctionData as any).mockImplementation(() => {
        throw new Error('Encoding failed');
      });

      const input = {
        networkName: 'ethereum',
        target: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        details: 'Test DAO'
      };

      await expect(prepareMintTopHat(input)).rejects.toThrow('Failed to prepare mintTopHat transaction');
    });
  });
});