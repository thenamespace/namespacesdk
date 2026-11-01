import { decodeFunctionData, zeroAddress, zeroHash } from "viem";
import {
  createOnchainClient,
  getOnchainDeployment,
  OnchainError,
  SECONDS_PER_YEAR,
  toOnchainError,
} from "../src";
import { erc20Abi, subnameIssuerAbi } from "../src/abis";
import {
  deployment,
  fixture,
  registrationInput,
  payer,
  recipient,
  renewalInput,
  usdc,
} from "./fixture";

describe("deployment and validation", () => {
  it("requires a supported explicit chain", () =>
    expect(() => getOnchainDeployment(8453)).toThrow(OnchainError));
  it("rejects a mismatched configured client", () => {
    const f = fixture();
    expect(() =>
      createOnchainClient({ publicClient: f.publicClient, chainId: 1 }),
    ).toThrow("same chain");
  });
  it("verifies the RPC chain instead of trusting its configured name", async () => {
    const f = fixture();
    f.getChainId.mockResolvedValue(1);
    await expect(
      f.client.getRegistrationQuote(registrationInput),
    ).rejects.toMatchObject({
      code: "CHAIN_MISMATCH",
    });
    expect(f.readContract).not.toHaveBeenCalled();
  });
  it.each(["alice.other.eth", "example.com"])(
    "rejects unsupported parent %s",
    async (parentName) => {
      await expect(
        fixture().client.getRegistrationQuote({
          ...registrationInput,
          parentName,
        }),
      ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    },
  );
  it("normalizes labels before checking and preparing calldata", async () => {
    const f = fixture();
    const prepared = await f.client.prepareRegistration({
      ...registrationInput,
      parentName: "EXAMPLE.eth",
      label: "ALICE",
      paymentToken: zeroAddress,
    });
    expect(prepared.quote.label).toBe("alice");
    const decoded = decodeFunctionData({
      abi: subnameIssuerAbi,
      data: prepared.calls[0].data,
    });
    expect(decoded.args?.[0]).toMatchObject({
      label: "alice",
      parentLabel: "example",
    });
  });
  it.each([-1n, 1n << 64n])("rejects duration %s", async (durationSeconds) => {
    await expect(
      fixture().client.getRegistrationQuote({
        ...registrationInput,
        durationSeconds,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("rejects zero recipient", async () => {
    await expect(
      fixture().client.prepareRegistration({
        ...registrationInput,
        recipient: zeroAddress,
        paymentToken: zeroAddress,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("quotes", () => {
  it("does not mistake an unactivated parent's nonzero ID for an activation", async () => {
    const f = fixture();
    f.state.configured = false;
    const result = await f.client.getRegistrationQuote(registrationInput);
    expect(
      (await f.client.getParentState(registrationInput.parentName))
        .activationId,
    ).not.toBe(zeroHash);
    expect(result.reason?.code).toBe("PARENT_NOT_CONFIGURED");
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it.each([1, 2])(
    "does not report registry status %s as available",
    async (status) => {
      const f = fixture();
      f.state.status = status;
      const result = await f.client.getRegistrationQuote(registrationInput);
      expect(result.status).toBe("blocked");
      expect(result.price).toBeNull();
    },
  );
  it("blocks stale parent subregistry bindings", async () => {
    const f = fixture();
    f.state.liveSubregistry = recipient;
    await expect(
      f.client.prepareRegistration({
        ...registrationInput,
        paymentToken: usdc,
      }),
    ).rejects.toMatchObject({
      code: "REGISTRATION_BLOCKED",
      details: { reason: { code: "SUBREGISTRY_CHANGED" } },
    });
  });
  it("checks issuer permission", async () => {
    const f = fixture();
    f.state.permitted = false;
    expect(
      (await f.client.getRegistrationQuote(registrationInput)).reason?.code,
    ).toBe("ISSUER_NOT_AUTHORIZED");
  });
  it("keeps taken names separate from wallet ineligibility", async () => {
    const f = fixture();
    f.state.canMint = false;
    f.state.denied = 7;
    expect(
      await f.client.getRegistrationQuote(registrationInput),
    ).toMatchObject({
      status: "blocked",
      reason: { code: "NOT_ELIGIBLE", details: { contractReason: 7 } },
    });
  });
  it("reads one consistent block for each quote", async () => {
    const f = fixture();
    await f.client.getRegistrationQuote(registrationInput);
    expect(
      f.readContract.mock.calls.every(
        ([request]) => request.blockNumber === 123n,
      ),
    ).toBe(true);
  });
});

describe("payment preparation", () => {
  it("uses the payer's allowance while registering to a different recipient", async () => {
    const f = fixture();
    const prepared = await f.client.prepareRegistration({
      ...registrationInput,
      recipient,
      paymentToken: usdc,
    });
    expect(f.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "allowance",
        args: [payer, deployment.subnameIssuer],
      }),
    );
    expect(
      decodeFunctionData({
        abi: subnameIssuerAbi,
        data: prepared.calls[1].data,
      }).args?.[0],
    ).toMatchObject({ owner: recipient });
    expect(prepared.calls.every((call) => call.value === 0n)).toBe(true);
  });
  it("approves when allowance covers the raw quote but not its buffer", async () => {
    const f = fixture();
    f.state.allowance = 1_010_000n;
    const result = await f.client.prepareRegistration({
      ...registrationInput,
      paymentToken: usdc,
    });
    expect(
      decodeFunctionData({ abi: erc20Abi, data: result.calls[0].data }).args,
    ).toEqual([deployment.subnameIssuer, 1_020_000n]);
  });
  it("skips approval when allowance covers the buffered amount", async () => {
    const f = fixture();
    f.state.allowance = 1_020_000n;
    expect(
      (
        await f.client.prepareRegistration({
          ...registrationInput,
          paymentToken: usdc,
        })
      ).calls,
    ).toHaveLength(1);
  });
  it("sends buffered value only for paid native mints", async () => {
    const f = fixture();
    expect(
      (
        await f.client.prepareRegistration({
          ...registrationInput,
          paymentToken: zeroAddress,
        })
      ).calls[0].value,
    ).toBe(1_020_000n);
    f.state.price = 0n;
    f.state.payment = 0n;
    expect(
      (
        await f.client.prepareRegistration({
          ...registrationInput,
          paymentToken: zeroAddress,
        })
      ).calls[0].value,
    ).toBe(0n);
    expect(f.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "quotePayment",
        args: [0n, zeroAddress],
      }),
    );
  });
  it("does not skip token validation for a free quote", async () => {
    const f = fixture();
    await expect(
      f.client.getPaymentQuote({
        price: { currency: "USD", amount: 0n, decimals: 12 },
        paymentToken: recipient,
      }),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_TOKEN",
    });
  });
  it("rechecks current state and rejects a higher USD price", async () => {
    const f = fixture();
    const quote = await f.client.getRegistrationQuote(registrationInput);
    f.state.price *= 2n;
    await expect(
      f.client.prepareRegistration({
        ...registrationInput,
        paymentToken: zeroAddress,
        maxPriceUsd: quote.price!,
      }),
    ).rejects.toMatchObject({ code: "PRICE_CHANGED" });
  });
  it("uses the live manager resolver precedence", async () => {
    const f = fixture();
    f.state.resolver = recipient;
    const result = await f.client.prepareRegistration({
      ...registrationInput,
      resolver: payer,
      paymentToken: zeroAddress,
    });
    expect(result.resolver).toBe(recipient);
  });
});

describe("renewal", () => {
  it("allows a payer different from the owner and returns renewal calls", async () => {
    const f = fixture();
    const result = await f.client.prepareRenewal({
      ...renewalInput,
      paymentToken: zeroAddress,
    });
    expect(result.quote.owner).toBe(recipient);
    expect(result.account).toBe(payer);
    expect(
      decodeFunctionData({ abi: subnameIssuerAbi, data: result.calls[0].data })
        .functionName,
    ).toBe("renew");
    expect(f.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: deployment.activationManager,
        functionName: "quoteRenewal",
      }),
    );
  });
  it("accepts token-scoped issuer renewal permission", async () => {
    const f = fixture();
    const read = f.readContract.getMockImplementation()!;
    f.readContract.mockImplementation(async (request) =>
      request.functionName === "hasRootRoles" ? false : read(request),
    );
    expect((await f.client.getRenewalQuote(renewalInput)).status).toBe("ready");
    expect(f.readContract).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "hasRoles" }),
    );
  });
  it.each(["permanent", "expired", "permission", "overflow"])(
    "blocks %s renewal",
    async (scenario) => {
      const f = fixture();
      if (scenario === "permanent") f.state.expiry = (1n << 64n) - 1n;
      if (scenario === "expired") f.state.owner = zeroAddress;
      if (scenario === "permission") f.state.permitted = false;
      if (scenario === "overflow")
        f.state.expiry = (1n << 64n) - SECONDS_PER_YEAR;
      await expect(
        f.client.prepareRenewal({ ...renewalInput, paymentToken: usdc }),
      ).rejects.toMatchObject({ code: "RENEWAL_BLOCKED" });
    },
  );
});

describe("error causes", () => {
  it("preserves the original RPC cause", async () => {
    const f = fixture();
    const cause = new Error("transport offline");
    f.readContract.mockRejectedValueOnce(cause);
    await expect(
      f.client.getRegistrationQuote(registrationInput),
    ).rejects.toMatchObject({
      code: "RPC_ERROR",
      cause,
    });
  });
  it("finds wallet rejection in nested provider causes", () => {
    const cause = { cause: { code: 4001 } };
    expect(toOnchainError(cause)).toMatchObject({
      code: "WALLET_REJECTED",
      cause,
    });
  });
});
