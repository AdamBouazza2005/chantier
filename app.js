/* Plans · BOUAZZA IMMO — plan zoomable par niveau ; touchez un appartement pour voir son plan */
'use strict';
const NIVEAUX = [['RDC', 'Rez-de-chaussée', 'rdc'], ['1', '1er étage', 'e23'], ['2', '2e étage', 'e23'], ['3', '3e étage', 'e23'], ['4', '4e étage', 'e4']];
const NIV = Object.fromEntries(NIVEAUX.map(n => [n[0], { nom: n[1], img: n[2] }]));
const LOTMAP = Object.fromEntries(LOTS.map(l => [l.id, l]));
const $ = s => document.querySelector(s);
const stage = $('#stage'), layer = $('#layer'), img = $('#img');

/* ---------- zoom et déplacement (doigts, molette, double-tap) ---------- */
let s = 1, x = 0, y = 0, fitS = 1, iw = 1, ih = 1;
function apply() { layer.style.transform = `translate(${x}px,${y}px) scale(${s})`; layer.style.setProperty('--inv', 1 / s); }
function clamp() {
  const W = stage.clientWidth, H = stage.clientHeight;
  s = Math.min(Math.max(s, fitS), fitS * 8);
  const w = iw * s, h = ih * s;
  x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, x));
  y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, y));
}
function fit() { const W = stage.clientWidth, H = stage.clientHeight; fitS = Math.min(W / iw, H / ih) * 0.98; s = fitS; x = y = 0; clamp(); apply(); }
function zoomAt(f, cx, cy) { const ns = Math.min(Math.max(s * f, fitS), fitS * 8); x = cx - (cx - x) * ns / s; y = cy - (cy - y) * ns / s; s = ns; clamp(); apply(); }
const pts = new Map(); let start = null, moved = false, lastTap = 0, pinch = null;
const local = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
stage.addEventListener('pointerdown', e => {
  stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, local(e));
  if (pts.size === 1) { start = { p: local(e), x, y, t: Date.now(), hot: e.target.closest('.hot') }; moved = false; if (start.hot) start.hot.classList.add('press'); }
  if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s, x, y, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; moved = true; }
});
stage.addEventListener('pointermove', e => {
  if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, local(e));
  if (pts.size >= 2 && pinch) {
    const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const ns = Math.min(Math.max(pinch.s * d / pinch.d, fitS), fitS * 8);
    x = m[0] - (pinch.m[0] - pinch.x) * ns / pinch.s; y = m[1] - (pinch.m[1] - pinch.y) * ns / pinch.s; s = ns; clamp(); apply();
  } else if (start) {
    const p = local(e), dx = p[0] - start.p[0], dy = p[1] - start.p[1];
    if (Math.hypot(dx, dy) > 8) moved = true;
    if (moved) { x = start.x + dx; y = start.y + dy; clamp(); apply(); }
  }
});
function up(e) {
  if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId);
  document.querySelectorAll('.hot.press').forEach(h => h.classList.remove('press'));
  if (pts.size === 1) { const p = [...pts.values()][0]; start = { p, x, y }; pinch = null; return; }
  if (pts.size) return;
  pinch = null;
  if (!moved && start) {
    const now = Date.now(), p = local(e);
    if (start.hot && now - start.t < 600) { location.hash = '#/' + start.hot.dataset.lot; }
    else if (now - lastTap < 320) { s > fitS * 1.5 ? (s = fitS, clamp(), apply()) : zoomAt(2.5, p[0], p[1]); lastTap = 0; }
    else lastTap = now;
  }
  start = null;
}
stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
stage.addEventListener('wheel', e => { e.preventDefault(); const p = local(e); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, p[0], p[1]); }, { passive: false });
window.addEventListener('resize', () => { const k = s / fitS; fit(); zoomAt(k, stage.clientWidth / 2, stage.clientHeight / 2); });

/* ---------- écrans ---------- */
let floor = 'RDC';
try { floor = localStorage.getItem('plans-niveau') || 'RDC'; } catch (e) { }
const floors = $('#floors');
floors.innerHTML = NIVEAUX.map(([k]) => `<button type="button" data-f="${k}">${k}</button>`).join('');
floors.querySelectorAll('button').forEach(b => b.onclick = () => { floor = b.dataset.f; try { localStorage.setItem('plans-niveau', floor); } catch (e) { } location.hash = '#/'; show(); });

function load(src, w, h, hots) {
  layer.querySelectorAll('.hot').forEach(h => h.remove());
  iw = w; ih = h; img.style.width = w + 'px'; img.style.height = h + 'px';
  layer.insertAdjacentHTML('beforeend', hots || '');
  img.onload = null; img.src = src; fit();
}
function show() {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const l = LOTMAP[id];
  if (l) {
    $('#title').textContent = 'Appartement ' + l.id; $('#back').hidden = false; $('#backlbl').textContent = NIV[l.niv].nom; floors.hidden = true;
    const im = new Image(); im.onload = () => load(im.src, im.naturalWidth, im.naturalHeight); im.src = `plans/appart_${l.type}.jpg`;
    document.title = 'Appartement ' + l.id; return;
  }
  const n = NIV[floor] ? floor : 'RDC', f = NIV[n];
  $('#title').textContent = f.nom; $('#back').hidden = true; floors.hidden = false; document.title = f.nom + ' · Plans';
  floors.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === n));
  const [w, h] = { rdc: [2240, 1190], e23: [2200, 1210], e4: [2200, 1210] }[f.img];
  const hots = LOTS.filter(l => l.niv === n).map(l => (HOT[l.type] || []).map((b, i) => `<a class="hot" data-lot="${l.id}" href="#/${l.id}" aria-label="Appartement ${l.id}" style="left:${b[0] / 100 * w}px;top:${b[1] / 100 * h}px;width:${b[2] / 100 * w}px;height:${b[3] / 100 * h}px">${i === 0 ? `<span>${l.id}</span>` : ''}</a>`).join('')).join('');
  load(`plans/niveau_${f.img}.jpg`, w, h, hots);
}
$('#back').onclick = () => { const l = LOTMAP[decodeURIComponent(location.hash.replace(/^#\/?/, ''))]; if (l) floor = l.niv; location.hash = '#/'; };
stage.addEventListener('click', e => { if (e.target.closest('.hot')) e.preventDefault(); });
document.addEventListener('keydown', e => { const a = e.target.closest && e.target.closest('.hot'); if (a && e.key === 'Enter') location.hash = '#/' + a.dataset.lot; });
window.addEventListener('hashchange', show);
show();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
