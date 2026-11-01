'use strict';
// ================= Storage =================
const KEY = 'botc-companion-v1';
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normId = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function loadStore() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.games) return s; } catch {}
  return { games: [], currentGameId: null, customScripts: {}, customChars: {}, settings: { apiKey: '', model: 'claude-sonnet-5-5' } };
}
let store = loadStore();
store.customScripts ||= {}; store.customChars ||= {}; store.settings ||= { model: 'claude-sonnet-5-5' };
function save() { store.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} scheduleSync(); }

// Cloud sync: when hosted on claude.ai, each user's games are kept in a private store.
let cloud = null, syncTimer = null; const synced = {};
function cloudDocs() {
  const docs = { meta: { savedAt: store.savedAt || 0, currentGameId: store.currentGameId, model: store.settings.model, customScripts: store.customScripts, customChars: store.customChars, order: store.games.map(g => g.id) } };
  for (const g of store.games) docs['g_' + g.id] = { ...g, chat: (g.chat || []).slice(-30) };
  return docs;
}
function scheduleSync() { if (!cloud) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 1200); }
async function syncNow() {
  if (!cloud) return;
  const docs = cloudDocs();
  for (const [k, v] of Object.entries(docs)) {
    const j = JSON.stringify(v); if (synced[k] === j) continue;
    try { await cloud.col.doc(k).set(JSON.parse(j)); synced[k] = j; } catch (e) { console.warn('sync', k, e); }
  }
  for (const k of Object.keys(synced)) if (!(k in docs)) { try { await cloud.col.doc(k).delete(); delete synced[k]; } catch {} }
}
async function initCloud() {
  if (!window.claude?.use) return;
  try {
    const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    const col = db.collection('data/users/' + id);
    const snap = await Promise.race([col.get(), new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000))]);
    const byId = Object.fromEntries(snap.docs.filter(d => d.exists).map(d => [d.id, structuredClone(d.data())]));
    cloud = { col };
    for (const [k, v] of Object.entries(byId)) synced[k] = JSON.stringify(v);
    const meta = byId.meta;
    if (meta && (meta.savedAt || 0) > (store.savedAt || 0)) {
      const games = (meta.order || []).map(gid => byId['g_' + gid]).filter(Boolean);
      store = { ...store, games, currentGameId: meta.currentGameId, customScripts: meta.customScripts || {}, customChars: meta.customChars || {}, savedAt: meta.savedAt, settings: { ...store.settings, model: meta.model || store.settings.model } };
      try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {}
      if (!game() && currentTab !== 'games') goTab('games'); else renderAll();
      toast('Games synced');
    } else scheduleSync();
  } catch (e) { console.warn('cloud unavailable', e); }
}

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }

// ================= Characters & scripts =================
const charIndex = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
function getChar(id) { return store.customChars[id] || charIndex[id] || null; }

function allScripts() {
  const list = BUILTIN_SCRIPTS.map(s => {
    const o = store.customScripts[s.id];
    return o ? { ...s, ...o, builtin: true, needsImport: false } : { ...s, builtin: true };
  });
  for (const s of Object.values(store.customScripts)) if (!BUILTIN_SCRIPTS.some(b => b.id === s.id)) list.push(s);
  return list;
}
function getScript(id) { return allScripts().find(s => s.id === id) || allScripts()[0]; }
function scriptChars(script) { return script.characters.map(getChar).filter(Boolean); }

// Parse the official script-tool JSON (array of ids / objects, optional _meta).
function parseScriptJson(text) {
  let data = JSON.parse(text);
  if (!Array.isArray(data)) { if (Array.isArray(data.characters)) data = data.characters; else throw new Error('Expected a JSON array'); }
  let name = '', author = ''; const ids = [];
  for (const item of data) {
    if (typeof item === 'string') { ids.push(normId(item)); continue; }
    if (!item || typeof item !== 'object') continue;
    if (item.id === '_meta') { name = item.name || ''; author = item.author || ''; continue; }
    const id = normId(item.id); if (!id) continue;
    if (item.team === 'fabled' || item.team === 'loric') continue;
    if (item.ability || item.name) {
      if (!charIndex[id] || item.ability) {
        store.customChars[id] = { id, name: item.name || titleize(id), team: TEAMS.includes(item.team) ? item.team : (charIndex[id]?.team || 'unknown'), ability: item.ability || charIndex[id]?.ability || '', edition: 'custom' };
      }
    }
    ids.push(id);
  }
  for (const id of ids) if (!getChar(id)) store.customChars[id] = { id, name: titleize(id), team: 'unknown', ability: '', edition: 'custom' };
  return { name, author, characters: [...new Set(ids)] };
}
function titleize(id) { return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

// ================= Game model =================
function game() { return store.games.find(g => g.id === store.currentGameId) || null; }
function newGame({ name, scriptId, mode, players }) {
  const g = {
    id: uid(), name: name || 'Game ' + (store.games.length + 1), created: Date.now(), scriptId, mode, phase: 0,
    players: players.map(n => ({ id: uid(), name: n, claim: '', role: '', alive: true, ghostVote: true, alignment: 'unknown', suspicion: 0, notes: '', isMe: false, diedPhase: null })),
    log: [], chat: [],
  };
  store.games.unshift(g); store.currentGameId = g.id; save(); return g;
}
const phaseLabel = p => (p % 2 === 0 ? 'Night ' : 'Day ') + (Math.floor(p / 2) + 1);
const phaseShort = p => (p % 2 === 0 ? 'N' : 'D') + (Math.floor(p / 2) + 1);
const pName = id => game()?.players.find(p => p.id === id)?.name || '?';
const teamClass = t => ({ townsfolk: 'tf', outsider: 'os', minion: 'mn', demon: 'dm', traveller: 'tr' }[t] || '');

// ================= Header / tabs =================
function renderHeader() {
  const g = game();
  $('#gameName').textContent = g ? g.name : 'No game yet';
  $('#scriptName').textContent = g ? getScript(g.scriptId).name : '';
  const l = $('#phaseLabel');
  l.textContent = g ? phaseLabel(g.phase) : '—';
  l.className = 'phase-label ' + (g && g.phase % 2 === 0 ? 'night' : 'day');
}
$('#phasePrev').onclick = () => { const g = game(); if (g && g.phase > 0) { g.phase--; save(); renderAll(); } };
$('#phaseNext').onclick = () => { const g = game(); if (g) { g.phase++; save(); renderAll(); toast(phaseLabel(g.phase)); } };

let currentTab = 'grim';
$('#tabs').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  currentTab = b.dataset.tab;
  document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.id === 'tab-' + currentTab));
  renderAll();
};
function goTab(t) { document.querySelector(`#tabs button[data-tab="${t}"]`).click(); }

// ================= Grimoire =================
let selectedSeat = null;
function renderGrim() {
  const g = game(), circle = $('#circle');
  if (!g) { circle.innerHTML = `<div class="circle-center"><div class="big">No game</div><button class="btn primary" onclick="goTab('games')">Start a game</button></div>`; $('#seatPanel').innerHTML = ''; return; }
  const n = g.players.length, alive = g.players.filter(p => p.alive).length;
  const votes = g.players.filter(p => p.alive || p.ghostVote).length;
  const size = circle.clientWidth || 600;
  const tok = Math.max(54, Math.min(110, size * (n > 12 ? 0.13 : 0.16)));
  const r = 50 - (tok / size * 50) - 1.5;
  const showRole = g.mode === 'storyteller';
  let html = `<div class="circle-center">
    <div class="big">${phaseLabel(g.phase)}</div>
    <div class="stat">${alive} alive of ${n} · ${votes} votes</div>
    <div class="stat">Execution needs ${Math.ceil(alive / 2)} votes</div>
    <div class="row gap wrap" style="justify-content:center;margin-top:6px">
      <button class="btn small" id="addPlayer">+ Player</button>
      <button class="btn small" onclick="goTab('ai')">Analyse ✦</button>
    </div></div>`;
  g.players.forEach((p, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a);
    const roleId = showRole ? p.role : p.claim;
    const ch = getChar(roleId);
    const roleTxt = ch ? ch.name : (roleId ? roleId : (showRole ? 'no role' : 'no claim'));
    html += `<div class="token ${p.alignment} ${p.alive ? '' : 'dead'} ${selectedSeat === p.id ? 'selected' : ''}" data-id="${p.id}" style="left:${x}%;top:${y}%;--tok:${tok}px">
      <span class="seat">${i + 1}</span>
      ${!p.alive ? '<span class="shroud">☠</span>' : ''}
      ${!p.alive && p.ghostVote ? '<span class="vote" title="Ghost vote available"></span>' : ''}
      <span class="tname">${esc(p.name)}</span>
      <span class="trole ${ch ? teamClass(ch.team) : ''}">${esc(roleTxt)}${showRole && p.claim && p.claim !== p.role ? `<br><i>says ${esc(getChar(p.claim)?.name || p.claim)}</i>` : ''}</span>
      ${!showRole && p.suspicion ? `<span class="sus"><i style="width:${p.suspicion}%"></i></span>` : ''}
      ${p.isMe ? '<span class="me">ME</span>' : ''}
    </div>`;
  });
  circle.innerHTML = html;
  circle.querySelectorAll('.token').forEach(t => t.onclick = () => { selectedSeat = t.dataset.id; renderGrim(); });
  $('#addPlayer').onclick = async () => { const name = await uiPrompt('Player name'); if (name) { g.players.push({ id: uid(), name, claim: '', role: '', alive: true, ghostVote: true, alignment: 'unknown', suspicion: 0, notes: '', isMe: false, diedPhase: null }); save(); renderGrim(); } };
  renderSeatPanel();
}
new ResizeObserver(() => currentTab === 'grim' && renderGrim()).observe($('#circle'));

function charOptions(script, selected, placeholder) {
  const chars = scriptChars(script);
  let o = `<option value="">${placeholder}</option>`;
  for (const t of [...TEAMS, 'unknown']) {
    const cs = chars.filter(c => c.team === t); if (!cs.length) continue;
    o += `<optgroup label="${TEAM_LABEL[t] || 'Unsorted'}">` + cs.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}</option>`).join('') + '</optgroup>';
  }
  if (selected && !chars.some(c => c.id === selected)) o += `<option value="${esc(selected)}" selected>${esc(getChar(selected)?.name || selected)} (off-script)</option>`;
  return o;
}

function renderSeatPanel() {
  const g = game(), el = $('#seatPanel'), p = g?.players.find(x => x.id === selectedSeat);
  if (!p) { el.innerHTML = `<h2>Town square</h2><p class="empty">Tap a player to record their claim, alignment read, death and notes.</p>${myRoleBox(g)}`; bindMyRole(); return; }
  const script = getScript(g.scriptId), idx = g.players.indexOf(p);
  const claimC = getChar(p.claim), roleC = getChar(p.role);
  el.innerHTML = `
    <div class="row between"><h2>${idx + 1}. ${esc(p.name)}</h2><button class="icon-btn" id="closeSeat">×</button></div>
    <label>Name <input id="fName" value="${esc(p.name)}"></label>
    <label class="mt">Claims to be <select id="fClaim">${charOptions(script, p.claim, '— no claim —')}</select></label>
    ${claimC ? `<div class="ability">${esc(claimC.ability)}</div>` : ''}
    <label class="mt">${g.mode === 'storyteller' ? 'True character' : 'Actually is (if known)'} <select id="fRole">${charOptions(script, p.role, '— unknown —')}</select></label>
    ${roleC && p.role !== p.claim ? `<div class="ability">${esc(roleC.ability)}</div>` : ''}
    <div class="toggle-row">
      <span class="chip good ${p.alignment === 'good' ? 'on' : ''}" data-al="good">Good</span>
      <span class="chip ${p.alignment === 'unknown' ? 'on' : ''}" data-al="unknown">Unknown</span>
      <span class="chip evil ${p.alignment === 'evil' ? 'on' : ''}" data-al="evil">Evil</span>
    </div>
    <label>Suspicion: <b id="susVal">${p.suspicion}%</b> <input type="range" id="fSus" min="0" max="100" step="5" value="${p.suspicion}"></label>
    <div class="toggle-row">
      <span class="chip ${p.alive ? 'on' : ''}" id="fAlive">${p.alive ? 'Alive' : 'Dead' + (p.diedPhase != null ? ' (' + phaseShort(p.diedPhase) + ')' : '')}</span>
      ${!p.alive ? `<span class="chip ${p.ghostVote ? 'on' : ''}" id="fGhost">${p.ghostVote ? 'Ghost vote unused' : 'Ghost vote used'}</span>` : ''}
      <span class="chip ${p.isMe ? 'on' : ''}" id="fMe">This is me</span>
    </div>
    <label>Notes <textarea id="fNotes" rows="4" placeholder="What they said, who they defended, odd behaviour…">${esc(p.notes)}</textarea></label>
    <div class="row gap wrap mt">
      <button class="btn small" id="mvL">◀ Move</button><button class="btn small" id="mvR">Move ▶</button>
      <button class="btn small" id="logInfo">+ Log info</button>
      <button class="btn small danger" id="rmP">Remove</button>
    </div>`;
  const upd = (f, v, rerender = true) => { p[f] = v; save(); rerender ? renderGrim() : null; };
  $('#closeSeat').onclick = () => { selectedSeat = null; renderGrim(); };
  $('#fName').onchange = e => upd('name', e.target.value);
  $('#fClaim').onchange = e => upd('claim', e.target.value);
  $('#fRole').onchange = e => upd('role', e.target.value);
  el.querySelectorAll('[data-al]').forEach(c => c.onclick = () => upd('alignment', c.dataset.al));
  $('#fSus').oninput = e => { $('#susVal').textContent = e.target.value + '%'; p.suspicion = +e.target.value; save(); };
  $('#fSus').onchange = () => renderGrim();
  $('#fAlive').onclick = () => {
    p.alive = !p.alive;
    if (!p.alive) { p.diedPhase = g.phase; const cause = g.phase % 2 ? 'executed / died today' : 'died in the night'; addLog({ type: 'death', player: p.id, cause, text: `${p.name} ${cause}` }); }
    else p.diedPhase = null;
    save(); renderGrim();
  };
  $('#fGhost') && ($('#fGhost').onclick = () => upd('ghostVote', !p.ghostVote));
  $('#fMe').onclick = () => { const v = !p.isMe; g.players.forEach(x => x.isMe = false); upd('isMe', v); };
  $('#fNotes').oninput = e => upd('notes', e.target.value, false);
  $('#mvL').onclick = () => move(-1); $('#mvR').onclick = () => move(1);
  function move(d) { const i = g.players.indexOf(p), j = (i + d + g.players.length) % g.players.length; [g.players[i], g.players[j]] = [g.players[j], g.players[i]]; save(); renderGrim(); }
  $('#logInfo').onclick = () => { logType = 'info'; logPrefill = p.id; goTab('log'); };
  $('#rmP').onclick = async () => { if (await uiConfirm('Remove ' + p.name + ' from the game?', 'Remove')) { g.players = g.players.filter(x => x !== p); selectedSeat = null; save(); renderGrim(); } };
}
function myRoleBox(g) {
  if (!g || g.mode !== 'player') return '';
  const me = g.players.find(p => p.isMe);
  return `<h3>My seat</h3>${me ? `<p>You are <b>${esc(me.name)}</b>. Set your real character with “Actually is” on your token${me.role ? ` — currently <b>${esc(getChar(me.role)?.name)}</b>` : ''}.</p>` : '<p class="empty">Open your own token and tap “This is me” so the AI knows your perspective.</p>'}
  <label>Private info I hold (alignment, evil team, bluffs…) <textarea id="myPrivate" rows="3">${esc(g.myPrivate || '')}</textarea></label>`;
}
function bindMyRole() { const t = $('#myPrivate'); if (t) t.oninput = e => { game().myPrivate = e.target.value; save(); }; }

// ================= Log =================
let logType = 'nomination', logPrefill = null;
function addLog(entry) { const g = game(); g.log.push({ id: uid(), phase: g.phase, at: Date.now(), ...entry }); save(); }

$('#logTypeSeg').onclick = e => { const b = e.target.closest('button'); if (b) { logType = b.dataset.type; renderLog(); } };
function playerSelect(id, sel, ph = '— choose —') { return `<select id="${id}"><option value="">${ph}</option>${game().players.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}${p.alive ? '' : ' ☠'}</option>`).join('')}</select>`; }

function renderLog() {
  const g = game(), f = $('#logForm');
  document.querySelectorAll('#logTypeSeg button').forEach(b => b.classList.toggle('active', b.dataset.type === logType));
  if (!g) { f.innerHTML = '<p class="hint">Start a game first.</p>'; $('#timeline').innerHTML = ''; return; }
  const ph = `<p class="hint">Recording in <b>${phaseLabel(g.phase)}</b>.</p>`;
  if (logType === 'nomination') {
    f.innerHTML = ph + `<label>Nominator ${playerSelect('lNom')}</label><label>Nominee ${playerSelect('lNee')}</label>
      <label>Who voted (tap)</label><div class="voters" id="lVoters">${g.players.filter(p => p.alive || p.ghostVote).map(p => `<span class="chip" data-id="${p.id}">${esc(p.name)}${p.alive ? '' : ' 👻'}</span>`).join('')}</div>
      <label>Vote count <input id="lCount" type="number" min="0" value="0"></label>
      <label>Outcome <select id="lOut"><option value="">Not executed (yet)</option><option value="onblock">On the block</option><option value="executed">Executed</option><option value="survived">Executed but did not die</option></select></label>
      <label>Notes <input id="lNote" placeholder="e.g. Virgin didn't trigger"></label><button class="btn primary">Record nomination</button>`;
    const vs = $('#lVoters');
    vs.onclick = e => { const c = e.target.closest('.chip'); if (!c) return; c.classList.toggle('on'); $('#lCount').value = vs.querySelectorAll('.on').length; };
    f.onsubmit = e => {
      e.preventDefault(); const nom = $('#lNom').value, nee = $('#lNee').value; if (!nee) return toast('Pick a nominee');
      const voters = [...vs.querySelectorAll('.on')].map(c => c.dataset.id), out = $('#lOut').value;
      voters.forEach(v => { const p = g.players.find(x => x.id === v); if (p && !p.alive) p.ghostVote = false; });
      if (out === 'executed') { const p = g.players.find(x => x.id === nee); if (p && p.alive) { p.alive = false; p.diedPhase = g.phase; } }
      addLog({ type: 'nomination', nominator: nom, nominee: nee, voters, count: +$('#lCount').value, outcome: out, note: $('#lNote').value });
      toast('Nomination recorded'); renderLog();
    };
  } else if (logType === 'death') {
    f.innerHTML = ph + `<label>Player ${playerSelect('lP')}</label><label>Cause <select id="lCause"><option>died in the night</option><option>executed</option><option>killed during the day (ability)</option><option>other</option></select></label><label>Details <input id="lNote"></label><button class="btn primary">Record death</button>`;
    f.onsubmit = e => { e.preventDefault(); const p = g.players.find(x => x.id === $('#lP').value); if (!p) return toast('Pick a player'); p.alive = false; p.diedPhase = g.phase; addLog({ type: 'death', player: p.id, cause: $('#lCause').value, text: `${p.name} ${$('#lCause').value}${$('#lNote').value ? ' — ' + $('#lNote').value : ''}` }); toast('Death recorded'); renderLog(); };
  } else if (logType === 'info') {
    f.innerHTML = ph + `<label>From player ${playerSelect('lP', logPrefill)}</label><label>As character <select id="lAs">${charOptions(getScript(g.scriptId), g.players.find(p => p.id === logPrefill)?.claim || '', '— as claimed —')}</select></label>
      <label>What they said / learned <textarea id="lNote" rows="3" placeholder="e.g. Empath: 1. Washerwoman: Alex or Sam is the Chef."></textarea></label>
      <label><input type="checkbox" id="lMine" style="width:auto"> This is my own info (not just a claim)</label><button class="btn primary">Record</button>`;
    logPrefill = null;
    f.onsubmit = e => { e.preventDefault(); const pid = $('#lP').value, as = $('#lAs').value, txt = $('#lNote').value.trim(); if (!txt) return toast('Write what was said');
      const p = g.players.find(x => x.id === pid); if (p && as && !p.claim) p.claim = as;
      addLog({ type: 'info', player: pid, as, mine: $('#lMine').checked, text: txt }); toast('Info recorded'); renderLog(); };
  } else {
    f.innerHTML = ph + `<label>Note <textarea id="lNote" rows="4" placeholder="Anything worth remembering…"></textarea></label><button class="btn primary">Add note</button>`;
    f.onsubmit = e => { e.preventDefault(); const t = $('#lNote').value.trim(); if (t) { addLog({ type: 'note', text: t }); renderLog(); } };
  }
  renderTimeline();
}
function describe(e) {
  if (e.type === 'nomination') return `<b>${esc(pName(e.nominator))}</b> nominated <b>${esc(pName(e.nominee))}</b> — ${e.count} vote${e.count === 1 ? '' : 's'}${e.voters?.length ? ' (' + e.voters.map(v => esc(pName(v))).join(', ') + ')' : ''}${e.outcome ? ' · <i>' + esc({ onblock: 'on the block', executed: 'executed', survived: 'executed, survived' }[e.outcome]) + '</i>' : ''}${e.note ? ' · ' + esc(e.note) : ''}`;
  if (e.type === 'info') return `${e.player ? '<b>' + esc(pName(e.player)) + '</b>' : ''}${e.as ? ' as ' + esc(getChar(e.as)?.name || e.as) : ''}${e.mine ? ' <span class="pill">mine</span>' : ''}: ${esc(e.text)}`;
  return esc(e.text);
}
function renderTimeline() {
  const g = game(), el = $('#timeline');
  if (!g.log.length) { el.innerHTML = '<p class="hint">Nothing recorded yet. Nominations, deaths and claims you log here feed the AI analyst.</p>'; return; }
  const groups = {}; g.log.forEach(e => (groups[e.phase] ||= []).push(e));
  el.innerHTML = Object.keys(groups).sort((a, b) => b - a).map(ph => `<div class="phase-group"><h3>${phaseLabel(+ph)}</h3>${groups[ph].map(e => `<div class="entry"><span class="tag ${e.type}">${e.type}</span><span class="txt">${describe(e)}</span><button class="del" data-id="${e.id}" title="Delete">✕</button></div>`).join('')}</div>`).join('');
  el.querySelectorAll('.del').forEach(b => b.onclick = () => { g.log = g.log.filter(x => x.id !== b.dataset.id); save(); renderTimeline(); });
}

// ================= Script tab =================
function renderScript() {
  const g = game(), script = getScript(g ? g.scriptId : 'tb');
  const sw = $('#scriptSwitch');
  sw.innerHTML = allScripts().map(s => `<option value="${s.id}" ${s.id === script.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  sw.disabled = !g;
  sw.onchange = () => { if (g) { g.scriptId = sw.value; save(); renderAll(); } };
  $('#scriptTitle').textContent = script.name + (script.author ? ' · ' + script.author : '');
  $('#scriptNotice').innerHTML = script.needsImport
    ? `<div class="notice"><b>${esc(script.name)}</b> isn't loaded yet. Open the script on the official script tool or botcscripts.com, copy its JSON, then use <b>Import script JSON</b> — it will be saved here permanently.</div>`
    : (script.characters.some(id => getChar(id)?.team === 'unknown') ? `<div class="notice">Some characters on this script aren't in the built-in database. Tap them below to fill in their team and ability so the AI can reason about them.</div>` : '');
  const n = g ? g.players.length : 0;
  $('#distTable').innerHTML = `<table class="dist"><tr><th>Players</th>${Object.keys(DISTRIBUTION).map(k => `<th class="${+k === n ? 'cur' : ''}">${k}</th>`).join('')}</tr>${['Townsfolk', 'Outsiders', 'Minions', 'Demon'].map((l, i) => `<tr><th>${l}</th>${Object.entries(DISTRIBUTION).map(([k, v]) => `<td class="${+k === n ? 'cur' : ''}">${v[i]}</td>`).join('')}</tr>`).join('')}</table>`;
  const chars = scriptChars(script);
  $('#scriptSheet').innerHTML = [...TEAMS, 'unknown'].map(t => {
    const cs = chars.filter(c => c.team === t); if (!cs.length) return '';
    return `<div class="team-block"><h3>${TEAM_LABEL[t] || 'Unsorted'} <span class="n">${cs.length}</span></h3><div class="char-grid">${cs.map(c => `<div class="char ${c.team}" data-id="${c.id}"><b>${esc(c.name)}</b><p>${esc(c.ability || 'Tap to add ability text')}</p></div>`).join('')}</div></div>`;
  }).join('');
  $('#scriptSheet').querySelectorAll('.char').forEach(el => el.onclick = () => editChar(el.dataset.id));
}
function editChar(id) {
  const c = getChar(id);
  openModal(`<h2>${esc(c.name)}</h2><form class="stack" id="ecF"><label>Name <input id="ecN" value="${esc(c.name)}"></label>
    <label>Team <select id="ecT">${[...TEAMS, 'unknown'].map(t => `<option value="${t}" ${t === c.team ? 'selected' : ''}>${TEAM_LABEL[t] || 'Unsorted'}</option>`).join('')}</select></label>
    <label>Ability <textarea id="ecA" rows="4">${esc(c.ability)}</textarea></label>
    <div class="row gap"><button class="btn primary">Save</button><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></div></form>`);
  $('#ecF').onsubmit = e => { e.preventDefault(); store.customChars[id] = { ...c, name: $('#ecN').value, team: $('#ecT').value, ability: $('#ecA').value }; save(); closeModal(); renderAll(); };
}
$('#btnImportScript').onclick = () => {
  const cur = getScript(game()?.scriptId || 'tb');
  openModal(`<h2>Import script JSON</h2><p class="hint">Paste the JSON from the official script tool (script.bloodontheclocktower.com) or botcscripts.com. Unknown homebrew characters are kept and can be edited.</p>
    <form class="stack" id="imF"><label>Save as <select id="imTarget"><option value="__new">New custom script</option>${BUILTIN_SCRIPTS.filter(s => s.needsImport).map(s => `<option value="${s.id}" ${cur.id === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label>Script JSON <textarea id="imJ" rows="10" placeholder='[{"id":"_meta","name":"My Script"},"washerwoman","imp", …]'></textarea></label>
    <div class="row gap"><button class="btn primary">Import</button><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></div></form>`);
  $('#imF').onsubmit = e => {
    e.preventDefault();
    try {
      const parsed = parseScriptJson($('#imJ').value), target = $('#imTarget').value;
      const id = target === '__new' ? 'c_' + uid() : target;
      const base = BUILTIN_SCRIPTS.find(s => s.id === id);
      store.customScripts[id] = { id, name: base ? base.name : (parsed.name || 'Custom script'), author: parsed.author || base?.author || '', characters: parsed.characters };
      const g = game(); if (g) g.scriptId = id;
      save(); closeModal(); renderAll(); toast(`Imported ${parsed.characters.length} characters`);
    } catch (err) { toast('Import failed: ' + err.message); }
  };
};
$('#btnBuildScript').onclick = () => buildScript();
function buildScript(existingId) {
  const ex = existingId ? store.customScripts[existingId] : null, chosen = new Set(ex?.characters || []);
  const all = [...CHARACTERS, ...Object.values(store.customChars).filter(c => !charIndex[c.id])];
  const ed = { tb: 'TB', bmr: 'BMR', snv: 'S&V', exp: 'Exp', custom: 'Custom' };
  openModal(`<h2>${ex ? 'Edit' : 'Build'} custom script</h2><form class="stack" id="bsF">
    <label>Name <input id="bsN" value="${esc(ex?.name || '')}" placeholder="My homebrew" required></label>
    <label>Filter <input id="bsQ" placeholder="Search characters…"></label>
    <div class="builder-list" id="bsL">${TEAMS.map(t => `<h3>${TEAM_LABEL[t]}</h3>` + all.filter(c => c.team === t).map(c => `<label data-s="${esc((c.name + ' ' + c.ability).toLowerCase())}"><input type="checkbox" value="${c.id}" ${chosen.has(c.id) ? 'checked' : ''}><span><b>${esc(c.name)}</b> <small>${ed[c.edition] || ''}</small><br><small>${esc(c.ability)}</small></span></label>`).join('')).join('')}</div>
    <p class="hint" id="bsC"></p>
    <details><summary>Add a homebrew character</summary><div class="stack mt"><input id="hbN" placeholder="Name"><select id="hbT">${TEAMS.map(t => `<option value="${t}">${TEAM_LABEL[t]}</option>`).join('')}</select><textarea id="hbA" rows="2" placeholder="Ability"></textarea><button type="button" class="btn small" id="hbAdd">Add character</button></div></details>
    <div class="row gap"><button class="btn primary">Save script</button><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></div></form>`);
  const count = () => { const ids = [...$('#bsL').querySelectorAll('input:checked')].map(i => i.value); const by = t => ids.filter(i => getChar(i)?.team === t).length; $('#bsC').textContent = `${ids.length} selected — ${by('townsfolk')} Townsfolk · ${by('outsider')} Outsiders · ${by('minion')} Minions · ${by('demon')} Demons · ${by('traveller')} Travellers`; };
  $('#bsL').onchange = count; count();
  $('#bsQ').oninput = e => { const q = e.target.value.toLowerCase(); $('#bsL').querySelectorAll('label').forEach(l => l.style.display = l.dataset.s.includes(q) ? '' : 'none'); };
  $('#hbAdd').onclick = () => { const name = $('#hbN').value.trim(); if (!name) return; const id = normId(name); store.customChars[id] = { id, name, team: $('#hbT').value, ability: $('#hbA').value, edition: 'custom' }; save(); const sel = [...$('#bsL').querySelectorAll('input:checked')].map(i => i.value); const nm = $('#bsN').value; const tmpId = existingId || '__tmp'; store.customScripts[tmpId] = { id: tmpId, name: nm, characters: [...sel, id] }; buildScript(tmpId); if (tmpId === '__tmp') delete store.customScripts.__tmp; };
  $('#bsF').onsubmit = e => {
    e.preventDefault(); const ids = [...$('#bsL').querySelectorAll('input:checked')].map(i => i.value); if (!ids.length) return toast('Pick some characters');
    const id = existingId && existingId !== '__tmp' ? existingId : 'c_' + uid();
    store.customScripts[id] = { id, name: $('#bsN').value || 'Custom script', author: 'Me', characters: ids, editable: true };
    const g = game(); if (g) g.scriptId = id;
    save(); closeModal(); renderAll(); toast('Script saved');
  };
}

// ================= Modal =================
function uiConfirm(msg, ok = 'Delete') {
  return new Promise(res => {
    openModal(`<p>${esc(msg)}</p><div class="row gap"><button class="btn danger" id="cfY">${esc(ok)}</button><button class="btn ghost" id="cfN">Cancel</button></div>`);
    $('#cfY').onclick = () => { closeModal(); res(true); }; $('#cfN').onclick = () => { closeModal(); res(false); };
    $('#modal').addEventListener('close', () => res(false), { once: true });
  });
}
function uiPrompt(msg, value = '') {
  return new Promise(res => {
    openModal(`<form id="upF" class="stack"><label>${esc(msg)} <input id="upI" value="${esc(value)}" autocomplete="off"></label><div class="row gap"><button class="btn primary">Save</button><button type="button" class="btn ghost" id="upN">Cancel</button></div></form>`);
    $('#upI').focus();
    $('#upF').onsubmit = e => { e.preventDefault(); const v = $('#upI').value.trim(); closeModal(); res(v || null); };
    $('#upN').onclick = () => { closeModal(); res(null); };
    $('#modal').addEventListener('close', () => res(null), { once: true });
  });
}
function openModal(html) { $('#modalBody').innerHTML = html; $('#modal').showModal(); }
function closeModal() { $('#modal').close(); }
window.closeModal = closeModal; window.goTab = goTab;

// ================= Games tab =================
function renderGames() {
  const sel = $('#newGameScript'), prev = sel.value;
  sel.innerHTML = allScripts().map(s => `<option value="${s.id}">${esc(s.name)}${s.needsImport ? ' (needs import)' : ''}</option>`).join('');
  if (prev) sel.value = prev;
  $('#gameList').innerHTML = store.games.length ? store.games.map(g => `<div class="game-item ${g.id === store.currentGameId ? 'current' : ''}">
    <div class="info"><b>${esc(g.name)}</b><small>${esc(getScript(g.scriptId).name)} · ${g.players.length} players · ${phaseLabel(g.phase)} · ${g.mode} · ${new Date(g.created).toLocaleDateString()}</small></div>
    <button class="btn small" data-open="${g.id}">Open</button><button class="btn small" data-ren="${g.id}">Rename</button><button class="btn small danger" data-del="${g.id}">✕</button></div>`).join('') : '<p class="hint">No saved games.</p>';
  const custom = Object.values(store.customScripts).filter(s => !BUILTIN_SCRIPTS.some(b => b.id === s.id));
  if (custom.length) $('#gameList').innerHTML += `<h3>Custom scripts</h3>` + custom.map(s => `<div class="game-item"><div class="info"><b>${esc(s.name)}</b><small>${s.characters.length} characters</small></div><button class="btn small" data-edit="${s.id}">Edit</button><button class="btn small danger" data-sdel="${s.id}">✕</button></div>`).join('');
  $('#gameList').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.open) { store.currentGameId = d.open; selectedSeat = null; save(); goTab('grim'); }
    if (d.ren) { const g = store.games.find(x => x.id === d.ren), n = await uiPrompt('Game name', g.name); if (n) { g.name = n; save(); renderAll(); } }
    if (d.del && await uiConfirm('Delete this game? This cannot be undone.')) { store.games = store.games.filter(x => x.id !== d.del); if (store.currentGameId === d.del) store.currentGameId = store.games[0]?.id || null; save(); renderAll(); }
    if (d.edit) buildScript(d.edit);
    if (d.sdel && await uiConfirm('Delete this custom script?')) { delete store.customScripts[d.sdel]; save(); renderAll(); }
  };
}
$('#newGameForm').onsubmit = e => {
  e.preventDefault(); const f = new FormData(e.target);
  const players = f.get('players').split(/\n|,/).map(s => s.trim()).filter(Boolean);
  if (players.length < 5) return toast('Add at least 5 players');
  newGame({ name: f.get('name').trim(), scriptId: f.get('script'), mode: f.get('mode'), players });
  e.target.reset(); selectedSeat = null; goTab('grim');
  if (getScript(game().scriptId).needsImport) setTimeout(() => toast('Remember to import this script\'s JSON on the Script tab'), 600);
};
$('#btnExport').onclick = async () => {
  const data = JSON.stringify({ ...store, settings: { model: store.settings.model } }, null, 2);
  const dl = window.claude?.use ? await claude.use('downloads') : null;
  if (dl) { try { await dl.save({ filename: 'clocktower-games.json', data }); toast('Saved'); } catch (e) { if (e?.code !== 'cancelled') toast('Export failed: ' + (e?.message || e)); } return; }
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'clocktower-games.json'; a.click(); URL.revokeObjectURL(a.href);
};
$('#importFile').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (Array.isArray(d)) { const p = parseScriptJson(JSON.stringify(d)), id = 'c_' + uid(); store.customScripts[id] = { id, name: p.name || file.name.replace(/\.json$/, ''), author: p.author, characters: p.characters }; toast('Script imported'); }
    else { const ids = new Set(store.games.map(g => g.id)); (d.games || []).forEach(g => ids.has(g.id) || store.games.push(g)); Object.assign(store.customScripts, d.customScripts || {}); Object.assign(store.customChars, d.customChars || {}); toast('Games imported'); }
    save(); renderAll();
  } catch (err) { toast('Import failed: ' + err.message); }
  e.target.value = '';
};

// ================= AI analyst =================
const QUICK = [
  ['Analyse the worlds', 'Analyse the current game state. Lay out the 2–4 most plausible "worlds" (who is the Demon, who are the Minions, who is drunk/poisoned/lying) with a rough likelihood for each, and the key evidence for and against each.'],
  ['Who is the Demon?', 'Rank the living players by how likely they are to be the Demon, with a percentage and one-line reasoning each.'],
  ['Check claims for contradictions', 'Go through every claim and piece of info. Which claims conflict, which are confirmed or mutually supporting, and are there too many/few claimed Outsiders for the setup?'],
  ['Who should we execute today?', 'Given everything, who should good execute today and why? Consider vote maths, who is safe to keep alive, and what the execution would tell us.'],
  ['My best play', 'From my perspective and with my character, what should I do next — who should I talk to, what should I reveal or hide, and how should I use my ability tonight?'],
  ['Evil perspective', 'If I were on the evil team right now, what bluffs and plan would be strongest? Use this to spot what evil is probably doing.'],
  ['Storyteller balance check', 'As the Storyteller, is this game balanced? Which team is ahead, and what info or choices could keep it tense and fair?'],
];
$('#quickPrompts').innerHTML = QUICK.map((q, i) => `<button class="btn" data-q="${i}">${q[0]}</button>`).join('');
$('#quickPrompts').onclick = e => { const b = e.target.closest('button'); if (b) ask(QUICK[b.dataset.q][1]); };

$('#apiKey').value = store.settings.apiKey || '';
$('#model').value = store.settings.model || 'claude-sonnet-5-5';
$('#apiKey').onchange = e => { store.settings.apiKey = e.target.value.trim(); save(); };
$('#model').onchange = e => { store.settings.model = e.target.value; save(); };

function gameStateText() {
  const g = game(), script = getScript(g.scriptId), chars = scriptChars(script), n = g.players.length;
  const dist = DISTRIBUTION[Math.min(15, Math.max(5, n - g.players.filter(p => getChar(p.role || p.claim)?.team === 'traveller').length))];
  const me = g.players.find(p => p.isMe);
  let s = `# Script: ${script.name}${script.author ? ' by ' + script.author : ''}\n`;
  for (const t of [...TEAMS, 'unknown']) { const cs = chars.filter(c => c.team === t); if (cs.length) s += `\n## ${TEAM_LABEL[t] || 'Other'}\n` + cs.map(c => `- ${c.name}: ${c.ability || '(ability unknown)'}`).join('\n') + '\n'; }
  s += `\n# Setup\n${n} players. Base distribution for this count: ${dist[0]} Townsfolk, ${dist[1]} Outsiders, ${dist[2]} Minions, ${dist[3]} Demon (setup abilities like Baron/Godfather/Fang Gu/Vigormortis may change this).\n`;
  s += `Current phase: ${phaseLabel(g.phase)}. Alive: ${g.players.filter(p => p.alive).length}. Votes needed to put someone on the block: ${Math.ceil(g.players.filter(p => p.alive).length / 2)}.\n`;
  s += `\n# Perspective\n`;
  if (g.mode === 'storyteller') s += 'The user is the STORYTELLER and can see the true grimoire.\n';
  else s += me ? `The user is the player "${me.name}" (seat ${g.players.indexOf(me) + 1})${me.role ? `, whose actual character token shows ${getChar(me.role)?.name || me.role}` : ''}${me.claim ? `, publicly claiming ${getChar(me.claim)?.name || me.claim}` : ''}. Remember the user could themselves be drunk/poisoned/the Drunk/Lunatic/Marionette if the script allows.\n` : 'The user is a player (seat not specified).\n';
  if (g.myPrivate) s += `User's private knowledge: ${g.myPrivate}\n`;
  s += `\n# Players (clockwise seat order; seat 1 neighbours seat ${n})\n`;
  g.players.forEach((p, i) => {
    const bits = [`${i + 1}. ${p.name}`, p.alive ? 'ALIVE' : `DEAD (${p.diedPhase != null ? phaseShort(p.diedPhase) : '?'}${p.ghostVote ? ', ghost vote unused' : ', ghost vote used'})`];
    if (p.claim) bits.push(`claims ${getChar(p.claim)?.name || p.claim}`);
    if (p.role) bits.push(`${g.mode === 'storyteller' ? 'TRUE character' : 'known to actually be'} ${getChar(p.role)?.name || p.role}`);
    if (g.mode !== 'storyteller') { if (p.alignment !== 'unknown') bits.push(`user reads as ${p.alignment}`); if (p.suspicion) bits.push(`user suspicion ${p.suspicion}%`); }
    if (p.notes) bits.push(`notes: ${p.notes.replace(/\n/g, ' ')}`);
    s += bits.join(' | ') + '\n';
  });
  s += `\n# Timeline\n`;
  if (!g.log.length) s += '(nothing logged yet)\n';
  let last = -1;
  for (const e of g.log) {
    if (e.phase !== last) { s += `\n## ${phaseLabel(e.phase)}\n`; last = e.phase; }
    if (e.type === 'nomination') s += `- NOMINATION: ${pName(e.nominator)} nominated ${pName(e.nominee)}; ${e.count} votes${e.voters?.length ? ' from ' + e.voters.map(pName).join(', ') : ''}${e.outcome ? '; outcome: ' + e.outcome : ''}${e.note ? '; ' + e.note : ''}\n`;
    else if (e.type === 'info') s += `- ${e.mine ? "USER'S OWN INFO" : 'CLAIMED INFO'}: ${e.player ? pName(e.player) : '?'}${e.as ? ' as ' + (getChar(e.as)?.name || e.as) : ''}: ${e.text}\n`;
    else if (e.type === 'death') s += `- DEATH: ${e.text}\n`;
    else s += `- NOTE: ${e.text}\n`;
  }
  return s;
}
let _sample;
function sampleFn() { if (_sample === undefined) _sample = window.claude?.use ? claude.use('sample').catch(() => null) : Promise.resolve(null); return _sample; }
sampleFn().then(s => { if (s) { document.body.classList.add('hosted'); renderAiSetup(); } });
function renderAiSetup() { const h = $('#aiHosted'); if (h) h.hidden = !document.body.classList.contains('hosted'); }
function systemPrompt() {
  return `You are an expert Blood on the Clocktower analyst helping a user in a live game. You know the rules deeply: droisoning (drunk/poisoned players get false info), registration (Recluse, Spy), madness, bluffs, the Demon's three not-in-play bluffs, Outsider-count modifiers, night order, and common evil strategies.
Reason from the script and the logged evidence below. Treat every claim as possibly a lie, and explicitly consider who could be drunk or poisoned. Be concrete: name players, give probabilities, and show which pieces of information are load-bearing. Use only characters on this script unless a character could have been created mid-game (e.g. Pit-Hag) or joined as a Traveller. If information is missing, say what the user should find out. Keep answers well-structured with short headings and bullet points; avoid padding. Never pretend to know hidden information you were not given.

${gameStateText()}`;
}

function md(src) {
  const inline = t => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  const lines = src.split('\n'); let out = '', list = null, i = 0;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      close(); const row = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      out += '<table><tr>' + row(l).map(c => `<th>${inline(c)}</th>`).join('') + '</tr>'; i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { out += '<tr>' + row(lines[i]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; i++; }
      out += '</table>'; continue;
    }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { close(); out += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; }
    else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; }
    else if (/^\s*---+\s*$/.test(l)) { close(); out += '<hr>'; }
    else if (l.trim()) { close(); out += `<p>${inline(l)}</p>`; }
    else close();
    i++;
  }
  close(); return out;
}

function renderChat() {
  const g = game(), el = $('#chat');
  if (!g) { el.innerHTML = '<div class="chat-empty">Start a game to use the analyst.</div>'; return; }
  if (!g.chat.length) { el.innerHTML = `<div class="chat-empty"><h3>✦ The analyst is listening</h3>Log claims, nominations and deaths, then pick a quick analysis or ask a question. Every question sends the latest state of the town.</div>`; return; }
  el.innerHTML = g.chat.map(m => `<div class="msg ${m.role}${m.error ? ' error' : ''}">${m.role === 'assistant' ? md(m.content) : esc(m.content)}</div>`).join('');
  el.scrollTop = el.scrollHeight;
}
let busy = false;
async function ask(question) {
  const g = game(); if (!g) return toast('Start a game first');
  if (busy) return;
  const key = store.settings.apiKey, sample = await sampleFn();
  if (!sample && !key) { await copyPrompt(question); return; }
  g.chat.push({ role: 'user', content: question });
  const reply = { role: 'assistant', content: '' }; g.chat.push(reply); renderChat();
  busy = true; $('#chatSend').disabled = true; $('#chatSend').textContent = '…';
  const msgEl = $('#chat').lastElementChild; msgEl.innerHTML = '<i>Consulting the grimoire…</i>';
  try {
    const messages = g.chat.filter(m => m !== reply && !m.error && m.content).map(m => ({ role: m.role, content: m.content })).slice(-20);
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (sample) {
      const input = messages.map((m, i) => i === messages.length - 1 ? { role: 'user', content: systemPrompt() + '\n\n# Question\n' + m.content } : m);
      const r = await sample(input, { modelTier: 'complex', cache: false, onText: ({ text }) => { reply.content = text; msgEl.innerHTML = md(text); $('#chat').scrollTop = $('#chat').scrollHeight; } });
      reply.content = r.text;
    } else {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: store.settings.model, max_tokens: 4000, stream: true, system: systemPrompt(), messages }),
    });
    if (!res.ok) { const t = await res.text(); let msg = t; try { msg = JSON.parse(t).error.message; } catch {} throw new Error(`${res.status}: ${msg}`); }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx; while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        try { const ev = JSON.parse(line.slice(5)); if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') { reply.content += ev.delta.text; msgEl.innerHTML = md(reply.content); $('#chat').scrollTop = $('#chat').scrollHeight; } if (ev.type === 'error') throw new Error(ev.error?.message || 'Stream error'); } catch (e) { if (e.message && !(e instanceof SyntaxError)) throw e; }
      }
    }
    }
  } catch (err) {
    if (err?.code === 'not_granted') { reply.content = 'Claude access was declined for this page. Allow it from the page’s permissions to use the analyst, or use “Copy prompt”.'; reply.error = true; }
    else if (err?.text) reply.content = err.text;
    else { reply.content = 'Request failed. ' + (err?.message || err); reply.error = true; }
  }
  busy = false; $('#chatSend').disabled = false; $('#chatSend').textContent = 'Ask';
  save(); renderChat();
}
async function copyPrompt(question) {
  if (!game()) return toast('Start a game first');
  const text = systemPrompt() + '\n\n# Question\n' + (question || $('#chatInput').value || QUICK[0][1]);
  try { await navigator.clipboard.writeText(text); toast('Prompt copied — paste it into Claude'); }
  catch { openModal(`<h2>Copy this prompt</h2><textarea rows="18" readonly>${esc(text)}</textarea><button class="btn mt" onclick="closeModal()">Close</button>`); }
}
$('#btnCopyPrompt').onclick = () => copyPrompt();
$('#btnClearChat').onclick = async () => { const g = game(); if (g && await uiConfirm('Clear the analyst chat for this game?', 'Clear')) { g.chat = []; save(); renderChat(); } };
$('#chatForm').onsubmit = e => { e.preventDefault(); const q = $('#chatInput').value.trim(); if (!q) return; $('#chatInput').value = ''; ask(q); };
$('#chatInput').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#chatForm').requestSubmit(); } };

// ================= Render =================
function renderAll() {
  renderHeader();
  if (currentTab === 'grim') renderGrim();
  if (currentTab === 'log') renderLog();
  if (currentTab === 'script') renderScript();
  if (currentTab === 'ai') renderChat();
  if (currentTab === 'games') renderGames();
}
if (!game()) { goTab('games'); } else renderAll();
initCloud();
