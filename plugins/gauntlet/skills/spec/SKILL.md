---
name: spec
description: Start or continue specifying a feature - informal brief -> hard tasks (you review) -> Gherkin (you spot-check) -> plan (you confirm). Stops at every human checkpoint. Usage - /gauntlet:spec <slug or free text>  |  /gauntlet:spec approve  |  /gauntlet:spec plan
disable-model-invocation: true
---

Arguments: `$ARGUMENTS`

You are the orchestrator. You do not write specs yourself; you dispatch the `gauntlet:specifier` subagent and enforce checkpoints. Print agent reports verbatim. Do not summarize, do not add commentary, do not ask "would you like me to". State the next command.

# Resolve feature
- `.forge/features/` must exist, else say `run /gauntlet:init first` and stop.
- If `$ARGUMENTS` starts with `approve` or `plan`: the active feature is the one whose `status.json` has `stage` in `tasks` / `features` / `plan` (most recent). If several, list them and stop.
- Otherwise `$ARGUMENTS` is a new feature: slug = kebab-case of the first 4 words. Create `.forge/features/<NNN>-<slug>/` (NNN = next number, zero-padded 3). Write `brief.md`:
  - if `$ARGUMENTS` is longer than a slug, it is the brief;
  - else ask the human to paste the brief (bullets are fine, ambiguity is fine) and stop until they do.
  Write `status.json`: `{ "stage": "brief", "approved": {}, "tasks": [] }`.

# Stage: brief -> tasks
Dispatch `gauntlet:specifier` with: `mode=tasks FEATURE_DIR=<path>`. Then:
- Set `status.json.stage = "tasks"`.
- Print the agent's final block verbatim.
- Print `review: <path>/tasks.md` and, if questions > 0, `answer questions in the file or in chat, then:`.
- Print `next: /gauntlet:spec approve` and STOP. Do not continue on your own.

If the human answers questions in chat, append their answers to `brief.md` under `## Answers` and re-dispatch mode=tasks (the specifier rewrites tasks.md). Repeat the checkpoint.

# Stage: `approve` (tasks -> features)
- Precondition: `stage == "tasks"`. Read `tasks.md` as it is now (human may have edited).
- Set `approved.tasks = true`. Dispatch `gauntlet:specifier` with `mode=features FEATURE_DIR=<path>`.
- Set `stage = "features"`, populate `status.json.tasks = [{ "id": "T1", "state": "pending" }, ...]` from tasks.md.
- Print the agent block verbatim, then the list of `.feature` files, then `spot-check for missing edge cases. next: /gauntlet:spec plan` and STOP.

# Stage: `plan` (features -> plan.md)
- Precondition: `stage == "features"`. Set `approved.features = true`.
- Load the `gauntlet:nest-ddd` skill. Read `tasks.md`, the `.feature` files, and the existing module layout (`src/modules/*` or the configured root). Do NOT read `brief.md` — plan only from the hard specs.
- Write `plan.md` yourself (this is a mapping, not a design essay):
```
# Plan: <feature>
module: <name> (new | existing)
layers:
  domain:         <files> — <aggregates/value objects/invariants>
  application:    <use cases>, ports: <PortName (abstract class)>
  infrastructure: <adapters implementing ports>, providers
  presentation:   <controller|resolver|next route> (if any)
public surface (index.ts): <exports>
per task:
  T1 -> <files>
  T2 -> <files>
acceptance harness: <how steps reach the app: use-case direct | Nest testing module + HTTP>
risks: <cross-module deps, migrations, anything needing a human decision>
```
- If the plan requires a decision (new module vs extend existing, sync vs async, migration), list it under `decisions:` with your recommendation and STOP for confirmation.
- Otherwise set `stage = "plan"`, `approved.plan = false`, print the plan file path and `confirm plan, then: /gauntlet:build`. STOP.

The human confirms by running `/gauntlet:build`; that skill sets `approved.plan = true`.

# Never
- Write `.feature` files or tasks yourself.
- Skip a checkpoint because the feature "looks simple".
- Start implementation from this skill.
