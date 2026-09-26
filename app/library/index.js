/**
 * The built-in catalogues: content the software ships and imports from,
 * each a project file used as a source, loaded with the software and
 * fetched from nowhere. One entry per catalogue, in the order the picker
 * offers them as tabs, each with the date its content stands at.
 */

import { STAND_IN_LIBRARY } from './stand-in.js';

/**
 * @typedef {Object} Library
 * @property {string} id
 * @property {string} name
 * @property {string} date  when the content was last brought up to date, as a calendar date
 * @property {Object} project  the library in the project file's shape
 */

/** @type {Library[]} */
export const LIBRARIES = [{ id: 'legislation', name: 'European legislation', date: '2026-09-26', project: STAND_IN_LIBRARY }];
