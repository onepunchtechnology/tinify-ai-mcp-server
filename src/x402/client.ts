/**
 * x402 payment client for MCP server.
 *
 * Wraps fetch with x402 payment handling. When the backend returns 402,
 * automatically signs a USDC payment on Base and retries the request.
 *
 * Wallet private key is read from TINIFY_X402_PRIVATE_KEY env var.
 * The key never leaves this process.
 */

let _wrappedFetch: typeof fetch | null = null;
let _walletAddress: string | null = null;

/**
 * Check if x402 payments are configured (private key env var is set).
 */
export function isX402Configured(): boolean {
  return !!process.env.TINIFY_X402_PRIVATE_KEY;
}

/**
 * Get the wallet address (public, safe to display).
 * Returns null if no private key is configured or if derivation fails.
 */
export async function getWalletAddress(): Promise<string | null> {
  if (!process.env.TINIFY_X402_PRIVATE_KEY) return null;

  if (!_walletAddress) {
    try {
      const { privateKeyToAccount } = await import("viem/accounts");
      const account = privateKeyToAccount(
        process.env.TINIFY_X402_PRIVATE_KEY as `0x${string}`,
      );
      _walletAddress = account.address;
    } catch {
      return null;
    }
  }

  return _walletAddress;
}

/**
 * Get a fetch function wrapped with x402 payment handling.
 *
 * On first call, initializes the signer from TINIFY_X402_PRIVATE_KEY.
 * Returns null if no private key is configured.
 */
export async function getX402Fetch(): Promise<typeof fetch | null> {
  if (!process.env.TINIFY_X402_PRIVATE_KEY) return null;

  if (!_wrappedFetch) {
    try {
      const { wrapFetchWithPayment, x402Client } = await import("@x402/fetch");
      const { registerExactEvmScheme } = await import(
        "@x402/evm/exact/client"
      );
      const { toClientEvmSigner } = await import("@x402/evm");
      const { privateKeyToAccount } = await import("viem/accounts");
      const { createPublicClient, http } = await import("viem");
      const { base } = await import("viem/chains");

      const account = privateKeyToAccount(
        process.env.TINIFY_X402_PRIVATE_KEY as `0x${string}`,
      );

      // Create a public client for readContract capability
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      // Compose a full ClientEvmSigner with readContract from publicClient
      const signer = toClientEvmSigner(account, publicClient);

      const client = new x402Client();
      registerExactEvmScheme(client, { signer });

      _wrappedFetch = wrapFetchWithPayment(fetch, client);
    } catch (error) {
      console.error("Failed to initialize x402 client:", error);
      return null;
    }
  }

  return _wrappedFetch;
}
