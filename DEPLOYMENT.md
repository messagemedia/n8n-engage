# Deployment Guide: n8n-nodes-sinch-engage

This guide explains how to deploy the n8n Sinch Engage SMS node using a two-phase approach:
1. **Development Phase**: Deploy to personal account with unique name for testing
2. **Production Phase**: Deploy to Sinch Engage organization with final name

## Overview

The deployment process uses a two-phase approach:

### Phase 1: Development (Personal Account)
- Deploy to personal NPM account with unique development name
- Test and iterate freely without organization constraints
- Unpublish development versions when ready for production

### Phase 2: Production (Organization)
- Deploy to `@sinch-engage` organization with final name
- Use stable version numbers (no alpha)
- Permanent deployment for production use

### Available Scripts
- `deploy-to-npm.sh` - Publishes current package (development or production)
- `unpublish-dev-package.sh` - Safely unpublishes development versions

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

## Two-Phase Deployment Process

### Phase 1: Development Deployment

**Current Status**: Ready for development deployment with unique package name

```bash
# Navigate to project root
cd /path/to/connectors/n8n/n8n-engage

# Deploy to personal account for testing
./deploy-to-npm.sh
```

**Current Package Configuration:**
- Name: `na10-nodes-sinch-engage-dev` (unique development name)
- Version: `1.0.0-alpha-0`
- Scope: Personal account (unscoped)

**What happens:**
1. 🔍 Verifies development package name
2. 🔨 Builds the package if needed
3. 🔑 Prompts for personal NPM access token
4. 📤 Publishes to `na10-nodes-sinch-engage-dev@alpha`
5. ✅ Provides testing instructions

### Phase 2: Production Deployment

**When ready for production:**

```bash
# 1. Update package.json for organization scope
# Change name to: "@sinch-engage/n8n-nodes-sinch-engage"
# Update version to: "1.0.0" (remove alpha)

# 2. Unpublish development version
./unpublish-dev-package.sh

# 3. Deploy to organization
./deploy-to-npm.sh
```

**Production Package Configuration:**
- Name: `@sinch-engage/n8n-nodes-sinch-engage` (organization scope)
- Version: `1.0.0` (stable release)
- Scope: Sinch Engage organization

### Manual Development Deployment

For development phase:

```bash
# 1. Build the package
npm run build

# 2. Login to NPM (if not already logged in)
npm login

# 3. Publish development version
npm publish --tag alpha
```

### Manual Unpublishing (Development Cleanup)

For cleaning up development versions:

```bash
# Check if package can be unpublished
npm view na10-nodes-sinch-engage-dev

# Unpublish specific version (within 72 hours or if conditions met)
npm unpublish na10-nodes-sinch-engage-dev@1.0.0-alpha-0

# Or use the unpublish script (safer)
./unpublish-dev-package.sh
```

### Manual Production Deployment

For production phase:

```bash
# 1. Update package.json for organization scope
# 2. Build and test locally
npm run build && npm test

# 3. Publish to organization
npm publish --tag latest
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

### 1. Verify Publication (Development)
```bash
# Check if development package is published
npm view na10-nodes-sinch-engage-dev versions --json

# View development package info
npm view na10-nodes-sinch-engage-dev
```

### 2. Test Installation (Development)
```bash
# Install the development version for testing
npm install na10-nodes-sinch-engage-dev@alpha

# Or install in n8n for testing
# In n8n: Settings → Community Nodes → Install
# Enter: na10-nodes-sinch-engage-dev
```

### 3. Test in n8n
1. **Install in n8n**: Use the Community Nodes interface
2. **Configure Credentials**: Add Sinch Engage API credentials
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
- Check correct package name spelling (`na10-nodes-sinch-engage-dev`)
- Verify alpha tag: `npm view na10-nodes-sinch-engage-dev dist-tags`

### Getting Help
- Check NPM status: https://status.npmjs.org/
- NPM support: https://www.npmjs.com/support
- Development package: https://www.npmjs.com/package/na10-nodes-sinch-engage-dev
- Production package: https://www.npmjs.com/package/@sinch-engage/n8n-nodes-sinch-engage

## Version Management

### Two-Phase Release Strategy

#### Phase 1: Development (Personal Account)
- **Package**: `na10-nodes-sinch-engage-dev`
- **Versions**: `1.0.0-alpha-x` (iterative development)
- **Scope**: Personal account (unscoped)
- **Cleanup**: Unpublish when ready for production

#### Phase 2: Production (Organization)
- **Package**: `@sinch-engage/n8n-nodes-sinch-engage`
- **Versions**: `1.0.0`, `1.1.0`, etc. (semantic versioning)
- **Scope**: Sinch Engage organization
- **Stability**: Production ready, permanent

### Version Commands

```bash
# Development iterations (current phase)
npm version prerelease --preid=alpha  # 1.0.0-alpha-1, alpha-2, etc.

# For production release
npm version patch  # 1.0.0 (removes pre-release)

# Check current version
npm version
```

### Unpublishing Development Versions

```bash
# Check if unpublishing is possible
./unpublish-dev-package.sh

# Manual unpublishing (if script doesn't work)
npm unpublish na10-nodes-sinch-engage-dev@1.0.0-alpha-0
```

**Note**: For organization-scoped packages, ensure your NPM token has the appropriate Sinch Engage organization permissions.

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

**Current Status**: `na10-nodes-sinch-engage-dev@1.0.0-alpha-0` - Ready for development testing in personal account

**Next Phase**: Production deployment to `@sinch-engage/n8n-nodes-sinch-engage@1.0.0`
