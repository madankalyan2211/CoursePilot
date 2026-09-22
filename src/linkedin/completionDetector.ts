import { Page } from 'playwright';
import { getPlatformSelectors } from './selectors.js';
import { CompletionSignals } from '../automation/automationState.js';

export class CompletionDetector {
  public static async evaluateSignals(page: Page): Promise<CompletionSignals> {
    try {
      const { selectors } = getPlatformSelectors(page.url());
      const evaluation = await page.evaluate((sel) => {
        // 1. Video Player Check
        let videoEnded = false;
        let videoNearEnd = false;
        for (const selector of sel.videoPlayer) {
          const video = document.querySelector(selector) as HTMLVideoElement;
          if (video && typeof video.currentTime === 'number' && video.duration > 0) {
            videoEnded = video.ended;
            videoNearEnd = video.currentTime >= Math.max(0, video.duration - 1.2);
            break;
          }
        }

        // 2. Syllabus / TOC item completed mark
        let markedCompleteInToc = false;
        // Check active item for completed status
        let activeItem: Element | null = null;
        for (const activeSel of sel.activeTocItem) {
          activeItem = document.querySelector(activeSel);
          if (activeItem) break;
        }
        
        if (activeItem) {
          markedCompleteInToc = 
            activeItem.classList.contains('completed') ||
            activeItem.classList.contains('classroom-toc-item--completed') ||
            activeItem.getAttribute('data-test-toc-item-completed') !== null ||
            Boolean(activeItem.querySelector(sel.completionIndicators[0])) ||
            Boolean(activeItem.querySelector('.completed-icon, [data-test-icon="check-small"], svg[data-test-icon*="check"], svg[data-e2e*="complete"], .rc-CompletedIcon'));
        }

        // 3. Next button / Autoplay prompt active
        let nextButtonActive = false;
        for (const selector of sel.nextButton) {
          const btn = document.querySelector(selector) as HTMLButtonElement | HTMLAnchorElement;
          if (btn && !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true') {
            nextButtonActive = true;
            break;
          }
        }

        for (const selector of sel.nextUpBanner) {
          const banner = document.querySelector(selector);
          if (banner) {
            nextButtonActive = true;
            break;
          }
        }

        // Calculate confidence score (0-100)
        let score = 0;
        if (videoEnded) score += 50;
        else if (videoNearEnd) score += 30;

        if (markedCompleteInToc) score += 45;
        if (nextButtonActive) score += 20;

        const confidenceScore = Math.min(100, score);

        return {
          videoEnded,
          videoNearEnd,
          markedCompleteInToc,
          nextButtonActive,
          progressIncremented: markedCompleteInToc,
          confidenceScore
        };
      }, selectors);

      return evaluation;
    } catch {
      return {
        videoEnded: false,
        videoNearEnd: false,
        markedCompleteInToc: false,
        nextButtonActive: false,
        progressIncremented: false,
        confidenceScore: 0
      };
    }
  }

  public static async waitForCompletion(
    page: Page,
    timeoutMs: number = 15000,
    confidenceThreshold: number = 50,
    onProgress?: (signals: CompletionSignals) => void
  ): Promise<{ completed: boolean; signals: CompletionSignals; elapsedMs: number }> {
    const startTime = Date.now();
    let bestSignals: CompletionSignals = {
      videoEnded: false,
      videoNearEnd: false,
      markedCompleteInToc: false,
      nextButtonActive: false,
      progressIncremented: false,
      confidenceScore: 0
    };

    while (Date.now() - startTime < timeoutMs) {
      bestSignals = await this.evaluateSignals(page);
      
      if (onProgress) {
        onProgress(bestSignals);
      }

      if (bestSignals.confidenceScore >= confidenceThreshold) {
        return {
          completed: true,
          signals: bestSignals,
          elapsedMs: Date.now() - startTime
        };
      }

      // If video is still running near end, wait for it to complete naturally
      await page.waitForTimeout(400);
    }

    return {
      completed: bestSignals.confidenceScore >= confidenceThreshold,
      signals: bestSignals,
      elapsedMs: Date.now() - startTime
    };
  }
}

