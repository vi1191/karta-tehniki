// src/editor.js
import { STREETS } from './data.js';
import { drawingMode, editObjectMode, connectMode, editingStreetIdx, setDrawingMode, setEditObjectMode, setConnectMode, setEditingStreetIdx, setConnectSource } from './state.js'; 
import { esc } from './utils.js'; 


function showToast(msg) {
  console.log('Toast:', msg);
  if (typeof window.toast === 'function') window.toast(msg, 'info');
}

function isYardObject(s) {
  if (!s) return false;
  if (s.type === 'yard') return true;
  return s.coords && s.coords.length >= 3;
}

export function toggleDrawingMode() {
  setDrawingMode(!drawingMode);
  if (drawingMode) {
    setEditObjectMode(false);
    setConnectMode(false);
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

export function onMapClick(e) {
  if (editingStreetIdx < 0 || !drawingMode) return;

  const s = STREETS[editingStreetIdx];
  if (!s) return;

  const pt = [e.latlng.lat, e.latlng.lng];
  
  if (s._drawingGroupIdx && s._drawingGroupIdx > 0) {
    const epIdx = s._drawingGroupIdx - 1;
    if (!s.extraPolygons) s.extraPolygons = [];
    if (!s.extraPolygons[epIdx]) s.extraPolygons[epIdx] = [];
    s.extraPolygons[epIdx].push(pt);
  } else {
    if (!s.coords) s.coords = [];
    s.coords.push(pt);
  }
  
  console.log('Точка добавлена:', pt);
  showToast('Точка добавлена');
  renderEditorStreets(); // Обновляем список, чтобы увидеть изменение количества точек
}

export function renderEditorStreets() {
  const searchInput = document.getElementById('ed-street-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  
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

    item.addEventListener('click', () => {
      setEditingStreetIdx(idx);
      renderEditorStreets();
      const info = document.getElementById('ed-info');
      if (info) info.textContent = 'Редактируется: ' + s.name;
      
      // Заполняем инпуты в панели редактора
      const nameInput = document.getElementById('ed-street-name');
      const areaInput = document.getElementById('ed-street-area');
      if (nameInput) nameInput.value = s.name;
      if (areaInput) areaInput.value = s.area || '';
      
      console.log('Выбрана улица:', s.name, 'Индекс:', idx);
    });

    container.appendChild(item);
  });
}

export function saveEditedStreet() {
  if (editingStreetIdx < 0 || !STREETS[editingStreetIdx]) {
    showToast('Объект не выбран');
    return;
  }
  const s = STREETS[editingStreetIdx];
  const nameInput = document.getElementById('ed-street-name');
  const areaInput = document.getElementById('ed-street-area');
  
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) {
    showToast('Введите название');
    return;
  }
  
  const isPoly = isYardObject(s);
  if (isPoly && (!s.coords || s.coords.length < 3)) {
    showToast('Минимум 3 точки для полигона');
    return;
  }
  if (!isPoly && (!s.coords || s.coords.length < 2)) {
    showToast('Минимум 2 точки для линии');
    return;
  }

  s.name = name;
  if (areaInput) s.area = areaInput.value;

  try {
    const dataToSave = { streets: STREETS };
    localStorage.setItem('zhilischnik_v45_streets', JSON.stringify(dataToSave));
    showToast('Объект сохранён!');
    renderEditorStreets();
  } catch (e) {
    console.error('Ошибка сохранения:', e);
    showToast('Ошибка сохранения');
  }
}

export function addExtraLine() {
  if (editingStreetIdx < 0) { showToast('Сначала выберите объект'); return; }
  const s = STREETS[editingStreetIdx];
  if (!s) return;
  if (!s.extraPolygons) s.extraPolygons = [];
  s.extraPolygons.push([]);
  setDrawingMode(true);
  setEditObjectMode(false);
  setConnectMode(false);
  s._drawingGroupIdx = s.extraPolygons.length;
  updateToolbarButtons();
  const info = document.getElementById('ed-info');
  if (info) info.textContent = '✏️ исуем новую линию #' + s.extraPolygons.length + '. ликайте по карте.';
  showToast('овая линия #' + s.extraPolygons.length + ' — кликайте по карте');
}

export function toggleConnectMode() {
  if (editingStreetIdx < 0) { showToast('Сначала выберите объект'); return; }
  const s = STREETS[editingStreetIdx];
  if (isYardObject(s)) { showToast('Соединение доступно только для линий'); return; }
  setConnectMode(!connectMode);
  setEditObjectMode(false);
  setDrawingMode(false);
  setConnectSource(null);
  updateToolbarButtons();
  const info = document.getElementById('ed-info');
  if (info) {
    info.textContent = connectMode
      ? '🔗 ликните по конечной точке первой линии (синий маркер). Esc — выход.'
      : 'едактируется: ' + (s ? s.name : '');
  }
}

export function handleConnectClick(gi, idx) {
  if (!connectMode) return;
  showToast('Соединение: выбрана точка ' + idx + ' линии ' + gi);
}

export function insertPointRelative(gi, idx, direction) {
  showToast('Точка вставлена (' + direction + ')');
}

export function deleteExtraLine(epIdx) {
  if (editingStreetIdx < 0) return;
  const s = STREETS[editingStreetIdx];
  if (s && s.extraPolygons && s.extraPolygons[epIdx]) {
    s.extraPolygons.splice(epIdx, 1);
    renderEditorStreets();
    showToast('иния удалена');
  }
}

export function clearThisLineGeometry(gi) {
  if (editingStreetIdx < 0) return;
  const s = STREETS[editingStreetIdx];
  if (!s) return;
  if (gi === 0) { s.coords = []; }
  else if (s.extraPolygons && s.extraPolygons[gi - 1]) { s.extraPolygons[gi - 1] = []; }
  renderEditorStreets();
  showToast('еометрия очищена');
}

export function toggleEditor() {
  const panel = document.getElementById('editor-panel');
  if (panel) {
    panel.classList.toggle('open');
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      updateToolbarButtons();
      renderEditorStreets();
    }
  } else {
    console.log('editor-panel не найден');
  }
}
export function clearEditorDraw() {
  if (editingStreetIdx < 0 || !STREETS[editingStreetIdx]) return;
  if (!confirm('чистить все нарисованные линии и точки?')) return;
  const s = STREETS[editingStreetIdx];
  s.coords = [];
  s.extraPolygons = [];
  showToast('еометрия очищена');
  renderEditorStreets();
}

export function cancelEditing() {
  setEditingStreetIdx(-1);
  setDrawingMode(false);
  updateToolbarButtons();
  renderEditorStreets();
  const info = document.getElementById('ed-info');
  if (info) info.textContent = 'ликните по объекту на карте или в списке, чтобы начать редактирование.';
  console.log('едактирование отменено');
}
