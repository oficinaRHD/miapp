// All UI strings live here (see docs/02, section 10).
export const es = {
  appName: 'Asistente TCP',
  tagline: 'Tus obligaciones con la ONAT, claras y a tiempo.',
  offlineNote: 'Funciona sin internet. Tus datos se quedan en este teléfono.',
  milestoneTitle: 'Hito M0',
  milestoneBody: 'La app abre correctamente. Próximo paso: reglas y cálculos (M1).',
  versionLabel: 'Versión',

  // M3 step 2b (provisional shell, replaced by the real views in step 3)
  loading: 'Cargando…',
  loadError: 'No se pudieron cargar los datos',
  routeLabel: 'Ruta',
  paramsLabel: 'Parámetros',
  profileLabel: 'Perfil',
  profileNone: 'sin crear',
  devOnboardingTitle: 'Onboarding (provisional)',
  devOnboardingBody: 'La pantalla real llega en el paso 3. Para probar el guardián:',
  devCreateProfile: 'Crear perfil de prueba',
  devProfileName: 'Perfil de prueba',
} as const;
