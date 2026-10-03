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
  const launchLntBtn = document.getElementById('launch-lnt-btn');
  
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');
  const courseName = document.getElementById('course-name');
  const lessonName = document.getElementById('lesson-name');
  const logBox = document.getElementById('log-box');

  // Star Gate Elements
  const starGateModal = document.getElementById('star-gate-modal');
  const gateStarBtn = document.getElementById('gate-star-btn');
  const gateConfirmBtn = document.getElementById('gate-confirm-btn');

  // Playback Speed Elements (LinkedIn Learning Only)
  const speedControlCard = document.getElementById('speed-control-card');
  const speedCurrentBadge = document.getElementById('speed-current-badge');
  const speedButtons = document.querySelectorAll('.speed-btn');

  let detectedPlatform = 'linkedin';

  function updateSpeedControlVisibility(platformOrUrl) {
    if (!speedControlCard) return;
    if (platformOrUrl) {
      const str = String(platformOrUrl).toLowerCase();
      if (str.includes('linkedin')) detectedPlatform = 'linkedin';
      else if (str.includes('coursera')) detectedPlatform = 'coursera';
      else if (str.includes('lnt')) detectedPlatform = 'lnt';
    }
    const isLinkedIn = detectedPlatform === 'linkedin';
    speedControlCard.style.display = isLinkedIn ? 'block' : 'none';
  }

  function updateSpeedUi(speed) {
    const num = Math.min(16.0, Math.max(0.5, Number(speed) || 16));
    speedButtons.forEach(btn => {
      const btnSpeed = Number(btn.getAttribute('data-speed'));
      if (Math.abs(btnSpeed - num) < 0.05) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (speedCurrentBadge) {
      speedCurrentBadge.innerText = `${num}x`;
    }
  }

  function broadcastSpeedToTab(tabId, speed) {
    if (!tabId) return;
    chrome.tabs.sendMessage(tabId, { action: 'SET_LINKEDIN_SPEED', speed }).catch(() => {});
    if (chrome.scripting) {
      // 1. Execute in MAIN world to directly control HTMLMediaElement and Video.js instance
      chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'MAIN',
        func: (rate) => {
          const safeRate = Math.min(16.0, Math.max(0.0625, Number(rate) || 1.0));
          window.__coursepilot_desired_speed = safeRate;
          try {
            document.documentElement?.setAttribute('data-coursepilot-speed', String(safeRate));
            window.postMessage({ type: '__coursepilot_set_speed', speed: safeRate }, '*');
          } catch (e) {}

          // Ensure prototype setter is installed in this frame
          ['playbackRate', 'defaultPlaybackRate'].forEach((prop) => {
            try {
              const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, prop);
              if (desc && desc.set && !desc.__coursepilot_hooked) {
                const origSet = desc.set;
                const origGet = desc.get;
                const wrapped = function (val) {
                  const desired = window.__coursepilot_desired_speed || Number(document.documentElement?.getAttribute('data-coursepilot-speed'));
                  if (desired && !window.__coursepilot_writing) {
                    origSet.call(this, desired);
                  } else {
                    origSet.call(this, val);
                  }
                };
                wrapped.__coursepilot_hooked = true;
                Object.defineProperty(HTMLMediaElement.prototype, prop, {
                  get: origGet,
                  set: wrapped,
                  configurable: true,
                  enumerable: true
                });
              }
            } catch (e) {}
          });

          try {
            if (typeof window.videojs === 'function' && window.videojs.players) {
              Object.values(window.videojs.players).forEach((p) => {
                if (p && typeof p.playbackRate === 'function' && !p.__coursepilot_hooked) {
                  p.__coursepilot_hooked = true;
                  const origRate = p.playbackRate.bind(p);
                  p.playbackRate = function (newRate) {
                    if (arguments.length === 0) return origRate();
                    const desired = window.__coursepilot_desired_speed || Number(document.documentElement?.getAttribute('data-coursepilot-speed'));
                    return origRate(desired && !window.__coursepilot_writing ? desired : newRate);
                  };
                }
              });
            }
          } catch (e) {}

          function findVideos(root = document) {
            let list = [];
            try { list.push(...root.querySelectorAll('video')); } catch (e) {}
            try {
              const all = root.querySelectorAll('*');
              for (let i = 0; i < all.length; i++) {
                if (all[i].shadowRoot) list.push(...findVideos(all[i].shadowRoot));
              }
            } catch (e) {}
            return list;
          }

          window.__coursepilot_writing = true;
          try {
            findVideos(document).forEach((v) => {
              try {
                v.playbackRate = safeRate;
                v.defaultPlaybackRate = safeRate;
                if (v.player && typeof v.player.playbackRate === 'function') {
                  v.player.playbackRate(safeRate);
                }
              } catch (e) {}
            });
          } finally {
            window.__coursepilot_writing = false;
          }
        },
        args: [speed]
      }).catch(() => {});

      // 2. Also execute in ISOLATED world
      chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: (rate) => {
          function findVideos(root = document) {
            let list = [];
            try { list.push(...root.querySelectorAll('video')); } catch (e) {}
            try {
              const all = root.querySelectorAll('*');
              for (let i = 0; i < all.length; i++) {
                if (all[i].shadowRoot) list.push(...findVideos(all[i].shadowRoot));
              }
            } catch (e) {}
            return list;
          }
          const safeRate = Math.min(16.0, Math.max(0.0625, Number(rate) || 1.0));
          try {
            document.documentElement?.setAttribute('data-coursepilot-speed', String(safeRate));
            window.postMessage({ type: '__coursepilot_set_speed', speed: safeRate }, '*');
          } catch (e) {}
          findVideos(document).forEach((v) => {
            try {
              v.playbackRate = safeRate;
              v.defaultPlaybackRate = safeRate;
            } catch (e) {}
          });
        },
        args: [speed]
      }).catch(() => {});
    }
  }

  function broadcastSpeed(speed) {
    if (targetTabId) {
      broadcastSpeedToTab(targetTabId, speed);
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]?.id && tabs[0].id !== targetTabId) {
        broadcastSpeedToTab(tabs[0].id, speed);
      }
    });
    chrome.tabs.query({ url: ["*://*.linkedin.com/*", "*://*.coursera.org/*", "*://*.lntedutech.com/*"] }, (tabs) => {
      if (tabs) {
        tabs.forEach((t) => {
          if (t.id && t.id !== targetTabId) {
            broadcastSpeedToTab(t.id, speed);
          }
        });
      }
    });
  }

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = Number(btn.getAttribute('data-speed')) || 16;
      updateSpeedUi(speed);
      chrome.storage.local.set({ linkedInPlaybackRate: speed });
      addLog(`⚡ Speed set to ${speed}x`, 'info');
      broadcastSpeed(speed);
    });
  });

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

  // Check stored star status and speed
  chrome.storage.local.get(['hasStarred', 'activeCourseState', 'isRunning', 'linkedInPlaybackRate'], (res) => {
    hasStarred = Boolean(res.hasStarred);
    updateStarBadgeUi();
    const storedSpeed = Math.min(16.0, Math.max(0.5, Number(res.linkedInPlaybackRate) || 16));
    updateSpeedUi(storedSpeed);
    if (!hasStarred) {
      starGateModal.style.display = 'flex';
    }
    if (res.activeCourseState && res.isRunning) {
      updateUi(res.activeCourseState, false);
    }
  });

  function isCourseUrl(url) {
    if (!url) return false;
    return url.includes('linkedin.com/learning') || url.includes('coursera.org') || url.includes('lntedutech.com');
  }

  function updateUi(state, isActiveTab = true) {
    if (!state) return;

    updateSpeedControlVisibility(state.platform || state.url);

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
    updateSpeedControlVisibility(null);
    statusPill.className = 'status-pill';
    statusText.innerText = 'No Course Open';
    courseName.innerText = 'No Active Course Tab';
    lessonName.innerText = 'Open LinkedIn Learning, Coursera, or L&T EduTech to begin';
    
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

  function autoInjectAndRetry(tabId, action, onSuccess) {
    if (chrome.scripting) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          addLog('Please refresh the course page tab (⌘R / F5) to reconnect.', 'warning');
          return;
        }
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action }, (retryRes) => {
            if (chrome.runtime.lastError) {
              addLog('Please refresh the course page tab (⌘R / F5) to reconnect.', 'warning');
            } else if (onSuccess) {
              onSuccess(retryRes);
            }
          });
        }, 200);
      });
    } else {
      addLog('Please refresh the course page tab (⌘R / F5) to reconnect.', 'warning');
    }
  }

  // Detect appropriate course tab (current active tab or any open course tab)
  function resolveTargetTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTabs) => {
      const activeTab = currentTabs[0];

      if (activeTab && isCourseUrl(activeTab.url)) {
        // Active tab is already a course tab!
        targetTabId = activeTab.id;
        isTargetTabActive = true;
        courseName.innerText = activeTab.title.split('|')[0].trim() || 'Course Tab';
        lessonName.innerText = 'Ready to automate';
        updateSpeedControlVisibility(activeTab.url);

        chrome.tabs.sendMessage(targetTabId, { action: 'GET_STATE' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            // Auto-inject content script into open course tab
            if (chrome.scripting) {
              chrome.scripting.executeScript({
                target: { tabId: targetTabId },
                files: ['content.js']
              }, () => {
                if (!chrome.runtime.lastError) {
                  setTimeout(() => {
                    chrome.tabs.sendMessage(targetTabId, { action: 'GET_STATE' }, (retryResp) => {
                      if (retryResp) updateUi(retryResp, true);
                    });
                  }, 200);
                }
              });
            }
          } else {
            updateUi(response, true);
          }
        });
      } else {
        // Active tab is NOT a course page — search other open tabs for LinkedIn Learning, Coursera, or L&T EduTech
        chrome.tabs.query({ url: ["*://*.linkedin.com/learning/*", "*://*.coursera.org/*", "*://*.lntedutech.com/*"] }, (courseTabs) => {
          if (courseTabs && courseTabs.length > 0) {
            const courseTab = courseTabs[0];
            targetTabId = courseTab.id;
            isTargetTabActive = false;
            courseName.innerText = courseTab.title.split('|')[0].trim() || 'Background Course';
            lessonName.innerText = 'Course open in another tab';
            updateSpeedControlVisibility(courseTab.url);

            chrome.tabs.sendMessage(targetTabId, { action: 'GET_STATE' }, (response) => {
              if (chrome.runtime.lastError || !response) {
                chrome.storage.local.get(['activeCourseState', 'isRunning'], (stored) => {
                  if (stored.activeCourseState) {
                    updateUi({ ...stored.activeCourseState, isRunning: stored.isRunning }, false);
                  } else {
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
    chrome.tabs.query({ active: true, currentWindow: true }, (currentTabs) => {
      const activeTab = currentTabs[0];
      const activeIsCourse = activeTab && isCourseUrl(activeTab.url);
      const chosenTabId = activeIsCourse ? activeTab.id : targetTabId;

      if (!chosenTabId) {
        addLog('No course tab open. Please open LinkedIn Learning, Coursera, or L&T EduTech.', 'warning');
        return;
      }

      targetTabId = chosenTabId;
      isTargetTabActive = activeIsCourse;

      // 1. Broadcast via storage (guaranteed to trigger storage.onChanged)
      const newRunning = action === 'START' || action === 'RESUME';
      chrome.storage.local.set({
        isRunning: newRunning,
        isPausedForUser: false,
        actionTrigger: action,
        actionTimestamp: Date.now()
      });

      // 2. Direct scripting injection & message across all frames
      if (chrome.scripting) {
        chrome.scripting.executeScript({
          target: { tabId: targetTabId, allFrames: true },
          func: (act) => {
            if (act === 'START') window.__coursepilotStart?.();
            else if (act === 'STOP') window.__coursepilotStop?.();
            else if (act === 'RESUME') window.__coursepilotResume?.();
          },
          args: [action]
        }).catch(() => {});

        chrome.tabs.sendMessage(targetTabId, { action }, (res) => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId: targetTabId, allFrames: true },
              files: ['content.js']
            }).catch(() => {});
          }
        });
      } else {
        chrome.tabs.sendMessage(targetTabId, { action }, () => {});
      }

      if (onSuccess) {
        onSuccess({ status: action });
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
      chrome.tabs.get(targetTabId, (tab) => {
        if (tab?.windowId) {
          chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
        }
        chrome.tabs.update(targetTabId, { active: true });
        window.close();
      });
    }
  });

  function openOrSwitchToUrl(urlPattern, defaultUrl) {
    chrome.tabs.query({ url: urlPattern }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        if (tab.windowId) chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
        chrome.tabs.update(tab.id, { active: true });
      } else {
        chrome.tabs.create({ url: defaultUrl });
      }
      window.close();
    });
  }

  launchLinkedInBtn?.addEventListener('click', () => {
    openOrSwitchToUrl('*://*.linkedin.com/learning/*', 'https://www.linkedin.com/learning');
  });

  launchCourseraBtn?.addEventListener('click', () => {
    openOrSwitchToUrl('*://*.coursera.org/*', 'https://www.coursera.org/learn');
  });

  launchLntBtn?.addEventListener('click', () => {
    openOrSwitchToUrl('*://*.lntedutech.com/*', 'https://lntedutech.com');
  });
});


