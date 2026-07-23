/* ============ FocusFlight ============ */

const DESTINATIONS = [
  { code: "NAP", city: "Nap Valley",     minutes: 10 },
  { code: "QUI", city: "Quick Hop",      minutes: 15 },
  { code: "POM", city: "Pomodoro City",  minutes: 25 },
  { code: "SPR", city: "Sprintfield",    minutes: 45 },
  { code: "DEE", city: "Deep Work Bay",  minutes: 60 },
  { code: "FLO", city: "Flowtown",       minutes: 90 },
  { code: "MAR", city: "Marathon Mesa",  minutes: 120 },
  { code: "ULT", city: "Ultra Ridge",    minutes: 180 },
];

const $ = (id) => document.getElementById(id);

const state = {
  dest: null,          // { code, city, minutes }
  task: "",
  totalSeconds: 0,
  remaining: 0,
  paused: false,
  timerId: null,
  audioOn: true,
};

/* ---------- Screen switching ---------- */

function show(screenId) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(screenId).classList.add("active");
}

/* ---------- Booking ---------- */

const destGrid = $("destinations");
DESTINATIONS.forEach((d) => {
  const btn = document.createElement("button");
  btn.className = "dest-btn";
  btn.innerHTML = `<span class="d-code">${d.code}</span><span class="d-city">${d.city}</span><span class="d-mins">${d.minutes} min</span>`;
  btn.addEventListener("click", () => selectDestination(d, btn));
  destGrid.appendChild(btn);
});

function selectDestination(d, btn) {
  state.dest = d;
  document.querySelectorAll(".dest-btn").forEach((b) => b.classList.remove("selected"));
  if (btn) btn.classList.add("selected");
  $("picked-code").textContent = d.code;
  $("picked-city").textContent = `${d.city} · ${d.minutes} min`;
  $("btn-book").disabled = false;
}

$("btn-charter").addEventListener("click", () => {
  const mins = parseInt($("custom-minutes").value, 10);
  if (!mins || mins < 1) return;
  const clamped = Math.min(mins, 360);
  selectDestination({ code: "CHR", city: "Charter Flight", minutes: clamped }, null);
});

$("btn-book").addEventListener("click", () => {
  if (!state.dest) return;
  state.task = $("task-input").value.trim();
  fillTicket();
  show("screen-ticket");
});

/* ---------- Ticket ---------- */

function fillTicket() {
  const d = state.dest;
  const flight = "FF " + (100 + Math.floor(Math.random() * 900));
  const gate = "ABCD"[Math.floor(Math.random() * 4)] + (1 + Math.floor(Math.random() * 24));
  const seat = (1 + Math.floor(Math.random() * 30)) + "ACDF"[Math.floor(Math.random() * 4)];

  $("t-dest-code").textContent = d.code;
  $("t-dest-city").textContent = d.city;
  $("t-flight").textContent = flight;
  $("t-gate").textContent = gate;
  $("t-seat").textContent = seat;
  $("t-duration").textContent = d.minutes + " MIN";
  $("t-task").textContent = state.task || "Deep focus";
  $("stub-code").textContent = d.code;
  $("stub-flight").textContent = flight;
  $("hud-dest").textContent = d.code;
}

$("btn-back").addEventListener("click", () => show("screen-booking"));

/* ---------- Flight ---------- */

$("btn-board").addEventListener("click", () => {
  state.totalSeconds = state.dest.minutes * 60;
  state.remaining = state.totalSeconds;
  state.paused = false;
  $("hud-task").textContent = state.task || "";
  $("btn-pause").textContent = "⏸ Hold";
  updateHud();
  show("screen-flight");
  if (state.audioOn) startAudio();
  state.timerId = setInterval(tick, 1000);
});

function tick() {
  if (state.paused) return;
  state.remaining--;
  updateHud();
  if (state.remaining <= 0) land(true);
}

function updateHud() {
  const m = Math.floor(state.remaining / 60);
  const s = state.remaining % 60;
  const label = `${m}:${String(s).padStart(2, "0")}`;
  $("hud-timer").textContent = label;
  document.title = `${label} → ${state.dest.code} · FocusFlight`;

  const progress = 1 - state.remaining / state.totalSeconds;
  $("hud-progress").style.width = progress * 100 + "%";
  $("hud-dot").style.left = progress * 100 + "%";

  // Flight phases: climb → cruise → descent, sky shifts day → dusk → night
  const sky = $("sky");
  sky.classList.toggle("dusk", progress >= 0.45 && progress < 0.8);
  sky.classList.toggle("night", progress >= 0.8);
  const status =
    progress < 0.08 ? "Climbing out of DTR…" :
    progress < 0.85 ? "Cruising at 36,000 ft" :
    progress < 0.97 ? "Beginning descent…" :
    "Final approach 🛬";
  $("hud-status").textContent = state.paused ? "Holding pattern — timer paused" : status;
}

$("btn-pause").addEventListener("click", () => {
  state.paused = !state.paused;
  $("btn-pause").textContent = state.paused ? "▶ Resume" : "⏸ Hold";
  if (state.paused) stopAudio(); else if (state.audioOn) startAudio();
  updateHud();
});

$("btn-divert").addEventListener("click", () => {
  if (!confirm("Divert the flight and end this focus session early?")) return;
  land(false);
});

function land(completed) {
  clearInterval(state.timerId);
  stopAudio();
  document.title = "FocusFlight — book a flight, land your focus";

  const focusedMinutes = Math.round((state.totalSeconds - Math.max(state.remaining, 0)) / 60);
  if (completed) {
    playChime();
    addMiles(state.dest.minutes);
    $("arrival-title").textContent = `Welcome to ${state.dest.city}`;
    $("arrival-sub").textContent = `You focused for ${state.dest.minutes} minute${state.dest.minutes === 1 ? "" : "s"} without leaving your seat.` + (state.task ? ` Mission: ${state.task}` : "");
    $("screen-arrival").querySelector(".arrival-emoji").textContent = "🛬";
  } else {
    if (focusedMinutes > 0) addMiles(focusedMinutes);
    $("arrival-title").textContent = "Flight diverted";
    $("arrival-sub").textContent = focusedMinutes > 0
      ? `Still, you logged ${focusedMinutes} focused minute${focusedMinutes === 1 ? "" : "s"}. Every mile counts.`
      : "No focus logged this time. The runway is always open.";
    $("screen-arrival").querySelector(".arrival-emoji").textContent = "🛫";
  }
  $("arrival-miles").textContent = milesLabel();
  $("sky").classList.remove("dusk", "night");
  show("screen-arrival");
}

$("btn-again").addEventListener("click", () => {
  renderMiles();
  show("screen-booking");
});

/* ---------- Lifetime miles (localStorage) ---------- */

const MILES_PER_MINUTE = 8; // roughly a cruising jet

function getMinutesFlown() {
  return parseInt(localStorage.getItem("ff-minutes") || "0", 10);
}
function addMiles(minutes) {
  localStorage.setItem("ff-minutes", String(getMinutesFlown() + minutes));
}
function milesLabel() {
  const mins = getMinutesFlown();
  if (!mins) return "";
  return `Lifetime: ${mins} focused min · ${(mins * MILES_PER_MINUTE).toLocaleString()} focus miles`;
}
function renderMiles() {
  $("miles-flown").textContent = milesLabel();
}
renderMiles();

/* ---------- Cabin ambience (WebAudio, no assets) ---------- */

let audioCtx = null;
let audioNodes = null;

function startAudio() {
  if (audioNodes) return;
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  // Brown noise ≈ cabin air rush
  const bufferSize = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 500;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.28;

  // Low engine hum
  const hum = audioCtx.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 65;
  const hum2 = audioCtx.createOscillator();
  hum2.type = "sine";
  hum2.frequency.value = 82;
  const humGain = audioCtx.createGain();
  humGain.gain.value = 0.035;

  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  master.gain.exponentialRampToValueAtTime(1, audioCtx.currentTime + 2.5); // fade in

  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  hum.connect(humGain).connect(master);
  hum2.connect(humGain);
  master.connect(audioCtx.destination);

  noise.start();
  hum.start();
  hum2.start();
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
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  // Classic two-tone cabin chime: ding... dong
  [[830, 0], [620, 0.35]].forEach(([freq, delay]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 1.3);
  });
}

$("btn-audio").addEventListener("click", () => {
  state.audioOn = !state.audioOn;
  const btn = $("btn-audio");
  btn.classList.toggle("off", !state.audioOn);
  btn.textContent = state.audioOn ? "🔊 Cabin audio" : "🔇 Cabin audio";
  if (state.audioOn && !state.paused) startAudio(); else stopAudio();
});
