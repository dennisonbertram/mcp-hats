/**
 * Role Management Prompt
 * Guides users through assigning, transferring, and managing organizational roles
 */

import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export async function roleManagementPrompt(args?: Record<string, unknown>): Promise<GetPromptResult> {
  const networkName = args?.networkName as string || '[NETWORK_NAME]';
  const operation = args?.operation as string || '[OPERATION]';
  const targetAddress = args?.targetAddress as string || '[TARGET_ADDRESS]';
  const hatId = args?.hatId as string || '[HAT_ID]';
  const treeId = args?.treeId as string || '[TREE_ID]';

  const messages: PromptMessage[] = [];

  // User request message
  messages.push({
    role: 'user',
    content: {
      type: 'text',
      text: `I need help with role management in Hats Protocol. Operation: ${operation}, Network: ${networkName}${targetAddress !== '[TARGET_ADDRESS]' ? `, Target Address: ${targetAddress}` : ''}${hatId !== '[HAT_ID]' ? `, Hat ID: ${hatId}` : ''}${treeId !== '[TREE_ID]' ? `, Tree ID: ${treeId}` : ''}`
    }
  });

  // Generate response based on operation type
  let responseContent = '';

  switch (operation.toLowerCase()) {
    case 'assign':
      responseContent = generateAssignRoleContent(networkName, targetAddress, hatId, treeId);
      break;
    case 'transfer':
      responseContent = generateTransferRoleContent(networkName, targetAddress, hatId);
      break;
    case 'remove':
      responseContent = generateRemoveRoleContent(networkName, targetAddress, hatId);
      break;
    case 'modify':
      responseContent = generateModifyRoleContent(networkName, hatId);
      break;
    default:
      responseContent = generateGeneralRoleManagementContent(networkName, targetAddress, hatId, treeId);
  }

  messages.push({
    role: 'assistant',
    content: {
      type: 'text',
      text: responseContent
    }
  });

  return {
    description: `Role management guidance for ${operation} operation on ${networkName}`,
    messages
  };
}

function generateAssignRoleContent(networkName: string, targetAddress: string, hatId: string, treeId: string): string {
  return `# Assigning Roles in Hats Protocol

I'll help you assign a role to ${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : 'the target address'} on ${networkName}.

## Step 1: Identify Available Roles

${hatId !== '[HAT_ID]' 
  ? `Since you provided hat ID ${hatId}, let's verify this role first:

\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId}"
}
\`\`\`

This will show us:
- Role name and description
- Current supply vs max supply
- Admin permissions required
- Eligibility requirements` 
  : `First, let's find available roles in your organization:

${treeId !== '[TREE_ID]' 
  ? `\`\`\`
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "${treeId}",
  "format": "json",
  "maxDepth": 10
}
\`\`\`

This will show all roles in tree ${treeId} with their current assignments.`
  : `\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADMIN_ADDRESS]",
  "includeInactive": false
}
\`\`\`

This shows roles you can manage based on your current permissions.`}`}

## Step 2: Check Eligibility and Permissions

${targetAddress !== '[TARGET_ADDRESS]' 
  ? `Let's verify the target address eligibility:

\`\`\`
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "${targetAddress}"
}
\`\`\`

This tells us if ${targetAddress} is already wearing this hat.`
  : 'Make sure you have the target address ready for the assignment.'}

## Step 3: Execute the Assignment

Once we've confirmed the role and eligibility:

\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[TARGET_ADDRESS]'}"
}
\`\`\`

## Step 4: Verify Assignment

After the transaction is complete, verify the assignment:

\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[TARGET_ADDRESS]'}",
  "includeInactive": false
}
\`\`\`

## Assignment Checklist

- [ ] Role is available (not at max supply)
- [ ] Target address meets eligibility requirements
- [ ] You have admin permissions for this role
- [ ] Target address is not already wearing this hat
- [ ] Gas fees are available for the transaction
- [ ] Assignment follows organizational policies

## Common Issues and Solutions

### 🚫 "Not eligible" Error
- Check eligibility module requirements
- Verify the target address meets criteria
- Ensure any prerequisite roles are held

### 🚫 "Max supply reached" Error  
- Role is at capacity
- Need to increase maxSupply (requires admin)
- Or reassign from inactive wearer

### 🚫 "Not authorized" Error
- You don't have admin permissions
- Request assignment from appropriate admin
- Check your own role permissions

### ⚠️ Gas Estimation Issues
- Network congestion - try later
- Insufficient funds in wallet
- Consider batching multiple operations

Would you like me to help you with the next step or address any specific issues?`;
}

function generateTransferRoleContent(networkName: string, targetAddress: string, hatId: string): string {
  return `# Transferring Roles in Hats Protocol

I'll help you transfer a role ${hatId !== '[HAT_ID]' ? `(${hatId})` : ''} on ${networkName}.

## Step 1: Verify Current Role Assignment

First, let's confirm the current state of the role:

\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}"
}
\`\`\`

## Step 2: Identify Current and New Wearers

${targetAddress !== '[TARGET_ADDRESS]' 
  ? `New wearer: ${targetAddress}

We need to identify the current wearer. If you know their address, great! If not, the hat details above will show current wearers.`
  : 'We need both the current wearer address and the new wearer address.'}

## Step 3: Execute the Transfer

\`\`\`
Use tool: prepare-transfer-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "from": "[CURRENT_WEARER_ADDRESS]",
  "to": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[NEW_WEARER_ADDRESS]'}"
}
\`\`\`

## Transfer Authorization Methods

### Option 1: Admin-Initiated Transfer
- Requires admin privileges for the role
- Can transfer without current wearer consent
- Most common for organizational changes

### Option 2: Self-Transfer (if enabled)
- Current wearer initiates the transfer
- Requires role to allow self-transfers
- Used for voluntary role transitions

### Option 3: Burn and Mint
If direct transfer isn't possible:

1. **Burn current assignment**:
\`\`\`
Use tool: prepare-burn-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "[CURRENT_WEARER_ADDRESS]"
}
\`\`\`

2. **Mint to new wearer**:
\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[NEW_WEARER_ADDRESS]'}"
}
\`\`\`

## Step 4: Verify Transfer

Confirm the transfer was successful:

\`\`\`
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[NEW_WEARER_ADDRESS]'}"
}
\`\`\`

## Transfer Best Practices

### 🔄 Smooth Transitions
- **Communication**: Notify both parties in advance
- **Documentation**: Record the reason for transfer
- **Timing**: Consider operational impact
- **Access**: Update any external systems/permissions

### 🔐 Security Considerations  
- **Verification**: Confirm new wearer's identity
- **Eligibility**: Ensure new wearer meets requirements
- **Backup**: Have rollback plan if needed
- **Monitoring**: Watch for any issues post-transfer

### 📋 Organizational Process
- **Approval**: Follow internal approval processes
- **Training**: Ensure new wearer understands role
- **Handover**: Facilitate knowledge transfer
- **Systems**: Update org charts and documentation

## Common Transfer Scenarios

### Leadership Changes
- CEO transitions, board member changes
- Often requires top-hat admin approval

### Team Restructuring
- Role reassignments within departments
- Department head approval typically sufficient

### Emergency Situations
- Immediate role removal needed
- May use burn then mint approach

### Voluntary Transitions
- Employee role changes, promotions
- Usually straightforward mint process

Would you like help with any specific aspect of this transfer?`;
}

function generateRemoveRoleContent(networkName: string, targetAddress: string, hatId: string): string {
  return `# Removing Roles in Hats Protocol

I'll help you remove a role ${hatId !== '[HAT_ID]' ? `(${hatId})` : ''} from ${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : 'the target address'} on ${networkName}.

## Step 1: Verify Current Assignment

Let's confirm the current role assignment:

${targetAddress !== '[TARGET_ADDRESS]' 
  ? `\`\`\`
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "${targetAddress}"
}
\`\`\`

This confirms ${targetAddress} is currently wearing the role.`
  : `\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}"
}
\`\`\`

This shows all current wearers of the role.`}

## Step 2: Execute Role Removal

\`\`\`
Use tool: prepare-burn-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}",
  "wearer": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[TARGET_ADDRESS]'}"
}
\`\`\`

## Step 3: Verify Removal

Confirm the role was successfully removed:

\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "${targetAddress !== '[TARGET_ADDRESS]' ? targetAddress : '[TARGET_ADDRESS]'}",
  "includeInactive": true
}
\`\`\`

The role should now appear as inactive/burned in the results.

## Role Removal Scenarios

### 🚪 Employee Departure
- **Immediate**: Remove access for departing team members
- **Planned**: Part of offboarding process
- **Security**: Prevent unauthorized access

### 📋 Organizational Restructuring
- **Role Elimination**: Position no longer needed
- **Consolidation**: Combining multiple roles
- **Reallocation**: Moving responsibilities elsewhere

### ⚠️ Policy Violations
- **Performance**: Role removal due to poor performance
- **Misconduct**: Immediate removal for violations
- **Compliance**: Regulatory requirement changes

### 🔄 Temporary Removal
- **Leave of Absence**: Temporary role suspension
- **Investigation**: Pending resolution of issues
- **System Maintenance**: Technical role updates

## Important Considerations

### 🔐 Security Impact
- **Immediate Effect**: Role removal is instantaneous
- **Access Systems**: Update external systems accordingly
- **Backup Plans**: Ensure role coverage if critical
- **Audit Trail**: Document removal reasons

### 📊 Organizational Impact
- **Workflow**: Identify processes that depend on this role
- **Communication**: Notify affected team members
- **Responsibilities**: Reassign or redistribute duties
- **Timeline**: Plan removal timing carefully

### ⚖️ Legal/Policy Compliance
- **HR Policies**: Follow internal procedures
- **Legal Requirements**: Ensure compliance with regulations
- **Documentation**: Maintain proper records
- **Appeal Process**: Provide recourse if applicable

## Post-Removal Actions

### 1. Communication
- Notify relevant stakeholders
- Update organizational charts
- Communicate role status changes

### 2. System Updates
- Remove access from external systems
- Update permissions and credentials
- Disable related accounts/services

### 3. Process Continuity
- Reassign critical responsibilities
- Update workflow documentation
- Train replacement or covering staff

### 4. Monitoring
- Watch for any system issues
- Monitor for unauthorized access attempts
- Ensure business continuity

## Emergency Removal Protocol

For urgent situations:

1. **Immediate Burn**: Execute role removal immediately
2. **Security Check**: Verify all access is revoked
3. **Communication**: Notify security team and stakeholders
4. **Follow-up**: Complete formal documentation
5. **Review**: Assess incident and improve processes

Would you like help with planning the post-removal process or addressing any specific concerns?`;
}

function generateModifyRoleContent(networkName: string, hatId: string): string {
  return `# Modifying Roles in Hats Protocol

I'll help you modify role ${hatId !== '[HAT_ID]' ? hatId : 'properties'} on ${networkName}.

## Current Role Analysis

First, let's examine the current role configuration:

\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId !== '[HAT_ID]' ? hatId : '[ROLE_HAT_ID]'}"
}
\`\`\`

This shows:
- Current role name/description
- Maximum supply settings
- Eligibility modules
- Toggle modules
- Mutability status
- Current wearers

## Role Modification Options

### 📝 Metadata Changes (If Mutable)
- **Role Name**: Update title/description
- **Image URI**: Change role icon/logo
- **Details**: Modify role description

### 👥 Supply Management
- **Increase Max Supply**: Allow more wearers
- **Decrease Max Supply**: Reduce capacity (if current < new max)

### 🔧 Module Updates (If Mutable)
- **Eligibility Module**: Change who can wear the hat
- **Toggle Module**: Modify activation/deactivation logic

## Modification Procedures

### 🔄 Creating Updated Role
Since Hats Protocol roles are immutable by default, modification often requires creating a new version:

\`\`\`
Use tool: prepare-create-hat
Parameters:
{
  "networkName": "${networkName}",
  "admin": "[ADMIN_HAT_ID]",
  "details": "Updated Role Name and Description",
  "maxSupply": "[NEW_MAX_SUPPLY]",
  "eligibility": "[NEW_ELIGIBILITY_MODULE]",
  "toggle": "[NEW_TOGGLE_MODULE]",
  "mutable": true,
  "imageURI": "[NEW_IMAGE_URI]"
}
\`\`\`

### 🔄 Migration Process
1. **Create New Role**: With updated parameters
2. **Transfer Wearers**: Move from old to new role
3. **Update Systems**: Point to new role ID
4. **Deprecate Old Role**: Burn old assignments

### 🔄 If Role is Mutable
Direct updates may be possible (check role details for mutability):
- Use admin privileges to update metadata
- Modify supply through admin functions
- Update modules if allowed

## Common Modification Scenarios

### 📈 Team Growth
**Issue**: Need more team members than max supply allows

**Solution**:
\`\`\`
1. Create expanded role:
{
  "maxSupply": "[HIGHER_NUMBER]"
  // other parameters same
}

2. Migrate existing wearers
3. Deprecate original role
\`\`\`

### 🎯 Role Refinement
**Issue**: Role description needs updating

**Solution**:
\`\`\`
{
  "details": "Refined Role Description with Better Clarity",
  // keep other parameters
}
\`\`\`

### 🔐 Permission Updates
**Issue**: Different eligibility requirements needed

**Solution**:
\`\`\`
{
  "eligibility": "[NEW_ELIGIBILITY_MODULE_ADDRESS]",
  // maintain other parameters
}
\`\`\`

### 🔧 System Integration Changes
**Issue**: Need different toggle behavior

**Solution**:
\`\`\`
{
  "toggle": "[NEW_TOGGLE_MODULE_ADDRESS]",
  // preserve other settings
}
\`\`\`

## Step-by-Step Migration

### Phase 1: Preparation
1. **Analyze Current State**: Document all current wearers
2. **Plan Changes**: Define exactly what needs modification
3. **Create New Role**: Deploy with updated parameters
4. **Test New Role**: Verify it works as expected

### Phase 2: Migration
1. **Notify Stakeholders**: Communicate change timeline
2. **Begin Transfers**: Move wearers to new role
3. **Update Documentation**: Change org charts/systems
4. **Monitor Progress**: Ensure smooth transition

### Phase 3: Cleanup
1. **Verify All Transfers**: Confirm complete migration
2. **Burn Old Roles**: Remove old assignments
3. **Update References**: Change all system pointers
4. **Document Changes**: Record modification history

## Modification Checklist

### Pre-Modification
- [ ] Role modification is actually necessary
- [ ] Current role properties are documented
- [ ] New requirements are clearly defined
- [ ] Stakeholders are informed
- [ ] Migration plan is prepared

### During Modification
- [ ] New role is created with correct parameters
- [ ] Testing confirms new role works properly
- [ ] Wearers are migrated systematically
- [ ] External systems are updated
- [ ] Progress is monitored and documented

### Post-Modification
- [ ] All wearers successfully migrated
- [ ] Old role assignments are cleaned up
- [ ] Systems point to correct role IDs
- [ ] Changes are documented
- [ ] Process lessons are captured

## Risk Mitigation

### 🛡️ Backup Strategy
- **Role Snapshot**: Document all current assignments
- **Rollback Plan**: Prepare to revert if needed
- **Test Environment**: Test changes before production
- **Gradual Migration**: Move wearers in batches

### ⚠️ Common Pitfalls
- **Losing Permissions**: Ensure new role has same authority
- **Breaking Systems**: Update all integrations
- **Communication Gaps**: Keep stakeholders informed
- **Rush Migration**: Allow adequate time for testing

Would you like help with any specific aspect of role modification or migration planning?`;
}

function generateGeneralRoleManagementContent(networkName: string, targetAddress: string, hatId: string, treeId: string): string {
  return `# General Role Management in Hats Protocol

I'll help you with role management operations on ${networkName}. Here's a comprehensive overview of available operations:

## Available Role Operations

### 👤 Role Assignment
**Assign roles to team members**
- Mint hats to specific addresses
- Verify eligibility requirements
- Check supply limits
- Confirm admin permissions

### 🔄 Role Transfers  
**Move roles between addresses**
- Transfer existing assignments
- Burn and re-mint if needed
- Maintain organizational continuity
- Update external systems

### 🗑️ Role Removal
**Remove roles from addresses**
- Burn hat assignments
- Revoke permissions immediately
- Handle departures/violations
- Maintain security

### ⚙️ Role Modification
**Update role properties**
- Create new versions with changes
- Migrate existing wearers
- Update metadata/parameters
- Maintain backward compatibility

## Current Context Analysis

Let me help you understand your current context:

${targetAddress !== '[TARGET_ADDRESS]' ? `
### Target Address: ${targetAddress}

\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "${targetAddress}",
  "includeInactive": false
}
\`\`\`

This shows all active roles currently held by this address.
` : ''}

${hatId !== '[HAT_ID]' ? `
### Specific Hat: ${hatId}

\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${hatId}"
}
\`\`\`

This provides complete information about this specific role.
` : ''}

${treeId !== '[TREE_ID]' ? `
### Organization Tree: ${treeId}

\`\`\`
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "${treeId}",
  "format": "ascii-tree",
  "maxDepth": 10
}
\`\`\`

This shows the complete organizational hierarchy.
` : ''}

## Role Management Workflow

### 1. Discovery Phase
**Understand Current State**
- Query existing roles and assignments
- Identify organizational structure  
- Map permissions and hierarchies
- Document current wearers

### 2. Planning Phase
**Define Required Changes**
- Specify target addresses and roles
- Check eligibility requirements
- Verify admin permissions
- Plan execution sequence

### 3. Execution Phase
**Perform Role Operations**
- Prepare blockchain transactions
- Execute changes systematically
- Monitor for errors/issues
- Verify successful completion

### 4. Validation Phase
**Confirm Changes**
- Query updated states
- Test new permissions
- Update documentation
- Notify stakeholders

## Best Practices

### 🎯 Strategic Planning
- **Clear Objectives**: Define specific goals for role changes
- **Impact Assessment**: Consider effects on operations
- **Stakeholder Buy-in**: Get approval from relevant parties
- **Timeline Planning**: Allow adequate time for changes

### 🔐 Security First
- **Permission Verification**: Ensure you have required admin rights
- **Address Validation**: Confirm target addresses are correct
- **Backup Plans**: Prepare rollback procedures
- **Audit Trail**: Document all changes made

### 📊 Process Management
- **Systematic Approach**: Handle changes in logical order
- **Batch Operations**: Group related changes efficiently
- **Progress Monitoring**: Track completion status
- **Error Handling**: Plan for transaction failures

### 💬 Communication
- **Stakeholder Updates**: Keep affected parties informed
- **Change Documentation**: Record all modifications
- **Training Materials**: Update role documentation
- **Feedback Collection**: Gather input on process

## Common Role Management Patterns

### 🏢 Organizational Onboarding
1. **New Employee**: Assign appropriate roles based on position
2. **Contractor**: Temporary role assignment with clear end date
3. **Advisory**: Special roles with limited scope and duration

### 🔄 Organizational Changes
1. **Promotion**: Transfer to higher-level role, remove old role
2. **Lateral Move**: Transfer between equivalent roles
3. **Restructuring**: Bulk role changes across teams

### 📋 Compliance Management
1. **Regular Audit**: Periodic review of all role assignments
2. **Access Review**: Verify all roles are still needed
3. **Policy Updates**: Modify roles to meet new requirements

### 🚨 Emergency Procedures
1. **Immediate Removal**: Quick role revocation for security
2. **Incident Response**: Temporary role modifications during crisis
3. **Recovery Operations**: Restore roles after system issues

## Troubleshooting Guide

### ❌ Transaction Failures
- **Insufficient Permissions**: Verify admin rights
- **Invalid Parameters**: Check addresses and IDs
- **Network Issues**: Try again or switch RPC
- **Gas Problems**: Increase gas limit or price

### ⚠️ Eligibility Issues  
- **Module Requirements**: Check eligibility module logic
- **Prerequisite Roles**: Ensure required roles are held
- **Address Verification**: Confirm address format
- **Custom Logic**: Review any custom eligibility rules

### 🔍 Query Problems
- **Network Sync**: Wait for blockchain synchronization
- **Subgraph Delay**: Allow time for indexing
- **Invalid IDs**: Verify hat/tree ID format
- **Rate Limits**: Reduce query frequency

What specific role management operation would you like help with?`;
}