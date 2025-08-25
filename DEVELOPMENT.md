# MCP Hats Protocol Server - Development Plan

## Task Overview
Implement a comprehensive Model Context Protocol (MCP) server for managing Hats Protocol operations, providing tools for role management, permission checking, organizational structures, and analytics.

## Success Criteria
✅ Complete MCP server implementation with all planned tools
✅ Multi-chain support for all Hats Protocol networks
✅ Full integration with Hats SDK V1 and subgraph
✅ Comprehensive test suite with >80% coverage
✅ Production-ready code following best practices
✅ Clear API documentation and usage examples
✅ External signing support for hardware wallets
✅ Efficient caching and query optimization

## Implementation Architecture

### Core Components

#### 1. Server Infrastructure (`/src`)
- `index.ts` - Entry point with graceful shutdown handling
- `server.ts` - MCP server setup and tool registration
- `types/` - TypeScript definitions and interfaces
- `utils/` - Shared utilities (validation, formatting, caching)

#### 2. Network Configuration (`/src/networks`)
- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism, Base, Gnosis)
- RPC endpoint management with fallbacks
- Chain-specific gas settings and optimizations
- Network detection and validation

#### 3. Hats Integration (`/src/clients`)
- `hats-client.ts` - Core Hats SDK client wrapper
- `subgraph-client.ts` - GraphQL client for subgraph queries
- `viem-client.ts` - VIEM client configuration
- Connection pooling and retry logic

#### 4. Tool Categories (`/src/tools`)

##### Hat Management Tools
- `create-hat.ts` - Create new hats with hierarchy
- `mint-hat.ts` - Assign hats to wearers
- `burn-hat.ts` - Remove hats from wearers
- `transfer-hat.ts` - Transfer between wearers
- `batch-operations.ts` - Bulk hat operations

##### Tree Operations Tools
- `create-tree.ts` - Initialize new organizational trees
- `link-trees.ts` - Connect tree structures
- `request-linkage.ts` - Propose tree connections
- `approve-linkage.ts` - Confirm tree connections
- `unlink-trees.ts` - Disconnect tree structures

##### Permission Checking Tools
- `check-wearer.ts` - Verify hat ownership
- `check-standing.ts` - Check good/bad standing
- `check-eligibility.ts` - Verify eligibility with modules
- `check-authority.ts` - Validate administrative rights
- `batch-permissions.ts` - Bulk permission checks

##### Metadata Operations Tools
- `get-hat-details.ts` - Retrieve hat information
- `update-hat-details.ts` - Modify hat metadata
- `get-image-uri.ts` - Fetch hat imagery
- `update-hat-supply.ts` - Adjust max supply
- `change-hat-modules.ts` - Update eligibility/toggle modules

##### Query Tools (Subgraph)
- `query-hats.ts` - Search and filter hats
- `query-trees.ts` - Get tree structures
- `query-wearers.ts` - Find hat holders
- `query-events.ts` - Historical event data
- `advanced-queries.ts` - Complex GraphQL queries

##### Analytics Tools
- `generate-reports.ts` - Organizational reports
- `track-activity.ts` - Monitor hat events
- `analyze-permissions.ts` - Permission analytics
- `export-data.ts` - Data export utilities

##### Administrative Tools
- `manage-api-keys.ts` - API key management
- `manage-wallets.ts` - Wallet configuration
- `verify-contracts.ts` - Contract verification
- `estimate-gas.ts` - Gas estimation utilities

### 5. Resources (`/src/resources`)
- Network configurations
- Contract ABIs and addresses
- Subgraph endpoints
- Documentation links

### 6. Testing (`/test`)
- Unit tests for each tool
- Integration tests for workflows
- E2E tests for complete scenarios
- Mock implementations for development

## Tool Schemas

### Example: Create Hat Tool
```typescript
{
  name: 'create-hat',
  description: 'Create a new hat in the Hats Protocol hierarchy',
  inputSchema: {
    type: 'object',
    properties: {
      networkName: { type: 'string', description: 'Target network' },
      admin: { type: 'string', description: 'Admin hat ID' },
      details: { type: 'string', description: 'Hat name/description' },
      maxSupply: { type: 'number', description: 'Maximum wearers' },
      eligibility: { type: 'string', description: 'Eligibility module' },
      toggle: { type: 'string', description: 'Toggle module' },
      mutable: { type: 'boolean', description: 'Can be modified' },
      imageURI: { type: 'string', description: 'Hat image URL' }
    },
    required: ['networkName', 'admin', 'details', 'maxSupply']
  }
}
```

## Network Support

### Mainnet Networks
- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum One (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)
- Gnosis Chain (Chain ID: 100)

### Testnet Networks
- Sepolia (Chain ID: 11155111)
- Base Sepolia (Chain ID: 84532)
- Polygon Mumbai (Chain ID: 80001)
- Arbitrum Sepolia (Chain ID: 421614)

## Dependencies

### Core Dependencies
- `@modelcontextprotocol/sdk` - MCP server framework
- `@hatsprotocol/sdk-v1-core` - Hats Protocol SDK
- `viem` - Ethereum interaction library
- `zod` - Schema validation
- `graphql-request` - GraphQL client

### Development Dependencies
- `typescript` - Type safety
- `vitest` - Testing framework
- `tsx` - TypeScript execution
- `eslint` - Code linting
- `prettier` - Code formatting

## Implementation Phases

### Phase 1: Foundation (Current)
1. ✅ Create git worktree
2. ⏳ Create implementation plan
3. Set up TypeScript project
4. Configure networks
5. Initialize MCP server

### Phase 2: Core Integration
1. Integrate Hats SDK
2. Setup VIEM clients
3. Configure subgraph client
4. Implement error handling
5. Add logging system

### Phase 3: Tool Implementation
1. Hat Management tools
2. Tree Operations tools
3. Permission Checking tools
4. Metadata Operations tools
5. Query tools

### Phase 4: Advanced Features
1. Analytics tools
2. Batch operations
3. Caching layer
4. Performance optimization
5. Administrative tools

### Phase 5: Testing & Documentation
1. Unit test coverage
2. Integration tests
3. E2E test scenarios
4. API documentation
5. Usage examples

### Phase 6: Production Readiness
1. Security audit
2. Performance testing
3. Error recovery
4. Monitoring setup
5. Deployment guide

## Progress Tracking

### Completed
- [x] Git worktree setup
- [x] Project planning
- [x] TypeScript project setup
  - Package.json with all dependencies
  - TypeScript configuration
  - ESLint and Prettier setup
  - Vitest configuration
- [x] Network configuration
  - Support for 8 networks (6 mainnet, 2 testnet)
  - RPC endpoint management with fallbacks
  - API key configuration system
- [x] Hats SDK integration
  - VIEM client wrapper
  - Hats SDK client management
  - Helper functions for hat ID manipulation
- [x] Subgraph client setup
  - GraphQL client configuration
  - Query definitions for all major operations
  - Helper functions for common queries
- [x] Basic MCP server structure
  - Entry point with graceful shutdown
  - Server setup with tool registration
  - Resource management system
  - Type definitions

### In Progress
- [ ] Tool implementation (next phase)

### Pending
- [ ] Hat Management tools implementation
- [ ] Tree Operations tools implementation
- [ ] Permission Checking tools implementation  
- [ ] Metadata Operations tools implementation
- [ ] Query tools implementation
- [ ] Analytics tools implementation
- [ ] Testing suite
- [ ] API documentation examples
- [ ] Production deployment guide

## Testing Strategy

### Unit Tests
- Individual tool functions
- Validation logic
- Error handling
- Utility functions

### Integration Tests
- Multi-tool workflows
- Network interactions
- Subgraph queries
- Transaction preparation

### E2E Tests
- Complete user scenarios
- Cross-network operations
- Permission workflows
- Analytics generation

## Security Considerations

1. **Input Validation**: Strict schema validation with Zod
2. **Network Security**: RPC endpoint rotation and fallbacks
3. **Key Management**: No private keys in server, external signing only
4. **Rate Limiting**: Request throttling for API calls
5. **Error Handling**: Graceful failures without exposing internals
6. **Audit Logging**: Track all operations for accountability

## Performance Optimizations

1. **Caching**: LRU cache for frequent queries
2. **Batch Operations**: Multicall for efficiency
3. **Connection Pooling**: Reuse RPC connections
4. **Query Optimization**: GraphQL query batching
5. **Lazy Loading**: Load resources on demand

## Review Feedback
[To be filled after reviews]

## Implementation Notes
[Track important decisions and observations during development]