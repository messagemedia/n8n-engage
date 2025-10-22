# MessageMedia Trigger - Example Workflows

## Example 1: Auto-Reply with Keyword Detection

This workflow automatically responds to incoming SMS messages based on keywords.

### Workflow Structure
```
MessageMedia Trigger → IF (keyword check) → Sinch Engage (auto-reply)
```

### Use Cases
- Customer support auto-responses
- Subscription confirmations (SUBSCRIBE/UNSUBSCRIBE)
- Information requests (HELP, INFO)

### Sample Implementation

```json
{
  "nodes": [
    {
      "name": "MessageMedia Trigger",
      "type": "messageMediaTrigger",
      "position": [250, 300],
      "parameters": {
        "eventType": "incomingSms"
      },
      "credentials": {
        "messageMediaApi": "MessageMedia Account"
      }
    },
    {
      "name": "Check Keyword",
      "type": "if",
      "position": [450, 300],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.message.toLowerCase() }}",
              "operation": "contains",
              "value2": "help"
            }
          ]
        }
      }
    },
    {
      "name": "Send Help Response",
      "type": "SinchEngage",
      "position": [650, 250],
      "parameters": {
        "to": "={{ $json.from }}",
        "from": "={{ $json.to }}",
        "message": "Thanks for reaching out! For help, visit our website or call 1-800-HELP. Reply STOP to unsubscribe."
      },
      "credentials": {
        "messageMediaApi": "MessageMedia Account"
      }
    },
    {
      "name": "Send Default Response",
      "type": "SinchEngage",
      "position": [650, 350],
      "parameters": {
        "to": "={{ $json.from }}",
        "from": "={{ $json.to }}",
        "message": "Thank you for your message. We'll get back to you soon! Reply HELP for assistance."
      },
      "credentials": {
        "messageMediaApi": "MessageMedia Account"
      }
    }
  ],
  "connections": {
    "MessageMedia Trigger": {
      "main": [[{"node": "Check Keyword", "type": "main", "index": 0}]]
    },
    "Check Keyword": {
      "main": [
        [{"node": "Send Help Response", "type": "main", "index": 0}],
        [{"node": "Send Default Response", "type": "main", "index": 0}]
      ]
    }
  }
}
```

**Keywords to Handle:**
- `HELP` → Send help information
- `STOP` → Unsubscribe user
- `SUBSCRIBE` → Add to mailing list
- Default → Acknowledge receipt

---

## Example 2: SMS to Database Logger

Log all incoming SMS messages to a database for record-keeping and analysis.

### Workflow Structure
```
MessageMedia Trigger → Set Fields → PostgreSQL Insert
```

### Use Cases
- Customer communication history
- Compliance/audit trails
- Analytics and reporting

### Sample Implementation

```json
{
  "nodes": [
    {
      "name": "MessageMedia Trigger",
      "type": "messageMediaTrigger",
      "position": [250, 300],
      "parameters": {
        "eventType": "incomingSms"
      }
    },
    {
      "name": "Format Data",
      "type": "set",
      "position": [450, 300],
      "parameters": {
        "options": {},
        "values": {
          "string": [
            {
              "name": "message_id",
              "value": "={{ $json.messageId }}"
            },
            {
              "name": "from_number",
              "value": "={{ $json.from }}"
            },
            {
              "name": "to_number",
              "value": "={{ $json.to }}"
            },
            {
              "name": "message_content",
              "value": "={{ $json.message }}"
            },
            {
              "name": "received_at",
              "value": "={{ $json.receivedAt }}"
            },
            {
              "name": "created_at",
              "value": "={{ $now.toISO() }}"
            }
          ]
        }
      }
    },
    {
      "name": "Insert to DB",
      "type": "postgres",
      "position": [650, 300],
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "incoming_sms",
        "columns": "message_id, from_number, to_number, message_content, received_at, created_at",
        "options": {}
      },
      "credentials": {
        "postgres": "PostgreSQL Database"
      }
    }
  ]
}
```

**Database Schema:**
```sql
CREATE TABLE incoming_sms (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  received_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_from_number (from_number),
  INDEX idx_received_at (received_at)
);
```

---

## Example 3: SMS to Email Forwarder

Forward incoming SMS messages to email for centralized monitoring.

### Workflow Structure
```
MessageMedia Trigger → Set → Email Send
```

### Use Cases
- Team notifications
- Customer service alerts
- Personal SMS backup

### Sample Implementation

```json
{
  "nodes": [
    {
      "name": "MessageMedia Trigger",
      "type": "messageMediaTrigger",
      "position": [250, 300],
      "parameters": {
        "eventType": "incomingSms"
      }
    },
    {
      "name": "Format Email",
      "type": "set",
      "position": [450, 300],
      "parameters": {
        "values": {
          "string": [
            {
              "name": "subject",
              "value": "New SMS from {{ $json.from }}"
            },
            {
              "name": "body",
              "value": "You received a new SMS:\n\nFrom: {{ $json.from }}\nTo: {{ $json.to }}\nReceived: {{ $json.receivedAt }}\n\nMessage:\n{{ $json.message }}\n\nMessage ID: {{ $json.messageId }}"
            }
          ]
        }
      }
    },
    {
      "name": "Send Email",
      "type": "emailSend",
      "position": [650, 300],
      "parameters": {
        "toEmail": "support@yourcompany.com",
        "fromEmail": "noreply@yourcompany.com",
        "subject": "={{ $json.subject }}",
        "text": "={{ $json.body }}"
      },
      "credentials": {
        "smtp": "Email Account"
      }
    }
  ]
}
```

---

## Example 4: SMS to Slack Integration

Post incoming SMS messages to a Slack channel for team visibility.

### Workflow Structure
```
MessageMedia Trigger → Slack Post Message
```

### Use Cases
- Team notifications
- Customer inquiries
- Support ticket alerts

### Sample Implementation

```json
{
  "nodes": [
    {
      "name": "MessageMedia Trigger",
      "type": "messageMediaTrigger",
      "position": [250, 300],
      "parameters": {
        "eventType": "incomingSms"
      }
    },
    {
      "name": "Post to Slack",
      "type": "slack",
      "position": [450, 300],
      "parameters": {
        "resource": "message",
        "operation": "post",
        "channel": "#sms-alerts",
        "text": "📱 *New SMS Received*\n\n*From:* {{ $json.from }}\n*To:* {{ $json.to }}\n*Time:* {{ $json.receivedAt }}\n\n*Message:*\n```{{ $json.message }}```\n\n_Message ID: {{ $json.messageId }}_",
        "otherOptions": {
          "username": "SMS Bot",
          "icon_emoji": ":iphone:"
        }
      },
      "credentials": {
        "slackApi": "Slack Workspace"
      }
    }
  ]
}
```

---

## Example 5: Two-Way Conversation Tracker

Track and respond to ongoing SMS conversations.

### Workflow Structure
```
MessageMedia Trigger → Get Conversation History → AI Response → Send SMS + Update DB
```

### Use Cases
- AI chatbot
- Customer support conversations
- Order status inquiries

### Sample Implementation

```json
{
  "nodes": [
    {
      "name": "MessageMedia Trigger",
      "type": "messageMediaTrigger",
      "position": [250, 300],
      "parameters": {
        "eventType": "incomingSms"
      }
    },
    {
      "name": "Get Conversation History",
      "type": "postgres",
      "position": [450, 300],
      "parameters": {
        "operation": "select",
        "schema": "public",
        "table": "conversations",
        "where": {
          "conditions": [
            {
              "column": "phone_number",
              "value": "={{ $json.from }}"
            }
          ]
        },
        "sort": {
          "column": "created_at",
          "direction": "DESC"
        },
        "limit": 10
      }
    },
    {
      "name": "Generate AI Response",
      "type": "openAi",
      "position": [650, 300],
      "parameters": {
        "operation": "create",
        "modelId": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful customer service assistant. Provide brief, friendly responses suitable for SMS."
            },
            {
              "role": "user",
              "content": "{{ $json.message }}"
            }
          ]
        }
      }
    },
    {
      "name": "Send Response",
      "type": "SinchEngage",
      "position": [850, 250],
      "parameters": {
        "to": "={{ $('MessageMedia Trigger').item.json.from }}",
        "from": "={{ $('MessageMedia Trigger').item.json.to }}",
        "message": "={{ $json.choices[0].message.content }}"
      }
    },
    {
      "name": "Log Conversation",
      "type": "postgres",
      "position": [850, 350],
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "conversations",
        "columns": "phone_number, direction, message, timestamp",
        "values": {
          "phone_number": "={{ $('MessageMedia Trigger').item.json.from }}",
          "direction": "inbound",
          "message": "={{ $('MessageMedia Trigger').item.json.message }}",
          "timestamp": "={{ $('MessageMedia Trigger').item.json.receivedAt }}"
        }
      }
    }
  ]
}
```

---

## Tips for Building Workflows

### 1. Access Previous Node Data

Use n8n expressions to reference data from the MessageMedia Trigger:

```javascript
// Current message
{{ $json.message }}

// Sender's number
{{ $json.from }}

// Reply to sender
{{ $json.from }} // Use this as 'to' field

// Message ID for tracking
{{ $json.messageId }}
```

### 2. Error Handling

Add an Error Trigger node to catch failed executions:

```json
{
  "name": "Error Handler",
  "type": "errorTrigger",
  "parameters": {},
  "position": [650, 450]
}
```

### 3. Rate Limiting

Use the Wait node to avoid overwhelming downstream systems:

```json
{
  "name": "Rate Limit",
  "type": "wait",
  "parameters": {
    "amount": 1,
    "unit": "seconds"
  }
}
```

### 4. Message Validation

Filter unwanted messages early:

```json
{
  "name": "Filter Spam",
  "type": "if",
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ !$json.message.match(/viagra|casino|winner/i) }}",
          "value2": true
        }
      ]
    }
  }
}
```

### 5. Environment Variables

Use n8n environment variables for configuration:

```javascript
// Set in n8n settings or .env
N8N_SUPPORT_EMAIL=support@company.com
N8N_SMS_KEYWORD_HELP=HELP

// Reference in workflows
{{ $env.N8N_SUPPORT_EMAIL }}
```

---

## Testing Your Workflows

### 1. Manual Testing

1. Activate your workflow
2. Send a test SMS to your MessageMedia number
3. Check workflow execution in n8n
4. Verify output in downstream systems

### 2. Use Test Messages

Create test SMS messages with various content:

```
"HELP" - Test keyword detection
"This is a very long message to test truncation..." - Test long messages
"Order #12345 status" - Test order processing
"😀 emoji test 🎉" - Test emoji handling
```

### 3. Monitor Execution Logs

Check n8n execution logs for:
- Input data structure
- Node outputs
- Error messages
- Execution time

---

## Common Patterns

### Pattern: Message Classification

```
Trigger → Switch (keyword) → [Multiple branches based on keywords]
```

### Pattern: Async Processing

```
Trigger → Queue → [Background processing workflow]
```

### Pattern: Multi-Channel Response

```
Trigger → [SMS Response + Email + Slack notification]
```

### Pattern: Human Handoff

```
Trigger → AI Response → IF (complex) → [Notify human agent]
```

---

For more examples and community workflows, visit the [n8n community forum](https://community.n8n.io/).
