import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

test('daily updaters create missing files, skip same-day output and honor force', async () => {
  const root = await mkdtemp(join(tmpdir(), 'james-update-test-'));
  try {
    for (const path of ['scripts', 'age-core.mjs', 'shortcut-data.json']) await cp(new URL(`../${path}`, import.meta.url), join(root, path), { recursive: true });
    for (const [script, output, force] of [
      ['update-shortcut-message.mjs', 'shortcut-message.txt', 'FORCE_SHORTCUT_UPDATE'],
      ['update-terminal-page.mjs', 'terminal.txt', 'FORCE_TERMINAL_UPDATE'],
    ]) {
      const run = env => exec(process.execPath, [join(root, 'scripts', script)], { env: { ...process.env, FORCE_SHORTCUT_UPDATE: '', FORCE_TERMINAL_UPDATE: '', ...env } });
      await run();
      const original = await readFile(join(root, output), 'utf8');
      const sentinel = `${original}\nSAME DAY SENTINEL\n`;
      await writeFile(join(root, output), sentinel);
      assert.match((await run()).stdout, /already current/);
      assert.equal(await readFile(join(root, output), 'utf8'), sentinel);
      await run({ [force]: 'true' });
      assert.doesNotMatch(await readFile(join(root, output), 'utf8'), /SAME DAY SENTINEL/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
