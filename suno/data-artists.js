/* ==========================================================================
   data-artists.js — reference artists, translated into sound
   --------------------------------------------------------------------------
   Suno blocks artist names in the Style field, and using one can get an
   account struck. So this file never hands a name to the model. It holds the
   things a name is shorthand for — the era, the voice, the instruments, the
   mix, the rhythmic feel and the way the words are written — and the engine
   emits those instead.

   g      genres this artist pulls the prompt toward (matched to data-genres)
   era    the period the record sounds like it was made in
   vox    vocal character, written as Suno-facing description
   inst   signature instrumentation, most identifying first
   prod   mix and production signatures
   feel   rhythmic feel / groove
   write  how the lyrics are written — feeds the lyric engine's register
   bpm    typical tempo window, overrides the genre default when present
   ========================================================================== */

const ARTISTS = {};

function A(name, o) {
  o.name = name;
  o.key = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  o.g = o.g || [];
  o.inst = o.inst || [];
  o.prod = o.prod || [];
  ARTISTS[o.key] = o;
  return o;
}

/* ------------------------------------------------------------ rock, classic */

A('Fleetwood Mac', {
  g: ['pop-rock', 'classic-rock'], era: 'late 1970s California',
  vox: 'male and female voices trading lines and locking into close two-part harmony, dry and slightly nasal',
  inst: ['clean Fender electric', 'layered twelve-string acoustic', 'Rhodes', 'tom-heavy kit'],
  prod: ['dry Los Angeles studio mix', 'double-tracked vocals', 'no reverb wash', 'every part audible'],
  feel: 'mid-tempo driving eighth notes with a rolling tom pattern', bpm: [100, 122],
  write: 'plain-spoken confession aimed straight at one person, domestic detail, no metaphor',
});

A('The Beatles', {
  g: ['psych-rock', 'classic-rock'], era: 'mid 1960s British',
  vox: 'two bright tenors in tight thirds, close-miked, slight tape slap',
  inst: ['Rickenbacker jangle', 'melodic bass moving against the vocal', 'upright piano', 'string quartet'],
  prod: ['four-track analogue', 'artificial double tracking', 'mono-leaning mix', 'tape varispeed'],
  feel: 'brisk and bouncy with a hard tambourine backbeat', bpm: [104, 140],
  write: 'simple direct address, everyday objects, a twist in the middle eight',
});

A('Led Zeppelin', {
  g: ['classic-rock', 'blues'], era: 'early 1970s',
  vox: 'high wailing rock tenor with heavy vibrato, pushed to breaking',
  inst: ['cranked Les Paul riffs', 'thick bass locked to the kick', 'huge room-miked drums'],
  prod: ['drums recorded from across the room', 'analogue tape saturation', 'wide stereo'],
  feel: 'heavy dragging swing behind the beat', bpm: [92, 132],
  write: 'blues imagery, road and weather, repeated first lines',
});

A('Pink Floyd', {
  g: ['prog-rock', 'psych-rock'], era: '1970s',
  vox: 'calm restrained tenor with long held notes and doubled harmony',
  inst: ['slow bending lead guitar with heavy delay', 'analogue synth pad', 'Rhodes', 'sound effects'],
  prod: ['enormous stereo field', 'long tape delays', 'patient arrangement with instrumental sections'],
  feel: 'slow and unhurried, letting chords ring', bpm: [60, 100],
  write: 'flat declarative lines about time and distance, long instrumental gaps',
});

A('Queen', {
  g: ['classic-rock', 'pop-rock'], era: 'late 1970s',
  vox: 'operatic multi-tracked harmony stack over a theatrical lead tenor',
  inst: ['layered guitar orchestration', 'grand piano', 'stomping percussion'],
  prod: ['dozens of overdubbed vocal layers', 'huge dynamic contrast', 'analogue tape'],
  feel: 'stomping and theatrical with sudden tempo changes', bpm: [96, 145],
  write: 'grand declarative statements, crowd-chantable chorus',
});

A('The Rolling Stones', {
  g: ['classic-rock', 'blues'], era: 'early 1970s',
  vox: 'sneering drawled baritone, sloppy and behind the beat',
  inst: ['open-G tuned rhythm guitar', 'honky-tonk piano', 'horns', 'loose bass'],
  prod: ['ragged live mix', 'vocal buried slightly', 'no click track'],
  feel: 'loose swaggering shuffle that drags', bpm: [100, 130],
  write: 'sly, mean, funny, first person, plain words',
});

A('David Bowie', {
  g: ['classic-rock', 'synth-pop'], era: '1970s',
  vox: 'theatrical baritone sliding into a strained upper register, English accent forward',
  inst: ['angular electric guitar', 'saxophone', 'analogue synth', 'piano'],
  prod: ['dry close vocal against wide instruments', 'unusual stereo placement'],
  feel: 'sharp and clipped, art-rock phrasing', bpm: [104, 138],
  write: 'character sketches in third person, unusual specifics, a cold eye',
});

A('Bruce Springsteen', {
  g: ['classic-rock', 'americana'], era: 'early 1980s',
  vox: 'hoarse shouted baritone, straining, no polish',
  inst: ['glockenspiel', 'saxophone', 'Telecaster', 'upright piano', 'big kit'],
  prod: ['huge live band', 'gated snare', 'vocal right at the front'],
  feel: 'driving four-on-the-floor with a crashing backbeat', bpm: [112, 148],
  write: 'working-life stories with names, cars, streets and jobs in them',
});

A('Nirvana', {
  g: ['grunge', 'alt-rock'], era: 'early 1990s',
  vox: 'quiet frayed baritone in the verse, throat-shredding scream in the chorus',
  inst: ['detuned distorted guitar', 'thick simple bass', 'hard-hit kit'],
  prod: ['loud murky mix', 'guitars swamp the vocal', 'slap delay on the voice'],
  feel: 'dragging heavy backbeat, quiet-loud dynamics', bpm: [96, 132],
  write: 'fragments and refusals, no explanation, the chorus repeats one phrase',
});

A('Radiohead', {
  g: ['alt-rock', 'ambient'], era: 'late 1990s',
  vox: 'high fragile falsetto, sung close and slightly off-mic',
  inst: ['arpeggiated clean guitar', 'analogue synth drift', 'string arrangement', 'Ondes-style lead'],
  prod: ['cold precise mix', 'processed drums', 'unsettling stereo movement'],
  feel: 'shifting metres and unresolved motion', bpm: [76, 132],
  write: 'flat anxious statements, second person, refuses to resolve',
});

A('Oasis', {
  g: ['britpop', 'classic-rock'], era: 'mid 1990s',
  vox: 'nasal snarling Manchester tenor, all vowels flattened, double-tracked',
  inst: ['layered wall of overdriven guitars', 'tambourine', 'simple root bass'],
  prod: ['everything loud and compressed', 'twenty guitar tracks', 'no dynamics'],
  feel: 'slow stomping mid-tempo that never rushes', bpm: [96, 124],
  write: 'plain simple lines that mean less than they sound, singalong chorus',
});

A('The Smiths', {
  g: ['post-punk', 'britpop'], era: 'mid 1980s',
  vox: 'swooping mannered baritone with a heavy Manchester accent and long wavering notes',
  inst: ['layered arpeggiated Rickenbacker', 'melodic wandering bass', 'no synths'],
  prod: ['dry bright English mix', 'jangling guitars wide', 'vocal front and centre'],
  feel: 'brisk and bouncy against miserable words', bpm: [120, 152],
  write: 'witty self-lacerating first person, English place names, a joke inside the sadness',
});

A('Joy Division', {
  g: ['post-punk'], era: 'late 1970s',
  vox: 'flat funereal baritone, almost spoken, no vibrato',
  inst: ['chorused bass carrying the melody', 'thin trebly guitar', 'cold synth'],
  prod: ['gated reverb', 'clinical cold mix', 'bass louder than guitar', 'drums isolated'],
  feel: 'relentless motorik eighths', bpm: [128, 156],
  write: 'short blunt abstract lines, no chorus lift, repetition as dread',
});

A('The Cure', {
  g: ['post-punk', 'dream-pop'], era: '1980s',
  vox: 'thin quavering tenor, mournful, drenched in reverb',
  inst: ['chorused six-string bass lead', 'flanged guitar', 'string synth'],
  prod: ['everything soaked in chorus and reverb', 'bass carries the hook'],
  feel: 'hypnotic repeating figures over a simple beat', bpm: [96, 140],
  write: 'obsessive repetition, colours and weather, one image held too long',
});

A('Talking Heads', {
  g: ['post-punk', 'funk'], era: 'early 1980s',
  vox: 'yelping anxious tenor, spoken and jittery, group chants answering',
  inst: ['clipped funk guitar', 'polyrhythmic percussion', 'synth bass', 'horns'],
  prod: ['dry punchy mix', 'layered percussion', 'everything locked to the groove'],
  feel: 'nervous polyrhythmic funk', bpm: [112, 132],
  write: 'deadpan observations about ordinary life, repeated until they turn strange',
});

A('Arctic Monkeys', {
  g: ['alt-rock', 'britpop'], era: '2000s and 2010s',
  vox: 'Sheffield-accented baritone, half spoken, sardonic, close on the mic',
  inst: ['tight interlocking guitars', 'busy melodic bass', 'crisp kit'],
  prod: ['dry punchy mix', 'guitars sharp and mid-forward'],
  feel: 'sharp syncopated riffs with a swaggering strut', bpm: [98, 150],
  write: 'wordy observational verses full of specifics, a sting in the last line',
});

A('The Strokes', {
  g: ['alt-rock'], era: 'early 2000s',
  vox: 'distorted low-fidelity vocal sounding like it came through an amp, laconic',
  inst: ['two interlocking trebly guitars', 'driving root bass', 'simple tight kit'],
  prod: ['deliberately compressed and small', 'no low end', 'everything mid-range'],
  feel: 'tight fast eighth notes, drummer slightly ahead', bpm: [128, 168],
  write: 'bored, clipped, second person, half sentences',
});

A('Tame Impala', {
  g: ['psych-rock', 'dream-pop'], era: '2010s',
  vox: 'high processed tenor drowned in tape delay and phaser, sitting inside the track',
  inst: ['fuzzed bass', 'phased guitar', 'analogue synth', 'huge compressed drums'],
  prod: ['everything phase-shifted', 'drums enormous and squashed', 'vocal treated as an instrument'],
  feel: 'heavy loping groove with a lazy swing', bpm: [96, 122],
  write: 'inward and questioning, second person, one thought turned over slowly',
});

A('AC/DC', {
  g: ['classic-rock', 'hard-rock'], era: 'late 1970s Australian',
  vox: 'shrieking rasped tenor at the top of the range, no vibrato',
  inst: ['two clean-ish overdriven guitars', 'no keyboards at all', 'simple locked bass'],
  prod: ['bone dry mix', 'guitars hard-panned', 'nothing but the band'],
  feel: 'rock solid mid-tempo shuffle with total space between hits', bpm: [110, 138],
  write: 'blunt, funny, double-meaning, one repeated title line',
});

A('Midnight Oil', {
  g: ['alt-rock', 'post-punk'], era: '1980s Australian',
  vox: 'urgent barked baritone, half preached',
  inst: ['ringing chorused guitars', 'driving bass', 'hard tribal drums'],
  prod: ['big dry Australian rock mix', 'drums forward', 'wide guitars'],
  feel: 'insistent driving rhythm with tom-heavy patterns', bpm: [118, 148],
  write: 'political and geographic, real place names, direct accusation',
});

/* ------------------------------------------------------------ pop */

A('Taylor Swift', {
  g: ['pop-rock', 'indie-folk'], era: 'contemporary',
  vox: 'clear conversational alto, close-miked, softly doubled, breath left in',
  inst: ['acoustic guitar or plain piano', 'programmed soft kit', 'string pad'],
  prod: ['clean uncluttered mix', 'vocal well forward', 'restrained arrangement'],
  feel: 'steady mid-tempo, chorus opening up from a tight verse', bpm: [90, 130],
  write: 'diaristic storytelling with dates, ages, cars and rooms named exactly',
});

A('Billie Eilish', {
  g: ['bedroom-pop', 'contemporary-r-b'], era: 'contemporary',
  vox: 'whispered breathy vocal recorded inches from the mic, harmonised in close layers',
  inst: ['distorted sub bass', 'sparse muted keys', 'foley percussion'],
  prod: ['huge amounts of empty space', 'sub-heavy low end', 'no reverb on the voice'],
  feel: 'slow, sparse, built on rests as much as hits', bpm: [60, 100],
  write: 'flat unsettling lines delivered deadpan, dark humour, very few words',
});

A('ABBA', {
  g: ['pop-rock', 'synth-pop'], era: 'late 1970s',
  vox: 'two female voices in tight bright unison and thirds, no vibrato',
  inst: ['stacked pianos', 'string section', 'clean guitar', 'analogue synth'],
  prod: ['wall of doubled instruments', 'huge stacked vocals', 'bright Scandinavian mix'],
  feel: 'four-on-the-floor with a driving piano eighth pattern', bpm: [112, 132],
  write: 'plain unfussy English, big emotional statement in the chorus title',
});

A('Michael Jackson', {
  g: ['funk', 'pop-rock'], era: 'early 1980s',
  vox: 'percussive tenor full of hiccups and gasps, layered ad-libs everywhere',
  inst: ['slap and synth bass', 'clipped rhythm guitar', 'horn stabs', 'orchestral hits'],
  prod: ['immaculate wide mix', 'every element in its own space', 'huge vocal stacks'],
  feel: 'tight funk groove locked to a crisp four', bpm: [112, 128],
  write: 'short percussive phrases, hook built from rhythm as much as words',
});

A('Prince', {
  g: ['funk', 'contemporary-r-b'], era: '1980s',
  vox: 'falsetto sliding into a raw shout, played like an instrument',
  inst: ['LinnDrum machine', 'clipped funk guitar', 'synth bass', 'screaming lead guitar'],
  prod: ['dry punchy mix with almost no reverb', 'one person playing everything'],
  feel: 'stiff drum machine funk with a live guitar fighting it', bpm: [104, 126],
  write: 'sexual, spiritual and playful at once, invented spellings, direct address',
});

A('Lana Del Rey', {
  g: ['dream-pop', 'cinematic'], era: 'contemporary',
  vox: 'low languid contralto sliding up into a thin breathy head voice, heavy reverb',
  inst: ['string section', 'tremolo surf guitar', 'sparse trap-adjacent kit', 'piano'],
  prod: ['wide cinematic reverb', 'vocal layered many times', 'slow and heavy'],
  feel: 'very slow, dragging, half-time feel', bpm: [64, 92],
  write: 'American iconography, first names, cars and coastlines, languid repetition',
});

A('Adele', {
  g: ['soul', 'pop-rock'], era: 'contemporary',
  vox: 'huge belted contralto with audible rasp and a London vowel underneath',
  inst: ['grand piano', 'string section', 'restrained kit', 'bass'],
  prod: ['big but uncluttered', 'voice enormous at the front', 'analogue warmth'],
  feel: 'slow build from solo piano to full band on the last chorus', bpm: [66, 100],
  write: 'direct address to one person, plain words, an admission in the bridge',
});

A('Amy Winehouse', {
  g: ['soul', 'motown'], era: '2000s',
  vox: 'smoky contralto with jazz phrasing dragging behind the beat, sardonic',
  inst: ['1960s girl-group band', 'baritone sax', 'vibraphone', 'tambourine'],
  prod: ['deliberately vintage mono-leaning mix', 'live band in one room', 'tape'],
  feel: 'Motown backbeat with a heavy lag', bpm: [92, 128],
  write: 'blunt confessional detail, London specifics, a joke told flat',
});

A('Dua Lipa', {
  g: ['synth-pop', 'deep-house'], era: 'contemporary',
  vox: 'cool low alto, controlled, no runs, doubled tight',
  inst: ['disco bassline', 'string stabs', 'analogue synth pad', 'four-to-the-floor kit'],
  prod: ['polished modern disco mix', 'sidechained pads', 'bright and wide'],
  feel: 'steady disco four with a strutting bassline', bpm: [110, 126],
  write: 'short assertive lines, chorus is a statement of intent',
});

A('The Weeknd', {
  g: ['contemporary-r-b', 'synth-pop'], era: 'contemporary',
  vox: 'high airy tenor with heavy reverb and thick harmony stacks',
  inst: ['analogue synth pad', 'gated snare', 'sub bass', 'arpeggiated lead'],
  prod: ['huge 80s-informed reverb', 'wide stereo synths', 'vocal layered five deep'],
  feel: 'driving retro four-on-the-floor or a slow narcotic half-time', bpm: [86, 172],
  write: 'nocturnal, self-aware, repeated one-line hook',
});

A('Lorde', {
  g: ['bedroom-pop', 'synth-pop'], era: '2010s',
  vox: 'dry low alto with strange consonant emphasis, harmonised in blocky stacks',
  inst: ['sparse sub bass', 'finger snaps', 'processed vocal percussion', 'plain piano'],
  prod: ['very little in the arrangement', 'drums minimal and dry', 'vocals in a choir-like block'],
  feel: 'slow with a hard snap on the backbeat', bpm: [80, 112],
  write: 'suburban teenage specifics, we-and-us plural voice, exact places',
});

/* ------------------------------------------------------------ country / folk */

A('Johnny Cash', {
  g: ['outlaw-country', 'americana'], era: '1960s',
  vox: 'deep flat bass-baritone, almost spoken, no vibrato at all',
  inst: ['boom-chicka rhythm guitar', 'upright bass', 'baritone electric'],
  prod: ['bone dry mono mix', 'slap-back tape echo on the voice', 'no drums or minimal snare'],
  feel: 'boom-chicka freight-train rhythm', bpm: [104, 132],
  write: 'first-person narrative, crime and work and trains, plain hard nouns',
});

A('Dolly Parton', {
  g: ['modern-country', 'bluegrass'], era: '1970s',
  vox: 'bright quavering soprano with a hard mountain twang and fast vibrato',
  inst: ['acoustic guitar', 'fiddle', 'dobro', 'pedal steel'],
  prod: ['clean Nashville mix', 'voice right at the front', 'warm and simple'],
  feel: 'brisk country two-step', bpm: [96, 132],
  write: 'story songs about poverty, family and betrayal, told kindly and directly',
});

A('Willie Nelson', {
  g: ['outlaw-country', 'jazz'], era: '1970s',
  vox: 'nasal weathered tenor phrasing way behind or ahead of the beat, never on it',
  inst: ['nylon-string guitar with a worn tone', 'harmonica', 'brushed kit', 'piano'],
  prod: ['sparse dry mix', 'live band', 'voice conversational and close'],
  feel: 'loose rubato phrasing over a steady band', bpm: [80, 116],
  write: 'plain philosophical lines about time and the road, few adjectives',
});

A('Chris Stapleton', {
  g: ['outlaw-country', 'blues'], era: 'contemporary',
  vox: 'enormous gravelled baritone with a full-throated soul roar',
  inst: ['overdriven electric guitar', 'Hammond organ', 'live kit', 'acoustic'],
  prod: ['live analogue tracking', 'huge natural dynamics', 'no autotune'],
  feel: 'slow heavy soul-country groove', bpm: [66, 108],
  write: 'plain hard words about drinking, distance and regret',
});

A('Bob Dylan', {
  g: ['indie-folk', 'americana'], era: '1960s',
  vox: 'nasal untrained voice, more talked than sung, phrasing crammed against the bar line',
  inst: ['strummed acoustic', 'harmonica on a rack', 'upright bass', 'organ'],
  prod: ['live one-take recording', 'single room mic', 'no overdubs'],
  feel: 'loose strummed rhythm that follows the words', bpm: [88, 130],
  write: 'long crammed lines, surreal specifics, verses that keep going',
});

A('Joni Mitchell', {
  g: ['indie-folk', 'jazz'], era: '1970s',
  vox: 'clear soprano with wide leaps and precise diction, layered in unusual harmony',
  inst: ['open-tuned acoustic guitar', 'dulcimer', 'fretless bass', 'reeds'],
  prod: ['clean intimate mix', 'complex chord voicings audible', 'natural dynamics'],
  feel: 'shifting rhythm that follows the lyric rather than a grid', bpm: [72, 116],
  write: 'painterly first-person detail, real places and dates, long unrhymed lines',
});

A('Bon Iver', {
  g: ['indie-folk', 'ambient'], era: 'contemporary',
  vox: 'high falsetto stacked into a choir of itself, words half-swallowed',
  inst: ['fingerpicked acoustic', 'processed brass', 'analogue synth', 'auto-tuned harmony as texture'],
  prod: ['cabin room ambience', 'heavy vocal layering', 'tape saturation and drop-outs'],
  feel: 'slow, drifting, arriving late to the bar', bpm: [64, 96],
  write: 'fragmented images, invented compounds, feeling before sense',
});

A('The Lumineers', {
  g: ['indie-folk', 'americana'], era: '2010s',
  vox: 'plain unpolished male lead with a whole room joining the chorus',
  inst: ['strummed acoustic', 'stomp box', 'upright piano', 'cello', 'tambourine'],
  prod: ['live room recording', 'foot stomps and claps as percussion', 'minimal overdubs'],
  feel: 'stomping folk backbeat with everyone singing the hook', bpm: [96, 138],
  write: 'simple singalong chorus, names and small towns in the verses',
});

A('Hozier', {
  g: ['soul', 'indie-folk'], era: 'contemporary',
  vox: 'rich baritone building to a full gospel roar, harmonised with a choir',
  inst: ['blues acoustic guitar', 'Hammond organ', 'stomp percussion', 'backing choir'],
  prod: ['big warm room', 'choir underneath the last chorus', 'analogue warmth'],
  feel: 'slow swampy stomp with handclaps', bpm: [76, 112],
  write: 'literary and religious imagery grounded in bodies and earth',
});

A('Nick Cave', {
  g: ['post-punk', 'cinematic'], era: '1990s onward',
  vox: 'deep intoning baritone, preaching and half-spoken, right on the mic',
  inst: ['upright piano', 'bowed bass', 'sparse drums', 'organ drone'],
  prod: ['dry close recording', 'space around the voice', 'building strings'],
  feel: 'slow funereal pulse, rubato', bpm: [60, 96],
  write: 'biblical and violent narrative, long lines, third-person storytelling',
});

A('Paul Kelly', {
  g: ['americana', 'indie-folk'], era: 'Australian, 1980s onward',
  vox: 'plain conversational Australian voice, unadorned, no vibrato',
  inst: ['acoustic guitar', 'Hammond organ', 'restrained kit', 'harmonica'],
  prod: ['dry uncluttered mix', 'voice front and centre', 'live band'],
  feel: 'steady unhurried mid-tempo', bpm: [92, 124],
  write: 'suburban Australian narrative with street names, dates and small facts',
});

/* ------------------------------------------------------------ hip hop */

A('Kendrick Lamar', {
  g: ['jazz-rap', 'boom-bap'], era: 'contemporary',
  vox: 'flow shifting between registers and characters, pitched up and down, urgent',
  inst: ['live jazz bass', 'free-jazz horns', 'off-grid drums', 'gospel choir stabs'],
  prod: ['organic live-band production', 'shifting beat switches mid-song', 'wide dynamics'],
  feel: 'shifts feel mid-verse, swung and unstable', bpm: [72, 100],
  write: 'dense narrative bars with internal rhyme, moral argument, a turn near the end',
});

A('Nas', {
  g: ['boom-bap', 'jazz-rap'], era: '1990s New York',
  vox: 'measured mid-range flow, clear diction, sitting exactly on the snare',
  inst: ['dusty jazz piano loop', 'upright bass', 'vinyl crackle'],
  prod: ['SP-1200 sampled drums', 'mono-leaning', 'crate-dug loop left raw'],
  feel: 'hard swung boom bap around 90', bpm: [86, 96],
  write: 'cinematic street narrative, dense detail, present tense',
});

A('Drake', {
  g: ['trap', 'contemporary-r-b'], era: 'contemporary',
  vox: 'half-sung half-rapped tenor with light tuning, doubled and panned ad-libs',
  inst: ['sparse sub bass', 'muted keys', 'dark pad', 'pitched vocal sample'],
  prod: ['spacious dark mix', 'very little in the arrangement', 'heavy low end'],
  feel: 'slow half-time trap with lots of rests', bpm: [70, 145],
  write: 'conversational, aggrieved, direct address, short repeated hook',
});

A('Kanye West', {
  g: ['boom-bap', 'trap'], era: '2000s onward',
  vox: 'punchy declamatory flow with big pitched-up soul samples answering',
  inst: ['sped-up soul vocal sample', 'orchestral strings', 'hard kick and snare'],
  prod: ['maximal layered production', 'sample chopped and pitched', 'huge drums'],
  feel: 'hard mid-tempo with a driving sampled loop', bpm: [88, 108],
  write: 'braggadocio cut with sudden honesty, punchlines, a soul-sample hook',
});

A('Outkast', {
  g: ['funk', 'boom-bap'], era: 'late 1990s Southern',
  vox: 'two contrasting voices, one fast and elastic, one drawled and sung',
  inst: ['live bass and horns', 'organ', 'hand percussion', '808'],
  prod: ['live Southern funk band under the drums', 'wide and warm'],
  feel: 'funk-driven bounce with swung hats', bpm: [86, 118],
  write: 'playful, wordy, Southern specifics, sung hooks',
});

A('J. Cole', {
  g: ['boom-bap', 'jazz-rap'], era: 'contemporary',
  vox: 'plain unhurried mid-range flow, conversational, lightly doubled',
  inst: ['soul sample', 'live-feel drums', 'simple piano', 'soft bass'],
  prod: ['warm understated mix', 'sample-led', 'nothing flashy'],
  feel: 'relaxed mid-tempo boom bap', bpm: [80, 96],
  write: 'autobiographical and plain, a lesson drawn at the end',
});

A('Eminem', {
  g: ['boom-bap'], era: '2000s',
  vox: 'nasal high-energy flow, hyper-articulated multisyllabic rhyme, voice contorted',
  inst: ['dark piano loop', 'hard snare', 'simple synth bass'],
  prod: ['dry aggressive mix', 'vocal loud and dead centre', 'triple-tracked punchlines'],
  feel: 'hard driving mid-tempo with relentless syllable density', bpm: [84, 104],
  write: 'multisyllabic internal rhyme, comic and violent, story verses',
});

A('A Tribe Called Quest', {
  g: ['jazz-rap'], era: 'early 1990s',
  vox: 'relaxed low voice trading with a nasal higher one, unhurried',
  inst: ['upright bass loop', 'brushed drums', 'muted trumpet', 'Rhodes'],
  prod: ['warm dusty sampled jazz', 'bass forward', 'nothing hurried'],
  feel: 'laid-back swung 92', bpm: [88, 98],
  write: 'conversational and playful, everyday subjects, call and response',
});

A('Travis Scott', {
  g: ['trap', 'phonk'], era: 'contemporary',
  vox: 'heavily processed melodic vocal drenched in reverb and autotune, ad-libs everywhere',
  inst: ['distorted 808 with long glides', 'dark pad', 'detuned bells'],
  prod: ['cavernous reverb', 'beat switches mid-track', 'crushed low end'],
  feel: 'slow menacing trap with sudden switches', bpm: [130, 150],
  write: 'short repeated phrases used for texture more than meaning',
});

A('Stormzy', {
  g: ['grime', 'drill'], era: 'contemporary London',
  vox: 'commanding London baritone, half shouted, switching to sung gospel passages',
  inst: ['sparse piano', 'square bass', 'gospel choir', 'hard 140 drums'],
  prod: ['dry punchy UK mix', 'bass and vocal only', 'choir on the hook'],
  feel: 'hard grime 140 or a slower gospel half-time', bpm: [86, 142],
  write: 'direct London specifics, faith and class, spoken-word cadence',
});

/* ------------------------------------------------------------ soul, R&B, funk */

A('Stevie Wonder', {
  g: ['funk', 'soul'], era: '1970s',
  vox: 'agile tenor full of improvised runs and joyful shouts, harmonised with itself',
  inst: ['clavinet', 'Moog bass', 'Rhodes', 'harmonica', 'horn section'],
  prod: ['warm analogue mix', 'multi-tracked one-man band', 'tape compression'],
  feel: 'deep syncopated funk locked to the one', bpm: [96, 118],
  write: 'joyful and political at once, plain language, huge singable hook',
});

A('Aretha Franklin', {
  g: ['soul', 'gospel'], era: '1960s',
  vox: 'enormous gospel contralto with improvised runs, backed by a trio answering',
  inst: ['gospel piano', 'horn section', 'melodic bass', 'tambourine'],
  prod: ['live band in one room', 'warm mono-leaning mix', 'voice forward'],
  feel: 'hard soul backbeat with tambourine doubling the snare', bpm: [76, 124],
  write: 'demanding direct address, repeated title, call and response with backing singers',
});

A('Marvin Gaye', {
  g: ['soul', 'neo-soul'], era: '1970s',
  vox: 'silken tenor layered in three parts with a falsetto floating above',
  inst: ['fretless-feel bass', 'Rhodes', 'congas', 'strings', 'flute'],
  prod: ['lush warm mix', 'vocals stacked and panned', 'endless groove'],
  feel: 'relaxed loping groove with congas', bpm: [86, 108],
  write: 'social conscience and desire in the same breath, plain and pleading',
});

A('D\'Angelo', {
  g: ['neo-soul', 'funk'], era: 'late 1990s',
  vox: 'multi-tracked falsetto stacked into a dense choir, words deliberately blurred',
  inst: ['Rhodes with extended chords', 'fat analogue bass', 'live drums dragging far behind'],
  prod: ['warm analogue haze', 'drums deliberately off-grid', 'low-mid heavy'],
  feel: 'drunk-feeling groove where every instrument lands late', bpm: [66, 96],
  write: 'few words, repeated, the voice used as texture',
});

A('SZA', {
  g: ['contemporary-r-b', 'neo-soul'], era: 'contemporary',
  vox: 'light conversational alto sliding into a breathy top, layered in loose harmony',
  inst: ['soft guitar figure', 'sub bass', 'sparse kit', 'ambient pad'],
  prod: ['spacious modern R&B mix', 'lots of air', 'vocal stacks wide'],
  feel: 'unhurried mid-tempo with drums that come and go', bpm: [76, 108],
  write: 'blunt honest self-talk, run-on conversational phrasing',
});

A('Frank Ocean', {
  g: ['contemporary-r-b', 'bedroom-pop'], era: 'contemporary',
  vox: 'soft plain tenor, sometimes pitched, close and unpolished',
  inst: ['sparse electric piano', 'ambient guitar', 'sub bass', 'field recordings'],
  prod: ['minimal, often no drums at all', 'long unresolved sections', 'raw takes'],
  feel: 'free-floating, often without a fixed beat', bpm: [64, 100],
  write: 'memory in exact detail, second person, structure that refuses to repeat',
});

A('James Brown', {
  g: ['funk'], era: '1960s and 1970s',
  vox: 'rasped shouted commands and screams, more rhythm than melody',
  inst: ['clipped wah guitar', 'horn section stabs', 'walking funk bass'],
  prod: ['bone dry mix', 'everything locked to the one', 'live band, no overdubs'],
  feel: 'hard syncopated funk with the emphasis on the downbeat', bpm: [98, 118],
  write: 'chanted commands and counts, almost no narrative',
});

A('Bill Withers', {
  g: ['soul', 'indie-folk'], era: '1970s',
  vox: 'warm plain baritone, unshowy, no runs',
  inst: ['acoustic guitar', 'Rhodes', 'soft bass', 'brushed kit', 'strings'],
  prod: ['warm intimate mix', 'small band', 'no gloss'],
  feel: 'gentle mid-tempo soul groove', bpm: [76, 104],
  write: 'plain everyday language, one repeated phrase carrying all the weight',
});

/* ------------------------------------------------------------ electronic */

A('Daft Punk', {
  g: ['deep-house', 'funk'], era: '1990s and 2000s',
  vox: 'vocoded robot voice repeating a short phrase',
  inst: ['filtered disco loop', 'talkbox', 'analogue synth bass', 'four-to-the-floor kit'],
  prod: ['heavy filter sweeps', 'compressed sampled loops', 'French touch phasing'],
  feel: 'relentless disco four with long filter builds', bpm: [112, 128],
  write: 'a handful of words repeated as a mantra',
});

A('Burial', {
  g: ['uk-garage', 'ambient'], era: '2000s London',
  vox: 'pitched and chopped anonymous vocal fragments, gender ambiguous',
  inst: ['sub bass', 'vinyl crackle', 'rain and city field recordings', 'detuned pad'],
  prod: ['off-grid drums that never quite land', 'muffled and distant', 'heavy noise floor'],
  feel: 'shuffling two-step that drifts out of time', bpm: [130, 138],
  write: 'a few chopped words repeated, meaning left unclear',
});

A('Aphex Twin', {
  g: ['ambient', 'techno'], era: '1990s',
  vox: 'processed wordless vocal texture or none at all',
  inst: ['detuned analogue synth', 'chopped breakbeat', 'granular texture'],
  prod: ['unpredictable structure', 'harsh and beautiful in turns', 'analogue hardware'],
  feel: 'either glacially slow or violently fast, rarely in between', bpm: [60, 170],
  write: 'largely instrumental, no conventional lyric',
});

A('Fred again..', {
  g: ['deep-house', 'uk-garage'], era: 'contemporary',
  vox: 'chopped voice-memo vocal sample, someone speaking, pitched and looped',
  inst: ['warm piano chords', 'rolling sub bass', 'soft percussion'],
  prod: ['field-recording textures woven in', 'emotional build over a simple loop'],
  feel: 'patient house build with a two-step lean', bpm: [124, 138],
  write: 'a single overheard sentence, repeated until it means something else',
});

A('Kraftwerk', {
  g: ['synth-pop', 'techno'], era: '1970s German',
  vox: 'flat vocoded speech, emotionless, in short repeated phrases',
  inst: ['analogue sequencer', 'vocoder', 'electronic percussion', 'simple synth melody'],
  prod: ['clinical clean mix', 'perfect machine timing', 'minimal arrangement'],
  feel: 'rigid machine pulse, no swing at all', bpm: [116, 132],
  write: 'short declarative phrases about machines and travel, repeated',
});

A('The Chemical Brothers', {
  g: ['techno', 'dubstep'], era: '1990s',
  vox: 'shouted repeated phrase, heavily filtered',
  inst: ['acid bassline', 'chopped breakbeat', 'huge distorted synth'],
  prod: ['enormous and distorted', 'long builds and hard drops', 'filtered noise'],
  feel: 'big beat breakbeat with a relentless build', bpm: [116, 138],
  write: 'one phrase shouted over and over',
});

A('Massive Attack', {
  g: ['ambient', 'contemporary-r-b'], era: '1990s Bristol',
  vox: 'low murmured male verse traded with a soaring soulful female chorus',
  inst: ['dub bass', 'string samples', 'slow breakbeat', 'organ'],
  prod: ['dark heavy low end', 'sparse and spacious', 'ominous'],
  feel: 'slow heavy trip-hop breakbeat', bpm: [76, 96],
  write: 'paranoid, minimal, second person, repeated as a chant',
});

A('Flume', {
  g: ['future-bass', 'hyperpop'], era: 'contemporary Australian',
  vox: 'chopped and pitched guest vocal used as a lead instrument',
  inst: ['detuned synth chords', 'granular texture', 'heavy half-time drums'],
  prod: ['extreme sound design', 'huge dynamic drops', 'wide and metallic'],
  feel: 'half-time drop under a bright chopped melody', bpm: [140, 160],
  write: 'short vocal phrases chopped into rhythm',
});

/* ------------------------------------------------------------ metal */

A('Metallica', {
  g: ['heavy-metal', 'metalcore'], era: '1980s',
  vox: 'barked mid-range baritone with a snarl, doubled tight',
  inst: ['fast palm-muted downpicking', 'harmonised twin leads', 'gallop bass'],
  prod: ['dry aggressive mix', 'scooped guitars', 'no reverb on the vocal'],
  feel: 'galloping down-picked eighths with abrupt tempo changes', bpm: [96, 200],
  write: 'anger at institutions, second person accusation, shouted title line',
});

A('Black Sabbath', {
  g: ['doom-metal', 'heavy-metal'], era: '1970s',
  vox: 'nasal wailing tenor doubled an octave with the guitar riff',
  inst: ['detuned fuzz guitar riffs', 'tracking bass', 'loose swung drums'],
  prod: ['murky analogue mix', 'valve amp saturation', 'no click'],
  feel: 'slow heavy swing with sudden double-time sections', bpm: [64, 130],
  write: 'doom-laden plain warnings, short lines, riff-answering phrasing',
});

A('Slipknot', {
  g: ['metalcore'], era: '2000s',
  vox: 'shredded scream against a clean melodic chorus, layered',
  inst: ['drop-tuned riffs', 'junk metal percussion', 'turntable scratches', 'double kick'],
  prod: ['dense wall of sound', 'triggered drums', 'crushed master'],
  feel: 'relentless double kick with half-time breakdowns', bpm: [140, 200],
  write: 'rage in short shouted bursts, repeated gang-chant hook',
});

A('Tool', {
  g: ['prog-rock', 'metalcore'], era: '1990s onward',
  vox: 'controlled mid-range that builds to a roar, layered in unison',
  inst: ['odd-metre riffs', 'melodic lead bass', 'tribal tom patterns'],
  prod: ['huge patient dynamics', 'long instrumental sections', 'wide and dark'],
  feel: 'shifting time signatures, 7/8 and 5/4, slow builds', bpm: [76, 130],
  write: 'oblique and psychological, second person, long instrumental gaps',
});

/* ------------------------------------------------------------ jazz / crooner */

A('Frank Sinatra', {
  g: ['jazz', 'christmas'], era: '1950s',
  vox: 'warm crooning baritone with immaculate phrasing, always slightly behind the beat',
  inst: ['big band brass', 'string section', 'brushed kit', 'upright bass'],
  prod: ['live orchestra in one room', 'warm mono-leaning mix', 'voice at the front'],
  feel: 'swung big-band shuffle or slow rubato ballad', bpm: [66, 150],
  write: 'standards phrasing, plain romantic language, an ironic edge',
});

A('Nina Simone', {
  g: ['jazz', 'soul'], era: '1960s',
  vox: 'deep contralto, half spoken, unhurried and severe',
  inst: ['classical-leaning piano', 'upright bass', 'brushed drums'],
  prod: ['live club recording', 'audience audible', 'no gloss'],
  feel: 'rubato piano leading the band', bpm: [60, 120],
  write: 'plain political statement, repetition used as pressure',
});

A('Miles Davis', {
  g: ['jazz'], era: '1950s and 1960s',
  vox: 'instrumental, no vocal',
  inst: ['muted trumpet', 'upright bass', 'brushed ride', 'sparse piano comping'],
  prod: ['live quintet, one room', 'natural balance', 'space left everywhere'],
  feel: 'modal, unhurried, built on rests', bpm: [60, 140],
  write: 'instrumental — no lyric at all',
});

A('Norah Jones', {
  g: ['jazz', 'americana'], era: '2000s',
  vox: 'soft low alto, close-miked, conversational and unhurried',
  inst: ['acoustic piano', 'brushed kit', 'upright bass', 'pedal steel'],
  prod: ['warm intimate mix', 'analogue and quiet', 'small band'],
  feel: 'slow relaxed shuffle', bpm: [66, 100],
  write: 'plain quiet observation, no big statements',
});

/* ------------------------------------------------------------ global */

A('Bob Marley', {
  g: ['reggae', 'dub'], era: '1970s',
  vox: 'warm patois tenor with a harmony trio answering every line',
  inst: ['skanking offbeat guitar', 'deep melodic bass', 'bubble organ', 'horns'],
  prod: ['bass-heavy warm mix', 'spring reverb', 'tape echo on the snare'],
  feel: 'one-drop with the kick on the three', bpm: [72, 92],
  write: 'plain proverbs and direct encouragement, repeated hook',
});

A('Fela Kuti', {
  g: ['afrobeats', 'funk'], era: '1970s Nigerian',
  vox: 'call-and-response chant between a lead and a large chorus, pidgin English',
  inst: ['horn section riffs', 'interlocking guitars', 'congas and shekere', 'organ'],
  prod: ['live band recorded hot', 'long grooves that never change', 'raw and warm'],
  feel: 'polyrhythmic afrobeat groove held for many minutes', bpm: [100, 124],
  write: 'political chant, one line repeated by the chorus, pidgin phrasing',
});

A('Burna Boy', {
  g: ['afrobeats', 'dancehall'], era: 'contemporary Nigerian',
  vox: 'relaxed melodic tenor with pidgin inflection and a slight rasp',
  inst: ['log drum', 'plucked guitar figure', 'shakers', 'horn stabs'],
  prod: ['bright airy mix', 'space between every element'],
  feel: 'unhurried afrobeats swing', bpm: [98, 112],
  write: 'easy repeated hooks, pidgin phrases, pride and grievance mixed',
});

A('Buena Vista Social Club', {
  g: ['bossa-nova', 'flamenco'], era: '1950s Cuban',
  vox: 'weathered old voices trading verses in Spanish, harmonised loosely',
  inst: ['tres guitar', 'upright bass', 'congas', 'piano montuno', 'trumpet'],
  prod: ['live room recording', 'warm analogue', 'no separation'],
  feel: 'son cubano clave groove', bpm: [92, 130],
  write: 'Spanish-language nostalgia, place names, refrain repeated by the group',
});

A('Sigur Rós', {
  g: ['ambient', 'cinematic'], era: 'contemporary Icelandic',
  vox: 'bowed high falsetto singing in invented syllables, wordless and enormous',
  inst: ['bowed electric guitar', 'glockenspiel', 'string section', 'slow-building drums'],
  prod: ['vast reverb', 'extremely slow builds', 'huge dynamic range'],
  feel: 'glacial, building over many minutes', bpm: [56, 84],
  write: 'wordless or invented language, no literal meaning',
});

/* ------------------------------------------------------------ lookup */

const ARTIST_LIST = Object.values(ARTISTS);

function findArtist(text) {
  if (!text) return null;
  const q = String(text).toLowerCase().trim();
  const k = q.replace(/[^a-z0-9]+/g, '');
  if (ARTISTS[k]) return ARTISTS[k];
  let hit = ARTIST_LIST.find((a) => a.key.startsWith(k) && k.length >= 4);
  if (hit) return hit;
  hit = ARTIST_LIST.find((a) => k.length >= 4 && a.key.includes(k));
  return hit || null;
}

/* Every string a generated prompt must never contain.

   Full names only. Splitting them into words looks more thorough but flags
   ordinary English — "Talking Heads" would condemn any lyric containing the
   word "talking". The words the user typed are checked separately, and more
   aggressively, because that is where a name would actually leak in from. */
function artistNameTokens() {
  return new Set(ARTIST_LIST.map((a) => a.name.toLowerCase()));
}
