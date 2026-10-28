// Step 6b: prepares .github/workflows/build-apk.yml for beta releases.
//  1. A tag with a hyphen (v0.1.0-beta.1) is published as a PRE-RELEASE; docs/notas-version.md, if it exists, is the release text.
//  2. If the repository secret DEBUG_KEYSTORE_BASE64 exists, the debug APK is signed with it, so each new APK installs over the
//     previous one keeping the data (without it, every CI run uses a new random debug key). With no secret nothing changes.
// Run once from the repository root:  node scripts/patch-release-workflow.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const PATH = '.github/workflows/build-apk.yml';
if (!existsSync(PATH)) {
  console.log(`MISSING  ${PATH}`);
  process.exit(1);
}
let yml = readFileSync(PATH, 'utf8');
const problems = [];

// --- 1. Release step
if (yml.includes('--prerelease')) {
  console.log('ALREADY  release step');
} else {
  const re = /( *)run: \|\n( *)gh release create "\$GITHUB_REF_NAME" \\\n( *)asistente-tcp-debug-\$\{\{ github\.run_number \}\}\.apk \\\n( *)--title "\$GITHUB_REF_NAME" \\\n( *)--generate-notes\n?/;
  const m = re.exec(yml);
  if (!m) problems.push('the "gh release create" block was not found as expected');
  else {
    const pad = m[2];
    const apk = 'asistente-tcp-debug-${{ github.run_number }}.apk';
    const block =
      `${m[1]}run: |\n` +
      `${pad}FLAGS=""\n` +
      `${pad}case "$GITHUB_REF_NAME" in *-*) FLAGS="--prerelease" ;; esac\n` +
      `${pad}if [ -f docs/notas-version.md ]; then\n` +
      `${pad}  gh release create "$GITHUB_REF_NAME" ${apk} --title "$GITHUB_REF_NAME" $FLAGS --notes-file docs/notas-version.md\n` +
      `${pad}else\n` +
      `${pad}  gh release create "$GITHUB_REF_NAME" ${apk} --title "$GITHUB_REF_NAME" $FLAGS --generate-notes\n` +
      `${pad}fi\n`;
    yml = yml.replace(re, block);
    console.log('PATCHED  release step');
  }
}

// --- 2. Stable debug signature
if (yml.includes('DEBUG_KEYSTORE_BASE64')) {
  console.log('ALREADY  keystore step');
} else {
  const anchor = /( *)- name: Build debug APK\n/;
  const m = anchor.exec(yml);
  if (!m) problems.push('the "Build debug APK" step was not found');
  else {
    const i = m[1];
    const step =
      `${i}- name: Restore debug keystore (stable signature, optional)\n` +
      `${i}  env:\n` +
      `${i}    DEBUG_KEYSTORE_BASE64: \${{ secrets.DEBUG_KEYSTORE_BASE64 }}\n` +
      `${i}  run: |\n` +
      `${i}    if [ -n "$DEBUG_KEYSTORE_BASE64" ]; then\n` +
      `${i}      mkdir -p ~/.android\n` +
      `${i}      echo "$DEBUG_KEYSTORE_BASE64" | base64 -d > ~/.android/debug.keystore\n` +
      `${i}    fi\n\n`;
    yml = yml.replace(anchor, step + m[0]);
    console.log('PATCHED  keystore step');
  }
}

if (problems.length > 0) {
  console.log(`ERROR    ${problems.join('; ')}. The file was not changed; paste it here.`);
  process.exit(1);
}
writeFileSync(PATH, yml);
console.log('\nOK. Review with: git diff .github');
