/**
 * CoursePilot Chrome Extension — Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isRunning: false,
    seekOffset: 2.5
  });
  console.log('CoursePilot extension installed successfully.');
});
