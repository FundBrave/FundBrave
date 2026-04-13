import { test, expect } from '@playwright/test';

/**
 * TASK-008: Improved Donation Flow E2E Tests
 *
 * KEY IMPROVEMENTS:
 * - Wait for GraphQL network requests to complete
 * - Wait for specific text content from seed data to appear
 * - Longer timeouts for React hydration
 * - Better element selectors
 */

test.describe('Donation Flow - With Proper Waits', () => {
  test('should load campaigns page and wait for data to render', async ({ page }) => {
    // Enable request interception to track GraphQL requests
    let graphqlCompleted = false;

    page.on('response', response => {
      if (response.url().includes('/graphql') && response.request().method() === 'POST') {
        graphqlCompleted = true;
        console.log('✅ GraphQL request completed');
      }
    });

    console.log('Navigating to /campaigns...');
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for GraphQL to complete...');
    // Wait for GraphQL request to complete (max 15 seconds)
    await page.waitForFunction(() => graphqlCompleted, { timeout: 15000 }).catch(() => {
      console.warn('⚠️ GraphQL wait timeout - continuing anyway');
    });

    console.log('Waiting for campaign name from seed data...');
    // Wait for specific campaign name from seed data to appear
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Music Production Studio') ||
             bodyText.includes('Sustainable Agriculture') ||
             bodyText.includes('Emergency Relief');
    }, { timeout: 20000 });

    console.log('Checking for campaign links...');
    // Now check for campaign links with generous timeout
    const campaignLink = page.locator('a[href*="/campaigns/"][href*="-"]').first();
    await expect(campaignLink).toBeVisible({ timeout: 15000 });

    console.log('✅ Test passed!');

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/improved-campaigns-loaded.png', fullPage: true });
  });

  test('should extract campaign ID and navigate to details', async ({ page }) => {
    let graphqlCompleted = false;

    page.on('response', response => {
      if (response.url().includes('/graphql')) {
        graphqlCompleted = true;
      }
    });

    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });

    // Wait for GraphQL
    await page.waitForFunction(() => graphqlCompleted, { timeout: 15000 }).catch(() => {});

    // Wait for campaign data to render
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Music Production Studio');
    }, { timeout: 20000 });

    // Find campaign link with UUID pattern
    const campaignLink = page.locator('a[href*="/campaigns/"][href*="-"]').first();
    await expect(campaignLink).toBeVisible({ timeout: 15000 });

    // Extract href
    const href = await campaignLink.getAttribute('href');
    console.log('Found campaign link:', href);

    expect(href).toMatch(/\/campaigns\/[a-f0-9\-]{36}/);

    const campaignId = href?.split('/campaigns/')[1] || '';
    console.log('Extracted campaign ID:', campaignId);

    expect(campaignId).toMatch(/^[a-f0-9\-]{36}$/);

    // Navigate to campaign details
    await campaignLink.click();
    await page.waitForURL(`/campaigns/${campaignId}`, { timeout: 10000 });

    console.log('✅ Successfully navigated to campaign details');

    // Take screenshot
    await page.screenshot({ path: 'test-results/improved-campaign-details.png', fullPage: true });
  });

  test('should navigate to donation page', async ({ page }) => {
    let graphqlCompleted = false;

    page.on('response', response => {
      if (response.url().includes('/graphql')) {
        graphqlCompleted = true;
      }
    });

    // Go to campaigns page
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => graphqlCompleted, { timeout: 15000 }).catch(() => {});
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Music Production Studio');
    }, { timeout: 20000 });

    // Click first campaign
    const campaignLink = page.locator('a[href*="/campaigns/"][href*="-"]').first();
    await expect(campaignLink).toBeVisible({ timeout: 15000 });
    const href = await campaignLink.getAttribute('href');
    const campaignId = href?.split('/campaigns/')[1] || '';

    // Navigate directly to donate page
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });

    // Wait for donate page to load
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.toLowerCase().includes('donate') || bodyText.toLowerCase().includes('donation');
    }, { timeout: 20000 });

    console.log('✅ Donation page loaded');

    // Verify URL
    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignId}/donate`));

    // Take screenshot
    await page.screenshot({ path: 'test-results/improved-donation-page.png', fullPage: true });
  });
});
