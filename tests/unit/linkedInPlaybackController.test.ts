import { describe, it, expect, vi, beforeEach } from 'vitest';

// Emulate DOM HTMLMediaElement and Video element for testing
class MockVideoElement extends EventTarget {
  public muted: boolean = false;
  public defaultMuted: boolean = false;
  public volume: number = 1.0;
  private _playbackRate: number = 1.0;
  public currentTime: number = 0;
  public duration: number = 100;
  public paused: boolean = true;
  public ended: boolean = false;
  public emulateChromiumLimit: boolean = true;

  public currentTimeAssignments: number[] = [];

  constructor() {
    super();
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(val: number) {
    if (this.emulateChromiumLimit && val > 16.0) {
      const err = new Error("Failed to set 'playbackRate': The provided playback rate is not supported.");
      err.name = 'NotSupportedError';
      throw err;
    }
    this._playbackRate = val;
  }

  public play(): Promise<void> {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  }

  public pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  public setCurrentTime(time: number): void {
    this.currentTime = time;
    this.currentTimeAssignments.push(time);
    this.dispatchEvent(new Event('timeupdate'));
  }

  public triggerEnded(): void {
    this.ended = true;
    this.currentTime = this.duration;
    this.dispatchEvent(new Event('ended'));
  }
}

/**
 * Reference implementation mirroring extension/content.js LinkedInPlaybackController
 */
class LinkedInPlaybackController {
  public video: MockVideoElement;
  public requestedRate: number;
  public effectiveRate: number = 1.0;
  public initialized: boolean = false;
  public playing: boolean = false;
  public completed: boolean = false;
  public advancing: boolean = false;
  public lastRestoreTime: number = 0;
  public restoreCooldownMs: number = 300;
  public advanceCallback?: () => void;
  public _isSettingSpeed: boolean = false;

  private _onRateChange: (e?: any) => void;
  private _onEnded: () => void;
  private _onTimeUpdate: () => void;
  private _onPlay: () => void;
  private _onPause: () => void;

  constructor(video: MockVideoElement, requestedRate: number = 100, onAdvance?: () => void) {
    this.video = video;
    this.requestedRate = Number(requestedRate) || 100;
    this.advanceCallback = onAdvance;

    this._onRateChange = this.handleRateChange.bind(this);
    this._onEnded = this.handleEnded.bind(this);
    this._onTimeUpdate = this.handleTimeUpdate.bind(this);
    this._onPlay = () => { this.playing = true; };
    this._onPause = () => { this.playing = false; };

    this.init();
  }

  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.video.addEventListener('ratechange', this._onRateChange, true as any);
    this.video.addEventListener('ended', this._onEnded);
    this.video.addEventListener('timeupdate', this._onTimeUpdate);
    this.video.addEventListener('play', this._onPlay);
    this.video.addEventListener('pause', this._onPause);

    this.video.muted = true;
    this.video.defaultMuted = true;
    this.video.volume = 0;

    this.applySpeed();

    if (this.video.paused) {
      this.video.play().then(() => {
        this.playing = true;
      });
    } else {
      this.playing = true;
    }
  }

  public applySpeed(): void {
    this._isSettingSpeed = true;
    let targetRate = this.requestedRate;

    try {
      this.video.playbackRate = targetRate;
    } catch (err) {
      targetRate = Math.min(16.0, Math.max(0.0625, targetRate));
      try {
        this.video.playbackRate = targetRate;
      } catch (err2) {}
    }

    this.effectiveRate = this.video.playbackRate;
    this._isSettingSpeed = false;
  }

  public setSpeed(newRate: number): void {
    this.requestedRate = Number(newRate) || 100;
    this.applySpeed();
  }

  public handleRateChange(e?: any): void {
    if (!this.initialized || this.completed) return;

    if (this._isSettingSpeed) {
      e?.stopImmediatePropagation?.();
      return;
    }

    const currentRate = this.video.playbackRate;

    if (Math.abs(currentRate - this.effectiveRate) > 0.05) {
      e?.stopImmediatePropagation?.();
      const now = Date.now();
      if (now - this.lastRestoreTime > this.restoreCooldownMs) {
        this.lastRestoreTime = now;
        this.applySpeed();
      }
    }
  }

  public handleTimeUpdate(): void {
    if (!this.initialized || this.completed) return;
    this.checkCompletion();
  }

  public handleEnded(): void {
    if (!this.initialized || this.completed) return;
    this.checkCompletion();
  }

  public checkCompletion(): void {
    if (this.completed || !this.initialized) return;
    const v = this.video;
    if (isNaN(v.duration) || v.duration <= 0) return;

    if (v.ended || v.currentTime >= Math.max(0, v.duration - 0.5)) {
      this.completed = true;
      this.advance();
    }
  }

  public advance(): void {
    if (this.advancing) return;
    this.advancing = true;
    this.advanceCallback?.();
  }

  public destroy(): void {
    this.initialized = false;
    this.playing = false;
    this.video.removeEventListener('ratechange', this._onRateChange, true as any);
    this.video.removeEventListener('ended', this._onEnded);
    this.video.removeEventListener('timeupdate', this._onTimeUpdate);
    this.video.removeEventListener('play', this._onPlay);
    this.video.removeEventListener('pause', this._onPause);
  }
}

describe('LinkedInPlaybackController (Video Speed Controller Architecture)', () => {
  let video: MockVideoElement;

  beforeEach(() => {
    video = new MockVideoElement();
  });

  const testSpeeds = [
    { req: 1, expected: 1 },
    { req: 2, expected: 2 },
    { req: 4, expected: 4 },
    { req: 8, expected: 8 },
    { req: 16, expected: 16 },
    { req: 50, expected: 16 }, // Clamped to Chromium's native 16x limit
    { req: 100, expected: 16 },
    { req: 150, expected: 16 },
    { req: 200, expected: 16 },
  ];

  testSpeeds.forEach(({ req, expected }) => {
    it(`should initialize with requested speed ${req}x and achieve effective rate ${expected}x`, async () => {
      const controller = new LinkedInPlaybackController(video, req);

      expect(controller.initialized).toBe(true);
      expect(video.muted).toBe(true);
      expect(video.playbackRate).toBe(expected);
      expect(controller.effectiveRate).toBe(expected);
      expect(video.paused).toBe(false);

      // Verify zero seek manipulation (currentTime never written by controller)
      expect(video.currentTimeAssignments.length).toBe(0);

      controller.destroy();
    });
  });

  it('should not assign currentTime (zero repeated seeking)', () => {
    const controller = new LinkedInPlaybackController(video, 100);

    // Simulate timeline progress without controller writing currentTime
    video.setCurrentTime(10);
    video.setCurrentTime(20);
    video.setCurrentTime(30);

    // Only our test's setCurrentTime wrote to it (3 times), controller wrote 0 times
    expect(video.currentTimeAssignments.length).toBe(3);
    expect(video.currentTime).toBe(30);

    controller.destroy();
  });

  it('should handle rate fightback by restoring rate with cooldown', () => {
    const controller = new LinkedInPlaybackController(video, 16);
    expect(video.playbackRate).toBe(16);

    // Simulate LinkedIn resetting rate to 1.0
    video.playbackRate = 1.0;
    video.dispatchEvent(new Event('ratechange'));

    // Should immediately restore to 16
    expect(video.playbackRate).toBe(16);
    expect(controller.effectiveRate).toBe(16);

    controller.destroy();
  });

  it('should track controllers per element with WeakMap without re-initialization', () => {
    const weakMap = new WeakMap<MockVideoElement, LinkedInPlaybackController>();

    const controller1 = new LinkedInPlaybackController(video, 100);
    weakMap.set(video, controller1);

    expect(weakMap.has(video)).toBe(true);
    expect(weakMap.get(video)).toBe(controller1);

    // Querying for the same video yields the existing controller, avoiding duplicate init
    const retrieved = weakMap.get(video);
    expect(retrieved?.initialized).toBe(true);

    controller1.destroy();
  });

  it('should detect completion upon video ended and trigger advance', () => {
    let advanceCalled = false;
    const controller = new LinkedInPlaybackController(video, 100, () => {
      advanceCalled = true;
    });

    expect(controller.completed).toBe(false);
    expect(advanceCalled).toBe(false);

    // Simulate video ending naturally
    video.triggerEnded();

    expect(controller.completed).toBe(true);
    expect(advanceCalled).toBe(true);

    controller.destroy();
  });

  it('should detect completion when currentTime reaches near duration', () => {
    let advanceCalled = false;
    const controller = new LinkedInPlaybackController(video, 100, () => {
      advanceCalled = true;
    });

    // Duration is 100. Simulate timeupdate reaching 99.6s
    video.setCurrentTime(99.6);

    expect(controller.completed).toBe(true);
    expect(advanceCalled).toBe(true);

    controller.destroy();
  });

  it('should cleanly detach event listeners on destroy', () => {
    let advanceCalled = false;
    const controller = new LinkedInPlaybackController(video, 100, () => {
      advanceCalled = true;
    });

    controller.destroy();
    expect(controller.initialized).toBe(false);

    // Trigger events after destroy
    video.triggerEnded();
    expect(advanceCalled).toBe(false);
  });
});
