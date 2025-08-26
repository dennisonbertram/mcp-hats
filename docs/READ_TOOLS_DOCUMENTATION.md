# MCP Hats Protocol Read-Only Tools Documentation

## Overview

This document describes the four core read-only tools implemented for the MCP Hats Protocol server. These tools provide comprehensive access to Hats Protocol state across multiple blockchain networks.

## Implemented Tools

### 1. check-hat-wearer

**Purpose**: Verify if an address is currently wearing a specific hat and check their standing status.

**Input Parameters**:
```typescript
{
  networkName: string;    // e.g., "ethereum", "polygon", "arbitrum"
  hatId: string;         // Hat ID (both formats supported: full hex or pretty)
  wearer: string;        // Ethereum address to check
}
```

**Example Usage**:
```json
{
  "networkName": "ethereum",
  "hatId": "0x00000001.0001.0001",
  "wearer": "0x1234567890123456789012345678901234567890"
}
```

**Example Response**:
```json
{
  "isWearer": true,
  "isInGoodStanding": true,
  "hatDetails": {
    "id": "0x0000000100010001000000000000000000000000000000000000000000000000",
    "prettyId": "0x00000001.0001.0001",
    "name": "Engineering Team Lead",
    "level": 3,
    "status": true
  },
  "treeInfo": {
    "treeId": "0x00000001",
    "topHatId": "0x0000000100000000000000000000000000000000000000000000000000000000",
    "adminHat": {
      "id": "0x0000000100010000000000000000000000000000000000000000000000000000",
      "prettyId": "0x00000001.0001",
      "name": "Engineering Department"
    },
    "totalHatsInTree": 15
  },
  "metadata": {
    "supply": {
      "current": 3,
      "max": 5,
      "percentage": 60
    },
    "modules": {
      "eligibility": "0x1111111111111111111111111111111111111111",
      "toggle": "0x2222222222222222222222222222222222222222"
    },
    "imageUri": "ipfs://QmTestImage",
    "mutable": true,
    "totalWearers": 3
  },
  "summary": "Address 0x1234...7890 is wearing the hat \"Engineering Team Lead\" and is in good standing."
}
```

### 2. get-hat-details

**Purpose**: Get comprehensive information about a specific hat.

**Input Parameters**:
```typescript
{
  networkName: string;       // Target network
  hatId: string;            // Hat ID to query
  includeWearers?: boolean; // Include list of current wearers (default: false)
}
```

**Example Usage**:
```json
{
  "networkName": "polygon",
  "hatId": "0x0000000100010001000000000000000000000000000000000000000000000000",
  "includeWearers": true
}
```

**Example Response**:
```json
{
  "hatId": "0x0000000100010001000000000000000000000000000000000000000000000000",
  "prettyId": "0x00000001.0001.0001",
  "details": {
    "name": "Marketing Director",
    "description": "Head of marketing department",
    "imageUri": "ipfs://QmMarketingLogo"
  },
  "supply": {
    "current": 1,
    "max": 1,
    "available": 0,
    "percentageUsed": 100
  },
  "status": {
    "active": true,
    "mutable": false
  },
  "modules": {
    "eligibility": "0x0000000000000000000000000000000000000000",
    "toggle": "0x0000000000000000000000000000000000000000"
  },
  "tree": {
    "treeId": "0x00000001",
    "topHatId": "0x0000000100000000000000000000000000000000000000000000000000000000",
    "level": 3,
    "isTopHat": false,
    "parentHatId": "0x0000000100010000000000000000000000000000000000000000000000000000"
  },
  "admin": {
    "id": "0x0000000100010000000000000000000000000000000000000000000000000000",
    "prettyId": "0x00000001.0001",
    "name": "Marketing Department"
  },
  "subHats": [
    {
      "id": "0x0000000100010001000100000000000000000000000000000000000000000000",
      "prettyId": "0x00000001.0001.0001.0001",
      "name": "Senior Marketing Manager"
    }
  ],
  "wearers": [
    {
      "address": "0xaaaa567890123456789012345678901234567890"
    }
  ],
  "metadata": {
    "createdAt": 1234567890,
    "totalWearers": 1
  }
}
```

### 3. query-hats-by-wearer

**Purpose**: Find all hats worn by a specific address.

**Input Parameters**:
```typescript
{
  networkName: string;         // Target network
  wearer: string;             // Address to query
  includeDetails?: boolean;   // Include hat details (default: true)
  includeInactive?: boolean;  // Include inactive/burned hats (default: false)
  groupByTree?: boolean;      // Group results by tree (default: true)
  limit?: number;             // Maximum results (default: 100)
  offset?: number;            // Pagination offset (default: 0)
}
```

**Example Usage**:
```json
{
  "networkName": "arbitrum",
  "wearer": "0x1234567890123456789012345678901234567890",
  "groupByTree": true,
  "limit": 50
}
```

**Example Response**:
```json
{
  "totalHats": 3,
  "hats": [
    {
      "hatId": "0x0000000100010001000000000000000000000000000000000000000000000000",
      "prettyId": "0x00000001.0001.0001",
      "name": "Engineering Lead",
      "isActive": true,
      "inGoodStanding": true,
      "treeId": "0x00000001",
      "level": 3,
      "imageUri": "ipfs://QmEngLead",
      "supply": {
        "current": 3,
        "max": 5
      }
    },
    {
      "hatId": "0x0000000200010000000000000000000000000000000000000000000000000000",
      "prettyId": "0x00000002.0001",
      "name": "Community Moderator",
      "isActive": true,
      "inGoodStanding": true,
      "treeId": "0x00000002",
      "level": 2
    }
  ],
  "trees": {
    "0x00000001": [
      {
        "hatId": "0x0000000100010001000000000000000000000000000000000000000000000000",
        "prettyId": "0x00000001.0001.0001",
        "name": "Engineering Lead"
      }
    ],
    "0x00000002": [
      {
        "hatId": "0x0000000200010000000000000000000000000000000000000000000000000000",
        "prettyId": "0x00000002.0001",
        "name": "Community Moderator"
      }
    ]
  },
  "metadata": {
    "activeCount": 3,
    "inGoodStandingCount": 3,
    "treeCount": 2
  },
  "summary": "Address 0x1234...7890 is wearing 3 hats across 2 trees."
}
```

### 4. get-tree-structure

**Purpose**: Visualize the hierarchical structure of a hat tree.

**Input Parameters**:
```typescript
{
  networkName: string;         // Target network
  treeId: string;             // Tree ID (first 4 bytes of top hat ID)
  maxDepth?: number;          // Maximum depth to traverse (default: unlimited)
  format?: 'tree' | 'flat' | 'json'; // Output format (default: 'json')
  includeWearers?: boolean;   // Include wearer details (default: false)
}
```

**Example Usage**:
```json
{
  "networkName": "base",
  "treeId": "0x00000001",
  "format": "tree",
  "maxDepth": 3
}
```

**Example Response (format: "tree")**:
```
└── Organization Root (0x00000001) [1 wearers]
    ├── Engineering Department (0x00000001.0001) [0 wearers]
    │   ├── Backend Team (0x00000001.0001.0001) [3 wearers]
    │   └── Frontend Team (0x00000001.0001.0002) [2 wearers]
    └── Marketing Department (0x00000001.0002) [1 wearers]
        └── Content Team (0x00000001.0002.0001) [4 wearers]
```

**Example Response (format: "json")**:
```json
{
  "treeId": "0x00000001",
  "structure": {
    "id": "0x0000000100000000000000000000000000000000000000000000000000000000",
    "prettyId": "0x00000001",
    "name": "Organization Root",
    "level": 1,
    "isActive": true,
    "wearerCount": 1,
    "children": [
      {
        "id": "0x0000000100010000000000000000000000000000000000000000000000000000",
        "prettyId": "0x00000001.0001",
        "name": "Engineering Department",
        "level": 2,
        "isActive": true,
        "wearerCount": 0,
        "children": [
          {
            "id": "0x0000000100010001000000000000000000000000000000000000000000000000",
            "prettyId": "0x00000001.0001.0001",
            "name": "Backend Team",
            "level": 3,
            "isActive": true,
            "wearerCount": 3,
            "children": []
          }
        ]
      }
    ]
  },
  "stats": {
    "totalHats": 6,
    "totalWearers": 11,
    "maxDepth": 3,
    "activeHats": 6,
    "inactiveHats": 0
  }
}
```

## Supported Networks

All tools support the following networks:

### Mainnet Networks
- `ethereum` - Ethereum Mainnet (Chain ID: 1)
- `polygon` - Polygon Mainnet (Chain ID: 137)
- `arbitrum` - Arbitrum One (Chain ID: 42161)
- `optimism` - Optimism Mainnet (Chain ID: 10)
- `base` - Base Mainnet (Chain ID: 8453)
- `gnosis` - Gnosis Chain (Chain ID: 100)

### Testnet Networks
- `sepolia` - Sepolia Testnet (Chain ID: 11155111)
- `base-sepolia` - Base Sepolia Testnet (Chain ID: 84532)

## Error Handling

All tools return a consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "details": { /* Additional error context */ }
  }
}
```

Common error codes:
- `INVALID_INPUT` - Invalid input parameters
- `NETWORK_ERROR` - Network connection issues
- `NOT_FOUND` - Resource not found
- `SUBGRAPH_ERROR` - Subgraph query failed

## Performance Considerations

1. **Caching**: All tools utilize client caching to improve performance for repeated queries.

2. **Fallback Strategy**: Tools attempt to use subgraph data first for efficiency, falling back to on-chain queries when necessary.

3. **Pagination**: The `query-hats-by-wearer` tool supports pagination for addresses with many hats.

4. **Depth Limiting**: The `get-tree-structure` tool supports depth limiting to prevent overwhelming responses for large trees.

## Testing

All tools have comprehensive test coverage:

- 44 tests total across all tools
- Mock-based unit tests for isolated testing
- Edge case handling
- Error scenario coverage

Run tests with:
```bash
npm test test/tools/read
```

## Integration

These tools are automatically registered with the MCP server and can be accessed through any MCP-compatible client. The server handles:

- Input validation
- Network configuration
- Error formatting
- Response serialization

## Future Enhancements

Potential improvements for these tools:

1. **ENS Resolution**: Resolve ENS names for wearer addresses
2. **Historical Data**: Add support for querying historical hat ownership
3. **Batch Operations**: Support batch queries for multiple hats/wearers
4. **Real-time Updates**: WebSocket support for live hat updates
5. **Advanced Filtering**: More sophisticated filtering options for large datasets