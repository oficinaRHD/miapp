// App lifecycle: the only place that talks to @capacitor/app for foreground events.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/** Calls back each time the app comes back to the foreground. Returns a remover. */
export function onAppResume(callback: () => void): () => void {
  if (!Capacitor.isNativePlatform()) {
    // Browser (development): the tab becoming visible is the closest equivalent.
    const handler = (): void => {
      if (document.visibilityState === 'visible') callback();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }
  const handle = App.addListener('appStateChange', (state) => {
    if (state.isActive) callback();
  });
  return () => {
    void handle.then((h) => h.remove());
  };
}
