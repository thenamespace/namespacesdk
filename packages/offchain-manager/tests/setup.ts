// Load environment variables for testing
import * as dotenv from 'dotenv';
dotenv.config();

import { setupServer } from 'msw/node';

// Create MSW server instance
export const server = setupServer();

// Global test setup
beforeAll(() => {
    // Start request interception using MSW
    server.listen({
        onUnhandledRequest: 'error' // Fail tests on unhandled requests
    });
});

afterAll(() => {
    // Clean up MSW server
    server.close();
});

afterEach(() => {
    // Reset any handlers that are declared as a part of our tests
    server.resetHandlers();
});

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}; 