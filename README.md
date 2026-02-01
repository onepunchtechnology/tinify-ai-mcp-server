# @tinify/mcp-server

MCP server for Tinify image optimization. One tool, max optimization.

## Quick Start

Add to your MCP client config (Claude Desktop, Claude Code, Cursor, etc.):

```json
{
  "mcpServers": {
    "tinify": {
      "command": "npx",
      "args": ["@tinify/mcp-server"]
    }
  }
}
```

No signup required. Works out of the box with 20 free daily credits.

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

**Save to specific path:**
> "Optimize hero.png and save to ./dist/hero.webp"

## Output

Returns optimized file path and metadata including compression ratio,
dimensions, format, and SEO tags (alt text, keywords, filename).

## Credits

Free tier: 20 credits/day (5 images with default settings).
Each image costs 3 credits (compression) + 1 credit (SEO tags) = 4 credits.
