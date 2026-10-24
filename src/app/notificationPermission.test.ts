import { describe, expect, it } from 'vitest';
import {
  SETTING_NOTIFICATION_PERMISSION,
  isPermissionState,
  mapPermission,
} from './notificationPermission';

describe('mapPermission', () => {
  it('maps granted and denied', () => {
    expect(mapPermission('granted')).toBe('granted');
    expect(mapPermission('denied')).toBe('denied');
  });

  it('treats prompt values as unknown', () => {
    expect(mapPermission('prompt')).toBe('unknown');
    expect(mapPermission('prompt-with-rationale')).toBe('unknown');
  });

  it('treats unexpected values as unknown', () => {
    expect(mapPermission(undefined)).toBe('unknown');
    expect(mapPermission(null)).toBe('unknown');
    expect(mapPermission(1)).toBe('unknown');
    expect(mapPermission('GRANTED')).toBe('unknown');
  });
});

describe('isPermissionState', () => {
  it('accepts the three known states', () => {
    expect(isPermissionState('granted')).toBe(true);
    expect(isPermissionState('denied')).toBe(true);
    expect(isPermissionState('unknown')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isPermissionState('prompt')).toBe(false);
    expect(isPermissionState(undefined)).toBe(false);
    expect(isPermissionState(true)).toBe(false);
  });
});

describe('SETTING_NOTIFICATION_PERMISSION', () => {
  it('is the settings key agreed for the permission state', () => {
    expect(SETTING_NOTIFICATION_PERMISSION).toBe('notificacionesPermiso');
  });
});
