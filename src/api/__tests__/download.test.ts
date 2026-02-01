import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadFile } from "../download.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("downloadFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("downloads file and returns buffer with filename", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({
        "Content-Disposition": 'attachment; filename="hero.tinified.webp"',
      }),
      arrayBuffer: async () => new ArrayBuffer(100),
    });

    const result = await downloadFile({
      baseUrl: "https://api.tinify.ai",
      jobId: "job-1",
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBe(100);
    expect(result.filename).toBe("hero.tinified.webp");
  });

  it("throws on expired job (410)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: async () => ({ detail: "Job expired" }),
    });

    await expect(
      downloadFile({ baseUrl: "https://api.tinify.ai", jobId: "job-1" })
    ).rejects.toThrow("Job has expired");
  });

  it("throws on job not completed (400)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: "Job not completed" }),
    });

    await expect(
      downloadFile({ baseUrl: "https://api.tinify.ai", jobId: "job-1" })
    ).rejects.toThrow("Job not completed");
  });
});
