import { MACHINES, STREETS, YARD_BOUNDARIES } from './data.js';
import { esc, lineLength, polygonArea, isYardObject } from './utils.js';
import {
  map, setMap,
  routeLayerGroup, setRouteLayerGroup,
  yardLayerGroup, setYardLayerGroup,
  overlapLayerGroup, setOverlapLayerGroup,
  previewLayerGroup, setPreviewLayerGroup,
  streetLayerGroup, setStreetLayerGroup,
  currentCategory, activeUchastok, activeRouteIndex, activeVehicle,
  miniRouteVehicle, showMode, showOverlaps, selectedForShow,
  rbRoutesByVehicle, getRouteColor, getUchastokColor, getYardColor,
  hoveredVehicle
} from './state.js';

export function initMap() {
  const bounds = L.latLngBounds([55.620,37.425],[55.705,37.555]);
  const newMap = L.map('map', {zoomControl:true, maxBounds:bounds, maxBoundsViscosity:0.7, minZoom:12, maxZoom:19}).setView([55.655,37.485], 14);
  setMap(newMap);

  const baseLayers = {
    'Схема': L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {subdomains:'abc', attribution:'&copy; OpenStreetMap France', maxZoom:20}),
    'Спутник': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution:'&copy; Esri', maxZoom:19})
  };
  baseLayers['Схема'].addTo(newMap);
  L.control.layers(baseLayers, null, {position:'topright', collapsed:false}).addTo(newMap);

  const streetLg = L.layerGroup().addTo(newMap);
  const yardLg = L.layerGroup().addTo(newMap);
  const routeLg = L.layerGroup().addTo(newMap);
  const overlapLg = L.layerGroup().addTo(newMap);
  const previewLg = L.layerGroup().addTo(newMap);

  setStreetLayerGroup(streetLg);
  setYardLayerGroup(yardLg);
  setRouteLayerGroup(routeLg);
  setOverlapLayerGroup(overlapLg);
  setPreviewLayerGroup(previewLg);

  setTimeout(() => newMap.invalidateSize(), 200);
}

function hashPlate(plate) {
  let h = plate.length;
  for (let i = 0; i < plate.length; i++) h = ((h << 5) - h + plate.charCodeAt(i)) | 0;
  return h >>> 0;
}

const DASH_PATTERNS = ['12,6', '6,4', '2,4', '16,4,2,4', '8,3'];
const LINE_SPACING_M = 5;
const METERS_PER_DEG_LAT = 111320;

function offsetPolyline(coords, offset) {
  if (!coords || coords.length < 2 || !offset) return coords ? coords.slice() : [];
  const result = [];
  const n = coords.length;
  const cosLat = Math.cos(coords[0][0] * Math.PI / 180);
  for (let i = 0; i < n; i++) {
    let dx = 0, dy = 0;
    if (i === 0) { dx = coords[1][1] - coords[0][1]; dy = coords[1][0] - coords[0][0]; }
    else if (i === n - 1) { dx = coords[n-1][1] - coords[n-2][1]; dy = coords[n-1][0] - coords[n-2][0]; }
    else {
      const dx1 = coords[i][1] - coords[i-1][1]; const dy1 = coords[i][0] - coords[i-1][0];
      const dx2 = coords[i+1][1] - coords[i][1]; const dy2 = coords[i+1][0] - coords[i][0];
      const len1 = Math.hypot(dx1, dy1) || 1e-9; const len2 = Math.hypot(dx2, dy2) || 1e-9;
      dx = dx1/len1 + dx2/len2; dy = dy1/len1 + dy2/len2;
    }
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) { result.push([coords[i][0], coords[i][1]]); continue; }
    const nx = -dy / len * offset; const ny = dx / len * offset;
    result.push([coords[i][0] + nx, coords[i][1] + ny / cosLat]);
  }
  return result;
}

export function redrawAllRoutes() {
  // Пока оставляем в index.html, перенесём позже
}
