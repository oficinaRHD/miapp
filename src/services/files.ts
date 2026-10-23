// File access: the only place that talks to @capacitor/filesystem and @capacitor/share.
// Native (APK): writes to the cache and opens the Android share sheet.
// Browser: downloads the file. Both paths run the same code in the callers.
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type FileErrorCode = 'share-unavailable' | 'write-failed' | 'read-failed';

export class FileServiceError extends Error {
  readonly code: FileErrorCode;
  readonly detail: string;

  constructor(code: FileErrorCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'FileServiceError';
    this.code = code;
    this.detail = detail;
  }
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

const INTERNAL_DIR = 'backups';
const KEEP_INTERNAL = 5;

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function isCancel(e: unknown): boolean {
  return /cancel/i.test(messageOf(e));
}

function downloadInBrowser(fileName: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Hands a text file to the user: share sheet on Android, download in the browser.
 * Returns 'cancelled' when the user closes the share sheet.
 */
export async function shareTextFile(
  fileName: string,
  text: string,
  opts: { title?: string; dialogTitle?: string; mime?: string } = {},
): Promise<ShareOutcome> {
  const mime = opts.mime ?? 'application/json';

  if (!Capacitor.isNativePlatform()) {
    downloadInBrowser(fileName, text, mime);
    return 'downloaded';
  }

  let uri: string;
  try {
    const res = await Filesystem.writeFile({
      path: `exports/${fileName}`,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    uri = res.uri;
  } catch (e) {
    throw new FileServiceError('write-failed', messageOf(e));
  }

  const can = await Share.canShare();
  if (!can.value) throw new FileServiceError('share-unavailable', 'Share.canShare() is false');

  try {
    await Share.share({ title: opts.title, dialogTitle: opts.dialogTitle, files: [uri] });
    return 'shared';
  } catch (e) {
    if (isCancel(e)) return 'cancelled';
    throw e;
  }
}

/**
 * Opens the system file picker and returns the text of the chosen file, or null if the
 * user cancels. An <input type="file"> works the same in the browser and inside the
 * Capacitor WebView, so no extra plugin is needed.
 */
export function pickTextFile(accept = '.json,application/json'): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);

    const done = (value: string | null): void => {
      input.remove();
      resolve(value);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return done(null);
      file.text().then(done, (e: unknown) => {
        input.remove();
        reject(new FileServiceError('read-failed', messageOf(e)));
      });
    });
    input.addEventListener('cancel', () => done(null));
    input.click();
  });
}

/** App-private copy (Directory.Data), used for the automatic backup before a restore. */
export async function saveInternalBackup(fileName: string, text: string): Promise<void> {
  try {
    await Filesystem.writeFile({
      path: `${INTERNAL_DIR}/${fileName}`,
      data: text,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  } catch (e) {
    throw new FileServiceError('write-failed', messageOf(e));
  }
  await pruneInternalBackups();
}

/** Names of the internal backups, newest first (names start with a timestamp). */
export async function listInternalBackups(): Promise<string[]> {
  try {
    const res = await Filesystem.readdir({ path: INTERNAL_DIR, directory: Directory.Data });
    return res.files.map((f) => f.name).sort().reverse();
  } catch {
    return []; // the folder does not exist yet
  }
}

export async function readInternalBackup(fileName: string): Promise<string> {
  try {
    const res = await Filesystem.readFile({
      path: `${INTERNAL_DIR}/${fileName}`,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return typeof res.data === 'string' ? res.data : await res.data.text();
  } catch (e) {
    throw new FileServiceError('read-failed', messageOf(e));
  }
}

async function pruneInternalBackups(): Promise<void> {
  const names = await listInternalBackups();
  for (const name of names.slice(KEEP_INTERNAL)) {
    try {
      await Filesystem.deleteFile({ path: `${INTERNAL_DIR}/${name}`, directory: Directory.Data });
    } catch {
      // best effort: an old copy that cannot be deleted is harmless
    }
  }
}
