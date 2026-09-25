/**
 * The icon everything renders under: one Carbon glyph per entity type,
 * each a distinct silhouette so shape carries the type, tinted by pillar
 * where it stands for a type; the folder and the project carry their own,
 * untinted. The identifiers name symbols of the sprite in `index.html`;
 * the sources sit in `assets/icons/` with their mapping in ORIGIN.md.
 */

/** @type {Object<string, string>} one symbol per entity type, in metamodel order */
export const TYPE_ICONS = {
  LEG: 'i-leg',
  HST: 'i-hst',
  OSP: 'i-osp',
  CAS: 'i-cas',
  NTB: 'i-ntb',
  ESR: 'i-esr',
  HSR: 'i-hsr',
  OSR: 'i-osr',
  REQ: 'i-req',
  VER: 'i-ver',
  HAZ: 'i-haz',
  SCN: 'i-scn',
  PRM: 'i-prm',
  SAF: 'i-saf',
  ELM: 'i-elm',
  ACT: 'i-act',
  TSK: 'i-tsk',
  PHS: 'i-phs',
};

/** The folder's own glyph, unlike any type's. */
export const FOLDER_ICON = 'i-folder';

/** The project's own glyph, unlike any type's. */
export const PROJECT_ICON = 'i-project';
