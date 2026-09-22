import React from 'react';
import { Play, Square, ExternalLink, RefreshCw } from 'lucide-react';
import { AutomationState } from '../../../src/automation/automationState.js';

interface ControlBarProps {
  state: AutomationState;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onResume: () => void;
  onOpenLinkedIn: () => void;
  onOpenCoursera: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  state,
  isRunning,
  onStart,
  onStop,
  onResume,
  onOpenLinkedIn,
  onOpenCoursera
}) => {
  const isRequiresUser = state === AutomationState.REQUIRES_USER;

  return (
    <div className="controls-section">
      {isRequiresUser ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary btn-resume" onClick={onResume}>
            <RefreshCw size={16} />
            <span>RESUME AUTOMATION</span>
          </button>
          <button className="btn-primary btn-stop" style={{ width: '40%' }} onClick={onStop}>
            <Square size={16} />
            <span>STOP</span>
          </button>
        </div>
      ) : isRunning ? (
        <button className="btn-primary btn-stop" onClick={onStop}>
          <Square size={16} />
          <span>STOP AUTOMATION</span>
        </button>
      ) : (
        <button className="btn-primary btn-start" onClick={onStart}>
          <Play size={16} fill="white" />
          <span>START AUTOMATION</span>
        </button>
      )}

      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onOpenLinkedIn}>
          <ExternalLink size={14} />
          <span>LinkedIn Learning</span>
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onOpenCoursera}>
          <ExternalLink size={14} />
          <span>Coursera</span>
        </button>
      </div>
    </div>
  );
};

