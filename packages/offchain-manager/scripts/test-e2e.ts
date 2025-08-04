#!/usr/bin/env ts-node

// Load environment variables for testing
import * as dotenv from 'dotenv';
dotenv.config();

import { createOffchainClient, ChainName } from '../src';

// Load environment configuration
const TEST_API_KEY = process.env.NAMESPACE_API_KEY;
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'happ1.eth';
const TEST_MODE = (process.env.TEST_MODE as 'mainnet' | 'sepolia') || 'sepolia';

if (!TEST_API_KEY) {
    console.error('❌ NAMESPACE_API_KEY environment variable is required');
    process.exit(1);
}

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

class E2ETestRunner {
    private client: any;
    private results: TestResult[] = [];
    private testSubnames: string[] = [];

    constructor() {
        this.client = createOffchainClient({ mode: TEST_MODE as 'mainnet' | 'sepolia' });
        this.client.setDefaultApiKey(TEST_API_KEY);
    }

    private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
        const startTime = Date.now();
        try {
            await testFn();
            this.results.push({
                name,
                passed: true,
                duration: Date.now() - startTime
            });
            console.log(`✅ ${name} (${Date.now() - startTime}ms)`);
        } catch (error: any) {
            this.results.push({
                name,
                passed: false,
                error: error.message,
                duration: Date.now() - startTime
            });
            console.log(`❌ ${name} (${Date.now() - startTime}ms): ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🚀 Starting E2E Tests...\n');
        console.log(`Domain: ${TEST_DOMAIN}`);
        console.log(`Mode: ${TEST_MODE}\n`);

        // Basic functionality tests
        await this.runTest('Check subname availability', () => this.testAvailability());
        await this.runTest('Create simple subname', () => this.testCreateSimple());
        await this.runTest('Create social subname', () => this.testCreateSocial());
        await this.runTest('Retrieve subname', () => this.testRetrieve());
        await this.runTest('Add text records', () => this.testAddTextRecords());
        await this.runTest('Add address records', () => this.testAddAddressRecords());
        await this.runTest('Update subname', () => this.testUpdate());
        await this.runTest('List subnames', () => this.testListSubnames());
        await this.runTest('Delete subname', () => this.testDelete());

        // Error handling tests
        await this.runTest('Handle invalid subname', () => this.testInvalidSubname());
        await this.runTest('Handle non-existent subname', () => this.testNonExistentSubname());

        this.printResults();
        await this.cleanup();
    }

    private async testAvailability() {
        const testName = `e2e-test-${Date.now()}.${TEST_DOMAIN}`;
        const result = await this.client.isSubnameAvailable(testName);
        if (!result.isAvailable) {
            throw new Error('Expected subname to be available');
        }
    }

    private async testCreateSimple() {
        const label = `simple-${Date.now()}`;
        const fullName = `${label}.${TEST_DOMAIN}`;

        await this.client.createSubname({
            parentName: TEST_DOMAIN,
            label,
            addresses: [
                {
                    chain: ChainName.Ethereum,
                    value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                }
            ]
        });

        this.testSubnames.push(fullName);
    }

    private async testCreateSocial() {
        const label = `social-${Date.now()}`;
        const fullName = `${label}.${TEST_DOMAIN}`;

        await this.client.createSubname({
            parentName: TEST_DOMAIN,
            label,
            addresses: [
                {
                    chain: ChainName.Ethereum,
                    value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
                }
            ],
            texts: [
                { key: 'twitter', value: '@e2etest' },
                { key: 'github', value: 'e2etest' },
                { key: 'url', value: 'https://e2etest.com' }
            ]
        });

        this.testSubnames.push(fullName);
    }

    private async testRetrieve() {
        if (this.testSubnames.length === 0) {
            throw new Error('No test subnames to retrieve');
        }

        const subname = await this.client.getSingleSubname(this.testSubnames[0]);
        if (!subname || subname.fullName !== this.testSubnames[0]) {
            throw new Error('Retrieved subname does not match expected');
        }
    }

    private async testAddTextRecords() {
        if (this.testSubnames.length === 0) {
            throw new Error('No test subnames to add records to');
        }

        await this.client.addTextRecord(this.testSubnames[0], 'test-key', 'test-value');
        const records = await this.client.getTextRecords(this.testSubnames[0]);

        if (records['test-key'] !== 'test-value') {
            throw new Error('Text record was not added correctly');
        }
    }

    private async testAddAddressRecords() {
        if (this.testSubnames.length === 0) {
            throw new Error('No test subnames to add records to');
        }

        await this.client.addAddressRecord(this.testSubnames[0], ChainName.Base, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
        const subname = await this.client.getSingleSubname(this.testSubnames[0]);

        if (!subname.addresses['8453']) {
            throw new Error('Base address was not added correctly');
        }
    }

    private async testUpdate() {
        if (this.testSubnames.length === 0) {
            throw new Error('No test subnames to update');
        }

        await this.client.updateSubname(this.testSubnames[0], {
            texts: [
                { key: 'updated-key', value: 'updated-value' }
            ]
        });

        const subname = await this.client.getSingleSubname(this.testSubnames[0]);
        if (subname.texts['updated-key'] !== 'updated-value') {
            throw new Error('Subname was not updated correctly');
        }
    }

    private async testListSubnames() {
        const response = await this.client.getFilteredSubnames({
            parentName: TEST_DOMAIN,
            page: 1,
            size: 100
        });
        if (!Array.isArray(response.items)) {
            throw new Error('Subnames list is not an array');
        }
    }

    private async testDelete() {
        if (this.testSubnames.length === 0) {
            throw new Error('No test subnames to delete');
        }

        const subnameToDelete = this.testSubnames[0];
        await this.client.deleteSubname(subnameToDelete);

        // Verify deletion
        const availability = await this.client.isSubnameAvailable(subnameToDelete);
        if (!availability.isAvailable) {
            throw new Error('Subname was not deleted correctly');
        }

        this.testSubnames.shift(); // Remove from cleanup list
    }

    private async testInvalidSubname() {
        try {
            await this.client.getSingleSubname('invalid-subname');
            throw new Error('Expected error for invalid subname');
        } catch (error) {
            // Expected to fail
        }
    }

    private async testNonExistentSubname() {
        const nonExistent = `non-existent-${Date.now()}.${TEST_DOMAIN}`;
        const availability = await this.client.isSubnameAvailable(nonExistent);
        if (!availability.isAvailable) {
            throw new Error('Non-existent subname should be available');
        }
    }

    private printResults() {
        console.log('\n📊 Test Results:');
        console.log('================');

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`Passed: ${passed}/${total}`);
        console.log(`Total Duration: ${totalDuration}ms`);
        console.log(`Average Duration: ${Math.round(totalDuration / total)}ms\n`);

        this.results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name} (${result.duration}ms)`);
            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });

        if (passed === total) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n⚠️  ${total - passed} test(s) failed`);
            process.exit(1);
        }
    }

    private async cleanup() {
        console.log('\n🧹 Cleaning up test subnames...');
        for (const subname of this.testSubnames) {
            try {
                await this.client.deleteSubname(subname);
                console.log(`   Deleted: ${subname}`);
            } catch (error: any) {
                console.log(`   Failed to delete: ${subname} (${error.message})`);
            }
        }
    }
}

// Run E2E tests
if (require.main === module) {
    if (!TEST_API_KEY) {
        console.error('❌ Please set NAMESPACE_API_KEY environment variable');
        process.exit(1);
    }

    if (!TEST_DOMAIN) {
        console.error('❌ Please set TEST_DOMAIN environment variable');
        process.exit(1);
    }

    const runner = new E2ETestRunner();
    runner.runAllTests().catch((error: any) => {
        console.error('❌ E2E test runner failed:', error);
        process.exit(1);
    });
} 