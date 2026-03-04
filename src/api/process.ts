import { ApiError } from "./client.js";

export interface ProcessingSettings {
  output_format?: "original" | "jpg" | "png" | "webp" | "avif" | "gif";
  output_upscale_factor?: number;
  output_width?: number;
  output_height?: number;
  output_resize_behavior?: "pad" | "crop";
  output_seo_tag_gen?: boolean;
  output_seo_rename?: boolean;
}

interface ProcessParams {
  baseUrl: string;
  tempFileIds: string[];
  settings: ProcessingSettings;
  authHeaders: Record<string, string>;
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
  const { baseUrl, tempFileIds, settings, authHeaders } = params;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
  };

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
      if (body.is_guest) {
        throw new ApiError(
          `You've used all ${body.credits_limit || 20} free daily credits. ` +
          `Log in for more credits (free = 50/day, Pro = 3,000/month). ` +
          `Use the login tool to sign in, or wait until credits reset.`,
          429,
          body.detail,
        );
      } else if (body.tier) {
        throw new ApiError(
          `You've used all ${body.credits_limit} credits for this period (${body.tier} tier). ` +
          `Upgrade for more credits, or wait until they reset.`,
          429,
          body.detail,
        );
      } else {
        // Fallback for old backend format
        const remaining = response.headers.get("X-RateLimit-Remaining") ?? "0";
        throw new ApiError(
          `Insufficient credits. ${remaining} credits remaining.`,
          429,
          body.detail,
        );
      }
    }
    throw new ApiError(body.detail || "Processing failed", response.status, body.detail);
  }

  return response.json();
}
