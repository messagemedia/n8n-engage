#!/bin/bash

# n8n-nodes-sinch-engage NPM Deployment Script
# This script publishes the package to NPM using your personal access token

set -e

echo "🚀 n8n-nodes-sinch-engage NPM Deployment"
echo "========================================"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run from project root."
    exit 1
fi

# Validate package name against expected development or production variants
PACKAGE_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
EXPECTED_DEV_NAME="n8n-nodes-sinch-engage-dev"
EXPECTED_ALT_DEV_NAME="na10-nodes-sinch-engage-dev" # legacy documented name
EXPECTED_PROD_NAME="@sinch-engage/n8n-nodes-sinch-engage"

if [[ "$PACKAGE_NAME" != "$EXPECTED_DEV_NAME" && "$PACKAGE_NAME" != "$EXPECTED_ALT_DEV_NAME" && "$PACKAGE_NAME" != "$EXPECTED_PROD_NAME" ]]; then
    echo "❌ Error: Unexpected package name '$PACKAGE_NAME'." >&2
    echo "   Acceptable names: $EXPECTED_DEV_NAME | $EXPECTED_ALT_DEV_NAME | $EXPECTED_PROD_NAME" >&2
    echo "   Update package.json 'name' or adjust script expectations before deploying." >&2
    exit 1
fi

# Check if package is built
if [[ ! -d "dist" ]]; then
    echo "📦 Building package..."
    npm run build
fi

# Function to prompt for NPM token
get_npm_token() {
    # If already logged in (npm whoami succeeds), skip token prompt
    if npm whoami >/dev/null 2>&1; then
        echo "🔐 Using existing npm authentication: $(npm whoami)"
        return 0
    fi
    if [[ -z "$NPM_TOKEN" ]]; then
        echo ""
        echo "🔑 NPM Authentication Required"
        echo "------------------------------"
        echo "You need an NPM access token with publish permissions."
        echo "Get your token from: https://www.npmjs.com/settings/tokens"
        echo ""
        read -p "Enter your NPM access token: " NPM_TOKEN

        if [[ -z "$NPM_TOKEN" ]]; then
            echo "❌ Error: NPM token is required"
            exit 1
        fi
    fi
}

# Function to configure NPM
setup_npm() {
    echo ""
    echo "🔧 Configuring NPM..."
    # Only set auth token if not already logged-in
    if ! npm whoami >/dev/null 2>&1; then
        echo "Setting NPM token..."
        npm config set //registry.npmjs.org/:_authToken "$NPM_TOKEN"
    else
        echo "Already authenticated as $(npm whoami). Skipping token config."
    fi

    # Verify NPM is configured
    echo "Verifying NPM configuration..."
    npm whoami
}

# Function to publish package
publish_package() {
    echo ""
    echo "📤 Publishing to NPM..."
    echo "Package: $(grep '"name"' package.json | cut -d'"' -f4)"
    echo "Version: $(grep '"version"' package.json | cut -d'"' -f4)"
    echo "Registry: https://registry.npmjs.org/"
    echo ""

    # Confirm before publishing
    read -p "Ready to publish? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Publishing cancelled"
        exit 0
    fi

    # Publish with alpha tag
    npm publish --tag alpha --access public

    if [[ $? -eq 0 ]]; then
        echo ""
        echo "✅ Successfully published!"
        echo ""
        echo "📦 Package Details:"
        PACKAGE_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
        PACKAGE_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
        echo "   Name: $PACKAGE_NAME"
        echo "   Version: $PACKAGE_VERSION"
        echo "   NPM URL: https://www.npmjs.com/package/$PACKAGE_NAME"
        echo ""
        echo "🔗 Installation (for testing):"
        echo "   npm install $PACKAGE_NAME@alpha"
        echo ""
        echo "🎯 Next Steps:"
        echo "   1. Test the package in a development n8n instance"
        echo "   2. Update CHANGELOG.md for the next release"
        echo "   3. Create a new version for beta/GA when ready"
    else
        echo ""
        echo "❌ Publishing failed!"
        echo "Check the error messages above and try again."
        exit 1
    fi
}

# Main execution
echo "Current package info:"
PACKAGE_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
PACKAGE_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
echo "  Name: $PACKAGE_NAME"
echo "  Version: $PACKAGE_VERSION"
echo "  Note: Using temporary development package name"
echo ""

get_npm_token
setup_npm
publish_package

echo ""
echo "🎉 Deployment complete!"
