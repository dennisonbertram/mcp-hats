/**
 * Tests for get-tree-structure tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTreeStructure } from '../../../src/tools/read/get-tree-structure.js';
import * as subgraphClient from '../../../src/clients/subgraph-client.js';
import * as hatsClient from '../../../src/clients/hats-client.js';

// Mock the client modules
vi.mock('../../../src/clients/subgraph-client.js', () => ({
  queryTreeStructure: vi.fn()
}));

vi.mock('../../../src/clients/hats-client.js', () => ({
  hatIdToPretty: vi.fn((id) => {
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
  getHatLevel: vi.fn((id) => {
    const hex = id.slice(2);
    let level = 0;
    for (let i = 0; i < hex.length; i += 8) {
      if (hex.slice(i, i + 8) !== '00000000') level++;
      else break;
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

describe('get-tree-structure tool', () => {
  const mockTreeId = '0x00000001';
  const mockNetwork = 'ethereum';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful queries', () => {
    it('should return tree structure with hierarchical data', async () => {
      const mockTreeData = {
        id: mockTreeId,
        hats: [
          {
            id: '0x0000000100000000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001',
            details: 'Organization Root',
            status: true,
            levelAtLocalTree: 1,
            maxSupply: '1',
            currentSupply: '1',
            admin: null,
            subHats: [
              { id: '0x0000000100010000000000000000000000000000000000000000000000000000' },
              { id: '0x0000000100020000000000000000000000000000000000000000000000000000' }
            ],
            wearers: [{ id: '0x1111111111111111111111111111111111111111' }]
          },
          {
            id: '0x0000000100010000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001.0001',
            details: 'Department A',
            status: true,
            levelAtLocalTree: 2,
            maxSupply: '10',
            currentSupply: '3',
            admin: { id: '0x0000000100000000000000000000000000000000000000000000000000000000' },
            subHats: [
              { id: '0x0000000100010001000000000000000000000000000000000000000000000000' }
            ],
            wearers: []
          },
          {
            id: '0x0000000100010001000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001.0001.0001',
            details: 'Team Lead A1',
            status: true,
            levelAtLocalTree: 3,
            maxSupply: '5',
            currentSupply: '2',
            admin: { id: '0x0000000100010000000000000000000000000000000000000000000000000000' },
            subHats: [],
            wearers: [
              { id: '0x2222222222222222222222222222222222222222' },
              { id: '0x3333333333333333333333333333333333333333' }
            ]
          },
          {
            id: '0x0000000100020000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001.0002',
            details: 'Department B',
            status: true,
            levelAtLocalTree: 2,
            maxSupply: '8',
            currentSupply: '1',
            admin: { id: '0x0000000100000000000000000000000000000000000000000000000000000000' },
            subHats: [],
            wearers: [{ id: '0x4444444444444444444444444444444444444444' }]
          }
        ]
      };

      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue(mockTreeData);

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.treeId).toBe(mockTreeId);
      expect(result.data.structure).toBeDefined();
      
      // Check root node
      const root = result.data.structure;
      expect(root.id).toBe('0x0000000100000000000000000000000000000000000000000000000000000000');
      expect(root.name).toBe('Organization Root');
      expect(root.level).toBe(1);
      expect(root.children).toHaveLength(2);
      
      // Check first child
      const deptA = root.children![0];
      expect(deptA.name).toBe('Department A');
      expect(deptA.level).toBe(2);
      expect(deptA.children).toHaveLength(1);
      
      // Check grandchild
      const teamLead = deptA.children![0];
      expect(teamLead.name).toBe('Team Lead A1');
      expect(teamLead.level).toBe(3);
      expect(teamLead.children).toHaveLength(0);
      
      // Check stats
      expect(result.data.stats.totalHats).toBe(4);
      expect(result.data.stats.totalWearers).toBe(4); // 1 + 0 + 2 + 1 = 4
      expect(result.data.stats.maxDepth).toBe(3);
    });

    it('should generate ASCII tree visualization when format is tree', async () => {
      const mockTreeData = {
        id: mockTreeId,
        hats: [
          {
            id: '0x0000000100000000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001',
            details: 'Root',
            status: true,
            levelAtLocalTree: 1,
            currentSupply: '1',
            admin: null,
            subHats: [
              { id: '0x0000000100010000000000000000000000000000000000000000000000000000' }
            ],
            wearers: []
          },
          {
            id: '0x0000000100010000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001.0001',
            details: 'Child',
            status: true,
            levelAtLocalTree: 2,
            currentSupply: '2',
            admin: { id: '0x0000000100000000000000000000000000000000000000000000000000000000' },
            subHats: [],
            wearers: []
          }
        ]
      };

      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue(mockTreeData);

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        format: 'tree'
      });

      expect(result.success).toBe(true);
      expect(result.data.visualization).toBeDefined();
      expect(result.data.visualization).toContain('Root');
      expect(result.data.visualization).toContain('└── Child');
    });

    it('should respect maxDepth parameter', async () => {
      const mockTreeData = {
        id: mockTreeId,
        hats: [
          {
            id: '0x0000000100000000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001',
            details: 'Root',
            status: true,
            levelAtLocalTree: 1,
            admin: null,
            subHats: [
              { id: '0x0000000100010000000000000000000000000000000000000000000000000000' }
            ],
            wearers: []
          },
          {
            id: '0x0000000100010000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001.0001',
            details: 'Level 2',
            status: true,
            levelAtLocalTree: 2,
            admin: { id: '0x0000000100000000000000000000000000000000000000000000000000000000' },
            subHats: [
              { id: '0x0000000100010001000000000000000000000000000000000000000000000000' }
            ],
            wearers: []
          },
          {
            id: '0x0000000100010001000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001.0001.0001',
            details: 'Level 3',
            status: true,
            levelAtLocalTree: 3,
            admin: { id: '0x0000000100010000000000000000000000000000000000000000000000000000' },
            subHats: [],
            wearers: []
          }
        ]
      };

      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue(mockTreeData);

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        maxDepth: 2,
        format: 'json'
      });

      expect(result.success).toBe(true);
      const root = result.data.structure;
      expect(root.children).toHaveLength(1);
      // Level 3 should not be included due to maxDepth
      expect(root.children![0].children).toHaveLength(0);
    });

    it('should include wearer details when requested', async () => {
      const mockTreeData = {
        id: mockTreeId,
        hats: [
          {
            id: '0x0000000100000000000000000000000000000000000000000000000000000000',
            prettyId: '0x00000001',
            details: 'Root',
            status: true,
            levelAtLocalTree: 1,
            admin: null,
            subHats: [],
            wearers: [
              { id: '0x1234567890123456789012345678901234567890' },
              { id: '0xabcdef0123456789012345678901234567890abc' }
            ]
          }
        ]
      };

      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue(mockTreeData);

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        includeWearers: true,
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.data.structure.wearers).toBeDefined();
      expect(result.data.structure.wearers).toHaveLength(2);
      expect(result.data.structure.wearers![0]).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should return flat list when format is flat', async () => {
      const mockTreeData = {
        id: mockTreeId,
        hats: [
          {
            id: '0x0000000100000000000000000000000000000000000000000000000000000000',
            details: 'Root',
            status: true,
            levelAtLocalTree: 1,
            currentSupply: '1',
            admin: null,
            subHats: [],
            wearers: []
          },
          {
            id: '0x0000000100010000000000000000000000000000000000000000000000000000',
            details: 'Child',
            status: true,
            levelAtLocalTree: 2,
            currentSupply: '1',
            admin: { id: '0x0000000100000000000000000000000000000000000000000000000000000000' },
            subHats: [],
            wearers: []
          }
        ]
      };

      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue(mockTreeData);

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        format: 'flat'
      });

      expect(result.success).toBe(true);
      expect(result.data.flatList).toBeDefined();
      expect(result.data.flatList).toHaveLength(2);
      expect(result.data.flatList![0].name).toBe('Root');
      expect(result.data.flatList![1].name).toBe('Child');
    });
  });

  describe('error handling', () => {
    it('should handle invalid tree ID format', async () => {
      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: 'invalid-tree-id',
        format: 'json'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid tree ID format');
    });

    it('should handle network errors', async () => {
      vi.mocked(subgraphClient.queryTreeStructure).mockRejectedValue(
        new Error('Network error')
      );

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        format: 'json'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Network error');
    });

    it('should handle empty tree', async () => {
      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue({
        id: mockTreeId,
        hats: []
      });

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.data.stats.totalHats).toBe(0);
      expect(result.data.structure).toBeDefined();
      expect(result.metadata?.warning).toContain('Tree has no hats');
    });

    it('should handle tree not found', async () => {
      vi.mocked(subgraphClient.queryTreeStructure).mockResolvedValue(null);

      const result = await getTreeStructure({
        networkName: mockNetwork,
        treeId: mockTreeId,
        format: 'json'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Tree not found');
    });
  });
});