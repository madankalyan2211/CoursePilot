import { Page } from 'playwright';
import { getPlatformSelectors } from './selectors.js';
import { CourseDetector } from './courseDetector.js';

export interface AdvanceResult {
  success: boolean;
  actionTaken: string;
  previousUrl: string;
  newUrl: string;
  previousTitle?: string;
  newTitle?: string;
  isCourseComplete?: boolean;
  error?: string;
}

export class NextLessonController {
  /**
   * Normalizes a Learning URL by removing query parameters and hashes
   */
  public static normalizeUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl);
      return `${u.origin}${u.pathname}`.replace(/\/$/, '');
    } catch {
      return (rawUrl || '').split('?')[0].split('#')[0].replace(/\/$/, '');
    }
  }

  public static async advanceToNextLesson(
    page: Page, 
    previousUrl: string,
    previousTitle?: string
  ): Promise<AdvanceResult> {
    const initialUrl = previousUrl || page.url();
    const normalizedInitialUrl = this.normalizeUrl(initialUrl);
    const initialTitle = previousTitle || '';
    const currentCourseId = CourseDetector.extractCourseId(initialUrl);
    const { selectors, platform } = getPlatformSelectors(initialUrl);

    // --- STRATEGY 1: Dedicated Player & Classroom Next Navigation Buttons ---
    for (const selector of selectors.nextButton) {
      try {
        const nextBtns = await page.$$(selector);
        for (const nextBtn of nextBtns) {
          if (await nextBtn.isVisible()) {
            const isEnabled = await nextBtn.evaluate((el: HTMLButtonElement | HTMLAnchorElement) => {
              if (el instanceof HTMLButtonElement) {
                return !el.disabled && el.getAttribute('aria-disabled') !== 'true';
              }
              return el.getAttribute('aria-disabled') !== 'true';
            });

            if (isEnabled) {
              await nextBtn.click({ force: true });
              const verification = await this.verifyLessonChanged(page, normalizedInitialUrl, initialTitle, currentCourseId, 3000);
              if (verification.changed && verification.isCoursePage) {
                return {
                  success: true,
                  actionTaken: `Clicked next button (${selector})`,
                  previousUrl: initialUrl,
                  newUrl: page.url(),
                  previousTitle: initialTitle,
                  newTitle: verification.currentTitle
                };
              }
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    // --- STRATEGY 2: Syllabus TOC Sequential Navigation (Strictly Scoped) ---
    try {
      // Step A: Expand any collapsed section accordions in the sidebar
      await page.evaluate((sel) => {
        const toggleButtons = document.querySelectorAll(sel.tocSectionToggle[0]);
        toggleButtons.forEach((btn) => {
          if (btn instanceof HTMLElement && btn.getAttribute('aria-expanded') === 'false') {
            btn.click();
          }
        });
      }, selectors);

      await page.waitForTimeout(200);

      // Step B: Query syllabus links strictly inside sidebar/TOC container
      const syllabusInfo = await page.evaluate(({ courseId, sel, currentPlatform }) => {
        // Find sidebar container
        let sidebarContainer: Element | null = null;
        for (const s of sel.tocContainer) {
          sidebarContainer = document.querySelector(s);
          if (sidebarContainer) break;
        }

        const root = sidebarContainer || document.querySelector('main') || document.body;
        const linkPattern = currentPlatform === 'coursera' ? 'a[href*="/learn/"]' : 'a[href*="/learning/"]';
        const allAnchors = Array.from(root.querySelectorAll(linkPattern)) as HTMLAnchorElement[];

        // Strictly filter anchors belonging to this specific course's lessons
        const lessonAnchors = allAnchors.filter(a => {
          const href = a.getAttribute('href') || '';
          const path = (href.startsWith('http') ? new URL(href).pathname : href).replace(/\/$/, '');
          
          if (currentPlatform === 'coursera') {
            // Must match /learn/{courseId}/lecture/ or /learn/{courseId}/...
            const parts = path.split('/').filter(Boolean); // ['learn', courseId, itemType, itemId]
            const isCourseLesson = parts.length >= 2 && parts[0] === 'learn' && (!courseId || parts[1] === courseId);
            const isGlobal = path === '/learn' || path === '/learn/' || path.includes('/home') || path.includes('/my-learning');
            return isCourseLesson && !isGlobal;
          } else {
            // LinkedIn Learning: /learning/{courseId}/{lessonSlug}
            const parts = path.split('/').filter(Boolean); // ['learning', courseId, lessonSlug]
            const isCourseLesson = parts.length >= 3 && parts[0] === 'learning' && (!courseId || parts[1] === courseId);
            const isGlobal = path === '/learning' || path === '/learning/' || 
                             path.includes('/me') || path.includes('/topics') || path.includes('/browse');
            return isCourseLesson && !isGlobal;
          }
        });

        if (lessonAnchors.length === 0) {
          return { found: false, isCourseComplete: false, nextHref: null, nextTitle: null };
        }

        const currentPath = window.location.pathname.replace(/\/$/, '');
        
        let currentIdx = lessonAnchors.findIndex(a => {
          try {
            const aPath = (a.href.startsWith('http') ? new URL(a.href).pathname : a.href).replace(/\/$/, '');
            return aPath === currentPath;
          } catch {
            return false;
          }
        });

        if (currentIdx === -1) {
          currentIdx = lessonAnchors.findIndex(a => {
            const activeParent = a.closest('.classroom-toc-item--active, .classroom-sidebar__item--active, [data-test-toc-item-active], .rc-LessonItems a.active, a[aria-current="page"]');
            return activeParent !== null || a.classList.contains('active') || a.getAttribute('aria-current') === 'page' || a.getAttribute('aria-current') === 'true';
          });
        }

        // If currently on the final lesson of the course
        if (currentIdx >= 0 && currentIdx === lessonAnchors.length - 1) {
          return { found: true, isCourseComplete: true, nextHref: null, nextTitle: null };
        }

        const nextIdx = currentIdx >= 0 ? currentIdx + 1 : 1;
        if (nextIdx < lessonAnchors.length) {
          const target = lessonAnchors[nextIdx];
          const nextHref = target.href;
          const nextTitle = (target.innerText || '').trim().split('\n')[0];

          target.scrollIntoView?.({ block: 'nearest' });
          target.click();

          return {
            found: true,
            isCourseComplete: false,
            nextHref,
            nextTitle
          };
        }

        return { found: false, isCourseComplete: false, nextHref: null, nextTitle: null };
      }, { courseId: currentCourseId, sel: selectors, currentPlatform: platform });

      if (syllabusInfo.isCourseComplete) {
        return {
          success: true,
          actionTaken: 'Course completed! Reached the final lesson.',
          previousUrl: initialUrl,
          newUrl: page.url(),
          isCourseComplete: true
        };
      }

      if (syllabusInfo.found && syllabusInfo.nextHref) {
        const verification = await this.verifyLessonChanged(page, normalizedInitialUrl, initialTitle, currentCourseId, 2500);
        if (verification.changed && verification.isCoursePage) {
          return {
            success: true,
            actionTaken: `Clicked next syllabus item: "${syllabusInfo.nextTitle || 'Lesson'}"`,
            previousUrl: initialUrl,
            newUrl: page.url(),
            previousTitle: initialTitle,
            newTitle: verification.currentTitle
          };
        }

        // Direct navigation fallback if click was ignored
        await page.goto(syllabusInfo.nextHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const directVerification = await this.verifyLessonChanged(page, normalizedInitialUrl, initialTitle, currentCourseId, 3500);
        if (directVerification.changed && directVerification.isCoursePage) {
          return {
            success: true,
            actionTaken: `Navigated to next topic URL (${syllabusInfo.nextHref})`,
            previousUrl: initialUrl,
            newUrl: page.url(),
            previousTitle: initialTitle,
            newTitle: directVerification.currentTitle
          };
        }
      }
    } catch {
      // TOC failed
    }

    // --- STRATEGY 3: Autoplay Next Banner / Toast ---
    for (const selector of selectors.nextUpBanner) {
      try {
        const bannerBtn = await page.$(selector);
        if (bannerBtn && await bannerBtn.isVisible()) {
          await bannerBtn.click({ force: true });
          const verification = await this.verifyLessonChanged(page, normalizedInitialUrl, initialTitle, currentCourseId, 3000);
          if (verification.changed && verification.isCoursePage) {
            return {
              success: true,
              actionTaken: `Clicked autoplay banner (${selector})`,
              previousUrl: initialUrl,
              newUrl: page.url(),
              previousTitle: initialTitle,
              newTitle: verification.currentTitle
            };
          }
        }
      } catch {
        // Continue
      }
    }

    // --- STRATEGY 4: Hotkey Shift + N ---
    try {
      await page.keyboard.press('Shift+N');
      const verification = await this.verifyLessonChanged(page, normalizedInitialUrl, initialTitle, currentCourseId, 2500);
      if (verification.changed && verification.isCoursePage) {
        return {
          success: true,
          actionTaken: 'Triggered Next Video shortcut (Shift+N)',
          previousUrl: initialUrl,
          newUrl: page.url(),
          previousTitle: initialTitle,
          newTitle: verification.currentTitle
        };
      }
    } catch {
      // Shortcut failed
    }

    return {
      success: false,
      actionTaken: 'None',
      previousUrl: initialUrl,
      newUrl: page.url(),
      error: 'Could not advance to next lesson in this course'
    };
  }

  public static async verifyLessonChanged(
    page: Page, 
    initialNormalizedUrl: string, 
    initialTitle: string = '', 
    courseId: string = '',
    timeoutMs: number = 6000
  ): Promise<{ changed: boolean; isCoursePage: boolean; currentTitle: string }> {
    const startTime = Date.now();
    const { selectors } = getPlatformSelectors(page.url());

    while (Date.now() - startTime < timeoutMs) {
      const currentUrl = page.url();
      const currentNormalized = this.normalizeUrl(currentUrl);

      const isLinkedInHome = currentNormalized.endsWith('/learning') || currentNormalized.endsWith('/learning/home');
      const isCourseraHome = currentNormalized.endsWith('/learn') || currentNormalized.endsWith('/home') || currentNormalized.endsWith('/my-learning');
      const isHome = isLinkedInHome || isCourseraHome;

      const isCoursePage = !isHome && (
        (courseId && (currentUrl.includes(`/learning/${courseId}`) || currentUrl.includes(`/learn/${courseId}`))) ||
        currentUrl.includes('/learning/') ||
        currentUrl.includes('/learn/') ||
        currentUrl.startsWith('http://localhost') ||
        currentUrl.startsWith('about:')
      );

      let currentTitle = '';
      for (const sel of selectors.lessonTitle) {
        try {
          const el = await page.$(sel);
          if (el) {
            currentTitle = (await el.innerText()).trim();
            if (currentTitle) break;
          }
        } catch {}
      }

      const urlChanged = currentNormalized !== initialNormalizedUrl;
      const titleChanged = Boolean(initialTitle && currentTitle && currentTitle.toLowerCase() !== initialTitle.toLowerCase());

      if ((urlChanged || titleChanged) && isCoursePage) {
        await page.waitForTimeout(600);
        return { changed: true, isCoursePage: true, currentTitle };
      }

      await page.waitForTimeout(250);
    }

    const finalUrl = page.url();
    const finalNormalized = this.normalizeUrl(finalUrl);
    const isHome = finalNormalized.endsWith('/learning') || finalNormalized.endsWith('/learn') || finalNormalized.endsWith('/home');
    const isCoursePage = !isHome && (
      courseId ? (finalUrl.includes(`/learning/${courseId}`) || finalUrl.includes(`/learn/${courseId}`)) : 
      (finalUrl.includes('/learning/') || finalUrl.includes('/learn/'))
    );

    return { 
      changed: finalNormalized !== initialNormalizedUrl && isCoursePage, 
      isCoursePage,
      currentTitle: '' 
    };
  }
}

