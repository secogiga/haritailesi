import type { Config } from 'jest';

const config: Config = {
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

export default config;
