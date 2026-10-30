import { keccak256, toBytes, zeroAddress, zeroHash } from "viem";
import { managerAbi, registryAbi } from "./abis.js";
import type { ReadContext } from "./context.js";
import type { Activation, BlockedReason } from "./types.js";
import { labelId, parentName } from "./validation.js";

export async function readActivation(
  ctx: ReadContext,
  input: string,
): Promise<Activation> {
  const name = parentName(input);
  const label = name.slice(0, -4);
  const { client, deployment, blockNumber } = ctx;
  const id = await client.readContract({
    address: deployment.manager,
    abi: managerAbi,
    functionName: "activationIdOf",
    args: [keccak256(toBytes(label))],
    blockNumber,
  });
  const [stored, features, liveSubregistry, parentExpiry] = await Promise.all([
    client.readContract({
      address: deployment.manager,
      abi: managerAbi,
      functionName: "activations",
      args: [id],
      blockNumber,
    }),
    client.readContract({
      address: deployment.manager,
      abi: managerAbi,
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
      args: [labelId(label)],
      blockNumber,
    }),
  ]);
  return {
    id,
    parentName: name,
    configured: stored[5] !== zeroHash,
    active: stored[0],
    expirable: stored[2] === 0,
    resolver: stored[6],
    subregistry: stored[8],
    liveSubregistry,
    features,
    parentExpiry,
  };
}

export function activationBlock(activation: Activation): BlockedReason | null {
  if (!activation.configured)
    return {
      code: "NOT_ACTIVATED",
      message: "This parent isn't set up to issue subnames yet.",
    };
  if (!activation.active)
    return {
      code: "PAUSED",
      message: "Subname issuance and renewal are paused for this parent.",
    };
  if (activation.liveSubregistry === zeroAddress)
    return {
      code: "PARENT_UNAVAILABLE",
      message: "The parent has expired or has no subregistry.",
    };
  if (
    activation.liveSubregistry.toLowerCase() !==
    activation.subregistry.toLowerCase()
  )
    return {
      code: "SUBREGISTRY_CHANGED",
      message:
        "The parent's subregistry changed. Its administrator must activate it again.",
    };
  return null;
}
