#!/usr/bin/env node
// Clean Forge harden runner. Runs Stryker (incremental), then prints a compact
// mutation report from .forge/reports/mutation.json. Exit 1 if score < thresholds.mutation.
// Usage: node .forge/scripts/harden.mjs [--files a.ts,b.ts]  (restrict score/survivor listing to these files)
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const cfg = JSON.parse(readFileSync(join(root, '.forge/forge.config.json'), 'utf8'));
const reports = join(root, '.forge/reports');
mkdirSync(reports, { recursive: true });
const args = process.argv.slice(2);
const fi = args.indexOf('--files');
const filter = fi >= 0 ? (args[fi + 1] || '').split(',').filter(Boolean) : null;

const pmExec = { pnpm: 'pnpm exec', npm: 'npx --no-install', yarn: 'yarn', bun: 'bunx' }[cfg.packageManager || 'npm'];
const r = spawnSync(`${pmExec} ${cfg.harden.mutate}`, { shell: true, cwd: root, encoding: 'utf8', env: { ...process.env, CI: '1', FORCE_COLOR: '0' } });
writeFileSync(join(reports, 'harden.log'), (r.stdout || '') + (r.stderr || ''));

const jsonPath = join(root, cfg.harden.report || '.forge/reports/mutation.json');
if (!existsSync(jsonPath)) { console.log('HARDEN  no mutation.json — see .forge/reports/harden.log'); process.exit(1); }
const rep = JSON.parse(readFileSync(jsonPath, 'utf8'));

let killed = 0, survived = 0, noCov = 0, timeout = 0, total = 0;
const survivors = [];
for (const [file, data] of Object.entries(rep.files || {})) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (filter && !filter.some((f) => rel.endsWith(f))) continue;
  for (const m of data.mutants || []) {
    total++;
    if (m.status === 'Killed') killed++;
    else if (m.status === 'Survived') { survived++; survivors.push(`${rel}:${m.location.start.line} ${m.mutatorName}`); }
    else if (m.status === 'NoCoverage') { noCov++; survivors.push(`${rel}:${m.location.start.line} ${m.mutatorName} (no coverage)`); }
    else if (m.status === 'Timeout') { timeout++; killed++; }
  }
}
const detected = killed;
const score = total ? Math.round((detected / (total - 0)) * 1000) / 10 : 100;
const threshold = cfg.thresholds?.mutation ?? 80;
console.log(`HARDEN  score ${score}%  killed ${killed}  survived ${survived}  no-coverage ${noCov}  total ${total}  threshold ${threshold}%   → ${score >= threshold && survived + noCov === 0 ? 'GREEN' : score >= threshold ? 'PASS (survivors remain)' : 'RED'}`);
for (const s of survivors.slice(0, 60)) console.log('  ' + s);
if (survivors.length > 60) console.log(`  … ${survivors.length - 60} more in .forge/reports/mutation.json`);
process.exit(score >= threshold ? 0 : 1);
