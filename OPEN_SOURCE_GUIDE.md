# Open Source Chrome Extension Guide for CoursePilot

This guide explains how to load, distribute, and publish **CoursePilot** as an open-source Chrome Extension (Manifest V3).

---

## 📦 1. How to Test & Load the Extension in Chrome (Unpacked)

You can load and use the extension immediately without publishing:

1. Open Google Chrome.
2. Go to: **`chrome://extensions/`**
3. In the top right corner, turn on **"Developer mode"**.
4. Click the **"Load unpacked"** button in the top left.
5. Select the **`extension/`** directory in this project:
   ```
   /Users/madanthambisetty/Downloads/BOT extension/extension
   ```
6. The **CoursePilot** extension is now installed!
7. Pin the CoursePilot icon to your Chrome toolbar.
8. Navigate to any LinkedIn Learning course page:
   - Click the extension icon to see your course status and press **START AUTOMATION**.
   - The extension will automatically seek videos near completion, confirm progress, auto-advance across topics and chapters, and show a floating draggable HUD whenever a quiz is detected!

---

## 🐙 2. Publishing as an Open Source Project on GitHub

To make your repository public on GitHub:

### Initialize Git & Commit:
```bash
git init
git add .
git commit -m "Initial commit: CoursePilot LinkedIn Learning Auto-Advance"
```

### Push to GitHub:
```bash
# Create a repository on GitHub (e.g. coursepilot-extension)
git remote add origin https://github.com/YOUR_USERNAME/coursepilot-extension.git
git branch -M main
git push -u origin main
```

---

## 🛒 3. Publishing to the Chrome Web Store (Optional)

If you'd like anyone in the world to install CoursePilot with 1 click from the Chrome Web Store:

1. **Zip the extension folder**:
   ```bash
   cd extension
   zip -r ../coursepilot-extension.zip ./*
   ```
2. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Pay the one-time $5 Google Developer registration fee.
4. Click **"New Item"** and upload `coursepilot-extension.zip`.
5. Fill out the store listing details:
   - Name: *CoursePilot — LinkedIn Learning Auto-Advance*
   - Summary: *Automate repetitive video playback with intelligent completion tracking and quiz safety gates.*
   - Category: *Productivity / Education*
   - Privacy Policy & Single Purpose description.
6. Submit for review (takes 1-3 business days).
