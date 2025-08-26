/**
 * Tests for query-hats-by-wearer tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryHatsByWearer } from '../../../src/tools/read/query-hats-by-wearer.js';
import * as subgraphClient from '../../../src/clients/subgraph-client.js';
import * as hatsClient from '../../../src/clients/hats-client.js';
import type { HatId } from '../../../src/types/index.js';
import { isAddress } from 'viem';

// Mock the client modules
vi.mock('../../../src/clients/subgraph-client.js', () => ({
  queryWearerHats: vi.fn()
}));

vi.mock('../../../src/clients/hats-client.js', () => ({
  getHatsClient: vi.fn(),
  hatIdToPretty: vi.fn((id) => {
    // Simple mock implementation
    const hex = id.slice(2);
    const chunks = [];
    for (let i = 0; i < hex.length; i += 8) {
      const chunk = hex.slice(i, i + 8);
      if (chunk !== '00000000') {
        chunks.push(chunk);
      } else {
        break;
      }
    }
    return '0x' + chunks.join('.');
  }),
  getTreeId: vi.fn((id) => id.slice(0, 10)),
  getHatLevel: vi.fn((id) => {
    const hex = id.slice(2);
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
  })
}));

vi.mock('../../../src/networks/index.js', () => ({
  getNetworkConfig: vi.fn(() => ({
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com'
  }))
}));

vi.mock('viem', () => ({
  isAddress: vi.fn((addr) => /^0x[a-fA-F0-9]{40}$/.test(addr))
}));

describe('query-hats-by-wearer tool', () => {
  const mockWearer = '0x1234567890123456789012345678901234567890';
  const mockNetwork = 'ethereum';

  const mockHatsClientInstance = {
    isInGoodStanding: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hatsClient.getHatsClient).mockResolvedValue(mockHatsClientInstance as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful queries', () => {
    it('should return all hats worn by an address', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0001.0001',
          details: 'Engineering Team Lead',
          status: true,
          imageUri: 'ipfs://QmTest1',
          tree: { id: '0x00000001' }
        },
        {
          id: '0x0000000200010000000000000000000000000000000000000000000000000000',
          prettyId: '0x00000002.0001',
          details: 'Marketing Director',
          status: true,
          imageUri: 'ipfs://QmTest2',
          tree: { id: '0x00000002' }
        },
        {
          id: '0x0000000100020001000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0002.0001',
          details: 'DevOps Engineer',
          status: true,
          imageUri: 'ipfs://QmTest3',
          tree: { id: '0x00000001' }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats
      });

      // Mock good standing for all hats
      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer,
        includeInactive: false,
        groupByTree: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalHats).toBe(3);
      expect(result.data.hats).toHaveLength(3);
      
      // Check hat details
      expect(result.data.hats[0].hatId).toBe(mockHats[0].id);
      expect(result.data.hats[0].prettyId).toContain('0x00000001');
      expect(result.data.hats[0].name).toBe('Engineering Team Lead');
      expect(result.data.hats[0].isActive).toBe(true);
      expect(result.data.hats[0].inGoodStanding).toBe(true);

      // Check tree grouping
      expect(result.data.trees).toBeDefined();
      expect(Object.keys(result.data.trees!)).toHaveLength(2); // 2 different trees
      expect(result.data.trees!['0x00000001']).toHaveLength(2); // 2 hats in tree 1
      expect(result.data.trees!['0x00000002']).toHaveLength(1); // 1 hat in tree 2
    });

    it('should handle wearer with no hats', async () => {
      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: []
      });

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.totalHats).toBe(0);
      expect(result.data.hats).toHaveLength(0);
      expect(result.data.summary).toContain('is not wearing any hats');
    });

    it('should include inactive hats when requested', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          details: 'Active Hat',
          status: true,
          tree: { id: '0x00000001' }
        },
        {
          id: '0x0000000200010000000000000000000000000000000000000000000000000000',
          details: 'Inactive Hat',
          status: false, // Inactive
          tree: { id: '0x00000002' }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats,
        allHats: mockHats // Include in allHats
      });

      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer,
        includeInactive: true
      });

      expect(result.success).toBe(true);
      expect(result.data.totalHats).toBe(2);
      expect(result.data.hats).toHaveLength(2);
      expect(result.data.hats[1].isActive).toBe(false);
    });

    it('should handle pagination', async () => {
      const mockHats = Array.from({ length: 5 }, (_, i) => ({
        id: `0x000000010001000${i}000000000000000000000000000000000000000000000000`,
        details: `Hat ${i + 1}`,
        status: true,
        tree: { id: '0x00000001' }
      }));

      // Return all hats - pagination will be applied in the tool
      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats // Return all 5 hats
      });

      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer,
        limit: 3,
        offset: 2
      });

      expect(result.success).toBe(true);
      expect(result.data.hats).toHaveLength(3);
      expect(result.data.hats[0].name).toBe('Hat 3');
      expect(result.data.hats[1].name).toBe('Hat 4');
      expect(result.data.hats[2].name).toBe('Hat 5');
      expect(result.metadata?.pagination).toEqual({
        limit: 3,
        offset: 2,
        hasMore: false // No more hats after these 3
      });
    });

    it('should not group by tree when groupByTree is false', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          details: 'Hat 1',
          status: true,
          tree: { id: '0x00000001' }
        },
        {
          id: '0x0000000100020001000000000000000000000000000000000000000000000000',
          details: 'Hat 2',
          status: true,
          tree: { id: '0x00000001' }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats
      });

      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer,
        groupByTree: false
      });

      expect(result.success).toBe(true);
      expect(result.data.hats).toHaveLength(2);
      expect(result.data.trees).toBeUndefined();
    });

    it('should check good standing for each hat', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          details: 'Hat in Good Standing',
          status: true,
          tree: { id: '0x00000001' }
        },
        {
          id: '0x0000000200010000000000000000000000000000000000000000000000000000',
          details: 'Hat in Bad Standing',
          status: true,
          tree: { id: '0x00000002' }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats
      });

      // First hat in good standing, second not
      mockHatsClientInstance.isInGoodStanding
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.hats[0].inGoodStanding).toBe(true);
      expect(result.data.hats[1].inGoodStanding).toBe(false);
      expect(result.data.metadata?.inGoodStandingCount).toBe(1);
      expect(result.data.metadata?.notInGoodStandingCount).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid wearer address', async () => {
      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: 'invalid-address'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid wearer address');
    });

    it('should handle network errors', async () => {
      vi.mocked(subgraphClient.queryWearerHats).mockRejectedValue(
        new Error('Network error')
      );

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should handle unsupported network', async () => {
      const networks = await import('../../../src/networks/index.js');
      vi.mocked(networks.getNetworkConfig).mockImplementationOnce(() => {
        throw new Error('Unsupported network: invalid-network');
      });

      const result = await queryHatsByWearer({
        networkName: 'invalid-network',
        wearer: mockWearer
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unsupported network');
    });

    it('should handle subgraph returning null wearer', async () => {
      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue(null);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.totalHats).toBe(0);
      expect(result.data.hats).toHaveLength(0);
    });

    it('should handle errors when checking good standing', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          details: 'Test Hat',
          status: true,
          tree: { id: '0x00000001' }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats
      });

      // Mock error when checking good standing
      mockHatsClientInstance.isInGoodStanding.mockRejectedValue(
        new Error('Contract call failed')
      );

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer
      });

      // Should still succeed but with unknown standing
      expect(result.success).toBe(true);
      expect(result.data.hats[0].inGoodStanding).toBeUndefined();
      expect(result.metadata?.warning).toContain('Failed to check good standing');
    });
  });

  describe('data formatting', () => {
    it('should generate proper summary messages', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          details: 'Hat 1',
          status: true,
          tree: { id: '0x00000001' }
        },
        {
          id: '0x0000000200010000000000000000000000000000000000000000000000000000',
          details: 'Hat 2',
          status: true,
          tree: { id: '0x00000002' }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats
      });

      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer
      });

      expect(result.success).toBe(true);
      expect(result.data.summary).toContain('is wearing 2 hats');
      expect(result.data.summary).toContain('across 2 trees');
    });

    it('should include hat metadata when available', async () => {
      const mockHats = [
        {
          id: '0x0000000100010001000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0001.0001',
          details: 'Engineering Lead',
          status: true,
          imageUri: 'ipfs://QmTestImage',
          maxSupply: '10',
          currentSupply: '5',
          eligibility: '0x1111111111111111111111111111111111111111',
          toggle: '0x2222222222222222222222222222222222222222',
          tree: { 
            id: '0x00000001',
            hats: [{ id: '0x00000001' }, { id: '0x00000002' }]
          }
        }
      ];

      vi.mocked(subgraphClient.queryWearerHats).mockResolvedValue({
        id: mockWearer,
        currentHats: mockHats
      });

      mockHatsClientInstance.isInGoodStanding.mockResolvedValue(true);

      const result = await queryHatsByWearer({
        networkName: mockNetwork,
        wearer: mockWearer,
        includeDetails: true
      });

      expect(result.success).toBe(true);
      const hat = result.data.hats[0];
      expect(hat.imageUri).toBe('ipfs://QmTestImage');
      expect(hat.supply).toEqual({
        current: 5,
        max: 10
      });
      expect(hat.modules).toEqual({
        eligibility: '0x1111111111111111111111111111111111111111',
        toggle: '0x2222222222222222222222222222222222222222'
      });
    });
  });
});