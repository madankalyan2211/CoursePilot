/**
 * CoursePilot — Main World Script
 * Runs in main world context without mutating native network APIs.
 * Prevents LinkedIn Learning / site players from forcing playbackRate to 2.0x.
 * Guarantees smooth native high-speed playback across DOM & Shadow DOM elements.
 */
(function () {
  if (window.__coursepilot_main_installed) return;
  window.__coursepilot_main_installed = true;

  try {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-coursepilot-main-installed', 'true');
    }
  } catch (e) {}

  let activeDesiredSpeed = null;
  let isWritingSpeed = false;

  function getDesiredSpeed() {
    const attr = document.documentElement?.getAttribute('data-coursepilot-speed');
    if (attr) {
      const num = Number(attr);
      if (num && !isNaN(num) && num > 0) {
        activeDesiredSpeed = Math.min(16.0, Math.max(0.0625, num));
        return activeDesiredSpeed;
      }
    }
    if (window.__coursepilot_desired_speed) {
      const num = Number(window.__coursepilot_desired_speed);
      if (num && !isNaN(num) && num > 0) {
        activeDesiredSpeed = Math.min(16.0, Math.max(0.0625, num));
        return activeDesiredSpeed;
      }
    }
    return activeDesiredSpeed || null;
  }

  function findAllVideos(root = document) {
    let list = [];
    try {
      const direct = root.querySelectorAll('video');
      for (let i = 0; i < direct.length; i++) {
        list.push(direct[i]);
      }
    } catch (e) {}

    try {
      const all = root.querySelectorAll('*');
      for (let i = 0; i < all.length; i++) {
        if (all[i].shadowRoot) {
          list.push(...findAllVideos(all[i].shadowRoot));
        }
      }
    } catch (e) {}

    return list;
  }

  // Intercept both playbackRate and defaultPlaybackRate on HTMLMediaElement prototype
  const descriptors = {
    playbackRate: Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate'),
    defaultPlaybackRate: Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'defaultPlaybackRate')
  };

  const nativeSetPlaybackRate = descriptors.playbackRate?.set;
  const nativeGetPlaybackRate = descriptors.playbackRate?.get;
  const nativeSetDefaultPlaybackRate = descriptors.defaultPlaybackRate?.set;
  const nativeGetDefaultPlaybackRate = descriptors.defaultPlaybackRate?.get;

  if (descriptors.playbackRate && nativeSetPlaybackRate && nativeGetPlaybackRate) {
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      get() {
        return nativeGetPlaybackRate.call(this);
      },
      set(val) {
        const desired = getDesiredSpeed();
        // If CoursePilot has chosen a speed and site tries to reset/clamp it (e.g. 2.0x), enforce desired speed!
        if (desired !== null && !isWritingSpeed) {
          isWritingSpeed = true;
          try {
            nativeSetPlaybackRate.call(this, desired);
          } finally {
            isWritingSpeed = false;
          }
        } else {
          nativeSetPlaybackRate.call(this, val);
        }
      },
      configurable: true,
      enumerable: true
    });
  }

  if (descriptors.defaultPlaybackRate && nativeSetDefaultPlaybackRate && nativeGetDefaultPlaybackRate) {
    Object.defineProperty(HTMLMediaElement.prototype, 'defaultPlaybackRate', {
      get() {
        return nativeGetDefaultPlaybackRate.call(this);
      },
      set(val) {
        const desired = getDesiredSpeed();
        if (desired !== null && !isWritingSpeed) {
          isWritingSpeed = true;
          try {
            nativeSetDefaultPlaybackRate.call(this, desired);
          } finally {
            isWritingSpeed = false;
          }
        } else {
          nativeSetDefaultPlaybackRate.call(this, val);
        }
      },
      configurable: true,
      enumerable: true
    });
  }

  function protectVideoElement(v) {
    if (!v || v.__coursepilot_protected) return;
    v.__coursepilot_protected = true;

    try {
      Object.defineProperty(v, 'playbackRate', {
        get() {
          return nativeGetPlaybackRate ? nativeGetPlaybackRate.call(this) : v.playbackRate;
        },
        set(val) {
          const desired = getDesiredSpeed();
          if (desired !== null && !isWritingSpeed) {
            isWritingSpeed = true;
            try {
              if (nativeSetPlaybackRate) nativeSetPlaybackRate.call(this, desired);
              else v.playbackRate = desired;
            } finally {
              isWritingSpeed = false;
            }
          } else {
            if (nativeSetPlaybackRate) nativeSetPlaybackRate.call(this, val);
            else v.playbackRate = val;
          }
        },
        configurable: true,
        enumerable: true
      });
    } catch (e) {}

    try {
      if (v.player && typeof v.player.playbackRate === 'function' && !v.player.__coursepilot_hooked) {
        v.player.__coursepilot_hooked = true;
        const origPlayerRate = v.player.playbackRate.bind(v.player);
        v.player.playbackRate = function (newRate) {
          if (arguments.length === 0) return origPlayerRate();
          const desired = getDesiredSpeed();
          if (desired !== null && !isWritingSpeed) {
            return origPlayerRate(desired);
          }
          return origPlayerRate(newRate);
        };
      }
    } catch (e) {}
  }

  function hookGlobalVideoJs() {
    try {
      if (typeof window.videojs === 'function' && window.videojs.players) {
        Object.values(window.videojs.players).forEach((p) => {
          if (p && typeof p.playbackRate === 'function' && !p.__coursepilot_hooked) {
            p.__coursepilot_hooked = true;
            const origRate = p.playbackRate.bind(p);
            p.playbackRate = function (newRate) {
              if (arguments.length === 0) return origRate();
              const desired = getDesiredSpeed();
              if (desired !== null && !isWritingSpeed) {
                return origRate(desired);
              }
              return origRate(newRate);
            };
          }
        });
      }
    } catch (e) {}
  }

  function applySpeed(rate) {
    const num = Number(rate);
    if (!num || isNaN(num) || num <= 0) return;
    const safeRate = Math.min(16.0, Math.max(0.0625, num));
    activeDesiredSpeed = safeRate;
    window.__coursepilot_desired_speed = safeRate;

    try {
      document.documentElement.setAttribute('data-coursepilot-speed', String(safeRate));
    } catch (e) {}

    hookGlobalVideoJs();

    isWritingSpeed = true;
    try {
      const videos = findAllVideos(document);
      videos.forEach((v) => {
        try {
          protectVideoElement(v);
          if (nativeSetPlaybackRate) {
            nativeSetPlaybackRate.call(v, safeRate);
          } else {
            v.playbackRate = safeRate;
          }
          if (nativeSetDefaultPlaybackRate) {
            nativeSetDefaultPlaybackRate.call(v, safeRate);
          } else {
            v.defaultPlaybackRate = safeRate;
          }
          if (v.player && typeof v.player.playbackRate === 'function') {
            v.player.playbackRate(safeRate);
          }
        } catch (err) {}
      });
    } finally {
      isWritingSpeed = false;
    }
  }

  // Cross-World bridge via window.postMessage (Isolated World -> Main World)
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === '__coursepilot_set_speed') {
      const rate = Number(e.data.speed);
      if (rate && !isNaN(rate)) {
        applySpeed(rate);
      }
    }
  });

  // Watch for data-coursepilot-speed attribute changes on <html>
  if (document.documentElement) {
    const attrObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-coursepilot-speed') {
          const val = document.documentElement.getAttribute('data-coursepilot-speed');
          if (val) {
            applySpeed(Number(val));
          }
        }
      }
    });
    attrObserver.observe(document.documentElement, { attributes: true });
  }

  // Window & Document capture listener: completely hide custom high speeds from LinkedIn Learning's player scripts
  const handleRateChangeCapture = (e) => {
    const desired = getDesiredSpeed();
    if (desired !== null && e.target && e.target.tagName === 'VIDEO') {
      const v = e.target;
      // If the video already matches our desired rate, suppress propagation so LinkedIn never sees it
      if (Math.abs(v.playbackRate - desired) <= 0.05) {
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        return;
      }

      // If site player tried to force an unwanted speed (e.g. 2.0x), stop propagation and re-assert desired speed
      if (!isWritingSpeed) {
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }
        isWritingSpeed = true;
        try {
          protectVideoElement(v);
          if (nativeSetPlaybackRate) {
            nativeSetPlaybackRate.call(v, desired);
          } else {
            v.playbackRate = desired;
          }
          if (nativeSetDefaultPlaybackRate) {
            nativeSetDefaultPlaybackRate.call(v, desired);
          }
        } catch (err) {}
        finally {
          isWritingSpeed = false;
        }
      }
    }
  };

  window.addEventListener('ratechange', handleRateChangeCapture, true);
  document.addEventListener('ratechange', handleRateChangeCapture, true);

  // Re-assert desired speed on lifecycle media events
  ['play', 'loadedmetadata', 'canplay', 'loadstart', 'timeupdate', 'seeking', 'seeked'].forEach((evtName) => {
    document.addEventListener(evtName, (e) => {
      const desired = getDesiredSpeed();
      if (desired !== null && e.target && e.target.tagName === 'VIDEO' && !isWritingSpeed) {
        const v = e.target;
        protectVideoElement(v);
        if (Math.abs(v.playbackRate - desired) > 0.05) {
          isWritingSpeed = true;
          try {
            if (nativeSetPlaybackRate) {
              nativeSetPlaybackRate.call(v, desired);
            } else {
              v.playbackRate = desired;
            }
          } catch (err) {}
          finally {
            isWritingSpeed = false;
          }
        }
      }
    }, true);
  });

  // Watchdog timer (every 150ms) to counteract aggressive timers or players resetting to 2.0x
  setInterval(() => {
    const desired = getDesiredSpeed();
    if (desired !== null && !isWritingSpeed) {
      const videos = findAllVideos(document);
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (Math.abs(v.playbackRate - desired) > 0.05) {
          isWritingSpeed = true;
          try {
            if (nativeSetPlaybackRate) {
              nativeSetPlaybackRate.call(v, desired);
            } else {
              v.playbackRate = desired;
            }
          } catch (e) {}
          finally {
            isWritingSpeed = false;
          }
        }
      }
    }
  }, 150);
})();
