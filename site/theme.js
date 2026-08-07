/**
 * The theme toggle, the same one the software carries and against the same
 * stored key, so a choice made in either place holds in the other.
 */

/** Remembers the chosen theme, on this device only. */
const THEME_KEY = 'openconformity.theme';

const toggle = document.getElementById('theme-toggle');
const darkSources = document.querySelectorAll('picture source[data-dark]');

/**
 * Links to a file that comes in both themes. The one in the markup is the
 * light file, so it is read once here and kept as the light end of the pair.
 */
const themedLinks = [...document.querySelectorAll('a[data-dark-href]')].map((link) => ({
  link,
  light: link.getAttribute('href'),
  dark: link.dataset.darkHref,
}));

/**
 * The theme was set on the root element before the stylesheet loaded; from
 * here on the toggle owns it. The button offers the theme it would switch to.
 */
function isDark() {
  return document.documentElement.dataset.theme === 'dark';
}

function reflectTheme() {
  const offer = isDark() ? 'Switch to the light theme' : 'Switch to the dark theme';
  toggle.title = offer;
  toggle.setAttribute('aria-label', offer);

  // The shots follow the theme, not the system setting their sources ask
  // about. "all" always matches and "not all" never does, so replacing the
  // query settles which of each pair the picture resolves to.
  for (const source of darkSources) {
    source.media = isDark() ? 'all' : 'not all';
  }

  // Opening the full-size file should hand over the one being looked at.
  for (const { link, light, dark } of themedLinks) {
    link.setAttribute('href', isDark() ? dark : light);
  }
}

function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage can be unavailable; the choice then lasts for this tab only.
  }
  reflectTheme();
}

toggle.addEventListener('click', toggleTheme);

reflectTheme();
