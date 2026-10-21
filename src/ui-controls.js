import { activeUchastok, setActiveUchastok, selectedForShow, setSelectedForShow, currentCategory } from './state.js';
import { MACHINES } from './data.js';
import { renderList } from './ui.js';
export function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
export function toggleDropdown(id) { document.getElementById(id).classList.toggle('open'); }
export function toggleTheme() { document.body.classList.toggle('dark'); }

// === ействия и заглушки ===
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
  btn.innerHTML = isEdit ? '💾 <span>\u0413отово</span>' : '✏️ <span>едактировать</span>';
}

export function openHistory() { console.log('openHistory: logic not moved yet'); }
export function exportCSV() { console.log('exportCSV: logic not moved yet'); }
export function startOnboarding() { console.log('startOnboarding: logic not moved yet'); }
// === кспорт, печать и сохранение ===
export function exportHTML() { console.log('exportHTML: logic not moved yet'); }
export function printRoutes() { console.log('printRoutes: logic not moved yet'); }
export function undoLastAction() { console.log('undoLastAction: logic not moved yet'); }
export function saveData(silent = false) { console.log('saveData: logic not moved yet', silent); }
// === ильтры и участки ===
export function toggleExpandSidebar() { 
  document.getElementById('sidebar').classList.toggle('expanded'); 
}
export function toggleRouteFilter() { 
  console.log('toggleRouteFilter: logic not moved yet'); 
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
// === егенда и режимы показа ===
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
  if (allSelected) {
    setSelectedForShow(new Set());
  } else {
    setSelectedForShow(new Set(cat.map(m => m.plate)));
  }
  renderList();
}