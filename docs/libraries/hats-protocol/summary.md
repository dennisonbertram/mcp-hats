# Hats Protocol V1 - Comprehensive Developer Guide

## Table of Contents
1. [What is Hats Protocol?](#what-is-hats-protocol)
2. [Core Concepts](#core-concepts)
3. [SDK V1 Core Setup & Usage](#sdk-v1-core-setup--usage)
4. [Subgraph Integration](#subgraph-integration)
5. [Common Patterns & Best Practices](#common-patterns--best-practices)
6. [Complete API Reference](#complete-api-reference)
7. [Code Examples](#code-examples)

---

## What is Hats Protocol?

Hats Protocol is a decentralized protocol for creating, managing, and distributing roles and authorities on Ethereum and EVM-compatible chains. It provides a hierarchical system where "hats" represent roles with specific permissions and responsibilities.

### Key Features:
- **Hierarchical Role Management**: Organize roles in tree structures with clear administrative relationships
- **Programmable Permissions**: Use modules for dynamic eligibility and toggle conditions
- **Cross-Chain Compatibility**: Deploy on multiple EVM chains
- **GraphQL API**: Query protocol data efficiently via subgraph
- **Developer-Friendly SDK**: TypeScript SDK for easy integration

### Architecture Overview:
- **Core Contracts**: Solidity contracts managing hat creation, assignment, and hierarchy
- **Modules**: Extensible system for custom logic (eligibility, toggle, etc.)
- **Subgraph**: The Graph protocol indexer for querying historical and current state
- **SDK**: TypeScript libraries for seamless integration

---

## Core Concepts

### 1. Hats
- **Definition**: A hat represents a specific role or responsibility
- **Properties**: 
  - Unique ID (256-bit hex)
  - Details (name, description, image)
  - Max supply (how many can be minted)
  - Status (active/inactive)
  - Mutability settings
- **Pretty ID Format**: `0x00000001.0001.0001` (IP address style for readability)

### 2. Trees
- **Definition**: Hierarchical structures organizing hats
- **Root**: Every tree has a "top hat" as its root
- **Tree ID**: First 4 bytes of the top hat ID (e.g., `0x00000001`)
- **Linking**: Trees can be linked to create larger organizational structures

### 3. Wearers
- **Definition**: Ethereum addresses that hold/wear hats
- **Standing**: Good or bad standing (affects permissions)
- **History**: Track all mint/burn events for accountability

### 4. Admin Relationships
- **Hat Admins**: Hats can admin other hats (create sub-hats, manage wearers)
- **Hierarchy**: Clear chain of authority from top hat down
- **Delegation**: Admins can delegate specific permissions

### 5. Modules
- **Eligibility Modules**: Determine who can wear a hat
- **Toggle Modules**: Control when a hat is active/inactive
- **Hatter Modules**: Control who can mint/burn hats

---

## SDK V1 Core Setup & Usage

### Installation

```bash
# Using npm
npm install @hatsprotocol/sdk-v1-core

# Using pnpm
pnpm add @hatsprotocol/sdk-v1-core

# Using yarn
yarn add @hatsprotocol/sdk-v1-core
```

### Project Structure
The SDK is organized as a monorepo with two main packages:
- **Core**: Direct contract interactions
- **Subgraph**: GraphQL data fetching

### Basic Setup

```typescript
import { HatsClient } from '@hatsprotocol/sdk-v1-core';
import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Create clients
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http()
});

// Initialize Hats client
const hatsClient = new HatsClient({
  chainId: mainnet.id,
  publicClient,
  walletClient
});
```

### Core Operations

#### Creating a Hat
```typescript
// Create a new hat under an admin hat
const result = await hatsClient.createHat({
  admin: '0x0000000100000000000000000000000000000000000000000000000000000000', // admin hat ID
  details: 'Engineering Lead',
  maxSupply: 1,
  eligibility: '0x0000000000000000000000000000000000000000', // eligibility module address
  toggle: '0x0000000000000000000000000000000000000000', // toggle module address
  mutable: true,
  imageURI: 'https://example.com/hat-image.png'
});
```

#### Minting a Hat
```typescript
// Mint a hat to a wearer
const mintResult = await hatsClient.mintHat({
  hatId: '0x0000000100010000000000000000000000000000000000000000000000000000',
  wearer: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571'
});
```

#### Checking Hat Status
```typescript
// Check if an address is wearing a specific hat
const isWearer = await hatsClient.isWearerOfHat({
  wearer: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571',
  hatId: '0x0000000100010000000000000000000000000000000000000000000000000000'
});

// Check hat details
const hatDetails = await hatsClient.getHat({
  hatId: '0x0000000100010000000000000000000000000000000000000000000000000000'
});
```

### Supported Networks
The SDK supports multiple networks out of the box:
- Ethereum Mainnet
- Polygon
- Arbitrum One
- Optimism
- Base
- Gnosis Chain
- Base Sepolia (testnet)

---

## Subgraph Integration

### Overview
The Hats Protocol subgraph indexes all protocol events and provides a GraphQL API for efficient data querying.

### Endpoint
- **Mainnet**: `hats-protocol/hats-v1-mainnet`

### Using the Subgraph Client

```typescript
import { HatsSubgraphClient } from '@hatsprotocol/sdk-v1-core';

const subgraphClient = new HatsSubgraphClient({
  config: {
    [mainnet.id]: {
      endpoint: 'https://api.studio.thegraph.com/query/...'
    }
  }
});
```

### Key Query Patterns

#### 1. Tree Queries

**Get All Trees:**
```graphql
{
  trees {
    id
    hats {
      id
      details
      wearers {
        id
      }
    }
  }
}
```

**Get Specific Tree:**
```graphql
{
  tree(id: "0x00000001") {
    id
    hats {
      id
      prettyId
      details
      maxSupply
      currentSupply
      status
    }
  }
}
```

**Tree Linking:**
```graphql
{
  tree(id: "0x00000001") {
    id
    childOfTree {
      id
    }
    linkedToHat {
      id
    }
    parentOfTrees {
      id
    }
  }
}
```

#### 2. Hat Queries

**Basic Hat Information:**
```graphql
{
  hat(id: "0x0000000100010000000000000000000000000000000000000000000000000000") {
    id
    prettyId
    status
    details
    eligibility
    toggle
    mutable
    imageUri
    createdAt
    maxSupply
    currentSupply
    levelAtLocalTree
  }
}
```

**Hat Relationships:**
```graphql
{
  hat(id: "0x0000000100010000000000000000000000000000000000000000000000000000") {
    id
    tree {
      id
    }
    admin {
      id
    }
    subHats {
      id
      details
    }
    wearers {
      id
    }
    badStandings {
      id
    }
    linkedTrees {
      id
    }
  }
}
```

#### 3. Wearer Queries

**Get Wearer's Hats:**
```graphql
{
  wearer(id: "0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571") {
    id
    currentHats {
      id
      details
      prettyId
    }
  }
}
```

#### 4. Event Queries

**Tree Event History:**
```graphql
{
  tree(id: "0x00000001") {
    id
    events {
      id
      blockNumber
      timestamp
      transactionID
      ... on HatCreatedEvent {
        hatDetails
        hatMaxSupply
        hatEligibility
        hatToggle
        hatMutable
        hatImageUri
      }
      ... on HatMintedEvent {
        wearer {
          id
        }
        operator
      }
      ... on HatBurnedEvent {
        wearer {
          id
        }
        operator
      }
    }
  }
}
```

**Hat-Specific Events:**
```graphql
{
  hat(id: "0x0000000100010000000000000000000000000000000000000000000000000000") {
    id
    events {
      id
      blockNumber
      timestamp
      transactionID
      ... on HatStatusChangedEvent {
        hatNewStatus
      }
      ... on HatDetailsChangedEvent {
        hatNewDetails
      }
      ... on WearerStandingChangedEvent {
        wearer {
          id
        }
        wearerStanding
      }
    }
  }
}
```

### Important Notes on Subgraph Data

⚠️ **Critical Limitation**: The `status` and `badStandings` fields track only the last recorded state in the Hats contract. They do NOT track eligibility and toggle modules that depend on external contract state, so these fields may be out of sync with the actual on-chain state.

Always verify critical state directly from contracts when dealing with module-dependent logic.

---

## Common Patterns & Best Practices

### 1. Hat ID Generation
Hat IDs follow a specific pattern based on tree hierarchy:

```typescript
// Top hat (tree root): domain in first 4 bytes
const topHatId = '0x0000000100000000000000000000000000000000000000000000000000000000';

// Child hat: inherits parent's structure + new level
const childHatId = '0x0000000100010000000000000000000000000000000000000000000000000000';

// Pretty ID for readability
const prettyId = '0x00000001.0001';
```

### 2. Permission Checking

```typescript
// Always check both hat ownership AND good standing
async function checkPermission(wearer: Address, hatId: HatId): Promise<boolean> {
  const isWearer = await hatsClient.isWearerOfHat({ wearer, hatId });
  const isInGoodStanding = await hatsClient.isInGoodStanding({ wearer, hatId });
  
  return isWearer && isInGoodStanding;
}
```

### 3. Module Integration

```typescript
// When using eligibility modules, always check actual eligibility
async function checkEligibility(wearer: Address, hatId: HatId): Promise<boolean> {
  // This checks the eligibility module if one exists
  return await hatsClient.isEligible({ wearer, hatId });
}

// For toggle modules, check if hat is currently active
async function isHatActive(hatId: HatId): Promise<boolean> {
  return await hatsClient.isActive({ hatId });
}
```

### 4. Bulk Operations

```typescript
// Check multiple hats for a wearer efficiently
async function getWearerHats(wearer: Address, hatIds: HatId[]): Promise<HatId[]> {
  const results = await Promise.all(
    hatIds.map(hatId => hatsClient.isWearerOfHat({ wearer, hatId }))
  );
  
  return hatIds.filter((_, index) => results[index]);
}
```

### 5. Error Handling

```typescript
try {
  const result = await hatsClient.createHat({
    // ... parameters
  });
  
  // Wait for transaction confirmation
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: result.hash
  });
  
  console.log('Hat created successfully:', receipt);
} catch (error) {
  if (error.message.includes('NotAdmin')) {
    console.error('Insufficient permissions to create hat');
  } else if (error.message.includes('MaxLevelsReached')) {
    console.error('Cannot create hat: maximum tree depth reached');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### 6. Gas Optimization

```typescript
// Use multicall for batch operations
const multicallResults = await hatsClient.multicall({
  calls: [
    { functionName: 'isWearerOfHat', args: [wearer1, hatId] },
    { functionName: 'isWearerOfHat', args: [wearer2, hatId] },
    { functionName: 'isWearerOfHat', args: [wearer3, hatId] }
  ]
});
```

---

## Complete API Reference

### HatsClient Core Methods

#### Hat Management
- `createHat(params)` - Create a new hat
- `mintHat(params)` - Mint a hat to a wearer  
- `burnHat(params)` - Burn a hat from a wearer
- `transferHat(params)` - Transfer a hat between wearers
- `changeHatDetails(params)` - Update hat metadata
- `changeHatEligibility(params)` - Update eligibility module
- `changeHatToggle(params)` - Update toggle module
- `changeHatMaxSupply(params)` - Update maximum supply

#### Query Methods
- `getHat(params)` - Get hat details
- `isWearerOfHat(params)` - Check if address wears hat
- `isEligible(params)` - Check eligibility (including modules)
- `isActive(params)` - Check if hat is active
- `isInGoodStanding(params)` - Check wearer standing
- `getHatWearersLength(params)` - Get number of current wearers
- `balanceOf(params)` - Get hat balance for address

#### Administrative Functions
- `setHatStatus(params)` - Set hat active/inactive
- `setHatWearerStatus(params)` - Set wearer standing
- `requestLinkTopHatToTree(params)` - Request tree linking
- `approveLinkTopHatToTree(params)` - Approve tree linking
- `unlinkTopHatFromTree(params)` - Unlink trees

#### Utility Functions
- `multicall(params)` - Batch multiple calls
- `uri(params)` - Get hat metadata URI
- `viewHat(params)` - Get comprehensive hat data

### HatsSubgraphClient Methods

#### Core Queries
- `getHat(params)` - Get hat by ID
- `getHats(params)` - Get multiple hats with filtering
- `getTree(params)` - Get tree by ID
- `getTrees(params)` - Get multiple trees
- `getWearer(params)` - Get wearer by address
- `getWearers(params)` - Get multiple wearers

#### Event Queries
- `getHatEvents(params)` - Get events for specific hat
- `getTreeEvents(params)` - Get events for specific tree
- `getWearerEvents(params)` - Get events for specific wearer

---

## Code Examples

### Complete Integration Example

```typescript
import { 
  HatsClient, 
  HatsSubgraphClient 
} from '@hatsprotocol/sdk-v1-core';
import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

class HatsManager {
  private hatsClient: HatsClient;
  private subgraphClient: HatsSubgraphClient;
  
  constructor(privateKey: string, rpcUrl: string) {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl)
    });
    
    const walletClient = createWalletClient({
      chain: mainnet,
      transport: http(rpcUrl),
      account: privateKeyToAccount(privateKey)
    });
    
    this.hatsClient = new HatsClient({
      chainId: mainnet.id,
      publicClient,
      walletClient
    });
    
    this.subgraphClient = new HatsSubgraphClient({
      config: {
        [mainnet.id]: {
          endpoint: 'https://api.studio.thegraph.com/query/...'
        }
      }
    });
  }
  
  async createOrganizationStructure() {
    // 1. Create top hat (organization root)
    const topHatResult = await this.hatsClient.createHat({
      admin: '0x0000000000000000000000000000000000000000000000000000000000000000',
      details: 'My Organization',
      maxSupply: 1,
      eligibility: '0x0000000000000000000000000000000000000000',
      toggle: '0x0000000000000000000000000000000000000000',
      mutable: true,
      imageURI: 'https://example.com/org-logo.png'
    });
    
    console.log('Top hat created:', topHatResult);
    
    // 2. Create department hats
    const departments = [
      { name: 'Engineering', maxSupply: 50 },
      { name: 'Marketing', maxSupply: 20 },
      { name: 'Operations', maxSupply: 10 }
    ];
    
    const departmentHats = [];
    
    for (const dept of departments) {
      const deptHat = await this.hatsClient.createHat({
        admin: topHatResult.hatId, // Top hat is admin
        details: dept.name,
        maxSupply: dept.maxSupply,
        eligibility: '0x0000000000000000000000000000000000000000',
        toggle: '0x0000000000000000000000000000000000000000',
        mutable: true,
        imageURI: `https://example.com/${dept.name.toLowerCase()}-logo.png`
      });
      
      departmentHats.push(deptHat);
      console.log(`${dept.name} hat created:`, deptHat);
    }
    
    return { topHat: topHatResult, departments: departmentHats };
  }
  
  async assignRoles(departmentHatId: string, members: string[]) {
    const results = [];
    
    for (const member of members) {
      try {
        const mintResult = await this.hatsClient.mintHat({
          hatId: departmentHatId,
          wearer: member
        });
        
        results.push({ member, success: true, hash: mintResult.hash });
        console.log(`Hat assigned to ${member}:`, mintResult.hash);
      } catch (error) {
        results.push({ member, success: false, error: error.message });
        console.error(`Failed to assign hat to ${member}:`, error);
      }
    }
    
    return results;
  }
  
  async getOrganizationOverview(treeId: string) {
    // Get tree structure from subgraph
    const tree = await this.subgraphClient.getTree({
      chainId: mainnet.id,
      treeId,
      props: {
        hats: {
          props: {
            details: true,
            prettyId: true,
            currentSupply: true,
            maxSupply: true,
            wearers: {
              props: {
                id: true
              }
            }
          }
        }
      }
    });
    
    // Compile overview
    const overview = {
      treeId,
      totalHats: tree.hats.length,
      totalWearers: tree.hats.reduce((sum, hat) => sum + hat.wearers.length, 0),
      hats: tree.hats.map(hat => ({
        id: hat.prettyId,
        name: hat.details,
        wearers: hat.currentSupply,
        maxSupply: hat.maxSupply,
        utilization: (hat.currentSupply / hat.maxSupply) * 100
      }))
    };
    
    return overview;
  }
  
  async checkUserPermissions(userAddress: string, hatIds: string[]) {
    const permissions = {};
    
    for (const hatId of hatIds) {
      const isWearer = await this.hatsClient.isWearerOfHat({
        wearer: userAddress,
        hatId
      });
      
      const isEligible = await this.hatsClient.isEligible({
        wearer: userAddress,
        hatId
      });
      
      const isInGoodStanding = await this.hatsClient.isInGoodStanding({
        wearer: userAddress,
        hatId
      });
      
      permissions[hatId] = {
        isWearer,
        isEligible,
        isInGoodStanding,
        hasAccess: isWearer && isInGoodStanding
      };
    }
    
    return permissions;
  }
  
  async getActivityReport(treeId: string, fromBlock: number) {
    const events = await this.subgraphClient.getTreeEvents({
      chainId: mainnet.id,
      treeId,
      filters: {
        blockNumber_gte: fromBlock
      }
    });
    
    const report = {
      totalEvents: events.length,
      eventTypes: {},
      recentActivity: events.slice(0, 10).map(event => ({
        type: event.__typename,
        blockNumber: event.blockNumber,
        timestamp: new Date(event.timestamp * 1000).toISOString(),
        details: this.formatEventDetails(event)
      }))
    };
    
    // Count event types
    events.forEach(event => {
      report.eventTypes[event.__typename] = 
        (report.eventTypes[event.__typename] || 0) + 1;
    });
    
    return report;
  }
  
  private formatEventDetails(event: any): string {
    switch (event.__typename) {
      case 'HatCreatedEvent':
        return `Hat created: ${event.hatDetails}`;
      case 'HatMintedEvent':
        return `Hat minted to ${event.wearer.id}`;
      case 'HatBurnedEvent':
        return `Hat burned from ${event.wearer.id}`;
      default:
        return 'Event occurred';
    }
  }
}

// Usage example
async function main() {
  const manager = new HatsManager(
    process.env.PRIVATE_KEY!,
    process.env.RPC_URL!
  );
  
  // Create organization structure
  const structure = await manager.createOrganizationStructure();
  
  // Assign members to engineering department
  const engineeringMembers = [
    '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571',
    '0x8ba1f109551bD432803012645Hac136c9c3c6a7'
  ];
  
  await manager.assignRoles(
    structure.departments[0].hatId, // Engineering dept
    engineeringMembers
  );
  
  // Get organization overview
  const overview = await manager.getOrganizationOverview(structure.topHat.treeId);
  console.log('Organization Overview:', overview);
  
  // Check user permissions
  const permissions = await manager.checkUserPermissions(
    engineeringMembers[0],
    [structure.departments[0].hatId]
  );
  console.log('User Permissions:', permissions);
}
```

---

This comprehensive guide provides everything needed to integrate with Hats Protocol V1, from basic concepts to advanced usage patterns. The combination of direct contract interaction via the SDK and efficient data querying via the subgraph enables powerful organizational management systems.

For the latest updates and additional examples, refer to the official repositories:
- [SDK V1 Core](https://github.com/Hats-Protocol/sdk-v1-core)
- [Subgraph](https://github.com/Hats-Protocol/subgraph)
- [Core Contracts](https://github.com/Hats-Protocol/hats-protocol)