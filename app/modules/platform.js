/**
 * The platform the software runs on, read once: whether it is Apple's,
 * where the command key and Option stand for Ctrl and Alt in a hint.
 */

/** Whether the platform is Apple's. */
export const APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
