import { test, expect } from '@playwright/test';

test.describe('Matrix Wizard Baseline E2E', () => {
  test('should navigate from Step 1 to Step 2', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Ensure the page has loaded
    await expect(page).toHaveTitle(/Sovereignty/i);

    // Wait for the Step 1 input to be visible (using data-tour attribute)
    const input = page.locator('[data-tour="tour-step1-input"]');
    await expect(input).toBeVisible();

    // Type a mock company name
    await input.fill('Playwright Test Company');

    // Select evaluation goal
    await page.click('button:has-text("Soll-Architektur")');

    // Find the next button and click it
    const nextButton = page.locator('[data-tour="tour-step1-next"]');
    await expect(nextButton).toBeVisible();
    await nextButton.click();

    // Assert that we have navigated to Step 2
    // We can check if the Step 2 intro card is visible or URL changes
    const step2Intro = page.locator('[data-tour="tour-step2-intro-card"]');
    await expect(step2Intro).toBeVisible({ timeout: 10000 });
  });
});
