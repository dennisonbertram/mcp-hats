# Hats Protocol MCP Server - Prompts and Resources Documentation

## Overview

This document describes the comprehensive prompts and resources implemented for the Hats Protocol MCP server to help LLMs understand and effectively use the Hats Protocol tools.

## Features Implemented

### 🎯 Prompts Capability
The server now includes 5 comprehensive prompts that guide LLMs through common Hats Protocol workflows:

#### 1. **Organization Setup Prompt** (`organization-setup`)
- **Purpose**: Guide through creating new organizational structures
- **Parameters**: `networkName`, `organizationName`, `founderAddress`, `initialRoles` (optional)
- **Use Cases**: New DAO creation, company structuring, community organization setup

#### 2. **Role Management Prompt** (`role-management`)
- **Purpose**: Help with assigning, transferring, and managing organizational roles
- **Parameters**: `networkName`, `operation`, `targetAddress`, `hatId`, `treeId`
- **Operations**: assign, transfer, remove, modify
- **Use Cases**: Employee onboarding, promotions, role transitions

#### 3. **Permission Audit Prompt** (`permission-audit`)
- **Purpose**: Analyze and audit organizational permissions and role hierarchies
- **Parameters**: `networkName`, `scope`, `target`, `includeInactive`
- **Scope Options**: organization, individual, role, tree
- **Use Cases**: Compliance audits, security reviews, organizational health checks

#### 4. **Transaction Preparation Prompt** (`transaction-prep`)
- **Purpose**: Help prepare and understand blockchain transactions
- **Parameters**: `networkName`, `operation`, `parameters`
- **Operations**: create-org, create-hat, assign-role, batch-operations
- **Use Cases**: Gas optimization, transaction planning, batch operations

#### 5. **Troubleshooting Prompt** (`troubleshooting`)
- **Purpose**: Diagnose and resolve common Hats Protocol issues
- **Parameters**: `networkName`, `issue`, `errorDetails`, `transactionHash`
- **Issue Types**: transaction-failed, role-not-working, permissions, gas-estimation
- **Use Cases**: Error resolution, debugging, system maintenance

### 📚 Enhanced Resources
The server now includes 11 comprehensive resources:

#### **Existing Resources** (Enhanced)
1. **Networks** (`hats://networks`) - Blockchain network configurations
2. **Documentation** (`hats://documentation`) - Official Hats Protocol links
3. **Contracts** (`hats://contracts`) - Contract addresses for all networks
4. **Subgraph Endpoints** (`hats://subgraph-endpoints`) - GraphQL query endpoints
5. **Examples** (`hats://examples`) - Basic usage examples

#### **New Resources**
6. **Tool Documentation** (`hats://tool-documentation`) - Comprehensive tool reference
7. **Common Patterns** (`hats://common-patterns`) - Best practices and workflows
8. **Error Handling Guide** (`hats://error-handling`) - Common errors and solutions
9. **Parameter Formats** (`hats://parameter-formats`) - Validation rules and formats
10. **Real-World Scenarios** (`hats://real-world-scenarios`) - Practical implementation examples
11. **Integration Guide** (`hats://integration-guide`) - External system integration patterns

## Implementation Details

### File Structure
```
src/
├── prompts/
│   ├── index.ts              # Prompt definitions and handlers
│   ├── organization-setup.ts # New organization creation workflow
│   ├── role-management.ts    # Role assignment and management
│   ├── permission-audit.ts   # Permission analysis and auditing
│   ├── transaction-prep.ts   # Transaction preparation guidance
│   └── troubleshooting.ts    # Issue diagnosis and resolution
├── resources/
│   └── index.ts              # Enhanced with 6 new resources
└── server.ts                 # Updated with prompts capability
```

### Server Capabilities
The MCP server now declares three capabilities:
```typescript
capabilities: {
  prompts: {},    // NEW: Prompts for guided workflows
  resources: {},  // ENHANCED: Expanded resource library
  tools: {}      // EXISTING: All Hats Protocol tools
}
```

### Request Handlers Added
- `ListPromptsRequestSchema` - Lists available prompts
- `GetPromptRequestSchema` - Retrieves specific prompt content

## Usage Examples

### Using Prompts
```javascript
// List all available prompts
const prompts = await listPrompts();

// Get organization setup guidance
const setupGuide = await getPrompt('organization-setup', {
  networkName: 'ethereum',
  organizationName: 'TechDAO',
  founderAddress: '0x742C3cF9Af45f91B109a81EfEaf11535ECDe9571'
});
```

### Accessing Resources
```javascript
// List all resources
const resources = await listResources();

// Read tool documentation
const toolDocs = await readResource('hats://tool-documentation');

// Get error handling guide
const errorGuide = await readResource('hats://error-handling');
```

## Key Benefits

### For LLMs
- **Contextual Guidance**: Structured workflows for complex operations
- **Error Prevention**: Common pitfalls and how to avoid them
- **Best Practices**: Industry-standard organizational patterns
- **Troubleshooting**: Systematic problem resolution

### For Users
- **Faster Onboarding**: Clear guidance for new users
- **Reduced Errors**: Validated patterns and examples
- **Better Understanding**: Comprehensive documentation
- **Real-World Context**: Practical implementation examples

### For Developers
- **Integration Patterns**: How to connect Hats Protocol with external systems
- **Parameter Validation**: Correct formats and validation rules
- **Error Handling**: Comprehensive error scenarios and solutions
- **Scaling Guidance**: Patterns for growing organizations

## Workflow Coverage

### Complete Organization Lifecycle
1. **Planning** - Organization setup prompt guides structure design
2. **Creation** - Transaction prep prompt handles blockchain operations
3. **Management** - Role management prompt handles day-to-day operations
4. **Auditing** - Permission audit prompt ensures compliance
5. **Troubleshooting** - Diagnostic prompt resolves issues

### Common Use Cases Covered
- **Startup Setup**: Tech companies, DAOs, nonprofits
- **Team Management**: Onboarding, promotions, departures
- **Compliance**: Audits, reviews, governance
- **Integration**: External systems, authentication, databases
- **Optimization**: Gas costs, batch operations, efficiency

## Technical Features

### Dynamic Content Generation
- Prompts adapt based on provided parameters
- Context-aware guidance and examples
- Network-specific recommendations
- Error-specific troubleshooting steps

### Comprehensive Coverage
- All 11 Hats Protocol tools documented
- Common error scenarios with solutions
- Parameter validation with examples
- Integration patterns for popular use cases

### Extensible Architecture
- Easy to add new prompts
- Modular resource structure
- Type-safe implementations
- Consistent error handling

## Testing and Quality Assurance

### Implementation Quality
- TypeScript strict mode compliance
- Comprehensive error handling
- Parameter validation
- Consistent response formats

### Content Quality
- Real-world scenarios tested
- Industry best practices included
- Common patterns documented
- Error scenarios covered

## Future Enhancements

### Potential Additions
- **Interactive Workflows**: Step-by-step guided processes
- **Custom Prompts**: User-defined workflow templates
- **Analytics Integration**: Usage patterns and optimization
- **Multi-language Support**: Internationalization

### Planned Improvements
- **Dynamic Examples**: Context-aware example generation
- **Validation Integration**: Real-time parameter checking
- **Performance Optimization**: Caching and response optimization
- **Enhanced Documentation**: Interactive guides and tutorials

## Conclusion

The implementation of comprehensive prompts and resources transforms the Hats Protocol MCP server from a tool collection into an intelligent assistant that can guide users through complete organizational management workflows. This enhancement significantly improves the user experience and reduces the complexity of working with Hats Protocol.

The system is designed to be:
- **Comprehensive**: Covers all aspects of organizational management
- **Practical**: Based on real-world scenarios and best practices
- **Extensible**: Easy to add new workflows and guidance
- **User-Friendly**: Clear, actionable guidance for all skill levels

This implementation establishes a foundation for sophisticated organizational management capabilities while maintaining the flexibility to adapt to diverse use cases and organizational structures.