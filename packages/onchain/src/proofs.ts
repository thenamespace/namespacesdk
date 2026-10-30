import {
  concatHex,
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  keccak256,
  toBytes,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import { whitelistAbi, reservationAbi } from "./abis.js";
import { OnchainError } from "./errors.js";
import type { ReadContext } from "./context.js";
import type { Activation } from "./types.js";

const proofType = [{ type: "bytes32[]" }] as const;
const leafType = {
  type: "tuple",
  components: [
    { name: "value", type: "bytes32" },
    { name: "nextValue", type: "bytes32" },
    { name: "kind", type: "uint8" },
    { name: "price", type: "uint64" },
  ],
} as const;

function verify(root: Hex, leaf: Hex, proof: readonly Hex[]): boolean {
  let hash = leaf;
  for (const sibling of proof) {
    hash = keccak256(
      concatHex(
        BigInt(hash) < BigInt(sibling) ? [hash, sibling] : [sibling, hash],
      ),
    );
  }
  return hash.toLowerCase() === root.toLowerCase();
}

async function getProof(
  ctx: ReadContext,
  path: string,
  feature: string,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await ctx.fetch(`${ctx.deployment.managerApiUrl}/${path}`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new OnchainError(
      "PROOF_UNAVAILABLE",
      `Couldn't retrieve the ${feature} proof. Try again before submitting.`,
      { cause, details: { feature } },
    );
  }
  if (!response.ok)
    throw new OnchainError(
      "PROOF_UNAVAILABLE",
      `The ${feature} proof service returned HTTP ${response.status}. Try again before submitting.`,
      { details: { feature, status: response.status } },
    );
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("Expected a proof object");
    return body as Record<string, unknown>;
  } catch (cause) {
    throw new OnchainError(
      "INVALID_PROOF",
      `The ${feature} proof service returned an invalid response.`,
      { cause, details: { feature } },
    );
  }
}

export async function buildClaims(
  ctx: ReadContext,
  activation: Activation,
  label: string,
  payer: Address,
  renewal: boolean,
): Promise<Hex> {
  const { client, deployment, blockNumber } = ctx;
  const enabled = (module: Address) =>
    activation.features.some(
      (feature) => feature.toLowerCase() === module.toLowerCase(),
    );
  const claims: { feature: Address; data: Hex }[] = [];
  if (enabled(deployment.whitelistFeature) && payer !== zeroAddress) {
    const [mode, root] = await client.readContract({
      address: deployment.whitelistFeature,
      abi: whitelistAbi,
      functionName: "configs",
      args: [activation.id],
      blockNumber,
    });
    // Gate-mode denials are ignored during renewal; only Free mode can change its price.
    if (root !== zeroHash && (!renewal || mode === 1)) {
      const proof = await getProof(
        ctx,
        `whitelist/${root}/proof?address=${payer}`,
        "whitelist",
      );
      try {
        if (typeof proof.whitelisted !== "boolean")
          throw new Error("Missing membership flag");
        if (proof.whitelisted) {
          if (typeof proof.claim !== "string") throw new Error("Missing claim");
          const claim = proof.claim as Hex;
          const [siblings] = decodeAbiParameters(proofType, claim);
          if (
            !verify(
              root,
              keccak256(encodePacked(["address"], [payer])),
              siblings,
            )
          )
            throw new Error(
              "Proof does not match the configured root and payer",
            );
          claims.push({ feature: deployment.whitelistFeature, data: claim });
        }
      } catch (cause) {
        throw new OnchainError(
          "INVALID_PROOF",
          "The whitelist proof does not match this wallet and activation.",
          { cause },
        );
      }
    }
  }
  // Reservation claims can add a premium to renewal. Preserve the contract UI's renewal pricing policy.
  if (!renewal && enabled(deployment.reservationFeature)) {
    const root = await client.readContract({
      address: deployment.reservationFeature,
      abi: reservationAbi,
      functionName: "roots",
      args: [activation.id],
      blockNumber,
    });
    if (root !== zeroHash) {
      const proof = await getProof(
        ctx,
        `reservation/${root}/proof?label=${encodeURIComponent(label)}`,
        "reservation",
      );
      try {
        if (typeof proof.claim !== "string") throw new Error("Missing claim");
        const claim = proof.claim as Hex;
        const [leaf, siblings] = decodeAbiParameters(
          [leafType, ...proofType],
          claim,
        );
        const hash = keccak256(toBytes(label));
        const coversLabel =
          hash === leaf.value ||
          (BigInt(leaf.value) < BigInt(hash) &&
            BigInt(hash) < BigInt(leaf.nextValue));
        if (
          leaf.kind > 2 ||
          !coversLabel ||
          !verify(
            root,
            keccak256(encodeAbiParameters([leafType], [leaf])),
            siblings,
          )
        )
          throw new Error("Proof does not cover this label and root");
        claims.push({ feature: deployment.reservationFeature, data: claim });
      } catch (cause) {
        throw new OnchainError(
          "INVALID_PROOF",
          "The reservation proof does not match this label and activation.",
          { cause },
        );
      }
    }
  }
  return claims.length === 0
    ? "0x"
    : encodeAbiParameters(
        [
          {
            type: "tuple[]",
            components: [
              { name: "feature", type: "address" },
              { name: "data", type: "bytes" },
            ],
          },
        ],
        [claims],
      );
}
