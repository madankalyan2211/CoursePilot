import React, { useState } from 'react';
import { Star, ExternalLink, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';

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
  const [username, setUsername] = useState(() => localStorage.getItem('coursepilot_github_user') || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  if (!isOpen) return null;

  const handleVerify = async () => {
    let cleanUser = username.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '').trim();
    if (!cleanUser) {
      setStatus({ type: 'error', message: '⚠️ Please enter your GitHub username.' });
      return;
    }

    if (cleanUser.toLowerCase() === 'madankalyan2211') {
      localStorage.setItem('coursepilot_github_user', cleanUser);
      setStatus({ type: 'success', message: `✓ Verified Repository Author @${cleanUser}! 🚀` });
      setTimeout(() => {
        onActivate();
      }, 700);
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: `🔍 Checking @${cleanUser}'s starred repos...` });

    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}/starred?per_page=100&_t=${Date.now()}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (res.status === 404) {
        setStatus({ type: 'error', message: `❌ GitHub user "@${cleanUser}" not found.` });
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        setStatus({ type: 'error', message: '⚠️ GitHub rate limit reached. Click activate below if you starred.' });
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error('API Error');

      const repos = await res.json();
      const hasStarred = Array.isArray(repos) && repos.some((r: any) => {
        const full = (r.full_name || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        const owner = (r.owner?.login || '').toLowerCase();
        return full === 'madankalyan2211/coursepilot' || (name === 'coursepilot' && owner === 'madankalyan2211');
      });

      if (hasStarred) {
        localStorage.setItem('coursepilot_github_user', cleanUser);
        setStatus({ type: 'success', message: `✓ Verified! Thank you @${cleanUser}! ⭐` });
        setTimeout(() => {
          onActivate();
        }, 800);
      } else {
        setStatus({
          type: 'error',
          message: `⏳ Star not yet cached in GitHub API. If you just starred, click Activate below.`
        });
      }
    } catch {
      setStatus({ type: 'error', message: '⚠️ Network error verifying GitHub star.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '420px', textAlign: 'center', alignItems: 'center', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>

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
          CoursePilot is free & open source. To unlock automation, please <strong>Star our GitHub repository</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <a
            href="https://github.com/madankalyan2211/CoursePilot"
            target="_blank"
            rel="noopener noreferrer"
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
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            <Star size={16} fill="#ffd60a" />
            <span>1. Star Repository on GitHub</span>
            <ExternalLink size={14} />
          </a>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'left'
          }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
              2. Enter your GitHub username to verify:
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(20,20,26,0.9)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '0 10px'
            }}>
              <span style={{ color: '#ffd60a', fontWeight: 700, fontSize: '13px' }}>@</span>
              <input
                type="text"
                placeholder="github-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  padding: '8px 6px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              className="btn-primary"
              disabled={loading}
              onClick={handleVerify}
              style={{
                padding: '11px',
                fontSize: '13px',
                fontWeight: 700,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              <span>{loading ? 'Verifying Star...' : 'Verify Star & Activate 🚀'}</span>
            </button>

            {status.message && (
              <div style={{
                fontSize: '11px',
                padding: '8px',
                borderRadius: '6px',
                background: status.type === 'error' ? 'rgba(255,69,58,0.15)' : status.type === 'success' ? 'rgba(48,209,88,0.15)' : 'rgba(10,132,255,0.15)',
                border: `1px solid ${status.type === 'error' ? 'rgba(255,69,58,0.3)' : status.type === 'success' ? 'rgba(48,209,88,0.3)' : 'rgba(10,132,255,0.3)'}`,
                color: status.type === 'error' ? '#ff453a' : status.type === 'success' ? '#30d158' : '#0a84ff',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {status.type === 'error' && <AlertCircle size={12} />}
                  <span>{status.message}</span>
                </div>
                {status.type === 'error' && (
                  <button
                    onClick={() => {
                      localStorage.setItem('coursepilot_github_user', username || 'user');
                      onActivate();
                    }}
                    style={{
                      background: '#30d158',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    I've Starred — Activate Now ⭐
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
