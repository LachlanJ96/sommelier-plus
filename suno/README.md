# Take One

A prompt and lyric desk for Suno v5 and v5.5. Type a genre, a theme and a
reference artist; get back a title, a Style field, an Exclude Styles field and
a lyric sheet with the section tags already in place.

Open `suno/index.html`. No build, no dependencies, no network calls — the
genre and artist tables ship with it and everything is generated in the page.

## What it knows

The generator is built around how v5 and v5.5 actually read their inputs:

- **The Style field caps at 1000 characters** and weights its opening hardest,
  so the prompt is written front-loaded in the order the model reads: genre
  and era, then feel, then voice, then instruments and production, then tempo
  and key. Output typically lands between 350 and 600 characters.
- **Brackets belong in the lyric box, not the style box.** Structure tags go
  in the lyric sheet; the style prompt is plain prose.
- **Tempo and key read best as plain tags** — `92 BPM, C minor` — so that is
  how they are written.
- **Exclusions belong in the Exclude Styles field**, not inline in the style
  prompt, and stop steering reliably past two or three entries. The app caps
  them at three.
- **Artist names are blocked, and using one can get an account struck.** So
  the reference artist never leaves this page. It is translated into era,
  vocal character, instrumentation, mix and rhythmic feel before anything is
  written, and every draft is checked against the full name list before it is
  shown to you.
- **v5.5 responds better to clear direction than to a long tag list**, so that
  is the default shape; switching to v5 adds a short closing instruction. A
  comma-separated tag version is available behind the *tag version* toggle for
  either.
- **Lyric length matters.** Under roughly 150 words Suno improvises filler,
  over roughly 350 it rushes or drops a section. Sheets are written to sit in
  between, and the word count is shown against that range. Genres built on a
  repeated phrase rather than verses — techno, ambient, lo-fi — get a much
  lower floor, because forty words is not an underwritten techno track.

## Why the lyrics do not read like a machine wrote them

They are not assembled word by word out of adjective lists. `data-lexicon.js`
holds 195 hand-written stanzas — grouped into twelve subject domains — that
already scan and already rhyme, with slots for the things that should change
between songs. The engine picks stanzas whose line lengths suit the genre's
phrasing, fixes a cast of objects and places so a song stays about one spare
key and one driveway, keeps a single chorus and repeats it the way a real song
does, and sweeps the finished draft against a list of the phrases that give
machine writing away — the neon, the echoes, the shattered pieces.

Themes route to the domain they are actually about, and any distinctive noun
you type finds its way into the sheet.

## Files

| file | what's in it |
| --- | --- |
| `data-genres.js` | 65 genre profiles — tempo, keys, instrumentation, production, drums, vocal character, room, arrangement, line lengths, default exclusions |
| `data-artists.js` | 81 reference artists, each written down as sound rather than as a name |
| `data-lexicon.js` | the stanza banks, twelve subject domains plus a general fallback, the rap bar bank, and the cliché blocklist |
| `engine.js` | style prompt construction, the lyric assembler, syllable counting and the output checks |
| `app.js` | interface wiring, saved sheets, export |

## Using it

1. Genre, theme, reference artist. The theme matters most — a situation gives
   a better song than an abstraction. *My dad's ute broke down on the way to
   the coast* beats *loss*.
2. **Detail** opens vocal type, length, mood, tempo, key, target model and any
   extra exclusions.
3. **Write it**. **Reroll** re-draws everything; **new lyric, same style**
   keeps the prompt and rewrites the words.
4. Copy each field across to Suno in Custom mode. The *how to run it* list
   under the output says where each block goes.

Saved sheets live in `localStorage`, so they stay in the browser you made them
in. **Download .txt** takes one out.
