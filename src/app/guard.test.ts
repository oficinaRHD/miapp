import { describe, expect, it } from 'vitest';
import { resolveRedirect } from './guard';
import { parseRoute } from './routes';

const at = (hash: string) => parseRoute(hash);

describe('resolveRedirect', () => {
  it('sends inicio to onboarding when not done', () => {
    expect(resolveRedirect(at('#/'), false)).toBe('/onboarding');
  });

  it('sends any inner route to onboarding when not done', () => {
    expect(resolveRedirect(at('#/calendario'), false)).toBe('/onboarding');
    expect(resolveRedirect(at('#/nada'), false)).toBe('/onboarding');
  });

  it('allows onboarding when not done', () => {
    expect(resolveRedirect(at('#/onboarding'), false)).toBeNull();
  });

  it('allows the backup screen when not done', () => {
    expect(resolveRedirect(at('#/ajustes/respaldo'), false)).toBeNull();
  });

  it('allows inner routes when done', () => {
    expect(resolveRedirect(at('#/calendario'), true)).toBeNull();
    expect(resolveRedirect(at('#/'), true)).toBeNull();
  });

  it('sends onboarding to inicio when done', () => {
    expect(resolveRedirect(at('#/onboarding'), true)).toBe('/');
  });
});
