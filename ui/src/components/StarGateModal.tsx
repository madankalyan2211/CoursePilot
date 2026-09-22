import React, { useState } from 'react';
import { Star, ExternalLink, CheckCircle } from 'lucide-react';

interface StarGateModalProps {
  isOpen: boolean;
  onActivate: () => void;
  onClose: () => void;
}

export const StarGateModal: React.FC<StarGateModalProps> = ({
  isOpen,
  onActivate,
  onClose
}) => {
  const [hasClickedStar, setHasClickedStar] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '420px', textAlign: 'center', alignItems: 'center' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'rgba(255, 214, 10, 0.15)',
          border: '1px solid rgba(255, 214, 10, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          marginBottom: '10px',
          boxShadow: '0 0 20px rgba(255, 214, 10, 0.25)'
        }}>
          ⭐
        </div>

        <h3 className="modal-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
          Star Repository to Turn On
        </h3>

        <p className="modal-desc" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
          CoursePilot is 100% free & open source. To activate automation on LinkedIn Learning & Coursera, please <strong>Star our GitHub repository</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <a
            href="https://github.com/madankalyan2211/CoursePilot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setHasClickedStar(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 214, 10, 0.15)',
              border: '1px solid rgba(255, 214, 10, 0.4)',
              color: '#ffd60a',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            <Star size={16} fill="#ffd60a" />
            <span>1. Star Repository on GitHub</span>
            <ExternalLink size={14} />
          </a>

          <button
            className="btn-primary"
            style={{
              background: hasClickedStar ? '#30d158' : '#0a84ff',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 700,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onClick={onActivate}
          >
            <CheckCircle size={16} />
            <span>2. I've Starred ⭐ (Activate Automation)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
