import { execFileSync } from 'node:child_process';
const suites = ['core.test.mjs', 'sensing.test.mjs', 'privacy.test.mjs', 'tools.test.mjs'];
let failed = 0;
for (const s of suites) {
  process.stdout.write(`\n=== ${s} ===\n`);
  try { process.stdout.write(execFileSync('node', [new URL(s, import.meta.url).pathname], { encoding: 'utf8' }).split('\n').slice(-2).join('\n')); }
  catch (e) { failed++; process.stdout.write(e.stdout || String(e)); }
}
process.exit(failed);
