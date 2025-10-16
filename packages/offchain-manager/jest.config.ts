import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.test.json',
                isolatedModules: true
            }
        ],
        '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env'] }]
    },
    // Transform ESM dependencies used in tests
    transformIgnorePatterns: [
        '/node_modules/(?!(msw|until-async)/)'
    ],
    extensionsToTreatAsEsm: [],
    testMatch: ['**/?(*.)+(spec|test).(ts|tsx|js)']
};

export default config;


