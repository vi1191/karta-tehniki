// src/ui.js
import { MACHINES, SUBTYPE_ORDER } from './data.js';
import { esc, escAttr, isYardObject } from './utils.js';
import { 
  currentCategory, activeUchastok, selectedForShow, 
  routeFilterActive, explicitlyExpanded, subtypesCollapsedByDefault,
  collapsedSubtypes, editMode, activeVehicle, hoveredVehicle,
  getBaseColor, getUchastokColor, getYardColor, getRouteColor
} from './state.js';

// === ВЫЗОВ СТАРЫХ ФУНКЦИЙ ИЗ index.html ===
export function toggleForShow(plate) { if (typeof window.toggleForShow === 'function') window.toggleForShow(plate); }
export function openMiniRoute(plate) { if (typeof window.openMiniRoute === 'function') window.openMiniRoute(plate); }
export function showSubtypeMenu(plate, x, y) { if (typeof window.showSubtypeMenu === 'function') window.showSubtypeMenu(plate, x, y); }
export function renameSubtype(subtype, machines, triggerEl) { if (typeof window.renameSubtype === 'function') window.renameSubtype(subtype, machines, triggerEl); }
export function highlightVehicleOnMap(plate) { if (typeof window.highlightVehicleOnMap === 'function') window.highlightVehicleOnMap(plate); }

// === РЕАЛЬНАЯ hasAnyItems ===
export function hasAnyItems(plate) {
  try {
    const data = JSON.parse(localStorage.getItem('zhilischnik_v45') || '{}');
    const routes = data.rbRoutesByVehicle?.[plate] || [];
    return routes.some(r => r.items && r.items.length > 0);
  } catch { return false; }
}

// === РЕАЛЬНАЯ updateCategoryCounts ===
export function updateCategoryCounts() {
  const odh = document.getElementById('cnt-odh');
  const dvo = document.getElementById('cnt-dvory');
  const oth = document.getElementById('cnt-other');
  if (odh) odh.textContent = MACHINES.filter(m => m.isODH).length;
  if (dvo) dvo.textContent = MACHINES.filter(m => m.isDvory).length;
  if (oth) oth.textContent = MACHINES.length;
}

// === ОСНОВНАЯ renderList ===
export function renderList() {
  const search = (document.getElementById('search').value || '').toLowerCase();
  let catMachines = getCategoryMachines(currentCategory);
  if (activeUchastok !== null) catMachines = catMachines.filter(m => m.area === activeUchastok + 'уч');
  if (routeFilterActive) catMachines = catMachines.filter(m => hasAnyItems(m.plate));

  const filtered = catMachines.filter(m => {
    if (search && m.plate.toLowerCase().indexOf(search) < 0 && (m.model || '').toLowerCase().indexOf(search) < 0 && (m.vid || '').toLowerCase().indexOf(search) < 0 && (m.subtype || '').toLowerCase().indexOf(search) < 0) return false;
    return true;
  });

  document.getElementById('total-count').textContent = MACHINES.length;
  document.getElementById('on-route-count').textContent = MACHINES.filter(m => hasAnyItems(m.plate)).length;
  document.getElementById('shown-count').textContent = filtered.length;

  const list = document.getElementById('machine-list');
  list.innerHTML = '';
  if (filtered.length === 0) {
    list.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">' + (routeFilterActive ? 'Нет техники с маршрутом' : 'Нет техники') + '</div>';
    updateCategoryCounts();
    return;
  }

  const groups = {};
  const noSubtype = [];
  const order = SUBTYPE_ORDER[currentCategory] || [];
  filtered.forEach(m => {
    const st = (currentCategory === 'other' && m.group) ? m.group : m.subtype;
    if (st) { if (!groups[st]) groups[st] = []; groups[st].push(m); }
    else noSubtype.push(m);
  });

  order.forEach(subtype => {
    if (groups[subtype] && groups[subtype].length > 0) { renderSubtypeGroup(subtype, groups[subtype], list); delete groups[subtype]; }
  });
  Object.keys(groups).forEach(subtype => renderSubtypeGroup(subtype, groups[subtype], list));
  if (noSubtype.length > 0) renderSubtypeGroup('', noSubtype, list, true);
  updateCategoryCounts();
}

function getCategoryMachines(cat) {
  if (cat === 'odh') return MACHINES.filter(m => m.isODH);
  if (cat === 'dvory') return MACHINES.filter(m => m.isDvory);
  return MACHINES;
}

function renderSubtypeGroup(subtype, machines, container, isNoSubtype) {
  const groupKey = currentCategory + '#' + (subtype || '__none__');
  const isCollapsed = subtypesCollapsedByDefault ? !explicitlyExpanded.has(groupKey) : collapsedSubtypes.has(groupKey);
  const groupDiv = document.createElement('div');
  groupDiv.className = 'subtype-group';

  const header = document.createElement('div');
  header.className = 'subtype-header' + (isNoSubtype ? ' no-subtype' : '');
  if (!isNoSubtype) header.dataset.subtype = subtype;
  header.innerHTML = '<span class="arrow">' + (isCollapsed ? '▶' : '▼') + '</span>' +
    '<span class="st-name">' + esc(isNoSubtype ? 'БЕЗ ПОДТИПА' : subtype) + '</span>' +
    '<span class="st-count">' + machines.length + '</span>' +
    (isNoSubtype ? '' : '<span class="st-edit" title="Переименовать подтип">✏️</span>');
  header.onclick = () => {
    if (subtypesCollapsedByDefault) {
      if (isCollapsed) explicitlyExpanded.add(groupKey);
      else explicitlyExpanded.delete(groupKey);
    } else {
      if (isCollapsed) collapsedSubtypes.delete(groupKey);
      else collapsedSubtypes.add(groupKey);
    }
    renderList();
  };
  if (!isNoSubtype) {
    header.ondblclick = (e) => { e.stopPropagation(); renameSubtype(subtype, machines, e.currentTarget); };
    const editBtn = header.querySelector('.st-edit');
    if (editBtn) editBtn.onclick = (e) => { e.stopPropagation(); renameSubtype(subtype, machines, e.currentTarget); };
  }
  groupDiv.appendChild(header);

  if (!isCollapsed) {
    const body = document.createElement('div');
    body.className = 'subtype-body';
    machines.forEach(m => body.appendChild(createMachineCard(m)));
    groupDiv.appendChild(body);
  }
  container.appendChild(groupDiv);
}

function createMachineCard(m) {
  const hasRoutes = hasAnyItems(m.plate);
  const baseColor = hasRoutes ? getBaseColor(m.plate) : null;
  const isChecked = selectedForShow.has(m.plate);
  const isActive = activeVehicle === m.plate;
  const photo = m.photo && typeof m.photo === 'string' ? m.photo : '';
  const modelText = (m.model || '').toString();

  const card = document.createElement('div');
  card.className = 'machine-card' + (isActive ? ' active' : '') + (hasRoutes ? ' has-route' : '');
  card.dataset.plate = m.plate;
  if (baseColor) card.style.borderLeftColor = baseColor;

  card.innerHTML =
    (photo ? '<img class="tech-icon" src="' + escAttr(photo) + '" alt="" onerror="this.style.display=\'none\'" />' : '') +
    '<input type="checkbox" class="chk" ' + (isChecked ? 'checked' : '') + ' />' +
    (baseColor ? '<span class="color-dot" style="background:' + baseColor + ';"></span>' : '') +
    '<div class="card-content">' +
      '<div class="plate">' + esc(m.plate) + (hasRoutes ? '<span class="route-badge">● маршрут</span>' : '') + '</div>' +
      '<div class="model">' + esc(modelText) + (m.year ? ' (' + esc(m.year) + ')' : '') + '</div>' +
      '<div class="meta"><span>' + esc(m.area || '') + '</span><span class="badge">' + esc(m.cat_b || '') + '</span></div>' +
    '</div>' +
    '<button class="card-more" title="Действия">⋯</button>';

  const chk = card.querySelector('.chk');
  chk.onclick = (e) => { e.stopPropagation(); toggleForShow(m.plate); };
  card.onclick = (e) => { if (e.target.tagName === 'INPUT') return; if (e.target.closest('.card-more')) return; openMiniRoute(m.plate); };
  card.oncontextmenu = (e) => { e.preventDefault(); showSubtypeMenu(m.plate, e.clientX, e.clientY); };
  card.querySelector('.card-more').onclick = (e) => { e.stopPropagation(); showSubtypeMenu(m.plate, e.clientX, e.clientY); };

  card.addEventListener('mouseenter', () => {
    if (hasRoutes) {
      hoveredVehicle = m.plate;
      highlightVehicleOnMap(m.plate);
    }
  });
  card.addEventListener('mouseleave', () => {
    if (hoveredVehicle === m.plate) {
      hoveredVehicle = null;
      highlightVehicleOnMap(null);
    }
  });

  const photoImg = card.querySelector('.tech-icon');
  if (photoImg) {
    photoImg.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!this.src) return;
      const overlay = document.createElement('div');
      overlay.className = 'photo-overlay';
      const bigImg = document.createElement('img');
      bigImg.src = this.src;
      overlay.appendChild(bigImg);
      overlay.addEventListener('click', function() { this.classList.remove('show'); setTimeout(() => this.remove(), 200); });
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('show'));
    });
  }

  return card;
}

export function setCategory(cat) {
  import('./state.js').then(m => m.setCurrentCategory(cat));
  renderList();
}