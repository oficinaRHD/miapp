// UI texts for V14 "Feriados".
import type { FeriadoError } from '../app/feriadosForm';

export const esFeriados = {
  title: 'Feriados',
  back: 'Volver a Ajustes',
  intro:
    'Los feriados se usan para contar los días hábiles de un pago atrasado. Escríbelos tú: la app no trae un calendario oficial.',
  emptyWarning:
    'Sin feriados cargados, la app cuenta solo de lunes a viernes. El recargo por mora puede salir unos días corto.',
  fixedTitle: 'Feriados fijos',
  fixedBody:
    'Fechas que se repiten cada año: 1 de enero, 1 de mayo, 26 de julio y 10 de octubre. Los indicó el usuario y no están contrastados con una fuente oficial; revísalos y añade los que falten.',
  fixedYear: 'Año',
  fixedButton: 'Añadir los feriados fijos',
  fixedDone: (n: number) => (n === 0 ? 'Ya estaban todos en la lista.' : n === 1 ? 'Se añadió 1 feriado.' : `Se añadieron ${n} feriados.`),
  fixedYearError: 'Escribe un año válido.',
  addTitle: 'Añadir feriado',
  dateLabel: 'Fecha',
  nameLabel: 'Nombre',
  namePlaceholder: 'Ejemplo: Día de los Trabajadores',
  add: 'Añadir',
  remove: 'Quitar',
  undo: 'Deshacer',
  removed: (nombre: string) => `Quitado: ${nombre}.`,
  added: 'Feriado añadido.',
  listTitle: 'Tu lista',
  count: (n: number) => (n === 1 ? '1 feriado.' : `${n} feriados.`),
  empty: 'Aún no hay feriados.',
  errors: {
    fecha: 'Escribe una fecha válida.',
    nombre: 'Escribe un nombre.',
    duplicada: 'Ya hay un feriado en esa fecha.',
  } satisfies Record<FeriadoError, string>,
  actionError: 'No se pudo guardar la lista',
};
