#!/usr/bin/env node
// Clean Forge gate runner. Runs the steps in .forge/forge.config.json, logs full
// output per step to .forge/reports/<step>.log, prints one line per step + a summary.
// Exit 1 if any step failed.  Usage: node .forge/scripts/gate.mjs [--only a,b] [--skip a,b] [--quiet]
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, '.forge/forge.config.json'), 'utf8'));
const reports = join(root, '.forge/reports');
mkdirSync(reports, { recursive: true });

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] || '').split(',').filter(Boolean) : null; };
const only = flag('--only'); const skip = flag('--skip') || []; const quiet = args.includes('--quiet');

const steps = Object.entries(cfg.gate).filter(([k]) => (!only || only.includes(k)) && !skip.includes(k));
const pmExec = { pnpm: 'pnpm exec', npm: 'npx --no-install', yarn: 'yarn', bun: 'bunx' }[cfg.packageManager || 'npm'];

const results = [];
for (const [name, cmd] of steps) {
  const full = cmd.startsWith('node ') || cmd.startsWith('./') ? cmd : `${pmExec} ${cmd}`;
  const t0 = Date.now();
  const r = spawnSync(full, { shell: true, cwd: root, encoding: 'utf8', env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
  const out = (r.stdout || '') + (r.stderr || '');
  writeFileSync(join(reports, `${name}.log`), `$ ${full}\n\n${out}`);
  const detail = summarize(name, out, r.status);
  results.push({ name, ok: r.status === 0, detail, ms: Date.now() - t0 });
  if (!quiet) console.log(`${r.status === 0 ? 'ok ' : 'RED'} ${name.padEnd(11)} ${detail}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

const red = results.filter((r) => !r.ok);
const line = 'GATE  ' + results.map((r) => `${r.name} ${r.ok ? (r.detail || 'ok') : r.detail || 'red'}`).join(' | ') + `   → ${red.length ? 'RED' : 'GREEN'}`;
console.log(line);
if (red.length) console.log(`see: ${red.map((r) => `.forge/reports/${r.name}.log`).join(' ')}`);
writeFileSync(join(reports, 'gate.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
process.exit(red.length ? 1 : 0);

// --- compact per-step detail extraction ---------------------------------------------------
function summarize(name, out, status) {
  const ok = status === 0;
  const count = (re) => (out.match(re) || []).length;
  switch (name) {
    case 'typecheck': return ok ? 'ok' : `${count(/error TS\d+/g)} errors`;
    case 'lint': { const m = out.match(/(\d+) problems? \((\d+) errors?/); return ok ? 'ok' : m ? `${m[2]} errors` : 'red'; }
    case 'dup': { const m = out.match(/Found (\d+) clones?/i) || out.match(/(\d+)\s+clones?/i); return ok ? 'ok' : m ? `${m[1]} clones` : 'red'; }
    case 'deps': { const m = out.match(/(\d+) dependency violations?/i) || out.match(/✖ (\d+)/); return ok ? 'ok' : m ? `${m[1]} violations` : 'red'; }
    case 'test': {
      const cov = out.match(/All files\s*\|\s*([\d.]+)/) || out.match(/Lines\s*:\s*([\d.]+)%/) || out.match(/Statements\s*:\s*([\d.]+)%/);
      const fails = out.match(/Tests:\s+(\d+) failed/) || out.match(/(\d+) failed/);
      return ok ? (cov ? `ok cov ${Math.round(cov[1])}%` : 'ok') : fails ? `${fails[1]} failed` : 'red';
    }
    case 'acceptance': {
      const m = out.match(/(\d+) scenarios? \(([^)]+)\)/);
      return ok ? (m ? `ok ${m[1]} scenarios` : 'ok') : m ? m[2].replace(/\s+/g, ' ') : 'red';
    }
    case 'crap': {
      const over = count(/status[:=]\s*(fail|FAIL)/g) || count(/^\s*fail\b/gm);
      return ok ? 'ok' : `${over || '?'} over`;
    }
    default: return ok ? 'ok' : 'red';
  }
}
