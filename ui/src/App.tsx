import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.js';
import { CourseCard } from './components/CourseCard.js';
import { ControlBar } from './components/ControlBar.js';
import { ActivityLog } from './components/ActivityLog.js';
import { AssessmentModal } from './components/AssessmentModal.js';
import { FloatingNotification } from './components/FloatingNotification.js';
import { DebugDrawer } from './components/DebugDrawer.js';
import { StarGateModal } from './components/StarGateModal.js';
import { EngineSnapshot, AutomationState, AutomationSettings } from '../../src/automation/automationState.js';

const INITIAL_SNAPSHOT: EngineSnapshot = {
  state: AutomationState.IDLE,
  isRunning: false,
  isPaused: false,
  requiresUserAction: false,
  currentCourse: null,
  currentLesson: null,
  completionSignals: null,
  activityLogs: [],
  settings: {
    seekOffsetSeconds: 2.5,
    completionTimeoutMs: 15000,
    nextLessonDelayMs: 1200,
    maxRetries: 3,
    autoResumeAfterAssessment: false
  },
  activeBrowserUrl: null,
  errorMessage: null,
  retryCount: 0
};

export const App: React.FC = () => {
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(INITIAL_SNAPSHOT);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showDebug, setShowDebug] = useState(false);
  const [showStarGate, setShowStarGate] = useState(false);
  const [hasStarred, setHasStarred] = useState<boolean>(() => {
    return localStorage.getItem('coursepilot_has_starred') === 'true';
  });
  const wsRef = useRef<WebSocket | null>(null);

  // Theme switcher
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // WebSocket connection
  useEffect(() => {
    let reconnectTimeout: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? 'localhost:3100' : window.location.host;
      const ws = new WebSocket(`${protocol}//${host}/ws`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'SNAPSHOT') {
            setSnapshot(message.data);
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    // Initial fetch fallback
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setSnapshot(data))
      .catch(() => {});

    return () => {
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, []);

  const sendWsAction = (action: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...payload }));
    } else {
      // Fallback to REST endpoint
      const endpoint = action.toLowerCase().replace('_', '-');
      fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      }).catch(err => console.error('REST action failed:', err));
    }
  };

  const handleStart = () => {
    if (!hasStarred) {
      setShowStarGate(true);
      return;
    }
    sendWsAction('START');
  };

  const handleActivateFromGate = () => {
    setHasStarred(true);
    localStorage.setItem('coursepilot_has_starred', 'true');
    setShowStarGate(false);
    sendWsAction('START');
  };

  const handleStop = () => sendWsAction('STOP');
  const handleResume = () => sendWsAction('RESUME');
  const handleOpenLinkedIn = () => sendWsAction('OPEN_LINKEDIN');
  const handleOpenCoursera = () => sendWsAction('OPEN_COURSERA');
  const handleUpdateSettings = (settings: Partial<AutomationSettings>) => {
    sendWsAction('UPDATE_SETTINGS', { settings });
  };

  return (
    <div className="app-container">
      <main className="window-card">
        <Header
          state={snapshot.state}
          isRunning={snapshot.isRunning}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onToggleDebug={() => setShowDebug(s => !s)}
          showDebug={showDebug}
        />

        <CourseCard
          course={snapshot.currentCourse}
          lesson={snapshot.currentLesson}
          state={snapshot.state}
          errorMessage={snapshot.errorMessage}
        />

        <ControlBar
          state={snapshot.state}
          isRunning={snapshot.isRunning}
          onStart={handleStart}
          onStop={handleStop}
          onResume={handleResume}
          onOpenLinkedIn={handleOpenLinkedIn}
          onOpenCoursera={handleOpenCoursera}
        />

        {showDebug && (
          <div style={{ padding: '0 22px 14px' }}>
            <DebugDrawer
              isOpen={showDebug}
              snapshot={snapshot}
              onUpdateSettings={handleUpdateSettings}
            />
          </div>
        )}

        <ActivityLog logs={snapshot.activityLogs} />
      </main>

      <AssessmentModal
        isOpen={snapshot.requiresUserAction}
        lesson={snapshot.currentLesson}
        onResume={handleResume}
        onStop={handleStop}
      />

      <FloatingNotification
        isVisible={snapshot.requiresUserAction}
        lesson={snapshot.currentLesson}
        onResume={handleResume}
        onStop={handleStop}
      />

      <StarGateModal
        isOpen={showStarGate}
        onActivate={handleActivateFromGate}
        onClose={() => setShowStarGate(false)}
      />
    </div>
  );
};

