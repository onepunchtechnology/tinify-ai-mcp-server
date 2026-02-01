import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { SessionManager } from "../manager.js";

describe("SessionManager", () => {
  let tmpDir: string;
  let manager: SessionManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tinify-test-"));
    manager = new SessionManager(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when no session exists", () => {
    expect(manager.getToken()).toBeNull();
  });

  it("saves and retrieves a session token", () => {
    manager.saveToken("test-token-123");
    expect(manager.getToken()).toBe("test-token-123");
  });

  it("persists token to disk", () => {
    manager.saveToken("persist-token");
    const newManager = new SessionManager(tmpDir);
    expect(newManager.getToken()).toBe("persist-token");
  });

  it("overwrites existing token", () => {
    manager.saveToken("old-token");
    manager.saveToken("new-token");
    expect(manager.getToken()).toBe("new-token");
  });

  it("handles corrupted session file gracefully", () => {
    const sessionFile = path.join(tmpDir, "session.json");
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(sessionFile, "not-json{{{");
    expect(manager.getToken()).toBeNull();
  });

  it("uses ~/.tinify as default directory", () => {
    const defaultManager = new SessionManager();
    const expectedDir = path.join(os.homedir(), ".tinify");
    expect(defaultManager.sessionDir).toBe(expectedDir);
  });
});
