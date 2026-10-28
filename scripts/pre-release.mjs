// Step 6b: checks everything that can be checked before publishing.
// Usage (from the repository root):
//   node scripts/pre-release.mjs v0.1.0-beta.1          full check (tests, svelte-check, build)
//   node scripts/pre-release.mjs v0.1.0-beta.1 --quick  only the file checks
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const tag = process.argv.find((a) => /^v\d/.test(a));
const quick = process.argv.includes('--quick');
const results = [];
const ok = (msg) => results.push(['OK  ', msg]);
const warn = (msg) => results.push(['WARN', msg]);
const fail = (msg) => results.push(['FAIL', msg]);
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

// --- Versions
const versionTs = read('src/app/version.ts');
const appVersion = versionTs?.match(/APP_VERSION\s*=\s*'(\d+\.\d+\.\d+)'/)?.[1];
const gradle = read('android/app/build.gradle');
const versionName = gradle?.match(/versionName\s+"([^"]+)"/)?.[1];
const versionCode = gradle?.match(/versionCode\s+(\d+)/)?.[1];
if (!appVersion) fail('src/app/version.ts: APP_VERSION (x.y.z) not found');
if (!versionName) fail('android/app/build.gradle: versionName not found');
if (appVersion && versionName) {
  if (appVersion === versionName) ok(`APP_VERSION and versionName agree: ${appVersion}`);
  else fail(`APP_VERSION (${appVersion}) differs from versionName (${versionName})`);
}
if (versionCode) ok(`versionCode ${versionCode} (it must grow with every release that users install over another)`);
else fail('android/app/build.gradle: versionCode not found');

// --- Tag
if (!tag) warn('No tag given (example: v0.1.0-beta.1); the tag was not checked');
else if (!/^v(\d+\.\d+\.\d+)(-[a-z]+\.\d+)?$/.test(tag)) fail(`Tag "${tag}" does not look like v0.1.0 or v0.1.0-beta.1`);
else {
  const base = tag.slice(1).split('-')[0];
  if (appVersion && base !== appVersion) fail(`Tag ${tag} does not match APP_VERSION ${appVersion}`);
  else ok(`Tag ${tag} matches the app version${tag.includes('-') ? ' (it will be a pre-release)' : ''}`);
}

// --- Android and workflow
const manifest = read('android/app/src/main/AndroidManifest.xml');
if (!manifest) fail('AndroidManifest.xml not found');
else {
  if (manifest.includes('android.permission.POST_NOTIFICATIONS')) ok('Manifest declares POST_NOTIFICATIONS');
  else fail('Manifest lacks POST_NOTIFICATIONS: run node scripts/add-notification-permission.mjs');
  if (/android:allowBackup="false"/.test(manifest)) ok('allowBackup is false (the in-app backup is the supported way)');
  else warn('allowBackup is not "false" in the manifest');
}
const workflow = read('.github/workflows/build-apk.yml');
if (!workflow) fail('.github/workflows/build-apk.yml not found');
else if (workflow.includes('--prerelease')) ok('Workflow publishes hyphenated tags as pre-releases');
else warn('Workflow not prepared for pre-releases: run node scripts/patch-release-workflow.mjs');
if (existsSync('docs/notas-version.md')) ok('docs/notas-version.md exists (release text)');
else warn('docs/notas-version.md missing: the release will use auto-generated notes');

// --- Git
const git = (args) => spawnSync('git', args, { encoding: 'utf8' });
const status = git(['status', '--porcelain']);
if (status.status !== 0) warn('git status failed');
else if (status.stdout.trim() === '') ok('No uncommitted changes');
else fail('There are uncommitted changes: commit and push them before tagging');
const tracked = git(['ls-files', 'android/app/src/main/AndroidManifest.xml', 'package-lock.json']);
if (tracked.stdout.split('\n').filter(Boolean).length === 2) ok('android/ and package-lock.json are in git');
else fail('android/app/src/main/AndroidManifest.xml or package-lock.json is not tracked by git (the CI needs both)');

// --- Commands
function run(label, cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: false });
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n');
  const tail = text.slice(-6).join('\n    ');
  if (r.status === 0) ok(`${label} passed\n    ${tail}`);
  else fail(`${label} FAILED (exit ${r.status})\n    ${text.slice(-25).join('\n    ')}`);
}
if (quick) warn('--quick: tests, svelte-check and build were skipped');
else {
  run('npm test', 'npm', ['test']);
  run('svelte-check', 'npx', ['svelte-check']);
  run('npm run build', 'npm', ['run', 'build']);
}

console.log('\n=== Pre-release check ===');
for (const [level, msg] of results) console.log(`${level}  ${msg}`);
const failures = results.filter(([l]) => l === 'FAIL').length;
console.log(failures === 0 ? '\nREADY. Next: git tag ' + (tag ?? '<tag>') + ' && git push origin ' + (tag ?? '<tag>') : `\n${failures} problem(s). Fix them and run again.`);
process.exit(failures === 0 ? 0 : 1);
