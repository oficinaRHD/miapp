// Pure data for V14 "Acerca de". No fiscal logic: it only formats versions.

export interface AboutInfo {
  appVersion: string;
  rulesVersion: string;
}

const SEMVER = /^\d+\.\d+\.\d+$/;

export function isValidAppVersion(version: string): boolean {
  return SEMVER.test(version);
}

/** Rows shown in the view, in order: [label key, value]. */
export function aboutRows(info: AboutInfo): { key: 'app' | 'rules'; value: string }[] {
  return [
    { key: 'app', value: info.appVersion },
    { key: 'rules', value: info.rulesVersion },
  ];
}
