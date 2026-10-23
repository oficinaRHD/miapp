// App-wide singleton. Tests build their own AppDB instead (see test-helpers.ts).
import { AppDB } from './db';
import { createRepositories } from './repositories';

export const db = new AppDB();
export const repos = createRepositories(db);

export { exportBackup, importBackup, wipeAllData } from './backup';
export { ensureSeed } from './seed';
export { BackupError, serializeBackup } from './backupSchema';
export { DataError } from './errors';
