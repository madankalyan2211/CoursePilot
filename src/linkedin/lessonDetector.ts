import { Page } from 'playwright';
import { PageDetector } from './pageDetector.js';
import { LessonInfo } from '../automation/automationState.js';
import { CourseDetector } from './courseDetector.js';

export class LessonDetector {
  public static async detectCurrentLesson(page: Page, courseInfo?: { totalLessons: number }): Promise<LessonInfo | null> {
    const currentUrl = page.url();
    const courseId = CourseDetector.extractCourseId(currentUrl);
    const { selectors } = await PageDetector.detectPlatformFromPage(page);

    let lessonTitle = '';
    for (const selector of selectors.lessonTitle) {
      try {
        const el = await page.$(selector);
        if (el) {
          const text = (await el.innerText()).trim();
          if (text) {
            lessonTitle = text;
            break;
          }
        }
      } catch {}
    }


    if (!lessonTitle) {
      try {
        const fullTitle = await page.title();
        const parts = fullTitle.split('|');
        if (parts.length > 1) {
          lessonTitle = parts[0].trim();
        } else {
          lessonTitle = fullTitle;
        }
      } catch {
        lessonTitle = 'Current Lesson';
      }
    }

    let lessonIndex = 1;
    let totalLessons = courseInfo?.totalLessons || 1;

    try {
      for (const sel of selectors.activeTocItem) {
        const activeToc = await page.$(sel);
        if (activeToc) {
          const parentList = await activeToc.evaluate((el: HTMLElement) => {
            const parent = el.parentElement;
            if (!parent) return { index: 1, total: 1 };
            const children = Array.from(parent.children);
            const idx = children.indexOf(el);
            return { index: idx >= 0 ? idx + 1 : 1, total: children.length };
          });
          lessonIndex = parentList.index;
          if (parentList.total > 1) {
            totalLessons = parentList.total;
          }
          break;
        }
      }
    } catch {}

    const isAssessment = currentUrl.includes('/quiz/') || 
                         currentUrl.includes('/assessment/') ||
                         currentUrl.includes('/exam/') ||
                         currentUrl.includes('/assignment-submission/') ||
                         /chapter quiz|knowledge check|practice exam|graded assignment|peer review/i.test(lessonTitle);

    const sanitizedTitle = lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const lessonId = `${courseId}-${lessonIndex}-${sanitizedTitle || 'lesson'}`;

    return {
      id: lessonId,
      title: lessonTitle,
      index: lessonIndex,
      totalLessons: totalLessons,
      url: currentUrl,
      isAssessment,
      assessmentType: isAssessment ? 'quiz' : undefined,
      status: 'PROCESSING'
    };
  }
}
