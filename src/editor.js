import { STREETS } from './data.js';
import { 
  editingStreetIdx, setEditingStreetIdx, pushUndo, 
  streetLayerGroup, map 
} from './state.js'; 
import { esc } from './utils.js'; 

function showToast(msg, type = 'info') {
  if (typeof window.toast === 'function') window.toast(msg, type);
  else console.log('Toast:', msg);
}

export function saveCurrentObject() {
  if (editingStreetIdx < 0 || !STREETS[editingStreetIdx]) {
    showToast('Сначала выберите объект в списке', 'error');
    return;
  }
  try {
    const cleanStreets = STREETS.map(s => {
      const copy = { ...s };
      delete copy._layer;
      return copy;
    });
    localStorage.setItem('zhilischnik_v45_streets', JSON.stringify({ streets: cleanStreets }));
    if (typeof window.saveData === 'function') window.saveData(false);
    try { pushUndo('сохранение маршрута'); } catch(e) {}
    showToast('Маршрут сохранён в браузере!', 'success');
    renderEditorStreets();
  } catch (e) {
    console.error('ОШИБКА СОХРАНЕНИЯ:', e);
    showToast('Ошибка: ' + e.message, 'error');
  }
}

export function loadStreetsFromStorage() {
  const raw = localStorage.getItem('zhilischnik_v45_streets');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.streets && Array.isArray(data.streets)) {
        data.streets.forEach((saved, i) => {
          if (STREETS[i]) {
            STREETS[i].coords = saved.coords || [];
            STREETS[i].extraPolygons = saved.extraPolygons || [];
          }
        });
      }
    } catch(e) { console.error('Ошибка загрузки', e); }
  }
  renderStreetLayer();
}

export function renderStreetLayer() {
  if (!streetLayerGroup || !map) return;
  streetLayerGroup.clearLayers();

  STREETS.forEach((s, idx) => {
    const isEditing = editingStreetIdx === idx;
    const color = isEditing ? '#e74c3c' : '#2980b9';
    
    const options = {
      color: color, weight: isEditing ? 4 : 2.5, opacity: isEditing ? 1 : 0.7,
      fillColor: color, fillOpacity: isEditing ? 0.3 : 0.1
    };

    if (s.coords && s.coords.length >= 2) {
      const isPoly = s.coords.length >= 3;
      let layer;
      if (isPoly) layer = L.polygon(s.coords, options).addTo(streetLayerGroup);
      else layer = L.polyline(s.coords, { ...options, fillOpacity: 0, dashArray: '5, 5' }).addTo(streetLayerGroup);
      s._layer = layer;
    }

    if (s.extraPolygons) {
      s.extraPolygons.forEach((ep) => {
        if (ep.length >= 2) {
          const isPoly = ep.length >= 3;
          if (isPoly) L.polygon(ep, options).addTo(streetLayerGroup);
          else L.polyline(ep, { ...options, fillOpacity: 0, dashArray: '5, 5' }).addTo(streetLayerGroup);
        }
      });
    }
  });
}

export function onGeomanCreate(e) {
  if (editingStreetIdx < 0) {
    showToast('Сначала выберите объект в списке справа!', 'error');
    if (map) map.removeLayer(e.layer);
    return;
  }
  
  const s = STREETS[editingStreetIdx];
  if (!s) return;

  let coords = [];
  if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
    const latlngs = e.layer.getLatLngs();
    coords = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs).map(ll => [ll.lat, ll.lng]);
  } else if (e.shape === 'Line' || e.shape === 'Polyline') {
    coords = e.layer.getLatLngs().map(ll => [ll.lat, ll.lng]);
  }

  if (coords.length < 2) { map.removeLayer(e.layer); return; }

  pushUndo('рисование ' + e.shape);
  if (!s.extraPolygons) s.extraPolygons = [];
  s.extraPolygons.push(coords);

  map.removeLayer(e.layer);
  
  renderStreetLayer();
  renderEditorStreets();
  showToast('Фигура добавлена. Не забудьте сохранить!', 'success');
}

export function onGeomanRemove(e) {
  if (editingStreetIdx < 0) return;
  const s = STREETS[editingStreetIdx];
  if (!s || !s.extraPolygons) return;

  let coords = [];
  if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
    const latlngs = e.layer.getLatLngs();
    coords = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs).map(ll => [ll.lat, ll.lng]);
  } else {
    coords = e.layer.getLatLngs().map(ll => [ll.lat, ll.lng]);
  }

  const originalLength = s.extraPolygons.length;
  s.extraPolygons = s.extraPolygons.filter(ep => JSON.stringify(ep) !== JSON.stringify(coords));

  if (s.extraPolygons.length !== originalLength) {
    pushUndo('удаление фигуры');
    renderStreetLayer();
    renderEditorStreets();
    showToast('Фигура удалена. Не забудьте сохранить!', 'info');
  }
}

export function renderEditorStreets() {
  const search = (document.getElementById('ed-street-search')?.value || '').toLowerCase();
  const container = document.getElementById('ed-street-list');
  if (!container) return;
  container.innerHTML = '';
  
  STREETS.forEach((s, idx) => {
    if (search && s.name.toLowerCase().indexOf(search) < 0) return;
    const isEditing = editingStreetIdx === idx;
    
    let totalPts = (s.coords || []).length;
    if (s.extraPolygons) totalPts += s.extraPolygons.reduce((a, b) => a + b.length, 0);
    
    const item = document.createElement('div');
    item.className = 'ed-street-item' + (isEditing ? ' editing' : '');
    item.innerHTML = `<span class="name">${esc(s.name)}</span><span class="pts">${totalPts}т</span>`;

    item.addEventListener('click', () => {
      setEditingStreetIdx(idx);
      renderEditorStreets();
      renderStreetLayer();
      
      if (s._layer && map) {
        map.fitBounds(s._layer.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }
      
      const info = document.getElementById('ed-info');
      if (info) info.textContent = 'Выбран объект: ' + s.name;
      const bottomBar = document.getElementById('editor-bottom-bar');
      if (bottomBar) bottomBar.style.display = 'block';
    });
    container.appendChild(item);
  });
}

export function toggleEditor() {
  const panel = document.getElementById('editor-panel');
  if (panel) {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      renderEditorStreets();
      renderStreetLayer();
    }
  }
}

export function clearEditorDraw() {
  if (editingStreetIdx < 0) return;
  if (!confirm('Удалить ВСЕ фигуры (линии и полигоны) этого объекта?')) return;
  pushUndo('очистка');
  STREETS[editingStreetIdx].coords = [];
  STREETS[editingStreetIdx].extraPolygons = [];
  renderStreetLayer();
  renderEditorStreets();
  showToast('Все фигуры удалены', 'info');
}

export function cancelEditing() {
  setEditingStreetIdx(-1);
  renderEditorStreets();
  renderStreetLayer();
  const bottomBar = document.getElementById('editor-bottom-bar');
  if (bottomBar) bottomBar.style.display = 'none';
}

export function startDrawMode(mode) {
  if (!map || !map.pm) {
    showToast('Geoman не инициализирован', 'error');
    return;
  }
  if (editingStreetIdx < 0) {
    showToast('Сначала выберите объект из списка', 'error');
    return;
  }

  map.pm.disableDraw();

  if (mode === 'line') {
    map.pm.enableDraw('Line', { snappable: true, snapDistance: 20 });
    showToast('Рисование линии: кликайте по карте, завершите двойным кликом', 'info');
  } else if (mode === 'polygon') {
    map.pm.enableDraw('Polygon', { snappable: true, snapDistance: 20 });
    showToast('Рисование полигона: кликайте по карте, завершите кликом на первой точке', 'info');
  } else if (mode === 'stop') {
    showToast('Рисование отменено', 'info');
  }
}

export function toggleDrawingMode() { startDrawMode('line'); }
export function updateToolbarButtons() {}
export function saveEditedStreet() { saveCurrentObject(); }
export function addExtraLine() {}
export function toggleConnectMode() {}
export function handleConnectClick() {}
export function insertPointRelative() {}
export function deleteExtraLine() {}
export function clearThisLineGeometry() { clearEditorDraw(); }

