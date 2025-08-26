/**
 * Troubleshooting Prompt
 * Guides users through diagnosing and resolving common Hats Protocol issues
 */

import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export async function troubleshootingPrompt(args?: Record<string, unknown>): Promise<GetPromptResult> {
  const networkName = args?.networkName as string || '[NETWORK_NAME]';
  const issue = args?.issue as string || '[ISSUE_TYPE]';
  const errorDetails = args?.errorDetails as string || '';
  const transactionHash = args?.transactionHash as string || '';

  const messages: PromptMessage[] = [];

  // User request message
  messages.push({
    role: 'user',
    content: {
      type: 'text',
      text: `I'm having trouble with Hats Protocol on ${networkName}. Issue type: ${issue}${errorDetails ? `, Error: ${errorDetails}` : ''}${transactionHash ? `, Transaction: ${transactionHash}` : ''}`
    }
  });

  // Generate troubleshooting content based on issue type
  let responseContent = '';

  switch (issue.toLowerCase()) {
    case 'transaction-failed':
      responseContent = generateTransactionFailedContent(networkName, errorDetails, transactionHash);
      break;
    case 'role-not-working':
      responseContent = generateRoleNotWorkingContent(networkName, errorDetails);
      break;
    case 'permissions':
      responseContent = generatePermissionsContent(networkName, errorDetails);
      break;
    case 'gas-estimation':
      responseContent = generateGasEstimationContent(networkName, errorDetails);
      break;
    default:
      responseContent = generateGeneralTroubleshootingContent(networkName, issue, errorDetails, transactionHash);
  }

  messages.push({
    role: 'assistant',
    content: {
      type: 'text',
      text: responseContent
    }
  });

  return {
    description: `Troubleshooting ${issue} on ${networkName}`,
    messages
  };
}

function generateTransactionFailedContent(networkName: string, errorDetails: string, transactionHash: string): string {
  return `# Transaction Failure Troubleshooting

I'll help you diagnose and resolve the transaction failure on ${networkName}.

## Step 1: Transaction Analysis

${transactionHash ? `### Transaction Hash Analysis
Let's examine the failed transaction: ${transactionHash}

**Manual Investigation**:
- Check transaction on block explorer (Etherscan for Ethereum, etc.)
- Look for revert reason in transaction receipt
- Examine gas usage vs gas limit
- Check transaction status and confirmations` : 
`### Transaction Hash Needed
To properly diagnose the issue, please provide:
- **Transaction Hash**: The hash of the failed transaction
- **Wallet Address**: Address that submitted the transaction
- **Approximate Time**: When the transaction was submitted`}

${errorDetails ? `### Error Message Analysis
Error: "${errorDetails}"

${analyzeErrorMessage(errorDetails)}` : 
`### Error Details Needed
Please provide any error messages you received:
- Wallet error messages
- Block explorer error details
- Console errors (if using web interface)
- RPC error responses`}

## Step 2: Common Transaction Failure Causes

### 🚫 Insufficient Permissions
**Symptoms**: "Unauthorized", "Not admin", "Access denied"
**Cause**: Your address lacks required permissions for the operation

**Diagnosis**:
\`\`\`
# Check your current roles
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# Check specific role details
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[RELEVANT_HAT_ID]"
}
\`\`\`

**Solutions**:
1. **Get Admin Rights**: Request appropriate admin role from organization
2. **Use Admin Account**: Switch to account with proper permissions
3. **Verify Role Chain**: Ensure you have admin rights for the specific role

### ⛽ Gas-Related Issues
**Symptoms**: "Out of gas", "Gas limit exceeded", "Insufficient funds"

#### Gas Limit Too Low
**Cause**: Transaction needs more gas than provided
**Solution**: Increase gas limit by 20-50%

#### Insufficient Balance
**Cause**: Not enough ETH/native tokens for gas
**Solution**: Add funds to wallet

#### Gas Price Too Low
**Cause**: Network congestion, transaction not prioritized
**Solution**: Increase gas price or wait for lower congestion

### 📊 Supply and Capacity Issues
**Symptoms**: "Max supply exceeded", "Hat not available"
**Cause**: Role is at maximum capacity

**Diagnosis**:
\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]"
}
\`\`\`

**Solutions**:
1. **Increase Max Supply**: If role is mutable, admin can increase capacity
2. **Wait for Vacancy**: Someone must leave role first
3. **Burn Inactive**: Remove inactive role holders

### 🔒 Eligibility Module Issues
**Symptoms**: "Not eligible", "Eligibility check failed"
**Cause**: Address doesn't meet eligibility requirements

**Common Eligibility Requirements**:
- Must hold specific tokens
- Must already wear prerequisite roles
- Must meet custom criteria defined by module

**Diagnosis Steps**:
1. **Check Module Address**: Get eligibility module from role details
2. **Review Requirements**: Understand what criteria must be met
3. **Verify Compliance**: Ensure target address meets all requirements

### 🔄 State Conflicts
**Symptoms**: "Already wearing hat", "Invalid state transition"

#### Already Wearing Role
**Cause**: Address already has the role you're trying to assign
**Solution**: Check current assignments first, or burn then re-mint if intentional

#### Role Dependencies
**Cause**: Trying to create child role before parent exists
**Solution**: Create roles in proper hierarchical order

## Step 3: Network-Specific Issues

### 🌐 ${networkName} Specific Problems
${networkName === 'ethereum' ? `
**Ethereum Mainnet Issues**:
- **High Gas Costs**: Prices can spike during congestion
- **Slow Confirmation**: Can take 5+ minutes during busy periods
- **MEV Issues**: Complex transactions may be front-run
- **Network Congestion**: High demand can cause delays

**Solutions**:
- Monitor gas tracker websites
- Use EIP-1559 transactions with priority fees
- Consider timing transactions during low activity
- Use flashbots or similar for MEV protection
` : networkName === 'polygon' ? `
**Polygon Network Issues**:
- **MATIC Balance**: Need MATIC for gas fees, not ETH
- **RPC Issues**: Some RPC endpoints may be unreliable
- **Bridge Delays**: Deposits from Ethereum can take time
- **Reorg Risk**: Slightly higher reorganization risk

**Solutions**:
- Ensure wallet has MATIC balance
- Try alternative RPC endpoints
- Wait for sufficient confirmations
- Monitor for chain reorganizations
` : `
**${networkName} Network Issues**:
- Verify network is supported by your wallet
- Check for network-specific gas token requirements
- Ensure RPC endpoint is working properly
- Confirm Hats Protocol is deployed on this network
`}

## Step 4: Diagnostic Commands

### 🔍 Comprehensive Diagnosis
Run these commands to gather information:

\`\`\`
# 1. Check your account status
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# 2. Check target role status (if applicable)
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[TARGET_HAT_ID]"
}

# 3. Check organizational structure
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ORGANIZATION_TREE_ID]",
  "format": "json",
  "maxDepth": 5
}

# 4. Verify specific role assignment (if applicable)
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[RELEVANT_HAT_ID]",
  "wearer": "[TARGET_ADDRESS]"
}
\`\`\`

## Step 5: Resolution Strategies

### 🔄 Immediate Actions
1. **Check Transaction Status**: Confirm it actually failed vs. still pending
2. **Verify Parameters**: Ensure all addresses and IDs are correct
3. **Check Permissions**: Confirm you have required admin rights
4. **Review Balance**: Ensure sufficient funds for gas

### 🔧 Common Fixes

#### Permission Issues
\`\`\`
# If you need admin rights, request from current admin:
# 1. Identify current admin of the role
# 2. Request assignment to admin role
# 3. Retry original operation with admin permissions
\`\`\`

#### Gas Issues
\`\`\`
# Retry with higher gas:
# 1. Increase gas limit by 50%
# 2. Use higher gas price if network is congested
# 3. Ensure wallet has sufficient balance
\`\`\`

#### Supply Issues
\`\`\`
# If role is at capacity:
# 1. Check if any current wearers are inactive
# 2. Burn inactive assignments to free capacity
# 3. Or increase maxSupply if role is mutable
\`\`\`

### 📊 Systematic Approach
1. **Identify Root Cause**: Use diagnostic commands to pinpoint issue
2. **Address Underlying Problem**: Fix permissions, gas, or parameters
3. **Retry Operation**: Execute corrected transaction
4. **Verify Success**: Confirm intended changes occurred
5. **Document Resolution**: Record solution for future reference

## Step 6: Prevention Strategies

### 🛡️ Pre-Transaction Checks
Always verify before executing:
- [ ] Correct network selected in wallet
- [ ] Sufficient balance for gas fees
- [ ] All addresses are valid and correct
- [ ] You have required permissions
- [ ] Role has available capacity (if applicable)
- [ ] Transaction parameters are reasonable

### 📋 Testing Methodology
- **Start Small**: Test with simple operations first
- **Use Testnets**: Try complex operations on test networks
- **Simulate First**: Use eth_call to simulate before execution
- **Monitor Closely**: Watch first transaction before batching

### 🔄 Recovery Planning
- **Document Everything**: Keep records of all operations
- **Have Rollback Plans**: Know how to undo changes if needed
- **Test Recovery**: Practice fixing common issues
- **Stay Updated**: Keep track of protocol changes

## Step 7: Advanced Debugging

### 🔬 Deep Transaction Analysis
If basic troubleshooting doesn't work:

#### Contract Event Analysis
- Check for relevant events in transaction logs
- Look for partial execution in complex transactions
- Verify all expected state changes occurred

#### State Verification
\`\`\`
# Before and after state comparison:
# 1. Record state before transaction
# 2. Execute transaction
# 3. Compare resulting state
# 4. Identify what didn't change as expected
\`\`\`

#### Module Interaction Issues
- Custom eligibility modules may have bugs
- Toggle modules might not be working correctly
- Inter-contract calls could be failing

### 🔧 Developer Tools
For technical users:
- Use block explorers with contract interaction features
- Run local blockchain fork for testing
- Use debugging tools like Tenderly
- Examine contract source code for edge cases

## Getting Additional Help

### 📞 When to Seek Help
Contact support or community when:
- Error messages are unclear or undocumented
- Issue persists after trying standard solutions
- Complex technical integration problems
- Suspected protocol bugs or edge cases

### 📋 Information to Provide
When seeking help, include:
- **Network**: ${networkName}
- **Transaction Hash**: ${transactionHash || '[PLEASE_PROVIDE]'}
- **Error Message**: ${errorDetails || '[PLEASE_PROVIDE]'}
- **Operation Type**: What you were trying to do
- **Account Address**: Your wallet address (if comfortable sharing)
- **Steps Taken**: What troubleshooting you've already tried

### 🌐 Community Resources
- **Hats Protocol Discord**: Real-time community support
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Official docs and tutorials
- **Forum Discussions**: Search for similar issues

## Next Steps

Based on your specific situation:

1. **Gather Information**: Collect transaction hash and error details
2. **Run Diagnostics**: Execute the diagnostic commands above
3. **Implement Solution**: Apply the appropriate fix
4. **Test Resolution**: Verify the issue is resolved
5. **Document Learning**: Record solution for future reference

Would you like me to help you work through any specific aspect of this troubleshooting process?`;
}

function generateRoleNotWorkingContent(networkName: string, errorDetails: string): string {
  return `# Role Functionality Troubleshooting

I'll help you diagnose why a role isn't working as expected on ${networkName}.

## Step 1: Role Status Diagnosis

### 🔍 Basic Role Health Check
First, let's verify the fundamental role status:

\`\`\`
# Check role details and current status
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[PROBLEMATIC_HAT_ID]"
}

# Verify current wearer status
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[PROBLEMATIC_HAT_ID]",
  "wearer": "[AFFECTED_ADDRESS]"
}
\`\`\`

${errorDetails ? 
  `### Error Context
Issue details: "${errorDetails}"

${analyzeRoleError(errorDetails)}` 
  : 
  `### Need More Details
Please provide specific symptoms:
- What should the role do vs. what it's actually doing?
- Are there error messages when trying to use role?
- Is the issue with assignment, permissions, or functionality?
- When did the problem start occurring?`}

## Step 2: Common Role Issues

### 🚫 Role Assignment Problems

#### Role Not Assigned
**Symptoms**: User doesn't appear to have role
**Diagnosis**:
\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[USER_ADDRESS]",
  "includeInactive": true
}
\`\`\`

**Common Causes**:
- Assignment transaction failed
- Role was burned/removed
- Wrong address used
- Network synchronization delay

#### Role Shows as Inactive
**Symptoms**: Role assignment exists but shows as inactive/burned
**Causes**:
- Role was explicitly burned
- Eligibility module requirements no longer met
- Toggle module deactivated the role
- Admin permissions changed

### 🔒 Permission-Related Issues

#### Expected Permissions Not Working
**Symptoms**: Role holder can't perform expected actions
**Investigation Areas**:
1. **External Systems**: Hats role might not be connected to external permissions
2. **Integration Issues**: Middleware or authentication not recognizing role
3. **Stale Caches**: Systems using outdated role information
4. **Wrong Role**: User has similar but not exact role needed

#### Admin Rights Not Functioning
**Symptoms**: Admin can't manage subordinate roles
**Diagnosis**:
\`\`\`
# Check admin role status
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ADMIN_HAT_ID]"
}

# Verify organizational hierarchy
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ORGANIZATION_TREE_ID]",
  "format": "json",
  "maxDepth": 10
}
\`\`\`

### 🔧 Module-Related Issues

#### Eligibility Module Problems
**Symptoms**: Role assignment fails or becomes inactive unexpectedly

**Common Eligibility Issues**:
- **Token Requirements**: Required token balance changed
- **Role Prerequisites**: Prerequisite roles were removed
- **Time-based**: Time windows or expiration conditions
- **Custom Logic**: Module bug or unexpected behavior

**Diagnosis**:
\`\`\`
# If eligibility module is set, investigate:
# 1. Get module address from role details
# 2. Check module requirements
# 3. Verify user still meets criteria
# 4. Test module function directly if possible
\`\`\`

#### Toggle Module Issues
**Symptoms**: Role randomly becomes inactive or can't be activated

**Common Toggle Problems**:
- **Admin Controls**: Toggle admin disabled the role
- **Automated Conditions**: Time-based or condition-triggered deactivation
- **Module Bugs**: Faulty toggle logic
- **Gas Issues**: Toggle state changes failing

### 🌐 Integration Problems

#### External System Integration
**Symptoms**: Hats role works on-chain but not in connected applications

**Common Integration Issues**:
1. **API Synchronization**: External systems not synced with blockchain
2. **Wrong Network**: Application connected to different network
3. **Caching Issues**: Stale role information in databases
4. **Authentication Flow**: Role verification not properly implemented

**Solutions**:
- Check external system's blockchain connection
- Verify correct network configuration
- Clear caches and refresh role data
- Review authentication/authorization implementation

## Step 3: Systematic Diagnosis

### 📊 Role Lifecycle Check
Let's trace the role from creation to current state:

#### 1. Role Creation Verification
\`\`\`
# Verify role was created properly
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]"
}
\`\`\`

**Check for**:
- Correct role name and description
- Appropriate max supply
- Proper admin hierarchy
- Expected module configurations

#### 2. Assignment History
\`\`\`
# Review current and past assignments
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[AFFECTED_ADDRESS]",
  "includeInactive": true
}
\`\`\`

**Look for**:
- Multiple assignments/burns of same role
- Recent changes in role status
- Conflicting role assignments

#### 3. Organizational Context
\`\`\`
# Check organizational structure
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 10
}
\`\`\`

**Analyze**:
- Role position in hierarchy
- Admin chains and dependencies
- Related roles and permissions

## Step 4: Specific Role Type Issues

### 👑 Top Hat Problems
**Issues**: Can't create subordinate roles, organization appears broken
**Diagnosis**:
- Verify top hat is held by correct address
- Check if top hat was transferred incorrectly
- Ensure top hat wasn't burned

### 🏢 Admin Role Issues
**Issues**: Can't manage subordinate roles, no admin permissions
**Common Causes**:
- Admin role hierarchy broken
- Admin role was burned or transferred
- Circular admin dependencies
- Module preventing admin functions

### 👤 Individual Contributor Roles
**Issues**: Role exists but provides no functionality
**Common Causes**:
- Role not connected to external systems
- Eligibility requirements changed
- Toggle module deactivated role
- Integration configuration problems

## Step 5: Resolution Strategies

### 🔄 Immediate Fixes

#### Re-assign Role
If role appears missing or inactive:
\`\`\`
# Burn and re-mint if necessary
Use tool: prepare-burn-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[AFFECTED_ADDRESS]"
}

# Then re-assign
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[AFFECTED_ADDRESS]"
}
\`\`\`

#### Fix Module Issues
- **Eligibility**: Ensure user meets all requirements
- **Toggle**: Activate role if it was deactivated
- **Admin**: Verify admin chain is intact

### 🔧 System Integration Fixes

#### External System Refresh
1. **Clear Caches**: Refresh role data in connected systems
2. **Restart Services**: Bounce authentication/authorization services
3. **Update Configuration**: Ensure correct network/contract addresses
4. **Verify API Keys**: Check blockchain API access

#### Database Synchronization
- Force re-sync of blockchain data
- Check for indexing delays in subgraph
- Verify event processing is up to date
- Clear any stale cached role information

## Step 6: Prevention and Monitoring

### 📊 Role Health Monitoring
Set up ongoing monitoring for:
- **Assignment Changes**: Track role mints/burns
- **Module State**: Monitor eligibility/toggle changes
- **Admin Actions**: Watch for structural changes
- **Integration Health**: Verify external system connectivity

### 🛡️ Best Practices
- **Regular Audits**: Periodic role functionality checks
- **Documentation**: Keep role purposes and integration details updated
- **Testing**: Regular testing of role-dependent functionality
- **Backup Plans**: Have procedures for role recovery

### 🔔 Alert Systems
Consider setting up alerts for:
- Unexpected role burns or transfers
- Eligibility requirement changes
- Toggle module deactivations
- Integration failures

## Step 7: Advanced Troubleshooting

### 🔬 Technical Deep Dive
For complex issues:

#### Contract State Analysis
- Examine contract storage directly
- Check for edge cases in module logic
- Verify event emissions match expectations
- Look for state inconsistencies

#### Module Debugging
- Test eligibility functions directly
- Check toggle state and history
- Verify module upgrade states
- Examine inter-module dependencies

### 🔧 Developer Tools
- Use block explorers with contract debugging
- Set up local blockchain forks for testing
- Implement comprehensive logging
- Create test scenarios to reproduce issues

## Getting Help

### 📋 Information to Gather
Before seeking additional help:
- [ ] Hat ID of problematic role
- [ ] Address of affected user
- [ ] Specific functionality that's not working
- [ ] Error messages (if any)
- [ ] Recent changes to role or organization
- [ ] External systems that should recognize role

### 🌐 Community Support
- **Hats Protocol Discord**: Real-time community help
- **GitHub Issues**: Technical bugs and feature requests
- **Documentation**: Check for known issues and solutions
- **Developer Forums**: Integration-specific discussions

Would you like me to help you diagnose a specific role issue? Please provide the role details and symptoms you're experiencing.`;
}

function generatePermissionsContent(networkName: string, errorDetails: string): string {
  return `# Permission Issues Troubleshooting

I'll help you diagnose and resolve permission-related problems on ${networkName}.

## Step 1: Permission Context Analysis

${errorDetails ? `### Current Issue
Error: "${errorDetails}"

${analyzePermissionError(errorDetails)}` : 
`### Permission Issue Details Needed
Please provide specifics about the permission problem:
- What action are you trying to perform?
- What error message are you receiving?
- Which role or address is having permission issues?
- When did this issue start occurring?`}

### 🔍 Initial Diagnosis
Let's start by understanding your current permission context:

\`\`\`
# Check your current roles and permissions
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}
\`\`\`

## Step 2: Common Permission Problems

### 🚫 Insufficient Admin Rights

#### "Not Authorized" Errors
**Symptoms**: Can't create, mint, burn, or transfer roles
**Root Cause**: Your address lacks admin permissions for the target role

**Diagnosis Process**:
\`\`\`
# 1. Check the role you're trying to manage
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[TARGET_ROLE_HAT_ID]"
}

# 2. Check if you wear the admin role
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ADMIN_HAT_ID_FROM_STEP_1]",
  "wearer": "[YOUR_ADDRESS]"
}
\`\`\`

**Solutions**:
1. **Get Admin Role**: Request assignment to appropriate admin role
2. **Use Admin Account**: Switch to account that has admin permissions
3. **Check Role Hierarchy**: Verify you're admin of the correct parent role

### 🔐 Role Assignment Permissions

#### Can't Assign Roles to Others
**Symptoms**: "Unauthorized mint", "Not eligible to mint"
**Common Causes**:
- Not admin of the role being assigned
- Role is at maximum supply
- Target address doesn't meet eligibility requirements
- Role is currently inactive (toggle module)

**Step-by-Step Resolution**:
\`\`\`
# 1. Verify role capacity and status
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_TO_ASSIGN]"
}

# 2. Check your admin permissions
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# 3. Verify target eligibility (if relevant)
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_TO_ASSIGN]",
  "wearer": "[TARGET_ADDRESS]"
}
\`\`\`

### 🏢 Organization-Level Permissions

#### Can't Create New Roles
**Symptoms**: Unable to create child roles in organization
**Investigation**:
- Do you hold an admin role that can create children?
- Is your admin role active and in good standing?
- Are you trying to create at the correct level in hierarchy?

**Verification**:
\`\`\`
# Check organizational structure and your position
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ORGANIZATION_TREE_ID]",
  "format": "json",
  "maxDepth": 10
}
\`\`\`

#### Top Hat Management Issues
**Symptoms**: Can't perform organization-wide operations
**Critical Checks**:
- Do you hold the top hat for this organization?
- Has the top hat been transferred or burned?
- Is there a permissions hierarchy issue?

## Step 3: Module-Specific Permission Issues

### 🔧 Eligibility Module Restrictions

#### Eligibility Requirements Not Met
**Symptoms**: "Not eligible", "Eligibility check failed"
**Understanding Eligibility**:
- Modules can require token balances, other roles, or custom criteria
- Requirements can change over time
- Module bugs can cause unexpected failures

**Diagnosis**:
\`\`\`
# Get role details to find eligibility module
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[RESTRICTED_ROLE_ID]"
}

# The eligibility field will show the module address
# You'll need to check what requirements that module enforces
\`\`\`

**Common Eligibility Types**:
- **Token-based**: Must hold minimum amount of specific ERC20
- **Role-based**: Must wear prerequisite hat(s)
- **Time-based**: Only eligible during certain time periods
- **Custom Logic**: Arbitrary conditions defined by module

### 🔄 Toggle Module Restrictions

#### Role Deactivated by Toggle
**Symptoms**: Role exists but appears inactive or unusable
**Understanding Toggles**:
- Toggle modules can activate/deactivate roles dynamically
- Can be controlled by admins, time, or other conditions
- Inactive roles can't be used even if assigned

**Resolution**:
1. **Identify Toggle Module**: Get address from role details
2. **Check State**: Determine if role is currently active
3. **Understand Control**: Who or what can toggle the role
4. **Request Activation**: Contact toggle controller if needed

## Step 4: Hierarchical Permission Analysis

### 🌳 Understanding Role Hierarchy
Hats Protocol uses nested permissions:
- **Top Hat**: Ultimate authority over entire organization
- **Admin Roles**: Can manage specific subordinate roles
- **Child Roles**: Inherit permissions from parent structure

### 📊 Permission Inheritance
\`\`\`
Organization Tree Example:
├── Top Hat (0x00000001...)
    ├── CEO (0x00000001.0001...)          [Can manage all below]
        ├── CTO (0x00000001.0001.0001...) [Can manage tech roles]
        ├── CFO (0x00000001.0001.0002...) [Can manage finance roles]
        └── COO (0x00000001.0001.0003...) [Can manage ops roles]
\`\`\`

### 🔍 Tracing Permission Chains
To understand why you can't perform an action:

\`\`\`
# 1. Identify the target role's admin
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[TARGET_ROLE]"
}

# 2. Check if you wear that admin role
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ADMIN_ROLE_FROM_STEP_1]",
  "wearer": "[YOUR_ADDRESS]"
}

# 3. If not, check if you're admin of the admin role
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ADMIN_ROLE_FROM_STEP_1]"
}

# Continue until you find your level in the hierarchy
\`\`\`

## Step 5: External System Permission Integration

### 🔗 Connected Systems Not Recognizing Roles
**Symptoms**: Have Hats role but can't access connected applications
**Common Issues**:
- Application not synced with blockchain
- Wrong network configuration
- Authentication middleware issues
- Role mapping problems

**Troubleshooting**:
1. **Verify Blockchain Connection**: Ensure app connects to correct network
2. **Check Authentication**: Verify wallet connection and signature
3. **Clear Caches**: Refresh any cached permission data
4. **Contact Support**: Report integration issues to application team

### 📡 API and Middleware Issues
**Integration Problems**:
- Subgraph data delays
- RPC endpoint issues  
- Authentication token expiration
- Permission caching problems

**Solutions**:
- Try different RPC endpoints
- Wait for subgraph synchronization
- Refresh authentication tokens
- Clear application caches

## Step 6: Resolution Strategies

### 🎯 Immediate Actions

#### Permission Escalation
If you need higher permissions:
1. **Identify Required Role**: Determine what admin level you need
2. **Contact Admin**: Request assignment from appropriate admin
3. **Justify Need**: Explain why you need the permissions
4. **Time-bound**: Request temporary permissions if appropriate

#### Quick Fixes
For common issues:
\`\`\`
# Refresh your role status (in case of sync issues)
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# Verify specific role assignment
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[YOUR_ADMIN_ROLE]",
  "wearer": "[YOUR_ADDRESS]"
}
\`\`\`

### 🔧 Systematic Approach

#### Permission Audit Process
1. **Map Current State**: Document all your current roles
2. **Identify Requirements**: Determine what permissions are needed
3. **Find Gap**: Understand what you're missing
4. **Request Access**: Follow proper channels for permission requests
5. **Verify Success**: Confirm new permissions work as expected

#### Role Request Process
\`\`\`
Standard Role Request:
1. Identify the admin who can grant the role
2. Prepare business justification
3. Submit formal request through appropriate channels
4. Wait for approval and assignment
5. Test new permissions
6. Document granted access
\`\`\`

## Step 7: Prevention and Best Practices

### 🛡️ Permission Management Best Practices
- **Principle of Least Privilege**: Only request minimum necessary permissions
- **Regular Review**: Periodically audit your role assignments
- **Documentation**: Keep track of what roles you have and why
- **Backup Access**: Ensure multiple people can perform critical functions

### 📊 Ongoing Monitoring
Set up monitoring for:
- Changes to your role assignments
- Permission-related errors in applications
- New role requirements for your functions
- Organization structure changes

### 🔔 Alert Systems
Consider alerts for:
- Loss of critical role assignments
- Changes to roles you administer
- Permission failures in connected systems
- New eligibility requirements for your roles

## Step 8: Advanced Permission Scenarios

### 🏢 Multi-Organization Permissions
If you work across multiple Hats organizations:
- Keep track of roles in each organization tree
- Understand which permissions apply where
- Manage different addresses for different contexts
- Coordinate permission requests across organizations

### 🔄 Dynamic Permission Management
For roles with changing requirements:
- Monitor eligibility module changes
- Track toggle state modifications
- Prepare for permission transitions
- Have backup access plans

### 🔧 Custom Module Interactions
When working with custom eligibility or toggle modules:
- Understand module-specific requirements
- Test module behavior in safe environments
- Document module quirks and limitations
- Have direct contact with module administrators

## Getting Additional Support

### 📋 Information for Support Requests
When seeking help with permission issues:
- [ ] Your wallet address
- [ ] Specific action you're trying to perform
- [ ] Role or hat ID you're trying to manage
- [ ] Complete error message
- [ ] Network you're using
- [ ] Steps you've already tried

### 🌐 Community Resources
- **Hats Protocol Discord**: Community support and discussions
- **Documentation**: Official guides and troubleshooting
- **GitHub Issues**: Bug reports and technical questions
- **Developer Forums**: Integration and technical discussions

Would you like me to help you diagnose a specific permission issue? Please provide details about what you're trying to do and any error messages you're seeing.`;
}

function generateGasEstimationContent(networkName: string, errorDetails: string): string {
  return `# Gas Estimation Issues Troubleshooting

I'll help you resolve gas estimation and transaction cost issues on ${networkName}.

## Step 1: Gas Issue Diagnosis

${errorDetails ? `### Current Gas Problem
Issue: "${errorDetails}"

${analyzeGasError(errorDetails)}` : 
`### Gas Issue Details Needed
Please specify the gas problem you're experiencing:
- Are transactions failing due to gas issues?
- Are gas estimates unusually high or low?
- Are you getting "out of gas" errors?
- Are you concerned about transaction costs?`}

### 🔍 Gas Fundamentals on ${networkName}
${networkName === 'ethereum' ? `
**Ethereum Mainnet Gas**:
- **Unit**: Gwei (1 ETH = 1,000,000,000 Gwei)
- **Typical Range**: 20-200 Gwei (varies with congestion)
- **Transaction Cost**: Gas Used × Gas Price
- **EIP-1559**: Base fee + priority fee structure
` : networkName === 'polygon' ? `
**Polygon Gas**:
- **Unit**: MATIC
- **Typical Range**: 30-500 Gwei MATIC
- **Low Cost**: Usually $0.01-0.50 per transaction
- **Fast Confirmation**: 2-5 seconds typical
` : networkName === 'arbitrum' ? `
**Arbitrum Gas**:
- **Unit**: ETH (but much cheaper than mainnet)
- **Cost Reduction**: ~90% cheaper than Ethereum mainnet
- **L1 Component**: Some cost for L1 data posting
- **Dynamic Pricing**: Adjusts based on usage
` : `
**${networkName} Gas**:
- Check current gas prices for this network
- Understand native token requirements
- Monitor network congestion patterns
- Verify gas estimation accuracy
`}

## Step 2: Common Gas Issues

### ⛽ Gas Estimation Problems

#### Estimates Too Low
**Symptoms**: "Out of gas", "Gas limit exceeded"
**Causes**:
- Complex operations requiring more gas than estimated
- Network conditions changed between estimation and execution
- Smart contract state changes affecting gas usage
- Estimation tools using outdated or incorrect data

**Solutions**:
\`\`\`
# When preparing Hats transactions, use higher multipliers:
{
  "gasEstimateMultiplier": 1.5  // 50% buffer instead of default 20%
}

# For complex operations, consider even higher:
{
  "gasEstimateMultiplier": 2.0  // 100% buffer for safety
}
\`\`\`

#### Estimates Too High  
**Symptoms**: Extremely expensive transaction quotes
**Causes**:
- Network congestion causing price spikes
- Inefficient transaction construction
- Wrong network selected
- RPC endpoint issues

**Investigation**:
\`\`\`
# Check current network gas prices
# Compare with gas tracker websites
# Verify you're on the correct network
# Try different RPC endpoints
\`\`\`

### 💰 Cost-Related Issues

#### Transaction Too Expensive
**Symptoms**: Gas costs exceed budget or expectations

**Cost Analysis for Hats Operations on ${networkName}**:
- **Top Hat Creation**: ${getGasCostEstimate(networkName, 'tophat')}
- **Role Creation**: ${getGasCostEstimate(networkName, 'create')}
- **Role Assignment**: ${getGasCostEstimate(networkName, 'mint')}  
- **Role Transfer**: ${getGasCostEstimate(networkName, 'transfer')}
- **Role Removal**: ${getGasCostEstimate(networkName, 'burn')}

**Cost Optimization Strategies**:
1. **Timing**: Execute during low congestion periods
2. **Batching**: Combine multiple operations
3. **Network Choice**: Use L2 for lower costs
4. **Gas Price**: Use appropriate gas price settings

#### Insufficient Balance
**Symptoms**: "Insufficient funds for gas"
**Solutions**:
- Add more ${networkName === 'ethereum' ? 'ETH' : networkName === 'polygon' ? 'MATIC' : 'native tokens'} to wallet
- Check minimum balance requirements
- Consider transaction priority vs. cost

## Step 3: Network-Specific Gas Issues

### 🌐 ${networkName} Gas Characteristics
${networkName === 'ethereum' ? `
**Ethereum Mainnet Gas Issues**:
- **Extreme Volatility**: Prices can spike 10x during congestion
- **MEV Impact**: Complex operations may be front-run
- **Time Sensitivity**: Gas prices change rapidly
- **High Base Costs**: Even simple operations cost $5-50+

**Optimization Strategies**:
- Use gas trackers to time transactions
- Consider EIP-1559 priority fees
- Batch operations when possible
- Use flashbots for MEV protection
` : networkName === 'polygon' ? `
**Polygon Gas Considerations**:
- **MATIC Required**: Need MATIC for gas, not ETH
- **Price Stability**: More predictable than Ethereum
- **Occasional Spikes**: Can increase during high usage
- **Bridge Considerations**: Moving MATIC from Ethereum

**Common Issues**:
- Wrong token for gas (using ETH instead of MATIC)
- Underestimating during network stress
- RPC endpoint reliability issues
` : `
**${networkName} Gas Considerations**:
- Verify native token requirements
- Understand network fee structures
- Monitor for congestion patterns
- Check RPC endpoint reliability
`}

### 📊 Gas Monitoring Tools
For ${networkName}:
${getGasMonitoringTools(networkName)}

## Step 4: Hats-Specific Gas Patterns

### 🎭 Operation Gas Usage
Different Hats operations have predictable gas patterns:

#### Simple Operations (Lower Gas)
\`\`\`
mint-hat:        ~40,000-60,000 gas
burn-hat:        ~30,000-50,000 gas
check-hat-wearer: ~25,000-35,000 gas (view function)
\`\`\`

#### Complex Operations (Higher Gas)
\`\`\`
mint-top-hat:    ~60,000-100,000 gas
create-hat:      ~80,000-150,000 gas
transfer-hat:    ~50,000-100,000 gas
\`\`\`

#### Variable Factors
Gas usage increases with:
- Longer role descriptions/details
- Complex eligibility modules
- Toggle module interactions
- First-time contract interactions
- Cold storage access

### 🔧 Gas Optimization for Hats

#### Parameter Optimization
\`\`\`
// Reduce gas with shorter descriptions
"details": "Dev Team" // vs "Development Team - Frontend and Backend Engineers"

// Use IPFS for longer content
"details": "Dev Team",
"imageURI": "ipfs://QmHash" // vs data URLs
\`\`\`

#### Batch Operations
\`\`\`
// Instead of 5 separate mint transactions:
// Use multicall or batch operations to reduce overhead
\`\`\`

## Step 5: Troubleshooting Gas Failures

### 🚫 "Out of Gas" Errors

#### Immediate Solutions
1. **Increase Gas Limit**: Add 20-50% to estimate
2. **Check Balance**: Ensure sufficient funds
3. **Retry Later**: Network congestion may decrease
4. **Split Operations**: Break complex transactions into smaller parts

#### Investigation Process
\`\`\`
# 1. Check if transaction was actually executed
# 2. Review transaction receipt for actual gas used
# 3. Compare with estimate to understand shortfall
# 4. Identify if issue is systematic or one-off
\`\`\`

### ⚡ Transaction Stuck in Mempool

#### Symptoms
- Transaction pending for long time
- No confirmation after reasonable wait
- Gas price too low for current network conditions

#### Solutions
\`\`\`
# Option 1: Speed up transaction (increase gas price)
# Option 2: Cancel transaction (send 0 ETH to self with higher gas)
# Option 3: Wait for network conditions to improve
# Option 4: Replace with higher gas price version
\`\`\`

## Step 6: Gas Estimation Best Practices

### 🎯 Estimation Strategies

#### Conservative Approach
\`\`\`
# Always use safety margins
{
  "gasEstimateMultiplier": 1.5,  // 50% buffer
  "fromAddress": "[YOUR_ADDRESS]"  // Accurate estimation context
}
\`\`\`

#### Dynamic Adjustment
\`\`\`
// Adjust based on network conditions
if (networkCongested) {
  gasMultiplier = 2.0;
} else {
  gasMultiplier = 1.2;
}
\`\`\`

### 📊 Monitoring and Alerting
Set up monitoring for:
- Network gas price trends
- Your transaction success rates
- Cost per operation over time
- Failed transaction patterns

### 🔄 Adaptive Strategies
- **Peak Hours**: Higher gas prices but faster confirmation
- **Off Hours**: Lower costs but potentially slower confirmation
- **Emergency**: Willing to pay premium for immediate execution
- **Batch Processing**: Accumulate operations for efficiency

## Step 7: Advanced Gas Management

### 🔧 Custom Gas Strategies

#### Time-based Optimization
\`\`\`
// Schedule non-urgent transactions for low-gas periods
// Use gas price predictions to optimize timing
// Set up automated execution based on price thresholds
\`\`\`

#### Priority Management
\`\`\`
Critical Operations (High Gas):
- Emergency role assignments
- Security-related changes
- Time-sensitive organizational changes

Standard Operations (Medium Gas):
- Regular role assignments
- Routine organizational updates
- Planned structural changes

Batch Operations (Optimized Gas):
- Bulk role assignments
- Periodic maintenance
- Non-urgent updates
\`\`\`

### 📊 Cost Tracking
Maintain records of:
- Gas costs per operation type
- Network condition impacts
- Optimization effectiveness
- Budget vs. actual spending

## Step 8: Emergency Gas Procedures

### 🚨 High Priority Transactions
When immediate execution is critical:

1. **Premium Gas**: Use high gas price for fast confirmation
2. **MEV Protection**: Use flashbots or similar for sensitive operations
3. **Multiple Attempts**: Prepare backup transactions with increasing gas
4. **Monitoring**: Watch for confirmation and adjust if needed

### 🛡️ Gas Budget Management
- Set spending limits for different operation types
- Monitor cumulative costs over time
- Plan for network congestion scenarios
- Have emergency gas reserves

### 📋 Recovery Procedures
For stuck or failed transactions:
1. **Assess Situation**: Determine urgency and impact
2. **Choose Strategy**: Speed up, cancel, or wait
3. **Execute Fix**: Implement chosen solution
4. **Monitor Result**: Verify successful resolution
5. **Learn**: Document issue and prevention strategies

## Getting Help

### 📋 Gas Issue Support Information
When seeking help with gas issues:
- [ ] Network you're using (${networkName})
- [ ] Specific operation attempted
- [ ] Gas estimate received vs. actual usage
- [ ] Error messages encountered
- [ ] Current network conditions
- [ ] Transaction hash (if available)

### 🌐 Resources
- **Gas Trackers**: Real-time network fee monitoring
- **Community Discord**: Share experiences and get advice
- **Documentation**: Technical gas optimization guides
- **RPC Providers**: Alternative endpoints for better estimates

Would you like me to help you optimize gas usage for a specific Hats Protocol operation or troubleshoot a current gas issue?`;
}

function generateGeneralTroubleshootingContent(networkName: string, issue: string, _errorDetails: string, transactionHash: string): string {
  return `# General Hats Protocol Troubleshooting

I'll help you resolve the "${issue}" issue you're experiencing on ${networkName}.

## Issue Analysis

### 🔍 Problem Context
- **Issue Type**: ${issue}
- **Network**: ${networkName}
${errorDetails ? `- **Error Details**: ${errorDetails}` : ''}
${transactionHash ? `- **Transaction**: ${transactionHash}` : ''}

## Step 1: Initial Diagnosis

### 📊 System Health Check
Let's start with a comprehensive system check:

\`\`\`
# 1. Check your current roles and permissions
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# 2. Verify network connectivity and supported networks
Use tool: list-networks
Parameters: {}
\`\`\`

${transactionHash ? `### Transaction Investigation
Let's analyze the transaction: ${transactionHash}

**Investigation Steps**:
1. Check transaction status on block explorer
2. Review transaction receipt for errors
3. Examine event logs for clues
4. Compare gas used vs. gas limit` : ''}

## Step 2: Common Issue Categories

### 🚫 Transaction-Related Issues
**Symptoms**: Failed transactions, stuck transactions, gas problems
**Common Causes**:
- Insufficient permissions
- Gas estimation issues
- Network congestion
- Invalid parameters
- Wrong network selected

### 🎭 Role-Related Issues  
**Symptoms**: Roles not working, assignments failing, permissions missing
**Common Causes**:
- Eligibility requirements not met
- Toggle modules deactivating roles
- Admin permissions missing
- Role supply limits reached
- Module configuration issues

### 🔗 Integration Issues
**Symptoms**: External systems not recognizing roles
**Common Causes**:
- Blockchain synchronization delays
- Wrong network configuration
- Authentication middleware issues
- Caching problems in applications
- API connectivity issues

### 🌐 Network-Related Issues
**Symptoms**: Slow responses, connection failures, high costs
**Common Causes**:
- RPC endpoint problems
- Network congestion
- Wrong network selection
- Insufficient native token balance
- Firewall or connectivity issues

## Step 3: Systematic Troubleshooting

### 🔍 Environment Verification
\`\`\`
# Verify you're on the correct network
Current Network: ${networkName}

# Check if Hats Protocol is available on this network
Use tool: list-networks
Parameters: {
  "includeTestnets": true
}
\`\`\`

### 📋 Permission Verification
\`\`\`
# Check your role assignments
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": true
}

# If working with specific roles, check details
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[RELEVANT_HAT_ID]"
}
\`\`\`

### 🏢 Organizational Context
\`\`\`
# Check organizational structure if applicable
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ORGANIZATION_TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 5
}
\`\`\`

## Step 4: Issue-Specific Troubleshooting

### Based on "${issue}" pattern:

${getIssueSpecificGuidance(issue, errorDetails)}

## Step 5: Common Solutions

### 🔄 Quick Fixes
1. **Refresh Connection**: Disconnect and reconnect wallet
2. **Clear Cache**: Clear browser cache and application data
3. **Switch Networks**: Try switching away and back to ${networkName}
4. **Restart Application**: Close and reopen wallet/application
5. **Update Software**: Ensure wallet and applications are current

### 🔧 Parameter Verification
Common parameter issues:
- **Address Format**: Ensure addresses are valid 42-character hex
- **Hat ID Format**: Use proper 256-bit hex format
- **Network Name**: Use lowercase network names
- **Case Sensitivity**: Check for case-sensitive parameters

### 📊 Data Synchronization
If dealing with stale data:
- Wait for blockchain synchronization
- Try different RPC endpoints
- Clear cached data in applications
- Check subgraph synchronization status

## Step 6: Advanced Troubleshooting

### 🔬 Technical Deep Dive
For persistent issues:

#### Contract Interaction Analysis
- Verify contract addresses are correct
- Check for contract upgrades or changes
- Examine function call parameters
- Review event emissions

#### Network Layer Issues
- Test with different RPC providers
- Check network latency and stability
- Verify firewall and proxy settings
- Test from different devices/locations

#### Integration Layer Problems
- Review application configuration
- Check API key validity
- Verify authentication flows
- Test with minimal examples

### 🛠️ Developer Tools
For technical users:
- Use browser developer tools
- Enable verbose logging
- Set up local testing environment
- Use blockchain debugging tools

## Step 7: Prevention Strategies

### 🛡️ Proactive Monitoring
Set up monitoring for:
- Transaction success rates
- Role assignment changes
- Network connectivity
- Application performance
- Gas price fluctuations

### 📋 Best Practices
- **Test First**: Try operations on testnets
- **Document Everything**: Keep records of configurations
- **Regular Updates**: Keep software current
- **Backup Plans**: Have alternative procedures
- **Monitor Health**: Regular system checks

### 🔔 Alert Systems
Consider alerts for:
- Failed transactions
- Permission changes
- Network issues
- Application errors
- Unusual activity patterns

## Step 8: Getting Additional Help

### 📋 Information to Gather
Before seeking support:
- [ ] Clear description of the issue
- [ ] Steps to reproduce the problem  
- [ ] Error messages (complete text)
- [ ] Transaction hashes (if applicable)
- [ ] Network and wallet information
- [ ] Recent changes or updates
- [ ] Screenshots or logs (if helpful)

### 🌐 Community Resources

#### Hats Protocol Community
- **Discord Server**: Real-time community support
- **GitHub Issues**: Bug reports and technical questions
- **Documentation**: Official guides and references
- **Developer Forums**: Technical discussions

#### General Web3 Support
- **Network Communities**: Ethereum, Polygon, etc. Discord servers
- **Wallet Support**: MetaMask, WalletConnect support channels
- **Developer Resources**: Stack Overflow, developer forums

### 📞 Escalation Path
1. **Community Support**: Start with Discord or forums
2. **Documentation Review**: Check official docs
3. **Issue Reporting**: Create GitHub issues for bugs
4. **Direct Contact**: Reach out to Hats Protocol team for critical issues

## Specific Next Steps

Based on your "${issue}" issue:

### 🎯 Immediate Actions
1. **Gather Information**: Complete the diagnostic commands above
2. **Document Findings**: Record what you discover
3. **Try Quick Fixes**: Attempt the common solutions
4. **Test Systematically**: Work through troubleshooting steps

### 📊 Success Metrics
You'll know the issue is resolved when:
- Error messages no longer appear
- Intended functionality works correctly
- System performance returns to normal
- All verification checks pass

### 🔄 Follow-up Tasks
After resolving:
- Document the solution for future reference
- Update procedures to prevent recurrence
- Share learnings with team/community
- Monitor for similar issues

## Issue-Specific Resources

${getIssueResources(issue, networkName)}

Would you like me to help you work through the diagnostic steps or focus on any specific aspect of troubleshooting your "${issue}" problem?`;
}

// Helper functions for error analysis and guidance
function analyzeErrorMessage(errorDetails: string): string {
  const lowerError = errorDetails.toLowerCase();
  
  if (lowerError.includes('unauthorized') || lowerError.includes('not authorized')) {
    return `**Permission Issue**: This error indicates you don't have the required admin permissions for this operation. Check your role assignments and ensure you have admin rights for the role you're trying to manage.`;
  }
  
  if (lowerError.includes('out of gas') || lowerError.includes('gas')) {
    return `**Gas Issue**: This error relates to transaction gas. Either the gas limit was too low, or you don't have sufficient balance for gas fees. Try increasing the gas limit or adding funds to your wallet.`;
  }
  
  if (lowerError.includes('not eligible') || lowerError.includes('eligibility')) {
    return `**Eligibility Issue**: This error means the target address doesn't meet the eligibility requirements for this role. Check the role's eligibility module requirements.`;
  }
  
  if (lowerError.includes('max supply') || lowerError.includes('supply exceeded')) {
    return `**Supply Issue**: This error indicates the role has reached its maximum capacity. You need to either increase the maxSupply (if the role is mutable) or wait for someone to leave the role.`;
  }
  
  return `**General Error**: This error needs further investigation. Please check the transaction details and provide more context about what operation you were attempting.`;
}

function analyzeRoleError(errorDetails: string): string {
  const lowerError = errorDetails.toLowerCase();
  
  if (lowerError.includes('not working') || lowerError.includes('inactive')) {
    return `**Role Status Issue**: The role may be inactive due to eligibility requirements no longer being met, or a toggle module may have deactivated it.`;
  }
  
  if (lowerError.includes('permission') || lowerError.includes('access')) {
    return `**Permission Issue**: The role exists but may not be connected properly to external systems, or the integration isn't recognizing the role assignment.`;
  }
  
  return `**Role Functionality Issue**: This requires investigation into the role's current status, eligibility modules, toggle modules, and integration with external systems.`;
}

function analyzePermissionError(errorDetails: string): string {
  const lowerError = errorDetails.toLowerCase();
  
  if (lowerError.includes('admin') || lowerError.includes('unauthorized')) {
    return `**Admin Permission Issue**: You likely need admin-level permissions for this operation. Check if you hold the appropriate admin role in the organization hierarchy.`;
  }
  
  if (lowerError.includes('not eligible')) {
    return `**Eligibility Permission Issue**: This relates to eligibility module requirements. The target address may not meet the criteria set by the role's eligibility module.`;
  }
  
  return `**General Permission Issue**: This error suggests a permissions problem that needs systematic diagnosis of your role assignments and the required permissions for your intended operation.`;
}

function analyzeGasError(errorDetails: string): string {
  const lowerError = errorDetails.toLowerCase();
  
  if (lowerError.includes('out of gas')) {
    return `**Gas Limit Issue**: The transaction ran out of gas before completion. Increase the gas limit by 20-50% and retry.`;
  }
  
  if (lowerError.includes('insufficient funds')) {
    return `**Balance Issue**: Your wallet doesn't have enough native tokens to pay for gas fees. Add more funds to continue.`;
  }
  
  if (lowerError.includes('gas price') || lowerError.includes('too low')) {
    return `**Gas Price Issue**: Your gas price may be too low for current network conditions. Increase the gas price or wait for lower congestion.`;
  }
  
  return `**Gas-related Issue**: This error is related to gas estimation or pricing. Check your wallet balance, gas settings, and current network conditions.`;
}

function getGasCostEstimate(networkName: string, operationType: string): string {
  const costs = {
    ethereum: {
      tophat: '~$10-100',
      create: '~$15-150', 
      mint: '~$5-50',
      transfer: '~$8-80',
      burn: '~$4-40'
    },
    polygon: {
      tophat: '~$0.02-0.20',
      create: '~$0.03-0.30',
      mint: '~$0.01-0.10', 
      transfer: '~$0.02-0.15',
      burn: '~$0.01-0.08'
    },
    default: {
      tophat: '~Gas varies by network',
      create: '~Gas varies by network',
      mint: '~Gas varies by network',
      transfer: '~Gas varies by network', 
      burn: '~Gas varies by network'
    }
  };
  
  const networkCosts = costs[networkName as keyof typeof costs] || costs.default;
  return networkCosts[operationType as keyof typeof networkCosts];
}

function getGasMonitoringTools(networkName: string): string {
  switch (networkName) {
    case 'ethereum':
      return `- **ETH Gas Station**: https://ethgasstation.info/
- **Gas Tracker**: https://etherscan.io/gastracker  
- **Gas Now**: https://www.gasnow.org/`;
    case 'polygon':
      return `- **Polygon Gas Station**: https://gasstation-mainnet.matic.network/
- **PolygonScan Gas Tracker**: https://polygonscan.com/gastracker`;
    default:
      return `- Check network-specific gas tracking tools
- Monitor RPC provider dashboards
- Use wallet built-in gas estimation`;
  }
}

function getIssueSpecificGuidance(issue: string, errorDetails: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('connect') || lowerIssue.includes('network')) {
    return `**Network Connection Issues**:
1. Verify correct network selection in wallet
2. Try different RPC endpoints
3. Check internet connectivity
4. Clear wallet cache and reconnect`;
  }
  
  if (lowerIssue.includes('slow') || lowerIssue.includes('performance')) {
    return `**Performance Issues**:
1. Check network congestion levels
2. Try during off-peak hours
3. Use alternative RPC providers
4. Consider Layer 2 networks for better performance`;
  }
  
  if (lowerIssue.includes('sync') || lowerIssue.includes('data')) {
    return `**Data Synchronization Issues**:
1. Wait for blockchain synchronization
2. Check subgraph indexing status
3. Try refreshing application data
4. Use different data providers`;
  }
  
  return `**General Issue Guidance**:
Based on "${issue}", focus on:
1. Parameter validation
2. Permission verification  
3. Network connectivity
4. Application configuration`;
}

function getIssueResources(issue: string, networkName: string): string {
  return `### Relevant Resources for "${issue}":
- **Network Status**: Check ${networkName} network health dashboards
- **Documentation**: Review Hats Protocol docs for this operation type
- **Community**: Search Discord for similar issues
- **Block Explorer**: Use network explorer for transaction investigation
- **RPC Status**: Check your RPC provider's status page`;
}