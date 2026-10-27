// UI texts for V14 "Apariencia".
import type { Tema } from '../app/apariencia';

export const esApariencia = {
  title: 'Apariencia',
  back: 'Volver a Ajustes',
  body: 'Elige el tema de colores de la app.',
  choices: {
    auto: { label: 'Automático', hint: 'Sigue el modo claro u oscuro del teléfono.' },
    light: { label: 'Claro', hint: 'Fondo claro siempre.' },
    dark: { label: 'Oscuro', hint: 'Fondo oscuro siempre.' },
  } satisfies Record<Tema, { label: string; hint: string }>,
  saved: 'Tema guardado.',
  actionError: 'No se pudo guardar el tema',
};
