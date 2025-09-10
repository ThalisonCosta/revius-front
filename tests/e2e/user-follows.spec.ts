import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  username: 'testuser'
};

test.describe('User Follows Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean state and login
    await page.goto('/');
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/login');
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
  });

  test('should be able to access profile page without permission errors', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    
    // Verify profile page loads without permission errors
    await expect(page).toHaveURL('/profile');
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    
    // Check browser console for permission errors
    const logs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('permission denied')) {
        logs.push(msg.text());
      }
    });
    
    // Wait a bit to allow any async calls to complete
    await page.waitForTimeout(5000);
    
    // Should not have any permission denied errors
    expect(logs.length).toBe(0);
  });

  test('should handle user follows API calls without errors', async ({ page }) => {
    // Monitor network requests for user_follows endpoints
    const apiCalls = [];
    const apiErrors = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/user_follows')) {
        apiCalls.push({
          url,
          status: response.status(),
          statusText: response.statusText()
        });
        
        if (!response.ok()) {
          try {
            const errorText = await response.text();
            apiErrors.push({
              url,
              status: response.status(),
              error: errorText
            });
          } catch (e) {
            apiErrors.push({
              url,
              status: response.status(),
              error: 'Could not read response'
            });
          }
        }
      }
    });

    // Navigate to profile page (this should trigger user_follows API calls)
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');
    
    // Wait for the page to fully load and all API calls to complete
    await page.waitForTimeout(10000);
    
    // Log the API calls for debugging
    console.log('User follows API calls:', apiCalls);
    
    // Should not have any 42501 (permission denied) errors
    const permissionErrors = apiErrors.filter(error => 
      error.error.includes('42501') || 
      error.error.includes('permission denied') ||
      error.error.includes('permission denied for table users')
    );
    
    console.log('Permission errors found:', permissionErrors);
    expect(permissionErrors.length).toBe(0);
    
    // Should have made some user_follows API calls
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('should display user follows data correctly', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');
    
    // Wait for profile to load
    await expect(page.locator('text=Statistics')).toBeVisible({ timeout: 15000 });
    
    // Check if follows/followers sections are visible and don't show error states
    // Note: Even if the user has no follows, the sections should render without errors
    await page.waitForTimeout(5000);
    
    // The page should not be stuck in a loading state
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
    
    // Look for any error messages in the UI
    const errorMessages = page.locator('text=/error|Error|permission denied/i');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBe(0);
  });
});