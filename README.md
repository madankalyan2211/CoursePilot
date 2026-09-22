# CoursePilot

[![GitHub Stars](https://img.shields.io/github/stars/madankalyan2211/CoursePilot?style=social)](https://github.com/madankalyan2211/CoursePilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platforms](https://img.shields.io/badge/Platforms-LinkedIn%20Learning%20%7C%20Coursera-orange)](https://github.com/madankalyan2211/CoursePilot)

> **"Automate the repetition. Keep control of the learning."**

CoursePilot is an open-source, multi-platform desktop automation tool and Manifest V3 Chrome Extension engineered for **LinkedIn Learning** and **Coursera**. It automates repetitive video playback and lesson progression while keeping you in full control of quizzes, assessments, and learning integrity.

⭐ **If you find CoursePilot helpful, please [Star the repository on GitHub](https://github.com/madankalyan2211/CoursePilot) to support continued development!**

---

## 🌟 Key Features

* **Dual Platform Support**: Seamless out-of-the-box support for both **LinkedIn Learning** and **Coursera** (`/learn/` and `/lecture/`).
* **Apple/macOS-Inspired Dashboard & Popup**: Minimalist, clean glassmorphic UI with dark/light mode, live progress ring/bar, and status badges.
* **Intelligent Video Seeking**: Accurately detects player duration and seeks smoothly toward the end without skipping completion tracking.
* **Multi-Signal Completion Verification**: Evaluates DOM checkmarks, video playback state, next-button activation, and syllabus updates to ensure 100% lesson completion before advancing.
* **Cross-Section & Topic Auto-Advance**: Seamlessly transitions across chapters, modules, weekly syllabus items, and accordion sections without getting stuck.
* **Strict Assessment & Quiz Safety Gate**: Immediately pauses automation upon encountering quizzes, exams, graded assignments, knowledge checks, or interactive exercises with a floating draggable HUD so you can answer manually.
* **Non-Invasive Browser Integration**: Uses a local persistent Playwright browser profile or Chrome Extension storage. **CoursePilot never asks for, captures, or stores your passwords or credentials.**
* **Local Progress Persistence**: Stores course history, completed lessons count, and progress locally.

---

## 🏗️ Architecture

```
coursepilot/
├── extension/                      # Manifest V3 Chrome Extension (LinkedIn + Coursera)
│   ├── manifest.json
│   ├── content.js                  # In-page automation & floating HUD
│   ├── background.js               # Service worker
│   ├── popup.html                  # Popup dashboard
│   ├── popup.css
│   └── icons/
├── src/                            # Desktop Automation Engine (Playwright + Node)
│   ├── browser/
│   │   ├── browserManager.ts
│   │   └── sessionManager.ts
│   ├── linkedin/                   # Platform Selectors & Detectors (Coursera & LinkedIn)
│   │   ├── selectors.ts
│   │   ├── pageDetector.ts
│   │   ├── courseDetector.ts
│   │   ├── lessonDetector.ts
│   │   ├── playerController.ts
│   │   ├── completionDetector.ts
│   │   ├── nextLessonController.ts
│   │   ├── floatingOverlay.ts
│   │   └── assessmentDetector.ts
│   ├── automation/
│   │   ├── automationState.ts
│   │   ├── stateMachine.ts
│   │   ├── retryManager.ts
│   │   └── automationEngine.ts
│   ├── storage/
│   │   └── progressStore.ts
│   ├── server/
│   │   └── apiServer.ts
│   └── main.ts
├── ui/                             # macOS Glassmorphic React Dashboard
└── tests/                          # Automated unit & integration tests
```

---

## 🚀 Quick Start

### Option A: Use as a Chrome Extension (100% in your normal browser)

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `extension/` directory (or extract `coursepilot-extension.zip`).
4. Pin CoursePilot to your toolbar, open any LinkedIn Learning or Coursera course, and click **START AUTOMATION**!

### Option B: Use as a Local Desktop Web App

```bash
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173` (dev) and `http://localhost:3100` (server).

---

## 🧪 Testing

Run the full automated unit and integration test suite:

```bash
npm test
```

---

## 🔒 Safety & Privacy Principles

1. **Zero Credential Collection**: You authenticate directly in your browser window. CoursePilot has no access to your credentials.
2. **No Automated Quiz Submissions**: The tool strictly halts when assessment forms or questions appear.
3. **Emergency Stop**: You can immediately stop all automation at any time by clicking the red **STOP AUTOMATION** button.

