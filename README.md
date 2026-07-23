# ✈ FocusFlight

A flight-themed deep-focus timer, inspired by [focusflight.net](https://focusflight.net).

Book a ticket, pick a destination, board — and a full-screen flight runs your
focus session with cabin ambience until you land.

## How it works

1. **Book** — choose a destination (each one is a focus length, from a 10-min
   hop to a 3-hour ultra), or charter a custom duration. Optionally note what
   you're working on.
2. **Boarding pass** — you get a ticket with a flight number, gate and seat.
3. **Fly** — full-screen sky with drifting clouds, a countdown timer, and a
   route progress bar. The sky shifts from day to dusk to night as you cruise.
   Cabin ambience (engine hum + air rush) is generated in the browser with the
   Web Audio API — no audio files needed.
4. **Land** — a cabin chime plays, and you arrive. Focused minutes accumulate
   into lifetime "focus miles" (stored in localStorage).

Pause = holding pattern. Quitting early = diverting the flight (partial
minutes still count).

## Running it

No build step, no dependencies — it's plain HTML/CSS/JS:

```sh
open index.html        # or just double-click it
# or serve it:
python3 -m http.server 8000
```
