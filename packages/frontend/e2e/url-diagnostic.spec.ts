import { test } from '@playwright/test';

test('Check final URL and page content after navigation', async ({ page }) => {
  console.log('\n========================================');
  console.log('NAVIGATING TO /campaigns');
  console.log('========================================\n');

  // Navigate to campaigns
  await page.goto('http://localhost:3001/campaigns', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait a moment for any client-side redirects
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => 'NOT FOUND');

  console.log('Final URL:', finalUrl);
  console.log('Page Title:', title);
  console.log('H1 Text:', h1);

  // Check specific elements
  const navbar = await page.locator('nav').count();
  const authForm = await page.locator('form[action*="auth"], form[action*="login"]').count();
  const campaignCards = await page.locator('a[href*="/campaigns/"]').count();

  console.log('\nElement counts:');
  console.log('- Navbar:', navbar);
  console.log('- Auth forms:', authForm);
  console.log('- Campaign cards:', campaignCards);

  // Take screenshot
  await page.screenshot({ path: 'test-results/url-diagnostic.png', fullPage: true });
  console.log('\nScreenshot saved to test-results/url-diagnostic.png\n');
});
