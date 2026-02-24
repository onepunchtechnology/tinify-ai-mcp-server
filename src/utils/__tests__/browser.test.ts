import { describe, it, expect, vi, beforeEach } from "vitest";
import { openBrowser } from "../browser.js";
import * as childProcess from "node:child_process";

vi.mock("node:child_process", () => ({
  exec: vi.fn((_cmd, callback) => { (callback as any)(null); return {} as any; }),
}));

describe("openBrowser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses 'open' command on darwin", () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    openBrowser("https://tinify.ai/mcp/authorize?code=TINI-7X4K-M2P9");
    expect(childProcess.exec).toHaveBeenCalledWith(
      'open "https://tinify.ai/mcp/authorize?code=TINI-7X4K-M2P9"',
      expect.any(Function),
    );
  });

  it("uses 'xdg-open' on linux", () => {
    vi.stubGlobal("process", { ...process, platform: "linux" });
    openBrowser("https://example.com");
    expect(childProcess.exec).toHaveBeenCalledWith(
      'xdg-open "https://example.com"',
      expect.any(Function),
    );
  });

  it("uses 'start' on win32", () => {
    vi.stubGlobal("process", { ...process, platform: "win32" });
    openBrowser("https://example.com");
    expect(childProcess.exec).toHaveBeenCalledWith(
      'start "" "https://example.com"',
      expect.any(Function),
    );
  });

  it("returns false on exec error", () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    vi.mocked(childProcess.exec).mockImplementation((_cmd, callback) => {
      (callback as any)(new Error("fail"));
      return {} as any;
    });
    const result = openBrowser("https://example.com");
    expect(result).toBe(false);
  });
});
