import { zeroAddress } from "viem";
import { getNamespaceV2Contracts } from "@thenamespace/addresses";
import * as sdk from "../src";
import type { RenewalInput, UsdAmount } from "../src";
import {
  deployment,
  fixture,
  registrationInput,
  renewalInput,
  recipient,
} from "./fixture";

const withoutAccount = { parentName: "example.eth", label: "alice" };

describe("registration outcomes", () => {
  it("returns only application-facing context and exact pricing", async () => {
    const quote =
      await fixture().client.getRegistrationQuote(registrationInput);
    expect(quote).toEqual({
      name: "alice.example.eth",
      parentName: "example.eth",
      label: "alice",
      account: registrationInput.account,
      chainId: 11155111,
      durationSeconds: sdk.SECONDS_PER_YEAR,
      blockNumber: 123n,
      expirationType: "expiring",
      parentExpiresAtSeconds: 3_000_000_000n,
      status: "ready",
      reason: null,
      price: { currency: "USD", amount: 1_000_000_000_000n, decimals: 12 },
    });
  });
  it("distinguishes an unknown price from a confirmed free registration", async () => {
    const f = fixture();
    f.state.active = false;
    expect(
      await f.client.getRegistrationQuote(registrationInput),
    ).toMatchObject({
      status: "blocked",
      price: null,
      reason: { code: "PARENT_PAUSED" },
    });
    f.state.active = true;
    f.state.price = 0n;
    expect(
      await f.client.getRegistrationQuote(registrationInput),
    ).toMatchObject({ status: "ready", price: { amount: 0n } });
  });
  it("shows account-independent prices while requiring an account to proceed", async () => {
    const f = fixture();
    const features = getNamespaceV2Contracts(true)!.features;
    f.state.features = [
      features.labelPrices,
      features.specialPrices,
      features.deadline,
    ];
    expect(await f.client.getRegistrationQuote(withoutAccount)).toMatchObject({
      status: "account_required",
      account: null,
      reason: null,
      price: { amount: f.state.price },
    });
  });
  it.each([
    deployment.whitelistFeature,
    getNamespaceV2Contracts(true)!.features.tokenGate,
    recipient,
  ])(
    "does not guess account-dependent prices for feature %s",
    async (feature) => {
      const f = fixture();
      f.state.features = [feature];
      expect(await f.client.getRegistrationQuote(withoutAccount)).toMatchObject(
        { status: "account_required", account: null, price: null },
      );
      expect(f.fetch).not.toHaveBeenCalled();
      expect(
        f.readContract.mock.calls.some(([r]) => r.functionName === "quoteMint"),
      ).toBe(false);
    },
  );
  it("reports deterministic blocks even before an account is supplied", async () => {
    const f = fixture();
    f.state.status = 2;
    expect(await f.client.getRegistrationQuote(withoutAccount)).toMatchObject({
      status: "blocked",
      price: null,
      reason: { code: "NAME_TAKEN" },
    });
  });
  it("checks minimum duration before requesting account-dependent eligibility", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    expect(
      await f.client.getRegistrationQuote({
        ...withoutAccount,
        durationSeconds: 1n,
      }),
    ).toMatchObject({
      status: "blocked",
      reason: { code: "DURATION_TOO_SHORT" },
    });
  });
  it("exposes safe contract denials without presenting their zero-initialized price as free", async () => {
    const f = fixture();
    f.state.canMint = false;
    f.state.denied = 5;
    expect(await f.client.getRegistrationQuote(withoutAccount)).toMatchObject({
      status: "blocked",
      price: null,
      reason: {
        code: "REGISTRATION_NOT_STARTED",
        details: { contractReason: 5 },
      },
    });
  });
  it("rejects a zero address supplied as an account", async () => {
    await expect(
      fixture().client.getRegistrationQuote({
        ...withoutAccount,
        account: zeroAddress,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
      details: { field: "account" },
    });
  });
  it("requires a real account for preparation at runtime", async () => {
    await expect(
      fixture().client.prepareRegistration({
        ...registrationInput,
        account: undefined as unknown as typeof registrationInput.account,
        paymentToken: zeroAddress,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});

describe("parent state and renewal expiry", () => {
  it("does not fabricate configuration for an unconfigured parent", async () => {
    const f = fixture();
    f.state.configured = false;
    const parent = await f.client.getParentState("EXAMPLE.eth");
    expect(parent).toMatchObject({
      parentName: "example.eth",
      isConfigured: false,
      isActive: false,
      expirationType: null,
      configuredResolver: null,
      boundSubregistry: null,
      featureAddresses: [],
    });
    expect(
      await f.client.getRegistrationQuote(registrationInput),
    ).toMatchObject({
      status: "blocked",
      expirationType: null,
      price: null,
      reason: { code: "PARENT_NOT_CONFIGURED" },
    });
  });
  it("represents an unavailable parent registry and expiry with null", async () => {
    const f = fixture();
    f.state.liveSubregistry = zeroAddress;
    expect(await f.client.getParentState("example.eth")).toMatchObject({
      currentSubregistry: null,
      parentExpiresAtSeconds: null,
    });
  });
  it("does not expose a maximum integer as a permanent parent's expiry", async () => {
    const f = fixture();
    f.state.parentExpiry = (1n << 64n) - 1n;
    expect(
      (await f.client.getParentState("example.eth")).parentExpiresAtSeconds,
    ).toBeNull();
  });
  it("returns current and projected expiry independently of the paying account", async () => {
    const f = fixture();
    const quote = await f.client.getRenewalQuote(renewalInput);
    expect(quote).toMatchObject({
      status: "ready",
      account: renewalInput.account,
      owner: recipient,
      expiresAtSeconds: f.state.expiry,
      newExpiresAtSeconds: f.state.expiry + renewalInput.durationSeconds,
    });
    expect(quote).not.toHaveProperty("activation");
    expect(quote).not.toHaveProperty("extraData");
  });
  it("keeps finite child expiry when the parent switches to permanent issuance", async () => {
    const f = fixture();
    f.state.expirable = false;
    expect(await f.client.getRenewalQuote(renewalInput)).toMatchObject({
      status: "blocked",
      expirationType: "expiring",
      expiresAtSeconds: f.state.expiry,
      newExpiresAtSeconds: null,
      reason: { code: "RENEWAL_DISABLED" },
    });
  });
  it("returns null expiry for an actually permanent child", async () => {
    const f = fixture();
    f.state.expiry = (1n << 64n) - 1n;
    expect(await f.client.getRenewalQuote(renewalInput)).toMatchObject({
      status: "blocked",
      expirationType: "permanent",
      expiresAtSeconds: null,
      newExpiresAtSeconds: null,
      reason: { code: "PERMANENT_REGISTRATION" },
    });
  });
  it("does not infer child expiration type before reading the child", async () => {
    const f = fixture();
    f.state.active = false;
    expect(await f.client.getRenewalQuote(renewalInput)).toMatchObject({
      status: "blocked",
      expirationType: null,
      owner: null,
      expiresAtSeconds: null,
    });
  });
  it("returns null owner and expiry for an expired or absent registration", async () => {
    const f = fixture();
    f.state.owner = zeroAddress;
    expect(await f.client.getRenewalQuote(renewalInput)).toMatchObject({
      status: "blocked",
      owner: null,
      expiresAtSeconds: null,
      reason: { code: "NAME_NOT_REGISTERED" },
    });
  });
  it("requires explicit renewal duration even from JavaScript callers", async () => {
    await expect(
      fixture().client.getRenewalQuote(withoutAccount as RenewalInput),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
      details: { field: "durationSeconds" },
    });
  });
  it("supports disconnected renewal browsing without promising eligibility or discounts", async () => {
    const f = fixture();
    const input = { ...renewalInput, account: undefined };
    expect(await f.client.getRenewalQuote(input)).toMatchObject({
      status: "account_required",
      price: { amount: f.state.price },
      newExpiresAtSeconds: f.state.expiry + input.durationSeconds,
    });
    f.state.features = [deployment.whitelistFeature];
    expect(await f.client.getRenewalQuote(input)).toMatchObject({
      status: "account_required",
      price: null,
    });
  });
});

describe("USD amounts and public exports", () => {
  it.each([
    { currency: "ETH", amount: 1n, decimals: 12 },
    { currency: "USD", amount: 1n, decimals: 18 },
    { currency: "USD", amount: -1n, decimals: 12 },
    { currency: "USD", amount: 1, decimals: 12 },
  ])("rejects malformed USD amounts %p", async (price) => {
    await expect(
      fixture().client.getPaymentQuote({
        price: price as UsdAmount,
        paymentToken: zeroAddress,
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
  it("returns token denomination with its exact payment amount", async () => {
    const f = fixture();
    const result = await f.client.getPaymentQuote({
      price: { currency: "USD", amount: f.state.price, decimals: 12 },
      paymentToken: zeroAddress,
    });
    expect(result).toEqual({
      token: deployment.paymentTokens.find((t) => t.address === zeroAddress),
      amount: f.state.payment,
    });
  });
  it("validates the maximum USD price before preparing payment", async () => {
    await expect(
      fixture().client.prepareRegistration({
        ...registrationInput,
        paymentToken: zeroAddress,
        maxPriceUsd: {
          currency: "USD",
          amount: 1n,
          decimals: 18,
        } as unknown as UsdAmount,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
      details: { field: "maxPriceUsd" },
    });
  });
  it("exports the intended runtime API without legacy names or payment-policy helpers", () => {
    expect(Object.keys(sdk).sort()).toEqual(
      [
        "OnchainError",
        "SECONDS_PER_YEAR",
        "createOnchainClient",
        "getOnchainDeployment",
        "toOnchainError",
      ].sort(),
    );
  });
});
