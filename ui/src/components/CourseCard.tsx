import React from 'react';
import { BookOpen, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CourseInfo, LessonInfo, AutomationState } from '../../../src/automation/automationState.js';

interface CourseCardProps {
  course: CourseInfo | null;
  lesson: LessonInfo | null;
  state: AutomationState;
  errorMessage: string | null;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  lesson,
  state,
  errorMessage
}) => {
  const totalLessons = course?.totalLessons || lesson?.totalLessons || 1;
  const currentIndex = lesson?.index || course?.currentLessonIndex || 1;
  const completedCount = course?.completedLessons || 0;
  const progressPercent = Math.min(100, Math.round((completedCount / Math.max(1, totalLessons)) * 100));

  const getBannerContent = () => {
    if (errorMessage) {
      return {
        type: 'error',
        icon: <AlertCircle size={15} color="var(--accent-red)" />,
        text: errorMessage
      };
    }

    switch (state) {
      case AutomationState.CONNECTING:
        return {
          type: 'info',
          icon: <Video size={15} color="var(--accent-blue)" />,
          text: 'Attaching to LinkedIn Learning browser session...'
        };
      case AutomationState.DETECTING_COURSE:
        return {
          type: 'info',
          icon: <BookOpen size={15} color="var(--accent-blue)" />,
          text: 'Detecting course outline & syllabus...'
        };
      case AutomationState.LOADING_PLAYER:
        return {
          type: 'info',
          icon: <Video size={15} color="var(--accent-blue)" />,
          text: 'Waiting for video player to initialize...'
        };
      case AutomationState.SEEKING:
        return {
          type: 'info',
          icon: <Video size={15} color="var(--accent-blue)" />,
          text: 'Seeking toward end of lesson...'
        };
      case AutomationState.WAITING_FOR_COMPLETION:
        return {
          type: 'info',
          icon: <CheckCircle2 size={15} color="var(--accent-amber)" />,
          text: 'Waiting for LinkedIn completion confirmation...'
        };
      case AutomationState.COMPLETED:
        return {
          type: 'info',
          icon: <CheckCircle2 size={15} color="var(--accent-green)" />,
          text: 'Lesson completed successfully! Preparing next lesson...'
        };
      case AutomationState.ADVANCING:
        return {
          type: 'info',
          icon: <BookOpen size={15} color="var(--accent-blue)" />,
          text: 'Opening next lesson...'
        };
      case AutomationState.REQUIRES_USER:
        return {
          type: 'warning',
          icon: <AlertCircle size={15} color="var(--accent-amber)" />,
          text: 'Paused: Interactive assessment or human action required'
        };
      default:
        return null;
    }
  };

  const banner = getBannerContent();

  return (
    <div className="course-section">
      <div>
        <div className="course-label">Course</div>
        <h1 className="course-title">
          {course?.title || 'Open a LinkedIn Learning course to begin'}
        </h1>
      </div>

      <div className="lesson-card">
        <div className="lesson-header">
          <span className="course-label" style={{ fontSize: '10px' }}>Current Lesson</span>
          <span className="lesson-badge">
            {lesson?.isAssessment ? 'Assessment' : 'Video Lesson'}
          </span>
        </div>
        <div className="lesson-title">
          {lesson?.title || 'Waiting to detect active lesson...'}
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-labels">
          <span>Lesson {currentIndex} of {totalLessons}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {banner && (
        <div className={`state-banner ${banner.type}`}>
          {banner.icon}
          <span>{banner.text}</span>
        </div>
      )}
    </div>
  );
};
