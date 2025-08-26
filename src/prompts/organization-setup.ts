/**
 * Organization Setup Prompt
 * Guides users through creating a complete organizational structure with Hats Protocol
 */

import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export async function organizationSetupPrompt(args?: Record<string, unknown>): Promise<GetPromptResult> {
  const networkName = args?.networkName as string || '[NETWORK_NAME]';
  const organizationName = args?.organizationName as string || '[ORGANIZATION_NAME]';
  const founderAddress = args?.founderAddress as string || '[FOUNDER_ADDRESS]';
  const initialRoles = args?.initialRoles as string || '[]';

  let parsedRoles: any[] = [];
  try {
    parsedRoles = initialRoles ? JSON.parse(initialRoles) : [];
  } catch {
    parsedRoles = [];
  }

  const messages: PromptMessage[] = [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `I need to set up a new organizational structure using Hats Protocol for "${organizationName}" on ${networkName}. The founder address is ${founderAddress}. ${parsedRoles.length > 0 ? `I want to create these initial roles: ${JSON.stringify(parsedRoles, null, 2)}` : 'I need help planning the initial role structure.'}`
      }
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll help you set up "${organizationName}" on ${networkName} using Hats Protocol. Here's a comprehensive plan:

## Step 1: Create the Top Hat (Organization Root)

First, we'll create the top hat that represents your organization:

\`\`\`
Use tool: prepare-mint-top-hat
Parameters:
{
  "networkName": "${networkName}",
  "target": "${founderAddress}",
  "details": "${organizationName} - Organizational Root",
  "imageURI": "https://your-domain.com/logo.png"
}
\`\`\`

## Step 2: Plan Your Organizational Structure

${parsedRoles.length > 0 ? 
  `Based on your initial roles, here's the suggested hierarchy:
${parsedRoles.map((role, index) => `
### ${role.name || `Role ${index + 1}`}
- **Max Supply**: ${role.maxSupply || 1}
- **Description**: ${role.description || 'Role description needed'}
- **Level**: ${role.level || 'To be determined based on hierarchy'}
`).join('\n')}
` :
  `Let's design your organizational structure. Consider these common patterns:

### Executive Level (Direct children of Top Hat)
- **CEO/President** - Single leader (maxSupply: 1)
- **Board Members** - Multiple seats (maxSupply: 3-9)
- **Co-founders** - Original team (maxSupply: 2-5)

### Department Heads (Children of Executive roles)
- **CTO** - Technology leadership
- **CFO** - Financial oversight  
- **Head of Operations** - Operational management
- **Head of Marketing** - Growth and marketing

### Team Roles (Children of Department Heads)
- **Senior Developers** - Technical implementation
- **Junior Developers** - Development support
- **Marketing Specialists** - Campaign execution
- **Administrative Staff** - Operational support`}

## Step 3: Create the Role Hierarchy

Based on the structure above, we'll create hats in order from top to bottom:

### 3.1 Executive Level Roles
\`\`\`
Use tool: prepare-create-hat
Parameters for each executive role:
{
  "networkName": "${networkName}",
  "admin": "[TOP_HAT_ID_FROM_STEP_1]",
  "details": "Role Name and Description",
  "maxSupply": 1,
  "eligibility": "0x0000000000000000000000000000000000000000",
  "toggle": "0x0000000000000000000000000000000000000000",
  "mutable": true,
  "imageURI": "https://your-domain.com/role-icon.png"
}
\`\`\`

### 3.2 Department Head Roles
For each department head role, use the appropriate executive hat as admin:
\`\`\`
Use tool: prepare-create-hat
Parameters:
{
  "networkName": "${networkName}",
  "admin": "[EXECUTIVE_HAT_ID]",
  "details": "Department Head Title and Responsibilities",
  "maxSupply": 1,
  "eligibility": "0x0000000000000000000000000000000000000000",
  "toggle": "0x0000000000000000000000000000000000000000",
  "mutable": true
}
\`\`\`

### 3.3 Team Member Roles
Create team roles under appropriate department heads:
\`\`\`
Use tool: prepare-create-hat
Parameters:
{
  "networkName": "${networkName}",
  "admin": "[DEPARTMENT_HEAD_HAT_ID]",
  "details": "Team Role Description and Requirements",
  "maxSupply": 5, // Adjust based on team size
  "eligibility": "0x0000000000000000000000000000000000000000",
  "toggle": "0x0000000000000000000000000000000000000000",
  "mutable": true
}
\`\`\`

## Step 4: Assign Initial Team Members

Once roles are created, assign them to team members:

\`\`\`
Use tool: prepare-mint-hat
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_HAT_ID]",
  "wearer": "[TEAM_MEMBER_ADDRESS]"
}
\`\`\`

## Step 5: Verify Structure

Check the organizational structure:

\`\`\`
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[TOP_HAT_TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 10
}
\`\`\`

## Best Practices for Organization Setup

### 🎯 Planning Considerations
- **Start Simple**: Begin with core roles and expand gradually
- **Clear Hierarchy**: Each hat should have a clear reporting structure  
- **Appropriate maxSupply**: Set realistic limits for each role
- **Future Growth**: Plan for organizational expansion

### 🔐 Security Considerations
- **Founder Control**: Keep top hat secure and backed up
- **Role Separation**: Don't give excessive permissions to single roles
- **Emergency Plans**: Have processes for role recovery/transfer
- **Regular Audits**: Periodically review role assignments

### ⚡ Efficiency Tips
- **Batch Operations**: Create multiple hats in single transactions when possible
- **Standard Modules**: Use proven eligibility/toggle modules
- **Clear Naming**: Use descriptive role names and details
- **Documentation**: Maintain off-chain records of organizational decisions

## Next Steps

1. **Execute Step 1**: Create the top hat for ${organizationName}
2. **Review Structure**: Confirm the planned hierarchy meets your needs
3. **Create Roles**: Execute hat creation transactions in order
4. **Assign Members**: Distribute hats to initial team members
5. **Document Process**: Record all hat IDs and organizational decisions

Would you like me to help you with any specific step or modify this plan based on your organization's unique needs?`
      }
    }
  ];

  return {
    description: `Complete guide for setting up "${organizationName}" organizational structure on ${networkName}`,
    messages
  };
}