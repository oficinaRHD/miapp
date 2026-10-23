// Test-only: a fresh, isolated IndexedDB per test (fake-indexeddb, a dev dependency).
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { AppDB } from './db.js';

let counter = 0;

export function createTestDb(): AppDB {
  counter += 1;
  return new AppDB(`test-db-${counter}`, { indexedDB: new IDBFactory(), IDBKeyRange });
}

/** Code of the DataError a promise rejects with, or 'none' / 'other:...'. */
export async function dataCodeOf(p: any): Promise<string> {
  try {
    if (typeof p === 'function') {
      await p();
    } else {
      await p;
    }
    return 'none';
  } catch (e: any) {
    // 1. Si tiene las propiedades (duck typing)
    if (e && typeof e.code === 'string') {
      return e.detail ? `${e.code}:${e.detail}` : e.code;
    }
    
    // 2. Si no, extraemos del mensaje. 
    // El mensaje puede ser "not-found: perfil" o "DataError: not-found: perfil"
    let msg = e?.message || String(e);
    msg = msg.split('\n')[0].trim(); // Tomamos solo la primera línea
    
    const parts = msg.split(':');
    if (parts.length >= 2) {
      let code = parts[0].trim().toLowerCase();
      let detail = parts.slice(1).join(':').trim();
      
      // Si el primer trozo es "dataerror", lo saltamos
      if (code === 'dataerror') {
        code = parts[1].trim().toLowerCase();
        detail = parts.slice(2).join(':').trim();
      }
      return `${code}:${detail}`;
    }
    
    return `other:${String(e)}`;
  }
}