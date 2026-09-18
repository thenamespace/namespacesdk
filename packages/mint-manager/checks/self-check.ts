// Offline regression checks for the three things that rot silently.
// Run with `npm test`. No framework — node:assert plus a non-zero exit.
import assert from "node:assert/strict";
import { createMintClient, ContenthashType, MintManagerError } from "../src";
import { convertEnsRecordsToResolverData } from "../src/utils";

const DEAD_RPC = "http://127.0.0.1:9"; // discard port: connection refused

async function main() {
  // 1. Every ContenthashType maps to a codec encode() actually accepts.
  const SAMPLE: Record<ContenthashType, string> = {
    [ContenthashType.Ipfs]: "bafybeicnesqbuvzjxhkylkzwaqxi5jvbvzf7z4rjnkvjnvbsrqxlgnzpqu",
    [ContenthashType.Ipns]: "k51qzi5uqu5dgccx524mfjv7znyfsa6g013o6v4yvis9dxnrjbwojc62pt0450",
    [ContenthashType.Onion]: "p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd",
    [ContenthashType.Swarm]: "d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162",
    [ContenthashType.Arweave]: "ys3BhqbNC5jbhSaGtNVeQBAWmVGWFRSAKGZORjHmizQ",
    [ContenthashType.Skynet]: "CABAB_1Dt0FJsxqsu_J4TodNCbCGvtFf1Uys_3EgzOlTcg",
  };
  for (const type of Object.values(ContenthashType)) {
    const data = convertEnsRecordsToResolverData("alice.example.eth", {
      contenthash: { type, value: SAMPLE[type] },
    });
    assert.equal(data.length, 1, `contenthash ${type} produced no calldata`);
  }

  // 2. A dead RPC must reject, not resolve `false` — otherwise an outage is
  //    indistinguishable from "the subname is taken".
  const offline = createMintClient({
    isTestnet: true,
    customRpcUrls: { 84532: DEAD_RPC },
  });
  await assert.rejects(
    () => offline.isL2SubnameAvailable("alice.testmint.eth", 84532),
    "isL2SubnameAvailable swallowed an RPC outage and returned a boolean"
  );

  // 3. The deprecated `cursomRpcUrls` typo still aliases `customRpcUrls`.
  const typoed = createMintClient({
    isTestnet: true,
    cursomRpcUrls: { 84532: DEAD_RPC },
  });
  await assert.rejects(
    () => typoed.isL2SubnameAvailable("alice.testmint.eth", 84532),
    "cursomRpcUrls alias stopped being honoured"
  );

  // 4. Chain lookup failures are typed, as the README promises.
  await assert.rejects(
    () => offline.isL2SubnameAvailable("alice.testmint.eth", 999999),
    MintManagerError
  );

  console.log("self-check: all assertions passed");
}

main().catch((err) => {
  console.error("self-check FAILED:", err);
  process.exit(1);
});
