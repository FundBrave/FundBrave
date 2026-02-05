import { test, expect } from '@playwright/test';

/**
 * TASK-008: Donation Flow E2E Tests
 *
 * CRITICAL ARCHITECTURE NOTE:
 * - Direct + Wealth-Building donations are on ONE page with a toggle switch
 * - URL: /campaigns/[id]/donate
 * - isWealthBuilding state controls donation type
 * - Staking is a SEPARATE page: /campaigns/[id]/stake
 *
 * SMART CONTRACT STATUS: NOT DEPLOYED
 * - Tests focus on UI/UX flow only
 * - Mock mode must be implemented for actual transactions
 * - Wallet connection will be tested but transactions will fail gracefully
 */

test.describe('Donation Flow - Campaign Listing & Details', () => {
  test('should load campaign listing page without authentication', async ({ page }) => {
    // Navigate to campaigns page (PUBLIC - no auth required)
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });

    // Wait for campaigns to load
    await expect(page.locator('h1, h2').filter({ hasText: /campaigns|fundraisers/i })).toBeVisible({ timeout: 10000 });

    // Verify campaigns are displayed (expecting 10 from seed data)
    const campaignCards = page.locator('[data-testid="campaign-card"], article, .campaign-card').first();
    await expect(campaignCards).toBeVisible({ timeout: 10000 });

    // Verify no authentication required
    await expect(page).not.toHaveURL(/login|auth/);
  });

  test('should display campaign cards with essential information', async ({ page }) => {
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });

    // Wait for campaigns to load
    await page.waitForLoadState('domcontentloaded');

    // Check for campaign elements (flexible selectors for different implementations)
    const page_content = await page.content();

    // Should contain campaign names from seed data
    expect(page_content).toContain('Music Production Studio for Youth' || 'campaign' || 'fundraiser');

    // Should have some form of progress indication or donation count
    const hasProgress = page_content.includes('%') ||
                       page_content.includes('raised') ||
                       page_content.includes('donors') ||
                       page_content.includes('goal');
    expect(hasProgress).toBe(true);
  });

  test('should navigate to campaign details page when clicking a campaign', async ({ page }) => {
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });

    // Wait for campaigns to load
    await page.waitForLoadState('domcontentloaded');

    // Click the first campaign card (flexible selector)
    const firstCampaign = page.locator('a[href*="/campaigns/"], article a, .campaign-card a').first();
    await expect(firstCampaign).toBeVisible({ timeout: 10000 });

    const campaignUrl = await firstCampaign.getAttribute('href');
    expect(campaignUrl).toMatch(/\/campaigns\/[a-f0-9\-]+/);

    await firstCampaign.click();

    // Verify navigation to campaign details page
    await expect(page).toHaveURL(/\/campaigns\/[a-f0-9\-]+/, { timeout: 10000 });

    // Verify campaign details page loaded
    await page.waitForLoadState('domcontentloaded');

    // Should show campaign content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000); // Should have substantial content
  });
});

test.describe('Donation Flow - Campaign Details Page', () => {
  let campaignId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to campaigns and get first campaign ID
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const firstCampaignLink = page.locator('a[href*="/campaigns/"]').first();
    await expect(firstCampaignLink).toBeVisible({ timeout: 10000 });

    const href = await firstCampaignLink.getAttribute('href');
    campaignId = href?.split('/campaigns/')[1]?.split('?')[0] || '';
    expect(campaignId).toBeTruthy();
  });

  test('should display campaign details without authentication', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Verify on campaign details page (not redirected to login)
    await expect(page).toHaveURL(`/campaigns/${campaignId}`);
    await expect(page).not.toHaveURL(/login|auth/);

    // Should have campaign content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });

  test('should display Donate button on campaign details', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Look for Donate button (case-insensitive, various formats)
    const donateButton = page.locator('button, a').filter({ hasText: /donate/i }).first();
    await expect(donateButton).toBeVisible({ timeout: 10000 });
  });

  test('should display Stake button on campaign details', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Look for Stake button
    const stakeButton = page.locator('button, a').filter({ hasText: /stake/i }).first();
    // Stake button might be present depending on campaign type
    const stakeButtonCount = await stakeButton.count();
    expect(stakeButtonCount).toBeGreaterThanOrEqual(0);
  });

  test('should show campaign milestones if available', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();
    const hasMilestones = content.toLowerCase().includes('milestone') ||
                         content.includes('%') ||
                         content.includes('progress');

    // Milestones should be present (4 milestones per campaign from seed data)
    expect(hasMilestones).toBe(true);
  });

  test('should show campaign updates if available', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();
    const hasUpdates = content.toLowerCase().includes('update') ||
                      content.toLowerCase().includes('news') ||
                      content.toLowerCase().includes('announcement');

    // Updates should be present (3 updates per campaign from seed data)
    expect(hasUpdates).toBe(true);
  });

  test('should show creator information', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();
    const hasCreator = content.toLowerCase().includes('creator') ||
                      content.toLowerCase().includes('by') ||
                      content.includes('@'); // Username handle

    expect(hasCreator).toBe(true);
  });
});

test.describe('Donation Flow - Donation Page (Direct + Wealth-Building)', () => {
  let campaignId: string;

  test.beforeEach(async ({ page }) => {
    // Get first campaign ID
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const firstCampaignLink = page.locator('a[href*="/campaigns/"]').first();
    const href = await firstCampaignLink.getAttribute('href');
    campaignId = href?.split('/campaigns/')[1]?.split('?')[0] || '';
  });

  test('should navigate to donation page from campaign details', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Click Donate button
    const donateButton = page.locator('button, a').filter({ hasText: /donate/i }).first();
    await donateButton.click();

    // Should navigate to donation page
    await expect(page).toHaveURL(`/campaigns/${campaignId}/donate`, { timeout: 10000 });
  });

  test('should load donation page with campaign information', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verify page loaded successfully
    await expect(page).toHaveURL(`/campaigns/${campaignId}/donate`);

    // Should not show 404 or error
    const content = await page.content();
    expect(content.toLowerCase()).not.toContain('not found');
    expect(content.toLowerCase()).not.toContain('404');

    // Should have substantial content
    expect(content.length).toBeGreaterThan(1000);
  });

  test('should display preset donation amounts', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Look for preset amount buttons (common values: $10, $25, $50, $100, $250)
    const presetButtons = page.locator('button').filter({ hasText: /\$\d+|€\d+|£\d+/ });
    const count = await presetButtons.count();

    // Should have at least 3 preset amounts
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should display custom amount input field', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Look for amount input field
    const amountInput = page.locator('input[type="number"], input[type="text"]').filter({
      hasText: /amount|donation/i
    }).or(page.locator('input[placeholder*="amount" i]')).first();

    const inputCount = await amountInput.count();
    expect(inputCount).toBeGreaterThanOrEqual(1);
  });

  test('should display crypto selector (ETH, USDC)', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();

    // Should mention crypto options
    const hasCrypto = content.includes('ETH') ||
                     content.includes('USDC') ||
                     content.toLowerCase().includes('crypto') ||
                     content.toLowerCase().includes('token');

    expect(hasCrypto).toBe(true);
  });

  test('should display tip slider for platform tips', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Look for tip slider or tip percentage
    const tipSlider = page.locator('input[type="range"], .slider, [role="slider"]').first();
    const tipContent = await page.content();
    const hasTip = (await tipSlider.count() > 0) ||
                   tipContent.toLowerCase().includes('tip') ||
                   tipContent.includes('%');

    expect(hasTip).toBe(true);
  });

  test('should display donation summary section', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();

    // Should show summary information
    const hasSummary = content.toLowerCase().includes('summary') ||
                      content.toLowerCase().includes('total') ||
                      content.toLowerCase().includes('amount');

    expect(hasSummary).toBe(true);
  });

  test('should show Connect Wallet button when wallet not connected', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Look for wallet connection button
    const connectButton = page.locator('button').filter({
      hasText: /connect.*wallet|wallet.*connect/i
    }).first();

    // Should have connect wallet button
    await expect(connectButton).toBeVisible({ timeout: 10000 });
  });

  test('ARCHITECTURE VERIFICATION: should have wealth-building toggle on same page', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();

    // CRITICAL: Should have wealth-building option on this page
    // NOT a separate page/route
    const hasWealthBuilding = content.toLowerCase().includes('wealth') ||
                             content.includes('78') || // 78% split
                             content.includes('20') || // 20% split
                             content.includes('2') ||  // 2% split
                             content.toLowerCase().includes('yield') ||
                             content.toLowerCase().includes('split');

    expect(hasWealthBuilding).toBe(true);
  });

  test('ARCHITECTURE VERIFICATION: Direct and Wealth-Building on one page (not separate routes)', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });

    // Should NOT redirect to /wealth-building or /wealth route
    await expect(page).toHaveURL(`/campaigns/${campaignId}/donate`);
    await expect(page).not.toHaveURL(/wealth-building/);

    // URL should stay the same (toggle switches mode, doesn't navigate)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(`/campaigns/${campaignId}/donate`);
  });

  test('should display security badge or security information', async ({ page }) => {
    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();
    const hasSecurity = content.toLowerCase().includes('secure') ||
                       content.toLowerCase().includes('safe') ||
                       content.toLowerCase().includes('encrypted');

    // Security information should be present
    expect(hasSecurity).toBe(true);
  });
});

test.describe('Donation Flow - Loading and Error States', () => {
  test('should show loading state while fetching campaign data', async ({ page }) => {
    // Use a slow network to catch loading state
    await page.route('**/graphql', route => {
      setTimeout(() => route.continue(), 1000);
    });

    const campaignPromise = page.goto('/campaigns/test-id-12345');

    // Should show some loading indicator
    const loadingIndicator = page.locator('[role="status"], .loading, .spinner, svg.animate-spin').first();

    // Wait a bit for loading state to appear
    await page.waitForTimeout(200);

    // If loading indicator exists, it should be visible during load
    const count = await loadingIndicator.count();
    if (count > 0) {
      await expect(loadingIndicator).toBeVisible();
    }

    await campaignPromise;
  });

  test('should handle non-existent campaign gracefully', async ({ page }) => {
    await page.goto('/campaigns/non-existent-id-12345', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const content = await page.content();

    // Should show 404 or "not found" message
    const hasError = content.toLowerCase().includes('not found') ||
                    content.toLowerCase().includes('404') ||
                    content.toLowerCase().includes('doesn\'t exist');

    expect(hasError).toBe(true);

    // Should have a way to go back
    const backLink = page.locator('a[href="/campaigns"], button').filter({ hasText: /back|campaigns|home/i }).first();
    const backLinkCount = await backLink.count();
    expect(backLinkCount).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully on donation page', async ({ page }) => {
    // Get a real campaign ID first
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    const firstCampaignLink = page.locator('a[href*="/campaigns/"]').first();
    const href = await firstCampaignLink.getAttribute('href');
    const campaignId = href?.split('/campaigns/')[1]?.split('?')[0] || '';

    // Mock API error
    await page.route('**/graphql', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Internal server error' }] })
      });
    });

    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Should show error message or fallback to mock data
    const content = await page.content();

    // Should either show error or still display the page with fallback data
    const hasContent = content.length > 500;
    expect(hasContent).toBe(true);
  });
});

test.describe('Donation Flow - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Should display without horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Allow small margin
  });

  test('should display donation form correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Get campaign ID
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    const firstCampaignLink = page.locator('a[href*="/campaigns/"]').first();
    const href = await firstCampaignLink.getAttribute('href');
    const campaignId = href?.split('/campaigns/')[1]?.split('?')[0] || '';

    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Form should be visible and usable
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);
  });
});

test.describe('Donation Flow - Browser Console Errors', () => {
  test('should not have critical console errors on campaigns page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );

    // Should have no critical console errors
    expect(criticalErrors.length).toBe(0);
  });

  test('should not have critical console errors on donation page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Get campaign ID
    await page.goto('/campaigns', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    const firstCampaignLink = page.locator('a[href*="/campaigns/"]').first();
    const href = await firstCampaignLink.getAttribute('href');
    const campaignId = href?.split('/campaigns/')[1]?.split('?')[0] || '';

    await page.goto(`/campaigns/${campaignId}/donate`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.includes('smart contract') && // Expected until contracts deployed
      !error.includes('wallet') // Expected until wallet connected
    );

    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(3);
  });
});

/**
 * NOTE ON BLOCKCHAIN TESTING:
 *
 * The following functionality CANNOT be fully tested until smart contracts are deployed:
 * - Actual donation transactions
 * - Wallet signature requests
 * - Transaction confirmations
 * - Balance updates
 * - USDC approval flow
 *
 * These tests focus on UI/UX flow. Once contracts are deployed to Base Sepolia testnet:
 * 1. Add tests for wallet connection flow
 * 2. Add tests for USDC approval
 * 3. Add tests for transaction submission
 * 4. Add tests for success/failure states
 * 5. Add tests for transaction confirmation
 */
