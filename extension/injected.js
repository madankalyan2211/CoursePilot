/**
 * CoursePilot — Main World Injected Script
 * Runs directly in the webpage context (main world).
 * Complies 100% with Content Security Policy (no inline scripts).
 * Intercepts GraphQL telemetry and controls Video.js & native media elements.
 */

(function () {
  if (window.__coursepilot_main_installed) return;
  window.__coursepilot_main_installed = true;
  try {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-coursepilot-main-installed', 'true');
    }
  } catch(e) {}

  let currentTargetRate = 4.0;
  let isInternalRateChange = false;

  // 1. Diagnostic Network Observer (read-only)
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
    window.fetch = async function(...args) {
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

  // 2. Playback Speed Accelerator & Player Controller
  function applyTargetPlaybackRate(rate) {
    const safeRate = Math.min(16.0, Math.max(0.5, Number(rate) || 4.0));
    currentTargetRate = safeRate;
    window.__coursepilot_target_rate = safeRate;

    isInternalRateChange = true;
    try {
      // A. Configure Video.js player instances
      if (window.videojs) {
        try {
          const players = window.videojs.getPlayers ? window.videojs.getPlayers() : window.videojs.players;
          if (players) {
            for (const key in players) {
              const p = players[key];
              if (p) {
                try { p.muted(true); } catch(e) {}
                try { p.volume(0); } catch(e) {}

                if (p.options_ && !p._coursepilot_configured) {
                  p._coursepilot_configured = true;
                  p.options_.playbackRates = [0.5, 1, 2, 4, 6, 8, 12, 16];
                }
                if (typeof p.playbackRates === 'function' && !p._coursepilot_rates_set) {
                  p._coursepilot_rates_set = true;
                  try { p.playbackRates([0.5, 1, 2, 4, 6, 8, 12, 16]); } catch(e) {}
                }
                if (typeof p.playbackRate === 'function') {
                  try {
                    if (Math.abs(p.playbackRate() - safeRate) > 0.05) {
                      p.playbackRate(safeRate);
                    }
                  } catch(e) {}
                }
                if (p.tech_ && typeof p.tech_.setPlaybackRate === 'function') {
                  try { p.tech_.setPlaybackRate(safeRate); } catch(e) {}
                }

                if (typeof p.play === 'function') {
                  try { p.play(); } catch(e) {}
                }
              }
            }
          }
        } catch(e) {}
      }

      // B. Configure native HTML5 video elements
      try {
        const vids = document.querySelectorAll('video');
        vids.forEach(v => {
          if (!v) return;
          v.muted = true;
          v.defaultMuted = true;
          try { v.volume = 0; } catch(e) {}

          // Apply target rate if different
          if (Math.abs(v.playbackRate - safeRate) > 0.05) {
            try {
              const setter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')?.set;
              if (setter) {
                setter.call(v, safeRate);
              } else {
                v.playbackRate = safeRate;
              }
            } catch(e) {
              try { v.playbackRate = safeRate; } catch(e2) {}
            }
          }

          // Lock speed against LinkedIn internal resets without infinite loops
          if (!v._coursepilot_rate_locked) {
            v._coursepilot_rate_locked = true;
            v.addEventListener('ratechange', function() {
              if (isInternalRateChange) return;
              const desired = window.__coursepilot_target_rate || currentTargetRate;
              if (desired && Math.abs(v.playbackRate - desired) > 0.1 && desired <= 16.0) {
                isInternalRateChange = true;
                try {
                  const s = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')?.set;
                  if (s) s.call(v, desired);
                  else v.playbackRate = desired;
                } catch(e) {}
                setTimeout(() => { isInternalRateChange = false; }, 60);
              }
            }, true);
          }

          if (v.paused && v.duration > 0) {
            v.play().catch(() => {});
          }
        });
      } catch(e) {}
    } finally {
      setTimeout(() => { isInternalRateChange = false; }, 60);
    }
  }

  // 3. Listen for commands from isolated-world content.js
  window.addEventListener('message', (event) => {
    if (!event.data || event.data.source !== 'coursepilot_extension') return;
    if (event.data.action === 'APPLY_PLAYBACK_RATE') {
      applyTargetPlaybackRate(event.data.rate);
    }
  });
})();
