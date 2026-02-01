#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { optimizeImage } from "./tools/optimize.js";
import { formatErrorForMcp } from "./errors.js";

const server = new McpServer({
  name: "tinify",
  version: "1.0.0",
});

server.registerTool(
  "optimize_image",
  {
    title: "Optimize Image",
    description:
      "Optimize an image with smart defaults: TinyPNG compression + SEO tag generation. " +
      "Accepts local file paths or remote URLs. Returns the optimized file path and metadata.",
    inputSchema: {
      input: z
        .string()
        .describe("Local file path or remote URL of the image to optimize"),
      output_path: z
        .string()
        .optional()
        .describe(
          "Where to save the optimized image. If omitted: local files save next to the original " +
          "with a .tinified suffix, URLs save to the current working directory.",
        ),
      output_format: z
        .enum(["original", "jpeg", "png", "webp"])
        .optional()
        .describe("Output format. Defaults to 'original' (keep input format)."),
      output_width_px: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Target width in pixels. Triggers resize."),
      output_height_px: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Target height in pixels. Triggers resize."),
      output_upscale_factor: z
        .number()
        .min(0.1)
        .max(10)
        .optional()
        .describe("Upscale factor (e.g., 2.0 for 2x, 4.0 for 4x). Triggers AI upscaling."),
      output_resize_mode: z
        .enum(["pad", "crop"])
        .optional()
        .describe("Resize mode when aspect ratio changes. 'pad' adds white padding, 'crop' uses smart cropping. Default: 'pad'."),
      output_aspect_lock: z
        .boolean()
        .optional()
        .describe("Maintain aspect ratio during resize. Default: true."),
      output_seo_tag_gen: z
        .boolean()
        .optional()
        .describe(
          "Generate SEO metadata (alt text, keywords, filename). Default: true.",
        ),
    },
    outputSchema: {
      output_path: z.string(),
      output_size_bytes: z.number(),
      output_width_px: z.number().nullable(),
      output_height_px: z.number().nullable(),
      output_format: z.string().nullable(),
      compression_ratio: z.number().nullable(),
      seo_alt_text: z.string().nullable(),
      seo_keywords: z.array(z.string()).nullable(),
      seo_filename: z.string().nullable(),
    },
  },
  async (params) => {
    try {
      const result = await optimizeImage({
        input: params.input,
        output_path: params.output_path,
        output_format: params.output_format as any,
        output_width_px: params.output_width_px,
        output_height_px: params.output_height_px,
        output_upscale_factor: params.output_upscale_factor,
        output_resize_mode: params.output_resize_mode as any,
        output_aspect_lock: params.output_aspect_lock,
        output_seo_tag_gen: params.output_seo_tag_gen,
      });

      const summary = [
        `Optimized: ${result.output_path}`,
        `Size: ${(result.output_size_bytes / 1024).toFixed(1)} KB`,
        result.compression_ratio !== null
          ? `Compression: ${(result.compression_ratio * 100).toFixed(0)}%`
          : null,
        result.output_format ? `Format: ${result.output_format}` : null,
        result.output_width_px && result.output_height_px
          ? `Dimensions: ${result.output_width_px}x${result.output_height_px}`
          : null,
        result.seo_alt_text ? `Alt text: ${result.seo_alt_text}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        content: [{ type: "text" as const, text: summary }],
        structuredContent: result,
      };
    } catch (error) {
      return formatErrorForMcp(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
