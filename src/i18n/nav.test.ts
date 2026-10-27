import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../app/nav';
import { esNav } from './nav';

describe('esNav', () => {
  it('has a label for every menu item', () => {
    for (const item of NAV_ITEMS) expect(esNav.items[item.id].length > 0).toBe(true);
  });
});
