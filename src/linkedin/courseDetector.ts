import { Page } from 'playwright';
import { PageDetector } from './pageDetector.js';
import { CourseInfo, LessonInfo } from '../automation/automationState.js';

export class CourseDetector {
  public static extractCourseId(url: string): string {
    try {
      const parsed = new URL(url);
      // LinkedIn Learning format: /learning/{courseSlug}/...
      const linkedinMatch = parsed.pathname.match(/\/learning\/([^/?#]+)/);
      if (linkedinMatch && linkedinMatch[1]) {
        return linkedinMatch[1];
      }
      // Coursera format: /learn/{courseSlug}/...
      const courseraMatch = parsed.pathname.match(/\/learn\/([^/?#]+)/);
      if (courseraMatch && courseraMatch[1]) {
        return courseraMatch[1];
      }
      return parsed.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'unknown-course';
    } catch {
      return 'unknown-course';
    }
  }

  public static async detect(page: Page): Promise<CourseInfo | null> {
    const currentUrl = page.url();
    const courseId = this.extractCourseId(currentUrl);
    const { selectors, platform } = await PageDetector.detectPlatformFromPage(page);

    let courseTitle = '';
    for (const selector of selectors.courseTitle) {
      try {
        const el = await page.$(selector);
        if (el) {
          const text = (await el.innerText()).trim();
          if (text) {
            courseTitle = text;
            break;
          }
        }
      } catch {}
    }


    if (!courseTitle) {
      try {
        const title = await page.title();
        courseTitle = title.split('|')[0].split('-')[0].trim() || `${platform === 'coursera' ? 'Coursera' : 'LinkedIn Learning'} Course`;
      } catch {
        courseTitle = `${platform === 'coursera' ? 'Coursera' : 'LinkedIn Learning'} Course`;
      }
    }

    // Inspect Table of Contents items if rendered
    const lessons: LessonInfo[] = [];
    let completedCount = 0;
    let activeIndex = 1;

    try {
      for (const tocSelector of selectors.tocItems) {
        const items = await page.$$(tocSelector);
        if (items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const text = (await item.innerText()).trim().split('\n')[0] || `Lesson ${i + 1}`;
            
            const isActive = await item.evaluate((el: HTMLElement) => {
              return el.classList.contains('active') || 
                     el.getAttribute('aria-current') === 'page' ||
                     el.getAttribute('aria-current') === 'true' ||
                     el.getAttribute('data-test-toc-item-active') !== null ||
                     el.className.includes('--active');
            });

            const isCompleted = await item.evaluate((el: HTMLElement) => {
              return el.classList.contains('completed') ||
                     el.getAttribute('data-test-toc-item-completed') !== null ||
                     el.className.includes('--completed') ||
                     Boolean(el.querySelector('[data-test-icon="check-small"], .completed-icon, [data-test-toc-item-completed], svg[data-e2e*="complete"]'));
            });

            if (isCompleted) completedCount++;
            if (isActive) activeIndex = i + 1;

            const isAssessment = /chapter quiz|knowledge check|practice exam|graded assignment|quiz|peer review/i.test(text);

            lessons.push({
              id: `${courseId}-lesson-${i + 1}`,
              title: text,
              index: i + 1,
              totalLessons: items.length,
              url: currentUrl,
              isAssessment,
              assessmentType: isAssessment ? 'quiz' : undefined,
              status: isCompleted ? 'COMPLETED' : (isActive ? 'PROCESSING' : 'NOT_STARTED')
            });
          }
          break;
        }
      }
    } catch (err) {
      console.warn('Could not fully parse TOC items:', err);
    }

    const totalLessons = lessons.length > 0 ? lessons.length : 1;

    return {
      id: courseId,
      title: courseTitle,
      url: currentUrl,
      totalLessons,
      completedLessons: completedCount,
      currentLessonIndex: activeIndex,
      lessons
    };
  }
}
