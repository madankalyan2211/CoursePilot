/**
 * CoursePilot Chrome Extension — Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const resumeBtn = document.getElementById('resume-btn');
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

  // Check stored star status
  chrome.storage.local.get(['hasStarred'], (res) => {
    hasStarred = Boolean(res.hasStarred);
  });

  function updateUi(state) {
    if (!state) return;

    if (state.courseTitle) courseName.innerText = state.courseTitle;
    if (state.lessonTitle) lessonName.innerText = state.lessonTitle;

    if (state.isPausedForUser) {
      statusPill.className = 'status-pill paused';
      statusText.innerText = 'Paused (Quiz)';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'none';
      resumeBtn.style.display = 'block';
    } else if (state.isRunning) {
      statusPill.className = 'status-pill active';
      statusText.innerText = 'Running';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      resumeBtn.style.display = 'none';
    } else {
      statusPill.className = 'status-pill';
      statusText.innerText = 'Ready';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
    }
  }

  function addLog(text, level = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.innerText = text;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Poll current active tab state
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_STATE' }, (response) => {
        if (response) updateUi(response);
      });
    }
  });

  // Listen for live log events from content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'LOG') {
      addLog(`[${msg.log.timestamp}] ${msg.log.text}`, msg.log.level);
    }
  });

  function startAutomation() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'START' }, () => {
          updateUi({ isRunning: true, isPausedForUser: false });
        });
      }
    });
  }

  startBtn.addEventListener('click', () => {
    chrome.storage.local.get(['hasStarred'], (res) => {
      hasStarred = Boolean(res.hasStarred);
      if (!hasStarred) {
        // Show Star Gate Modal
        starGateModal.style.display = 'flex';
      } else {
        startAutomation();
      }
    });
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
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'STOP' }, () => {
          updateUi({ isRunning: false, isPausedForUser: false });
        });
      }
    });
  });

  resumeBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'RESUME' }, () => {
          updateUi({ isRunning: true, isPausedForUser: false });
        });
      }
    });
  });
});

