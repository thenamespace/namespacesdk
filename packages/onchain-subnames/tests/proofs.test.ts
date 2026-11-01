import {
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
  keccak256,
  toBytes,
  zeroHash,
  zeroAddress,
} from "viem";
import { createOnchainClient } from "../src";
import {
  deployment,
  fixture,
  registrationInput,
  payer,
  renewalInput,
} from "./fixture";

const proofType = [{ type: "bytes32[]" }] as const;
const whitelistClaim = encodeAbiParameters(proofType, [[]]);
const leafType = {
  type: "tuple",
  components: [
    { name: "value", type: "bytes32" },
    { name: "nextValue", type: "bytes32" },
    { name: "kind", type: "uint8" },
    { name: "price", type: "uint64" },
  ],
} as const;
const claimsType = [
  {
    type: "tuple[]",
    components: [
      { name: "feature", type: "address" },
      { name: "data", type: "bytes" },
    ],
  },
] as const;

describe("proof retrieval", () => {
  it("does not fetch inactive features' stored roots", async () => {
    const f = fixture();
    f.state.whitelistRoot = keccak256(toBytes("old"));
    f.state.reservationRoot = f.state.whitelistRoot;
    await f.client.getRegistrationQuote(registrationInput);
    expect(f.fetch).not.toHaveBeenCalled();
    expect(
      f.readContract.mock.calls.some(([r]) =>
        ["configs", "roots"].includes(r.functionName),
      ),
    ).toBe(false);
  });
  it("verifies and encodes a whitelist proof for the payer", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(encodePacked(["address"], [payer]));
    f.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ whitelisted: true, claim: whitelistClaim }),
      ),
    );
    await f.client.getRegistrationQuote(registrationInput);
    expect(
      decodeAbiParameters(
        claimsType,
        f.readContract.mock.calls.find(
          ([r]) => r.functionName === "quoteMint",
        )![0].args![4] as `0x${string}`,
      )[0],
    ).toEqual([{ feature: deployment.whitelistFeature, data: whitelistClaim }]);
    expect(f.fetch.mock.calls[0][0]).toContain(`address=${payer}`);
  });
  it("distinguishes a missing proof service from ineligibility", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(toBytes("root"));
    f.fetch.mockResolvedValue(new Response("missing", { status: 404 }));
    await expect(
      f.client.getRegistrationQuote(registrationInput),
    ).rejects.toMatchObject({
      code: "PROOF_UNAVAILABLE",
      details: { status: 404 },
    });
  });
  it("preserves the cause of a network failure", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(toBytes("root"));
    const cause = new Error("offline");
    f.fetch.mockRejectedValue(cause);
    await expect(
      f.client.getRegistrationQuote(registrationInput),
    ).rejects.toMatchObject({
      code: "PROOF_UNAVAILABLE",
      cause,
    });
  });
  it("rejects a proof for the wrong root", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(toBytes("wrong"));
    f.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ whitelisted: true, claim: whitelistClaim }),
      ),
    );
    await expect(
      f.client.getRegistrationQuote(registrationInput),
    ).rejects.toMatchObject({
      code: "INVALID_PROOF",
    });
  });
  it("rejects malformed membership responses", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(toBytes("root"));
    f.fetch.mockResolvedValue(new Response(JSON.stringify({ claim: "0x" })));
    await expect(
      f.client.getRegistrationQuote(registrationInput),
    ).rejects.toMatchObject({
      code: "INVALID_PROOF",
    });
  });
  it("requires and verifies a gap proof for an unreserved label", async () => {
    const f = fixture();
    const leaf = {
      value: zeroHash,
      nextValue: `0x${"f".repeat(64)}` as const,
      kind: 0,
      price: 0n,
    };
    f.state.features = [deployment.reservationFeature];
    f.state.reservationRoot = keccak256(
      encodeAbiParameters([leafType], [leaf]),
    );
    const claim = encodeAbiParameters([leafType, ...proofType], [leaf, []]);
    f.fetch.mockResolvedValue(new Response(JSON.stringify({ claim })));
    await f.client.getRegistrationQuote(registrationInput);
    const encodedClaims = f.readContract.mock.calls.find(
      ([r]) => r.functionName === "quoteMint",
    )![0].args![4] as `0x${string}`;
    expect(decodeAbiParameters(claimsType, encodedClaims)[0]).toEqual([
      { feature: deployment.reservationFeature, data: claim },
    ]);
  });
  it("does not fetch gate or reservation proofs during renewal", async () => {
    const f = fixture();
    f.state.features = [
      deployment.whitelistFeature,
      deployment.reservationFeature,
    ];
    f.state.whitelistRoot = keccak256(toBytes("root"));
    f.state.reservationRoot = f.state.whitelistRoot;
    expect((await f.client.getRenewalQuote(renewalInput)).status).toBe("ready");
    expect(f.fetch).not.toHaveBeenCalled();
  });
  it("does not silently drop a free-renewal discount when its proof is unavailable", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistMode = 1;
    f.state.whitelistRoot = keccak256(toBytes("root"));
    f.fetch.mockRejectedValue(new Error("offline"));
    await expect(f.client.getRenewalQuote(renewalInput)).rejects.toMatchObject({
      code: "PROOF_UNAVAILABLE",
    });
  });

  it("keeps managerApiUrl as the proof-service override", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(encodePacked(["address"], [payer]));
    f.fetch.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ whitelisted: true, claim: whitelistClaim }),
        ),
    );
    const client = createOnchainClient({
      publicClient: f.publicClient,
      chainId: 11155111,
      managerApiUrl: "https://proofs.example/api/v1/",
      fetch: f.fetch,
    });
    await client.getRegistrationQuote(registrationInput);
    await client.prepareRegistration({
      ...registrationInput,
      paymentToken: zeroAddress,
    });
    expect(client.deployment.managerApiUrl).toBe(
      "https://proofs.example/api/v1",
    );
    expect(f.fetch).toHaveBeenCalledTimes(2);
    expect(
      f.fetch.mock.calls.every(([url]) =>
        String(url).startsWith("https://proofs.example/api/v1/whitelist/"),
      ),
    ).toBe(true);
  });

  it("refreshes proofs instead of accepting stale quote claims", async () => {
    const f = fixture();
    f.state.features = [deployment.whitelistFeature];
    f.state.whitelistRoot = keccak256(encodePacked(["address"], [payer]));
    f.fetch.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ whitelisted: true, claim: whitelistClaim }),
        ),
    );
    const quote = await f.client.getRegistrationQuote(registrationInput);
    expect(quote).not.toHaveProperty("extraData");
    f.state.whitelistRoot = keccak256(toBytes("new root"));
    await expect(
      f.client.prepareRegistration({
        ...registrationInput,
        paymentToken: zeroAddress,
      }),
    ).rejects.toMatchObject({ code: "INVALID_PROOF" });
    expect(f.fetch).toHaveBeenCalledTimes(2);
  });
});
