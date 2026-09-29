/**
 * CoursePilot — Main World Script
 * Runs in main world context without mutating native network APIs or player controls.
 */
(function () {
  if (window.__coursepilot_main_installed) return;
  window.__coursepilot_main_installed = true;
  try {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-coursepilot-main-installed', 'true');
    }
  } catch (e) {}
})();

