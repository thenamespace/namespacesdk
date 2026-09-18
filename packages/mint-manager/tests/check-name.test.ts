/**
 * Tests for checkName / prepareMint.
 *
 * The listing and mint APIs are stubbed so these run offline and deterministic.
 * The case that matters most is the gated listing: the API stops at the gate
 * and never evaluates the name, so "free but you may not mint it" and "already
 * taken" arrive with an identical API response and can only be told apart by
 * consulting the registry.
 */
import { createMintClient, MintManagerError } from "../src";
import type { MintClient } from "../src";

type Stub = {
  listing?: unknown;
  canMint?: boolean;
  validationErrors?: string[];
  nameIsFree?: boolean;
};

/**
 * Builds a client with its two network seams replaced: the HTTP layer and the
 * registry lookup. Returns the client plus a counter so a test can assert an
 * RPC call did or did not happen.
 */
function stubClient(stub: Stub) {
  const client = createMintClient() as MintClient & Record<string, any>;
  const rpcCalls = { count: 0 };

  client.listManagerHttp = {
    get: async () => ({
      data: stub.listing ?? {
        name: "oppunk.eth",
        nameNetwork: "MAINNET",
        type: "L2",
        l2Metadata: { registryNetwork: "OPTIMISM" },
      },
    }),
  };

  client.mintManagerHttp = {
    get: async () => ({
      data: {
        canMint: stub.canMint ?? false,
        estimatedPriceEth: 0.01,
        estimatedFeeEth: 0.001,
        isStandardFee: true,
        validationErrors: stub.validationErrors ?? [],
      },
    }),
    post: async () => ({ data: {} }),
  };

  const registryLookup = async () => {
    rpcCalls.count++;
    return stub.nameIsFree ?? true;
  };
  client.isL2SubnameAvailable = registryLookup;
  client.isL1SubnameAvailable = registryLookup;

  return { client: client as MintClient, rpcCalls };
}

const MINTER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const NAME = "alice.oppunk.eth";

describe("checkName", () => {
  it("reports an open listing with a free name as available", async () => {
    const { client } = stubClient({ canMint: true });
    const result = await client.checkName(NAME, { minterAddress: MINTER });

    expect(result.status).toBe("available");
    if (result.status !== "available") throw new Error("unreachable");
    expect(result.estimatedPriceEth).toBe(0.01);
  });

  it("derives the chain id from the listing rather than the caller", async () => {
    const { client } = stubClient({ canMint: true });
    const result = await client.checkName(NAME, { minterAddress: MINTER });

    expect(result.chainId).toBe(10); // Optimism, from l2Metadata
    expect(result.listingType).toBe("L2");
  });

  it("splits the name so the caller does not have to", async () => {
    const { client } = stubClient({ canMint: true });
    const result = await client.checkName("alice.sub.oppunk.eth", {
      minterAddress: MINTER,
    });

    expect(result.label).toBe("alice");
    expect(result.parentName).toBe("sub.oppunk.eth");
  });

  it("normalizes the name it reports back", async () => {
    const { client } = stubClient({ canMint: true });
    const result = await client.checkName("ALICE.oppunk.eth", {
      minterAddress: MINTER,
    });

    expect(result.name).toBe("alice.oppunk.eth");
  });

  it("reports a registered name without consulting the registry", async () => {
    // SUBNAME_TAKEN already answers the question, so an RPC call is wasted.
    const { client, rpcCalls } = stubClient({
      canMint: false,
      validationErrors: ["SUBNAME_TAKEN"],
    });
    const result = await client.checkName(NAME, { minterAddress: MINTER });

    expect(result.status).toBe("taken");
    expect(rpcCalls.count).toBe(0);
  });

  describe("SUBNAME_RESERVED is a restriction, not proof of registration", () => {
    it("reports a reserved but unregistered name as blocked", async () => {
      // A reserved name is held back by the parent owner, not minted. Assuming
      // "reserved" meant "taken" would tell the user it is gone when it is not.
      const { client, rpcCalls } = stubClient({
        canMint: false,
        validationErrors: ["SUBNAME_RESERVED"],
        nameIsFree: true,
      });
      const result = await client.checkName(NAME, { minterAddress: MINTER });

      expect(result.status).toBe("blocked");
      expect(rpcCalls.count).toBe(1);
    });

    it("reports a reserved name that is also registered as taken", async () => {
      const { client } = stubClient({
        canMint: false,
        validationErrors: ["SUBNAME_RESERVED"],
        nameIsFree: false,
      });
      const result = await client.checkName(NAME, { minterAddress: MINTER });

      expect(result.status).toBe("taken");
    });
  });

  describe("minter-level restrictions are distinguished from name-level ones", () => {
    const minterGates = [
      "MINTER_NOT_WHITELISTED",
      "MINTER_NOT_TOKEN_OWNER",
      "VERIFIED_MINTER_ADDRESS_REQUIRED",
      "LISTING_EXPIRED",
    ];

    it.each(minterGates)(
      "%s on a free name reports blocked, not taken",
      async (reason) => {
        const { client } = stubClient({
          canMint: false,
          validationErrors: [reason],
          nameIsFree: true,
        });
        const result = await client.checkName(NAME, { minterAddress: MINTER });

        expect(result.status).toBe("blocked");
        if (result.status !== "blocked") throw new Error("unreachable");
        expect(result.reasons).toEqual([reason]);
      }
    );
  });

  describe("gated listing, where the API never evaluates the name", () => {
    it("distinguishes a free name as blocked, not taken", async () => {
      const { client, rpcCalls } = stubClient({
        canMint: false,
        validationErrors: ["MINTER_NOT_WHITELISTED"],
        nameIsFree: true,
      });
      const result = await client.checkName(NAME, { minterAddress: MINTER });

      expect(result.status).toBe("blocked");
      if (result.status !== "blocked") throw new Error("unreachable");
      expect(result.nameAvailabilityConfirmed).toBe(true);
      expect(result.reasons).toEqual(["MINTER_NOT_WHITELISTED"]);
      expect(rpcCalls.count).toBe(1);
    });

    it("distinguishes a taken name as taken, from the same API response", async () => {
      // Identical API response to the test above. Only the registry separates them.
      const { client, rpcCalls } = stubClient({
        canMint: false,
        validationErrors: ["MINTER_NOT_WHITELISTED"],
        nameIsFree: false,
      });
      const result = await client.checkName(NAME, { minterAddress: MINTER });

      expect(result.status).toBe("taken");
      expect(rpcCalls.count).toBe(1);
    });
  });

  describe("rpc policy", () => {
    it('"never" leaves availability unconfirmed instead of guessing', async () => {
      const { client, rpcCalls } = stubClient({
        canMint: false,
        validationErrors: ["MINTER_NOT_WHITELISTED"],
      });
      const result = await client.checkName(NAME, {
        minterAddress: MINTER,
        rpc: "never",
      });

      expect(result.status).toBe("blocked");
      if (result.status !== "blocked") throw new Error("unreachable");
      expect(result.nameAvailabilityConfirmed).toBe(false);
      expect(rpcCalls.count).toBe(0);
    });

    it('"always" catches a stale API quote for a name already taken', async () => {
      const { client, rpcCalls } = stubClient({
        canMint: true,
        nameIsFree: false,
      });
      const result = await client.checkName(NAME, {
        minterAddress: MINTER,
        rpc: "always",
      });

      expect(result.status).toBe("taken");
      expect(rpcCalls.count).toBe(1);
    });

    it('"auto" skips the registry when the API result is conclusive', async () => {
      const { client, rpcCalls } = stubClient({ canMint: true });
      await client.checkName(NAME, { minterAddress: MINTER, rpc: "auto" });

      expect(rpcCalls.count).toBe(0);
    });
  });

  it("rejects an unnormalizable name before any request", async () => {
    const { client } = stubClient({ canMint: true });
    await expect(
      client.checkName("аlice.oppunk.eth", { minterAddress: MINTER })
    ).rejects.toMatchObject({ code: "INVALID_NAME" });
  });

  it("reports a missing listing rather than an empty-body 200", async () => {
    // The list-manager answers 200 with "" for a name it does not have.
    const { client } = stubClient({ listing: "" });
    await expect(
      client.checkName(NAME, { minterAddress: MINTER })
    ).rejects.toMatchObject({ code: "LISTING_NOT_FOUND" });
  });
});

describe("prepareMint", () => {
  it("refuses a check that is not available", async () => {
    const { client } = stubClient({
      canMint: false,
      validationErrors: ["SUBNAME_RESERVED"],
    });
    const check = await client.checkName(NAME, { minterAddress: MINTER });

    await expect(
      client.prepareMint(check, { minterAddress: MINTER })
    ).rejects.toMatchObject({ code: "NAME_NOT_AVAILABLE" });
  });

  it("names the offending name and reason in the error", async () => {
    const { client } = stubClient({
      canMint: false,
      validationErrors: ["SUBNAME_TAKEN"],
    });
    const check = await client.checkName(NAME, { minterAddress: MINTER });

    await expect(
      client.prepareMint(check, { minterAddress: MINTER })
    ).rejects.toThrow(/alice\.oppunk\.eth.*taken.*SUBNAME_TAKEN/s);
  });

  it("advises switching address, not label, for a minter-level gate", async () => {
    // Telling someone to pick a different name when their wallet is the
    // problem sends them round a loop that cannot succeed.
    const { client } = stubClient({
      canMint: false,
      validationErrors: ["MINTER_NOT_WHITELISTED"],
      nameIsFree: true,
    });
    const check = await client.checkName(NAME, { minterAddress: MINTER });

    await expect(
      client.prepareMint(check, { minterAddress: MINTER })
    ).rejects.toThrow(/restriction is on the minting address/);
  });

  it("advises that no label helps once a listing has expired", async () => {
    const { client } = stubClient({
      canMint: false,
      validationErrors: ["LISTING_EXPIRED"],
      nameIsFree: true,
    });
    const check = await client.checkName(NAME, { minterAddress: MINTER });

    await expect(
      client.prepareMint(check, { minterAddress: MINTER })
    ).rejects.toThrow(/minting window has closed/);
  });

  it("rejects an unnormalizable name passed as a string", async () => {
    const { client } = stubClient({ canMint: true });
    await expect(
      client.prepareMint("аlice.oppunk.eth", { minterAddress: MINTER })
    ).rejects.toThrow(MintManagerError);
  });
});
