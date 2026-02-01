import { ApiError } from "./client.js";
import { EventSource as EventSourcePoly } from "eventsource";

export interface CompletedJob {
  job_id: string;
  status: "completed" | "failed" | "expired";
  processed_filename?: string | null;
  processed_size?: number | null;
  processed_format?: string | null;
  processed_width?: number | null;
  processed_height?: number | null;
  processed_compression_ratio?: number | null;
  seo_alt_text?: string | null;
  seo_filename?: string | null;
  seo_keywords?: string[] | null;
  error?: string | null;
}

interface StatusParams {
  baseUrl: string;
  jobId: string;
  timeoutMs?: number;
}

export function waitForCompletion(params: StatusParams): Promise<CompletedJob> {
  const { baseUrl, jobId, timeoutMs = 60000 } = params;

  return new Promise((resolve, reject) => {
    const ESConstructor =
      typeof EventSource !== "undefined" ? EventSource : (EventSourcePoly as any);
    const es = new ESConstructor(`${baseUrl}/status/${jobId}/stream`);

    const timeout = setTimeout(() => {
      es.close();
      reject(new ApiError("Processing timed out after 60 seconds.", 504));
    }, timeoutMs);

    es.addEventListener("complete", (event: any) => {
      clearTimeout(timeout);
      es.close();

      const data: CompletedJob = JSON.parse(event.data);

      if (data.status === "completed") {
        resolve(data);
      } else {
        reject(
          new ApiError(
            `Processing failed: ${data.error ?? "Unknown error"}`,
            500,
            data.error ?? undefined,
          ),
        );
      }
    });

    es.addEventListener("error", (event: any) => {
      clearTimeout(timeout);
      es.close();
      const data = event.data ? JSON.parse(event.data) : {};
      reject(
        new ApiError(
          `Processing error: ${data.message ?? "Connection lost"}`,
          500,
          data.message,
        ),
      );
    });

    es.addEventListener("timeout", () => {
      clearTimeout(timeout);
      es.close();
      reject(new ApiError("Processing timed out after 60 seconds.", 504));
    });
  });
}
