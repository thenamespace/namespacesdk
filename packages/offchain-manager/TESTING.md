# Testing Guide for @thenamespace/offchain-manager

This document outlines how to test the Namespace SDK offchain-manager package before publishing.

## 🧪 **Testing Strategy**

### **1. Unit Tests** (Not yet implemented)

- Test individual functions in isolation
- Mock external dependencies
- Fast execution
- High coverage

### **2. Integration Tests** (Not yet implemented)

- Test API interactions with mocked responses
- Verify request/response handling
- Test error scenarios

### **3. Manual Tests** ✅

- Real API calls against test environment
- Verify complete workflows
- Test with actual data

### **4. End-to-End Tests** ✅

- Complete user workflows
- Real API integration
- Performance testing

## 🚀 **Quick Start Testing**

### **Prerequisites**

1. Get an API key from [Namespace Dev Portal](https://dev.namespace.ninja)
2. Have a test domain ready
3. Install dependencies: `npm install`

### **Environment Setup**

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
# Required: NAMESPACE_API_KEY
# Optional: TEST_DOMAIN, TEST_MODE
```

**Example .env file:**

```env
NAMESPACE_API_KEY=ns-your-api-key-here
TEST_DOMAIN=your-domain-name
TEST_MODE=sepolia
```

## 📝 **Running Tests**

### **1. Manual Testing**

```bash
# Run basic manual tests
npm run test:manual

# Or directly with ts-node
ts-node scripts/test-manual.ts
```

**What it tests:**

- ✅ Subname availability checking
- ✅ Creating simple subnames
- ✅ Adding text records
- ✅ Adding address records
- ✅ Updating subnames
- ✅ Listing subnames
- ✅ Deleting subnames

### **2. End-to-End Testing**

```bash
# Run comprehensive E2E tests
npm run test:e2e

# Or directly with ts-node
ts-node scripts/test-e2e.ts
```

**What it tests:**

- ✅ Complete CRUD operations
- ✅ Error handling
- ✅ Performance metrics
- ✅ Cleanup procedures
- ✅ Multi-chain support

### **3. Unit Tests** (Future)

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🔧 **Test Configuration**

All tests use environment variables loaded via dotenv:

```typescript
// Tests automatically load from .env file
import * as dotenv from "dotenv";
dotenv.config();

const TEST_API_KEY = process.env.NAMESPACE_API_KEY!;
const TEST_DOMAIN = process.env.TEST_DOMAIN!;
const TEST_MODE = (process.env.TEST_MODE as "mainnet" | "sepolia") || "sepolia";
```

**No manual configuration needed!** Just set up your `.env` file once.

## 📊 **Test Results**

### **Manual Test Output**

```console
🧪 Starting Manual SDK Tests...

1️⃣ Testing subname availability...
   Subname manual-test-1703123456789.your-domain.eth is available: true

2️⃣ Testing subname creation...
   ✅ Created subname: test-1703123456789.your-domain.eth

3️⃣ Testing subname retrieval...
   ✅ Retrieved subname: test-1703123456789.your-domain.eth
   Addresses: {"60":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}

🎉 All manual tests completed successfully!
```

### **E2E Test Output**

```console
🚀 Starting E2E Tests...

Domain: your-domain.eth
Mode: sepolia

✅ Check subname availability (245ms)
✅ Create simple subname (1234ms)
✅ Create social subname (1156ms)
✅ Retrieve subname (234ms)
✅ Add text records (567ms)
✅ Add address records (789ms)
✅ Update subname (456ms)
✅ List subnames (123ms)
✅ Delete subname (345ms)
✅ Handle invalid subname (12ms)
✅ Handle non-existent subname (34ms)

📊 Test Results:
================
Passed: 11/11
Total Duration: 5185ms
Average Duration: 471ms

🎉 All tests passed!

🧹 Cleaning up test subnames...
   Deleted: simple-1703123456789.your-domain.eth
   Deleted: social-1703123456789.your-domain.eth
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **API Key Issues**

   ```console
   ❌ Please set NAMESPACE_API_KEY environment variable
   ```

   **Solution:** Set your API key as an environment variable

2. **Domain Issues**

   ```console
   ❌ Please update TEST_DOMAIN in the script to use your actual domain
   ```

   **Solution:** Update the test domain in the script or set TEST_DOMAIN env var

3. **Network Issues**

   ```console
   ❌ Test failed: Network Error
   ```

   **Solution:** Check your internet connection and API endpoint availability

4. **Rate Limiting**

   ```console
   ❌ Test failed: Rate limit exceeded
   ```

   **Solution:** Wait a few minutes and try again, or use a different API key

## 📋 **Pre-Publish Checklist**

Before publishing a new version:

- [ ] Run manual tests: `npm run test:manual`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Check all tests pass
- [ ] Verify cleanup worked (no test subnames left)
- [ ] Test with both mainnet and sepolia modes
- [ ] Test error scenarios
- [ ] Verify performance is acceptable

## 🔄 **Continuous Integration**

For CI/CD pipelines, add these steps:

```yaml
# Example GitHub Actions workflow for @thenamespace/offchain-manager
- name: Run Tests
  run: |
    npm install
    npm run test:e2e
  env:
    NAMESPACE_API_KEY: ${{ secrets.NAMESPACE_API_KEY }}
    TEST_DOMAIN: ${{ secrets.TEST_DOMAIN }}
    TEST_MODE: sepolia
```

## 📈 **Performance Benchmarks**

Track these metrics:

- **Average response time:** < 2 seconds
- **Success rate:** > 95%
- **Error handling:** All errors properly caught
- **Memory usage:** No memory leaks
- **Cleanup:** All test data removed

## 🎯 **Next Steps**

1. **Add Unit Tests** - Implement Jest tests for individual functions
2. **Add Integration Tests** - Test with mocked HTTP responses
3. **Add Performance Tests** - Benchmark API calls
4. **Add Load Tests** - Test with multiple concurrent requests
5. **Add Browser Tests** - Test in browser environment
