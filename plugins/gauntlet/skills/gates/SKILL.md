---
name: gates
description: How to read and fix forge:gate and forge:harden output - complexity, CRAP, jscpd duplication, dependency-cruiser violations, coverage, acceptance, Stryker mutation score. Use when a gate is red or when asked what a threshold means.
---

`<pm> forge:gate` runs steps from `.forge/forge.config.json` in order, writes each step's full output to `.forge/reports/<step>.log`, prints one line per step and a summary, exits 1 if any failed. Options: `--only a,b` `--skip a,b`.

| step | tool | red means | fix |
|---|---|---|---|
| typecheck | tsc | type error | fix types; never `any`-cast past it |
| lint | eslint `complexity` (≤6), `sonarjs/cognitive-complexity` (≤10), `max-lines-per-function` (40), `max-depth` (3), `max-params` (4) | a function has too many paths | extract functions; guard clauses; replace if/else chains with a map or polymorphism; split by responsibility |
| dup | jscpd (≥50 tokens, ≥5 lines) | copy-paste or structural clone | extract the shared shape; parameterize the difference |
| deps | dependency-cruiser | import in a forbidden direction or a cycle | move the code to the right layer, or invert via a port in `application/ports` + adapter in `infrastructure`. Never edit the rules to allow it. |
| test | jest/vitest + coverage | failing unit test or coverage drop | it's a bug or a missing test; fix the cause |
| acceptance | cucumber-js | a scenario fails or a step is undefined | undefined step → write the binding; failing → behavior missing (coder) or spec wrong (human) |
| crap | crap-typescript, threshold 6 | `CRAP = CC² × (1−cov)³ + CC` — complex AND under-tested | if CC ≤ 6: add the unit test for the uncovered branch. If CC > 6: simplify first (lint already caught it). |

`<pm> forge:harden` runs Stryker (incremental) and prints score + survivors from `.forge/reports/mutation.json`. Threshold `thresholds.mutation` (default 80%) applies to the run; the hardener aims for ~100% on files touched by the feature.

| survivor type | what it means | test to write |
|---|---|---|
| ConditionalExpression `<` → `<=` | boundary untested | test exactly the boundary value |
| ArithmeticOperator `-` → `+` | result value never asserted precisely | assert the number, not just "defined" |
| BlockStatement removed | a branch body has no observable effect in tests | test the effect of that branch (side effect, returned value, thrown error) |
| StringLiteral `"x"` → `""` | message/key never checked | assert it if it matters; if it doesn't, mark equivalent |
| MethodExpression `.filter()` removed | the collection op is not observed | test with input where filtering changes the output |

Equivalent mutant: cannot change observable behavior (e.g. `i++` vs `++i` in a for-init). Document, don't chase.

# Reading the summary line
```
GATE  typecheck ok | lint 2 | dup ok | deps 1 | test ok cov 91% | acceptance ok | crap 3   → RED
```
Numbers are violation counts. Full detail is in `.forge/reports/<step>.log`; read only the red ones.

# What is never acceptable
`eslint-disable`, `/* istanbul ignore */`, `.skip`, `xit`, lowering a threshold, adding a file to an exclude list, editing `.dependency-cruiser.cjs` to permit an import. If a rule is wrong for the codebase, say so in the handoff under `rule-proposals` and let the human change it.
