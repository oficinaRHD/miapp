// Pure rule for the "no backup" alert on Inicio (V02). No fiscal logic.
import type { BackupState } from './respaldo';

/**
 * Show the alert when there is no backup or the last one is old, unless the user turned the
 * monthly backup reminder off in V15.
 */
export function showBackupAlert(state: BackupState, reminderOn: boolean): boolean {
  return reminderOn && state.status !== 'ok';
}
