import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  username: 'testuser'
};

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean state
    await page.goto('/');
  });

  test('should handle normal login and profile access', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/login');

    // Fill login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await expect(page).toHaveURL('/');
    
    // Verify user is logged in (check for profile link in navbar)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    
    // Verify profile page loads without infinite loop
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
  });

  test('should handle page reload on profile page without infinite loop', async ({ page }) => {
    // First, login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Navigate to profile
    await expect(page).toHaveURL('/');
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');
    
    // Wait for profile to load fully
    await expect(page.locator('text=Statistics')).toBeVisible();
    
    // THE CRITICAL TEST: Reload the page
    await page.reload();
    
    // Verify profile still loads without infinite loop
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    
    // Verify no infinite loading states
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle external redirect and return to profile', async ({ page }) => {
    // First, login and go to profile
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');
    
    // Simulate external redirect (like Stripe) by navigating away
    await page.goto('https://www.google.com');
    await expect(page).toHaveURL('https://www.google.com/');
    
    // Return to the application (simulating return from Stripe)
    await page.goto('http://localhost:8081/profile');
    
    // THE CRITICAL TEST: Verify profile loads without infinite loop
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    
    // Verify no infinite loading states
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle session restoration after browser restart simulation', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    // Close page and create a new one (simulates browser restart but keeps storage)
    await page.close();
    const newPage = await context.newPage();
    
    // Try to access profile directly
    await newPage.goto('/profile');
    
    // Should either load profile or redirect to login gracefully (no infinite loop)
    const finalUrl = newPage.url();
    
    if (finalUrl.includes('/profile')) {
      // Profile loaded - verify it works
      await expect(newPage.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
      await expect(newPage.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
    } else if (finalUrl.includes('/login')) {
      // Redirected to login - that's also acceptable
      await expect(newPage.locator('text=Welcome Back')).toBeVisible();
    } else {
      throw new Error(`Unexpected URL: ${finalUrl}`);
    }
  });

  test('should handle rapid navigation to profile page', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    // Rapidly navigate to profile multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/profile');
      await page.goto('/');
      await page.goto('/profile');
    }
    
    // Final navigation should work without infinite loop
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle authentication state during loading interruptions', async ({ page }) => {
    // Start login process
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit and immediately navigate away (interrupt login process)
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForTimeout(100), // Small delay
      page.goto('/profile') // Try to go to profile during login
    ]);
    
    // Should either be at profile (if login completed) or login page
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    if (currentUrl.includes('/profile')) {
      await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    } else if (currentUrl.includes('/login')) {
      await expect(page.locator('text=Welcome Back')).toBeVisible();
    }
    
    // No infinite loading
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile Page Stability', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should handle multiple profile data fetches without loops', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');
    
    // Wait for initial load
    await expect(page.locator('text=Statistics')).toBeVisible();
    
    // Trigger multiple navigations that might cause re-fetching
    await page.goto('/');
    await page.goto('/profile');
    await page.goto('/movies');
    await page.goto('/profile');
    
    // Should still work without infinite loading
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle network delays gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/users', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.continue();
    });
    
    await page.goto('/profile');
    
    // Should show loading state initially
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Then show content after delay
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 20000 });
    
    // Loading state should disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });
});