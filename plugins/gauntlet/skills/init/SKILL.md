---
name: init
description: Install the Gauntlet toolchain and gate into the current Node/Nest/Next project (complexity lint, jscpd, dependency-cruiser, cucumber, fast-check, Stryker, crap-typescript, .forge/ layout). Run once per repo.
disable-model-invocation: true
---

Install Gauntlet into the project at `${CLAUDE_PROJECT_DIR}`. Ask before installing packages. Report tersely.

# 1. Detect
- Package manager: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock*` → bun, else npm.
- Test runner: `vitest` in devDependencies → vitest; else jest.
- Layout: single package or monorepo (`apps/api`, `apps/web`, `packages/*`). In a monorepo, install into the Nest app package (the one depending on `@nestjs/core`); Next apps get only the eslint + depcruise pieces. Ask if unclear.
- Module system: `"type": "module"` in package.json → ESM, else CJS (affects cucumber config).
- Source root: `src/` by default. If modules live elsewhere (e.g. `src/modules`, `src/contexts`), record it.

Print one line: `detected: <pm> <runner> <layout> <esm|cjs> src=<root>` and the package list below, then ask: install?

# 2. Install (devDependencies)
```
eslint-plugin-sonarjs jscpd dependency-cruiser @cucumber/cucumber fast-check
@stryker-mutator/core @stryker-mutator/<jest|vitest>-runner
@barney-media/crap-typescript
```
Plus `ts-node` if CJS+jest and it is missing (cucumber needs it), or `tsx` for ESM.

# 3. Copy templates
From `${CLAUDE_PLUGIN_ROOT}/templates/` into the target package root. Do not overwrite an existing file; write `<name>.forge-new` next to it and mention it.

| template | target | note |
|---|---|---|
| `forge/forge.config.json` | `.forge/forge.config.json` | fill in pm/runner/src root |
| `forge/scripts/gate.mjs` | `.forge/scripts/gate.mjs` | the gate runner |
| `forge/scripts/harden.mjs` | `.forge/scripts/harden.mjs` | mutation summary |
| `eslint.forge.mjs` | `eslint.forge.mjs` | import it into `eslint.config.mjs` (flat) — add `...forgeConfigs` to the exported array. If the project still uses `.eslintrc.*`, add the rules block by hand and say so. |
| `.dependency-cruiser.cjs` | `.dependency-cruiser.cjs` | adjust `src/modules` prefix to the detected module root |
| `.jscpd.json` | `.jscpd.json` | |
| `stryker.config.mjs` | `stryker.config.mjs` | set `testRunner` and runner config file |
| `cucumber.cjs` or `cucumber.mjs` | root | CJS → `cucumber.cjs`, ESM → `cucumber.mjs` |
| `test/acceptance/support/world.ts` | `test/acceptance/support/world.ts` | Nest testing-module world; edit `AppModule` import |
| `test/acceptance/support/hooks.ts` | same dir | |

# 4. package.json scripts
Add (do not replace existing scripts):
```json
"forge:gate":   "node .forge/scripts/gate.mjs",
"forge:harden": "node .forge/scripts/harden.mjs",
"forge:acceptance": "cucumber-js"
```

# 5. Layout
Create `.forge/features/.gitkeep`, `.forge/reports/` and add to `.gitignore`:
```
.forge/reports/
.forge/gate-on
.stryker-tmp/
```
Add `.forge/features/**/brief.md` to `.gitignore` only if the human wants informal notes kept private; ask.

# 6. Baseline
Run `<pm> forge:gate`. Existing code will likely fail complexity/CRAP/dup. That is expected. Do NOT fix anything now. Print the gate summary and say: thresholds apply to new/changed code via the pipeline; run `/gauntlet:build` on features going forward, or lower thresholds temporarily in `.forge/forge.config.json` (with `"legacy": true`) and ratchet down.

# 7. Report
```
gauntlet installed
pm <x> runner <x> src <x>
scripts: forge:gate forge:harden forge:acceptance
templates: <n> written, <n> skipped (*.forge-new)
baseline gate: <summary line>
next: /gauntlet:spec <feature-name>
```
