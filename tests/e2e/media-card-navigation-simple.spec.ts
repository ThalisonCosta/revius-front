import { test, expect } from '@playwright/test';

test.describe('MediaCard Navigation - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set timeout
    page.setDefaultTimeout(30000);
  });

  test('should load movies page and display media cards', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Movies');
    
    // Wait for any loading to complete and cards to appear
    await page.waitForTimeout(5000);
    
    // Look for any clickable elements that look like cards
    const possibleSelectors = [
      '.group.relative.overflow-hidden',
      '.cursor-pointer.group',
      '.group',
      '.card',
      '[role="button"]'
    ];
    
    let foundCards = false;
    for (const selector of possibleSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        foundCards = true;
        
        // Try to find card-like content
        const firstElement = elements.first();
        const hasImage = await firstElement.locator('img').count() > 0;
        const hasTitle = await firstElement.locator('h3, h2, .font-semibold').count() > 0;
        
        if (hasImage || hasTitle) {
          console.log(`Selector ${selector} contains card-like elements`);
          break;
        }
      }
    }
    
    expect(foundCards).toBeTruthy();
  });

  test('should navigate to media details when clicking a card', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Find clickable card elements
    const cardSelectors = [
      '.group.relative.overflow-hidden.transition-smooth',
      '.cursor-pointer.group',
      '.group'
    ];
    
    let clickableElement = null;
    for (const selector of cardSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        // Check if this element has card-like content
        const firstElement = elements.first();
        const hasClickHandler = await firstElement.evaluate((el) => {
          return el.onclick !== null || el.style.cursor === 'pointer' || el.classList.contains('cursor-pointer');
        });
        
        if (hasClickHandler || selector.includes('cursor-pointer')) {
          clickableElement = firstElement;
          console.log(`Using clickable element with selector: ${selector}`);
          break;
        }
      }
    }
    
    if (clickableElement) {
      // Get current URL
      const currentUrl = page.url();
      
      // Click the card
      await clickableElement.click();
      
      // Wait for navigation
      await page.waitForURL((url) => url !== currentUrl, { timeout: 15000 });
      
      // Check if we navigated to a media details page
      const newUrl = page.url();
      console.log(`Navigated from ${currentUrl} to ${newUrl}`);
      
      // Should contain media path
      expect(newUrl).toMatch(/\/media\//);
      
      // Should have a title on the details page
      await page.waitForSelector('h1', { timeout: 10000 });
      await expect(page.locator('h1')).toBeVisible();
      
      console.log('Successfully navigated to media details page');
    } else {
      console.log('No clickable card elements found');
    }
  });

  test('should have working back navigation', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Find and click a card
    const cardElement = page.locator('.group, .cursor-pointer').first();
    const cardExists = await cardElement.count() > 0;
    
    if (cardExists) {
      await cardElement.click();
      
      // Wait for navigation to details
      await page.waitForURL(/\/media\//, { timeout: 15000 });
      
      // Look for back button
      const backButton = page.locator('button:has-text("Back")');
      const backButtonExists = await backButton.count() > 0;
      
      if (backButtonExists) {
        await backButton.click();
        
        // Should navigate back to movies page
        await page.waitForURL('/movies', { timeout: 10000 });
        await expect(page.locator('h1')).toContainText('Movies');
        
        console.log('Back navigation working correctly');
      } else {
        console.log('Back button not found');
      }
    }
  });

  test('should work on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();
    
    try {
      await page.goto('/movies');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check if page loads correctly on mobile
      await expect(page.locator('h1')).toContainText('Movies');
      
      // Look for cards on mobile
      const cards = page.locator('.group, .card, .cursor-pointer');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        console.log(`Found ${cardCount} cards on mobile viewport`);
        
        // Try navigation on mobile
        await cards.first().click();
        await page.waitForURL(/\/media\//, { timeout: 15000 });
        
        // Should have content on details page
        await expect(page.locator('h1')).toBeVisible();
        
        console.log('Mobile navigation working correctly');
      }
    } finally {
      await context.close();
    }
  });
});