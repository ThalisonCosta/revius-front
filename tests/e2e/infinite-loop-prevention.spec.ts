import { test, expect } from '@playwright/test';

test.describe('Infinite Loop Prevention Tests', () => {
  test('should not get stuck in infinite loop when accessing profile without login', async ({ page }) => {
    // Try to access profile page directly without login
    await page.goto('/profile');
    
    // Should redirect to login instead of infinite loop
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // Verify no infinite loading spinners
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle page reload on profile URL without authentication gracefully', async ({ page }) => {
    // Go directly to profile URL
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Reload the page to test session restoration
    await page.reload();
    
    // Should still be at login, not in an infinite loop
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // Verify no infinite loading
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle rapid navigation to protected routes gracefully', async ({ page }) => {
    // Rapidly navigate to profile multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto('/profile');
      await page.goto('/');
      await page.goto('/profile');
    }
    
    // Should end up at login (redirected from profile)
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // No infinite loading states
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle external redirect and return to profile URL gracefully', async ({ page }) => {
    // Start at profile URL (should redirect to login)
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
    
    // Simulate external redirect (like Stripe)
    await page.goto('https://www.google.com');
    await expect(page).toHaveURL('https://www.google.com/');
    
    // Return to profile URL (simulating return from Stripe)
    await page.goto('http://localhost:8081/profile');
    
    // Should redirect to login gracefully, not infinite loop
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // No infinite loading
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle authentication state changes without infinite renders', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Navigate to profile (should redirect to login)
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
    
    // Navigate back to home
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Navigate to profile again (should redirect to login again)
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
    
    // Verify stable behavior - no infinite loading
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should maintain stable authentication state during session restoration', async ({ page, context }) => {
    // Go to profile (redirects to login)
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
    
    // Close page and create new one (simulates browser restart)
    await page.close();
    const newPage = await context.newPage();
    
    // Try profile again
    await newPage.goto('/profile');
    
    // Should still redirect to login gracefully
    await expect(newPage).toHaveURL('/login');
    await expect(newPage.locator('text=Welcome Back')).toBeVisible();
    
    // No infinite loading
    await expect(newPage.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle interrupted navigation gracefully', async ({ page }) => {
    // Start navigation to profile
    const profilePromise = page.goto('/profile');
    
    // Immediately navigate elsewhere
    await page.goto('/');
    
    // Wait for profile navigation to complete
    await profilePromise;
    
    // Should be at home page (last navigation wins)
    await expect(page).toHaveURL('/');
    
    // Try profile again
    await page.goto('/profile');
    await expect(page).toHaveURL('/login');
    
    // No infinite states
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Application Stability Tests', () => {
  test('should handle basic navigation without authentication', async ({ page }) => {
    // Test basic navigation works
    await page.goto('/');
    await expect(page.locator('text=Revius')).toBeVisible();
    
    await page.goto('/movies');
    await expect(page).toHaveURL('/movies');
    
    await page.goto('/tv-shows');
    await expect(page).toHaveURL('/tv-shows');
    
    await page.goto('/anime');
    await expect(page).toHaveURL('/anime');
    
    // All should work without infinite loading
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle login page access and navigation', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // Navigate away and back
    await page.goto('/');
    await page.goto('/login');
    
    // Should still work
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    
    // No loading issues
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });
});