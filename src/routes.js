// src/routes.js
import { MACHINES } from './data.js';
import { setMiniRouteVehicle, setActiveVehicle } from './state.js';

export function openMiniRoute(plate) {
  const m = MACHINES.find(x => x.plate === plate);
  if (!m) { alert('Машина не найдена: ' + plate); return; }
  setMiniRouteVehicle(plate);
  setActiveVehicle(plate);
  if (typeof window.renderRouteTabs === 'function') window.renderRouteTabs();
  if (typeof window.renderMiniRoute === 'function') window.renderMiniRoute();
  document.getElementById('mini-route').classList.add('open');
  console.log('openMiniRoute (routes.js):', plate);
}

export function closeMiniRoute() {
  setMiniRouteVehicle(null);
  document.getElementById('mini-route').classList.remove('open');
}

export function renderRouteTabs() { if (typeof window.renderRouteTabs === 'function') window.renderRouteTabs(); }
export function renderMiniRoute() { if (typeof window.renderMiniRoute === 'function') window.renderMiniRoute(); }
export function switchRoute(idx) { if (typeof window.switchRoute === 'function') window.switchRoute(idx); }
export function moveTab(idx, dir) { if (typeof window.moveTab === 'function') window.moveTab(idx, dir); }
export function moveRoutePoint(idx, dir) { if (typeof window.moveRoutePoint === 'function') window.moveRoutePoint(idx, dir); }
export function removeFromMiniRoute(idx) { if (typeof window.removeFromMiniRoute === 'function') window.removeFromMiniRoute(idx); }
export function clearActiveRoute() { if (typeof window.clearActiveRoute === 'function') window.clearActiveRoute(); }
export function copyRouteFrom() { if (typeof window.copyRouteFrom === 'function') window.copyRouteFrom(); }