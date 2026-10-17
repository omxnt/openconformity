/**
 * The registry of views, what the model can be read as, in menu and tab
 * order. A pure list, so the actions and the flows read it without the
 * pane that renders a view.
 */

import { RISK_VIEW } from './view-risk.js';
import { SAFETY_VIEW } from './view-safety.js';

/**
 * @typedef {Object} Built  a view read off a model
 * @property {string} id
 * @property {string} title
 * @property {string[]} [exports]  the formats it saves as, every format where unset
 * @property {'first'} [wholeSheets]  the workbook saved whole comes from the first section alone
 * @property {Array<{ name: string, tables: Array<Object>, register?: Object }>} sections
 *
 * @typedef {Object} View
 * @property {string} id
 * @property {string} name
 * @property {(model: import('./model.js').Model) => Built} build
 */

/**
 * Every view, in menu and tab order.
 * @type {View[]}
 */
export const VIEWS = [RISK_VIEW, SAFETY_VIEW];
