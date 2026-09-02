// Clean Forge acceptance config (ESM projects). Run with: NODE_OPTIONS=--import=tsx cucumber-js
export default {
  paths: ['.forge/features/**/*.feature'],
  import: ['test/acceptance/**/*.ts'],
  format: ['progress', 'json:.forge/reports/acceptance.json'],
  publishQuiet: true,
  strict: true,
};
