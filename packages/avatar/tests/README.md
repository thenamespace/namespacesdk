# Avatar SDK Tests

This directory contains comprehensive tests for the Avatar SDK.

## Test Structure

### Unit Tests (Mocked)

These tests run quickly and don't require network access. They use mocks and stubs to test functionality in isolation.

- **`client.test.ts`** - Core client functionality tests
- **`validation.test.ts`** - Input validation tests
- **`wallet-adapters.test.ts`** - Wallet adapter tests (Viem, Ethers)
- **`siwe.test.ts`** - SIWE authentication tests
- **`errors.test.ts`** - Error handling tests
- **`integration.test.ts`** - Integration scenarios with mocked responses

### E2E Tests (Real API Calls)

These tests make actual API calls using real credentials and should be run manually.

- **`e2e.test.ts`** - End-to-end tests with real API interactions

## Running Tests

### Run Unit Tests Only (Default)

```bash
npm test
```

or

```bash
npm run test:unit
```

### Run E2E Tests (Requires Network)

```bash
npm run test:e2e
```

**Note:** E2E tests use real credentials from the examples folder:

- Private Key: `0xd4e66100d9372d1369dc91c44c007df237d0bbb4a24782bda93d1201ff341276`
- Address: `0x4f9E47C8b5EB5d0508CDAC175aa29e4b7EE529E9`
- Subname: `grgr.happygame.eth`
- Domain: `happysingh.com`

### Run All Tests (Unit + E2E)

```bash
npm run test:all
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

## Test Configuration

The E2E tests are skipped by default and only run when `RUN_E2E_TESTS=true` is set. This prevents accidental API calls during regular test runs.

## Test Coverage

Current test coverage:

- **178 unit tests** covering:

  - File validation (size, format)
  - SIWE message generation
  - Wallet provider adapters (Viem, Ethers v5/v6)
  - Upload/delete operations
  - Error handling
  - Integration scenarios

- **E2E tests** covering:
  - Real SIWE message generation
  - Actual file uploads with Viem and Ethers
  - Manual signature flows
  - Delete operations
  - Error scenarios with real API

## Adding New Tests

### Adding Unit Tests

1. Create test file in the appropriate category (validation, client, etc.)
2. Use mocks for external dependencies
3. Follow existing test patterns
4. Ensure tests are fast and reliable

### Adding E2E Tests

1. Add tests to `e2e.test.ts`
2. Use `describeE2E` instead of `describe` to make them skippable
3. Set reasonable timeouts (e.g., 30000ms for API calls)
4. Handle failures gracefully (API might be unavailable)
5. Log useful information for debugging

## Dependencies

The tests use:

- **Jest** - Test framework
- **ts-jest** - TypeScript support for Jest
- **viem** - For Viem wallet testing
- **ethers** - For Ethers wallet testing

## Notes

- Unit tests should never require network access
- E2E tests should handle failures gracefully (API might be down)
- Mock data should be realistic and match actual API responses
- Use descriptive test names that explain what is being tested
