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

  // Configurable LinkedIn Learning settings (Default: 100x)
  const LINKEDIN_PLAYBACK_RATE_DEFAULT = 100.0;
  let linkedInPlaybackRate = LINKEDIN_PLAYBACK_RATE_DEFAULT;

  // WeakMap tracking for LinkedIn video playback controllers (one per video element)
  const linkedInControllers = new WeakMap();
  let currentLinkedInController = null;

  // Load initial settings
  chrome.storage.local.get(['isRunning', 'seekOffset', 'hasStarred', 'linkedInPlaybackRate'], (res) => {
    isRunning = Boolean(res.isRunning) && Boolean(res.hasStarred);
    seekOffset = Number(res.seekOffset) || 2.5;
    if (res.linkedInPlaybackRate) {
      linkedInPlaybackRate = Number(res.linkedInPlaybackRate) || LINKEDIN_PLAYBACK_RATE_DEFAULT;
    }
    if (isLinkedIn) {
      installLinkedInVideoObserver();
      applySpeedGlobally(linkedInPlaybackRate);
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
      if (currentLinkedInController) {
        currentLinkedInController.destroy();
        currentLinkedInController = null;
      }
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
    if (currentLinkedInController) {
      currentLinkedInController.destroy();
      currentLinkedInController = null;
    }
    const video = findActiveVideoElement();
    if (video) {
      try { video.playbackRate = 1.0; } catch (e) {}
    }
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
    if (currentLinkedInController) {
      currentLinkedInController.destroy();
      currentLinkedInController = null;
    }
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
        const newSpeed = Number(changes.linkedInPlaybackRate.newValue) || LINKEDIN_PLAYBACK_RATE_DEFAULT;
        applySpeedGlobally(newSpeed);
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
    } else if (request.action === 'SET_LINKEDIN_SPEED') {
      const newSpeed = Number(request.speed) || LINKEDIN_PLAYBACK_RATE_DEFAULT;
      applySpeedGlobally(newSpeed);
      sendResponse({ status: 'SPEED_UPDATED', speed: newSpeed });
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
      const hasCheck = Boolean(activeItem.querySelector('svg[data-test-icon*="check" i], .completed-icon, [data-test-icon="check-circle"]'));
      const hasCompletedClass = activeItem.classList.contains('classroom-toc-item--completed') ||
                                activeItem.classList.contains('completed') ||
                                activeItem.classList.contains('classroom-sidebar__item--completed') ||
                                activeItem.hasAttribute('data-test-toc-item-completed');
      if (hasCheck || hasCompletedClass) {
        return true;
      }
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
            const hasCheck = Boolean(parent.querySelector('svg[data-test-icon*="check" i], .completed-icon, [data-test-icon="check-circle"]'));
            const hasCompletedClass = parent.classList.contains('classroom-toc-item--completed') ||
                                      parent.classList.contains('completed') ||
                                      parent.classList.contains('classroom-sidebar__item--completed') ||
                                      parent.hasAttribute('data-test-toc-item-completed');
            if (hasCheck || hasCompletedClass) {
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
      if (v && (v.offsetWidth > 0 || v.offsetHeight > 0 || v.readyState >= 1 || (!isNaN(v.duration) && v.duration > 0))) {
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
        if (v && (v.offsetWidth > 0 || v.offsetHeight > 0 || v.readyState >= 1 || !isNaN(v.duration))) {
          return v;
        }
      }
    }

    // 3. Fallback: Search all videos across document and Shadow DOMs
    const allVideos = findAllVideos(document);
    for (const v of allVideos) {
      if (v && (!v.paused || v.currentTime > 0 || v.readyState >= 1 || (v.offsetWidth > 0 && v.offsetHeight > 0))) {
        return v;
      }
    }

    return allVideos.length > 0 ? allVideos[0] : null;
  }

  function getVideoIdentifier(video) {
    return normalizeUrl(window.location.href);
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
   * Video Speed Controller (VSC) Speed Arbitration Core
   * Ported from github.com/igrigorik/videospeed
   */
  class VscSpeedArbitration {
    constructor() {
      this.pendingWrites = new WeakMap();
    }

    noteWrite(video, rate, { suppressPropagation = true } = {}) {
      let queue = this.pendingWrites.get(video);
      if (!queue) {
        queue = [];
        this.pendingWrites.set(video, queue);
      }
      queue.push({
        rate: Number(rate.toFixed(2)),
        at: performance.now(),
        suppressPropagation,
      });
      if (queue.length > 5) {
        queue.shift();
      }
    }

    consumeEcho(video, rate) {
      let queue = this.pendingWrites.get(video);
      if (!queue || queue.length === 0) {
        return false;
      }
      const now = performance.now();
      queue = queue.filter(write => now - write.at <= 2000);
      if (queue.length === 0) {
        this.pendingWrites.delete(video);
        return false;
      }
      this.pendingWrites.set(video, queue);

      const target = Number(rate.toFixed(2));
      const idx = queue.findIndex(write => Math.abs(write.rate - target) <= 0.05);
      if (idx === -1) {
        return false;
      }
      const echo = queue[idx];
      queue.splice(0, idx + 1);
      return echo;
    }
  }

  const vscArbitration = new VscSpeedArbitration();

  /**
   * LinkedIn Native High-Speed Playback Controller
   * Built directly on Video Speed Controller (github.com/igrigorik/videospeed)
   * Architecture: OBSERVE MEDIA → WRITE RATE WITH ECHO FILTER → CAPTURE RATECHANGE → NATURAL ADVANCE
   */
  class LinkedInPlaybackController {
    constructor(video, requestedRate = 100) {
      this.video = video;
      this.requestedRate = Number(requestedRate) || 100;
      this.effectiveRate = 1.0;
      this.initialized = false;
      this.playing = false;
      this.completed = false;
      this.advancing = false;
      this.lastRestoreTime = -999999;
      this.restoreCooldownMs = 250;

      // Bound event listeners
      this._onRateChange = this.handleRateChange.bind(this);
      this._onEnded = this.handleEnded.bind(this);
      this._onTimeUpdate = this.handleTimeUpdate.bind(this);
      this._onPlay = this.handlePlay.bind(this);
      this._onPause = this.handlePause.bind(this);
      this._onSeeked = this.handleSeeked.bind(this);
      this._onLoadStart = this.handleLoadStart.bind(this);

      this.init();
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;

      console.log('[CoursePilot][LinkedIn] Video detected');

      // Attach event listeners using Video Speed Controller's capture-phase strategy
      this.video.addEventListener('ratechange', this._onRateChange, true);
      this.video.addEventListener('play', this._onPlay);
      this.video.addEventListener('pause', this._onPause);
      this.video.addEventListener('seeked', this._onSeeked);
      this.video.addEventListener('loadstart', this._onLoadStart);
      this.video.addEventListener('ended', this._onEnded);
      this.video.addEventListener('timeupdate', this._onTimeUpdate);

      // Mute video to prevent audio distortion at high speeds
      this.video.muted = true;
      this.video.defaultMuted = true;
      try { this.video.volume = 0; } catch (e) {}

      // Write initial rate using VSC arbitration write strategy
      this.applySpeed();

      // Start natural playback
      if (this.video.paused) {
        this.video.play()
          .then(() => {
            this.playing = true;
            console.log('[CoursePilot][LinkedIn] Playback started');
          })
          .catch(() => {});
      } else {
        this.playing = true;
        console.log('[CoursePilot][LinkedIn] Playback started');
      }

      const details = getPageDetails();
      logToPopup(`▶ ${details.lessonTitle}: Playing (${this.effectiveRate}x, native)...`, 'info');
    }

    /**
     * VSC writeRate: note write token in arbitration registry, apply safe rate to video
     */
    applySpeed() {
      let targetRate = Number(this.requestedRate);
      if (isNaN(targetRate) || targetRate <= 0) targetRate = 100;

      // Chromium clamps playbackRate to 16.0; values > 16.0 throw NotSupportedError
      let safeRate = targetRate;
      if (safeRate > 16.0) {
        safeRate = 16.0;
      }

      // Record echo token in VSC arbitration filter with propagation suppression enabled
      vscArbitration.noteWrite(this.video, safeRate, { suppressPropagation: true });

      try {
        this.video.playbackRate = safeRate;
      } catch (err) {
        try {
          safeRate = Math.min(16.0, Math.max(0.0625, safeRate));
          this.video.playbackRate = safeRate;
        } catch (err2) {}
      }

      this.effectiveRate = this.video.playbackRate;
      console.log(`[CoursePilot][LinkedIn] Requested speed: ${this.requestedRate}x`);
      console.log(`[CoursePilot][LinkedIn] Effective speed: ${this.effectiveRate}x`);
    }

    setSpeed(newRate) {
      this.requestedRate = Number(newRate) || 100;
      this.applySpeed();
      const details = getPageDetails();
      logToPopup(`⚡ Speed: ${this.effectiveRate}x (requested ${this.requestedRate}x)`, 'info');
    }

    /**
     * VSC handleRateChange: consume write echo tokens and suppress site fightback
     */
    handleRateChange(e) {
      if (!this.initialized || this.completed) return;

      const currentRate = this.video.playbackRate;

      // Check if this ratechange is an echo of our own write
      const echo = vscArbitration.consumeEcho(this.video, currentRate);
      if (echo) {
        if (echo.suppressPropagation && e && typeof e.stopImmediatePropagation === 'function') {
          // Hide our write from LinkedIn's page scripts to prevent reactive fightback
          e.stopImmediatePropagation();
        }
        return;
      }

      // If LinkedIn or external script modified playbackRate away from effective rate
      if (Math.abs(currentRate - this.effectiveRate) > 0.05) {
        if (e && typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }

        const now = performance.now();
        if (now - this.lastRestoreTime > this.restoreCooldownMs) {
          this.lastRestoreTime = now;
          console.log('[CoursePilot][LinkedIn] Rate reset detected');
          this.applySpeed();
          console.log(`[CoursePilot][LinkedIn] Rate restored: ${this.effectiveRate}x`);
        }
      }
    }

    /**
     * VSC Lifecycle Speed Enforcement (play, seeked, loadstart)
     */
    handlePlay() {
      this.playing = true;
      if (!this.completed && Math.abs(this.video.playbackRate - this.effectiveRate) > 0.05) {
        this.applySpeed();
      }
    }

    handlePause() {
      this.playing = false;
    }

    handleSeeked() {
      if (!this.completed && Math.abs(this.video.playbackRate - this.effectiveRate) > 0.05) {
        this.applySpeed();
      }
    }

    handleLoadStart() {
      if (!this.completed) {
        this.applySpeed();
      }
    }

    handleTimeUpdate() {
      if (!this.initialized || this.completed) return;
      this.checkCompletion();
    }

    handleEnded() {
      if (!this.initialized || this.completed) return;
      this.checkCompletion();
    }

    checkCompletion() {
      if (this.completed || !this.initialized) return;

      const v = this.video;
      const duration = v.duration;
      if (isNaN(duration) || duration <= 0) return;

      const isEnded = v.ended || v.currentTime >= Math.max(0, duration - 0.5);
      const isTocComplete = isCurrentLessonCompletedOnLinkedIn();

      if (isEnded || isTocComplete) {
        this.completed = true;
        console.log('[CoursePilot][LinkedIn] Lesson completed');
        const details = getPageDetails();
        logToPopup(`✓ ${details.lessonTitle}: Completed (${this.effectiveRate}x)`, 'success');
        this.advance();
      }
    }

    advance() {
      if (this.advancing) return;
      this.advancing = true;
      console.log('[CoursePilot][LinkedIn] Advancing to next lesson');
      advanceToNextTopic();
    }

    destroy() {
      this.initialized = false;
      this.playing = false;
      try {
        this.video.removeEventListener('ratechange', this._onRateChange, true);
        this.video.removeEventListener('play', this._onPlay);
        this.video.removeEventListener('pause', this._onPause);
        this.video.removeEventListener('seeked', this._onSeeked);
        this.video.removeEventListener('loadstart', this._onLoadStart);
        this.video.removeEventListener('ended', this._onEnded);
        this.video.removeEventListener('timeupdate', this._onTimeUpdate);
      } catch (e) {}
    }
  }

  function ensureLinkedInController() {
    if (!isLinkedIn) return null;
    const video = findActiveVideoElement();
    if (!video) return null;

    const currentKey = getVideoIdentifier(video);
    let controller = linkedInControllers.get(video);
    if (!controller || controller !== currentLinkedInController || currentKey !== activeVideoKey) {
      if (currentLinkedInController) {
        currentLinkedInController.destroy();
        currentLinkedInController = null;
      }

      activeVideoKey = currentKey;
      console.log('[CoursePilot][LinkedIn] New video detected');
      controller = new LinkedInPlaybackController(video, linkedInPlaybackRate);
      linkedInControllers.set(video, controller);
      currentLinkedInController = controller;
      syncStateToStorage();
    }
    return controller;
  }

  function installLinkedInVideoObserver() {
    if (!isLinkedIn || window.__coursepilot_observer_installed) return;
    window.__coursepilot_observer_installed = true;

    const observer = new MutationObserver((mutations) => {
      let foundVideo = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.tagName === 'VIDEO' || node.querySelector?.('video')) {
              foundVideo = true;
              break;
            }
          }
        }
        if (foundVideo) break;
      }
      if (foundVideo) {
        if (isRunning && !isPausedForUser) {
          automationTick();
        } else {
          ensureLinkedInController();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function applySpeedGlobally(speed) {
    const targetRate = Number(speed) || linkedInPlaybackRate || 100;
    const safeRate = Math.min(16.0, Math.max(0.0625, targetRate));
    linkedInPlaybackRate = targetRate;

    const videos = findAllVideos(document);
    videos.forEach((v) => {
      try {
        vscArbitration.noteWrite(v, safeRate, { suppressPropagation: true });
        v.playbackRate = safeRate;
        v.defaultPlaybackRate = safeRate;
      } catch (e) {}
    });

    if (isLinkedIn) {
      if (currentLinkedInController) {
        currentLinkedInController.setSpeed(targetRate);
      } else {
        const c = ensureLinkedInController();
        if (c) c.setSpeed(targetRate);
      }
    }

    try {
      window.dispatchEvent(new CustomEvent('__coursepilot_set_speed', { detail: { speed: targetRate } }));
      document.dispatchEvent(new CustomEvent('__coursepilot_set_speed', { detail: { speed: targetRate } }));
    } catch (e) {}
  }

  // Video Speed Controller keyboard shortcuts (S: slower, D: faster, R: reset 1x, G: 16x/100x)
  window.addEventListener('keydown', (e) => {
    if (!isLinkedIn) return;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'd' || e.key === 'D') {
      const current = linkedInPlaybackRate || 1.0;
      let next = current >= 16 ? 16 : (current >= 4 ? current + 2 : current + 0.5);
      applySpeedGlobally(next);
      chrome.storage.local.set({ linkedInPlaybackRate: next });
      logToPopup(`⚡ Speed increased: ${next}x`, 'info');
    } else if (e.key === 's' || e.key === 'S') {
      const current = linkedInPlaybackRate || 1.0;
      let next = Math.max(0.5, current >= 4 ? current - 2 : current - 0.5);
      applySpeedGlobally(next);
      chrome.storage.local.set({ linkedInPlaybackRate: next });
      logToPopup(`⚡ Speed decreased: ${next}x`, 'info');
    } else if (e.key === 'r' || e.key === 'R') {
      applySpeedGlobally(1.0);
      chrome.storage.local.set({ linkedInPlaybackRate: 1.0 });
      logToPopup('⚡ Speed reset to 1.0x', 'info');
    } else if (e.key === 'g' || e.key === 'G') {
      applySpeedGlobally(100.0);
      chrome.storage.local.set({ linkedInPlaybackRate: 100.0 });
      logToPopup('⚡ Speed set to 100x (clamped to 16x)', 'info');
    }
  });

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
      // LinkedIn Learning: Dedicated Native High-Speed Controller
      // (Video Speed Controller Architecture)
      // ---------------------------------------------------------
      if (isLinkedIn) {
        installLinkedInVideoObserver();

        const controller = ensureLinkedInController();
        if (!controller) return;

        // 1. Enforce effective playback rate if site silently reset it
        if (Math.abs(video.playbackRate - controller.effectiveRate) > 0.05) {
          controller.applySpeed();
        }

        // 2. Check completion
        controller.checkCompletion();

        // 3. Ensure playing if not ended or completed
        if (video.paused && !video.ended && !controller.completed) {
          video.play().catch(() => {});
        }
        return;
      }

      // ---------------------------------------------------------
      // Coursera & L&T EduTech: Preserved Fast-Forward Engine
      // ---------------------------------------------------------
      if (currentKey !== activeVideoKey) {
        activeVideoKey = currentKey;
        hasSeekedCurrentVideo = false;
        videoCompletedTimestamp = 0;
        advanceAttemptCount = 0;
        syncStateToStorage();
      }

      const targetTime = Math.max(0, duration - seekOffset);

      if (!hasSeekedCurrentVideo && video.currentTime < targetTime - 0.5) {
        if (video.readyState >= 1) {
          video.muted = true;
          video.defaultMuted = true;
          try { video.volume = 0; } catch (e) {}
          try { video.playbackRate = 16.0; } catch (e) {}

          video.currentTime = targetTime;
          video.dispatchEvent(new Event('seeking', { bubbles: true }));
          video.dispatchEvent(new Event('seeked', { bubbles: true }));
          video.dispatchEvent(new Event('timeupdate', { bubbles: true }));

          if (video.paused) {
            video.play().catch(() => {});
          }

          hasSeekedCurrentVideo = true;
          const details = getPageDetails();
          logToPopup(`▶ ${details.lessonTitle}: Skipped to ${targetTime.toFixed(1)}s / ${duration.toFixed(1)}s`, 'info');
        }
        return;
      }

      // Keep playback active through the final seconds
      if (hasSeekedCurrentVideo && video.paused && !video.ended && video.currentTime < duration - 0.2) {
        video.play().catch(() => {});
      }

      // 6. Check Completion
      const isNaturalEnd = video.ended || video.currentTime >= Math.max(0, duration - 0.6);
      const isTocCompleted = isMarkedCompletedInToc();

      if (hasSeekedCurrentVideo && (isNaturalEnd || isTocCompleted)) {
        if (!videoCompletedTimestamp) {
          videoCompletedTimestamp = Date.now();
        }

        const elapsedSinceEnd = Date.now() - videoCompletedTimestamp;
        const requiredWait = isTocCompleted ? 400 : 2500;

        if (elapsedSinceEnd >= requiredWait) {
          if (lastCompletedVideoKey !== currentKey) {
            lastCompletedVideoKey = currentKey;
            const details = getPageDetails();
            logToPopup(`✓ Completed: ${details.lessonTitle}`, 'success');
          }

          const now = Date.now();
          if (now - lastAdvanceTime >= 800) {
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

  function simulateClick(el) {
    if (!el) return;
    try {
      el.scrollIntoView?.({ block: 'nearest' });
    } catch (e) {}

    const mouseEvents = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (const evtName of mouseEvents) {
      try {
        el.dispatchEvent(new MouseEvent(evtName, { bubbles: true, cancelable: true, view: window }));
      } catch (e) {}
    }

    try {
      el.click();
    } catch (e) {}
  }

  function armDirectNavigationFallback(targetHref) {
    if (!targetHref) return;
    const initialPath = window.location.pathname;
    setTimeout(() => {
      if (window.location.pathname === initialPath) {
        console.log('[CoursePilot] Navigation click did not change URL. Hard navigating to:', targetHref);
        window.location.href = targetHref;
      }
    }, 800);
  }

  function getLinkedInCourseLessons() {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const pathParts = currentPath.split('/').filter(Boolean);
    const courseSlug = (pathParts[0] === 'learning' && pathParts[1]) ? pathParts[1] : '';

    const allAnchors = Array.from(document.querySelectorAll('a[href*="/learning/"]'));

    const uniqueLessons = [];
    const seenPaths = new Set();

    for (const a of allAnchors) {
      try {
        const u = new URL(a.href, window.location.origin);
        const p = u.pathname.replace(/\/$/, '');
        const parts = p.split('/').filter(Boolean);

        if (parts.length >= 3 && parts[0] === 'learning') {
          if (!courseSlug || parts[1] === courseSlug) {
            const lessonSlug = parts[2];
            if (!['me', 'topics', 'browse', 'certificates', 'search'].includes(lessonSlug)) {
              if (!seenPaths.has(p)) {
                seenPaths.add(p);
                uniqueLessons.push({
                  path: p,
                  href: a.href,
                  element: a,
                  title: (a.textContent || a.getAttribute('aria-label') || '').trim().split('\n')[0]
                });
              }
            }
          }
        }
      } catch (e) {}
    }

    return uniqueLessons;
  }

  function advanceToNextTopic() {
    advanceAttemptCount++;
    lastAdvanceTime = Date.now();
    logToPopup('Advancing to next topic video...', 'info');

    // 0. On LinkedIn Learning: expand collapsed accordion sections and compute target
    let linkedInNextTarget = null;
    if (isLinkedIn) {
      const toggles = document.querySelectorAll(
        'button[aria-expanded="false"], .classroom-toc-section__toggle[aria-expanded="false"], [data-test-toc-section-header] button'
      );
      toggles.forEach(btn => {
        try { btn.click(); } catch (e) {}
      });

      const lessons = getLinkedInCourseLessons();
      const currentPath = window.location.pathname.replace(/\/$/, '');
      let currentIdx = lessons.findIndex(item => item.path === currentPath);
      if (currentIdx === -1) {
        const activeItem = getActiveLinkedInTocItem();
        if (activeItem) {
          currentIdx = lessons.findIndex(item => activeItem.contains(item.element));
        }
      }

      if (currentIdx >= 0) {
        if (currentIdx === lessons.length - 1) {
          logToPopup('🎉 Course completed! Reached the final lesson.', 'success');
          if (currentLinkedInController) currentLinkedInController.advancing = false;
          return;
        }
        linkedInNextTarget = lessons[currentIdx + 1];
      } else if (lessons.length > 0) {
        linkedInNextTarget = lessons[0];
      }
    }

    // Strategy 1: Autoplay banner or toast prompt (OFFICIAL platform completion trigger)
    const autoplaySelectors = [
      'button[data-test-autoplay-next-button]',
      'button[data-test-classroom-toast-button]',
      '.classroom-player-toast button',
      '.next-item-banner button',
      '[data-test-autoplay-container] button',
      'button[data-tracking-control-name*="autoplay"]',
      'button[data-e2e="next-item-banner-button"]',
      '.rc-NextItemToast button',
      '.rc-AutoplayToast button',
      '.autoplay-banner button'
    ];

    for (const sel of autoplaySelectors) {
      const bannerBtns = document.querySelectorAll(sel);
      for (const bannerBtn of bannerBtns) {
        if (bannerBtn && !bannerBtn.hasAttribute('disabled')) {
          logToPopup('Advancing via autoplay banner...', 'info');
          simulateClick(bannerBtn);
          if (linkedInNextTarget?.href) {
            armDirectNavigationFallback(linkedInNextTarget.href);
          }
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
      'button[aria-label="Next" i]',
      'button[aria-label*="Next" i]',
      'button[aria-label*="Next video" i]',
      'button[aria-label*="Next lesson" i]',
      'button[aria-label*="Next item" i]',
      'button[data-tracking-control-name*="next" i]',
      'button.classroom-nav__direction-button--next',
      'button.classroom-nav__next-button',
      'button.classroom-nav__button--next',
      'button.classroom-control-bar__next-btn',
      'button[data-test-classroom-nav-next-button]',
      '.classroom-nav button[aria-label*="Next" i]',
      '.classroom-player-controls button[aria-label*="Next" i]',
      'button[data-control-name="next_item"]',
      'button[data-control-name="next_chapter"]',
      'button[data-control-name="next_section"]',
      '.vjs-next-button',
      'a[aria-label*="Next" i]'
    ]);

    for (const sel of nextButtonSelectors) {
      const nextBtns = document.querySelectorAll(sel);
      for (const nextBtn of nextBtns) {
        if (nextBtn) {
          const isEnabled = !nextBtn.hasAttribute('disabled') && nextBtn.getAttribute('aria-disabled') !== 'true';
          const isVisible = nextBtn.offsetWidth > 0 || nextBtn.offsetHeight > 0 || nextBtn.offsetParent !== null;
          if (isEnabled && isVisible) {
            logToPopup('Advancing to next lesson...', 'info');
            simulateClick(nextBtn);
            if (linkedInNextTarget?.href) {
              armDirectNavigationFallback(linkedInNextTarget.href);
            }
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
        simulateClick(nextAnchor);
        return;
      }
    } else if (isLnt) {
      const syllabus = document.querySelector('.course-curriculum, .course-syllabus, .curriculum, .syllabus, .sidebar') || document.body;
      const allLinks = Array.from(syllabus.querySelectorAll('a[href*="lntedutech.com"], li[class*="item" i], div[class*="topic" i]'));
      const currentHref = window.location.href;
      const currentIdx = allLinks.findIndex(el => (el.href && el.href === currentHref) || el.classList.contains('active'));
      if (currentIdx >= 0 && currentIdx + 1 < allLinks.length) {
        const nextEl = allLinks[currentIdx + 1];
        simulateClick(nextEl);
        return;
      }
    } else {
      // LinkedIn Learning TOC Items
      if (linkedInNextTarget && linkedInNextTarget.href) {
        logToPopup(`Advancing to: ${linkedInNextTarget.title || 'Next lesson'}...`, 'info');
        simulateClick(linkedInNextTarget.element);
        const parentBtn = linkedInNextTarget.element.closest('button, li, [role="button"]');
        if (parentBtn && parentBtn !== linkedInNextTarget.element) {
          simulateClick(parentBtn);
        }
        armDirectNavigationFallback(linkedInNextTarget.href);
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

  // Ensure video speed controller is active on LinkedIn Learning
  if (isLinkedIn) {
    installLinkedInVideoObserver();
    setTimeout(() => {
      ensureLinkedInController();
    }, 400);
  }
})();


