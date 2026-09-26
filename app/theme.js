// The theme is set before the stylesheet loads: the stored choice, else
// the system preference. The key and the values are the store's
// (modules/store.js). A file rather than an inline script, under the
// page's content security policy.
document.documentElement.dataset.theme = (function chooseTheme() {
  try {
    var stored = localStorage.getItem('openconformity.theme');
    if (stored === 'white' || stored === 'g100') return stored;
  } catch (error) {
    /* Storage can be unavailable; fall through. */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'g100' : 'white';
})();
