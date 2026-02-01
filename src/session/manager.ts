import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

interface SessionData {
  session_token: string;
}

export class SessionManager {
  public readonly sessionDir: string;
  private readonly sessionFile: string;

  constructor(sessionDir?: string) {
    this.sessionDir = sessionDir ?? path.join(os.homedir(), ".tinify");
    this.sessionFile = path.join(this.sessionDir, "session.json");
  }

  getToken(): string | null {
    try {
      const raw = fs.readFileSync(this.sessionFile, "utf-8");
      const data: SessionData = JSON.parse(raw);
      return data.session_token ?? null;
    } catch {
      return null;
    }
  }

  saveToken(token: string): void {
    fs.mkdirSync(this.sessionDir, { recursive: true });
    const data: SessionData = { session_token: token };
    fs.writeFileSync(this.sessionFile, JSON.stringify(data, null, 2));
  }
}
