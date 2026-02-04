import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be loaded
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded
    expect(page.url()).toContain('localhost');
  });

  test('should have correct title', async ({ page }) => {
    await page.goto('/');
    
    // Update this based on your actual page title
    await expect(page).toHaveTitle(/Dieter HQ/i);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Add navigation tests based on your app structure
    // Example:
    // await page.click('a[href="/chat"]');
    // await expect(page).toHaveURL(/\/chat/);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('localhost');
  });
});
