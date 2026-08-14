import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __store__: any;
  }
}

test.beforeEach(async ({ page }) => {
  // Clear local storage and navigate to home before each test to have a clean slate
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  // Set window size to ensure consistent bounding box calculations
  await page.setViewportSize({ width: 1280, height: 800 });

  // Wait for store to be loaded and initial data to be fetched
  await page.waitForFunction(() => {
    return window.__store__ && window.__store__.getState().requirements.length > 0;
  }, { timeout: 10000 });
});

test.describe('Spotlight Tour (Timing & Modals)', () => {
  test('TC 1.1: Tour-Wartezeit bei Animationen in Phase 4', async ({ page }) => {
    // 1. Enter System Name on Setup
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    
    // 2. Programmatically skip to step 4 (Szenarien) to start the tour there
    await page.evaluate(() => {
      const store = window.__store__.getState();
      store.setHasSeenScenarioTutorial(true);
      store.setStep(4);
    });
    
    // Wait for the scenario page to mount and the intro card to render
    await expect(page.locator('[data-tour="tour-step4-intro-card"]')).toBeVisible();
    
    // 3. Start the Tour
    await page.click('button:has(svg.lucide-sparkles)');
    
    // Tour Step 0 (Title / Intro) should show up in center
    await expect(page.locator('text=Phase 3: Risiko-Szenarien')).toBeVisible();
    await page.click('button:has-text("Weiter")');
    
    // Tour Step 1 (Intro Card explanation) should show up highlighting the intro card
    await expect(page.locator('text=Themenblöcke')).toBeVisible();
    
    // 4. Click "Weiter" to trigger transition to sliders
    await page.click('button:has-text("Weiter")');

    // Wait for the scenario options to mount and the tour tooltip to update
    await expect(page.locator('text=Entscheidungen treffen')).toBeVisible();

    // Click "Weiter" again to go to the sliders
    await page.click('button:has-text("Weiter")');
    
    // The tour should trigger the mock logic, transition to the scenario view, open the sliders, 
    // and wait (polling) for the sliders to mount and fade in.
    // Check that the spotlight highlights the sliders
    await expect(page.locator('text=Szenarien bewerten')).toBeVisible();
    
    // Ensure the slider component itself is highlighted
    const glow = page.locator('.fixed.border-2.border-primary\\/50');
    await expect(glow).toBeVisible();
  });

  test('TC 1.2: Überschneidung mit Tutorial-Modals in Phase 4', async ({ page }) => {
    // 1. Setup
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    
    // 2. Programmatically set step 4 and ensure hasSeenScenarioTutorial is false
    await page.evaluate(() => {
      const store = window.__store__.getState();
      store.setHasSeenScenarioTutorial(false);
      store.setStep(4);
    });
    
    // Click the tour button
    await page.click('button:has(svg.lucide-sparkles)');
    
    // The tour starts normally, showing step 0
    await expect(page.locator('text=Phase 3: Risiko-Szenarien')).toBeVisible();
    
    // Verify the tutorial modal is dismissed and not blocking
    const tutorialModal = page.locator('text=Willkommen bei den Risiko-Szenarien');
    await expect(tutorialModal).not.toBeVisible();
  });
});

test.describe('Decision Trees (Phase 2)', () => {
  test('TC 2.1: Intro-Card & Tree-Mounting', async ({ page }) => {
    // 1. Setup
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    
    // 2. Dismiss tree tutorial modal so it doesn't cover UI
    await page.evaluate(() => {
      window.__store__.getState().setHasSeenTreeTutorial(true);
    });

    // 3. We should be on step 2, showing the Intro Card
    await expect(page.locator('[data-tour="tour-step2-intro-card"]')).toBeVisible();
    
    // 4. Click start tree button
    await page.click('button:has-text("Evaluierung starten")');
    
    // 5. Intro Card should disappear and the interactive tree should mount
    await expect(page.locator('[data-tour="tour-step2-intro-card"]')).not.toBeVisible();
    await expect(page.locator('[data-tour="tour-step2-trees"]')).toBeVisible();
  });

  test('TC 2.2: Interaktive Bewertung & State', async ({ page }) => {
    // 1. Setup & Navigate to tree
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    
    await page.evaluate(() => {
      window.__store__.getState().setHasSeenTreeTutorial(true);
    });

    await page.click('button:has-text("Evaluierung starten")');
    
    // Wait for the intro card exit animation and tree mounting to finish
    await expect(page.locator('[data-tour="tour-step2-intro-card"]')).not.toBeVisible();
    await page.waitForTimeout(500); // Settle animation
    
    // 2. Select option on active node (left click)
    // Click the first option button inside the active node's options container.
    const firstOption = page.locator('[data-tour="tour-step2-trees"] .grid-cols-2 button').first();
    await firstOption.click();
    
    // 3. The floating evaluation modal should open
    await expect(page.locator('[data-tour="tour-eval-sliders"]')).toBeVisible();
    
    // 4. Set Business Value and Tech Risk (requires dispatching pointerdown)
    const bvSlider = page.locator('[data-tour="tour-eval-sliders"] input[type="range"]').nth(0);
    const trSlider = page.locator('[data-tour="tour-eval-sliders"] input[type="range"]').nth(1);
    
    await bvSlider.focus();
    await bvSlider.dispatchEvent('pointerdown');
    await bvSlider.fill('8');
    
    await trSlider.focus();
    await trSlider.dispatchEvent('pointerdown');
    await trSlider.fill('3');
    
    // 5. Submit the evaluation
    await page.click('button:has-text("Speichern & Weiter")');
    
    // 6. The modal should close
    await expect(page.locator('[data-tour="tour-eval-sliders"]')).not.toBeVisible();
  });
});

test.describe('Risk Scenarios (Phase 4)', () => {
  test('TC 3.1: Chapter-Navigation', async ({ page }) => {
    // 1. Setup
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    await page.evaluate(() => {
      const store = window.__store__.getState();
      store.setHasSeenScenarioTutorial(true);
      store.setStep(4);
    });
    
    // 2. Chapter Intro Card should be visible
    await expect(page.locator('[data-tour="tour-step4-intro-card"]')).toBeVisible();
    
    // 3. Click next chapter in stepper
    // Select by position rather than hardcoded text
    const secondChapterBtn = page.locator('.custom-scrollbar button').nth(1);
    await secondChapterBtn.click();
    
    // Intro card should show Block 2 details
    await expect(page.locator('text=Block 2:')).toBeVisible();
  });

  test('TC 3.2: Szenario-Bewertung & TC 3.3: Kontext-Bearbeitung', async ({ page }) => {
    // 1. Setup
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    await page.evaluate(() => {
      const store = window.__store__.getState();
      store.setHasSeenScenarioTutorial(true);
      store.setStep(4);
    });
    
    // Start the block
    await page.click('button:has-text("Block starten")');
    
    // 2. Click "Kontext bearbeiten"
    await page.click('button:has-text("Kontext hinzufügen")');
    // Fill the first textarea
    await page.fill('textarea', 'Unternehmen verwendet bereits AWS.');
    await page.click('button:has-text("Speichern")');
    
    // Verify context is displayed
    await expect(page.locator('text=Unternehmen verwendet bereits AWS.')).toBeVisible();
    
    // 3. Select first option
    await page.locator('h5').first().click();
    
    // 4. Sliders should show up
    await expect(page.locator('[data-tour="tour-eval-sliders"]')).toBeVisible();
  });
});

test.describe('Conflict Resolver & Ground Truth (Phase 7)', () => {
  test('TC 4.1: Ground Truth Toggle & TC 4.2: Filter', async ({ page }) => {
    // 1. Setup
    await page.fill('[data-tour="tour-step1-input"]', 'Test System');
    await page.click('button:has-text("Soll-Architektur")');
    await page.click('[data-tour="tour-step1-next"]');
    
    // 2. Programmatically mock selections to generate conflicts and enter step 7
    await page.evaluate(() => {
      const store = window.__store__.getState();
      const reqs = store.requirements;
      // Find two requirements in the same exclusive group
      const groups = store.groups.filter((g: any) => g.type === 'exclusive');
      for (const g of groups) {
        const groupReqs = reqs.filter((r: any) => r.groupId === g.id);
        if (groupReqs.length >= 2) {
          // Set one as sovereignty selection, one as scenario selection
          store.selectedSovereigntyReqs[groupReqs[0].uid] = 8;
          store.selectedScenarioReqs[groupReqs[1].uid] = 3;
          store.selectedRequirements[groupReqs[0].uid] = 8;
          store.selectedRequirements[groupReqs[1].uid] = 3;
          break;
        }
      }
      store.setStep(7);
    });
    
    // We should be in Phase 7 now
    await expect(page.locator('[data-tour="tour-step7-req-matrix-overview"]')).toBeVisible();
    
    // Click on the first matrix cell to open details
    // Under ReqMatrix, the first cell contains 'tour-step7-matrix-cell'
    await page.locator('[data-tour="tour-step7-matrix-cell"]').first().click();
    
    // Toggle the Ground Truth slider
    // Sibling selector selects the button right next to the 'AI Best Guess' span
    const gtToggleBtn = page.locator('span:has-text("AI Best Guess") + button');
    await gtToggleBtn.click();
    
    // The Ground Truth editor text area should be visible
    await expect(page.locator('textarea')).toBeVisible();
  });
});
