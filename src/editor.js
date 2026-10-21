// src/editor.js

export function toggleDrawingMode() {
  if (typeof window.toggleDrawingMode === 'function') window.toggleDrawingMode();
}
export function toggleEditObjectMode(on) {
  if (typeof window.toggleEditObjectMode === 'function') window.toggleEditObjectMode(on);
}
export function addExtraLine() {
  if (typeof window.addExtraLine === 'function') window.addExtraLine();
}
export function toggleConnectMode() {
  if (typeof window.toggleConnectMode === 'function') window.toggleConnectMode();
}
export function handleConnectClick(gi, idx) {
  if (typeof window.handleConnectClick === 'function') window.handleConnectClick(gi, idx);
}
export function insertPointRelative(gi, idx, direction) {
  if (typeof window.insertPointRelative === 'function') window.insertPointRelative(gi, idx, direction);
}
export function deleteExtraLine(epIdx) {
  if (typeof window.deleteExtraLine === 'function') window.deleteExtraLine(epIdx);
}
export function clearThisLineGeometry(gi) {
  if (typeof window.clearThisLineGeometry === 'function') window.clearThisLineGeometry(gi);
}