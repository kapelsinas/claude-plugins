// Clean Forge acceptance config (CommonJS / ts-jest projects). Features live next to their specs.
module.exports = {
  default: {
    paths: ['.forge/features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: ['test/acceptance/**/*.ts'],
    format: ['progress', 'json:.forge/reports/acceptance.json'],
    publishQuiet: true,
    strict: true,
    failFast: false,
  },
};
