import fs from 'fs';
import path from 'path';

// Create icons dir
const iconsDir = path.join(process.cwd(), 'extension', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 128x128 SVG Icon
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a84ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5e5ce6;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#grad)" filter="url(#shadow)"/>
  <polygon points="46,34 94,64 46,94" fill="#ffffff"/>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent.trim());
console.log('Icons generated successfully.');
