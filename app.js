/* ============ FocusFlight ============ */

const CRUISE_KMH = 900;
const DURATIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 105, 120, 150, 180, 240];
const BUSINESS_YT_ID = "NHOFkcun06s"; // the app's in-flight music soundtrack

const AIRLINES = [
  {
    id: "hopper", name: "Hopper Air", tier: "Budget", tag: "No frills. All focus.",
    rate: 0.07, base: 19, hasBusiness: false, offRoute: 0.18, soldEco: 0.15,
    logo: `<svg viewBox="0 0 38 38"><circle cx="19" cy="19" r="18" fill="#F27B13"/><path d="M8 25 L15 14 L20 21 L25 11 L30 25" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: "meridian", name: "Meridian Airways", tier: "Mid-range", tag: "The dependable daily.",
    rate: 0.12, base: 49, hasBusiness: true, offRoute: 0.08, soldEco: 0.12, soldBiz: 0.4,
    logo: `<svg viewBox="0 0 38 38"><circle cx="19" cy="19" r="17" fill="none" stroke="#1E63D0" stroke-width="2.4"/><ellipse cx="19" cy="19" rx="8" ry="17" fill="none" stroke="#1E63D0" stroke-width="1.6"/><line x1="2" y1="19" x2="36" y2="19" stroke="#1E63D0" stroke-width="2.4"/></svg>`,
  },
  {
    id: "aurum", name: "Aurum Air", tier: "Premium", tag: "Quiet luxury at altitude.",
    rate: 0.24, base: 120, hasBusiness: true, offRoute: 0.3, soldEco: 0.30, soldBiz: 0.3,
    logo: `<svg viewBox="0 0 38 38"><circle cx="19" cy="19" r="18" fill="#14161C"/><path d="M19 7 L27 29 L23.5 29 L19 16.5 L14.5 29 L11 29 Z" fill="#C9A54E"/><line x1="13" y1="24" x2="25" y2="24" stroke="#C9A54E" stroke-width="1.6"/></svg>`,
  },
];

/* Deterministic per-route, per-day availability */
function seededRng(str) {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return function () {
    h = (h + 0x6D2B79F5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fareBoard(originCode, destCode, km) {
  const day = new Date().toDateString();
  const rng = seededRng(`${originCode}-${destCode}-${day}`);
  const board = AIRLINES.map((al) => {
    const onRoute = rng() > al.offRoute;
    const ecoPrice = Math.round(al.base + km * al.rate);
    const bizPrice = Math.round(ecoPrice * 3.2);
    return {
      airline: al,
      onRoute,
      eco: { price: ecoPrice, sold: rng() < al.soldEco },
      biz: al.hasBusiness ? { price: bizPrice, sold: rng() < al.soldBiz } : null,
    };
  });
  // Guarantee at least one bookable fare
  const bookable = board.some((b) => b.onRoute && ((b.eco && !b.eco.sold) || (b.biz && !b.biz.sold)));
  if (!bookable) {
    const mid = board[1];
    mid.onRoute = true;
    mid.eco.sold = false;
  }
  return board;
}

const $ = (id) => document.getElementById(id);

const state = {
  origin: null,        // airport record
  duration: 25,        // wheel minutes
  dest: null,          // { airport, mins, km }
  fare: null,          // { airline, cls: "Y"|"J", price }
  flightNo: "",
  task: "",
  totalSeconds: 0,
  remaining: 0,
  endAt: 0,
  paused: false,
  flying: false,
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

/* ---------- Scheduled flights (departures board) ---------- */

const NOSHOW_GRACE_MS = 10 * 60 * 1000;

function getSchedules() {
  try { return JSON.parse(storeGet("ff-sched", "[]")); } catch (e) { return []; }
}
function setSchedules(list) {
  storeSet("ff-sched", JSON.stringify(list));
}

function scheduleFlight(ts) {
  const list = getSchedules();
  list.push({
    id: Date.now() + "-" + Math.floor(Math.random() * 1e6),
    ts,
    from: state.origin[0],
    to: state.dest.airport[0],
    mins: state.dest.mins,
    km: state.dest.km,
    airlineId: state.fare.airline.id,
    cls: state.fare.cls,
    price: state.fare.price,
    task: state.task,
    flightNo: state.flightNo,
  });
  list.sort((a, b) => a.ts - b.ts);
  setSchedules(list);
  renderBoard();
}

function cancelScheduled(id) {
  setSchedules(getSchedules().filter((e) => e.id !== id));
  renderBoard();
}

function boardStatus(entry, now) {
  const dt = entry.ts - now;
  if (dt > 2 * 60 * 1000) return ["SCHEDULED", "ok"];
  if (dt > 0) return ["BOARDING", "soon"];
  return [state.flying ? "DELAYED" : "DEPARTING", "late"];
}

function renderBoard() {
  const list = getSchedules();
  const field = $("board-field");
  field.hidden = list.length === 0;
  if (!list.length) return;

  const now = Date.now();
  const ul = $("board-list");
  ul.innerHTML = "";
  for (const e of list) {
    const al = AIRLINES.find((a) => a.id === e.airlineId);
    const [txt, cssCls] = boardStatus(e, now);
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="b-time">${new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>` +
      `<span class="b-route">${e.from} → ${e.to}</span>` +
      `<span class="b-info">${e.flightNo} · ${al ? al.name : ""} ${e.cls}${e.task ? ` · ${e.task}` : ""}</span>` +
      `<span class="b-status ${cssCls}">${txt}</span>`;
    const x = document.createElement("button");
    x.className = "b-cancel";
    x.title = "Cancel this flight";
    x.textContent = "✕";
    x.addEventListener("click", () => cancelScheduled(e.id));
    li.appendChild(x);
    ul.appendChild(li);
  }
}

function kickScheduled(entry) {
  cancelScheduled(entry.id);
  const origin = AIRPORTS.find((a) => a[0] === entry.from);
  const dest = AIRPORTS.find((a) => a[0] === entry.to);
  const airline = AIRLINES.find((a) => a.id === entry.airlineId) || AIRLINES[1];
  if (!origin || !dest) return;
  state.origin = origin;
  state.dest = { airport: dest, mins: entry.mins, km: entry.km };
  state.fare = { airline, cls: entry.cls, price: entry.price };
  state.task = entry.task || "";
  state.flightNo = entry.flightNo;
  playChime();
  startFlight();
}

function checkSchedules() {
  const now = Date.now();
  const list = getSchedules();
  if (!list.length) return;

  // Flights missed by more than the grace period become no-shows
  const missed = list.filter((e) => now - e.ts > NOSHOW_GRACE_MS);
  for (const e of missed) {
    pushHistory({
      ts: e.ts, from: e.from, to: e.to,
      city: (AIRPORTS.find((a) => a[0] === e.to) || [,, e.to])[2],
      airline: (AIRLINES.find((a) => a.id === e.airlineId) || {}).name?.split(" ")[0] || "",
      cls: e.cls, mins: e.mins, focused: 0, km: 0, status: "noshow",
    });
  }
  if (missed.length) setSchedules(list.filter((e) => now - e.ts <= NOSHOW_GRACE_MS));

  // Depart the earliest due flight, unless one is already in the air
  if (!state.flying) {
    const due = getSchedules().find((e) => e.ts <= now);
    if (due) { kickScheduled(due); return; }
  }
  renderBoard();
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
  state.fare = null;
  renderFares();
  show("screen-fare");
}

/* ---------- Fare selection ---------- */

const CLASS_NAMES = { Y: "Economy", J: "Business" };

function renderFares() {
  const o = state.origin, d = state.dest;
  $("fare-route-city").textContent = `${o[2]} → ${d.airport[2]}`;
  $("fare-route").textContent = `${o[0]} → ${d.airport[0]} · ${fmtMins(d.mins)} · ${d.km.toLocaleString()} km`;

  const list = $("airline-list");
  list.innerHTML = "";

  for (const entry of fareBoard(o[0], d.airport[0], d.km)) {
    const al = entry.airline;
    const li = document.createElement("li");
    li.className = "airline" + (entry.onRoute ? "" : " off");

    const fares = document.createElement("div");
    fares.className = "al-fares";
    if (!entry.onRoute) {
      fares.innerHTML = `<span class="al-note">Not on this route</span>`;
    } else {
      fares.appendChild(fareButton(al, "Y", entry.eco));
      if (entry.biz) fares.appendChild(fareButton(al, "J", entry.biz));
      else fares.insertAdjacentHTML("beforeend", `<span class="al-note">Economy only</span>`);
    }

    li.innerHTML =
      `<span class="al-logo">${al.logo}</span>` +
      `<div class="al-info"><span class="al-tier">${al.tier}</span>` +
      `<span class="al-name">${al.name}</span><span class="al-tag">${al.tag}</span></div>`;
    li.appendChild(fares);
    list.appendChild(li);
  }
}

function fareButton(al, cls, fare) {
  const btn = document.createElement("button");
  btn.className = "fare-btn" + (fare.sold ? " sold" : "");
  btn.innerHTML =
    `<span class="fb-class">${CLASS_NAMES[cls]}</span>` +
    (fare.sold
      ? `<span class="fb-price">$${fare.price}</span><span class="fb-soldout">SOLD OUT</span>`
      : `<span class="fb-price">$${fare.price}</span>`);
  if (fare.sold) {
    btn.disabled = true;
  } else {
    btn.addEventListener("click", () => {
      state.fare = { airline: al, cls, price: fare.price };
      state.flightNo = "FF " + (100 + Math.floor(Math.random() * 900));
      fillTicket();
      show("screen-ticket");
    });
  }
  return btn;
}

$("btn-fare-back").addEventListener("click", () => show("screen-book"));

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
  const biz = state.fare.cls === "J";
  $("t-seat").textContent = biz
    ? (1 + Math.floor(Math.random() * 4)) + "AF"[Math.floor(Math.random() * 2)]
    : (5 + Math.floor(Math.random() * 26)) + "ACDF"[Math.floor(Math.random() * 4)];
  $("t-airline").innerHTML = `${state.fare.airline.logo}<span>${state.fare.airline.name.toUpperCase()}</span>`;
  $("t-class").textContent = `${CLASS_NAMES[state.fare.cls]} (${state.fare.cls})`;
  $("t-fare").textContent = "$" + state.fare.price;
  $("t-task").textContent = state.task || "Deep focus";
  $("stub-codes").textContent = `${o[0]} → ${d.airport[0]}`;
  $("stub-flight").textContent = state.flightNo;

  // Default scheduled departure: half an hour out, rounded to 5 min
  const t = new Date(Date.now() + 30 * 60000);
  t.setMinutes(Math.ceil(t.getMinutes() / 5) * 5, 0, 0);
  $("sched-time").value =
    `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}

$("btn-sched").addEventListener("click", () => {
  const v = $("sched-time").value;
  if (!v || !state.dest || !state.fare) return;
  const [h, m] = v.split(":").map(Number);
  const t = new Date();
  t.setHours(h, m, 0, 0);
  if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1); // past time → tomorrow
  scheduleFlight(t.getTime());
  show("screen-book");
});

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
  state.paused = false;
  state.flying = true;
  divertArmed = false;

  $("fl-from").textContent = state.origin[0];
  $("fl-to").textContent = d.airport[0];
  $("fl-task").textContent = state.task || "";
  $("fl-fare").textContent = `${state.fare.airline.name} · ${CLASS_NAMES[state.fare.cls]}`;
  $("fl-timer").textContent = fmtClock(state.totalSeconds);
  $("fl-phase").textContent = "PRE-FLIGHT";
  $("fl-progress").style.width = "0%";
  $("fl-marker").style.left = "0%";
  $("btn-hold").textContent = "Hold";
  $("btn-divert").textContent = "Divert";
  $("btn-divert").classList.remove("armed");
  $("news").hidden = true;

  show("screen-flight");
  // Start audio inside the boarding gesture so autoplay is permitted;
  // the pre-flight sequence plays over it.
  if (state.audioOn) startAudio();
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
    $("btn-audio").textContent = "Tap to start audio";
    document.addEventListener("click", () => {
      if (state.flying && state.audioOn) {
        stopAudio();
        startAudio();
        $("btn-audio").textContent = "Cabin audio · on";
      }
    }, { once: true });
  }
  runPreflight(beginCruise);
}

/* Doors closing → safety briefing → takeoff, then the clock starts.
   Each phase is driven by its cabin announcement and advances when the
   clip ends; if a clip can't play, timed fallbacks keep things moving. */

const ANNOUNCEMENTS = typeof ANNOUNCEMENT_DATA !== "undefined" ? ANNOUNCEMENT_DATA : {
  doors: "announcements/doors-arm.mp3",
  safety: "announcements/safety-briefing.mp3",
  captain: "announcements/captain-takeoff.mp3",
};

let currentAnn = null;
function playAnnouncement(name, fallbackMs, cb) {
  let advanced = false;
  const next = () => {
    if (advanced) return;
    advanced = true;
    currentAnn = null;
    cb();
  };
  let a;
  try { a = new Audio(ANNOUNCEMENTS[name]); } catch (e) { setTimeout(next, fallbackMs); return; }
  currentAnn = a;
  a.addEventListener("ended", () => setTimeout(next, 500));
  a.addEventListener("error", () => setTimeout(next, fallbackMs));
  const p = a.play();
  if (p && p.catch) p.catch(() => setTimeout(next, fallbackMs));
}
function stopAnnouncement() {
  if (currentAnn) {
    try { currentAnn.pause(); } catch (e) { /* already gone */ }
    currentAnn = null;
  }
}

let preflightTimers = [];
function runPreflight(done) {
  const pf = $("preflight");
  const label = $("pf-label"), sub = $("pf-sub"), belt = $("pf-belt");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    stopAnnouncement();
    preflightTimers.forEach(clearTimeout);
    preflightTimers = [];
    pf.classList.add("done");
    $("screen-flight").classList.remove("boarding");
    preflightTimers.push(setTimeout(() => { pf.hidden = true; }, 850));
    done();
  };
  const guard = (fn) => () => { if (!finished) fn(); };

  pf.classList.remove("closed", "done");
  $("screen-flight").classList.add("boarding");
  belt.setAttribute("hidden", "");
  label.textContent = "CABIN DOORS CLOSING";
  sub.textContent = "Cabin crew, arm doors and cross-check";
  pf.hidden = false;
  $("pf-skip").onclick = finish;

  preflightTimers.forEach(clearTimeout);
  preflightTimers = [setTimeout(() => pf.classList.add("closed"), 60)];

  const takeoff = guard(() => {
    belt.setAttribute("hidden", "");
    label.textContent = "CLEARED FOR TAKEOFF";
    sub.textContent = "Captain's announcement";
    playAnnouncement("captain", 2000, guard(() => {
      sub.textContent = "V1 — rotate";
      playSpool();
      preflightTimers.push(setTimeout(finish, 2000));
    }));
  });

  const briefing = guard(() => {
    playChime();
    belt.removeAttribute("hidden");
    label.textContent = "SAFETY BRIEFING IN PROGRESS";
    sub.textContent = "Your nearest focus exit may be behind you";
    playAnnouncement("safety", 3800, takeoff);
  });

  playAnnouncement("doors", 2400, briefing);
}

function beginCruise() {
  if (!state.flying || state.timerId) return;
  state.endAt = Date.now() + state.totalSeconds * 1000;
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
  state.timerId = null;
  state.flying = false;
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
    airline: state.fare ? state.fare.airline.name.split(" ")[0] : "",
    cls: state.fare ? state.fare.cls : "",
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
      : e.status === "noshow"
      ? `<span class="chip chip-noshow">No-show</span>`
      : `<span class="chip chip-diverted">Diverted</span>`;
    li.innerHTML =
      `<span class="h-date">${date}</span>` +
      `<span class="h-route">${e.from} → ${e.to}</span>` +
      `<span class="h-city">${e.city}${e.airline ? ` · ${e.airline} ${e.cls}` : ""}</span>` +
      `<span class="h-mins">${fmtMins(e.focused || 0)}</span>` + chip;
    list.appendChild(li);
  }
}

$("nav-history").addEventListener("click", () => { renderHistory(); show("screen-history"); });
$("btn-see-history").addEventListener("click", () => { renderHistory(); show("screen-history"); });
$("btn-log-back").addEventListener("click", () => show("screen-book"));

/* ---------- Cabin audio ----------
   Economy: synthesized cabin hum (WebAudio, no assets).
   Business: in-flight music via hidden YouTube embed (audio only);
   where external embeds are blocked (e.g. hosted artifact CSP),
   falls back to a synthesized first-class lounge pad. */

let audioCtx = null;
let audioNodes = null;   // economy hum
let ytFrame = null;      // business: youtube iframe
let padNodes = null;     // business: fallback lounge pad
let audioSession = 0;    // guards async fallback races

function ctx() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function startAudio() {
  if (state.fare && state.fare.cls === "J") startBusinessAudio();
  else startHum();
}

function stopAudio() {
  audioSession++;
  stopHum();
  removeYtFrame();
  stopPad();
}

let ytMsgHandler = null;

function startBusinessAudio() {
  if (ytFrame || padNodes) return;
  const session = ++audioSession;
  // Hidden audio-only player. Created synchronously so a user-gesture call
  // (boarding click) grants it autoplay permission. enablejsapi lets the
  // embed report its real player state back over postMessage.
  const wrap = document.createElement("div");
  wrap.className = "yt-dock";
  wrap.innerHTML = `<span class="yt-dock-label mono">TAP PLAY FOR CABIN MUSIC</span>`;
  const f = document.createElement("iframe");
  f.src = `https://www.youtube.com/embed/${BUSINESS_YT_ID}` +
    `?autoplay=1&loop=1&playlist=${BUSINESS_YT_ID}&playsinline=1&enablejsapi=1`;
  f.allow = "autoplay";
  wrap.appendChild(f);
  document.body.appendChild(wrap);

  let playing = false;
  let loadFired = false;
  const send = (obj) => {
    try { f.contentWindow.postMessage(JSON.stringify(obj), "*"); } catch (e) { /* frame gone */ }
  };
  ytMsgHandler = (e) => {
    if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
    let d = e.data;
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (err) { return; } }
    if (!d) return;
    if (d.event === "onReady") send({ event: "command", func: "playVideo", args: [] });
    // playerState: 1 playing, 3 buffering, 0 ended
    const s = d.info && typeof d.info === "object" ? d.info.playerState : undefined;
    if (s === 1 || s === 3) {
      playing = true;
      wrap.classList.remove("visible"); // music confirmed — tuck away
    }
    if (s === 0) {
      // The loop=1 param is unreliable in embeds — restart the track ourselves
      send({ event: "command", func: "seekTo", args: [0, true] });
      send({ event: "command", func: "playVideo", args: [] });
    }
  };
  window.addEventListener("message", ytMsgHandler);

  f.addEventListener("load", () => {
    loadFired = true;
    send({ event: "listening", id: "ff-biz", channel: "widget" });
    // Nudge playback in case autoplay was swallowed
    setTimeout(() => send({ event: "command", func: "playVideo", args: [] }), 700);
    setTimeout(() => send({ event: "command", func: "playVideo", args: [] }), 2000);
  });

  ytFrame = wrap;

  // Decide after 5s based on what actually happened:
  //  - playing: stay hidden, music is on.
  //  - loaded but not playing (autoplay refused, common on phones):
  //    surface a small player so one tap starts the song.
  //  - never loaded (blocked network/CSP/adblock): synthesized lounge pad.
  setTimeout(() => {
    if (session !== audioSession || playing) return;
    if (loadFired) {
      wrap.classList.add("visible");
    } else {
      removeYtFrame();
      startPad();
    }
  }, 5000);
}

function removeYtFrame() {
  if (ytMsgHandler) { window.removeEventListener("message", ytMsgHandler); ytMsgHandler = null; }
  if (ytFrame) { ytFrame.remove(); ytFrame = null; }
}

/* Fallback lounge pad: slow warm chords over a faint hum */
const PAD_CHORDS = [
  [130.81, 196.00, 246.94, 329.63], // Cmaj7
  [110.00, 164.81, 220.00, 261.63], // Am7
  [174.61, 220.00, 261.63, 329.63], // Fmaj7
  [98.00, 146.83, 246.94, 293.66],  // G6
];

function startPad() {
  if (padNodes) return;
  const ac = ctx();
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, ac.currentTime);
  master.gain.exponentialRampToValueAtTime(1, ac.currentTime + 3);
  master.connect(ac.destination);

  const hum = ac.createOscillator();
  hum.frequency.value = 55;
  const humGain = ac.createGain();
  humGain.gain.value = 0.018;
  hum.connect(humGain).connect(master);
  hum.start();

  let chordIdx = 0;
  function playChord() {
    const t = ac.currentTime;
    for (const freq of PAD_CHORDS[chordIdx % PAD_CHORDS.length]) {
      const osc = ac.createOscillator();
      osc.frequency.value = freq;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.028, t + 2.6);
      g.gain.setValueAtTime(0.028, t + 4.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 7.4);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 7.6);
    }
    chordIdx++;
  }
  playChord();
  const interval = setInterval(playChord, 7000);
  padNodes = { hum, master, interval };
}

function stopPad() {
  if (!padNodes) return;
  const { hum, master, interval } = padNodes;
  clearInterval(interval);
  const t = audioCtx.currentTime;
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  setTimeout(() => { hum.stop(); master.disconnect(); }, 700);
  padNodes = null;
}

function startHum() {
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

function stopHum() {
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

function playSpool() {
  // Rising engine spool: filtered noise sweeping up over ~1.8s
  const ac = ctx();
  const dur = 1.8;
  const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.04 * white) / 1.04;
    data[i] = last * 3;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  const t = ac.currentTime;
  filter.frequency.setValueAtTime(120, t);
  filter.frequency.exponentialRampToValueAtTime(900, t + dur);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22, t + 0.5);
  gain.gain.setValueAtTime(0.22, t + dur - 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
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
  checkSchedules();
  setInterval(checkSchedules, 5000);
})();
