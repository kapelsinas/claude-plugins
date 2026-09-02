#!/usr/bin/env bash
# Clean Forge Stop hook.
# Fires when Claude tries to end a turn. Only enforces while `.forge/gate-on` exists
# (set by /clean-forge:build and :harden). Blocks the stop with the gate summary if red.
set -u
INPUT="$(cat)"
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"

# Never loop: if we already blocked once this turn, let it stop.
case "$INPUT" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0;; esac

[ -f "$ROOT/.forge/gate-on" ] || exit 0
[ -f "$ROOT/.forge/scripts/gate.mjs" ] || exit 0

cd "$ROOT" || exit 0
OUT="$(node .forge/scripts/gate.mjs --quiet 2>&1)"
CODE=$?
[ "$CODE" -eq 0 ] && exit 0

# Block: hand the summary back to Claude as the reason. JSON-escape via node.
node -e '
const out = process.argv[1].split("\n").slice(-25).join("\n");
process.stdout.write(JSON.stringify({
  decision: "block",
  reason: "forge:gate is RED. Fix the failing steps (read only the red logs in .forge/reports/), do not weaken any rule, then finish.\n" + out
}));' "$OUT"
exit 0
