import { describe, it, expect, vi } from "vitest";
import { waitForCompletion, type CompletedJob } from "../status.js";

describe("waitForCompletion", () => {
  it("resolves with job data on complete event", async () => {
    const listeners: Record<string, (event: any) => void> = {};
    const mockEventSource = {
      addEventListener: vi.fn((event: string, handler: any) => {
        listeners[event] = handler;
      }),
      close: vi.fn(),
    };

    vi.stubGlobal("EventSource", vi.fn(() => mockEventSource));

    const promise = waitForCompletion({
      baseUrl: "https://api.tinify.ai",
      jobId: "job-1",
      timeoutMs: 60000,
    });

    listeners["complete"]({
      data: JSON.stringify({
        job_id: "job-1",
        status: "completed",
        processed_size: 48000,
        processed_format: "webp",
        processed_width: 1920,
        processed_height: 1080,
        processed_compression_ratio: 0.72,
        seo_alt_text: "A test image",
        seo_filename: "test-image",
        seo_keywords: ["test"],
      }),
    });

    const result = await promise;
    expect(result.status).toBe("completed");
    expect(result.processed_size).toBe(48000);
    expect(result.processed_compression_ratio).toBe(0.72);
    expect(mockEventSource.close).toHaveBeenCalled();
  });

  it("rejects on error event", async () => {
    const listeners: Record<string, (event: any) => void> = {};
    const mockEventSource = {
      addEventListener: vi.fn((event: string, handler: any) => {
        listeners[event] = handler;
      }),
      close: vi.fn(),
    };

    vi.stubGlobal("EventSource", vi.fn(() => mockEventSource));

    const promise = waitForCompletion({
      baseUrl: "https://api.tinify.ai",
      jobId: "job-1",
      timeoutMs: 60000,
    });

    listeners["complete"]({
      data: JSON.stringify({
        job_id: "job-1",
        status: "failed",
        error: "TinyPNG API error",
      }),
    });

    await expect(promise).rejects.toThrow("Processing failed: TinyPNG API error");
  });

  it("rejects on timeout", async () => {
    vi.useFakeTimers();

    const mockEventSource = {
      addEventListener: vi.fn(),
      close: vi.fn(),
    };

    vi.stubGlobal("EventSource", vi.fn(() => mockEventSource));

    const promise = waitForCompletion({
      baseUrl: "https://api.tinify.ai",
      jobId: "job-1",
      timeoutMs: 5000,
    });

    vi.advanceTimersByTime(5001);

    await expect(promise).rejects.toThrow("Processing timed out");

    vi.useRealTimers();
  });
});
