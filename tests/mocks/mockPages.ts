export const MOCK_PAGES = {
  videoLesson1: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Variables and Data Types | Python Essential Training</title>
      </head>
      <body>
        <header>
          <h1 data-test-classroom-header-title class="classroom-nav__course-title">Python Essential Training</h1>
        </header>
        <main>
          <div class="classroom-layout">
            <h2 data-test-item-title class="classroom-nav__item-title--current">Variables and Data Types</h2>
            <div class="video-container">
              <video class="vjs-tech" src="data:video/mp4;base64,AAAA" style="width: 600px; height: 400px;"></video>
            </div>
            <div class="classroom-controls">
              <button data-test-classroom-nav-next-button aria-label="Next item" class="classroom-nav__next-button">Next Lesson</button>
            </div>
          </div>
          <ul class="classroom-toc-section__items">
            <li data-test-toc-item data-test-toc-item-active class="classroom-toc-item classroom-toc-item--active">
              <span class="toc-item__title">Variables and Data Types</span>
            </li>
            <li data-test-toc-item class="classroom-toc-item">
              <span class="toc-item__title">Control Flow Statements</span>
            </li>
            <li data-test-toc-item class="classroom-toc-item">
              <span class="toc-item__title">Chapter 1 Quiz</span>
            </li>
          </ul>
        </main>
      </body>
    </html>
  `,

  videoLessonCompleted: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Variables and Data Types | Python Essential Training</title>
      </head>
      <body>
        <header>
          <h1 data-test-classroom-header-title>Python Essential Training</h1>
        </header>
        <main>
          <h2 data-test-item-title>Variables and Data Types</h2>
          <video class="vjs-tech" src="data:video/mp4;base64,AAAA"></video>
          <button data-test-classroom-nav-next-button aria-label="Next lesson">Next Lesson</button>
          <ul class="classroom-toc-section__items">
            <li data-test-toc-item data-test-toc-item-active data-test-toc-item-completed class="classroom-toc-item classroom-toc-item--active classroom-toc-item--completed">
              <span class="toc-item__title">Variables and Data Types</span>
              <svg data-test-icon="check-small" class="completed-icon"></svg>
            </li>
            <li data-test-toc-item class="classroom-toc-item">
              <span class="toc-item__title">Control Flow Statements</span>
            </li>
          </ul>
        </main>
      </body>
    </html>
  `,

  quizLesson: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chapter 1 Quiz | Python Essential Training</title>
      </head>
      <body>
        <header>
          <h1 data-test-classroom-header-title>Python Essential Training</h1>
        </header>
        <main>
          <h2 data-test-item-title>Chapter 1 Quiz</h2>
          <div data-test-quiz-container class="classroom-quiz">
            <h3>Knowledge Check: Variables</h3>
            <form data-test-quiz-form>
              <fieldset class="quiz-question">
                <legend>What is the output of type(42)?</legend>
                <div role="radiogroup" data-test-quiz-answers>
                  <label><input type="radio" name="q1" value="int"> int</label>
                  <label><input type="radio" name="q1" value="str"> str</label>
                </div>
              </fieldset>
              <button type="button">Submit answers</button>
            </form>
          </div>
        </main>
      </body>
    </html>
  `,

  courseraVideoLesson: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Supervised Learning Overview | Machine Learning | Coursera</title>
      </head>
      <body>
        <nav class="rc-CourseNav">
          <a data-e2e="course-link" href="/learn/machine-learning">Machine Learning</a>
        </nav>
        <main class="rc-ItemPage">
          <h1 data-e2e="item-name" class="item-title">Supervised Learning Overview</h1>
          <div data-e2e="video-player">
            <video class="c-video" src="data:video/mp4;base64,AAAA" style="width: 600px; height: 400px;"></video>
          </div>
          <button data-e2e="next-item" aria-label="Next Item">Next Item</button>
          <div class="rc-LessonsList">
            <a href="/learn/machine-learning/lecture/1/supervised" data-e2e="active-item" class="active" aria-current="page">Supervised Learning Overview</a>
            <a href="/learn/machine-learning/lecture/2/unsupervised" data-e2e="item">Unsupervised Learning</a>
            <a href="/learn/machine-learning/exam/quiz-1" data-e2e="item">Week 1 Graded Quiz</a>
          </div>
        </main>
      </body>
    </html>
  `,

  courseraQuizLesson: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Week 1 Graded Quiz | Machine Learning | Coursera</title>
      </head>
      <body>
        <nav class="rc-CourseNav">
          <a data-e2e="course-link" href="/learn/machine-learning">Machine Learning</a>
        </nav>
        <main class="rc-ItemPage">
          <h1 data-e2e="item-name" class="item-title">Week 1 Graded Quiz</h1>
          <div class="rc-Quiz">
            <form data-e2e="quiz-form" class="rc-QuizForm">
              <fieldset>
                <legend>What is regression?</legend>
                <label><input type="radio" name="q1" value="a"> Predicting continuous values</label>
                <label><input type="radio" name="q1" value="b"> Discrete categorization</label>
              </fieldset>
              <button data-e2e="start-quiz-button" type="button">Start Quiz</button>
            </form>
          </div>
        </main>
      </body>
    </html>
  `
};

