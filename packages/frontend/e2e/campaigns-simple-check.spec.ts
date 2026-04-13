import { test } from '@playwright/test';

test('Simple campaigns page check', async ({ page }) => {
  console.log('\n=== Loading /campaigns ===\n');

  await page.goto('http://localhost:3001/campaigns', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait a moment for React to hydrate
  await page.waitForTimeout(5000);

  const url = page.url();
  const title = await page.title();

  console.log('Final URL:', url);
  console.log('Page Title:', title);

  // Get page HTML
  const html = await page.content();
  console.log('\n=== HTML Length ===');
  console.log(html.length, 'characters');

  // Check for specific elements
  const navbar = await page.locator('nav').count();
  const h1Count = await page.locator('h1').count();
  const h2Count = await page.locator('h2').count();
  const campaignLinks = await page.locator('a[href*="/campaigns/"]').count();
  const allLinks = await page.locator('a').count();

  console.log('\n=== Element Counts ===');
  console.log('Navbar:', navbar);
  console.log('H1 tags:', h1Count);
  console.log('H2 tags:', h2Count);
  console.log('Campaign links (a[href*="/campaigns/"]):', campaignLinks);
  console.log('All links:', allLinks);

  // Get text from body
  const bodyText = await page.locator('body').textContent();
  const hasText = bodyText && bodyText.length > 100;
  console.log('Body has text:', hasText);

  if (bodyText) {
    console.log('Body text sample:', bodyText.substring(0, 200));
  }

  // Check for common campaign-related text
  const searchableText = bodyText?.toLowerCase() || '';
  console.log('\n=== Text Content Check ===');
  console.log('Contains "campaign":', searchableText.includes('campaign'));
  console.log('Contains "donate":', searchableText.includes('donate'));
  console.log('Contains "fundrais":', searchableText.includes('fundrais'));

  // Take screenshot
  await page.screenshot({
    path: 'test-results/campaigns-simple-check.png',
    fullPage: true
  });

  console.log('\nScreenshot saved to test-results/campaigns-simple-check.png\n');
});
