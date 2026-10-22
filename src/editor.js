// src/editor.js
import { STREETS } from './data.js';
import { 
  editingStreetIdx, setEditingStreetIdx, pushUndo, 
  streetLayerGroup, map 
} from './state.js'; 
import { esc } from './utils.js'; 

function showToast(msg) {
  if (typeof window.toast === 'function') window.toast(msg, 'info');
  else console.log('Toast:', msg);
}

// ================= СОХРАНЕНИЕ =================
export function saveCurrentObject() {
  if (editingStreetIdx < 0 || !STREETS[editingStreetIdx]) {
    showToast('Сначала выберите объект в списке');
    return;
  }
  
  pushUndo('сохранение маршрута');
  try {
    // Сохраняем массив STREETS
    localStorage.setItem('zhilischnik_v45_streets', JSON.stringify({ streets: STREETS }));
    showToast('Маршрут сохранён в браузере!');
    renderEditorStreets();
  } catch (e) {
    showToast('Ошибка сохранения: ' + e.message);
  }
}

// Загрузка при старте
export function loadStreetsFromStorage() {
  const raw = localStorage.getItem('zhilischnik_v45_streets');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.streets && Array.isArray(data.streets)) {
        data.streets.forEach((saved, i) => {
          if (STREETS[i]) {
            STREETS[i].coords = saved.coords;
            STREETS[i].extraPolygons = saved.extraPolygons;
          }
        });
      }
    } catch(e) { console.error('Ошибка загрузки', e); }
  }
  renderStreetLayer();
}

// ================= ОТРИСОВКА =================
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

    // Основная геометрия (если есть)
    if (s.coords && s.coords.length >= 2) {
      const isPoly = s.coords.length >= 3;
      let layer;
      if (isPoly) layer = L.polygon(s.coords, options).addTo(streetLayerGroup);
      else layer = L.polyline(s.coords, { ...options, fillOpacity: 0, dashArray: '5, 5' }).addTo(streetLayerGroup);
      s._layer = layer;
    }

    // Доп. фигуры (extraPolygons)
    if (s.extraPolygons) {
      s.extraPolygons.forEach(ep => {
        if (ep.length >= 2) {
          const isPoly = ep.length >= 3;
          if (isPoly) L.polygon(ep, options).addTo(streetLayerGroup);
          else L.polyline(ep, { ...options, fillOpacity: 0, dashArray: '5, 5' }).addTo(streetLayerGroup);
        }
      });
    }
  });
}

// ================= ПЕРЕХВАТ ОТ GEOMAN =================
export function onGeomanCreate(e) {
  if (editingStreetIdx < 0) {
    showToast('Сначала выберите объект в списке справа!');
    if (map) map.removeLayer(e.layer);
    return;
  }
  
  const s = STREETS[editingStreetIdx];
  if (!s) return;

  let coords = [];
  if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
    // Для полигона getLatLngs возвращает массив массивов
    const latlngs = e.layer.getLatLngs();
    // Берем внешний контур (первый массив)
    coords = (Array.isArray(latlngs[0]) ? latlngs[0] : latlngs).map(ll => [ll.lat, ll.lng]);
  } else if (e.shape === 'Line' || e.shape === 'Polyline') {
    coords = e.layer.getLatLngs().map(ll => [ll.lat, ll.lng]);
  }

  if (coords.length < 2) { map.removeLayer(e.layer); return; }

  pushUndo('рисование ' + e.shape);
  if (!s.extraPolygons) s.extraPolygons = [];
  s.extraPolygons.push(coords);

  // Удаляем слой Geoman, чтобы не было дублей
  map.removeLayer(e.layer);
  
  renderStreetLayer();
  renderEditorStreets();
  showToast('Фигура добавлена. Не забудьте сохранить!');
}

// Удаление фигуры через Geoman
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
    showToast('Фигура удалена. Не забудьте сохранить!');
  }
}

// ================= СПИСОК =================
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
      
      // Приближаем карту к объекту (если есть геометрия)
      if (s._layer && map) {
        map.fitBounds(s._layer.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }
      
      document.getElementById('ed-info').textContent = 'Выбран объект: ' + s.name;
      document.getElementById('editor-bottom-bar').style.display = 'block';
    });
    container.appendChild(item);
  });
}

// ================= УПРАВЛЕНИЕ =================
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
  showToast('Все фигуры удалены');
}

export function cancelEditing() {
  setEditingStreetIdx(-1);
  renderEditorStreets();
  renderStreetLayer();
  const bottomBar = document.getElementById('editor-bottom-bar');
  if (bottomBar) bottomBar.style.display = 'none';
}

// Заглушки для совместимости (чтобы index.html не ругался)
export function startDrawMode() {}
export function toggleDrawingMode() {}
export function updateToolbarButtons() {}
export function saveEditedStreet() { saveCurrentObject(); }
export function addExtraLine() {}
export function toggleConnectMode() {}
export function handleConnectClick() {}
export function insertPointRelative() {}
export function deleteExtraLine() {}
export function clearThisLineGeometry() {}