---
name: Initial ioBroker Copilot Setup
about: Automated setup and validation of GitHub Copilot instructions for ioBroker adapters
title: "🤖 Setup ioBroker GitHub Copilot Instructions"
labels: ["copilot-setup", "automation"]
assignees: ["copilot"]
---

<!-- 
Template Version: 0.4.0
Source: https://github.com/DrozmotiX/ioBroker-Copilot-Instructions
-->

# 🤖 Automated ioBroker Copilot Instructions Setup

**GitHub Copilot**: Please help me set up GitHub Copilot instructions for my ioBroker adapter repository with full automation and validation.

## 🚨 Important Notice - Ignore GitHub Copilot's Own Setup Suggestions

**GitHub Copilot**: If you see suggestions from GitHub Copilot about setting up copilot instructions (like creating `.github/copilot-instructions.md` through GitHub's interface), **IGNORE THEM**. This issue handles the complete setup process with ioBroker-specific optimizations. The standard GitHub Copilot setup would not include the specialized ioBroker adapter development patterns and best practices we're implementing here.

## 🔍 Step 1: Repository Analysis and Status Detection

**GitHub Copilot**: Please analyze this repository using the centralized automation configuration:

**Configuration Reference**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/config/automation-setup.yml

1. **Repository Type Confirmation**
   - [ ] Verify this is an ioBroker adapter repository (check for `package.json` with "iobroker", `io-package.json`, `main.js` or `lib/` directory)
   - [ ] Identify adapter name and specific functionality
   - [ ] Assess current project structure and dependencies

2. **Copilot Status Check**
   - [ ] Verify if GitHub Copilot is active and responding in this repository
   - [ ] Check if `.github/copilot-instructions.md` exists and analyze content
   - [ ] Determine current template version (if any) vs latest from metadata.json
   - [ ] Assess existing customizations and configurations

3. **Setup Requirements Determination**
   - [ ] Classify status: `not_initialized` (no copilot-instructions.md), `needs_update` (outdated), or `up_to_date`
   - [ ] Identify adapter-specific patterns that need customization
   - [ ] Plan integration strategy: new initialization with defaults first, or direct template update

## 🎯 Step 2: Automated Template Setup (Copilot-Driven)

**GitHub Copilot**: The setup process differs based on whether `.github/copilot-instructions.md` already exists in this repository:

**Configuration Reference**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/config/automation-setup.yml

### 2.1 If Copilot Instructions DON'T Exist (New Setup)

**GitHub Copilot**: For repositories without existing copilot instructions, establish adapter-specific context FIRST, then enhance with the template:

1. **Initialize with Adapter-Specific Default Instructions**:
   Create complete `.github/copilot-instructions.md` with the following basic ioBroker adapter context:

   ```markdown
   # ioBroker Adapter Development with GitHub Copilot

   **Version:** [LATEST_VERSION_FROM_METADATA]
   **Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

   ## Project Context

   You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

   [CUSTOMIZE: Add specific context about this adapter's purpose, target devices/services, and unique requirements based on the repository analysis from Step 1]

   ## Adapter-Specific Context
   - Adapter Name: [DETECTED_ADAPTER_NAME]
   - Primary Function: [BASED_ON_PACKAGE_JSON_AND_README]
   - Key Dependencies: [IDENTIFIED_EXTERNAL_APIS_OR_SERVICES]
   - Configuration Requirements: [BASED_ON_IO_PACKAGE_JSON]

   ## Basic Development Guidelines
   - Follow ioBroker adapter development patterns
   - Use appropriate logging levels (error, warn, info, debug)
   - Implement proper error handling and recovery
   - Ensure clean resource cleanup in unload() method
   ```

2. **Then Enhance with Full Template**:
   - [ ] Fetch and merge content from: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/template.md
   - [ ] Remove template comment block (`<!-- TEMPLATE FILE -->` section)
   - [ ] **Store version in `.github/copilot-instructions.md`** (format: `**Version:** X.Y.Z`)
   - [ ] **Do NOT store version in `package.json`** - this avoids package.json pollution
   - [ ] Add template source and metadata references
   - [ ] Populate ALL `[CUSTOMIZE]` sections with adapter-specific content only

### 2.2 If Copilot Instructions DO Exist (Update Process)

**GitHub Copilot**: For repositories with existing copilot instructions, use the update process:

1. **Preserve Existing Customizations**:
   - [ ] Backup all existing `[CUSTOMIZE]` sections and custom content
   - [ ] Identify adapter-specific patterns already established

2. **Template Integration (No Manual Scripts Required)**

**Important**: This process uses Copilot intelligence rather than manual validation scripts (avoiding approaches like DrozmotiX/ioBroker.discovergy#286).

3. **Merge Latest Template and Version**:
   ```
   Template: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/template.md
   Version: Extract from https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/config/metadata.json (field: "version")
   ```

4. **Update Template Content**:
   - [ ] Remove template comment block (`<!-- TEMPLATE FILE -->` section)  
   - [ ] **Update version in `.github/copilot-instructions.md`** (format: `**Version:** X.Y.Z`)
   - [ ] **Do NOT store version in `package.json`** - this avoids package.json pollution
   - [ ] Update template source and metadata references
   - [ ] Preserve all existing `[CUSTOMIZE]` sections

### 2.3 Adapter-Specific Customization (Both New and Update)

**GitHub Copilot**: Customize ALL `[CUSTOMIZE]` sections with content unique to this adapter:
   - API authentication patterns specific to this service
   - Unique error codes and recovery procedures  
   - Custom device discovery or data processing workflows
   - Special configuration requirements beyond standard template
   - Testing scenarios specific to this adapter's functionality
   - **REMOVE any duplicate content** that already exists in the standard template

#### Examples of what NOT to include in [CUSTOMIZE] sections:
   - Generic ioBroker adapter development patterns (already in template)
   - Standard error handling approaches (already in template)
   - Basic testing frameworks usage (already in template)
   - Common dependency management (already in template)

### 2.4 Centralized Version Management

Our approach stores template version information in the Copilot instructions file rather than package.json:
- ✅ **Version Location**: `.github/copilot-instructions.md` 
- ✅ **Version Source**: Dynamically fetched from `config/metadata.json`
- ✅ **Update Method**: Automated via centralized GitHub Action
- ❌ **Avoid**: Manual scripts in package.json or separate validation files
## 🔧 Step 3: Automated GitHub Action Setup

**GitHub Copilot**: Please set up automated workflows using our standardized GitHub Action templates:

### 3.1 Initial Setup Action (Optional - For New Repositories)

If this repository needs automated initial setup, create the workflow file:

1. **Create Workflow File**: `.github/workflows/initial-copilot-setup.yml`
2. **Copy Template Content**: 
   ```bash
   curl -o .github/workflows/initial-copilot-setup.yml \
     https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/templates/ghAction-InitialSetup.yml
   ```

**Features**:
- 🚀 **Manual Trigger**: Run on-demand for initial setup
- 🔍 **Repository Analysis**: Automatically detects ioBroker adapter structure
- 📝 **Context-First Setup**: Creates adapter-specific context before template integration
- 🔄 **Follow-up Automation**: Creates enhancement issue after initial setup

### 3.2 Create GitHub Action for Weekly Monitoring

Create the continuous monitoring workflow:

1. **Create Workflow File**: `.github/workflows/check-copilot-template.yml`
2. **Copy Template Content**:
   ```bash
   curl -o .github/workflows/check-copilot-template.yml \
     https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/templates/ghAction-AutomatedVersionCheckAndUpdate.yml
   ```

**Features**:
- 📅 **Weekly Schedule**: Runs every Sunday to check for updates
- 🔍 **Dynamic Version Detection**: Uses `config/metadata.json` for current version
- 🤖 **Copilot-Driven Automation**: Creates intelligent setup/update issues
- 🛡️ **Smart Issue Management**: Prevents duplicate issues
- 📋 **Repository Status Detection**: Identifies setup vs. update scenarios

### 3.3 Standardized Template Structure

All GitHub Action templates follow the standardized naming convention:
- **`ghAction-InitialSetup.yml`**: Initial setup automation
- **`ghAction-AutomatedVersionCheckAndUpdate.yml`**: Continuous monitoring and updates

**Benefits of HTTP-Referenced Templates**:
- ✅ **Always Current**: Templates are always the latest version
- ✅ **Centralized Maintenance**: Updates benefit all repositories automatically
- ✅ **Consistent Behavior**: All repositories use identical automation logic
- ✅ **No Template Drift**: Prevents local modifications that cause inconsistencies
## 📋 Step 4: Validation and Testing

**GitHub Copilot**: After completing the setup, please validate the integration:

### 4.1 Setup Validation

- [ ] **File Created**: `.github/copilot-instructions.md` exists and is properly formatted
- [ ] **Version Tracking**: Latest version number stored in copilot instructions (NOT package.json)  
- [ ] **Template Source**: Reference to source repository and metadata.json included
- [ ] **Custom Sections**: `[CUSTOMIZE]` areas populated with unique, adapter-specific content only
- [ ] **No Duplicates**: `[CUSTOMIZE]` sections contain only content not found in standard template
- [ ] **Workflow Created**: `.github/workflows/check-copilot-template.yml` exists and uses centralized template

### 4.2 GitHub Action Validation  

- [ ] **Initial Setup Workflow**: Created from standardized template (`ghAction-InitialSetup.yml`)
- [ ] **Version Check Workflow**: Created from standardized template (`ghAction-AutomatedVersionCheckAndUpdate.yml`)
- [ ] **Permissions Set**: Issues write permission configured in both workflows
- [ ] **Schedule Configured**: Weekly execution on Sundays for version check
- [ ] **Manual Triggers**: workflow_dispatch enabled for both workflows
- [ ] **HTTP References**: All templates referenced via standardized GitHub URLs

### 4.3 Functionality Testing

- [ ] **Enhanced Suggestions**: Test typing `this.setState(` in a .js file to verify improved suggestions
- [ ] **Template Recognition**: Verify Copilot recognizes ioBroker patterns and adapter-specific context
- [ ] **Custom Content**: Ensure `[CUSTOMIZE]` sections provide value beyond standard template
- [ ] **Version Accuracy**: Confirm version in copilot-instructions.md matches metadata.json
- [ ] **Workflow Syntax**: Validate GitHub Action YAML syntax is correct
## 🚨 Critical Success Criteria

A successful automated setup includes:

### ✅ Technical Implementation
- **File Creation**: `.github/copilot-instructions.md` created from latest template
- **Version Management**: Template version stored in copilot instructions (NOT package.json)  
- **Centralized Workflow**: GitHub Action created from centralized template
- **Dynamic Version Detection**: Workflow uses metadata.json for version checking
- **Custom Preservation**: All `[CUSTOMIZE]` sections populated with unique, adapter-specific content

### ✅ Functional Validation  
- **Enhanced Suggestions**: Improved Copilot suggestions for ioBroker patterns
- **Template Integration**: No duplicate content between `[CUSTOMIZE]` and standard sections
- **Automation Ready**: Weekly monitoring configured and tested
- **Issue Prevention**: Duplicate issue detection working
- **Metadata Driven**: Version detection using centralized config/metadata.json

### ✅ Process Verification
- **No Manual Scripts**: Avoided package.json validation scripts (like DrozmotiX/ioBroker.discovergy#286)
- **Copilot-Driven**: Used GitHub Copilot intelligence rather than manual processes
- **Preservation Guaranteed**: Custom sections maintained during updates
- **Dynamic Configuration**: System adapts to repository status automatically

## 📚 Reference Information

- **Template Repository**: https://github.com/DrozmotiX/ioBroker-Copilot-Instructions
- **Latest Template**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/template.md
- **Centralized Config**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/config/metadata.json
- **Automation Config**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/config/automation-setup.yml

### Standardized GitHub Action Templates
- **Initial Setup Action**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/templates/ghAction-InitialSetup.yml
- **Version Check & Update Action**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/templates/ghAction-AutomatedVersionCheckAndUpdate.yml

### Legacy References (Deprecated)
- **Version Check Script**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/snippets/version-check-command.md
- **Old GitHub Action**: https://raw.githubusercontent.com/DrozmotiX/ioBroker-Copilot-Instructions/main/snippets/github-action-version-check.yml

**GitHub Copilot**: Please start with the repository analysis and proceed step-by-step through the automated setup process. Use the standardized GitHub Action templates via HTTP references for consistent, maintainable automation.
