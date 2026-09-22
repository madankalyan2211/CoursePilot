import fs from 'fs';
import path from 'path';
import { CourseInfo, LessonInfo, AutomationSettings } from '../automation/automationState.js';

export interface PersistedCourseRecord {
  courseId: string;
  courseTitle: string;
  courseUrl: string;
  lastUpdated: string;
  currentLessonIndex: number;
  completedLessonsCount: number;
  totalLessons: number;
  lessons: Record<string, {
    title: string;
    index: number;
    status: string;
    completedAt?: string;
  }>;
}

export interface StorageData {
  courses: Record<string, PersistedCourseRecord>;
  lastActiveCourseId?: string;
  settings: AutomationSettings;
}

const DEFAULT_SETTINGS: AutomationSettings = {
  seekOffsetSeconds: 2.5,
  completionTimeoutMs: 15000,
  nextLessonDelayMs: 1200,
  maxRetries: 3,
  autoResumeAfterAssessment: false
};

export class ProgressStore {
  private filePath: string;
  private data: StorageData;

  constructor(customPath?: string) {
    const dir = customPath 
      ? path.dirname(customPath) 
      : path.join(process.cwd(), '.coursepilot-data');
    
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('Failed to create storage dir:', err);
      }
    }

    this.filePath = customPath || path.join(dir, 'progress.json');
    this.data = this.load();
  }

  private load(): StorageData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          courses: parsed.courses || {},
          lastActiveCourseId: parsed.lastActiveCourseId,
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings }
        };
      }
    } catch (err) {
      console.warn('Failed to load storage file, initializing new storage:', err);
    }

    return {
      courses: {},
      settings: { ...DEFAULT_SETTINGS }
    };
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save progress store:', err);
    }
  }

  public getSettings(): AutomationSettings {
    return { ...this.data.settings };
  }

  public updateSettings(partial: Partial<AutomationSettings>): AutomationSettings {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
    return this.data.settings;
  }

  public getCourse(courseId: string): PersistedCourseRecord | undefined {
    return this.data.courses[courseId];
  }

  public getLastActiveCourse(): PersistedCourseRecord | undefined {
    if (this.data.lastActiveCourseId) {
      return this.data.courses[this.data.lastActiveCourseId];
    }
    const courses = Object.values(this.data.courses);
    return courses.length > 0 ? courses[courses.length - 1] : undefined;
  }

  public recordCourse(course: CourseInfo): void {
    if (!course.id) return;
    
    this.data.lastActiveCourseId = course.id;
    const existing = this.data.courses[course.id] || {
      courseId: course.id,
      courseTitle: course.title,
      courseUrl: course.url,
      lastUpdated: new Date().toISOString(),
      currentLessonIndex: course.currentLessonIndex,
      completedLessonsCount: course.completedLessons,
      totalLessons: course.totalLessons,
      lessons: {}
    };

    existing.courseTitle = course.title || existing.courseTitle;
    existing.courseUrl = course.url || existing.courseUrl;
    existing.totalLessons = course.totalLessons || existing.totalLessons;
    existing.currentLessonIndex = course.currentLessonIndex || existing.currentLessonIndex;
    existing.lastUpdated = new Date().toISOString();

    // Map lessons if provided
    if (course.lessons && course.lessons.length > 0) {
      course.lessons.forEach(lesson => {
        existing.lessons[lesson.id] = {
          title: lesson.title,
          index: lesson.index,
          status: lesson.status,
          completedAt: lesson.status === 'COMPLETED' ? new Date().toISOString() : undefined
        };
      });
    }

    this.data.courses[course.id] = existing;
    this.save();
  }

  public recordLessonStatus(courseId: string, lesson: LessonInfo, status: string): void {
    if (!courseId || !lesson.id) return;

    const course = this.data.courses[courseId];
    if (!course) {
      this.recordCourse({
        id: courseId,
        title: '',
        url: lesson.url,
        totalLessons: lesson.totalLessons || 1,
        completedLessons: status === 'COMPLETED' ? 1 : 0,
        currentLessonIndex: lesson.index,
        lessons: [lesson]
      });
      return;
    }

    course.lastUpdated = new Date().toISOString();
    course.currentLessonIndex = lesson.index;
    
    course.lessons[lesson.id] = {
      title: lesson.title,
      index: lesson.index,
      status: status,
      completedAt: status === 'COMPLETED' ? new Date().toISOString() : course.lessons[lesson.id]?.completedAt
    };

    // Recalculate completed count
    const completedCount = Object.values(course.lessons).filter(l => l.status === 'COMPLETED').length;
    course.completedLessonsCount = completedCount;

    this.data.courses[courseId] = course;
    this.save();
  }

  public clearAll(): void {
    this.data.courses = {};
    this.data.lastActiveCourseId = undefined;
    this.save();
  }
}
