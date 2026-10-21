// src/editor.js
import { STREETS } from './data.js'; 

export let drawingMode = false;
export let editObjectMode = false;
export let connectMode = false;
export let editingStreetIdx = -1;

function showToast(msg) {
  console.log('Toast:', msg);
  if (typeof window.toast === 'function') window.toast(msg, 'info');
}

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

// === Обработчик клика по карте ===
export function onMapClick(e) {
  if (editingStreetIdx < 0 || !drawingMode) return;

  const s = STREETS[editingStreetIdx];
  if (!s) return;

  const pt = [e.latlng.lat, e.latlng.lng];
  
  if (s._drawingGroupIdx && s._drawingGroupIdx > 0) {
    const epIdx = s._drawingGroupIdx - 1;
    if (!s.extraPolygons[epIdx]) s.extraPolygons[epIdx] = [];
    s.extraPolygons[epIdx].push(pt);
  } else {
    if (!s.coords) s.coords = [];
    s.coords.push(pt);
  }
  
  console.log('Точка добавлена:', pt);
  showToast('Точка добавлена');
}

export function addExtraLine() { showToast('Логика добавления линии пока не перенесена'); }
export function toggleConnectMode() { console.log('toggleConnectMode'); }
export function handleConnectClick(gi, idx) { console.log('handleConnectClick', gi, idx); }
export function insertPointRelative(gi, idx, direction) { console.log('insertPointRelative'); }
export function deleteExtraLine(epIdx) { console.log('deleteExtraLine'); }
export function clearThisLineGeometry(gi) { console.log('clearThisLineGeometry'); }

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