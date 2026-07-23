/* ============ FocusFlight ============ */

const CRUISE_KMH = 900;
const DURATIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 105, 120, 150, 180, 240];

const $ = (id) => document.getElementById(id);

const state = {
  origin: null,        // airport record
  duration: 25,        // wheel minutes
  dest: null,          // { airport, mins, km }
  flightNo: "",
  task: "",
  totalSeconds: 0,
  remaining: 0,
  endAt: 0,
  paused: false,
  timerId: null,
  audioOn: true,
};

/* ---------- Storage (guarded — may be unavailable in embedded pages) ---------- */

function storeGet(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch (e) { return fallback; }
}
function storeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* not persisted */ }
}
function getHistory() {
  try { return JSON.parse(storeGet("ff-log", "[]")); } catch (e) { return []; }
}
function pushHistory(entry) {
  const log = getHistory();
  log.unshift(entry);
  storeSet("ff-log", JSON.stringify(log.slice(0, 200)));
}

/* ---------- Geometry ---------- */

function haversineKm(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const kmToMins = (km) => (km / CRUISE_KMH) * 60;
const minsToKm = (mins) => (mins / 60) * CRUISE_KMH;

function fmtMins(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`;
}
function fmtClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ---------- Screens ---------- */

function show(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(screenId).classList.add("active");
  $("top-bar").style.display = screenId === "screen-flight" ? "none" : "";
}

/* ---------- Origin search ---------- */

$("airport-count").textContent = `${AIRPORTS.length} airports worldwide`;

const originInput = $("origin-input");
const originResults = $("origin-results");

function searchAirports(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const starts = [], contains = [];
  for (const a of AIRPORTS) {
    const [code, name, city, country] = a;
    const hay = [code, name, city, country].map((s) => s.toLowerCase());
    if (hay[0] === q || hay.some((h) => h.startsWith(q))) starts.push(a);
    else if (hay.some((h) => h.includes(q))) contains.push(a);
  }
  return starts.concat(contains).slice(0, 8);
}

function renderOriginResults(matches) {
  originResults.innerHTML = "";
  if (!matches.length) { originResults.hidden = true; return; }
  matches.forEach((a, i) => {
    const li = document.createElement("li");
    if (i === 0) li.classList.add("hl");
    li.innerHTML = `<span class="d-code">${a[0]}</span><span class="d-city">${a[2]}</span><span class="d-sub">${a[1]} · ${a[3]}</span>`;
    li.addEventListener("click", () => setOrigin(a));
    originResults.appendChild(li);
  });
  originResults.hidden = false;
}

originInput.addEventListener("input", () => renderOriginResults(searchAirports(originInput.value)));
originInput.addEventListener("focus", () => renderOriginResults(searchAirports(originInput.value)));
originInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const first = searchAirports(originInput.value)[0];
    if (first) setOrigin(first);
  }
  if (e.key === "Escape") originResults.hidden = true;
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) originResults.hidden = true;
});

function setOrigin(a) {
  state.origin = a;
  originInput.value = `${a[0]} — ${a[2]}`;
  originResults.hidden = true;
  storeSet("ff-origin", a[0]);
  const firstReveal = $("time-field").hidden;
  $("time-field").hidden = false;
  $("dest-field").hidden = false;
  $("range-origin").textContent = a[0];
  if (firstReveal) requestAnimationFrame(() => setWheel(state.duration, false));
  renderDestinations();
}

/* ---------- Time wheel ---------- */

const wheel = $("wheel");
DURATIONS.forEach((min) => {
  const btn = document.createElement("button");
  btn.className = "wheel-item";
  btn.dataset.min = min;
  btn.innerHTML = min < 60
    ? `${min}<small>MIN</small>`
    : `${(min / 60).toString().replace(".5", "½")}<small>${min % 60 ? "H " + (min % 60) : "HOURS"}</small>`;
  btn.addEventListener("click", () =>
    btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }));
  wheel.appendChild(btn);
});

let wheelRaf = null;
let destDebounce = null;
wheel.addEventListener("scroll", () => {
  if (wheelRaf) cancelAnimationFrame(wheelRaf);
  wheelRaf = requestAnimationFrame(updateWheelSelection);
});

function centeredWheelItem() {
  const mid = wheel.scrollLeft + wheel.clientWidth / 2;
  let best = null, bestDist = Infinity;
  for (const item of wheel.children) {
    const c = item.offsetLeft + item.offsetWidth / 2;
    const d = Math.abs(c - mid);
    if (d < bestDist) { bestDist = d; best = item; }
  }
  return best;
}

function updateWheelSelection() {
  if (!wheel.clientWidth) return; // not laid out yet
  const item = centeredWheelItem();
  if (!item) return;
  const min = parseInt(item.dataset.min, 10);
  for (const el of wheel.children) el.classList.toggle("on", el === item);
  $("range-hint").textContent = `≈ ${Math.round(minsToKm(min)).toLocaleString()} km range`;
  if (min !== state.duration) {
    state.duration = min;
    clearTimeout(destDebounce);
    destDebounce = setTimeout(renderDestinations, 140);
  }
}

function setWheel(min, smooth) {
  const item = [...wheel.children].find((el) => parseInt(el.dataset.min, 10) === min);
  if (item) item.scrollIntoView({ behavior: smooth ? "smooth" : "instant", inline: "center", block: "nearest" });
  updateWheelSelection();
}

/* ---------- Destinations in range ---------- */

function renderDestinations() {
  const list = $("dest-list");
  list.innerHTML = "";
  if (!state.origin) return;
  const [oCode, , , , oLat, oLon] = state.origin;

  const scored = AIRPORTS
    .filter((a) => a[0] !== oCode)
    .map((a) => {
      const km = haversineKm(oLat, oLon, a[4], a[5]);
      return { a, km, mins: Math.max(5, Math.round(kmToMins(km))) };
    })
    .filter((r) => r.km > 30)
    .sort((x, y) => Math.abs(x.mins - state.duration) - Math.abs(y.mins - state.duration))
    .slice(0, 9)
    .sort((x, y) => x.mins - y.mins);

  for (const r of scored) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "dest-item";
    btn.innerHTML =
      `<span class="di-code">${r.a[0]}</span>` +
      `<span class="di-place">${r.a[2]}<small>${r.a[3]}</small></span>` +
      `<span class="di-meta"><b>${fmtMins(r.mins)}</b> · ${Math.round(r.km).toLocaleString()} km</span>`;
    btn.addEventListener("click", () => selectDestination(r));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

/* ---------- Ticket ---------- */

function selectDestination(r) {
  state.dest = { airport: r.a, mins: r.mins, km: Math.round(r.km) };
  state.flightNo = "FF " + (100 + Math.floor(Math.random() * 900));
  fillTicket();
  show("screen-ticket");
}

function fillTicket() {
  const o = state.origin, d = state.dest;
  const dep = new Date();
  const arr = new Date(dep.getTime() + d.mins * 60000);
  const hhmm = (t) => t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  $("t-flight").textContent = state.flightNo;
  $("t-from-code").textContent = o[0];
  $("t-from-city").textContent = o[2];
  $("t-to-code").textContent = d.airport[0];
  $("t-to-city").textContent = d.airport[2];
  $("t-dep").textContent = hhmm(dep);
  $("t-arr").textContent = hhmm(arr);
  $("t-dur").textContent = fmtMins(d.mins);
  $("t-dist").textContent = d.km.toLocaleString() + " km";
  $("t-gate").textContent = "ABCD"[Math.floor(Math.random() * 4)] + (1 + Math.floor(Math.random() * 24));
  $("t-seat").textContent = (1 + Math.floor(Math.random() * 30)) + "ACDF"[Math.floor(Math.random() * 4)];
  $("t-task").textContent = state.task || "Deep focus";
  $("stub-codes").textContent = `${o[0]} → ${d.airport[0]}`;
  $("stub-flight").textContent = state.flightNo;
}

$("task-input").addEventListener("input", () => {
  state.task = $("task-input").value.trim();
  $("t-task").textContent = state.task || "Deep focus";
});

$("btn-back").addEventListener("click", () => show("screen-book"));

/* ---------- Tear & board ---------- */

let tearing = false;
$("btn-tear").addEventListener("click", () => {
  if (tearing) return;
  tearing = true;
  const ticket = $("ticket");
  ticket.classList.add("torn");
  playTear();
  setTimeout(() => ticket.classList.add("falling"), 420);
  setTimeout(() => {
    ticket.classList.remove("torn", "falling");
    tearing = false;
    startFlight();
  }, 1020);
});

/* ---------- Flight ---------- */

function startFlight() {
  const d = state.dest;
  state.totalSeconds = d.mins * 60;
  state.remaining = state.totalSeconds;
  state.endAt = Date.now() + state.totalSeconds * 1000;
  state.paused = false;
  divertArmed = false;

  $("fl-from").textContent = state.origin[0];
  $("fl-to").textContent = d.airport[0];
  $("fl-task").textContent = state.task || "";
  $("btn-hold").textContent = "Hold";
  $("btn-divert").textContent = "Divert";
  $("btn-divert").classList.remove("armed");
  $("news").hidden = true;

  show("screen-flight");
  if (state.audioOn) startAudio();
  tickFlight();
  state.timerId = setInterval(tickFlight, 250);
}

function progressNow() {
  return 1 - state.remaining / state.totalSeconds;
}

function tickFlight() {
  if (!state.paused) {
    state.remaining = Math.max(0, (state.endAt - Date.now()) / 1000);
  }
  const p = progressNow();

  $("fl-timer").textContent = fmtClock(state.remaining);
  document.title = `${fmtClock(state.remaining)} → ${state.dest.airport[0]} · FocusFlight`;
  $("fl-progress").style.width = p * 100 + "%";
  $("fl-marker").style.left = p * 100 + "%";

  // Telemetry: climb to FL360 by 10%, descend after 85%
  let alt;
  if (p < 0.1) alt = (p / 0.1) * 11000;
  else if (p > 0.85) alt = ((1 - p) / 0.15) * 11000;
  else alt = 11000 + Math.sin(p * 40) * 120;
  const spd = p < 0.06 ? (p / 0.06) * CRUISE_KMH
            : p > 0.94 ? ((1 - p) / 0.06) * CRUISE_KMH
            : CRUISE_KMH + Math.sin(p * 60) * 12;
  $("tel-alt").textContent = Math.max(0, Math.round(alt)).toLocaleString();
  $("tel-spd").textContent = Math.max(0, Math.round(spd)).toLocaleString();
  $("tel-togo").textContent = Math.max(0, Math.round(state.dest.km * (1 - p))).toLocaleString();

  const phase =
    state.paused ? "HOLDING PATTERN" :
    p < 0.1 ? "CLIMB" :
    p < 0.85 ? "CRUISE · FL360" :
    p < 0.97 ? "DESCENT" : "FINAL APPROACH";
  $("fl-phase").textContent = phase;

  if (!state.paused && state.remaining <= 0) land(true);
}

$("btn-hold").addEventListener("click", () => {
  state.paused = !state.paused;
  if (state.paused) {
    stopAudio();
  } else {
    state.endAt = Date.now() + state.remaining * 1000;
    if (state.audioOn) startAudio();
  }
  $("btn-hold").textContent = state.paused ? "Resume" : "Hold";
  tickFlight();
});

/* Divert: two-tap confirm, then news alert */

let divertArmed = false;
let divertTimer = null;
$("btn-divert").addEventListener("click", () => {
  if (!divertArmed) {
    divertArmed = true;
    $("btn-divert").textContent = "Confirm divert";
    $("btn-divert").classList.add("armed");
    divertTimer = setTimeout(() => {
      divertArmed = false;
      $("btn-divert").textContent = "Divert";
      $("btn-divert").classList.remove("armed");
    }, 3200);
    return;
  }
  clearTimeout(divertTimer);
  divertArmed = false;
  land(false);
});

/* ---------- Landing / diverting ---------- */

function land(completed) {
  clearInterval(state.timerId);
  stopAudio();
  document.title = "FocusFlight";

  const focusedMin = Math.round((state.totalSeconds - state.remaining) / 60);
  const flownKm = Math.round(state.dest.km * progressNow());
  const d = state.dest.airport;

  pushHistory({
    ts: Date.now(),
    from: state.origin[0],
    to: d[0],
    city: d[2],
    mins: state.dest.mins,
    focused: completed ? state.dest.mins : focusedMin,
    km: completed ? state.dest.km : flownKm,
    status: completed ? "landed" : "diverted",
  });

  if (completed) {
    playChime();
    $("arr-label").textContent = "Arrived";
    $("arr-title").textContent = `Landed in ${d[2]}`;
    $("arr-sub").textContent =
      `${state.origin[0]} → ${d[0]} · ${fmtMins(state.dest.mins)} of unbroken focus` +
      (state.task ? ` on “${state.task}”.` : ".");
    finishArrival();
  } else {
    // Breaking news, then the arrival card
    const pct = Math.round(progressNow() * 100);
    $("news-text").textContent =
      `Flight ${state.flightNo} to ${d[2]} has been diverted ` +
      (pct < 5 ? `shortly after takeoff.` : `mid-flight, ${pct}% of the way into its ${fmtMins(state.dest.mins)} route.`) +
      ` Passengers report the pilot “just needed to check something”.`;
    $("news").hidden = false;
    setTimeout(() => {
      $("news").hidden = true;
      $("arr-label").textContent = "Diverted";
      $("arr-title").textContent = "Flight diverted";
      $("arr-sub").textContent = focusedMin > 0
        ? `${state.origin[0]} → ${d[0]} cut short — still ${fmtMins(Math.max(1, focusedMin))} of focus logged.`
        : `${state.origin[0]} → ${d[0]} cancelled on the runway. The board is always open.`;
      finishArrival();
    }, 3000);
  }
}

function finishArrival() {
  const log = getHistory();
  const totalMin = log.reduce((s, e) => s + (e.focused || 0), 0);
  const totalKm = log.reduce((s, e) => s + (e.km || 0), 0);
  $("arr-total").textContent = `LIFETIME ${totalMin.toLocaleString()} MIN · ${totalKm.toLocaleString()} KM FLOWN`;
  show("screen-arrival");
}

$("btn-again").addEventListener("click", () => {
  renderDestinations();
  show("screen-book");
});

/* ---------- History ---------- */

function renderHistory() {
  const log = getHistory();
  const list = $("history-list");
  list.innerHTML = "";
  $("history-empty").hidden = log.length > 0;

  const totalMin = log.reduce((s, e) => s + (e.focused || 0), 0);
  const totalKm = log.reduce((s, e) => s + (e.km || 0), 0);
  $("log-total").textContent = log.length
    ? `${totalMin.toLocaleString()} MIN · ${totalKm.toLocaleString()} KM`
    : "";

  for (const e of log) {
    const li = document.createElement("li");
    const date = new Date(e.ts).toLocaleDateString([], { month: "short", day: "numeric" });
    const chip = e.status === "landed"
      ? `<span class="chip chip-landed">Landed</span>`
      : `<span class="chip chip-diverted">Diverted</span>`;
    li.innerHTML =
      `<span class="h-date">${date}</span>` +
      `<span class="h-route">${e.from} → ${e.to}</span>` +
      `<span class="h-city">${e.city}</span>` +
      `<span class="h-mins">${fmtMins(e.focused || 0)}</span>` + chip;
    list.appendChild(li);
  }
}

$("nav-history").addEventListener("click", () => { renderHistory(); show("screen-history"); });
$("btn-see-history").addEventListener("click", () => { renderHistory(); show("screen-history"); });
$("btn-log-back").addEventListener("click", () => show("screen-book"));

/* ---------- Cabin audio (WebAudio, no assets) ---------- */

let audioCtx = null;
let audioNodes = null;

function ctx() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function startAudio() {
  if (audioNodes) return;
  const ac = ctx();

  const bufferSize = ac.sampleRate * 4;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.26;

  const hum = ac.createOscillator();
  hum.frequency.value = 65;
  const hum2 = ac.createOscillator();
  hum2.frequency.value = 82;
  const humGain = ac.createGain();
  humGain.gain.value = 0.03;

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, ac.currentTime);
  master.gain.exponentialRampToValueAtTime(1, ac.currentTime + 2.5);

  noise.connect(filter).connect(noiseGain).connect(master);
  hum.connect(humGain).connect(master);
  hum2.connect(humGain);
  master.connect(ac.destination);
  noise.start(); hum.start(); hum2.start();
  audioNodes = { noise, hum, hum2, master };
}

function stopAudio() {
  if (!audioNodes) return;
  const { noise, hum, hum2, master } = audioNodes;
  const t = audioCtx.currentTime;
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  setTimeout(() => { noise.stop(); hum.stop(); hum2.stop(); master.disconnect(); }, 700);
  audioNodes = null;
}

function playChime() {
  const ac = ctx();
  [[830, 0], [620, 0.35]].forEach(([freq, delay]) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    const t = ac.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(gain).connect(ac.destination);
    osc.start(t); osc.stop(t + 1.3);
  });
}

function playTear() {
  const ac = ctx();
  const dur = 0.28;
  const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2600;
  filter.Q.value = 0.6;
  const gain = ac.createGain();
  gain.gain.value = 0.16;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

$("btn-audio").addEventListener("click", () => {
  state.audioOn = !state.audioOn;
  $("btn-audio").textContent = state.audioOn ? "Cabin audio · on" : "Cabin audio · off";
  $("btn-audio").classList.toggle("off", !state.audioOn);
  if (state.audioOn && !state.paused) startAudio(); else stopAudio();
});

/* ---------- Init ---------- */

(function init() {
  const savedOrigin = storeGet("ff-origin", "");
  if (savedOrigin) {
    const a = AIRPORTS.find((x) => x[0] === savedOrigin);
    if (a) setOrigin(a);
  }
  requestAnimationFrame(() => setWheel(25, false));
})();
