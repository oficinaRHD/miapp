// Status and navigation bar icons: the only place that talks to Capacitor's SystemBars.
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

/** Light icons for a dark app, dark icons for a light app. No-op in the browser; never throws. */
export async function setSystemBarsDark(dark: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
  } catch {
    // The bars keep the default style.
  }
}
