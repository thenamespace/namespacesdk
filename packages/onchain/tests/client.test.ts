import { decodeFunctionData, zeroAddress, zeroHash } from "viem";
import {
  createOnchainClient,
  getOnchainDeployment,
  OnchainError,
  ONE_YEAR,
  toOnchainError,
} from "../src";
import { erc20Abi, issuerAbi } from "../src/abis";
import {
  deployment,
  fixture,
  mintInput,
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
    await expect(f.client.quoteMint(mintInput)).rejects.toMatchObject({
      code: "CHAIN_MISMATCH",
    });
    expect(f.readContract).not.toHaveBeenCalled();
  });
  it.each(["alice.other.eth", "example.com"])(
    "rejects unsupported parent %s",
    async (parentName) => {
      await expect(
        fixture().client.quoteMint({ ...mintInput, parentName }),
      ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    },
  );
  it("normalizes labels before checking and preparing calldata", async () => {
    const f = fixture();
    const prepared = await f.client.prepareMint({
      ...mintInput,
      parentName: "EXAMPLE.eth",
      label: "ALICE",
      paymentToken: zeroAddress,
    });
    expect(prepared.quote.label).toBe("alice");
    const decoded = decodeFunctionData({
      abi: issuerAbi,
      data: prepared.calls[0].data,
    });
    expect(decoded.args?.[0]).toMatchObject({
      label: "alice",
      parentLabel: "example",
    });
  });
  it.each([-1n, 1n << 64n])("rejects duration %s", async (duration) => {
    await expect(
      fixture().client.quoteMint({ ...mintInput, duration }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("rejects zero recipient", async () => {
    await expect(
      fixture().client.prepareMint({
        ...mintInput,
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
    const result = await f.client.quoteMint(mintInput);
    expect(result.activation.id).not.toBe(zeroHash);
    expect(result.reason?.code).toBe("NOT_ACTIVATED");
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it.each([1, 2])(
    "does not report registry status %s as available",
    async (status) => {
      const f = fixture();
      f.state.status = status;
      const result = await f.client.quoteMint(mintInput);
      expect(result.available).toBe(false);
      expect(result.canMint).toBe(false);
    },
  );
  it("blocks stale parent subregistry bindings", async () => {
    const f = fixture();
    f.state.liveSubregistry = recipient;
    await expect(
      f.client.prepareMint({ ...mintInput, paymentToken: usdc }),
    ).rejects.toMatchObject({
      code: "MINT_BLOCKED",
      details: { reason: { code: "SUBREGISTRY_CHANGED" } },
    });
  });
  it("checks issuer permission", async () => {
    const f = fixture();
    f.state.permitted = false;
    expect((await f.client.quoteMint(mintInput)).reason?.code).toBe(
      "ISSUER_NOT_AUTHORIZED",
    );
  });
  it("keeps taken names separate from wallet ineligibility", async () => {
    const f = fixture();
    f.state.canMint = false;
    f.state.denied = 7;
    expect(await f.client.quoteMint(mintInput)).toMatchObject({
      available: true,
      canMint: false,
      reason: { code: "NOT_ELIGIBLE", contractReason: 7 },
    });
  });
  it("reads one consistent block for each quote", async () => {
    const f = fixture();
    await f.client.quoteMint(mintInput);
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
    const prepared = await f.client.prepareMint({
      ...mintInput,
      recipient,
      paymentToken: usdc,
    });
    expect(f.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "allowance",
        args: [payer, deployment.issuer],
      }),
    );
    expect(
      decodeFunctionData({ abi: issuerAbi, data: prepared.calls[1].data })
        .args?.[0],
    ).toMatchObject({ owner: recipient });
    expect(prepared.calls.every((call) => call.value === 0n)).toBe(true);
  });
  it("approves when allowance covers the raw quote but not its buffer", async () => {
    const f = fixture();
    f.state.allowance = 1_010_000n;
    const result = await f.client.prepareMint({
      ...mintInput,
      paymentToken: usdc,
    });
    expect(
      decodeFunctionData({ abi: erc20Abi, data: result.calls[0].data }).args,
    ).toEqual([deployment.issuer, 1_020_000n]);
  });
  it("skips approval when allowance covers the buffered amount", async () => {
    const f = fixture();
    f.state.allowance = 1_020_000n;
    expect(
      (await f.client.prepareMint({ ...mintInput, paymentToken: usdc })).calls,
    ).toHaveLength(1);
  });
  it("sends buffered value only for paid native mints", async () => {
    const f = fixture();
    expect(
      (await f.client.prepareMint({ ...mintInput, paymentToken: zeroAddress }))
        .calls[0].value,
    ).toBe(1_020_000n);
    f.state.price = 0n;
    f.state.payment = 0n;
    expect(
      (await f.client.prepareMint({ ...mintInput, paymentToken: zeroAddress }))
        .calls[0].value,
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
    await expect(f.client.quotePayment(0n, recipient)).rejects.toMatchObject({
      code: "UNSUPPORTED_TOKEN",
    });
  });
  it("rechecks current state and rejects a higher USD price", async () => {
    const f = fixture();
    const quote = await f.client.quoteMint(mintInput);
    f.state.price *= 2n;
    await expect(
      f.client.prepareMint({
        ...mintInput,
        paymentToken: zeroAddress,
        maxPriceUsdRaw: quote.priceUsdRaw,
      }),
    ).rejects.toMatchObject({ code: "PRICE_CHANGED" });
  });
  it("uses the live manager resolver precedence", async () => {
    const f = fixture();
    f.state.resolver = recipient;
    const result = await f.client.prepareMint({
      ...mintInput,
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
      decodeFunctionData({ abi: issuerAbi, data: result.calls[0].data })
        .functionName,
    ).toBe("renew");
    expect(f.readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: deployment.manager,
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
    expect((await f.client.quoteRenewal(renewalInput)).renewable).toBe(true);
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
      if (scenario === "overflow") f.state.expiry = (1n << 64n) - ONE_YEAR;
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
    await expect(f.client.quoteMint(mintInput)).rejects.toMatchObject({
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
