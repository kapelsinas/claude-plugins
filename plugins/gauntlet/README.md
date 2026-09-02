# Gauntlet

A Claude Code **plugin** that runs Uncle Bob's agent pipeline on a Node / NestJS / Next.js codebase:

```
you (brief) → specifier → [you review tasks] → specifier → [you spot-check gherkin] → plan → [you confirm]
            → per task: coder → cleaner → … → architect → hardener → PR
```

Discipline lives in tools the agents cannot argue with, not in prompts: ESLint complexity ≤ 6, CRAP ≤ 6, jscpd duplication, dependency-cruiser layer rules, cucumber acceptance tests, Stryker mutation testing. A Stop hook refuses to let a build turn end while the gate is red.

Five narrow agents, each with a small fresh context, each ending with a fixed-format handoff and nothing else. No yapping by construction.

## What's in the box

| Component | Files | Purpose |
|---|---|---|
| Agents | `agents/{specifier,coder,cleaner,architect,hardener}.md` | The pipeline roles. Coder never sees your informal brief. |
| Workflow skills | `/gauntlet:init` `:spec` `:build` `:harden` `:status` | Orchestration with human checkpoints. Only run when you invoke them. |
| Reference skills | `nest-ddd`, `gates` | Auto-loaded by Claude when placing code in a Nest module or reading gate output. |
| Hook | `hooks/hooks.json` → `scripts/stop-gate.sh` | Stop hook. Active only while `.forge/gate-on` exists (build/harden set it). |
| Templates | `templates/` | Copied into your repo by `:init`: gate runner, eslint/depcruise/jscpd/stryker/cucumber configs, Nest acceptance world. |

## Install

**From the marketplace (recommended)**
```
/plugin marketplace add YOUR_GH_USER/claude-plugins
/plugin install gauntlet@kapelsinas-plugins
```

**Personal, auto-loaded, no marketplace**
```bash
cp -r plugins/gauntlet ~/.claude/skills/gauntlet     # loads as gauntlet@skills-dir next session
```

**Per session, for hacking on it**
```bash
claude --plugin-dir ./plugins/gauntlet
```

Validate: `claude plugin validate ./gauntlet`.

Requires: Node ≥ 20 on PATH (the gate runner and hook use it), git.

## Set up a repo (once)

```
/gauntlet:init
```
Detects pnpm/npm/yarn, jest/vitest, CJS/ESM, monorepo; asks before installing:
`eslint-plugin-sonarjs jscpd dependency-cruiser @cucumber/cucumber fast-check @stryker-mutator/core @stryker-mutator/<runner>-runner @barney-media/crap-typescript`.
Copies templates (never overwrites; writes `*.forge-new` next to existing files), adds `forge:gate` / `forge:harden` / `forge:acceptance` scripts, creates `.forge/`, runs a baseline gate.

Existing code will probably fail complexity/CRAP. Fine. The pipeline enforces on what it touches. Set `"legacy": true` and loosen thresholds in `.forge/forge.config.json` if you need a ratchet.

Then wire ESLint: in `eslint.config.mjs` add `...forgeConfigs` from `./eslint.forge.mjs`. Adjust `MOD` in `.dependency-cruiser.cjs` if your modules aren't under `src/modules`. Fix the `AppModule` import in `test/acceptance/support/world.ts`.

## Daily flow

```
/gauntlet:spec add discounts: products can have one active discount, % or fixed, expiring after N days, never below zero
   → .forge/features/001-add-discounts/brief.md, tasks.md     [you: read tasks.md, answer questions, edit freely]
/gauntlet:spec approve
   → T1-discount-value-object.feature, T2-apply-discount.feature …   [you: spot-check edge cases]
/gauntlet:spec plan
   → plan.md (module, layers, ports, per-task file map)                 [you: confirm or edit]
/gauntlet:build
   → branch forge/add-discounts; per task: fresh coder → fresh cleaner → commit; then architect; full gate
/gauntlet:harden
   → Stryker + Gherkin mutation, survivors killed with tests, final gate
git push -u origin forge/add-discounts   → PR
```
`/gauntlet:status` at any time shows where each feature is and the next command.

Where your attention goes: heavy at `tasks.md` (a wrong task propagates everywhere), light at the `.feature` spot-check, then go away. If a coder gets blocked on an ambiguous scenario, build stops and tells you exactly what to answer; resume with `/gauntlet:build --from T3`.

## Repo layout it creates

```
.forge/
  forge.config.json        # pm, runner, thresholds, gate commands — the only tuning knob
  scripts/gate.mjs         # forge:gate → one line per step, logs in reports/, exit 1 on red
  scripts/harden.mjs       # forge:harden → mutation score + survivors
  features/001-slug/
    brief.md               # your notes (coder is forbidden from reading it)
    tasks.md               # hard specs, human-approved
    T1-*.feature …         # gherkin, domain language only
    plan.md                # module/layer/file mapping
    status.json            # stage + task states
    handoffs/NN-role-Tn.md # audit trail; every agent ends with one
  reports/                 # gitignored gate/mutation logs
  gate-on                  # marker: Stop hook enforces gate while present
test/acceptance/{support,steps}/   # cucumber world + step definitions
```

## Gate, in one line
```
GATE  typecheck ok | lint ok | dup ok | deps ok | test ok cov 94% | acceptance ok 7 scenarios | crap ok   → GREEN
```
Run it yourself anytime: `pnpm forge:gate`, `pnpm forge:gate --only test,acceptance`, `pnpm forge:harden`.

## Fits with what you already use
- **superpowers** `/brainstorming` is a fine way to produce the brief. Paste its output into `/gauntlet:spec`. Don't use `/writing-plans` for the plan — Gauntlet's plan is a file map derived from hard specs, not a design essay.
- **caveman / ponytail** for tone in the main session — keep them. Agents here already report in fixed blocks; orchestrator skills print those verbatim and add nothing.
- Works in Claude Code CLI and Cowork (plugin syncs from claude.ai if you enable it there; the gate needs a real shell, so run build/harden where Node and your repo are).

## Tuning
Everything is in `.forge/forge.config.json`. Thresholds: complexity 6, CRAP 6, duplication 1%, mutation 80%. Agents are forbidden from editing this file or any rule; only you do.

## Known limits
- Gherkin mutation is done by the hardener agent by hand (temp copies of `.feature` files), not by a tool — there is no Node equivalent of Bob's Go acceptance-pipeline yet.
- `crap-typescript` runs its own coverage pass, so the `crap` step re-runs tests. Acceptable; drop it from `gate` and keep it in `harden` if it's too slow.
- Next.js apps get lint + depcruise only; acceptance/mutation target the Nest package.
- The coder's isolation from `brief.md` is enforced by prompt + orchestrator, not by a filesystem hook.

## Credits
Method: Robert C. Martin's SwarmForge pipeline (specifier → coder → cleaner → architect → hardener) and his CRAP/mutation posts. Node adaptation and gate tooling here are original. Not affiliated with Uncle Bob or with the unrelated `robert-hoffmann/uncle-bob` skill.

## Plays nice with caveman / ponytail
- **caveman**: keep it. Its hook styles your main-session turns; gauntlet subagents never see it and don't need it — their handoff formats are stricter than caveman anyway.
- **ponytail**: its philosophy is baked into the coder/cleaner/architect prompts (stdlib first, YAGNI within layers, smallest green diff, `// ponytail:` shortcut tracking surfaced in handoffs and `/gauntlet:audit`). You can keep the ponytail plugin for non-gauntlet work; during `/gauntlet:build` the agents don't need it, and its UserPromptSubmit injection doesn't reach subagents. If you run ponytail-review on a gauntlet branch, expect it to agree with the cleaner.
