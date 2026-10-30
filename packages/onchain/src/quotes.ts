import { zeroAddress } from "viem";
import { managerAbi, registryAbi } from "./abis.js";
import { activationBlock, readActivation } from "./activation.js";
import type { ReadContext } from "./context.js";
import { buildClaims } from "./proofs.js";
import type {
  BlockedReason,
  MintInput,
  MintQuote,
  RenewalInput,
  RenewalQuote,
} from "./types.js";
import { address, labelId, MAX_UINT64, nameInput } from "./validation.js";

const DENIALS: Record<number, [string, string]> = {
  1: ["PAUSED", "Subname issuance and renewal are paused for this parent."],
  2: ["INVALID_LABEL", "Enter a subname label."],
  3: ["NO_SUBREGISTRY", "The parent has no subregistry."],
  4: ["NAME_TAKEN", "This subname is already registered."],
  5: ["NOT_STARTED", "Minting hasn't opened yet."],
  6: ["ENDED", "Minting has closed."],
  7: ["NOT_ELIGIBLE", "This wallet isn't eligible to mint under this parent."],
  8: ["MODULE_DENIED", "The parent's rules prevent this mint."],
  9: ["RESERVED", "This subname is reserved."],
  10: ["DURATION_TOO_SHORT", "Choose a duration of at least 28 days."],
  11: [
    "NOT_RENEWABLE",
    "These subnames are permanent and do not need renewal.",
  ],
};
function denial(reason: number): BlockedReason {
  const [code, message] = DENIALS[reason] ?? [
    "CONTRACT_DENIED",
    "The contract denied this operation.",
  ];
  return { code, message, contractReason: reason };
}

export async function mintQuote(
  ctx: ReadContext,
  input: MintInput,
): Promise<MintQuote> {
  const names = nameInput(input);
  const minter = address(input.minter, "minter", true);
  const activation = await readActivation(ctx, names.parentName);
  const result: MintQuote = {
    ...names,
    minter,
    activation,
    available: false,
    canMint: false,
    reserved: false,
    expirable: activation.expirable,
    reason: activationBlock(activation),
    priceUsdRaw: 0n,
    extraData: "0x",
  };
  if (result.reason) return result;
  const { client, deployment, blockNumber } = ctx;
  const [status, permitted] = await Promise.all([
    client.readContract({
      address: activation.subregistry,
      abi: registryAbi,
      functionName: "getStatus",
      args: [labelId(names.label)],
      blockNumber,
    }),
    client.readContract({
      address: activation.subregistry,
      abi: registryAbi,
      functionName: "hasRootRoles",
      args: [1n, deployment.issuer],
      blockNumber,
    }),
  ]);
  result.available = status === 0;
  if (status !== 0)
    return {
      ...result,
      reserved: status === 1,
      reason: denial(status === 1 ? 9 : 4),
    };
  if (!permitted)
    return {
      ...result,
      reason: {
        code: "ISSUER_NOT_AUTHORIZED",
        message:
          "The parent administrator must grant the issuer permission to register subnames.",
      },
    };
  const extraData = await buildClaims(
    ctx,
    activation,
    names.label,
    minter,
    false,
  );
  const quote = await client.readContract({
    address: deployment.manager,
    abi: managerAbi,
    functionName: "quoteMint",
    args: [names.parentLabel, names.label, minter, names.duration, extraData],
    blockNumber,
  });
  return {
    ...result,
    canMint: quote.canMint,
    reason: quote.canMint ? null : denial(quote.denied),
    reserved: quote.denied === 9,
    priceUsdRaw: quote.price,
    extraData,
  };
}

export async function renewalQuote(
  ctx: ReadContext,
  input: RenewalInput,
): Promise<RenewalQuote> {
  const names = nameInput(input);
  const renewer = address(input.renewer, "renewer", true);
  const activation = await readActivation(ctx, names.parentName);
  const result: RenewalQuote = {
    ...names,
    renewer,
    activation,
    renewable: false,
    reason: activationBlock(activation),
    priceUsdRaw: 0n,
    extraData: "0x",
    owner: zeroAddress,
    expiry: null,
    parentExpiry: activation.parentExpiry,
  };
  if (result.reason) return result;
  if (!activation.expirable) return { ...result, reason: denial(11) };
  const { client, deployment, blockNumber } = ctx;
  const [owner, expiry, permitted] = await Promise.all([
    client.readContract({
      address: activation.subregistry,
      abi: registryAbi,
      functionName: "getOwner",
      args: [labelId(names.label)],
      blockNumber,
    }),
    client.readContract({
      address: activation.subregistry,
      abi: registryAbi,
      functionName: "getExpiry",
      args: [labelId(names.label)],
      blockNumber,
    }),
    client.readContract({
      address: activation.subregistry,
      abi: registryAbi,
      functionName: "hasRoles",
      args: [labelId(names.label), 1n << 16n, deployment.issuer],
      blockNumber,
    }),
  ]);
  result.owner = owner;
  result.expiry = expiry;
  if (owner === zeroAddress)
    return {
      ...result,
      reason: {
        code: "NAME_NOT_REGISTERED",
        message:
          "This subname isn't registered or has expired. Mint it instead.",
      },
    };
  if (expiry === MAX_UINT64) return { ...result, reason: denial(11) };
  if (names.duration > MAX_UINT64 - expiry)
    return {
      ...result,
      reason: {
        code: "EXPIRY_OVERFLOW",
        message: "Choose a shorter renewal duration.",
      },
    };
  if (!permitted)
    return {
      ...result,
      reason: {
        code: "ISSUER_NOT_AUTHORIZED",
        message:
          "The parent administrator must grant the issuer permission to renew subnames.",
      },
    };
  const extraData = await buildClaims(
    ctx,
    activation,
    names.label,
    renewer,
    true,
  );
  const quote = await client.readContract({
    address: deployment.manager,
    abi: managerAbi,
    functionName: "quoteRenewal",
    args: [names.parentLabel, names.label, renewer, names.duration, extraData],
    blockNumber,
  });
  return {
    ...result,
    renewable: quote.canRenew,
    reason: quote.canRenew ? null : denial(quote.denied),
    priceUsdRaw: quote.price,
    extraData,
  };
}
