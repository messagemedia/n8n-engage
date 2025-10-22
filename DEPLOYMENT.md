# Deployment Guide: @sinch-engage/n8n-nodes-sinch-engage

This guide explains how to deploy the n8n Sinch Engage SMS node to the Sinch Engage NPM organization using your personal access token.

## Overview

The deployment process uses a local script that:
- ✅ Builds the package
- ✅ Prompts for NPM credentials
- ✅ Publishes with alpha tag
- ✅ Provides post-deployment instructions

## Prerequisites

### 1. NPM Account & Access Token
You need an NPM account with publish permissions:

1. **Create NPM Account**: https://www.npmjs.com/signup
2. **Generate Access Token**:
   - Go to: https://www.npmjs.com/settings/tokens
   - Click **"Generate New Token"**
   - Select **"Automation"** or **"Publish"** scope
   - Copy the generated token (⚠️ **save it securely** - you won't see it again!)

### 2. Local Environment
- Node.js (v18+ recommended)
- NPM CLI
- Git repository access

## Quick Start Deployment

### Option 1: Using the Deployment Script (Recommended)

```bash
# Navigate to project root
cd /path/to/connectors/n8n/n8n-engage

# Run the deployment script
./deploy-to-npm.sh
```

The script will:
1. 🔍 Verify you're in the correct directory
2. 🔨 Build the package if needed
3. 🔑 Prompt for your NPM access token
4. ⚙️ Configure NPM authentication
5. 📤 Publish to NPM with alpha tag
6. ✅ Show package details and next steps

### Option 2: Manual Deployment

If you prefer manual control:

```bash
# 1. Build the package
npm run build

# 2. Login to NPM (if not already logged in)
npm login

# 3. Publish with alpha tag
npm publish --tag alpha
```

## Deployment Script Details

The `deploy-to-npm.sh` script provides:

### Features
- **Safety Checks**: Verifies correct directory and package name
- **Auto-build**: Builds package if `dist/` directory doesn't exist
- **Interactive Prompts**: Asks for NPM token securely
- **Confirmation**: Asks before publishing
- **Error Handling**: Clear error messages and exit codes
- **Success Feedback**: Shows package details and next steps

### Security Notes
- NPM token is entered interactively (not logged)
- Token is configured temporarily for this session
- No tokens are stored in files

## Post-Deployment Steps

### 1. Verify Publication
```bash
# Check if package is published
npm view @sinch-engage/n8n-nodes-sinch-engage versions --json

# View package info
npm view @sinch-engage/n8n-nodes-sinch-engage
```

### 2. Test Installation
```bash
# Install the alpha version
npm install @sinch-engage/n8n-nodes-sinch-engage@alpha

# Or install in n8n (recommended for testing)
# In n8n: Settings → Community Nodes → Install
# Enter: @sinch-engage/n8n-nodes-sinch-engage
```

### 3. Test in n8n
1. **Install in n8n**: Use the Community Nodes interface
2. **Configure Credentials**: Add MessageMedia API credentials
3. **Test Workflow**: Create a simple SMS workflow
4. **Verify Functionality**: Test sandbox mode first, then live mode

## Troubleshooting

### Common Issues

**❌ "Publishing failed"**
- Check NPM token permissions
- Verify package builds successfully (`npm run build`)
- Ensure no existing package with same version

**❌ "npm whoami failed"**
- Check NPM token validity
- Re-run script to re-enter token

**❌ "Package not found after publishing"**
- Wait a few minutes for NPM propagation
- Check correct package name spelling
- Verify alpha tag: `npm view @sinch-engage/n8n-nodes-sinch-engage dist-tags`

### Getting Help
- Check NPM status: https://status.npmjs.org/
- NPM support: https://www.npmjs.com/support
- Package page: https://www.npmjs.com/package/@sinch-engage/n8n-nodes-sinch-engage

## Version Management

### Release Channels
- **Alpha** (`1.x.x-alpha-x`): Development/testing
- **Beta** (`1.x.x-beta-x`): Public preview
- **GA** (`1.x.x`): Production ready

### Updating Versions
```bash
# For next alpha version
npm version prerelease --preid=alpha

# For beta
npm version prerelease --preid=beta

# For GA release
npm version patch  # or minor/major
```

**Note**: For scoped packages in organizations, ensure your NPM token has the appropriate organization permissions.

### NPM Version Management & Unpublishing

#### ⚠️ Unpublishing Limitations
- **72-hour window only**: You can unpublish a version within 72 hours of publishing
- **Dependency restriction**: Cannot unpublish if other packages depend on it
- **No empty packages**: Cannot unpublish the last remaining version of a package
- **After 72 hours**: Versions become permanent and cannot be removed

#### ✅ Recommended Strategy for Development
```bash
# Use alpha tags for iterative development (current approach)
npm publish --tag alpha  # 1.0.0-alpha-0, 1.0.0-alpha-1, etc.

# When ready for production
npm publish --tag latest # 1.0.0

# Later: Deprecate old alphas (not delete)
npm deprecate @sinch-engage/n8n-nodes-sinch-engage@"*alpha*" "Use stable v1.0.0"
```

#### 🔄 Version Iteration Strategy
```bash
# For development iterations (no 72-hour worry)
npm version prerelease --preid=alpha  # Increments: alpha-0, alpha-1, etc.

# For quick fixes during development
npm version prerelease --preid=alpha # Safe iterative development

# When satisfied with stability
npm version patch  # Removes pre-release for GA: 1.0.0
```

## Security Considerations

### NPM Access Tokens
- ✅ Use **Automation** or **Publish** scope tokens
- ✅ Set token expiration if possible
- ✅ Store tokens securely (password manager)
- ❌ Don't commit tokens to Git
- ❌ Don't use account password for automation

### Package Security
- Package is marked as `1.0.0-alpha-0` (pre-release)
- Alpha tag clearly indicates testing/development use
- Update CHANGELOG.md with each release
- Follow semantic versioning for stability

## CI/CD Notes

This deployment process is designed for **local deployment** because:
- NPM tokens are personal and shouldn't be in CI
- Alpha releases need human oversight
- Testing should happen before publishing

For future GA releases, consider:
- Automated testing in CI
- Separate NPM tokens for CI
- Automated publishing for stable releases

## Support

For issues or questions:
1. Check this deployment guide
2. Review the main README.md
3. Check CHANGELOG.md for known issues
4. Create an issue in the repository

---

**Current Status**: `1.0.0-alpha-0` - Ready for testing and development use
