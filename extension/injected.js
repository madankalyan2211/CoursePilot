/**
 * CoursePilot — Main World Script
 * Runs in main world context without mutating native network APIs.
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

  const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
  const nativeSetPlaybackRate = originalDescriptor?.set;
  const nativeGetPlaybackRate = originalDescriptor?.get;

  if (originalDescriptor && nativeSetPlaybackRate && nativeGetPlaybackRate) {
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      get() {
        return nativeGetPlaybackRate.call(this);
      },
      set(val) {
        if (activeDesiredSpeed !== null && !isWritingSpeed) {
          // If a site script attempts to reset playbackRate away from user's chosen speed, enforce desired speed
          nativeSetPlaybackRate.call(this, activeDesiredSpeed);
        } else {
          nativeSetPlaybackRate.call(this, val);
        }
      },
      configurable: true,
      enumerable: true
    });
  }

  function applySpeed(rate) {
    const num = Number(rate);
    if (!num || isNaN(num) || num <= 0) return;
    const safeRate = Math.min(16.0, Math.max(0.0625, num));
    activeDesiredSpeed = safeRate;
    window.__coursepilot_desired_speed = safeRate;

    isWritingSpeed = true;
    try {
      const videos = findAllVideos(document);
      videos.forEach((v) => {
        try {
          if (nativeSetPlaybackRate) {
            nativeSetPlaybackRate.call(v, safeRate);
          } else {
            v.playbackRate = safeRate;
          }
          v.defaultPlaybackRate = safeRate;
          if (v.player && typeof v.player.playbackRate === 'function') {
            v.player.playbackRate(safeRate);
          }
        } catch (err) {}
      });
    } finally {
      isWritingSpeed = false;
    }
  }

  function onSpeedEvent(e) {
    const rate = e.detail?.speed ?? e.detail;
    applySpeed(rate);
  }

  window.addEventListener('__coursepilot_set_speed', onSpeedEvent, true);
  document.addEventListener('__coursepilot_set_speed', onSpeedEvent, true);

  // Re-assert desired speed on lifecycle media events
  ['play', 'loadedmetadata', 'canplay', 'loadstart'].forEach((evtName) => {
    document.addEventListener(evtName, (e) => {
      if (activeDesiredSpeed !== null && e.target && e.target.tagName === 'VIDEO') {
        const v = e.target;
        if (Math.abs(v.playbackRate - activeDesiredSpeed) > 0.05) {
          isWritingSpeed = true;
          try {
            if (nativeSetPlaybackRate) {
              nativeSetPlaybackRate.call(v, activeDesiredSpeed);
            } else {
              v.playbackRate = activeDesiredSpeed;
            }
          } catch (err) {}
          finally {
            isWritingSpeed = false;
          }
        }
      }
    }, true);
  });
})();
