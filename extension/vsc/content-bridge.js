(() => {
  // src/utils/blacklist.js
  function isBlacklisted(blacklist, href) {
    if (!blacklist) {
      return false;
    }
    const regStrip2 = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;
    const regEndsWithFlags2 = /\/(?!.*(.).*\1)[gimsuy]*$/;
    const escapeRegExp2 = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
    for (const rawMatch of blacklist.split("\n")) {
      const match = rawMatch.replace(regStrip2, "");
      if (match.length === 0) {
        continue;
      }
      let regexp;
      if (match.startsWith("/")) {
        try {
          const parts = match.split("/");
          if (parts.length < 3) {
            continue;
          }
          const hasFlags = regEndsWithFlags2.test(match);
          const flags = hasFlags ? parts.pop() : "";
          const regex = parts.slice(1, hasFlags ? void 0 : -1).join("/");
          if (!regex) {
            continue;
          }
          regexp = new RegExp(regex, flags);
        } catch {
          continue;
        }
      } else {
        const escapedMatch = escapeRegExp2(match);
        const looksLikeDomain = match.includes(".") && !match.includes("/");
        if (looksLikeDomain) {
          regexp = new RegExp(`(^|\\.|//)${escapedMatch}(\\/|:|$)`);
        } else {
          regexp = new RegExp(escapedMatch);
        }
      }
      if (regexp.test(href)) {
        return true;
      }
    }
    return false;
  }

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

  // src/entries/content-bridge.js
  var SPEED_MIN = 0.07;
  var SPEED_MAX = 16;
  var docEl = document.documentElement;
  var bridgeInitialized = false;
  function dispatchAbort() {
    docEl.dispatchEvent(new CustomEvent("VSC_SETTINGS_READY", { detail: { abort: true } }));
  }
  function init() {
    try {
      if (bridgeInitialized) {
        return;
      }
      bridgeInitialized = true;
      if (!location.hostname.includes("linkedin.com")) {
        return;
      }
      if (location.protocol === "about:") {
        docEl.addEventListener("VSC_REQUEST_SETTINGS", dispatchAbort, { once: true });
        return;
      }
      let disabledForDocument = false;
      let bridgeActive = false;
      const settingsReady = chrome.storage.sync.get(null).catch((error) => {
        console.error("[VSC] Initial settings load failed:", error);
        return null;
      });
      docEl.addEventListener(
        "VSC_REQUEST_SETTINGS",
        async () => {
          const settings = await settingsReady;
          if (!settings) {
            dispatchAbort();
            return;
          }
          const blacklisted = !settings.siteRules && isBlacklisted(settings.blacklist, location.href);
          const siteRuleMatch = matchSiteRule(settings.siteRules, location.href);
          const siteDisabled = siteRuleMatch && siteRuleMatch.enabled === false;
          if (disabledForDocument || settings.enabled === false || blacklisted || siteDisabled) {
            dispatchAbort();
            return;
          }
          const publicSettings = { ...settings };
          delete publicSettings.blacklist;
          delete publicSettings.enabled;
          bridgeActive = true;
          docEl.dispatchEvent(
            new CustomEvent("VSC_SETTINGS_READY", {
              detail: {
                settings: publicSettings,
                hostname: location.hostname.replace(/^www\./, "")
              }
            })
          );
        },
        { once: true }
      );
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== "sync") {
          return;
        }
        const enabledChange = changes.enabled;
        if (enabledChange?.oldValue === false || enabledChange?.newValue === false) {
          disabledForDocument = true;
        }
        if (enabledChange?.newValue === false) {
          bridgeActive = false;
          docEl.dispatchEvent(new CustomEvent("VSC_MESSAGE", { detail: { type: "VSC_TEARDOWN" } }));
          return;
        }
        if (!bridgeActive) {
          return;
        }
        const relayChanges = { ...changes };
        delete relayChanges.enabled;
        delete relayChanges.blacklist;
        if (Object.keys(relayChanges).length > 0) {
          docEl.dispatchEvent(new CustomEvent("VSC_STORAGE_CHANGED", { detail: relayChanges }));
        }
      });
      chrome.runtime.onMessage.addListener((request) => {
        if (bridgeActive) {
          docEl.dispatchEvent(new CustomEvent("VSC_MESSAGE", { detail: request }));
        }
      });
      const handleWriteStorage = (e) => {
        try {
          if (!bridgeActive) {
            return;
          }
          const data = e.detail;
          if (!data || typeof data !== "object") {
            return;
          }
          if ("lastSpeed" in data) {
            const speed = data.lastSpeed;
            if (typeof speed === "number" && Number.isFinite(speed)) {
              chrome.storage.sync.set({
                lastSpeed: Math.min(Math.max(speed, SPEED_MIN), SPEED_MAX)
              });
            }
          }
        } catch (err) {
          if (err.message?.includes("Extension context invalidated")) {
            docEl.removeEventListener("VSC_WRITE_STORAGE", handleWriteStorage);
          }
        }
      };
      docEl.addEventListener("VSC_WRITE_STORAGE", handleWriteStorage);
    } catch (error) {
      console.error("[VSC] Bridge init failed:", error);
    }
  }
  init();
})();
