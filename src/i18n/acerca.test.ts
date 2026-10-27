import { describe, expect, it } from 'vitest';
import { esAcerca } from './acerca';

describe('esAcerca', () => {
  it('carries the orientative notice and the offline statement', () => {
    expect(esAcerca.disclaimer).toContain('orientativos');
    expect(esAcerca.offline).toContain('no usa internet');
  });
});
