# 🚀 CoursePilot

<div align="center">

[![GitHub Stars](https://img.shields.io/github/stars/madankalyan2211/CoursePilot?style=for-the-badge&logo=github&color=ffd60a)](https://github.com/madankalyan2211/CoursePilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Supported Platforms](https://img.shields.io/badge/Platforms-LinkedIn%20Learning%20%7C%20Coursera-orange?style=for-the-badge)](https://github.com/madankalyan2211/CoursePilot)
[![OS Support](https://img.shields.io/badge/OS-Windows%2010%2F11%20%7C%20macOS-blueviolet?style=for-the-badge)](https://github.com/madankalyan2211/CoursePilot)

**Automate repetitive video playback. Keep 100% control of quizzes and learning integrity.**

[📥 Download Extension (.zip)](https://github.com/madankalyan2211/CoursePilot/raw/main/coursepilot-extension.zip) • [⭐ Star Repository](https://github.com/madankalyan2211/CoursePilot) • [📖 Quick Installation](#-quick-installation-guide-chrome-extension) • [❓ FAQ](#-frequently-asked-questions-faq)

</div>

---

## 🌟 Why CoursePilot?

Watching dozens of tutorial videos back-to-back can be tedious when you just want to progress through modules efficiently. **CoursePilot** is an open-source browser extension and automation tool designed specifically for **LinkedIn Learning** and **Coursera**.

* ⏩ **Smart Playback & Seeking** — Automatically seeks smoothly toward video completion without breaking platform progress tracking.
* ⏭️ **Auto-Advance Topics & Modules** — Smoothly transitions between lessons, chapters, and weekly syllabus items.
* 🛑 **Quiz & Exam Safety Pause** — Strictly pauses whenever a quiz, exam, graded assignment, or knowledge check appears so you can answer manually.
* 🪟 **Cross-Platform Dark Fluent/Acrylic UI** — Looks stunning on **Windows 10/11** and **macOS** with dark mode, custom scrollbars, and fluid typography.
* 🌐 **Cross-Tab Control** — Control your course playback from any tab in your browser.
* 🔒 **100% Private & Local** — Zero account logins, zero credential tracking, and no external tracking servers. Everything runs entirely inside your browser.

---

## 📦 Quick Installation Guide (Chrome Extension)

> **Estimated time:** Less than 1 minute • **No coding required**

### Step 1: Download CoursePilot

Choose **one** of the two simple ways:
* **Option 1 (Direct Download)**: [Download **`coursepilot-extension.zip`**](https://github.com/madankalyan2211/CoursePilot/raw/main/coursepilot-extension.zip) from this repo and extract the folder to your computer.
* **Option 2 (Git Clone)**:
  ```bash
  git clone https://github.com/madankalyan2211/CoursePilot.git
  ```

---

### Step 2: Install into Google Chrome (or Edge / Brave / Opera)

1. Open **Google Chrome** (or any Chromium browser like Brave, Microsoft Edge, or Arc).
2. Type or paste this in your URL address bar and press Enter:
   ```
   chrome://extensions/
   ```
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. In the top-left corner, click the **Load unpacked** button.
5. Select the **`extension`** folder from the extracted files (the folder containing `manifest.json`).
6. 🎉 **CoursePilot is now installed!**

---

### Step 3: Pin & Activate CoursePilot

1. Click the **Puzzle piece icon 🧩** in your Chrome toolbar (top right).
2. Click the **Pin icon 📌** next to **CoursePilot** so it stays visible on your toolbar.
3. Open any course on [LinkedIn Learning](https://www.linkedin.com/learning) or [Coursera](https://www.coursera.org/learn).
4. Click the **CoursePilot icon** in your toolbar.
5. Click **START AUTOMATION**.
   > ⭐ *First-time user? Click "Star Repository on GitHub" and then "I've Starred ⭐ (Activate)" to unlock automation!*

---

## 🖥️ Operating System Specific Tips

### 🪟 Windows 10 & 11
* CoursePilot is tuned with Microsoft's **Segoe UI Variable** typography, smooth antialiased font rendering, and slim dark acrylic scrollbars that match the modern Windows 11 Fluent aesthetic.
* Works seamlessly across **Google Chrome**, **Microsoft Edge**, **Brave**, and **Opera GX**.

### 🍎 macOS (Apple Silicon & Intel)
* Styled with Cupertino dark glassmorphism, Apple system fonts, and native micro-animations.

---

## 🎯 How It Works

```
┌────────────────────────────────────────────────────────┐
│ 1. Video Lesson Detected                               │
│    └─► Seeks smoothly to completion & verifies credit  │
├────────────────────────────────────────────────────────┤
│ 2. Next Lesson Triggered                               │
│    └─► Clicks Next / Advances to next syllabus module  │
├────────────────────────────────────────────────────────┤
│ 3. Quiz / Assessment Found?                            │
│    └─► ⚠️ PAUSES AUTOMATION IMMEDIATELY               │
│    └─► Shows draggable Floating HUD                    │
│    └─► You complete the quiz and click [Resume]        │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Advanced: Running the Desktop App (For Developers)

In addition to the standalone Chrome Extension, CoursePilot includes an optional full-featured Node.js + Playwright + React desktop dashboard.

### Prerequisites
* [Node.js 18+](https://nodejs.org/) installed on your machine.

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/madankalyan2211/CoursePilot.git
cd CoursePilot

# 2. Install dependencies
npm install

# 3. Start local development environment
npm run dev
```

* **Desktop Dashboard**: `http://localhost:5173`
* **API Server**: `http://localhost:3100`

### Running Automated Tests

```bash
npm test
```

CoursePilot includes a comprehensive test suite with 18 unit and integration tests covering Playwright controllers, DOM completion detectors, and multi-platform syllabus transitions.

---

## 📂 Project Architecture

```
CoursePilot/
├── extension/                      # Manifest V3 Chrome Extension
│   ├── manifest.json               # Dual host permissions (LinkedIn + Coursera)
│   ├── content.js                  # In-page playback loop & draggable HUD
│   ├── popup.html                  # Popup dashboard & Star Gate modal
│   ├── popup.css                   # Windows Fluent / macOS acrylic styling
│   ├── popup.js                    # Cross-tab state & command routing
│   └── icons/                      # 16px, 48px, 128px high-res icons
├── src/                            # Desktop Automation Engine (Playwright + TypeScript)
│   ├── linkedin/                   # Selectors & Detectors (Coursera & LinkedIn)
│   ├── automation/                 # Robust State Machine & Retry Manager
│   └── server/                     # REST API Server for Desktop UI
├── ui/                             # Modern React + Vite Dashboard
├── coursepilot-extension.zip       # Ready-to-use extension distribution zip
└── README.md
```

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><strong>Q: Does CoursePilot steal or store my passwords?</strong></summary>
<br>
<strong>No, absolutely not.</strong> CoursePilot is 100% open-source and operates purely inside your already-authenticated browser session. It does not collect, read, or transmit any passwords, tokens, cookies, or personal data.
</details>

<details>
<summary><strong>Q: Will it automatically answer quizzes or exams for me?</strong></summary>
<br>
<strong>No.</strong> CoursePilot is engineered with strict assessment safety gates. Whenever a quiz, test, or graded project is encountered, automation is immediately paused with an on-screen notification so you can learn and test your knowledge manually.
</details>

<details>
<summary><strong>Q: What should I do if the popup says "No Course Open"?</strong></summary>
<br>
Simply open a course on <a href="https://www.linkedin.com/learning">LinkedIn Learning</a> or <a href="https://www.coursera.org/learn">Coursera</a> in any tab. CoursePilot will automatically detect the open course even if you are browsing another tab!
</details>

<details>
<summary><strong>Q: How do I update the extension when a new version is released?</strong></summary>
<br>
1. Download the latest <code>coursepilot-extension.zip</code> or run <code>git pull</code>.<br>
2. Go to <code>chrome://extensions/</code>.<br>
3. Click the <strong>↻ (Reload)</strong> button on the CoursePilot card.
</details>

---

## ⭐ Support & Community

CoursePilot is free and open-source under the [MIT License](LICENSE).

If CoursePilot saves you time, please give it a **⭐ Star on GitHub** — it helps more learners discover the project and supports new feature updates!

[![Star on GitHub](https://img.shields.io/badge/⭐_Star_on_GitHub-CoursePilot-ffd60a?style=for-the-badge&logo=github)](https://github.com/madankalyan2211/CoursePilot)

---

<div align="center">
Built with ❤️ for lifelong learners on LinkedIn Learning and Coursera.
</div>
