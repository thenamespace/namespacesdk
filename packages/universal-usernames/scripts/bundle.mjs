// Emits the CommonJS JavaScript in dist/ (tsc emits only the .d.ts files).
//
// @ensdomains/address-encoder 2.x and its cborg dependency ship as ESM only,
// so they are bundled in. That keeps the package require()-able from
// CommonJS apps such as ccip-gateway (NestJS) and from Jest, on any Node
// version. Dependencies with a CommonJS build stay external.
import { build } from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['@adraffy/ens-normalize', '@ensdomains/content-hash'],
  logLevel: 'info',
};

// The CLI loads the library from dist/index.js instead of carrying a second copy.
const useLibraryBundle = {
  name: 'use-library-bundle',
  setup(builder) {
    builder.onResolve({ filter: /^\.\/index$/ }, () => ({ path: './index.js', external: true }));
  },
};

await build({ ...shared, entryPoints: ['src/index.ts'], outfile: 'dist/index.js' });
await build({ ...shared, entryPoints: ['src/cli.ts'], outfile: 'dist/cli.js', plugins: [useLibraryBundle] });
