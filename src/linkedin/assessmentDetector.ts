import { Page } from 'playwright';
import { PageDetector } from './pageDetector.js';

export interface AssessmentDetectionResult {
  isAssessment: boolean;
  type?: 'quiz' | 'knowledge_check' | 'exercise' | 'assessment';
  reason?: string;
}

export class AssessmentDetector {
  public static async inspect(page: Page): Promise<AssessmentDetectionResult> {
    const url = page.url();
    const { selectors, platform } = await PageDetector.detectPlatformFromPage(page);

    // 1. URL-based detection: explicit quiz, exam, assignment, or peer review route
    if (
      url.includes('/quiz/') || 
      url.includes('/assessment/') || 
      url.includes('/exam/') || 
      url.includes('/assignment-submission/') ||
      url.includes('/peer-review/') ||
      url.includes('/ungradedWidget/')
    ) {
      return {
        isAssessment: true,
        type: 'quiz',
        reason: `Detected assessment route in URL (${url})`
      };
    }


    // 2. Check if a video player is currently active & rendered
    // If a video element exists and has duration > 0, this is a video lesson, NOT a standalone quiz
    try {
      const hasActiveVideo = await page.evaluate((videoSelectors) => {
        for (const selector of videoSelectors) {
          const video = document.querySelector(selector) as HTMLVideoElement;
          if (video && typeof video.duration === 'number' && video.duration > 0) {
            // Video is ready or playable
            return true;
          }
        }
        return false;
      }, selectors.videoPlayer);

      if (hasActiveVideo) {
        return { isAssessment: false };
      }
    } catch {
      // Continue checks
    }

    // 3. Strict DOM indicator check for interactive quiz containers & forms
    for (const selector of selectors.assessmentIndicators) {
      try {
        const el = await page.$(selector);
        if (el && await el.isVisible()) {
          return {
            isAssessment: true,
            type: 'quiz',
            reason: `Detected active quiz element: ${selector}`
          };
        }
      } catch {
        // Continue checking
      }
    }

    // 4. Inspection of main content area for explicit question forms with radio buttons or inputs
    try {
      const isInteractiveQuiz = await page.evaluate(() => {
        // Only inspect main content area, exclude sidebar/footer
        const mainArea = document.querySelector('main, #main-content, .classroom-layout__content, .rc-ItemPage, div[role="main"]') || document.body;
        
        const hasQuizForm = Boolean(mainArea.querySelector('form[data-test-quiz-form], fieldset.quiz-question, [data-test-quiz-container], .rc-Quiz, form[data-e2e*="quiz"], form.rc-QuizForm'));
        const hasQuestionRadios = Boolean(mainArea.querySelector('div[role="radiogroup"], fieldset input[type="radio"], input[type="checkbox"][name*="choice"], .rc-FormOption'));
        
        return hasQuizForm && hasQuestionRadios;
      });

      if (isInteractiveQuiz) {
        return {
          isAssessment: true,
          type: 'quiz',
          reason: 'Detected interactive quiz form with question options'
        };
      }
    } catch {
      // Evaluation failed
    }

    return {
      isAssessment: false
    };
  }
}

