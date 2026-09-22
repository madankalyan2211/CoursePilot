import React from 'react';
import { AlertTriangle, Play, Square } from 'lucide-react';
import { LessonInfo } from '../../../src/automation/automationState.js';

interface AssessmentModalProps {
  isOpen: boolean;
  lesson: LessonInfo | null;
  onResume: () => void;
  onStop: () => void;
}

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  isOpen,
  lesson,
  onResume,
  onStop
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-badge">
          <AlertTriangle size={13} />
          <span>Action Required</span>
        </div>

        <h3 className="modal-title">Interactive Assessment Detected</h3>

        <p className="modal-desc">
          <strong>{lesson?.title || 'This lesson'}</strong> contains a quiz, exercise, or graded assessment. 
          To protect your learning integrity, CoursePilot does not auto-submit assessments.
        </p>
        
        <p className="modal-desc" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Please answer the questions in your browser, submit them, and click <strong>Resume</strong> to continue.
        </p>

        <div className="modal-actions">
          <button className="btn-primary btn-resume" onClick={onResume}>
            <Play size={15} fill="currentColor" />
            <span>Resume</span>
          </button>
          <button className="btn-primary btn-stop" style={{ width: '100px' }} onClick={onStop}>
            <Square size={14} />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
