import { keccak256, toBytes, zeroAddress, zeroHash } from "viem";
import { activationManagerAbi, registryAbi } from "./abis.js";
import type { ReadContext } from "./context.js";
import type { ParentState, OperationBlockReason } from "./types.js";
import { getLabelId, normalizeParentName, MAX_UINT64 } from "./validation.js";

export async function readParentState(
  ctx: ReadContext,
  input: string,
): Promise<ParentState> {
  const name = normalizeParentName(input);
  const label = name.slice(0, -4);
  const { client, deployment, blockNumber } = ctx;
  const id = await client.readContract({
    address: deployment.activationManager,
    abi: activationManagerAbi,
    functionName: "activationIdOf",
    args: [keccak256(toBytes(label))],
    blockNumber,
  });
  const [stored, features, liveSubregistry, parentExpiry] = await Promise.all([
    client.readContract({
      address: deployment.activationManager,
      abi: activationManagerAbi,
      functionName: "activations",
      args: [id],
      blockNumber,
    }),
    client.readContract({
      address: deployment.activationManager,
      abi: activationManagerAbi,
      functionName: "featuresOf",
      args: [id],
      blockNumber,
    }),
    client.readContract({
      address: deployment.ethRegistry,
      abi: registryAbi,
      functionName: "getSubregistry",
      args: [label],
      blockNumber,
    }),
    client.readContract({
      address: deployment.ethRegistry,
      abi: registryAbi,
      functionName: "getExpiry",
      args: [getLabelId(label)],
      blockNumber,
    }),
  ]);
  const isConfigured = stored[5] !== zeroHash;
  return {
    activationId: id,
    parentName: name,
    isConfigured,
    isActive: isConfigured && stored[0],
    expirationType: isConfigured
      ? stored[2] === 0
        ? "expiring"
        : "permanent"
      : null,
    configuredResolver: isConfigured ? stored[6] : null,
    boundSubregistry:
      isConfigured && stored[8] !== zeroAddress ? stored[8] : null,
    currentSubregistry:
      liveSubregistry === zeroAddress ? null : liveSubregistry,
    featureAddresses: isConfigured ? features : [],
    parentExpiresAtSeconds:
      liveSubregistry === zeroAddress ||
      parentExpiry === 0n ||
      parentExpiry === MAX_UINT64
        ? null
        : parentExpiry,
  };
}

export function getParentBlockReason(
  parent: ParentState,
): OperationBlockReason | null {
  if (!parent.isConfigured)
    return {
      code: "PARENT_NOT_CONFIGURED",
      message: "This parent isn't set up to issue subnames yet.",
    };
  if (!parent.isActive)
    return {
      code: "PARENT_PAUSED",
      message: "Subname registration and renewal are paused for this parent.",
    };
  if (!parent.currentSubregistry || !parent.boundSubregistry)
    return {
      code: "PARENT_UNAVAILABLE",
      message: "The parent has expired or has no subregistry.",
    };
  if (
    parent.currentSubregistry.toLowerCase() !==
    parent.boundSubregistry.toLowerCase()
  )
    return {
      code: "SUBREGISTRY_CHANGED",
      message:
        "The parent's subregistry changed. Its administrator must activate it again.",
    };
  return null;
}
