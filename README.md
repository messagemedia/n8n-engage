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
- **Name**: `smsSender`
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
      "type": "n8n-nodes-sms-sender.smsSender",
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

- **1.0.32** - Sender Dropdown
- **1.0.31** - Initial release

## 🤝 Contributing

This is a community node for n8n, focused on providing a clean, reliable MessageMedia SMS integration. Feel free to contribute improvements, bug fixes, or enhancements!

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **MessageMedia Website**: [https://messagemedia.com](https://messagemedia.com)
- **MessageMedia API Documentation**: [https://messagemedia.github.io/documentation/](https://messagemedia.github.io/documentation/)
- **n8n Community Nodes**: [https://n8n.io/community/nodes/](https://n8n.io/community/nodes/)