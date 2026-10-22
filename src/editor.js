// src/editor.js
import { STREETS } from './data.js';
import { 
  editingStreetIdx, setEditingStreetIdx, pushUndo, 
  streetLayerGroup, map 
} from './state.js'; 
import { esc } from './utils.js'; 

function showToast(msg) {
  if (typeof window.toast === 'function') window.toast(msg, 'info');
}

// ================= СОХРАНЕНИЕ =================
export function saveCurrentObject() {
  if (editingStreetIdx < 0 || !STREETS[editingStreetIdx]) {
    showToast('Сначала выберите объект в списке');
    return;
  }
  
  // Сохраняем массив STREETS в localStorage
  pushUndo('сохранение маршрута');
  try {
    localStorage.setItem('zhilischnik_v45_streets', JSON.stringify({ streets: STREETS }));
    showToast('Маршрут сохранён в браузере!');
    renderEditorStreets();
  } catch (e) {
    showToast('Ошибка сохранения: ' + e.message);
  }
}

// Загрузка при старте (вызываем в boot)
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

    if (s.coords && s.coords.length >= 2) {
      const isPoly = s.coords.length >= 3;
      if (isPoly) L.polygon(s.coords, options).addTo(streetLayerGroup);
      else L.polyline(s.coords, { ...options, fillOpacity: 0, dashArray: '5, 5' }).addTo(streetLayerGroup);
    }

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
  if (e.shape === 'Polygon') {
    coords = e.layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
  } else if (e.shape === 'Line' || e.shape === 'Polyline') {
    coords = e.layer.getLatLngs().map(ll => [ll.lat, ll.lng]);
  }

  if (coords.length < 2) { map.removeLayer(e.layer); return; }

  pushUndo('рисование ' + e.shape);
  if (!s.extraPolygons) s.extraPolygons = [];
  s.extraPolygons.push(coords);

  // Удаляем слой Geoman, чтобы фигура не висела дважды
  map.removeLayer(e.layer);
  
  renderStreetLayer();
  renderEditorStreets();
  showToast('Фигура добавлена. Не забудьте сохранить!');
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

// Заглушки для совместимости
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