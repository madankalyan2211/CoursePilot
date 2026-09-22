import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';

export class BrowserManager {
  private context: BrowserContext | null = null;
  private activePage: Page | null = null;
  private profileDir: string;
  private isHeadless: boolean;

  constructor(customProfileDir?: string, isHeadless: boolean = false) {
    this.profileDir = customProfileDir || path.join(os.homedir(), '.coursepilot', 'browser-profile');
    this.isHeadless = isHeadless;
    
    if (!fs.existsSync(this.profileDir)) {
      try {
        fs.mkdirSync(this.profileDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create browser profile dir:', err);
      }
    }
  }

  public async initContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    try {
      this.context = await chromium.launchPersistentContext(this.profileDir, {
        headless: this.isHeadless,
        viewport: { width: 1280, height: 850 },
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      });

      this.context.on('page', (newPage) => {
        this.activePage = newPage;
      });

      this.context.on('close', () => {
        this.context = null;
        this.activePage = null;
      });

      return this.context;
    } catch (err: any) {
      throw new Error(`Failed to launch browser: ${err?.message || err}`);
    }
  }

  public async getActivePage(): Promise<Page> {
    const context = await this.initContext();
    const pages = context.pages();

    // Prefer page on linkedin.com/learning
    const linkedinPage = pages.find(p => p.url().includes('linkedin.com/learning') || p.url().includes('mock-course'));
    if (linkedinPage) {
      this.activePage = linkedinPage;
      return linkedinPage;
    }

    if (pages.length > 0) {
      this.activePage = pages[0];
      return pages[0];
    }

    this.activePage = await context.newPage();
    return this.activePage;
  }

  public async openUrl(url: string): Promise<Page> {
    const page = await this.getActivePage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    return page;
  }

  public async openLinkedInLearning(): Promise<Page> {
    return this.openUrl('https://www.linkedin.com/learning');
  }

  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.activePage = null;
    }
  }

  public isConnected(): boolean {
    return this.context !== null;
  }
}
