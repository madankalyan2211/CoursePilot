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
  const platformName = isLnt ? 'L&T EduTech' : (isCoursera ? 'Coursera' : 'LinkedIn Learning');

  // Load initial settings
  chrome.storage.local.get(['isRunning', 'seekOffset', 'hasStarred'], (res) => {
    isRunning = Boolean(res.isRunning) && Boolean(res.hasStarred);
    seekOffset = Number(res.seekOffset) || 2.5;
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
    if (areaName === 'local' && changes.actionTrigger) {
      const action = changes.actionTrigger.newValue;
      if (action === 'START') handleStart();
      else if (action === 'STOP') handleStop();
      else if (action === 'RESUME') handleResume();
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
    const timestamp = new Date().toTimeString().split(' ')[0];
    chrome.runtime.sendMessage({
      type: 'LOG',
      log: { timestamp, text, level }
    }).catch(() => {});
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

  function isMarkedCompletedInToc() {
    const activeTocSelectors = [
      '[data-test-toc-item-active]',
      '.classroom-toc-item--active',
      '.classroom-sidebar__item--active',
      'li.classroom-nav__item--active',
      'li[aria-current="true"]',
      'li.classroom-toc-item.active',
      'li.active',
      'a[aria-current="page"]',
      'a.active'
    ];

    for (const sel of activeTocSelectors) {
      const item = document.querySelector(sel);
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

    // Also check if current URL lesson item in sidebar is marked completed
    try {
      const currentPath = window.location.pathname.replace(/\/$/, '');
      const allTocLinks = document.querySelectorAll('a[href*="/learning/"], a[href*="/learn/"]');
      for (const a of allTocLinks) {
        const p = (a.pathname || '').replace(/\/$/, '');
        if (p && p === currentPath) {
          const parent = a.closest('li') || a.parentElement || a;
          if (
            parent.querySelector('svg[data-test-icon*="check" i], svg[data-e2e*="complete"], .completed-icon') ||
            parent.classList.contains('classroom-toc-item--completed') ||
            parent.classList.contains('completed')
          ) {
            return true;
          }
        }
      }
    } catch {}

    return false;
  }

  function findActiveVideoElement() {
    const videoSelectors = [
      'video.c-video',
      'video.vjs-tech',
      '.video-js video',
      'div[data-playback-type="video"] video',
      'div[data-e2e="video-player"] video',
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

  let videoCompletedTimestamp = 0;

  async function automationTick() {
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
        // If we recently tried to advance, let the page settle
        if (Date.now() - lastAdvanceTime < 3000) {
          return;
        }
        // Try fallback advancement if we appear stuck after completion
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

      // 4. If this is a new video, reset per-video flags
      if (currentKey !== activeVideoKey) {
        activeVideoKey = currentKey;
        hasSeekedCurrentVideo = false;
        videoCompletedTimestamp = 0;
        advanceAttemptCount = 0;
        syncStateToStorage();
      }

      // 5. Milestone Progress Sweeping & Natural End Fast-Forward
      if (!hasSeekedCurrentVideo) {
        if (video.readyState >= 1) {
          // Sweep milestones (25%, 50%, 75%, 90%) to satisfy milestone-based analytics
          if (duration > 6) {
            const milestones = [0.25, 0.5, 0.75, 0.9];
            for (const m of milestones) {
              const mTime = duration * m;
              video.currentTime = mTime;
              video.dispatchEvent(new Event('timeupdate'));
            }
          }

          // Seek to 0.7s before the end so natural playback reaches the absolute end
          const targetTime = Math.max(0, duration - 0.7);
          video.currentTime = targetTime;
          try {
            video.playbackRate = 2.0;
          } catch {}
          video.dispatchEvent(new Event('seeking'));
          video.dispatchEvent(new Event('seeked'));
          video.dispatchEvent(new Event('timeupdate'));
          if (video.paused) {
            video.play().catch(() => {});
          }
          hasSeekedCurrentVideo = true;
          const details = getPageDetails();
          logToPopup(`▶ ${details.lessonTitle}: Fast-forwarding to end (${targetTime.toFixed(1)}s / ${duration.toFixed(1)}s)...`, 'info');
        }
        return;
      }

      // 6. Ensure video reaches the natural end and plays through the last frame
      if (hasSeekedCurrentVideo) {
        if (video.paused && !video.ended) {
          video.play().catch(() => {});
        }
      }

      // 7. Strict Green Checkmark Verification in TOC
      const isNaturalEnd = video.ended || video.currentTime >= duration - 0.05;
      const isTocCompleted = isMarkedCompletedInToc();

      if (hasSeekedCurrentVideo && (isNaturalEnd || isTocCompleted)) {
        if (!videoCompletedTimestamp) {
          videoCompletedTimestamp = Date.now();
        }

        const elapsedSinceEnd = Date.now() - videoCompletedTimestamp;

        // If green checkmark is present, or after generous timeout (6s)
        if (isTocCompleted || elapsedSinceEnd >= 6000) {
          if (lastCompletedVideoKey !== currentKey) {
            lastCompletedVideoKey = currentKey;
            const details = getPageDetails();
            const statusLabel = isTocCompleted ? '✓ Green Tick Confirmed' : '✓ Completed';
            logToPopup(`✓ ${details.lessonTitle}: ${statusLabel}`, 'success');
          }

          const now = Date.now();
          if (now - lastAdvanceTime >= 1200) {
            lastAdvanceTime = now;
            videoCompletedTimestamp = 0;
            advanceToNextTopic();
          }
        } else {
          // Keep gently nudging playback if waiting for green tick
          if (video.paused && !video.ended) {
            video.play().catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('CoursePilot tick error:', err);
    } finally {
      isProcessingTick = false;
    }
  }

  function advanceToNextTopic() {
    advanceAttemptCount++;
    lastAdvanceTime = Date.now();
    logToPopup('Advancing to next topic video...', 'info');

    // Strategy 1: Dedicated next buttons
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

    // Strategy 2: Autoplay banner or toast prompt
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
      const bannerBtn = document.querySelector(sel);
      if (bannerBtn && !bannerBtn.hasAttribute('disabled')) {
        bannerBtn.click();
        return;
      }
    }

    // Strategy 3: Syllabus / TOC item links
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
  });
  window.addEventListener('hashchange', () => {
    activeVideoKey = null;
    hasSeekedCurrentVideo = false;
  });
})();


