/**
 * Multi-tiered selector dictionary for LinkedIn Learning and Coursera.
 */

export const LINKEDIN_SELECTORS = {
  videoPlayer: [
    'video.vjs-tech',
    'video[src]',
    'video',
    '.video-js video',
    'div[data-playback-type="video"] video',
    'iframe[src*="video"]'
  ],

  playButton: [
    'button[aria-label="Play" i]',
    'button[aria-label*="Play video" i]',
    '.vjs-play-control',
    'button.play-button',
    'button[title="Play" i]'
  ],

  courseTitle: [
    'h1[data-test-classroom-header-title]',
    'h1.classroom-nav__course-title',
    'h1.classroom-header__title',
    'h1.course-title',
    'h1[class*="course-title" i]',
    '.classroom-nav h1',
    'header h1'
  ],

  lessonTitle: [
    'h2.classroom-nav__item-title--current',
    'h2[data-test-item-title]',
    'h1.classroom-nav__item-title',
    '.classroom-sidebar__item--active .classroom-sidebar__item-title',
    '[data-test-toc-item-active] .toc-item__title',
    '.classroom-toc-item--active [data-test-item-title]',
    '.classroom-toc-item--active .toc-item__title',
    'h2[class*="item-title" i]',
    'h1[class*="lesson-title" i]'
  ],

  tocContainer: [
    '.classroom-sidebar',
    '.classroom-toc',
    'aside.classroom-sidebar',
    '[data-test-classroom-sidebar]',
    '[data-test-toc]',
    'nav.classroom-nav'
  ],

  tocSections: [
    '.classroom-toc-section',
    'section.classroom-toc-section',
    '[data-test-toc-section]',
    'div[class*="toc-section" i]',
    '.classroom-sidebar__section'
  ],

  tocSectionToggle: [
    'button[aria-expanded="false"]',
    '.classroom-toc-section__toggle[aria-expanded="false"]',
    '.classroom-toc-section__header button',
    '[data-test-toc-section-header]'
  ],

  tocItems: [
    '[data-test-toc-item]',
    '.classroom-toc-item',
    '.classroom-sidebar__item',
    'li.classroom-nav__item',
    'li[class*="toc-item" i]',
    'ul.classroom-toc-section__items > li',
    'li.classroom-sidebar__item'
  ],

  activeTocItem: [
    '[data-test-toc-item-active]',
    '.classroom-toc-item--active',
    '.classroom-sidebar__item--active',
    'li.classroom-nav__item--active',
    'li[aria-current="true"]',
    'li[class*="active" i][class*="item" i]'
  ],

  completionIndicators: [
    '[data-test-toc-item-completed]',
    '.classroom-toc-item--completed',
    '.classroom-toc-item__badge--completed',
    'li.classroom-nav__item--completed',
    '[aria-label*="Completed" i]',
    '[aria-label*="Complete" i]',
    'svg[data-test-icon="check-small"]',
    'svg[data-test-icon="check-medium"]',
    '.classroom-sidebar__item--completed',
    '.completed-icon'
  ],

  nextButton: [
    'button[data-test-classroom-nav-next-button]',
    '.classroom-nav button[aria-label="Next item" i]',
    '.classroom-nav button[aria-label="Next lesson" i]',
    '.classroom-nav button[aria-label="Next video" i]',
    '.classroom-nav button[aria-label="Next section" i]',
    '.classroom-nav button[aria-label="Next chapter" i]',
    '.classroom-nav button[aria-label*="Next" i]',
    '.classroom-player-controls button[aria-label*="Next" i]',
    'button.classroom-nav__next-button',
    'button.classroom-nav__button--next',
    'button[data-control-name="next_item"]',
    'button[data-control-name="next_chapter"]',
    'button[data-control-name="next_section"]',
    '.vjs-next-button'
  ],

  nextUpBanner: [
    'button[data-test-autoplay-next-button]',
    '.next-item-banner button',
    '.classroom-player-toast button',
    '[data-test-autoplay-container] button'
  ],

  assessmentIndicators: [
    '[data-test-quiz-container]',
    '.classroom-quiz:not(.hidden)',
    '.quiz-container:not(.hidden)',
    'form[data-test-quiz-form]',
    'div[data-test-assessment-view]',
    'div[data-test-practice-challenge] form',
    'fieldset.quiz-question',
    'div[role="radiogroup"][data-test-quiz-answers]'
  ],

  authPrompts: [
    'a[href*="/login"]',
    'a[data-tracking-control-name="auth_wall_desktop_signin"]',
    '.authwall-join-form',
    'button[data-tracking-control-name="learning_login"]',
    'a[data-test-sign-in-btn]'
  ]
};

export const COURSERA_SELECTORS = {
  videoPlayer: [
    'video.c-video',
    'video.vjs-tech',
    'video[src]',
    'video',
    '.video-js video',
    'div[data-e2e="video-player"] video'
  ],

  playButton: [
    'button[aria-label="Play" i]',
    'button[aria-label*="Play video" i]',
    '.vjs-play-control',
    'button.c-video-play-button',
    'button[title="Play" i]'
  ],

  courseTitle: [
    'a[data-e2e="course-link"]',
    'div.course-name',
    'h1[data-e2e="course-title"]',
    'nav[aria-label*="Course" i] a',
    '.rc-CourseNav a[href*="/learn/"]',
    'header h1'
  ],

  lessonTitle: [
    'h1.title',
    'h1.item-title',
    'h1[data-e2e="item-name"]',
    'h2.item-title',
    'h1[class*="item-title" i]',
    'h2[class*="item-title" i]',
    '.rc-ItemNav h1'
  ],

  tocContainer: [
    '.rc-CourseNav',
    '.rc-NavigationDrawer',
    'nav.rc-CourseNav',
    'nav[aria-label*="Course outline" i]',
    'nav[aria-label*="Course navigation" i]',
    '.rc-ModuleLessonList'
  ],

  tocSections: [
    '.rc-ModuleLessonList',
    '.rc-WeekNav',
    '.rc-LessonsList',
    'div[data-e2e*="module"]'
  ],

  tocSectionToggle: [
    'button[aria-expanded="false"]',
    '.rc-ModuleLessonList button[aria-expanded="false"]'
  ],

  tocItems: [
    'a[data-e2e*="item"]',
    'a[href*="/learn/"][class*="item" i]',
    '.rc-LessonItems a',
    'li a[href*="/learn/"]'
  ],

  activeTocItem: [
    'a[aria-current="page"]',
    'a[aria-current="true"]',
    '.rc-LessonItems a[class*="active" i]',
    'a[data-e2e*="active-item"]',
    'li[class*="active" i] a'
  ],

  completionIndicators: [
    'svg[data-e2e*="complete"]',
    'svg[data-e2e="check-circle"]',
    '.rc-CompletedIcon',
    '[aria-label*="Completed" i]',
    '[aria-label*="Completed item" i]'
  ],

  nextButton: [
    'button[data-e2e="next-item"]',
    'button[data-e2e="next-button"]',
    'a[data-e2e="next-item"]',
    'a[data-e2e="next-button"]',
    'a[aria-label="Next Item" i]',
    'button[aria-label="Next Item" i]',
    'a[aria-label="Next lesson" i]',
    'button[aria-label="Next lesson" i]',
    'button:has-text("Next >")',
    'button:has-text("Next item")',
    'a:has-text("Next >")',
    'a:has-text("Next item")',
    '.rc-NextItemButton button',
    '.rc-NextItemButton a'
  ],

  nextUpBanner: [
    'button[data-e2e="next-item-banner-button"]',
    '.rc-NextItemToast button',
    '.rc-AutoplayToast button'
  ],

  assessmentIndicators: [
    // URL or container markers
    'div[data-e2e="assessment-view"]',
    '.rc-Quiz',
    '.rc-Assignment',
    '.rc-Exam',
    '.rc-PeerReview',
    'form[data-e2e*="quiz"]',
    'form.rc-QuizForm',
    'div[data-e2e="ungraded-widget"]',
    'div[data-e2e="quiz-prompt"]',
    'button:has-text("Start Assignment")',
    'button:has-text("Resume Quiz")',
    'button:has-text("Start Quiz")',
    'button:has-text("Submit Quiz")',
    'button:has-text("Submit Assignment")'
  ],

  authPrompts: [
    'a[href*="/login"]',
    'button[data-e2e="header-login-button"]',
    'a[data-e2e="login-btn"]'
  ]
};

export type PlatformType = 'linkedin' | 'coursera' | 'unknown';

export function getPlatformSelectors(url: string) {
  if (url && (
    url.includes('coursera.org') || 
    url.includes('/learn/') || 
    url.includes('/lecture/') || 
    url.includes('/exam/')
  )) {
    return { platform: 'coursera' as PlatformType, selectors: COURSERA_SELECTORS };
  }
  return { platform: 'linkedin' as PlatformType, selectors: LINKEDIN_SELECTORS };
}

