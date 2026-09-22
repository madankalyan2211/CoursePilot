import React from 'react';
import { Play, Moon, Sun, Sliders } from 'lucide-react';
import { AutomationState } from '../../../src/automation/automationState.js';

interface HeaderProps {
  state: AutomationState;
  isRunning: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleDebug: () => void;
  showDebug: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isRunning,
  theme,
  onToggleTheme,
  onToggleDebug,
  showDebug
}) => {
  const getStatusClass = () => {
    if (state === AutomationState.REQUIRES_USER) return 'paused';
    if (state === AutomationState.ERROR) return 'error';
    if (isRunning) return 'active';
    return 'idle';
  };

  const getStatusLabel = () => {
    switch (state) {
      case AutomationState.IDLE: return 'Ready';
      case AutomationState.CONNECTING: return 'Connecting';
      case AutomationState.DETECTING_COURSE: return 'Detecting Course';
      case AutomationState.DETECTING_LESSON: return 'Detecting Lesson';
      case AutomationState.LOADING_PLAYER: return 'Loading Player';
      case AutomationState.SEEKING: return 'Seeking';
      case AutomationState.WAITING_FOR_COMPLETION: return 'Verifying Completion';
      case AutomationState.COMPLETED: return 'Lesson Complete';
      case AutomationState.ADVANCING: return 'Advancing';
      case AutomationState.VERIFYING_NEW_LESSON: return 'Verifying Lesson';
      case AutomationState.REQUIRES_USER: return 'Human Action Required';
      case AutomationState.PAUSED: return 'Paused';
      case AutomationState.ERROR: return 'Error';
      case AutomationState.STOPPED: return 'Stopped';
      default: return state;
    }
  };

  return (
    <header className="window-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Play size={14} fill="currentColor" />
        </div>
        <div>
          <span className="brand-name">CoursePilot</span>
        </div>
      </div>

      <div className="header-status">
        <div className={`status-indicator ${getStatusClass()}`}>
          <span className="status-dot"></span>
          <span>{getStatusLabel()}</span>
        </div>

        <a
          href="https://github.com/madankalyan2211/CoursePilot"
          target="_blank"
          rel="noopener noreferrer"
          className="drawer-toggle github-star-link"
          title="Star CoursePilot on GitHub"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            color: '#ffd60a',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 10px',
            borderRadius: '99px',
            background: 'rgba(255, 214, 10, 0.12)',
            border: '1px solid rgba(255, 214, 10, 0.3)',
            opacity: 1
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffd60a" stroke="#ffd60a" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Star on GitHub</span>
        </a>

        <button 
          className="drawer-toggle" 
          onClick={onToggleDebug} 
          title="Toggle Debug Inspector"
          style={{ opacity: showDebug ? 1 : 0.6 }}
        >
          <Sliders size={16} />
        </button>

        <button 
          className="drawer-toggle" 
          onClick={onToggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

