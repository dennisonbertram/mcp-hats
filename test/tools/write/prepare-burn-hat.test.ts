/**
 * Tests for prepare-burn-hat tool (handles both renouncing and removing hats)
 * Following TDD approach - tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepareBurnHat } from '../../../src/tools/write/prepare-burn-hat.js';
import { PreparedTransaction } from '../../../src/utils/transaction-builder.js';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    estimateGas: vi.fn(() => Promise.resolve(80000n)),
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

describe('prepare-burn-hat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should reject missing required fields', async () => {
      const invalidInput = {
        networkName: 'ethereum'
        // Missing required fields
      };

      await expect(prepareBurnHat(invalidInput as any)).rejects.toThrow();
    });

    it('should reject invalid hat ID', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: 'invalid-hat-id', // Not a valid uint256
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      await expect(prepareBurnHat(invalidInput)).rejects.toThrow('Invalid hat ID');
    });

    it('should reject invalid wearer address', async () => {
      const invalidInput = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: 'not-an-address'
      };

      await expect(prepareBurnHat(invalidInput)).rejects.toThrow('Invalid wearer address');
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

      await expect(prepareBurnHat(invalidInput)).rejects.toThrow('Unsupported network');
    });
  });

  describe('self-renounce (wearer renouncing their own hat)', () => {
    it('should prepare renounceHat when wearer equals fromAddress', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7' // Same as wearer
      };

      const result = await prepareBurnHat(input);

      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('renounceHat');
      expect(result.metadata.args).toEqual([1n]); // Just the hat ID
      expect(result.unsignedTransaction.to).toBe('0x3bc1A0Ad72417f2d411118085256fC53CBdDd137');
    });

    it('should default to renounceHat when no fromAddress provided', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
        // No fromAddress, assuming self-renounce
      };

      const result = await prepareBurnHat(input);

      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('renounceHat');
      expect(result.metadata.description.toLowerCase()).toContain('renounc');
    });

    it('should handle case-insensitive address comparison', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        fromAddress: '0x742D35CC6634C0532925A3B844BC9E7595F0BEB7' // Different case
      };

      const result = await prepareBurnHat(input);

      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('renounceHat');
    });
  });

  describe('admin burn (admin removing hat from wearer)', () => {
    it('should prepare setHatWearerStatus for admin burn', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        fromAddress: '0x1234567890123456789012345678901234567890', // Different from wearer (admin)
        adminBurn: true // Explicit admin burn flag
      };

      const result = await prepareBurnHat(input);

      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('setHatWearerStatus');
      // setHatWearerStatus(hatId, wearer, eligible=false, standing=false)
      expect(result.metadata.args).toEqual([
        1n,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        false, // not eligible
        false  // not in good standing
      ]);
    });

    it('should use setHatWearerStatus when fromAddress differs from wearer', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        fromAddress: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa' // Different address
      };

      const result = await prepareBurnHat(input);

      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('setHatWearerStatus');
      expect(result.metadata.description).toContain('Remove hat');
    });
  });

  describe('transaction preparation', () => {
    it('should apply gas multiplier correctly', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        gasEstimateMultiplier: 1.5
      };

      const result = await prepareBurnHat(input);
      
      // Gas estimate was 80000n, with 1.5x multiplier = 120000
      expect(result.unsignedTransaction.gas).toBe('120000');
    });

    it('should handle very large hat IDs', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '115792089237316195423570985008687907853269984665640564039457584007913129639935', // Max uint256
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const result = await prepareBurnHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.args[0]).toBe(BigInt(input.hatId));
    });
  });

  describe('edge cases', () => {
    it('should handle network with high gas prices', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(80000n)),
        getGasPrice: vi.fn(() => Promise.resolve(500000000000n)), // 500 gwei - very high
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      const result = await prepareBurnHat(input);
      expect(result).toBeDefined();
      expect(parseFloat(result.metadata.estimatedCostEth)).toBeGreaterThan(0.03); // High cost expected
    });

    it('should handle checksum addresses', async () => {
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7' // Checksum address
      };

      const result = await prepareBurnHat(input);
      expect(result).toBeDefined();
    });

    it('should handle zero address as wearer (edge case)', async () => {
      // While unusual, we might want to handle removing from zero address
      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x0000000000000000000000000000000000000000',
        fromAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        adminBurn: true
      };

      // Should still work but warn
      const result = await prepareBurnHat(input);
      expect(result).toBeDefined();
      expect(result.metadata.functionName).toBe('setHatWearerStatus');
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
      const result = await prepareBurnHat(input);
      expect(result).toBeDefined();
      expect(result.unsignedTransaction.gas).toBeDefined();
    });

    it('should handle RPC connection failure', async () => {
      const { createPublicClient } = await import('viem');
      (createPublicClient as any).mockReturnValue({
        estimateGas: vi.fn(() => Promise.resolve(80000n)),
        getGasPrice: vi.fn(() => Promise.reject(new Error('RPC connection failed'))),
        getChainId: vi.fn(() => Promise.resolve(1))
      });

      const input = {
        networkName: 'ethereum',
        hatId: '1',
        wearer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      };

      await expect(prepareBurnHat(input)).rejects.toThrow('RPC connection failed');
    });
  });
});