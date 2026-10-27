/* Chantier · BOUAZZA IMMO — suivi de chantier simple, hors ligne, données sur le téléphone */
'use strict';

const KEY = 'bouazza-chantier-v1';
const NIVEAUX = [['RDC', 'Rez-de-chaussée', 'rdc'], ['1', '1er étage', 'e23'], ['2', '2e étage', 'e23'], ['3', '3e étage', 'e23'], ['4', '4e étage', 'e4']];
const NIV = Object.fromEntries(NIVEAUX.map(n => [n[0], { nom: n[1], img: n[2] }]));
const IMGSIZE = { rdc: [2240, 1190], e23: [2200, 1210], e4: [2200, 1210] };
const LOTMAP = Object.fromEntries(LOTS.map(l => [l.id, l]));
const ETAPES_DEFAUT = ['Gros œuvre', 'Cloisons (briques)', 'Électricité (gaines, boîtiers)', 'Plomberie', 'Enduits / plâtre', 'Étanchéité salles d’eau', 'Carrelage et sols', 'Menuiserie (portes, fenêtres)', 'Peinture', 'Sanitaires et appareillage', 'Nettoyage, prêt à livrer'];
const ETAT = ['Pas commencé', 'En cours', 'Terminé'];

/* ---------- état ---------- */
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 12);
function defaults() {
  return { v: 1, settings: { nom: 'BOUAZZA IMMO', etapes: ETAPES_DEFAUT.map(l => ({ id: uid(), l })) }, lots: Object.fromEntries(LOTS.map(l => [l.id, { steps: {} }])), issues: {} };
}
let S = load();
function load() {
  try { const r = localStorage.getItem(KEY); if (r) { const s = JSON.parse(r); for (const l of LOTS) if (!s.lots[l.id]) s.lots[l.id] = { steps: {} }; s.issues = s.issues || {}; return s; } } catch (e) { }
  return defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Enregistrement impossible : mémoire pleine'); } }

/* ---------- photos (IndexedDB) ---------- */
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => { const r = indexedDB.open('bouazza-chantier', 1); r.onupgradeneeded = () => { const s = r.result.createObjectStore('photos', { keyPath: 'id' }); s.createIndex('lot', 'lotId'); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return dbp;
}
async function tx(mode, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('photos', mode); const st = t.objectStore('photos'); const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); }
const putPhoto = p => tx('readwrite', s => s.put(p));
const delPhoto = id => tx('readwrite', s => s.delete(id));
const getPhoto = id => tx('readonly', s => s.get(id));
const photosOf = lotId => tx('readonly', s => s.index('lot').getAll(lotId));
const allPhotos = () => tx('readonly', s => s.getAll());
const urls = new Map();
function photoUrl(p) { if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob)); return urls.get(p.id); }

function compress(file) {
  return new Promise((res, rej) => {
    const img = new Image(); const u = URL.createObjectURL(file);
    img.onload = () => {
      const m = 1600, sc = Math.min(1, m / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(b => b ? res(b) : rej(new Error('photo')), 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('photo')); };
    img.src = u;
  });
}
const camera = document.getElementById('camera');
function takePhoto() {
  return new Promise(res => {
    camera.value = '';
    camera.onchange = async () => { const f = camera.files[0]; if (!f) return res(null); try { res(await compress(f)); } catch (e) { toast('Photo illisible, réessayez'); res(null); } };
    camera.click();
  });
}

/* ---------- utilitaires ---------- */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const fdate = d => d ? new Date(d.length > 10 ? d : d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
const ICON = {
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2zM12 10v5M12 18v.5"/></svg>',
  wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>'
};

/* ---------- avancement ---------- */
function pctLot(id) { const E = S.settings.etapes; if (!E.length) return 0; const st = S.lots[id].steps; return Math.round(E.reduce((a, e) => a + ((st[e.id] || {}).s || 0), 0) / (2 * E.length) * 100); }
const lotsNiv = n => LOTS.filter(l => l.niv === n);
const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
const pctNiv = n => avg(lotsNiv(n).map(l => pctLot(l.id)));
const pctAll = () => avg(LOTS.map(l => pctLot(l.id)));
const openIssues = lotId => Object.values(S.issues).filter(i => !i.ok && (!lotId || i.lotId === lotId));
const colorOf = p => p >= 100 ? 'var(--done)' : p > 0 ? 'var(--doing)' : 'var(--todo)';
const prog = p => `<div class="prog"><i class="${p >= 100 ? 'full' : ''}" style="width:${p}%"></i></div>`;

/* ---------- feuilles ---------- */
const sheet = $('#sheet'), sheetform = $('#sheetform'); let sheetOk = null;
function openSheet(html, ok) { sheetform.innerHTML = html; sheetOk = ok; sheet.showModal(); }
sheetform.addEventListener('submit', e => { if (e.submitter && e.submitter.value === 'ok' && sheetOk) { if (sheetOk(Object.fromEntries(new FormData(sheetform))) === false) { e.preventDefault(); return; } } sheetOk = null; });
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
const okCancel = (ok = 'Enregistrer', cls = '') => `<div class="btns"><button class="btn ghost" value="cancel" formnovalidate>Annuler</button><button class="btn ${cls}" value="ok">${ok}</button></div>`;
function confirmSheet(title, text, ok, label = 'Supprimer') { openSheet(`<h2>${esc(title)}</h2><p style="margin:0">${esc(text)}</p>${okCancel(label, 'red')}`, () => { ok(); }); }

/* ---------- visionneuse ---------- */
const viewer = $('#viewer'), vimg = $('#vimg'), vscroll = $('#vscroll'); let vz = 1;
function openViewer(src, alt) {
  vimg.src = src; vimg.alt = alt || ''; vz = 1; viewer.hidden = false;
  const fit = () => { const W = vscroll.clientWidth, H = vscroll.clientHeight, r = vimg.naturalWidth / vimg.naturalHeight || 1; vimg.dataset.base = Math.min(W, H * r); zoom(1); };
  if (vimg.complete && vimg.naturalWidth) fit(); else vimg.onload = fit;
  history.pushState({ viewer: 1 }, '');
}
function zoom(z) {
  const cx = (vscroll.scrollLeft + vscroll.clientWidth / 2) / (vimg.offsetWidth || 1), cy = (vscroll.scrollTop + vscroll.clientHeight / 2) / (vimg.offsetHeight || 1);
  vz = Math.max(1, Math.min(5, z)); vimg.style.width = (+vimg.dataset.base * vz) + 'px';
  vimg.style.marginTop = vz === 1 ? Math.max(0, (vscroll.clientHeight - vimg.offsetHeight) / 2) + 'px' : '0';
  vscroll.scrollLeft = cx * vimg.offsetWidth - vscroll.clientWidth / 2; vscroll.scrollTop = cy * vimg.offsetHeight - vscroll.clientHeight / 2;
}
$('#vplus').onclick = () => zoom(vz + 1); $('#vminus').onclick = () => zoom(vz - 1);
vimg.ondblclick = () => zoom(vz >= 3 ? 1 : vz + 1);
function closeViewer() { if (!viewer.hidden) { viewer.hidden = true; vimg.removeAttribute('src'); } }
$('#vclose').onclick = () => history.back();
window.addEventListener('popstate', closeViewer);

/* ---------- routeur ---------- */
function route() {
  closeViewer();
  const [p, a] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  $('#back').hidden = !p; $('#brand').textContent = S.settings.nom || 'Chantier';
  const v = $('#view');
  if (p === 'niveau' && NIV[a]) viewNiveau(v, a);
  else if (p === 'lot' && LOTMAP[a]) viewLot(v, a);
  else if (p === 'probleme') viewProblemes(v);
  else if (p === 'reglages') viewReglages(v);
  else viewHome(v);
}
function setTitle(t) { $('#title').textContent = t; document.title = t + ' · Chantier'; }
window.addEventListener('hashchange', () => { route(); $('#view').scrollTop = 0; });
$('#back').onclick = () => { const [p, a] = location.hash.replace(/^#\/?/, '').split('/'); location.hash = p === 'lot' ? '#/niveau/' + LOTMAP[decodeURIComponent(a)].niv : '#/'; };
function rerender() { const y = $('#view').scrollTop; route(); $('#view').scrollTop = y; }

/* ---------- accueil ---------- */
function viewHome(v) {
  setTitle('Niveaux');
  const p = pctAll(), pb = openIssues().length;
  v.innerHTML = `<div class="wrap">
    <section class="card sec">
      <div class="sech"><div><div class="muted small">Avancement global</div><div class="big num">${p} %</div></div>${pb ? `<a class="badge" href="#/probleme">${pb} problème${pb > 1 ? 's' : ''}</a>` : ''}</div>
      ${prog(p)}
    </section>
    <div class="floors">${[...NIVEAUX].reverse().map(([k, nm]) => { const pc = pctNiv(k), ib = lotsNiv(k).reduce((a, l) => a + openIssues(l.id).length, 0); return `<a class="floor" href="#/niveau/${k}"><span class="tag">${k === 'RDC' ? 'RDC' : k}</span><div><div class="nm">${nm} ${ib ? `<span class="badge">${ib}</span>` : ''}</div><div class="muted small">${lotsNiv(k).length} appartements</div>${prog(pc)}</div><span class="pc num">${pc} %</span></a>`; }).join('')}</div>
    <div class="sec"><button class="btn green" type="button" id="report">${ICON.wa} Envoyer le point</button><a class="btn ghost" href="#/probleme">${ICON.warn} Problèmes</a></div>
  </div>`;
  $('#report').onclick = sendReport;
}
function sendReport() {
  const lines = [`*Point chantier ${S.settings.nom}* · ${fdate(today())}`, `Avancement global : ${pctAll()} %`, ''];
  for (const [k, nm] of NIVEAUX) lines.push(`${nm} : ${pctNiv(k)} %`);
  const op = openIssues();
  lines.push('', op.length ? `*${op.length} problème${op.length > 1 ? 's' : ''} en cours :*` : 'Aucun problème en cours.');
  op.sort((a, b) => a.date.localeCompare(b.date)).forEach(i => lines.push(`- Lot ${i.lotId} : ${i.text.replace(/\s+/g, ' ').slice(0, 120)}`));
  const doneToday = [];
  for (const l of LOTS) for (const e of S.settings.etapes) { const s = S.lots[l.id].steps[e.id]; if (s && s.s === 2 && s.d === today()) doneToday.push(`- Lot ${l.id} : ${e.l}`); }
  if (doneToday.length) lines.push('', '*Terminé aujourd’hui :*', ...doneToday.slice(0, 30));
  const a = document.createElement('a'); a.href = 'https://wa.me/?text=' + encodeURIComponent(lines.join('\n')); a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- niveau ---------- */
function viewNiveau(v, k) {
  const n = NIV[k], ls = lotsNiv(k), [w, h] = IMGSIZE[n.img];
  setTitle(n.nom);
  const spots = ls.map(l => (HOT[l.type] || []).map((b, i) => { const p = pctLot(l.id), ib = openIssues(l.id).length; return `<a class="hot" href="#/lot/${l.id}" aria-label="Appartement ${l.id}, ${p} %" style="left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%;--c:${colorOf(p)}">${i === 0 ? `<span>${l.id}${ib ? `<b>${ib}</b>` : ''}</span>` : ''}</a>`; }).join('')).join('');
  v.innerHTML = `<div class="wrap">
    <div class="planwrap"><div class="planbox"><img src="plans/niveau_${n.img}.jpg" width="${w}" height="${h}" alt="Plan du ${esc(n.nom.toLowerCase())}">${spots}</div></div>
    <div class="legend"><span><i style="background:var(--todo)"></i>Pas commencé</span><span><i style="background:var(--doing)"></i>En cours</span><span><i style="background:var(--done)"></i>Terminé</span><span><i style="background:var(--bad);border-radius:50%"></i>Problème</span></div>
    <p class="muted small" style="margin:0">Touchez un appartement sur le plan ou dans la liste.</p>
    <div class="lots">${ls.map(l => { const p = pctLot(l.id), ib = openIssues(l.id).length; return `<a class="lot" href="#/lot/${l.id}"><div class="row"><b>${l.id}</b>${ib ? `<span class="badge">${ib}</span>` : ''}</div><div class="row"><span class="muted small">${l.s} m²</span><span class="pc num" style="color:${colorOf(p)}">${p} %</span></div>${prog(p)}</a>`; }).join('')}</div>
    <div class="btns">${(() => { const i = NIVEAUX.findIndex(x => x[0] === k), dn = NIVEAUX[i - 1], up = NIVEAUX[i + 1]; return (dn ? `<a class="btn ghost" href="#/niveau/${dn[0]}">${ICON.down} ${dn[0] === 'RDC' ? 'RDC' : dn[0] + (dn[0] === '1' ? 'er' : 'e')}</a>` : '<span></span>') + (up ? `<a class="btn ghost" href="#/niveau/${up[0]}">${ICON.up} ${up[0] + (up[0] === '1' ? 'er' : 'e')} étage</a>` : '<span></span>'); })()}</div>
  </div>`;
}

/* ---------- appartement ---------- */
async function viewLot(v, id) {
  const l = LOTMAP[id], st = S.lots[id], p = pctLot(id), E = S.settings.etapes;
  setTitle('Appartement ' + id);
  const iss = Object.values(S.issues).filter(i => i.lotId === id).sort((a, b) => (a.ok - b.ok) || b.date.localeCompare(a.date));
  v.innerHTML = `<div class="wrap">
    <section class="card sec">
      <div class="sech"><div><div class="muted small">${esc(NIV[l.niv].nom)} · type ${l.type.slice(1)}</div><div class="big num" style="color:${colorOf(p)}">${p} %</div></div>${openIssues(id).length ? `<span class="badge">${openIssues(id).length} problème${openIssues(id).length > 1 ? 's' : ''}</span>` : ''}</div>
      ${prog(p)}
    </section>
    <button class="plan1" type="button" id="bigplan" aria-label="Agrandir le plan"><img src="plans/appart_${l.type}.jpg" alt="Plan de l’appartement ${id}"></button>
    <div class="hint">Touchez le plan pour l’agrandir</div>
    <div class="btns"><button class="btn" type="button" id="addphoto">${ICON.cam} Photo</button><button class="btn red" type="button" id="addissue">${ICON.warn} Problème</button></div>
    <section class="card sec">
      <div class="sech"><h2>Travaux</h2><span class="muted small">touchez pour changer</span></div>
      <div class="steps">${E.map(e => { const s = st.steps[e.id] || { s: 0 }; return `<button type="button" class="step s${s.s}" data-step="${e.id}"><span class="ic">${s.s === 2 ? ICON.check : ''}</span><span class="lb">${esc(e.l)}</span><span class="st">${ETAT[s.s]}${s.s === 2 && s.d ? '<br>' + fdate(s.d) : ''}</span></button>`; }).join('')}</div>
    </section>
    <section class="card sec">
      <div class="sech"><h2>Problèmes</h2></div>
      ${iss.length ? iss.map(i => `<div class="issue ${i.ok ? 'ok' : ''}"><p>${esc(i.text)}</p>${i.photoId ? `<img data-ph="${i.photoId}" alt="Photo du problème">` : ''}<div class="meta">Signalé le ${fdate(i.date)}${i.ok ? ` · réglé le ${fdate(i.dateOk)}` : ''}</div><div class="mini">${i.ok ? `<button type="button" data-reopen="${i.id}">Rouvrir</button>` : `<button type="button" class="okb" data-ok="${i.id}">Réglé</button>`}<button type="button" data-deliss="${i.id}">Supprimer</button></div></div>`).join('') : '<div class="empty">Aucun problème signalé.</div>'}
    </section>
    <section class="card sec">
      <div class="sech"><h2>Photos</h2></div>
      <div class="photos" id="photos"><div class="muted small">Chargement…</div></div>
    </section>
    <section class="card sec">
      <div class="sech"><h2>Dimensions</h2><span class="muted small">en mètres</span></div>
      <div class="facts"><div class="fact"><small>Surface</small><b>${l.s} m²</b></div><div class="fact"><small>Salles d’eau</small><b>${l.sdb}</b></div><div class="fact"><small>${l.ter ? 'Terrasse' : 'Extérieur'}</small><b>${l.ter ? l.ter + ' m²' : esc(l.ext.join(', ') || '—')}</b></div></div>
      <div class="rooms">${l.pieces.map(([n, d]) => `<div class="room"><span>${esc(n)}</span><b>${esc(d)}</b></div>`).join('')}</div>
    </section>
  </div>`;

  $('#bigplan').onclick = () => openViewer(`plans/appart_${l.type}.jpg`, 'Plan ' + id);
  v.querySelectorAll('[data-step]').forEach(b => b.onclick = () => {
    const sid = b.dataset.step, cur = (st.steps[sid] || { s: 0 }).s, n = (cur + 1) % 3;
    st.steps[sid] = { s: n, d: today() }; save(); rerender();
    if (navigator.vibrate) navigator.vibrate(15);
    toast(E.find(e => e.id === sid).l + ' : ' + ETAT[n].toLowerCase());
  });
  $('#addphoto').onclick = async () => { const b = await takePhoto(); if (!b) return; await putPhoto({ id: uid(), lotId: id, date: new Date().toISOString(), blob: b }); toast('Photo enregistrée'); rerender(); };
  $('#addissue').onclick = () => addIssue(id);
  v.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { const i = S.issues[b.dataset.ok]; i.ok = true; i.dateOk = today(); save(); toast('Problème réglé'); rerender(); });
  v.querySelectorAll('[data-reopen]').forEach(b => b.onclick = () => { const i = S.issues[b.dataset.reopen]; i.ok = false; i.dateOk = ''; save(); rerender(); });
  v.querySelectorAll('[data-deliss]').forEach(b => b.onclick = () => confirmSheet('Supprimer ce problème ?', 'Il sera effacé de la liste, avec sa photo.', async () => { const i = S.issues[b.dataset.deliss]; if (i.photoId) await delPhoto(i.photoId); delete S.issues[i.id]; save(); rerender(); }));
  for (const im of v.querySelectorAll('[data-ph]')) { const ph = await getPhoto(im.dataset.ph); if (ph) { im.src = photoUrl(ph); im.onclick = () => openViewer(im.src, 'Photo'); } else im.remove(); }
  const list = (await photosOf(id)).sort((a, b) => b.date.localeCompare(a.date));
  const box = $('#photos'); if (!box) return;
  box.innerHTML = list.length ? list.map(p => `<button type="button" data-view="${p.id}"><img src="${photoUrl(p)}" alt="Photo du ${fdate(p.date)}"><small>${fdate(p.date)}</small></button>`).join('') : '<div class="empty" style="grid-column:1/-1">Pas encore de photo. Touchez « Photo » pour en prendre une.</div>';
  box.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
    const p = list.find(x => x.id === b.dataset.view);
    openSheet(`<h2>Photo · ${fdate(p.date)}</h2><img class="prev" src="${photoUrl(p)}" alt=""><div class="btns"><button class="btn ghost" value="zoom" type="submit">Agrandir</button><button class="btn red" value="ok">Supprimer</button></div><button class="btn ghost" value="cancel">Fermer</button>`, () => { delPhoto(p.id).then(() => { toast('Photo supprimée'); rerender(); }); });
    sheetform.querySelector('[value=zoom]').onclick = e => { e.preventDefault(); sheet.close(); openViewer(photoUrl(p), 'Photo'); };
  });
}
function addIssue(lotId) {
  let blob = null;
  openSheet(`<h2>Problème · ${lotId}</h2>
    <label class="fl">Qu’est-ce qui ne va pas ?<textarea class="f" name="t" placeholder="Ex. fissure mur chambre, prise manquante cuisine…" required></textarea></label>
    <img class="prev" id="iprev" hidden alt="">
    <button class="btn ghost" type="button" id="iphoto">${ICON.cam} Ajouter une photo</button>
    ${okCancel('Signaler', '')}`, fd => {
    if (!fd.t.trim()) { toast('Décrivez le problème'); return false; }
    const id = uid(), photoId = blob ? uid() : null;
    S.issues[id] = { id, lotId, text: fd.t.trim(), date: today(), ok: false, photoId };
    save();
    (blob ? putPhoto({ id: photoId, lotId, date: new Date().toISOString(), blob, issueId: id }) : Promise.resolve()).then(() => { toast('Problème signalé'); rerender(); });
  });
  $('#iphoto').onclick = async () => { const b = await takePhoto(); if (!b) return; blob = b; const im = $('#iprev'); im.src = URL.createObjectURL(b); im.hidden = false; $('#iphoto').lastChild.textContent = ' Changer la photo'; };
}

/* ---------- tous les problèmes ---------- */
function viewProblemes(v) {
  setTitle('Problèmes');
  const op = openIssues().sort((a, b) => a.date.localeCompare(b.date));
  const done = Object.values(S.issues).filter(i => i.ok).sort((a, b) => b.dateOk.localeCompare(a.dateOk)).slice(0, 20);
  const row = i => `<a class="issue ${i.ok ? 'ok' : ''}" href="#/lot/${i.lotId}" style="text-decoration:none"><p><b>${i.lotId}</b> · ${esc(i.text)}</p><div class="meta">Signalé le ${fdate(i.date)}${i.ok ? ` · réglé le ${fdate(i.dateOk)}` : ''}</div></a>`;
  v.innerHTML = `<div class="wrap">
    <section class="sec"><div class="sech"><h2>En cours (${op.length})</h2></div>${op.length ? op.map(row).join('') : '<div class="empty">Aucun problème en cours.</div>'}</section>
    ${done.length ? `<section class="sec"><div class="sech"><h2>Réglés récemment</h2></div>${done.map(row).join('')}</section>` : ''}
    <p class="muted small" style="margin:0">Pour signaler un problème, ouvrez l’appartement concerné et touchez « Problème ».</p>
  </div>`;
}

/* ---------- réglages ---------- */
function viewReglages(v) {
  setTitle('Réglages');
  v.innerHTML = `<div class="wrap">
  <form class="card sec" id="fset">
    <label class="fl">Nom du chantier<input class="f" name="nom" value="${esc(S.settings.nom)}"></label>
    <label class="fl">Étapes des travaux (une par ligne, dans l’ordre)<textarea class="f" name="et" style="min-height:300px">${esc(S.settings.etapes.map(e => e.l).join('\n'))}</textarea></label>
    <p class="muted small" style="margin:0">Une étape renommée garde son avancement si vous ne changez que le texte de la même ligne.</p>
    <button class="btn" type="submit">Enregistrer</button>
  </form>
  <section class="card sec">
    <h2>Sauvegarde</h2>
    <p class="small" style="margin:0">Tout est enregistré sur ce téléphone. Exportez une sauvegarde chaque semaine (avec les photos) et envoyez-la au bureau.</p>
    <button class="btn" type="button" id="exp">${ICON.down} Exporter la sauvegarde</button>
    <label class="btn ghost" for="imp">${ICON.up} Importer une sauvegarde</label><input type="file" id="imp" accept=".json,application/json" hidden>
  </section>
  <section class="card sec"><h2>Recommencer</h2><button class="btn red" type="button" id="wipe">Tout effacer sur ce téléphone</button></section>
  <p class="muted small" style="text-align:center;margin:0">Chantier · ${esc(S.settings.nom)} · v1.0</p>
  </div>`;
  $('#fset').onsubmit = e => {
    e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target));
    const old = S.settings.etapes, labels = fd.et.split('\n').map(x => x.trim()).filter(Boolean);
    S.settings.etapes = labels.map((l, i) => old.find(o => o.l === l) || (old[i] && !labels.includes(old[i].l) ? { id: old[i].id, l } : { id: uid(), l }));
    S.settings.nom = fd.nom.trim() || 'Chantier'; save(); toast('Réglages enregistrés'); rerender();
  };
  $('#exp').onclick = async () => {
    toast('Préparation de la sauvegarde…');
    const ph = await allPhotos();
    const photos = await Promise.all(ph.map(p => new Promise(r => { const fr = new FileReader(); fr.onload = () => r({ id: p.id, lotId: p.lotId, date: p.date, issueId: p.issueId, data: fr.result }); fr.readAsDataURL(p.blob); })));
    const name = `chantier-sauvegarde-${today()}.json`, blob = new Blob([JSON.stringify({ app: 'chantier', data: S, photos })], { type: 'application/json' });
    try { const f = new File([blob], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [f], title: name }); return; } } catch (err) { if (err.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  $('#imp').onchange = e => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result); if (d.app !== 'chantier' || !d.data) throw 0;
        confirmSheet('Remplacer les données ?', `Tout ce qui est sur ce téléphone sera remplacé par la sauvegarde (${(d.photos || []).length} photos).`, async () => {
          S = d.data; save(); await tx('readwrite', s => s.clear());
          for (const p of d.photos || []) { const b = await (await fetch(p.data)).blob(); await putPhoto({ id: p.id, lotId: p.lotId, date: p.date, issueId: p.issueId, blob: b }); }
          toast('Sauvegarde importée'); location.hash = '#/';
        }, 'Importer');
      } catch (err) { toast('Ce fichier n’est pas une sauvegarde du chantier'); }
    };
    r.readAsText(f); e.target.value = '';
  };
  $('#wipe').onclick = () => openSheet(`<h2>Tout effacer ?</h2><p style="margin:0">Avancement, problèmes et photos seront supprimés de ce téléphone. Tapez EFFACER pour confirmer.</p><input class="f" name="w" autocomplete="off">${okCancel('Effacer', 'red')}`, fd => {
    if (fd.w.trim().toUpperCase() !== 'EFFACER') { toast('Tapez EFFACER pour confirmer'); return false; }
    S = defaults(); save(); tx('readwrite', s => s.clear()); location.hash = '#/'; toast('Données effacées');
  });
}

/* ---------- démarrage ---------- */
route();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
