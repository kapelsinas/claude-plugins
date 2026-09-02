---
name: audit
description: Baseline audit of an existing codebase - ranked complexity/CRAP/duplication/dependency hotspots, churn-weighted, with a suggested refactor order. Read-only; changes nothing. Usage - /gauntlet:audit [--deep]
disable-model-invocation: true
---

Arguments: `$ARGUMENTS`

Read-only audit. You run tools and read their reports; you do not fix anything, do not create branches, do not edit code. Precondition: `/gauntlet:init` has run (`.forge/forge.config.json` exists), else say so and stop.

# 1. Collect (run all, tolerate failures)
Read `.forge/forge.config.json` for pm/paths. Run each into `.forge/reports/audit/`:

- **Complexity + size**: `<pm exec> eslint src --format json -o .forge/reports/audit/eslint.json` (uses the forge rules; count per-file errors for `complexity`, `sonarjs/cognitive-complexity`, `max-lines-per-function`, `max-lines`).
- **Duplication**: `<pm exec> jscpd src --reporters json --output .forge/reports/audit` → read `jscpd-report.json` (clone pairs, % per file).
- **Dependencies**: `<pm exec> depcruise src --config .dependency-cruiser.cjs --output-type json -f .forge/reports/audit/deps.json` (violations by rule; also count total imports per module for coupling).
- **Coverage**: run the configured test command with coverage if a coverage summary doesn't already exist (`coverage/coverage-summary.json`); if tests are slow or broken, skip and mark coverage "unknown" — never block the audit on it.
- **CRAP**: `<pm exec> crap-typescript --agent` if coverage ran; else compute a proxy: files with complexity errors AND 0% / unknown coverage.
- **Churn**: `git log --since="6 months ago" --numstat --format=` aggregated per file (commit-touch count). Churn × complexity = where bugs will happen.
- `--deep` only: `<pm> forge:harden` for a mutation score (warn: slow).

# 2. Rank
Build one table, top 15 files, sorted by `score = complexity_errors×3 + crap_over×3 + dup_clones×2 + churn_decile`. A file that is complex, untested, duplicated AND frequently edited outranks everything.

# 3. Report (write `.forge/reports/audit/AUDIT.md`, print it)
```
# Gauntlet audit — <date>
gate baseline: <one line from forge:gate summary if available>

## Hotspots (fix-first order)
| # | file | cyclo>6 | cognitive | CRAP | clones | churn(6mo) | why it matters |
...

## Chokepoints
- <module/file>: imported by N modules AND in hotspots — a bug here radiates. (from deps.json fan-in)
- cycles: <list or none>
- layer violations: <count by rule, top offenders>

## Duplication clusters
- <n> clones across <files> — extract candidate: <what>

## Coverage gaps that matter
- files in top-churn decile with <50% line coverage (bugs land where code changes)

## Suggested order
1. <file> — <one line: smallest safe move, e.g. "extract X, add tests for branches A/B">
...only 5 items. Not a backlog, a starting sequence.

## Thresholds vs reality
current failing counts per gate step; if legacy code drowns the gate, suggest concrete `.forge/forge.config.json` legacy values to start from and ratchet down (e.g. complexity 12→10→8→6 per month).
```

# Output discipline
Print the AUDIT.md content, then exactly:
```
AUDIT done — .forge/reports/audit/AUDIT.md
next: pick hotspot #1 and run /gauntlet:spec refactor <file> — or start your next feature; the gate stops new debt either way.
```
No further commentary. Do not offer to fix things.
