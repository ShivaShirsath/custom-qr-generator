// Applies the saved theme before first paint to avoid a flash of the wrong theme.
(function () {
  var mode = 'system';
  try {
    var stored = window.localStorage.getItem('cqg:theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') mode = stored;
  } catch (_) {
    /* storage unavailable */
  }
  var dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.setAttribute('data-theme-mode', mode);
})();
