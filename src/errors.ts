import { ApiError } from "./api/client.js";

interface McpErrorResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError: true;
}

export function formatErrorForMcp(error: unknown): McpErrorResult {
  if (error instanceof ApiError) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
    };
  }

  if (error instanceof Error) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
    };
  }

  return {
    content: [{ type: "text", text: "An unexpected error occurred." }],
    isError: true,
  };
}
