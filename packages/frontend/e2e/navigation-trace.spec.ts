import { test } from '@playwright/test';

test('Trace navigation events', async ({ page }) => {
  const navigations: string[] = [];

  // Track all navigations
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      navigations.push(`NAVIGATED TO: ${url}`);
      console.log(`>>> NAVIGATION: ${url}`);
    }
  });

  console.log('\n========================================');
  console.log('Starting navigation to /campaigns...');
  console.log('========================================\n');

  try {
    await page.goto('http://localhost:3001/campaigns', {
      waitUntil: 'commit',  // Wait only for navigation to commit, not for load
      timeout: 30000
    });

    // Wait a bit to see if there are additional navigations
    await page.waitForTimeout(5000);

    console.log('\n========================================');
    console.log('Navigation History:');
    console.log('========================================');
    navigations.forEach((nav, idx) => console.log(`${idx + 1}. ${nav}`));

    console.log('\n========================================');
    console.log('Final State:');
    console.log('========================================');
    console.log('Current URL:', page.url());

    // Try to get title safely
    try {
      const title = await page.title();
      console.log('Page Title:', title);
    } catch (e) {
      console.log('Could not get title:', (e as Error).message);
    }

    await page.screenshot({ path: 'test-results/navigation-trace.png', fullPage: true });
    console.log('\nScreenshot saved\n');

  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  }
});
