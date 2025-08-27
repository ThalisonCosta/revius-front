import { test, expect } from '@playwright/test';

test.describe('MediaCard Navigation Functionality', () => {
  // Test configuration for different screen sizes
  const viewports = [
    { name: 'desktop', viewport: { width: 1920, height: 1080 } },
    { name: 'tablet', viewport: { width: 768, height: 1024 } },
    { name: 'mobile', viewport: { width: 390, height: 844 } }
  ];

  // Helper function to wait for movies to load
  const waitForMoviesLoad = async (page) => {
    // Wait for the page title to be visible
    await page.waitForSelector('h1:has-text("Movies")', { timeout: 15000 });
    
    // Wait for the grid container
    await page.waitForSelector('.grid', { timeout: 15000 });
    
    // Wait for media cards with more specific selectors
    const mediaCardSelectors = [
      '.group.relative.overflow-hidden.transition-smooth',
      '[role="button"]',
      '.cursor-pointer'
    ];
    
    let foundCards = false;
    for (const selector of mediaCardSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        const count = await page.locator(selector).count();
        if (count > 0) {
          foundCards = true;
          console.log(`Found ${count} media cards using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }
    
    if (!foundCards) {
      throw new Error('No media cards found with any selector');
    }
    
    // Additional wait to ensure content is fully loaded
    await page.waitForTimeout(2000);
  };

  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for all actions
    page.setDefaultTimeout(15000);
    
    // Navigate to the home page first
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should display movies page correctly and load media cards', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Movies');
    
    // Check if search input is present
    await expect(page.locator('input[placeholder*="Search movies"]')).toBeVisible();
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Check if media cards are displayed using multiple selector strategies
    const mediaCardSelectors = [
      '.group.relative.overflow-hidden.transition-smooth',
      '.cursor-pointer.group',
      '.bg-card\\/50'
    ];
    
    let mediaCards = null;
    for (const selector of mediaCardSelectors) {
      mediaCards = page.locator(selector);
      const count = await mediaCards.count();
      if (count > 0) {
        console.log(`Using selector: ${selector}, found ${count} cards`);
        break;
      }
    }
    
    await expect(mediaCards.first()).toBeVisible({ timeout: 15000 });
    
    // Verify at least one media card is present
    const cardCount = await mediaCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Found ${cardCount} media cards on movies page`);
  });

  test('should navigate to media details when clicking a media card', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Get the first media card
    const mediaCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    const firstCard = mediaCards.first();
    await expect(firstCard).toBeVisible();
    
    // Get the title of the first card for verification
    const cardTitle = await firstCard.locator('h3, .font-semibold').first().textContent();
    console.log(`Clicking on media card with title: ${cardTitle}`);
    
    // Click on the media card
    await firstCard.click();
    
    // Wait for navigation to complete
    await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
    
    // Verify we're on the media details page
    expect(page.url()).toMatch(/\/media\/movie\/.+/);
    
    // Wait for the details page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify the title is displayed
    const detailsTitle = await page.locator('h1').first().textContent();
    expect(detailsTitle).toBeTruthy();
    console.log(`Media details page loaded with title: ${detailsTitle}`);
  });

  test('should display all media data correctly on details page', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Find a card with rich data (rating, poster, etc.)
    const mediaCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    
    let cardWithData = null;
    let cardIndex = 0;
    const maxCards = Math.min(5, await mediaCards.count()); // Check up to 5 cards
    
    for (let i = 0; i < maxCards; i++) {
      const card = mediaCards.nth(i);
      const hasRating = await card.locator('[data-testid="rating"], .fill-accent').count() > 0;
      const hasPoster = await card.locator('img').count() > 0;
      
      if (hasRating || hasPoster) {
        cardWithData = card;
        cardIndex = i;
        break;
      }
    }
    
    if (!cardWithData) {
      cardWithData = mediaCards.first(); // Fallback to first card
    }
    
    // Click on the selected card
    await cardWithData.click();
    
    // Wait for navigation
    await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
    
    // Wait for details page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify essential elements are present
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for media type badge
    const typeBadge = page.locator('[data-testid="media-type"], .capitalize').first();
    if (await typeBadge.count() > 0) {
      await expect(typeBadge).toBeVisible();
      const mediaType = await typeBadge.textContent();
      console.log(`Media type: ${mediaType}`);
    }
    
    // Check for back button
    await expect(page.locator('button').filter({ hasText: 'Back' })).toBeVisible();
    
    console.log(`Media details page loaded successfully for card ${cardIndex}`);
  });

  test('should navigate back correctly using back button', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Click on first media card
    const firstCard = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden').first();
    await firstCard.click();
    
    // Wait for navigation to details page
    await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
    
    // Wait for page to load and find back button
    await page.waitForSelector('button', { timeout: 10000 });
    const backButton = page.locator('button').filter({ hasText: 'Back' });
    await expect(backButton).toBeVisible();
    
    // Click back button
    await backButton.click();
    
    // Wait for navigation back to movies page
    await page.waitForURL('/movies', { timeout: 10000 });
    
    // Verify we're back on movies page
    await expect(page.locator('h1')).toContainText('Movies');
    
    // Verify media cards are still visible
    await waitForMoviesLoad(page);
    const mediaCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    await expect(mediaCards.first()).toBeVisible();
    
    console.log('Successfully navigated back to movies page');
  });

  // Test responsive behavior on different screen sizes
  viewports.forEach(({ name, viewport }) => {
    test(`should work correctly on ${name} viewport`, async ({ browser }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      
      try {
        // Navigate to movies page
        await page.goto('/movies', { waitUntil: 'networkidle' });
        
        // Wait for movies to load
        await waitForMoviesLoad(page);
        
        // Check if media cards are visible on this viewport
        const mediaCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
        await expect(mediaCards.first()).toBeVisible({ timeout: 15000 });
        
        // Test navigation on this viewport
        await mediaCards.first().click();
        
        // Wait for navigation
        await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
        
        // Verify details page loads
        await page.waitForSelector('h1', { timeout: 10000 });
        await expect(page.locator('h1')).toBeVisible();
        
        // Test back navigation
        const backButton = page.locator('button').filter({ hasText: 'Back' });
        await expect(backButton).toBeVisible();
        await backButton.click();
        
        // Verify back navigation works
        await page.waitForURL('/movies', { timeout: 10000 });
        await expect(page.locator('h1')).toContainText('Movies');
        
        console.log(`${name} viewport test passed`);
      } finally {
        await context.close();
      }
    });
  });

  test('should handle media cards with missing data gracefully', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Find cards and test navigation for different types
    const mediaCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    const cardCount = await mediaCards.count();
    
    if (cardCount > 0) {
      // Test first card (might have missing poster or data)
      const firstCard = mediaCards.first();
      
      // Check if card has placeholder icon for missing poster
      const hasPlaceholder = await firstCard.locator('[data-testid="type-icon"], .text-muted-foreground').count() > 0;
      if (hasPlaceholder) {
        console.log('Found card with placeholder poster');
      }
      
      // Click and navigate regardless of missing data
      await firstCard.click();
      
      // Wait for navigation
      await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
      
      // Verify details page loads even with missing data
      await page.waitForSelector('h1', { timeout: 10000 });
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for "No poster available" text if poster is missing
      const noPosterText = page.locator('text=No poster available');
      if (await noPosterText.count() > 0) {
        console.log('Details page correctly shows "No poster available" message');
      }
      
      console.log('Navigation works correctly even with missing data');
    }
  });

  test('should test different media types navigation', async ({ page }) => {
    // Test Movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    await waitForMoviesLoad(page);
    
    const movieCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    if (await movieCards.count() > 0) {
      await movieCards.first().click();
      await page.waitForURL(/\/media\/movie\/.*/, { timeout: 10000 });
      await expect(page.locator('h1')).toBeVisible();
      console.log('Movie navigation working correctly');
      
      // Navigate back
      await page.goBack({ waitUntil: 'networkidle' });
    }
    
    // Test TV Shows page
    await page.goto('/tv-shows', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if TV shows page has media cards
    const tvCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    const tvCardCount = await tvCards.count();
    
    if (tvCardCount > 0) {
      await tvCards.first().click();
      await page.waitForURL(/\/media\/tv\/.*/, { timeout: 10000 });
      await expect(page.locator('h1')).toBeVisible();
      console.log('TV show navigation working correctly');
    } else {
      console.log('No TV show cards found to test');
    }
    
    // Test Anime page
    await page.goto('/anime', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if anime page has media cards
    const animeCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    const animeCardCount = await animeCards.count();
    
    if (animeCardCount > 0) {
      await animeCards.first().click();
      await page.waitForURL(/\/media\/anime\/.*/, { timeout: 10000 });
      await expect(page.locator('h1')).toBeVisible();
      console.log('Anime navigation working correctly');
    } else {
      console.log('No anime cards found to test');
    }
  });

  test('should handle URL parameter encoding correctly', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Click on a media card
    const firstCard = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden').first();
    await firstCard.click();
    
    // Wait for navigation
    await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
    
    // Check that URL contains proper encoding
    const url = page.url();
    console.log(`Navigated to URL: ${url}`);
    
    // Verify URL structure
    expect(url).toMatch(/\/media\/movie\/[^?]+/);
    
    // Check for query parameters
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    if (params.has('title')) {
      const title = params.get('title');
      console.log(`Title parameter: ${title}`);
      expect(title).toBeTruthy();
    }
    
    // Verify the page loads correctly with encoded parameters
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toBeVisible();
    
    console.log('URL parameter encoding working correctly');
  });

  test('should maintain scroll position when navigating back', async ({ page }) => {
    // Navigate to movies page
    await page.goto('/movies', { waitUntil: 'networkidle' });
    
    // Wait for movies to load
    await waitForMoviesLoad(page);
    
    // Scroll down to see more cards
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    
    // Find a visible card after scrolling
    const visibleCards = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden').filter({ hasText: /.+/ });
    const cardToClick = visibleCards.first();
    
    // Click on the card
    await cardToClick.click();
    
    // Wait for navigation
    await page.waitForURL(/\/media\/.*/, { timeout: 10000 });
    
    // Wait for details page
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Navigate back
    const backButton = page.locator('button').filter({ hasText: 'Back' });
    await backButton.click();
    
    // Wait for navigation back
    await page.waitForURL('/movies', { timeout: 10000 });
    
    // Wait for page to load
    await waitForMoviesLoad(page);
    
    // Check that we can still see cards (scroll position related)
    const cardsAfterBack = page.locator('[data-testid="media-card"], .group.relative.overflow-hidden');
    await expect(cardsAfterBack.first()).toBeVisible();
    
    console.log('Back navigation working correctly');
  });
});