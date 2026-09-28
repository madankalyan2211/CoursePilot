/**
 * CoursePilot Chrome Extension — Background Service Worker
 * Manages Cross-Tab Global Floating HUD & Desktop Notifications for Quizzes / Assessments.
 */

let activeQuizState = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isRunning: false,
    isPausedForUser: false,
    seekOffset: 2.5
  });
  console.log('CoursePilot background service worker initialized.');
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes.isPausedForUser || changes.isRunning || changes.activeCourseState) {
    chrome.storage.local.get(['isPausedForUser', 'isRunning', 'activeCourseState'], (data) => {
      const isPaused = Boolean(data.isPausedForUser && data.isRunning);
      if (isPaused) {
        activeQuizState = data.activeCourseState || {};
        triggerGlobalQuizNotice(activeQuizState);
      } else {
        activeQuizState = null;
        clearGlobalQuizNotice();
      }
    });
  }
});

// When user switches tabs, inject the floating HUD if a quiz is active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!activeQuizState) return;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      injectGlobalHudIntoTab(activeInfo.tabId, activeQuizState);
    }
  } catch (err) {
    // Tab might be restricted or closed
  }
});

// When a tab finishes updating / loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && activeQuizState) {
    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      injectGlobalHudIntoTab(tabId, activeQuizState);
    }
  }
});

// Handle messages from content scripts or any tab HUD
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'QUIZ_DETECTED') {
    activeQuizState = request.data || {};
    triggerGlobalQuizNotice(activeQuizState, sender.tab?.id);
    sendResponse({ status: 'NOTICED' });
  } else if (request.type === 'FOCUS_COURSE_TAB') {
    focusCourseTab();
    sendResponse({ status: 'FOCUSED' });
  } else if (request.type === 'GLOBAL_RESUME') {
    resumeAutomation();
    sendResponse({ status: 'RESUMING' });
  } else if (request.type === 'GLOBAL_STOP') {
    stopAutomation();
    sendResponse({ status: 'STOPPED' });
  }
  return true;
});

// Notification click opens course tab
chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId === 'coursepilot-quiz-alert') {
    focusCourseTab();
    chrome.notifications.clear(notifId);
  }
});

async function triggerGlobalQuizNotice(courseState, sourceTabId) {
  const courseTitle = courseState?.courseTitle || 'Active Course';
  const lessonTitle = courseState?.lessonTitle || 'Interactive Quiz';

  // 1. Desktop System Notification
  try {
    chrome.notifications.create('coursepilot-quiz-alert', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '⚠️ Assessment / Quiz Detected!',
      message: `${lessonTitle} in ${courseTitle}. Automation paused. Click to view tab.`,
      priority: 2,
      requireInteraction: true
    });
  } catch (err) {
    console.warn('Notification error:', err);
  }

  // 2. Inject HUD into all eligible open tabs
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
        injectGlobalHudIntoTab(tab.id, courseState, tab.id === sourceTabId);
      }
    }
  } catch (err) {
    console.warn('Error broadcasting HUD to tabs:', err);
  }
}

async function clearGlobalQuizNotice() {
  try {
    chrome.notifications.clear('coursepilot-quiz-alert');
  } catch {}

  // Remove HUD from all open tabs
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: removeGlobalHudFromDom
        }).catch(() => {});
      }
    }
  } catch {}
}

async function focusCourseTab() {
  chrome.tabs.query({}, (tabs) => {
    const courseTab = tabs.find(t => 
      t.url && (t.url.includes('linkedin.com/learning') || t.url.includes('coursera.org') || t.url.includes('lntedutech.com'))
    );
    if (courseTab && courseTab.id) {
      chrome.tabs.update(courseTab.id, { active: true });
      if (courseTab.windowId) {
        chrome.windows.update(courseTab.windowId, { focused: true });
      }
    }
  });
}

function resumeAutomation() {
  chrome.storage.local.set({
    isPausedForUser: false,
    actionTrigger: 'RESUME',
    actionTimestamp: Date.now()
  });
  clearGlobalQuizNotice();
}

function stopAutomation() {
  chrome.storage.local.set({
    isRunning: false,
    isPausedForUser: false,
    actionTrigger: 'STOP',
    actionTimestamp: Date.now()
  });
  clearGlobalQuizNotice();
}

function injectGlobalHudIntoTab(tabId, state, isSourceTab = false) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: renderGlobalFloatingHud,
    args: [state, isSourceTab]
  }).catch(() => {});
}

// Injected function into tab DOM
function renderGlobalFloatingHud(state, isSourceTab) {
  if (document.getElementById('cp-global-floating-hud')) {
    return; // Already present
  }

  const courseTitle = state?.courseTitle || 'Course';
  const lessonTitle = state?.lessonTitle || 'Quiz / Assessment';
  const platform = state?.platform || 'Learning Platform';

  const container = document.createElement('div');
  container.id = 'cp-global-floating-hud';
  container.style.cssText = `
    position: fixed !important;
    top: 24px !important;
    right: 24px !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    user-select: none !important;
    box-sizing: border-box !important;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
  `;

  container.innerHTML = `
    <div id="cp-hud-card" style="
      width: 320px;
      background: rgba(18, 18, 24, 0.95);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(255, 214, 10, 0.4);
      border-radius: 16px;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), 0 0 28px rgba(255, 214, 10, 0.2);
      padding: 16px;
      color: #f5f5f7;
      box-sizing: border-box;
      cursor: grab;
      position: relative;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 7px;">
          <span style="width: 9px; height: 9px; border-radius: 50%; background: #ffd60a; box-shadow: 0 0 10px #ffd60a; display: inline-block; animation: cp-pulse 1.5s infinite;"></span>
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #ffd60a; letter-spacing: 0.6px;">Quiz Detected</span>
        </div>
        <span style="font-size: 11px; color: rgba(255, 255, 255, 0.45); font-weight: 600;">${platform}</span>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="font-size: 13px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;" title="${courseTitle}">${courseTitle}</div>
        <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.7); margin-top: 2px; line-height: 1.3;">${lessonTitle}</div>
      </div>

      <div style="font-size: 11.5px; color: rgba(255, 255, 255, 0.8); line-height: 1.4; margin-bottom: 12px; background: rgba(255, 255, 255, 0.05); padding: 8px 10px; border-radius: 8px; border-left: 3px solid #ffd60a;">
        ${isSourceTab ? 'Submit your quiz answers below and click <strong>Resume</strong>.' : 'Automation is safely paused. Complete your quiz in the course tab.'}
      </div>

      <div style="display: flex; gap: 7px; flex-wrap: wrap;">
        ${!isSourceTab ? `
          <button id="cp-hud-goto-tab" style="
            flex: 1 1 100%;
            background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
            margin-bottom: 4px;
          ">
            <span>↗️</span> Go to Quiz Tab
          </button>
        ` : ''}
        <button id="cp-hud-resume-btn" style="
          flex: 1;
          background: #30d158;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        ">Resume</button>
        <button id="cp-hud-stop-btn" style="
          background: rgba(255, 69, 58, 0.18);
          color: #ff453a;
          border: 1px solid rgba(255, 69, 58, 0.35);
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        ">Stop</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Button Listeners
  document.getElementById('cp-hud-goto-tab')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'FOCUS_COURSE_TAB' });
  });

  document.getElementById('cp-hud-resume-btn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GLOBAL_RESUME' });
    container.remove();
  });

  document.getElementById('cp-hud-stop-btn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GLOBAL_STOP' });
    container.remove();
  });

  // Dragging support
  const card = document.getElementById('cp-hud-card');
  if (card) {
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    card.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button')) return;
      isDragging = true;
      card.style.cursor = 'grabbing';
      const rect = container.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      container.style.right = 'auto';
      container.style.left = `${initialLeft}px`;
      container.style.top = `${initialTop}px`;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      container.style.left = `${initialLeft + e.clientX - startX}px`;
      container.style.top = `${initialTop + e.clientY - startY}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      card.style.cursor = 'grab';
    });
  }
}

function removeGlobalHudFromDom() {
  const el = document.getElementById('cp-global-floating-hud');
  if (el) el.remove();
  const legacyEl = document.getElementById('coursepilot-floating-overlay');
  if (legacyEl) legacyEl.remove();
}

