/**
 * Unit tests are the default: `npm test` runs everything in tests/ except the
 * e2e suite, so CI stays offline and deterministic. The e2e suite is opt-in via
 * `npm run test:e2e`, which sets RUN_E2E_TESTS=true.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
