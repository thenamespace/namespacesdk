import { execFileSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: node scripts/sync-abis.mjs /path/to/onchain-subnames",
  );
const root = fileURLToPath(new URL("../", import.meta.url));
const commit = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
for (const name of [
  "ActivationManagerAbi",
  "SubnameIssuerAbi",
  "WhitelistFeatureAbi",
  "ReservationFeatureAbi",
]) {
  copyFileSync(
    resolve(source, "packages/sdk/src/abis", `${name}.ts`),
    resolve(root, "src/abi", `${name}.ts`),
  );
}
writeFileSync(
  resolve(root, "src/abi/source.json"),
  JSON.stringify(
    { repository: "thenamespace/onchain-subnames", commit },
    null,
    2,
  ) + "\n",
);
