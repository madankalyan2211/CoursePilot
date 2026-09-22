export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter?: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  factor: 2,
  jitter: true
};

export class RetryManager {
  private attempts: Map<string, number> = new Map();

  public getAttemptCount(operationKey: string): number {
    return this.attempts.get(operationKey) || 0;
  }

  public recordAttempt(operationKey: string): number {
    const current = this.getAttemptCount(operationKey);
    const next = current + 1;
    this.attempts.set(operationKey, next);
    return next;
  }

  public reset(operationKey?: string): void {
    if (operationKey) {
      this.attempts.delete(operationKey);
    } else {
      this.attempts.clear();
    }
  }

  public canRetry(operationKey: string, maxRetries: number = DEFAULT_RETRY_OPTIONS.maxRetries): boolean {
    return this.getAttemptCount(operationKey) < maxRetries;
  }

  public getBackoffDelay(operationKey: string, options: Partial<RetryOptions> = {}): number {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    const attempt = this.getAttemptCount(operationKey);
    let delay = opts.initialDelayMs * Math.pow(opts.factor, Math.max(0, attempt - 1));
    delay = Math.min(delay, opts.maxDelayMs);

    if (opts.jitter) {
      // Add +/- 20% random jitter
      const jitterFactor = 0.8 + Math.random() * 0.4;
      delay = Math.floor(delay * jitterFactor);
    }

    return delay;
  }

  public async waitBackoff(operationKey: string, options: Partial<RetryOptions> = {}): Promise<number> {
    const delay = this.getBackoffDelay(operationKey, options);
    await new Promise(resolve => setTimeout(resolve, delay));
    return delay;
  }
}
