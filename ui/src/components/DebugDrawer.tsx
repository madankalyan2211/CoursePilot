import React from 'react';
import { EngineSnapshot, AutomationSettings } from '../../../src/automation/automationState.js';

interface DebugDrawerProps {
  isOpen: boolean;
  snapshot: EngineSnapshot;
  onUpdateSettings: (settings: Partial<AutomationSettings>) => void;
}

export const DebugDrawer: React.FC<DebugDrawerProps> = ({
  isOpen,
  snapshot,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const signals = snapshot.completionSignals;
  const settings = snapshot.settings;

  return (
    <div className="debug-card">
      <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
        Debug Inspector & Signals
      </div>

      <div className="debug-grid">
        <div className="debug-item">
          <span className="debug-key">Current State</span>
          <span className="debug-val" style={{ color: 'var(--accent-blue)' }}>{snapshot.state}</span>
        </div>
        <div className="debug-item">
          <span className="debug-key">Active URL</span>
          <span className="debug-val" title={snapshot.activeBrowserUrl || 'None'}>
            {snapshot.activeBrowserUrl ? snapshot.activeBrowserUrl.slice(0, 30) + '...' : 'Disconnected'}
          </span>
        </div>
        <div className="debug-item">
          <span className="debug-key">Confidence Score</span>
          <span className="debug-val">{signals?.confidenceScore ?? 0}%</span>
        </div>
        <div className="debug-item">
          <span className="debug-key">Video Ended / Near</span>
          <span className="debug-val">
            {signals?.videoEnded ? 'YES (Ended)' : (signals?.videoNearEnd ? 'NEAR END' : 'NO')}
          </span>
        </div>
        <div className="debug-item">
          <span className="debug-key">TOC Marked Complete</span>
          <span className="debug-val">{signals?.markedCompleteInToc ? 'YES ✓' : 'NO'}</span>
        </div>
        <div className="debug-item">
          <span className="debug-key">Next Button Ready</span>
          <span className="debug-val">{signals?.nextButtonActive ? 'YES' : 'NO'}</span>
        </div>
      </div>

      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)' }}>
          Settings Tuning
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Seek Offset ({settings.seekOffsetSeconds}s before end)
          </span>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.5" 
            value={settings.seekOffsetSeconds} 
            onChange={(e) => onUpdateSettings({ seekOffsetSeconds: parseFloat(e.target.value) })}
            style={{ width: '120px' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Next Lesson Delay ({(settings.nextLessonDelayMs / 1000).toFixed(1)}s)
          </span>
          <input 
            type="range" 
            min="500" 
            max="5000" 
            step="250" 
            value={settings.nextLessonDelayMs} 
            onChange={(e) => onUpdateSettings({ nextLessonDelayMs: parseInt(e.target.value) })}
            style={{ width: '120px' }}
          />
        </div>
      </div>
    </div>
  );
};
