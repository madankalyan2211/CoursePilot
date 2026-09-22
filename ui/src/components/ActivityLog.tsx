import React, { useEffect, useRef } from 'react';
import { CheckCircle2, ArrowRight, AlertTriangle, XCircle, Info } from 'lucide-react';
import { ActivityLogEntry } from '../../../src/automation/automationState.js';

interface ActivityLogProps {
  logs: ActivityLogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (level: ActivityLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 size={13} color="var(--accent-green)" className="log-icon" />;
      case 'warning':
        return <AlertTriangle size={13} color="var(--accent-amber)" className="log-icon" />;
      case 'error':
        return <XCircle size={13} color="var(--accent-red)" className="log-icon" />;
      default:
        return <ArrowRight size={13} color="var(--accent-blue)" className="log-icon" />;
    }
  };

  return (
    <div className="activity-section">
      <div className="activity-header">
        <span className="activity-title">Live Activity</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {logs.length} events
        </span>
      </div>

      <div className="log-list" ref={scrollRef}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            No activity yet. Click Start Automation to begin.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-item ${log.level}`}>
              <span className="log-time">{log.timestamp}</span>
              {getLogIcon(log.level)}
              <span className="log-text">
                {log.action}
                {log.details && (
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                    ({log.details})
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
