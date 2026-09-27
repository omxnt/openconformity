/**
 * The registry of views, what the model can be read as, in menu and tab
 * order. A pure list, so the actions and the flows read it without the
 * pane that renders a view.
 */

import { RISK_VIEW } from './view-risk.js';
import { SAFETY_VIEW } from './view-safety.js';

/** Every view, in menu and tab order. */
export const VIEWS = [RISK_VIEW, SAFETY_VIEW];
