# Hats Protocol MCP Server

A comprehensive Model Context Protocol (MCP) server for managing Hats Protocol operations including role management, permission checking, organizational structures, and analytics across multiple blockchain networks.

## Features

- **Hat Management**: Create, mint, burn, and transfer hats
- **Tree Operations**: Manage hierarchical organizational structures
- **Permission Checking**: Verify wearers, standing, and eligibility
- **Metadata Operations**: Update hat details and properties
- **Query Tools**: Search and filter hats using GraphQL subgraph
- **Analytics**: Generate reports and track activity
- **Multi-Chain Support**: Works across all Hats Protocol networks
- **External Signing**: Prepare transactions for hardware wallet signing

## Supported Networks

### Mainnet
- Ethereum
- Polygon
- Arbitrum One
- Optimism
- Base
- Gnosis Chain

### Testnet
- Sepolia
- Base Sepolia

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-hats-protocol-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

### Environment Variables

Copy `.env.template` to `.env` and configure:

```bash
# RPC Provider API Keys (optional - uses public endpoints if not provided)
ALCHEMY_API_KEY=your_key_here
INFURA_API_KEY=your_key_here

# Block Explorer API Keys (required for contract verification)
ETHERSCAN_API_KEY=your_key_here
POLYGONSCAN_API_KEY=your_key_here
# ... other explorer keys
```

### API Key Management

You can also set API keys using the MCP tools:

```json
{
  "tool": "set-api-key",
  "args": {
    "keyName": "ALCHEMY_API_KEY",
    "value": "your_key_here"
  }
}
```

## Usage

### Integrating with Claude Code

The easiest way to use this MCP server is to integrate it with Claude Code. After installing the server, add it to your Claude configuration:

#### Quick Setup

```bash
# Clone and install the server
git clone https://github.com/your-username/mcp-hats
cd mcp-hats
npm install
npm run build

# Add to Claude Code (with optional API key for better performance)
claude mcp add hats-protocol --env ALCHEMY_API_KEY=your_key_here -- node dist/index.js
```

#### Alternative Setup Methods

**Option 1: Local Development (no build required)**
```bash
claude mcp add hats-protocol --env ALCHEMY_API_KEY=your_key_here -- npx tsx src/index.ts
```

**Option 2: Global NPM installation (if published)**
```bash
claude mcp add hats-protocol --env ALCHEMY_API_KEY=your_key_here -- npx mcp-hats-protocol
```

**Option 3: Team/Project Configuration**
```bash
# For team sharing via .mcp.json
claude mcp add --scope project hats-protocol --env ALCHEMY_API_KEY=your_key_here -- node dist/index.js

# For user-wide access across all projects
claude mcp add --scope user hats-protocol --env ALCHEMY_API_KEY=your_key_here -- node dist/index.js
```

#### Managing the Integration

```bash
# List all MCP servers
claude mcp list

# View server details
claude mcp get hats-protocol

# Remove the server
claude mcp remove hats-protocol
```

#### Environment Variables in Claude Code

You can set API keys when adding the server:

```bash
claude mcp add hats-protocol \
  --env ALCHEMY_API_KEY=your_alchemy_key \
  --env ETHERSCAN_API_KEY=your_etherscan_key \
  -- node dist/index.js
```

### Manual Server Usage

If you prefer to run the server manually (for development or standalone use):

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Using with Claude Code

Once integrated, you can use the Hats Protocol tools directly in your conversations with Claude:

#### Example: Check if someone has a role
```
Check if address 0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571 is wearing hat 0x0000000100010000000000000000000000000000000000000000000000000000 on Ethereum
```

#### Example: Create a new organization
```
Help me create a new DAO called "TechCollective" on Base Sepolia with myself (0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571) as the founder
```

#### Example: Analyze organizational structure
```
Show me the organizational structure for tree 0x00000001 on Base and visualize it as an ASCII tree
```

#### Example: Get role assignment guidance
```
I need to assign the CTO role to a new team member. Can you guide me through the process and prepare the transaction?
```

Claude will automatically use the appropriate Hats Protocol tools and provide intelligent guidance through the built-in prompts and resources.

### Available Tools

#### Hat Management
- `create-hat` - Create a new hat in the hierarchy
- `mint-hat` - Assign a hat to a wearer
- `burn-hat` - Remove a hat from a wearer
- `transfer-hat` - Transfer a hat between wearers

#### Permission Checking
- `check-hat-wearer` - Verify if an address wears a specific hat
- `check-hat-standing` - Check if a wearer is in good standing

#### Query Tools
- `get-hat-details` - Get detailed information about a hat
- `query-hats-by-wearer` - Get all hats worn by an address
- `get-tree-structure` - Get hierarchical tree structure

#### Network Tools
- `list-networks` - List all supported networks
- `set-api-key` - Configure API keys

### Example Commands

#### Create a Hat
```json
{
  "tool": "create-hat",
  "args": {
    "networkName": "ethereum",
    "admin": "0x0000000100000000000000000000000000000000000000000000000000000000",
    "details": "Engineering Team Lead",
    "maxSupply": 1,
    "eligibility": "0x0000000000000000000000000000000000000000",
    "toggle": "0x0000000000000000000000000000000000000000",
    "mutable": true,
    "imageURI": "https://example.com/hat-image.png"
  }
}
```

#### Check Hat Wearer
```json
{
  "tool": "check-hat-wearer",
  "args": {
    "networkName": "ethereum",
    "wearer": "0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571",
    "hatId": "0x0000000100010000000000000000000000000000000000000000000000000000"
  }
}
```

## Development

### Project Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server setup
├── types/             # TypeScript definitions
├── utils/             # Utility functions
├── networks/          # Network configurations
├── clients/           # Hats SDK and subgraph clients
├── tools/             # MCP tool implementations
└── resources/         # MCP resources

test/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

## Architecture

### Core Components

1. **MCP Server**: Handles tool registration and request routing
2. **Hats Client**: Wrapper around Hats Protocol SDK
3. **Subgraph Client**: GraphQL client for querying indexed data
4. **Network Manager**: Multi-chain configuration and RPC management
5. **Tool Implementations**: Individual tools for specific operations

### Data Flow

1. MCP client sends tool request → MCP server
2. Server validates input with Zod schemas
3. Tool implementation calls appropriate client method
4. Client interacts with blockchain or subgraph
5. Response formatted and returned to MCP client

## Resources

- [Hats Protocol Documentation](https://docs.hatsprotocol.xyz/)
- [SDK Documentation](https://github.com/Hats-Protocol/sdk-v1-core)
- [Subgraph Documentation](https://github.com/Hats-Protocol/subgraph)
- [MCP Specification](https://github.com/anthropics/model-context-protocol)

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit pull request with detailed description

## License

MIT