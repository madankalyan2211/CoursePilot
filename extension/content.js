/**
 * CoursePilot Chrome Extension — Content Script
 * Multi-Platform: LinkedIn Learning, Coursera & L&T EduTech
 * Automates video playback and auto-advances lessons with interactive quiz safety pauses.
 */

(function () {
  let isRunning = false;
  let isPausedForUser = false;
  let seekOffset = 2.5;

  // Track the current video/lesson state to prevent re-seeking the same video while playing
  let activeVideoKey = null;
  let hasSeekedCurrentVideo = false;
  let lastCompletedVideoKey = null;
  let advanceAttemptCount = 0;
  let lastAdvanceTime = 0;

  let loopIntervalId = null;
  let isProcessingTick = false;

  const isCoursera = window.location.hostname.includes('coursera.org');
  const isLnt = window.location.hostname.includes('lntedutech.com');
  const isLinkedIn = !isCoursera && !isLnt && window.location.hostname.includes('linkedin.com');
  const platformName = isLnt ? 'L&T EduTech' : (isCoursera ? 'Coursera' : 'LinkedIn Learning');

  // Configurable LinkedIn Learning settings
  const LINKEDIN_PLAYBACK_RATE_DEFAULT = 4.0;
  const LINKEDIN_COMPLETION_TARGET = 0.72; // Target 72% genuine playback progress before completion monitoring
  const LINKEDIN_COMPLETION_WAIT_TIMEOUT_MS = 20000;
  let linkedInPlaybackRate = LINKEDIN_PLAYBACK_RATE_DEFAULT;

  // Idempotent per-video state tracking for LinkedIn Learning
  let linkedInState = {
    contentId: null,
    started: false,
    targetReached: false,
    targetReachedTimestamp: 0,
    completionDetected: false,
    advancing: false,
    waitStartTime: 0,
    loggedTimeout: false
  };

  function resetLinkedInState(newContentId = null) {
    linkedInState = {
      contentId: newContentId,
      started: false,
      targetReached: false,
      targetReachedTimestamp: 0,
      completionDetected: false,
      advancing: false,
      waitStartTime: 0,
      loggedTimeout: false
    };
  }

  // Load initial settings
  chrome.storage.local.get(['isRunning', 'seekOffset', 'hasStarred', 'linkedInPlaybackRate'], (res) => {
    isRunning = Boolean(res.isRunning) && Boolean(res.hasStarred);
    seekOffset = Number(res.seekOffset) || 2.5;
    if (res.linkedInPlaybackRate) {
      linkedInPlaybackRate = Number(res.linkedInPlaybackRate) || LINKEDIN_PLAYBACK_RATE_DEFAULT;
    }
    if (isRunning) {
      startAutomationEngine();
    }
  });

  function handleStart() {
    chrome.storage.local.get(['hasStarred'], (res) => {
      if (!res.hasStarred) {
        logToPopup('Please star the GitHub repo to unlock CoursePilot.', 'warning');
        return;
      }
      isRunning = true;
      isPausedForUser = false;
      activeVideoKey = null;
      hasSeekedCurrentVideo = false;
      advanceAttemptCount = 0;
      resetLinkedInState();
      chrome.storage.local.set({ isRunning: true, isPausedForUser: false });
      logToPopup(`Starting CoursePilot (${platformName})...`, 'info');
      syncStateToStorage();
      startAutomationEngine();
    });
  }

  function handleStop() {
    isRunning = false;
    isPausedForUser = false;
    activeVideoKey = null;
    hasSeekedCurrentVideo = false;
    resetLinkedInState();
    chrome.storage.local.set({ isRunning: false, isPausedForUser: false });
    syncStateToStorage();
    removeFloatingOverlay();
    stopAutomationEngine();
    logToPopup('Automation stopped.', 'warning');
  }

  function handleResume() {
    isPausedForUser = false;
    activeVideoKey = null;
    hasSeekedCurrentVideo = false;
    resetLinkedInState();
    chrome.storage.local.set({ isPausedForUser: false });
    syncStateToStorage();
    removeFloatingOverlay();
    logToPopup('Resuming automation...', 'info');
    startAutomationEngine();
  }

  // Window global hooks for direct injection
  window.__coursepilotStart = handleStart;
  window.__coursepilotStop = handleStop;
  window.__coursepilotResume = handleResume;

  // Listen for storage changes as guaranteed communication channel
  chrome.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.linkedInPlaybackRate) {
        linkedInPlaybackRate = Number(changes.linkedInPlaybackRate.newValue) || LINKEDIN_PLAYBACK_RATE_DEFAULT;
        const effectiveRate = Math.min(16.0, Math.max(0.5, linkedInPlaybackRate));
        const video = findActiveVideoElement();
        if (video) {
          try { video.playbackRate = effectiveRate; } catch (e) {}
          if (isLinkedIn) {
            applyLinkedInNativePlayback(effectiveRate);
          }
        }
        console.log(`[CoursePilot][LinkedIn] playbackRate dynamically updated to ${effectiveRate}x (requested: ${linkedInPlaybackRate}x)`);
      }
      if (changes.actionTrigger) {
        const action = changes.actionTrigger.newValue;
        if (action === 'START') handleStart();
        else if (action === 'STOP') handleStop();
        else if (action === 'RESUME') handleResume();
      }
    }
  });

  // Listen for popup messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START') {
      handleStart();
      sendResponse({ status: 'STARTED' });
    } else if (request.action === 'STOP') {
      handleStop();
      sendResponse({ status: 'STOPPED' });
    } else if (request.action === 'RESUME') {
      handleResume();
      sendResponse({ status: 'RESUMED' });
    } else if (request.action === 'GET_STATE') {
      const details = getPageDetails();
      syncStateToStorage();
      sendResponse(details);
    }
    return true;
  });

  function syncStateToStorage() {
    if (!chrome.runtime?.id) return;
    try {
      const details = getPageDetails();
      chrome.storage.local.set({
        activeCourseState: details,
        isRunning,
        isPausedForUser
      });
    } catch {}
  }

  function logToPopup(text, level = 'info') {
    if (!chrome.runtime?.id) return;
    try {
      const timestamp = new Date().toTimeString().split(' ')[0];
      chrome.runtime.sendMessage({
        type: 'LOG',
        log: { timestamp, text, level }
      }).catch(() => {});
    } catch {}
  }

  function normalizeUrl(rawUrl) {
    try {
      const u = new URL(rawUrl);
      return `${u.origin}${u.pathname}`.replace(/\/$/, '');
    } catch {
      return (rawUrl || '').split('?')[0].split('#')[0].replace(/\/$/, '');
    }
  }

  function getPageDetails() {
    const currentUrl = window.location.href;

    // Multi-platform title extraction
    let courseTitle = '';
    const courseSelectors = isLnt ? [
      'h1.course-title',
      'h1.course_title',
      '.course-header h1',
      '.course-name',
      'div[class*="courseTitle" i]',
      'div[class*="course-title" i]',
      'h1[class*="title" i]',
      '.breadcrumb-item.active',
      'header h1'
    ] : (isCoursera ? [
      'a[data-e2e="course-link"]',
      'div.course-name',
      'h1[data-e2e="course-title"]',
      '.rc-CourseNav a[href*="/learn/"]',
      'header h1'
    ] : [
      'h1[data-test-classroom-header-title]',
      'h1.classroom-nav__course-title',
      'h1.classroom-header__title',
      'header h1'
    ]);

    for (const sel of courseSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        courseTitle = el.innerText.trim();
        break;
      }
    }

    let lessonTitle = '';
    const lessonSelectors = isLnt ? [
      'h1.lesson-title',
      'h2.lesson-title',
      'h2.topic-title',
      'div[class*="lessonTitle" i]',
      'div[class*="topicTitle" i]',
      '.active-topic',
      'li.active .topic-name',
      'h1[class*="topic" i]',
      'h2',
      'h1'
    ] : (isCoursera ? [
      'h1.title',
      'h1.item-title',
      'h1[data-e2e="item-name"]',
      'h2.item-title',
      '.rc-ItemNav h1'
    ] : [
      'h2.classroom-nav__item-title--current',
      'h2[data-test-item-title]',
      'h1.classroom-nav__item-title',
      'h1[class*="lesson-title" i]'
    ]);

    for (const sel of lessonSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        lessonTitle = el.innerText.trim();
        break;
      }
    }

    return {
      url: currentUrl,
      platform: platformName,
      courseTitle: courseTitle || document.title.split('|')[0].split('-')[0].trim(),
      lessonTitle: lessonTitle || 'Current Lesson',
      isRunning,
      isPausedForUser
    };
  }

  /**
   * Precise Assessment / Quiz Detection
   * Avoids false positives from sidebar elements or discussion icons
   */
  function isAssessmentPage() {
    // If an active video is present and ready, it is a video page
    const video = findActiveVideoElement();
    if (video && typeof video.duration === 'number' && video.duration > 0) {
      return false;
    }

    const url = window.location.pathname.toLowerCase();
    // Specific quiz/exam URL routes
    if (
      url.includes('/quiz') || 
      url.includes('/assessment') || 
      url.includes('/exam') || 
      url.includes('/test/') ||
      url.includes('/assignment-submission') ||
      url.includes('/peer-review') ||
      url.includes('/ungradedwidget')
    ) {
      return true;
    }

    // Specific visible quiz DOM elements (scoped strictly to classroom main container)
    const specificQuizSelectors = [
      'form[data-test-quiz-form]',
      'fieldset.quiz-question',
      '[data-test-quiz-container]:not(.hidden)',
      '.classroom-quiz:not(.hidden)',
      '.rc-Quiz:not(.hidden)',
      '.rc-QuizForm',
      '.rc-Assignment:not(.hidden)',
      '.rc-Exam:not(.hidden)',
      '.rc-PeerReview:not(.hidden)',
      'div[data-e2e="assessment-view"]',
      'div[data-test-assessment-view]',
      'div[data-test-practice-challenge] form'
    ];

    for (const sel of specificQuizSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        return true;
      }
    }

    return false;
  }

  /**
   * Identifies the current active TOC item container in LinkedIn Learning
   */
  function getActiveLinkedInTocItem() {
    const currentPath = window.location.pathname.replace(/\/$/, '');

    // Active TOC selectors for LinkedIn Learning
    const activeSelectors = [
      'li.classroom-toc-item--selected',
      'li.classroom-toc-item--active',
      'li[data-test-toc-item-active]',
      '[data-test-toc-item-active]',
      '.classroom-toc-item--active',
      '.classroom-toc-item--selected',
      '.classroom-sidebar__item--active',
      '.classroom-sidebar__item--selected',
      'li.classroom-nav__item--active',
      'li.classroom-toc-item.active',
      'li[aria-current="true"]'
    ];

    for (const sel of activeSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    // Match by current URL pathname in sidebar links
    try {
      const tocLinks = document.querySelectorAll('a[href*="/learning/"]');
      for (const a of tocLinks) {
        const p = (a.pathname || '').replace(/\/$/, '');
        if (p && p === currentPath) {
          return a.closest('li') || a.closest('.classroom-toc-item') || a.closest('.classroom-sidebar__item') || a.parentElement;
        }
      }
    } catch (e) {}

    // Fallback: aria-current="page"
    const pageLink = document.querySelector('a[aria-current="page"], a[aria-current="true"]');
    if (pageLink) {
      return pageLink.closest('li') || pageLink.closest('.classroom-toc-item') || pageLink.parentElement;
    }

    return null;
  }

  /**
   * Strictly verifies whether the CURRENT LinkedIn lesson has transitioned to COMPLETED.
   * Returns true ONLY if:
   *   1. The active TOC item has the green checkmark (check-small/check-medium/.classroom-toc-item--completed), AND
   *   2. It NO LONGER has the white/gray in-progress circle (circle-small/circle-medium).
   */
  function isCurrentLessonCompletedOnLinkedIn() {
    const activeItem = getActiveLinkedInTocItem();
    if (activeItem) {
      const hasCircle = Boolean(activeItem.querySelector('svg[data-test-icon="circle-small"], svg[data-test-icon="circle-medium"], svg[data-test-icon*="circle" i], .classroom-toc-item--in-progress'));
      const hasCheck = Boolean(activeItem.querySelector('svg[data-test-icon="check-small"], svg[data-test-icon="check-medium"], svg[data-test-icon*="check" i], .completed-icon'));
      const hasCompletedClass = activeItem.classList.contains('classroom-toc-item--completed') ||
                                activeItem.classList.contains('completed') ||
                                activeItem.classList.contains('classroom-sidebar__item--completed') ||
                                activeItem.hasAttribute('data-test-toc-item-completed');

      // Strictly verified: checkmark is present AND in-progress circle is absent
      if ((hasCheck || hasCompletedClass) && !hasCircle) {
        return true;
      }
      return false;
    }

    // Fallback: check matching URL TOC links
    try {
      const currentPath = window.location.pathname.replace(/\/$/, '');
      const allTocLinks = document.querySelectorAll('a[href*="/learning/"]');
      for (const a of allTocLinks) {
        const p = (a.pathname || '').replace(/\/$/, '');
        if (p && p === currentPath) {
          const parent = a.closest('li') || a.closest('.classroom-toc-item') || a.closest('.classroom-sidebar__item') || a.parentElement;
          if (parent) {
            const hasCircle = Boolean(parent.querySelector('svg[data-test-icon="circle-small"], svg[data-test-icon="circle-medium"], svg[data-test-icon*="circle" i], .classroom-toc-item--in-progress'));
            const hasCheck = Boolean(parent.querySelector('svg[data-test-icon="check-small"], svg[data-test-icon="check-medium"], svg[data-test-icon*="check" i], .completed-icon'));
            const hasCompletedClass = parent.classList.contains('classroom-toc-item--completed') ||
                                      parent.classList.contains('completed') ||
                                      parent.classList.contains('classroom-sidebar__item--completed') ||
                                      parent.hasAttribute('data-test-toc-item-completed');

            if ((hasCheck || hasCompletedClass) && !hasCircle) {
              return true;
            }
          }
        }
      }
    } catch (e) {}

    return false;
  }

  function isMarkedCompletedInToc() {
    const activeTocSelectors = [
      '[data-test-toc-item-active]',
      '.classroom-toc-item--active',
      '.classroom-toc-item--selected',
      '.classroom-sidebar__item--active',
      '.classroom-sidebar__item--selected',
      'li.classroom-nav__item--active',
      'li.classroom-toc-item.active',
      'li.classroom-toc-item[aria-current="true"]',
      'li[aria-current="true"]',
      'li[aria-selected="true"]',
      'li.active',
      'a[aria-current="page"]',
      'a.active'
    ];

    for (const sel of activeTocSelectors) {
      const items = document.querySelectorAll(sel);
      for (const item of items) {
        if (item) {
          // If it contains a check icon, it's completed (green checkmark!)
          const checkIcon = item.querySelector('svg[data-test-icon*="check" i], svg[data-test-icon="check-small"], svg[data-test-icon="check-medium"], .completed-icon, svg[data-e2e*="complete"], .rc-CompletedIcon, i.fa-check-circle, .completed');
          if (checkIcon) return true;

          // Class-based checks
          if (
            item.classList.contains('completed') ||
            item.classList.contains('classroom-toc-item--completed') ||
            item.getAttribute('data-test-toc-item-completed') !== null
          ) {
            return true;
          }
        }
      }
    }

    // Also check if current URL lesson item in sidebar is marked completed
    try {
      const currentPath = window.location.pathname.replace(/\/$/, '');
      const allTocLinks = document.querySelectorAll('a[href*="/learning/"], a[href*="/learn/"]');
      for (const a of allTocLinks) {
        const p = (a.pathname || '').replace(/\/$/, '');
        if (p && p === currentPath) {
          const parent = a.closest('li') || a.closest('div') || a.parentElement;
          if (parent) {
            const hasCheck = parent.querySelector('svg[data-test-icon*="check" i], svg[data-e2e*="complete"], .completed-icon');
            if (hasCheck || parent.classList.contains('classroom-toc-item--completed') || parent.classList.contains('completed')) {
              return true;
            }
          }
        }
      }
    } catch {}

    return false;
  }

  function findActiveVideoElement() {
    // 1. Resilient container-scoped lookup (LinkedIn classroom player / Coursera video player)
    const videoContainerSelectors = [
      '.classroom-layout video',
      '.classroom-video-player video',
      '.classroom-player video',
      '.video-js video',
      'div[data-playback-type="video"] video',
      'div[data-e2e="video-player"] video'
    ];

    for (const sel of videoContainerSelectors) {
      const v = document.querySelector(sel);
      if (v && !isNaN(v.duration) && v.duration > 0 && (v.offsetWidth > 0 || v.offsetHeight > 0 || v.readyState >= 1)) {
        return v;
      }
    }

    // 2. Direct video class selectors
    const videoSelectors = [
      'video.vjs-tech',
      'video.c-video',
      'video[src]',
      'video'
    ];

    for (const sel of videoSelectors) {
      const videos = document.querySelectorAll(sel);
      for (const v of videos) {
        if (v && (v.offsetWidth > 0 || v.offsetHeight > 0 || !isNaN(v.duration))) {
          return v;
        }
      }
    }
    return null;
  }

  function getVideoIdentifier(video) {
    const details = getPageDetails();
    const url = normalizeUrl(window.location.href);
    const src = video?.currentSrc || video?.src || '';
    return `${url}::${details.lessonTitle}::${src}`;
  }

  function startAutomationEngine() {
    if (loopIntervalId) clearInterval(loopIntervalId);
    loopIntervalId = setInterval(automationTick, 400);
  }

  function stopAutomationEngine() {
    if (loopIntervalId) {
      clearInterval(loopIntervalId);
      loopIntervalId = null;
    }
    isProcessingTick = false;
  }

  /**
   * Main World Bridge Helper
   * Injects injected.js via external src (chrome-extension:// URL) if not already loaded by manifest.
   * Complies 100% with LinkedIn's Content Security Policy.
   */
  function ensureMainWorldBridge() {
    if (document.documentElement?.getAttribute('data-coursepilot-main-installed') === 'true') {
      return;
    }
    if (window.__coursepilot_bridge_loaded) return;
    try {
      if (!document.querySelector('script[data-coursepilot-injected]')) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.setAttribute('data-coursepilot-injected', 'true');
        script.onload = () => {
          window.__coursepilot_bridge_loaded = true;
          try { document.documentElement.setAttribute('data-coursepilot-main-installed', 'true'); } catch(e) {}
          script.remove();
        };
        (document.head || document.documentElement).appendChild(script);
      }
    } catch (e) {}
  }

  /**
   * LinkedIn Accelerated Playback
   * Controls DOM video directly and coordinates with main-world injected.js
   * for Video.js configuration, speed-locking, and lowest-bitrate (360p) streaming.
   * Completely CSP-compliant: zero inline script tags.
   */
  function applyLinkedInNativePlayback(rate = 4.0) {
    const safeRate = Math.min(16.0, Math.max(0.5, Number(rate) || 4.0));
    ensureMainWorldBridge();

    // 1. Direct DOM manipulation in content script context
    const vids = document.querySelectorAll('video');
    vids.forEach(v => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      try { v.volume = 0; } catch(e) {}
      if (Math.abs(v.playbackRate - safeRate) > 0.05) {
        try {
          const setter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')?.set;
          if (setter) {
            setter.call(v, safeRate);
          } else {
            v.playbackRate = safeRate;
          }
        } catch (e) {
          try { v.playbackRate = safeRate; } catch(e2) {}
        }
      }
      if (v.paused && v.duration > 0) {
        v.play().catch(() => {});
      }
    });

    // 2. Message main-world script to unlock Video.js and lock target rate
    window.postMessage({
      source: 'coursepilot_extension',
      action: 'APPLY_PLAYBACK_RATE',
      rate: safeRate
    }, '*');
  }

  /**
   * Diagnostic Observer for LinkedIn Learning
   * Main-world network hooks are active in injected.js.
   */
  function installLinkedInDiagnosticObserver() {
    ensureMainWorldBridge();
  }

  /**
   * Fast-forward helper preserved for Coursera & L&T EduTech
   * Directly operates on video DOM elements without script injection.
   */
  function triggerCourseraLntFastForward(offset = 2.5) {
    const vids = document.querySelectorAll('video');
    vids.forEach(v => {
      if (v && v.duration > 0) {
        v.muted = true;
        v.defaultMuted = true;
        try { v.playbackRate = 16.0; } catch(e) {}
        const target = Math.max(0, v.duration - offset);
        if (v.currentTime < target) {
          v.currentTime = target;
        }
        v.play().catch(() => {});
        v.dispatchEvent(new Event('timeupdate', { bubbles: true }));
      }
    });
  }

  let videoCompletedTimestamp = 0;

  async function automationTick() {
    if (!chrome.runtime?.id) {
      stopAutomationEngine();
      return;
    }
    if (!isRunning || isPausedForUser || isProcessingTick) return;
    isProcessingTick = true;

    try {
      // 1. Check for Quiz / Assessment
      if (isAssessmentPage()) {
        logToPopup('Quiz / Assessment Detected — Pausing Automation', 'warning');
        isPausedForUser = true;
        const details = getPageDetails();
        chrome.storage.local.set({ isPausedForUser: true, activeCourseState: details });
        chrome.runtime.sendMessage({ type: 'QUIZ_DETECTED', data: details }).catch(() => {});
        showFloatingOverlay();
        syncStateToStorage();
        return;
      }

      // 2. Locate Active Video Player
      const video = findActiveVideoElement();
      if (!video) {
        if (Date.now() - lastAdvanceTime < 3000) {
          return;
        }
        if (lastCompletedVideoKey && Date.now() - lastAdvanceTime > 6000) {
          advanceToNextTopic();
        }
        return;
      }

      // 3. Check if video element is ready with valid duration
      const duration = video.duration;
      if (isNaN(duration) || duration <= 0) {
        return;
      }

      const currentKey = getVideoIdentifier(video);

      // ---------------------------------------------------------
      // LinkedIn Learning: Genuine Accelerated Playback Flow
      // ---------------------------------------------------------
      if (isLinkedIn) {
        installLinkedInDiagnosticObserver();

        // Detect video change / reset per-video state
        if (currentKey !== linkedInState.contentId) {
          activeVideoKey = currentKey;
          resetLinkedInState(currentKey);
          syncStateToStorage();
          console.log('[CoursePilot][LinkedIn] video detected');
        }

        if (linkedInState.advancing) {
          return;
        }

        // Step A: Start native accelerated playback (idempotent, once per video)
        if (!linkedInState.started) {
          if (video.readyState >= 1) {
            video.muted = true;
            video.defaultMuted = true;
            const effectiveRate = Math.min(16.0, Math.max(0.5, linkedInPlaybackRate));
            try {
              video.playbackRate = effectiveRate;
            } catch (e) {}

            applyLinkedInNativePlayback(effectiveRate);

            if (video.paused) {
              video.play().catch(() => {});
            }

            linkedInState.started = true;
            console.log('[CoursePilot][LinkedIn] native playback started');
            console.log(`[CoursePilot][LinkedIn] playbackRate=${effectiveRate}x (requested: ${linkedInPlaybackRate}x)`);
            const details = getPageDetails();
            logToPopup(`▶ ${details.lessonTitle}: Playing natively (${effectiveRate}x, muted)...`, 'info');
          }
          return;
        }

        // Step B: Maintain genuine playback during watchdog ticks
        if (video.paused && !video.ended && !linkedInState.completionDetected) {
          video.play().catch(() => {});
        }
        if (!video.muted) {
          video.muted = true;
          video.defaultMuted = true;
        }

        // Active Stall Detector: detect if playhead is stuck loading
        const currentPos = video.currentTime;
        if (linkedInState.lastPlayheadPos === undefined) {
          linkedInState.lastPlayheadPos = currentPos;
          linkedInState.lastPlayheadCheck = Date.now();
          linkedInState.stallTicks = 0;
        } else {
          const elapsed = Date.now() - (linkedInState.lastPlayheadCheck || Date.now());
          if (elapsed >= 800) {
            const progress = currentPos - linkedInState.lastPlayheadPos;
            linkedInState.lastPlayheadPos = currentPos;
            linkedInState.lastPlayheadCheck = Date.now();

            if (progress < 0.05 && !video.paused && !video.ended && !linkedInState.completionDetected) {
              linkedInState.stallTicks = (linkedInState.stallTicks || 0) + 1;
              if (linkedInState.stallTicks >= 2) {
                // Video has been stuck buffering for 1.6s — nudge playhead forward to clear pipeline stall
                console.log('[CoursePilot][LinkedIn] Playhead stall detected — nudging video pipeline...');
                if (duration > 0 && currentPos + 0.25 < duration) {
                  video.currentTime = currentPos + 0.2;
                }
                video.play().catch(() => {});
                linkedInState.stallTicks = 0;
              }
            } else {
              linkedInState.stallTicks = 0;
            }
          }
        }

        // Only enforce accelerated rate when video has sufficient buffer data (readyState >= 3)
        // If readyState < 3 (buffering), let browser buffer fill up before accelerating
        const effectiveRate = Math.min(16.0, Math.max(0.5, linkedInPlaybackRate));
        if (video.readyState >= 3 && Math.abs(video.playbackRate - effectiveRate) > 0.05) {
          try { video.playbackRate = effectiveRate; } catch (e) {}
          applyLinkedInNativePlayback(effectiveRate);
        }

        // Step C: Monitor genuine watched time
        const progressRatio = duration > 0 ? (video.currentTime / duration) : 0;
        if (!linkedInState.targetReached && progressRatio >= LINKEDIN_COMPLETION_TARGET) {
          linkedInState.targetReached = true;
          linkedInState.targetReachedTimestamp = Date.now();
          linkedInState.waitStartTime = Date.now();
          const percentStr = `${Math.round(LINKEDIN_COMPLETION_TARGET * 100)}%`;
          console.log(`[CoursePilot][LinkedIn] watched target reached: ${percentStr}`);
          console.log('[CoursePilot][LinkedIn] waiting for LinkedIn completion state');
          const details = getPageDetails();
          logToPopup(`⏳ ${details.lessonTitle}: Reached ${percentStr} watched target — waiting for LinkedIn completion state...`, 'info');
        }

        // Step D: Verify LinkedIn's own completion state (green checkmark on active lesson)
        const isCurrentLessonCompleted = isCurrentLessonCompletedOnLinkedIn();

        if (isCurrentLessonCompleted) {
          if (!linkedInState.completionDetected) {
            linkedInState.completionDetected = true;
            console.log('[CoursePilot][LinkedIn] green check detected');
            const details = getPageDetails();
            logToPopup(`✓ ${details.lessonTitle}: Green check detected!`, 'success');
          }

          if (!linkedInState.advancing) {
            linkedInState.advancing = true;
            console.log('[CoursePilot][LinkedIn] advancing to next lesson');
            lastCompletedVideoKey = currentKey;
            lastAdvanceTime = Date.now();
            advanceToNextTopic();
          }
          return;
        }

        // Step E: If target reached or video naturally ended, wait for LinkedIn to update
        if (linkedInState.targetReached || video.ended || video.currentTime >= duration - 0.5) {
          const elapsedWait = Date.now() - (linkedInState.waitStartTime || Date.now());
          if (elapsedWait > LINKEDIN_COMPLETION_WAIT_TIMEOUT_MS) {
            if (!linkedInState.loggedTimeout) {
              linkedInState.loggedTimeout = true;
              console.warn('[CoursePilot][LinkedIn] completion not confirmed');
              logToPopup(`[LinkedIn] Completion not confirmed yet — waiting for green check...`, 'warning');
            }
          }
          // Do NOT advance! Continue waiting for LinkedIn tracking
          return;
        }

        return;
      }

      // ---------------------------------------------------------
      // Coursera & L&T EduTech: Existing Fast-Forward & Completion
      // ---------------------------------------------------------
      if (currentKey !== activeVideoKey) {
        activeVideoKey = currentKey;
        hasSeekedCurrentVideo = false;
        videoCompletedTimestamp = 0;
        advanceAttemptCount = 0;
        syncStateToStorage();
      }

      if (!hasSeekedCurrentVideo) {
        if (video.readyState >= 1) {
          triggerCourseraLntFastForward(seekOffset);

          video.muted = true;
          try {
            video.playbackRate = 16.0;
          } catch {}

          const targetTime = Math.max(0, duration - seekOffset);
          video.currentTime = targetTime;
          video.dispatchEvent(new Event('seeking', { bubbles: true }));
          video.dispatchEvent(new Event('seeked', { bubbles: true }));
          video.dispatchEvent(new Event('timeupdate', { bubbles: true }));
          if (video.paused) {
            video.play().catch(() => {});
          }

          hasSeekedCurrentVideo = true;
          const details = getPageDetails();
          logToPopup(`▶ ${details.lessonTitle}: Fast-forwarding (16x) to end...`, 'info');
        }
        return;
      }

      if (hasSeekedCurrentVideo) {
        triggerCourseraLntFastForward(seekOffset);
        if (video.paused && !video.ended) {
          video.play().catch(() => {});
        }
      }

      const isNaturalEnd = video.ended || video.currentTime >= duration - 0.1;
      const isTocCompleted = isMarkedCompletedInToc();

      if (hasSeekedCurrentVideo && (isNaturalEnd || isTocCompleted)) {
        if (!videoCompletedTimestamp) {
          videoCompletedTimestamp = Date.now();
        }

        const elapsedSinceEnd = Date.now() - videoCompletedTimestamp;

        if (isTocCompleted || elapsedSinceEnd >= 4000) {
          if (lastCompletedVideoKey !== currentKey) {
            lastCompletedVideoKey = currentKey;
            const details = getPageDetails();
            const statusLabel = isTocCompleted ? '✓ Completed' : '✓ Completed';
            logToPopup(`✓ ${details.lessonTitle}: ${statusLabel}`, 'success');
          }

          const now = Date.now();
          if (now - lastAdvanceTime >= 1000) {
            lastAdvanceTime = now;
            videoCompletedTimestamp = 0;
            advanceToNextTopic();
          }
        }
      }
    } catch (err) {
      if (err?.message?.includes('Extension context invalidated') || !chrome.runtime?.id) {
        stopAutomationEngine();
        return;
      }
      console.warn('CoursePilot tick error:', err);
    } finally {
      isProcessingTick = false;
    }
  }

  function advanceToNextTopic() {
    advanceAttemptCount++;
    lastAdvanceTime = Date.now();
    logToPopup('Advancing to next topic video...', 'info');

    // Strategy 1: Autoplay banner or toast prompt (OFFICIAL platform completion trigger)
    const autoplaySelectors = [
      'button[data-test-autoplay-next-button]',
      '.next-item-banner button',
      '.classroom-player-toast button',
      '[data-test-autoplay-container] button',
      'button[data-e2e="next-item-banner-button"]',
      '.rc-NextItemToast button',
      '.rc-AutoplayToast button',
      '.autoplay-banner button'
    ];

    for (const sel of autoplaySelectors) {
      const bannerBtns = document.querySelectorAll(sel);
      for (const bannerBtn of bannerBtns) {
        if (bannerBtn && !bannerBtn.hasAttribute('disabled')) {
          bannerBtn.click();
          return;
        }
      }
    }

    // Strategy 2: Dedicated classroom / item next buttons
    const nextButtonSelectors = isLnt ? [
      'button.next-btn',
      'button.btn-next',
      'a.next-btn',
      'a.btn-next',
      'button[class*="next" i]',
      'a[class*="next" i]',
      'button[aria-label*="next" i]',
      'a[aria-label*="next" i]',
      'button[title*="next" i]',
      '.next-button button',
      '#nextBtn',
      '#btnNext'
    ] : (isCoursera ? [
      'button[data-e2e="next-item"]',
      'a[data-e2e="next-item"]',
      'button[data-e2e="next-button"]',
      'a[data-e2e="next-button"]',
      'a[aria-label="Next Item" i]',
      'button[aria-label="Next Item" i]',
      'a[aria-label="Next lesson" i]',
      'button[aria-label="Next lesson" i]',
      '.rc-NextItemButton button',
      '.rc-NextItemButton a'
    ] : [
      'button[data-test-classroom-nav-next-button]',
      '.classroom-nav button[aria-label="Next item" i]',
      '.classroom-nav button[aria-label="Next lesson" i]',
      '.classroom-nav button[aria-label="Next video" i]',
      '.classroom-nav button[aria-label*="Next" i]',
      '.classroom-player-controls button[aria-label*="Next" i]',
      'button.classroom-nav__next-button',
      'button[data-control-name="next_item"]',
      'button[data-control-name="next_chapter"]',
      'button[data-control-name="next_section"]',
      '.vjs-next-button'
    ]);

    for (const sel of nextButtonSelectors) {
      const nextBtns = document.querySelectorAll(sel);
      for (const nextBtn of nextBtns) {
        if (nextBtn) {
          const isEnabled = !nextBtn.hasAttribute('disabled') && nextBtn.getAttribute('aria-disabled') !== 'true';
          const isVisible = nextBtn.offsetWidth > 0 || nextBtn.offsetHeight > 0 || nextBtn.offsetParent !== null;
          if (isEnabled && isVisible) {
            nextBtn.scrollIntoView?.({ block: 'nearest' });
            nextBtn.click();
            return;
          }
        }
      }
    }

    // Strategy 3: Native Shift+N hotkey for LinkedIn Learning
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'N', code: 'KeyN', shiftKey: true, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'N', code: 'KeyN', shiftKey: true, bubbles: true }));
    } catch {}

    // Strategy 4: Syllabus / TOC item links
    if (isCoursera) {
      const nav = document.querySelector('.rc-CourseNav, .rc-LessonsList, .rc-WeekNav, .rc-NavigationDrawer') || document.body;
      const allLinks = Array.from(nav.querySelectorAll('a[href*="/learn/"], a[data-e2e*="item"]'));
      const currentPath = window.location.pathname.replace(/\/$/, '');

      const lessonLinks = allLinks.filter(a => {
        const p = (a.pathname || '').replace(/\/$/, '');
        return p && !p.endsWith('/home') && !p.endsWith('/my-learning');
      });

      const currentIdx = lessonLinks.findIndex(a => {
        const p = (a.pathname || '').replace(/\/$/, '');
        return p === currentPath || a.classList.contains('active') || a.getAttribute('aria-current') === 'page';
      });

      if (currentIdx >= 0 && currentIdx + 1 < lessonLinks.length) {
        const nextAnchor = lessonLinks[currentIdx + 1];
        nextAnchor.scrollIntoView?.({ block: 'nearest' });
        nextAnchor.click();
        return;
      }
    } else if (isLnt) {
      const syllabus = document.querySelector('.course-curriculum, .course-syllabus, .curriculum, .syllabus, .sidebar') || document.body;
      const allLinks = Array.from(syllabus.querySelectorAll('a[href*="lntedutech.com"], li[class*="item" i], div[class*="topic" i]'));
      const currentHref = window.location.href;
      const currentIdx = allLinks.findIndex(el => (el.href && el.href === currentHref) || el.classList.contains('active'));
      if (currentIdx >= 0 && currentIdx + 1 < allLinks.length) {
        const nextEl = allLinks[currentIdx + 1];
        nextEl.scrollIntoView?.({ block: 'nearest' });
        nextEl.click();
        return;
      }
    } else {
      // LinkedIn Learning TOC Items
      const sidebar = document.querySelector('.classroom-sidebar, .classroom-toc, [data-test-classroom-sidebar]') || document.body;
      const allLinks = Array.from(sidebar.querySelectorAll('a[href*="/learning/"]'));
      const currentPath = window.location.pathname.replace(/\/$/, '');

      const lessonLinks = allLinks.filter(a => {
        const p = (a.pathname || '').replace(/\/$/, '');
        return p.includes('/learning/') && !p.includes('/me') && !p.includes('/topics');
      });

      const currentIdx = lessonLinks.findIndex(a => {
        const p = (a.pathname || '').replace(/\/$/, '');
        return p === currentPath || a.closest('.classroom-toc-item--active') || a.closest('[data-test-toc-item-active]');
      });

      if (currentIdx >= 0 && currentIdx + 1 < lessonLinks.length) {
        const nextAnchor = lessonLinks[currentIdx + 1];
        nextAnchor.scrollIntoView?.({ block: 'nearest' });
        nextAnchor.click();
        return;
      }
    }

    if (advanceAttemptCount % 6 === 0) {
      logToPopup('Waiting for next lesson link to become available...', 'warning');
    }
  }

  function showFloatingOverlay() {
    removeFloatingOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'coursepilot-floating-overlay';
    overlay.innerHTML = `
      <div id="cp-hud-card" style="
        position: fixed;
        top: 24px;
        right: 24px;
        width: 320px;
        background: rgba(20, 20, 26, 0.95);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 214, 10, 0.35);
        border-radius: 16px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 214, 10, 0.15);
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif;
        color: #f5f5f7;
        z-index: 2147483647;
        cursor: grab;
        user-select: none;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #ffd60a; box-shadow: 0 0 8px #ffd60a; display: inline-block;"></span>
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ffd60a; letter-spacing: 0.5px;">Assessment Detected</span>
          </div>
          <a href="https://github.com/madankalyan2211/CoursePilot" target="_blank" style="font-size: 11px; color: #ffd60a; text-decoration: none; display: flex; align-items: center; gap: 4px; background: rgba(255, 214, 10, 0.15); padding: 2px 7px; border-radius: 99px; font-weight: 600; transition: background 0.2s;">
            ⭐ Star on GitHub
          </a>
        </div>

        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.75); line-height: 1.4; margin-bottom: 12px;">
          Automation paused for interactive quiz / exam. Submit your answers and click <strong>Resume</strong>.
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="cp-hud-resume" style="
            flex: 1;
            background: #0a84ff;
            color: #fff;
            border: none;
            border-radius: 9px;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            font-family: inherit;
          ">Resume</button>
          <button id="cp-hud-stop" style="
            background: rgba(255, 69, 58, 0.2);
            color: #ff453a;
            border: 1px solid rgba(255, 69, 58, 0.35);
            border-radius: 9px;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
          ">Stop</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('cp-hud-resume')?.addEventListener('click', () => {
      isPausedForUser = false;
      removeFloatingOverlay();
      logToPopup('Resumed from floating HUD', 'info');
      handleResume();
    });

    document.getElementById('cp-hud-stop')?.addEventListener('click', () => {
      handleStop();
    });

    // Make Draggable
    const card = document.getElementById('cp-hud-card');
    if (card) {
      let isDragging = false;
      let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
      card.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
        isDragging = true;
        const rect = card.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        startX = e.clientX;
        startY = e.clientY;
        card.style.right = 'auto';
        card.style.left = `${initialLeft}px`;
        card.style.top = `${initialTop}px`;
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        card.style.left = `${initialLeft + e.clientX - startX}px`;
        card.style.top = `${initialTop + e.clientY - startY}px`;
      });
      window.addEventListener('mouseup', () => { isDragging = false; });
    }
  }

  function removeFloatingOverlay() {
    const el = document.getElementById('coursepilot-floating-overlay');
    if (el) el.remove();
  }

  // SPA navigation listeners to immediately trigger on route changes
  window.addEventListener('popstate', () => {
    activeVideoKey = null;
    hasSeekedCurrentVideo = false;
    resetLinkedInState();
  });
  window.addEventListener('hashchange', () => {
    activeVideoKey = null;
    hasSeekedCurrentVideo = false;
    resetLinkedInState();
  });
})();


