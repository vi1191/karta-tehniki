import { MACHINES } from './data.js';
import { escAttr } from './utils.js';
import { renderList } from './ui.js';
import { 
  rbRoutesByVehicle, selectedForShow, activeRouteIndex, history, showMode, activeUchastok, 
  routeFilterActive, setActiveUchastok, setRbRoutesByVehicle, setActiveRouteIndex, setSelectedForShow, 
  setHistory, STORAGE_KEY, undoStack, restoreSnapshot, updateUndoButton,
  activeVehicle, miniRouteVehicle, setActiveVehicle, setMiniRouteVehicle
} from './state.js';
import { renderEditorStreets, renderStreetLayer, cancelEditing } from './editor.js';
import { renderRouteTabs, renderMiniRoute } from './routes.js';

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
  import('./state.js').then(m => m.setEditMode(on));
  const b = document.getElementById('edit-mode-btn');
  if (b) b.innerHTML = on ? 'Готово' : '✏️ <span>Редактировать</span>';
  const badge = document.getElementById('mode-badge');
  if (badge) {
    badge.className = on ? 'edit' : 'view';
    badge.textContent = on ? '✏️ Редактирование' : '👁 Просмотр';
  }
}

export function openHistory() {
  document.getElementById('editor-panel')?.classList.remove('open');
  document.getElementById('history-panel').classList.add('open');
  renderHistory();
}

function renderHistory() {
  const body = document.getElementById('history-body');
  if (!body) return;
  if (!history || !history.length) {
    body.innerHTML = '<div class="hp-empty">История пуста</div>';
    return;
  }
  body.innerHTML = history.map(h =>
    '<div class="hp-item"><div class="hp-time">' + escAttr(h.time || '') + '</div>' + escAttr(h.action || '') + '</div>'
  ).join('');
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

export async function exportHTML() {
  try {
    let html = window.__SINGLE_FILE_TEMPLATE__;
    if (!html) {
      html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    }
    const data = {
      rbRoutesByVehicle,
      selectedForShow: Array.from(selectedForShow),
      activeRouteIndex,
      history: history || [],
      activeUchastok
    };
    const inject = '<script>window.__EMBEDDED_DATA__ = ' +
      JSON.stringify(data).replace(/</g, '\\u003c') + ';</' + 'script>';
    html = html.replace('</body>', inject + '</body>');

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karta_tehniki_' + new Date().toISOString().slice(0, 10) + '.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    toast('HTML-файл сохранён', 'success');
  } catch (err) {
    toast('Ошибка экспорта: ' + err.message, 'error');
  }
}

export function startOnboarding() { console.log('[TODO] startOnboarding'); }
export function printRoutes() { console.log('[TODO] printRoutes'); }

export function undoLastAction() {
  if (undoStack.length === 0) {
    toast('Нечего отменять', 'info');
    return;
  }
  const entry = undoStack.pop();
  try {
    restoreSnapshot(entry.snap);
    renderList();
    
    import('./editor.js').then(m => {
      m.renderStreetLayer(); 
      m.renderEditorStreets();
    });
    
    if (miniRouteVehicle) {
      renderRouteTabs();
      renderMiniRoute();
    }
    saveData(false);
    toast('Отменено: ' + (entry.label || 'действие'), 'success');
  } catch (e) {
    console.error('undo error:', e);
    toast('Ошибка отмены', 'error');
  } finally {
    updateUndoButton();
  }
}

export function toggleExpandSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('expanded');
}

export function toggleRouteFilter() {
  const btn = document.getElementById('on-route-count');
  const isActive = btn?.classList.toggle('active');
  const cards = document.querySelectorAll('.machine-card');
  cards.forEach(card => {
    const plate = card.dataset.plate;
    const hasRoute = rbRoutesByVehicle[plate]?.some(r => r.items && r.items.length > 0);
    card.style.display = (isActive && !hasRoute) ? 'none' : '';
  });
}

export function toggleOverlaps() { console.log('[TODO] toggleOverlaps'); }

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
  document.querySelectorAll('.mode-toggle button').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.mode-toggle button[data-mode="' + mode + '"]');
  if (btn) btn.classList.add('active');
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
    if (raw) {
      const data = JSON.parse(raw);
      if (data.rbRoutesByVehicle) setRbRoutesByVehicle(data.rbRoutesByVehicle);
      if (data.selectedForShow) setSelectedForShow(new Set(data.selectedForShow));
      if (typeof data.activeRouteIndex === 'number') setActiveRouteIndex(data.activeRouteIndex);
      if (data.history) setHistory(data.history);
      if (data.activeUchastok) setActiveUchastok(data.activeUchastok);
      return;
    }
    if (window.__EMBEDDED_DATA__) {
      const d = window.__EMBEDDED_DATA__;
      if (d.rbRoutesByVehicle) setRbRoutesByVehicle(d.rbRoutesByVehicle);
      if (d.selectedForShow) setSelectedForShow(new Set(d.selectedForShow));
      if (typeof d.activeRouteIndex === 'number') setActiveRouteIndex(d.activeRouteIndex);
      if (d.history) setHistory(d.history);
      if (d.activeUchastok) setActiveUchastok(d.activeUchastok);
    }
  } catch (e) {
    console.warn("loadData error:", e);
  }
}

function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}