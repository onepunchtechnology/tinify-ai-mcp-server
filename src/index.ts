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
      "Optimize an image: smart lossy compression (typically 60-80% size reduction), optional resize/upscale/format conversion, and AI-generated SEO metadata. " +
      "Accepts absolute local file paths or remote URLs. Supported formats: JPG, PNG, WebP, AVIF, HEIC, TIFF, BMP (max 50 MB). " +
      "Each call costs 3 credits + 1 if SEO tags enabled. Free tier: 20 credits/day, no signup.",
    inputSchema: {
      input: z
        .string()
        .describe(
          "Absolute local file path or remote URL of the image to optimize. Supported: JPG, PNG, WebP, AVIF, HEIC, TIFF, BMP (max 50 MB).",
        ),
      output_path: z
        .string()
        .optional()
        .describe(
          "Where to save. Accepts a file path (/tmp/out.webp) or directory ending in / (/tmp/images/). " +
          "If omitted: saves next to original, named with SEO slug when SEO is enabled or .tinified suffix otherwise. URLs save to current working directory.",
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
        .describe(
          "Target width in pixels. Set only width for proportional resize. Set both width and height for exact output dimensions (see output_resize_mode).",
        ),
      output_height_px: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Target height in pixels. Set only height for proportional resize. Set both width and height for exact output dimensions (see output_resize_mode).",
        ),
      output_upscale_factor: z
        .number()
        .min(0.1)
        .max(10)
        .optional()
        .describe("Upscale factor (e.g., 2.0 for 2x, 4.0 for 4x). Triggers AI upscaling."),
      output_resize_mode: z
        .enum(["pad", "crop"])
        .optional()
        .describe(
          "How to handle aspect ratio mismatch when both width and height are specified. " +
          "'pad' adds white padding (default), 'crop' uses smart cropping. " +
          "Only applies when both output_width_px and output_height_px are set.",
        ),
      output_seo_tag_gen: z
        .boolean()
        .optional()
        .describe(
          "Generate SEO metadata (alt text, keywords, filename) and rename output file to SEO slug. Costs 1 extra credit. Default: true.",
        ),
    },
    outputSchema: {
      output_path: z.string().describe("Absolute path where the optimized file was saved"),
      output_size_bytes: z.number().describe("File size of the optimized image in bytes"),
      output_width_px: z.number().nullable().describe("Width of the output image in pixels"),
      output_height_px: z.number().nullable().describe("Height of the output image in pixels"),
      output_format: z.string().nullable().describe("Output format: jpg, png, webp, or avif"),
      compression_ratio: z.number().nullable().describe("Output-to-input size ratio, e.g. 0.35 means 65% smaller"),
      seo_alt_text: z.string().nullable().describe("AI-generated image alt text for accessibility and SEO"),
      seo_keywords: z.array(z.string()).nullable().describe("AI-generated keywords describing the image"),
      seo_filename: z.string().nullable().describe("AI-generated SEO filename slug without extension"),
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
