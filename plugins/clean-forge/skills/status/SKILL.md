---
name: status
description: Show where every Clean Forge feature is in the pipeline and the next command for each. Usage - /clean-forge:status
disable-model-invocation: true
---

Read every `.forge/features/*/status.json`. Print one line per feature, nothing else:

```
<NNN-slug>  <stage>  tasks <done>/<total>  <blocked: T<N>?>  next: <command>
```

Stage → next command:
- `brief` → `/clean-forge:spec approve` (after reviewing tasks.md) — or `answer questions in tasks.md`
- `tasks` → `/clean-forge:spec approve`
- `features` → `/clean-forge:spec plan`
- `plan` → `/clean-forge:build`
- `build` (interrupted) → `/clean-forge:build --from T<first non-done>`
- `built` → `/clean-forge:harden`
- `hardened` → `open PR`

If `.forge/gate-on` exists, add a final line: `gate-on: Stop hook is enforcing forge:gate this session`.
