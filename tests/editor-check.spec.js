import { test, expect } from '@playwright/test';

test('E2E: Редактор рисует и сохраняет', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('http://localhost:5173/index.html');
  await page.waitForLoadState('networkidle');

  await page.locator('button[onclick*="toggleDropdown"]').click();
  await page.locator('.dm-item:has-text("Редактор улиц")').click();
  await expect(page.locator('#editor-panel')).toHaveClass(/open/);

  const firstStreet = page.locator('.ed-street-item').first();
  await firstStreet.click();
  await page.waitForTimeout(500);

  await page.locator('button[data-mode="line"]').click();
  const map = page.locator('#map');
  const box = await map.boundingBox();
  if (box) {
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down(); await page.mouse.up();
    await page.waitForTimeout(100);
    await page.mouse.move(startX + 50, startY + 50);
    await page.mouse.down(); await page.mouse.up();
    await page.waitForTimeout(100);
    await page.mouse.dblclick(startX + 50, startY + 50);
    await page.waitForTimeout(500);
  }

  const ptsText = await firstStreet.locator('.pts').innerText();
  console.log('Точки в списке:', ptsText);
  expect(ptsText).not.toBe('0т');

  await page.locator('#editor-bottom-bar button').click({ force: true });
  await page.waitForTimeout(1000);

  const hasData = await page.evaluate(() => {
    const data = localStorage.getItem('zhilischnik_v45_streets');
    return data ? data.includes('coords') : false;
  });
  expect(hasData).toBeTruthy();
});
