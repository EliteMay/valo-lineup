const { test, expect } = require('@playwright/test');

const ROOT = 'http://127.0.0.1:4173/';
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M9Qz0AEYBxVSFUAANMABf4M+WQAAAAASUVORK5CYII=',
  'base64'
);

async function openApp(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.route('https://valorant-api.com/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }));
  await page.goto(ROOT, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#libraryMapStage')).toBeVisible();
  await expect(page.locator('#lineupCards')).toBeVisible();
  return { pageErrors, consoleErrors };
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 2);
  expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.innerWidth + 2);
}

async function assertInsideViewport(page, locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + Math.min(box.height, viewport.height)).toBeLessThanOrEqual(viewport.height + 1);
}

test('desktop: create, save, reload and restore a lineup', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const diagnostics = await openApp(page);
  await expect(page.locator('.top-tab[data-tab-target="create"]')).toBeVisible();
  await page.locator('.top-tab[data-tab-target="create"]').click();
  await expect(page.locator('#creatorForm')).toBeVisible();

  const title = `Smoke lineup ${Date.now()}`;
  await page.locator('#creatorTitle').fill(title);

  const mapStage = page.locator('#creatorMapStage');
  await expect(mapStage).toBeVisible();
  const box = await mapStage.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box.x + box.width * 0.30, box.y + box.height * 0.72);
  await page.mouse.click(box.x + box.width * 0.64, box.y + box.height * 0.30);

  await page.locator('input[data-image-key="standing"]').setInputFiles({
    name: 'standing.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });
  await expect(page.locator('[data-image-slot="standing"]')).toHaveClass(/has-image/);

  await page.locator('#creatorForm button[type="submit"]').click();
  await expect(page.locator('#mineGrid')).toContainText(title);

  await page.evaluate(async () => {
    if (window.LineupMediaStore?.pending) await window.LineupMediaStore.pending();
  });

  const saved = await page.evaluate(expectedTitle => {
    const items = JSON.parse(localStorage.getItem('lineupLab.userLineups.v1') || '[]');
    return items.find(item => item.title === expectedTitle) || null;
  }, title);
  expect(saved).not.toBeNull();
  expect(saved.start).toBeTruthy();
  expect(saved.end).toBeTruthy();
  expect(saved.images?.standing).toBeTruthy();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.top-tab[data-tab-target="mine"]').click();
  await expect(page.locator('#mineGrid')).toContainText(title);
  await assertNoHorizontalOverflow(page);

  await page.locator('[data-mine-view]').first().click();
  await expect(page.locator('#detailContent')).toContainText(title);
  await page.screenshot({ path: 'test-results/desktop-library.png', fullPage: true });

  expect(diagnostics.pageErrors, diagnostics.pageErrors.join('\n')).toEqual([]);
  expect(diagnostics.consoleErrors, diagnostics.consoleErrors.join('\n')).toEqual([]);
});

test('mobile: navigation and filter drawers remain usable without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const diagnostics = await openApp(page);

  const navToggle = page.locator('.mobile-nav-toggle');
  const filterToggle = page.locator('.foundation-filter-toggle');
  await expect(navToggle).toBeVisible();
  await expect(filterToggle).toBeVisible();

  await navToggle.click();
  await expect(page.locator('body')).toHaveClass(/nav-drawer-open/);
  const rail = page.locator('.rail');
  await expect(rail).toBeVisible();
  await assertInsideViewport(page, rail);
  await page.locator('.mobile-nav-backdrop').click({ position: { x: 380, y: 400 } });
  await expect(page.locator('body')).not.toHaveClass(/nav-drawer-open/);

  await filterToggle.click();
  await expect(page.locator('body')).toHaveClass(/filter-drawer-open/);
  const filterPanel = page.locator('.filter-panel');
  await expect(filterPanel).toBeVisible();
  await assertInsideViewport(page, filterPanel);
  await expect(page.locator('.foundation-filter-close')).toBeInViewport();
  await page.screenshot({ path: 'test-results/mobile-filter.png', fullPage: true });
  await page.locator('.foundation-filter-close').click();
  await expect(page.locator('body')).not.toHaveClass(/filter-drawer-open/);

  await assertNoHorizontalOverflow(page);
  expect(diagnostics.pageErrors, diagnostics.pageErrors.join('\n')).toEqual([]);
  expect(diagnostics.consoleErrors, diagnostics.consoleErrors.join('\n')).toEqual([]);
});
