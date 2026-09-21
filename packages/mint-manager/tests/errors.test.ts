import { MintManagerError, createError } from "../src/errors";

describe("MintManagerError", () => {
  it("is an Error with the MintManagerError name", () => {
    const err = new MintManagerError("CONFIG_ERROR", "boom");

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MintManagerError);
    expect(err.name).toBe("MintManagerError");
    expect(err.message).toBe("boom");
    expect(err.code).toBe("CONFIG_ERROR");
  });

  it("survives the prototype chain restoration used for ES5 targets", () => {
    // Subclasses must still satisfy `instanceof` both ways.
    class Subclass extends MintManagerError {}
    const err = new Subclass("RPC_ERROR", "boom");

    expect(err).toBeInstanceOf(Subclass);
    expect(err).toBeInstanceOf(MintManagerError);
  });

  it("carries details, docsUrl and cause when supplied", () => {
    const cause = new Error("underlying");
    const err = new MintManagerError("API_ERROR", "boom", {
      details: { status: 500 },
      docsUrl: "https://docs.namespace.ninja",
      cause,
    });

    expect(err.details).toEqual({ status: 500 });
    expect(err.docsUrl).toBe("https://docs.namespace.ninja");
    expect((err as { cause?: unknown }).cause).toBe(cause);
  });

  it("leaves details, docsUrl and cause undefined when not supplied", () => {
    const err = new MintManagerError("INVALID_NAME", "boom");

    expect(err.details).toBeUndefined();
    expect(err.docsUrl).toBeUndefined();
    expect("cause" in err).toBe(false);
  });

  it("produces a usable stack trace", () => {
    const err = new MintManagerError("RPC_ERROR", "boom");
    expect(typeof err.stack).toBe("string");
    expect(err.stack).toContain("MintManagerError");
  });
});

describe("createError messages", () => {
  it("invalidName states the raw input, the reason, and a valid example", () => {
    const err = createError.invalidName("Al ice.eth", "disallowed character");

    expect(err).toBeInstanceOf(MintManagerError);
    expect(err.code).toBe("INVALID_NAME");
    expect(err.message).toContain('"Al ice.eth"');
    expect(err.message).toContain("disallowed character");
    expect(err.message).toContain("namespace.eth");
    expect(err.details).toEqual({ name: "Al ice.eth" });
  });

  it("invalidName renders an empty string readably", () => {
    expect(createError.invalidName("", "the name is empty").message).toContain(
      "empty string"
    );
  });

  it("invalidLabel explains the label-vs-name distinction", () => {
    const err = createError.invalidLabel("alice.eth", 'a label cannot contain "."');

    expect(err.code).toBe("INVALID_LABEL");
    expect(err.message).toContain('"alice.eth"');
    expect(err.message).toContain('a label cannot contain "."');
    expect(err.message).toContain("leftmost");
  });

  it("invalidAddress names the offending field and shows a valid address", () => {
    const err = createError.invalidAddress("0x123", "minterAddress");

    expect(err.code).toBe("INVALID_ADDRESS");
    expect(err.message).toContain("minterAddress");
    expect(err.message).toContain("0x123");
    expect(err.message).toContain("40-character hex");
    expect(err.details).toEqual({ field: "minterAddress", value: "0x123" });
  });

  it("unsupportedChain lists the supported chains when known", () => {
    const err = createError.unsupportedChain(9999, ["mainnet", "base"]);

    expect(err.code).toBe("UNSUPPORTED_CHAIN");
    expect(err.message).toContain("mainnet, base");
    expect(err.message).toContain("isTestnet");
  });

  it("unsupportedChain omits the list when no chains are given", () => {
    const err = createError.unsupportedChain(9999);
    expect(err.message).not.toContain("Supported chains");
  });

  it("unsupportedListing points off-chain names at the other SDK", () => {
    const err = createError.unsupportedListing("OFFCHAIN", "namespace.eth");

    expect(err.code).toBe("UNSUPPORTED_LISTING");
    expect(err.message).toContain("namespace.eth");
    expect(err.message).toContain("offchain-manager");
  });

  it("listingNotFound explains that listings are per-network", () => {
    const err = createError.listingNotFound("namespace.eth");

    expect(err.code).toBe("LISTING_NOT_FOUND");
    expect(err.message).toContain("namespace.eth");
    expect(err.message).toContain("isTestnet");
  });

  it("rpcError preserves the cause and suggests a custom RPC", () => {
    const cause = new Error("429 Too Many Requests");
    const err = createError.rpcError("reading subname owner", 8453, cause);

    expect(err.code).toBe("RPC_ERROR");
    expect(err.message).toContain("reading subname owner");
    expect(err.message).toContain("chain 8453");
    expect(err.message).toContain("429 Too Many Requests");
    expect(err.message).toContain("customRpcUrls");
    expect((err as { cause?: unknown }).cause).toBe(cause);
  });

  it("apiError distinguishes 404, 5xx and transport failures", () => {
    expect(createError.apiError(404, "/api/v1/listing").message).toContain(
      "not listed"
    );
    expect(createError.apiError(503, "/api/v1/listing").message).toContain(
      "retry with backoff"
    );

    const transport = createError.apiError(
      undefined,
      "/api/v1/listing",
      undefined,
      new Error("ECONNREFUSED")
    );
    expect(transport.message).toContain("ECONNREFUSED");
    expect(transport.message).toContain("network connectivity");
  });

  it("mintParamsMismatch reports both sides of the disagreement", () => {
    const err = createError.mintParamsMismatch("label", "Alice", "alice");

    expect(err.code).toBe("MINT_PARAMS_MISMATCH");
    expect(err.message).toContain('"Alice"');
    expect(err.message).toContain('"alice"');
    expect(err.details).toEqual({
      field: "label",
      expected: "Alice",
      actual: "alice",
    });
  });

  it("priceExceedsMax reports wei values without bigint serialization issues", () => {
    const err = createError.priceExceedsMax(1500n, 1000n);

    expect(err.code).toBe("PRICE_EXCEEDS_MAX");
    expect(err.message).toContain("1500 wei");
    expect(err.message).toContain("1000 wei");
    expect(() => JSON.stringify(err.details)).not.toThrow();
  });

  it("signatureExpired reports how stale the signature is", () => {
    const err = createError.signatureExpired(1000, 1090);

    expect(err.code).toBe("SIGNATURE_EXPIRED");
    expect(err.message).toContain("90 seconds ago");
    expect(err.message).toContain("getMintTransactionParameters");
  });

  it("configError explains what to fix", () => {
    const err = createError.configError("listManagerUri is not a valid URL", {
      listManagerUri: "not-a-url",
    });

    expect(err.code).toBe("CONFIG_ERROR");
    expect(err.message).toContain("listManagerUri is not a valid URL");
    expect(err.message).toContain("createMintClient");
  });

  it("every factory returns a MintManagerError", () => {
    const samples = [
      createError.invalidName("x", "r"),
      createError.invalidLabel("x", "r"),
      createError.invalidAddress("x", "f"),
      createError.unsupportedChain(1),
      createError.unsupportedListing("X", "n.eth"),
      createError.listingNotFound("n.eth"),
      createError.rpcError("op", 1),
      createError.apiError(500, "/x"),
      createError.mintParamsMismatch("f", 1, 2),
      createError.priceExceedsMax(2n, 1n),
      createError.signatureExpired(1, 2),
      createError.configError("r"),
    ];

    for (const err of samples) {
      expect(err).toBeInstanceOf(MintManagerError);
      expect(err.name).toBe("MintManagerError");
      // Every message must be substantive enough to act on.
      expect(err.message.length).toBeGreaterThan(40);
    }
  });
});
