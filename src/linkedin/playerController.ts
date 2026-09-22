import { Page } from 'playwright';
import { getPlatformSelectors } from './selectors.js';

export interface PlayerStatus {
  hasPlayer: boolean;
  isReady: boolean;
  duration: number;
  currentTime: number;
  paused: boolean;
  ended: boolean;
  playbackRate: number;
}

export class PlayerController {
  public static async getPlayerStatus(page: Page): Promise<PlayerStatus> {
    try {
      const { selectors } = getPlatformSelectors(page.url());
      const status = await page.evaluate((videoSelectors) => {
        let videoEl: HTMLVideoElement | null = null;

        for (const selector of videoSelectors) {
          const el = document.querySelector(selector) as HTMLVideoElement;
          if (el && typeof el.currentTime === 'number') {
            videoEl = el;
            break;
          }
        }

        if (!videoEl) {
          return {
            hasPlayer: false,
            isReady: false,
            duration: 0,
            currentTime: 0,
            paused: true,
            ended: false,
            playbackRate: 1
          };
        }

        return {
          hasPlayer: true,
          isReady: videoEl.readyState >= 1 && !isNaN(videoEl.duration) && videoEl.duration > 0,
          duration: videoEl.duration || 0,
          currentTime: videoEl.currentTime || 0,
          paused: videoEl.paused,
          ended: videoEl.ended,
          playbackRate: videoEl.playbackRate || 1
        };
      }, selectors.videoPlayer);

      return status;
    } catch {
      return {
        hasPlayer: false,
        isReady: false,
        duration: 0,
        currentTime: 0,
        paused: true,
        ended: false,
        playbackRate: 1
      };
    }
  }

  public static async waitForPlayerReady(page: Page, timeoutMs: number = 8000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getPlayerStatus(page);
      if (status.hasPlayer && status.isReady) {
        return true;
      }
      await page.waitForTimeout(350);
    }
    return false;
  }

  public static async seekNearEnd(
    page: Page, 
    offsetSeconds: number = 2.5
  ): Promise<{ success: boolean; targetTime: number; duration: number; error?: string }> {
    try {
      const { selectors } = getPlatformSelectors(page.url());
      const result = await page.evaluate(({ videoSelectors, offset }) => {
        let videoEl: HTMLVideoElement | null = null;
        for (const selector of videoSelectors) {
          const el = document.querySelector(selector) as HTMLVideoElement;
          if (el && typeof el.currentTime === 'number') {
            videoEl = el;
            break;
          }
        }

        if (!videoEl) {
          return { success: false, targetTime: 0, duration: 0, error: 'Video element not found' };
        }

        const duration = videoEl.duration;
        if (!duration || isNaN(duration) || duration <= 0) {
          return { success: false, targetTime: 0, duration: 0, error: 'Invalid video duration' };
        }

        // Compute safe target: offset seconds before duration, but at least 95% into the video
        let target = Math.max(0, duration - offset);
        if (duration > 10 && target < duration * 0.9) {
          target = duration * 0.95;
        }

        // Set current time and trigger native media events
        videoEl.currentTime = target;
        videoEl.dispatchEvent(new Event('seeking'));
        videoEl.dispatchEvent(new Event('seeked'));
        videoEl.dispatchEvent(new Event('timeupdate'));

        // Ensure playback continues so natural end event fires
        if (videoEl.paused) {
          videoEl.play().catch(() => {});
        }

        return {
          success: true,
          targetTime: target,
          duration: duration
        };
      }, { videoSelectors: selectors.videoPlayer, offset: offsetSeconds });

      return result;
    } catch (err: any) {
      return {
        success: false,
        targetTime: 0,
        duration: 0,
        error: err?.message || 'Failed to seek video'
      };
    }
  }

  public static async ensurePlaying(page: Page): Promise<boolean> {
    try {
      const { selectors } = getPlatformSelectors(page.url());
      return await page.evaluate((videoSelectors) => {
        let videoEl: HTMLVideoElement | null = null;
        for (const selector of videoSelectors) {
          const el = document.querySelector(selector) as HTMLVideoElement;
          if (el) {
            videoEl = el;
            break;
          }
        }
        if (videoEl && videoEl.paused) {
          videoEl.play().catch(() => {});
          return true;
        }
        return false;
      }, selectors.videoPlayer);
    } catch {
      return false;
    }
  }
}

