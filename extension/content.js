/**
 * CoursePilot Chrome Extension — Content Script
 * Multi-Platform: LinkedIn Learning & Coursera
 * Automates repetitive video playback and auto-advances lessons with interactive quiz safety pauses.
 */

(function () {
  let isRunning = false;
  let isPausedForUser = false;
  let timerId = null;
  let lastCompletedUrl = null;
  let seekOffset = 2.5;

  const isCoursera = window.location.hostname.includes('coursera.org');
  const isLnt = window.location.hostname.includes('lntedutech.com');
  const platformName = isLnt ? 'L&T EduTech' : (isCoursera ? 'Coursera' : 'LinkedIn Learning');

  // Load initial settings
  chrome.storage.local.get(['isRunning', 'seekOffset', 'hasStarred'], (res) => {
    isRunning = Boolean(res.isRunning) && Boolean(res.hasStarred);
    seekOffset = res.seekOffset || 2.5;
    if (isRunning) startAutomationLoop();
  });

  function handleStart() {
    chrome.storage.local.get(['hasStarred'], (res) => {
      if (!res.hasStarred) {
        logToPopup('Please star the GitHub repo to unlock CoursePilot.', 'warning');
        return;
      }
      isRunning = true;
      isPausedForUser = false;
      chrome.storage.local.set({ isRunning: true, isPausedForUser: false });
      logToPopup(`Starting CoursePilot (${platformName})...`);
      syncStateToStorage();
      startAutomationLoop();
    });
  }

  function handleStop() {
    isRunning = false;
    isPausedForUser = false;
    chrome.storage.local.set({ isRunning: false, isPausedForUser: false });
    syncStateToStorage();
    removeFloatingOverlay();
    if (timerId) clearTimeout(timerId);
    logToPopup('Automation stopped.');
  }

  function handleResume() {
    isPausedForUser = false;
    chrome.storage.local.set({ isPausedForUser: false });
    syncStateToStorage();
    removeFloatingOverlay();
    logToPopup('Resuming automation...');
    startAutomationLoop();
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

  function isAssessmentPage() {
    const url = window.location.pathname.toLowerCase();
    // URL-based check
    if (
      url.includes('/quiz') || 
      url.includes('/assessment') || 
      url.includes('/exam') || 
      url.includes('/test/') ||
      url.includes('/test-') ||
      url.includes('/assignment-submission') ||
      url.includes('/peer-review') ||
      url.includes('/ungradedwidget')
    ) {
      return true;
    }

    // Check if an active video is present and ready
    const video = document.querySelector('video.c-video, video.vjs-tech, video');
    if (video && typeof video.duration === 'number' && video.duration > 0) {
      return false;
    }

    // DOM Assessment Indicators
    const assessmentSelectors = [
      'form[data-test-quiz-form]',
      'fieldset.quiz-question',
      '[data-test-quiz-container]',
      '.classroom-quiz:not(.hidden)',
      '.rc-Quiz',
      '.rc-Assignment',
      '.rc-Exam',
      '.rc-PeerReview',
      'form[data-e2e*="quiz"]',
      'form.rc-QuizForm',
      'div[data-e2e="ungraded-widget"]',
      'div[data-e2e="quiz-prompt"]',
      'div[class*="quiz" i]',
      'div[class*="assessment" i]',
      'div[class*="question" i]',
      '.assessment-container',
      '.test-container'
    ];

    for (const sel of assessmentSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) { // visible
        return true;
      }
    }

    return false;
  }

  async function startAutomationLoop() {
    if (!isRunning || isPausedForUser) return;

    try {
      const currentNormalized = normalizeUrl(window.location.href);

      // Guard: Check if we are still on the completed lesson
      if (lastCompletedUrl && currentNormalized === lastCompletedUrl) {
        logToPopup('Already completed this video. Advancing to next topic...', 'info');
        advanceToNextTopic();
        return;
      }

      // Check for Quiz / Assessment
      if (isAssessmentPage()) {
        logToPopup('Quiz / Assessment Detected — Pausing Automation', 'warning');
        isPausedForUser = true;
        showFloatingOverlay();
        return;
      }

      // Find Video Player
      const video = document.querySelector('video.c-video, video.vjs-tech, video');
      if (!video) {
        timerId = setTimeout(startAutomationLoop, 1500);
        return;
      }

      // Wait for video metadata
      if (isNaN(video.duration) || video.duration <= 0) {
        timerId = setTimeout(startAutomationLoop, 800);
        return;
      }

      const duration = video.duration;
      const targetTime = Math.max(0, duration - seekOffset);

      // Seek toward video end if not already near end
      if (video.currentTime < targetTime - 1) {
        video.currentTime = targetTime;
        video.dispatchEvent(new Event('seeking'));
        video.dispatchEvent(new Event('seeked'));
        video.dispatchEvent(new Event('timeupdate'));
        if (video.paused) video.play().catch(() => {});
        logToPopup(`Seeked to ${targetTime.toFixed(1)}s / ${duration.toFixed(1)}s`, 'info');
      }

      // Check if video reached completion
      if (video.ended || video.currentTime >= duration - 0.8) {
        lastCompletedUrl = currentNormalized;
        const details = getPageDetails();
        logToPopup(`✓ Completed: ${details.lessonTitle}`, 'success');

        // Short pause before advancing
        setTimeout(() => {
          if (isRunning && !isPausedForUser) {
            advanceToNextTopic();
          }
        }, 1200);
        return;
      }

      timerId = setTimeout(startAutomationLoop, 500);
    } catch (err) {
      console.warn('CoursePilot iteration error:', err);
      timerId = setTimeout(startAutomationLoop, 2000);
    }
  }

  function advanceToNextTopic() {
    logToPopup('Advancing to next topic video...', 'info');

    // Strategy 1: Dedicated classroom / item next buttons
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
      '.rc-NextItemButton button',
      '.rc-NextItemButton a'
    ] : [
      'button[data-test-classroom-nav-next-button]',
      '.classroom-nav button[aria-label="Next item" i]',
      '.classroom-nav button[aria-label="Next lesson" i]',
      '.classroom-nav button[aria-label="Next video" i]',
      'button.classroom-nav__next-button',
      'button[aria-label*="Next" i]'
    ]);

    for (const sel of nextButtonSelectors) {
      const nextBtn = document.querySelector(sel);
      if (nextBtn) {
        const isEnabled = !nextBtn.hasAttribute('disabled') && nextBtn.getAttribute('aria-disabled') !== 'true';
        if (isEnabled) {
          nextBtn.click();
          timerId = setTimeout(startAutomationLoop, 2500);
          return;
        }
      }
    }

    // Strategy 2: Syllabus TOC links
    if (isCoursera) {
      const nav = document.querySelector('.rc-CourseNav, .rc-LessonsList, .rc-WeekNav') || document.body;
      const allLinks = Array.from(nav.querySelectorAll('a[href*="/learn/"]'));
      const currentPath = window.location.pathname.replace(/\/$/, '');

      const lessonLinks = allLinks.filter(a => {
        const p = a.pathname.replace(/\/$/, '');
        const parts = p.split('/').filter(Boolean);
        return parts.length >= 2 && parts[0] === 'learn' && !p.endsWith('/home') && !p.endsWith('/my-learning');
      });

      const currentIdx = lessonLinks.findIndex(a => a.pathname.replace(/\/$/, '') === currentPath);
      if (currentIdx >= 0 && currentIdx + 1 < lessonLinks.length) {
        const nextAnchor = lessonLinks[currentIdx + 1];
        nextAnchor.scrollIntoView?.({ block: 'nearest' });
        nextAnchor.click();
        timerId = setTimeout(startAutomationLoop, 2500);
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
        timerId = setTimeout(startAutomationLoop, 2500);
        return;
      }
    } else {
      const sidebar = document.querySelector('.classroom-sidebar, .classroom-toc') || document.body;
      const allLinks = Array.from(sidebar.querySelectorAll('a[href*="/learning/"]'));
      const currentPath = window.location.pathname.replace(/\/$/, '');

      const lessonLinks = allLinks.filter(a => {
        const p = a.pathname.replace(/\/$/, '');
        const parts = p.split('/').filter(Boolean);
        return parts.length >= 3 && parts[0] === 'learning' && !p.includes('/me') && !p.includes('/topics');
      });

      const currentIdx = lessonLinks.findIndex(a => a.pathname.replace(/\/$/, '') === currentPath);
      if (currentIdx >= 0 && currentIdx + 1 < lessonLinks.length) {
        const nextAnchor = lessonLinks[currentIdx + 1];
        nextAnchor.scrollIntoView?.({ block: 'nearest' });
        nextAnchor.click();
        timerId = setTimeout(startAutomationLoop, 2500);
        return;
      }
    }

    // Fallback: Autoplay banner
    const autoplayBtn = document.querySelector('button[data-test-autoplay-next-button], .next-item-banner button, button[data-e2e="next-item-banner-button"], .rc-AutoplayToast button');
    if (autoplayBtn) {
      autoplayBtn.click();
      timerId = setTimeout(startAutomationLoop, 2500);
      return;
    }

    logToPopup('Could not find next lesson link. Pausing.', 'warning');
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
      logToPopup('Resumed from floating HUD');
      startAutomationLoop();
    });

    document.getElementById('cp-hud-stop')?.addEventListener('click', () => {
      isRunning = false;
      isPausedForUser = false;
      chrome.storage.local.set({ isRunning: false });
      removeFloatingOverlay();
      logToPopup('Stopped from floating HUD');
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
})();

