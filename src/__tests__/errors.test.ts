import { describe, it, expect } from "vitest";
import { formatErrorForMcp } from "../errors.js";
import { ApiError } from "../api/client.js";

describe("formatErrorForMcp", () => {
  it("formats insufficient credits error with details", () => {
    const error = new ApiError(
      "Insufficient credits. 2 of 20 daily credits left.",
      429,
      "Insufficient credits. Need 4, have 2.",
    );

    const result = formatErrorForMcp(error);
    expect(result.content[0].text).toContain("Insufficient credits");
    expect(result.content[0].text).toContain("2 of 20");
    expect(result.isError).toBe(true);
  });

  it("formats timeout error", () => {
    const error = new ApiError("Processing timed out after 60 seconds.", 504);
    const result = formatErrorForMcp(error);
    expect(result.content[0].text).toContain("timed out");
    expect(result.isError).toBe(true);
  });

  it("formats file not found error", () => {
    const error = new Error("File not found: /bad/path.png");
    const result = formatErrorForMcp(error);
    expect(result.content[0].text).toContain("File not found");
    expect(result.isError).toBe(true);
  });

  it("formats unknown errors safely", () => {
    const error = new Error("Something unexpected");
    const result = formatErrorForMcp(error);
    expect(result.content[0].text).toContain("Something unexpected");
    expect(result.isError).toBe(true);
  });

  it("handles non-Error objects", () => {
    const result = formatErrorForMcp("string error");
    expect(result.content[0].text).toContain("unexpected error");
    expect(result.isError).toBe(true);
  });
});
