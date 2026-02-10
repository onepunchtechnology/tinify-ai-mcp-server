import * as fs from "node:fs";
import * as path from "node:path";
import { uploadFile } from "../api/upload.js";
import { triggerProcessing, type ProcessingSettings } from "../api/process.js";
import { waitForCompletion } from "../api/status.js";
import { downloadFile } from "../api/download.js";
import { resolveInput } from "../utils/input.js";
import { resolveOutputPath } from "../utils/output.js";
import { SessionManager } from "../session/manager.js";
import { DEFAULT_BASE_URL } from "../api/client.js";

export interface OptimizeImageParams {
  input: string;
  output_path?: string;
  output_format?: "original" | "jpeg" | "png" | "webp";
  output_width_px?: number;
  output_height_px?: number;
  output_upscale_factor?: number;
  output_resize_mode?: "pad" | "crop";
  output_aspect_lock?: boolean;
  output_seo_tag_gen?: boolean;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface OptimizeImageResult {
  [key: string]: unknown;
  output_path: string;
  output_size_bytes: number;
  output_width_px: number | null;
  output_height_px: number | null;
  output_format: string | null;
  compression_ratio: number | null;
  seo_alt_text: string | null;
  seo_keywords: string[] | null;
  seo_filename: string | null;
}

export async function optimizeImage(
  params: OptimizeImageParams,
): Promise<OptimizeImageResult> {
  const baseUrl = params.baseUrl ?? DEFAULT_BASE_URL;
  const sessionManager = new SessionManager();

  // 1. Resolve input (read file or fetch URL)
  const input = await resolveInput(params.input);

  // 2. Upload to backend
  const sessionToken = sessionManager.getToken();
  const uploadResult = await uploadFile({
    baseUrl,
    fileBuffer: input.buffer,
    filename: input.filename,
    sessionToken,
  });

  // Persist new session token if returned
  if (uploadResult.session_token) {
    sessionManager.saveToken(uploadResult.session_token);
  }

  const currentToken = uploadResult.session_token ?? sessionToken;

  // 3. Build settings (smart defaults: compress always, SEO tags on)
  const settings: ProcessingSettings = {
    output_format: params.output_format ?? "original",
    output_seo_tag_gen: params.output_seo_tag_gen ?? true,
    output_seo_rename: false,
  };
  if (params.output_width_px !== undefined) {
    settings.output_width = params.output_width_px;
  }
  if (params.output_height_px !== undefined) {
    settings.output_height = params.output_height_px;
  }
  if (params.output_upscale_factor !== undefined) {
    settings.output_upscale_factor = params.output_upscale_factor;
  }
  if (params.output_resize_mode !== undefined) {
    settings.output_resize_mode = params.output_resize_mode;
  }
  if (params.output_aspect_lock !== undefined) {
    settings.output_aspect_lock = params.output_aspect_lock;
  }

  // 4. Trigger processing
  const processResult = await triggerProcessing({
    baseUrl,
    tempFileIds: [uploadResult.temp_file_id],
    settings,
    sessionToken: currentToken,
  });

  const job = processResult.jobs[0];
  if (!job?.id) {
    throw new Error("No job created by the server.");
  }

  // 5. Wait for completion via SSE
  const completedJob = await waitForCompletion({
    baseUrl,
    jobId: job.id,
    timeoutMs: params.timeoutMs ?? 60000,
  });

  // 6. Download processed file
  const downloadResult = await downloadFile({ baseUrl, jobId: job.id });

  // 7. Resolve output path and save
  const outputPath = resolveOutputPath({
    inputPath: params.input,
    isUrl: input.isUrl,
    filename: input.filename,
    outputPath: params.output_path,
    outputFormat:
      params.output_format && params.output_format !== "original"
        ? params.output_format
        : completedJob.processed_format ?? undefined,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, downloadResult.buffer);

  return {
    output_path: outputPath,
    output_size_bytes: completedJob.processed_size ?? downloadResult.buffer.length,
    output_width_px: completedJob.processed_width ?? null,
    output_height_px: completedJob.processed_height ?? null,
    output_format: completedJob.processed_format ?? null,
    compression_ratio: completedJob.processed_compression_ratio ?? null,
    seo_alt_text: completedJob.seo_alt_text ?? null,
    seo_keywords: completedJob.seo_keywords ?? null,
    seo_filename: completedJob.seo_filename ?? null,
  };
}
