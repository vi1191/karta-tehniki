// src/routes.js
import { MACHINES } from './data.js';
import { esc, lineLength, polygonArea } from './utils.js';
import { 
  rbRoutesByVehicle, activeRouteIndex, miniRouteVehicle,
  getRouteColor,
  setMiniRouteVehicle, setActiveVehicle, setActiveRouteIndex,
  pushUndo
} from './state.js';

// === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ===
function ensureRoutes(plate) {
  if (!rbRoutesByVehicle[plate]) {
    rbRoutesByVehicle[plate] = [];
    for (let i = 0; i < 5; i++) {
      rbRoutesByVehicle[plate].push({ items: [], color: null, name: 'М' + (i + 1), ts: null });
    }
  } else {
    while (rbRoutesByVehicle[plate].length < 5) {
      rbRoutesByVehicle[plate].push({ items: [], color: null, name: 'М' + (rbRoutesByVehicle[plate].length + 1), ts: null });
    }
    rbRoutesByVehicle[plate].forEach((r, i) => {
      if (!r.name) r.name = 'М' + (i + 1);
    });
  }
  return rbRoutesByVehicle[plate];
}

// === ОТКРЫТИЕ / ЗАКРЫТИЕ ===
export function openMiniRoute(plate) {
  const m = MACHINES.find(x => x.plate === plate);
  if (!m) { alert('Машина не найдена: ' + plate); return; }
  setMiniRouteVehicle(plate);
  setActiveVehicle(plate);
  ensureRoutes(plate);
  renderRouteTabs();
  renderMiniRoute();
  document.getElementById('mini-route').classList.add('open');
  console.log('openMiniRoute (routes.js):', plate);
}

export function closeMiniRoute() {
  setMiniRouteVehicle(null);
  document.getElementById('mini-route').classList.remove('open');
}

// === ВКЛАДКИ ===
export function renderRouteTabs() {
  const container = document.getElementById('route-tabs');
  if (!container) return;
  container.innerHTML = '';

  if (!miniRouteVehicle) return;
  const routes = ensureRoutes(miniRouteVehicle);

  routes.forEach((route, idx) => {
    const tab = document.createElement('div');
    const hasItems = route.items && route.items.length > 0;
    const color = getRouteColor(miniRouteVehicle, idx);
    tab.className = 'route-tab' + (idx === activeRouteIndex ? ' active' : '');
    tab.dataset.idx = idx;
    tab.style.borderTopColor = color;
    tab.style.borderTopWidth = '3px';

    const dot = hasItems ? '<span class="tab-dot"></span>' : '';
    tab.innerHTML = dot +
      '<span class="tab-name">' + esc(route.name || ('М' + (idx + 1))) + '</span>' +
      '<span class="tab-arrows">' +
        (idx > 0 ? '<span class="tab-left">◀</span>' : '') +
        (idx < routes.length - 1 ? '<span class="tab-right">▶</span>' : '') +
      '</span>';

    tab.onclick = (e) => {
      if (e.target.closest('.tab-arrows')) return;
      switchRoute(idx);
    };

    const left = tab.querySelector('.tab-left');
    if (left) left.onclick = (e) => { e.stopPropagation(); moveTab(idx, -1); };
    const right = tab.querySelector('.tab-right');
    if (right) right.onclick = (e) => { e.stopPropagation(); moveTab(idx, 1); };

    container.appendChild(tab);
  });
}

// === ПЕРЕКЛЮЧЕНИЕ ВКЛАДКИ ===
export function switchRoute(idx) {
  setActiveRouteIndex(idx);
  renderRouteTabs();
  renderMiniRoute();
}

// === ПЕРЕСТАНОВКА ВКЛАДОК ===
export function moveTab(idx, dir) {
  if (!miniRouteVehicle) return;
  const routes = ensureRoutes(miniRouteVehicle);
  const ni = idx + dir;
  if (ni < 0 || ni >= routes.length) return;
  pushUndo('перестановка маршрутов');
  const tmp = routes[idx];
  routes[idx] = routes[ni];
  routes[ni] = tmp;
  if (activeRouteIndex === idx) setActiveRouteIndex(ni);
  else if (activeRouteIndex === ni) setActiveRouteIndex(idx);
  renderRouteTabs();
  renderMiniRoute();
}

// === СПИСОК ТОЧЕК ===
export function renderMiniRoute() {
  if (!miniRouteVehicle) return;
  const m = MACHINES.find(x => x.plate === miniRouteVehicle);
  if (!m) return;

  const active = ensureRoutes(miniRouteVehicle)[activeRouteIndex];
  let len = 0, areaSum = 0;
  (active && active.items || []).forEach(it => {
    if (it.type === 'yard' && it.coords && it.coords.length >= 3) areaSum += polygonArea(it.coords);
    else len += lineLength(it.coords || []);
  });
  const lenStr = len < 1000 ? Math.round(len) + ' м' : (len / 1000).toFixed(2) + ' км';
  const areaStr = areaSum > 0 ? (' · ' + Math.round(areaSum) + ' м² дворов') : '';

  const infoEl = document.getElementById('mr-info');
  if (infoEl) {
    infoEl.innerHTML =
      '<b>' + esc(m.vid || '') + '</b><br>' + esc(m.model || '') + (m.year ? ' · ' + esc(m.year) : '') + '<br>' +
      'Категория: <b>' + esc(m.cat_b || '—') + '</b>' + (m.area ? ' · ' + esc(m.area) : '') +
      (m.subtype ? '<br>Подтип: <b>' + esc(m.subtype) + '</b>' : '') +
      '<br>Длина: <b>' + lenStr + '</b>' + areaStr;
  }

  const list = document.getElementById('mr-list');
  if (!list) return;
  list.innerHTML = '';
  if (!active || !active.items || active.items.length === 0) {
    list.innerHTML = '<div class="mr-empty">Маршрут пуст.<br>Нажмите «➕ Добавить».</div>';
    return;
  }

  active.items.forEach((s, idx) => {
    const item = document.createElement('div');
    item.className = 'mr-item';
    const icon = s.type === 'yard' ? '🏠' : '🛣';
    item.innerHTML = '<span class="num">' + (idx + 1) + '</span>' +
      '<span class="name">' + icon + ' ' + esc(s.name) + '</span>' +
      '<span class="mv mr-up" title="Вверх">⬆</span>' +
      '<span class="mv mr-dn" title="Вниз">⬇</span>' +
      '<span class="rm mr-del" title="Удалить">✕</span>';
    item.querySelector('.mr-up').onclick = () => moveRoutePoint(idx, -1);
    item.querySelector('.mr-dn').onclick = () => moveRoutePoint(idx, 1);
    item.querySelector('.mr-del').onclick = () => removeFromMiniRoute(idx);
    list.appendChild(item);
  });
}

// === УПРАВЛЕНИЕ ТОЧКАМИ ===
export function moveRoutePoint(idx, dir) {
  const active = ensureRoutes(miniRouteVehicle)[activeRouteIndex];
  if (!active || !active.items) return;
  const ni = idx + dir;
  if (ni < 0 || ni >= active.items.length) return;
  pushUndo('перемещение точки');
  const tmp = active.items[idx];
  active.items[idx] = active.items[ni];
  active.items[ni] = tmp;
  renderMiniRoute();
}

export function removeFromMiniRoute(idx) {
  const active = ensureRoutes(miniRouteVehicle)[activeRouteIndex];
  if (!active) return;
  pushUndo('удаление точки маршрута');
  active.items.splice(idx, 1);
  renderMiniRoute();
  renderRouteTabs();
}

export function clearActiveRoute() {
  if (!miniRouteVehicle) return;
  const active = ensureRoutes(miniRouteVehicle)[activeRouteIndex];
  if (!active) return;
  if (!confirm('Очистить "' + (active.name || 'М' + (activeRouteIndex + 1)) + '" для ' + miniRouteVehicle + '?')) return;
  pushUndo('очистка маршрута');
  active.items = [];
  active.color = null;
  renderMiniRoute();
  renderRouteTabs();
}

export function copyRouteFrom() {
  if (!miniRouteVehicle) return;
  const source = prompt('Введите госномер машины-источника:');
  if (!source) return;
  const srcPlate = source.trim().toUpperCase();
  const srcMach = MACHINES.find(m => m.plate.toUpperCase() === srcPlate);
  if (!srcMach) { alert('Машина не найдена: ' + srcPlate); return; }
  if (!rbRoutesByVehicle[srcPlate]) { alert('У источника нет маршрута'); return; }
  if (!confirm('Скопировать маршрут с ' + srcPlate + ' на ' + miniRouteVehicle + '?')) return;
  pushUndo('копирование маршрута');
  const srcActive = rbRoutesByVehicle[srcPlate][activeRouteIndex] || rbRoutesByVehicle[srcPlate][0];
  ensureRoutes(miniRouteVehicle)[activeRouteIndex] = JSON.parse(JSON.stringify(srcActive));
  renderMiniRoute();
  renderRouteTabs();
}