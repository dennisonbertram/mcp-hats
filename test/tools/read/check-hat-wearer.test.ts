/**
 * Tests for check-hat-wearer tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkHatWearer } from '../../../src/tools/read/check-hat-wearer.js';
import * as hatsClient from '../../../src/clients/hats-client.js';
import * as subgraphClient from '../../../src/clients/subgraph-client.js';
import type { HatId } from '../../../src/types/index.js';

// Mock the client modules
vi.mock('../../../src/clients/hats-client.js', () => ({
  getHatsClient: vi.fn(),
  formatHatId: vi.fn((id) => id),
  hatIdToPretty: vi.fn((id) => '0x00000001.0001.0001'),
  getHatLevel: vi.fn(() => 3),
  getTreeId: vi.fn((id) => id.slice(0, 10)),
  prettyToHatId: vi.fn((id) => '0x0000000100010001000000000000000000000000000000000000000000000000')
}));

vi.mock('../../../src/clients/subgraph-client.js', () => ({
  queryHatDetails: vi.fn()
}));

vi.mock('../../../src/networks/index.js', () => ({
  getNetworkConfig: vi.fn(() => ({
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com'
  }))
}));

describe('check-hat-wearer tool', () => {
  const mockHatsClientInstance = {
    isWearerOfHat: vi.fn(),
    isInGoodStanding: vi.fn(),
    getHat: vi.fn()
  };

  const mockHatId = '0x0000000100010001000000000000000000000000000000000000000000000000' as HatId;
  const mockWearer = '0x1234567890123456789012345678901234567890';
  const mockNetwork = 'ethereum';

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock returns
    vi.mocked(hatsClient.getHatsClient).mockResolvedValue(mockHatsClientInstance as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful checks', () => {
    it('should return true when address is wearing the hat and in good standing', async () => {
      // Setup mocks
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(true);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 5,
        imageUri: 'ipfs://test',
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        tree: { id: '0x00000001' },
        levelAtLocalTree: 3,
        admin: {
          id: '0x0000000100010000000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0001'
        }
      });

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.isWearer).toBe(true);
      expect(result.data.isInGoodStanding).toBe(true);
      expect(result.data.hatDetails).toBeDefined();
      expect(result.data.hatDetails.name).toBe('Test Hat');
      expect(result.data.hatDetails.level).toBe(3);
      expect(result.data.treeInfo).toBeDefined();
      expect(result.data.summary).toContain('is wearing');
      expect(result.data.summary).toContain('in good standing');
    });

    it('should return false when address is not wearing the hat', async () => {
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(false);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(false);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 5,
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        tree: { id: '0x00000001' }
      });

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.isWearer).toBe(false);
      expect(result.data.isInGoodStanding).toBe(false);
      expect(result.data.summary).toContain('is not wearing');
    });

    it('should handle pretty format hat IDs', async () => {
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(true);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        tree: { id: '0x00000001' }
      });

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: '0x00000001.0001.0001', // Pretty format
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.isWearer).toBe(true);
    });

    it('should handle wearer in bad standing', async () => {
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(true);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(false);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        tree: { id: '0x00000001' }
      });

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.isWearer).toBe(true);
      expect(result.data.isInGoodStanding).toBe(false);
      expect(result.data.summary).toContain('not in good standing');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(hatsClient.getHatsClient).mockRejectedValue(
        new Error('Network connection failed')
      );

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Network connection failed');
    });

    it('should handle invalid hat ID format', async () => {
      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: 'invalid-hat-id',
        wearer: mockWearer
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid hat ID format');
    });

    it('should handle invalid wearer address', async () => {
      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: 'invalid-address'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid wearer address');
    });

    it('should handle subgraph query failures gracefully', async () => {
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(true);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockRejectedValue(
        new Error('Subgraph unavailable')
      );

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      // Should still work with SDK data only
      expect(result.success).toBe(true);
      expect(result.data.isWearer).toBe(true);
      expect(result.data.hatDetails).toBeDefined();
      // But tree info might be limited
      expect(result.metadata?.warning).toContain('Subgraph data unavailable');
    });

    it('should validate network name', async () => {
      // Since we're mocking getNetworkConfig globally, we need to mock it to throw
      // when called with an invalid network name
      const networks = await import('../../../src/networks/index.js');
      vi.mocked(networks.getNetworkConfig).mockImplementationOnce((network) => {
        throw new Error(`Unsupported network: ${network}`);
      });
      
      const result = await checkHatWearer({
        networkName: 'invalid-network',
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unsupported network');
    });
  });

  describe('data enrichment', () => {
    it('should include full hat metadata when available', async () => {
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(true);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 5,
        imageUri: 'ipfs://QmTest',
        eligibility: '0x1111111111111111111111111111111111111111',
        toggle: '0x2222222222222222222222222222222222222222',
        mutable: true,
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        maxSupply: '10',
        currentSupply: '5',
        eligibility: '0x1111111111111111111111111111111111111111',
        toggle: '0x2222222222222222222222222222222222222222',
        imageUri: 'ipfs://QmTest',
        tree: { id: '0x00000001' },
        levelAtLocalTree: 3,
        admin: {
          id: '0x0000000100010000000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0001',
          details: 'Admin Hat'
        },
        wearers: [
          { id: mockWearer },
          { id: '0xaaaa567890123456789012345678901234567890' }
        ]
      });

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.supply).toEqual({
        current: 5,
        max: 10,
        percentage: 50
      });
      expect(result.data.metadata.modules).toEqual({
        eligibility: '0x1111111111111111111111111111111111111111',
        toggle: '0x2222222222222222222222222222222222222222'
      });
      expect(result.data.metadata.imageUri).toBe('ipfs://QmTest');
      expect(result.data.metadata.mutable).toBe(true);
      expect(result.data.metadata.totalWearers).toBe(2);
    });

    it('should handle tree hierarchy information', async () => {
      mockHatsClientInstance.isWearerOfHat.mockResolvedValue(true);
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Child Hat',
        status: true
      });

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Child Hat',
        status: true,
        tree: { 
          id: '0x00000001',
          hats: [
            { id: '0x0000000100000000000000000000000000000000000000000000000000000000' },
            { id: '0x0000000100010000000000000000000000000000000000000000000000000000' },
            { id: mockHatId }
          ]
        },
        levelAtLocalTree: 3,
        admin: {
          id: '0x0000000100010000000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0001',
          details: 'Parent Hat'
        }
      });

      const result = await checkHatWearer({
        networkName: mockNetwork,
        hatId: mockHatId,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.treeInfo).toBeDefined();
      expect(result.data.treeInfo.treeId).toBe('0x00000001');
      expect(result.data.treeInfo.adminHat).toBeDefined();
      expect(result.data.treeInfo.adminHat.prettyId).toBe('0x00000001.0001');
      expect(result.data.treeInfo.totalHatsInTree).toBe(3);
    });
  });
});