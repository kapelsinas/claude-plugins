// Gauntlet mutation config. Set testRunner to 'jest' or 'vitest' and the matching runner block.
// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'jest',
  jest: { projectType: 'custom', configFile: 'jest.config.ts', enableFindRelatedTests: true },
  // vitest: { configFile: 'vitest.config.ts' },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.module.ts',
    '!src/**/*.providers.ts',
    '!src/main.ts',
    '!src/**/*.d.ts',
    '!src/**/migrations/**',
    '!src/**/generated/**',
  ],
  coverageAnalysis: 'perTest',
  incremental: true,
  incrementalFile: '.forge/reports/stryker-incremental.json',
  reporters: ['progress', 'clear-text', 'json'],
  jsonReporter: { fileName: '.forge/reports/mutation.json' },
  thresholds: { high: 95, low: 80, break: null },
  tempDirName: '.stryker-tmp',
  ignorePatterns: ['dist', '.forge/reports', 'coverage'],
  concurrency: 4,
  timeoutMS: 10000,
};
