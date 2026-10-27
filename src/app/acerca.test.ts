import { describe, expect, it } from 'vitest';
import { aboutRows, isValidAppVersion } from './acerca';
import { APP_VERSION } from './version';

describe('aboutRows', () => {
  it('lists the app version and then the rules version', () => {
    expect(aboutRows({ appVersion: '0.1.0', rulesVersion: '2026.1' })).toEqual([
      { key: 'app', value: '0.1.0' },
      { key: 'rules', value: '2026.1' },
    ]);
  });
});

describe('APP_VERSION', () => {
  it('has the form major.minor.patch', () => {
    expect(isValidAppVersion(APP_VERSION)).toBe(true);
    expect(isValidAppVersion('1.0')).toBe(false);
    expect(isValidAppVersion('v0.1.0')).toBe(false);
  });
});
