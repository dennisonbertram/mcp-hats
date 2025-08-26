/**
 * Tests for get-hat-details tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHatDetails } from '../../../src/tools/read/get-hat-details.js';
import * as hatsClient from '../../../src/clients/hats-client.js';
import * as subgraphClient from '../../../src/clients/subgraph-client.js';
import type { HatId } from '../../../src/types/index.js';

// Mock the client modules
vi.mock('../../../src/clients/hats-client.js', () => ({
  getHatsClient: vi.fn(),
  formatHatId: vi.fn((id) => id),
  hatIdToPretty: vi.fn((id) => '0x00000001.0001.0001'),
  prettyToHatId: vi.fn((id) => '0x0000000100010001000000000000000000000000000000000000000000000000'),
  getHatLevel: vi.fn(() => 3),
  getTreeId: vi.fn((id) => '0x00000001'),
  isTopHat: vi.fn(() => false),
  getParentHatId: vi.fn(() => '0x0000000100010000000000000000000000000000000000000000000000000000')
}));

vi.mock('../../../src/clients/subgraph-client.js', () => ({
  queryHatDetails: vi.fn(),
  queryHatWearers: vi.fn()
}));

vi.mock('../../../src/networks/index.js', () => ({
  getNetworkConfig: vi.fn(() => ({
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com'
  }))
}));

describe('get-hat-details tool', () => {
  const mockHatsClientInstance = {
    getHat: vi.fn(),
    isHatActive: vi.fn()
  };

  const mockHatId = '0x0000000100010001000000000000000000000000000000000000000000000000' as HatId;
  const mockNetwork = 'ethereum';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hatsClient.getHatsClient).mockResolvedValue(mockHatsClientInstance as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful queries', () => {
    it('should return comprehensive hat details', async () => {
      // Setup SDK mock
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Engineering Team Lead',
        maxSupply: 5,
        supply: 3,
        imageUri: 'ipfs://QmTestImage',
        eligibility: '0x1111111111111111111111111111111111111111',
        toggle: '0x2222222222222222222222222222222222222222',
        mutable: true,
        status: true
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      // Setup subgraph mocks
      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Engineering Team Lead',
        status: true,
        maxSupply: '5',
        currentSupply: '3',
        eligibility: '0x1111111111111111111111111111111111111111',
        toggle: '0x2222222222222222222222222222222222222222',
        mutable: true,
        imageUri: 'ipfs://QmTestImage',
        createdAt: '1234567890',
        levelAtLocalTree: 3,
        tree: {
          id: '0x00000001',
          hats: []
        },
        admin: {
          id: '0x0000000100010000000000000000000000000000000000000000000000000000',
          prettyId: '0x00000001.0001',
          details: 'Engineering Department'
        },
        subHats: [
          { id: '0x0000000100010001000100000000000000000000000000000000000000000000', prettyId: '0x00000001.0001.0001.0001', details: 'Senior Engineer' },
          { id: '0x0000000100010001000200000000000000000000000000000000000000000000', prettyId: '0x00000001.0001.0001.0002', details: 'Junior Engineer' }
        ],
        wearers: [
          { id: '0x1234567890123456789012345678901234567890' },
          { id: '0xabcdef0123456789012345678901234567890abc' },
          { id: '0xdef0123456789012345678901234567890abcdef' }
        ]
      });

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.hatId).toBe(mockHatId);
      expect(result.data.prettyId).toBe('0x00000001.0001.0001');
      expect(result.data.details.name).toBe('Engineering Team Lead');
      expect(result.data.supply.current).toBe(3);
      expect(result.data.supply.max).toBe(5);
      expect(result.data.supply.available).toBe(2);
      expect(result.data.supply.percentageUsed).toBe(60);
      expect(result.data.modules.eligibility).toBe('0x1111111111111111111111111111111111111111');
      expect(result.data.modules.toggle).toBe('0x2222222222222222222222222222222222222222');
      expect(result.data.status.active).toBe(true);
      expect(result.data.status.mutable).toBe(true);
      expect(result.data.tree).toBeDefined();
      expect(result.data.tree.treeId).toBe('0x00000001');
      expect(result.data.tree.level).toBe(3);
      expect(result.data.admin).toBeDefined();
      expect(result.data.admin.prettyId).toBe('0x00000001.0001');
      expect(result.data.admin.name).toBe('Engineering Department');
      expect(result.data.subHats).toHaveLength(2);
      expect(result.data.wearers).toHaveLength(3);
    });

    it('should handle pretty format hat IDs', async () => {
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 5,
        status: true
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true
      });

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: '0x00000001.0001.0001', // Pretty format input
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data.hatId).toBe(mockHatId);
      expect(result.data.prettyId).toBe('0x00000001.0001.0001');
    });

    it('should handle top hat correctly', async () => {
      const topHatId = '0x0000000100000000000000000000000000000000000000000000000000000000';
      
      vi.mocked(hatsClient.isTopHat).mockReturnValue(true);
      vi.mocked(hatsClient.getParentHatId).mockReturnValue(null);
      vi.mocked(hatsClient.getHatLevel).mockReturnValue(1);

      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Organization Top Hat',
        maxSupply: 1,
        supply: 1,
        status: true
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: topHatId,
        prettyId: '0x00000001',
        details: 'Organization Top Hat',
        status: true,
        levelAtLocalTree: 1,
        tree: { id: '0x00000001' }
      });

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: topHatId,
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data.tree.isTopHat).toBe(true);
      expect(result.data.tree.level).toBe(1);
      expect(result.data.admin).toBeUndefined();
    });

    it('should exclude wearers when includeWearers is false', async () => {
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 5,
        status: true
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        wearers: [
          { id: '0x1234567890123456789012345678901234567890' }
        ]
      });

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data.wearers).toBeUndefined();
      expect(result.data.metadata?.totalWearers).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid hat ID format', async () => {
      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: 'invalid-hat-id',
        includeWearers: false
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid hat ID format');
    });

    it('should handle network errors', async () => {
      vi.mocked(hatsClient.getHatsClient).mockRejectedValue(
        new Error('Network connection failed')
      );

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network connection failed');
    });

    it('should handle non-existent hat gracefully', async () => {
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: '',
        maxSupply: 0,
        supply: 0,
        status: false
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(false);

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue(null);

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data.status.active).toBe(false);
      expect(result.data.details.name).toBe('Unnamed Hat');
      expect(result.metadata?.warning).toContain('Hat may not exist or has no details');
    });

    it('should continue when subgraph fails', async () => {
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 5,
        status: true,
        imageUri: 'ipfs://test',
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: false
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      vi.mocked(subgraphClient.queryHatDetails).mockRejectedValue(
        new Error('Subgraph unavailable')
      );

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.details.name).toBe('Test Hat');
      expect(result.metadata?.warning).toContain('Subgraph data unavailable');
    });

    it('should validate network name', async () => {
      const networks = await import('../../../src/networks/index.js');
      vi.mocked(networks.getNetworkConfig).mockImplementationOnce((network) => {
        throw new Error(`Unsupported network: ${network}`);
      });

      const result = await getHatDetails({
        networkName: 'invalid-network',
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unsupported network');
    });
  });

  describe('data formatting', () => {
    it('should calculate supply percentages correctly', async () => {
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 10,
        supply: 7,
        status: true
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        prettyId: '0x00000001.0001.0001',
        details: 'Test Hat',
        status: true,
        maxSupply: '10',
        currentSupply: '7'
      });

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data.supply.current).toBe(7);
      expect(result.data.supply.max).toBe(10);
      expect(result.data.supply.available).toBe(3);
      expect(result.data.supply.percentageUsed).toBe(70);
    });

    it('should handle unlimited supply', async () => {
      mockHatsClientInstance.getHat.mockResolvedValue({
        details: 'Test Hat',
        maxSupply: 0, // 0 means unlimited
        supply: 100,
        status: true
      });

      mockHatsClientInstance.isHatActive.mockResolvedValue(true);

      vi.mocked(subgraphClient.queryHatDetails).mockResolvedValue({
        id: mockHatId,
        details: 'Test Hat',
        maxSupply: '0',
        currentSupply: '100'
      });

      const result = await getHatDetails({
        networkName: mockNetwork,
        hatId: mockHatId,
        includeWearers: false
      });

      expect(result.success).toBe(true);
      expect(result.data.supply.max).toBe(0);
      expect(result.data.supply.current).toBe(100);
      expect(result.data.supply.available).toBe(-1); // Unlimited
      expect(result.data.supply.percentageUsed).toBe(0); // Can't calculate percentage for unlimited
    });
  });
});