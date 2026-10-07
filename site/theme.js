// The theme is set before the stylesheet loads: the stored choice, else
// the system preference. The key is the software's, so a visitor who has
// chosen a theme in the tool arrives here in it. A file rather than an
// inline script, under the page's content security policy.
document.documentElement.dataset.theme = (function chooseTheme() {
  try {
    var stored = localStorage.getItem('openconformity.theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (error) {
    /* Storage can be unavailable; fall through. */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();
