/**
 * CoursePilot Chrome Extension — Popup Controller
 * Multi-Platform: LinkedIn Learning & Coursera
 * Cross-Tab Aware & Windows / macOS Optimized
 */

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const switchTabBtn = document.getElementById('switch-tab-btn');
  const platformLaunchRow = document.getElementById('platform-launch-row');
  const launchLinkedInBtn = document.getElementById('launch-linkedin-btn');
  const launchCourseraBtn = document.getElementById('launch-coursera-btn');
  
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');
  const courseName = document.getElementById('course-name');
  const lessonName = document.getElementById('lesson-name');
  const logBox = document.getElementById('log-box');

  // Star Gate Elements
  const starGateModal = document.getElementById('star-gate-modal');
  const gateStarBtn = document.getElementById('gate-star-btn');
  const gateConfirmBtn = document.getElementById('gate-confirm-btn');

  let hasStarred = false;
  let targetTabId = null;
  let isTargetTabActive = true;

  // Check stored star status
  chrome.storage.local.get(['hasStarred', 'activeCourseState', 'isRunning'], (res) => {
    hasStarred = Boolean(res.hasStarred);
    if (!hasStarred) {
      starGateModal.style.display = 'flex';
    }
    if (res.activeCourseState && res.isRunning) {
      updateUi(res.activeCourseState, false);
    }
  });

  function isCourseUrl(url) {
    if (!url) return false;
    return url.includes('linkedin.com/learning') || url.includes('coursera.org');
  }

  function updateUi(state, isActiveTab = true) {
    if (!state) return;

    if (state.courseTitle) courseName.innerText = state.courseTitle;
    if (state.lessonTitle) lessonName.innerText = state.lessonTitle;

    platformLaunchRow.style.display = 'none';

    if (state.isPausedForUser) {
      statusPill.className = 'status-pill paused';
      statusText.innerText = isActiveTab ? 'Paused (Quiz)' : 'Paused (Background)';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'none';
      resumeBtn.style.display = 'block';
      switchTabBtn.style.display = !isActiveTab ? 'block' : 'none';
    } else if (state.isRunning) {
      statusPill.className = 'status-pill active';
      statusText.innerText = isActiveTab ? 'Running' : 'Running (Background)';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      resumeBtn.style.display = 'none';
      switchTabBtn.style.display = !isActiveTab ? 'block' : 'none';
    } else {
      statusPill.className = 'status-pill';
      statusText.innerText = isActiveTab ? 'Ready' : 'Ready (Background)';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
      switchTabBtn.style.display = !isActiveTab ? 'block' : 'none';
    }
  }

  function showNoCourseTabUi() {
    statusPill.className = 'status-pill';
    statusText.innerText = 'No Course Open';
    courseName.innerText = 'No Active Course Tab';
    lessonName.innerText = 'Open LinkedIn Learning or Coursera to begin';
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'none';
    resumeBtn.style.display = 'none';
    switchTabBtn.style.display = 'none';
    platformLaunchRow.style.display = 'flex';
  }

  function addLog(text, level = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.innerText = text;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Detect appropriate course tab (current active tab or any open course tab)
  function resolveTargetTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTabs) => {
      const activeTab = currentTabs[0];

      if (activeTab && isCourseUrl(activeTab.url)) {
        // Active tab is already a course tab!
        targetTabId = activeTab.id;
        isTargetTabActive = true;
        chrome.tabs.sendMessage(targetTabId, { action: 'GET_STATE' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            // Content script not yet loaded or ready
            courseName.innerText = activeTab.title.split('|')[0].trim() || 'Course Tab';
            lessonName.innerText = 'Ready to automate';
          } else {
            updateUi(response, true);
          }
        });
      } else {
        // Active tab is NOT a course page — search other open tabs for LinkedIn Learning or Coursera
        chrome.tabs.query({ url: ["*://*.linkedin.com/learning/*", "*://*.coursera.org/*"] }, (courseTabs) => {
          if (courseTabs && courseTabs.length > 0) {
            const courseTab = courseTabs[0];
            targetTabId = courseTab.id;
            isTargetTabActive = false;

            chrome.tabs.sendMessage(targetTabId, { action: 'GET_STATE' }, (response) => {
              if (chrome.runtime.lastError || !response) {
                // Fallback to storage or tab title
                chrome.storage.local.get(['activeCourseState', 'isRunning'], (stored) => {
                  if (stored.activeCourseState) {
                    updateUi({ ...stored.activeCourseState, isRunning: stored.isRunning }, false);
                  } else {
                    courseName.innerText = courseTab.title.split('|')[0].trim() || 'Background Course';
                    lessonName.innerText = 'Course open in another tab';
                    updateUi({ isRunning: false, isPausedForUser: false }, false);
                  }
                });
              } else {
                updateUi(response, false);
              }
            });
          } else {
            // No course tab open in entire browser
            targetTabId = null;
            showNoCourseTabUi();
          }
        });
      }
    });
  }

  resolveTargetTab();

  // Listen for live log events from content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LOG') {
      addLog(`[${msg.log.timestamp}] ${msg.log.text}`, msg.log.level);
    }
  });

  function executeTabAction(action, onSuccess) {
    if (!targetTabId) {
      addLog('No course tab open. Please open LinkedIn Learning or Coursera.', 'warning');
      return;
    }
    chrome.tabs.sendMessage(targetTabId, { action }, (res) => {
      if (chrome.runtime.lastError) {
        addLog(`Could not connect to course tab: ${chrome.runtime.lastError.message}`, 'error');
      } else if (onSuccess) {
        onSuccess(res);
      }
    });
  }

  function startAutomation() {
    executeTabAction('START', () => {
      updateUi({ isRunning: true, isPausedForUser: false }, isTargetTabActive);
    });
  }

  document.getElementById('github-star-btn')?.addEventListener('click', (e) => {
    // If not starred or user clicks star badge, show gate modal
    if (!hasStarred) {
      starGateModal.style.display = 'flex';
    }
  });

  startBtn.addEventListener('click', () => {
    chrome.storage.local.get(['hasStarred'], (res) => {
      hasStarred = Boolean(res.hasStarred);
      if (!hasStarred) {
        starGateModal.style.display = 'flex';
      } else {
        startAutomation();
      }
    });
  });

  const gateCloseBtn = document.getElementById('gate-close-btn');

  gateCloseBtn?.addEventListener('click', () => {
    starGateModal.style.display = 'none';
  });

  gateStarBtn?.addEventListener('click', () => {
    gateConfirmBtn.style.background = '#30d158';
    gateConfirmBtn.innerText = "2. I've Starred ⭐ (Activate Now)";
  });

  gateConfirmBtn?.addEventListener('click', () => {
    hasStarred = true;
    chrome.storage.local.set({ hasStarred: true });
    starGateModal.style.display = 'none';
    addLog('✨ Repository Starred — Automation Unlocked!', 'success');
    startAutomation();
  });

  stopBtn.addEventListener('click', () => {
    executeTabAction('STOP', () => {
      updateUi({ isRunning: false, isPausedForUser: false }, isTargetTabActive);
    });
  });

  resumeBtn.addEventListener('click', () => {
    chrome.storage.local.get(['hasStarred'], (res) => {
      hasStarred = Boolean(res.hasStarred);
      if (!hasStarred) {
        starGateModal.style.display = 'flex';
      } else {
        executeTabAction('RESUME', () => {
          updateUi({ isRunning: true, isPausedForUser: false }, isTargetTabActive);
        });
      }
    });
  });

  switchTabBtn?.addEventListener('click', () => {
    if (targetTabId) {
      chrome.tabs.update(targetTabId, { active: true });
      window.close();
    }
  });

  launchLinkedInBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.linkedin.com/learning' });
    window.close();
  });

  launchCourseraBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.coursera.org/learn' });
    window.close();
  });
});


