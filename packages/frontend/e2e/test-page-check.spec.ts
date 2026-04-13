import { test } from '@playwright/test';

test('Check if test page redirects', async ({ page }) => {
  const navigations: string[] = [];

  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navigations.push(frame.url());
      console.log(`>>> ${frame.url()}`);
    }
  });

  await page.goto('http://localhost:3001/test-page', {
    waitUntil: 'commit',
    timeout: 30000
  });

  await page.waitForTimeout(5000);

  console.log('\n=== Navigation History ===');
  navigations.forEach((url, idx) => console.log(`${idx + 1}. ${url}`));
  console.log('\nFinal URL:', page.url());

  try {
    const h1 = await page.locator('h1').textContent();
    console.log('H1 text:', h1);
  } catch (e) {
    console.log('Could not get H1');
  }

  await page.screenshot({ path: 'test-results/test-page.png' });
});
