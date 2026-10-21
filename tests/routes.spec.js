import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173/index.html';

test.describe('Маршруты — проверка', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('zhilischnik_onboarded', '1');
    });
  });

  test('1. Панель маршрута открывается', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    const headers = page.locator('.subtype-header');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click();
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('#mini-route.open')).toBeVisible();
    console.log('✅ Панель маршрута открылась');
  });

  test('2. Вкладки М1–М5 есть', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    const headers = page.locator('.subtype-header');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click();
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);
    const tabs = await page.locator('#route-tabs .route-tab').count();
    expect(tabs).toBe(5);
    console.log(`✅ Вкладок: ${tabs}`);
  });

  test('3. Переключение вкладок работает', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    const headers = page.locator('.subtype-header');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click();
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);

    await page.locator('#route-tabs .route-tab').nth(1).click();
    await page.waitForTimeout(300);
    const activeIdx = await page.locator('#route-tabs .route-tab.active').getAttribute('data-idx');
    expect(activeIdx).toBe('1');
    console.log('✅ Активная вкладка: М' + (parseInt(activeIdx) + 1));
  });

  test('4. Кнопка «Добавить» есть', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    const headers = page.locator('.subtype-header');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click();
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);
    const addBtn = await page.locator('#mini-route .mr-btn.green').count();
    expect(addBtn).toBe(1);
    console.log('✅ Кнопка «Добавить» есть');
  });

  test('5. Кнопка «Очистить» работает', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    const headers = page.locator('.subtype-header');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click();
      await page.waitForTimeout(100);
    }
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);

    page.on('dialog', dialog => dialog.accept());
    await page.locator('#mini-route .mr-btn.red').click();
    await page.waitForTimeout(300);
    console.log('✅ Кнопка «Очистить» нажата');
  });
});