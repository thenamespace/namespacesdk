import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
rmSync(new URL("../dist/", import.meta.url), { recursive: true, force: true });
for (const [module, directory] of [
  ["commonjs", "cjs"],
  ["ES2022", "esm"],
]) {
  execFileSync(
    process.execPath,
    [
      require.resolve("typescript/bin/tsc"),
      "-p",
      "tsconfig.json",
      "--module",
      module,
      "--outDir",
      `dist/${directory}`,
    ],
    { cwd: root, stdio: "inherit" },
  );
}
writeFileSync(
  new URL("../dist/esm/package.json", import.meta.url),
  '{"type":"module"}\n',
);
