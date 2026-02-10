import { ApiError } from "./client.js";

export interface ProcessingSettings {
  output_format?: "original" | "jpeg" | "png" | "webp";
  output_upscale_factor?: number;
  output_width?: number;
  output_height?: number;
  output_aspect_lock?: boolean;
  output_resize_mode?: "pad" | "crop";
  output_seo_tag_gen?: boolean;
  output_seo_rename?: boolean;
}

interface ProcessParams {
  baseUrl: string;
  tempFileIds: string[];
  settings: ProcessingSettings;
  sessionToken: string | null;
}

interface JobInfo {
  id: string;
  temp_file_id: string;
  status: string;
}

export interface ProcessResult {
  success: boolean;
  jobs: JobInfo[];
  credits_used: number;
  credits_remaining: number;
}

export async function triggerProcessing(params: ProcessParams): Promise<ProcessResult> {
  const { baseUrl, tempFileIds, settings, sessionToken } = params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionToken) {
    headers["X-Session-Token"] = sessionToken;
  }

  const response = await fetch(`${baseUrl}/auto`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      temp_file_ids: tempFileIds,
      settings,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      const remaining = response.headers.get("X-RateLimit-Remaining") ?? "0";
      throw new ApiError(
        `Insufficient credits. ${remaining} of 20 daily credits left. ${body.detail ?? ""}`.trim(),
        429,
        body.detail,
      );
    }
    throw new ApiError(body.detail || "Processing failed", response.status, body.detail);
  }

  return response.json();
}
