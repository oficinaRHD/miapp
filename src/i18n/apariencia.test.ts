import { describe, expect, it } from 'vitest';
import { TEMA_CHOICES } from '../app/apariencia';
import { esApariencia } from './apariencia';

describe('esApariencia', () => {
  it('has a label and a hint for every theme', () => {
    for (const t of TEMA_CHOICES) {
      expect(esApariencia.choices[t].label.length > 0).toBe(true);
      expect(esApariencia.choices[t].hint.length > 0).toBe(true);
    }
  });
});
