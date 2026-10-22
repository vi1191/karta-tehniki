import { test, expect } from '@playwright/test';

test.describe('E2E Тест: Полная логика редактора', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('zhilischnik_onboarded', '1');
    });
    await page.goto('http://localhost:5173/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('Рисование линий, полигонов, соединение и отмена', async ({ page }) => {
    console.log('--- СТАРТ ТЕСТА ---');

    // 1. Открываем редактор
    await page.evaluate(() => window.toggleEditor());
    await page.waitForTimeout(300);
    // Выбираем объект
    await page.evaluate(() => document.querySelector('.ed-street-item').click());
    await page.waitForTimeout(300);
    console.log('✅ Редактор открыт, объект выбран');

    // 2. Рисуем полигон (с заливкой)
    await page.evaluate(() => window.startDrawMode('polygon'));
    const map = page.locator('#map');
    // Кликаем в 3 точки (треугольник)
    await map.click({ position: { x: 200, y: 200 } });
    await map.click({ position: { x: 300, y: 200 } });
    await map.click({ position: { x: 250, y: 300 } });
    await page.waitForTimeout(500);
    console.log('✅ Полигон нарисован');

    // Проверяем, что точки появились
    const markers = await page.locator('.point-marker').count();
    expect(markers).toBeGreaterThanOrEqual(3);

    // 3. Рисуем линию (в extraPolygons)
    await page.evaluate(() => window.startDrawMode('line'));
    await map.click({ position: { x: 400, y: 200 } });
    await map.click({ position: { x: 500, y: 300 } });
    await page.waitForTimeout(500);
    console.log('✅ Линия нарисована');

    // 4. Соединяем линию и полигон
    await page.evaluate(() => window.toggleConnectMode());
    await page.waitForTimeout(200);
    // Кликаем по точке полигона (примерно там, где мы ставили точки)
    await map.click({ position: { x: 200, y: 200 } }); 
    // Кликаем по точке линии
    await map.click({ position: { x: 400, y: 200 } });
    await page.waitForTimeout(500);
    console.log('✅ Попытка соединения выполнена');

    // 5. Отмена (Undo) - должна убрать последнюю точку, а не закрыть редактор
    const markersBefore = await page.locator('.point-marker').count();
    await page.locator('#undo-btn').click();
    await page.waitForTimeout(500);
    const markersAfter = await page.locator('.point-marker').count();
    
    // Проверяем, что редактор НЕ ЗАКРЫЛСЯ (тулбар виден)
    await expect(page.locator('#ed-toolbar')).toBeVisible();
    // Проверяем, что количество точек уменьшилось
    expect(markersAfter).toBeLessThan(markersBefore);
    console.log(`✅ Undo работает: было ${markersBefore} точек, стало ${markersAfter}`);
    
    console.log('--- ТЕСТ УСПЕШНО ЗАВЕРШЕН ---');
  });
});