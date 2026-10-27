import { describe, expect, it } from 'vitest';
import { esNotificaciones, resultText, testText } from './notificaciones';

describe('resultText', () => {
  it('reports how many notices were scheduled', () => {
    expect(resultText({ status: 'ok', scheduled: 12, cancelled: 3 })).toBe('Avisos programados: 12.');
    expect(resultText({ status: 'ok', scheduled: 0, cancelled: 0 })).toContain('No hay avisos');
  });
  it('explains skips and errors', () => {
    expect(resultText({ status: 'skipped', reason: 'no-permission' })).toContain('permiso');
    expect(resultText({ status: 'skipped', reason: 'not-native' })).toContain('APK');
    expect(resultText({ status: 'error', message: 'boom' })).toContain('boom');
  });
});

describe('testText and pendingCount', () => {
  it('covers each test result', () => {
    expect(testText('sent')).toContain('10 segundos');
    expect(testText('not-native')).toContain('APK');
    expect(testText('no-permission')).toContain('permiso');
  });
  it('uses the singular for one notice', () => {
    expect(esNotificaciones.pendingCount(1)).toBe('1 aviso en espera.');
    expect(esNotificaciones.pendingCount(5)).toBe('5 avisos en espera.');
  });
});
