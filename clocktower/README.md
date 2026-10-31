# ✦ Clocktower Companion

A grimoire, game log and AI analyst for **Blood on the Clocktower**. It's a static web app with no build step: open `index.html`, or host the folder on any static host such as GitHub Pages.

## Features

- **Scripts**: Trouble Brewing, Bad Moon Rising and Sects & Violets (with their Travellers) are built in.
  **Harold Holt's Revenge** and **Witchcraft** have their own slots. Paste each script's JSON once
  (from the official script tool or botcscripts.com) and it is saved.
- **Custom scripts**: build one by ticking characters from the base editions plus ~70 experimental characters,
  add homebrew characters, or import any script JSON. Unknown characters are kept and can be edited.
- **Grimoire**: players sit in a circle in seat order. For each player you can track their claim, their
  actual character, a good/evil read, a suspicion slider, alive/dead, ghost vote, notes and which seat is
  you. The centre shows the alive count and how many votes an execution needs.
- **Player or Storyteller mode**: track claims and reads as a player, or the true grimoire as the Storyteller.
- **Log**: record nominations (with voters, which also spends ghost votes), deaths, claimed or private
  info, and notes. Everything shows in a timeline grouped by night and day.
- **AI analyst**: sends the script, player-count distribution, your perspective, every player and the
  full timeline to Claude. Quick prompts cover world analysis, Demon ranking, contradiction checks,
  who to execute, your best play, the evil perspective and Storyteller balance. You can also ask your
  own questions, and replies stream in. Add an Anthropic API key (stored only in your browser), or use
  **Copy prompt** to paste the whole game into Claude.
- Games are saved in `localStorage`. Use export/import to move them as JSON.

Ability text in `data.js` is paraphrased for quick reference.
