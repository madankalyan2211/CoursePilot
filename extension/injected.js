/**
 * CoursePilot — Main World Diagnostic Observer
 * Runs directly in the webpage context (main world).
 * Complies 100% with Content Security Policy (no inline scripts).
 * Intercepts GraphQL telemetry to monitor genuine completion signals.
 * Does NOT manipulate player UI or controls, ensuring full user interactivity.
 */

(function () {
  if (window.__coursepilot_main_installed) return;
  window.__coursepilot_main_installed = true;
  try {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-coursepilot-main-installed', 'true');
    }
  } catch(e) {}

  // Diagnostic Network Observer (read-only)
  function checkGraphQLBody(url, body) {
    try {
      if (!body || typeof body !== 'string') return;
      if (body.includes('clientReportedContentStateChangeActions') || (url && url.includes('clientReportedContentStateChangeActions'))) {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch(e) {}
        const stateData = parsed?.variables?.clientReportedStateChangeData || parsed?.clientReportedStateChangeData;
        const contentUrn = stateData?.contentUrn || stateData?.contentKey || stateData?.trackingUrn;
        const progressType = stateData?.progressType || stateData?.stateChangeType || stateData?.contentState;
        window.postMessage({
          source: 'coursepilot_telemetry',
          type: 'GRAPHQL_STATE_CHANGE',
          contentUrn,
          progressType,
          timestamp: Date.now()
        }, '*');
      }
    } catch(e) {}
  }

  try {
    const origFetch = window.fetch;
    window.fetch = function(...args) {
      try {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const options = args[1];
        if (options && options.body) {
          checkGraphQLBody(url, options.body);
        }
      } catch(e) {}
      return origFetch.apply(this, args);
    };

    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
      try {
        checkGraphQLBody(this._url || '', body);
      } catch(e) {}
      return origSend.apply(this, arguments);
    };

    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      return origOpen.apply(this, arguments);
    };
  } catch(e) {}
})();
