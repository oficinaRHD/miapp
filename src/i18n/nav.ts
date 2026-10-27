// UI texts for the dropdown menu.
import type { NavId } from '../app/nav';

export const esNav = {
  appName: 'Asistente TCP',
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  items: {
    inicio: 'Inicio',
    calendario: 'Calendario',
    obligaciones: 'Obligaciones',
    registro: 'Registro',
    calculadora: 'Calculadora',
    ajustes: 'Ajustes',
  } satisfies Record<NavId, string>,
};
