import { describe, it, expect, beforeEach } from 'vitest';
import { RetryManager } from '../../src/automation/retryManager.js';

describe('RetryManager', () => {
  let manager: RetryManager;

  beforeEach(() => {
    manager = new RetryManager();
  });

  it('should track attempts and enforce maxRetries', () => {
    expect(manager.getAttemptCount('op1')).toBe(0);
    expect(manager.canRetry('op1', 2)).toBe(true);

    manager.recordAttempt('op1');
    expect(manager.getAttemptCount('op1')).toBe(1);
    expect(manager.canRetry('op1', 2)).toBe(true);

    manager.recordAttempt('op1');
    expect(manager.getAttemptCount('op1')).toBe(2);
    expect(manager.canRetry('op1', 2)).toBe(false);
  });

  it('should compute bounded backoff delay', () => {
    manager.recordAttempt('op2'); // attempt 1
    const delay1 = manager.getBackoffDelay('op2', { initialDelayMs: 1000, factor: 2, jitter: false, maxRetries: 3, maxDelayMs: 5000 });
    expect(delay1).toBe(1000);

    manager.recordAttempt('op2'); // attempt 2
    const delay2 = manager.getBackoffDelay('op2', { initialDelayMs: 1000, factor: 2, jitter: false, maxRetries: 3, maxDelayMs: 5000 });
    expect(delay2).toBe(2000);
  });

  it('should reset attempts', () => {
    manager.recordAttempt('op3');
    manager.reset('op3');
    expect(manager.getAttemptCount('op3')).toBe(0);
  });
});
