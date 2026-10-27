import type {Gender, Level, Statement, SuspectId, WitnessId} from './core';
import {SUSPECTS, affectedBy} from './core';

const TRAITS: Record<Level, {M: string; F: string}> = {
  0: {M: 'Muy arisco', F: 'Muy arisca'},
  1: {M: 'Arisco', F: 'Arisca'},
  2: {M: 'Cariñoso', F: 'Cariñosa'},
  3: {M: 'Muy cariñoso', F: 'Muy cariñosa'},
};
export const traitLabel = (g: Gender, l: Level) => TRAITS[l][g];
export const suspectOf = (id: SuspectId) => SUSPECTS.find(s => s.id === id)!;

/** Textos de testigos reescritos con total claridad (§3.8). La lógica es la de `readAs`. */
export const WITNESS_INFO: Record<WitnessId, {short: string; title: string; effect: string}> = {
  Thomas: {
    short: '♂ ⇄ ♀',
    title: 'Thomas',
    effect: 'Cambia «chico» por «chica» (y al revés) en todo lo que se dice sobre género.',
  },
  'Mr. Red': {
    short: 'Arisco → Cariñoso',
    title: 'Mr. Red',
    effect:
      'Donde un testimonio diga «Arisco» (o «Muy arisco», o «más/menos arisco»), léelo como «Cariñoso» («Muy cariñoso», «cariñoso»).',
  },
  'La Vicente': {
    short: 'Cariñoso → Arisco',
    title: 'La Vicente',
    effect:
      'Donde un testimonio diga «Cariñoso» (o «Muy cariñoso», o «más/menos cariñoso»), léelo como «Arisco» («Muy arisco», «arisco»).',
  },
  'Croqueta Batista': {
    short: 'Verdad ⇄ Identidad',
    title: 'Croqueta Batista',
    effect: '«X miente» significa «X es inocente». «X dice la verdad» significa «X es culpable».',
  },
};
export const WITNESS_NOTE =
  'Si Mr. Red y La Vicente están a la vez, cada uno cambia sólo su palabra: no se encadenan.';

export const RULES_TEXT: {title: string; body: string}[] = [
  {
    title: 'Objetivo',
    body: 'Deduce quiénes son los asesinos y quiénes los mentirosos («sapos») cruzando los testimonios de todos los sospechosos. El marcador te dice cuántos de cada hay.',
  },
  {
    title: 'Mentirosos',
    body: 'Un mentiroso dice lo contrario de lo que significa su carta. Si dice «Ningún asesino es chico», la realidad es «Al menos un asesino es chico». Un sospechoso puede ser a la vez asesino y mentiroso.',
  },
  {
    title: 'Testigos',
    body: 'No declaran: cambian cómo se leen los testimonios de los demás. Tócalos en la mesa para ver su efecto.',
  },
  {
    title: 'Escala de afecto',
    body: 'De menos a más cariñoso: Muy arisco (Tavio, Pili) · Arisco (Pork, Charlot) · Cariñoso (Lolo, Luisa) · Muy cariñoso (Charls, Reisy).',
  },
  {
    title: 'Entrega',
    body: 'Sólo tienes una entrega: mantén pulsado el botón para confirmar. En Versus gana quien acierte en menos tiempo.',
  },
];

export const MODE_LABEL = {
  solo: 'Solitario',
  daily: 'Reto diario',
  cooperativo: 'Cooperativo',
  versus: 'Versus',
} as const;

/** Testigos activos que alteran la lectura de una carta (para el Modo Asistido). */
export const hintFor = (st: Statement, active: readonly WitnessId[]): WitnessId[] =>
  affectedBy(st).filter(w => active.includes(w));
