import type { AppDB } from '../db';
import { adjuntosRepo } from './adjuntos';
import { ajustesRepo } from './ajustes';
import { categoriasRepo } from './categorias';
import { feriadosRepo } from './feriados';
import { movimientosRepo } from './movimientos';
import { obligacionesRepo } from './obligaciones';
import { perfilRepo } from './perfil';

export function createRepositories(db: AppDB) {
  return {
    perfil: perfilRepo(db),
    ajustes: ajustesRepo(db),
    categorias: categoriasRepo(db),
    movimientos: movimientosRepo(db),
    obligaciones: obligacionesRepo(db),
    adjuntos: adjuntosRepo(db),
    feriados: feriadosRepo(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

export type { AdjuntoInput } from './adjuntos';
export type { CategoriaChanges, CategoriaInput } from './categorias';
export type { MovimientoInput } from './movimientos';
export type {
  ObligacionChanges,
  ObligacionDraftInput,
  ObligacionFilter,
  PagoInput,
} from './obligaciones';
export type { PerfilInput } from './perfil';
