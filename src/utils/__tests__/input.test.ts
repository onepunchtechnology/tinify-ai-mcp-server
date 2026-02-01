import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { resolveInput, isUrl } from "../input.js";

describe("isUrl", () => {
  it("detects http URLs", () => {
    expect(isUrl("http://example.com/image.png")).toBe(true);
  });

  it("detects https URLs", () => {
    expect(isUrl("https://cdn.example.com/photo.jpg")).toBe(true);
  });

  it("rejects local file paths", () => {
    expect(isUrl("/Users/me/image.png")).toBe(false);
    expect(isUrl("./relative/image.png")).toBe(false);
    expect(isUrl("image.png")).toBe(false);
  });
});

describe("resolveInput", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tinify-input-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads a local file and returns buffer + filename", async () => {
    const filePath = path.join(tmpDir, "hero.png");
    fs.writeFileSync(filePath, "fake-png-data");

    const result = await resolveInput(filePath);
    expect(result.buffer.toString()).toBe("fake-png-data");
    expect(result.filename).toBe("hero.png");
    expect(result.isUrl).toBe(false);
  });

  it("throws on non-existent file", async () => {
    await expect(resolveInput("/nonexistent/path.png")).rejects.toThrow(
      "File not found"
    );
  });

  it("extracts filename from URL path", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode("image-data").buffer,
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await resolveInput("https://cdn.example.com/assets/photo.jpg");
    expect(result.filename).toBe("photo.jpg");
    expect(result.isUrl).toBe(true);
    expect(result.buffer.toString()).toBe("image-data");
  });

  it("uses fallback filename for URLs without clear filename", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await resolveInput("https://api.example.com/image?id=123");
    expect(result.filename).toBe("image");
  });

  it("throws on URL fetch failure", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(
      resolveInput("https://example.com/missing.jpg")
    ).rejects.toThrow("Failed to fetch");
  });
});
