import { Page } from 'playwright';
import { PageDetector } from '../linkedin/pageDetector.js';

export interface SessionStatus {
  isValid: boolean;
  isSupportedPlatform: boolean;
  platform: string;
  message: string;
}

export class SessionManager {
  public static async checkSession(page: Page): Promise<SessionStatus> {
    const inspection = await PageDetector.inspect(page);

    if (!inspection.isSupportedPlatform) {
      return {
        isValid: false,
        isSupportedPlatform: false,
        platform: 'unknown',
        message: 'Browser is not currently on a LinkedIn Learning or Coursera course page.'
      };
    }

    const platformName = inspection.platform === 'coursera' ? 'Coursera' : 'LinkedIn Learning';

    if (!inspection.isAuthenticated) {
      return {
        isValid: false,
        isSupportedPlatform: true,
        platform: inspection.platform,
        message: `Your ${platformName} session may have expired or you are signed out. Please sign in manually in the browser.`
      };
    }

    return {
      isValid: true,
      isSupportedPlatform: true,
      platform: inspection.platform,
      message: `Active ${platformName} session verified.`
    };
  }
}
