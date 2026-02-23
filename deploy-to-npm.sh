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
PACKAGE_NAME=$(grep '"name"' package.json | head -1 | cut -d'"' -f4)
EXPECTED_DEV_NAME="n8n-nodes-sinch-engage-dev"
EXPECTED_ALT_DEV_NAME="na10-nodes-sinch-engage-dev" # legacy documented name
EXPECTED_PROD_NAME="@sinch-engage/n8n-nodes-sinch-engage"

if [[ "$PACKAGE_NAME" != "$EXPECTED_DEV_NAME" && "$PACKAGE_NAME" != "$EXPECTED_ALT_DEV_NAME" && "$PACKAGE_NAME" != "$EXPECTED_PROD_NAME" ]]; then
    echo "❌ Error: Unexpected package name '$PACKAGE_NAME'." >&2
    echo "   Acceptable names: $EXPECTED_DEV_NAME | $EXPECTED_ALT_DEV_NAME | $EXPECTED_PROD_NAME" >&2
    echo "   Update package.json 'name' or adjust script expectations before deploying." >&2
    exit 1
fi

# Auto-bump alpha version if the latest published alpha is older than 24 hours
check_and_bump_alpha() {
    local pkg_name="$1"
    local local_version
    local_version=$(grep '"version"' package.json | cut -d'"' -f4)

    echo "🔍 Checking latest alpha version on npm..."
    local npm_info
    npm_info=$(npm view "$pkg_name" --json 2>/dev/null) || true

    if [[ -z "$npm_info" || "$npm_info" == *"E404"* ]]; then
        echo "   Package not yet published on npm. Using local version $local_version."
        return 0
    fi

    # Find the latest alpha version by scanning all published version strings
    local latest_alpha
    latest_alpha=$(echo "$npm_info" | grep -o '"[0-9]*\.[0-9]*\.[0-9]*-alpha-[0-9]*"' | tr -d '"' | sort -t- -k3 -n | tail -1)

    if [[ -z "$latest_alpha" ]]; then
        echo "   No alpha versions found on npm. Using local version $local_version."
        return 0
    fi

    # Get the publish time for that version
    local publish_time
    publish_time=$(npm view "$pkg_name" time --json 2>/dev/null | grep "\"$latest_alpha\"" | grep -o '"[^"]*"$' | tr -d '"')

    if [[ -z "$publish_time" ]]; then
        echo "   Could not determine publish time. Using local version $local_version."
        return 0
    fi

    # Calculate age in seconds
    local publish_epoch now_epoch age_seconds age_hours
    if date --version >/dev/null 2>&1; then
        # GNU date
        publish_epoch=$(date -d "$publish_time" +%s)
    else
        # macOS date
        publish_epoch=$(date -jf "%Y-%m-%dT%H:%M:%S" "${publish_time%%.*}" +%s 2>/dev/null || date -jf "%Y-%m-%dT%T%z" "$publish_time" +%s 2>/dev/null || echo "0")
    fi
    now_epoch=$(date +%s)
    age_seconds=$((now_epoch - publish_epoch))
    age_hours=$((age_seconds / 3600))

    echo "   Latest alpha on npm: $latest_alpha (published ${age_hours}h ago)"
    echo "   Local version:       $local_version"

    if [[ "$local_version" == "$latest_alpha" && $age_seconds -gt 86400 ]]; then
        # Same version as npm and older than 24h — bump the alpha number
        local base alpha_num new_alpha_num new_version
        base=$(echo "$local_version" | sed 's/-alpha-[0-9]*//')
        alpha_num=$(echo "$local_version" | grep -o 'alpha-[0-9]*' | grep -o '[0-9]*')
        new_alpha_num=$((alpha_num + 1))
        new_version="${base}-alpha-${new_alpha_num}"

        echo "   Auto-bumping version to $new_version (last publish was >24h ago)"
        sed -i.bak "s/\"version\": \"$local_version\"/\"version\": \"$new_version\"/" package.json && rm -f package.json.bak
        PACKAGE_VERSION="$new_version"
    elif [[ "$local_version" == "$latest_alpha" ]]; then
        echo "   ⚠️  Local version matches npm alpha but was published <24h ago."
        echo "   Bump the version in package.json manually or re-run later."
        exit 1
    fi
}

check_and_bump_alpha "$PACKAGE_NAME"

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
        PACKAGE_NAME=$(grep '"name"' package.json | head -1 | cut -d'"' -f4)
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
PACKAGE_NAME=$(grep '"name"' package.json | head -1 | cut -d'"' -f4)
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
