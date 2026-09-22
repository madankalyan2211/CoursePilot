import { Page } from 'playwright';

export class FloatingOverlay {
  public static async inject(page: Page, lessonTitle: string = 'Quiz / Assessment'): Promise<void> {
    try {
      await page.evaluate(({ title }) => {
        // Remove existing overlay if any
        const existing = document.getElementById('coursepilot-floating-overlay');
        if (existing) existing.remove();

        // Create container
        const overlay = document.createElement('div');
        overlay.id = 'coursepilot-floating-overlay';
        overlay.innerHTML = `
          <div id="cp-card" style="
            position: fixed;
            top: 24px;
            right: 24px;
            width: 320px;
            background: rgba(20, 20, 26, 0.95);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 214, 10, 0.35);
            border-radius: 16px;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 214, 10, 0.15);
            padding: 16px 18px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', sans-serif;
            color: #f5f5f7;
            z-index: 2147483647;
            cursor: grab;
            user-select: none;
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #ffd60a; box-shadow: 0 0 8px #ffd60a; display: inline-block;"></span>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #ffd60a;">Quiz Paused</span>
              </div>
              <a href="https://github.com/madankalyan2211/CoursePilot" target="_blank" style="font-size: 11px; color: #ffd60a; text-decoration: none; display: flex; align-items: center; gap: 4px; background: rgba(255, 214, 10, 0.15); padding: 2px 7px; border-radius: 99px; font-weight: 600;">
                ⭐ Star on GitHub
              </a>
            </div>

            <div style="font-size: 14px; font-weight: 600; line-height: 1.35; margin-bottom: 6px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${title}">
              ${title}
            </div>

            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.65); line-height: 1.4; margin-bottom: 14px;">
              Complete the quiz in this tab, then click <strong>Resume</strong> to auto-advance.
            </div>

            <div style="display: flex; gap: 8px;">
              <button id="cp-resume-btn" style="
                flex: 1;
                background: #0a84ff;
                color: #ffffff;
                border: none;
                border-radius: 10px;
                padding: 9px 14px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                box-shadow: 0 4px 12px rgba(10, 132, 255, 0.35);
                transition: all 0.15s ease;
                font-family: inherit;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Resume
              </button>

              <button id="cp-stop-btn" style="
                background: rgba(255, 69, 58, 0.18);
                color: #ff453a;
                border: 1px solid rgba(255, 69, 58, 0.35);
                border-radius: 10px;
                padding: 9px 12px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                transition: all 0.15s ease;
                font-family: inherit;
              ">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                Stop
              </button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        // Click handlers
        const resumeBtn = document.getElementById('cp-resume-btn');
        const stopBtn = document.getElementById('cp-stop-btn');

        if (resumeBtn) {
          resumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            (window as any).__coursepilotAction = 'RESUME';
          });
        }

        if (stopBtn) {
          stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            (window as any).__coursepilotAction = 'STOP';
          });
        }

        // Make floating card draggable
        const card = document.getElementById('cp-card');
        if (card) {
          let isDragging = false;
          let startX = 0;
          let startY = 0;
          let initialLeft = 0;
          let initialTop = 0;

          card.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName === 'BUTTON') return;
            isDragging = true;
            card.style.cursor = 'grabbing';
            const rect = card.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            startX = e.clientX;
            startY = e.clientY;

            // Reset right positioning to left/top
            card.style.right = 'auto';
            card.style.left = `${initialLeft}px`;
            card.style.top = `${initialTop}px`;
          });

          window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            card.style.left = `${Math.max(10, Math.min(window.innerWidth - 340, initialLeft + dx))}px`;
            card.style.top = `${Math.max(10, Math.min(window.innerHeight - 150, initialTop + dy))}px`;
          });

          window.addEventListener('mouseup', () => {
            if (isDragging) {
              isDragging = false;
              card.style.cursor = 'grab';
            }
          });
        }
      }, { title: lessonTitle });
    } catch (err) {
      console.warn('Could not inject floating overlay into page:', err);
    }
  }

  public static async remove(page: Page): Promise<void> {
    try {
      await page.evaluate(() => {
        const el = document.getElementById('coursepilot-floating-overlay');
        if (el) el.remove();
        (window as any).__coursepilotAction = null;
      });
    } catch {}
  }

  public static async pollAction(page: Page): Promise<'RESUME' | 'STOP' | null> {
    try {
      const action = await page.evaluate(() => {
        const val = (window as any).__coursepilotAction;
        (window as any).__coursepilotAction = null;
        return val || null;
      });
      return action;
    } catch {
      return null;
    }
  }
}
