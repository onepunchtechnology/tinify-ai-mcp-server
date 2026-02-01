import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadFile } from "../upload.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("uploadFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a file and returns temp_file_id and session_token", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        temp_file_id: "temp-123",
        original_filename: "hero.png",
        file_size: 50000,
        mime_type: "image/png",
        session_token: "session-abc",
      }),
    });

    const result = await uploadFile({
      baseUrl: "https://api.tinify.ai",
      fileBuffer: Buffer.from("fake-image"),
      filename: "hero.png",
      sessionToken: null,
    });

    expect(result.temp_file_id).toBe("temp-123");
    expect(result.session_token).toBe("session-abc");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.tinify.ai/upload");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("includes session token header when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        temp_file_id: "temp-456",
        session_token: null,
      }),
    });

    await uploadFile({
      baseUrl: "https://api.tinify.ai",
      fileBuffer: Buffer.from("fake"),
      filename: "test.jpg",
      sessionToken: "existing-token",
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["X-Session-Token"]).toBe("existing-token");
  });

  it("throws on upload failure with error message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 415,
      json: async () => ({ detail: "Unsupported file type" }),
    });

    await expect(
      uploadFile({
        baseUrl: "https://api.tinify.ai",
        fileBuffer: Buffer.from("fake"),
        filename: "bad.bmp",
        sessionToken: null,
      })
    ).rejects.toThrow("Unsupported image format");
  });

  it("throws on file too large (413)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 413,
      json: async () => ({ detail: "File too large" }),
    });

    await expect(
      uploadFile({
        baseUrl: "https://api.tinify.ai",
        fileBuffer: Buffer.from("huge"),
        filename: "big.png",
        sessionToken: null,
      })
    ).rejects.toThrow("File exceeds maximum size limit");
  });
});
