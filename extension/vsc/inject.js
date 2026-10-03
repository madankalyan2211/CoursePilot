(() => {
  // src/utils/key-maps.js
  var PREDEFINED_CODE_MAP = Object.freeze({
    83: { code: "KeyS", displayKey: "s" },
    // slower
    68: { code: "KeyD", displayKey: "d" },
    // faster
    90: { code: "KeyZ", displayKey: "z" },
    // rewind
    88: { code: "KeyX", displayKey: "x" },
    // advance
    82: { code: "KeyR", displayKey: "r" },
    // reset
    71: { code: "KeyG", displayKey: "g" },
    // fast
    86: { code: "KeyV", displayKey: "v" },
    // display
    77: { code: "KeyM", displayKey: "m" },
    // mark
    74: { code: "KeyJ", displayKey: "j" }
    // jump
  });
  var KEYCODE_TO_CODE = Object.freeze({
    // Control keys
    8: "Backspace",
    13: "Enter",
    // NumpadEnter also produces 13 — we pick main Enter
    27: "Escape",
    32: "Space",
    46: "Delete",
    // Arrow keys
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    // Digit row (top)
    48: "Digit0",
    49: "Digit1",
    50: "Digit2",
    51: "Digit3",
    52: "Digit4",
    53: "Digit5",
    54: "Digit6",
    55: "Digit7",
    56: "Digit8",
    57: "Digit9",
    // Letter keys
    65: "KeyA",
    66: "KeyB",
    67: "KeyC",
    68: "KeyD",
    69: "KeyE",
    70: "KeyF",
    71: "KeyG",
    72: "KeyH",
    73: "KeyI",
    74: "KeyJ",
    75: "KeyK",
    76: "KeyL",
    77: "KeyM",
    78: "KeyN",
    79: "KeyO",
    80: "KeyP",
    81: "KeyQ",
    82: "KeyR",
    83: "KeyS",
    84: "KeyT",
    85: "KeyU",
    86: "KeyV",
    87: "KeyW",
    88: "KeyX",
    89: "KeyY",
    90: "KeyZ",
    // Numpad
    96: "Numpad0",
    97: "Numpad1",
    98: "Numpad2",
    99: "Numpad3",
    100: "Numpad4",
    101: "Numpad5",
    102: "Numpad6",
    103: "Numpad7",
    104: "Numpad8",
    105: "Numpad9",
    106: "NumpadMultiply",
    107: "NumpadAdd",
    109: "NumpadSubtract",
    110: "NumpadDecimal",
    111: "NumpadDivide",
    // Function keys
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    124: "F13",
    125: "F14",
    126: "F15",
    127: "F16",
    128: "F17",
    129: "F18",
    130: "F19",
    131: "F20",
    132: "F21",
    133: "F22",
    134: "F23",
    135: "F24",
    // Lock keys
    144: "NumLock",
    145: "ScrollLock",
    // Punctuation / symbols (US QWERTY positions)
    186: "Semicolon",
    187: "Equal",
    188: "Comma",
    189: "Minus",
    190: "Period",
    191: "Slash",
    192: "Backquote",
    219: "BracketLeft",
    220: "Backslash",
    221: "BracketRight",
    222: "Quote"
  });
  function displayKeyFromCode(code) {
    if (!code) {
      return "";
    }
    if (code.startsWith("Key") && code.length === 4) {
      return code.charAt(3).toLowerCase();
    }
    if (code.startsWith("Digit") && code.length === 6) {
      return code.charAt(5);
    }
    if (/^Numpad\d$/.test(code)) {
      return `Num ${code.charAt(6)}`;
    }
    const numpadOps = {
      NumpadEnter: "Num Enter",
      NumpadMultiply: "Num *",
      NumpadAdd: "Num +",
      NumpadSubtract: "Num -",
      NumpadDecimal: "Num .",
      NumpadDivide: "Num /"
    };
    if (numpadOps[code]) {
      return numpadOps[code];
    }
    const punctuation = {
      Semicolon: ";",
      Equal: "=",
      Comma: ",",
      Minus: "-",
      Period: ".",
      Slash: "/",
      Backquote: "`",
      BracketLeft: "[",
      Backslash: "\\",
      BracketRight: "]",
      Quote: "'"
    };
    if (punctuation[code]) {
      return punctuation[code];
    }
    return code;
  }
  var PREDEFINED_ACTIONS = [
    "slower",
    "faster",
    "rewind",
    "advance",
    "reset",
    "fast",
    "display",
    "mark",
    "jump"
  ];
  var DEFAULT_BINDINGS = Object.freeze({
    slower: { code: "KeyS", key: 83, keyCode: 83, displayKey: "s", value: 0.1 },
    faster: { code: "KeyD", key: 68, keyCode: 68, displayKey: "d", value: 0.1 },
    rewind: { code: "KeyZ", key: 90, keyCode: 90, displayKey: "z", value: 10 },
    advance: { code: "KeyX", key: 88, keyCode: 88, displayKey: "x", value: 10 },
    reset: { code: "KeyR", key: 82, keyCode: 82, displayKey: "r", value: 1 },
    fast: { code: "KeyG", key: 71, keyCode: 71, displayKey: "g", value: 1.8 },
    display: { code: "KeyV", key: 86, keyCode: 86, displayKey: "v", value: 0 },
    mark: { code: "KeyM", key: 77, keyCode: 77, displayKey: "m", value: 0 },
    jump: { code: "KeyJ", key: 74, keyCode: 74, displayKey: "j", value: 0 }
  });
  var BLACKLISTED_CODES = /* @__PURE__ */ new Set([
    "Tab",
    "ShiftLeft",
    "ShiftRight",
    "ControlLeft",
    "ControlRight",
    "AltLeft",
    "AltRight",
    "MetaLeft",
    "MetaRight",
    "ContextMenu",
    "CapsLock",
    "NumLock",
    "ScrollLock"
  ]);

  // src/styles/controller-css-defaults.js
  var DEFAULT_CONTROLLER_CSS = `/* === Domain-based rules (stable \u2014 hostname only) === */

/* Facebook */
:root[style*='--vsc-domain: "facebook.com"'] vsc-controller {
  position: relative;
  top: 40px;
}

/* Google Photos \u2014 inline preview */
:root[style*='--vsc-domain: "photos.google.com"'] vsc-controller {
  position: relative;
  top: 35px;
}

/* Google Photos \u2014 full-screen view */
:root[style*='--vsc-domain: "photos.google.com"'] #player .house-brand vsc-controller {
  top: 50px;
}

/* Netflix */
:root[style*='--vsc-domain: "netflix.com"'] vsc-controller {
  position: relative;
  top: 85px;
}

/* Google Drive \u2014 shift native controls overlay down to expose video */
:root[style*='--vsc-domain: "drive.google.com"'] section[role="tabpanel"][aria-label="Video Player"] {
  top: 80px;
}

/* ChatGPT */
:root[style*='--vsc-domain: "chatgpt.com"'] vsc-controller {
  position: relative;
  top: 0px;
  left: 35px;
}

/* === DOM-contextual rules (may break if site changes HTML structure) === */

/* YouTube autohide \u2014 style the light-DOM host instead of relying on the
   deprecated Chromium-only :host-context() shadow selector. Explicit SHOW
   and temporary feedback stop matching this rule; HIDE and no-source remain
   final in the shadow cascade. Domain wrapping prevents unrelated sites from
   paying for or accidentally matching the YouTube-owned ancestor class. */
:root[style*='--vsc-domain: "youtube.com"'] .ytp-autohide vsc-controller:not([data-vsc-visibility="show"]):not(.vsc-show) {
  visibility: hidden !important;
  opacity: 0 !important;
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:root[style*='--vsc-domain: "youtube-nocookie.com"'] .ytp-autohide vsc-controller:not([data-vsc-visibility="show"]):not(.vsc-show) {
  visibility: hidden !important;
  opacity: 0 !important;
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* YouTube \u2014 controller can be inside .html5-video-player (main site via
   youtube-handler) or a sibling of it (edge cases). Both selectors needed;
   :has(> ...) handles the sibling case DOM-order-independently. Domain-
   wrapped (marker on the first selector scopes the whole rule) so the
   :has() probe never evaluates off-YouTube (#1501); the duplicate block
   covers youtube-nocookie.com, the privacy-enhanced embed host serving the
   identical player. */
:root[style*='--vsc-domain: "youtube.com"'] .ytp-hide-info-bar > vsc-controller,
:has(> .ytp-hide-info-bar) > vsc-controller {
  position: relative;
  top: 10px;
}

:root[style*='--vsc-domain: "youtube-nocookie.com"'] .ytp-hide-info-bar > vsc-controller,
:has(> .ytp-hide-info-bar) > vsc-controller {
  position: relative;
  top: 10px;
}

/* YouTube Shorts \u2014 the native 48px play/volume row occupies the regular
   top-left controller position. Keep the controller below that row without
   moving it into the Shorts controls on the right. */
:root[style*='--vsc-domain: "youtube.com"'] #shorts-player > vsc-controller {
  position: relative;
  top: 60px;
}

/* YouTube \u2014 shifts below paid promotion overlay when visible.
   Domain-wrapped so preprocessDomainCSS strips it on non-YouTube pages:
   [style*=...] forces global style invalidation on every style mutation,
   causing multi-second hangs on heavy pages (Gemini, etc). (#1501) */
:root[style*='--vsc-domain: "youtube.com"'] .ytp-hide-info-bar:has(.ytp-paid-content-overlay-link:not([style*="display: none"])) > vsc-controller,
:has(> .ytp-hide-info-bar .ytp-paid-content-overlay-link:not([style*="display: none"])) > vsc-controller {
  top: 40px;
}

/* YouTube embedded player \u2014 title-bar clearance across all insertion
   generations: inside the player (classic), promoted to #player (older
   #player-controls sibling layout), and body-anchored (2026 ytm layout,
   where youtube-handler escapes the #movie_player stacking context and the
   never-cleared ytp-autohide coupling). position:relative keeps the
   deterministic 0,0 inner placeholder (VideoController skips rect math for
   relative hosts). Domain-wrapped so the :has()/#player probes never
   evaluate off-YouTube (#1501); previously the bare #player rule applied a
   60px offset on ANY site with a #player container. The duplicate block
   covers youtube-nocookie.com privacy-enhanced embeds. */
:root[style*='--vsc-domain: "youtube.com"'] .html5-video-player:not(.ytp-hide-info-bar) > vsc-controller,
:has(> .html5-video-player:not(.ytp-hide-info-bar)) > vsc-controller,
#player > vsc-controller,
body:has(> #player-controls) > vsc-controller {
  position: relative;
  top: 60px;
}

:root[style*='--vsc-domain: "youtube-nocookie.com"'] .html5-video-player:not(.ytp-hide-info-bar) > vsc-controller,
:has(> .html5-video-player:not(.ytp-hide-info-bar)) > vsc-controller,
#player > vsc-controller,
body:has(> #player-controls) > vsc-controller {
  position: relative;
  top: 60px;
}

/* OpenAI \u2014 prevent black overlay */
.Shared-Video-player > vsc-controller {
  height: 0 !important;
}

/* Amazon Prime Video \u2014 prevent black overlay */
.dv-player-fullscreen vsc-controller {
  height: 0 !important;
}

/* Google Drive YouTube embed \u2014 no info bar, override embedded player offset.
   Extra :root bumps specificity above .html5-video-player:not(...) rule. */
:root:root[style*='--vsc-domain: "youtube.googleapis.com"'] vsc-controller {
  position: relative;
  top: 0px;
}`;

  // src/utils/constants.js
  window.VSC = window.VSC || {};
  window.VSC.Constants = {};
  if (!window.VSC.Constants.DEFAULT_SETTINGS) {
    const regStrip2 = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
    const regEndsWithFlags2 = /\/(?!.*(.).*\1)[gimsuy]*$/;
    window.VSC.Constants.regStrip = regStrip2;
    window.VSC.Constants.regEndsWithFlags = regEndsWithFlags2;
    window.VSC.Constants.DEFAULT_CONTROLLER_CSS = DEFAULT_CONTROLLER_CSS;
    const DEFAULT_SETTINGS = {
      schemaVersion: 1,
      lastSpeed: 1,
      // default 1x
      enabled: true,
      // default enabled
      rememberSpeed: false,
      // default: false
      exclusiveKeys: false,
      // default: false
      audioBoolean: true,
      // default: true (enable audio controller support)
      startHidden: false,
      // default: false
      controllerOpacity: 0.3,
      // default: 0.3
      controllerButtonSize: 14,
      customCSS: "",
      // user's additional CSS injected alongside the built-in defaults
      keyBindings: PREDEFINED_ACTIONS.map((action) => ({
        action,
        ...DEFAULT_BINDINGS[action],
        predefined: true
      })),
      siteRules: [
        { pattern: "imgur.com", enabled: false, speed: null },
        { pattern: "teams.microsoft.com", enabled: false, speed: null },
        { pattern: "meet.google.com", enabled: false, speed: null }
      ],
      blacklist: `imgur.com
teams.microsoft.com
meet.google.com`.replace(regStrip2, ""),
      defaultLogLevel: 4,
      logLevel: 3
    };
    window.VSC.Constants.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    const formatSpeed = (speed) => speed.toFixed(2);
    window.VSC.Constants.formatSpeed = formatSpeed;
    const LOG_LEVELS = {
      NONE: 1,
      ERROR: 2,
      WARNING: 3,
      INFO: 4,
      DEBUG: 5,
      VERBOSE: 6
    };
    const MESSAGE_TYPES = {
      SET_SPEED: "VSC_SET_SPEED",
      ADJUST_SPEED: "VSC_ADJUST_SPEED",
      RESET_SPEED: "VSC_RESET_SPEED",
      TOGGLE_DISPLAY: "VSC_TOGGLE_DISPLAY",
      TEARDOWN: "VSC_TEARDOWN"
    };
    const SPEED_LIMITS = {
      MIN: 0.07,
      // Video min rate per Chromium source
      MAX: 16
      // Maximum playback speed in Chrome per Chromium source
    };
    const CONTROLLER_SIZE_LIMITS = {
      // Video elements: minimum size before rejecting controller entirely
      VIDEO_MIN_WIDTH: 40,
      VIDEO_MIN_HEIGHT: 40,
      // Audio elements: minimum size before starting controller hidden
      AUDIO_MIN_WIDTH: 20,
      AUDIO_MIN_HEIGHT: 20
    };
    const CUSTOM_ACTIONS_NO_VALUES = ["pause", "muted", "mark", "jump", "display"];
    window.VSC.Constants.LOG_LEVELS = LOG_LEVELS;
    window.VSC.Constants.MESSAGE_TYPES = MESSAGE_TYPES;
    window.VSC.Constants.SPEED_LIMITS = SPEED_LIMITS;
    window.VSC.Constants.CONTROLLER_SIZE_LIMITS = CONTROLLER_SIZE_LIMITS;
    window.VSC.Constants.CUSTOM_ACTIONS_NO_VALUES = CUSTOM_ACTIONS_NO_VALUES;
    window.VSC.Constants.PREDEFINED_CODE_MAP = PREDEFINED_CODE_MAP;
    window.VSC.Constants.KEYCODE_TO_CODE = KEYCODE_TO_CODE;
    window.VSC.Constants.displayKeyFromCode = displayKeyFromCode;
    window.VSC.Constants.BLACKLISTED_CODES = BLACKLISTED_CODES;
    window.VSC.Constants.PREDEFINED_ACTIONS = PREDEFINED_ACTIONS;
  }

  // src/utils/logger.js
  window.VSC = window.VSC || {};
  if (!window.VSC.logger) {
    class Logger {
      constructor() {
        this.verbosity = 3;
        this.defaultLevel = 4;
        this.contextStack = [];
        this._buffer = [];
        this._ready = false;
      }
      /**
       * Set logging verbosity level and flush any buffered messages.
       * Called once config.load() has the user's logLevel preference.
       * @param {number} level - Log level from LOG_LEVELS constants
       */
      setVerbosity(level) {
        this.verbosity = level;
        if (!this._ready) {
          this._ready = true;
          const pending = this._buffer;
          this._buffer = [];
          for (const entry of pending) {
            this._emit(entry.message, entry.level);
          }
        }
      }
      /**
       * Set default logging level
       * @param {number} level - Default level from LOG_LEVELS constants
       */
      setDefaultLevel(level) {
        this.defaultLevel = level;
      }
      /**
       * Generate video/controller context string from context stack
       * @returns {string} Context string like "[V1]" or ""
       * @private
       */
      generateContext() {
        if (this.contextStack.length > 0) {
          return `[${this.contextStack[this.contextStack.length - 1]}] `;
        }
        return "";
      }
      /**
       * Format video element identifier using controller ID
       * @param {HTMLMediaElement} video - Video element
       * @returns {string} Formatted ID like "V1" or "A1"
       * @private
       */
      formatVideoId(video) {
        if (!video) {
          return "V?";
        }
        const isAudio = video.tagName === "AUDIO";
        const prefix = isAudio ? "A" : "V";
        if (video.vsc?.controllerId) {
          return `${prefix}${video.vsc.controllerId}`;
        }
        return `${prefix}?`;
      }
      /**
       * Push context onto stack (for nested operations)
       * @param {string|HTMLMediaElement} context - Context string or video element
       */
      pushContext(context) {
        if (typeof context === "string") {
          this.contextStack.push(context);
        } else if (context && (context.tagName === "VIDEO" || context.tagName === "AUDIO")) {
          this.contextStack.push(this.formatVideoId(context));
        }
      }
      /**
       * Pop context from stack
       */
      popContext() {
        this.contextStack.pop();
      }
      /**
       * Execute function with context
       * @param {string|HTMLMediaElement} context - Context string or video element
       * @param {Function} fn - Function to execute
       * @returns {*} Function result
       */
      withContext(context, fn) {
        this.pushContext(context);
        try {
          return fn();
        } finally {
          this.popContext();
        }
      }
      /**
       * Log a message with specified level
       * @param {string} message - Message to log
       * @param {number} level - Log level (optional, uses default if not specified)
       */
      log(message, level) {
        const logLevel = typeof level === "undefined" ? this.defaultLevel : level;
        if (!this._ready) {
          this._buffer.push({ message, level: logLevel });
          return;
        }
        this._emit(message, logLevel);
      }
      /**
       * Emit a log message to console (only called after verbosity is configured)
       * @param {string} message - Message to log
       * @param {number} logLevel - Resolved log level
       * @private
       */
      _emit(message, logLevel) {
        if (this.verbosity < logLevel) {
          return;
        }
        const LOG_LEVELS = window.VSC.Constants.LOG_LEVELS;
        const context = this.generateContext();
        const contextualMessage = `${context}${message}`;
        switch (logLevel) {
          case LOG_LEVELS.ERROR:
            console.log(`ERROR:${contextualMessage}`);
            break;
          case LOG_LEVELS.WARNING:
            console.log(`WARNING:${contextualMessage}`);
            break;
          case LOG_LEVELS.INFO:
            console.log(`INFO:${contextualMessage}`);
            break;
          case LOG_LEVELS.DEBUG:
            console.log(`DEBUG:${contextualMessage}`);
            break;
          case LOG_LEVELS.VERBOSE:
            console.log(`DEBUG (VERBOSE):${contextualMessage}`);
            console.trace();
            break;
          default:
            console.log(contextualMessage);
        }
      }
      /**
       * Log error message
       * @param {string} message - Error message
       */
      error(message) {
        this.log(message, window.VSC.Constants.LOG_LEVELS.ERROR);
      }
      /**
       * Log warning message
       * @param {string} message - Warning message
       */
      warn(message) {
        this.log(message, window.VSC.Constants.LOG_LEVELS.WARNING);
      }
      /**
       * Log info message
       * @param {string} message - Info message
       */
      info(message) {
        this.log(message, window.VSC.Constants.LOG_LEVELS.INFO);
      }
      /**
       * Log debug message
       * @param {string} message - Debug message
       */
      debug(message) {
        this.log(message, window.VSC.Constants.LOG_LEVELS.DEBUG);
      }
      /**
       * Log verbose debug message with stack trace
       * @param {string} message - Verbose debug message
       */
      verbose(message) {
        this.log(message, window.VSC.Constants.LOG_LEVELS.VERBOSE);
      }
    }
    window.VSC.logger = new Logger();
  }

  // src/utils/debug-helper.js
  window.VSC = window.VSC || {};
  var DebugHelper = class {
    constructor() {
      this.isActive = false;
    }
    /**
     * Enable debug mode with enhanced logging
     */
    enable() {
      this.isActive = true;
      console.log("\u{1F41B} VSC Debug Mode Enabled");
      if (window.VSC.logger && window.VSC.Constants.LOG_LEVELS) {
        window.VSC.logger.setVerbosity(window.VSC.Constants.LOG_LEVELS.DEBUG);
      }
      window.vscDebug = {
        checkMedia: () => this.checkMediaElements(),
        checkControllers: () => this.checkControllers(),
        testPopup: () => this.testPopupCommunication(),
        testBridge: () => this.testPopupMessageBridge(),
        forceShow: () => this.forceShowControllers(),
        forceShowAudio: () => this.forceShowAudioControllers(),
        getVisibility: (element) => this.getElementVisibility(element)
      };
      console.log(
        "\u{1F527} Debug functions available: vscDebug.checkMedia(), vscDebug.checkControllers(), vscDebug.testPopup(), vscDebug.testBridge(), vscDebug.forceShow(), vscDebug.forceShowAudio()"
      );
    }
    /**
     * Check all media elements and their detection status
     */
    checkMediaElements() {
      console.group("\u{1F3B5} Media Elements Analysis");
      const videos = document.querySelectorAll("video");
      const audios = document.querySelectorAll("audio");
      console.log(`Found ${videos.length} video elements, ${audios.length} audio elements`);
      [...videos, ...audios].forEach((media, index) => {
        console.group(`${media.tagName} #${index + 1}`);
        console.log("Element:", media);
        console.log("Connected to DOM:", media.isConnected);
        console.log("Has VSC controller:", !!media.vsc);
        console.log("Current source:", media.currentSrc || media.src || "No source");
        console.log("Ready state:", media.readyState);
        console.log("Paused:", media.paused);
        console.log("Duration:", media.duration);
        const style = window.getComputedStyle(media);
        console.log("Computed styles:", {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          width: style.width,
          height: style.height
        });
        const rect = media.getBoundingClientRect();
        console.log("Bounding rect:", {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          visible: rect.width > 0 && rect.height > 0
        });
        if (window.VSC.MediaElementObserver && window.VSC_controller?.mediaObserver) {
          const observer = window.VSC_controller.mediaObserver;
          console.log("VSC would detect:", observer.isValidMediaElement(media));
          console.log("VSC would start hidden:", observer.shouldStartHidden(media));
        }
        console.groupEnd();
      });
      this.checkShadowDOMMedia();
      console.groupEnd();
    }
    /**
     * Check shadow DOM for hidden media elements
     */
    checkShadowDOMMedia() {
      console.group("\u{1F47B} Shadow DOM Media Check");
      let shadowMediaCount = 0;
      const checkElement = (element) => {
        if (element.shadowRoot) {
          const shadowMedia = element.shadowRoot.querySelectorAll("video, audio");
          if (shadowMedia.length > 0) {
            console.log(`Found ${shadowMedia.length} media elements in shadow DOM of:`, element);
            shadowMediaCount += shadowMedia.length;
            shadowMedia.forEach((media, index) => {
              console.log(`  Shadow media #${index + 1}:`, media);
            });
          }
          element.shadowRoot.querySelectorAll("*").forEach(checkElement);
        }
      };
      document.querySelectorAll("*").forEach(checkElement);
      console.log(`Total shadow DOM media elements: ${shadowMediaCount}`);
      console.groupEnd();
    }
    /**
     * Check all controllers and their visibility status
     */
    checkControllers() {
      console.group("\u{1F3AE} Controllers Analysis");
      const controllers = document.querySelectorAll("vsc-controller");
      console.log(`Found ${controllers.length} VSC controllers`);
      controllers.forEach((controller, index) => {
        console.group(`Controller #${index + 1}`);
        console.log("Element:", controller);
        console.log("Classes:", controller.className);
        const hostStyle = window.getComputedStyle(controller);
        const innerController = controller.shadowRoot?.querySelector("#controller");
        const innerStyle = innerController ? window.getComputedStyle(innerController) : null;
        console.log("Computed styles:", {
          host: {
            display: hostStyle.display,
            visibility: hostStyle.visibility,
            opacity: hostStyle.opacity,
            position: hostStyle.position,
            top: hostStyle.top,
            left: hostStyle.left,
            zIndex: hostStyle.zIndex
          },
          inner: innerStyle ? {
            display: innerStyle.display,
            visibility: innerStyle.visibility,
            opacity: innerStyle.opacity
          } : null
        });
        const isHidden = controller.classList.contains("vsc-hidden");
        const hasNoSource = controller.classList.contains("vsc-nosource");
        const isShow = controller.classList.contains("vsc-show");
        const visibilityOverride = controller.dataset.vscVisibility || "auto";
        console.log("VSC State:", {
          hidden: isHidden,
          noSource: hasNoSource,
          show: isShow,
          visibilityOverride,
          effectivelyVisible: !!innerStyle && innerStyle.display !== "none" && innerStyle.visibility !== "hidden"
        });
        let associatedVideo = null;
        document.querySelectorAll("video, audio").forEach((media) => {
          if (media.vsc && media.vsc.div === controller) {
            associatedVideo = media;
          }
        });
        if (associatedVideo) {
          console.log("Associated media:", associatedVideo);
          console.log("Media visibility would be:", this.getElementVisibility(associatedVideo));
        } else {
          console.log("\u26A0\uFE0F No associated media found");
        }
        console.groupEnd();
      });
      console.groupEnd();
    }
    /**
     * Test popup communication
     */
    testPopupCommunication() {
      console.group("\u{1F4E1} Popup Communication Test");
      if (typeof chrome !== "undefined" && chrome.runtime) {
        console.log("\u2705 Chrome runtime available");
      } else {
        console.log("\u2139\uFE0F Chrome runtime not available (expected in page context)");
      }
      console.log("Testing direct VSC message handling...");
      const videos = document.querySelectorAll("video, audio");
      console.log(`Found ${videos.length} media elements to control`);
      videos.forEach((video, index) => {
        console.log(`Media #${index + 1}:`, {
          element: video,
          hasController: !!video.vsc,
          currentSpeed: video.playbackRate,
          canControl: !video.classList.contains("vsc-cancelled")
        });
      });
      if (window.VSC_controller && window.VSC_controller.actionHandler) {
        console.log("\u2705 Action handler available, testing speed controls...");
        const testSpeed = 1.5;
        console.log(`Testing speed change to ${testSpeed}x`);
        videos.forEach((video, index) => {
          if (video.vsc) {
            console.log(`Applying speed ${testSpeed} to media #${index + 1} via action handler`);
            window.VSC_controller.actionHandler.adjustSpeed(video, testSpeed);
          } else {
            console.log(`Applying speed ${testSpeed} to media #${index + 1} directly`);
            video.playbackRate = testSpeed;
          }
        });
        setTimeout(() => {
          console.log("Resetting speed to 1.0x");
          videos.forEach((video) => {
            if (video.vsc) {
              window.VSC_controller.actionHandler.adjustSpeed(video, 1);
            } else {
              video.playbackRate = 1;
            }
          });
        }, 2e3);
      } else {
        console.log("\u274C Action handler not available");
      }
      console.groupEnd();
    }
    /**
     * Test the complete popup message bridge by simulating the message flow
     */
    testPopupMessageBridge() {
      console.group("\u{1F4E1} Testing Complete Popup Message Bridge");
      const testMessages = [
        { type: "VSC_SET_SPEED", payload: { speed: 1.25 } },
        { type: "VSC_ADJUST_SPEED", payload: { delta: 0.25 } },
        { type: "VSC_RESET_SPEED" }
      ];
      console.log("Testing message bridge by simulating popup messages...");
      testMessages.forEach((message, index) => {
        setTimeout(() => {
          console.log(`\u{1F527} Debug: Simulating popup message ${index + 1}:`, message);
          window.dispatchEvent(
            new CustomEvent("VSC_MESSAGE", {
              detail: message
            })
          );
        }, index * 1500);
      });
      console.log("Messages will be sent with 1.5 second intervals...");
      console.groupEnd();
    }
    /**
     * Force show all controllers for debugging
     */
    forceShowControllers() {
      console.log("\u{1F527} Force showing all controllers");
      const controllers = document.querySelectorAll("vsc-controller");
      controllers.forEach((controller, index) => {
        controller.dataset.vscVisibility = "show";
        controller.classList.remove("vsc-nosource", "vsc-show");
        console.log(`Controller #${index + 1} forced visible`);
      });
      return controllers.length;
    }
    /**
     * Force show audio controllers specifically
     */
    forceShowAudioControllers() {
      console.log("\u{1F50A} Force showing audio controllers");
      const audioElements = document.querySelectorAll("audio");
      let controllersShown = 0;
      audioElements.forEach((audio, index) => {
        if (audio.vsc && audio.vsc.div) {
          const controller = audio.vsc.div;
          controller.dataset.vscVisibility = "show";
          controller.classList.remove("vsc-nosource", "vsc-show");
          console.log(`Audio controller #${index + 1} forced visible`);
          controllersShown++;
        } else {
          console.log(`Audio #${index + 1} has no controller attached`);
        }
      });
      return controllersShown;
    }
    /**
     * Get detailed visibility information for an element
     */
    getElementVisibility(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        connected: element.isConnected,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: rect.width,
        height: rect.height,
        isVisible: element.isConnected && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0
      };
    }
    /**
     * Monitor controller visibility changes
     */
    monitorControllerChanges() {
      console.log("\u{1F440} Starting controller visibility monitoring");
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && (mutation.attributeName === "class" || mutation.attributeName === "style" || mutation.attributeName === "data-vsc-visibility")) {
            const target = mutation.target;
            if (target.tagName === "VSC-CONTROLLER") {
              console.log("\u{1F504} Controller visibility changed:", {
                element: target,
                classes: target.className,
                hidden: target.classList.contains("vsc-hidden"),
                visibilityOverride: target.dataset.vscVisibility || "auto",
                show: target.classList.contains("vsc-show")
              });
            }
          }
        });
      });
      observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class", "style", "data-vsc-visibility"]
      });
      return observer;
    }
  };
  window.VSC.DebugHelper = DebugHelper;
  window.vscDebugHelper = new DebugHelper();

  // src/utils/dom-utils.js
  window.VSC = window.VSC || {};
  window.VSC.DomUtils = {};
  window.VSC.DomUtils.inIframe = function() {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  };
  window.VSC.DomUtils.getShadow = function(parent, maxDepth = 10) {
    const result = [];
    const visited = /* @__PURE__ */ new WeakSet();
    function getChild(element, depth = 0) {
      if (depth > maxDepth || visited.has(element)) {
        return;
      }
      visited.add(element);
      if (element.firstElementChild) {
        let child = element.firstElementChild;
        do {
          result.push(child);
          getChild(child, depth + 1);
          if (child.shadowRoot && depth < maxDepth - 2) {
            result.push(...window.VSC.DomUtils.getShadow(child.shadowRoot, maxDepth - depth));
          }
          child = child.nextElementSibling;
        } while (child);
      }
    }
    getChild(parent);
    return result.flat(Infinity);
  };
  window.VSC.DomUtils.findVideoParent = function(element) {
    let parentElement = element.parentElement;
    while (parentElement.parentNode && parentElement.parentNode.offsetHeight === parentElement.offsetHeight && parentElement.parentNode.offsetWidth === parentElement.offsetWidth) {
      parentElement = parentElement.parentNode;
    }
    return parentElement;
  };
  window.VSC.DomUtils.initializeWhenReady = function(document2, callback) {
    window.VSC.logger.debug("Begin initializeWhenReady");
    const handleWindowLoad = () => {
      callback(window.document);
    };
    window.addEventListener("load", handleWindowLoad, { once: true });
    if (document2) {
      if (document2.readyState === "complete") {
        callback(document2);
      } else {
        const handleReadyStateChange = () => {
          if (document2.readyState === "complete") {
            document2.removeEventListener("readystatechange", handleReadyStateChange);
            callback(document2);
          }
        };
        document2.addEventListener("readystatechange", handleReadyStateChange);
      }
    }
    window.VSC.logger.debug("End initializeWhenReady");
  };
  window.VSC.DomUtils.findMediaElements = function(node, audioEnabled = false) {
    if (!node) {
      return [];
    }
    const mediaElements = [];
    const selector = audioEnabled ? "video,audio" : "video";
    if (node && node.matches && node.matches(selector)) {
      mediaElements.push(node);
    }
    if (node.querySelectorAll) {
      mediaElements.push(...Array.from(node.querySelectorAll(selector)));
    }
    if (node.shadowRoot) {
      mediaElements.push(...window.VSC.DomUtils.findShadowMedia(node.shadowRoot, selector));
    }
    return mediaElements;
  };
  window.VSC.DomUtils.findShadowMedia = function(root, selector) {
    const results = [];
    if (root.shadowRoot) {
      results.push(...window.VSC.DomUtils.findShadowMedia(root.shadowRoot, selector));
    }
    if (root.querySelectorAll) {
      results.push(...Array.from(root.querySelectorAll(selector)));
    }
    if (root.querySelectorAll) {
      const allElements = Array.from(root.querySelectorAll("*"));
      allElements.forEach((element) => {
        if (element.shadowRoot) {
          results.push(...window.VSC.DomUtils.findShadowMedia(element.shadowRoot, selector));
        }
      });
    }
    return results;
  };

  // src/core/arbiter.js
  window.VSC = window.VSC || {};
  var MODES = Object.freeze({
    NO_OPINION: "NO_OPINION",
    // no document-wide authority exists
    HOLDING: "HOLDING",
    // enforce the shared authority for this media element
    REARMABLE: "REARMABLE",
    // one quiet-war lifecycle restoration remains
    SUPPRESSED: "SUPPRESSED"
    // this media surrendered; other media still hold
  });
  var ARBITER_EVENTS = Object.freeze({
    USER_SET: "USER_SET",
    // user acted through VSC UI/shortcuts/popup
    TEMPORARY_OVERRIDE_START: "TEMPORARY_OVERRIDE_START",
    // site-specific native hold began
    TEMPORARY_OVERRIDE_END: "TEMPORARY_OVERRIDE_END",
    // native hold released
    EXT_RATE: "EXT_RATE",
    // external ratechange, already classified
    LIFECYCLE: "LIFECYCLE",
    // play / seeked / deferred loadedmetadata
    FIGHT_WINDOW_EXPIRE: "FIGHT_WINDOW_EXPIRE"
    // quiet period elapsed
  });
  var RATE_CLASSES = Object.freeze({
    USER_INTENT: "USER_INTENT",
    // native site controls driven by the user
    AUTONOMOUS: "AUTONOMOUS",
    // site acted on its own
    INIT_NOISE: "INIT_NOISE"
    // player initialization churn
  });
  var ARBITER_EFFECTS = Object.freeze({
    WRITE: "WRITE",
    // set one video.playbackRate
    PERSIST: "PERSIST",
    // claim shared session authority
    SYNC_UI: "SYNC_UI"
    // update one controller's speed indicator only
  });
  var DEFAULT_MAX_FIGHT = 4;
  var DEFAULT_REARM_BUDGET = 1;
  function loadState(init) {
    const { siteRuleSpeed = null, rememberedSpeed = null, rememberEnabled = false } = init || {};
    if (siteRuleSpeed !== null && siteRuleSpeed !== void 0) {
      return makeState(MODES.HOLDING, siteRuleSpeed, 0);
    }
    if (rememberEnabled && rememberedSpeed !== null && rememberedSpeed !== void 0) {
      return makeState(MODES.HOLDING, rememberedSpeed, 0);
    }
    return makeState(MODES.NO_OPINION, null, 0);
  }
  function makeState(mode, desired, fightCount, warQuiet, rearmBudget, temporaryOverride = false) {
    return Object.freeze({
      mode,
      desired,
      fightCount,
      warQuiet: warQuiet ?? true,
      rearmBudget: rearmBudget ?? DEFAULT_REARM_BUDGET,
      // A native temporary override is orthogonal to the underlying conflict
      // phase: ending it must not silently re-arm or unsuppress a local war.
      temporaryOverride
    });
  }
  function effect(type, speed) {
    return Object.freeze({ type, speed });
  }
  function step(state, event, options = {}) {
    const maxFight = options.maxFight ?? DEFAULT_MAX_FIGHT;
    switch (event.type) {
      case ARBITER_EVENTS.USER_SET:
        return {
          state: makeState(MODES.HOLDING, event.speed, 0, true, DEFAULT_REARM_BUDGET),
          effects: [
            effect(ARBITER_EFFECTS.WRITE, event.speed),
            effect(ARBITER_EFFECTS.PERSIST, event.speed),
            effect(ARBITER_EFFECTS.SYNC_UI, event.speed)
          ]
        };
      case ARBITER_EVENTS.TEMPORARY_OVERRIDE_START:
        if (state.mode === MODES.NO_OPINION || state.desired === null) {
          return { state, effects: [effect(ARBITER_EFFECTS.SYNC_UI, event.speed)] };
        }
        return {
          state: makeState(
            state.mode,
            state.desired,
            state.fightCount,
            state.warQuiet,
            state.rearmBudget,
            true
          ),
          effects: [effect(ARBITER_EFFECTS.SYNC_UI, event.speed)]
        };
      case ARBITER_EVENTS.TEMPORARY_OVERRIDE_END: {
        const next = makeState(
          state.mode,
          state.desired,
          state.fightCount,
          state.warQuiet,
          state.rearmBudget
        );
        if (next.mode === MODES.HOLDING && next.desired !== null) {
          const effects = [];
          if (event.speed !== next.desired) {
            effects.push(effect(ARBITER_EFFECTS.WRITE, next.desired));
          }
          effects.push(effect(ARBITER_EFFECTS.SYNC_UI, next.desired));
          return { state: next, effects };
        }
        return { state: next, effects: [effect(ARBITER_EFFECTS.SYNC_UI, event.speed)] };
      }
      case ARBITER_EVENTS.LIFECYCLE:
        if (state.temporaryOverride) {
          return { state, effects: [] };
        }
        if (state.mode === MODES.HOLDING) {
          return { state, effects: [effect(ARBITER_EFFECTS.WRITE, state.desired)] };
        }
        if (state.mode === MODES.REARMABLE) {
          return {
            state: makeState(MODES.HOLDING, state.desired, 0, true, state.rearmBudget),
            effects: [effect(ARBITER_EFFECTS.WRITE, state.desired)]
          };
        }
        return { state, effects: [] };
      case ARBITER_EVENTS.EXT_RATE: {
        const rate = event.speed;
        const activeState = state.temporaryOverride ? makeState(state.mode, state.desired, state.fightCount, state.warQuiet, state.rearmBudget) : state;
        switch (event.rateClass) {
          case RATE_CLASSES.INIT_NOISE:
            return { state: activeState, effects: [] };
          case RATE_CLASSES.USER_INTENT:
            return {
              state: makeState(MODES.HOLDING, rate, 0, true, DEFAULT_REARM_BUDGET),
              effects: [effect(ARBITER_EFFECTS.PERSIST, rate), effect(ARBITER_EFFECTS.SYNC_UI, rate)]
            };
          case RATE_CLASSES.AUTONOMOUS:
            if (activeState.mode === MODES.HOLDING && rate !== activeState.desired) {
              if (activeState.fightCount < maxFight) {
                const warQuiet = activeState.fightCount === 0 ? !!event.quiet : activeState.warQuiet && !!event.quiet;
                return {
                  state: makeState(
                    MODES.HOLDING,
                    activeState.desired,
                    activeState.fightCount + 1,
                    warQuiet,
                    activeState.rearmBudget
                  ),
                  effects: [effect(ARBITER_EFFECTS.WRITE, activeState.desired)]
                };
              }
              const fullyQuiet = activeState.warQuiet && !!event.quiet;
              const nextMode = fullyQuiet && activeState.rearmBudget > 0 ? MODES.REARMABLE : MODES.SUPPRESSED;
              const nextBudget = nextMode === MODES.REARMABLE ? activeState.rearmBudget - 1 : activeState.rearmBudget;
              return {
                state: makeState(nextMode, activeState.desired, 0, true, nextBudget),
                effects: [effect(ARBITER_EFFECTS.SYNC_UI, rate)]
              };
            }
            return { state: activeState, effects: [effect(ARBITER_EFFECTS.SYNC_UI, rate)] };
          default:
            throw new TypeError(`SpeedArbiter: unknown rate class ${event.rateClass}`);
        }
      }
      case ARBITER_EVENTS.FIGHT_WINDOW_EXPIRE:
        if (state.fightCount === 0) {
          return { state, effects: [] };
        }
        return {
          state: makeState(
            state.mode,
            state.desired,
            0,
            true,
            state.rearmBudget,
            state.temporaryOverride
          ),
          effects: []
        };
      default:
        throw new TypeError(`SpeedArbiter: unknown event type ${event.type}`);
    }
  }
  window.VSC.SpeedArbiter = {
    MODES,
    EVENTS: ARBITER_EVENTS,
    RATE_CLASSES,
    EFFECTS: ARBITER_EFFECTS,
    DEFAULT_MAX_FIGHT,
    DEFAULT_REARM_BUDGET,
    loadState,
    step
  };

  // src/core/intent-classifier.js
  window.VSC = window.VSC || {};
  var CLASSIFIER_VERDICTS = Object.freeze({
    SELF: "SELF",
    // our own write echoing back — filtered before the arbiter
    USER_INTENT: "USER_INTENT",
    // Site-specific temporary interaction: allows a native hold without
    // claiming shared desired speed or persistent authority.
    TEMPORARY_OVERRIDE: "TEMPORARY_OVERRIDE",
    AUTONOMOUS: "AUTONOMOUS",
    INIT_NOISE: "INIT_NOISE"
  });
  var TARGET_RULES = Object.freeze({
    // Only native speed shortcuts arm strong key intent (PR #1563); clicks
    // always feed the sequence detector. Site handlers declare per-site
    // activations through getClassifierRules() (e.g. YouTube's hold-for-2x,
    // #1554); this module owns what each flag means, never which host gets it.
    pointerHoldArms: false
  });
  var USER_GESTURE_WINDOW_MS = 300;
  var CLICK_SEQUENCE_WINDOW_MS = 5e3;
  var NORMAL_RATE_EPSILON = 5e-3;
  var SEEK_RESET_WINDOW_MS = 1e3;
  var MEDIA_INIT_GRACE_MS = 2e3;
  var TEMPORARY_HOLD_RATE = 2;
  var TEMPORARY_HOLD_RATE_EPSILON = 0.01;
  var QUIET_CONTEXT_MS = 5e3;
  var LONG_PRESS_CLICK_MS = 400;
  var LONG_PRESS_CLICK_GRACE_MS = 150;
  var UNRESOLVED_BIND_MAX_AGE_MS = 5e3;
  function isNativeSpeedShortcutKey(event) {
    return event.key === "<" || event.key === ">" || (event.code === "Comma" || event.keyCode === 188) && event.shiftKey || (event.code === "Period" || event.keyCode === 190) && event.shiftKey;
  }
  var IntentClassifier = class {
    constructor(options = {}) {
      this.rules = options.rules || TARGET_RULES;
      this.minRate = options.minRate ?? 0.07;
      this.lastGestureAt = 0;
      this.lastClickAt = 0;
      this.prevClickAt = 0;
      this.clicksByMedia = /* @__PURE__ */ new WeakMap();
      this.lastInputAt = 0;
      this.activePointerIds = /* @__PURE__ */ new Set();
      this.activePointersByMedia = /* @__PURE__ */ new WeakMap();
      this.pointerOwners = /* @__PURE__ */ new Map();
      this.spaceHoldActive = false;
      this.spaceHoldMedia = null;
      this.longPressEndAt = 0;
      this.seeksByMedia = /* @__PURE__ */ new WeakMap();
      this.mediaInitByMedia = /* @__PURE__ */ new WeakMap();
    }
    /** Any user input at all — presence evidence only, never intent. */
    observeInput(event) {
      this.lastInputAt = event.timeStamp;
    }
    /** A keydown no VSC binding handled. */
    observeUnhandledKey(event) {
      this.lastInputAt = event.timeStamp;
      const isSpace = event.code === "Space" || event.keyCode === 32;
      if (isNativeSpeedShortcutKey(event)) {
        this.lastGestureAt = event.timeStamp;
      }
      if (this.rules.spacebarArms && isSpace) {
        this.spaceHoldActive = true;
        this.spaceHoldMedia ||= this.soleActivePointerMedia();
      }
    }
    /**
     * Retire the temporary Space-hold signature and return the media it had
     * already been bound to by a 2x ratechange, if any.
     * @param {KeyboardEvent} event
     * @returns {HTMLMediaElement|null}
     */
    observeKeyEnd(event) {
      this.lastInputAt = event.timeStamp;
      const isSpace = event.code === "Space" || event.keyCode === 32;
      if (!this.rules.spacebarArms || !isSpace || !this.spaceHoldActive) {
        return null;
      }
      const media = this.spaceHoldMedia;
      this.spaceHoldActive = false;
      this.spaceHoldMedia = null;
      return media && !this.hasActiveTemporaryHoldFor(media, event.timeStamp) ? media : null;
    }
    /**
     * Record a page click. A resolved media key is negative-only attribution:
     * it can bless that media but is intentionally absent from every other
     * media's evidence. Unresolved clicks retain the legacy fallback scope.
     * @param {Event} event
     * @param {HTMLMediaElement|null} media
     */
    observeClick(event, media = null) {
      this.lastInputAt = event.timeStamp;
      const sinceLongPress = event.timeStamp - this.longPressEndAt;
      if (this.longPressEndAt > 0 && sinceLongPress >= 0 && sinceLongPress < LONG_PRESS_CLICK_GRACE_MS) {
        return;
      }
      const ledger = media ? this.getClickLedger(media) : this;
      ledger.prevClickAt = ledger.lastClickAt;
      ledger.lastClickAt = event.timeStamp;
    }
    /**
     * A seek began or completed on this media. Negative evidence only: it can
     * demote a following 1.0 adoption to AUTONOMOUS, never bless anything.
     * Recorded at `seeking` because reactive sites reset the rate before the
     * seek completes; refreshed at `seeked` so slow network seeks stay covered.
     * @param {HTMLMediaElement} media
     * @param {number} timeStamp
     */
    observeSeek(media, timeStamp) {
      if (media) {
        this.seeksByMedia.set(media, timeStamp);
      }
    }
    /**
     * This media entered a (re)initialization moment: attach-time restore,
     * deferred loadedmetadata restore, or a `loadstart` resource boundary on a
     * reused element. Negative evidence only, same shape as observeSeek;
     * ordinary MSE representation switches need not emit `loadstart`.
     * @param {HTMLMediaElement} media
     * @param {number} timeStamp
     */
    observeMediaInit(media, timeStamp) {
      if (media) {
        this.mediaInitByMedia.set(media, timeStamp);
      }
    }
    /**
     * @param {HTMLMediaElement} media
     * @returns {{lastClickAt: number, prevClickAt: number}}
     * @private
     */
    getClickLedger(media) {
      let ledger = this.clicksByMedia.get(media);
      if (!ledger) {
        ledger = { lastClickAt: 0, prevClickAt: 0 };
        this.clicksByMedia.set(media, ledger);
      }
      return ledger;
    }
    /**
     * Pointer pressed outside the VSC controller (PR #1555).
     * @param {PointerEvent} event
     * @param {HTMLMediaElement|null} media
     */
    observePointerDown(event, media = null) {
      this.lastInputAt = event.timeStamp;
      if (!this.rules.pointerHoldArms || !Number.isInteger(event.pointerId)) {
        return;
      }
      this.removePointer(event.pointerId);
      const owner = media || (this.spaceHoldActive ? this.spaceHoldMedia : null);
      if (owner) {
        this.getPointerLedger(owner).add(event.pointerId);
      } else {
        this.activePointerIds.add(event.pointerId);
      }
      this.pointerOwners.set(event.pointerId, { media: owner, downAt: event.timeStamp });
    }
    /**
     * Retire a pointer hold on a physical terminal event and return its media
     * owner when the earlier 2x observation resolved one. A `click` cannot do
     * this safely: it carries no pointer ID and could clear a concurrent hold.
     * @param {PointerEvent} event
     * @returns {HTMLMediaElement[]}
     */
    observePointerEnd(event) {
      this.lastInputAt = event.timeStamp;
      if (!this.rules.pointerHoldArms) {
        return [];
      }
      if (!Number.isInteger(event.pointerId)) {
        return this.clearPointerHolds();
      }
      const entry = this.pointerOwners.get(event.pointerId) || null;
      if (entry && event.timeStamp - entry.downAt >= LONG_PRESS_CLICK_MS) {
        this.longPressEndAt = event.timeStamp;
      }
      this.removePointer(event.pointerId);
      const media = entry?.media || null;
      return media && !this.hasActiveTemporaryHoldFor(media, event.timeStamp) ? [media] : [];
    }
    /** @param {HTMLMediaElement} media @returns {Set<number>} @private */
    getPointerLedger(media) {
      let ledger = this.activePointersByMedia.get(media);
      if (!ledger) {
        ledger = /* @__PURE__ */ new Set();
        this.activePointersByMedia.set(media, ledger);
      }
      return ledger;
    }
    /** @param {number} pointerId @private */
    removePointer(pointerId) {
      const entry = this.pointerOwners.get(pointerId);
      if (!entry) {
        this.activePointerIds.delete(pointerId);
        return;
      }
      if (entry.media) {
        this.activePointersByMedia.get(entry.media)?.delete(pointerId);
      } else {
        this.activePointerIds.delete(pointerId);
      }
      this.pointerOwners.delete(pointerId);
    }
    /**
     * Clear active pointer evidence without treating focus loss as input.
     * @returns {HTMLMediaElement[]} media that may have a temporary override
     */
    clearPointerHolds() {
      const media = /* @__PURE__ */ new Set();
      this.activePointerIds.clear();
      for (const entry of this.pointerOwners.values()) {
        if (entry.media) {
          media.add(entry.media);
          this.activePointersByMedia.get(entry.media)?.clear();
        }
      }
      this.pointerOwners.clear();
      return [...media];
    }
    /**
     * Clear pointer and Space hold evidence for browser lifecycle loss.
     * @returns {HTMLMediaElement[]} media that may have a temporary override
     */
    clearTemporaryHolds() {
      const media = new Set(this.clearPointerHolds());
      if (this.spaceHoldMedia) {
        media.add(this.spaceHoldMedia);
      }
      this.spaceHoldActive = false;
      this.spaceHoldMedia = null;
      return [...media];
    }
    /**
     * Return a pointer media owner only when every active pointer belongs to
     * that one resolved media. This is safe to use for temporary-source
     * bookkeeping; ambiguous pointers remain unresolved.
     * @returns {HTMLMediaElement|null}
     * @private
     */
    soleActivePointerMedia() {
      let media = null;
      for (const entry of this.pointerOwners.values()) {
        if (!entry.media || media && entry.media !== media) {
          return null;
        }
        media = entry.media;
      }
      return media;
    }
    /**
     * Resolve one active pointer for a ratechange target. An unresolved
     * pointer becomes media-scoped when that media actually receives the
     * recognized 2x change. When several unresolved pointers exist (for
     * example a stale ID whose pointerup was released outside the window),
     * bind the most recent press: it is the one that plausibly triggered the
     * hold, and requiring exactly one unresolved ID silently disabled
     * recognition for the entire session.
     * @param {HTMLMediaElement|null|undefined} media
     * @returns {number|null}
     * @private
     */
    activePointerFor(media, timeStamp) {
      if (!media) {
        return null;
      }
      const scoped = this.activePointersByMedia.get(media);
      if (scoped?.size) {
        return scoped.values().next().value;
      }
      let pointerId = null;
      let newest = -Infinity;
      for (const id of this.activePointerIds) {
        const downAt = this.pointerOwners.get(id)?.downAt ?? 0;
        if (this.isStaleUnresolvedPress(downAt, timeStamp)) {
          continue;
        }
        if (downAt >= newest) {
          newest = downAt;
          pointerId = id;
        }
      }
      if (pointerId === null) {
        return null;
      }
      this.activePointerIds.delete(pointerId);
      this.getPointerLedger(media).add(pointerId);
      const entry = this.pointerOwners.get(pointerId);
      if (entry) {
        entry.media = media;
      } else {
        this.pointerOwners.set(pointerId, { media, downAt: 0 });
      }
      return pointerId;
    }
    /**
     * @param {number} downAt
     * @param {number|undefined} timeStamp
     * @returns {boolean}
     * @private
     */
    isStaleUnresolvedPress(downAt, timeStamp) {
      const age = timeStamp - downAt;
      return Number.isFinite(age) && age > UNRESOLVED_BIND_MAX_AGE_MS;
    }
    /**
     * Whether a resolved media still has a physically active temporary-hold
     * source. An unresolved pointer/Space hold is treated conservatively: it
     * might belong to this media, so another pointer's terminal event must not
     * cancel a visible native hold before its own release arrives.
     * @param {HTMLMediaElement|null} media
     * @returns {boolean}
     */
    hasActiveTemporaryHoldFor(media, timeStamp) {
      if (!media) {
        return false;
      }
      if ((this.activePointersByMedia.get(media)?.size ?? 0) > 0 || this.spaceHoldActive && (!this.spaceHoldMedia || this.spaceHoldMedia === media)) {
        return true;
      }
      for (const id of this.activePointerIds) {
        if (!this.isStaleUnresolvedPress(this.pointerOwners.get(id)?.downAt ?? 0, timeStamp)) {
          return true;
        }
      }
      return false;
    }
    /**
     * The only temporary native signature currently supported is YouTube's
     * documented held-pointer/Space 2x boost. It is deliberately narrower than
     * generic user intent so native menu choices and speed shortcuts stay durable.
     * @param {Object} ctx
     * @returns {boolean}
     * @private
     */
    isTemporaryOverride(ctx) {
      if (typeof ctx.rate !== "number" || Math.abs(ctx.rate - TEMPORARY_HOLD_RATE) > TEMPORARY_HOLD_RATE_EPSILON) {
        return false;
      }
      if (this.rules.pointerHoldArms && this.activePointerFor(ctx.media, ctx.timeStamp) !== null) {
        if (this.spaceHoldActive && !this.spaceHoldMedia) {
          this.spaceHoldMedia = ctx.media || null;
        }
        return true;
      }
      if (this.rules.spacebarArms && this.spaceHoldActive && (!this.spaceHoldMedia || this.spaceHoldMedia === ctx.media)) {
        this.spaceHoldMedia = ctx.media || null;
        return true;
      }
      if (this.rules.pointerHoldArms || this.rules.spacebarArms) {
        window.VSC.logger?.debug(
          `Hold-rate ${ctx.rate} without hold evidence: scoped=${ctx.media ? this.activePointersByMedia.get(ctx.media)?.size ?? 0 : "n/a"} unresolved=${this.activePointerIds.size} owners=${this.pointerOwners.size} space=${this.spaceHoldActive}`
        );
      }
      return false;
    }
    /**
     * Compute durable user-intent evidence without consuming temporary-hold
     * state. A strong native choice must outrank a concurrent hold signature:
     * users can deliberately select 2x while a pointer remains down.
     * @param {Object} ctx - { media?, timeStamp }
     * @returns {{clickInWindow: boolean, strong: boolean}}
     * @private
     */
    intentEvidence(ctx) {
      const withinWindow = (ts) => ts > 0 && ctx.timeStamp - ts >= 0 && ctx.timeStamp - ts < USER_GESTURE_WINDOW_MS;
      const ledgers = [this];
      const mediaLedger = ctx.media ? this.clicksByMedia.get(ctx.media) : null;
      if (mediaLedger) {
        ledgers.push(mediaLedger);
      }
      const clickInWindow = ledgers.some((ledger) => withinWindow(ledger.lastClickAt));
      const clickSequence = ledgers.some(
        (ledger) => withinWindow(ledger.lastClickAt) && ledger.prevClickAt > 0 && ledger.lastClickAt - ledger.prevClickAt <= CLICK_SEQUENCE_WINDOW_MS
      );
      const keyIntent = withinWindow(this.lastGestureAt);
      return {
        clickInWindow,
        keyIntent,
        strong: keyIntent || clickSequence
      };
    }
    /**
     * Whether a reset to exactly 1.0 is explained by the media's own recent
     * behavior. Two chrome clicks plus a 1.0 ratechange inside the gesture
     * window is the exact shape of BOTH a native menu "Normal" choice and a
     * click-side-effect reset (skip/seek controls, player init) — the click
     * evidence cannot tell them apart, but menu selection neither seeks nor
     * re-initializes. Demotion is the recoverable direction under the arbiter
     * contract: a wrongly demoted menu choice costs one fight/re-click, while
     * a wrong adoption persists 1.0 over the remembered speed.
     * @param {Object} ctx - { media?, timeStamp }
     * @returns {boolean}
     * @private
     */
    isSideEffectNormalReset(ctx) {
      if (!ctx.media) {
        return false;
      }
      if (ctx.media.seeking) {
        return true;
      }
      const within = (ts, windowMs) => typeof ts === "number" && ctx.timeStamp - ts >= 0 && ctx.timeStamp - ts < windowMs;
      return within(this.seeksByMedia.get(ctx.media), SEEK_RESET_WINDOW_MS) || within(this.mediaInitByMedia.get(ctx.media), MEDIA_INIT_GRACE_MS);
    }
    /**
     * Whether a ratechange has durable, strong evidence that can supersede an
     * active local temporary override. Weak click evidence stays deliberately
     * below the hold signature so a native release cannot persist a reset.
     * @param {Object} ctx - { media?, timeStamp }
     * @returns {boolean}
     */
    hasStrongIntent(ctx) {
      return this.intentEvidence(ctx).strong;
    }
    /**
     * Classify an external ratechange. Mirrors the guard order of the legacy
     * handleRateChange so differential replay is faithful.
     *
     * @param {Object} ctx - { media?, rate, timeStamp, readyState, detail }
     * @returns {string} one of CLASSIFIER_VERDICTS
     */
    classify(ctx) {
      if (ctx.detail && ctx.detail.origin === "videoSpeed") {
        return CLASSIFIER_VERDICTS.SELF;
      }
      if (ctx.readyState < 1) {
        return CLASSIFIER_VERDICTS.INIT_NOISE;
      }
      if (typeof ctx.rate === "number" && !isNaN(ctx.rate) && ctx.rate <= this.minRate) {
        return CLASSIFIER_VERDICTS.INIT_NOISE;
      }
      const { clickInWindow, keyIntent, strong } = this.intentEvidence(ctx);
      const isNormalReset = Math.abs(ctx.rate - 1) < NORMAL_RATE_EPSILON;
      if (strong) {
        if (isNormalReset && !keyIntent && this.isSideEffectNormalReset(ctx)) {
          return CLASSIFIER_VERDICTS.AUTONOMOUS;
        }
        return CLASSIFIER_VERDICTS.USER_INTENT;
      }
      if (this.isTemporaryOverride(ctx)) {
        return CLASSIFIER_VERDICTS.TEMPORARY_OVERRIDE;
      }
      if (clickInWindow && !isNormalReset) {
        return CLASSIFIER_VERDICTS.USER_INTENT;
      }
      return CLASSIFIER_VERDICTS.AUTONOMOUS;
    }
    /**
     * Quiet context: no user input observed for QUIET_CONTEXT_MS before the
     * given moment (or ever). Used by the adapter as the war-context signal
     * for the cell 9/9b quiet-war re-arm split.
     * @param {number} timeStamp - the ratechange's timeStamp
     * @returns {boolean}
     */
    isQuietContext(timeStamp) {
      return this.lastInputAt === 0 || timeStamp - this.lastInputAt >= QUIET_CONTEXT_MS;
    }
    /**
     * Clear temporary-hold evidence owned by one resolved media element. Do not
     * clear unresolved or other-media evidence: a durable choice on B cannot
     * erase an active temporary hold on A.
     * @param {HTMLMediaElement} media
     */
    clearTemporaryHoldsForMedia(media) {
      const ownedPointers = [];
      for (const [pointerId, owner] of this.pointerOwners) {
        if (owner === media) {
          ownedPointers.push(pointerId);
        }
      }
      for (const pointerId of ownedPointers) {
        this.removePointer(pointerId);
      }
      this.activePointersByMedia.delete(media);
      if (this.spaceHoldMedia === media) {
        this.spaceHoldActive = false;
        this.spaceHoldMedia = null;
      }
    }
    /**
     * One-shot semantics: called by the adapter when a USER_INTENT verdict was
     * actually adopted, mirroring legacy's lastUserInteractionAt = 0 reset in
     * the accept branch.
     */
    consumeGesture(media = null) {
      this.lastGestureAt = 0;
      this.lastClickAt = 0;
      this.prevClickAt = 0;
      if (media) {
        this.clicksByMedia.delete(media);
        this.clearTemporaryHoldsForMedia(media);
      } else {
        this.clearTemporaryHolds();
      }
    }
    /** Release short-lived evidence attached to a removed media element. */
    releaseMedia(media) {
      this.clicksByMedia.delete(media);
      this.seeksByMedia.delete(media);
      this.mediaInitByMedia.delete(media);
      for (const [pointerId, entry] of this.pointerOwners) {
        if (entry.media === media) {
          this.removePointer(pointerId);
        }
      }
      this.activePointersByMedia.delete(media);
      if (this.spaceHoldMedia === media) {
        this.spaceHoldActive = false;
        this.spaceHoldMedia = null;
      }
    }
    /** Reset all document-scoped evidence during extension teardown. */
    reset() {
      this.lastGestureAt = 0;
      this.lastClickAt = 0;
      this.prevClickAt = 0;
      this.lastInputAt = 0;
      this.longPressEndAt = 0;
      this.clearTemporaryHolds();
      this.clicksByMedia = /* @__PURE__ */ new WeakMap();
      this.activePointersByMedia = /* @__PURE__ */ new WeakMap();
      this.seeksByMedia = /* @__PURE__ */ new WeakMap();
      this.mediaInitByMedia = /* @__PURE__ */ new WeakMap();
    }
  };
  window.VSC.IntentClassifier = IntentClassifier;
  window.VSC.IntentClassifier.VERDICTS = CLASSIFIER_VERDICTS;
  window.VSC.IntentClassifier.TARGET_RULES = TARGET_RULES;
  window.VSC.IntentClassifier.USER_GESTURE_WINDOW_MS = USER_GESTURE_WINDOW_MS;
  window.VSC.IntentClassifier.CLICK_SEQUENCE_WINDOW_MS = CLICK_SEQUENCE_WINDOW_MS;
  window.VSC.IntentClassifier.SEEK_RESET_WINDOW_MS = SEEK_RESET_WINDOW_MS;
  window.VSC.IntentClassifier.MEDIA_INIT_GRACE_MS = MEDIA_INIT_GRACE_MS;
  window.VSC.IntentClassifier.QUIET_CONTEXT_MS = QUIET_CONTEXT_MS;
  window.VSC.IntentClassifier.TEMPORARY_HOLD_RATE = TEMPORARY_HOLD_RATE;
  window.VSC.IntentClassifier.LONG_PRESS_CLICK_MS = LONG_PRESS_CLICK_MS;
  window.VSC.IntentClassifier.LONG_PRESS_CLICK_GRACE_MS = LONG_PRESS_CLICK_GRACE_MS;
  window.VSC.IntentClassifier.UNRESOLVED_BIND_MAX_AGE_MS = UNRESOLVED_BIND_MAX_AGE_MS;
  window.VSC.IntentClassifier.isNativeSpeedShortcutKey = isNativeSpeedShortcutKey;

  // src/core/speed-arbitration.js
  window.VSC = window.VSC || {};
  var SpeedArbitration = class _SpeedArbitration {
    /**
     * @param {Object} config
     * @param {Object|null} eventManager
     */
    constructor(config, eventManager) {
      this.config = config;
      this.eventManager = eventManager;
      this.classifier = new window.VSC.IntentClassifier({
        // Site handlers declare evidence-rule activations (getClassifierRules);
        // the classifier owns what each flag means. Late-bound through the
        // namespace like resolveGestureMedia: handler detection is lazy and
        // static (matches() on location.hostname), so construction order is
        // irrelevant and non-handler contexts fall back to generic rules.
        rules: Object.freeze({
          ...window.VSC.IntentClassifier.TARGET_RULES,
          ...window.VSC.siteHandlerManager?.getClassifierRules?.() || {}
        }),
        minRate: window.VSC.Constants.SPEED_LIMITS.MIN
      });
      this.authorityEpoch = 0;
      this.conflicts = /* @__PURE__ */ new WeakMap();
      this.timedConflicts = /* @__PURE__ */ new Set();
      this.pendingWrites = /* @__PURE__ */ new WeakMap();
      this.echoTransactions = /* @__PURE__ */ new Map();
      this.temporaryReleaseTimers = /* @__PURE__ */ new WeakMap();
      this.pendingTemporaryReleaseTimers = /* @__PURE__ */ new Set();
    }
    /**
     * Record an extension-issued register write for the media-local echo filter.
     * A causally proven feedback-loop retry may hide its echo from page listeners;
     * ordinary writes remain observable.
     * @param {HTMLMediaElement} video
     * @param {number} rate
     * @param {{suppressPropagation?: boolean}} [options]
     */
    noteWrite(video, rate, { suppressPropagation = false } = {}) {
      let queue = this.pendingWrites.get(video);
      if (!queue) {
        queue = [];
        this.pendingWrites.set(video, queue);
      }
      queue.push({
        rate,
        at: performance.now(),
        epoch: this.authorityEpoch,
        suppressPropagation
      });
      if (queue.length > _SpeedArbitration.ECHO_MAX_PENDING) {
        queue.shift();
      }
    }
    /**
     * Consume a matching extension write token.
     * @param {HTMLMediaElement} video
     * @param {number} rate
     * @returns {{rate: number, at: number, epoch: number, suppressPropagation: boolean}|false}
     */
    consumeEcho(video, rate) {
      let queue = this.pendingWrites.get(video);
      if (!queue || queue.length === 0) {
        return false;
      }
      const now = performance.now();
      queue = queue.filter(
        (write) => write.epoch === this.authorityEpoch && now - write.at <= _SpeedArbitration.ECHO_TTL_MS
      );
      if (queue.length === 0) {
        this.pendingWrites.delete(video);
        return false;
      }
      this.pendingWrites.set(video, queue);
      const idx = queue.findIndex(
        (write) => Math.abs(write.rate - rate) <= _SpeedArbitration.ECHO_TOLERANCE
      );
      if (idx === -1) {
        const visibleWrites = queue.filter((write) => !write.suppressPropagation);
        if (visibleWrites.length === 0) {
          this.pendingWrites.delete(video);
        } else {
          this.pendingWrites.set(video, visibleWrites);
        }
        return false;
      }
      const echo = queue[idx];
      queue.splice(0, idx + 1);
      return echo;
    }
    /**
     * Follow an ordinary VSC echo to the media target, after page listeners that
     * were registered before this dispatch. If they rewrite the register, retain
     * one transaction until the browser delivers that setter's counter-event.
     * @param {HTMLMediaElement} video
     * @param {Event} event
     * @param {{rate: number, epoch: number}} echo
     */
    observePropagatedEcho(video, event, echo) {
      this.clearEchoTransaction(video);
      const transaction = {
        epoch: echo.epoch,
        expectedRate: echo.rate,
        sourceEvent: event,
        observedRate: null,
        listener: null
      };
      transaction.listener = (targetEvent) => {
        if (targetEvent !== transaction.sourceEvent || this.echoTransactions.get(video) !== transaction) {
          return;
        }
        video.removeEventListener("ratechange", transaction.listener);
        transaction.listener = null;
        if (transaction.epoch !== this.authorityEpoch) {
          this.clearEchoTransaction(video);
          return;
        }
        const observedRate = video.playbackRate;
        if (Math.abs(observedRate - transaction.expectedRate) <= _SpeedArbitration.ECHO_TOLERANCE) {
          this.clearEchoTransaction(video);
          return;
        }
        transaction.sourceEvent = null;
        transaction.observedRate = observedRate;
      };
      this.echoTransactions.set(video, transaction);
      video.addEventListener("ratechange", transaction.listener);
    }
    /**
     * @param {HTMLMediaElement} video
     */
    clearEchoTransaction(video) {
      const transaction = this.echoTransactions.get(video);
      if (!transaction) {
        return;
      }
      if (transaction.listener) {
        video.removeEventListener("ratechange", transaction.listener);
      }
      this.echoTransactions.delete(video);
    }
    clearAllEchoTransactions() {
      for (const video of [...this.echoTransactions.keys()]) {
        this.clearEchoTransaction(video);
      }
    }
    /**
     * Resolve causal evidence before generic classification. A nested synthetic
     * event is deferred until the outer echo reaches its target tail; a completed
     * transaction consumes exactly the next same-media external event.
     * @param {HTMLMediaElement} video
     * @param {Event} event
     * @returns {boolean|null} true for a rewrite, null to defer a nested event
     */
    consumeEchoReaction(video, event) {
      const transaction = this.echoTransactions.get(video);
      if (!transaction) {
        return false;
      }
      if (transaction.epoch !== this.authorityEpoch) {
        this.clearEchoTransaction(video);
        return false;
      }
      if (transaction.observedRate === null) {
        const sourceEventActive = transaction.sourceEvent !== event && Number.isFinite(transaction.sourceEvent?.eventPhase) && transaction.sourceEvent.eventPhase !== Event.NONE;
        if (sourceEventActive) {
          return null;
        }
        this.clearEchoTransaction(video);
        return false;
      }
      const rewriteMatches = Math.abs(transaction.observedRate - video.playbackRate) <= _SpeedArbitration.ECHO_TOLERANCE;
      this.clearEchoTransaction(video);
      return rewriteMatches;
    }
    /**
     * Materialize the pure state for one media element from global authority
     * plus that element's local conflict record.
     * @param {HTMLMediaElement} video
     * @returns {{state: Object, conflict: Object|null}}
     * @private
     */
    stateFor(video) {
      const desired = this.config.settings.lastSpeed;
      if (desired === null || desired === void 0) {
        return { state: window.VSC.SpeedArbiter.loadState({}), conflict: null };
      }
      const conflict = this.conflictFor(video);
      return {
        conflict,
        state: {
          mode: conflict.mode,
          desired,
          fightCount: conflict.fightCount,
          warQuiet: conflict.warQuiet,
          rearmBudget: conflict.rearmBudget,
          temporaryOverride: conflict.temporaryOverride
        }
      };
    }
    /**
     * Get a current-epoch local conflict record, lazily invalidating stale
     * records after another media element claims fresh global authority.
     * @param {HTMLMediaElement} video
     * @returns {Object}
     * @private
     */
    conflictFor(video) {
      let conflict = this.conflicts.get(video);
      if (!conflict || conflict.epoch !== this.authorityEpoch) {
        if (conflict) {
          this.clearFightTimer(conflict);
        }
        conflict = {
          epoch: this.authorityEpoch,
          mode: window.VSC.SpeedArbiter.MODES.HOLDING,
          fightCount: 0,
          warQuiet: true,
          rearmBudget: window.VSC.SpeedArbiter.DEFAULT_REARM_BUDGET,
          // A native hold belongs to this media, not the shared authority
          // generation. Preserve it if another video claims fresh authority
          // while this one is still held, so release restores the latest target.
          temporaryOverride: conflict?.temporaryOverride ?? false,
          fightTimer: null
        };
        this.conflicts.set(video, conflict);
      }
      return conflict;
    }
    /**
     * @param {Object|null} conflict
     * @param {Object} state
     * @private
     */
    applyState(conflict, state) {
      if (!conflict) {
        return;
      }
      conflict.mode = state.mode;
      conflict.fightCount = state.fightCount;
      conflict.warQuiet = state.warQuiet;
      conflict.rearmBudget = state.rearmBudget;
      conflict.temporaryOverride = state.temporaryOverride;
    }
    /**
     * Commit shared authority and invalidate all local conflict records lazily.
     * A same-value VSC set still advances the epoch: it is an explicit request
     * to retry locally surrendered players.
     * @param {number} speed
     * @private
     */
    claimAuthority(speed) {
      this.config.persistAuthority(speed);
      this.clearAllEchoTransactions();
      this.authorityEpoch += 1;
      for (const conflict of this.timedConflicts) {
        clearTimeout(conflict.fightTimer);
        conflict.fightTimer = null;
      }
      this.timedConflicts.clear();
    }
    /**
     * USER_SET from VSC UI, shortcuts, wheel, or popup.
     *
     * Bulk commands may touch several controlled media elements. They share one
     * authority generation so a single keyboard/popup gesture cannot repeatedly
     * invalidate records while ActionHandler iterates its targets. Each target
     * still receives USER_SET locally, and the final target remains the shared
     * desired speed under the extension's existing global-speed semantics.
     * @param {HTMLMediaElement} video
     * @param {number} speed
     * @param {{startsAuthorityEpoch?: boolean}} [options]
     */
    noteUserSet(video, speed, { startsAuthorityEpoch = true } = {}) {
      const A = window.VSC.SpeedArbiter;
      if (startsAuthorityEpoch) {
        this.claimAuthority(speed);
      } else {
        this.config.persistAuthority(speed);
      }
      const { state } = this.stateFor(video);
      const result = A.step(state, { type: A.EVENTS.USER_SET, speed });
      this.applyState(this.conflictFor(video), result.state);
    }
    /**
     * Schedule a fallback for a physical terminal event. The usual YouTube
     * release emits a normal ratechange first; the fallback only prevents an
     * abandoned hold from suppressing lifecycle healing forever.
     * @param {HTMLMediaElement} video
     */
    noteTemporaryOverrideEnd(video) {
      const conflict = this.conflicts.get(video);
      if (!conflict?.temporaryOverride || this.temporaryReleaseTimers.get(video)) {
        return;
      }
      const entry = { video, timer: null };
      entry.timer = setTimeout(() => {
        this.pendingTemporaryReleaseTimers.delete(entry);
        if (this.temporaryReleaseTimers.get(video) !== entry) {
          return;
        }
        this.temporaryReleaseTimers.delete(video);
        if (this.stateFor(video).state.temporaryOverride) {
          window.VSC.logger.info(
            "Restoring shared speed after native hold release without ratechange"
          );
          this.completeTemporaryOverride(video, video.playbackRate);
        }
      }, _SpeedArbitration.TEMPORARY_RELEASE_FALLBACK_MS);
      this.temporaryReleaseTimers.set(video, entry);
      this.pendingTemporaryReleaseTimers.add(entry);
    }
    /**
     * Complete a local temporary override from its normal external release or
     * the guarded terminal fallback. This never claims shared authority.
     * @param {HTMLMediaElement} video
     * @param {number} observedRate
     * @param {Event|null} [event]
     * @returns {boolean} whether a temporary override was completed
     * @private
     */
    completeTemporaryOverride(video, observedRate, event = null) {
      const A = window.VSC.SpeedArbiter;
      this.clearTemporaryReleaseTimer(video);
      const { state, conflict } = this.stateFor(video);
      if (!state.temporaryOverride) {
        return false;
      }
      const { state: next, effects } = A.step(state, {
        type: A.EVENTS.TEMPORARY_OVERRIDE_END,
        speed: observedRate
      });
      this.applyState(conflict, next);
      const write = effects.find((entry) => entry.type === A.EFFECTS.WRITE);
      const sync = effects.find((entry) => entry.type === A.EFFECTS.SYNC_UI);
      if (write) {
        window.VSC.logger.info(
          `Restoring shared speed ${write.speed} after temporary native override`
        );
        this.eventManager?.actionHandler?.writeRate(video, write.speed);
        event?.stopImmediatePropagation();
      }
      if (sync) {
        this.eventManager?.actionHandler?.syncIndicator(video, sync.speed);
      }
      return true;
    }
    /**
     * @param {HTMLMediaElement} video
     * @private
     */
    clearTemporaryReleaseTimer(video) {
      const entry = this.temporaryReleaseTimers.get(video);
      if (!entry) {
        return;
      }
      clearTimeout(entry.timer);
      this.temporaryReleaseTimers.delete(video);
      this.pendingTemporaryReleaseTimers.delete(entry);
    }
    /**
     * Decide and execute for a genuine external ratechange.
     * @param {HTMLMediaElement} video
     * @param {Event} event
     * @param {string} verdict
     * @param {{suppressRetryEcho?: boolean}} [options]
     */
    onExternalRate(video, event, verdict, { suppressRetryEcho = false } = {}) {
      const A = window.VSC.SpeedArbiter;
      const IC = window.VSC.IntentClassifier;
      const rawRate = video.playbackRate;
      const { state, conflict } = this.stateFor(video);
      if (suppressRetryEcho) {
        window.VSC.logger.info(
          `Detected page rewrite caused by propagated VSC echo: ${state.desired} -> ${rawRate}`
        );
      }
      const strongUserIntent = verdict === IC.VERDICTS.USER_INTENT && this.classifier.hasStrongIntent({ media: video, timeStamp: event.timeStamp });
      const releasePending = !!this.temporaryReleaseTimers.get(video);
      if (state.temporaryOverride && verdict !== IC.VERDICTS.TEMPORARY_OVERRIDE && (!strongUserIntent || releasePending)) {
        this.completeTemporaryOverride(video, rawRate, event);
        return;
      }
      if (verdict === IC.VERDICTS.TEMPORARY_OVERRIDE) {
        this.clearTemporaryReleaseTimer(video);
        const { state: next2, effects: effects2 } = A.step(state, {
          type: A.EVENTS.TEMPORARY_OVERRIDE_START,
          speed: rawRate
        });
        this.applyState(conflict, next2);
        const sync = effects2.find((entry) => entry.type === A.EFFECTS.SYNC_UI);
        if (sync) {
          window.VSC.logger.info(
            `Allowing temporary native override at ${rawRate} without claiming shared authority`
          );
          this.eventManager?.actionHandler?.syncIndicator(video, sync.speed);
        }
        return;
      }
      let rateClass = verdict;
      let speedForDecision = rawRate;
      if (state.mode === A.MODES.HOLDING && Math.abs(rawRate - state.desired) <= 0.01) {
        speedForDecision = state.desired;
        if (rateClass === IC.VERDICTS.USER_INTENT) {
          rateClass = IC.VERDICTS.AUTONOMOUS;
        }
      }
      const previousFightCount = state.fightCount;
      const { state: next, effects } = A.step(state, {
        type: A.EVENTS.EXT_RATE,
        speed: speedForDecision,
        rateClass,
        quiet: this.classifier.isQuietContext(event.timeStamp)
      });
      const inputAge = this.classifier.lastInputAt > 0 ? Math.round(event.timeStamp - this.classifier.lastInputAt) : -1;
      if (effects.some((entry) => entry.type === A.EFFECTS.PERSIST)) {
        const adopted = Number(rawRate.toFixed(2));
        window.VSC.logger.info(
          `Accepting site speed change as user-intentional: ${rawRate} (input ${inputAge}ms ago)`
        );
        if (conflict) {
          this.clearFightTimer(conflict);
        }
        this.clearTemporaryReleaseTimer(video);
        this.classifier.consumeGesture(video);
        this.claimAuthority(adopted);
        this.applyState(this.conflictFor(video), next);
        this.eventManager?.actionHandler?.syncIndicator(video, adopted);
        return;
      }
      this.applyState(conflict, next);
      if (next.fightCount > previousFightCount) {
        this.armFightTimer(conflict);
        window.VSC.logger.info(
          `Fight detection: attempt ${next.fightCount}, site rate ${rawRate} -> re-applying ${state.desired} (input ${inputAge}ms ago)`
        );
        this.eventManager?.actionHandler?.writeRate(video, state.desired, {
          suppressEchoPropagation: suppressRetryEcho
        });
        event.stopImmediatePropagation();
        return;
      }
      if ((next.mode === A.MODES.SUPPRESSED || next.mode === A.MODES.REARMABLE) && next.mode !== state.mode) {
        this.clearFightTimer(conflict);
        window.VSC.logger.info(
          `Fight detection: ${next.mode.toLowerCase()} locally at site speed ${rawRate}`
        );
      }
      this.eventManager?.actionHandler?.syncIndicator(video, rawRate);
    }
    /**
     * Return the lifecycle write target for one media element, if it remains
     * locally enforcing shared authority.
     * @param {HTMLMediaElement} video
     * @returns {number|null}
     */
    lifecycleTarget(video) {
      const A = window.VSC.SpeedArbiter;
      const { state, conflict } = this.stateFor(video);
      const { state: next, effects } = A.step(state, { type: A.EVENTS.LIFECYCLE });
      this.applyState(conflict, next);
      const write = effects.find((entry) => entry.type === A.EFFECTS.WRITE);
      return write ? write.speed : null;
    }
    /**
     * Release state associated with a removed controller.
     * @param {HTMLMediaElement} video
     */
    release(video) {
      const conflict = this.conflicts.get(video);
      if (conflict) {
        this.clearFightTimer(conflict);
        this.conflicts.delete(video);
      }
      this.pendingWrites.delete(video);
      this.clearEchoTransaction(video);
      this.clearTemporaryReleaseTimer(video);
      this.classifier.releaseMedia(video);
    }
    /**
     * @param {Object|null} conflict
     * @private
     */
    armFightTimer(conflict) {
      if (!conflict) {
        return;
      }
      this.clearFightTimer(conflict);
      const epoch = conflict.epoch;
      conflict.fightTimer = setTimeout(() => {
        this.timedConflicts.delete(conflict);
        conflict.fightTimer = null;
        if (conflict.epoch === epoch && epoch === this.authorityEpoch) {
          const A = window.VSC.SpeedArbiter;
          const { state } = A.step(
            {
              mode: conflict.mode,
              desired: this.config.settings.lastSpeed,
              fightCount: conflict.fightCount,
              warQuiet: conflict.warQuiet,
              rearmBudget: conflict.rearmBudget,
              temporaryOverride: conflict.temporaryOverride
            },
            { type: A.EVENTS.FIGHT_WINDOW_EXPIRE }
          );
          this.applyState(conflict, state);
        }
      }, _SpeedArbitration.FIGHT_WINDOW_MS);
      this.timedConflicts.add(conflict);
    }
    /**
     * @param {Object|null} conflict
     * @private
     */
    clearFightTimer(conflict) {
      if (!conflict || conflict.fightTimer === null) {
        return;
      }
      clearTimeout(conflict.fightTimer);
      conflict.fightTimer = null;
      this.timedConflicts.delete(conflict);
    }
    cleanup() {
      for (const conflict of this.timedConflicts) {
        clearTimeout(conflict.fightTimer);
        conflict.fightTimer = null;
      }
      this.timedConflicts.clear();
      for (const entry of this.pendingTemporaryReleaseTimers) {
        clearTimeout(entry.timer);
      }
      this.pendingTemporaryReleaseTimers.clear();
      this.clearAllEchoTransactions();
      this.temporaryReleaseTimers = /* @__PURE__ */ new WeakMap();
      this.conflicts = /* @__PURE__ */ new WeakMap();
      this.pendingWrites = /* @__PURE__ */ new WeakMap();
      this.classifier.reset();
    }
  };
  SpeedArbitration.FIGHT_WINDOW_MS = 3e3;
  SpeedArbitration.ECHO_TOLERANCE = 0.011;
  SpeedArbitration.ECHO_TTL_MS = 500;
  SpeedArbitration.ECHO_MAX_PENDING = 8;
  SpeedArbitration.TEMPORARY_RELEASE_FALLBACK_MS = 250;
  window.VSC.SpeedArbitration = SpeedArbitration;

  // src/core/controller-visibility.js
  window.VSC = window.VSC || {};
  var ControllerVisibility = class {
    static OVERRIDES = Object.freeze({
      AUTO: "auto",
      SHOW: "show",
      HIDE: "hide"
    });
    static FLASH = Object.freeze({
      NONE: "none",
      TIMED_ARMED: "timed-armed",
      TIMED_DUE: "timed-due",
      PERSISTENT: "persistent"
    });
    static MEDIA_TYPES = Object.freeze({
      VIDEO: "video",
      AUDIO: "audio"
    });
    static EVENTS = Object.freeze({
      TOGGLE: "TOGGLE",
      FLASH_REQUEST: "FLASH_REQUEST",
      TIMER_TICK: "TIMER_TICK",
      FLASH_EXPIRE: "FLASH_EXPIRE",
      AUTOMATIC_HIDE: "AUTOMATIC_HIDE",
      AUTOMATIC_SHOW: "AUTOMATIC_SHOW",
      SET_SITE_AUTOHIDE: "SET_SITE_AUTOHIDE",
      SET_SOURCE_AVAILABLE: "SET_SOURCE_AVAILABLE",
      SET_HOST_HIDDEN: "SET_HOST_HIDDEN",
      SET_START_HIDDEN: "SET_START_HIDDEN",
      RELEASE: "RELEASE"
    });
    /**
     * Create one controller's bounded model state.
     * @param {Object} [values]
     * @returns {Object}
     */
    static createState(values = {}) {
      const state = {
        attached: true,
        override: this.OVERRIDES.AUTO,
        automaticHidden: false,
        noSource: false,
        siteAutohide: false,
        hostHidden: false,
        flash: this.FLASH.NONE,
        startHidden: false,
        mediaType: this.MEDIA_TYPES.VIDEO,
        ...values
      };
      this.assertState(state);
      return state;
    }
    /**
     * Treat absent or page-forged values as AUTO rather than creating a fourth
     * state that neither the CSS nor the formal model understands.
     * @param {*} value
     * @returns {'auto'|'show'|'hide'}
     */
    static normalizeOverride(value) {
      return Object.values(this.OVERRIDES).includes(value) ? value : this.OVERRIDES.AUTO;
    }
    /**
     * Abstract the actual CSS precedence relation.
     * @param {Object} state
     * @returns {boolean}
     */
    static isVisible(state) {
      this.assertState(state);
      if (!state.attached || state.hostHidden || state.noSource || state.override === this.OVERRIDES.HIDE) {
        return false;
      }
      if (state.override === this.OVERRIDES.SHOW || state.flash !== this.FLASH.NONE) {
        return true;
      }
      return !state.automaticHidden && !state.siteAutohide;
    }
    /**
     * The first toggle opposes pre-action rendering; later toggles alternate
     * persistent SHOW/HIDE intent. AUTO is re-entered only by controller release.
     * The adapter must sample rendering before cancelling flash.
     * @param {*} override
     * @param {boolean} [renderedVisible] - Required only when toggling from AUTO
     * @returns {'show'|'hide'}
     */
    static nextOverride(override, renderedVisible) {
      const current = this.normalizeOverride(override);
      if (current === this.OVERRIDES.SHOW) {
        return this.OVERRIDES.HIDE;
      }
      if (current === this.OVERRIDES.HIDE) {
        return this.OVERRIDES.SHOW;
      }
      if (typeof renderedVisible !== "boolean") {
        throw new TypeError("renderedVisible must be boolean when toggling from AUTO");
      }
      return renderedVisible ? this.OVERRIDES.HIDE : this.OVERRIDES.SHOW;
    }
    /**
     * startHidden and explicit HIDE are the only policy-level flash blockers.
     * Source/automatic/site hiding remains render-layer state so a flash can
     * provide feedback without corrupting AUTO.
     * @param {Object} input
     * @returns {boolean}
     */
    static allowsFlash(input) {
      return input?.attached !== false && !input?.startHidden && this.normalizeOverride(input?.override) !== this.OVERRIDES.HIDE;
    }
    /**
     * Apply one pure visibility event.
     * @param {Object} state
     * @param {{type: string, value?: boolean, renderedVisible?: boolean}} event
     * @returns {Object}
     */
    static step(state, event) {
      this.assertState(state);
      if (!event || typeof event.type !== "string") {
        throw new TypeError("visibility event requires a type");
      }
      const next = { ...state };
      switch (event.type) {
        case this.EVENTS.TOGGLE:
          if (state.attached) {
            const renderedVisible = event.renderedVisible === void 0 ? this.isVisible(state) : this.requireBoolean(event.renderedVisible, "renderedVisible");
            next.override = this.nextOverride(state.override, renderedVisible);
            next.flash = this.FLASH.NONE;
          }
          break;
        case this.EVENTS.FLASH_REQUEST:
          if (this.allowsFlash(state)) {
            next.flash = state.mediaType === this.MEDIA_TYPES.AUDIO ? this.FLASH.PERSISTENT : this.FLASH.TIMED_ARMED;
          }
          break;
        case this.EVENTS.TIMER_TICK:
          if (state.attached && state.flash === this.FLASH.TIMED_ARMED) {
            next.flash = this.FLASH.TIMED_DUE;
          }
          break;
        case this.EVENTS.FLASH_EXPIRE:
          if (state.attached && state.flash === this.FLASH.TIMED_DUE) {
            next.flash = this.FLASH.NONE;
          }
          break;
        case this.EVENTS.AUTOMATIC_HIDE:
          if (state.attached) {
            next.automaticHidden = true;
          }
          break;
        case this.EVENTS.AUTOMATIC_SHOW:
          if (state.attached && !state.startHidden) {
            next.automaticHidden = false;
          }
          break;
        case this.EVENTS.SET_SITE_AUTOHIDE:
          if (state.attached) {
            next.siteAutohide = this.requireBoolean(event.value, "value");
          }
          break;
        case this.EVENTS.SET_SOURCE_AVAILABLE:
          if (state.attached) {
            next.noSource = !this.requireBoolean(event.value, "value");
          }
          break;
        case this.EVENTS.SET_HOST_HIDDEN:
          if (state.attached) {
            next.hostHidden = this.requireBoolean(event.value, "value");
          }
          break;
        case this.EVENTS.SET_START_HIDDEN:
          next.startHidden = this.requireBoolean(event.value, "value");
          break;
        case this.EVENTS.RELEASE:
          next.attached = false;
          next.override = this.OVERRIDES.AUTO;
          next.flash = this.FLASH.NONE;
          break;
        default:
          throw new TypeError(`Unknown visibility event ${event.type}`);
      }
      this.assertState(next);
      return next;
    }
    static requireBoolean(value, name) {
      if (typeof value !== "boolean") {
        throw new TypeError(`${name} must be boolean`);
      }
      return value;
    }
    static assertState(state) {
      if (!state || typeof state !== "object") {
        throw new TypeError("visibility state must be an object");
      }
      for (const key of [
        "attached",
        "automaticHidden",
        "noSource",
        "siteAutohide",
        "hostHidden",
        "startHidden"
      ]) {
        this.requireBoolean(state[key], key);
      }
      if (!Object.values(this.OVERRIDES).includes(state.override)) {
        throw new TypeError(`invalid visibility override ${state.override}`);
      }
      if (!Object.values(this.FLASH).includes(state.flash)) {
        throw new TypeError(`invalid flash state ${state.flash}`);
      }
      if (!Object.values(this.MEDIA_TYPES).includes(state.mediaType)) {
        throw new TypeError(`invalid media type ${state.mediaType}`);
      }
      if (!state.attached && (state.override !== this.OVERRIDES.AUTO || state.flash !== this.FLASH.NONE)) {
        throw new TypeError("detached visibility state must be AUTO with no flash");
      }
      if (state.mediaType === this.MEDIA_TYPES.AUDIO && (state.flash === this.FLASH.TIMED_ARMED || state.flash === this.FLASH.TIMED_DUE)) {
        throw new TypeError("audio visibility state cannot carry a timed flash");
      }
      if (state.mediaType === this.MEDIA_TYPES.VIDEO && state.flash === this.FLASH.PERSISTENT) {
        throw new TypeError("video visibility state cannot carry a persistent flash");
      }
      if (state.override === this.OVERRIDES.HIDE && state.flash !== this.FLASH.NONE) {
        throw new TypeError("explicit HIDE cannot coexist with flash");
      }
    }
  };
  window.VSC.ControllerVisibility = ControllerVisibility;

  // src/utils/event-manager.js
  window.VSC = window.VSC || {};
  var EventManager = class _EventManager {
    constructor(config, actionHandler) {
      this.config = config;
      this.actionHandler = actionHandler;
      this.listeners = /* @__PURE__ */ new Map();
      this.lastKeyEventSignature = null;
      this.arbitration = new window.VSC.SpeedArbitration(config, this);
    }
    /**
     * Set up all event listeners
     * @param {Document} document - Document to attach events to
     */
    setupEventListeners(document2) {
      this.setupKeyboardShortcuts(document2);
      this.setupRateChangeListener(document2);
      this.setupUserGestureListener(document2);
    }
    /**
     * Set up keyboard shortcuts
     * @param {Document} document - Document to attach events to
     */
    setupKeyboardShortcuts(document2) {
      const docs = [document2];
      try {
        if (window.VSC.inIframe()) {
          docs.push(window.top.document);
        }
      } catch {
      }
      docs.forEach((doc) => {
        const keydownHandler = (event) => this.handleKeydown(event);
        const keyupHandler = (event) => this.handleKeyup(event);
        doc.addEventListener("keydown", keydownHandler, true);
        doc.addEventListener("keyup", keyupHandler, true);
        if (!this.listeners.has(doc)) {
          this.listeners.set(doc, []);
        }
        this.listeners.get(doc).push(
          { type: "keydown", handler: keydownHandler, useCapture: true },
          { type: "keyup", handler: keyupHandler, useCapture: true }
        );
      });
    }
    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     * @private
     */
    handleKeydown(event) {
      window.VSC.logger.verbose(
        `Processing keydown event: code=${event.code}, key=${event.key}, keyCode=${event.keyCode}`
      );
      if (event.isComposing || event.keyCode === 229 || event.key === "Process" || event.key === "Dead") {
        return;
      }
      const eventSignature = `${event.code}_${event.key}_${event.timeStamp}_${event.type}`;
      if (this.lastKeyEventSignature === eventSignature) {
        return;
      }
      this.lastKeyEventSignature = eventSignature;
      this.arbitration.classifier.observeInput(event);
      if (this.isTypingContext(event.target)) {
        return false;
      }
      const mediaElements = window.VSC.stateManager ? window.VSC.stateManager.getControlledElements() : [];
      if (!mediaElements.length) {
        return false;
      }
      const keyBinding = this.findMatchingBinding(event);
      if (keyBinding) {
        this.actionHandler.runAction(keyBinding.action, keyBinding.value, event);
        if (this.config.settings.exclusiveKeys) {
          event.preventDefault();
          event.stopPropagation();
        }
      } else {
        this.arbitration.classifier.observeUnhandledKey(event);
        window.VSC.logger.verbose(
          `No key binding found for code=${event.code}, keyCode=${event.keyCode}`
        );
      }
      return false;
    }
    /**
     * Retire a native Space hold after its physical key release. The classifier
     * owns host detection and media attribution; arbitration owns restoration.
     * @param {KeyboardEvent} event
     * @private
     */
    handleKeyup(event) {
      const media = this.arbitration.classifier.observeKeyEnd(event);
      if (media) {
        this.arbitration.noteTemporaryOverrideEnd(media);
      }
    }
    /**
     * Three-tier binding match: chord → simple → legacy fallback.
     *
     * When event.code is empty/Unidentified (virtual keyboards, remote desktop,
     * accessibility devices), falls back to keyCode matching for all bindings.
     *
     * @param {KeyboardEvent} event
     * @returns {Object|undefined} Matching binding, or undefined
     * @private
     */
    findMatchingBinding(event) {
      const bindings = this.config.settings.keyBindings;
      const code = event.code;
      const keyCode = event.keyCode;
      const ctrl = !!event.ctrlKey;
      const alt = !!event.altKey;
      const meta = !!event.metaKey;
      const shift = !!event.shiftKey;
      const hasModifier = ctrl || alt || meta;
      if (!code || code === "Unidentified") {
        return bindings.find((b) => {
          const bKey = b.keyCode ?? b.key;
          if (bKey !== keyCode) {
            return false;
          }
          return b.modifiers ? _EventManager.modifiersMatch(b.modifiers, ctrl, alt, meta, shift) : !hasModifier;
        });
      }
      const chordMatch = bindings.find(
        (b) => b.modifiers && b.code === code && _EventManager.modifiersMatch(b.modifiers, ctrl, alt, meta, shift)
      );
      if (chordMatch) {
        return chordMatch;
      }
      if (!hasModifier) {
        const simpleMatch = bindings.find((b) => !b.modifiers && b.code === code);
        if (simpleMatch) {
          return simpleMatch;
        }
      }
      if (!hasModifier) {
        const legacyMatch = bindings.find((b) => {
          if (b.code !== null && b.code !== void 0) {
            return false;
          }
          return (b.keyCode ?? b.key) === keyCode;
        });
        if (legacyMatch) {
          return legacyMatch;
        }
      }
      return void 0;
    }
    /**
     * Check if user is typing in an input context
     * @param {Element} target - Event target
     * @returns {boolean} True if typing context
     * @private
     */
    isTypingContext(target) {
      return target.nodeName === "INPUT" || target.nodeName === "TEXTAREA" || target.isContentEditable;
    }
    /**
     * Feed user interactions that originate outside the VSC controller to the
     * classifier's evidence ledger. Clicks on native speed UI land here;
     * unhandled keys land in handleKeydown; pointer lifecycle events cover
     * click-and-hold interactions (evidence only under TARGET_RULES, per
     * PR #1555).
     * The classifier — not this module — decides what counts as intent.
     * @param {Document} document
     * @private
     */
    setupUserGestureListener(document2) {
      const clickHandler = (event) => {
        if (event.target?.closest?.("vsc-controller")) {
          return;
        }
        this.arbitration.classifier.observeClick(event, this.resolveGestureMedia(event));
      };
      const pointerDownHandler = (event) => {
        if (event.target?.closest?.("vsc-controller")) {
          return;
        }
        this.arbitration.classifier.observePointerDown(event, this.resolveGestureMedia(event));
      };
      const pointerEndHandler = (event) => {
        for (const video of this.arbitration.classifier.observePointerEnd(event)) {
          this.arbitration.noteTemporaryOverrideEnd(video);
        }
      };
      const clearTemporaryHolds = () => {
        for (const video of this.arbitration.classifier.clearTemporaryHolds()) {
          this.arbitration.noteTemporaryOverrideEnd(video);
        }
      };
      const visibilityHandler = (event) => {
        if (document2.hidden) {
          clearTemporaryHolds(event);
        }
      };
      const inputHandler = (event) => {
        this.arbitration.classifier.observeInput(event);
      };
      document2.addEventListener("click", clickHandler, true);
      document2.addEventListener("pointerdown", pointerDownHandler, true);
      document2.addEventListener("pointerup", pointerEndHandler, true);
      document2.addEventListener("pointercancel", pointerEndHandler, true);
      document2.addEventListener("visibilitychange", visibilityHandler, true);
      document2.addEventListener("pointermove", inputHandler, { capture: true, passive: true });
      document2.addEventListener("touchstart", inputHandler, { capture: true, passive: true });
      if (!this.listeners.has(document2)) {
        this.listeners.set(document2, []);
      }
      this.listeners.get(document2).push(
        { type: "click", handler: clickHandler, useCapture: true },
        { type: "pointerdown", handler: pointerDownHandler, useCapture: true },
        { type: "pointerup", handler: pointerEndHandler, useCapture: true },
        { type: "pointercancel", handler: pointerEndHandler, useCapture: true },
        { type: "visibilitychange", handler: visibilityHandler, useCapture: true },
        { type: "pointermove", handler: inputHandler, useCapture: true },
        { type: "touchstart", handler: inputHandler, useCapture: true }
      );
      const view = document2.defaultView;
      if (view) {
        if (!this.listeners.has(view)) {
          this.listeners.set(view, []);
        }
        view.addEventListener("blur", clearTemporaryHolds);
        view.addEventListener("pagehide", clearTemporaryHolds);
        this.listeners.get(view).push(
          { type: "blur", handler: clearTemporaryHolds, useCapture: false },
          { type: "pagehide", handler: clearTemporaryHolds, useCapture: false }
        );
      }
    }
    /**
     * Associate a page gesture with a controlled media element only when the
     * DOM path or current site handler identifies one unambiguous owner.
     * Unresolved gestures deliberately retain the classifier's legacy
     * document-level fallback scope.
     * @param {Event} event
     * @returns {HTMLMediaElement|null}
     */
    resolveGestureMedia(event) {
      const mediaElements = window.VSC.stateManager ? window.VSC.stateManager.getControlledElements() : [];
      if (mediaElements.length === 0) {
        return null;
      }
      const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
      const controlled = new Set(mediaElements);
      const directMatches = new Set(path.filter((node) => controlled.has(node)));
      if (directMatches.size === 1) {
        return directMatches.values().next().value;
      }
      if (directMatches.size > 1 || mediaElements.length === 1) {
        return null;
      }
      const resolved = window.VSC.siteHandlerManager?.resolveGestureMedia?.(event, mediaElements);
      return controlled.has(resolved) ? resolved : null;
    }
    /**
     * Set up rate change event listener
     * @param {Document} document - Document to attach events to
     */
    setupRateChangeListener(document2) {
      const rateChangeHandler = (event) => this.handleRateChange(event);
      document2.addEventListener("ratechange", rateChangeHandler, true);
      if (!this.listeners.has(document2)) {
        this.listeners.set(document2, []);
      }
      this.listeners.get(document2).push({
        type: "ratechange",
        handler: rateChangeHandler,
        useCapture: true
      });
    }
    /**
     * Handle rate change events
     * @param {Event} event - Rate change event
     * @private
     */
    handleRateChange(event) {
      const video = event.composedPath ? event.composedPath()[0] : event.target;
      if (!video.vsc) {
        window.VSC.logger.debug("Skipping ratechange - no VSC controller attached");
        return;
      }
      const echo = this.arbitration.consumeEcho(video, video.playbackRate);
      if (echo) {
        window.VSC.logger.debug("Ignoring own write echo (in-flight token consumed)");
        if (echo.suppressPropagation) {
          event.stopImmediatePropagation();
        } else {
          this.arbitration.observePropagatedEcho(video, event, echo);
        }
        return;
      }
      const reactiveRewrite = this.arbitration.consumeEchoReaction(video, event);
      if (reactiveRewrite === null) {
        event.stopImmediatePropagation();
        return;
      }
      if (event.detail && event.detail.origin === "videoSpeed") {
        window.VSC.logger.debug("Ignoring extension-originated rate change");
        return;
      }
      if (video.readyState < 1) {
        window.VSC.logger.debug(
          "Ignoring external ratechange during video initialization (readyState < 1)"
        );
        return;
      }
      const rawExternalRate = typeof video.playbackRate === "number" ? video.playbackRate : NaN;
      const min = window.VSC.Constants.SPEED_LIMITS.MIN;
      if (!isNaN(rawExternalRate) && rawExternalRate <= min) {
        window.VSC.logger.debug(
          `Ignoring external ratechange below MIN: raw=${rawExternalRate}, MIN=${min}`
        );
        return;
      }
      const verdict = reactiveRewrite ? window.VSC.IntentClassifier.VERDICTS.AUTONOMOUS : this.arbitration.classifier.classify({
        media: video,
        rate: video.playbackRate,
        timeStamp: event.timeStamp,
        readyState: video.readyState,
        detail: event.detail
      });
      this.arbitration.onExternalRate(video, event, verdict, {
        suppressRetryEcho: reactiveRewrite
      });
    }
    /**
     * Clean up all event listeners
     */
    cleanup() {
      this.listeners.forEach((eventList, doc) => {
        eventList.forEach(({ type, handler, useCapture }) => {
          try {
            doc.removeEventListener(type, handler, useCapture);
          } catch (e) {
            window.VSC.logger.warn(`Failed to remove event listener: ${e.message}`);
          }
        });
      });
      this.listeners.clear();
      this.arbitration.cleanup();
    }
  };
  EventManager.modifiersMatch = function(mods, ctrl, alt, meta, shift) {
    return mods.ctrl === ctrl && mods.alt === alt && mods.meta === meta && mods.shift === shift;
  };
  window.VSC.EventManager = EventManager;

  // src/utils/site-pattern.js
  var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
  var regEndsWithFlags = /\/(?!.*(.).*\1)[gimsuy]*$/;
  var escapeRegExp = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
  function compilePattern(raw) {
    const pattern = raw.replace(regStrip, "");
    if (pattern.length === 0) {
      return null;
    }
    if (pattern.startsWith("/")) {
      try {
        const parts = pattern.split("/");
        if (parts.length < 3) {
          return null;
        }
        const hasFlags = regEndsWithFlags.test(pattern);
        const flags = hasFlags ? parts.pop() : "";
        const regex = parts.slice(1, hasFlags ? void 0 : -1).join("/");
        if (!regex) {
          return null;
        }
        return new RegExp(regex, flags);
      } catch {
        return null;
      }
    }
    const escaped = escapeRegExp(pattern);
    const looksLikeDomain = pattern.includes(".") && !pattern.includes("/");
    if (looksLikeDomain) {
      return new RegExp(`(^|\\.|//)${escaped}(\\/|:|$)`);
    }
    return new RegExp(escaped);
  }
  function matchSiteRule(rules, href) {
    if (!rules || !rules.length) {
      return null;
    }
    for (const rule of rules) {
      const regexp = compilePattern(rule.pattern || "");
      if (regexp && regexp.test(href)) {
        return rule;
      }
    }
    return null;
  }
  window.VSC = window.VSC || {};
  window.VSC.matchSiteRule = matchSiteRule;

  // src/core/storage-manager.js
  window.VSC = window.VSC || {};
  if (!window.VSC.StorageManager) {
    const docEl = document.documentElement;
    const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;
    class StorageManager {
      static errorCallback = null;
      /**
       * Register error callback for monitoring storage failures
       * @param {Function} callback - Callback function for errors
       */
      static onError(callback) {
        this.errorCallback = callback;
      }
      /**
       * @param {Object} defaults - Default values
       * @returns {Promise<Object>} Storage data
       */
      static async get(defaults = {}) {
        if (hasChrome) {
          return new Promise((resolve) => {
            chrome.storage.sync.get(defaults, (storage) => {
              window.VSC.logger?.debug?.("StorageManager: settings from chrome.storage");
              resolve(storage);
            });
          });
        }
        return new Promise((resolve) => {
          const onReady = (e) => {
            docEl.removeEventListener("VSC_SETTINGS_READY", onReady);
            clearTimeout(timeout);
            const detail = e.detail;
            if (!detail) {
              window.VSC.logger?.error?.("StorageManager: bridge response is null (clone failed?)");
              resolve(null);
              return;
            }
            if (detail.abort) {
              window.VSC.logger?.debug?.("StorageManager: site disabled by bridge");
              resolve(null);
              return;
            }
            if (!detail.settings || typeof detail.settings !== "object" || Array.isArray(detail.settings)) {
              window.VSC.logger?.error?.("StorageManager: invalid settings response from bridge");
              resolve(null);
              return;
            }
            window.VSC.logger?.debug?.("StorageManager: settings from bridge");
            resolve({ ...defaults, ...detail.settings });
          };
          const timeout = setTimeout(() => {
            docEl.removeEventListener("VSC_SETTINGS_READY", onReady);
            window.VSC.logger?.warn?.("StorageManager: settings timeout, aborting initialization");
            resolve(null);
          }, 2e3);
          docEl.addEventListener("VSC_SETTINGS_READY", onReady);
          docEl.dispatchEvent(new CustomEvent("VSC_REQUEST_SETTINGS"));
        });
      }
      /**
       * @param {Object} data - Data to store
       * @returns {Promise<void>}
       */
      static async set(data) {
        if (hasChrome) {
          return new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
              if (chrome.runtime.lastError) {
                const error = new Error(`Storage failed: ${chrome.runtime.lastError.message}`);
                window.VSC.logger?.error?.(
                  `Chrome storage save failed: ${chrome.runtime.lastError.message}`
                );
                if (this.errorCallback) {
                  this.errorCallback(error, data);
                }
                reject(error);
                return;
              }
              window.VSC.logger?.debug?.("StorageManager: saved to chrome.storage");
              resolve();
            });
          });
        }
        const keys = Object.keys(data);
        if (keys.length === 1 && keys[0] === "lastSpeed") {
          const speed = data.lastSpeed;
          if (typeof speed === "number" && Number.isFinite(speed)) {
            docEl.dispatchEvent(
              new CustomEvent("VSC_WRITE_STORAGE", { detail: { lastSpeed: speed } })
            );
          } else {
            window.VSC.logger?.warn?.("StorageManager.set: invalid lastSpeed value");
          }
        } else {
          window.VSC.logger?.warn?.(
            `StorageManager.set: only lastSpeed bridgeable from MAIN. Keys: ${keys.join(", ")}`
          );
        }
        window.VSC_settings = { ...window.VSC_settings, ...data };
        return Promise.resolve();
      }
      /**
       * Remove keys from storage.
       * @param {Array<string>} keys - Keys to remove
       * @returns {Promise<void>}
       */
      static async remove(keys) {
        if (hasChrome) {
          return new Promise((resolve, reject) => {
            chrome.storage.sync.remove(keys, () => {
              if (chrome.runtime.lastError) {
                const error = new Error(`Storage remove failed: ${chrome.runtime.lastError.message}`);
                window.VSC.logger?.error?.(
                  `Chrome storage remove failed: ${chrome.runtime.lastError.message}`
                );
                if (this.errorCallback) {
                  this.errorCallback(error, { removedKeys: keys });
                }
                reject(error);
                return;
              }
              resolve();
            });
          });
        }
        if (window.VSC_settings) {
          keys.forEach((key) => delete window.VSC_settings[key]);
        }
        return Promise.resolve();
      }
      /**
       * Clear all storage.
       * @returns {Promise<void>}
       */
      static async clear() {
        if (hasChrome) {
          return new Promise((resolve, reject) => {
            chrome.storage.sync.clear(() => {
              if (chrome.runtime.lastError) {
                const error = new Error(`Storage clear failed: ${chrome.runtime.lastError.message}`);
                window.VSC.logger?.error?.(
                  `Chrome storage clear failed: ${chrome.runtime.lastError.message}`
                );
                if (this.errorCallback) {
                  this.errorCallback(error, { operation: "clear" });
                }
                reject(error);
                return;
              }
              resolve();
            });
          });
        }
        window.VSC_settings = {};
        return Promise.resolve();
      }
      /**
       * @param {Function} callback - Callback with changes in chrome.storage.onChanged format
       */
      static onChanged(callback) {
        if (hasChrome) {
          chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "sync") {
              callback(changes);
            }
          });
        } else {
          docEl.addEventListener("VSC_STORAGE_CHANGED", (e) => {
            const changes = e.detail;
            for (const [key, change] of Object.entries(changes)) {
              if (change.newValue !== void 0) {
                window.VSC_settings = window.VSC_settings || {};
                window.VSC_settings[key] = change.newValue;
              }
            }
            callback(changes);
          });
        }
      }
    }
    window.VSC.StorageManager = StorageManager;
  }

  // src/core/settings.js
  window.VSC = window.VSC || {};
  if (!window.VSC.VideoSpeedConfig) {
    class VideoSpeedConfig {
      constructor() {
        this.settings = { ...window.VSC.Constants.DEFAULT_SETTINGS };
        this.pendingSave = null;
        this.saveTimer = null;
        this.SAVE_DELAY = 1e3;
        this._loaded = false;
        this._setupStorageListener();
      }
      /**
       * Listen for storage changes from other contexts and update in-memory state.
       * @private
       */
      _setupStorageListener() {
        try {
          window.VSC.StorageManager.onChanged((changes) => {
            for (const [key, change] of Object.entries(changes)) {
              if (!(key in this.settings) || change.newValue === void 0) {
                continue;
              }
              if (key === "lastSpeed") {
                continue;
              }
              this.settings[key] = change.newValue;
              window.VSC.logger.debug(`Settings updated from storage change: ${key}`);
            }
          });
        } catch (e) {
          window.VSC.logger.debug(`Could not set up storage change listener: ${e.message}`);
        }
      }
      /**
       * Load settings from Chrome storage or pre-injected settings
       * @returns {Promise<Object>} Loaded settings
       */
      async load() {
        try {
          const storage = await window.VSC.StorageManager.get({
            ...window.VSC.Constants.DEFAULT_SETTINGS,
            controllerCSS: null
          });
          if (storage === null) {
            this.settings._abort = true;
            return;
          }
          this._loaded = true;
          this.settings.keyBindings = (storage.keyBindings || window.VSC.Constants.DEFAULT_SETTINGS.keyBindings).map(VideoSpeedConfig.normalizeKeyBinding);
          if (!storage.keyBindings || storage.keyBindings.length === 0) {
            window.VSC.logger.info("First initialization - setting up default key bindings");
            this.settings.keyBindings = [...window.VSC.Constants.DEFAULT_SETTINGS.keyBindings];
            await this.save({ keyBindings: this.settings.keyBindings });
          }
          if (storage.blacklist !== null && storage.blacklist !== void 0 && !storage.siteRules) {
            const regStrip2 = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
            storage.siteRules = storage.blacklist.split("\n").map((l) => l.replace(regStrip2, "")).filter(Boolean).map((pattern) => ({ pattern, enabled: false, speed: null }));
            await this.save({ siteRules: storage.siteRules });
            window.VSC.logger.info("Migrated blacklist to siteRules");
          } else if (storage.blacklist !== null && storage.blacklist !== void 0 && storage.siteRules) {
          }
          this.settings.siteRules = storage.siteRules || window.VSC.Constants.DEFAULT_SETTINGS.siteRules;
          this.settings.siteDefaultSpeed = null;
          if (window.VSC.matchSiteRule) {
            const matched = window.VSC.matchSiteRule(this.settings.siteRules, window.location.href);
            if (matched && matched.speed !== null && matched.speed !== void 0) {
              this.settings.siteDefaultSpeed = matched.speed;
              window.VSC.logger.info(
                `Site rule matched: pattern="${matched.pattern}", speed=${matched.speed}`
              );
            }
          }
          this.settings.rememberSpeed = Boolean(storage.rememberSpeed);
          if (this.settings.siteDefaultSpeed) {
            this.settings.lastSpeed = this.settings.siteDefaultSpeed;
          } else if (this.settings.rememberSpeed) {
            this.settings.lastSpeed = Number(storage.lastSpeed) || null;
          } else {
            this.settings.lastSpeed = null;
          }
          this.settings.exclusiveKeys = Boolean(storage.exclusiveKeys);
          this.settings.audioBoolean = Boolean(storage.audioBoolean);
          this.settings.startHidden = Boolean(storage.startHidden);
          this.settings.controllerOpacity = Number(storage.controllerOpacity);
          this.settings.controllerButtonSize = Number(storage.controllerButtonSize);
          if (storage.controllerCSS !== null) {
            window.VSC.StorageManager.remove(["controllerCSS"]);
          }
          this.settings.customCSS = storage.customCSS ?? "";
          this.settings.logLevel = Number(
            storage.logLevel || window.VSC.Constants.DEFAULT_SETTINGS.logLevel
          );
          window.VSC.logger.setVerbosity(this.settings.logLevel);
          window.VSC.logger.info("Settings loaded successfully");
          return this.settings;
        } catch (error) {
          window.VSC.logger.error(`Failed to load settings: ${error.message}`);
          return window.VSC.Constants.DEFAULT_SETTINGS;
        }
      }
      /**
       * Save settings to Chrome storage
       *
       * IMPORTANT: Only the keys present in newSettings are written to storage.
       * This avoids the "stale full-blob write" race condition where two contexts
       * (e.g. options page + content script) each hold their own in-memory copy
       * and overwrite each other's changes.  chrome.storage.sync.set({key: val})
       * atomically merges — it updates only the supplied keys and leaves the
       * rest untouched.
       *
       * In-memory settings are updated immediately regardless of persistence
       * outcome — the current session should always reflect the user's intent.
       * Returns false only when the storage write observably fails (options page
       * context with direct chrome.storage access). In page context, the
       * postMessage bridge is fire-and-forget so failures are invisible here.
       *
       * @param {Object} newSettings - Settings to save (only these keys are written)
       * @returns {Promise<boolean>} true if persisted (or debounced), false on storage failure
       */
      /**
       * Commit a speed as the SESSION authority (in-memory lastSpeed) and
       * persist it when the user asked us to remember speed. Executes the
       * arbiter's PERSIST effect (cells 2/5/7/12). Persistence purity (I2)
       * holds by construction: only user-attributed choices reach this —
       * lifecycle, fight and observe paths never call it.
       * @param {number} speed
       */
      persistAuthority(speed) {
        this.settings.lastSpeed = speed;
        if (this.settings.rememberSpeed) {
          this.save({ lastSpeed: speed });
        }
      }
      async save(newSettings = {}) {
        const keys = Object.keys(newSettings);
        if (keys.length === 0) {
          return true;
        }
        if (!this._loaded) {
          window.VSC.logger.error(
            "save() called before load() \u2014 refusing to overwrite user data with defaults"
          );
          return false;
        }
        this.settings = { ...this.settings, ...newSettings };
        if (keys.length === 1 && keys[0] === "lastSpeed") {
          this.pendingSave = newSettings.lastSpeed;
          if (this.saveTimer) {
            clearTimeout(this.saveTimer);
          }
          this.saveTimer = setTimeout(async () => {
            const speedToSave = this.pendingSave;
            this.pendingSave = null;
            this.saveTimer = null;
            try {
              await window.VSC.StorageManager.set({ lastSpeed: speedToSave });
              window.VSC.logger.info("Debounced speed setting saved successfully");
            } catch (error) {
              window.VSC.logger.error(`Failed to persist speed: ${error.message}`);
            }
          }, this.SAVE_DELAY);
          return true;
        }
        try {
          await window.VSC.StorageManager.set(newSettings);
        } catch (error) {
          window.VSC.logger.error(`Failed to save settings: ${error.message}`);
          return false;
        }
        if (newSettings.logLevel !== void 0) {
          window.VSC.logger.setVerbosity(this.settings.logLevel);
        }
        window.VSC.logger.info("Settings saved successfully");
        return true;
      }
      /**
       * Get a specific key binding
       * @param {string} action - Action name
       * @param {string} property - Property to get (default: 'value')
       * @returns {*} Key binding property value
       */
      getKeyBinding(action, property = "value") {
        try {
          const binding = this.settings.keyBindings.find((item) => item.action === action);
          return binding ? binding[property] : false;
        } catch (e) {
          window.VSC.logger.error(`Failed to get key binding for ${action}: ${e.message}`);
          return false;
        }
      }
      /**
       * Set a key binding value with validation
       * @param {string} action - Action name
       * @param {*} value - Value to set
       */
      setKeyBinding(action, value) {
        try {
          const binding = this.settings.keyBindings.find((item) => item.action === action);
          if (!binding) {
            window.VSC.logger.warn(`No key binding found for action: ${action}`);
            return;
          }
          if (["reset", "fast", "slower", "faster"].includes(action)) {
            if (typeof value !== "number" || isNaN(value)) {
              window.VSC.logger.warn(`Invalid numeric value for ${action}: ${value}`);
              return;
            }
          }
          binding.value = value;
          window.VSC.logger.debug(`Updated key binding ${action} to ${value}`);
        } catch (e) {
          window.VSC.logger.error(`Failed to set key binding for ${action}: ${e.message}`);
        }
      }
      /**
       * Normalize a key binding's modifiers to strict booleans.
       * Strips the modifiers object entirely when all values are falsy.
       * Defensive against corrupt storage data (e.g., modifiers: { shift: 1 }).
       * @param {Object} binding
       * @returns {Object} Sanitized binding (shallow copy)
       * @private
       */
      static normalizeKeyBinding(binding) {
        if (!binding || !binding.modifiers) {
          return binding;
        }
        const m = binding.modifiers;
        const normalized = {
          shift: Boolean(m.shift),
          ctrl: Boolean(m.ctrl),
          alt: Boolean(m.alt),
          meta: Boolean(m.meta)
        };
        const result = { ...binding };
        if (normalized.shift || normalized.ctrl || normalized.alt || normalized.meta) {
          result.modifiers = normalized;
        } else {
          delete result.modifiers;
        }
        return result;
      }
    }
    window.VSC.videoSpeedConfig = new VideoSpeedConfig();
    window.VSC.VideoSpeedConfig = VideoSpeedConfig;
  }

  // src/core/state-manager.js
  window.VSC = window.VSC || {};
  var VSCStateManager = class {
    constructor() {
      this.controllers = /* @__PURE__ */ new Map();
      window.VSC.logger?.debug("VSCStateManager initialized");
    }
    /**
     * Register a new controller
     * @param {VideoController} controller - Controller instance to register
     */
    registerController(controller) {
      if (!controller || !controller.controllerId) {
        window.VSC.logger?.warn("Invalid controller registration attempt");
        return;
      }
      const controllerInfo = {
        controller,
        element: controller.video,
        tagName: controller.video?.tagName,
        videoSrc: controller.video?.src || controller.video?.currentSrc,
        created: Date.now()
      };
      this.controllers.set(controller.controllerId, controllerInfo);
      window.VSC.logger?.debug(`Controller registered: ${controller.controllerId}`);
    }
    /**
     * Unregister a controller
     * @param {string} controllerId - ID of controller to unregister
     */
    unregisterController(controllerId) {
      if (this.controllers.has(controllerId)) {
        this.controllers.delete(controllerId);
        window.VSC.logger?.debug(`Controller unregistered: ${controllerId}`);
      }
    }
    /**
     * Get all registered media elements
     * @returns {Array<HTMLMediaElement>} Array of media elements
     */
    getAllMediaElements() {
      const elements = [];
      for (const [id, info] of this.controllers) {
        const video = info.controller?.video || info.element;
        if (video && video.isConnected) {
          elements.push(video);
        } else {
          this.controllers.delete(id);
        }
      }
      return elements;
    }
    /**
     * Get a media element by controller ID
     * @param {string} controllerId - Controller ID
     * @returns {HTMLMediaElement|null} Media element or null
     */
    getMediaByControllerId(controllerId) {
      const info = this.controllers.get(controllerId);
      return info?.controller?.video || info?.element || null;
    }
    /**
     * Get the first available media element
     * @returns {HTMLMediaElement|null} First media element or null
     */
    getFirstMedia() {
      const elements = this.getAllMediaElements();
      return elements[0] || null;
    }
    /**
     * Check if any controllers are registered
     * @returns {boolean} True if controllers exist
     */
    hasControllers() {
      return this.controllers.size > 0;
    }
    /**
     * Compatibility method - same as unregisterController
     * @param {string} controllerId - ID of controller to remove
     */
    removeController(controllerId) {
      this.unregisterController(controllerId);
    }
    /**
     * Compatibility method - same as getAllMediaElements
     * @returns {Array<HTMLMediaElement>} Array of media elements
     */
    getControlledElements() {
      return this.getAllMediaElements();
    }
  };
  window.VSC.StateManager = VSCStateManager;
  window.VSC.stateManager = new VSCStateManager();
  window.VSC.logger?.info("State Manager module loaded");

  // src/observers/media-observer.js
  window.VSC = window.VSC || {};
  var MediaElementObserver = class {
    constructor(config, siteHandler) {
      this.config = config;
      this.siteHandler = siteHandler;
    }
    /**
     * Scan document for existing media elements
     * @param {Document} document - Document to scan
     * @returns {Array<HTMLMediaElement>} Found media elements
     */
    scanForMedia(document2) {
      const mediaElements = [];
      const audioEnabled = this.config.settings.audioBoolean;
      const mediaTagSelector = audioEnabled ? "video,audio" : "video";
      const regularMedia = Array.from(document2.querySelectorAll(mediaTagSelector));
      mediaElements.push(...regularMedia);
      function findShadowMedia(root, selector) {
        const results = [];
        results.push(...root.querySelectorAll(selector));
        root.querySelectorAll("*").forEach((element) => {
          if (element.shadowRoot) {
            results.push(...findShadowMedia(element.shadowRoot, selector));
          }
        });
        return results;
      }
      const shadowMedia = findShadowMedia(document2, mediaTagSelector);
      mediaElements.push(...shadowMedia);
      const siteSpecificMedia = this.siteHandler.detectSpecialVideos(document2);
      mediaElements.push(...siteSpecificMedia);
      const filteredMedia = mediaElements.filter((media) => {
        return !this.siteHandler.shouldIgnoreVideo(media);
      });
      window.VSC.logger.info(
        `Found ${filteredMedia.length} media elements (${mediaElements.length} total, ${mediaElements.length - filteredMedia.length} filtered out)`
      );
      return filteredMedia;
    }
    /**
     * Lightweight scan that avoids expensive shadow DOM traversal
     * Used during initial load to avoid blocking page performance
     * @param {Document} document - Document to scan
     * @returns {Array<HTMLMediaElement>} Found media elements
     */
    scanForMediaLight(document2) {
      const mediaElements = [];
      const audioEnabled = this.config.settings.audioBoolean;
      const mediaTagSelector = audioEnabled ? "video,audio" : "video";
      try {
        const regularMedia = Array.from(document2.querySelectorAll(mediaTagSelector));
        mediaElements.push(...regularMedia);
        const siteSpecificMedia = this.siteHandler.detectSpecialVideos(document2);
        mediaElements.push(...siteSpecificMedia);
        const filteredMedia = mediaElements.filter((media) => {
          return !this.siteHandler.shouldIgnoreVideo(media);
        });
        window.VSC.logger.info(
          `Light scan found ${filteredMedia.length} media elements (${mediaElements.length} total, ${mediaElements.length - filteredMedia.length} filtered out)`
        );
        return filteredMedia;
      } catch (error) {
        window.VSC.logger.error(`Light media scan failed: ${error.message}`);
        return [];
      }
    }
    /**
     * Scan iframes for media elements
     * @param {Document} document - Document to scan
     * @returns {Array<HTMLMediaElement>} Found media elements in iframes
     */
    scanIframes(document2) {
      const mediaElements = [];
      const frameTags = document2.getElementsByTagName("iframe");
      Array.prototype.forEach.call(frameTags, (frame) => {
        try {
          const childDocument = frame.contentDocument;
          if (childDocument) {
            const iframeMedia = this.scanForMedia(childDocument);
            mediaElements.push(...iframeMedia);
            window.VSC.logger.debug(`Found ${iframeMedia.length} media elements in iframe`);
          }
        } catch (e) {
          window.VSC.logger.debug(`Cannot access iframe content (cross-origin): ${e.message}`);
        }
      });
      return mediaElements;
    }
    /**
     * Get media elements using site-specific container selectors
     * @param {Document} document - Document to scan
     * @returns {Array<HTMLMediaElement>} Found media elements
     */
    scanSiteSpecificContainers(document2) {
      const mediaElements = [];
      const containerSelectors = this.siteHandler.getVideoContainerSelectors();
      const audioEnabled = this.config.settings.audioBoolean;
      containerSelectors.forEach((selector) => {
        try {
          const containers = document2.querySelectorAll(selector);
          containers.forEach((container) => {
            const containerMedia = window.VSC.DomUtils.findMediaElements(container, audioEnabled);
            mediaElements.push(...containerMedia);
          });
        } catch (e) {
          window.VSC.logger.warn(`Invalid selector "${selector}": ${e.message}`);
        }
      });
      return mediaElements;
    }
    /**
     * Comprehensive scan for all media elements
     * @param {Document} document - Document to scan
     * @returns {Array<HTMLMediaElement>} All found media elements
     */
    scanAll(document2) {
      const allMedia = [];
      const regularMedia = this.scanForMedia(document2);
      allMedia.push(...regularMedia);
      const containerMedia = this.scanSiteSpecificContainers(document2);
      allMedia.push(...containerMedia);
      const iframeMedia = this.scanIframes(document2);
      allMedia.push(...iframeMedia);
      const uniqueMedia = [...new Set(allMedia)];
      window.VSC.logger.info(`Total unique media elements found: ${uniqueMedia.length}`);
      return uniqueMedia;
    }
    /**
     * Check if media element is valid for controller attachment
     * @param {HTMLMediaElement} media - Media element to check
     * @returns {boolean} True if valid
     */
    isValidMediaElement(media) {
      if (!media.isConnected) {
        window.VSC.logger.debug("Video not in DOM");
        return false;
      }
      if (media.tagName === "AUDIO" && !this.config.settings.audioBoolean) {
        window.VSC.logger.debug("Audio element rejected - audioBoolean disabled");
        return false;
      }
      if (this.siteHandler.shouldIgnoreVideo(media)) {
        window.VSC.logger.debug("Video ignored by site handler");
        return false;
      }
      return true;
    }
    /**
     * Check if media element should start with hidden controller
     * @param {HTMLMediaElement} media - Media element to check
     * @returns {boolean} True if controller should start hidden
     */
    shouldStartHidden(media) {
      if (media.tagName === "AUDIO") {
        if (!this.config.settings.audioBoolean) {
          window.VSC.logger.debug("Audio controller hidden - audio support disabled");
          return true;
        }
        if (media.disabled || media.style.pointerEvents === "none") {
          window.VSC.logger.debug("Audio controller hidden - element disabled or no pointer events");
          return true;
        }
        window.VSC.logger.debug(
          "Audio controller will start visible (audio elements can be invisible but functional)"
        );
        return false;
      }
      const style = window.getComputedStyle(media);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        window.VSC.logger.debug("Video not visible, controller will start hidden");
        return true;
      }
      return false;
    }
    /**
     * Find the best parent element for controller positioning
     * @param {HTMLMediaElement} media - Media element
     * @returns {HTMLElement} Parent element for positioning
     */
    findControllerParent(media) {
      const positioning = this.siteHandler.getControllerPosition(media.parentElement, media);
      return positioning.targetParent || media.parentElement;
    }
  };
  window.VSC.MediaElementObserver = MediaElementObserver;

  // src/observers/mutation-observer.js
  window.VSC = window.VSC || {};
  var VideoMutationObserver = class {
    constructor(config, onVideoFound, onVideoRemoved, mediaObserver) {
      this.config = config;
      this.onVideoFound = onVideoFound;
      this.onVideoRemoved = onVideoRemoved;
      this.mediaObserver = mediaObserver;
      this.observer = null;
      this.shadowObservers = /* @__PURE__ */ new Set();
    }
    /**
     * Start observing DOM mutations
     * @param {Document} document - Document to observe
     */
    start(document2) {
      this.observer = new MutationObserver((mutations) => {
        requestIdleCallback(() => {
          this.processMutations(mutations);
        });
      });
      const observerOptions = {
        attributeFilter: ["aria-hidden", "data-focus-method", "style", "class"],
        childList: true,
        subtree: true
      };
      this.observer.observe(document2, observerOptions);
      window.VSC.logger.debug("Video mutation observer started");
    }
    /**
     * Process mutation events
     * @param {Array<MutationRecord>} mutations - Mutation records
     * @private
     */
    processMutations(mutations) {
      mutations.forEach((mutation) => {
        switch (mutation.type) {
          case "childList":
            this.processChildListMutation(mutation);
            break;
          case "attributes":
            this.processAttributeMutation(mutation);
            break;
        }
      });
    }
    /**
     * Process child list mutations (added/removed nodes)
     * @param {MutationRecord} mutation - Mutation record
     * @private
     */
    processChildListMutation(mutation) {
      mutation.addedNodes.forEach((node) => {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        if (node === document.documentElement) {
          window.VSC.logger.debug("Document was replaced, reinitializing");
          this.onDocumentReplaced();
          return;
        }
        this.checkForVideoAndShadowRoot(node, node.parentNode || mutation.target, true);
      });
      mutation.removedNodes.forEach((node) => {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }
        this.checkForVideoAndShadowRoot(node, node.parentNode || mutation.target, false);
      });
    }
    /**
     * Process attribute mutations
     * @param {MutationRecord} mutation - Mutation record
     * @private
     */
    processAttributeMutation(mutation) {
      if (mutation.attributeName === "style" || mutation.attributeName === "class") {
        this.handleVisibilityChanges(mutation.target);
      }
      if (mutation.target.attributes["aria-hidden"] && mutation.target.attributes["aria-hidden"].value === "false" || mutation.target.nodeName === "APPLE-TV-PLUS-PLAYER") {
        const flattenedNodes = window.VSC.DomUtils.getShadow(document.body);
        const videoNodes = flattenedNodes.filter((x) => x.tagName === "VIDEO");
        for (const node of videoNodes) {
          if (node.vsc && mutation.target.nodeName === "APPLE-TV-PLUS-PLAYER") {
            continue;
          }
          if (node.vsc) {
            node.vsc.remove();
          }
          this.checkForVideoAndShadowRoot(node, node.parentNode || mutation.target, true);
        }
      }
    }
    /**
     * Handle visibility changes on elements that might contain videos
     * @param {Element} element - Element that had style/class changes
     * @private
     */
    handleVisibilityChanges(element) {
      if (element.tagName === "VIDEO" || element.tagName === "AUDIO" && this.config.settings.audioBoolean) {
        this.recheckVideoElement(element);
        return;
      }
      const audioEnabled = this.config.settings.audioBoolean;
      const mediaTagSelector = audioEnabled ? "video,audio" : "video";
      const videos = element.querySelectorAll ? element.querySelectorAll(mediaTagSelector) : [];
      videos.forEach((video) => {
        this.recheckVideoElement(video);
      });
    }
    /**
     * Re-check if a video element should have a controller attached
     * @param {HTMLMediaElement} video - Video element to recheck
     * @private
     */
    recheckVideoElement(video) {
      if (!this.mediaObserver) {
        return;
      }
      if (video.vsc) {
        if (!this.mediaObserver.isValidMediaElement(video)) {
          window.VSC.logger.debug("Video became invalid, removing controller");
          video.vsc.remove();
          video.vsc = null;
        } else {
          video.vsc.updateVisibility();
        }
      } else {
        if (this.mediaObserver.isValidMediaElement(video)) {
          window.VSC.logger.debug("Video became valid, attaching controller");
          this.onVideoFound(video, video.parentElement || video.parentNode);
        }
      }
    }
    /**
     * Check if node is or contains video elements
     * @param {Node} node - Node to check
     * @param {Node} parent - Parent node
     * @param {boolean} added - True if node was added, false if removed
     * @private
     */
    checkForVideoAndShadowRoot(node, parent, added) {
      if (!added && document.body?.contains(node)) {
        return;
      }
      if (node.nodeName === "VIDEO" || node.nodeName === "AUDIO" && this.config.settings.audioBoolean) {
        if (added) {
          this.onVideoFound(node, parent);
        } else {
          this.onVideoRemoved(node);
        }
      } else {
        this.processNodeChildren(node, parent, added);
      }
    }
    /**
     * Process children of a node recursively
     * @param {Node} node - Node to process
     * @param {Node} parent - Parent node
     * @param {boolean} added - True if node was added
     * @private
     */
    processNodeChildren(node, parent, added) {
      let children = [];
      if (node.shadowRoot) {
        this.observeShadowRoot(node.shadowRoot);
        children = Array.from(node.shadowRoot.children);
      }
      if (node.children) {
        children = [...children, ...Array.from(node.children)];
      }
      for (const child of children) {
        this.checkForVideoAndShadowRoot(child, child.parentNode || parent, added);
      }
    }
    /**
     * Set up observer for shadow root
     * @param {ShadowRoot} shadowRoot - Shadow root to observe
     * @private
     */
    observeShadowRoot(shadowRoot) {
      if (this.shadowObservers.has(shadowRoot)) {
        return;
      }
      const shadowObserver = new MutationObserver((mutations) => {
        requestIdleCallback(
          () => {
            this.processMutations(mutations);
          },
          { timeout: 500 }
        );
      });
      const observerOptions = {
        attributeFilter: ["aria-hidden", "data-focus-method"],
        childList: true,
        subtree: true
      };
      shadowObserver.observe(shadowRoot, observerOptions);
      this.shadowObservers.add(shadowRoot);
      window.VSC.logger.debug("Shadow root observer added");
    }
    /**
     * Handle document replacement
     * @private
     */
    onDocumentReplaced() {
      window.VSC.logger.warn("Document replacement detected - full reinitialization needed");
    }
    /**
     * Stop observing and clean up
     */
    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.shadowObservers.forEach((_shadowRoot) => {
      });
      this.shadowObservers.clear();
      window.VSC.logger.debug("Video mutation observer stopped");
    }
  };
  window.VSC.VideoMutationObserver = VideoMutationObserver;

  // src/core/action-handler.js
  window.VSC = window.VSC || {};
  var ActionHandler = class {
    constructor(config, eventManager) {
      this.config = config;
      this.eventManager = eventManager;
    }
    /**
     * Create the short-lived context shared by every controlled media target of
     * one user command. A bulk keyboard/popup action starts one authority epoch,
     * not one epoch per target, while each target still receives its local
     * USER_SET transition.
     * @returns {{hasClaimedAuthority: boolean}}
     */
    createAuthorityBatch() {
      return { hasClaimedAuthority: false };
    }
    /**
     * Execute an action on media elements
     * @param {string} action - Action to perform
     * @param {*} value - Action value
     * @param {Event} e - Event object (optional)
     */
    runAction(action, value, e) {
      const mediaTags = window.VSC.stateManager ? window.VSC.stateManager.getControlledElements() : [];
      let targetController = null;
      if (e) {
        targetController = e.target.getRootNode().host;
      }
      const authorityBatch = this.createAuthorityBatch();
      mediaTags.forEach((v) => {
        const controller = v.vsc?.div;
        if (!controller) {
          return;
        }
        if (e && targetController && !(targetController === controller)) {
          return;
        }
        if (!v.classList.contains("vsc-cancelled")) {
          this.executeAction(action, value, v, e, { authorityBatch });
        }
      });
    }
    /**
     * Execute specific action on a video element
     * @param {string} action - Action to perform
     * @param {*} value - Action value
     * @param {HTMLMediaElement} video - Video element
     * @param {Event} e - Event object (optional)
     * @param {{authorityBatch?: {hasClaimedAuthority: boolean}}} [options]
     * @private
     */
    executeAction(action, value, video, e, options = {}) {
      switch (action) {
        case "rewind":
          window.VSC.logger.debug("Rewind");
          this.seek(video, -value);
          break;
        case "advance":
          window.VSC.logger.debug("Fast forward");
          this.seek(video, value);
          break;
        case "faster": {
          window.VSC.logger.debug("Increase speed");
          this.adjustSpeed(video, value, { relative: true, authorityBatch: options.authorityBatch });
          break;
        }
        case "slower": {
          window.VSC.logger.debug("Decrease speed");
          this.adjustSpeed(video, -value, { relative: true, authorityBatch: options.authorityBatch });
          break;
        }
        case "reset":
          window.VSC.logger.debug("Reset speed");
          this.resetSpeed(video, value, this.config.getKeyBinding("fast"), options);
          break;
        case "display":
          window.VSC.logger.debug("Display action triggered");
          this.toggleControllerVisibility(video);
          break;
        case "blink":
          window.VSC.logger.debug("Showing controller momentarily");
          this.flashController(video.vsc.div, value);
          break;
        case "drag":
          window.VSC.DragHandler.handleDrag(video, e);
          break;
        case "fast":
          window.VSC.logger.debug("Preferred speed");
          this.resetSpeed(video, value, this.config.getKeyBinding("reset"), options);
          break;
        case "pause":
          this.pause(video);
          break;
        case "muted":
          this.muted(video);
          break;
        case "louder":
          this.volumeUp(video, value);
          break;
        case "softer":
          this.volumeDown(video, value);
          break;
        case "mark":
          this.setMark(video);
          break;
        case "jump":
          this.jumpToMark(video);
          break;
        case "SET_SPEED":
          window.VSC.logger.info("Setting speed to:", value);
          this.adjustSpeed(video, value, { authorityBatch: options.authorityBatch });
          break;
        case "ADJUST_SPEED":
          window.VSC.logger.info("Adjusting speed by:", value);
          this.adjustSpeed(video, value, { relative: true, authorityBatch: options.authorityBatch });
          break;
        case "RESET_SPEED": {
          window.VSC.logger.info("Resetting speed");
          const preferredSpeed = this.config.getKeyBinding("fast") || 1;
          this.adjustSpeed(video, preferredSpeed, { authorityBatch: options.authorityBatch });
          break;
        }
        default:
          window.VSC.logger.warn(`Unknown action: ${action}`);
      }
    }
    /**
     * Toggle an explicit visibility override without mutating the automatic
     * state maintained by startHidden, media visibility, and site autohide.
     * The first toggle opposes rendered AUTO; later toggles alternate persistent
     * SHOW/HIDE intent so player autohide cannot silently retake control.
     * @param {HTMLMediaElement} video - Media element whose controller is toggled
     */
    toggleControllerVisibility(video) {
      const controller = video.vsc?.div;
      if (!controller) {
        window.VSC.logger.error("No controller found for video");
        return;
      }
      const visibility = window.VSC.ControllerVisibility;
      const currentOverride = visibility.normalizeOverride(controller.dataset.vscVisibility);
      const isVisible = currentOverride === visibility.OVERRIDES.AUTO ? this.isControllerVisible(controller) : void 0;
      const nextOverride = currentOverride === visibility.OVERRIDES.AUTO && isVisible === null ? null : visibility.nextOverride(currentOverride, isVisible);
      if (controller.flashTimer !== void 0) {
        clearTimeout(controller.flashTimer);
        controller.flashTimer = void 0;
      }
      controller.classList.remove("vsc-show");
      if (nextOverride !== null) {
        controller.dataset.vscVisibility = nextOverride;
      }
    }
    /**
     * Read rendered shadow-controller visibility. This intentionally consults
     * computed style so site CSS remains the single source of autohide truth.
     * Opacity is excluded because site fade transitions pass through zero while
     * visibility provides the discrete state needed by the toggle contract.
     * @param {HTMLElement} controller - The vsc-controller host
     * @returns {boolean|null} Whether it is rendered, or null when unavailable
     */
    isControllerVisible(controller) {
      const innerController = controller.shadowRoot ? window.VSC.ShadowDOMManager.getController(controller.shadowRoot) : null;
      if (!innerController) {
        window.VSC.logger.error("Controller shadow content not found");
        return null;
      }
      const hostStyle = window.getComputedStyle(controller);
      const innerStyle = window.getComputedStyle(innerController);
      return hostStyle.display !== "none" && hostStyle.visibility !== "hidden" && innerStyle.display !== "none" && innerStyle.visibility !== "hidden";
    }
    /**
     * Seek video by specified seconds
     * @param {HTMLMediaElement} video - Video element
     * @param {number} seekSeconds - Seconds to seek
     */
    seek(video, seekSeconds) {
      window.VSC.siteHandlerManager.handleSeek(video, seekSeconds);
    }
    /**
     * Toggle pause/play
     * @param {HTMLMediaElement} video - Video element
     */
    pause(video) {
      if (video.paused) {
        window.VSC.logger.debug("Resuming video");
        video.play();
      } else {
        window.VSC.logger.debug("Pausing video");
        video.pause();
      }
    }
    /**
     * Reset speed with memory toggle functionality.
     *
     * Behavior:
     *   - Not at target → remember current speed, jump to target.
     *   - At target with memory → restore remembered speed, clear memory.
     *   - At target without memory → cross-toggle to the other action's speed
     *     (e.g. reset at 1.0x jumps to preferred speed, preferred at 1.8x jumps to reset speed).
     *
     * @param {HTMLMediaElement} video - Video element
     * @param {number} target - Target speed for this action
     * @param {number} [crossTarget] - Target speed of the paired action (for cross-toggle)
     * @param {{authorityBatch?: {hasClaimedAuthority: boolean}}} [options]
     */
    resetSpeed(video, target, crossTarget, options = {}) {
      if (!video.vsc) {
        window.VSC.logger.warn("resetSpeed called on video without controller");
        return;
      }
      const currentSpeed = video.playbackRate;
      if (currentSpeed === target) {
        if (video.vsc.speedBeforeReset !== null) {
          window.VSC.logger.info(`Restoring remembered speed: ${video.vsc.speedBeforeReset}`);
          const rememberedSpeed = video.vsc.speedBeforeReset;
          video.vsc.speedBeforeReset = null;
          this.adjustSpeed(video, rememberedSpeed, options);
        } else if (crossTarget && crossTarget !== target) {
          window.VSC.logger.info(`Cross-toggle from ${target} to ${crossTarget}`);
          video.vsc.speedBeforeReset = currentSpeed;
          this.adjustSpeed(video, crossTarget, options);
        } else {
          this.adjustSpeed(video, target, options);
        }
      } else {
        window.VSC.logger.info(`Remembering speed ${currentSpeed} and resetting to ${target}`);
        video.vsc.speedBeforeReset = currentSpeed;
        this.adjustSpeed(video, target, options);
      }
    }
    /**
     * Toggle mute
     * @param {HTMLMediaElement} video - Video element
     */
    muted(video) {
      video.muted = video.muted !== true;
    }
    /**
     * Increase volume
     * @param {HTMLMediaElement} video - Video element
     * @param {number} value - Amount to increase
     */
    volumeUp(video, value) {
      video.volume = Math.min(1, (video.volume + value).toFixed(2));
    }
    /**
     * Decrease volume
     * @param {HTMLMediaElement} video - Video element
     * @param {number} value - Amount to decrease
     */
    volumeDown(video, value) {
      video.volume = Math.max(0, (video.volume - value).toFixed(2));
    }
    /**
     * Set time marker
     * @param {HTMLMediaElement} video - Video element
     */
    setMark(video) {
      window.VSC.logger.debug("Adding marker");
      video.vsc.mark = video.currentTime;
    }
    /**
     * Jump to time marker, or jump back to previous position if already at marker
     * @param {HTMLMediaElement} video - Video element
     */
    jumpToMark(video) {
      if (video.vsc.mark === null || video.vsc.mark === void 0 || typeof video.vsc.mark !== "number") {
        return;
      }
      const currentTime = video.currentTime;
      if (video.vsc.positionBeforeJump !== null && Math.abs(currentTime - video.vsc.mark) < 0.05) {
        window.VSC.logger.debug("Jumping back to pre-marker position");
        video.currentTime = video.vsc.positionBeforeJump;
        video.vsc.positionBeforeJump = null;
      } else {
        window.VSC.logger.debug("Jumping to marker");
        video.vsc.positionBeforeJump = currentTime;
        video.currentTime = video.vsc.mark;
      }
    }
    /**
     * Flash controller briefly for visual feedback.
     * Single entry point for all temporary visibility — replaces both
     * blinkController and EventManager.showController.
     * @param {HTMLElement} controller - Controller element
     * @param {number} duration - Duration in ms (default 2000)
     */
    flashController(controller, duration) {
      const visibility = window.VSC.ControllerVisibility;
      const override = visibility.normalizeOverride(controller.dataset.vscVisibility);
      if (!visibility.allowsFlash({
        attached: true,
        startHidden: this.config.settings.startHidden,
        override
      })) {
        const reason = this.config.settings.startHidden ? "startHidden preference" : "user hide";
        window.VSC.logger.debug(`flashController skipped: ${reason}`);
        return;
      }
      const isAudioController = this.isAudioController(controller);
      if (controller.flashTimer !== void 0) {
        clearTimeout(controller.flashTimer);
        controller.flashTimer = void 0;
      }
      controller.classList.add("vsc-show");
      window.VSC.logger.debug("Showing controller temporarily with vsc-show class");
      if (!isAudioController) {
        controller.flashTimer = setTimeout(() => {
          controller.classList.remove("vsc-show");
          controller.flashTimer = void 0;
          window.VSC.logger.debug("Removing vsc-show class after flash timeout");
        }, duration || 2e3);
      } else {
        window.VSC.logger.debug("Audio controller flash - keeping vsc-show class");
      }
    }
    /**
     * Check if controller is associated with an audio element
     * @param {HTMLElement} controller - Controller element
     * @returns {boolean} True if associated with audio element
     * @private
     */
    isAudioController(controller) {
      const mediaElements = window.VSC.stateManager ? window.VSC.stateManager.getControlledElements() : [];
      for (const media of mediaElements) {
        if (media.vsc && media.vsc.div === controller) {
          return media.tagName === "AUDIO";
        }
      }
      return false;
    }
    /**
     * Adjust video playback speed (absolute or relative).
     *
     * This IS the USER_SET event (contract cells 5/12): every caller is a
     * user acting through VSC — shortcuts, controller UI, popup, wheel. The
     * arbiter's USER_SET row is unconditional, so no classification happens
     * here; the effect row (PERSIST, WRITE, SYNC_UI) executes in
     * _adjustSpeedInternal. Non-user speed changes never come through this
     * method: lifecycle restores call writeRate/syncIndicator directly, and
     * external rates are decided by SpeedArbitration.onExternalRate.
     *
     * @param {HTMLMediaElement} video - Target video element
     * @param {number} value - Speed value (absolute) or delta (relative)
     * @param {Object} options - Configuration options
     * @param {boolean} options.relative - If true, value is a delta; if false, absolute speed
     * @param {{hasClaimedAuthority: boolean}} [options.authorityBatch] - Shared batch context for a bulk user command
     */
    adjustSpeed(video, value, options = {}) {
      return window.VSC.logger.withContext(video, () => {
        if (!video || !video.vsc) {
          window.VSC.logger.warn("adjustSpeed called on video without controller");
          return;
        }
        if (typeof value !== "number" || isNaN(value)) {
          window.VSC.logger.warn("adjustSpeed called with invalid value:", value);
          return;
        }
        return this._adjustSpeedInternal(video, value, options);
      });
    }
    /**
     * Internal adjustSpeed implementation (context already set)
     * @private
     */
    _adjustSpeedInternal(video, value, options) {
      const { relative = false, authorityBatch } = options;
      let targetSpeed;
      if (relative) {
        const currentSpeed = video.playbackRate < 0.1 ? 0 : video.playbackRate;
        targetSpeed = currentSpeed + value;
        if (currentSpeed > 1 && targetSpeed < 1 || currentSpeed < 1 && targetSpeed > 1) {
          targetSpeed = 1;
        }
        window.VSC.logger.debug(
          `Relative speed calculation: currentSpeed=${currentSpeed} + ${value} = ${targetSpeed}`
        );
      } else {
        targetSpeed = value;
        window.VSC.logger.debug(`Absolute speed set: ${targetSpeed}`);
      }
      targetSpeed = Math.min(
        Math.max(targetSpeed, window.VSC.Constants.SPEED_LIMITS.MIN),
        window.VSC.Constants.SPEED_LIMITS.MAX
      );
      targetSpeed = Number(targetSpeed.toFixed(2));
      if (this.eventManager?.arbitration) {
        this.eventManager.arbitration.noteUserSet(video, targetSpeed, {
          startsAuthorityEpoch: !authorityBatch || !authorityBatch.hasClaimedAuthority
        });
        if (authorityBatch) {
          authorityBatch.hasClaimedAuthority = true;
        }
      } else {
        this.config.persistAuthority(targetSpeed);
      }
      this.writeRate(video, targetSpeed);
      this.syncIndicator(video, targetSpeed);
    }
    /**
     * Get user's preferred speed, respecting rememberSpeed setting.
     * @returns {number} Preferred speed (lastSpeed when remembering, 1.0 otherwise)
     */
    getPreferredSpeed() {
      if (this.config.settings.rememberSpeed) {
        return this.config.settings.lastSpeed || 1;
      }
      return 1;
    }
    /**
     * WRITE effect primitive: set the register (video.playbackRate) through
     * the per-site strategy, first registering the value with the in-flight
     * write registry so the native ratechange echo is filtered
     * (SpeedArbitration.noteWrite/consumeEcho) instead of being classified
     * as an external change.
     *
     * A same-value assignment fires no ratechange (per spec), so no token is
     * taken for it — lifecycle re-asserts on every play/seeked would
     * otherwise accumulate stale tokens.
     *
     * Never touches authority (lastSpeed) or the UI: callers compose this
     * with persistAuthority/syncIndicator per the contract's effect rows.
     *
     * @param {HTMLMediaElement} video - Video element
     * @param {number} rate - Target speed
     * @param {{suppressEchoPropagation?: boolean}} [options]
     */
    writeRate(video, rate, { suppressEchoPropagation = false } = {}) {
      const numericSpeed = Number(rate.toFixed(2));
      if (video.playbackRate !== numericSpeed && this.eventManager?.arbitration) {
        this.eventManager.arbitration.noteWrite(video, numericSpeed, {
          suppressPropagation: suppressEchoPropagation
        });
      }
      window.VSC.siteHandlerManager.handleSpeedChange(video, numericSpeed);
    }
    /**
     * SYNC_UI effect primitive: reflect a speed in the controller badge and
     * flash for visual feedback. Never touches the register or authority.
     *
     * @param {HTMLMediaElement} video - Video element
     * @param {number} rate - Speed to display
     */
    syncIndicator(video, rate) {
      const numericSpeed = Number(rate.toFixed(2));
      const speedIndicator = video.vsc?.speedIndicator;
      if (!speedIndicator) {
        window.VSC.logger.warn(
          "Cannot update speed indicator: video controller UI not fully initialized"
        );
        return;
      }
      speedIndicator.textContent = numericSpeed.toFixed(2);
      if (video.vsc?.div) {
        this.flashController(video.vsc.div);
      }
    }
  };
  window.VSC.ActionHandler = ActionHandler;

  // src/core/video-controller.js
  window.VSC = window.VSC || {};
  var VideoController = class {
    constructor(target, parent, config, actionHandler, shouldStartHidden = false) {
      if (target.vsc) {
        return target.vsc;
      }
      this.video = target;
      this.parent = target.parentElement || parent;
      this.config = config;
      this.actionHandler = actionHandler;
      this.arbitration = actionHandler && actionHandler.eventManager && actionHandler.eventManager.arbitration || new window.VSC.SpeedArbitration(config, null);
      this.controlsManager = new window.VSC.ControlsManager(actionHandler, config);
      this.shouldStartHidden = shouldStartHidden;
      this.controllerId = this.generateControllerId(target);
      this.speedBeforeReset = null;
      this.positionBeforeJump = null;
      target.vsc = this;
      if (window.VSC.stateManager) {
        window.VSC.stateManager.registerController(this);
      } else {
        window.VSC.logger.error("StateManager not available during VideoController initialization");
      }
      this.initializeSpeed();
      this.div = this.initializeControls();
      this.setupEventHandlers();
      this.setupMutationObserver();
      window.VSC.logger.info("VideoController initialized for video element");
    }
    /**
     * Initialize video speed based on settings.
     *
     * Lifecycle writes execute WRITE + SYNC_UI only — never PERSIST (cell 6,
     * persistence purity I2): re-asserting existing authority must not
     * refresh it or leak an initialization value into storage.
     * @private
     */
    initializeSpeed() {
      if (this.video.readyState < 1) {
        window.VSC.logger.debug("Deferring initializeSpeed until loadedmetadata");
        this.handleLoadedMetadata = () => {
          this.video.removeEventListener("loadedmetadata", this.handleLoadedMetadata);
          this.handleLoadedMetadata = null;
          this.applyLifecycleSpeed("loadedmetadata");
        };
        this.video.addEventListener("loadedmetadata", this.handleLoadedMetadata);
        return;
      }
      this.applyLifecycleSpeed("initializeSpeed");
    }
    /**
     * Execute a lifecycle write only while this controller remains attached.
     * @param {string} eventType
     * @private
     */
    applyLifecycleSpeed(eventType) {
      if (this.video.vsc !== this || !this.actionHandler) {
        return;
      }
      if (eventType === "initializeSpeed" || eventType === "loadedmetadata") {
        this.arbitration.classifier?.observeMediaInit(this.video, performance.now());
      }
      const targetSpeed = this.arbitration.lifecycleTarget(this.video);
      if (targetSpeed === null) {
        window.VSC.logger.debug(
          `${eventType}: no authoritative target, leaving playbackRate=${this.video.playbackRate}`
        );
        return;
      }
      if (targetSpeed === this.video.playbackRate) {
        return;
      }
      window.VSC.logger.info(`${eventType}: restoring speed to ${targetSpeed}`);
      this.actionHandler.writeRate(this.video, targetSpeed);
      this.actionHandler.syncIndicator(this.video, targetSpeed);
    }
    /**
     * Initialize video controller UI
     * @returns {HTMLElement} Controller wrapper element
     * @private
     */
    initializeControls() {
      window.VSC.logger.debug("initializeControls Begin");
      const document2 = this.video.ownerDocument;
      const speed = window.VSC.Constants.formatSpeed(this.video.playbackRate);
      window.VSC.logger.debug(`Speed variable set to: ${speed}`);
      const wrapper = document2.createElement("vsc-controller");
      const cssClasses = ["vsc-controller"];
      if (!this.video.currentSrc && !this.video.src && this.video.readyState < 2) {
        cssClasses.push("vsc-nosource");
      }
      if (this.config.settings.startHidden || this.shouldStartHidden) {
        cssClasses.push("vsc-hidden");
        window.VSC.logger.debug("Starting controller hidden");
      }
      wrapper.className = cssClasses.join(" ");
      wrapper.style.cssText = "z-index: 9999999 !important;";
      const shadow = window.VSC.ShadowDOMManager.createShadowDOM(wrapper, {
        top: "0px",
        left: "0px",
        speed,
        opacity: this.config.settings.controllerOpacity,
        buttonSize: this.config.settings.controllerButtonSize
      });
      this.controlsManager.setupControlEvents(shadow, this.video);
      this.speedIndicator = window.VSC.ShadowDOMManager.getSpeedIndicator(shadow);
      this.insertIntoDOM(document2, wrapper);
      const computedPosition = getComputedStyle(wrapper).position;
      if (computedPosition !== "relative") {
        const position = window.VSC.ShadowDOMManager.calculatePosition(this.video);
        const innerController = window.VSC.ShadowDOMManager.getController(shadow);
        innerController.style.top = position.top;
        innerController.style.left = position.left;
      }
      window.VSC.logger.debug("initializeControls End");
      return wrapper;
    }
    /**
     * Insert controller into DOM with site-specific positioning
     * @param {Document} document - Document object
     * @param {HTMLElement} wrapper - Wrapper element to insert
     * @private
     */
    insertIntoDOM(document2, wrapper) {
      const fragment = document2.createDocumentFragment();
      fragment.appendChild(wrapper);
      const positioning = window.VSC.siteHandlerManager.getControllerPosition(
        this.parent,
        this.video
      );
      switch (positioning.insertionMethod) {
        case "beforeParent":
          positioning.insertionPoint.parentElement.insertBefore(fragment, positioning.insertionPoint);
          break;
        case "afterParent":
          positioning.insertionPoint.parentElement.insertBefore(
            fragment,
            positioning.insertionPoint.nextSibling
          );
          break;
        case "firstChild":
        default:
          positioning.insertionPoint.insertBefore(fragment, positioning.insertionPoint.firstChild);
          break;
      }
      window.VSC.logger.debug(`Controller inserted using ${positioning.insertionMethod} method`);
    }
    /**
     * Set up event handlers for media events
     * @private
     */
    setupEventHandlers() {
      const mediaEventAction = (event) => {
        this.applyLifecycleSpeed(event.type);
      };
      this.handlePlay = mediaEventAction.bind(this);
      this.handleSeekEvidence = (event) => {
        this.arbitration.classifier?.observeSeek(this.video, event.timeStamp);
      };
      this.handleSeek = (event) => {
        this.handleSeekEvidence(event);
        if (event.target.readyState < 2) {
          return;
        }
        mediaEventAction.call(this, event);
      };
      this.handleMediaInit = (event) => {
        this.arbitration.clearEchoTransaction(this.video);
        this.arbitration.classifier?.observeMediaInit(this.video, event.timeStamp);
      };
      this.video.addEventListener("play", this.handlePlay);
      this.video.addEventListener("seeking", this.handleSeekEvidence);
      this.video.addEventListener("seeked", this.handleSeek);
      this.video.addEventListener("loadstart", this.handleMediaInit);
      window.VSC.logger.debug("Added media event handlers: play, seeking, seeked, loadstart");
    }
    /**
     * Set up mutation observer for src attribute changes
     * @private
     */
    setupMutationObserver() {
      this.targetObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && (mutation.attributeName === "src" || mutation.attributeName === "currentSrc")) {
            window.VSC.logger.debug("Mutation of A/V element detected");
            const controller = this.div;
            if (!mutation.target.src && !mutation.target.currentSrc) {
              controller.classList.add("vsc-nosource");
            } else {
              controller.classList.remove("vsc-nosource");
            }
          }
        });
      });
      this.targetObserver.observe(this.video, {
        attributeFilter: ["src", "currentSrc"]
      });
    }
    /**
     * Remove controller and clean up
     */
    remove() {
      window.VSC.logger.debug("Removing VideoController");
      if (this.div?.flashTimer !== void 0) {
        clearTimeout(this.div.flashTimer);
        this.div.flashTimer = void 0;
      }
      if (this.div && this.div.parentNode) {
        this.div.remove();
      }
      if (this.handlePlay) {
        this.video.removeEventListener("play", this.handlePlay);
        this.handlePlay = null;
      }
      if (this.handleSeek) {
        this.video.removeEventListener("seeked", this.handleSeek);
        this.handleSeek = null;
      }
      if (this.handleSeekEvidence) {
        this.video.removeEventListener("seeking", this.handleSeekEvidence);
        this.handleSeekEvidence = null;
      }
      if (this.handleMediaInit) {
        this.video.removeEventListener("loadstart", this.handleMediaInit);
        this.handleMediaInit = null;
      }
      if (this.handleLoadedMetadata) {
        this.video.removeEventListener("loadedmetadata", this.handleLoadedMetadata);
        this.handleLoadedMetadata = null;
      }
      if (this.targetObserver) {
        this.targetObserver.disconnect();
      }
      if (window.VSC.stateManager) {
        window.VSC.stateManager.removeController(this.controllerId);
      }
      this.actionHandler?.eventManager?.arbitration?.release(this.video);
      delete this.video.vsc;
      window.VSC.logger.debug("VideoController removed successfully");
    }
    /**
     * Generate unique controller ID for badge tracking
     * @param {HTMLElement} target - Video/audio element
     * @returns {string} Unique controller ID
     * @private
     */
    generateControllerId(target) {
      const timestamp = Date.now();
      const src = target.currentSrc || target.src || "no-src";
      const tagName = target.tagName.toLowerCase();
      const srcHash = src.split("").reduce((hash, char) => {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        return hash & hash;
      }, 0);
      const random = Math.floor(Math.random() * 1e3);
      return `${tagName}-${Math.abs(srcHash)}-${timestamp}-${random}`;
    }
    /**
     * Check if the video element is currently visible
     * @returns {boolean} True if video is visible
     */
    isVideoVisible() {
      if (!this.video.isConnected) {
        return false;
      }
      const style = window.getComputedStyle(this.video);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return false;
      }
      const rect = this.video.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }
      return true;
    }
    /**
     * Update controller visibility based on video visibility
     * Called when video visibility changes
     */
    updateVisibility() {
      const isVisible = this.isVideoVisible();
      const isCurrentlyHidden = this.div.classList.contains("vsc-hidden");
      if (this.video.tagName === "AUDIO") {
        if (!this.config.settings.audioBoolean && !isCurrentlyHidden) {
          this.div.classList.add("vsc-hidden");
          window.VSC.logger.debug("Hiding audio controller - audio support disabled");
        } else if (this.config.settings.audioBoolean && isCurrentlyHidden && !this.config.settings.startHidden) {
          this.div.classList.remove("vsc-hidden");
          window.VSC.logger.debug("Showing audio controller - audio support enabled");
        }
        return;
      }
      if (isVisible && isCurrentlyHidden && !this.config.settings.startHidden) {
        this.div.classList.remove("vsc-hidden");
        window.VSC.logger.debug("Showing controller - video became visible");
      } else if (!isVisible && !isCurrentlyHidden) {
        this.div.classList.add("vsc-hidden");
        window.VSC.logger.debug("Hiding controller - video became invisible");
      }
    }
  };
  window.VSC.VideoController = VideoController;

  // src/ui/controls.js
  window.VSC = window.VSC || {};
  var ControlsManager = class {
    constructor(actionHandler, config) {
      this.actionHandler = actionHandler;
      this.config = config;
    }
    /**
     * Set up control button event listeners
     * @param {ShadowRoot} shadow - Shadow root containing controls
     * @param {HTMLVideoElement} video - Associated video element
     */
    setupControlEvents(shadow, video) {
      this.setupDragHandler(shadow);
      this.setupButtonHandlers(shadow);
      this.setupWheelHandler(shadow, video);
      this.setupClickPrevention(shadow);
    }
    /**
     * Set up drag and double-click-to-reset handlers for speed indicator
     * Uses pointer events for unified mouse + touch support
     * @param {ShadowRoot} shadow - Shadow root
     * @private
     */
    setupDragHandler(shadow) {
      const draggable = shadow.querySelector(".draggable");
      draggable.addEventListener(
        "pointerdown",
        (e) => {
          this.actionHandler.runAction(e.target.dataset["action"], false, e);
          e.stopPropagation();
          e.preventDefault();
        },
        true
      );
      draggable.addEventListener(
        "dblclick",
        (e) => {
          const resetTarget = this.config.getKeyBinding("reset") || 1;
          this.actionHandler.runAction("reset", resetTarget, e);
          e.stopPropagation();
          e.preventDefault();
        },
        true
      );
    }
    /**
     * Set up button click handlers
     * @param {ShadowRoot} shadow - Shadow root
     * @private
     */
    setupButtonHandlers(shadow) {
      shadow.querySelectorAll("button").forEach((button) => {
        button.addEventListener(
          "click",
          (e) => {
            this.actionHandler.runAction(
              e.target.dataset["action"],
              this.config.getKeyBinding(e.target.dataset["action"]),
              e
            );
            e.stopPropagation();
          },
          true
        );
        button.addEventListener(
          "touchstart",
          (e) => {
            e.stopPropagation();
          },
          true
        );
      });
    }
    /**
     * Set up mouse wheel handler for speed control with touchpad filtering
     *
     * Cross-browser wheel event behavior:
     * - Chrome/Safari/Edge: ALL devices use DOM_DELTA_PIXEL (mouse wheels ~100px, touchpads ~1-15px)
     * - Firefox: Mouse wheels use DOM_DELTA_LINE, touchpads use DOM_DELTA_PIXEL
     *
     * Detection strategy: Use magnitude threshold in DOM_DELTA_PIXEL mode to distinguish
     * mouse wheels (±100px typical) from touchpads (±1-15px typical). Threshold of 50px
     * provides safety margin based on empirical browser testing.
     *
     * @param {ShadowRoot} shadow - Shadow root
     * @param {HTMLVideoElement} video - Video element
     * @private
     */
    setupWheelHandler(shadow, video) {
      const controller = shadow.querySelector("#controller");
      const HOVER_DWELL_MS = 300;
      let hoverStart = 0;
      controller.addEventListener("mouseenter", (e) => {
        hoverStart = e.timeStamp;
      });
      controller.addEventListener("mouseleave", () => {
        hoverStart = 0;
      });
      controller.addEventListener(
        "wheel",
        (event) => {
          if (event.ctrlKey) {
            window.VSC.logger.debug("Browser zoom gesture ignored");
            return;
          }
          if (event.timeStamp - hoverStart < HOVER_DWELL_MS) {
            window.VSC.logger.debug("Wheel ignored: hover dwell threshold not met");
            return;
          }
          if (event.deltaMode === event.DOM_DELTA_PIXEL) {
            const TOUCHPAD_THRESHOLD = 50;
            if (Math.abs(event.deltaY) < TOUCHPAD_THRESHOLD) {
              window.VSC.logger.debug(
                `Touchpad scroll detected (deltaY: ${event.deltaY}) - ignoring`
              );
              return;
            }
          }
          event.preventDefault();
          const delta = Math.sign(event.deltaY);
          const step2 = 0.1;
          const speedDelta = delta < 0 ? step2 : -step2;
          this.actionHandler.adjustSpeed(video, speedDelta, { relative: true });
          window.VSC.logger.debug(
            `Wheel control: adjusting speed by ${speedDelta} (deltaMode: ${event.deltaMode}, deltaY: ${event.deltaY})`
          );
        },
        { passive: false }
      );
    }
    /**
     * Set up click prevention for controller container
     * @param {ShadowRoot} shadow - Shadow root
     * @private
     */
    setupClickPrevention(shadow) {
      const controller = shadow.querySelector("#controller");
      controller.addEventListener("click", (e) => e.stopPropagation(), false);
      controller.addEventListener("mousedown", (e) => e.stopPropagation(), false);
    }
  };
  window.VSC.ControlsManager = ControlsManager;

  // src/ui/drag-handler.js
  window.VSC = window.VSC || {};
  var DragHandler = class {
    /**
     * Handle dragging of video controller via pointer events
     * @param {HTMLVideoElement} video - Video element
     * @param {PointerEvent|MouseEvent} e - Pointer/mouse event
     */
    static handleDrag(video, e) {
      const controller = video.vsc.div;
      const shadowController = controller.shadowRoot.querySelector("#controller");
      video.classList.add("vcs-dragging");
      shadowController.classList.add("dragging");
      const initialXY = [e.clientX, e.clientY];
      const initialControllerXY = [
        parseInt(shadowController.style.left) || 0,
        parseInt(shadowController.style.top) || 0
      ];
      const draggable = e.target;
      if (e.pointerId !== void 0) {
        draggable.setPointerCapture(e.pointerId);
      }
      const onMove = (ev) => {
        const dx = ev.clientX - initialXY[0];
        const dy = ev.clientY - initialXY[1];
        shadowController.style.left = `${initialControllerXY[0] + dx}px`;
        shadowController.style.top = `${initialControllerXY[1] + dy}px`;
      };
      const onEnd = () => {
        draggable.removeEventListener("pointermove", onMove);
        draggable.removeEventListener("pointerup", onEnd);
        draggable.removeEventListener("pointercancel", onEnd);
        draggable.removeEventListener("mousemove", onMove);
        draggable.removeEventListener("mouseup", onEnd);
        shadowController.classList.remove("dragging");
        video.classList.remove("vcs-dragging");
        window.VSC.logger.debug("Drag operation completed");
      };
      if (e.pointerId !== void 0) {
        draggable.addEventListener("pointermove", onMove);
        draggable.addEventListener("pointerup", onEnd);
        draggable.addEventListener("pointercancel", onEnd);
      } else {
        draggable.addEventListener("mousemove", onMove);
        draggable.addEventListener("mouseup", onEnd);
      }
      window.VSC.logger.debug("Drag operation started");
    }
  };
  window.VSC.DragHandler = DragHandler;

  // src/ui/shadow-dom.js
  window.VSC = window.VSC || {};
  var ShadowDOMManager = class {
    /**
     * Create shadow DOM for video controller
     * @param {HTMLElement} wrapper - Wrapper element
     * @param {Object} options - Configuration options
     * @returns {ShadowRoot} Created shadow root
     */
    static createShadowDOM(wrapper, options = {}) {
      const { top = "0px", left = "0px", speed = "1.00", opacity = 0.3, buttonSize = 14 } = options;
      const shadow = wrapper.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `
      * {
        line-height: 1.8em;
        font-family: sans-serif;
        font-size: 13px;
      }
      
      :host(:hover) #controls {
        display: inline-block;
      }
      
      /* Hide the automatic layer without disturbing any explicit override. */
      :host(.vsc-hidden) #controller {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* Explicit show and temporary speed feedback outrank automatic hiding,
         including startHidden, media visibility, and site autohide. */
      :host([data-vsc-visibility="show"]) #controller,
      :host(.vsc-show) #controller {
        display: block !important;
        visibility: visible !important;
        opacity: ${opacity} !important;
      }

      /* Explicit hide and unavailable media are final: flashes and user show
         overrides must not reveal them. */
      :host([data-vsc-visibility="hide"]) #controller,
      :host(.vsc-nosource) #controller {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      #controller {
        position: absolute;
        top: 0;
        left: 0;
        background: black;
        color: white;
        border-radius: 6px;
        padding: 4px;
        margin: 10px 10px 10px 15px;
        cursor: default;
        z-index: 9999999;
        white-space: nowrap;
      }
      
      #controller:hover {
        opacity: 0.7;
      }
      
      #controller:hover>.draggable {
        margin-right: 0.8em;
      }
      
      #controls {
        display: none;
        vertical-align: middle;
      }
      
      #controller.dragging {
        cursor: -webkit-grabbing;
        opacity: 0.7;
      }
      
      #controller.dragging #controls {
        display: inline-block;
      }
      
      .draggable {
        cursor: -webkit-grab;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.8em;
        height: 1.4em;
        text-align: center;
        vertical-align: middle;
        box-sizing: border-box;
        touch-action: none;
      }
      
      .draggable:active {
        cursor: -webkit-grabbing;
      }
      
      button {
        opacity: 1;
        cursor: pointer;
        color: black;
        background: white;
        font-weight: normal;
        border-radius: 5px;
        padding: 1px 5px 3px 5px;
        font-size: inherit;
        line-height: inherit;
        border: 0px solid white;
        font-family: "Lucida Console", Monaco, monospace;
        margin: 0px 2px 2px 2px;
        transition: background 0.2s, color 0.2s;
      }
      
      button:focus {
        outline: 0;
      }
      
      button:hover {
        opacity: 1;
        background: #2196f3;
        color: #ffffff;
      }
      
      button:active {
        background: #2196f3;
        color: #ffffff;
        font-weight: bold;
      }
      
      button.rw {
        opacity: 0.65;
      }
    `;
      shadow.appendChild(style);
      const controller = document.createElement("div");
      controller.id = "controller";
      controller.style.cssText = `top:${top}; left:${left}; opacity:${opacity};`;
      const draggable = document.createElement("span");
      draggable.setAttribute("data-action", "drag");
      draggable.className = "draggable";
      draggable.style.cssText = `font-size: ${buttonSize}px;`;
      draggable.textContent = speed;
      controller.appendChild(draggable);
      const controls = document.createElement("span");
      controls.id = "controls";
      controls.style.cssText = `font-size: ${buttonSize}px; line-height: ${buttonSize}px;`;
      const buttons = [
        { action: "rewind", text: "\xAB", class: "rw" },
        { action: "slower", text: "\u2212", class: "" },
        { action: "faster", text: "+", class: "" },
        { action: "advance", text: "\xBB", class: "rw" }
      ];
      buttons.forEach((btnConfig) => {
        const button = document.createElement("button");
        button.setAttribute("data-action", btnConfig.action);
        if (btnConfig.class) {
          button.className = btnConfig.class;
        }
        button.textContent = btnConfig.text;
        controls.appendChild(button);
      });
      controller.appendChild(controls);
      shadow.appendChild(controller);
      window.VSC.logger.debug("Shadow DOM created for video controller");
      return shadow;
    }
    /**
     * Get controller element from shadow DOM
     * @param {ShadowRoot} shadow - Shadow root
     * @returns {HTMLElement} Controller element
     */
    static getController(shadow) {
      return shadow.querySelector("#controller");
    }
    /**
     * Get controls container from shadow DOM
     * @param {ShadowRoot} shadow - Shadow root
     * @returns {HTMLElement} Controls element
     */
    static getControls(shadow) {
      return shadow.querySelector("#controls");
    }
    /**
     * Get draggable speed indicator from shadow DOM
     * @param {ShadowRoot} shadow - Shadow root
     * @returns {HTMLElement} Speed indicator element
     */
    static getSpeedIndicator(shadow) {
      return shadow.querySelector(".draggable");
    }
    /**
     * Get all buttons from shadow DOM
     * @param {ShadowRoot} shadow - Shadow root
     * @returns {NodeList} Button elements
     */
    static getButtons(shadow) {
      return shadow.querySelectorAll("button");
    }
    /**
     * Update speed display in shadow DOM
     * @param {ShadowRoot} shadow - Shadow root
     * @param {number} speed - New speed value
     */
    static updateSpeedDisplay(shadow, speed) {
      const speedIndicator = this.getSpeedIndicator(shadow);
      if (speedIndicator) {
        speedIndicator.textContent = window.VSC.Constants.formatSpeed(speed);
      }
    }
    /**
     * Calculate position for controller based on video element
     * @param {HTMLVideoElement} video - Video element
     * @returns {Object} Position object with top and left properties
     */
    static calculatePosition(video) {
      const rect = video.getBoundingClientRect();
      const offsetRect = video.offsetParent?.getBoundingClientRect();
      const top = `${Math.max(rect.top - (offsetRect?.top || 0), 0)}px`;
      const left = `${Math.max(rect.left - (offsetRect?.left || 0), 0)}px`;
      return { top, left };
    }
  };
  window.VSC.ShadowDOMManager = ShadowDOMManager;

  // src/site-handlers/base-handler.js
  window.VSC = window.VSC || {};
  var BaseSiteHandler = class {
    constructor() {
      this.hostname = location.hostname;
    }
    /**
     * Check if this handler applies to the current site
     * @returns {boolean} True if handler applies
     */
    static matches() {
      return false;
    }
    /**
     * Get the site-specific positioning for the controller
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, _video) {
      return {
        insertionPoint: parent,
        insertionMethod: "firstChild",
        // 'firstChild', 'beforeParent', 'afterParent'
        targetParent: parent
      };
    }
    /**
     * Declare site-specific intent-classifier rule activations.
     *
     * The classifier owns what each flag MEANS (signature rates, binding,
     * terminal handling); handlers only declare WHICH flags their site
     * activates, keeping hostname knowledge in one registry (matches()).
     * Return a frozen partial override of IntentClassifier.TARGET_RULES, or
     * null for the generic rules. Every activation must cite the issue that
     * motivated it (see CONTRIBUTING's classifier-heuristic rule).
     * @returns {Object|null} Partial rule flags, or null for generic rules
     */
    getClassifierRules() {
      return null;
    }
    /**
     * Handle site-specific speed change.
     * Called whenever the extension sets playback speed (user action, fight-back, etc.).
     * Override to sync with a site's custom player API.
     * @param {HTMLMediaElement} video - Video element
     * @param {number} speed - Target speed
     */
    handleSpeedChange(video, speed) {
      video.playbackRate = speed;
    }
    /**
     * Handle site-specific seeking functionality
     * @param {HTMLMediaElement} video - Video element
     * @param {number} seekSeconds - Seconds to seek
     * @returns {boolean} True if handled, false for default behavior
     */
    handleSeek(video, seekSeconds) {
      if (video.currentTime !== void 0 && video.duration) {
        const newTime = Math.max(0, Math.min(video.duration, video.currentTime + seekSeconds));
        video.currentTime = newTime;
      } else {
        video.currentTime += seekSeconds;
      }
      return true;
    }
    /**
     * Handle site-specific initialization
     * @param {Document} document - Document object
     */
    initialize(_document) {
      window.VSC.logger.debug(`Initializing ${this.constructor.name} for ${this.hostname}`);
    }
    /**
     * Handle site-specific cleanup
     */
    cleanup() {
      window.VSC.logger.debug(`Cleaning up ${this.constructor.name}`);
    }
    /**
     * Check if video element should be ignored
     * @param {HTMLMediaElement} video - Video element
     * @returns {boolean} True if video should be ignored
     */
    shouldIgnoreVideo(_video) {
      return false;
    }
    /**
     * Resolve a page gesture to exactly one controlled media element.
     *
     * Return null unless a site-specific player relationship is unambiguous.
     * EventManager retains unresolved gestures as document-level fallback
     * evidence, while a resolved gesture must never bless another player.
     * @param {Event} _event
     * @param {HTMLMediaElement[]} _mediaElements
     * @returns {HTMLMediaElement|null}
     */
    resolveGestureMedia(_event, _mediaElements) {
      return null;
    }
    /**
     * Get site-specific CSS selectors for video containers
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      return [];
    }
    /**
     * Handle special video detection logic
     * @param {Document} document - Document object
     * @returns {Array<HTMLMediaElement>} Additional videos found
     */
    detectSpecialVideos(_document) {
      return [];
    }
  };
  window.VSC.BaseSiteHandler = BaseSiteHandler;

  // src/site-handlers/linkedin-handler.js
  window.VSC = window.VSC || {};
  var LinkedInHandler = class extends window.VSC.BaseSiteHandler {
    /**
     * Check if this handler applies to LinkedIn
     * @returns {boolean}
     */
    static matches() {
      return location.hostname.includes("linkedin.com");
    }
    /**
     * Handle speed change for LinkedIn Learning
     * Synchronizes with CoursePilot's desired speed engine and prevents player rate clamping.
     * @param {HTMLMediaElement} video
     * @param {number} speed
     */
    handleSpeedChange(video, speed) {
      try {
        window.__vsc_writing_rate = true;
        window.__coursepilot_desired_speed = speed;
        if (document.documentElement) {
          document.documentElement.setAttribute("data-coursepilot-speed", String(speed));
        }
      } catch (e) {
      }
      try {
        video.playbackRate = speed;
      } finally {
        window.__vsc_writing_rate = false;
      }
    }
    /**
     * Get controller positioning on LinkedIn video players
     */
    getControllerPosition(parent, video) {
      const playerContainer = video.closest(".video-js, [data-artdeco-is-focused], .vsc-controller-container") || parent;
      return {
        insertionPoint: playerContainer,
        insertionMethod: "firstChild",
        targetParent: playerContainer
      };
    }
  };
  window.VSC.LinkedInHandler = LinkedInHandler;

  // src/site-handlers/netflix-handler.js
  window.VSC = window.VSC || {};
  var NetflixHandler = class extends window.VSC.BaseSiteHandler {
    /**
     * Check if this handler applies to Netflix
     * @returns {boolean} True if on Netflix
     */
    static matches() {
      return location.hostname === "www.netflix.com";
    }
    /**
     * Get Netflix-specific controller positioning
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, _video) {
      return {
        insertionPoint: parent.parentElement,
        insertionMethod: "beforeParent",
        targetParent: parent.parentElement
      };
    }
    /**
     * Handle Netflix-specific seeking using their API
     * @param {HTMLMediaElement} video - Video element
     * @param {number} seekSeconds - Seconds to seek
     * @returns {boolean} True if handled
     */
    handleSeek(video, seekSeconds) {
      try {
        window.postMessage(
          {
            action: "videospeed-seek",
            seekMs: seekSeconds * 1e3
          },
          "https://www.netflix.com"
        );
        window.VSC.logger.debug(`Netflix seek: ${seekSeconds} seconds`);
        return true;
      } catch (error) {
        window.VSC.logger.error(`Netflix seek failed: ${error.message}`);
        video.currentTime += seekSeconds;
        return true;
      }
    }
    /**
     * Initialize Netflix-specific functionality
     * @param {Document} document - Document object
     */
    initialize(document2) {
      super.initialize(document2);
      window.VSC.logger.debug(
        "Netflix handler initialized - script injection handled by content script"
      );
    }
    /**
     * Check if video should be ignored on Netflix
     * @param {HTMLMediaElement} video - Video element
     * @returns {boolean} True if video should be ignored
     */
    shouldIgnoreVideo(video) {
      return video.classList.contains("preview-video") || video.parentElement?.classList.contains("billboard-row");
    }
    /**
     * Get Netflix-specific video container selectors
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      return [".watch-video", ".nfp-container", "#netflix-player"];
    }
  };
  window.VSC.NetflixHandler = NetflixHandler;

  // src/site-handlers/youtube-handler.js
  window.VSC = window.VSC || {};
  var YouTubeHandler = class _YouTubeHandler extends window.VSC.BaseSiteHandler {
    /**
     * Check if this handler applies to YouTube
     * @param {string} [hostname] - Injectable for tests; defaults to live location
     * @returns {boolean} True if on YouTube
     */
    static matches(hostname = location.hostname) {
      return hostname === "www.youtube.com" || hostname === "www.youtube-nocookie.com";
    }
    /**
     * Get YouTube-specific controller positioning
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, _video) {
      let targetParent = parent.parentElement;
      if (location.pathname.startsWith("/embed/") && document.body?.querySelector(":scope > #player-controls")) {
        return {
          insertionPoint: document.body,
          insertionMethod: "firstChild",
          targetParent: document.body
        };
      }
      if (targetParent && targetParent.parentElement && targetParent.parentElement.querySelector("#player-controls")) {
        targetParent = targetParent.parentElement;
      }
      return {
        insertionPoint: targetParent,
        insertionMethod: "firstChild",
        targetParent
      };
    }
    // YouTube autohide is handled by domain-scoped light-DOM CSS in
    // controller-css-defaults.js. The descendant selector reacts to YouTube's
    // page-owned class without forwarding state through a MutationObserver.
    /**
     * Press-and-hold 2x boost (#1554/#1568): the pointer variant fires a
     * ratechange while the pointer is still down, before any click event
     * exists (PR #1555). The SPACEBAR variant of the same boost armed via
     * legacy any-key-arming — narrowed away by TARGET_RULES — so Space must
     * arm here explicitly (held Space auto-repeats keydown, keeping the
     * gesture window fresh through the hold and across the release reset).
     * Scoped to this handler's matches() hosts: www.youtube.com and the
     * privacy-enhanced embed host, which serve the identical player.
     * (#1581 needs no entry: click-seek resets go to 1.0, and a 1.0 adoption
     * requires STRONG evidence under the classifier's tiered rules.)
     * @returns {Object} Classifier rule activations for YouTube
     */
    getClassifierRules() {
      return _YouTubeHandler.CLASSIFIER_RULES;
    }
    /**
     * Associate a gesture in YouTube player chrome with exactly one controlled
     * video. Player controls are overlays/siblings rather than video children,
     * so EventManager's direct composed-path resolution cannot see them.
     *
     * This deliberately recognizes the whole player chrome, including seek
     * controls: it only prevents a click for player A from blessing player B;
     * it does not claim to distinguish a seek from a native speed-menu action.
     * @param {Event} event
     * @param {HTMLMediaElement[]} mediaElements
     * @returns {HTMLMediaElement|null}
     */
    resolveGestureMedia(event, mediaElements) {
      const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
      const matches = mediaElements.filter((video) => this.gestureBelongsToVideo(path, video));
      return matches.length === 1 ? matches[0] : null;
    }
    /**
     * @param {EventTarget[]} path
     * @param {HTMLMediaElement} video
     * @returns {boolean}
     * @private
     */
    gestureBelongsToVideo(path, video) {
      const player = video.closest?.(".html5-video-player") || video.closest?.("#movie_player") || video.closest?.(".ytp-player-content");
      if (!player) {
        return false;
      }
      const includes = (container) => !!container && path.some((node) => node === container || node?.nodeType && container.contains(node));
      if (includes(player)) {
        return true;
      }
      const embeddedControls = Array.from(player.parentElement?.children || []).find(
        (child) => child.id === "player-controls"
      );
      return includes(embeddedControls);
    }
    /**
     * Check if video should be ignored on YouTube
     * @param {HTMLMediaElement} video - Video element
     * @returns {boolean} True if video should be ignored
     */
    shouldIgnoreVideo(video) {
      return video.classList.contains("video-thumbnail") || video.parentElement?.classList.contains("ytp-ad-player-overlay");
    }
    /**
     * Get YouTube-specific video container selectors
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      return [".html5-video-player", "#movie_player", ".ytp-player-content"];
    }
    /**
     * Handle special video detection for YouTube
     * @param {Document} document - Document object
     * @returns {Array<HTMLMediaElement>} Additional videos found
     */
    detectSpecialVideos(document2) {
      const videos = [];
      try {
        const iframes = document2.querySelectorAll('iframe[src*="youtube.com"]');
        iframes.forEach((iframe) => {
          try {
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
              const iframeVideos = iframeDoc.querySelectorAll("video");
              videos.push(...Array.from(iframeVideos));
            }
          } catch {
          }
        });
      } catch (e) {
        window.VSC.logger.debug(`Could not access YouTube iframe videos: ${e.message}`);
      }
      return videos;
    }
  };
  YouTubeHandler.CLASSIFIER_RULES = Object.freeze({ pointerHoldArms: true, spacebarArms: true });
  window.VSC.YouTubeHandler = YouTubeHandler;

  // src/site-handlers/facebook-handler.js
  window.VSC = window.VSC || {};
  var FacebookHandler = class extends window.VSC.BaseSiteHandler {
    /**
     * Check if this handler applies to Facebook
     * @returns {boolean} True if on Facebook
     */
    static matches() {
      return location.hostname === "www.facebook.com";
    }
    /**
     * Get Facebook-specific controller positioning
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, _video) {
      const fallbackParent = parent.parentElement || parent;
      let targetParent = parent;
      for (let depth = 0; depth < 7; depth += 1) {
        if (!targetParent.parentElement) {
          window.VSC.logger.warn("Facebook DOM structure changed, using fallback positioning");
          targetParent = fallbackParent;
          break;
        }
        targetParent = targetParent.parentElement;
      }
      return {
        insertionPoint: targetParent,
        insertionMethod: "firstChild",
        targetParent
      };
    }
    /**
     * Initialize Facebook-specific functionality
     * @param {Document} document - Document object
     */
    initialize(document2) {
      super.initialize(document2);
      this.setupFacebookObserver(document2);
    }
    /**
     * Set up observer for Facebook's dynamic content loading
     * @param {Document} document - Document object
     * @private
     */
    setupFacebookObserver(document2) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const videos = node.querySelectorAll && node.querySelectorAll("video");
                if (videos && videos.length > 0) {
                  window.VSC.logger.debug(`Facebook: Found ${videos.length} new videos`);
                  this.onNewVideosDetected(Array.from(videos));
                }
              }
            });
          }
        });
      });
      observer.observe(document2.body, {
        childList: true,
        subtree: true
      });
      this.facebookObserver = observer;
      window.VSC.logger.debug("Facebook dynamic content observer set up");
    }
    /**
     * Handle new videos detected in Facebook's dynamic content
     * @param {Array<HTMLMediaElement>} videos - New video elements
     * @private
     */
    onNewVideosDetected(videos) {
      window.VSC.logger.debug(`Facebook: ${videos.length} new videos detected`);
    }
    /**
     * Check if video should be ignored on Facebook
     * @param {HTMLMediaElement} video - Video element
     * @returns {boolean} True if video should be ignored
     */
    shouldIgnoreVideo(video) {
      return video.closest("[data-story-id]") !== null || video.closest(".story-bucket-container") !== null || video.getAttribute("data-video-width") === "0";
    }
    /**
     * Get Facebook-specific video container selectors
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      return ["[data-video-id]", ".video-container", ".fbStoryVideoContainer", '[role="main"] video'];
    }
    /**
     * Cleanup Facebook-specific resources
     */
    cleanup() {
      super.cleanup();
      if (this.facebookObserver) {
        this.facebookObserver.disconnect();
        this.facebookObserver = null;
      }
    }
  };
  window.VSC.FacebookHandler = FacebookHandler;

  // src/site-handlers/amazon-handler.js
  window.VSC = window.VSC || {};
  var AmazonHandler = class extends window.VSC.BaseSiteHandler {
    /**
     * Check if this handler applies to Amazon
     * @returns {boolean} True if on Amazon
     */
    static matches() {
      return location.hostname === "www.amazon.com" || location.hostname === "www.primevideo.com" || location.hostname.includes("amazon.") || location.hostname.includes("primevideo.");
    }
    /**
     * Get Amazon-specific controller positioning
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, video) {
      if (!video.classList.contains("vjs-tech")) {
        return {
          insertionPoint: parent.parentElement,
          insertionMethod: "beforeParent",
          targetParent: parent.parentElement
        };
      }
      return super.getControllerPosition(parent, video);
    }
    /**
     * Check if video should be ignored on Amazon
     * @param {HTMLMediaElement} video - Video element
     * @returns {boolean} True if video should be ignored
     */
    shouldIgnoreVideo(video) {
      if (video.readyState < 2) {
        return false;
      }
      const rect = video.getBoundingClientRect();
      return rect.width < 200 || rect.height < 100;
    }
    /**
     * Get Amazon-specific video container selectors
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      return [".dv-player-container", ".webPlayerContainer", '[data-testid="video-player"]'];
    }
  };
  window.VSC.AmazonHandler = AmazonHandler;

  // src/site-handlers/apple-handler.js
  window.VSC = window.VSC || {};
  var AppleHandler = class extends window.VSC.BaseSiteHandler {
    /**
     * Check if this handler applies to Apple TV+
     * @returns {boolean} True if on Apple TV+
     */
    static matches() {
      return location.hostname === "tv.apple.com";
    }
    /**
     * Get Apple TV+-specific controller positioning
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, _video) {
      return {
        insertionPoint: parent.parentNode,
        insertionMethod: "firstChild",
        targetParent: parent.parentNode
      };
    }
    /**
     * Get Apple TV+-specific video container selectors
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      return ["apple-tv-plus-player", '[data-testid="player"]', ".video-container"];
    }
    /**
     * Handle special video detection for Apple TV+
     * @param {Document} document - Document object
     * @returns {Array<HTMLMediaElement>} Additional videos found
     */
    detectSpecialVideos(document2) {
      const applePlayer = document2.querySelector("apple-tv-plus-player");
      if (applePlayer && applePlayer.shadowRoot) {
        const videos = applePlayer.shadowRoot.querySelectorAll("video");
        return Array.from(videos);
      }
      return [];
    }
  };
  window.VSC.AppleHandler = AppleHandler;

  // src/site-handlers/dailymotion-handler.js
  window.VSC = window.VSC || {};
  var DailymotionHandler = class extends window.VSC.BaseSiteHandler {
    static matches() {
      return location.hostname.includes("dailymotion.com");
    }
    getControllerPosition(parent, _video) {
      const playerContainer = parent.parentElement;
      return {
        insertionPoint: playerContainer || parent,
        insertionMethod: "firstChild",
        targetParent: playerContainer || parent
      };
    }
  };
  window.VSC.DailymotionHandler = DailymotionHandler;

  // src/site-handlers/frame-handler.js
  window.VSC = window.VSC || {};
  var FrameHandler = class extends window.VSC.BaseSiteHandler {
    static matches() {
      return location.hostname === "next.frame.io";
    }
    getControllerPosition(parent, video) {
      const targetParent = this.findPlayerViewport(parent, video) || parent;
      return {
        insertionPoint: targetParent,
        insertionMethod: "firstChild",
        targetParent
      };
    }
    /**
     * Find Frame's visible player viewport without depending on generated class
     * names. We deliberately require both a substantial rendered size and a
     * clipping overflow ancestor; the zero-size transformed video layer fails the
     * size check, while the player viewport passes both.
     * @param {HTMLElement} parent - Initial controller parent
     * @param {HTMLMediaElement} video - Media element being controlled
     * @returns {HTMLElement|null} Viewport element, or null when structure is unknown
     * @private
     */
    findPlayerViewport(parent, video) {
      const videoRect = video.getBoundingClientRect();
      if (!videoRect.width || !videoRect.height) {
        return null;
      }
      const minWidth = Math.min(videoRect.width * 0.5, 300);
      const minHeight = Math.min(videoRect.height * 0.5, 150);
      let candidate = parent;
      for (let depth = 0; candidate && depth < 8; depth += 1) {
        const rect = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        const clipsContent = style.overflow === "hidden" || style.overflow === "clip" || style.overflowX === "hidden" || style.overflowX === "clip" || style.overflowY === "hidden" || style.overflowY === "clip";
        if (clipsContent && rect.width >= minWidth && rect.height >= minHeight) {
          return candidate;
        }
        candidate = candidate.parentElement;
      }
      return null;
    }
  };
  window.VSC.FrameHandler = FrameHandler;

  // src/site-handlers/index.js
  window.VSC = window.VSC || {};
  var SiteHandlerManager = class {
    constructor() {
      this.currentHandler = null;
      this.availableHandlers = [
        window.VSC.LinkedInHandler,
        window.VSC.NetflixHandler,
        window.VSC.YouTubeHandler,
        window.VSC.FacebookHandler,
        window.VSC.AmazonHandler,
        window.VSC.AppleHandler,
        window.VSC.DailymotionHandler,
        window.VSC.FrameHandler
      ];
    }
    /**
     * Get the appropriate handler for the current site
     * @returns {BaseSiteHandler} Site handler instance
     */
    getCurrentHandler() {
      if (!this.currentHandler) {
        this.currentHandler = this.detectHandler();
      }
      return this.currentHandler;
    }
    /**
     * Detect which handler to use for the current site
     * @returns {BaseSiteHandler} Site handler instance
     * @private
     */
    detectHandler() {
      for (const HandlerClass of this.availableHandlers) {
        if (HandlerClass.matches()) {
          window.VSC.logger.info(`Using ${HandlerClass.name} for ${location.hostname}`);
          return new HandlerClass();
        }
      }
      window.VSC.logger.debug(`Using BaseSiteHandler for ${location.hostname}`);
      return new window.VSC.BaseSiteHandler();
    }
    /**
     * Initialize the current site handler
     * @param {Document} document - Document object
     */
    initialize(document2) {
      const handler = this.getCurrentHandler();
      handler.initialize(document2);
    }
    /**
     * Get controller positioning for current site
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} video - Video element
     * @returns {Object} Positioning information
     */
    getControllerPosition(parent, video) {
      const handler = this.getCurrentHandler();
      return handler.getControllerPosition(parent, video);
    }
    /**
     * Handle speed change for current site
     * @param {HTMLMediaElement} video - Video element
     * @param {number} speed - Target speed
     */
    handleSpeedChange(video, speed) {
      const handler = this.getCurrentHandler();
      handler.handleSpeedChange(video, speed);
    }
    /**
     * Handle seeking for current site
     * @param {HTMLMediaElement} video - Video element
     * @param {number} seekSeconds - Seconds to seek
     * @returns {boolean} True if handled
     */
    handleSeek(video, seekSeconds) {
      const handler = this.getCurrentHandler();
      return handler.handleSeek(video, seekSeconds);
    }
    /**
     * Check if a video should be ignored
     * @param {HTMLMediaElement} video - Video element
     * @returns {boolean} True if video should be ignored
     */
    shouldIgnoreVideo(video) {
      const handler = this.getCurrentHandler();
      if (handler.shouldIgnoreVideo(video)) {
        return true;
      }
      if (video.tagName === "VIDEO" && video.loop && video.muted && !video.controls) {
        window.VSC.logger.debug("Video ignored: gif-video pattern (loop + muted + no controls)");
        return true;
      }
      return false;
    }
    /**
     * Resolve a page gesture to one controlled media element when the current
     * site's player DOM supplies an unambiguous association.
     * @param {Event} event
     * @param {HTMLMediaElement[]} mediaElements
     * @returns {HTMLMediaElement|null}
     */
    resolveGestureMedia(event, mediaElements) {
      return this.getCurrentHandler().resolveGestureMedia(event, mediaElements);
    }
    /**
     * Get site-declared intent-classifier rule activations
     * @returns {Object|null} Partial rule flags, or null for generic rules
     */
    getClassifierRules() {
      return this.getCurrentHandler().getClassifierRules();
    }
    /**
     * Get video container selectors for current site
     * @returns {Array<string>} CSS selectors
     */
    getVideoContainerSelectors() {
      const handler = this.getCurrentHandler();
      return handler.getVideoContainerSelectors();
    }
    /**
     * Detect special videos for current site
     * @param {Document} document - Document object
     * @returns {Array<HTMLMediaElement>} Additional videos found
     */
    detectSpecialVideos(document2) {
      const handler = this.getCurrentHandler();
      return handler.detectSpecialVideos(document2);
    }
    /**
     * Cleanup current handler
     */
    cleanup() {
      if (this.currentHandler) {
        this.currentHandler.cleanup();
        this.currentHandler = null;
      }
    }
    /**
     * Force refresh of current handler (useful for SPA navigation)
     */
    refresh() {
      this.cleanup();
      this.currentHandler = null;
    }
  };
  window.VSC.siteHandlerManager = new SiteHandlerManager();

  // src/site-handlers/scripts/netflix.js
  window.addEventListener(
    "message",
    (event) => {
      if (event.origin !== "https://www.netflix.com" || event.data.action !== "videospeed-seek" || !event.data.seekMs) {
        return;
      }
      const videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
      const playerSessionId = videoPlayer.getAllPlayerSessionIds()[0];
      const currentTime = videoPlayer.getCurrentTimeBySessionId(playerSessionId);
      videoPlayer.getVideoPlayerBySessionId(playerSessionId).seek(currentTime + event.data.seekMs);
    },
    false
  );

  // src/content/inject.js
  var VideoSpeedExtension = class {
    constructor() {
      this.config = null;
      this.actionHandler = null;
      this.eventManager = null;
      this.mutationObserver = null;
      this.mediaObserver = null;
      this.deferredMediaListeners = /* @__PURE__ */ new Map();
      this.acceptingMedia = true;
      this.initialized = false;
    }
    /**
     * Initialize the extension
     */
    async initialize() {
      try {
        if (!location.hostname.includes("linkedin.com")) {
          return;
        }
        this.VideoController = window.VSC.VideoController;
        this.ActionHandler = window.VSC.ActionHandler;
        this.EventManager = window.VSC.EventManager;
        this.logger = window.VSC.logger;
        this.initializeWhenReady = window.VSC.DomUtils.initializeWhenReady;
        this.siteHandlerManager = window.VSC.siteHandlerManager;
        this.VideoMutationObserver = window.VSC.VideoMutationObserver;
        this.MediaElementObserver = window.VSC.MediaElementObserver;
        this.MESSAGE_TYPES = window.VSC.Constants.MESSAGE_TYPES;
        this.logger.info("Video Speed Controller starting...");
        this.config = window.VSC.videoSpeedConfig;
        await this.config.load();
        if (this.config.settings._abort) {
          this.logger.debug("Extension disabled on this site \u2014 aborting init");
          return;
        }
        this.deferDOMWork(document);
      } catch (error) {
        this.logger.error(`Failed to initialize Video Speed Controller: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
    }
    /**
     * Initialize for a specific document
     * @param {Document} document - Document to initialize
     */
    initializeDocument(document2) {
      try {
        if (window.VSC.initialized) {
          return;
        }
        window.VSC.initialized = true;
        this.eventManager.setupEventListeners(document2);
        this.deferExpensiveOperations(document2);
        this.logger.debug("Document initialization completed");
      } catch (error) {
        this.logger.error(`Failed to initialize document: ${error.message}`);
      }
    }
    /**
     * Defer expensive operations to avoid blocking page load
     * @param {Document} document - Document to defer operations for
     */
    deferExpensiveOperations(document2) {
      const callback = () => {
        try {
          if (!this.acceptingMedia) {
            return;
          }
          if (this.mutationObserver) {
            this.mutationObserver.start(document2);
            this.logger.debug("Mutation observer started for document");
          }
          this.deferredMediaScan(document2);
        } catch (error) {
          this.logger.error(`Failed to complete deferred operations: ${error.message}`);
        }
      };
      if (window.requestIdleCallback) {
        requestIdleCallback(callback);
      } else {
        setTimeout(callback, 100);
      }
    }
    /**
     * Perform media scanning in a non-blocking way
     * @param {Document} document - Document to scan
     */
    deferredMediaScan(document2) {
      const performChunkedScan = () => {
        try {
          if (!this.acceptingMedia) {
            return;
          }
          const lightMedia = this.mediaObserver.scanForMediaLight(document2);
          lightMedia.forEach((media) => {
            this.onVideoFound(media, media.parentElement || media.parentNode);
          });
          this.logger.info(
            `Attached controllers to ${lightMedia.length} media elements (light scan)`
          );
          if (lightMedia.length === 0) {
            this.scheduleComprehensiveScan(document2);
          }
        } catch (error) {
          this.logger.error(`Failed to scan media elements: ${error.message}`);
        }
      };
      if (window.requestIdleCallback) {
        requestIdleCallback(performChunkedScan);
      } else {
        setTimeout(performChunkedScan, 200);
      }
    }
    /**
     * Schedule a comprehensive scan if the light scan didn't find anything
     * @param {Document} document - Document to scan comprehensively
     */
    scheduleComprehensiveScan(document2) {
      setTimeout(() => {
        try {
          if (!this.acceptingMedia) {
            return;
          }
          const comprehensiveMedia = this.mediaObserver.scanAll(document2);
          comprehensiveMedia.forEach((media) => {
            if (!media.vsc) {
              this.onVideoFound(media, media.parentElement || media.parentNode);
            }
          });
          this.logger.info(
            `Comprehensive scan found ${comprehensiveMedia.length} additional media elements`
          );
        } catch (error) {
          this.logger.error(`Failed comprehensive media scan: ${error.message}`);
        }
      }, 1e3);
    }
    /**
     * Defer DOM work via requestIdleCallback to yield to site frameworks
     * before injecting CSS, controllers, and observers.
     */
    deferDOMWork(document2) {
      const doWork = () => {
        if (!this.acceptingMedia) {
          return;
        }
        this.injectControllerCSS();
        this.setupCSSLiveUpdates();
        this.siteHandlerManager.initialize(document2);
        this.eventManager = new this.EventManager(this.config, null);
        this.actionHandler = new this.ActionHandler(this.config, this.eventManager);
        this.eventManager.actionHandler = this.actionHandler;
        this.setupObservers();
        this.initializeWhenReady(document2, (doc) => {
          if (this.acceptingMedia) {
            this.initializeDocument(doc);
          }
        });
        this.logger.info("Video Speed Controller initialized successfully");
        this.initialized = true;
      };
      if (window.requestIdleCallback) {
        requestIdleCallback(doWork);
      } else {
        setTimeout(doWork, 0);
      }
    }
    /**
     * Resolve domain-based CSS selectors for a hostname.
     * Matching domains: selector stripped (rule applies unconditionally).
     * Non-matching: entire rule removed. Stripping (vs neutering with a dead
     * selector) ensures perf-sensitive selectors like [style*=...] inside
     * non-matching rules never reach the browser's style invalidation engine.
     * @param {string} css - CSS containing domain marker selectors
     * @param {string} [hostname] - Hostname to resolve; defaults to the document host
     * @returns {string} CSS containing only matching and unscoped rules
     */
    preprocessDomainCSS(css, hostname = location.hostname) {
      const normalizedHostname = hostname.replace(/^www\./, "");
      return css.replace(
        /:root\[style\*='--vsc-domain:\s*"([^"]+)"'\]([^{]*)\{([^}]*)\}/g,
        (match, domain, selector, body) => domain === normalizedHostname ? `${selector.trim()} {${body}}` : ""
      );
    }
    /**
     * Inject controller CSS via adoptedStyleSheets — pure CSSOM, zero DOM
     * mutations. <style> elements trigger page-level MutationObservers on
     * sites with complex frameworks, breaking their internal state.
     *
     * Two separate sheets: _controllerSheet (built-in defaults, domain-
     * preprocessed, never changes at runtime) and _customSheet (user
     * additions, injected raw, live-updatable). Keeps them separate so
     * user CSS edits don't re-preprocess the defaults.
     */
    injectControllerCSS() {
      try {
        if (this._controllerSheet) {
          return;
        }
        this._controllerSheet = new CSSStyleSheet();
        this._controllerSheet.replaceSync(
          this.preprocessDomainCSS(window.VSC.Constants.DEFAULT_CONTROLLER_CSS)
        );
        const toAdopt = [this._controllerSheet];
        const customCSS = this.config.settings.customCSS || "";
        if (customCSS) {
          this._customSheet = new CSSStyleSheet();
          this._customSheet.replaceSync(customCSS);
          toAdopt.push(this._customSheet);
        }
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...toAdopt];
      } catch (error) {
        this.logger.error(`Failed to inject controller CSS: ${error.message}`);
      }
    }
    /** Live-update the user's custom CSS when options are saved. */
    setupCSSLiveUpdates() {
      document.documentElement.addEventListener("VSC_STORAGE_CHANGED", (e) => {
        if (e.detail?.customCSS?.newValue === void 0 || !this._controllerSheet) {
          return;
        }
        const customCSS = e.detail.customCSS.newValue || "";
        if (customCSS) {
          if (!this._customSheet) {
            this._customSheet = new CSSStyleSheet();
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, this._customSheet];
          }
          this._customSheet.replaceSync(customCSS);
        } else if (this._customSheet) {
          document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
            (s) => s !== this._customSheet
          );
          this._customSheet = null;
        }
      });
    }
    /**
     * Set up observers for DOM changes and video detection
     */
    setupObservers() {
      this.mediaObserver = new this.MediaElementObserver(this.config, this.siteHandlerManager);
      this.mutationObserver = new this.VideoMutationObserver(
        this.config,
        (video, parent) => this.onVideoFound(video, parent),
        (video) => this.onVideoRemoved(video),
        this.mediaObserver
      );
    }
    /**
     * Handle newly found video element
     * @param {HTMLMediaElement} video - Video element
     * @param {HTMLElement} parent - Parent element
     */
    onVideoFound(video, parent) {
      try {
        if (!this.acceptingMedia) {
          this.logger.debug("Skipping media attachment after extension teardown");
          return;
        }
        if (this.mediaObserver && !this.mediaObserver.isValidMediaElement(video)) {
          this.logger.debug("Video element is not valid for controller attachment");
          return;
        }
        if (video.vsc) {
          this.logger.debug("Video already has controller attached");
          return;
        }
        if (video.readyState < 2) {
          if (this.deferredMediaListeners.has(video)) {
            return;
          }
          this.logger.debug(
            "Deferring controller until loadeddata (readyState=%d)",
            video.readyState
          );
          const listener = () => {
            this.deferredMediaListeners.delete(video);
            this.onVideoFound(video, parent);
          };
          this.deferredMediaListeners.set(video, listener);
          video.addEventListener("loadeddata", listener, { once: true });
          return;
        }
        this.clearDeferredMediaListener(video);
        const shouldStartHidden = this.mediaObserver ? this.mediaObserver.shouldStartHidden(video) : false;
        this.logger.debug(
          "Attaching controller to new video element",
          shouldStartHidden ? "(starting hidden)" : ""
        );
        video.vsc = new this.VideoController(
          video,
          parent,
          this.config,
          this.actionHandler,
          shouldStartHidden
        );
      } catch (error) {
        this.logger.error(`Failed to attach controller to video: ${error.message}`);
      }
    }
    /**
     * Remove one pending loadeddata listener without retaining its media key.
     * @param {HTMLMediaElement} video
     * @private
     */
    clearDeferredMediaListener(video) {
      const listener = this.deferredMediaListeners.get(video);
      if (!listener) {
        return;
      }
      video.removeEventListener("loadeddata", listener);
      this.deferredMediaListeners.delete(video);
    }
    /** Remove all pending media listeners during teardown. @private */
    clearDeferredMediaListeners() {
      for (const [video, listener] of this.deferredMediaListeners) {
        video.removeEventListener("loadeddata", listener);
      }
      this.deferredMediaListeners.clear();
    }
    /**
     * Tear down the extension: remove all controllers, stop observers, clean up listeners.
     * Counterpart to initialize() — leaves the page as if VSC was never active.
     */
    teardown() {
      this.acceptingMedia = false;
      this.clearDeferredMediaListeners();
      if (!this.initialized) {
        return;
      }
      this.logger.info("Tearing down Video Speed Controller");
      const videos = window.VSC.stateManager ? window.VSC.stateManager.getAllMediaElements() : [];
      for (const video of videos) {
        if (video.vsc) {
          video.vsc.remove();
        }
      }
      if (this.mutationObserver) {
        this.mutationObserver.stop();
        this.mutationObserver = null;
      }
      if (this.eventManager) {
        this.eventManager.cleanup();
        this.eventManager = null;
      }
      if (this.siteHandlerManager) {
        this.siteHandlerManager.cleanup();
      }
      if (document.adoptedStyleSheets) {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
          (s) => s !== this._controllerSheet && s !== this._customSheet
        );
      }
      this._controllerSheet = null;
      this._customSheet = null;
      this.actionHandler = null;
      this.mediaObserver = null;
      this.initialized = false;
      window.VSC.initialized = false;
    }
    /**
     * Handle removed video element
     * @param {HTMLMediaElement} video - Video element
     */
    onVideoRemoved(video) {
      try {
        this.clearDeferredMediaListener(video);
        if (video.vsc) {
          this.logger.debug("Removing controller from video element");
          video.vsc.remove();
        }
      } catch (error) {
        this.logger.error(`Failed to remove video controller: ${error.message}`);
      }
    }
  };
  (function() {
    const extension = new VideoSpeedExtension();
    document.documentElement.addEventListener("VSC_MESSAGE", (event) => {
      const message = event.detail;
      if (typeof message === "object" && message.type && message.type.startsWith("VSC_")) {
        const videos = window.VSC.stateManager ? window.VSC.stateManager.getAllMediaElements() : [];
        switch (message.type) {
          case window.VSC.Constants.MESSAGE_TYPES.SET_SPEED:
            if (message.payload && typeof message.payload.speed === "number") {
              const { MIN, MAX } = window.VSC.Constants.SPEED_LIMITS;
              const targetSpeed = Math.min(Math.max(message.payload.speed, MIN), MAX);
              const authorityBatch = extension.actionHandler.createAuthorityBatch();
              videos.forEach((video) => {
                if (video.vsc) {
                  extension.actionHandler.adjustSpeed(video, targetSpeed, { authorityBatch });
                } else {
                  video.playbackRate = targetSpeed;
                }
              });
              window.VSC.logger?.debug(
                `Set speed to ${targetSpeed} on ${videos.length} media elements`
              );
            }
            break;
          case window.VSC.Constants.MESSAGE_TYPES.ADJUST_SPEED:
            if (message.payload && typeof message.payload.delta === "number") {
              const delta = message.payload.delta;
              const authorityBatch = extension.actionHandler.createAuthorityBatch();
              videos.forEach((video) => {
                if (video.vsc) {
                  extension.actionHandler.adjustSpeed(video, delta, {
                    relative: true,
                    authorityBatch
                  });
                } else {
                  const { MIN: sMin, MAX: sMax } = window.VSC.Constants.SPEED_LIMITS;
                  const newSpeed = Math.min(Math.max(video.playbackRate + delta, sMin), sMax);
                  video.playbackRate = newSpeed;
                }
              });
              window.VSC.logger?.debug(
                `Adjusted speed by ${delta} on ${videos.length} media elements`
              );
            }
            break;
          case window.VSC.Constants.MESSAGE_TYPES.RESET_SPEED: {
            const authorityBatch = extension.actionHandler.createAuthorityBatch();
            videos.forEach((video) => {
              if (video.vsc) {
                extension.actionHandler.resetSpeed(video, 1, void 0, { authorityBatch });
              } else {
                video.playbackRate = 1;
              }
            });
            window.VSC.logger?.debug(`Reset speed on ${videos.length} media elements`);
            break;
          }
          case window.VSC.Constants.MESSAGE_TYPES.TOGGLE_DISPLAY:
            if (extension.actionHandler) {
              extension.actionHandler.runAction("display", null, null);
            }
            break;
          case window.VSC.Constants.MESSAGE_TYPES.TEARDOWN:
            extension.teardown();
            break;
        }
      }
    });
    if (window.VSC_controller && window.VSC_controller.initialized) {
      window.VSC.logger?.info("VSC already initialized, skipping re-injection");
      return;
    }
    extension.initialize().catch((error) => {
      window.VSC.logger.error(`Extension initialization failed: ${error.message}`);
    });
    window.VSC_controller = extension;
  })();
})();
