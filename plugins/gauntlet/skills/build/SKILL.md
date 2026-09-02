---
name: build
description: Execute an approved feature plan - fresh coder + cleaner subagent per task, then architect, every step gated by forge:gate. Runs to completion without asking unless an agent is blocked. Usage - /gauntlet:build [feature-dir] [--from T3] [--only T2]
disable-model-invocation: true
---

Arguments: `$ARGUMENTS`

You are the orchestrator. Agents do the work; you route, gate, and record. You never write production code in this skill. Print every agent handoff block verbatim; add nothing between them except the routing line.

# Preconditions
- Resolve feature dir: explicit arg, else the single feature with `stage == "plan"`. If none/ambiguous, list and stop.
- `plan.md` exists. Set `status.json.approved.plan = true`, `stage = "build"`.
- Working tree clean OR on a branch named `forge/<slug>`. If dirty on another branch: say so and stop. If clean and on main/master: `git checkout -b forge/<slug>`.
- `touch .forge/gate-on` — from now on the Stop hook blocks any turn that ends with a red gate.

# Per task (in `status.json.tasks` order, skipping `done`; honor `--from`/`--only`)
Print `T<N> → coder`.

1. Dispatch a **fresh** `gauntlet:coder` with:
   ```
   FEATURE_DIR=<path> TASK=T<N>
   inputs: <path>/T<N>-*.feature, <path>/plan.md, section T<N> of <path>/tasks.md
   do not read brief.md
   ```
   - `status: blocked` → set task `state = "blocked"`, print the handoff, print `answer in chat or edit the .feature, then: /gauntlet:build --from T<N>`, remove `.forge/gate-on`, STOP.
   - `spec-issues` non-empty → print them, continue (they are advisory), but record in `status.json.tasks[N].spec_issues`.
2. Print `T<N> → cleaner`. Dispatch a fresh `gauntlet:cleaner` with `FEATURE_DIR TASK`. If blocked, same stop protocol.
3. Set task `state = "done"`. Commit: `git add -A && git commit -m "forge(<slug>): T<N> <task name>"` (skip if the project uses a different commit convention noted in CLAUDE.md — follow that instead).

# After all tasks
Print `→ architect`. Dispatch `gauntlet:architect` with `FEATURE_DIR`. Commit `forge(<slug>): architecture`.

Run `<pm> forge:gate` yourself. Green required. If red, dispatch `gauntlet:cleaner` once more with `TASK=all`; if still red, print the gate summary and stop with `gate red — see .forge/reports/`.

Set `stage = "built"`. Remove `.forge/gate-on`.

# Final report
```
BUILD <slug> done
tasks: <n>/<n>  commits: <n>
gate: <summary line>
handoffs: <path>/handoffs/
next: /gauntlet:harden
```

# Rules
- One subagent per task per role. Never reuse a coder across tasks (small context is the point).
- Never pass `brief.md` content, the human's chat messages, or your own interpretation to the coder. Only file paths listed above.
- Never edit `.feature` files. If a coder reports a spec issue that blocks correctness, stop and hand it to the human.
- No "let me also" — scope is the task list.
