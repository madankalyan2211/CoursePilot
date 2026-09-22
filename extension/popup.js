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

  // Star badge UI updater
  function updateStarBadgeUi() {
    const starBtn = document.getElementById('github-star-btn');
    const starText = document.getElementById('github-star-text');
    if (hasStarred) {
      starBtn?.classList.add('starred');
      if (starText) starText.innerText = 'Starred';
      starBtn?.setAttribute('title', 'You have Starred CoursePilot on GitHub!');
    } else {
      starBtn?.classList.remove('starred');
      if (starText) starText.innerText = 'Star';
      starBtn?.setAttribute('title', 'Star CoursePilot on GitHub');
    }
  }

  // Check stored star status
  chrome.storage.local.get(['hasStarred', 'activeCourseState', 'isRunning'], (res) => {
    hasStarred = Boolean(res.hasStarred);
    updateStarBadgeUi();
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
  const gateUsernameInput = document.getElementById('gate-username-input');
  const gateStatusMsg = document.getElementById('gate-status-msg');

  gateCloseBtn?.addEventListener('click', () => {
    starGateModal.style.display = 'none';
  });

  // Load saved username if any
  chrome.storage.local.get(['githubUsername'], (res) => {
    if (res.githubUsername && gateUsernameInput) {
      gateUsernameInput.value = res.githubUsername;
    }
  });

  async function verifyGitHubStar() {
    let rawUser = (gateUsernameInput?.value || '').trim();
    // Normalize username (strip leading @, github.com URL, slashes)
    rawUser = rawUser.replace(/^https?:\/\/github\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '').trim();

    if (!rawUser) {
      if (gateStatusMsg) {
        gateStatusMsg.className = 'gate-status-msg error';
        gateStatusMsg.style.display = 'block';
        gateStatusMsg.innerText = '⚠️ Please enter your GitHub username first.';
      }
      gateUsernameInput?.focus();
      return;
    }

    // Direct auto-approval for repository author/owner
    if (rawUser.toLowerCase() === 'madankalyan2211') {
      hasStarred = true;
      chrome.storage.local.set({ hasStarred: true, githubUsername: rawUser });
      updateStarBadgeUi();

      if (gateStatusMsg) {
        gateStatusMsg.className = 'gate-status-msg success';
        gateStatusMsg.style.display = 'block';
        gateStatusMsg.innerText = `✓ Verified Repository Author @${rawUser}! 🚀`;
      }

      setTimeout(() => {
        starGateModal.style.display = 'none';
        addLog(`✨ Repository Author @${rawUser} — Automation Unlocked!`, 'success');
        startAutomation();
      }, 700);
      return;
    }

    if (gateStatusMsg) {
      gateStatusMsg.className = 'gate-status-msg loading';
      gateStatusMsg.style.display = 'block';
      gateStatusMsg.innerText = `🔍 Checking GitHub for @${rawUser}'s star...`;
    }

    if (gateConfirmBtn) {
      gateConfirmBtn.setAttribute('disabled', 'true');
      gateConfirmBtn.innerText = 'Verifying...';
    }

    try {
      // Add cache buster timestamp to avoid CDN stale cache
      const response = await fetch(`https://api.github.com/users/${encodeURIComponent(rawUser)}/starred?per_page=100&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        if (gateStatusMsg) {
          gateStatusMsg.className = 'gate-status-msg error';
          gateStatusMsg.innerText = `❌ GitHub user "@${rawUser}" not found. Please check spelling.`;
        }
        return;
      }

      if (response.status === 403) {
        // GitHub rate limit fallback — provide instant unlock button
        if (gateStatusMsg) {
          gateStatusMsg.className = 'gate-status-msg warning';
          gateStatusMsg.innerHTML = `⚠️ GitHub API rate limit reached.<br><button id="gate-fallback-activate" style="margin-top:6px;width:100%;background:#30d158;color:#fff;border:none;border-radius:6px;padding:6px;font-weight:700;font-size:11px;cursor:pointer;">I've Starred — Activate Now ⭐</button>`;
          document.getElementById('gate-fallback-activate')?.addEventListener('click', () => {
            hasStarred = true;
            chrome.storage.local.set({ hasStarred: true, githubUsername: rawUser });
            updateStarBadgeUi();
            starGateModal.style.display = 'none';
            addLog(`✨ Activated for @${rawUser} — Automation Unlocked!`, 'success');
            startAutomation();
          });
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const starredRepos = await response.json();
      const hasStarredTarget = Array.isArray(starredRepos) && starredRepos.some((repo) => {
        const full = (repo.full_name || '').toLowerCase();
        const name = (repo.name || '').toLowerCase();
        const owner = (repo.owner?.login || '').toLowerCase();
        return full === 'madankalyan2211/coursepilot' || (name === 'coursepilot' && owner === 'madankalyan2211');
      });

      if (hasStarredTarget) {
        hasStarred = true;
        chrome.storage.local.set({ hasStarred: true, githubUsername: rawUser });
        updateStarBadgeUi();

        if (gateStatusMsg) {
          gateStatusMsg.className = 'gate-status-msg success';
          gateStatusMsg.innerText = `✓ Verified! Thank you @${rawUser}! ⭐`;
        }

        setTimeout(() => {
          starGateModal.style.display = 'none';
          addLog(`✨ Verified Star from @${rawUser} — Automation Unlocked!`, 'success');
          startAutomation();
        }, 800);
      } else {
        // Star not yet updated in GitHub API cache or not starred
        if (gateStatusMsg) {
          gateStatusMsg.className = 'gate-status-msg warning';
          gateStatusMsg.innerHTML = `
            <div>⏳ Star not yet cached in GitHub's public feed (takes 1-2 min).</div>
            <button id="gate-instant-unlock" style="margin-top:6px;width:100%;background:#30d158;color:#fff;border:none;border-radius:6px;padding:7px;font-weight:700;font-size:11px;cursor:pointer;">
              ✓ I Just Starred (@${rawUser}) — Activate Now ⭐
            </button>
          `;
          document.getElementById('gate-instant-unlock')?.addEventListener('click', () => {
            hasStarred = true;
            chrome.storage.local.set({ hasStarred: true, githubUsername: rawUser });
            updateStarBadgeUi();
            starGateModal.style.display = 'none';
            addLog(`✨ Activated Star for @${rawUser} — Automation Unlocked!`, 'success');
            startAutomation();
          });
        }
      }
    } catch (err) {
      if (gateStatusMsg) {
        gateStatusMsg.className = 'gate-status-msg error';
        gateStatusMsg.innerHTML = `
          <div>⚠️ Network error connecting to GitHub.</div>
          <button id="gate-offline-unlock" style="margin-top:6px;width:100%;background:#30d158;color:#fff;border:none;border-radius:6px;padding:6px;font-weight:700;font-size:11px;cursor:pointer;">
            I Have Starred — Activate Now ⭐
          </button>
        `;
        document.getElementById('gate-offline-unlock')?.addEventListener('click', () => {
          hasStarred = true;
          chrome.storage.local.set({ hasStarred: true, githubUsername: rawUser });
          updateStarBadgeUi();
          starGateModal.style.display = 'none';
          addLog(`✨ Activated for @${rawUser} — Automation Unlocked!`, 'success');
          startAutomation();
        });
      }
    } finally {
      if (gateConfirmBtn) {
        gateConfirmBtn.removeAttribute('disabled');
        gateConfirmBtn.innerText = 'Verify Star & Activate 🚀';
      }
    }
  }

  gateConfirmBtn?.addEventListener('click', verifyGitHubStar);
  gateUsernameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyGitHubStar();
    }
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


