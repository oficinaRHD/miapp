// Step 6a: declares POST_NOTIFICATIONS (needed on Android 13+ for the permission dialog to appear).
// Run once from the repository root:  node scripts/add-notification-permission.mjs
// Safe to repeat: it does nothing if the permission is already declared.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const PATH = 'android/app/src/main/AndroidManifest.xml';
const NAME = 'android.permission.POST_NOTIFICATIONS';
const LINE = `<uses-permission android:name="${NAME}" />`;

if (!existsSync(PATH)) {
  console.log(`MISSING  ${PATH} (run from the repository root; if there is no android folder, run: npx cap add android)`);
  process.exit(1);
}

const xml = readFileSync(PATH, 'utf8');
if (xml.includes(NAME)) {
  console.log('ALREADY  POST_NOTIFICATIONS is declared.');
  process.exit(0);
}

// Put it next to the other permissions; if there are none, just before </manifest>.
const permissions = [...xml.matchAll(/^([ \t]*)<uses-permission[^>]*\/>[ \t]*$/gm)];
let out;
if (permissions.length > 0) {
  const last = permissions[permissions.length - 1];
  const end = last.index + last[0].length;
  out = `${xml.slice(0, end)}\n${last[1]}${LINE}${xml.slice(end)}`;
} else if (xml.includes('</manifest>')) {
  out = xml.replace('</manifest>', `\n    ${LINE}\n</manifest>`);
} else {
  console.log('ERROR    No </manifest> found: the file was not changed.');
  process.exit(1);
}

writeFileSync(PATH, out);
console.log('PATCHED  Added POST_NOTIFICATIONS to AndroidManifest.xml');
