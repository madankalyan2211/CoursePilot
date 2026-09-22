import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generatePngIcons() {
  const iconsDir = path.join(process.cwd(), 'extension', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const svgHtml = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: transparent; width: 128px; height: 128px; overflow: hidden;">
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0a84ff;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#5e5ce6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="128" height="128" rx="28" fill="url(#grad)"/>
          <polygon points="46,34 94,64 46,94" fill="#ffffff"/>
        </svg>
      </body>
    </html>
  `;

  await page.setContent(svgHtml);
  await page.setViewportSize({ width: 128, height: 128 });

  await page.screenshot({ path: path.join(iconsDir, 'icon128.png'), omitBackground: true });
  
  // Resize to 48 and 16
  await page.setViewportSize({ width: 48, height: 48 });
  await page.screenshot({ path: path.join(iconsDir, 'icon48.png'), omitBackground: true });

  await page.setViewportSize({ width: 16, height: 16 });
  await page.screenshot({ path: path.join(iconsDir, 'icon16.png'), omitBackground: true });

  await browser.close();
  console.log('PNG icons (16, 48, 128) generated successfully.');
}

generatePngIcons().catch(console.error);
