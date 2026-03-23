# n8n-nodes-sinch-engage

Community node for n8n to send SMS via Sinch Engage with a clean, focused interface.

## Installation

1. In your n8n instance, go to **Settings > Community Nodes**
2. Click **Install a community node**
3. Enter: `@sinch-engage/n8n-nodes-sinch-engage`
4. Click **Install**

**Compatibility**: Requires n8n version 1.0.0 or later.

## ✨ Features
- **Sinch Engage SMS integration** - SMS provider with global reach `https://sinch.com/engage/`
- **Clean, simple UI** - No complex provider selection or credential confusion
- **Optional sender number** - Uses default account number if "From" field is blank
- **Phone number normalization** to E.164 format and encoding detection (GSM7 vs UCS-2)
- **Robust error handling** and validation

## 🎯 Node Configuration

### Basic Information
- **Display Name**: Sinch Engage
- **Name**: `SinchEngage`
- **Group**: `output`
- **Inputs**: `main`
- **Outputs**: `main`

### Field Structure

The node provides a clean, focused interface with logical field organization:

#### 1. **Sinch Engage API Credentials**
- **Required**: Sinch Engage API Key and Secret
- **Single credential field** - No confusion about which credentials to use

#### 2. **Message Details**
- **To** (required) - Destination phone number in E.164 format
- **From** (optional) - Sender phone number (uses default account number if blank)
- **Message** (required, up to 1600 characters) - SMS content

#### 3. **Additional Fields**
- **Status Callback URL** - Webhook URL for delivery status updates
- **Encoding**: auto | GSM7 | UCS-2 (auto-detects by default)

## 🔐 Credentials

### Sinch Engage API
- `apiKey` - Your Sinch Engage API Key
- `apiSecret` - Your Sinch Engage API Secret

## 📱 Sinch Engage Integration

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
- ✅ Sinch Engage uses default account number
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
      "type": "@sinch-engage/n8n-nodes-sinch-engage.sinchEngage",
      "typeVersion": 1,
      "name": "Sinch Engage SMS Sender"
    }
  ]
}
```

## 🛠️ Troubleshooting

### Common Issues
- **401/403**: Check Sinch Engage API credentials and permissions
- **Invalid numbers**: Ensure E.164 format like `+61437536808`
- **Missing "From"**: Node automatically uses default account number

### Phone Number Format
- **Required**: E.164 international format (e.g., `+61437536808`)
- **Not supported**: Local formats like `0437536808` (must include country code)
- **Validation**: Node automatically normalizes and validates numbers

## 🔧 Technical Details

### Sinch Engage API Integration
- **Endpoint**: `https://api.messagemedia.com/v1/messages`
- **Authentication**: Basic auth with API Key/Secret
- **Request Format**: JSON with messages array
- **Response**: Includes message_id, status, and delivery information

### Phone Number Handling
- **E.164 normalization** for consistent formatting
- **Encoding detection** (GSM7 vs UCS-2) for optimal delivery
- **Validation** with helpful error messages

## 📦 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Release Channels

This package follows semantic versioning with pre-release tags:

- **Alpha** (`1.x.x-alpha.x`) - Internal testing and development builds
  - Experimental features and breaking changes
  - For team testing in isolated n8n instances
  - Install: `npm install @sinch-engage/n8n-nodes-sinch-engage@alpha`

- **Beta** (`1.x.x-beta.x`) - Public preview releases
  - Feature-complete but undergoing final testing
  - Safe for non-production workflows
  - Install: `npm install @sinch-engage/n8n-nodes-sinch-engage@beta`

- **General Availability** (`1.x.x`) - Production-ready releases
  - Stable, fully tested, and verified by n8n
  - Recommended for production use
  - Install: `npm install @sinch-engage/n8n-nodes-sinch-engage` (latest stable)

**Current Version**: `1.0.0-alpha.14` - Alpha testing phase

### Version Strategy
- **Major** (x.0.0): Breaking changes, major feature overhauls
- **Minor** (1.x.0): New features, non-breaking enhancements
- **Patch** (1.0.x): Bug fixes, documentation updates
- **Pre-release**: `-alpha.x`, `-beta.x`, `-rc.x` for testing phases

## 🤝 Contributing

This is a community node for n8n, focused on providing a clean, reliable Sinch Engage SMS integration. Feel free to contribute improvements, bug fixes, or enhancements!

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Sinch Engage Website**: [https://sinch.com/engage/](https://sinch.com/engage)
- **Sinch Engage API Documentation**: [https://messagemedia.github.io/documentation/](https://messagemedia.github.io/documentation/)
- **n8n Community Nodes**: [https://n8n.io/community/nodes/](https://n8n.io/community/nodes/)