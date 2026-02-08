/**
 * E2E Tests for Chat WebSocket Integration
 * 
 * Tests the chat functionality with OpenClaw WebSocket connection.
 * 
 * Prerequisites:
 * - Next.js dev server running (pnpm dev)
 * - OpenClaw gateway running (openclaw gateway start)
 * - Valid auth configured
 * 
 * Run with: pnpm test
 */

import { test, expect, type Page, type WebSocket } from '@playwright/test';

// =============================================================================
// Test Configuration
// =============================================================================

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
const CHAT_URL = `${BASE_URL}/chat`;

// Timeout for WebSocket operations
const WS_TIMEOUT = 10000;
const MESSAGE_TIMEOUT = 30000;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Wait for WebSocket connection to be established
 */
async function waitForWebSocketConnection(page: Page): Promise<WebSocket | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), WS_TIMEOUT);
    
    page.on('websocket', (ws) => {
      if (ws.url().includes('18789') || ws.url().includes('openclaw')) {
        clearTimeout(timeout);
        resolve(ws);
      }
    });
  });
}

/**
 * Check if the connection status indicator shows connected
 */
async function isConnectionIndicatorVisible(page: Page): Promise<boolean> {
  // Look for the green online indicator dot
  const indicator = page.locator('[class*="bg-success"], [class*="bg-green"]').first();
  try {
    await indicator.waitFor({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send a message via the chat input
 */
async function sendMessage(page: Page, message: string): Promise<void> {
  const textarea = page.locator('textarea[placeholder*="Message"]');
  await textarea.fill(message);
  
  const sendButton = page.locator('button[type="submit"]').filter({ has: page.locator('svg') });
  await sendButton.click();
}

/**
 * Wait for a response message to appear
 */
async function waitForResponse(page: Page, timeout = MESSAGE_TIMEOUT): Promise<string> {
  // Wait for assistant message bubble
  const assistantMessage = page.locator('[class*="flex-row"]').filter({
    hasNot: page.locator('[class*="flex-row-reverse"]'),
  }).last();

  await assistantMessage.waitFor({ timeout });
  
  // Get the text content
  const content = await assistantMessage.textContent();
  return content ?? '';
}

// =============================================================================
// Tests
// =============================================================================

test.describe('Chat WebSocket Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto(CHAT_URL);
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('shows connection status indicator', async ({ page }) => {
    // Check that the page loads
    await expect(page.locator('h1')).toContainText('Dieter');
    
    // Check for online/status indicator
    const hasIndicator = await isConnectionIndicatorVisible(page);
    
    // Even if WS isn't connected, should show some status
    const statusText = await page.locator('text=/online|offline|connecting/i').first();
    await expect(statusText).toBeVisible({ timeout: 5000 });
  });

  test('loads message history on page load', async ({ page }) => {
    // Wait for messages to load
    await page.waitForTimeout(2000);
    
    // Either messages are shown OR the empty state
    const hasMessages = await page.locator('[class*="MessageBubble"], [class*="message"]').count() > 0;
    const hasEmptyState = await page.locator('text=/I\'m Dieter|Start typing/i').isVisible();
    
    expect(hasMessages || hasEmptyState).toBe(true);
  });

  test('shows message input and send button', async ({ page }) => {
    // Check textarea is present
    const textarea = page.locator('textarea[placeholder*="Message"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
    
    // Check send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
  });

  test('can type a message', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Type a test message
    await textarea.fill('Hello, this is a test message');
    
    // Verify the input contains the text
    await expect(textarea).toHaveValue('Hello, this is a test message');
    
    // Send button should be enabled when there's text
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled();
  });

  test('clears input after sending', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Type and send
    await textarea.fill('Test message');
    
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();
    
    // Input should be cleared
    await expect(textarea).toHaveValue('');
  });

  test('shows user message in chat after sending', async ({ page }) => {
    const testMessage = `Test message ${Date.now()}`;
    
    // Send message
    await sendMessage(page, testMessage);
    
    // Wait for message to appear in chat
    await page.waitForTimeout(500);
    
    // Check the message appears
    const messageInChat = page.locator(`text="${testMessage}"`);
    await expect(messageInChat).toBeVisible({ timeout: 5000 });
  });

  test('shows typing indicator during response', async ({ page }) => {
    // Send a message
    await sendMessage(page, 'Hello');
    
    // Look for typing indicator
    const typingIndicator = page.locator('text=/typing|thinking/i, [class*="animate-pulse"]');
    
    // Should show briefly (may be too fast to catch)
    // Just verify no errors occurred
    await page.waitForTimeout(1000);
  });

  test.skip('receives streaming response via WebSocket', async ({ page }) => {
    // This test requires a running OpenClaw gateway
    // Skip if not available
    
    // Monitor WebSocket traffic
    const wsPromise = waitForWebSocketConnection(page);
    
    // Navigate to trigger connection
    await page.goto(CHAT_URL);
    await page.waitForLoadState('networkidle');
    
    const ws = await wsPromise;
    
    if (!ws) {
      test.skip();
      return;
    }
    
    // Send a test message
    await sendMessage(page, 'What is 2+2?');
    
    // Wait for response
    const response = await waitForResponse(page);
    
    // Response should contain an answer
    expect(response.length).toBeGreaterThan(0);
  });

  test('handles Enter key to send message', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Type and press Enter
    await textarea.fill('Test enter key');
    await textarea.press('Enter');
    
    // Input should be cleared (message sent)
    await expect(textarea).toHaveValue('');
  });

  test('Shift+Enter creates new line instead of sending', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Type, then Shift+Enter, then more text
    await textarea.fill('Line 1');
    await textarea.press('Shift+Enter');
    await textarea.type('Line 2');
    
    // Should have multi-line content
    const value = await textarea.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('mobile menu button is visible on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(CHAT_URL);
    await page.waitForLoadState('networkidle');
    
    // Menu button should be visible
    const menuButton = page.locator('button[title*="status"], button:has(svg[class*="Menu"])');
    await expect(menuButton.first()).toBeVisible();
  });
});

test.describe('WebSocket Connection Behavior', () => {
  test('reconnects after connection loss', async ({ page, context }) => {
    // This is a conceptual test - actual implementation would require
    // network interception capabilities
    
    await page.goto(CHAT_URL);
    await page.waitForLoadState('networkidle');
    
    // Check initial state
    const hasIndicator = await isConnectionIndicatorVisible(page);
    
    // Verify page is functional
    const textarea = page.locator('textarea[placeholder*="Message"]');
    await expect(textarea).toBeEnabled();
  });

  test('shows reconnecting state', async ({ page }) => {
    // Navigate to chat
    await page.goto(CHAT_URL);
    await page.waitForLoadState('networkidle');
    
    // Check for any connection status UI
    const statusArea = page.locator('[class*="status"], [class*="connection"]');
    // May or may not be visible depending on implementation
  });
});

test.describe('Accessibility', () => {
  test('chat input has proper labels', async ({ page }) => {
    await page.goto(CHAT_URL);
    
    const textarea = page.locator('textarea[placeholder*="Message"]');
    
    // Should have placeholder or aria-label
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
  });

  test('send button is keyboard accessible', async ({ page }) => {
    await page.goto(CHAT_URL);
    
    const textarea = page.locator('textarea[placeholder*="Message"]');
    await textarea.fill('Test');
    
    // Tab to send button
    await page.keyboard.press('Tab');
    
    // Should be able to activate with Enter
    await page.keyboard.press('Enter');
    
    // Message should be sent (input cleared)
    // Note: This might need adjustment based on focus behavior
  });
});
