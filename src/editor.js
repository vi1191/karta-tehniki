// src/editor.js
import { STREETS } from './data.js'; 
import { esc } from './utils.js'; 

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

// === Отрисовка списка улиц в редакторе ===
function isYardObject(s) {
  if (!s) return false;
  if (s.type === 'yard') return true;
  return s.coords && s.coords.length >= 3;
}

export function renderEditorStreets() {
  const searchInput = document.getElementById('ed-street-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  
  // Ищем контейнер. В старом коде это был ed-street-list
  const container = document.getElementById('ed-street-list') || document.getElementById('editor-streets-list');
  
  if (!container) {
    console.warn('Контейнер для списка улиц не найден');
    return;
  }

  container.innerHTML = '';
  
  STREETS.forEach((s, idx) => {
    if (search && s.name.toLowerCase().indexOf(search) < 0) return;
    
    const coords = s.coords || [];
    const isYard = isYardObject(s);
    const minPts = isYard ? 3 : 2;
    const isEmpty = coords.length < minPts;
    const isEditing = editingStreetIdx === idx;

    const item = document.createElement('div');
    item.className = 'ed-street-item' + (isEmpty ? ' empty' : '') + (isEditing ? ' editing' : '') + (isYard ? ' polygon' : '');
    item.dataset.streetName = s.name;
    
    item.innerHTML = `
      <span class="name">${esc(s.name)}</span>
      <span class="pts">${coords.length}т</span>
      <span class="actions">
        <span class="up" title="Вверх">⬆</span>
        <span class="dn" title="Вниз">⬇</span>
      </span>
    `;

    // Добавляем обработчик клика для выбора улицы
    item.addEventListener('click', () => {
      editingStreetIdx = idx;
      renderEditorStreets(); // Перерисовать, чтобы подсветить выбранную
      const info = document.getElementById('ed-info');
      if (info) info.textContent = 'Редактируется: ' + s.name;
      console.log('Выбрана улица:', s.name, 'Индекс:', idx);
    });

    container.appendChild(item);
  });
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
      renderEditorStreets(); // Вызываем отрисовку при открытии
    }
  } else {
    console.log('editor-panel не найден');
  }
}