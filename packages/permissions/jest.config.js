"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@haritailesi/types$': '<rootDir>/../../packages/types/src/index.ts',
    },
};
exports.default = config;
