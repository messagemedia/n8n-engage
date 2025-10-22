#!/bin/bash

# NPM Package Unpublishing Script
# Safely unpublishes the development package after testing

set -e

echo "🗑️  NPM Package Unpublishing"
echo "=============================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the n8n-engage project root directory"
    exit 1
fi

PACKAGE_NAME=$(grep '"name"' package.json | cut -d'"' -f4)
PACKAGE_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)

echo "Package to unpublish:"
echo "  Name: $PACKAGE_NAME"
echo "  Version: $PACKAGE_VERSION"
echo ""

# Check package info before unpublishing
echo "🔍 Checking package status..."
npm view "$PACKAGE_NAME@$PACKAGE_VERSION" --json || {
    echo "❌ Package/version not found on NPM"
    echo "This might already be unpublished or never published"
    exit 1
}

# Check if other packages depend on it
echo "🔍 Checking for dependencies..."
DEPENDENTS=$(npm view "$PACKAGE_NAME@$PACKAGE_VERSION" dependents 2>/dev/null || echo "")

if [[ -n "$DEPENDENTS" ]]; then
    echo "❌ Cannot unpublish: Other packages depend on this version"
    echo "Dependents: $DEPENDENTS"
    echo ""
    echo "💡 Alternative: Deprecate instead"
    echo "   npm deprecate $PACKAGE_NAME@$PACKAGE_VERSION \"Superseded by @sinch-engage/n8n-nodes-sinch-engage\""
    exit 1
fi

# Check download stats (for > 72 hour packages)
echo "📊 Checking download statistics..."
DOWNLOADS=$(npm view "$PACKAGE_NAME" downloads.last-week 2>/dev/null || echo "0")

if [[ "$DOWNLOADS" -gt 300 ]]; then
    echo "❌ Cannot unpublish: Package has $DOWNLOADS downloads in the last week (limit: 300)"
    exit 1
fi

# Check if it's a single maintainer
echo "👤 Checking maintainers..."
MAINTAINERS=$(npm view "$PACKAGE_NAME" maintainers 2>/dev/null | jq -r '.[]? | select(.name != null) | .name' | wc -l)

if [[ "$MAINTAINERS" -gt 1 ]]; then
    echo "❌ Cannot unpublish: Package has $MAINTAINERS maintainers (must be single maintainer)"
    exit 1
fi

echo "✅ Unpublish conditions met!"
echo "   - No dependencies: ✓"
echo "   - Downloads: $DOWNLOADS (limit: 300): ✓"
echo "   - Maintainers: $MAINTAINERS (limit: 1): ✓"
echo ""

# Confirm unpublishing
read -p "⚠️  Are you sure you want to unpublish $PACKAGE_NAME@$PACKAGE_VERSION? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Unpublishing cancelled"
    exit 0
fi

# Unpublish the package
echo "🗑️  Unpublishing package..."
npm unpublish "$PACKAGE_NAME@$PACKAGE_VERSION"

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ Successfully unpublished!"
    echo ""
    echo "📦 Package Details:"
    echo "   Name: $PACKAGE_NAME"
    echo "   Version: $PACKAGE_VERSION"
    echo "   Status: Unpublished"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Update package.json name to @sinch-engage/n8n-nodes-sinch-engage"
    echo "   2. Update version for production release"
    echo "   3. Deploy to Sinch Engage organization"
    echo "   4. Update deployment script for organization scope"
else
    echo ""
    echo "❌ Unpublishing failed!"
    echo "Check the error messages above."
    exit 1
fi

echo ""
echo "🎉 Unpublishing complete!"
