/**
 * Helpers shared by every example in this folder.
 *
 * These exist so the examples themselves stay about the SDK rather than about
 * argument plumbing. Nothing here is part of `@thenamespace/mint-manager`. Copy
 * whatever is useful into your own project.
 *
 * The rule the whole folder follows: credentials and endpoints come from the
 * environment, never from a literal in the source. A committed private key is
 * compromised the moment it is pushed, and a committed provider URL leaks your
 * API quota to anyone who clones the repo.
 */
import { Address, getAddress, isAddress } from "viem";
import { MintManagerError } from "../src";

/** Where a reader should look when an example tells them a variable is missing. */
const ENV_TEMPLATE = "packages/mint-manager/.env.example";

/**
 * Reads a required environment variable, or exits with instructions.
 *
 * Exiting is deliberate. The alternative, falling back to a baked-in default,
 * is how a throwaway key ends up in git and how an example silently mints
 * against the wrong account.
 */
export function requireEnv(name: string, why: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required environment variable ${name}.\n` +
        `  ${name} is ${why}.\n` +
        `  Copy ${ENV_TEMPLATE} to packages/mint-manager/.env, fill it in, then:\n` +
        `    set -a && source .env && set +a\n`
    );
    process.exit(1);
  }
  return value;
}

/** Reads an optional environment variable, falling back to a documented default. */
export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/**
 * Validates an EVM address before it reaches the SDK.
 *
 * Worth doing in your own code too: an unchecked `as Address` cast compiles
 * fine and then fails much later, inside a contract call, with an error that
 * points at the chain rather than at the typo.
 */
export function asAddress(value: string, field: string): Address {
  if (!isAddress(value)) {
    console.error(
      `${field} is not a valid EVM address: ${JSON.stringify(value)}\n` +
        `  Expected a 0x-prefixed, 40-character hex string.`
    );
    process.exit(1);
  }
  // getAddress returns the EIP-55 checksummed form, which is what explorers and
  // ENS resolvers compare against.
  return getAddress(value);
}

/** Parses a 0x-prefixed 32-byte private key without ever logging it. */
export function asPrivateKey(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    console.error(
      "PRIVATE_KEY is not a valid 32-byte hex private key.\n" +
        "  Expected a 0x-prefixed, 64-character hex string.\n" +
        `  See ${ENV_TEMPLATE}. Use a throwaway testnet account.`
    );
    process.exit(1);
  }
  return value as `0x${string}`;
}

/**
 * Prints a failure in the most useful form available.
 *
 * `MintManagerError` carries a stable `code` plus structured `details`, so
 * branch on the code. Message text is free to change between releases and is
 * the wrong thing to match on.
 */
export function explainError(err: unknown): void {
  if (err instanceof MintManagerError) {
    console.error(`\n[${err.code}] ${err.message}`);
    if (err.details) {
      console.error("  details:", err.details);
    }
    if (err.docsUrl) {
      console.error("  docs:", err.docsUrl);
    }
    return;
  }

  if (err instanceof Error) {
    console.error(`\n${err.name}: ${err.message}`);
    return;
  }

  console.error("\nUnknown failure:", err);
}

/** Runs an example's `main`, reporting failures consistently and exiting non-zero. */
export function run(main: () => Promise<void>): void {
  main().catch((err) => {
    explainError(err);
    process.exit(1);
  });
}
