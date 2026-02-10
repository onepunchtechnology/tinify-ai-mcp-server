# @tinify-ai/mcp-server

[![npm version](https://img.shields.io/npm/v/@tinify-ai/mcp-server.svg)](https://www.npmjs.com/package/@tinify-ai/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-brightgreen.svg)](https://modelcontextprotocol.io)

MCP server for [Tinify](https://tinify.ai) image optimization. One tool, max optimization.

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "tinify": {
      "command": "npx",
      "args": ["-y", "@tinify-ai/mcp-server"]
    }
  }
}
```

No signup required. Works out of the box with 20 free daily credits.

### Client-Specific Setup

<details>
<summary><strong>Claude Desktop</strong></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "tinify": {
      "command": "npx",
      "args": ["-y", "@tinify-ai/mcp-server"]
    }
  }
}
```
</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add tinify -- npx -y @tinify-ai/mcp-server
```
</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "tinify": {
      "command": "npx",
      "args": ["-y", "@tinify-ai/mcp-server"]
    }
  }
}
```
</details>

<details>
<summary><strong>Windsurf</strong></summary>

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "tinify": {
      "command": "npx",
      "args": ["-y", "@tinify-ai/mcp-server"]
    }
  }
}
```
</details>

## Tool: `optimize_image`

Optimizes an image with smart defaults: TinyPNG compression + SEO tag generation.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `input` | string | Yes | — | Local file path or remote URL |
| `output_path` | string | No | auto | Where to save the result |
| `output_format` | string | No | original | jpeg, png, webp, or original |
| `output_width_px` | int | No | — | Target width in pixels |
| `output_height_px` | int | No | — | Target height in pixels |
| `output_upscale_factor` | float | No | — | Scale factor (2.0, 4.0) |
| `output_resize_mode` | string | No | pad | pad or crop |
| `output_aspect_lock` | bool | No | true | Maintain aspect ratio |
| `output_seo_tag_gen` | bool | No | true | Generate SEO metadata |

### Examples

**Basic optimization:**
> "Optimize hero.png"

**Convert to WebP:**
> "Optimize hero.png as webp"

**Resize and optimize:**
> "Optimize hero.png to 1920x1080"

**Upscale a small image:**
> "Upscale logo.png by 4x"

**Save to specific path:**
> "Optimize hero.png and save to ./dist/hero.webp"

**Batch from URL:**
> "Optimize https://example.com/photo.jpg"

## Output

Returns optimized file path and metadata:

```
Optimized: hero.tinified.webp
Size: 142.3 KB
Compression: 73%
Format: webp
Dimensions: 1920x1080
Alt text: Modern office workspace with laptop and coffee cup on wooden desk
```

Structured metadata is also returned with `seo_keywords`, `seo_filename`, and full dimension/size data.

## Supported Formats

| Format | Input | Output |
|--------|-------|--------|
| JPEG | Yes | Yes |
| PNG | Yes | Yes |
| WebP | Yes | Yes |

Max file size: 50 MB.

## How It Works

```
Local file or URL
  → Upload to Tinify API
    → TinyPNG compression (smart lossy, typically 60-80% reduction)
    → AI SEO tag generation (alt text, keywords, filename)
    → Optional: resize, upscale, format conversion
  → Download optimized file
    → Save next to original as name.tinified.ext
```

All processing happens server-side via the [Tinify API](https://tinify.ai). The MCP server is a thin client that orchestrates the pipeline.

## Credits

| | Free Tier |
|---|-----------|
| Credits/day | 20 |
| Images/day | 5 (with default settings) |
| Cost per image | 4 credits (3 compression + 1 SEO tags) |
| Signup required | No |

Session tokens are stored locally at `~/.tinify/session.json` and persist across invocations.

## Troubleshooting

**Server not appearing in tool list:**
- Restart your MCP client after editing the config
- Ensure Node.js >= 18 is installed: `node --version`
- Try running directly: `npx -y @tinify-ai/mcp-server` (should start without errors)

**"Insufficient credits" error:**
- Free tier allows 20 credits/day (resets daily)
- Each image costs 4 credits with default settings
- Disable SEO tags (`output_seo_tag_gen: false`) to reduce to 3 credits/image

**File not found:**
- Use absolute paths for local files
- For URLs, ensure the image is publicly accessible

**Timeout errors:**
- Large images or AI upscaling can take 30-60 seconds
- The server has a 60-second timeout per job

## Requirements

- Node.js >= 18
- An MCP-compatible client (Claude Desktop, Claude Code, Cursor, Windsurf, Cline, etc.)

## License

MIT - see [LICENSE](LICENSE).
