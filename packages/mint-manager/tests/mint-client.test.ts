/**
 * Offline regression tests for the client behaviours that previously failed
 * silently: swallowed RPC errors, unnormalized names, dropped records, and the
 * misspelled RPC config field.
 *
 * Everything here runs without network access. The one place a socket would be
 * opened points at the discard port, which refuses immediately.
 */
import { createMintClient, ContenthashType, MintManagerError } from "../src";
import { convertEnsRecordsToResolverData } from "../src/utils";

// Port 9 (discard) refuses instantly, so these stay fast and offline.
const DEAD_RPC = "http://127.0.0.1:9";

describe("contenthash codecs", () => {
  // Every value in the enum must be an identifier the codec table accepts.
  // Three of them used to be dead strings that threw "multicodec not recognized".
  const SAMPLES: Record<ContenthashType, string> = {
    [ContenthashType.Ipfs]:
      "bafybeicnesqbuvzjxhkylkzwaqxi5jvbvzf7z4rjnkvjnvbsrqxlgnzpqu",
    [ContenthashType.Ipns]:
      "k51qzi5uqu5dgccx524mfjv7znyfsa6g013o6v4yvis9dxnrjbwojc62pt0450",
    [ContenthashType.Onion]:
      "p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd",
    [ContenthashType.Swarm]:
      "d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162",
    [ContenthashType.Arweave]: "ys3BhqbNC5jbhSaGtNVeQBAWmVGWFRSAKGZORjHmizQ",
    [ContenthashType.Skynet]:
      "CABAB_1Dt0FJsxqsu_J4TodNCbCGvtFf1Uys_3EgzOlTcg",
  };

  it.each(Object.values(ContenthashType))(
    "encodes %s into resolver calldata",
    (type) => {
      const data = convertEnsRecordsToResolverData("alice.example.eth", {
        contenthash: { type, value: SAMPLES[type] },
      });
      expect(data).toHaveLength(1);
    }
  );

  it("uses the 0xe301 ipfs-ns codec, not the 0xa503 p2p codec", () => {
    // "ipfs" encodes as p2p and skips CID validation; ENS expects ipfs-ns.
    const ch = require("@ensdomains/content-hash");
    const encoded = ch.encode(
      ContenthashType.Ipfs,
      SAMPLES[ContenthashType.Ipfs]
    );
    expect(ch.getCodec(encoded)).toBe("ipfs-ns");
  });

  it("reports which contenthash value failed instead of leaking a codec error", () => {
    expect(() =>
      convertEnsRecordsToResolverData("alice.example.eth", {
        contenthash: { type: ContenthashType.Ipfs, value: "not-a-cid" },
      })
    ).toThrow(MintManagerError);
  });
});

describe("address records", () => {
  it("rejects an unknown chain name rather than dropping the record", () => {
    // This used to console.info and `continue`, so the user paid to mint and
    // silently received no address record at all.
    expect(() =>
      convertEnsRecordsToResolverData("alice.example.eth", {
        addresses: [{ chain: "nosuchchain" as never, value: "0x0" }],
      })
    ).toThrow(MintManagerError);
  });

  it("does not resolve inherited Object members as chains", () => {
    expect(() =>
      convertEnsRecordsToResolverData("alice.example.eth", {
        addresses: [{ chain: "constructor" as never, value: "0x0" }],
      })
    ).toThrow(MintManagerError);
  });

  it("rejects a malformed EVM address", () => {
    expect(() =>
      convertEnsRecordsToResolverData("alice.example.eth", {
        addresses: [{ chain: 60, value: "0xnothex" }],
      })
    ).toThrow(MintManagerError);
  });
});

describe("client configuration", () => {
  it("rejects a plain-http API override", () => {
    // http would expose the signed mint parameters to the network path.
    expect(() =>
      createMintClient({ mintManagerUri: "http://mint.example.com" })
    ).toThrow(MintManagerError);
  });

  it("allows loopback over http for local development", () => {
    expect(() =>
      createMintClient({ mintManagerUri: "http://localhost:3000" })
    ).not.toThrow();
  });

  it("rejects a malformed API override", () => {
    expect(() => createMintClient({ listManagerUri: "not a url" })).toThrow(
      MintManagerError
    );
  });

  it("still honours the deprecated cursomRpcUrls misspelling", async () => {
    // v1.1.1 shipped the typo as public API, so it has to keep working.
    const client = createMintClient({
      isTestnet: true,
      cursomRpcUrls: { 84532: DEAD_RPC },
    });
    await expect(
      client.isL2SubnameAvailable("alice.example.eth", 84532)
    ).rejects.toThrow(MintManagerError);
  });
});

describe("availability checks", () => {
  it("throws on an unreachable RPC instead of reporting the name as taken", async () => {
    const client = createMintClient({
      isTestnet: true,
      customRpcUrls: { 84532: DEAD_RPC },
    });

    // The old behaviour resolved `false` here, making an outage look identical
    // to a name that is already registered.
    await expect(
      client.isL2SubnameAvailable("alice.example.eth", 84532)
    ).rejects.toMatchObject({ code: "RPC_ERROR" });
  });

  it("rejects an unnormalizable name before any network call", async () => {
    const client = createMintClient({ isTestnet: true });
    // Cyrillic 'а' mixed with Latin — ENSIP-15 illegal script mixture.
    await expect(
      client.isL1SubnameAvailable("аlice.example.eth")
    ).rejects.toMatchObject({ code: "INVALID_NAME" });
  });

  it("rejects a bare label with no parent", async () => {
    const client = createMintClient({ isTestnet: true });
    await expect(client.isL1SubnameAvailable("alice")).rejects.toThrow(
      MintManagerError
    );
  });

  it("rejects an unsupported chain id", async () => {
    const client = createMintClient({ isTestnet: true });
    await expect(
      client.isL2SubnameAvailable("alice.example.eth", 999999)
    ).rejects.toThrow();
  });
});
