export enum AutomationState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  DETECTING_COURSE = 'DETECTING_COURSE',
  DETECTING_LESSON = 'DETECTING_LESSON',
  LOADING_PLAYER = 'LOADING_PLAYER',
  SEEKING = 'SEEKING',
  WAITING_FOR_COMPLETION = 'WAITING_FOR_COMPLETION',
  COMPLETED = 'COMPLETED',
  ADVANCING = 'ADVANCING',
  VERIFYING_NEW_LESSON = 'VERIFYING_NEW_LESSON',
  REQUIRES_USER = 'REQUIRES_USER',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED'
}

export type LessonStatus = 
  | 'NOT_STARTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'WAITING'
  | 'REQUIRES_USER'
  | 'FAILED';

export interface LessonInfo {
  id: string;
  title: string;
  index: number;
  totalLessons: number;
  url: string;
  isAssessment: boolean;
  assessmentType?: 'quiz' | 'knowledge_check' | 'exercise' | 'assessment';
  status: LessonStatus;
  duration?: number;
  currentTime?: number;
}

export interface CourseInfo {
  id: string;
  title: string;
  url: string;
  totalLessons: number;
  completedLessons: number;
  currentLessonIndex: number;
  lessons: LessonInfo[];
}

export interface CompletionSignals {
  videoEnded: boolean;
  videoNearEnd: boolean;
  markedCompleteInToc: boolean;
  nextButtonActive: boolean;
  progressIncremented: boolean;
  confidenceScore: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  state: AutomationState;
  action: string;
  details?: string;
  lessonTitle?: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface AutomationSettings {
  seekOffsetSeconds: number; // Seconds before absolute video end to seek to (e.g. 2s)
  completionTimeoutMs: number; // Max time to wait for LinkedIn completion signal
  nextLessonDelayMs: number; // Gentle delay before navigating
  maxRetries: number;
  autoResumeAfterAssessment: boolean;
}

export interface EngineSnapshot {
  state: AutomationState;
  isRunning: boolean;
  isPaused: boolean;
  requiresUserAction: boolean;
  currentCourse: CourseInfo | null;
  currentLesson: LessonInfo | null;
  completionSignals: CompletionSignals | null;
  activityLogs: ActivityLogEntry[];
  settings: AutomationSettings;
  activeBrowserUrl: string | null;
  errorMessage: string | null;
  retryCount: number;
}
