# ✈ FocusFlight

A minimalist, flight-themed deep-focus timer inspired by [focusflight.net](https://focusflight.net).

## How it works

1. **Book** — search any of 300+ real world airports as your origin, then scroll
   the time wheel to your focus length. The app computes which airports are
   actually in range (haversine distance at ~900 km/h cruise) and lists them
   with real distances and flight times.
2. **Ticket** — a boarding pass is issued with flight number, gate, seat,
   departure/arrival times, and your mission written on it.
3. **Tear & board** — the ticket physically tears along the perforation
   (with a paper-tear sound), and the flight begins.
4. **Fly** — a dark flight-deck screen: thin-numeral countdown, route progress
   line, live telemetry (altitude, ground speed, km to go), and flight phases
   (climb → cruise → descent → final approach). Cabin ambience is synthesized
   with the Web Audio API — no audio files.
5. **Divert** — quitting early triggers a breaking-news alert before logging
   the flight as diverted. Landing plays the cabin chime.
6. **Flight log** — every ticket is kept in history with a LANDED or DIVERTED
   status, plus lifetime focused minutes and kilometres flown (localStorage).

## Running it

No build step, no dependencies — plain HTML/CSS/JS:

```sh
open index.html        # or just double-click it
# or serve it:
python3 -m http.server 8000
```
