---
name: status
description: Show where every Gauntlet feature is in the pipeline and the next command for each. Usage - /gauntlet:status
disable-model-invocation: true
---

Read every `.forge/features/*/status.json`. Print one line per feature, nothing else:

```
<NNN-slug>  <stage>  tasks <done>/<total>  <blocked: T<N>?>  next: <command>
```

Stage → next command:
- `brief` → `/gauntlet:spec approve` (after reviewing tasks.md) — or `answer questions in tasks.md`
- `tasks` → `/gauntlet:spec approve`
- `features` → `/gauntlet:spec plan`
- `plan` → `/gauntlet:build`
- `build` (interrupted) → `/gauntlet:build --from T<first non-done>`
- `built` → `/gauntlet:harden`
- `hardened` → `open PR`

If `.forge/gate-on` exists, add a final line: `gate-on: Stop hook is enforcing forge:gate this session`.
