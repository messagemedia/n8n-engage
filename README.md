# n8n-nodes-sms-sender

Community node for n8n to send SMS via MessageMedia with a clean, focused interface.

## ✨ Features
- **MessageMedia SMS integration** - SMS provider with global reach `https://messagemedia.com`
- **Clean, simple UI** - No complex provider selection or credential confusion
- **Optional sender number** - Uses default account number if "From" field is blank
- **Phone number normalization** to E.164 format and encoding detection (GSM7 vs UCS-2)
- **Test mode** (stub endpoint) and sandbox dry-run
- **Rate limiting** between messages
- **Robust error handling** and validation

## 🚀 Install

### Option 1: n8n Community Nodes (Recommended)
1. In n8n, go to **Settings** → **Community Nodes** → **Install**
2. Enter: `n8n-nodes-sms-sender`
3. Click **Install**

### Option 2: npm CLI
```bash
npm i n8n-nodes-sms-sender
```

## 🎯 Node Configuration

### Basic Information
- **Display Name**: MessageMedia SMS Sender
- **Name**: `SinchEngage`
- **Group**: `transform`
- **Inputs**: `main`
- **Outputs**: `main`

### Field Structure

The node provides a clean, focused interface with logical field organization:

#### 1. **MessageMedia API Credentials**
- **Required**: MessageMedia API Key and Secret
- **Single credential field** - No confusion about which credentials to use

#### 2. **Message Details**
- **To** (required) - Destination phone number in E.164 format
- **From** (optional) - Sender phone number (uses default account number if blank)
- **Message** (required, up to 1600 characters) - SMS content

#### 3. **Operation Modes**
- **Use Sandbox** - Dry run mode, no external calls, simulated success
- **Test Mode** - Redirects to `https://httpbin.org/post` for testing

#### 4. **Additional Fields**
- **Status Callback URL** - Webhook URL for delivery status updates
- **Encoding**: auto | GSM7 | UCS-2 (auto-detects by default)
- **Rate Limit (ms)** - Delay between messages
- **Fail if Undeliverable** (default: true) - Throw error if validation fails
- **Return Raw** (default: false) - Include provider response in output

## 🔐 Credentials

### MessageMedia API
- `apiKey` - Your MessageMedia API Key
- `apiSecret` - Your MessageMedia API Secret

## 📱 MessageMedia Integration

### API Endpoint
- **URL**: `POST https://api.messagemedia.com/v1/messages`
- **Auth**: Basic (API Key / Secret)
- **Body**: `{ messages: [ { content, destination_number, source_number } ] }`

### Field Mapping
- **`to`** → **`destination_number`** (required)
- **`message`** → **`content`** (required)
- **`from`** → **`source_number`** (optional - uses default account number if blank)

### Features
- **Australian focus** with global SMS capabilities
- **Optional source number** - automatically uses account default if not specified
- **Delivery reports** via webhook callbacks
- **Rich media support** (MMS capabilities)

## 🔄 Field Behavior

### When "From" field is provided:
- ✅ Sender number is included in API request
- ✅ Uses the specified number as source

### When "From" field is blank:
- ✅ No source_number sent to API
- ✅ MessageMedia uses default account number
- ✅ Ideal for single-account setups

## 📋 Example Workflow

```json
{
  "nodes": [
    {
      "parameters": {
        "to": "+61437536808",
        "message": "Hello from n8n!",
        "additionalFields": {
          "statusCallbackUrl": "https://your-webhook.com/sms-status"
        }
      },
      "type": "n8n-nodes-sms-sender.SinchEngage",
      "typeVersion": 1,
      "name": "MessageMedia SMS Sender"
    }
  ]
}
```

## 🧪 Testing

### Local Testing
```bash
npm test
```

### n8n Testing
1. **Sandbox Mode**: Returns simulated success without external calls
2. **Test Mode**: Redirects to `httpbin.org` for HTTP testing
3. **Live Mode**: Sends actual SMS via MessageMedia API

### Build Verification

Before publishing or deploying, verify the package artifacts:

```bash
# Install dependencies (Node.js 20 required)
nvm use 20
npm ci

# Build and verify compilation
npm run build

# Create a test package tarball
npm pack

# Inspect tarball contents
tar -tzf n8n-nodes-sms-sender-*.tgz

# Verify key artifacts are present:
# - dist/nodes/SinchEngage/*.js
# - dist/credentials/*.js
# - dist/nodes/SinchEngage/sinch-logo.png
# - package.json, README.md, LICENSE
```

**Expected tarball contents:**
- Compiled JavaScript + TypeScript declarations (`.js`, `.d.ts`)
- Icon assets (`sinch-logo.png`)
- Essential docs (`README.md`, `LICENSE`, `CHANGELOG.md`)
- No source TypeScript files (`.ts`)
- No `node_modules` or dev dependencies

## 🛠️ Development

### Running Locally
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run tests
npm test

# Watch mode for tests
npm run dev:test
```

### Code Quality
This project uses ESLint with TypeScript support to maintain code quality and consistency:
- **Configuration**: `.eslintrc.json` with `@typescript-eslint/parser`
- **Standards**: TypeScript recommended rules + Prettier integration
- **Enforcement**: CI/CD pipeline enforces zero warnings (`--max-warnings=0`)

### Contributing
Before submitting a pull request:
1. Run `npm run lint` to check for linting issues
2. Run `npm run lint:fix` to automatically fix common issues
3. Run `npm test` to ensure all tests pass
4. Run `npm run build` to verify the build completes successfully

## 🛠️ Troubleshooting

### Common Issues
- **401/403**: Check MessageMedia API credentials and permissions
- **Invalid numbers**: Ensure E.164 format like `+61437536808`
- **Sandbox vs Test Mode**: 
  - **Sandbox**: Returns fake success without any HTTP call
  - **Test Mode**: Calls stub endpoint (`httpbin.org`)
- **Missing "From"**: Node automatically uses default account number

### Phone Number Format
- **Required**: E.164 international format (e.g., `+61437536808`)
- **Not supported**: Local formats like `0437536808` (must include country code)
- **Validation**: Node automatically normalizes and validates numbers

## 🔧 Technical Details

### MessageMedia API Integration
- **Endpoint**: `https://api.messagemedia.com/v1/messages`
- **Authentication**: Basic auth with API Key/Secret
- **Request Format**: JSON with messages array
- **Response**: Includes message_id, status, and delivery information

### Phone Number Handling
- **E.164 normalization** for consistent formatting
- **Encoding detection** (GSM7 vs UCS-2) for optimal delivery
- **Validation** with helpful error messages

### Rate Limiting
- **Configurable delays** between messages
- **Prevents API throttling** and improves delivery success
- **Millisecond precision** for fine-grained control

## 📦 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Release Channels

This package follows semantic versioning with pre-release tags:

- **Alpha** (`1.x.x-alpha.x`) - Internal testing and development builds
  - Experimental features and breaking changes
  - For team testing in isolated n8n instances
  - Install: `npm install n8n-nodes-sms-sender@alpha`
  
- **Beta** (`1.x.x-beta.x`) - Public preview releases
  - Feature-complete but undergoing final testing
  - Safe for non-production workflows
  - Install: `npm install n8n-nodes-sms-sender@beta`
  
- **General Availability** (`1.x.x`) - Production-ready releases
  - Stable, fully tested, and verified by n8n
  - Recommended for production use
  - Install: `npm install n8n-nodes-sms-sender` (latest stable)

**Current Version**: `1.1.0-alpha.0` - Alpha testing phase

### Version Strategy
- **Major** (x.0.0): Breaking changes, major feature overhauls
- **Minor** (1.x.0): New features, non-breaking enhancements
- **Patch** (1.0.x): Bug fixes, documentation updates
- **Pre-release**: `-alpha.x`, `-beta.x`, `-rc.x` for testing phases

## 🤝 Contributing

This is a community node for n8n, focused on providing a clean, reliable MessageMedia SMS integration. Feel free to contribute improvements, bug fixes, or enhancements!

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **MessageMedia Website**: [https://messagemedia.com](https://messagemedia.com)
- **MessageMedia API Documentation**: [https://messagemedia.github.io/documentation/](https://messagemedia.github.io/documentation/)
- **n8n Community Nodes**: [https://n8n.io/community/nodes/](https://n8n.io/community/nodes/)