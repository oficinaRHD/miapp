import { describe, expect, it } from 'vitest';
import { AJUSTES_MENU } from '../app/ajustesMenu';
import { esAjustes } from './ajustes';

describe('esAjustes', () => {
  it('has a label and a hint for every menu entry', () => {
    for (const e of AJUSTES_MENU) {
      expect(esAjustes.entries[e.id].label.length > 0).toBe(true);
      expect(esAjustes.entries[e.id].hint.length > 0).toBe(true);
    }
  });
});
