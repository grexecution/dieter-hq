# Connecting Dieter HQ to OpenClaw Gateway

## Architecture
```
Browser → Dieter HQ (Vercel) → Cloudflare Tunnel → OpenClaw Gateway (Mac mini)
                            ↘ Neon Postgres (message history)
```

## Setup Steps

### 1. Authenticate Cloudflared (one-time)
```bash
cloudflared tunnel login
```
This opens a browser to authenticate with your Cloudflare account.

### 2. Create a Named Tunnel
```bash
cloudflared tunnel create openclaw-gateway
```
Note the tunnel ID that's created.

### 3. Configure the Tunnel
Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: openclaw.yourdomain.com
    service: http://127.0.0.1:18789
  - service: http_status:404
```

### 4. Add DNS Record
```bash
cloudflared tunnel route dns openclaw-gateway openclaw.yourdomain.com
```

### 5. Run the Tunnel
```bash
# One-time test
cloudflared tunnel run openclaw-gateway

# Or install as service
cloudflared service install
```

### 6. Configure Vercel Environment Variables
In Vercel dashboard → dieter-hq → Settings → Environment Variables:

```
OPENCLAW_GATEWAY_HTTP_URL=https://openclaw.yourdomain.com
OPENCLAW_GATEWAY_TOKEN=<your-gateway-token>
```

Get your gateway token:
```bash
openclaw config get gateway.token
# Or set one:
openclaw config set gateway.token "your-secure-token"
```

## Quick Test (Temporary Tunnel)
For quick testing without DNS setup:
```bash
cloudflared tunnel --url http://127.0.0.1:18789
```
This gives you a temporary `*.trycloudflare.com` URL.

## Alternative: Tailscale (Recommended for Production)
If you have Tailscale:
```bash
# Install Tailscale
brew install tailscale

# Start and login
tailscale up

# Get your Mac's Tailscale IP
tailscale ip

# Update OpenClaw to bind to Tailscale
openclaw config set gateway.bind "100.x.x.x"  # Your Tailscale IP

# Set Vercel env var
OPENCLAW_GATEWAY_HTTP_URL=http://100.x.x.x:18789
```

## Security Notes
- Always use HTTPS in production (Cloudflare provides this)
- Set a strong gateway token
- Consider IP allowlisting in Cloudflare
- The gateway token should be kept secret (Vercel env vars are encrypted)

## Troubleshooting
```bash
# Check gateway status
openclaw gateway status

# Check if tunnel is running
cloudflared tunnel info openclaw-gateway

# Test gateway locally
curl http://127.0.0.1:18789/health

# Test via tunnel
curl https://openclaw.yourdomain.com/health
```
