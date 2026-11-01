import { zeroAddress, type Hex } from "viem";
import { getNamespaceV2Contracts } from "@thenamespace/addresses";
import { activationManagerAbi, registryAbi } from "./abis.js";
import { getParentBlockReason, readParentState } from "./activation.js";
import type { ReadContext } from "./context.js";
import { prepareFeatureClaims } from "./proofs.js";
import type {
  OperationBlockCode,
  OperationBlockReason,
  ParentState,
  QuoteContext,
  QuoteOutcome,
  RegistrationInput,
  RegistrationQuote,
  RenewalInput,
  RenewalQuote,
} from "./types.js";
import {
  validateAddress,
  getLabelId,
  MAX_UINT64,
  validateSubnameInput,
} from "./validation.js";

const DENIALS: Record<number, [OperationBlockCode, string]> = {
  1: [
    "PARENT_PAUSED",
    "Subname registration and renewal are paused for this parent.",
  ],
  2: ["INVALID_LABEL", "Enter a subname label."],
  3: ["PARENT_UNAVAILABLE", "The parent has no subregistry."],
  4: ["NAME_TAKEN", "This subname is already registered."],
  5: ["REGISTRATION_NOT_STARTED", "Registration hasn't opened yet."],
  6: ["REGISTRATION_ENDED", "Registration has closed."],
  7: [
    "NOT_ELIGIBLE",
    "This account isn't eligible to register under this parent.",
  ],
  8: ["POLICY_DENIED", "The parent's rules prevent this registration."],
  9: ["RESERVED", "This subname is reserved."],
  10: ["DURATION_TOO_SHORT", "Choose a duration of at least 28 days."],
  11: ["RENEWAL_DISABLED", "The parent currently does not allow renewals."],
};
function decodeContractDenial(reason: number): OperationBlockReason {
  const [code, message] = DENIALS[reason] ?? [
    "CONTRACT_DENIED",
    "The contract denied this operation.",
  ];
  return { code, message, details: { contractReason: reason } };
}

interface QuotedOperation<Q> {
  quote: Q;
  parent: ParentState;
  encodedClaims: Hex;
}

// Unknown modules can inspect the account. Only known account-independent policies
// may produce a disconnected quote; zero-address eligibility is never presented as final.
function canQuoteWithoutAccount(
  ctx: ReadContext,
  parent: ParentState,
  operation: "registration" | "renewal",
) {
  const features = getNamespaceV2Contracts(
    ctx.deployment.chainId === 11155111,
  )!.features;
  const independent = [
    features.labelPrices,
    features.specialPrices,
    features.deadline,
    features.reservation,
  ];
  if (operation === "renewal") independent.push(features.tokenGate);
  return parent.featureAddresses.every((feature) =>
    independent.some(
      (address) => address.toLowerCase() === feature.toLowerCase(),
    ),
  );
}

function quoteContext(
  ctx: ReadContext,
  input: RegistrationInput | RenewalInput,
  parent: ParentState,
  names: ReturnType<typeof validateSubnameInput>,
): QuoteContext {
  return {
    name: `${names.label}.${names.parentName}`,
    parentName: names.parentName,
    label: names.label,
    account:
      input.account === undefined
        ? null
        : validateAddress(input.account, "account"),
    chainId: ctx.deployment.chainId,
    durationSeconds: names.durationSeconds,
    blockNumber: ctx.blockNumber,
    expirationType: parent.expirationType,
    parentExpiresAtSeconds: parent.parentExpiresAtSeconds,
  };
}

export async function readRegistrationQuote(
  ctx: ReadContext,
  input: RegistrationInput,
): Promise<QuotedOperation<RegistrationQuote>> {
  const names = validateSubnameInput(input);
  const parent = await readParentState(ctx, names.parentName);
  const base = quoteContext(ctx, input, parent, names);
  let encodedClaims: Hex = "0x";
  const finish = (
    outcome: QuoteOutcome,
  ): QuotedOperation<RegistrationQuote> => ({
    quote: { ...base, ...outcome },
    parent,
    encodedClaims,
  });
  const block = (reason: OperationBlockReason) =>
    finish({ status: "blocked", reason, price: null });
  const parentBlock = getParentBlockReason(parent);
  if (parentBlock) return block(parentBlock);
  const { client, deployment, blockNumber } = ctx;
  const [status, permitted] = await Promise.all([
    client.readContract({
      address: parent.boundSubregistry!,
      abi: registryAbi,
      functionName: "getStatus",
      args: [getLabelId(names.label)],
      blockNumber,
    }),
    client.readContract({
      address: parent.boundSubregistry!,
      abi: registryAbi,
      functionName: "hasRootRoles",
      args: [1n, deployment.subnameIssuer],
      blockNumber,
    }),
  ]);
  if (status !== 0) return block(decodeContractDenial(status === 1 ? 9 : 4));
  if (!permitted)
    return block({
      code: "ISSUER_NOT_AUTHORIZED",
      message:
        "The parent administrator must grant the issuer permission to register subnames.",
    });
  if (
    parent.expirationType === "expiring" &&
    names.durationSeconds < 28n * 86400n
  )
    return block(decodeContractDenial(10));
  if (
    base.account === null &&
    !canQuoteWithoutAccount(ctx, parent, "registration")
  )
    return finish({
      status: "account_required",
      account: null,
      reason: null,
      price: null,
    });
  encodedClaims = await prepareFeatureClaims(
    ctx,
    parent,
    names.label,
    base.account ?? zeroAddress,
    "registration",
  );
  const result = await client.readContract({
    address: deployment.activationManager,
    abi: activationManagerAbi,
    functionName: "quoteMint",
    args: [
      names.parentLabel,
      names.label,
      base.account ?? zeroAddress,
      names.durationSeconds,
      encodedClaims,
    ],
    blockNumber,
  });
  if (!result.canMint) return block(decodeContractDenial(result.denied));
  const price = {
    currency: "USD",
    amount: result.price,
    decimals: 12,
  } as const;
  return finish(
    base.account === null
      ? { status: "account_required", account: null, reason: null, price }
      : { status: "ready", account: base.account, reason: null, price },
  );
}

export async function readRenewalQuote(
  ctx: ReadContext,
  input: RenewalInput,
): Promise<QuotedOperation<RenewalQuote>> {
  const names = validateSubnameInput(input, true);
  const parent = await readParentState(ctx, names.parentName);
  const base: QuoteContext &
    Pick<RenewalQuote, "owner" | "expiresAtSeconds" | "newExpiresAtSeconds"> = {
    ...quoteContext(ctx, input, parent, names),
    expirationType: null,
    owner: null,
    expiresAtSeconds: null,
    newExpiresAtSeconds: null,
  };
  let encodedClaims: Hex = "0x";
  const finish = (outcome: QuoteOutcome): QuotedOperation<RenewalQuote> => ({
    quote: { ...base, ...outcome },
    parent,
    encodedClaims,
  });
  const block = (reason: OperationBlockReason) =>
    finish({ status: "blocked", reason, price: null });
  const parentBlock = getParentBlockReason(parent);
  if (parentBlock) return block(parentBlock);
  const { client, deployment, blockNumber } = ctx;
  const [owner, expiry, permitted] = await Promise.all([
    client.readContract({
      address: parent.boundSubregistry!,
      abi: registryAbi,
      functionName: "getOwner",
      args: [getLabelId(names.label)],
      blockNumber,
    }),
    client.readContract({
      address: parent.boundSubregistry!,
      abi: registryAbi,
      functionName: "getExpiry",
      args: [getLabelId(names.label)],
      blockNumber,
    }),
    client.readContract({
      address: parent.boundSubregistry!,
      abi: registryAbi,
      functionName: "hasRoles",
      args: [getLabelId(names.label), 1n << 16n, deployment.subnameIssuer],
      blockNumber,
    }),
  ]);
  base.owner = owner === zeroAddress ? null : owner;
  if (base.owner === null)
    return block({
      code: "NAME_NOT_REGISTERED",
      message:
        "This subname isn't registered or has expired. Register it instead.",
    });
  base.expirationType = expiry === MAX_UINT64 ? "permanent" : "expiring";
  if (base.expirationType === "permanent")
    return block({
      code: "PERMANENT_REGISTRATION",
      message: "This registration is permanent and does not need renewal.",
    });
  base.expiresAtSeconds = expiry;
  if (parent.expirationType !== "expiring")
    return block(decodeContractDenial(11));
  if (names.durationSeconds > MAX_UINT64 - expiry)
    return block({
      code: "EXPIRY_OVERFLOW",
      message: "Choose a shorter renewal duration.",
    });
  if (!permitted)
    return block({
      code: "ISSUER_NOT_AUTHORIZED",
      message:
        "The parent administrator must grant the issuer permission to renew subnames.",
    });
  if (names.durationSeconds < 28n * 86400n)
    return block(decodeContractDenial(10));
  if (
    base.account === null &&
    !canQuoteWithoutAccount(ctx, parent, "renewal")
  ) {
    base.newExpiresAtSeconds = expiry + names.durationSeconds;
    return finish({
      status: "account_required",
      account: null,
      reason: null,
      price: null,
    });
  }
  encodedClaims = await prepareFeatureClaims(
    ctx,
    parent,
    names.label,
    base.account ?? zeroAddress,
    "renewal",
  );
  const result = await client.readContract({
    address: deployment.activationManager,
    abi: activationManagerAbi,
    functionName: "quoteRenewal",
    args: [
      names.parentLabel,
      names.label,
      base.account ?? zeroAddress,
      names.durationSeconds,
      encodedClaims,
    ],
    blockNumber,
  });
  if (!result.canRenew) return block(decodeContractDenial(result.denied));
  base.newExpiresAtSeconds = expiry + names.durationSeconds;
  const price = {
    currency: "USD",
    amount: result.price,
    decimals: 12,
  } as const;
  return finish(
    base.account === null
      ? { status: "account_required", account: null, reason: null, price }
      : { status: "ready", account: base.account, reason: null, price },
  );
}
