import { test, expect } from '@playwright/test';

test.use({
  headless: false,  // Show browser window
  slowMo: 1000      // Slow down actions
});

test('Quick diagnostic - watch what happens', async ({ page }) => {
  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
    console.log('[STACK]:', error.stack);
  });

  console.log('\n=== Navigating to /campaigns ===');
  await page.goto('http://localhost:3001/campaigns', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('\n=== Waiting 10 seconds for React to render ===');
  await page.waitForTimeout(10000);

  console.log('\n=== Checking what rendered ===');
  const url = page.url();
  const title = await page.title();
  const bodyText = await page.locator('body').textContent();
  const linkCount = await page.locator('a').count();
  const h1Count = await page.locator('h1').count();

  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Body text length:', bodyText?.length || 0);
  console.log('Link count:', linkCount);
  console.log('H1 count:', h1Count);

  if (bodyText) {
    console.log('\nSearching for campaign names...');
    console.log('Contains "Music Production":', bodyText.includes('Music Production'));
    console.log('Contains "Sustainable Agriculture":', bodyText.includes('Sustainable Agriculture'));
    console.log('Contains "Emergency Relief":', bodyText.includes('Emergency Relief'));

    // Print first 500 characters of body text
    console.log('\nBody text sample:');
    console.log(bodyText.substring(0, 500));
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/diagnostic-visual.png', fullPage: true });
  console.log('\n✅ Screenshot saved to test-results/diagnostic-visual.png');

  // Keep browser open for 30 seconds so we can inspect
  console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
});
