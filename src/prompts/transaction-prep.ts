/**
 * Transaction Preparation Prompt
 * Guides users through preparing and understanding blockchain transactions for Hats operations
 */

import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export async function transactionPrepPrompt(args?: Record<string, unknown>): Promise<GetPromptResult> {
  const networkName = args?.networkName as string || '[NETWORK_NAME]';
  const operation = args?.operation as string || '[OPERATION]';
  const parameters = args?.parameters as string || '{}';

  let parsedParams: any = {};
  try {
    parsedParams = parameters ? JSON.parse(parameters) : {};
  } catch {
    parsedParams = {};
  }

  const messages: PromptMessage[] = [];

  // User request message
  messages.push({
    role: 'user',
    content: {
      type: 'text',
      text: `I need help preparing a blockchain transaction for Hats Protocol. Operation: ${operation}, Network: ${networkName}${Object.keys(parsedParams).length > 0 ? `, Parameters: ${JSON.stringify(parsedParams, null, 2)}` : ''}`
    }
  });

  // Generate response based on operation type
  let responseContent = '';

  switch (operation.toLowerCase()) {
    case 'create-org':
      responseContent = generateCreateOrgTransactionContent(networkName, parsedParams);
      break;
    case 'create-hat':
      responseContent = generateCreateHatTransactionContent(networkName, parsedParams);
      break;
    case 'assign-role':
      responseContent = generateAssignRoleTransactionContent(networkName, parsedParams);
      break;
    case 'batch-operations':
      responseContent = generateBatchOperationsContent(networkName, parsedParams);
      break;
    default:
      responseContent = generateGeneralTransactionContent(networkName, operation, parsedParams);
  }

  messages.push({
    role: 'assistant',
    content: {
      type: 'text',
      text: responseContent
    }
  });

  return {
    description: `Transaction preparation guidance for ${operation} on ${networkName}`,
    messages
  };
}

function generateCreateOrgTransactionContent(networkName: string, params: any): string {
  const orgName = params.organizationName || '[ORGANIZATION_NAME]';
  const founderAddress = params.founderAddress || '[FOUNDER_ADDRESS]';
  const details = params.details || `${orgName} - Organizational Root`;

  return `# Creating New Organization Transaction

I'll help you prepare a transaction to create a new organization "${orgName}" on ${networkName}.

## Step 1: Transaction Preparation

### Create the Top Hat (Organization Root)
\`\`\`
Use tool: prepare-mint-top-hat
Parameters:
{
  "networkName": "${networkName}",
  "target": "${founderAddress}",
  "details": "${details}",
  "imageURI": "${params.imageURI || 'https://your-domain.com/org-logo.png'}",
  "gasEstimateMultiplier": 1.2
}
\`\`\`

This will return a prepared transaction with:
- **Transaction Data**: Encoded call data for the contract
- **Gas Estimate**: Estimated gas usage and costs
- **Contract Address**: Hats Protocol contract address
- **Value**: ETH amount to send (usually 0)

## Step 2: Transaction Components Explained

### 📋 Transaction Structure
\`\`\`json
{
  "to": "[HATS_CONTRACT_ADDRESS]",
  "data": "[ENCODED_FUNCTION_CALL]",
  "value": "0",
  "gasLimit": "[ESTIMATED_GAS]",
  "gasPrice": "[CURRENT_GAS_PRICE]"
}
\`\`\`

### 🔍 Function Call Breakdown
The transaction calls: \`mintTopHat(target, details, imageURI)\`

**Parameters**:
- \`target\`: ${founderAddress} (receives the top hat)
- \`details\`: "${details}" (organization description)
- \`imageURI\`: ${params.imageURI || '[IMAGE_URI]'} (optional logo)

### ⛽ Gas Considerations
- **Base Gas**: ~50,000-80,000 gas for top hat minting
- **Data Size**: Additional gas for longer details/imageURI
- **Network Congestion**: Current gas prices on ${networkName}
- **Safety Buffer**: 20% multiplier for reliability

## Step 3: Pre-Transaction Checklist

### ✅ Prerequisites Verification
- [ ] Founder address ${founderAddress} is correct
- [ ] Sufficient ${networkName === 'ethereum' ? 'ETH' : 'native tokens'} for gas fees
- [ ] Organization details are finalized
- [ ] Image URI is accessible (if provided)
- [ ] Wallet is connected to ${networkName} network

### 🔐 Security Checks
- [ ] Founder address is secure and backed up
- [ ] Private key/seed phrase is safely stored
- [ ] Transaction recipient is Hats Protocol contract
- [ ] No unnecessary permissions granted to wallet

### 📊 Cost Analysis
- **Gas Fee**: ~$${networkName === 'ethereum' ? '5-50' : '0.01-1'} (varies by network congestion)
- **Creation Cost**: No additional fees beyond gas
- **Total Cost**: Gas fees only

## Step 4: Transaction Execution

### 🔗 Signing Options

#### Option 1: Hardware Wallet (Recommended)
- Use Ledger, Trezor, or similar hardware wallet
- Verify transaction details on device screen
- Sign with physical button confirmation

#### Option 2: MetaMask/Software Wallet
- Review transaction in wallet interface
- Verify recipient address and data
- Confirm gas fee is reasonable

#### Option 3: Multisig Wallet
- If founder address is multisig (Gnosis Safe, etc.)
- Collect required signatures
- Execute when threshold reached

### 📱 Transaction Monitoring
After signing and broadcasting:

1. **Transaction Hash**: Save the hash for tracking
2. **Block Confirmation**: Wait for network confirmations
3. **Event Logs**: Check for successful TopHatMinted event
4. **Hat ID Retrieval**: Extract new top hat ID from logs

## Step 5: Post-Transaction Actions

### 🎯 Immediate Next Steps
1. **Verify Creation**: Confirm top hat was minted
2. **Record Hat ID**: Save the new top hat ID
3. **Test Access**: Verify founder can manage the hat
4. **Document**: Update organizational records

### 📋 Verification Commands
\`\`\`
# Check if top hat was created successfully
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[NEW_TOP_HAT_ID]",
  "wearer": "${founderAddress}"
}

# Get details of the new organization
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[NEW_TOP_HAT_ID]"
}
\`\`\`

## Advanced Configuration

### 🔧 Custom Parameters
If you need specific configuration:

\`\`\`javascript
// Custom gas estimation
gasEstimateMultiplier: 1.5  // 50% buffer for safety

// Custom image URI
imageURI: "ipfs://QmYourImageHash"  // IPFS for decentralized storage

// From address for gas estimation
fromAddress: "${founderAddress}"  // For accurate gas estimation
\`\`\`

### 🌐 Network-Specific Considerations

#### Ethereum Mainnet
- **Higher Gas Costs**: $10-100+ during congestion
- **Slower Confirmation**: 1-5+ minutes
- **Higher Security**: Most battle-tested

#### Layer 2 Networks (Polygon, Arbitrum, Optimism)
- **Lower Costs**: $0.01-1 typical
- **Faster Confirmation**: Seconds to minutes
- **Growing Ecosystem**: Rapidly expanding

#### Testnets (Sepolia, Base Sepolia)
- **Free Tokens**: Get from faucets
- **Testing Purpose**: Not for production use
- **Faster Development**: Quick iterations

## Common Transaction Issues

### 🚫 Transaction Failures

#### Insufficient Gas
- **Problem**: Transaction runs out of gas
- **Solution**: Increase gas limit by 20-50%
- **Prevention**: Use realistic gas estimates

#### Invalid Parameters
- **Problem**: Incorrect address format or data
- **Solution**: Verify all addresses and parameters
- **Prevention**: Double-check inputs before signing

#### Network Congestion
- **Problem**: Transaction stuck in mempool
- **Solution**: Increase gas price or wait
- **Prevention**: Monitor network conditions

#### Wrong Network
- **Problem**: Wallet on different network
- **Solution**: Switch to correct network
- **Prevention**: Verify network before signing

### 🔄 Transaction Recovery

#### Stuck Transaction
1. **Check Status**: Use block explorer
2. **Speed Up**: Increase gas price
3. **Cancel**: Replace with 0 ETH to same address
4. **Wait**: Eventually will be dropped

#### Failed Transaction
1. **Review Error**: Check failure reason
2. **Fix Issue**: Address underlying problem
3. **Retry**: Prepare new transaction
4. **Learn**: Document issue for future

## Organization Planning

### 🏢 Immediate Follow-up Roles
After creating the organization, plan these roles:

1. **Executive Team**
   - CEO/President
   - Board Members
   - Co-founders

2. **Department Heads**
   - CTO
   - CFO
   - Head of Operations

3. **Core Team**
   - Senior roles
   - Team leads
   - Specialists

### 📈 Growth Planning
- **Scalable Structure**: Design for future expansion
- **Clear Hierarchy**: Understandable reporting lines
- **Flexible Roles**: Adaptable to changing needs
- **Documentation**: Clear role descriptions

Ready to create your organization? Let me know if you'd like to proceed with the transaction preparation or if you have any questions about the process!`;
}

function generateCreateHatTransactionContent(networkName: string, params: any): string {
  const adminHatId = params.adminHatId || '[ADMIN_HAT_ID]';
  const roleName = params.roleName || '[ROLE_NAME]';
  const maxSupply = params.maxSupply || 1;

  return `# Creating New Hat Role Transaction

I'll help you prepare a transaction to create a new role "${roleName}" on ${networkName}.

## Step 1: Role Creation Preparation

### Prepare Create Hat Transaction
\`\`\`
Use tool: prepare-create-hat
Parameters:
{
  "networkName": "${networkName}",
  "admin": "${adminHatId}",
  "details": "${roleName}${params.description ? ' - ' + params.description : ''}",
  "maxSupply": ${maxSupply},
  "eligibility": "${params.eligibility || '0x0000000000000000000000000000000000000000'}",
  "toggle": "${params.toggle || '0x0000000000000000000000000000000000000000'}",
  "mutable": ${params.mutable !== false},
  "imageURI": "${params.imageURI || 'https://your-domain.com/role-icon.png'}"
}
\`\`\`

## Step 2: Transaction Analysis

### 🔍 Function Call Details
The transaction calls: \`createHat(admin, details, maxSupply, eligibility, toggle, mutable, imageURI)\`

**Parameters Breakdown**:
- \`admin\`: ${adminHatId} (hat that will control this role)
- \`details\`: "${roleName}${params.description ? ' - ' + params.description : ''}" (role description)
- \`maxSupply\`: ${maxSupply} (maximum wearers allowed)
- \`eligibility\`: ${params.eligibility || '0x0000000000000000000000000000000000000000'} (eligibility module)
- \`toggle\`: ${params.toggle || '0x0000000000000000000000000000000000000000'} (toggle module)
- \`mutable\`: ${params.mutable !== false} (can be modified later)
- \`imageURI\`: ${params.imageURI || '[IMAGE_URI]'} (role visual identifier)

### ⛽ Gas Estimation
- **Base Cost**: ~80,000-120,000 gas
- **Variable Costs**: Data size (details, imageURI)
- **Network**: ${networkName} current gas prices
- **Total**: ~$${networkName === 'ethereum' ? '8-60' : '0.02-2'} (estimated)

## Step 3: Role Design Validation

### 🎯 Role Parameters Review
- **Purpose**: Is this role necessary and well-defined?
- **Scope**: Does maxSupply (${maxSupply}) match expected needs?
- **Authority**: Is admin hat ${adminHatId} appropriate?
- **Flexibility**: Is mutability setting (${params.mutable !== false}) correct?

### 🔐 Security Configuration
- **Eligibility Module**: ${params.eligibility || 'None - anyone can wear this hat'}
- **Toggle Module**: ${params.toggle || 'None - hat cannot be deactivated'}
- **Admin Control**: Admin can mint, burn, and modify this role
- **Supply Limit**: Maximum ${maxSupply} person${maxSupply === 1 ? '' : 's'} can hold this role

### 📋 Best Practices Check
- [ ] Role name is descriptive and clear
- [ ] MaxSupply matches organizational needs  
- [ ] Admin hat has appropriate authority level
- [ ] Eligibility requirements are defined (if needed)
- [ ] Image URI is accessible and appropriate

## Step 4: Pre-Execution Checklist

### ✅ Prerequisites
- [ ] You hold or can access the admin hat (${adminHatId})
- [ ] Admin hat has permission to create child roles
- [ ] Role parameters are finalized and reviewed
- [ ] Sufficient gas funds available
- [ ] Wallet connected to ${networkName}

### 🔍 Verification Steps
Before executing, verify admin permissions:

\`\`\`
# Check if you can manage the admin hat
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${adminHatId}",
  "wearer": "[YOUR_ADDRESS]"
}

# Get admin hat details
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${adminHatId}"
}
\`\`\`

## Step 5: Role Module Configuration

### 🔧 Eligibility Modules
${params.eligibility && params.eligibility !== '0x0000000000000000000000000000000000000000' 
  ? `**Custom Eligibility**: ${params.eligibility}
- This address contains logic for who can wear this hat
- Could check token balances, other roles, or custom criteria
- Test thoroughly before deploying to production`
  : `**No Eligibility Module**: Anyone can be assigned this role
- Consider if this is appropriate for your use case
- You might want to add eligibility requirements later`}

### 🔄 Toggle Modules  
${params.toggle && params.toggle !== '0x0000000000000000000000000000000000000000'
  ? `**Custom Toggle**: ${params.toggle}
- This address can activate/deactivate this role
- Useful for temporary roles or conditional permissions
- Ensure the toggle logic is well-tested`
  : `**No Toggle Module**: Role is always active when worn
- Role cannot be temporarily deactivated
- Consider if you need this flexibility`}

## Step 6: Transaction Execution Guide

### 🔗 Signing Process
1. **Review Transaction**: Verify all parameters are correct
2. **Check Gas Fee**: Ensure reasonable for current network conditions
3. **Sign Transaction**: Use secure wallet/hardware device
4. **Broadcast**: Submit to ${networkName} network
5. **Monitor**: Track transaction status

### 📊 Expected Results
After successful execution:
- New hat role will be created
- Hat ID will be generated (sequential under admin hat)
- HatCreated event will be emitted
- Role becomes available for assignment

## Step 7: Post-Creation Actions

### 🎯 Immediate Tasks
1. **Record Hat ID**: Save the new role's hat ID
2. **Update Documentation**: Add to organizational charts
3. **Prepare Assignments**: Plan who should get this role
4. **Test Functionality**: Verify role works as expected

### 📝 Role Assignment Preparation
Once created, assign the role to initial wearers:

\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[NEW_ROLE_HAT_ID]",
  "wearer": "[TEAM_MEMBER_ADDRESS]"
}
\`\`\`

### 🔍 Verification Commands
\`\`\`
# Verify role was created successfully
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[NEW_ROLE_HAT_ID]"
}

# Check organizational structure
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ORGANIZATION_TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 10
}
\`\`\`

## Advanced Role Configuration

### 🔧 Custom Eligibility Examples
\`\`\`solidity
// Token-based eligibility (must hold ERC20)
contract TokenEligibility {
    IERC20 token;
    uint256 minBalance;
    
    function isEligible(address user, uint256 hatId) 
        returns (bool) {
        return token.balanceOf(user) >= minBalance;
    }
}

// Role-based eligibility (must hold another hat)
contract HatEligibility {
    IHats hats;
    uint256 requiredHat;
    
    function isEligible(address user, uint256 hatId) 
        returns (bool) {
        return hats.isWearerOfHat(user, requiredHat);
    }
}
\`\`\`

### 🔄 Toggle Module Examples
\`\`\`solidity
// Time-based toggle (role only active during hours)
contract TimeToggle {
    uint256 startHour;
    uint256 endHour;
    
    function getHatStatus(uint256 hatId) 
        returns (bool) {
        uint256 hour = (block.timestamp / 3600) % 24;
        return hour >= startHour && hour < endHour;
    }
}

// Emergency toggle (can be deactivated by admin)
contract EmergencyToggle {
    mapping(uint256 => bool) public active;
    address public admin;
    
    function deactivate(uint256 hatId) onlyAdmin {
        active[hatId] = false;
    }
}
\`\`\`

## Common Creation Issues

### 🚫 Transaction Failures

#### Unauthorized Admin
- **Problem**: You don't have admin rights for the specified hat
- **Solution**: Use correct admin hat or get proper permissions
- **Check**: Verify your role assignments first

#### Invalid Parameters
- **Problem**: Address format, supply limits, or other parameter issues
- **Solution**: Validate all inputs before submission
- **Prevention**: Use address validators and reasonable limits

#### Module Deployment
- **Problem**: Eligibility or toggle module addresses don't exist
- **Solution**: Deploy modules first or use zero address
- **Testing**: Test custom modules thoroughly

### 🔄 Role Management Planning

#### Supply Management
- **Start Conservative**: Begin with lower maxSupply
- **Monitor Usage**: Track actual assignment needs
- **Adjust Later**: Increase supply if role is mutable
- **Plan Growth**: Consider future organizational needs

Ready to create your new role? Let me know if you need any clarification or want to modify the parameters!`;
}

function generateAssignRoleTransactionContent(networkName: string, params: any): string {
  const hatId = params.hatId || '[HAT_ID]';
  const wearerAddress = params.wearerAddress || '[WEARER_ADDRESS]';

  return `# Role Assignment Transaction

I'll help you prepare a transaction to assign role ${hatId} to ${wearerAddress} on ${networkName}.

## Step 1: Assignment Preparation

### Prepare Mint Hat Transaction
\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId}",
  "wearer": "${wearerAddress}"
}
\`\`\`

This returns prepared transaction data for role assignment.

## Step 2: Pre-Assignment Verification

### 🔍 Role Availability Check
First, let's verify the role is available and appropriate:

\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId}"
}
\`\`\`

**Key checks**:
- Current supply vs. maximum supply
- Role description and requirements
- Admin permissions needed
- Eligibility module requirements

### 👤 Wearer Status Check
Verify the target address eligibility:

\`\`\`
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId}",
  "wearer": "${wearerAddress}"
}
\`\`\`

\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "${wearerAddress}",
  "includeInactive": false
}
\`\`\`

## Step 3: Transaction Details

### 📋 Function Call Analysis
The transaction calls: \`mintHat(hatId, wearer)\`

**Parameters**:
- \`hatId\`: ${hatId} (role to assign)
- \`wearer\`: ${wearerAddress} (person receiving role)

### ⛽ Gas Costs
- **Base Cost**: ~40,000-60,000 gas
- **Network**: ${networkName} current rates
- **Estimated**: ~$${networkName === 'ethereum' ? '4-30' : '0.01-0.5'}

### 🔐 Required Permissions
- Must be admin of the role or authorized minter
- Role must not be at maximum supply
- Wearer must meet eligibility requirements
- Role must be active (if toggle module exists)

## Step 4: Assignment Validation

### ✅ Pre-Assignment Checklist
- [ ] You have admin/minting permissions for this role
- [ ] Role is not at maximum capacity
- [ ] Target address ${wearerAddress} is correct
- [ ] Wearer meets eligibility requirements (if any)
- [ ] Role is currently active (if toggle exists)
- [ ] Target doesn't already wear this hat
- [ ] Sufficient gas funds available

### 🎯 Assignment Appropriateness
- **Business Need**: Is this assignment justified?
- **Timing**: Is this the right time for assignment?
- **Communication**: Has the wearer been notified?
- **Training**: Does wearer understand role responsibilities?
- **Documentation**: Will assignment be recorded properly?

## Step 5: Common Assignment Scenarios

### 👨‍💼 New Employee Onboarding
\`\`\`
Workflow:
1. HR approval for role assignment
2. Verify employee address
3. Assign role via mint transaction
4. Update internal systems
5. Notify team of new role assignment
\`\`\`

### 🔄 Role Transfer/Promotion
\`\`\`
Workflow:
1. Remove old role (if exclusive)
2. Assign new role
3. Update permissions in external systems
4. Document change
5. Communicate transition to stakeholders
\`\`\`

### 🚨 Emergency Assignment
\`\`\`
Workflow:
1. Immediate assignment for critical coverage
2. Temporary or permanent based on situation
3. Quick communication to affected teams
4. Follow-up documentation
5. Regular review of emergency assignments
\`\`\`

## Step 6: Batch Assignment Optimization

### 📦 Multiple Assignments
If assigning multiple roles or to multiple people:

\`\`\`
# Instead of individual transactions, consider:
# 1. Batch multiple mint operations
# 2. Use multicall if supported
# 3. Plan execution sequence
\`\`\`

### 💰 Gas Optimization
- **Batch Operations**: Multiple assignments in one transaction
- **Timing**: Execute during low gas periods
- **Network Choice**: Consider L2 networks for lower costs
- **Planning**: Group related assignments together

## Step 7: Transaction Execution

### 🔗 Execution Steps
1. **Final Review**: Verify all parameters one more time
2. **Gas Check**: Ensure reasonable gas price/limit
3. **Sign**: Use secure wallet (hardware wallet recommended)
4. **Submit**: Broadcast transaction to network
5. **Monitor**: Track transaction confirmation

### 📊 Success Indicators
- Transaction included in block
- No revert/error in transaction receipt
- HatMinted event emitted with correct parameters
- Role shows as assigned in subsequent queries

## Step 8: Post-Assignment Actions

### 🎯 Immediate Verification
\`\`\`
# Confirm assignment was successful
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId}",
  "wearer": "${wearerAddress}"
}

# Review wearer's complete role portfolio
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "${wearerAddress}",
  "includeInactive": false
}
\`\`\`

### 📋 Administrative Tasks
1. **Documentation**: Update organizational charts
2. **Communication**: Notify relevant stakeholders
3. **Systems**: Update external access control systems
4. **Training**: Ensure wearer understands role
5. **Monitoring**: Set up ongoing assignment tracking

### 🔄 Follow-up Planning
- **Review Schedule**: When to next review this assignment
- **Success Metrics**: How to measure role effectiveness
- **Succession**: Plan for eventual role transition
- **Feedback**: Gather input on role assignment process

## Troubleshooting Common Issues

### 🚫 Assignment Failures

#### Not Authorized
- **Cause**: You don't have admin rights for this role
- **Solution**: Use admin account or request assignment from admin
- **Prevention**: Check permissions before attempting assignment

#### Supply Exceeded
- **Cause**: Role is at maximum capacity
- **Solution**: Increase maxSupply (if mutable) or wait for vacancy
- **Prevention**: Monitor role capacity regularly

#### Not Eligible
- **Cause**: Wearer doesn't meet eligibility requirements
- **Solution**: Address eligibility issues or modify requirements
- **Prevention**: Check eligibility before assignment

#### Already Wearing
- **Cause**: Address already has this role
- **Solution**: No action needed, or burn then re-mint if intentional
- **Prevention**: Check current assignments first

### 🔄 Assignment Recovery

#### Transaction Failed
1. **Analyze Error**: Check transaction receipt for failure reason
2. **Address Issue**: Fix underlying problem (permissions, eligibility)
3. **Retry Assignment**: Prepare and execute new transaction
4. **Document**: Record issue and resolution for future reference

#### Wrong Assignment
1. **Immediate Action**: Consider if urgent removal needed
2. **Burn Role**: Remove incorrect assignment
3. **Correct Assignment**: Assign to proper person
4. **Process Review**: Improve assignment approval process

## Role Assignment Best Practices

### 🎯 Planning Principles
- **Least Privilege**: Assign minimum necessary permissions
- **Clear Purpose**: Every assignment should have clear justification
- **Appropriate Level**: Match role authority to responsibility
- **Temporal Relevance**: Regular review of assignment necessity

### 🔐 Security Considerations
- **Identity Verification**: Confirm wearer identity before assignment
- **Address Validation**: Ensure correct blockchain address
- **Permission Overlap**: Check for conflicting role assignments
- **Audit Trail**: Maintain complete assignment history

### 📊 Process Optimization
- **Standardization**: Use consistent assignment procedures
- **Automation**: Where possible, automate routine assignments
- **Monitoring**: Track assignment effectiveness and usage
- **Improvement**: Regularly enhance assignment processes

Ready to execute the role assignment? Let me know if you need any clarification or want to modify the parameters!`;
}

function generateBatchOperationsContent(networkName: string, params: any): string {
  const operations = params.operations || [];
  const _operationType = params.operationType || 'mixed';

  return `# Batch Operations Transaction Preparation

I'll help you prepare efficient batch transactions for multiple Hats Protocol operations on ${networkName}.

## Batch Operation Overview

### 📦 Batch Benefits
- **Cost Efficiency**: Reduce total gas costs by combining operations
- **Atomicity**: All operations succeed or fail together
- **Consistency**: Maintain organizational state consistency
- **Speed**: Faster than individual transactions

### 🎯 Batch Types
- **Role Creation**: Multiple new hats in one transaction
- **Assignment Batch**: Assign multiple roles to one or many people
- **Organizational Setup**: Complete tree creation and role assignment
- **Maintenance**: Bulk updates, transfers, or removals

## Batch Planning

### 📋 Operation Inventory
${operations.length > 0 ? 
  `Your planned operations:
${operations.map((op: any, index: number) => `
${index + 1}. **${op.type || 'Unknown'}**: ${op.description || 'No description'}
   - Parameters: ${JSON.stringify(op.parameters || {}, null, 2)}
`).join('\n')}` :
  `Let's plan your batch operations:

**Step 1**: Define operation types needed
- create-hat: New role creation
- mint-hat: Role assignments  
- burn-hat: Role removals
- transfer-hat: Role transfers

**Step 2**: Organize by dependencies
- Parent roles before child roles
- Role creation before assignment
- Prerequisite operations first`}

### 🔄 Dependency Analysis
Operations must be ordered correctly:

1. **Top Hat Creation** (if new organization)
2. **Executive Roles** (children of top hat)
3. **Department Roles** (children of executives)  
4. **Team Roles** (children of departments)
5. **Role Assignments** (after role creation)

## Batch Preparation Strategies

### 🏢 New Organization Setup
\`\`\`
# Complete organization in one batch:
1. prepare-mint-top-hat: Create organization root
2. prepare-create-hat: CEO role
3. prepare-create-hat: CTO role  
4. prepare-create-hat: CFO role
5. prepare-mint-hat: Assign CEO
6. prepare-mint-hat: Assign CTO
7. prepare-mint-hat: Assign CFO
\`\`\`

### 👥 Team Onboarding Batch
\`\`\`
# Assign multiple people to various roles:
1. prepare-mint-hat: Assign Developer role to Alice
2. prepare-mint-hat: Assign Designer role to Bob  
3. prepare-mint-hat: Assign Marketing role to Carol
4. prepare-mint-hat: Assign Developer role to Dave
\`\`\`

### 🔄 Organizational Restructuring
\`\`\`
# Complex reorganization:
1. prepare-burn-hat: Remove old assignments
2. prepare-create-hat: New roles
3. prepare-mint-hat: New assignments
4. prepare-transfer-hat: Move existing roles
\`\`\`

## Individual Transaction Preparation

### Step 1: Prepare Each Operation
For each operation in your batch:

#### Create Hat Operations
\`\`\`
Use tool: prepare-create-hat
Parameters:
{
  "networkName": "${networkName}",
  "admin": "[ADMIN_HAT_ID]",
  "details": "[ROLE_NAME]",
  "maxSupply": "[MAX_WEARERS]",
  "eligibility": "0x0000000000000000000000000000000000000000",
  "toggle": "0x0000000000000000000000000000000000000000",
  "mutable": true
}
\`\`\`

#### Mint Hat Operations  
\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[MEMBER_ADDRESS]"
}
\`\`\`

#### Burn Hat Operations
\`\`\`
Use tool: prepare-burn-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[MEMBER_ADDRESS]"
}
\`\`\`

#### Transfer Hat Operations
\`\`\`
Use tool: prepare-transfer-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "from": "[CURRENT_WEARER]",
  "to": "[NEW_WEARER]"
}
\`\`\`

## Batch Transaction Construction

### 🔧 Multicall Approach
Most efficient for multiple operations:

\`\`\`javascript
// Pseudo-code for batch construction
const batchCalls = [
  {
    target: HATS_CONTRACT,
    callData: createHatCalldata1
  },
  {
    target: HATS_CONTRACT,  
    callData: createHatCalldata2
  },
  {
    target: HATS_CONTRACT,
    callData: mintHatCalldata1
  }
  // ... more operations
];

// Execute via multicall contract
multicall.aggregate(batchCalls);
\`\`\`

### ⛽ Gas Estimation
- **Individual Estimates**: Sum gas for each operation
- **Batch Overhead**: Additional gas for multicall
- **Safety Buffer**: 20-30% extra for complex batches
- **Total Cost**: $${networkName === 'ethereum' ? '50-500' : '0.1-10'} (varies by size)

## Pre-Execution Validation

### ✅ Batch Validation Checklist
- [ ] All operations have valid parameters
- [ ] Dependencies are ordered correctly  
- [ ] Sufficient permissions for all operations
- [ ] No conflicting operations in batch
- [ ] Adequate gas funds available
- [ ] All addresses are validated
- [ ] Role limits respected

### 🔍 Simulation Testing
Before execution, simulate each operation:

\`\`\`
# Test each operation individually first
# Verify expected outcomes
# Check for any conflicts or issues
# Confirm gas estimates are reasonable
\`\`\`

## Execution Strategies

### 🎯 All-or-Nothing Approach
- **Advantage**: Complete consistency - all operations succeed together
- **Risk**: If one operation fails, entire batch reverts
- **Best For**: Highly related operations that must succeed together

### 🔄 Segmented Batching
- **Approach**: Break large batch into smaller, related groups
- **Advantage**: Reduce risk of total failure
- **Strategy**: Group by operation type or organizational area

### 📊 Progressive Execution
- **Method**: Execute batches in logical sequence
- **Monitoring**: Verify each batch before proceeding
- **Flexibility**: Adapt later batches based on earlier results

## Common Batch Scenarios

### 🏢 Complete Organization Setup
\`\`\`
Batch 1: Foundation
- Create top hat
- Create executive roles (CEO, CTO, CFO)

Batch 2: Management Layer  
- Create department head roles
- Assign executives to roles

Batch 3: Team Structure
- Create individual contributor roles
- Assign team members to roles
\`\`\`

### 👥 Quarterly Role Review
\`\`\`
Batch 1: Cleanup
- Burn roles for departed employees
- Transfer roles for promotions

Batch 2: New Assignments
- Create any new roles needed
- Assign roles to new team members
\`\`\`

### 🚨 Emergency Restructuring
\`\`\`
Batch 1: Immediate Changes
- Remove problematic assignments
- Assign emergency coverage

Batch 2: Structural Updates
- Create new governance roles
- Redistribute authority appropriately
\`\`\`

## Error Handling

### 🚫 Batch Failure Management
If batch transaction fails:

1. **Analyze Failure**: Identify which operation caused failure
2. **Fix Issue**: Address parameter or permission problem  
3. **Rebuild Batch**: Recreate with corrected operations
4. **Test Again**: Simulate before re-execution
5. **Document**: Record issue and resolution

### 🔄 Partial Success Scenarios
- **Individual Monitoring**: Track which operations succeeded
- **State Assessment**: Understand current organizational state
- **Completion Planning**: Determine remaining operations needed
- **Recovery Strategy**: Plan to complete intended changes

## Monitoring and Verification

### 📊 Post-Execution Verification
After successful batch execution:

\`\`\`
# Verify organizational structure
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 10
}

# Check specific role assignments
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[EACH_ASSIGNED_ADDRESS]",
  "includeInactive": false
}
\`\`\`

### 📋 Success Metrics
- **Completion Rate**: Percentage of operations executed successfully
- **Cost Efficiency**: Gas savings vs. individual transactions  
- **Time Savings**: Reduced execution time
- **Organizational Consistency**: All related changes applied together

## Advanced Batch Techniques

### 🔧 Dynamic Hat ID Calculation
For dependent operations, calculate hat IDs:

\`\`\`javascript
// If creating child hats, calculate IDs based on parent
const childHatId = calculateChildHatId(parentHatId, childIndex);
\`\`\`

### 🔗 Cross-Chain Batching
For multi-chain organizations:

\`\`\`
Chain 1 (Ethereum): Executive roles and governance
Chain 2 (Polygon): Operational team roles  
Chain 3 (Arbitrum): Development team roles
\`\`\`

### 📦 Template-Based Batching
Standardized batch templates for common scenarios:

\`\`\`
// Department template
function createDepartmentBatch(deptName, headAddress, teamMembers) {
  return [
    createDeptHeadHat(deptName),
    assignDeptHead(headAddress), 
    ...teamMembers.map(member => assignTeamRole(member))
  ];
}
\`\`\`

Ready to prepare your batch operations? Please provide:

1. **Operation Types**: What operations do you need?
2. **Dependencies**: Which operations depend on others?
3. **Addresses**: Target addresses for assignments
4. **Role Details**: Names, supplies, and descriptions
5. **Execution Strategy**: All-at-once or segmented approach

Let me know how you'd like to proceed with your batch transaction preparation!`;
}

function generateGeneralTransactionContent(networkName: string, operation: string, params: any): string {
  return `# General Transaction Preparation Guide

I'll help you prepare a blockchain transaction for "${operation}" on ${networkName}.

## Transaction Overview

### 🎯 Operation: ${operation}
${Object.keys(params).length > 0 ? `**Parameters provided**:
${Object.entries(params).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`).join('\n')}` : '**No specific parameters provided** - I\'ll guide you through the general process.'}

## Standard Transaction Preparation Process

### Step 1: Operation Identification
Based on your operation "${operation}", let's identify the specific Hats Protocol tools needed:

#### 🔍 Available Operations
- **prepare-mint-top-hat**: Create new organization
- **prepare-create-hat**: Create new role in organization  
- **prepare-mint-hat**: Assign role to address
- **prepare-burn-hat**: Remove role from address
- **prepare-transfer-hat**: Transfer role between addresses

### Step 2: Parameter Validation
Every Hats Protocol transaction requires specific parameters:

#### 📋 Common Parameters
- **networkName**: Blockchain network (e.g., "${networkName}")
- **hatId**: Role identifier (256-bit hex number)
- **wearer**: Address that holds or will hold the role
- **admin**: Address with administrative control

#### 🔍 Parameter Formats
- **Addresses**: 42-character hex strings starting with "0x"
- **Hat IDs**: 64-character hex strings or pretty format
- **Network Names**: lowercase strings like "ethereum", "polygon"

### Step 3: Pre-Transaction Checks
Before preparing any transaction:

\`\`\`
# Check your current roles and permissions
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# If working with specific role, get details
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]"
}
\`\`\`

## Transaction Types Guide

### 🏢 Organization Creation
If "${operation}" involves creating a new organization:

\`\`\`
Use tool: prepare-mint-top-hat
Parameters:
{
  "networkName": "${networkName}",
  "target": "[FOUNDER_ADDRESS]",
  "details": "Organization Name and Description",
  "imageURI": "https://your-logo-url.com/logo.png"
}
\`\`\`

### 🎭 Role Creation  
If "${operation}" involves creating new roles:

\`\`\`
Use tool: prepare-create-hat
Parameters:
{
  "networkName": "${networkName}",
  "admin": "[ADMIN_HAT_ID]",
  "details": "Role Name and Description",
  "maxSupply": 5,
  "eligibility": "0x0000000000000000000000000000000000000000",
  "toggle": "0x0000000000000000000000000000000000000000",
  "mutable": true,
  "imageURI": "https://role-icon-url.com/icon.png"
}
\`\`\`

### 👤 Role Assignment
If "${operation}" involves assigning roles:

\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[MEMBER_ADDRESS]"
}
\`\`\`

### 🔄 Role Management
If "${operation}" involves role transfers or removals:

\`\`\`
# For transfers:
Use tool: prepare-transfer-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "from": "[CURRENT_WEARER]",
  "to": "[NEW_WEARER]"
}

# For removals:
Use tool: prepare-burn-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[CURRENT_WEARER]"
}
\`\`\`

## Network-Specific Considerations

### 🌐 ${networkName} Network Details
${networkName === 'ethereum' ? `
**Ethereum Mainnet**:
- **Higher Security**: Most secure and battle-tested
- **Gas Costs**: $5-100+ per transaction (varies by congestion)
- **Speed**: 1-5+ minutes for confirmation
- **Finality**: High confidence after 12+ blocks
` : networkName === 'polygon' ? `
**Polygon Network**:
- **Lower Costs**: $0.01-0.50 typical transaction fees
- **Faster Speed**: 2-5 seconds for confirmation  
- **Good Security**: Proven Layer 2 solution
- **Ethereum Compatible**: Same tooling and interfaces
` : networkName === 'arbitrum' ? `
**Arbitrum Network**:
- **Cost Efficient**: $0.10-2.00 typical fees
- **Fast Confirmation**: Near-instant transaction inclusion
- **Ethereum Security**: Inherits Ethereum's security
- **Developer Friendly**: Full Ethereum compatibility
` : `
**${networkName} Network**:
- Check current gas prices and confirmation times
- Verify Hats Protocol is deployed on this network
- Ensure your wallet supports this network
- Consider network-specific features or limitations
`}

## Gas Estimation and Costs

### ⛽ Gas Usage Patterns
- **Top Hat Creation**: ~60,000-100,000 gas
- **Role Creation**: ~80,000-150,000 gas
- **Role Assignment**: ~40,000-80,000 gas
- **Role Transfer**: ~50,000-100,000 gas
- **Role Removal**: ~30,000-60,000 gas

### 💰 Cost Planning
Current estimated costs on ${networkName}:
- **Simple Operations**: $${networkName === 'ethereum' ? '5-50' : '0.01-1'}
- **Complex Operations**: $${networkName === 'ethereum' ? '10-100' : '0.02-2'}
- **Batch Operations**: ${networkName === 'ethereum' ? 'Often more cost-effective' : 'Minimal additional savings'}

## Transaction Security

### 🔐 Security Best Practices
1. **Verify Addresses**: Double-check all addresses are correct
2. **Check Permissions**: Ensure you have required admin rights
3. **Reasonable Gas**: Don't set gas too low or excessively high
4. **Hardware Wallets**: Use hardware wallets for high-value operations
5. **Test First**: Try on testnets before mainnet

### ⚠️ Common Security Risks
- **Address Typos**: Sending to wrong address (irreversible)
- **Insufficient Gas**: Transaction fails but still costs gas
- **Wrong Network**: Connecting to incorrect blockchain
- **Compromised Keys**: Using wallet on insecure device

## Post-Transaction Process

### 📊 Transaction Monitoring
After submitting transaction:

1. **Save Transaction Hash**: For tracking and records
2. **Monitor Status**: Use block explorer to watch confirmation
3. **Verify Results**: Check that intended changes occurred
4. **Update Documentation**: Record transaction in organizational logs

### ✅ Success Verification
\`\`\`
# For role assignments, verify success:
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ASSIGNED_HAT_ID]",
  "wearer": "[TARGET_ADDRESS]"
}

# For organizational changes, check structure:
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ORGANIZATION_TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 5
}
\`\`\`

## Troubleshooting Guide

### 🚫 Common Transaction Issues

#### Insufficient Permissions
- **Problem**: Don't have admin rights for operation
- **Solution**: Use account with proper permissions or request authorization
- **Prevention**: Check permissions before transaction preparation

#### Invalid Parameters
- **Problem**: Incorrect addresses, hat IDs, or other parameters
- **Solution**: Validate all inputs against expected formats
- **Prevention**: Use address/ID validation tools

#### Network Issues
- **Problem**: Wrong network, high gas prices, or congestion
- **Solution**: Switch networks, adjust gas, or wait for better conditions
- **Prevention**: Monitor network conditions before execution

### 🔄 Recovery Options
- **Failed Transactions**: Analyze error, fix issue, retry
- **Wrong Assignments**: Use burn/transfer tools to correct
- **Gas Issues**: Adjust parameters and resubmit
- **Network Problems**: Switch to alternative RPC or wait

## Getting Specific Help

To get more targeted guidance for your "${operation}" operation, please provide:

### 📋 Required Information
1. **Specific Goal**: What exactly are you trying to accomplish?
2. **Current State**: What roles/organization structure exists now?
3. **Target Addresses**: Who should receive roles or permissions?
4. **Role Details**: Names, descriptions, and supply limits for any new roles
5. **Timeline**: When do you need this completed?
6. **Constraints**: Any specific requirements or limitations?

### 🎯 Example Request Format
"I want to [specific action] for [organization/person] on ${networkName}. I need to [detailed requirements]. The target address is [address] and [any other relevant details]."

Would you like me to help you prepare a specific transaction? Please provide more details about what you're trying to accomplish!`;
}