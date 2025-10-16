# Local Development Setup for n8n Custom Node

This guide will help you set up a local n8n instance to test and develop the n8n-engage custom node.

## Prerequisites

- Docker and Docker Compose installed
- Node.js v18.16.1 or higher
- npm v9.5.1 or higher

## Directory Structure

You should have two separate repositories:

```
n8n/
├── n8n-docker/          # Docker setup for n8n instance
│   ├── docker-compose.yml
│   └── n8n_data/
└── n8n-engage/          # This custom node repository
    ├── src/
    ├── dist/
    └── package.json
```

## Initial Setup

### 1. Set Up the n8n Docker Instance

Navigate to your `n8n-docker` directory and create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - GENERIC_TIMEZONE=Australia/Melbourne  # or your local timezone
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=supersecret
      - N8N_ENCRYPTION_KEY=localDevKey123
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - WEBHOOK_URL=http://localhost:5678/
      - N8N_SECURE_COOKIE=false  # needed if using Safari
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ../n8n-engage:/custom/n8n-engage
```

**Important Notes:**
- The volume `../n8n-engage:/custom/n8n-engage` mounts your custom node code into the container
- `N8N_SECURE_COOKIE=false` is required for local development, especially with Safari
- Adjust the relative path `../n8n-engage` if your directory structure is different

### 2. Install Dependencies in n8n-engage

```bash
cd n8n-engage
npm install
npm run build
```

### 3. Start n8n

```bash
cd n8n-docker
docker-compose up -d
```

### 4. Link the Custom Node Inside the Container

This is the **critical step** - you must link the package inside the Docker container, not on your host machine:

```bash
# Create a global npm link for the custom node inside the container
docker-compose exec -u root n8n sh -c "cd /custom/n8n-engage && npm link"

# Create the custom directory if it doesn't exist
docker-compose exec -u node n8n mkdir -p /home/node/.n8n/custom

# Link the package into n8n's custom directory
docker-compose exec -u node n8n sh -c "cd /home/node/.n8n/custom && npm link n8n-nodes-sms-sender"
```

### 5. Restart n8n

```bash
docker-compose restart
```

### 6. Access n8n

Open your browser and navigate to:
- **URL**: http://localhost:5678
- **Username**: admin
- **Password**: supersecret

**Important**: Use `localhost`, not `127.0.0.1`, especially if using Safari.

## Verifying the Installation

1. In the n8n UI, click the **"+" button** to add a new node
2. Search for **"SMS"** or **"Message Media"**
3. You should see the **"SMS Sender"** node in the list
4. You can also check Settings → Community Nodes to see installed custom nodes

### Troubleshooting Verification

To verify the node is properly linked inside the container:

```bash
# Check if the symlink exists
docker-compose exec n8n ls -la /home/node/.n8n/custom/node_modules/

# Verify the node file is accessible
docker-compose exec n8n find /home/node/.n8n/custom -follow -type f -name "*.node.js"

# Check n8n logs for any errors
docker-compose logs n8n --tail=50
```

## Development Workflow

### Making Changes to the Custom Node

When you modify the source code in `n8n-engage`:

```bash
# 1. Rebuild the TypeScript code
cd n8n-engage
npm run build

# 2. Restart n8n to load the changes
cd ../n8n-docker
docker-compose restart

# 3. Wait a few seconds, then refresh your browser
```

The npm link ensures your changes are reflected immediately without needing to reinstall the package!

### Running Tests

```bash
cd n8n-engage
npm test              # Run all tests
npm run dev:test      # Run tests in watch mode
```

### Linting

```bash
cd n8n-engage
npm run lint
```

## Common Issues

### Issue: Custom node not appearing in n8n

**Solution**: Verify the symlink is working:
```bash
docker-compose exec n8n cat /home/node/.n8n/custom/node_modules/n8n-nodes-sms-sender/package.json
```

If this fails, repeat steps 4-5 in the Initial Setup.

### Issue: "Cannot find module" errors

**Solution**: Clean and reinstall dependencies:
```bash
cd n8n-engage
rm -rf node_modules
npm install
npm run build
cd ../n8n-docker
docker-compose restart
```

### Issue: Safari cookie errors

**Solution**: Ensure `N8N_SECURE_COOKIE=false` is set in docker-compose.yml and you're accessing via `http://localhost:5678` (not `127.0.0.1`).

### Issue: Changes not appearing after rebuild

**Solution**: 
1. Make sure you ran `npm run build` in n8n-engage
2. Restart the container: `docker-compose restart`
3. Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)

## Stopping n8n

```bash
cd n8n-docker
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v  # WARNING: This deletes all workflows and data!
```

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
- [n8n Community Forum](https://community.n8n.io/)
- [Building Custom Nodes Guide](https://medium.com/@sankalpkhawade/building-custom-nodes-in-n8n-a-complete-developers-guide-0ddafe1558ca)

## Tips

- **Live Reload**: The npm link setup provides a "live reload" experience - changes are reflected after rebuild and restart
- **Debugging**: Use `console.log()` in your node code - output appears in Docker logs: `docker-compose logs -f n8n`
- **Multiple Nodes**: You can link multiple custom nodes by repeating the npm link process for each
- **Version Changes**: If you update the version in package.json, you may need to re-run the npm link commands

## Team Collaboration

Each team member should:
1. Clone both repositories (`n8n-docker` and `n8n-engage`)
2. Ensure the directory structure matches (adjust paths in docker-compose.yml if needed)
3. Follow the Initial Setup steps above
4. Use consistent credentials if sharing workflows

Share workflows by exporting them from n8n (Download as JSON) and committing to version control.
