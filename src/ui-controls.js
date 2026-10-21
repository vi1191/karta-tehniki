import { activeUchastok, setActiveUchastok, selectedForShow, setSelectedForShow, currentCategory, routeFilterActive, setRouteFilterActive, STORAGE_KEY, rbRoutesByVehicle, setRbRoutesByVehicle, activeRouteIndex, setActiveRouteIndex, history, setHistory } from './state.js';
import { MACHINES } from './data.js';
import { renderList } from './ui.js';

export function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
export function toggleDropdown(id) { document.getElementById(id).classList.toggle('open'); }
export function toggleTheme() { document.body.classList.toggle('dark'); }

export function resetAll() {
  if (confirm('Сбросить всё?')) {
    localStorage.clear();
    location.reload();
  }
}

export function toggleEditMode() {
  const btn = document.getElementById('edit-mode-btn');
  if (!btn) return;
  const isEdit = document.body.classList.toggle('edit-mode');
  btn.innerHTML = isEdit ? '💾 <span>Готово</span>' : '✏️ <span>Редактировать</span>';
}

export function openHistory() {
  const panel = document.getElementById('history-panel');
  const body = document.getElementById('history-body');
  if (!panel || !body) return;
  if (!history || history.length === 0) {
    body.innerHTML = '<div class="hp-empty">История пуста</div>';
  } else {
    body.innerHTML = history.slice().reverse().map(h => {
      const time = h.time ? new Date(h.time).toLocaleString('ru-RU') : '';
      const label = h.label || 'изменение';
      return '<div class="hp-item"><div class="hp-time">' + time + '</div>' + label + '</div>';
    }).join('');
  }
  panel.classList.add('open');
}

export function exportCSV() { console.log('exportCSV: logic not moved yet'); }
export function startOnboarding() { console.log('startOnboarding: logic not moved yet'); }
export function exportHTML() { console.log('exportHTML: logic not moved yet'); }
export function printRoutes() { console.log('printRoutes: logic not moved yet'); }
export function undoLastAction() { console.log('undoLastAction: logic not moved yet'); }

export function toggleExpandSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('expanded');
}

export function toggleRouteFilter() {
  setRouteFilterActive(!routeFilterActive);
  renderList();
}

export function toggleOverlaps() {
  console.log('toggleOverlaps: logic not moved yet');
}

export function selectUchastok(num) {
  const next = (activeUchastok === num) ? null : num;
  setActiveUchastok(next);
  document.querySelectorAll('.uch-btn').forEach(btn => {
    btn.classList.toggle('active', String(btn.dataset.u) === String(next));
  });
  renderList();
}

export function toggleLegend() {
  document.getElementById('legend').classList.toggle('open');
}

export function setShowMode(mode) {
  console.log('setShowMode:', mode);
}

export function toggleSelectAll() {
  const cat = MACHINES.filter(m =>
    currentCategory === 'odh' ? m.isODH :
    currentCategory === 'dvory' ? m.isDvory :
    true
  );
  const allSelected = cat.length > 0 && cat.every(m => selectedForShow.has(m.plate));
  if (allSelected) setSelectedForShow(new Set());
  else setSelectedForShow(new Set(cat.map(m => m.plate)));
  renderList();
}

function setSaveStatus(state) {
  const el = document.getElementById('save-status');
  if (!el) return;
  if (state === 'saved') { el.textContent = '💾 Сохранено'; el.classList.remove('saving'); }
  else { el.textContent = '⏳ Сохранение...'; el.classList.add('saving'); }
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = 'toast ' + (type || 'info');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.display = 'none'; }, 2500);
}

export function saveData(showIndicator) {
  const overrides = {};
  MACHINES.forEach(m => { overrides[m.plate] = { isODH: m.isODH, isDvory: m.isDvory, area: m.area, subtype: m.subtype }; });
  const data = {
    version: 45,
    rbRoutesByVehicle,
    selectedForShow: Array.from(selectedForShow),
    activeRouteIndex,
    categoryOverrides: overrides,
    ts: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaveStatus('saved');
    if (showIndicator) toast('Сохранено', 'success');
  } catch (e) {
    toast('Ошибка сохранения: ' + e.message, 'error');
  }
}

export function loadData() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('zhilischnik_v44') || localStorage.getItem('zhilischnik_v43'); } catch (e) { return; }
  if (!raw) return;
  let data;
  try { data = JSON.parse(raw); } catch (e) { console.warn('loadData: битый JSON', e); return; }

  if (data.rbRoutesByVehicle && typeof data.rbRoutesByVehicle === 'object') {
    const fresh = {};
    Object.keys(data.rbRoutesByVehicle).forEach(plate => {
      const old = data.rbRoutesByVehicle[plate];
      if (!Array.isArray(old)) return;
      const routes = [];
      for (let i = 0; i < 5; i++) {
        const r = old[i];
        routes.push(r ? { items: r.items || [], color: r.color || null, name: r.name || ('М' + (i + 1)), ts: r.ts || null } : { items: [], color: null, name: 'М' + (i + 1), ts: null });
      }
      fresh[plate] = routes;
    });
    setRbRoutesByVehicle(fresh);
  }

  if (Array.isArray(data.selectedForShow)) setSelectedForShow(new Set(data.selectedForShow));
  if (typeof data.activeRouteIndex === 'number') setActiveRouteIndex(data.activeRouteIndex);

  if (data.categoryOverrides && typeof data.categoryOverrides === 'object') {
    MACHINES.forEach(m => {
      const o = data.categoryOverrides[m.plate];
      if (o) { m.isODH = !!o.isODH; m.isDvory = !!o.isDvory; m.area = o.area || ''; m.subtype = o.subtype || ''; }
    });
  }
}