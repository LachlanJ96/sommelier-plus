/* ==========================================================================
   app.js — wiring
   ========================================================================== */

const $ = (id) => document.getElementById(id);

const el = {
  genre: $('in-genre'), theme: $('in-theme'), artist: $('in-artist'),
  voice: $('in-voice'), length: $('in-length'), mood: $('in-mood'),
  bpm: $('in-bpm'), bpmRead: $('bpm-read'), key: $('in-key'),
  model: $('in-model'), exclude: $('in-exclude'),
  go: $('go'), reroll: $('reroll'), rerollLyrics: $('reroll-lyrics'),
  genreHint: $('genre-hint'), genreChips: $('genre-chips'), translation: $('translation'),
  empty: $('empty'), result: $('result'),
  outModel: $('out-model'), outMeta: $('out-meta'),
  outTitle: $('out-title'), outStyle: $('out-style'), outExclude: $('out-exclude'),
  outLyrics: $('out-lyrics'), outChecks: $('out-checks'), outHowto: $('out-howto'),
  styleCount: $('style-count'), lyricCount: $('lyric-count'),
  toggleTags: $('toggle-tags'), toggleSyl: $('toggle-syl'),
  save: $('save'), exportBtn: $('export'),
  drawer: $('drawer'), libList: $('lib-list'), libCount: $('lib-count'),
  openLib: $('open-library'), closeLib: $('close-library'),
};

let current = null;
let showTags = false;
let showSyl = false;

/* ------------------------------------------------------------ populate */

GENRE_LIST.forEach((g) => {
  const o = document.createElement('option');
  o.value = g.name;
  $('genre-list').appendChild(o);
});

ARTIST_LIST.forEach((a) => {
  const o = document.createElement('option');
  o.value = a.name;
  $('artist-list').appendChild(o);
});

['Outlaw Country', 'Indie Folk', 'Boom Bap', 'Neo Soul', 'Post-Punk', 'Deep House', 'Alt Rock', 'Afrobeats']
  .forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = name;
    b.addEventListener('click', () => {
      el.genre.value = name;
      describeGenre();
    });
    el.genreChips.appendChild(b);
  });

/* ------------------------------------------------------- live feedback */

function describeGenre() {
  const g = findGenre(el.genre.value);
  if (!g) {
    el.genreHint.textContent = "Type anything — it'll match to the closest profile.";
    return;
  }
  el.genreHint.textContent =
    g.name + ' — ' + g.bpm[0] + '–' + g.bpm[1] + ' BPM, ' + g.keys[0] +
    ', ' + g.inst.slice(0, 3).join(' / ') + '.';
}

function describeArtist() {
  const a = findArtist(el.artist.value);
  if (!a) {
    if (el.artist.value.trim()) {
      el.translation.hidden = false;
      el.translation.innerHTML =
        '<b>Not in the table</b>No profile for that one, so the genre carries the sound on its own. ' +
        'The name still will not appear in the output.';
    } else {
      el.translation.hidden = true;
    }
    return;
  }
  el.translation.hidden = false;
  el.translation.innerHTML =
    '<b>Goes into the prompt as</b>' +
    esc([a.era, a.vox, a.inst.slice(0, 3).join(', '), a.feel].filter(Boolean).join('. ')) + '.';
}

el.genre.addEventListener('input', describeGenre);
el.artist.addEventListener('input', describeArtist);

el.bpm.addEventListener('input', () => {
  el.bpmRead.textContent = el.bpm.value === '0' ? 'auto' : el.bpm.value + ' BPM';
});

/* ---------------------------------------------------------- generation */

function gatherOpts(seed) {
  const genre = findGenre(el.genre.value) || GENRES['indie-folk'];
  const artist = findArtist(el.artist.value);
  const theme = el.theme.value.trim();
  const domain = routeTheme(theme);
  return {
    genre, artist, domain, theme,
    voice: el.voice.value,
    length: el.length.value,
    mood: el.mood.value.trim(),
    bpm: el.bpm.value === '0' ? null : Number(el.bpm.value),
    key: el.key.value.trim(),
    model: el.model.value,
    exclude: el.exclude.value.trim(),
    userArtist: el.artist.value.trim(),
    seed,
    seedKey: [genre.id, theme, artist ? artist.key : el.artist.value, el.voice.value,
      el.length.value, el.mood.value, el.model.value, seed].join('~'),
  };
}

function generate(seed, keepStyle) {
  const opts = gatherOpts(seed);
  const style = keepStyle && current ? current.style : buildStyle(opts);
  const lyrics = buildLyrics(opts);
  const checks = checkOutput(style.style, style.tagStyle, style.exclude, lyrics, opts.userArtist, opts.genre);
  current = { opts, style, lyrics, checks, seed };
  render();
}

function render() {
  const { opts, style, lyrics, checks } = current;

  el.empty.hidden = true;
  el.result.hidden = false;
  el.reroll.disabled = false;

  el.outModel.textContent = opts.model.toUpperCase();
  el.outMeta.textContent = [
    opts.genre.name,
    style.bpm + ' BPM',
    style.key,
    opts.domain.label,
  ].join('  ·  ');

  el.outTitle.textContent = lyrics.title;

  const styleText = showTags ? style.tagStyle : style.style;
  el.outStyle.textContent = styleText;
  el.styleCount.textContent = styleText.length + ' / 1000';
  el.styleCount.classList.toggle('over', styleText.length > 1000);
  el.toggleTags.classList.toggle('on', showTags);

  el.outExclude.textContent = style.exclude || '(nothing to exclude)';

  renderLyrics(lyrics.text);
  el.lyricCount.textContent = lyrics.words + ' words · ' + lyrics.lines + ' lines · ' + lyrics.sections + ' sections';
  el.toggleSyl.classList.toggle('on', showSyl);

  el.outChecks.innerHTML = '';
  checks.problems.forEach((p) => addCheck(p, 'bad'));
  checks.notes.forEach((n) => addCheck(n, 'ok'));

  renderHowto();
}

function addCheck(text, cls) {
  const li = document.createElement('li');
  li.className = cls;
  li.textContent = text;
  el.outChecks.appendChild(li);
}

function renderLyrics(text) {
  const stats = lyricLineStats(text);
  el.outLyrics.innerHTML = stats.map((s) => {
    if (s.tag) return '<span class="tagline-tag">' + esc(s.line) + '</span>';
    if (!s.line.trim()) return '';
    const gutter = showSyl ? '<span class="syl">' + s.syl + '</span>' : '';
    return gutter + esc(s.line);
  }).join('\n');
}

function renderHowto() {
  const { opts } = current;
  const steps = [
    'Open Suno, switch to <b>Custom</b>.',
    'Paste the Style block into <b>Styles</b>. Leave the brackets out of it — they only work in the lyric box.',
  ];
  if (opts.voice === 'instrumental') {
    steps.push('Turn <b>Instrumental</b> on and leave the lyric box empty.');
  } else {
    steps.push('Paste the lyric sheet, section tags and all, into <b>Lyrics</b>.');
  }
  if (current.style.exclude) {
    steps.push('Open <b>Advanced Options</b> and paste the Exclude block into <b>Exclude Styles</b>.');
  }
  steps.push('Set the title to <code>' + esc(current.lyrics.title) + '</code>.');
  if (opts.model === 'v5.5') {
    steps.push('If you land a take whose voice you want again, save it as a <b>Voice</b> or Persona — v5.5 will carry it to the next song, which the Style field alone cannot do.');
  } else {
    steps.push('Generate twice before judging it. The Style field steers, it does not dictate.');
  }
  el.outHowto.innerHTML = steps.map((s) => '<li>' + s + '</li>').join('');
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* -------------------------------------------------------------- events */

el.go.addEventListener('click', () => generate(Math.floor(Math.random() * 1e9), false));
el.reroll.addEventListener('click', () => generate(Math.floor(Math.random() * 1e9), false));
el.rerollLyrics.addEventListener('click', () => generate(Math.floor(Math.random() * 1e9), true));

el.toggleTags.addEventListener('click', () => { showTags = !showTags; render(); });
el.toggleSyl.addEventListener('click', () => { showSyl = !showSyl; render(); });

document.querySelectorAll('.copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const node = $(btn.dataset.copy);
    const text = node.id === 'out-lyrics' ? current.lyrics.text : node.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    const was = btn.textContent;
    btn.textContent = 'copied';
    setTimeout(() => { btn.textContent = was; }, 1200);
  });
});

el.theme.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') el.go.click();
});

/* -------------------------------------------------------------- export */

function asText() {
  const { opts, style, lyrics } = current;
  return [
    lyrics.title,
    '='.repeat(lyrics.title.length),
    '',
    opts.genre.name + '  ·  ' + style.bpm + ' BPM  ·  ' + style.key + '  ·  Suno ' + opts.model,
    '',
    '--- STYLE ---',
    style.style,
    '',
    '--- EXCLUDE STYLES ---',
    style.exclude || '(none)',
    '',
    '--- LYRICS ---',
    lyrics.text,
    '',
  ].join('\n');
}

el.exportBtn.addEventListener('click', () => {
  const blob = new Blob([asText()], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = current.lyrics.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ------------------------------------------------------------- library */

const LIB_KEY = 'takeone.saved.v1';

function loadLib() {
  try { return JSON.parse(localStorage.getItem(LIB_KEY)) || []; } catch (e) { return []; }
}

function saveLib(list) {
  localStorage.setItem(LIB_KEY, JSON.stringify(list.slice(0, 60)));
  paintCount();
}

function paintCount() {
  const n = loadLib().length;
  el.libCount.textContent = n ? '(' + n + ')' : '';
}

el.save.addEventListener('click', () => {
  const { opts, style, lyrics } = current;
  const list = loadLib();
  list.unshift({
    at: Date.now(),
    title: lyrics.title,
    sub: opts.genre.name + ' · ' + style.bpm + ' BPM',
    style: style.style,
    tagStyle: style.tagStyle,
    exclude: style.exclude,
    lyrics: lyrics.text,
    text: asText(),
  });
  saveLib(list);
  el.save.textContent = 'saved';
  setTimeout(() => { el.save.textContent = 'Save to sheet'; }, 1200);
});

function paintLib() {
  const list = loadLib();
  el.libList.innerHTML = '';
  if (!list.length) {
    el.libList.innerHTML = '<li class="s">Nothing saved yet.</li>';
    return;
  }
  list.forEach((item, i) => {
    const li = document.createElement('li');
    const t = document.createElement('span');
    t.className = 't';
    t.textContent = item.title;
    const s = document.createElement('span');
    s.className = 's';
    s.textContent = item.sub;
    const c = document.createElement('button');
    c.type = 'button';
    c.textContent = 'copy';
    c.addEventListener('click', () => {
      navigator.clipboard.writeText(item.text);
      c.textContent = 'copied';
      setTimeout(() => { c.textContent = 'copy'; }, 1200);
    });
    const d = document.createElement('button');
    d.type = 'button';
    d.textContent = 'delete';
    d.addEventListener('click', () => {
      const l = loadLib();
      l.splice(i, 1);
      saveLib(l);
      paintLib();
    });
    li.append(t, s, c, d);
    el.libList.appendChild(li);
  });
}

el.openLib.addEventListener('click', () => { paintLib(); el.drawer.hidden = false; });
el.closeLib.addEventListener('click', () => { el.drawer.hidden = true; });
el.drawer.addEventListener('click', (e) => { if (e.target === el.drawer) el.drawer.hidden = true; });

paintCount();
describeGenre();
