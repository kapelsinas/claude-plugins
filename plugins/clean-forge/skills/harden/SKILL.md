---
name: harden
description: Run the hardener on a built feature - Stryker mutation testing, Gherkin mutation, kill survivors with tests, final full gate. Unattended; CPU-heavy. Usage - /clean-forge:harden [feature-dir]
disable-model-invocation: true
---

Arguments: `$ARGUMENTS`

# Preconditions
- Resolve feature dir: explicit arg, else the single feature with `stage == "built"`. If none, say `nothing built — run /clean-forge:build` and stop.
- Working tree clean (built features are committed). Else stop.
- `touch .forge/gate-on`.

# Run
Print `→ hardener`. Dispatch `clean-forge:hardener` with `FEATURE_DIR=<path>` and the list of touched files gathered from all coder handoffs (`files:` lines).

Wait for the handoff. Print it verbatim.

- `status: blocked` → print, remove `.forge/gate-on`, stop.
- `remaining-survivors` non-empty and not marked equivalent → dispatch the hardener once more with `ROUND=2` and the survivor list. Max 2 extra rounds.

Commit `forge(<slug>): harden` .

Run `<pm> forge:gate` — green required. Set `stage = "hardened"`. Remove `.forge/gate-on`.

# Final report
```
HARDEN <slug> done
mutation: <before>% → <after>%   equivalent: <n>
gherkin: <n> mutations, <n> caught
gate: <summary line>
next: open PR from forge/<slug>  (git push -u origin forge/<slug>)
```
Do not open the PR yourself unless the human asks — outward-facing writes always need explicit go.
