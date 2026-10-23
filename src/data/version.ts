export const BACKUP_APP = 'asistente-tcp';
export const DB_NAME = 'asistente-tcp';

/**
 * Highest `this.version(n)` declared in db.ts. It is also the `schemaVersion`
 * written in every backup. Bump both together (see 04-modelo-de-datos.md, section 3).
 */
export const SCHEMA_VERSION = 1;
