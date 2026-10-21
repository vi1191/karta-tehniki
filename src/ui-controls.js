import { activeUchastok, setActiveUchastok, selectedForShow, setSelectedForShow, currentCategory, routeFilterActive, setRouteFilterActive, STORAGE_KEY, rbRoutesByVehicle, activeRouteIndex } from './state.js';
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

export function openHistory() { console.log('openHistory: logic not moved yet'); }
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