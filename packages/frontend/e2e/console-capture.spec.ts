import { test } from '@playwright/test';

test('Capture detailed console output during redirect', async ({ page }) => {
  const logs: string[] = [];

  // Capture ALL console output
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push(`[${type}] ${text}`);

    // Print redirects and router pushes immediately
    if (text.includes('router') || text.includes('redirect') || text.includes('push') || text.includes('auth')) {
      console.log(`>>> [${type}] ${text}`);
    }
  });

  console.log('\n=== Navigating to /campaigns ===\n');

  await page.goto('http://localhost:3001/campaigns', {
    waitUntil: 'commit',
    timeout: 30000
  });

  await page.waitForTimeout(6000);

  console.log('\n=== Final URL ===');
  console.log(page.url());

  console.log('\n=== All Console Logs ===');
  logs.forEach(log => console.log(log));

  await page.screenshot({ path: 'test-results/console-capture.png' });
});
