import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import packageJson from '../package.json' with { type: 'json' };
import versionJson from '../data/version.json' with { type: 'json' };

test('product version stays aligned across runtime and release metadata', async () => {
  const config = await import(`../src/app/config.js?version-test=${Date.now()}`);
  assert.equal(packageJson.version, '20.41.0');
  assert.equal(versionJson.version, packageJson.version);
  assert.equal(config.APP_VERSION, packageJson.version);
  assert.equal(versionJson.buildVersion.startsWith(`${packageJson.version}-`), true);
  assert.equal(fs.existsSync(new URL('../package-lock.json', import.meta.url)), true);
});
