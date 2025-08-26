/**
 * Tests for prepare-transfer-hat tool
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareTransferHat } from '../../../src/tools/write/prepare-transfer-hat.js';
import { PreparedTransaction } from '../../../src/utils/transaction-builder.js';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    estimateGas: vi.fn(() => Promise.resolve(120000n)),
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

describe('prepare-transfer-hat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should reject missing required fields', async () => {
      const invalidInput = {
        networkName: 'ethereum'
        // Missing required fields
      };

      await expect(prepareTransferHat(invalidInput as any)).rejects.toThrow();
    });

    it('should reject invalid hat ID', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: 'invalid-hat-id', // Not a valid uint256
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Invalid hat ID');
    });

    it('should reject invalid from address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        from: 'not-an-address',
        to: '0x1234567890123456789012345678901234567890'
      };

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Invalid from address');
    });

    it('should reject invalid to address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: 'not-an-address'
      };

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Invalid to address');
    });

    it('should reject transfer to same address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7' // Same as from
      };

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Cannot transfer to same address');
    });

    it('should reject transfer to zero address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x0000000000000000000000000000000000000000'
      };

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Cannot transfer to zero address');
    });

    it('should reject transfer from zero address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x0000000000000000000000000000000000000000',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Cannot transfer from zero address');
    });

    it('should reject unsupported network', async () => {
      const invalidInput = {
        networkName: 'unsupported-network',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      const { getNetworkConfig } = await import('../../../src/networks/index.js');
      (getNetworkConfig as any).mockImplementation(() => {
        throw new Error('Unsupported network');
      });

      await expect(prepareTransferHat(invalidInput)).rejects.toThrow('Unsupported network');
    });
  });

  describe('transaction preparation', () => {
    it('should prepare a valid transfer hat transaction', async () => {
      const validInput = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareTransferHat(validInput);

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
      expect(result.metadata.functionName).toBe('transferHat');
      expect(result.metadata.contractAddress).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
      expect(result.metadata.estimatedCostEth).toBeDefined();
      expect(result.metadata.args).toEqual([
        1n,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        '0x1234567890123456789012345678901234567890'
      ]);
    });

    it('should apply gas multiplier correctly', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890',
        gasEstimateMultiplier: 1.5
      };

      const result = await prepareTransferHat(input);
      
      // Gas estimate was 120000n, with 1.5x multiplier = 180000
      expect(result.unsignedTransaction.gas).toBe('180000');
    });

    it('should include fromAddress when provided', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890',
        fromAddress: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa' // Transaction sender
      };

      const result = await prepareTransferHat(input);
      expect(result).toBeDefined();
      
      // Verify that the mock client was called with the from address
      const { createPublicClient } = await import('viem');
      const mockClient = (createPublicClient as any).mock.results[0].value;
      expect(mockClient.estimateGas).toHaveBeenCalledWith(
        expect.objectContaining({
          account: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa'
        })
      );
    });

    it('should handle very large hat IDs', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareTransferHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[0]).toBe(BigInt(input.hatId));
    });

    it('should handle case-insensitive address comparison for same address check', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x742D35CC6634C0532925A3B844BC9E7595F0BEB7' // Same address, different case
      };

      await expect(prepareTransferHat(input)).rejects.toThrow('Cannot transfer to same address');
    });
  });

  describe('edge cases', () => {
    it('should handle network with high gas prices', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(120000n)),
        getGasPrice: vi.fn(() => Promise.resolve(500000000000n)), // 500 gwei - very high
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareTransferHat(input);
      expect(result).toBeDefined();
      expect(parseFloat(result.metadata.estimatedCostEth)).toBeGreaterThan(0.05); // High cost expected
    });

    it('should handle checksum addresses', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7', // Checksum address
        to: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareTransferHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[1].toLowerCase()).toBe(input.from.toLowerCase());
      expect(result.metadata.args[2].toLowerCase()).toBe(input.to.toLowerCase());
    });

    it('should handle minimal input correctly', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      const result = await prepareTransferHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.description).toContain('Transfer hat');
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
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      // Should not throw, but use default gas
      const result = await prepareTransferHat(input);
      expect(result).toBeDefined();
      expect(result.unsignedTransaction.gas).toBeDefined();
    });

    it('should handle RPC connection failure', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(120000n)),
        getGasPrice: vi.fn(() => Promise.reject(new Error('RPC connection failed'))),
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        to: '0x1234567890123456789012345678901234567890'
      };

      await expect(prepareTransferHat(input)).rejects.toThrow('RPC connection failed');
    });
  });
});