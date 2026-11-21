import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const python = process.env.PYTHON || 'python';
const suites = [
  { label: 'ZRA trial calculator', cwd: projectRoot },
  { label: 'Agent Lab finance API', cwd: path.join(projectRoot, 'agent-lab', 'nlu-api') },
];

for (const suite of suites) {
  console.log(`\nRunning ${suite.label} tests...`);
  const result = spawnSync(python, ['-m', 'unittest', 'discover', '-v', '-s', 'tests'], {
    cwd: suite.cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`Could not start Python: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('\nAll Python test suites passed.');
