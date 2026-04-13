import { test, expect } from '@playwright/test';

/**
 * DIAGNOSTIC TEST: Manual Browser Investigation
 * Purpose: Capture actual browser state, console errors, and screenshots
 */

test.describe('Browser Diagnostic Investigation', () => {
  test('Capture campaigns page state and errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const networkRequests: string[] = [];
    const networkFailures: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Capture network requests
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });

    // Capture network failures
    page.on('requestfailed', request => {
      networkFailures.push(`FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('\n========================================');
    console.log('DIAGNOSTIC: Opening /campaigns page...');
    console.log('========================================\n');

    try {
      // Navigate with a reasonable timeout
      await page.goto('http://localhost:3001/campaigns', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      console.log('✅ Page loaded (domcontentloaded)');

      // Wait a bit for any async operations
      await page.waitForTimeout(5000);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/diagnostic-campaigns-page.png',
        fullPage: true
      });

      console.log('✅ Screenshot captured');

      // Check what's actually rendered
      const pageTitle = await page.title();
      const h1Text = await page.locator('h1').first().textContent().catch(() => null);
      const bodyText = await page.locator('body').textContent().catch(() => '');

      console.log('\n========================================');
      console.log('PAGE CONTENT:');
      console.log('========================================');
      console.log(`Title: ${pageTitle}`);
      console.log(`H1: ${h1Text}`);
      console.log(`Body length: ${bodyText.length} characters`);

      // Check for campaign cards
      const campaignLinks = await page.locator('a[href*="/campaigns/"]').count();
      const campaignCards = await page.locator('[data-testid="campaign-card"]').count();
      const articleElements = await page.locator('article').count();

      console.log('\n========================================');
      console.log('CAMPAIGN CARDS:');
      console.log('========================================');
      console.log(`Campaign links (a[href*="/campaigns/"]): ${campaignLinks}`);
      console.log(`Campaign cards ([data-testid="campaign-card"]): ${campaignCards}`);
      console.log(`Article elements: ${articleElements}`);

      // Network summary
      console.log('\n========================================');
      console.log('NETWORK SUMMARY:');
      console.log('========================================');
      console.log(`Total requests: ${networkRequests.length}`);
      console.log(`Failed requests: ${networkFailures.length}`);

      if (networkFailures.length > 0) {
        console.log('\nFailed requests:');
        networkFailures.forEach(failure => console.log(`  - ${failure}`));
      }

      // GraphQL requests
      const graphqlRequests = networkRequests.filter(r => r.includes('graphql'));
      console.log(`\nGraphQL requests: ${graphqlRequests.length}`);
      graphqlRequests.forEach(req => console.log(`  - ${req}`));

      // Console errors
      console.log('\n========================================');
      console.log('CONSOLE ERRORS:');
      console.log('========================================');
      console.log(`Total console messages: ${consoleMessages.length}`);
      console.log(`Console errors: ${consoleErrors.length}`);

      if (consoleErrors.length > 0) {
        console.log('\nErrors:');
        consoleErrors.forEach((error, idx) => {
          console.log(`  ${idx + 1}. ${error}`);
        });
      }

      // Check for specific elements that should exist
      console.log('\n========================================');
      console.log('EXPECTED ELEMENTS CHECK:');
      console.log('========================================');

      const searchBar = await page.locator('input[type="search"], input[placeholder*="Search"]').count();
      const filterButtons = await page.locator('button').count();
      const images = await page.locator('img').count();

      console.log(`Search bar: ${searchBar}`);
      console.log(`Buttons: ${filterButtons}`);
      console.log(`Images: ${images}`);

      // Log all unique domains being requested
      const domains = new Set(
        networkRequests.map(req => {
          try {
            const url = new URL(req.split(' ')[1]);
            return url.hostname;
          } catch {
            return null;
          }
        }).filter(Boolean)
      );

      console.log('\n========================================');
      console.log('EXTERNAL DOMAINS:');
      console.log('========================================');
      domains.forEach(domain => console.log(`  - ${domain}`));

      console.log('\n========================================');
      console.log('DIAGNOSTIC COMPLETE');
      console.log('========================================\n');

      // The test "passes" so we can see all the diagnostic output
      expect(true).toBe(true);

    } catch (error) {
      console.error('\n❌ ERROR DURING DIAGNOSTIC:');
      console.error(error);

      // Still try to capture screenshot on error
      await page.screenshot({
        path: 'test-results/diagnostic-error.png',
        fullPage: true
      }).catch(() => {});

      throw error;
    }
  });
});
