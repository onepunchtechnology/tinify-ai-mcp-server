# Installing @tinify-ai/mcp-server

## Quick Setup

Add the following to your MCP client configuration:

```json
{
  "mcpServers": {
    "tinify": {
      "command": "npx",
      "args": ["@tinify-ai/mcp-server"]
    }
  }
}
```

No API key or signup required. Works out of the box with 20 free daily credits.

## Configuration File Locations

| Client | Config Path |
|--------|------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) |
| Claude Code | `~/.claude/settings.json` or run `claude mcp add tinify -- npx @tinify-ai/mcp-server` |
| Cursor | `.cursor/mcp.json` in your project root |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

## Verification

After adding the configuration, restart your MCP client and verify the server is working by asking your AI assistant:

> "Optimize this image: /path/to/your/photo.jpg"

The `optimize_image` tool should appear in the available tools list.

## What It Does

The server exposes a single tool: `optimize_image`

- **Compresses** images using smart lossy compression (typically 60-80% size reduction)
- **Generates SEO metadata** (alt text, keywords, filename) using AI
- **Converts formats** (JPEG, PNG, WebP)
- **Resizes** to specific dimensions
- **Upscales** using AI (2x or 4x)
- Accepts **local files** or **remote URLs**
- Saves optimized files next to the original with a `.tinified` suffix

## Credits

Each image costs 4 credits (3 compression + 1 SEO tags).
Guest tier: 20 credits/day. Free account: 50/day. Pro: 3,000/month. Max: 10,000/month.
Need more? Use the `upgrade` tool or visit https://tinify.ai/pricing

## Account Management

Four additional tools are available for account management:

| Tool | Description |
|------|-------------|
| `login` | Log in via browser (Google, Facebook, or email). Shared credits with web app. |
| `logout` | Log out and revert to guest session (20 credits/day). |
| `status` | Check login state, tier, credits remaining, and reset time. |
| `upgrade` | Open pricing page in browser (Free: 50/day, Pro: 3,000/month, Max: 10,000/month). |

Recommended usage: call `status` before batch processing to verify sufficient credits.
