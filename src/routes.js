// src/routes.js
import { MACHINES } from './data.js';
import { 
  rbRoutesByVehicle, activeRouteIndex, activeVehicle, miniRouteVehicle,
  setMiniRouteVehicle, setActiveVehicle
} from './state.js';

export function openMiniRoute(plate) {
  const m = MACHINES.find(x => x.plate === plate);
  if (!m) { alert('Машина не найдена: ' + plate); return; }
  setMiniRouteVehicle(plate);
  setActiveVehicle(plate);
  document.getElementById('mini-route').classList.add('open');
  console.log('openMiniRoute (routes.js):', plate);
}

export function closeMiniRoute() {
  setMiniRouteVehicle(null);
  document.getElementById('mini-route').classList.remove('open');
}