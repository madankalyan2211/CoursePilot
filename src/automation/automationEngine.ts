import { Page } from 'playwright';
import { 
  AutomationState, 
  CourseInfo, 
  LessonInfo, 
  CompletionSignals, 
  ActivityLogEntry, 
  EngineSnapshot, 
  AutomationSettings 
} from './automationState.js';
import { StateMachine } from './stateMachine.js';
import { RetryManager } from './retryManager.js';
import { BrowserManager } from '../browser/browserManager.js';
import { SessionManager } from '../browser/sessionManager.js';
import { PageDetector } from '../linkedin/pageDetector.js';
import { CourseDetector } from '../linkedin/courseDetector.js';
import { LessonDetector } from '../linkedin/lessonDetector.js';
import { AssessmentDetector } from '../linkedin/assessmentDetector.js';
import { PlayerController } from '../linkedin/playerController.js';
import { CompletionDetector } from '../linkedin/completionDetector.js';
import { NextLessonController } from '../linkedin/nextLessonController.js';
import { FloatingOverlay } from '../linkedin/floatingOverlay.js';
import { ProgressStore } from '../storage/progressStore.js';

export type EngineEventCallback = (snapshot: EngineSnapshot) => void;

export class AutomationEngine {
  private stateMachine: StateMachine;
  private browserManager: BrowserManager;
  private progressStore: ProgressStore;
  private retryManager: RetryManager;

  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private isPausedForUser: boolean = false;

  private currentCourse: CourseInfo | null = null;
  private currentLesson: LessonInfo | null = null;
  private completionSignals: CompletionSignals | null = null;
  private activityLogs: ActivityLogEntry[] = [];
  private errorMessage: string | null = null;
  private activeBrowserUrl: string | null = null;

  private eventListeners: EngineEventCallback[] = [];

  private lastCompletedLessonId: string | null = null;
  private lastCompletedUrl: string | null = null;

  constructor(browserManager?: BrowserManager, progressStore?: ProgressStore) {
    this.browserManager = browserManager || new BrowserManager();
    this.progressStore = progressStore || new ProgressStore();
    this.retryManager = new RetryManager();
    this.stateMachine = new StateMachine();

    this.stateMachine.onTransition((from, to) => {
      this.log('info', `State: ${from} → ${to}`);
      this.broadcast();
    });

    // Hydrate last known course from storage
    const lastCourse = this.progressStore.getLastActiveCourse();
    if (lastCourse) {
      this.currentCourse = {
        id: lastCourse.courseId,
        title: lastCourse.courseTitle,
        url: lastCourse.courseUrl,
        totalLessons: lastCourse.totalLessons,
        completedLessons: lastCourse.completedLessonsCount,
        currentLessonIndex: lastCourse.currentLessonIndex,
        lessons: Object.entries(lastCourse.lessons).map(([id, item]) => ({
          id,
          title: item.title,
          index: item.index,
          totalLessons: lastCourse.totalLessons,
          url: lastCourse.courseUrl,
          isAssessment: false,
          status: item.status as any
        }))
      };
    }
  }

  public subscribe(cb: EngineEventCallback): () => void {
    this.eventListeners.push(cb);
    cb(this.getSnapshot());
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== cb);
    };
  }

  private broadcast(): void {
    const snapshot = this.getSnapshot();
    this.eventListeners.forEach(cb => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('Error in snapshot broadcast listener:', err);
      }
    });
  }

  public getSnapshot(): EngineSnapshot {
    return {
      state: this.stateMachine.getState(),
      isRunning: this.isRunning,
      isPaused: this.isPausedForUser,
      requiresUserAction: this.stateMachine.getState() === AutomationState.REQUIRES_USER,
      currentCourse: this.currentCourse,
      currentLesson: this.currentLesson,
      completionSignals: this.completionSignals,
      activityLogs: this.activityLogs.slice(-100),
      settings: this.progressStore.getSettings(),
      activeBrowserUrl: this.activeBrowserUrl,
      errorMessage: this.errorMessage,
      retryCount: this.retryManager.getAttemptCount('engine-loop')
    };
  }

  public updateSettings(partial: Partial<AutomationSettings>): AutomationSettings {
    const updated = this.progressStore.updateSettings(partial);
    this.broadcast();
    return updated;
  }

  public log(level: 'info' | 'success' | 'warning' | 'error', action: string, details?: string): void {
    const entry: ActivityLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toTimeString().split(' ')[0],
      state: this.stateMachine.getState(),
      action,
      details,
      lessonTitle: this.currentLesson?.title,
      level
    };
    this.activityLogs.push(entry);
    console.log(`[CoursePilot ${entry.timestamp}] [${level.toUpperCase()}] ${action} ${details ? `(${details})` : ''}`);
    this.broadcast();
  }

  public async openLinkedInBrowser(): Promise<void> {
    this.log('info', 'Opening LinkedIn Learning in browser...');
    try {
      const page = await this.browserManager.getActivePage();
      if (!page.url().includes('linkedin.com/learning')) {
        await page.goto('https://www.linkedin.com/learning', { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      this.activeBrowserUrl = page.url();
      this.log('success', 'Browser ready for LinkedIn Learning');
      this.broadcast();
    } catch (err: any) {
      this.log('error', 'Failed to open browser', err?.message);
    }
  }

  public async openCourseraBrowser(): Promise<void> {
    this.log('info', 'Opening Coursera in browser...');
    try {
      const page = await this.browserManager.getActivePage();
      if (!page.url().includes('coursera.org')) {
        await page.goto('https://www.coursera.org/learn', { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      this.activeBrowserUrl = page.url();
      this.log('success', 'Browser ready for Coursera');
      this.broadcast();
    } catch (err: any) {
      this.log('error', 'Failed to open browser', err?.message);
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.shouldStop = false;
    this.isPausedForUser = false;
    this.errorMessage = null;
    this.retryManager.reset();

    this.log('info', 'Starting CoursePilot automation...');
    this.stateMachine.transitionTo(AutomationState.CONNECTING);

    this.runLoop().catch(err => {
      this.log('error', 'Automation engine halted unexpectedly', err?.message);
      this.stateMachine.transitionTo(AutomationState.ERROR);
      this.isRunning = false;
      this.broadcast();
    });
  }

  public async stop(): Promise<void> {
    this.shouldStop = true;
    this.isRunning = false;
    this.isPausedForUser = false;
    this.stateMachine.transitionTo(AutomationState.STOPPED);
    this.log('warning', 'Automation stopped by user');
    this.broadcast();
  }

  public async resume(): Promise<void> {
    if (!this.isRunning) {
      this.start();
      return;
    }

    if (this.isPausedForUser || this.stateMachine.getState() === AutomationState.REQUIRES_USER) {
      this.isPausedForUser = false;
      this.log('info', 'Resuming automation after manual assessment action...');
      this.stateMachine.transitionTo(AutomationState.DETECTING_LESSON);
      this.broadcast();
    }
  }

  private async runLoop(): Promise<void> {
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    while (this.isRunning && !this.shouldStop) {
      try {
        const page = await this.browserManager.getActivePage();
        this.activeBrowserUrl = page.url();

        // 1. Session & Page Verification
        const session = await SessionManager.checkSession(page);
        if (!session.isValid) {
          if (!session.isSupportedPlatform) {
            this.errorMessage = 'Please navigate to a LinkedIn Learning or Coursera course page.';
            this.log('warning', 'Awaiting course page', 'Navigate to a LinkedIn Learning or Coursera tab');
            await page.waitForTimeout(2000);
            continue;
          } else {
            this.errorMessage = session.message;
            this.log('error', 'Session Check Failed', session.message);
            this.stateMachine.transitionTo(AutomationState.REQUIRES_USER);
            this.isPausedForUser = true;
            this.broadcast();
            break;
          }
        }


        // 2. Course Detection
        this.stateMachine.transitionTo(AutomationState.DETECTING_COURSE);
        const course = await CourseDetector.detect(page);
        if (course) {
          this.currentCourse = course;
          this.progressStore.recordCourse(course);
          this.log('info', `Course: ${course.title}`);
        }

        // 3. Lesson Detection
        this.stateMachine.transitionTo(AutomationState.DETECTING_LESSON);
        const lesson = await LessonDetector.detectCurrentLesson(page, course || undefined);
        if (lesson) {
          this.currentLesson = lesson;
          this.log('info', `Lesson ${lesson.index}/${lesson.totalLessons}: ${lesson.title}`);
        }

        const normalizedCurrentUrl = NextLessonController.normalizeUrl(page.url());
        
        // Guard: If we are still on the lesson that was just completed, advance immediately without re-seeking
        if (
          (this.lastCompletedLessonId && lesson && lesson.id === this.lastCompletedLessonId) ||
          (this.lastCompletedUrl && normalizedCurrentUrl === this.lastCompletedUrl)
        ) {
          this.log('info', 'Already completed this video. Advancing to next topic video...');
          this.stateMachine.transitionTo(AutomationState.ADVANCING);
          const advanceRes = await NextLessonController.advanceToNextLesson(
            page, 
            page.url(), 
            lesson?.title || ''
          );
          if (advanceRes.success) {
            this.log('success', `Moved to next topic: ${advanceRes.actionTaken}`);
            await page.waitForTimeout(1000);
            continue;
          } else {
            this.log('warning', 'Could not advance to next lesson automatically. Please click next lesson in browser.');
            this.stateMachine.transitionTo(AutomationState.REQUIRES_USER);
            this.isPausedForUser = true;
            this.broadcast();
            while (this.isPausedForUser && this.isRunning && !this.shouldStop) {
              await new Promise(r => setTimeout(r, 800));
            }
            if (this.shouldStop || !this.isRunning) break;
            continue;
          }
        }

        // 4. Assessment / Quiz Check — STRICT SAFETY GATE
        const assessment = await AssessmentDetector.inspect(page);
        if (assessment.isAssessment) {
          this.log('warning', 'Assessment Detected — Pausing Automation', assessment.reason);
          if (this.currentCourse && this.currentLesson) {
            this.progressStore.recordLessonStatus(this.currentCourse.id, this.currentLesson, 'REQUIRES_USER');
          }
          this.stateMachine.transitionTo(AutomationState.REQUIRES_USER);
          this.isPausedForUser = true;
          this.broadcast();

          // Inject sleek floating widget directly into the LinkedIn browser page
          await FloatingOverlay.inject(page, this.currentLesson?.title || 'Quiz / Knowledge Check');

          // Wait until user resumes or stops (either via floating HUD or dashboard)
          while (this.isPausedForUser && this.isRunning && !this.shouldStop) {
            const inPageAction = await FloatingOverlay.pollAction(page);
            if (inPageAction === 'RESUME') {
              this.log('info', 'Resume action clicked from floating browser overlay');
              this.isPausedForUser = false;
              break;
            } else if (inPageAction === 'STOP') {
              this.log('warning', 'Stop action clicked from floating browser overlay');
              await FloatingOverlay.remove(page);
              await this.stop();
              break;
            }
            await new Promise(r => setTimeout(r, 600));
          }

          await FloatingOverlay.remove(page);

          if (this.shouldStop || !this.isRunning) break;
          // After resume, continue loop to re-detect
          continue;
        }

        // 5. Video Player Detection & Seeking
        this.stateMachine.transitionTo(AutomationState.LOADING_PLAYER);
        const playerReady = await PlayerController.waitForPlayerReady(page, 10000);

        if (!playerReady) {
          this.log('warning', 'Video player not ready or page still loading, retrying...');
          const retryDelay = await this.retryManager.waitBackoff('player-load');
          if (!this.retryManager.canRetry('player-load')) {
            this.log('error', 'Timeout waiting for video player');
            this.stateMachine.transitionTo(AutomationState.ERROR);
            break;
          }
          continue;
        }

        this.retryManager.reset('player-load');

        // 6. Intelligent Seeking
        this.stateMachine.transitionTo(AutomationState.SEEKING);
        const settings = this.progressStore.getSettings();
        const seekResult = await PlayerController.seekNearEnd(page, settings.seekOffsetSeconds);

        if (!seekResult.success) {
          this.log('warning', 'Failed to seek video, waiting and retrying', seekResult.error);
          await page.waitForTimeout(1000);
          continue;
        }

        this.log('info', `Seeked toward video end (${seekResult.targetTime.toFixed(1)}s / ${seekResult.duration.toFixed(1)}s)`);

        // 7. Wait for Completion Confirmation
        this.stateMachine.transitionTo(AutomationState.WAITING_FOR_COMPLETION);
        this.log('info', 'Waiting for LinkedIn completion confirmation...');

        const completion = await CompletionDetector.waitForCompletion(
          page,
          settings.completionTimeoutMs,
          50,
          (signals) => {
            this.completionSignals = signals;
            this.broadcast();
          }
        );

        if (!completion.completed) {
          this.log('warning', 'Completion not registered yet, nudging playback...');
          await PlayerController.ensurePlaying(page);
          await page.waitForTimeout(1500);
        }

        // 8. Mark Completed
        this.stateMachine.transitionTo(AutomationState.COMPLETED);
        this.lastCompletedLessonId = this.currentLesson?.id || null;
        this.lastCompletedUrl = NextLessonController.normalizeUrl(page.url());
        this.log('success', `✓ Completed: ${this.currentLesson?.title || 'Lesson'}`);

        if (this.currentCourse && this.currentLesson) {
          this.progressStore.recordLessonStatus(this.currentCourse.id, this.currentLesson, 'COMPLETED');
          this.currentCourse.completedLessons = Math.min(
            this.currentCourse.totalLessons,
            this.currentCourse.completedLessons + 1
          );
        }

        // Gentle pause before advancing
        if (settings.nextLessonDelayMs > 0) {
          await page.waitForTimeout(settings.nextLessonDelayMs);
        }

        if (this.shouldStop || !this.isRunning) break;

        // 9. Advance to Next Topic Video
        this.stateMachine.transitionTo(AutomationState.ADVANCING);
        this.log('info', 'Advancing to next topic video...');

        const currentUrlBeforeAdvance = page.url();
        const currentTitleBeforeAdvance = this.currentLesson?.title || '';
        const advanceResult = await NextLessonController.advanceToNextLesson(
          page, 
          currentUrlBeforeAdvance, 
          currentTitleBeforeAdvance
        );

        if (advanceResult.isCourseComplete) {
          this.log('success', '🎉 Course complete! All lessons finished.');
          this.stateMachine.transitionTo(AutomationState.IDLE);
          this.isRunning = false;
          this.broadcast();
          break;
        }

        if (!advanceResult.success) {
          this.log('warning', 'Could not advance to next lesson automatically', advanceResult.error);
          this.stateMachine.transitionTo(AutomationState.REQUIRES_USER);
          this.isPausedForUser = true;
          this.broadcast();

          while (this.isPausedForUser && this.isRunning && !this.shouldStop) {
            await new Promise(r => setTimeout(r, 800));
          }
          if (this.shouldStop || !this.isRunning) break;
          continue;
        }

        // 10. Verify New Lesson
        this.stateMachine.transitionTo(AutomationState.VERIFYING_NEW_LESSON);
        this.log('success', `Advanced to next lesson (${advanceResult.actionTaken})`);
        
        // Short settle time for next video to mount
        await page.waitForTimeout(1200);

        consecutiveErrors = 0;
      } catch (loopError: any) {
        consecutiveErrors++;
        this.log('error', `Automation iteration error: ${loopError?.message || loopError}`);
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          this.log('error', 'Too many consecutive errors, pausing automation for safety.');
          this.stateMachine.transitionTo(AutomationState.ERROR);
          this.errorMessage = 'Too many consecutive errors occurred.';
          this.isRunning = false;
          this.broadcast();
          break;
        }

        await new Promise(r => setTimeout(r, 2000));
      }
    }

    this.isRunning = false;
    this.broadcast();
  }
}
