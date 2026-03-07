import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must mock modules before importing
vi.mock("@x402/fetch", () => ({
  wrapFetchWithPayment: vi.fn(() => vi.fn()),
  x402Client: vi.fn(() => ({})),
}));
vi.mock("@x402/evm/exact/client", () => ({
  registerExactEvmScheme: vi.fn(),
}));
vi.mock("@x402/evm", () => ({
  toClientEvmSigner: vi.fn(() => ({ address: "0xMockSigner" })),
}));
vi.mock("viem/accounts", () => ({
  privateKeyToAccount: vi.fn(() => ({
    address: "0x1234567890abcdef1234567890abcdef12345678",
  })),
}));
vi.mock("viem", () => ({
  createPublicClient: vi.fn(() => ({})),
  http: vi.fn(() => ({})),
}));
vi.mock("viem/chains", () => ({
  base: { id: 8453, name: "Base" },
}));

describe("x402 client", () => {
  const FAKE_KEY = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    vi.resetModules();
    delete process.env.TINIFY_X402_PRIVATE_KEY;
  });

  afterEach(() => {
    delete process.env.TINIFY_X402_PRIVATE_KEY;
  });

  describe("isX402Configured", () => {
    it("returns false when env var is not set", async () => {
      const { isX402Configured } = await import("../client.js");
      expect(isX402Configured()).toBe(false);
    });

    it("returns true when env var is set", async () => {
      process.env.TINIFY_X402_PRIVATE_KEY = FAKE_KEY;
      const { isX402Configured } = await import("../client.js");
      expect(isX402Configured()).toBe(true);
    });
  });

  describe("getWalletAddress", () => {
    it("returns null when env var is not set", async () => {
      const { getWalletAddress } = await import("../client.js");
      const result = await getWalletAddress();
      expect(result).toBeNull();
    });

    it("returns address when env var is set", async () => {
      process.env.TINIFY_X402_PRIVATE_KEY = FAKE_KEY;
      const { getWalletAddress } = await import("../client.js");
      const result = await getWalletAddress();
      expect(result).toBe("0x1234567890abcdef1234567890abcdef12345678");
    });
  });

  describe("getX402Fetch", () => {
    it("returns null when env var is not set", async () => {
      const { getX402Fetch } = await import("../client.js");
      const result = await getX402Fetch();
      expect(result).toBeNull();
    });

    it("returns wrapped fetch when env var is set", async () => {
      process.env.TINIFY_X402_PRIVATE_KEY = FAKE_KEY;
      const { getX402Fetch } = await import("../client.js");
      const result = await getX402Fetch();
      expect(result).not.toBeNull();
      expect(typeof result).toBe("function");
    });
  });
});
