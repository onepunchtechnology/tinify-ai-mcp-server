import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerProcessing, type ProcessingSettings } from "../process.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("triggerProcessing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends temp_file_ids and settings to /auto", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        jobs: [{ id: "job-1", temp_file_id: "temp-1", status: "queued" }],
        credits_used: 4,
        credits_remaining: 16,
      }),
    });

    const settings: ProcessingSettings = {
      output_format: "webp",
      output_seo_tag_gen: true,
    };

    const result = await triggerProcessing({
      baseUrl: "https://api.tinify.ai",
      tempFileIds: ["temp-1"],
      settings,
      sessionToken: "token-123",
    });

    expect(result.jobs[0].id).toBe("job-1");
    expect(result.credits_used).toBe(4);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.tinify.ai/auto");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.temp_file_ids).toEqual(["temp-1"]);
    expect(body.settings.output_format).toBe("webp");
    expect(body.settings.output_seo_tag_gen).toBe(true);
  });

  it("throws on insufficient credits (429) with parsed details", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({
        "X-RateLimit-Remaining": "2",
        "Retry-After": "86400",
      }),
      json: async () => ({
        detail: "Insufficient credits. Need 4, have 2.",
      }),
    });

    await expect(
      triggerProcessing({
        baseUrl: "https://api.tinify.ai",
        tempFileIds: ["temp-1"],
        settings: { output_seo_tag_gen: true },
        sessionToken: "token",
      })
    ).rejects.toThrow(/Insufficient credits/);
  });
});
