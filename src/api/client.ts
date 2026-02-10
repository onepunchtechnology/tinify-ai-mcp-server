export interface ClientConfig {
  baseUrl: string;
  sessionToken: string | null;
}

export const DEFAULT_BASE_URL = "https://api.tinify.ai";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
