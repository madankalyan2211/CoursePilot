import { Page } from 'playwright';
import { getPlatformSelectors, COURSERA_SELECTORS, LINKEDIN_SELECTORS, PlatformType } from './selectors.js';

export interface PageDetectionResult {
  isSupportedPlatform: boolean;
  platform: PlatformType;
  isCoursePage: boolean;
  isAuthenticated: boolean;
  currentUrl: string;
}

export class PageDetector {
  public static detectPlatform(url: string): PlatformType {
    if (!url) return 'unknown';
    try {
      if (url.includes('coursera.org') || url.includes('/learn/') || url.includes('/lecture/') || url.includes('/exam/')) {
        return 'coursera';
      }
      if (url.includes('linkedin.com') || url.includes('/learning/') || url.includes('localhost') || url.includes('127.0.0.1')) {
        return 'linkedin';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  public static async detectPlatformFromPage(page: Page): Promise<{ platform: PlatformType; selectors: typeof LINKEDIN_SELECTORS | typeof COURSERA_SELECTORS }> {
    const url = page.url();
    const directPlatform = this.detectPlatform(url);

    if (directPlatform === 'coursera') {
      return { platform: 'coursera', selectors: COURSERA_SELECTORS };
    }
    if (directPlatform === 'linkedin' && url.includes('linkedin.com/learning')) {
      return { platform: 'linkedin', selectors: LINKEDIN_SELECTORS };
    }

    // Inspect DOM if URL is generic/about:blank/localhost
    try {
      const isCoursera = await page.evaluate(() => {
        return Boolean(document.querySelector('.rc-CourseNav, [data-e2e="course-link"], [data-e2e="item-name"], .rc-ItemPage, video.c-video, .rc-Quiz, .rc-LessonsList'));
      });
      if (isCoursera) {
        return { platform: 'coursera', selectors: COURSERA_SELECTORS };
      }
    } catch {}

    return { platform: 'linkedin', selectors: LINKEDIN_SELECTORS };
  }

  public static isSupportedUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const isLinkedIn = (parsed.hostname.includes('linkedin.com') || parsed.hostname.includes('localhost') || parsed.hostname.includes('127.0.0.1')) &&
                         (parsed.pathname.includes('/learning/') || parsed.pathname.includes('learning') || parsed.pathname.includes('mock-course'));
      
      const isCoursera = parsed.hostname.includes('coursera.org') &&
                         (parsed.pathname.includes('/learn/') || parsed.pathname.includes('/lecture/'));

      return isLinkedIn || isCoursera;
    } catch {
      return false;
    }
  }

  public static async inspect(page: Page): Promise<PageDetectionResult> {
    const currentUrl = page.url();
    const { platform, selectors } = await this.detectPlatformFromPage(page);
    const isSupported = this.isSupportedUrl(currentUrl) || platform !== 'unknown';

    if (!isSupported) {
      return {
        isSupportedPlatform: false,
        platform: 'unknown',
        isCoursePage: false,
        isAuthenticated: false,
        currentUrl
      };
    }

    // Check authentication / auth wall presence
    let hasAuthWall = false;
    for (const selector of selectors.authPrompts) {
      try {
        const el = await page.$(selector);
        if (el && await el.isVisible()) {
          hasAuthWall = true;
          break;
        }
      } catch {}
    }

    // Check if course content / video / toc exists
    let isCoursePage = false;
    const courseSelectors = [
      ...selectors.courseTitle,
      ...selectors.videoPlayer,
      ...selectors.tocItems
    ];

    for (const selector of courseSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          isCoursePage = true;
          break;
        }
      } catch {}
    }

    return {
      isSupportedPlatform: true,
      platform,
      isCoursePage,
      isAuthenticated: !hasAuthWall,
      currentUrl
    };
  }
}

