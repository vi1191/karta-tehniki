# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> Карта техники — полная проверка >> 1. Приложение загружается
- Location: tests\app.spec.js:5:3

# Error details

```
Error: page.goto: Protocol error (Playwright.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Карта техники — полная проверка', () => {
  4   | 
  5   |   test('1. Приложение загружается', async ({ page }) => {
> 6   |     await page.goto('/');
      |                ^ Error: page.goto: Protocol error (Playwright.navigate): Cannot navigate to invalid URL
  7   |     await page.waitForSelector('.leaflet-container', { timeout: 15000 });
  8   |     await expect(page.locator('.leaflet-container')).toBeVisible();
  9   |     console.log('✅ Карта загружена');
  10  |   });
  11  | 
  12  |   test('2. Карточки техники есть', async ({ page }) => {
  13  |     await page.goto('/');
  14  |     await page.waitForSelector('.machine-card', { timeout: 15000 });
  15  |     const cards = await page.locator('.machine-card').count();
  16  |     expect(cards).toBeGreaterThan(0);
  17  |     console.log(`✅ Карточек техники: ${cards}`);
  18  |   });
  19  | 
  20  |   test('3. Категории переключаются', async ({ page }) => {
  21  |     await page.goto('/');
  22  |     await page.waitForSelector('.cat-tab', { timeout: 15000 });
  23  | 
  24  |     // ОДХ
  25  |     await page.locator('.cat-tab[data-cat="odh"]').click();
  26  |     await page.waitForTimeout(300);
  27  |     const odhCount = await page.locator('.machine-card').count();
  28  |     expect(odhCount).toBeGreaterThan(0);
  29  |     console.log(`✅ ОДХ: ${odhCount} карточек`);
  30  | 
  31  |     // Дворы
  32  |     await page.locator('.cat-tab[data-cat="dvory"]').click();
  33  |     await page.waitForTimeout(300);
  34  |     const dvoryCount = await page.locator('.machine-card').count();
  35  |     expect(dvoryCount).toBeGreaterThan(0);
  36  |     console.log(`✅ Дворы: ${dvoryCount} карточек`);
  37  | 
  38  |     // Вся техника
  39  |     await page.locator('.cat-tab[data-cat="other"]').click();
  40  |     await page.waitForTimeout(300);
  41  |     const otherCount = await page.locator('.machine-card').count();
  42  |     expect(otherCount).toBeGreaterThan(0);
  43  |     console.log(`✅ Вся техника: ${otherCount} карточек`);
  44  |   });
  45  | 
  46  |   test('4. Участки фильтруют', async ({ page }) => {
  47  |     await page.goto('/');
  48  |     await page.waitForSelector('.uch-btn', { timeout: 15000 });
  49  | 
  50  |     // Клик на участок 1
  51  |     await page.locator('.uch-btn[data-u="1"]').click();
  52  |     await page.waitForTimeout(300);
  53  |     const uchCount = await page.locator('.machine-card').count();
  54  |     console.log(`✅ Участок 1: ${uchCount} карточек`);
  55  |     expect(uchCount).toBeGreaterThanOrEqual(0);
  56  |   });
  57  | 
  58  |   test('5. Поиск работает', async ({ page }) => {
  59  |     await page.goto('/');
  60  |     await page.waitForSelector('#search', { timeout: 15000 });
  61  | 
  62  |     // Вводим госномер (например, 7922)
  63  |     await page.locator('#search').fill('7922');
  64  |     await page.waitForTimeout(500);
  65  |     const searchCount = await page.locator('.machine-card').count();
  66  |     console.log(`✅ Поиск "7922": ${searchCount} карточек`);
  67  |   });
  68  | 
  69  |   test('6. Панель маршрута открывается', async ({ page }) => {
  70  |     await page.goto('/');
  71  |     await page.waitForSelector('.machine-card', { timeout: 15000 });
  72  | 
  73  |     // Клик на первую карточку
  74  |     await page.locator('.machine-card').first().click();
  75  |     await page.waitForTimeout(500);
  76  | 
  77  |     const miniRoute = await page.locator('#mini-route.open').count();
  78  |     expect(miniRoute).toBe(1);
  79  |     console.log('✅ Панель маршрута открылась');
  80  |   });
  81  | 
  82  |   test('7. Кнопки в панели маршрута есть', async ({ page }) => {
  83  |     await page.goto('/');
  84  |     await page.waitForSelector('.machine-card', { timeout: 15000 });
  85  |     await page.locator('.machine-card').first().click();
  86  |     await page.waitForTimeout(500);
  87  | 
  88  |     // Проверяем, что есть кнопки «Добавить», «Копировать», «Очистить»
  89  |     const addBtn = await page.locator('#mini-route .mr-btn.green').count();
  90  |     const copyBtn = await page.locator('#mini-route .mr-btn.orange').count();
  91  |     const clearBtn = await page.locator('#mini-route .mr-btn.red').count();
  92  |     expect(addBtn).toBe(1);
  93  |     expect(copyBtn).toBe(1);
  94  |     expect(clearBtn).toBe(1);
  95  |     console.log('✅ Кнопки панели маршрута есть');
  96  |   });
  97  | 
  98  |   test('8. Редактор включается', async ({ page }) => {
  99  |     await page.goto('/');
  100 |     await page.waitForSelector('#edit-mode-btn', { timeout: 15000 });
  101 | 
  102 |     // Клик на «Редактировать»
  103 |     await page.locator('#edit-mode-btn').click();
  104 |     await page.waitForTimeout(500);
  105 | 
  106 |     // Проверяем, что режим включился (кнопка изменилась на «Готово»)
```