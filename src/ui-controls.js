import { MACHINES } from './data.js';
import { renderList } from './ui.js';
import { rbRoutesByVehicle, selectedForShow, activeRouteIndex, history, showMode, activeUchastok, routeFilterActive, setActiveUchastok, setRbRoutesByVehicle, setActiveRouteIndex, setSelectedForShow, STORAGE_KEY } from './state.js';

export function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
export function toggleDropdown(id) { document.getElementById(id).classList.toggle('open'); }
export function toggleTheme() { document.body.classList.toggle('dark'); }

export function resetAll() {
  if (!confirm('Сбросить все изменения?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

export function toggleEditMode() {
  const on = document.body.classList.toggle('edit-mode');
  const b = document.getElementById('edit-mode-btn');
  if (b) b.innerHTML = on ? 'Готово' : '✏️ <span>Редактировать</span>';
}

export function openHistory() {
  closeEditor();
  document.getElementById('history-panel').classList.add('open');
  renderHistory();
}

function renderHistory() {
  const panel = document.getElementById('history-panel');
  if (!panel) return;
  if (!history || !history.length) { panel.innerHTML = '<div style="padding:12px">История пуста</div>'; return; }
  panel.innerHTML = history.map(h => `<div style="padding:6px 12px;border-bottom:1px solid #eee">${h.time} — ${h.action}</div>`).join('');
}

export function exportCSV() {
  const headers = ['Госномер','Модель','Год','Вид','Категория','Участок','Подтип','Маршрут'];
  const rows = [headers];
  MACHINES.forEach(m => {
    const routes = rbRoutesByVehicle[m.plate] || [];
    const routeStr = routes.map((r, i) => (r && r.items && r.items.length) ? ('М' + (i + 1) + ':' + r.items.length) : '').filter(Boolean).join(' | ');
    rows.push([m.plate, m.model || '', m.year || '', m.vid || '', m.cat_b || '', m.area || '', m.subtype || '', routeStr]);
  });
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'karta-tehniki-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  toast('CSV экспортирован', 'success');
}

export function startOnboarding() { console.log('startOnboarding: logic not moved yet'); }

export function exportHTML() { console.log('exportHTML: logic not moved yet'); }

export function printRoutes() { console.log('printRoutes: logic not moved yet'); }

export function undoLastAction() { console.log('undoLastAction: logic not moved yet'); }

export function toggleExpandSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('expanded');
}

export function toggleRouteFilter() {
  const btn = document.getElementById('btn-route-filter');
  const isActive = btn?.classList.toggle('active');
  const cards = document.querySelectorAll('.machine-card');
  cards.forEach(card => {
    const plate = card.dataset.plate;
    const hasRoute = rbRoutesByVehicle[plate]?.length > 0;
    card.style.display = (isActive && !hasRoute) ? 'none' : '';
  });
}

export function toggleOverlaps() {
  console.log('toggleOverlaps: logic not moved yet');
}

export function selectUchastok(num) {
  const btn = document.querySelector(`.uch-btn[data-u="${num}"]`);
  if (!btn) return;
  if (activeUchastok === num) {
    setActiveUchastok(null);
    btn.classList.remove('active');
  } else {
    document.querySelectorAll('.uch-btn').forEach(b => b.classList.remove('active'));
    setActiveUchastok(num);
    btn.classList.add('active');
  }
  renderList();
}

export function toggleLegend() {
  const legend = document.getElementById('legend');
  if (legend) legend.classList.toggle('open');
}

export function setShowMode(mode) {
  document.querySelectorAll('.show-mode-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`show-mode-${mode}`);
  if (btn) btn.classList.add('active');
  // Заглушка, логика переключения режимов будет позже
}

export function toggleSelectAll() {
  const cards = document.querySelectorAll('.machine-card');
  const anyUnselected = Array.from(cards).some(c => !c.classList.contains('selected'));
  cards.forEach(card => card.classList.toggle('selected', anyUnselected));
  if (anyUnselected) {
    document.querySelectorAll('.machine-card').forEach(card => selectedForShow.add(card.dataset.plate));
  } else {
    selectedForShow.clear();
  }
  renderList();
}

export function saveData(showIndicator = false) {
  try {
    const data = {
      rbRoutesByVehicle: rbRoutesByVehicle,
      selectedForShow: Array.from(selectedForShow),
      activeRouteIndex: activeRouteIndex,
      history: history || [],
      activeUchastok: activeUchastok
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (showIndicator) toast('Сохранено', 'success');
  } catch (e) {
    toast('Ошибка сохранения: ' + e.message, 'error');
  }
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.rbRoutesByVehicle) setRbRoutesByVehicle(data.rbRoutesByVehicle);
    if (data.selectedForShow) setSelectedForShow(new Set(data.selectedForShow));
    if (typeof data.activeRouteIndex === 'number') setActiveRouteIndex(data.activeRouteIndex);
    if (data.history) history = data.history;
    if (data.activeUchastok) setActiveUchastok(data.activeUchastok);
  } catch (e) {
    console.warn('loadData error:', e);
  }
}

function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}