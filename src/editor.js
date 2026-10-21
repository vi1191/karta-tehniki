// src/editor.js

// === Состояние редактора (внутри модуля) ===
export let drawingMode = false;
export let editObjectMode = false;
export let connectMode = false;
export let editingStreetIdx = -1;
export const STREETS = []; // Пустой массив, будем заполнять позже

// Вспомогательная функция для тостов
function showToast(msg) {
  console.log('Toast:', msg);
  // Если в index.html есть старая функция toast, используем её
  if (typeof window.toast === 'function') window.toast(msg, 'info');
}

// === Переключение режима рисования ===
export function toggleDrawingMode() {
  drawingMode = !drawingMode;
  if (drawingMode) {
    editObjectMode = false;
    connectMode = false;
  }
  updateToolbarButtons();
  
  const info = document.getElementById('ed-info');
  if (info) {
    info.textContent = drawingMode
      ? '✏️ Режим рисования. Кликайте по карте для добавления точек.'
      : 'Редактирование выключено';
  }
}

// === Обновление кнопок панели ===
export function updateToolbarButtons() {
  const tbPoints = document.getElementById('tb-points');
  const tbConnect = document.getElementById('tb-connect');
  
  if (tbPoints) {
    tbPoints.classList.toggle('active', drawingMode || editObjectMode);
    if (drawingMode) tbPoints.textContent = '✅ Рисование';
    else if (editObjectMode) tbPoints.textContent = '✅ Добавление';
    else tbPoints.textContent = '✏️ Точки';
  }
  if (tbConnect) {
    tbConnect.classList.toggle('active', connectMode);
    tbConnect.textContent = connectMode ? '🔗 Соединить...' : '🔗 Соединить';
  }
}

// === Добавление линии ===
export function addExtraLine() {
  if (editingStreetIdx < 0) {
    showToast('Сначала выберите объект');
    return;
  }
  // Пока заглушка, чтобы не упасть
  console.log('addExtraLine: нужно восстановить STREETS');
}

// === Остальные заглушки (пока) ===
export function toggleConnectMode() { console.log('toggleConnectMode'); }
export function handleConnectClick(gi, idx) { console.log('handleConnectClick', gi, idx); }
export function insertPointRelative(gi, idx, direction) { console.log('insertPointRelative'); }
export function deleteExtraLine(epIdx) { console.log('deleteExtraLine'); }
export function clearThisLineGeometry(gi) { console.log('clearThisLineGeometry'); }

// === toggleEditor (восстановленный) ===
export function toggleEditor() {
  const panel = document.getElementById('editor-panel');
  if (panel) {
    panel.classList.toggle('open');
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      updateToolbarButtons();
    }
  } else {
    console.log('editor-panel не найден');
  }
}