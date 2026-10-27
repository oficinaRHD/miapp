// UI texts for V14 (Ajustes).
import type { AjusteId } from '../app/ajustesMenu';

export const esAjustes = {
  title: 'Ajustes',
  back: 'Volver al inicio',
  soon: 'Próximamente',
  entries: {
    perfil: { label: 'Perfil y tributos', hint: 'Tus datos, actividad y tributos activos.' },
    notificaciones: { label: 'Notificaciones', hint: 'Avisos de vencimiento y recordatorios del mes.' },
    respaldo: { label: 'Respaldo y datos', hint: 'Exportar, importar o borrar tus datos.' },
    feriados: { label: 'Feriados', hint: 'Lista editable para contar días hábiles.' },
    apariencia: { label: 'Apariencia', hint: 'Tema claro u oscuro.' },
    acerca: { label: 'Acerca de', hint: 'Versión de la app y de las reglas.' },
  } satisfies Record<AjusteId, { label: string; hint: string }>,
};
