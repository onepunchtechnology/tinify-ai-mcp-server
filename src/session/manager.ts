import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

interface SessionData {
  session_token: string;
  mcp_token?: string;
  user_email?: string;
  user_tier?: string;
}

export class SessionManager {
  public readonly sessionDir: string;
  private readonly sessionFile: string;

  constructor(sessionDir?: string) {
    this.sessionDir = sessionDir ?? path.join(os.homedir(), ".tinify");
    this.sessionFile = path.join(this.sessionDir, "session.json");
  }

  private readData(): SessionData | null {
    try {
      const raw = fs.readFileSync(this.sessionFile, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private writeData(data: SessionData): void {
    fs.mkdirSync(this.sessionDir, { recursive: true });
    fs.writeFileSync(this.sessionFile, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  getToken(): string | null {
    return this.readData()?.session_token ?? null;
  }

  saveToken(token: string): void {
    const existing = this.readData();
    this.writeData({ ...existing, session_token: token } as SessionData);
  }

  getMcpToken(): string | null {
    return this.readData()?.mcp_token ?? null;
  }

  saveMcpToken(token: string, email: string, tier: string): void {
    const existing = this.readData();
    this.writeData({
      ...existing,
      session_token: existing?.session_token ?? "",
      mcp_token: token,
      user_email: email,
      user_tier: tier,
    });
  }

  clearMcpToken(): void {
    const existing = this.readData();
    if (existing) {
      const { mcp_token, user_email, user_tier, ...rest } = existing;
      this.writeData(rest as SessionData);
    }
  }

  getAuthHeaders(): Record<string, string> {
    const data = this.readData();
    if (data?.mcp_token) {
      return { Authorization: `Bearer ${data.mcp_token}` };
    }
    if (data?.session_token) {
      return { "X-Session-Token": data.session_token };
    }
    return {};
  }
}
