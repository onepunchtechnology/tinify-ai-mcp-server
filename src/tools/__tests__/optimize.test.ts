import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Mock all API modules before importing optimize
vi.mock("../../api/upload.js", () => ({
  uploadFile: vi.fn(),
}));
vi.mock("../../api/process.js", () => ({
  triggerProcessing: vi.fn(),
}));
vi.mock("../../api/status.js", () => ({
  waitForCompletion: vi.fn(),
}));
vi.mock("../../api/download.js", () => ({
  downloadFile: vi.fn(),
}));
vi.mock("../../session/manager.js", () => ({
  SessionManager: vi.fn(),
}));

import { optimizeImage } from "../optimize.js";
import { uploadFile } from "../../api/upload.js";
import { triggerProcessing } from "../../api/process.js";
import { waitForCompletion } from "../../api/status.js";
import { downloadFile } from "../../api/download.js";
import { SessionManager } from "../../session/manager.js";

describe("optimizeImage", () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SessionManager).mockImplementation(() => ({
      sessionDir: "/tmp/.tinify",
      getToken: vi.fn().mockReturnValue(null),
      saveToken: vi.fn(),
    }) as any);
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tinify-optimize-test-"));

    // Create a test input file
    fs.writeFileSync(path.join(tmpDir, "hero.png"), "fake-png");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("orchestrates the full optimize flow", async () => {
    vi.mocked(uploadFile).mockResolvedValueOnce({
      temp_file_id: "temp-1",
      original_filename: "hero.png",
      file_size: 50000,
      mime_type: "image/png",
      session_token: "new-session",
    });

    vi.mocked(triggerProcessing).mockResolvedValueOnce({
      success: true,
      jobs: [{ id: "job-1", temp_file_id: "temp-1", status: "queued" }],
      credits_used: 4,
      credits_remaining: 16,
    });

    vi.mocked(waitForCompletion).mockResolvedValueOnce({
      job_id: "job-1",
      status: "completed",
      processed_size: 30000,
      processed_format: "png",
      processed_width: 800,
      processed_height: 600,
      processed_compression_ratio: 0.6,
      seo_alt_text: "A hero image",
      seo_filename: "hero-image",
      seo_keywords: ["hero", "image"],
    });

    vi.mocked(downloadFile).mockResolvedValueOnce({
      buffer: Buffer.from("optimized-png"),
      filename: "hero.tinified.png",
    });

    const result = await optimizeImage({
      input: path.join(tmpDir, "hero.png"),
      baseUrl: "https://api.tinify.ai",
    });

    expect(result.output_path).toContain("hero.tinified.png");
    expect(result.output_size_bytes).toBe(30000);
    expect(result.output_width_px).toBe(800);
    expect(result.output_height_px).toBe(600);
    expect(result.output_format).toBe("png");
    expect(result.compression_ratio).toBe(0.6);
    expect(result.seo_alt_text).toBe("A hero image");
    expect(result.seo_keywords).toEqual(["hero", "image"]);

    // Verify file was written
    expect(fs.existsSync(result.output_path)).toBe(true);
    expect(fs.readFileSync(result.output_path, "utf-8")).toBe("optimized-png");
  });

  it("passes settings through to processing", async () => {
    vi.mocked(uploadFile).mockResolvedValueOnce({
      temp_file_id: "temp-1",
      original_filename: "hero.png",
      file_size: 50000,
      mime_type: "image/png",
      session_token: null,
    });
    vi.mocked(triggerProcessing).mockResolvedValueOnce({
      success: true,
      jobs: [{ id: "job-1", temp_file_id: "temp-1", status: "queued" }],
      credits_used: 7,
      credits_remaining: 13,
    });
    vi.mocked(waitForCompletion).mockResolvedValueOnce({
      job_id: "job-1",
      status: "completed",
      processed_size: 20000,
      processed_format: "webp",
      processed_width: 1920,
      processed_height: 1080,
      processed_compression_ratio: 0.4,
    });
    vi.mocked(downloadFile).mockResolvedValueOnce({
      buffer: Buffer.from("webp-data"),
      filename: "hero.tinified.webp",
    });

    await optimizeImage({
      input: path.join(tmpDir, "hero.png"),
      baseUrl: "https://api.tinify.ai",
      output_format: "webp",
      output_width_px: 1920,
      output_height_px: 1080,
      output_seo_tag_gen: false,
    });

    const processCall = vi.mocked(triggerProcessing).mock.calls[0][0];
    expect(processCall.settings.output_format).toBe("webp");
    expect(processCall.settings.output_width).toBe(1920);
    expect(processCall.settings.output_height).toBe(1080);
    expect(processCall.settings.output_seo_tag_gen).toBe(false);
  });

  it("creates parent directories if output_path doesn't exist", async () => {
    vi.mocked(uploadFile).mockResolvedValueOnce({
      temp_file_id: "temp-1",
      original_filename: "hero.png",
      file_size: 50000,
      mime_type: "image/png",
      session_token: null,
    });
    vi.mocked(triggerProcessing).mockResolvedValueOnce({
      success: true,
      jobs: [{ id: "job-1", temp_file_id: "temp-1", status: "queued" }],
      credits_used: 4,
      credits_remaining: 16,
    });
    vi.mocked(waitForCompletion).mockResolvedValueOnce({
      job_id: "job-1",
      status: "completed",
      processed_size: 30000,
      processed_format: "png",
      processed_width: 800,
      processed_height: 600,
      processed_compression_ratio: 0.6,
    });
    vi.mocked(downloadFile).mockResolvedValueOnce({
      buffer: Buffer.from("data"),
      filename: "hero.png",
    });

    const deepPath = path.join(tmpDir, "deep", "nested", "dir", "out.png");
    const result = await optimizeImage({
      input: path.join(tmpDir, "hero.png"),
      output_path: deepPath,
      baseUrl: "https://api.tinify.ai",
    });

    expect(result.output_path).toBe(deepPath);
    expect(fs.existsSync(deepPath)).toBe(true);
  });
});
