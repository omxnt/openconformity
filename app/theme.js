// The theme is set before the stylesheet loads, so the first paint is
// already in the right one: the stored choice, else the system
// preference. The key and the values are the store's (modules/store.js).
// A file rather than an inline script, so the page's content security
// policy can allow the software's own scripts and nothing else.
document.documentElement.dataset.theme = (function chooseTheme() {
  try {
    var stored = localStorage.getItem('openconformity.theme');
    if (stored === 'white' || stored === 'g100') return stored;
  } catch (error) {
    /* Storage can be unavailable; fall through. */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'g100' : 'white';
})();
