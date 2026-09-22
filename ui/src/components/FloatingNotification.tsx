import React from 'react';
import { Play, Square, AlertTriangle } from 'lucide-react';
import { LessonInfo } from '../../../src/automation/automationState.js';

interface FloatingNotificationProps {
  isVisible: boolean;
  lesson: LessonInfo | null;
  onResume: () => void;
  onStop: () => void;
}

export const FloatingNotification: React.FC<FloatingNotificationProps> = ({
  isVisible,
  lesson,
  onResume,
  onStop
}) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '460px',
      background: 'rgba(20, 20, 26, 0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 214, 10, 0.35)',
      borderRadius: '16px',
      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5), 0 0 24px rgba(255, 214, 10, 0.15)',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      zIndex: 9999,
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'rgba(255, 214, 10, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={16} color="var(--accent-amber)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quiz Detected
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lesson?.title || 'Interactive Assessment'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button 
          onClick={onResume}
          style={{
            background: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '9px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 8px rgba(10, 132, 255, 0.4)'
          }}
        >
          <Play size={12} fill="white" />
          <span>Resume</span>
        </button>
        <button 
          onClick={onStop}
          style={{
            background: 'rgba(255, 69, 58, 0.15)',
            color: 'var(--accent-red)',
            border: '1px solid rgba(255, 69, 58, 0.3)',
            borderRadius: '9px',
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Square size={11} fill="currentColor" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
};
