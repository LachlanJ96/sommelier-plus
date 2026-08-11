/* ==========================================================================
   data-genres.js — genre profiles
   --------------------------------------------------------------------------
   Every profile is written so the style engine can build a Suno style prompt
   in the order the model actually weights: genre first, then feel, then voice,
   then instruments + production, then tempo and key.

   bpm    [low, high] — the range the genre actually sits in, not a guess
   keys   keys the genre lives in (Suno responds to "D minor" as a plain tag)
   inst   instruments, most important first — front-loaded into the prompt
   prod   production/mix language
   drums  the rhythm bed
   vox    vocal character by requested voice; `any` is the neutral fallback
   space  the room the record sounds like it was made in
   struct which arrangement blueprint the lyric engine should lay out
   reg    lyric register — decides which diction the lyric writer uses
   syl    syllables per line, verse and chorus
   avoid  default Exclude Styles entries for this genre
   ========================================================================== */

const STRUCTURES = {
  pop: ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Chorus', 'Outro'],
  popShort: ['Verse', 'Pre-Chorus', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Chorus'],
  ballad: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Chorus', 'Outro'],
  rock: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Guitar Solo', 'Bridge', 'Chorus', 'Outro'],
  anthem: ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Verse', 'Pre-Chorus', 'Chorus', 'Breakdown', 'Chorus', 'Outro'],
  rap: ['Intro', 'Verse', 'Hook', 'Verse', 'Hook', 'Bridge', 'Verse', 'Hook', 'Outro'],
  rapShort: ['Intro', 'Verse', 'Hook', 'Verse', 'Hook', 'Outro'],
  dance: ['Intro', 'Verse', 'Build', 'Drop', 'Verse', 'Build', 'Drop', 'Breakdown', 'Drop', 'Outro'],
  house: ['Intro', 'Verse', 'Build', 'Chorus', 'Instrumental Break', 'Verse', 'Build', 'Chorus', 'Outro'],
  folk: ['Verse', 'Chorus', 'Verse', 'Chorus', 'Instrumental Break', 'Verse', 'Chorus', 'Outro'],
  blues: ['Intro', 'Verse', 'Verse', 'Guitar Solo', 'Verse', 'Verse', 'Outro'],
  jazz: ['Intro', 'Verse', 'Chorus', 'Instrumental Break', 'Verse', 'Chorus', 'Outro'],
  metal: ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Verse', 'Chorus', 'Breakdown', 'Guitar Solo', 'Chorus', 'Outro'],
  ambient: ['Intro', 'Verse', 'Instrumental Break', 'Verse', 'Outro'],
  soul: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Chorus', 'Outro'],
  punk: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Chorus'],
};

/* Register decides which voice the lyric writer uses.
   plain   — everyday speech, short words, contractions
   country — plain speech plus rural/domestic detail and a wry turn
   street  — bars, internal rhyme, present tense, brand and place names
   raw     — blunt, shouted, few adjectives
   soulful — direct address, repetition, call and response
   spare   — few words, lots of space, images left unexplained
   swagger — boastful, playful, rhythm-forward                                */

const GENRES = {};

function G(name, o) {
  o.name = name;
  o.id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  o.aka = o.aka || [];
  o.struct = o.struct || 'pop';
  o.reg = o.reg || 'plain';
  o.syl = o.syl || { v: [7, 10], c: [6, 9] };
  o.avoid = o.avoid || [];
  GENRES[o.id] = o;
  return o;
}

/* ---------------------------------------------------------------- folk / roots */

G('Indie Folk', {
  family: 'folk', era: 'contemporary', bpm: [76, 104], keys: ['G major', 'D major', 'C major', 'E minor'],
  inst: ['fingerpicked acoustic guitar', 'upright bass', 'brushed drums', 'pedal steel', 'close-miked piano', 'group harmony'],
  prod: ['warm room mics', 'light tape saturation', 'almost no compression', 'natural dynamics'],
  drums: 'brushed kit, kick on the downbeat, no fills',
  vox: { m: 'soft baritone sung close to the mic, breath audible', f: 'unforced alto with a little rasp at the top', any: 'plain untrained voice, more spoken than sung' },
  space: 'small wooden room, short natural reverb',
  struct: 'folk', reg: 'plain', syl: { v: [7, 10], c: [6, 9] },
  avoid: ['electronic drums', 'autotune', 'stadium reverb'],
});

G('Americana', {
  family: 'folk', era: 'contemporary', bpm: [84, 112], keys: ['D major', 'A major', 'G major'],
  inst: ['dobro', 'acoustic guitar', 'pedal steel', 'fiddle', 'upright bass', 'Wurlitzer'],
  prod: ['dry analogue mix', 'live band tracked together', 'ribbon mics', 'no grid quantisation'],
  drums: 'loose live kit with a lazy backbeat',
  vox: { m: 'weathered baritone, cracked at the edges', f: 'plain-spoken alto with a country lean', any: 'lived-in voice, no polish' },
  space: 'old barn room, warm and short',
  struct: 'folk', reg: 'country', avoid: ['synths', 'programmed drums'],
});

G('Outlaw Country', {
  family: 'country', era: '1970s', bpm: [88, 116], keys: ['E major', 'A major', 'G major'],
  inst: ['telecaster with spring reverb', 'pedal steel', 'walking bass', 'honky-tonk piano', 'harmonica'],
  prod: ['dry 70s Nashville mix', 'vocal well forward', 'tape compression', 'live takes with mistakes left in'],
  drums: 'train-beat snare, brushes on the verses',
  vox: { m: 'deep gravel baritone, behind the beat', f: 'hard-edged twang with real bite', any: 'smoke-worn voice, talks as much as it sings' },
  space: 'wood-panelled bar room',
  struct: 'folk', reg: 'country', avoid: ['modern pop production', 'synth pads'],
});

G('Modern Country', {
  family: 'country', era: 'contemporary', bpm: [92, 128], keys: ['G major', 'D major', 'B minor'],
  inst: ['crunchy electric guitar', 'banjo', 'pedal steel', 'stacked acoustic', 'sub bass'],
  prod: ['big polished Nashville mix', 'tight low end', 'wide stacked harmonies', 'radio loudness'],
  drums: 'programmed kick under a live kit, handclaps on the chorus',
  vox: { m: 'clear tenor with a southern drawl', f: 'bright belted alto with a twang', any: 'confident radio voice with a drawl' },
  space: 'big modern room, controlled reverb',
  struct: 'pop', reg: 'country', avoid: ['lo-fi', 'shoegaze wash'],
});

G('Bluegrass', {
  family: 'folk', era: 'traditional', bpm: [120, 168], keys: ['G major', 'A major', 'B major'],
  inst: ['banjo rolls', 'mandolin chop', 'fiddle', 'flat-picked guitar', 'upright bass'],
  prod: ['single-mic live capture', 'no drums', 'players stepping in and out of the mic'],
  drums: 'none — the mandolin chop is the backbeat',
  vox: { m: 'high lonesome tenor', f: 'piercing high harmony', any: 'tight three-part mountain harmony' },
  space: 'church hall, natural reverb',
  struct: 'folk', reg: 'country', avoid: ['drum kit', 'electric bass'],
});

G('Celtic Folk', {
  family: 'folk', era: 'traditional', bpm: [96, 140], keys: ['D major', 'A minor', 'E minor'],
  inst: ['fiddle', 'tin whistle', 'bodhrán', 'bouzouki', 'uilleann pipes', 'accordion'],
  prod: ['live session recording', 'stone-room reverb', 'no click track'],
  drums: 'bodhrán driving a jig or reel feel',
  vox: { m: 'unaccompanied-style tenor with ornamentation', f: 'clear soprano with a lilt', any: 'pub singalong in unison' },
  space: 'stone hall',
  struct: 'folk', reg: 'plain', avoid: ['synths', 'trap drums'],
});

G('Sea Shanty', {
  family: 'folk', era: 'traditional', bpm: [88, 108], keys: ['D minor', 'A minor', 'G major'],
  inst: ['concertina', 'fiddle', 'stomping boots', 'hand percussion'],
  prod: ['unison crowd recording', 'big natural room', 'no click'],
  drums: 'boot stomps and table thumps on the two and four',
  vox: { m: 'gruff lead with a full crew answering', f: 'strong lead over a mixed crew', any: 'call and response, whole room joining the chorus' },
  space: 'timber hall full of people',
  struct: 'folk', reg: 'plain', avoid: ['drum kit', 'electric guitar'],
});

G('Folk Punk', {
  family: 'folk', era: 'contemporary', bpm: [140, 180], keys: ['C major', 'G major', 'A minor'],
  inst: ['thrashed acoustic guitar', 'accordion', 'banjo', 'trumpet', 'washboard'],
  prod: ['blown-out room recording', 'clipping on the peaks', 'no polish at all'],
  drums: 'fast four-on-the-floor with crash cymbals',
  vox: { m: 'shouted, hoarse, going flat and not caring', f: 'yelled and cracking', any: 'group shout, everyone slightly off' },
  space: 'basement',
  struct: 'punk', reg: 'raw', avoid: ['clean production', 'autotune'],
});

/* ---------------------------------------------------------------- rock */

G('Alt Rock', {
  family: 'rock', era: '1990s', bpm: [104, 140], keys: ['E minor', 'A minor', 'D major'],
  inst: ['overdriven electric guitar', 'clean chorus guitar on the verses', 'fuzz bass', 'live kit'],
  prod: ['dry 90s mix', 'guitars hard-panned', 'vocal slightly buried', 'analogue console'],
  drums: 'hard live backbeat, real cymbals',
  vox: { m: 'strained tenor that breaks when pushed', f: 'flat-affect verse into a full-throated chorus', any: 'half-mumbled verse, shouted chorus' },
  space: 'live room, plate reverb on the snare',
  struct: 'rock', reg: 'plain', avoid: ['modern pop polish', 'electronic drums'],
});

G('Grunge', {
  family: 'rock', era: '1990s', bpm: [96, 132], keys: ['E minor', 'F# minor', 'D minor'],
  inst: ['detuned distorted guitar', 'thick bass', 'crashing kit'],
  prod: ['loud and murky', 'guitars swamp the mix', 'vocal drenched in slap delay'],
  drums: 'heavy dragged backbeat, ride bell on the chorus',
  vox: { m: 'raw throat-shredded baritone', f: 'hoarse and cracking', any: 'quiet verse, screamed chorus' },
  space: 'big dead room',
  struct: 'rock', reg: 'raw', avoid: ['clean production', 'synths'],
});

G('Post-Punk', {
  family: 'rock', era: '1980s', bpm: [126, 156], keys: ['A minor', 'D minor', 'E minor'],
  inst: ['chorused bass carrying the melody', 'sharp trebly guitar', 'cold synth stabs'],
  prod: ['gated reverb', 'cold clinical mix', 'bass louder than guitar'],
  drums: 'motorik eighths, dry snare, tight hats',
  vox: { m: 'deadpan baritone, almost spoken', f: 'cold detached delivery', any: 'flat, unemotional, one note from speech' },
  space: 'concrete room, long gated reverb',
  struct: 'rock', reg: 'spare', avoid: ['warm production', 'blues guitar'],
});

G('Shoegaze', {
  family: 'rock', era: '1990s', bpm: [96, 130], keys: ['C# minor', 'E major', 'A major'],
  inst: ['walls of reverbed guitar', 'tremolo and pitch-bent chords', 'buried bass'],
  prod: ['vocals mixed under the guitars', 'endless reverb', 'tape hiss'],
  drums: 'simple loud kit pushed back in the mix',
  vox: { m: 'soft breathy tenor half-buried', f: 'wordless airy soprano, indistinct', any: 'voice used as another instrument, lyrics barely legible' },
  space: 'cathedral of reverb',
  struct: 'rock', reg: 'spare', avoid: ['dry vocals', 'clear mix'],
});

G('Dream Pop', {
  family: 'rock', era: 'contemporary', bpm: [88, 116], keys: ['D major', 'F# minor', 'A major'],
  inst: ['chorus-drenched guitar', 'analogue pad', 'soft fretless bass'],
  prod: ['soft-focus mix', 'long reverb tails', 'gentle tape wobble'],
  drums: 'soft kit with brushes and a slow backbeat',
  vox: { m: 'breathy falsetto', f: 'floating soprano, doubled an octave up', any: 'whispered and doubled' },
  space: 'wide and washed out',
  struct: 'ballad', reg: 'spare', avoid: ['aggressive drums', 'distortion'],
});

G('Britpop', {
  family: 'rock', era: '1990s', bpm: [112, 136], keys: ['G major', 'C major', 'E major'],
  inst: ['jangly electric guitar', 'Hammond organ', 'melodic bass', 'tambourine'],
  prod: ['bright English mix', 'stacked backing vocals', 'guitars up front'],
  drums: 'straight-ahead kit with a big tambourine on the two and four',
  vox: { m: 'nasal cocky tenor with a London or Manchester accent', f: 'sharp bright alto', any: 'accented, conversational, sneering slightly' },
  space: 'bright studio room',
  struct: 'rock', reg: 'plain', avoid: ['American twang', 'trap drums'],
});

G('Classic Rock', {
  family: 'rock', era: '1970s', bpm: [104, 138], keys: ['A major', 'E major', 'G major'],
  inst: ['Les Paul through a cranked valve amp', 'Hammond organ', 'thick P-bass', 'cowbell'],
  prod: ['analogue tape', 'wide stereo drums', 'natural room compression'],
  drums: 'huge live kit, room mics up',
  vox: { m: 'high raspy rock tenor', f: 'full-throated belt with grit', any: 'powerful, pushed to the edge of breaking' },
  space: 'big studio hall',
  struct: 'rock', reg: 'plain', avoid: ['digital production', 'autotune'],
});

G('Psych Rock', {
  family: 'rock', era: '1960s', bpm: [96, 130], keys: ['E major', 'D major', 'A minor'],
  inst: ['fuzz guitar', 'sitar', 'Farfisa organ', 'tape-flanged everything'],
  prod: ['phasing and flanging', 'backwards tape', 'mono-leaning mix', 'saturated'],
  drums: 'loose swinging kit with tom rolls',
  vox: { m: 'drawled tenor with slap-back delay', f: 'reverb-soaked alto', any: 'processed and distant, doubled through tape delay' },
  space: 'swirling and unstable',
  struct: 'rock', reg: 'spare', avoid: ['modern mix', 'digital clarity'],
});

G('Pop Punk', {
  family: 'rock', era: '2000s', bpm: [150, 190], keys: ['C major', 'G major', 'D major'],
  inst: ['fast downstroked power chords', 'melodic bass runs', 'octave lead guitar'],
  prod: ['bright compressed mix', 'gang vocals doubled wide', 'clicky kick'],
  drums: 'fast skate beat, ride bell in the chorus, half-time bridge',
  vox: { m: 'nasal snotty tenor with a slight whine', f: 'bright punchy alto', any: 'young, nasal, everything at full effort' },
  space: 'tight bright room',
  struct: 'punk', reg: 'plain', syl: { v: [8, 11], c: [7, 10] },
  avoid: ['slow tempo', 'orchestral'],
});

G('Punk', {
  family: 'rock', era: '1977', bpm: [160, 200], keys: ['A major', 'E major', 'D major'],
  inst: ['buzzsaw guitar', 'driving root-note bass'],
  prod: ['blown-out and cheap', 'recorded in an afternoon', 'no bass management'],
  drums: 'relentless eighths, crash on every change',
  vox: { m: 'sneered and shouted, barely in tune', f: 'snarled, spat out', any: 'yelled, gang chant on the chorus' },
  space: 'small hot room',
  struct: 'punk', reg: 'raw', syl: { v: [6, 9], c: [5, 8] },
  avoid: ['clean production', 'guitar solo'],
});

G('Emo', {
  family: 'rock', era: '2000s', bpm: [128, 168], keys: ['F# minor', 'B minor', 'E minor'],
  inst: ['arpeggiated clean guitar into distortion', 'octave-jumping lead', 'melodic bass'],
  prod: ['dynamic quiet-loud mix', 'doubled lead vocal', 'wide guitars'],
  drums: 'tom-heavy verses building to a full backbeat',
  vox: { m: 'strained tenor that cracks on the high notes', f: 'clear alto going hoarse at the top', any: 'earnest, over-committed, voice breaking' },
  space: 'medium room, plate on the vocal',
  struct: 'anthem', reg: 'plain', avoid: ['polished pop', 'dance beats'],
});

G('Metalcore', {
  family: 'metal', era: 'contemporary', bpm: [140, 190], keys: ['D minor', 'E minor', 'B minor'],
  inst: ['drop-tuned palm-muted riffs', 'harmonised twin leads', 'sub drop on the breakdown'],
  prod: ['tight modern metal mix', 'clicky kick', 'huge guitars', 'sidechained low end'],
  drums: 'double kick blasts, half-time breakdown',
  vox: { m: 'harsh screamed verse into a clean sung chorus', f: 'low growl into a soaring clean chorus', any: 'screamed verse, clean anthemic chorus' },
  space: 'tight and enormous',
  struct: 'metal', reg: 'raw', avoid: ['acoustic', 'lo-fi'],
});

G('Heavy Metal', {
  family: 'metal', era: '1980s', bpm: [120, 165], keys: ['E minor', 'A minor', 'D minor'],
  inst: ['twin lead guitars in harmony', 'galloping bass', 'wah solo'],
  prod: ['analogue metal mix', 'guitars wide', 'no triggers'],
  drums: 'galloping kick, open hats, big fills',
  vox: { m: 'operatic high tenor with vibrato', f: 'powerful soprano belt', any: 'sustained high notes, full power' },
  space: 'arena',
  struct: 'metal', reg: 'plain', avoid: ['modern trap', 'lo-fi'],
});

G('Doom Metal', {
  family: 'metal', era: 'contemporary', bpm: [56, 82], keys: ['C# minor', 'D minor', 'F minor'],
  inst: ['fuzzed downtuned guitars', 'heavy sustained bass', 'ringing open chords'],
  prod: ['huge and slow', 'valve amp saturation', 'long decay on everything'],
  drums: 'slow crushing backbeat, cymbals left to ring out',
  vox: { m: 'low mournful clean baritone', f: 'wailing contralto over the riff', any: 'sparse, drawn out, buried under the guitars' },
  space: 'cave',
  struct: 'metal', reg: 'spare', syl: { v: [5, 8], c: [4, 7] },
  avoid: ['fast tempo', 'bright production'],
});

G('Prog Rock', {
  family: 'rock', era: '1970s', bpm: [88, 150], keys: ['D minor', 'F# minor', 'G major'],
  inst: ['Mellotron', 'Moog lead', 'Rickenbacker bass', 'twelve-string guitar', 'odd-metre riffs'],
  prod: ['wide analogue stereo', 'multi-section arrangement', 'tape flanging'],
  drums: 'busy kit in 7/8 and 5/4, constant fills',
  vox: { m: 'clear high tenor with layered harmony', f: 'pure soprano over the arrangement', any: 'layered choral harmony' },
  space: 'grand and reverberant',
  struct: 'rock', reg: 'spare', avoid: ['simple pop structure', 'trap drums'],
});

/* ---------------------------------------------------------------- pop */

G('Synth Pop', {
  family: 'pop', era: '1980s', bpm: [110, 132], keys: ['F minor', 'C minor', 'A minor'],
  inst: ['analogue poly synth pads', 'FM bass', 'arpeggiated sequence', 'DX7 bell'],
  prod: ['gated reverb on the snare', 'wide chorus on everything', 'bright 80s mix'],
  drums: 'LinnDrum pattern, huge gated snare',
  vox: { m: 'cool detached baritone', f: 'bright clear alto with a wide chorus effect', any: 'processed, doubled, slightly cold' },
  space: 'enormous gated reverb',
  struct: 'pop', reg: 'plain', avoid: ['acoustic guitar', 'lo-fi'],
});

G('Bedroom Pop', {
  family: 'pop', era: 'contemporary', bpm: [84, 112], keys: ['C major', 'A minor', 'F major'],
  inst: ['clean jazzy guitar chords', 'soft synth pad', 'simple bass', 'tape-warped keys'],
  prod: ['lo-fi warmth', 'audible room noise', 'gentle wow and flutter', 'quiet mix'],
  drums: 'soft programmed kit, brushed hats, no big fills',
  vox: { m: 'close mumbled tenor', f: 'small breathy voice, doubled quietly', any: 'sung barely above speech, right up on the mic' },
  space: 'a bedroom, honestly',
  struct: 'popShort', reg: 'spare', avoid: ['loud mastering', 'stadium reverb'],
});

G('Pop Rock', {
  family: 'pop', era: 'contemporary', bpm: [110, 140], keys: ['G major', 'D major', 'E minor'],
  inst: ['bright electric guitar', 'piano', 'melodic bass', 'handclaps'],
  prod: ['glossy radio mix', 'stacked chorus vocals', 'punchy drums'],
  drums: 'big live kit with programmed reinforcement',
  vox: { m: 'strong clear tenor', f: 'belted pop alto', any: 'confident, wide harmony stack on the chorus' },
  space: 'big bright room',
  struct: 'pop', reg: 'plain', avoid: ['lo-fi', 'harsh distortion'],
});

G('Hyperpop', {
  family: 'pop', era: 'contemporary', bpm: [140, 172], keys: ['F# major', 'A major', 'C major'],
  inst: ['pitched-up saw leads', 'distorted 808', 'metallic percussion', 'glitched vocal chops'],
  prod: ['clipped and overdriven master', 'extreme pitch shifting', 'hard sidechain'],
  drums: 'hyperactive trap-adjacent kit, stutter fills',
  vox: { m: 'pitched-up processed vocal', f: 'chipmunked and heavily tuned', any: 'aggressively autotuned and pitched up' },
  space: 'crushed and airless',
  struct: 'popShort', reg: 'plain', syl: { v: [6, 9], c: [4, 8] },
  avoid: ['acoustic instruments', 'natural vocals'],
});

G('K-Pop', {
  family: 'pop', era: 'contemporary', bpm: [100, 140], keys: ['B minor', 'F# minor', 'C major'],
  inst: ['bright synth hooks', 'slap bass', 'orchestral hits', 'trap hats'],
  prod: ['immaculate modern mix', 'constant section changes', 'huge stacked harmonies'],
  drums: 'hybrid trap and pop kit that switches feel every section',
  vox: { m: 'smooth tenor trading with a rapped section', f: 'bright lead alternating between members', any: 'multiple voices trading lines, big group chorus' },
  space: 'wide and glossy',
  struct: 'pop', reg: 'plain', avoid: ['lo-fi', 'sludgy mix'],
});

G('City Pop', {
  family: 'pop', era: '1980s', bpm: [104, 124], keys: ['E major', 'A major', 'D major'],
  inst: ['slap bass', 'clean chorused guitar', 'Rhodes', 'brass stabs', 'DX7 keys'],
  prod: ['lush 80s Tokyo mix', 'wide stereo', 'crystal-clear high end'],
  drums: 'tight funky kit with rimshot snare',
  vox: { m: 'smooth relaxed tenor', f: 'sweet effortless alto', any: 'easy, unhurried, gently jazzy phrasing' },
  space: 'wide, glossy, night-drive',
  struct: 'pop', reg: 'spare', avoid: ['distortion', 'trap drums'],
});

/* ---------------------------------------------------------------- soul / R&B */

G('Soul', {
  family: 'soul', era: '1960s', bpm: [72, 108], keys: ['C major', 'F major', 'Bb major'],
  inst: ['Hammond organ', 'horn section', 'clean rhythm guitar', 'melodic bass'],
  prod: ['live band in one room', 'mono-leaning warm mix', 'tape compression'],
  drums: 'tight backbeat with tambourine doubling the snare',
  vox: { m: 'full-throated tenor with grit and improvised runs', f: 'powerful contralto with a gospel edge', any: 'lead voice answered by a backing trio' },
  space: 'warm studio room',
  struct: 'soul', reg: 'soulful', avoid: ['electronic drums', 'autotune'],
});

G('Neo Soul', {
  family: 'soul', era: 'contemporary', bpm: [68, 96], keys: ['Eb major', 'Bb minor', 'F minor'],
  inst: ['Rhodes with extended chords', 'fretless bass', 'muted guitar', 'vibraphone'],
  prod: ['warm analogue mix', 'drums deliberately behind the beat', 'lots of low mid'],
  drums: 'loose off-grid kit, ghost notes on the snare',
  vox: { m: 'smooth conversational tenor with falsetto runs', f: 'rich alto, layered and improvised', any: 'relaxed, jazz-inflected, harmonised in thirds' },
  space: 'intimate and warm',
  struct: 'soul', reg: 'soulful', avoid: ['quantised drums', 'bright pop mix'],
});

G('Motown', {
  family: 'soul', era: '1960s', bpm: [116, 140], keys: ['C major', 'G major', 'F major'],
  inst: ['melodic walking bass', 'vibraphone', 'baritone sax', 'tambourine', 'strings'],
  prod: ['punchy mono mix', 'bass and tambourine forward', 'recorded fast and live'],
  drums: 'four-on-the-floor with a cracking backbeat and tambourine',
  vox: { m: 'bright tenor with a call-and-response group behind', f: 'sweet lead with a girl-group answer', any: 'lead answered on every line by a group' },
  space: 'small hit factory room',
  struct: 'soul', reg: 'soulful', syl: { v: [7, 10], c: [5, 8] },
  avoid: ['modern production', 'synths'],
});

G('Contemporary R&B', {
  family: 'soul', era: 'contemporary', bpm: [64, 96], keys: ['C# minor', 'F minor', 'G minor'],
  inst: ['sub bass', 'muted keys', 'airy pad', 'pitched vocal sample'],
  prod: ['spacious modern mix', 'heavy sub', 'lots of empty space', 'subtle tuning'],
  drums: 'sparse trap-influenced kit, rolled hats, big rests',
  vox: { m: 'breathy falsetto stacked in harmony', f: 'silky alto with fast runs', any: 'layered, close, whisper-adjacent' },
  space: 'dark and wide',
  struct: 'soul', reg: 'soulful', avoid: ['rock guitar', 'live drums'],
});

G('Funk', {
  family: 'soul', era: '1970s', bpm: [98, 118], keys: ['E minor', 'D minor', 'A minor'],
  inst: ['slap bass', 'wah rhythm guitar', 'clavinet', 'horn stabs'],
  prod: ['dry punchy mix', 'everything locked to the one', 'live band'],
  drums: 'tight syncopated kit with a hard snare on the two and four',
  vox: { m: 'shouted rhythmic tenor with screams', f: 'sharp percussive alto', any: 'chanted, rhythmic, more groove than melody' },
  space: 'dry and close',
  struct: 'soul', reg: 'swagger', avoid: ['ballad tempo', 'reverb wash'],
});

G('Gospel', {
  family: 'soul', era: 'traditional', bpm: [68, 112], keys: ['Ab major', 'Eb major', 'Bb major'],
  inst: ['church organ', 'gospel piano with heavy passing chords', 'bass', 'tambourine'],
  prod: ['live congregation recording', 'room ambience', 'building arrangement'],
  drums: 'live kit that builds from brushes to full power',
  vox: { m: 'preaching tenor over a full choir', f: 'soaring lead over a choir answering', any: 'lead voice and a full choir in call and response' },
  space: 'church, long natural reverb',
  struct: 'soul', reg: 'soulful', avoid: ['electronic production', 'lo-fi'],
});

G('Blues', {
  family: 'blues', era: 'traditional', bpm: [64, 104], keys: ['E major', 'A major', 'G major'],
  inst: ['slide guitar', 'harmonica', 'walking bass', 'barrelhouse piano'],
  prod: ['dry live-to-tape', 'valve amp breakup', 'one or two mics'],
  drums: 'shuffle on the ride, brushes on slow numbers',
  vox: { m: 'deep gravel voice, half spoken', f: 'big brassy contralto', any: 'weathered and conversational, call and response with the guitar' },
  space: 'small club',
  struct: 'blues', reg: 'plain', syl: { v: [6, 10], c: [5, 9] },
  avoid: ['electronic drums', 'modern polish'],
});

/* ---------------------------------------------------------------- hip hop */

G('Boom Bap', {
  family: 'hiphop', era: '1990s', bpm: [86, 96], keys: ['F minor', 'C minor', 'Bb minor'],
  inst: ['dusty jazz sample loop', 'upright bass line', 'vinyl crackle', 'scratched hook'],
  prod: ['SP-1200 crunch', 'sampled drums with the swing left in', 'mono-leaning'],
  drums: 'hard sampled kick and snare, swung hats',
  vox: { m: 'confident rapped baritone, right on the beat', f: 'sharp rapped alto with clear diction', any: 'rapped, conversational, punching the snare' },
  space: 'dusty and close',
  struct: 'rap', reg: 'street', syl: { v: [10, 15], c: [6, 10] },
  avoid: ['sung chorus', 'modern trap hats'],
});

G('Trap', {
  family: 'hiphop', era: 'contemporary', bpm: [130, 150], keys: ['G minor', 'C# minor', 'F minor'],
  inst: ['distorted 808 with glide', 'dark bell melody', 'sparse pad'],
  prod: ['heavy sub-focused mix', 'ad-libs panned wide', 'lots of space'],
  drums: 'rolled and triplet hats, rimshot snare on three',
  vox: { m: 'melodic autotuned baritone with ad-libs', f: 'melodic tuned alto with doubled ad-libs', any: 'half-sung half-rapped, heavily tuned, doubled' },
  space: 'dark and cavernous',
  struct: 'rap', reg: 'swagger', syl: { v: [8, 13], c: [5, 9] },
  avoid: ['live drums', 'acoustic guitar'],
});

G('Drill', {
  family: 'hiphop', era: 'contemporary', bpm: [138, 150], keys: ['D minor', 'A minor', 'F# minor'],
  inst: ['sliding 808 bass', 'ominous piano or string melody', 'dark plucks'],
  prod: ['cold minimal mix', 'sub does the melody work', 'very little reverb'],
  drums: 'skipping hi-hat pattern, sparse snare, syncopated 808 slides',
  vox: { m: 'low menacing flow, deadpan, slightly behind the beat', f: 'cold clipped delivery', any: 'flat, unhurried, London or Chicago inflection' },
  space: 'cold and tight',
  struct: 'rapShort', reg: 'street', syl: { v: [9, 14], c: [5, 9] },
  avoid: ['bright production', 'sung chorus'],
});

G('Jazz Rap', {
  family: 'hiphop', era: '1990s', bpm: [84, 98], keys: ['Eb major', 'Bb minor', 'F minor'],
  inst: ['upright bass', 'brushed drum sample', 'muted trumpet', 'Rhodes chords'],
  prod: ['warm and dusty', 'sampled live band', 'relaxed swing'],
  drums: 'laid-back swung sample, brushes on the snare',
  vox: { m: 'relaxed conversational flow, well behind the beat', f: 'smooth low-key delivery', any: 'unhurried, thoughtful, almost spoken' },
  space: 'basement jazz club',
  struct: 'rap', reg: 'street', syl: { v: [10, 15], c: [6, 10] },
  avoid: ['aggressive delivery', '808s'],
});

G('Grime', {
  family: 'hiphop', era: '2000s', bpm: [138, 142], keys: ['E minor', 'A minor'],
  inst: ['square-wave bass', 'sparse synth stabs', 'siren sounds'],
  prod: ['raw cheap mix', 'clipping bass', 'made on a bedroom PC'],
  drums: 'skippy broken beat at 140, hard snare',
  vox: { m: 'fast aggressive London bars, high energy', f: 'rapid clipped London delivery', any: 'shouted, fast, heavy London accent' },
  space: 'tight and dry',
  struct: 'rapShort', reg: 'street', syl: { v: [10, 15], c: [5, 9] },
  avoid: ['American accent', 'soft production'],
});

G('Phonk', {
  family: 'hiphop', era: 'contemporary', bpm: [130, 160], keys: ['F minor', 'G minor'],
  inst: ['cowbell melody', 'distorted 808', 'chopped and screwed vocal sample'],
  prod: ['heavily saturated and clipped', 'tape-degraded', 'aggressive limiting'],
  drums: 'Memphis-style kit, cowbell driving the groove',
  vox: { m: 'pitched-down chopped vocal', f: 'pitched-down sample chops', any: 'slowed and screwed, more texture than lyric' },
  space: 'blown out',
  struct: 'rapShort', reg: 'swagger', avoid: ['clean mix', 'live instruments'],
});

/* ---------------------------------------------------------------- electronic */

G('Deep House', {
  family: 'electronic', era: 'contemporary', bpm: [118, 124], keys: ['A minor', 'F minor', 'D minor'],
  inst: ['warm analogue bassline', 'Rhodes chord stabs', 'filtered pad', 'shaker'],
  prod: ['warm rounded low end', 'long filter sweeps', 'subtle sidechain'],
  drums: 'four-on-the-floor kick, open hat on the off-beat, soft clap',
  vox: { m: 'soft soulful tenor, mostly a repeated phrase', f: 'breathy soulful alto hook', any: 'a short vocal phrase looped and filtered' },
  space: 'warm and deep',
  struct: 'house', reg: 'spare', syl: { v: [6, 10], c: [4, 8] },
  avoid: ['aggressive drops', 'distorted bass'],
});

G('Tech House', {
  family: 'electronic', era: 'contemporary', bpm: [124, 128], keys: ['G minor', 'A minor'],
  inst: ['rubbery bassline', 'clipped vocal chop', 'percussive synth blips'],
  prod: ['tight club mix', 'hard sidechain', 'minimal and relentless'],
  drums: 'punchy four-to-the-floor, tight clap, busy percussion',
  vox: { m: 'chopped spoken phrase used as percussion', f: 'clipped repeated vocal hook', any: 'a single phrase chopped into a rhythm' },
  space: 'dry and clubby',
  struct: 'dance', reg: 'spare', syl: { v: [5, 8], c: [3, 7] },
  avoid: ['long lyrics', 'orchestral'],
});

G('Techno', {
  family: 'electronic', era: 'contemporary', bpm: [130, 145], keys: ['A minor', 'D minor'],
  inst: ['distorted kick', 'metallic percussion loop', 'acid line', 'drone pad'],
  prod: ['relentless and hypnotic', 'industrial saturation', 'long slow builds'],
  drums: 'hard driving kick, rides and noise sweeps',
  vox: { m: 'processed spoken fragment', f: 'distant filtered phrase', any: 'a single processed spoken line, repeated' },
  space: 'concrete warehouse',
  struct: 'dance', reg: 'spare', syl: { v: [4, 8], c: [3, 6] },
  avoid: ['melodic vocals', 'acoustic instruments'],
});

G('Drum and Bass', {
  family: 'electronic', era: 'contemporary', bpm: [172, 176], keys: ['F minor', 'C minor', 'G minor'],
  inst: ['reese bass', 'chopped amen break', 'atmospheric pad', 'sub'],
  prod: ['fast and wide', 'heavy sub weight', 'tight transient control'],
  drums: 'chopped breakbeat at 174, syncopated snare',
  vox: { m: 'half-time sung phrase over the break', f: 'soulful floating vocal over the break', any: 'melodic vocal sitting in half-time above the drums' },
  space: 'wide and atmospheric',
  struct: 'dance', reg: 'spare', syl: { v: [6, 10], c: [4, 8] },
  avoid: ['slow tempo', 'acoustic drums'],
});

G('UK Garage', {
  family: 'electronic', era: '1990s', bpm: [130, 136], keys: ['C minor', 'G minor'],
  inst: ['organ bass stabs', 'chopped soul vocal', 'sub bass'],
  prod: ['swung and bouncy', 'crisp top end', 'sampled and pitched'],
  drums: 'two-step shuffle, skipping hats, syncopated kick',
  vox: { m: 'smooth soulful phrases chopped up', f: 'sped-up soulful alto, cut into stutters', any: 'chopped and pitched soul vocal' },
  space: 'bright and bouncy',
  struct: 'house', reg: 'plain', syl: { v: [6, 10], c: [4, 8] },
  avoid: ['four-on-the-floor', 'heavy distortion'],
});

G('Synthwave', {
  family: 'electronic', era: '1980s revival', bpm: [98, 118], keys: ['A minor', 'F# minor', 'C minor'],
  inst: ['analogue saw lead', 'gated pad', 'FM bass', 'arpeggiator'],
  prod: ['huge reverb', 'chorused and wide', 'tape saturation', 'neon-era mix'],
  drums: 'LinnDrum kit with an enormous gated snare',
  vox: { m: 'cool detached baritone drenched in reverb', f: 'airy alto floating over the arp', any: 'distant, processed, half-buried' },
  space: 'enormous and glassy',
  struct: 'pop', reg: 'spare', avoid: ['acoustic instruments', 'modern trap'],
});

G('Ambient', {
  family: 'electronic', era: 'contemporary', bpm: [50, 76], keys: ['C major', 'D minor', 'A minor'],
  inst: ['sustained pad', 'processed field recordings', 'bowed strings', 'granular texture'],
  prod: ['very long reverb', 'no percussion', 'slow evolving layers'],
  drums: 'none',
  vox: { m: 'wordless low hum', f: 'wordless soprano drifting in and out', any: 'wordless voice used as texture, few or no words' },
  space: 'endless',
  struct: 'ambient', reg: 'spare', syl: { v: [3, 7], c: [3, 6] },
  avoid: ['drums', 'strong rhythm'],
});

G('Lo-Fi Hip Hop', {
  family: 'electronic', era: 'contemporary', bpm: [72, 88], keys: ['F major', 'Bb major', 'D minor'],
  inst: ['dusty piano loop', 'soft upright bass', 'vinyl crackle', 'muted trumpet'],
  prod: ['tape wobble', 'low-passed and warm', 'quiet and unobtrusive'],
  drums: 'soft off-grid sampled kit, brushed snare',
  vox: { m: 'soft-spoken murmured lines', f: 'quiet breathy phrases', any: 'sparse, half-spoken, sitting low in the mix' },
  space: 'small warm room',
  struct: 'ambient', reg: 'spare', syl: { v: [5, 9], c: [4, 8] },
  avoid: ['loud mastering', 'aggressive drums'],
});

G('Future Bass', {
  family: 'electronic', era: 'contemporary', bpm: [140, 160], keys: ['G major', 'E minor', 'B minor'],
  inst: ['detuned supersaw chords', 'pitch-bent lead', 'vocal chop stack'],
  prod: ['heavy sidechain pumping', 'wide and bright', 'huge drop contrast'],
  drums: 'half-time trap kit under the drop',
  vox: { m: 'bright tuned tenor in the verses', f: 'sweet high alto, chopped in the drop', any: 'clean tuned vocal, chopped into the lead on the drop' },
  space: 'wide and glossy',
  struct: 'dance', reg: 'plain', avoid: ['acoustic', 'lo-fi'],
});

G('Trance', {
  family: 'electronic', era: '2000s', bpm: [136, 142], keys: ['A minor', 'F# minor'],
  inst: ['rolling arpeggiated bass', 'huge supersaw lead', 'sweeping pad'],
  prod: ['long eight-bar builds', 'white noise risers', 'wide stereo lead'],
  drums: 'four-on-the-floor with a rolling offbeat bass',
  vox: { m: 'earnest tenor in the breakdown', f: 'soaring female vocal in the breakdown', any: 'one big emotional vocal line in the breakdown' },
  space: 'stadium-sized',
  struct: 'dance', reg: 'plain', avoid: ['lo-fi', 'trap hats'],
});

G('Dubstep', {
  family: 'electronic', era: 'contemporary', bpm: [138, 145], keys: ['E minor', 'F minor'],
  inst: ['growling modulated bass', 'metallic sound design', 'sub drop'],
  prod: ['aggressive and huge', 'heavy transient shaping', 'half-time contrast'],
  drums: 'half-time kick and snare, sparse and heavy',
  vox: { m: 'shouted phrase before the drop', f: 'ethereal build vocal into the drop', any: 'one vocal line in the build, none in the drop' },
  space: 'enormous',
  struct: 'dance', reg: 'raw', syl: { v: [5, 9], c: [3, 7] },
  avoid: ['acoustic', 'soft dynamics'],
});

/* ---------------------------------------------------------------- global */

G('Afrobeats', {
  family: 'global', era: 'contemporary', bpm: [100, 112], keys: ['G major', 'E minor', 'A minor'],
  inst: ['log drum', 'plucked guitar figure', 'shaker', 'warm synth bass'],
  prod: ['bright airy mix', 'space around every element', 'gentle sidechain'],
  drums: 'syncopated afrobeat kit, shakers and hand percussion carrying the swing',
  vox: { m: 'relaxed melodic tenor with pidgin inflection', f: 'sweet melodic alto, unhurried', any: 'easy melodic delivery, lots of repeated hooks' },
  space: 'open and bright',
  struct: 'pop', reg: 'swagger', avoid: ['rock guitar', 'heavy distortion'],
});

G('Amapiano', {
  family: 'global', era: 'contemporary', bpm: [110, 115], keys: ['F minor', 'C minor'],
  inst: ['log drum bass', 'jazzy piano chords', 'shakers', 'airy pad'],
  prod: ['spacious and patient', 'long grooves', 'deep sub log drum'],
  drums: 'shuffling percussion over a soft four, log drum on the offbeats',
  vox: { m: 'chanted repeated phrase', f: 'soulful floating vocal', any: 'a short phrase repeated hypnotically' },
  space: 'wide and warm',
  struct: 'house', reg: 'spare', syl: { v: [5, 9], c: [4, 7] },
  avoid: ['fast tempo', 'aggressive drums'],
});

G('Reggae', {
  family: 'global', era: '1970s', bpm: [72, 92], keys: ['A minor', 'G major', 'D minor'],
  inst: ['skanking offbeat guitar', 'deep melodic bass', 'bubble organ', 'horns'],
  prod: ['bass-heavy warm mix', 'spring reverb', 'tape echo on the snare'],
  drums: 'one-drop kit, rim clicks, kick on the three',
  vox: { m: 'warm patois tenor with harmony behind', f: 'clear alto with a lilt', any: 'lead with a harmony trio answering' },
  space: 'warm with spring reverb',
  struct: 'soul', reg: 'plain', avoid: ['fast tempo', 'distorted guitar'],
});

G('Dub', {
  family: 'global', era: '1970s', bpm: [68, 88], keys: ['A minor', 'D minor'],
  inst: ['enormous bass', 'melodica', 'stabs drenched in delay'],
  prod: ['tape delay throws', 'instruments dropping in and out', 'spring reverb crashes'],
  drums: 'one-drop kit with heavy echo on the snare',
  vox: { m: 'toasted phrases smothered in delay', f: 'floating phrases echoing away', any: 'fragments of vocal thrown into delay' },
  space: 'cavernous echo',
  struct: 'ambient', reg: 'spare', syl: { v: [4, 8], c: [3, 7] },
  avoid: ['dense arrangement', 'dry mix'],
});

G('Dancehall', {
  family: 'global', era: 'contemporary', bpm: [96, 108], keys: ['G minor', 'A minor'],
  inst: ['digital riddim bass', 'synth stabs', 'hand percussion'],
  prod: ['punchy and dry', 'bass forward', 'sparse arrangement'],
  drums: 'syncopated digital riddim, heavy kick pattern',
  vox: { m: 'rhythmic patois delivery, half sung', f: 'sharp rhythmic alto', any: 'chanted and rhythmic, hook repeated constantly' },
  space: 'dry and punchy',
  struct: 'pop', reg: 'swagger', avoid: ['ballad tempo', 'orchestral'],
});

G('Reggaeton', {
  family: 'global', era: 'contemporary', bpm: [88, 100], keys: ['A minor', 'D minor'],
  inst: ['dembow percussion', 'sub bass', 'plucked synth', 'guitar loop'],
  prod: ['club-ready and punchy', 'bass and percussion forward'],
  drums: 'dembow pattern, kick and snare locked together',
  vox: { m: 'rhythmic Spanish-language delivery, half rapped', f: 'melodic Spanish-language hook', any: 'rhythmic delivery over the dembow, hook repeated' },
  space: 'tight and loud',
  struct: 'pop', reg: 'swagger', avoid: ['acoustic', 'slow tempo'],
});

G('Bossa Nova', {
  family: 'jazz', era: '1960s', bpm: [120, 140], keys: ['D major', 'F major', 'A minor'],
  inst: ['nylon-string guitar with syncopated chords', 'soft upright bass', 'shaker'],
  prod: ['intimate and close', 'minimal reverb', 'quiet dynamic range'],
  drums: 'brushed kit, rim clicks, very soft',
  vox: { m: 'soft near-whispered baritone, barely above speech', f: 'gentle breathy alto, understated', any: 'quiet, unhurried, sung almost without effort' },
  space: 'small close room',
  struct: 'jazz', reg: 'spare', syl: { v: [6, 10], c: [5, 9] },
  avoid: ['loud drums', 'distortion'],
});

G('Jazz', {
  family: 'jazz', era: 'traditional', bpm: [96, 168], keys: ['Bb major', 'F major', 'Eb major'],
  inst: ['upright bass', 'brushed drums', 'piano comping', 'tenor saxophone'],
  prod: ['live trio or quartet in one room', 'natural balance', 'no compression'],
  drums: 'swung ride, brushes, trading fours',
  vox: { m: 'warm crooning baritone, behind the beat', f: 'smoky contralto with loose phrasing', any: 'phrasing that plays with the beat, never square' },
  space: 'club room',
  struct: 'jazz', reg: 'plain', avoid: ['electronic drums', 'autotune'],
});

G('Gypsy Jazz', {
  family: 'jazz', era: '1930s', bpm: [140, 200], keys: ['D minor', 'G minor', 'A minor'],
  inst: ['acoustic archtop lead', 'la pompe rhythm guitar', 'upright bass', 'violin'],
  prod: ['vintage close mic', 'no drums', 'fast and light'],
  drums: 'none — the rhythm guitars do the work',
  vox: { m: 'playful crooned tenor', f: 'bright playful alto', any: 'light, swung, playful' },
  space: 'small café',
  struct: 'jazz', reg: 'plain', avoid: ['drums', 'electric instruments'],
});

G('Flamenco', {
  family: 'global', era: 'traditional', bpm: [96, 140], keys: ['A phrygian', 'E phrygian'],
  inst: ['nylon-string guitar with rasgueado', 'palmas handclaps', 'cajón'],
  prod: ['dry close recording', 'room claps', 'no click'],
  drums: 'cajón and palmas in twelve-beat compás',
  vox: { m: 'raw cante with long melismatic cries', f: 'powerful ornamented contralto', any: 'raw and ornamented, pushed to the edge' },
  space: 'small tiled room',
  struct: 'folk', reg: 'raw', avoid: ['drum kit', 'electronic production'],
});

G('Cinematic', {
  family: 'orchestral', era: 'contemporary', bpm: [60, 96], keys: ['D minor', 'C minor', 'E minor'],
  inst: ['string ostinato', 'low brass', 'timpani', 'piano', 'choir'],
  prod: ['large scoring stage', 'wide orchestral spread', 'huge dynamic build'],
  drums: 'taiko and timpani hits, no kit',
  vox: { m: 'solo tenor over the orchestra', f: 'solo soprano over the orchestra', any: 'wordless choir swelling under the melody' },
  space: 'concert hall',
  struct: 'ballad', reg: 'spare', syl: { v: [5, 9], c: [4, 8] },
  avoid: ['drum machine', 'electric guitar'],
});

G('Christmas', {
  family: 'seasonal', era: 'traditional', bpm: [96, 130], keys: ['C major', 'F major', 'G major'],
  inst: ['sleigh bells', 'brushed drums', 'jazz piano', 'string section', 'celeste'],
  prod: ['warm vintage mix', 'lush strings', 'big-band swing feel'],
  drums: 'brushed swing kit with sleigh bells throughout',
  vox: { m: 'warm crooning baritone', f: 'bright sweet alto', any: 'crooned lead with a warm choir behind' },
  space: 'big warm room',
  struct: 'jazz', reg: 'plain', avoid: ['distortion', 'trap drums'],
});

/* ---------------------------------------------------------------- lookup helpers */

const GENRE_LIST = Object.values(GENRES);

function findGenre(text) {
  if (!text) return null;
  const q = String(text).toLowerCase().trim();
  const id = q.replace(/[^a-z0-9]+/g, '-');
  if (GENRES[id]) return GENRES[id];
  let hit = GENRE_LIST.find((g) => g.name.toLowerCase() === q || g.aka.some((a) => a.toLowerCase() === q));
  if (hit) return hit;
  hit = GENRE_LIST.find((g) => g.name.toLowerCase().includes(q) || g.aka.some((a) => a.toLowerCase().includes(q)));
  if (hit) return hit;
  hit = GENRE_LIST.find((g) => q.includes(g.name.toLowerCase()));
  return hit || null;
}
