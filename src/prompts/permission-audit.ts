/**
 * Permission Audit Prompt
 * Guides users through analyzing and auditing organizational permissions and role hierarchies
 */

import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js';

export async function permissionAuditPrompt(args?: Record<string, unknown>): Promise<GetPromptResult> {
  const networkName = args?.networkName as string || '[NETWORK_NAME]';
  const scope = args?.scope as string || '[SCOPE]';
  const target = args?.target as string || '[TARGET]';
  const includeInactive = args?.includeInactive === 'true' || args?.includeInactive === true;

  const messages: PromptMessage[] = [];

  // User request message
  messages.push({
    role: 'user',
    content: {
      type: 'text',
      text: `I need to audit permissions in our Hats Protocol organization. Scope: ${scope}, Target: ${target}, Network: ${networkName}${includeInactive ? ', including inactive roles' : ''}`
    }
  });

  // Generate audit content based on scope
  let responseContent = '';

  switch (scope.toLowerCase()) {
    case 'organization':
      responseContent = generateOrganizationAuditContent(networkName, target, includeInactive);
      break;
    case 'individual':
      responseContent = generateIndividualAuditContent(networkName, target, includeInactive);
      break;
    case 'role':
      responseContent = generateRoleAuditContent(networkName, target, includeInactive);
      break;
    case 'tree':
      responseContent = generateTreeAuditContent(networkName, target, includeInactive);
      break;
    default:
      responseContent = generateGeneralAuditContent(networkName, target, includeInactive);
  }

  messages.push({
    role: 'assistant',
    content: {
      type: 'text',
      text: responseContent
    }
  });

  return {
    description: `Permission audit for ${scope} scope on ${networkName}`,
    messages
  };
}

function generateOrganizationAuditContent(networkName: string, target: string, includeInactive: boolean): string {
  return `# Complete Organization Permission Audit

I'll help you conduct a comprehensive audit of your entire organization's permissions on ${networkName}.

## Phase 1: Organization Structure Analysis

### Step 1.1: Map Complete Hierarchy
\`\`\`
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "${target !== '[TARGET]' ? target : '[ORGANIZATION_TREE_ID]'}",
  "format": "json",
  "maxDepth": 15
}
\`\`\`

This provides:
- Complete organizational hierarchy
- All role relationships and dependencies
- Admin chains and delegation paths
- Role supply and capacity information

### Step 1.2: Identify All Role Holders
For each role found in the hierarchy, we'll query current assignments:

\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[EACH_ROLE_HAT_ID]"
}
\`\`\`

## Phase 2: Permission Risk Assessment

### 🔍 Critical Permission Analysis

#### Top Hat Holders (Highest Risk)
- **Control Level**: Complete organizational control
- **Risk Factor**: Maximum - can modify all roles
- **Monitoring**: Should be limited to 1-2 trusted addresses
- **Backup**: Ensure secure storage and recovery plans

#### Admin Role Concentrations
- **Multi-role Admins**: Addresses with admin over multiple roles
- **Wide Authority**: Roles with many child roles
- **Cross-department**: Admins spanning multiple areas

#### High-privilege Individual Analysis
Identify addresses with extensive permissions across the organization.

### ⚠️ Permission Vulnerabilities

#### Excessive Concentration
- Single points of failure
- Too many permissions in one address
- Lack of separation of duties

#### Inactive Admins
- Admin addresses not actively used
- Potentially compromised accounts
- Outdated organizational structure

#### Missing Controls
- Roles without proper admin oversight
- Unlimited max supply roles
- Missing eligibility requirements

## Phase 3: Detailed Audit Execution

### Step 3.1: Role-by-Role Analysis
For comprehensive coverage, analyze each role:

\`\`\`
# For each role in the organization:
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_ID]"
}

# Check current wearers:
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[ROLE_ID]",
  "wearer": "[EACH_WEARER_ADDRESS]"
}
\`\`\`

### Step 3.2: Individual Permission Maps
For key personnel, create complete permission profiles:

\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[KEY_PERSON_ADDRESS]",
  "includeInactive": ${includeInactive}
}
\`\`\`

## Audit Report Structure

### 📊 Executive Summary
- **Total Roles**: Number of active roles
- **Active Wearers**: Unique addresses with roles
- **Admin Concentration**: Key risk metrics
- **Critical Findings**: Top security concerns

### 👥 Personnel Analysis
- **High-privilege Users**: Top 10 by permission count
- **Admin Role Holders**: Those with admin authority
- **Multi-role Users**: Addresses with multiple hats
- **Inactive Assignments**: Roles not being actively used

### 🏢 Organizational Health
- **Hierarchy Depth**: Maximum and average levels
- **Role Distribution**: Balance across departments
- **Supply Utilization**: Roles nearing max capacity
- **Permission Gaps**: Areas lacking proper oversight

### 🔒 Security Assessment
- **Risk Level**: Overall organizational security posture
- **Vulnerabilities**: Identified security weaknesses
- **Compliance Issues**: Policy violation findings
- **Remediation Priority**: Recommended action sequence

## Common Audit Findings

### 🚨 High-Risk Issues
1. **Single Admin Dependencies**: Critical roles with only one admin
2. **Excessive Privileges**: Individuals with too many permissions
3. **Stale Assignments**: Roles assigned to inactive addresses
4. **Missing Succession**: No backup for key roles

### ⚠️ Medium-Risk Issues
1. **Role Sprawl**: Too many granular roles
2. **Unclear Hierarchy**: Complex or confusing structure
3. **Under-utilized Roles**: Roles with minimal usage
4. **Documentation Gaps**: Poor role descriptions

### 💡 Optimization Opportunities
1. **Role Consolidation**: Merge similar functions
2. **Permission Simplification**: Reduce complexity
3. **Automation**: Implement eligibility modules
4. **Training Needs**: Role management education

## Audit Automation Scripts

### Daily Monitoring Queries
\`\`\`
# Check for new role assignments
# Monitor admin permission changes  
# Verify critical role coverage
# Alert on unusual activity patterns
\`\`\`

### Weekly Review Process
\`\`\`
# Review all high-privilege assignments
# Check for inactive role holders
# Validate organizational structure changes
# Update risk assessment metrics
\`\`\`

### Monthly Deep Audit
\`\`\`
# Complete permission mapping
# Stakeholder access review
# Policy compliance verification  
# Security posture assessment
\`\`\`

## Remediation Recommendations

### 🎯 Immediate Actions (0-7 days)
1. **Secure Critical Roles**: Ensure top hat and key admins are secure
2. **Remove Stale Access**: Burn roles from inactive addresses
3. **Document Findings**: Record all discovered issues
4. **Stakeholder Notification**: Inform leadership of critical issues

### 📋 Short-term Improvements (1-4 weeks)
1. **Role Optimization**: Consolidate and clarify roles
2. **Permission Reduction**: Apply principle of least privilege
3. **Backup Planning**: Establish succession procedures
4. **Monitoring Setup**: Implement ongoing audit processes

### 🏗️ Long-term Enhancements (1-6 months)
1. **Governance Framework**: Establish formal processes
2. **Automation Implementation**: Deploy eligibility/toggle modules
3. **Training Program**: Educate role administrators
4. **Regular Auditing**: Schedule periodic reviews

## Compliance Frameworks

### 🏛️ Regulatory Compliance
- **SOX Requirements**: If applicable to your organization
- **GDPR Considerations**: Data access and privacy
- **Industry Standards**: Sector-specific requirements
- **Internal Policies**: Organization-specific rules

### 📋 Best Practice Standards
- **Principle of Least Privilege**: Minimum necessary access
- **Separation of Duties**: No single point of control
- **Regular Review**: Periodic access recertification
- **Audit Trail**: Complete change documentation

Would you like me to begin the audit process or focus on any specific area of concern?`;
}

function generateIndividualAuditContent(networkName: string, target: string, includeInactive: boolean): string {
  return `# Individual Permission Audit

I'll conduct a comprehensive audit of permissions for address ${target} on ${networkName}.

## Step 1: Complete Role Inventory

### Current Active Roles
\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "${target}",
  "includeInactive": ${includeInactive},
  "limit": 100
}
\`\`\`

This shows all roles currently held by this address, organized by organization tree.

## Step 2: Detailed Role Analysis

For each role held, we'll analyze the permissions and responsibilities:

\`\`\`
# For each hat found in Step 1:
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[EACH_HAT_ID]"
}
\`\`\`

This provides:
- Role name and description
- Admin privileges held
- Maximum supply and current usage
- Eligibility and toggle modules
- Position in organizational hierarchy

## Individual Risk Profile

### 🔴 High-Risk Indicators
- **Top Hat Holder**: Complete organizational control
- **Multiple Admin Roles**: Oversight of many positions
- **Cross-department Authority**: Influence across different areas
- **Critical Path Dependency**: Essential for operations

### 🟡 Medium-Risk Indicators  
- **Departmental Leadership**: Management within specific area
- **Special Privileges**: Unique or specialized permissions
- **Multiple Role Holdings**: Several different positions
- **External Integration**: Roles tied to external systems

### 🟢 Low-Risk Indicators
- **Individual Contributor**: Single operational role
- **Limited Scope**: Narrow area of responsibility
- **Standard Permissions**: Typical role assignments
- **Clear Boundaries**: Well-defined role limitations

## Audit Analysis Framework

### 📊 Permission Concentration Analysis
\`\`\`
Individual: ${target}

Role Count: [X active roles]
Admin Authority: [Y roles under administration]
Tree Participation: [Z different organizations]
Risk Score: [Calculated based on above]
\`\`\`

### 🎯 Access Appropriateness Review
- **Business Justification**: Each role should have clear purpose
- **Least Privilege**: Minimum necessary permissions
- **Segregation of Duties**: Appropriate separation of responsibilities
- **Temporal Relevance**: All roles currently needed

### 🔄 Usage Pattern Analysis
- **Active Utilization**: Roles being actively exercised
- **Dormant Assignments**: Roles not being used
- **Recent Changes**: New or modified role assignments
- **Interaction Patterns**: How roles relate to each other

## Individual Audit Report

### 👤 Profile Summary
- **Address**: ${target}
- **Total Active Roles**: [Count from audit]
- **Administrative Roles**: [Admin count]
- **Risk Classification**: [High/Medium/Low]
- **Last Activity**: [Recent role changes]

### 📋 Role Breakdown
For each role:
- **Role Name**: Clear identification
- **Organization**: Which tree/organization
- **Authority Level**: Individual contributor vs. admin
- **Business Purpose**: Why this role is needed
- **Risk Assessment**: Individual role risk level

### ⚠️ Risk Factors
- **Excessive Privileges**: More permissions than needed
- **Critical Dependencies**: Operations depend on this person
- **Cross-functional Access**: Broad organizational reach
- **Stale Assignments**: Unused or outdated roles

### ✅ Compliance Status
- **Policy Adherence**: Follows organizational guidelines
- **Regulatory Requirements**: Meets external standards
- **Approval Trail**: Proper assignment authorization
- **Review Currency**: Recent access certification

## Recommended Actions

### 🚨 Immediate (0-24 hours)
- **Security Review**: If high-risk profile detected
- **Access Validation**: Confirm all roles are legitimate
- **Backup Verification**: Ensure role coverage exists
- **Stakeholder Notification**: Alert appropriate managers

### 📋 Short-term (1-7 days)
- **Role Optimization**: Remove unnecessary permissions
- **Documentation Update**: Ensure roles are well-documented
- **Succession Planning**: Identify role backups
- **Training Verification**: Confirm person understands responsibilities

### 📊 Medium-term (1-4 weeks)
- **Regular Monitoring**: Set up ongoing review schedule
- **Process Integration**: Include in regular audits
- **Automation Setup**: Implement monitoring tools
- **Stakeholder Communication**: Regular permission reviews

## Individual vs. Organizational Context

### 🏢 Organizational Impact
\`\`\`
# Analyze how this person's roles fit in broader context:
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[PRIMARY_TREE_ID]",
  "format": "json",
  "maxDepth": 10
}
\`\`\`

### 🔗 Relationship Mapping
- **Direct Reports**: Roles this person administers
- **Reporting Chain**: Admin hierarchy above this person
- **Peer Relationships**: Similar-level roles in organization
- **Dependencies**: Other roles that depend on this person

### 📈 Impact Assessment
- **Operational Impact**: Effect if roles were removed
- **Security Impact**: Risk if account was compromised
- **Succession Impact**: Difficulty of replacing this person
- **Business Impact**: Effect on organization operations

## Monitoring Recommendations

### 📊 Key Metrics to Track
- **Role Changes**: Additions, removals, transfers
- **Usage Patterns**: How roles are being exercised
- **Permission Escalations**: Increases in authority
- **Cross-role Activities**: Actions spanning multiple roles

### 🔔 Alert Conditions
- **New High-privilege Assignments**: Admin roles added
- **Unusual Activity Patterns**: Atypical role usage
- **Failed Access Attempts**: Security concerns
- **Policy Violations**: Compliance issues

### 📅 Review Schedule
- **Daily**: Critical role holders
- **Weekly**: High-risk individuals
- **Monthly**: All role holders
- **Quarterly**: Comprehensive review

Would you like me to begin this individual audit or focus on any specific aspect of their permissions?`;
}

function generateRoleAuditContent(networkName: string, target: string, includeInactive: boolean): string {
  return `# Role-Specific Permission Audit

I'll conduct a detailed audit of role ${target} on ${networkName}, analyzing its permissions, usage, and organizational impact.

## Step 1: Role Deep Dive Analysis

### Complete Role Information
\`\`\`
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${target}"
}
\`\`\`

This provides comprehensive role details:
- Role name, description, and metadata
- Current supply vs. maximum capacity
- Admin role and permissions structure
- Eligibility and toggle modules
- Current active wearers

## Step 2: Current Wearer Analysis

### Active Assignments Verification
For each current wearer identified:

\`\`\`
Use tool: check-hat-wearer
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${target}",
  "wearer": "[EACH_WEARER_ADDRESS]"
}
\`\`\`

### Individual Wearer Context
For each wearer, understand their broader role portfolio:

\`\`\`
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[WEARER_ADDRESS]",
  "includeInactive": ${includeInactive}
}
\`\`\`

## Role Audit Framework

### 📋 Role Definition Audit
- **Purpose Clarity**: Is the role's function well-defined?
- **Scope Appropriateness**: Are the permissions right-sized?
- **Naming Convention**: Does the name clearly indicate function?
- **Documentation Quality**: Is the description comprehensive?

### 👥 Assignment Appropriateness
- **Wearer Qualification**: Do current holders meet requirements?
- **Supply Optimization**: Is max supply appropriate for function?
- **Distribution Logic**: Are assignments made systematically?
- **Eligibility Compliance**: Do wearers meet eligibility criteria?

### 🔗 Hierarchical Positioning
- **Admin Relationship**: Is the admin role appropriate?
- **Child Relationships**: Are subordinate roles properly structured?
- **Peer Relationships**: How does this role relate to similar-level roles?
- **Organizational Fit**: Does this role serve the organization's structure?

## Risk Assessment Matrix

### 🔴 High-Risk Factors
- **Administrative Authority**: Role can modify other roles
- **Wide Scope**: Affects multiple departments or functions
- **Critical Dependencies**: Operations fail without this role
- **External Integration**: Role tied to external systems/permissions

### 🟡 Medium-Risk Factors
- **Team Leadership**: Manages other role holders
- **Specialized Access**: Unique or technical permissions
- **Inter-departmental**: Spans multiple organizational areas
- **High Value**: Controls significant resources

### 🟢 Low-Risk Factors
- **Individual Contributor**: Personal scope only
- **Standard Function**: Common organizational role
- **Limited Duration**: Temporary or project-based
- **Well-Supervised**: Clear oversight and boundaries

## Usage Pattern Analysis

### 📊 Utilization Metrics
- **Current Supply**: How many people hold this role
- **Historical Trends**: Changes in assignment patterns
- **Turnover Rate**: How often the role changes hands
- **Activation Frequency**: How often role permissions are used

### 🔄 Operational Impact
- **Business Function**: What processes depend on this role
- **Decision Authority**: What decisions this role can make
- **Resource Access**: What systems/assets this role controls
- **Stakeholder Reach**: Who is affected by this role's actions

## Role Security Assessment

### 🔐 Permission Analysis
- **Principle of Least Privilege**: Does role have minimum necessary access?
- **Segregation of Duties**: Appropriate separation from conflicting roles?
- **Approval Workflow**: Are role assignments properly authorized?
- **Access Review**: When were permissions last reviewed?

### ⚡ Module Configuration
- **Eligibility Module**: Are requirements appropriate and enforced?
- **Toggle Module**: Are activation/deactivation controls suitable?
- **Custom Logic**: Any special behavior or restrictions?
- **Integration Points**: How role interacts with external systems?

## Organizational Context Analysis

### 🏢 Tree Position Mapping
\`\`\`
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "[ROLE_TREE_ID]",
  "format": "ascii-tree",
  "maxDepth": 10
}
\`\`\`

This shows:
- Where this role fits in organizational hierarchy
- Parent-child relationships with other roles
- Siblings and peer roles at same level
- Overall organizational structure context

### 📈 Impact Assessment
- **Upstream Dependencies**: What roles depend on this one
- **Downstream Authority**: What roles this one controls
- **Cross-functional Reach**: Impact across different areas
- **Succession Planning**: Backup coverage for this role

## Audit Findings Categories

### ✅ Compliant Areas
- **Proper Authorization**: Role correctly assigned and approved
- **Appropriate Scope**: Permissions match business needs
- **Good Documentation**: Clear description and purpose
- **Regular Usage**: Role is actively utilized as intended

### ⚠️ Areas of Concern
- **Over-privileged**: More access than necessary
- **Under-documented**: Unclear purpose or scope
- **Stale Assignments**: Inactive or inappropriate wearers
- **Process Gaps**: Missing approval or review procedures

### 🚨 Critical Issues
- **Security Violations**: Inappropriate access or permissions
- **Compliance Failures**: Regulatory or policy violations
- **Operational Risks**: Single points of failure
- **Unauthorized Changes**: Modifications without proper approval

## Role Optimization Recommendations

### 🎯 Immediate Actions (0-7 days)
1. **Security Review**: Address any identified vulnerabilities
2. **Wearer Verification**: Confirm all current assignments are appropriate
3. **Documentation Update**: Improve role descriptions if needed
4. **Access Cleanup**: Remove any inappropriate permissions

### 📋 Short-term Improvements (1-4 weeks)
1. **Process Enhancement**: Improve assignment/review procedures
2. **Module Updates**: Enhance eligibility or toggle logic if needed
3. **Training Delivery**: Ensure wearers understand responsibilities
4. **Monitoring Setup**: Establish ongoing oversight

### 🏗️ Long-term Optimization (1-6 months)
1. **Role Evolution**: Adapt role to changing business needs
2. **Automation Integration**: Implement systematic controls
3. **Succession Planning**: Develop backup and coverage strategies
4. **Regular Review Cycle**: Schedule periodic audits

## Role Comparison Analysis

### 📊 Benchmarking
- **Similar Roles**: Compare with peer roles in same organization
- **Industry Standards**: How does role compare to best practices
- **Regulatory Requirements**: Compliance with applicable standards
- **Historical Evolution**: How has this role changed over time

### 🔄 Optimization Opportunities
- **Role Consolidation**: Could this be combined with similar roles?
- **Permission Refinement**: Can scope be reduced without impact?
- **Process Automation**: Can some functions be automated?
- **Delegation Opportunities**: Can some authority be distributed?

## Monitoring and Maintenance

### 📈 Key Performance Indicators
- **Assignment Accuracy**: Appropriate people in role
- **Usage Efficiency**: Role permissions being utilized
- **Compliance Rate**: Adherence to policies and procedures
- **Incident Frequency**: Security or operational issues

### 🔔 Alert Conditions
- **Unusual Activity**: Atypical use of role permissions
- **Assignment Changes**: New wearers or removals
- **Module Modifications**: Changes to eligibility or toggle logic
- **Compliance Violations**: Policy or regulatory issues

### 📅 Review Schedule
- **Monthly**: High-risk or critical roles
- **Quarterly**: Standard operational roles
- **Annually**: All roles comprehensive review
- **Event-driven**: Changes in business requirements

Would you like me to proceed with this role audit or focus on any specific aspect?`;
}

function generateTreeAuditContent(networkName: string, target: string, includeInactive: boolean): string {
  return `# Organization Tree Permission Audit

I'll conduct a comprehensive audit of the entire organization tree ${target} on ${networkName}, analyzing structure, permissions, and governance.

## Phase 1: Complete Tree Analysis

### Step 1.1: Full Organizational Structure
\`\`\`
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "${target}",
  "format": "json",
  "maxDepth": 20
}
\`\`\`

This provides:
- Complete hierarchical structure
- All roles and their relationships
- Admin chains and delegation paths
- Organizational depth and complexity metrics

### Step 1.2: Tree Metadata and Health
\`\`\`
# Analyze the top hat of this tree
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${target}0000000000000000000000000000000000000000000000000000000"
}
\`\`\`

## Phase 2: Comprehensive Role Inventory

### Role-by-Role Analysis
For every role in the organization, we'll conduct detailed analysis:

\`\`\`
# For each role found in the tree structure:
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "[EACH_ROLE_HAT_ID]"
}
\`\`\`

### Active Wearer Mapping
Create complete directory of all role holders:

\`\`\`
# For each active wearer found:
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[WEARER_ADDRESS]",
  "includeInactive": ${includeInactive}
}
\`\`\`

## Tree Audit Framework

### 🏗️ Structural Analysis
- **Hierarchy Depth**: Maximum levels in organization
- **Breadth Distribution**: Number of roles at each level
- **Balance Assessment**: Even distribution vs. concentration
- **Complexity Metrics**: Overall organizational complexity

### 👑 Governance Structure
- **Top Hat Security**: Root control and backup procedures
- **Admin Concentration**: Distribution of administrative authority
- **Decision Pathways**: How decisions flow through structure
- **Succession Planning**: Backup coverage for critical roles

### 📊 Utilization Metrics
- **Active Role Ratio**: Percentage of roles with active wearers
- **Supply Efficiency**: How well max supply aligns with usage
- **Wearer Distribution**: Unique individuals vs. total assignments
- **Cross-role Holdings**: People with multiple roles in tree

## Tree Health Assessment

### 🟢 Healthy Organization Indicators
- **Clear Hierarchy**: Well-defined reporting structure
- **Balanced Distribution**: Even spread of authority
- **Appropriate Depth**: Not too flat or too deep
- **Active Utilization**: Most roles have active wearers

### 🟡 Warning Signs
- **Single Points of Failure**: Over-concentration of power
- **Excessive Complexity**: Too many levels or roles
- **Underutilization**: Many roles without wearers
- **Admin Sprawl**: Too many people with admin rights

### 🔴 Critical Issues
- **Ungoverned Roles**: Roles without proper admin oversight
- **Circular Dependencies**: Problematic admin relationships
- **Abandoned Sections**: Parts of tree with no activity
- **Security Vulnerabilities**: Weak points in authority chain

## Organizational Risk Assessment

### 🚨 High-Risk Areas
1. **Top Hat Concentration**: Too few people with ultimate authority
2. **Critical Path Dependencies**: Single person/role dependencies
3. **Cross-departmental Conflicts**: Unclear authority boundaries
4. **Inactive Admin Chains**: Non-responsive administrative paths

### ⚠️ Medium-Risk Concerns
1. **Role Proliferation**: Too many granular roles
2. **Permission Creep**: Gradually expanding authorities
3. **Documentation Gaps**: Unclear role purposes
4. **Review Deficits**: Infrequent permission reviews

### 💡 Optimization Opportunities
1. **Structure Simplification**: Consolidate similar roles
2. **Authority Redistribution**: Better balance of power
3. **Automation Integration**: Systematic permission management
4. **Process Standardization**: Consistent role management

## Detailed Analysis Reports

### 📋 Executive Summary
- **Organization**: Tree ${target} on ${networkName}
- **Total Roles**: [Count of all roles in tree]
- **Active Wearers**: [Unique addresses with roles]
- **Admin Roles**: [Count of roles with admin authority]
- **Risk Level**: [Overall assessment]
- **Key Findings**: [Top 3-5 critical issues]

### 👥 Personnel Analysis
- **Leadership Layer**: Top-level role holders
- **Management Tier**: Mid-level administrators  
- **Individual Contributors**: Operational role holders
- **Multi-role Individuals**: People with multiple assignments
- **Inactive Assignments**: Roles without current wearers

### 🏢 Structural Assessment
- **Organizational Design**: How well structure serves purpose
- **Scalability**: Ability to grow/adapt
- **Efficiency**: Streamlined vs. bureaucratic
- **Clarity**: Understandable role relationships
- **Governance**: Effective oversight and control

### 🔒 Security Evaluation
- **Access Controls**: Appropriate permission restrictions
- **Admin Oversight**: Proper administrative supervision
- **Audit Trail**: Trackability of role changes
- **Compliance**: Adherence to policies/regulations
- **Incident Readiness**: Preparedness for security issues

## Governance Recommendations

### 🎯 Immediate Priorities (0-30 days)
1. **Secure Critical Paths**: Protect top hat and key admin roles
2. **Address Vulnerabilities**: Fix identified security issues
3. **Clean Up Stale Roles**: Remove inactive/inappropriate assignments
4. **Document Structure**: Ensure organizational chart accuracy

### 📋 Short-term Improvements (1-3 months)
1. **Process Standardization**: Establish consistent role management
2. **Training Deployment**: Educate role administrators
3. **Monitoring Implementation**: Set up ongoing oversight
4. **Policy Development**: Create governance frameworks

### 🏗️ Long-term Strategy (3-12 months)
1. **Structural Optimization**: Redesign inefficient areas
2. **Automation Integration**: Implement systematic controls
3. **Culture Development**: Build governance mindset
4. **Continuous Improvement**: Regular review and enhancement

## Comparative Analysis

### 📊 Benchmarking Metrics
- **Industry Standards**: How does structure compare to similar organizations
- **Best Practices**: Alignment with established governance principles
- **Regulatory Requirements**: Compliance with applicable standards
- **Historical Performance**: Changes and improvements over time

### 🔄 Evolution Tracking
- **Growth Patterns**: How organization has expanded
- **Structural Changes**: Major reorganizations or adaptations
- **Role Lifecycle**: Creation, modification, and retirement patterns
- **Usage Trends**: Changes in role utilization over time

## Ongoing Monitoring Strategy

### 📈 Key Performance Indicators
- **Governance Health**: Metrics for organizational effectiveness
- **Security Posture**: Indicators of risk and vulnerability
- **Operational Efficiency**: Measures of structural performance
- **Compliance Status**: Adherence to policies and regulations

### 🔔 Automated Alerts
- **Structural Changes**: New roles, modifications, deletions
- **Assignment Patterns**: Unusual role assignment activity
- **Security Events**: Potential security issues or violations
- **Compliance Issues**: Policy or regulatory violations

### 📅 Review Cycles
- **Daily**: Critical security monitoring
- **Weekly**: Operational oversight and issue identification
- **Monthly**: Comprehensive governance review
- **Quarterly**: Strategic assessment and planning
- **Annually**: Complete organizational audit

## Tree Comparison Analysis

If multiple trees exist in your ecosystem:

### 🌳 Multi-tree Organizations
- **Inter-tree Relationships**: How different organizations interact
- **Resource Sharing**: Shared roles or personnel across trees
- **Governance Coordination**: Aligned policies and procedures
- **Best Practice Sharing**: Learning from other organizational structures

Would you like me to begin this comprehensive tree audit or focus on any specific aspect of the organizational structure?`;
}

function generateGeneralAuditContent(networkName: string, target: string, _includeInactive: boolean): string {
  return `# General Permission Audit Guide

I'll help you conduct a comprehensive permission audit on ${networkName}. Let me guide you through the available audit approaches and help you choose the most appropriate one.

## Audit Scope Options

### 🏢 Organization-wide Audit
**Best for**: Complete organizational review
- Analyzes entire tree structure
- Maps all roles and relationships
- Identifies systemic issues
- Provides comprehensive risk assessment

**Use when**:
- New to the organization
- Compliance requirements
- Security incidents
- Major restructuring

### 👤 Individual-focused Audit  
**Best for**: Person-specific permission review
- Analyzes all roles held by one address
- Assesses individual risk profile
- Identifies permission concentrations
- Evaluates appropriateness of access

**Use when**:
- Employee role changes
- Security concerns about specific person
- Compliance review of key personnel
- Regular access reviews

### 🎭 Role-specific Audit
**Best for**: Deep dive into specific position
- Analyzes single role comprehensively
- Reviews all current wearers
- Assesses role design and usage
- Identifies optimization opportunities

**Use when**:
- Role creation or modification
- Usage pattern concerns
- Permission scope questions
- Compliance for specific function

### 🌳 Tree-level Audit
**Best for**: Organizational structure analysis
- Complete hierarchy examination
- Governance structure review
- Multi-role relationship analysis
- Structural optimization opportunities

**Use when**:
- Organizational design review
- Governance assessment
- Structural problems suspected
- Growth planning

## Getting Started

### Step 1: Define Your Audit Scope
Please specify:
- **Scope Type**: Organization, Individual, Role, or Tree
- **Target**: Address, Hat ID, or Tree ID to audit
- **Depth**: How comprehensive you want the analysis
- **Timeline**: When results are needed

### Step 2: Initial Discovery
Let's start with basic discovery to understand your context:

\`\`\`
# If you know your tree ID:
Use tool: get-tree-structure
Parameters:
{
  "networkName": "${networkName}",
  "treeId": "${target !== '[TARGET]' ? target : '[YOUR_TREE_ID]'}",
  "format": "ascii-tree",
  "maxDepth": 5
}

# If you want to see your own roles:
Use tool: query-hats-by-wearer
Parameters:
{
  "networkName": "${networkName}",
  "wearer": "[YOUR_ADDRESS]",
  "includeInactive": false
}

# If you have a specific role to examine:
Use tool: get-hat-details
Parameters:
{
  "networkName": "${networkName}",
  "hatId": "${target !== '[TARGET]' ? target : '[HAT_ID]'}"
}
\`\`\`

## Common Audit Triggers

### 🚨 Security Events
- **Incident Response**: After security breach or concern
- **Access Review**: Regular compliance requirement
- **Personnel Changes**: Employee departures or role changes
- **System Integration**: New systems requiring access validation

### 📋 Operational Needs
- **Process Improvement**: Optimizing role structures
- **Growth Planning**: Scaling organizational structure
- **Efficiency Review**: Eliminating redundant permissions
- **Training Requirements**: Understanding role responsibilities

### 🏛️ Compliance Requirements
- **Regulatory Audit**: Meeting external standards
- **Policy Compliance**: Internal governance requirements
- **Certification**: ISO, SOC, or other certifications
- **Due Diligence**: M&A or partnership preparation

## Audit Methodologies

### 🔍 Risk-Based Approach
1. **Identify High-Risk Areas**: Focus on critical roles and permissions
2. **Assess Vulnerabilities**: Look for security weaknesses
3. **Prioritize Findings**: Address most critical issues first
4. **Monitor Ongoing**: Continuous risk assessment

### 📊 Compliance-Driven Audit
1. **Map Requirements**: Understand applicable standards
2. **Gap Analysis**: Compare current state to requirements
3. **Remediation Planning**: Address compliance gaps
4. **Documentation**: Maintain audit trail

### 🎯 Process-Oriented Review
1. **Workflow Analysis**: How permissions support business processes
2. **Efficiency Assessment**: Identify bottlenecks or redundancies
3. **Optimization Opportunities**: Streamline where possible
4. **Change Management**: Implement improvements systematically

## Pre-Audit Preparation

### 📋 Information Gathering
- **Organizational Chart**: Current structure documentation
- **Role Descriptions**: Purpose and responsibilities for each role
- **Policy Documents**: Governance and compliance requirements
- **Historical Context**: Previous audits or major changes

### 🔧 Tools and Access
- **Audit Permissions**: Ensure you can query necessary information
- **Documentation Templates**: Prepare reporting formats
- **Stakeholder List**: Identify people who need to be involved
- **Timeline Planning**: Allow adequate time for thorough review

### 👥 Team Coordination
- **Audit Lead**: Designate responsible person
- **Subject Matter Experts**: Include people who understand roles
- **Technical Support**: Ensure blockchain/system access
- **Management Sponsor**: Executive support for audit

## Audit Execution Framework

### Phase 1: Discovery (Days 1-3)
- **Data Collection**: Gather all relevant information
- **Stakeholder Interviews**: Understand current practices
- **System Analysis**: Technical review of implementations
- **Preliminary Assessment**: Initial findings and scope validation

### Phase 2: Analysis (Days 4-10)
- **Detailed Review**: Comprehensive examination of findings
- **Risk Assessment**: Evaluate security and operational risks
- **Gap Identification**: Compare current state to requirements
- **Pattern Analysis**: Look for trends and systemic issues

### Phase 3: Reporting (Days 11-14)
- **Findings Documentation**: Detailed report of discoveries
- **Risk Prioritization**: Rank issues by severity and impact
- **Recommendations**: Specific, actionable improvement suggestions
- **Presentation**: Share results with stakeholders

### Phase 4: Follow-up (Ongoing)
- **Remediation Tracking**: Monitor implementation of fixes
- **Continuous Monitoring**: Ongoing oversight of improvements
- **Regular Reviews**: Periodic re-audits to ensure compliance
- **Process Improvement**: Enhance audit procedures based on learning

## Sample Audit Questions

### 🏢 Organizational Level
- Are role assignments appropriate for business needs?
- Is there proper segregation of duties?
- Are admin permissions appropriately distributed?
- Do we have adequate succession planning?

### 👤 Individual Level
- Does this person have appropriate access for their role?
- Are there any excessive permissions that should be removed?
- Is there proper documentation for all role assignments?
- Are regular access reviews being conducted?

### 🎭 Role Level
- Is this role designed optimally for its intended purpose?
- Are the right people assigned to this role?
- Is the maximum supply appropriate?
- Are eligibility requirements properly enforced?

### 🌳 Tree Level
- Is the organizational structure efficient and effective?
- Are there appropriate checks and balances?
- Is the hierarchy clear and well-documented?
- Are there any structural security vulnerabilities?

## Next Steps

To begin your audit, please provide:

1. **Audit Type**: Which scope (organization/individual/role/tree)?
2. **Target Identifier**: Address, Hat ID, or Tree ID to audit
3. **Specific Concerns**: Any particular issues you want to focus on
4. **Timeline**: When do you need results?
5. **Compliance Requirements**: Any specific standards to meet?

Once you provide this information, I'll create a customized audit plan tailored to your specific needs and guide you through the complete process.

What type of audit would you like to conduct?`;
}