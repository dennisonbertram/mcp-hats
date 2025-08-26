/**
 * Tests for prepare-create-hat tool
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareCreateHat } from '../../../src/tools/write/prepare-create-hat.js';
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

describe('prepare-create-hat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should reject missing required fields', async () => {
      const invalidInput = {
        networkName: 'ethereum'
        // Missing required fields
      };

      await expect(prepareCreateHat(invalidInput as any)).rejects.toThrow();
    });

    it('should reject invalid admin hat ID', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        admin: 'invalid-hat-id', // Not a valid uint256
        details: 'Test Hat',
        maxSupply: 100,
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        imageURI: 'https://example.com/hat.png'
      };

      await expect(prepareCreateHat(invalidInput)).rejects.toThrow('Invalid admin hat ID');
    });

    it('should reject invalid eligibility address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        admin: '1', // Valid hat ID
        details: 'Test Hat',
        maxSupply: 100,
        eligibility: 'not-an-address',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        imageURI: 'https://example.com/hat.png'
      };

      await expect(prepareCreateHat(invalidInput)).rejects.toThrow('Invalid eligibility address');
    });

    it('should reject max supply less than 1', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 0, // Invalid
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        imageURI: 'https://example.com/hat.png'
      };

      await expect(prepareCreateHat(invalidInput)).rejects.toThrow('Max supply must be at least 1');
    });

    it('should reject unsupported network', async () => {
      const invalidInput = {
        networkName: 'unsupported-network',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100,
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        imageURI: 'https://example.com/hat.png'
      };

      const { getNetworkConfig } = await import('../../../src/networks/index.js');
      (getNetworkConfig as any).mockImplementation(() => {
        throw new Error('Unsupported network');
      });

      await expect(prepareCreateHat(invalidInput)).rejects.toThrow('Unsupported network');
    });
  });

  describe('transaction preparation', () => {
    it('should prepare a valid create hat transaction', async () => {
      const validInput = {
        networkName: 'ethereum',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100,
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        imageURI: 'https://example.com/hat.png'
      };

      const result = await prepareCreateHat(validInput);

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
      expect(result.metadata.functionName).toBe('createHat');
      expect(result.metadata.contractAddress).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
      expect(result.metadata.estimatedCostEth).toBeDefined();
    });

    it('should use default values for optional fields', async () => {
      const minimalInput = {
        networkName: 'ethereum',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100
        // Optional fields not provided
      };

      const result = await prepareCreateHat(minimalInput);

      expect(result).toBeDefined();
      expect(result.metadata.args).toContain('0x0000000000000000000000000000000000000000'); // Zero address for eligibility
      expect(result.metadata.args).toContain(true); // Default mutable = true
    });

    it('should apply gas multiplier correctly', async () => {
      const input = {
        networkName: 'ethereum',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100,
        gasEstimateMultiplier: 1.5
      };

      const result = await prepareCreateHat(input);
      
      // Gas estimate was 150000n, with 1.5x multiplier = 225000
      expect(result.unsignedTransaction.gas).toBe('225000');
    });

    it('should include from address when provided', async () => {
      const input = {
        networkName: 'ethereum',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100,
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const result = await prepareCreateHat(input);
      expect(result).toBeDefined();
      
      // Verify that the mock client was called with the from address
      const { createPublicClient } = await import('viem');
      const mockClient = (createPublicClient as any).mock.results[0].value;
      expect(mockClient.estimateGas).toHaveBeenCalledWith(
        expect.objectContaining({
          account: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
        })
      );
    });

    it('should handle very large hat IDs', async () => {
      const input = {
        networkName: 'ethereum',
        admin: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
        details: 'Test Hat',
        maxSupply: 100
      };

      const result = await prepareCreateHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[0]).toBe(BigInt(input.admin));
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
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100
      };

      const result = await prepareCreateHat(input);
      expect(result).toBeDefined();
      expect(parseFloat(result.metadata.estimatedCostEth)).toBeGreaterThan(0.05); // High cost expected
    });

    it('should handle empty details string', async () => {
      const input = {
        networkName: 'ethereum',
        admin: '1',
        details: '', // Empty details
        maxSupply: 100
      };

      const result = await prepareCreateHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[1]).toBe('');
    });

    it('should handle max uint32 for maxSupply', async () => {
      const input = {
        networkName: 'ethereum',
        admin: '1',
        details: 'Test Hat',
        maxSupply: 4294967295 // Max uint32
      };

      const result = await prepareCreateHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[2]).toBe(4294967295);
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
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100
      };

      // Should not throw, but use default gas
      const result = await prepareCreateHat(input);
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
        admin: '1',
        details: 'Test Hat',
        maxSupply: 100
      };

      await expect(prepareCreateHat(input)).rejects.toThrow('RPC connection failed');
    });
  });
});