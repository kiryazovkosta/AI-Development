// `ng build` with the build time and the git commit compiled in; the footer shows them.
// Run via `npm run build`; extra arguments go to ng build.
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(...args) {
  return execFileSync('git', args, {
    cwd: projectDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/** Short commit hash; "+" when it was built with changes that are not committed */
function commit() {
  // Vercel may build without a git history, and its install step can touch files
  const deployed = process.env.VERCEL_GIT_COMMIT_SHA;
  if (deployed) return deployed.slice(0, 7);
  try {
    const hash = git('rev-parse', '--short=7', 'HEAD');
    return git('status', '--porcelain', '--', '.') ? `${hash}+` : hash;
  } catch {
    return 'unknown';
  }
}

const ng = path.join(
  path.dirname(createRequire(import.meta.url).resolve('@angular/cli/package.json')),
  'bin/ng.js'
);
const { status } = spawnSync(
  process.execPath,
  [
    ng,
    'build',
    '--define',
    `BUILD_TIME=${JSON.stringify(new Date().toISOString())}`,
    '--define',
    `BUILD_COMMIT=${JSON.stringify(commit())}`,
    ...process.argv.slice(2),
  ],
  { cwd: projectDir, stdio: 'inherit' }
);
process.exit(status ?? 1);
