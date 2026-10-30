module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  resolver: '<rootDir>/jest.resolver.js',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
    // address-encoder 2.x and cborg ship ESM only; the published build bundles them (scripts/bundle.mjs).
    '^.+\\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(@ensdomains/address-encoder|cborg)/)'],
};
