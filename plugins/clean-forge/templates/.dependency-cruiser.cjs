/** Clean Forge dependency rules for a Nest DDD layout. See skill `clean-forge:nest-ddd`.
 *  Adjust MOD if modules live elsewhere (e.g. 'src/contexts'). */
const MOD = 'src/modules';
const inLayer = (layer) => ({ path: `^${MOD}/[^/]+/${layer}/` });

module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    { name: 'no-orphans', severity: 'warn', from: { orphan: true, pathNot: ['\\.d\\.ts$', '(^|/)index\\.ts$', '\\.spec\\.ts$'] }, to: {} },

    // --- layer direction ------------------------------------------------------------------
    { name: 'domain-stays-pure', severity: 'error',
      from: inLayer('domain'),
      to: { path: `^${MOD}/[^/]+/(application|infrastructure|presentation)/` } },
    { name: 'domain-no-framework', severity: 'error',
      from: inLayer('domain'),
      to: { path: 'node_modules/(@nestjs|typeorm|@prisma|prisma|@mikro-orm|mongoose|drizzle-orm|axios|next|react)(/|$)' } },
    { name: 'application-no-infra', severity: 'error',
      from: inLayer('application'),
      to: { path: `^${MOD}/[^/]+/(infrastructure|presentation)/` } },
    { name: 'infrastructure-no-presentation', severity: 'error',
      from: inLayer('infrastructure'),
      to: inLayer('presentation') },
    { name: 'presentation-no-infra', severity: 'error',
      from: inLayer('presentation'),
      to: inLayer('infrastructure') },

    // --- module boundaries: other modules only via their index.ts ----------------------------
    { name: 'cross-module-only-via-public-surface', severity: 'error',
      from: { path: `^${MOD}/([^/]+)/` },
      to: { path: `^${MOD}/(?!$1/)[^/]+/(domain|application|infrastructure|presentation)/` } },
    { name: 'shared-does-not-know-modules', severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: `^${MOD}/` } },

    // --- hygiene --------------------------------------------------------------------------
    { name: 'no-test-in-prod', severity: 'error',
      from: { path: '^src/', pathNot: '\\.spec\\.ts$' },
      to: { path: '\\.spec\\.ts$|^test/' } },
    { name: 'no-deprecated-core', severity: 'warn', from: {}, to: { dependencyTypes: ['core'], path: '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$' } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.(spec|test)\\.ts$|^dist|^\\.forge' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
