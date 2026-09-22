import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { MOCK_PAGES } from '../mocks/mockPages.js';
import { CourseDetector } from '../../src/linkedin/courseDetector.js';
import { LessonDetector } from '../../src/linkedin/lessonDetector.js';
import { AssessmentDetector } from '../../src/linkedin/assessmentDetector.js';
import { PlayerController } from '../../src/linkedin/playerController.js';
import { CompletionDetector } from '../../src/linkedin/completionDetector.js';
import { NextLessonController } from '../../src/linkedin/nextLessonController.js';

describe('LinkedIn Automation Detectors & Controllers', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('should detect video lesson page and course details', async () => {
    await page.setContent(MOCK_PAGES.videoLesson1, { waitUntil: 'domcontentloaded' });

    const course = await CourseDetector.detect(page);
    expect(course).toBeDefined();
    expect(course?.title).toBe('Python Essential Training');
    expect(course?.lessons.length).toBeGreaterThanOrEqual(1);

    const lesson = await LessonDetector.detectCurrentLesson(page, course || undefined);
    expect(lesson).toBeDefined();
    expect(lesson?.title).toBe('Variables and Data Types');
    expect(lesson?.isAssessment).toBe(false);
  });

  it('should detect player status and perform seek', async () => {
    await page.setContent(MOCK_PAGES.videoLesson1, { waitUntil: 'domcontentloaded' });

    // Mock video element behavior in DOM
    await page.evaluate(() => {
      const v = document.querySelector('video') as any;
      if (v) {
        let _currTime = 10;
        Object.defineProperty(v, 'duration', { get: () => 120 });
        Object.defineProperty(v, 'readyState', { get: () => 4 });
        Object.defineProperty(v, 'paused', { get: () => false });
        Object.defineProperty(v, 'currentTime', {
          get: () => _currTime,
          set: (val) => { _currTime = val; }
        });
      }
    });

    const playerStatus = await PlayerController.getPlayerStatus(page);
    expect(playerStatus.hasPlayer).toBe(true);
    expect(playerStatus.isReady).toBe(true);
    expect(playerStatus.duration).toBe(120);

    const seekResult = await PlayerController.seekNearEnd(page, 2.0);
    expect(seekResult.success).toBe(true);
    expect(seekResult.targetTime).toBeGreaterThanOrEqual(118);
  });

  it('should evaluate completion signals with high confidence on completed lesson', async () => {
    await page.setContent(MOCK_PAGES.videoLessonCompleted, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const v = document.querySelector('video') as any;
      if (v) {
        Object.defineProperty(v, 'duration', { get: () => 120 });
        Object.defineProperty(v, 'ended', { get: () => true });
        Object.defineProperty(v, 'currentTime', { get: () => 120 });
      }
    });

    const signals = await CompletionDetector.evaluateSignals(page);
    expect(signals.videoEnded).toBe(true);
    expect(signals.markedCompleteInToc).toBe(true);
    expect(signals.confidenceScore).toBeGreaterThanOrEqual(70);
  });

  it('should detect quizzes and interactive assessments strictly', async () => {
    await page.setContent(MOCK_PAGES.quizLesson, { waitUntil: 'domcontentloaded' });

    const assessment = await AssessmentDetector.inspect(page);
    expect(assessment.isAssessment).toBe(true);
    expect(assessment.type).toBe('quiz');
  });

  it('should advance to next lesson when LinkedIn next button clicked', async () => {
    await page.setContent(MOCK_PAGES.videoLesson1, { waitUntil: 'domcontentloaded' });

    const advanceResult = await NextLessonController.advanceToNextLesson(page, 'http://localhost/old-url');
    expect(advanceResult.actionTaken).toContain('next button');
  });

  it('should detect Coursera video lesson page and course details', async () => {

    await page.setContent(MOCK_PAGES.courseraVideoLesson, { waitUntil: 'domcontentloaded' });

    const course = await CourseDetector.detect(page);
    expect(course).toBeDefined();
    expect(course?.title).toBe('Machine Learning');

    const lesson = await LessonDetector.detectCurrentLesson(page, course || undefined);
    expect(lesson).toBeDefined();
    expect(lesson?.title).toBe('Supervised Learning Overview');
    expect(lesson?.isAssessment).toBe(false);
  });

  it('should detect Coursera quizzes and interactive assessments strictly', async () => {
    await page.setContent(MOCK_PAGES.courseraQuizLesson, { waitUntil: 'domcontentloaded' });

    const assessment = await AssessmentDetector.inspect(page);
    expect(assessment.isAssessment).toBe(true);
    expect(assessment.type).toBe('quiz');
  });

  it('should advance to next lesson when Coursera next button clicked', async () => {
    await page.setContent(MOCK_PAGES.courseraVideoLesson, { waitUntil: 'domcontentloaded' });

    const advanceResult = await NextLessonController.advanceToNextLesson(page, 'https://www.coursera.org/learn/machine-learning/lecture/1/supervised');
    expect(advanceResult.actionTaken).toContain('next button');
  });
});

