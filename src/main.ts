import { AutomationEngine } from './automation/automationEngine.js';
import { ApiServer } from './server/apiServer.js';
import { BrowserManager } from './browser/browserManager.js';
import { ProgressStore } from './storage/progressStore.js';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                  CoursePilot                      ║
║   "Automate the repetition. Keep control."        ║
╚═══════════════════════════════════════════════════╝
  `);

  const browserManager = new BrowserManager();
  const progressStore = new ProgressStore();
  const engine = new AutomationEngine(browserManager, progressStore);
  const server = new ApiServer(engine, 3100);

  await server.start();
  console.log(`🚀 Ready! Open your dashboard at http://localhost:5173 (dev) or http://localhost:3100`);

  // Handle graceful exit
  process.on('SIGINT', async () => {
    console.log('\nGracefully shutting down CoursePilot...');
    await engine.stop();
    await browserManager.close();
    await server.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
