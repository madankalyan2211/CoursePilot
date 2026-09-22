import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProgressStore } from '../../src/storage/progressStore.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ProgressStore', () => {
  let tempFilePath: string;
  let store: ProgressStore;

  beforeEach(() => {
    tempFilePath = path.join(os.tmpdir(), `coursepilot-test-${Date.now()}.json`);
    store = new ProgressStore(tempFilePath);
  });

  afterEach(() => {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
    }
  });

  it('should initialize with default settings', () => {
    const settings = store.getSettings();
    expect(settings.seekOffsetSeconds).toBe(2.5);
    expect(settings.completionTimeoutMs).toBe(15000);
    expect(settings.maxRetries).toBe(3);
  });

  it('should update and persist settings', () => {
    store.updateSettings({ seekOffsetSeconds: 4.0 });
    const settings = store.getSettings();
    expect(settings.seekOffsetSeconds).toBe(4.0);

    // Reopen store from file
    const newStoreInstance = new ProgressStore(tempFilePath);
    expect(newStoreInstance.getSettings().seekOffsetSeconds).toBe(4.0);
  });

  it('should record course progress and calculate completed count', () => {
    const courseId = 'python-essential-training';
    store.recordCourse({
      id: courseId,
      title: 'Python Essential Training',
      url: 'https://www.linkedin.com/learning/python-essential-training',
      totalLessons: 10,
      completedLessons: 0,
      currentLessonIndex: 1,
      lessons: []
    });

    const lesson1 = {
      id: 'python-1-intro',
      title: 'Intro',
      index: 1,
      totalLessons: 10,
      url: 'https://www.linkedin.com/learning/python-essential-training/intro',
      isAssessment: false,
      status: 'COMPLETED' as const
    };

    store.recordLessonStatus(courseId, lesson1, 'COMPLETED');
    const courseRecord = store.getCourse(courseId);

    expect(courseRecord).toBeDefined();
    expect(courseRecord?.completedLessonsCount).toBe(1);
    expect(courseRecord?.lessons['python-1-intro']?.status).toBe('COMPLETED');
  });
});
