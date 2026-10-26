// Texts for the backup alert on Inicio. Kept apart from i18n/inicio.ts.
import type { BackupState } from '../app/respaldo';

export const inicioRespaldo = {
  link: 'Hacer un respaldo',
  text(state: BackupState): string {
    if (state.status === 'never' || state.days === null) return 'Aún no has hecho ningún respaldo.';
    if (state.days === 1) return 'Hace 1 día sin respaldo.';
    return `Hace ${state.days} días sin respaldo.`;
  },
};
