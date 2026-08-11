/* ==========================================================================
   engine.js — builds the style prompt and the lyric sheet
   --------------------------------------------------------------------------
   Two jobs.

   1. buildStyle()  writes the Style field the way v5 and v5.5 actually weight
      it: genre first, then feel, then voice, then instruments and production,
      then tempo and key, with the negatives held back for the Exclude field.
      Reference artists are dissolved into description — the name never makes
      it into the output, and checkOutput() proves it.

   2. buildLyrics() lays out the sections, picks stanzas whose line lengths
      suit the genre's phrasing, keeps one chorus and repeats it like a real
      song does, and refuses to print anything on the cliché list.
   ========================================================================== */

/* ------------------------------------------------------------------ random */

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------------------------------------------------- prosody */

function syllablesInWord(word) {
  let w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function syllables(line) {
  return line.split(/\s+/).reduce((n, w) => n + syllablesInWord(w), 0);
}

/* ---------------------------------------------------------------- cliché */

function clicheHits(text) {
  const t = text.toLowerCase();
  return CLICHES.filter((c) => t.includes(c));
}

/* ------------------------------------------------------------ slot filling */

/* Builds the cast of the song. Prop and place stay fixed all the way through
   — a song is about one key and one driveway — while people, times, details
   and actions rotate through a small set so verses do not read as copies. */
function makeCast(rng, domain, theme) {
  const nouns = themeNouns(theme);
  const subj = nouns.length
    ? nouns.slice().sort((a, b) => b.length - a.length)[0]
    : (domain.props[0] || 'it');
  return {
    PROP: pick(rng, domain.props),
    PLACE: shuffle(rng, domain.places).slice(0, 2),
    PERSON: shuffle(rng, domain.people).slice(0, 2),
    TIME: shuffle(rng, domain.times).slice(0, 2),
    DETAIL: shuffle(rng, domain.details).slice(0, 3),
    ACT: shuffle(rng, domain.acts).slice(0, 2),
    SUBJ: subj,
    _i: { PERSON: 0, TIME: 0, DETAIL: 0, ACT: 0, PLACE: 0 },
  };
}

/* PLACE, TIME, PERSON and ACT hold still for the length of a stanza — a
   chorus that says "take me back to {PLACE}" twice has to mean the same
   place both times. DETAIL is the exception: a verse that calls for two
   details wants two different ones. */
const PINNED = ['PLACE', 'TIME', 'PERSON', 'ACT'];

function fillLine(line, cast, rng) {
  let out = line;

  /* {a|b|c} — inline alternates */
  out = out.replace(/\{([^{}]*\|[^{}]*)\}/g, (_, body) => pick(rng, body.split('|')));

  /* named slots */
  out = out.replace(/\{([A-Z]+)\}/g, (_, key) => {
    const v = cast[key];
    if (v === undefined) return key.toLowerCase();
    if (!Array.isArray(v)) return v;
    if (PINNED.includes(key)) return v[cast._i[key] % v.length];
    const i = cast._i[key] % v.length;
    cast._i[key]++;
    return v[i];
  });

  out = out.replace(/\s+/g, ' ').trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function fillStanza(stanza, cast, rng) {
  PINNED.forEach((k) => { cast._i[k]++; });
  return stanza.map((l) => fillLine(l, cast, rng));
}

/* ==========================================================================
   Style prompt
   ========================================================================== */

const ENERGY = [
  [0, 76, 'slow and heavy, lots of space between hits'],
  [77, 96, 'unhurried, sitting back on the beat'],
  [97, 116, 'steady mid-tempo with a firm push'],
  [117, 136, 'driving and up, never rushed'],
  [137, 999, 'fast and relentless'],
];

function energyFor(bpm) {
  const row = ENERGY.find((r) => bpm >= r[0] && bpm <= r[1]);
  return row ? row[2] : 'steady';
}

function chooseBpm(rng, genre, artist, override) {
  if (override) return override;
  const range = (artist && artist.bpm) || genre.bpm;
  const lo = Math.max(range[0], genre.bpm[0] - 8);
  const hi = Math.min(range[1], genre.bpm[1] + 8);
  const a = Math.min(lo, hi), b = Math.max(lo, hi);
  return Math.round(a + rng() * (b - a));
}

function vocalLine(genre, artist, voice) {
  if (voice === 'instrumental') return null;
  if (artist && artist.vox && voice === 'auto') return artist.vox;
  const g = genre.vox || {};
  let base;
  if (voice === 'male') base = g.m || g.any;
  else if (voice === 'female') base = g.f || g.any;
  else if (voice === 'duet') base = 'a male and a female voice trading lines and meeting in harmony on the chorus';
  else if (voice === 'choir') base = 'a full choir singing in unison behind a single lead voice';
  else base = g.any || g.m || g.f;
  if (artist && artist.vox && voice !== 'auto') {
    /* keep the requested voice type, borrow the reference's texture */
    const texture = artist.vox.replace(/^(male|female|two|a)\s+/i, '');
    return base + ', ' + texture;
  }
  return base;
}

function buildStyle(opts) {
  const { genre, artist, mood, voice, model } = opts;
  const rng = mulberry32(hashString(opts.seedKey + '|style'));
  const bpm = chooseBpm(rng, genre, artist, opts.bpm);
  const key = opts.key || pick(rng, genre.keys);

  /* 1 — genre, subgenre, era. Front-loaded: Suno weights the opening hardest. */
  const era = (artist && artist.era) || genre.era;
  const head = [genre.name.toLowerCase(), era && era !== 'contemporary' ? era + ' production' : null]
    .filter(Boolean).join(', ');

  /* 2 — mood and energy */
  const feelBits = [];
  if (mood) feelBits.push(mood.toLowerCase());
  /* the reference's own groove description is more specific than the generic
     energy band, so it replaces it rather than stacking on top of it */
  if (artist && artist.feel) feelBits.push(artist.feel);
  else feelBits.push(energyFor(bpm), genre.drums);

  /* 3 — voice */
  const vox = vocalLine(genre, artist, voice);

  /* 4 — instruments and production */
  const inst = [];
  if (artist) artist.inst.forEach((i) => inst.push(i));
  genre.inst.forEach((i) => { if (inst.length < 6) inst.push(i); });
  /* "upright bass" and "upright bass line" are the same instruction twice —
     dedupe on containment, not on an exact string match. */
  const instruments = [];
  inst.forEach((i) => {
    const k = i.toLowerCase();
    const dupe = instruments.some((j) => {
      const m = j.toLowerCase();
      return m.includes(k) || k.includes(m);
    });
    if (!dupe && instruments.length < 6) instruments.push(i);
  });

  const prod = [];
  if (artist) artist.prod.forEach((p) => prod.push(p));
  genre.prod.forEach((p) => { if (prod.length < 4) prod.push(p); });
  const production = prod.slice(0, 4);

  /* 5 — tempo and key as plain tags, which is the format Suno reads */
  const tempo = bpm + ' BPM, ' + key;

  const parts = [
    head,
    feelBits.join(', '),
    vox ? vox : 'fully instrumental, no vocal',
    instruments.join(', '),
    production.join(', '),
    genre.space ? 'Room sound: ' + genre.space : null,
    tempo,
  ].filter(Boolean);

  let style = parts.join('. ');
  style = style.replace(/\.\s*\./g, '.');
  if (!/[.!]$/.test(style)) style += '.';

  /* v5.5 responds better to a plain instruction than to a longer tag list,
     so the prose version is the default there. v5 takes a slightly more
     tag-leaning shape. */
  const tagVersion = [
    genre.name.toLowerCase(),
    mood ? mood.toLowerCase() : null,
    era && era !== 'contemporary' ? era : null,
    vox ? vox.split(',')[0] : 'instrumental',
    ...instruments.slice(0, 4),
    ...production.slice(0, 2),
    bpm + ' BPM',
    key,
  ].filter(Boolean).join(', ');

  /* Exclude field — kept to three, which is where it stops working reliably */
  const ex = [];
  (opts.exclude || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => ex.push(s));
  genre.avoid.forEach((a) => { if (ex.length < 3) ex.push(a); });
  if (voice === 'instrumental' && ex.length < 3) ex.push('vocals');
  const exclude = ex.slice(0, 3).join(', ');

  return {
    style: model === 'v5' ? clampStyle(style + ' ' + shortTail(voice)) : clampStyle(style),
    tagStyle: clampStyle(tagVersion),
    exclude,
    bpm,
    key,
    instruments,
    production,
    vox,
  };
}

/* A short closing direction. v5 takes a plain instruction well at the tail. */
function shortTail(voice) {
  return voice === 'instrumental'
    ? 'Keep the arrangement in service of the melody.'
    : 'Keep the arrangement in service of the vocal.';
}

function clampStyle(s) {
  if (s.length <= 1000) return s;
  const cut = s.slice(0, 1000);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '));
  return (stop > 600 ? cut.slice(0, stop) : cut).trim().replace(/[,.]$/, '') + '.';
}

/* ==========================================================================
   Lyrics
   ========================================================================== */

const INSTRUMENTAL_SECTIONS = new Set([
  'Intro', 'Instrumental Break', 'Guitar Solo', 'Drum Break', 'Breakdown', 'Build', 'Outro',
]);

/* Sections that carry no words at all when the track is an instrumental. */
const SECTION_TAG = {
  Verse: 'Verse', Chorus: 'Chorus', 'Pre-Chorus': 'Pre-Chorus', Bridge: 'Bridge',
  Hook: 'Chorus', Intro: 'Intro', Outro: 'Outro', Drop: 'Drop', Build: 'Build',
  Breakdown: 'Breakdown', 'Guitar Solo': 'Guitar Solo', 'Instrumental Break': 'Instrumental Break',
  'Drum Break': 'Drum Break',
};

function trimStructure(struct, length) {
  if (length === 'long') return struct;
  const s = struct.slice();
  if (length === 'short') {
    /* drop the second pass and any solo section */
    const out = [];
    let seenChorus = 0;
    for (const sec of s) {
      if (sec === 'Guitar Solo' || sec === 'Instrumental Break' || sec === 'Drum Break') continue;
      if (sec === 'Chorus' || sec === 'Hook' || sec === 'Drop') seenChorus++;
      if (seenChorus > 2 && sec === 'Verse') continue;
      out.push(sec);
    }
    return out.length > 6 ? out.slice(0, out.length - 1) : out;
  }
  return s;
}

/* Score a stanza on how well its line lengths suit the genre's phrasing. */
function fitScore(stanza, target) {
  const avg = stanza.reduce((n, l) => n + syllables(l.replace(/\{[^}]*\}/g, 'the thing')), 0) / stanza.length;
  const mid = (target[0] + target[1]) / 2;
  return Math.abs(avg - mid);
}

/* `bias` nudges toward the earlier blueprints in the bank. The opening verse
   of each domain is written as an opener, so verse one uses it; later verses
   are free to come from anywhere. */
function chooseStanza(rng, bank, target, used, bias) {
  const ranked = bank
    .map((s, i) => ({ s, i, score: fitScore(s, target) + rng() * 1.4 + i * (bias || 0) }))
    .filter((r) => !used.has(r.i))
    .sort((a, b) => a.score - b.score);
  if (!ranked.length) {
    const any = Math.floor(rng() * bank.length);
    return { stanza: bank[any], index: any };
  }
  return { stanza: ranked[0].s, index: ranked[0].i };
}

function buildLyrics(opts) {
  const { genre, domain, theme, voice, length } = opts;
  const rng = mulberry32(hashString(opts.seedKey + '|lyrics'));
  const cast = makeCast(rng, domain, theme);
  const isRap = ['boom-bap', 'trap', 'drill', 'jazz-rap', 'grime', 'phonk'].includes(genre.id);

  if (voice === 'instrumental') {
    return {
      title: fillLine(pick(rng, domain.titles), cast, rng),
      text: '[Instrumental]\n\n(no lyrics — leave the lyrics box empty and use Instrumental mode)',
      lines: 0, words: 0, sections: 0, cast,
    };
  }

  const structure = trimStructure(STRUCTURES[genre.struct] || STRUCTURES.pop, length);
  const target = genre.syl.v;
  const cTarget = genre.syl.c;

  /* One chorus, repeated. That is what a song is. */
  const chorusPick = chooseStanza(rng, isRap ? RAP_HOOK : domain.chorus, cTarget, new Set(), 0);
  const chorus = fillStanza(chorusPick.stanza, cast, rng);
  const prePick = domain.pre.length ? pick(rng, domain.pre) : null;
  const pre = prePick ? fillStanza(prePick, cast, rng) : null;

  const usedVerses = new Set();
  const usedBridge = new Set();
  const verseBank = isRap ? RAP_VERSE : domain.verse;

  const out = [];
  let verseNo = 0;
  let firstChorusDone = false;

  structure.forEach((sec, idx) => {
    const tag = SECTION_TAG[sec] || sec;

    if (sec === 'Intro') {
      out.push({ tag: 'Intro', lines: [] });
      return;
    }
    if (sec === 'Guitar Solo' || sec === 'Instrumental Break' || sec === 'Drum Break') {
      out.push({ tag: sec, lines: [] });
      return;
    }
    if (sec === 'Build' || sec === 'Breakdown') {
      out.push({ tag: sec, lines: [] });
      return;
    }
    if (sec === 'Verse') {
      verseNo++;
      const p = chooseStanza(rng, verseBank, target, usedVerses, verseNo === 1 ? 0.9 : 0);
      usedVerses.add(p.index);
      out.push({ tag: 'Verse', lines: fillStanza(p.stanza, cast, rng) });
      return;
    }
    if (sec === 'Pre-Chorus') {
      if (pre) out.push({ tag: 'Pre-Chorus', lines: pre });
      return;
    }
    if (sec === 'Chorus' || sec === 'Hook' || sec === 'Drop') {
      const label = isRap && sec === 'Hook' ? 'Chorus' : tag;
      let lines = chorus;
      /* last chorus drops its final line and repeats the hook — a real
         songwriting move, and it stops v5 from flattening the ending */
      const isLast = !structure.slice(idx + 1).some((s) => s === 'Chorus' || s === 'Hook' || s === 'Drop');
      if (isLast && firstChorusDone && chorus.length > 2) {
        lines = chorus.concat([chorus[chorus.length - 1]]);
      }
      firstChorusDone = true;
      out.push({ tag: label, lines });
      return;
    }
    if (sec === 'Bridge') {
      const bank = domain.bridge;
      const p = chooseStanza(rng, bank, target, usedBridge, 0);
      usedBridge.add(p.index);
      out.push({ tag: 'Bridge', lines: fillStanza(p.stanza, cast, rng) });
      return;
    }
    if (sec === 'Outro') {
      /* a rap outro echoes the hook rather than borrowing a sung tag line */
      const o = isRap
        ? [chorus[chorus.length - 1], chorus[chorus.length - 1]]
        : fillStanza(pick(rng, domain.outro), cast, rng);
      out.push({ tag: 'Outro', lines: o });
      return;
    }
  });

  /* Vocal tags, used sparingly — over-tagging makes v5 ignore the lot. */
  if (voice === 'duet') {
    const verses = out.filter((s) => s.tag === 'Verse');
    if (verses[0]) verses[0].vocalTag = 'Male Vocal';
    if (verses[1]) verses[1].vocalTag = 'Female Vocal';
    const ch = out.find((s) => s.tag === 'Chorus');
    if (ch) ch.vocalTag = 'Both Vocals';
  } else if (voice === 'choir') {
    const ch = out.find((s) => s.tag === 'Chorus');
    if (ch) ch.vocalTag = 'Choir';
  }

  /* Render */
  const blocks = out.map((s) => {
    const head = '[' + s.tag + ']';
    const vt = s.vocalTag ? '\n[' + s.vocalTag + ']' : '';
    if (!s.lines.length) return head;
    return head + vt + '\n' + s.lines.join('\n');
  });

  const text = blocks.join('\n\n');
  const allLines = out.reduce((n, s) => n + s.lines.length, 0);
  const words = text.replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter(Boolean).length;

  /* Title: usually from the domain's title list, sometimes lifted off the
     hook — which is where most real titles come from. Rap hooks are written
     as full bars and make poor titles, so those always take the list. */
  let title;
  if (isRap || rng() < 0.55) title = fillLine(pick(rng, domain.titles), cast, rng);
  else title = chorus[0];
  title = title.replace(/^(and|but|so)\s+/i, '').replace(/[.,!?;:]+$/, '');
  if (title.length > 42) title = title.slice(0, 42).replace(/\s+\S*$/, '').replace(/[.,]$/, '');

  return {
    title: titleCase(title),
    text,
    lines: allLines,
    words,
    sections: out.length,
    cast,
    isRap,
  };
}

function titleCase(s) {
  const small = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'but', 'nor']);
  return s.split(/\s+/).map((w, i) => {
    const lower = w.toLowerCase();
    if (i > 0 && small.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

/* ==========================================================================
   Checks — what the app shows under the output
   ========================================================================== */

function checkOutput(style, tagStyle, exclude, lyrics, userArtist, genre) {
  const problems = [];
  const notes = [];

  /* 1. No artist name may survive into anything that goes to Suno. */
  const names = artistNameTokens();
  if (userArtist) {
    const typed = String(userArtist).toLowerCase().trim();
    names.add(typed);
    /* five letters or more, so a surname like Cash does not condemn every
       lyric that happens to mention money */
    typed.split(/\s+/).forEach((w) => { if (w.length >= 5) names.add(w); });
  }
  const haystack = (style + ' ' + tagStyle + ' ' + exclude + ' ' + lyrics.text).toLowerCase();
  const leaked = [...names].filter((n) => n.length > 3 && haystack.includes(n));
  if (leaked.length) {
    problems.push('Artist name in the output: ' + leaked.join(', ') + '. Remove it before generating — naming an artist can get an account struck.');
  } else {
    notes.push('No artist name anywhere in the output — the reference is described, not named.');
  }

  /* 2. Style field limit */
  if (style.length > 1000) problems.push('Style field is ' + style.length + ' characters. The limit is 1000.');
  else notes.push('Style field ' + style.length + '/1000 characters.');

  /* 3. Cliché sweep */
  const hits = clicheHits(lyrics.text);
  if (hits.length) problems.push('Stock phrasing found: ' + hits.join(', ') + '.');
  else notes.push('Cliché sweep clean across ' + CLICHES.length + ' checked phrases.');

  /* 4. Lyric length — under about 150 words v5 improvises filler, over about
        350 it rushes or drops a section. Genres built on a repeated phrase
        rather than verses get a much lower floor: a techno track with forty
        words is not underwritten, it is a techno track. */
  const sparse = genre && genre.syl && genre.syl.v[1] <= 9;
  const floor = sparse ? 35 : 70;
  if (lyrics.words && lyrics.words < floor) problems.push('Only ' + lyrics.words + ' words. That is thin enough that Suno will improvise filler — set Length to Standard or Long.');
  else if (lyrics.words > 360) problems.push(lyrics.words + ' words is long enough that Suno may rush or drop a section.');
  else if (lyrics.words) notes.push(lyrics.words + ' words across ' + lyrics.lines + ' lines — inside the range ' + (sparse ? 'this genre wants' : 'v5 sets comfortably') + '.');

  /* 5. Exclude field length */
  const exCount = exclude ? exclude.split(',').filter((s) => s.trim()).length : 0;
  if (exCount > 3) problems.push('Exclude has ' + exCount + ' entries. Past three it stops steering reliably.');

  return { problems, notes };
}

/* Per-line syllable read-out for the lyric gutter. */
function lyricLineStats(text) {
  return text.split('\n').map((l) => {
    if (!l.trim()) return { line: l, syl: null, tag: false };
    if (/^\[.*\]$/.test(l.trim())) return { line: l, syl: null, tag: true };
    return { line: l, syl: syllables(l), tag: false };
  });
}
