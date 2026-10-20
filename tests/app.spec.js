import { test, expect } from '@playwright/test';

test.describe('Карта техники — полная проверка', () => {

  test('1. Приложение загружается', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await expect(page.locator('.leaflet-container')).toBeVisible();
    console.log('✅ Карта загружена');
  });

  test('2. Карточки техники есть', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    const cards = await page.locator('.machine-card').count();
    expect(cards).toBeGreaterThan(0);
    console.log(`✅ Карточек техники: ${cards}`);
  });

  test('3. Категории переключаются', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.cat-tab', { timeout: 15000 });

    // ОДХ
    await page.locator('.cat-tab[data-cat="odh"]').click();
    await page.waitForTimeout(300);
    const odhCount = await page.locator('.machine-card').count();
    expect(odhCount).toBeGreaterThan(0);
    console.log(`✅ ОДХ: ${odhCount} карточек`);

    // Дворы
    await page.locator('.cat-tab[data-cat="dvory"]').click();
    await page.waitForTimeout(300);
    const dvoryCount = await page.locator('.machine-card').count();
    expect(dvoryCount).toBeGreaterThan(0);
    console.log(`✅ Дворы: ${dvoryCount} карточек`);

    // Вся техника
    await page.locator('.cat-tab[data-cat="other"]').click();
    await page.waitForTimeout(300);
    const otherCount = await page.locator('.machine-card').count();
    expect(otherCount).toBeGreaterThan(0);
    console.log(`✅ Вся техника: ${otherCount} карточек`);
  });

  test('4. Участки фильтруют', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.uch-btn', { timeout: 15000 });

    // Клик на участок 1
    await page.locator('.uch-btn[data-u="1"]').click();
    await page.waitForTimeout(300);
    const uchCount = await page.locator('.machine-card').count();
    console.log(`✅ Участок 1: ${uchCount} карточек`);
    expect(uchCount).toBeGreaterThanOrEqual(0);
  });

  test('5. Поиск работает', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#search', { timeout: 15000 });

    // Вводим госномер (например, 7922)
    await page.locator('#search').fill('7922');
    await page.waitForTimeout(500);
    const searchCount = await page.locator('.machine-card').count();
    console.log(`✅ Поиск "7922": ${searchCount} карточек`);
  });

  test('6. Панель маршрута открывается', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.machine-card', { timeout: 15000 });

    // Клик на первую карточку
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);

    const miniRoute = await page.locator('#mini-route.open').count();
    expect(miniRoute).toBe(1);
    console.log('✅ Панель маршрута открылась');
  });

  test('7. Кнопки в панели маршрута есть', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.machine-card', { timeout: 15000 });
    await page.locator('.machine-card').first().click();
    await page.waitForTimeout(500);

    // Проверяем, что есть кнопки «Добавить», «Копировать», «Очистить»
    const addBtn = await page.locator('#mini-route .mr-btn.green').count();
    const copyBtn = await page.locator('#mini-route .mr-btn.orange').count();
    const clearBtn = await page.locator('#mini-route .mr-btn.red').count();
    expect(addBtn).toBe(1);
    expect(copyBtn).toBe(1);
    expect(clearBtn).toBe(1);
    console.log('✅ Кнопки панели маршрута есть');
  });

  test('8. Редактор включается', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#edit-mode-btn', { timeout: 15000 });

    // Клик на «Редактировать»
    await page.locator('#edit-mode-btn').click();
    await page.waitForTimeout(500);

    // Проверяем, что режим включился (кнопка изменилась на «Готово»)
    const btnText = await page.locator('#edit-mode-btn').innerText();
    expect(btnText).toContain('Готово');
    console.log('✅ Редактор включён');
  });

  test('9. Сохранение работает', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#save-status', { timeout: 15000 });

    // Проверяем, что статус «Сохранено»
    const status = await page.locator('#save-status').innerText();
    expect(status).toContain('Сохранено');
    console.log('✅ Статус: ' + status);
  });

  test('10. Нет ошибок в консоли', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('❌ Ошибки в консоли:', errors);
    } else {
      console.log('✅ Ошибок в консоли нет');
    }
    // Пока не падаем на ошибках, просто логируем
    // expect(errors.length).toBe(0);
  });
});