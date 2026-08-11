/* ==========================================================================
   data-lexicon.js — the words
   --------------------------------------------------------------------------
   The lyric engine does not assemble lines out of adjectives. Every line in
   here is written out by hand, in stanzas that already scan and already
   rhyme, with slots for the things that should change between songs.

   Slot syntax inside a line:
     {PROP} {PLACE} {PERSON} {TIME} {DETAIL} {ACT}  — drawn from the domain
     {SUBJ}                                        — the user's own theme noun
     {a|b|c}                                       — pick one of these

   Two house rules the engine relies on:
     · lines 1 and 3 of a stanza may end on a slot; lines 2 and 4 end on a
       fixed word, so the rhyme survives whatever gets substituted in
     · PROP and PLACE are bare noun phrases that read correctly after "the",
       and every line that uses them supplies its own article
     · a line referring to {PERSON} says "they", because the person pools mix
       men and women
   ========================================================================== */

/* Phrases that make a lyric read as machine-written. The engine will not emit
   a line containing any of them, and the app checks the final draft too. */
const CLICHES = [
  'neon', 'shadows dance', 'dancing shadows', 'echoes of', 'echoes through', 'whispers of',
  'in my veins', 'through my veins', 'ashes', 'phoenix', 'rise from the', 'tapestry',
  'symphony of', 'kaleidoscope', 'labyrinth', 'ethereal', 'celestial', 'cosmic',
  'in the silence', 'chasing the horizon', 'chase the horizon', 'endless night',
  'burning bright', 'fire in my soul', 'fire within', 'shattered pieces', 'broken pieces',
  'we are the ones', 'we will rise', 'unbreakable', 'infinite sky', 'stardust',
  'painted skies', 'crimson', 'azure', 'velvet night', 'silhouette', 'reverie',
  'my heart beats', 'heartbeat of', 'soul on fire', 'electric soul',
  'a thousand miles away', 'against all odds', 'the depths of my', 'lost in the moment',
  'time stands still', 'frozen in time', 'like a dream', 'wildest dreams',
  'take my hand', 'hold me close tonight', 'forever and always', 'til the end of time',
  'raging storm', 'storm inside', 'weathered the storm', 'flames of', 'ember',
  'let the music play', 'feel the beat', 'lost in the rhythm', 'dance the night away',
];

const DOMAINS = {};

function D(id, o) {
  o.id = id;
  DOMAINS[id] = o;
  return o;
}

/* ------------------------------------------------------------------ leaving */

D('leaving', {
  label: 'Leaving',
  match: ['leave', 'leaving', 'left', 'goodbye', 'moving out', 'move out', 'run away', 'runaway',
    'escape', 'gone', 'walked out', 'quit', 'get out', 'departure', 'packing', 'moved on'],
  props: ['spare key', 'packed bag', 'last box', 'old coat', 'folded map', 'good pan', 'chipped mug', 'blue kettle'],
  places: ['the driveway', 'the on-ramp', 'the state line', 'the truck stop', 'the old flat', 'the bus depot', 'the front step', 'the car park'],
  people: ['your mother', 'my brother', 'the neighbours', 'the bloke next door', 'your sister', 'the landlord'],
  times: ['four in the morning', 'a quarter past three', 'the last week of June', 'the middle of March', 'half past two', 'the second of the month'],
  details: ['The heater was still broken', 'One shoe was on the porch', 'The coffee had gone cold', 'The dog watched from the step', 'The tap was still running', 'The radio was still on'],
  acts: ['packed the car', 'locked the door', 'left the light on', 'sold the bed', 'burned the letters', 'changed the locks'],
  titles: ['Not Coming Back For It', 'Leave The Light On', 'Forty Miles', 'By The Time You Woke', 'The {PROP}', 'Turns Out I Could'],
  verse: [
    ['It was {TIME} when I went.', 'I left the porch light on.', '{DETAIL}.', 'By the time you woke I was gone.'],
    ['I only took the {PROP}', 'and the coat I never wore.', 'Everything we bought together', 'is still sitting by the door.'],
    ['{PERSON} rang me twice about it.', 'I let it ring right through.', 'There is nothing left to say about it', 'that I have not said to you.'],
    ['I got as far as {PLACE}', 'before I pulled off to think.', '{DETAIL}.', 'I sat there and I did not drink.'],
    ['I {ACT} before I lost my nerve', 'and drove out past the mill.', '{DETAIL}.', 'You are probably asleep there still.'],
  ],
  pre: [
    ['There is a moment where you go or you do not.', 'I went.'],
    ['Count to ten and see if I turn round.', 'Keep counting.'],
  ],
  chorus: [
    ['I am not coming back for it.', 'Not the {PROP}, not the rest.', 'I am not coming back for it.', 'I already took the best.'],
    ['Leave the light on if you like.', 'I am too far down the line.', 'Leave the light on if you like.', 'It was never mine.'],
    ['Forty miles and counting.', 'Nothing in the mirror but the rain.', 'Forty miles and counting.', 'I am not turning round again.'],
    ['I said I would go and I went.', 'You never thought I would.', 'I said I would go and I went.', 'Turns out I could.'],
  ],
  bridge: [
    ['I kept the {PROP}.', 'I do not know what that means.', 'Three years in the glovebox', 'with the maps and the magazines.'],
    ['{PERSON} says you ask about me.', 'Tell them I am all right.', 'Tell them the car still runs', 'and I still leave on the light.'],
  ],
  outro: [
    ['By the time you woke I was gone.', 'By the time you woke.'],
    ['Leave the light on if you like.', 'Leave it on.'],
  ],
});

/* --------------------------------------------------------------------- love */

D('love', {
  label: 'Love',
  match: ['love', 'in love', 'falling', 'devotion', 'romance', 'crush', 'together', 'wedding',
    'marry', 'anniversary', 'partner', 'girlfriend', 'boyfriend', 'wife', 'husband', 'adore'],
  props: ['bad handwriting', 'good knife', 'green jumper', 'reading glasses', 'second pillow', 'bent teaspoon', 'spare toothbrush'],
  places: ['the laundromat', 'the bottle shop', 'your mother’s kitchen', 'the back seat', 'the bus stop on Grey Street', 'the shop on the corner', 'the fire escape'],
  people: ['your father', 'my flatmate', 'the woman at the counter', 'your best mate', 'the bloke who fixed the car'],
  times: ['a wet Tuesday', 'the first cold week', 'half past six', 'the summer we were broke', 'the night the power went out'],
  details: ['You laugh before the joke lands', 'You steal the blanket every night', 'You cannot park to save your life', 'You sing the wrong words on purpose', 'You leave the cupboards open'],
  acts: ['made the tea wrong', 'fell asleep sitting up', 'drove me to the airport', 'waited in the rain', 'held the ladder'],
  titles: ['The Good Knife', 'Wet Tuesday', 'You Cannot Park', 'Second Pillow', 'Nothing Clever', 'Stay Where You Are'],
  verse: [
    ['{DETAIL}.', 'You have done it since we met.', '{DETAIL}.', 'I have not asked you to stop yet.'],
    ['We met outside {PLACE}', 'in a jacket two sizes wrong.', 'You said something about the weather.', 'I have been agreeing all along.'],
    ['I am not good at saying it', 'so I {ACT} instead.', 'You know what I mean by it.', 'You have known since {TIME}, you said.'],
    ['{PERSON} asked what I see in you.', 'I could not make a list.', 'It is not one big thing, it is the {PROP}', 'and the way you take the piss.'],
    ['We have got no money and a broken chair', 'and a landlord who does not care.', '{DETAIL}.', 'I would not move it anywhere.'],
  ],
  pre: [
    ['And I am not clever with this,', 'so here it is plain.'],
    ['Say the word and I will stay put.', 'Say it again.'],
  ],
  chorus: [
    ['Stay where you are.', 'I like you exactly there.', 'Stay where you are.', 'I am not going anywhere.'],
    ['Nothing clever, nothing new,', 'nothing they have not said.', 'Nothing clever, nothing new.', 'Just you, and the wrong side of the bed.'],
    ['I would take the long way home', 'if you were in the car.', 'I would take the long way home.', 'That is how it is. That is what you are.'],
    ['You are the good knife in the drawer.', 'You are the one I reach for first.', 'You are the good knife in the drawer.', 'Everything else is worse.'],
  ],
  bridge: [
    ['I have thought about the day you go.', 'I think about it more than most.', 'And then you {ACT}', 'and I stop being a ghost.'],
    ['Nobody warned me it would be this small.', 'A cup of tea. A shut front door.', 'Nobody warned me it would be this good.', 'I would not ask for more.'],
  ],
  outro: [
    ['Stay where you are.', 'Stay.'],
    ['Just you, and the wrong side of the bed.', 'Just you.'],
  ],
});

/* --------------------------------------------------------------- heartbreak */

D('heartbreak', {
  label: 'Heartbreak',
  match: ['heartbreak', 'broken heart', 'breakup', 'break up', 'dumped', 'cheating', 'cheated',
    'lost her', 'lost him', 'over you', 'get over', 'missing you', 'miss you', 'she left', 'he left', 'divorce'],
  props: ['wine glass you liked', 'shirt in the wash', 'photo on the fridge', 'hair tie on the sink', 'jumper you forgot'],
  places: ['the corner shop', 'the flat above the bakery', 'the pub we never went to twice', 'the platform at Central', 'the car park at work', 'the beach in winter'],
  people: ['your mother', 'my sister', 'our friends', 'the woman you work with', 'my mate Dave'],
  times: ['a fortnight now', 'since the second of May', 'about eleven at night', 'every Sunday', 'the first week'],
  details: ['I still buy the bread you like', 'I still sleep on my side', 'Your name is still in my phone', 'The plant you hated is doing well', 'I have not moved the photo'],
  acts: ['drove past the house', 'deleted it and typed it again', 'told them we were fine', 'kept the receipt', 'left it ringing'],
  titles: ['Your Half Of The Bed', 'Doing Well', 'Still Buy The Bread', 'A Fortnight Now', 'Nothing To Report', 'The Plant You Hated'],
  verse: [
    ['{DETAIL}.', 'It is {TIME}, give or take.', '{DETAIL}.', 'I am fine. I am fine for your sake.'],
    ['I saw you outside {PLACE}.', 'You did not see me at all.', 'I stood behind a parked car', 'like a coward by the wall.'],
    ['{PERSON} says you are doing well.', 'They meant it to be kind.', 'I said that I was pleased for you', 'and then it sat there in my mind.'],
    ['I {ACT} last week.', 'I am not proud of it.', '{DETAIL}.', 'That is the whole of it.'],
    ['Everyone keeps asking me', 'and I keep saying fine.', 'They have stopped asking now,', 'and that is a harder line.'],
  ],
  pre: [
    ['And it is not the big things,', 'it is the shape of the day.'],
    ['I had a whole speech ready.', 'Never got to say it.'],
  ],
  chorus: [
    ['Your half of the bed is cold', 'and I am not touching it.', 'Your half of the bed is cold.', 'Nothing to report. That is it.'],
    ['I am doing well, I am doing well.', 'That is what I tell them all.', 'I am doing well, I am doing well.', 'I say it to the wall.'],
    ['I still buy the bread you like.', 'It goes green on the shelf.', 'I still buy the bread you like.', 'I am not doing it for myself.'],
    ['You did not break anything.', 'You took your coat and went.', 'You did not break anything', 'except the way the evening spent.'],
  ],
  bridge: [
    ['I met someone in {TIME}.', 'She is kind. She is not you.', 'I said your name once by mistake', 'and she was kind about that too.'],
    ['I am not asking you to come back.', 'I would not know where to put you.', 'I am asking you to be less easy to find', 'in everything I walk through.'],
  ],
  outro: [
    ['Nothing to report.', 'Nothing to report.'],
    ['I am doing well.', 'I am doing well.'],
  ],
});

/* --------------------------------------------------------------------- work */

D('work', {
  label: 'Work & money',
  match: ['work', 'job', 'money', 'broke', 'rent', 'boss', 'grind', 'hustle', 'shift', 'factory',
    'office', 'wages', 'poor', 'bills', 'overtime', 'labour', 'labor', 'nine to five', 'warehouse'],
  props: ['high-vis vest', 'yellow docket', 'cold thermos', 'good boots', 'torn payslip', 'ute keys', 'foam earplug'],
  places: ['the loading dock', 'the site on Mercer Road', 'the depot', 'the servo at five', 'the back of the warehouse', 'the smoko shed'],
  people: ['the foreman', 'the bloke on nights', 'my old man', 'the girl in payroll', 'the agency'],
  times: ['half past four', 'a Sunday double', 'the last week of the month', 'twelve hours in', 'every second Thursday'],
  details: ['The van does not start in the cold', 'The kettle takes nine minutes', 'They changed the roster again', 'The rent went up in April', 'The light in the shed still flickers'],
  acts: ['signed for the overtime', 'counted it twice', 'sold the trailer', 'took the extra shift', 'worked through the break'],
  titles: ['Half Past Four', 'The Good Boots', 'Twelve Hours In', 'Counted It Twice', 'Same Yellow Docket', 'Not Tired, Just Old'],
  verse: [
    ['Up at {TIME} in the dark.', 'The kettle and the news.', '{DETAIL}.', 'Same road, same boots, same shoes.'],
    ['{PERSON} says there is more work coming.', 'They have said that for a year.', '{DETAIL}.', 'I keep turning up here.'],
    ['I {ACT} on Friday', 'and it still came up short.', 'You can do the numbers all you like,', 'the numbers do not care what you thought.'],
    ['There is a bloke at {PLACE}', 'been there since eighty-four.', 'He says it does not get easier,', 'you just stop keeping score.'],
    ['My old man did the same trade.', 'He never once complained.', 'I complain about it plenty', 'and I still get up again.'],
  ],
  pre: [
    ['And the light comes up over the yard,', 'and that is the whole of the reward.'],
    ['Clock in. Clock out.', 'That is the argument.'],
  ],
  chorus: [
    ['Half past four and the kettle is on.', 'Nobody made me. I go.', 'Half past four and the kettle is on.', 'That is all anybody needs to know.'],
    ['I am not tired, I am old.', 'There is a difference in the bone.', 'I am not tired, I am old', 'and the truck still gets me home.'],
    ['Count it twice, it is the same.', 'Count it twice, it is the same.', 'I am not asking for a raise.', 'I am asking for my name.'],
    ['Same yellow docket, same blue pen.', 'Same signature again.', 'Same yellow docket, same blue pen.', 'Tell me when it ends. Tell me when.'],
  ],
  bridge: [
    ['They put a sign up in the smoko shed:', 'SAFETY IS EVERYONE’S JOB.', 'Someone crossed out EVERYONE’S', 'and nobody took it off.'],
    ['I am not proud of the work exactly.', 'I am proud that it gets made.', 'There is a difference in there somewhere.', 'I will find it when I am paid.'],
  ],
  outro: [
    ['Half past four and the kettle is on.', 'The kettle is on.'],
    ['Count it twice.', 'It is the same.'],
  ],
});

/* ----------------------------------------------------------------- hometown */

D('hometown', {
  label: 'Hometown & memory',
  match: ['hometown', 'home town', 'small town', 'childhood', 'growing up', 'grew up', 'nostalgia',
    'memory', 'memories', 'the old days', 'back home', 'where i grew', 'village', 'suburb', 'my street'],
  props: ['bent bike wheel', 'school jumper', 'two-dollar coin', 'good cricket bat', 'milk crate', 'front letterbox'],
  places: ['the oval', 'the bottle shop on the corner', 'the creek behind the school', 'the old picture theatre', 'the roundabout', 'the pool that shut in ninety-nine'],
  people: ['Mrs Doyle next door', 'my cousin Ray', 'the kid from number nine', 'the postie', 'the bloke who ran the shop'],
  times: ['the summer of ninety-eight', 'the school holidays', 'before the highway went through', 'a Saturday in February'],
  details: ['They knocked the bakery down', 'The pool has been shut for years', 'The oval floods every winter', 'Nobody locks the back gate', 'The pub changed hands again'],
  acts: ['rode home in the dark', 'jumped the fence at the pool', 'carved my name in the rail', 'walked the long way round'],
  titles: ['The Pool That Shut', 'Before The Highway', 'Number Nine', 'Everything Is Smaller', 'Same Roundabout', 'Back Of The Oval'],
  verse: [
    ['{DETAIL}.', 'My mother told me on the phone.', 'I have not been back since {TIME}.', 'I do not know why I have not gone.'],
    ['We used to {ACT}', 'and nobody ever asked.', '{PERSON} would wave us in for tea', 'and we would eat it standing up, and fast.'],
    ['I drove through in April.', 'I did not stop at all.', '{DETAIL}.', 'Everything is smaller. That is all.'],
    ['{PLACE} is a car park now.', 'They kept the old brick wall.', 'You can still see where the sign was.', 'That is something, after all.'],
    ['Half of them are still there.', 'Half of them are not.', 'The ones who stayed will tell you', 'they are the ones who got the lot.'],
  ],
  pre: [
    ['And it is not that I want it back.', 'I would just like to see it once.'],
    ['Nothing happened here.', 'That was the best part.'],
  ],
  chorus: [
    ['Everything is smaller than it was', 'and the trees have grown up tall.', 'Everything is smaller than it was.', 'I am the thing that changed. That is all.'],
    ['Same roundabout, same wrong turn.', 'Same shop, same closing time.', 'Same roundabout, same wrong turn.', 'It stopped being mine.'],
    ['Take me down past {PLACE}', 'where the fence still has the gap.', 'Take me down past {PLACE}.', 'I will find it on a map.'],
    ['We had nothing here to do', 'and we did it every day.', 'We had nothing here to do.', 'I would not have had it any other way.'],
  ],
  bridge: [
    ['{PERSON} died in the winter.', 'Half the town came out.', 'Nobody said a clever thing.', 'Nobody needed to. That is the town.'],
    ['I told my kid about the creek.', 'She asked me if we could go.', 'I said the water is not clean.', 'She got her shoes. So.'],
  ],
  outro: [
    ['Everything is smaller than it was.', 'That is all.'],
    ['Same roundabout.', 'Same wrong turn.'],
  ],
});

/* -------------------------------------------------------------------- night */

D('night', {
  label: 'Night out',
  match: ['party', 'night out', 'club', 'dancing', 'dance', 'friday', 'saturday night', 'drinks',
    'bar', 'pub', 'celebrate', 'birthday', 'weekend', 'rave', 'nightlife', 'up all night'],
  props: ['cloakroom ticket', 'dead phone', 'taxi voucher', 'paper wristband', 'coat somebody swapped'],
  places: ['the back room', 'the smoking area', 'the taxi rank', 'the kebab shop on the corner', 'the stairs by the toilets', 'the bus stop at four'],
  people: ['Danny', 'the girl from the smoking area', 'the bouncer', 'my sister', 'a bloke called Wes'],
  times: ['about half one', 'before the lights came up', 'the wrong side of three', 'ten minutes to close'],
  details: ['Nobody could find the coats', 'My phone died at midnight', 'The taxi never came', 'Somebody was crying by the stairs', 'The bass was too loud to talk'],
  acts: ['lost the group at the bar', 'danced to a song I hate', 'gave my jacket away', 'walked home in the wrong shoes'],
  titles: ['Half One', 'Wrong Shoes', 'Nobody Found The Coats', 'Ten To Close', 'Somebody’s Jacket', 'One More And Then Home'],
  verse: [
    ['It was {TIME} when it turned.', 'You know the way it does.', '{DETAIL}.', 'Nobody said what it was.'],
    ['{PERSON} got us in the back way.', 'We were not on the list.', 'I {ACT}', 'and I am not sure what I missed.'],
    ['{DETAIL}.', 'So we went outside to talk.', 'We stood in {PLACE}', 'and we talked for half the block.'],
    ['I do not like this song at all.', 'I know every word.', 'That is the trouble with a Friday,', 'nothing goes the way you heard.'],
    ['I said one more and then home.', 'I have said it every week.', 'The one more is the whole night', 'and the home is a thing I speak.'],
  ],
  pre: [
    ['And the lights are about to come up.', 'Not yet. Not yet.'],
    ['Somebody put it on again.', 'Somebody put it on.'],
  ],
  chorus: [
    ['One more and then home.', 'One more and then home.', 'I have been saying it since {TIME}.', 'Nobody is going home.'],
    ['I am wearing somebody’s jacket', 'and I do not know whose.', 'I am wearing somebody’s jacket', 'and the wrong pair of shoes.'],
    ['Nobody found the coats.', 'Nobody found the door.', 'Nobody found the coats', 'and we went round once more.'],
    ['Turn it up, I know this one.', 'Turn it up, I do.', 'Turn it up, I know this one', 'and so do you.'],
  ],
  bridge: [
    ['At four o’clock the lights came up', 'and the room went very small.', 'Somebody put a coat around me.', 'I never found out whose at all.'],
    ['We will be terrible tomorrow.', 'We know what it is going to cost.', 'We are paying it in advance', 'and we are counting it as won, not lost.'],
  ],
  outro: [
    ['One more and then home.', 'One more.'],
    ['Nobody is going home.', 'Nobody.'],
  ],
});

/* -------------------------------------------------------------------- grief */

D('grief', {
  label: 'Grief & loss',
  match: ['grief', 'loss', 'died', 'death', 'funeral', 'passed away', 'mourning', 'gone forever',
    'lost my', 'in memory', 'remember him', 'remember her', 'cancer', 'graveside', 'widow'],
  props: ['good jacket', 'wooden box', 'card she never sent', 'tin of buttons', 'box of tools', 'reading glasses'],
  places: ['the hospital car park', 'the church on Ellis Street', 'the front room', 'the back shed', 'the plot by the fence'],
  people: ['my mother', 'the nurse with the kind face', 'his brother', 'the priest', 'my aunt'],
  times: ['the eleventh of June', 'a Wednesday afternoon', 'about four in the morning', 'the second week'],
  details: ['His tools are still in the shed', 'Nobody has cleaned out the room', 'The kettle is where she left it', 'His name is still on the account', 'The garden has gone over'],
  acts: ['carried it out to the car', 'sat in the shed for an hour', 'answered the phone as him', 'kept the last message'],
  titles: ['The Back Shed', 'Still On The Account', 'Eleventh Of June', 'His Good Jacket', 'Nobody Cleaned The Room', 'Not Yet, Not Today'],
  verse: [
    ['{DETAIL}.', 'We have not touched a thing.', '{DETAIL}.', 'Nobody has said anything.'],
    ['I {ACT} on Sunday', 'and I sat there in the cold.', 'You would have told me to come in.', 'You would have told me off. You told.'],
    ['{PERSON} rang about the paperwork.', 'They were kind about it all.', 'There is a form for everything', 'except the walking down the hall.'],
    ['It was {TIME}.', 'The room was very still.', 'I was holding the wrong hand', 'and I am holding it still.'],
    ['They said it would come in waves.', 'They did not say how long.', 'It comes in at {PLACE}', 'in the middle of a song.'],
  ],
  pre: [
    ['And I am all right most of it.', 'Most of it. Not all.'],
    ['Do not ask me how I am.', 'Ask me something else.'],
  ],
  chorus: [
    ['The {PROP} is still in the hall', 'and I walk past it every day.', 'The {PROP} is still in the hall.', 'I am not moving it today.'],
    ['You are still on the account.', 'The bank has not been told.', 'You are still on the account', 'and I like it, and it is cold.'],
    ['I keep the shed exactly right.', 'I keep it like you would.', 'I keep the shed exactly right.', 'You would say it is good.'],
    ['I am not looking for a sign.', 'I would take one if it came.', 'I am not looking for a sign.', 'I say the whole of your name.'],
  ],
  bridge: [
    ['My daughter has your laugh.', 'She does not know she does.', 'I have not told her yet.', 'I do not want to make it what it was.'],
    ['I found a card you never sent.', 'You had written half a line.', 'You were always slow at that.', 'I finished it. I put your name and mine.'],
  ],
  outro: [
    ['I am not moving it yet.', 'Not yet.'],
    ['You are still on the account.', 'Still on the account.'],
  ],
});

/* --------------------------------------------------------------------- vice */

D('vice', {
  label: 'Drink & recovery',
  match: ['drinking', 'drunk', 'alcohol', 'whiskey', 'whisky', 'sober', 'sobriety', 'addiction',
    'addict', 'recovery', 'relapse', 'rehab', 'clean', 'quit drinking', 'pills', 'smoking', 'gambling'],
  props: ['green chip', 'bar mat', 'plastic cup of tea', 'folded list', 'set of keys I handed over'],
  places: ['the church hall on Tuesdays', 'the front bar', 'the bottle shop', 'the car park at eight', 'the back row'],
  people: ['my sponsor', 'the bloke who does the tea', 'my brother', 'the doctor', 'the woman who runs it'],
  times: ['ninety days', 'a year in August', 'six weeks', 'the second Tuesday', 'four in the afternoon'],
  details: ['They put the biscuits out at seven', 'The urn takes ages to boil', 'Nobody claps, they just nod', 'The chairs are always in a ring', 'Somebody always cries at the back'],
  acts: ['gave the keys to my brother', 'poured it down the sink', 'sat in the car and did not go in', 'told the truth for once'],
  titles: ['Ninety Days', 'The Urn Takes Ages', 'Green Chip', 'Nobody Claps', 'The Long Way Past The Shop', 'Second Tuesday'],
  verse: [
    ['{DETAIL}.', 'I get there at half seven now.', 'I sat in the car eleven weeks', 'before I worked out how.'],
    ['I {ACT} in April.', 'I meant it at the time.', 'I meant it again in August', 'and that one held. That one is mine.'],
    ['{PERSON} does not make a speech.', 'They put the kettle on.', '{DETAIL}.', 'And then another week is gone.'],
    ['I walk the long way past {PLACE}', 'and I know exactly why.', 'It is not that I am frightened of it.', 'It is that I would not even try.'],
    ['You would not know to look at me.', 'That was always the trick.', 'I did the job, I paid the rent,', 'and I was very, very sick.'],
  ],
  pre: [
    ['And it is only today.', 'It has only ever been today.'],
    ['Ask me again tomorrow.', 'Ask me then.'],
  ],
  chorus: [
    ['{TIME} and counting.', 'Nobody claps, they nod.', '{TIME} and counting.', 'That is between me and the odds.'],
    ['I take the long way past the shop.', 'It adds four minutes on.', 'I take the long way past the shop', 'and then the day is done.'],
    ['I am not fixed, I am here.', 'That is the whole of the claim.', 'I am not fixed, I am here', 'and I will be here again.'],
    ['Green chip in my pocket.', 'I turn it like a stone.', 'Green chip in my pocket.', 'It is the only thing I own.'],
  ],
  bridge: [
    ['My daughter poured me lemonade', 'in a glass I used to use.', 'She did not know what she was doing.', 'I drank the whole thing. I did not lose.'],
    ['There is a man who does the chairs.', 'He has been coming twenty years.', 'I asked him when it stops.', 'He laughed and said it does not. Cheers.'],
  ],
  outro: [
    ['Nobody claps, they nod.', 'They nod.'],
    ['Only today.', 'Only today.'],
  ],
});

/* --------------------------------------------------------------------- road */

D('road', {
  label: 'The road',
  match: ['road', 'driving', 'drive', 'highway', 'travel', 'journey', 'trip', 'truck', 'train',
    'distance', 'long distance', 'far away', 'miles', 'wandering', 'touring', 'tour'],
  props: ['paper map', 'good sunglasses', 'cassette I keep', 'esky in the back', 'servo coffee', 'toll receipt'],
  places: ['the highway', 'a servo outside town', 'the long straight past the silos', 'the rest stop with the tap', 'the bridge at the state line', 'the truck bay'],
  people: ['a bloke at the pump', 'the woman on the counter', 'my brother on the phone', 'a hitcher near the bridge'],
  times: ['eleven hours in', 'before it got light', 'the far side of noon', 'somewhere past midnight'],
  details: ['The aircon only works on high', 'The radio drops out past the range', 'There is one road and it is straight', 'The map is out of date by years', 'Nothing has moved for an hour'],
  acts: ['drove through the night', 'stopped for a coffee I did not want', 'slept in the back at a truck bay', 'took the turn-off twice'],
  titles: ['Eleven Hours In', 'Past The Silos', 'One Road, Straight', 'The Radio Drops Out', 'Truck Bay', 'Nothing Has Moved'],
  verse: [
    ['{TIME} and the light is going.', 'There is nothing on the dial.', 'I have got the {PROP} on the seat', 'and I have not touched it in a while.'],
    ['I stopped at {PLACE}.', '{PERSON} asked me where I was bound.', 'I said the name of a town', 'and they said, that is a fair way round.'],
    ['{DETAIL}.', 'You get used to that out here.', 'The trick is not to fight it.', 'The trick is another year.'],
    ['I {ACT} on Thursday.', 'I am not proud of that.', 'The seat has got the shape of me', 'and the dash has got my hat.'],
    ['There is one road and it is straight', 'and the silos come and go.', 'You can think a whole life through', 'between one town and the next. Slow.'],
  ],
  pre: [
    ['And the white line does the counting.', 'I have stopped keeping score.'],
    ['Another hundred and then a break.', 'Another hundred.'],
  ],
  chorus: [
    ['{TIME}, still going.', 'Nothing behind me but the heat.', '{TIME}, still going.', 'I have not left this seat.'],
    ['One road, straight, and the silos.', 'One road, straight, and the sun.', 'One road, straight, and the silos.', 'Wake me when it is done.'],
    ['The radio drops out past the range', 'so I sing the rest alone.', 'The radio drops out past the range.', 'It is that or the telephone.'],
    ['I am not running from a thing.', 'I like the way it moves.', 'I am not running from a thing.', 'I have got nothing left to prove.'],
  ],
  bridge: [
    ['I rang you from {PLACE}.', 'You were half asleep and slow.', 'I did not have a reason.', 'I did not have much to say. I know.'],
    ['There is a point about three in the morning', 'where the road starts to talk back.', 'You answer it, you keep on driving.', 'You do not tell anyone that.'],
  ],
  outro: [
    ['One road, straight.', 'One road.'],
    ['Wake me when it is done.', 'Wake me.'],
  ],
});

/* ----------------------------------------------------------------- defiance */

D('defiance', {
  label: 'Defiance',
  match: ['fight', 'anger', 'angry', 'protest', 'revenge', 'rebel', 'stand up', 'resist', 'injustice',
    'betrayal', 'betrayed', 'lied', 'liar', 'enemy', 'strike', 'rise up', 'revolution', 'power'],
  props: ['letter they sent', 'folded notice', 'sign we made', 'minutes of the meeting', 'list we all signed'],
  places: ['the town hall steps', 'the gate at seven', 'the depot road', 'the car park out the front', 'the back of the room'],
  people: ['the man from the office', 'the union rep', 'the councillor', 'my neighbour', 'the bloke in the suit'],
  times: ['the fourteenth of the month', 'six in the morning', 'the week after Easter', 'the day they told us'],
  details: ['They sent it in the post', 'They did not use our names', 'They put it up on a Friday', 'They said it was a consultation', 'They had it decided already'],
  acts: ['stood at the gate at seven', 'read it out to the room', 'signed the whole list myself', 'sat in the front row'],
  titles: ['They Sent It In The Post', 'Seven At The Gate', 'Not Your Consultation', 'We Kept The Letter', 'Say It To My Face', 'Fourteenth Of The Month'],
  verse: [
    ['{DETAIL}.', 'They did that on purpose too.', '{DETAIL}.', 'We know what a Friday means. We knew.'],
    ['{PERSON} came down to explain it.', 'They would not take a chair.', 'They said it was regrettable.', 'They said it standing there.'],
    ['I {ACT}', 'and I would do it all again.', 'They can put it in the paper.', 'They can spell my name. And then?'],
    ['They think that we will get tired.', 'They have got that part right.', 'We are tired. We have been tired for years.', 'We are still out here tonight.'],
    ['There were nine of us at {TIME}.', 'There were forty by the noon.', 'Somebody brought a kettle out.', 'Somebody brought a tune.'],
  ],
  pre: [
    ['And they can call it what they like.', 'We know what it is.'],
    ['Say it to my face.', 'Say it once.'],
  ],
  chorus: [
    ['They sent it in the post.', 'They would not say it to our face.', 'They sent it in the post.', 'We kept it. We kept it in this place.'],
    ['Seven at the gate.', 'Same again tomorrow.', 'Seven at the gate.', 'We are not going home.'],
    ['You can have the building.', 'You cannot have the name.', 'You can have the building.', 'It will not be the same.'],
    ['Say it to my face.', 'Say it where they can hear.', 'Say it to my face.', 'I have been standing here a year.'],
  ],
  bridge: [
    ['My father did this in the eighties.', 'They lost. He always said they lost.', 'He said it was worth the losing.', 'He never told me what it cost.'],
    ['They took the sign down twice.', 'We put it up at dawn.', 'The third time they just left it', 'and that is how it was won.'],
  ],
  outro: [
    ['We are not going home.', 'Not going home.'],
    ['We kept the letter.', 'We kept it.'],
  ],
});

/* -------------------------------------------------------------------- faith */

D('faith', {
  label: 'Faith & holding on',
  match: ['faith', 'hope', 'god', 'prayer', 'pray', 'church', 'believe', 'redemption', 'forgive',
    'forgiveness', 'keep going', 'hold on', 'survive', 'healing', 'grateful', 'gratitude', 'blessing'],
  props: ['bent nail', 'small cross on a chain', 'hymn book', 'folded note', 'bible from my grandmother'],
  places: ['the church on Ellis Street', 'the hospital corridor', 'the back pew', 'the hall on Tuesday', 'the front step at dawn'],
  people: ['my grandmother', 'the woman who plays the organ', 'the man on the door', 'my mother', 'the nurse'],
  times: ['the worst week', 'a Sunday in the winter', 'four in the morning', 'the second night'],
  details: ['The organ is half a tone flat', 'Nobody sings the second verse', 'The heater has never worked', 'They keep the door unlocked', 'There are eleven of us most weeks'],
  acts: ['sat in the back and said nothing', 'said it out loud for once', 'walked there in the rain', 'lit one and did not explain'],
  titles: ['Half A Tone Flat', 'The Door Is Not Locked', 'Eleven Of Us', 'Say It Out Loud', 'Back Pew', 'I Am Still Here'],
  verse: [
    ['{DETAIL}.', 'Nobody minds at all.', '{DETAIL}.', 'And we sing it down the hall.'],
    ['I do not know what I believe.', 'I know that I turn up.', 'I sit in {PLACE}', 'with the tea in a paper cup.'],
    ['{PERSON} took my hand once', 'and did not say a word.', 'That is the most religion', 'I think I have ever heard.'],
    ['I {ACT} in the winter.', 'It did not fix a thing.', 'But I was warm for an hour', 'and I heard the whole room sing.'],
    ['It was {TIME} and I was done.', 'I mean all the way done.', 'And the door was not locked.', 'That is it. That is the whole one.'],
  ],
  pre: [
    ['And I am not asking to be saved.', 'I am asking to be kept.'],
    ['One more week. One more.', 'That is the prayer.'],
  ],
  chorus: [
    ['The door is not locked.', 'It never has been yet.', 'The door is not locked.', 'That is as far as I can get.'],
    ['I am still here. I am still here.', 'I did not think I would be.', 'I am still here. I am still here.', 'Somebody carried me.'],
    ['Half a tone flat and we sing it.', 'Nobody says a word.', 'Half a tone flat and we sing it', 'and it is the best thing I have heard.'],
    ['Keep me, do not fix me.', 'Keep me as I am.', 'Keep me, do not fix me.', 'I will do what I can.'],
  ],
  bridge: [
    ['My grandmother said grace so fast', 'you could not catch a word.', 'I say it slow now, on my own.', 'I say it to be heard.'],
    ['I stopped asking for the big thing.', 'I ask for Tuesday now.', 'Just get me through to Tuesday.', 'It has worked out somehow.'],
  ],
  outro: [
    ['The door is not locked.', 'Never has been.'],
    ['I am still here.', 'Still here.'],
  ],
});

/* ------------------------------------------------------------------- summer */

D('summer', {
  label: 'Summer & youth',
  match: ['summer', 'beach', 'holiday', 'freedom', 'young', 'youth', 'teenage', 'seventeen',
    'friends', 'road trip', 'january', 'swimming', 'surf', 'coast'],
  props: ['warm can', 'towel that never dries', 'cracked pair of thongs', 'esky with no ice', 'speaker somebody brought'],
  places: ['the point', 'the car park above the beach', 'the caravan park', 'the shop that sells the good chips', 'the flat rocks', 'the back of the ute'],
  people: ['Marnie', 'my cousin', 'the lifeguard who never watched', 'a bloke called Tom', 'the girls from the caravan park'],
  times: ['about six in the evening', 'the second week of January', 'before the wind came up', 'the last day of it'],
  details: ['The sand got in everything', 'Nobody had any money', 'We had one towel between four', 'The ice was gone by noon', 'The car had no aircon at all'],
  acts: ['swam out past the break', 'slept in the car', 'drove down with the windows out', 'stayed till the lights came on'],
  titles: ['Second Week Of January', 'One Towel Between Four', 'Ice Was Gone By Noon', 'The Last Good Day', 'Past The Break', 'Nobody Had Any Money'],
  verse: [
    ['{DETAIL}.', 'We did not care a bit.', 'We were at {PLACE} by nine', 'and we stayed the whole of it.'],
    ['{PERSON} had the car that year.', 'It was a shocking car.', 'It got us down and back again', 'and it never got us far.'],
    ['{DETAIL}.', 'Somebody brought a speaker down.', 'We knew about four songs that year', 'and we played them into the ground.'],
    ['We {ACT} in the evening', 'when the water goes like glass.', 'Nobody said a word about it.', 'We knew it would not last.'],
    ['It was {TIME}', 'and the light went orange and long.', 'That is the bit I keep.', 'Not the rest of it. That song.'],
  ],
  pre: [
    ['And we did not know it then.', 'We know it now.'],
    ['One more swim before the dark.', 'One more.'],
  ],
  chorus: [
    ['One towel between four of us', 'and the ice was gone by noon.', 'One towel between four of us.', 'It was over far too soon.'],
    ['Take me back to {PLACE}', 'in the second week of the year.', 'Take me back to {PLACE}.', 'I would go from here.'],
    ['We had nothing that whole summer.', 'We had the whole thing too.', 'We had nothing that whole summer.', 'I would swap the lot for you.'],
    ['Last good day, last good day.', 'You always know the one.', 'Last good day, last good day', 'and then the summer is done.'],
  ],
  bridge: [
    ['I saw {PERSON} at a wedding.', 'We were polite and kind.', 'Neither of us said the summer.', 'Both of us had it on our mind.'],
    ['The caravan park is units now.', 'They kept the same front gate.', 'I stood there like an idiot', 'and I made my family wait.'],
  ],
  outro: [
    ['It was over far too soon.', 'Far too soon.'],
    ['Last good day.', 'Last good day.'],
  ],
});

/* ---------------------------------------------------------------- universal */

D('universal', {
  label: 'General',
  match: [],
  props: ['thing you left', 'folded note', 'second cup', 'coat on the hook', 'key on the hook'],
  places: ['the kitchen', 'the front step', 'the car park', 'the end of the street', 'the top of the stairs'],
  people: ['my brother', 'the woman next door', 'an old friend', 'my mother', 'somebody who knew'],
  times: ['a Tuesday in March', 'about half past six', 'the middle of the week', 'the last of the light'],
  details: ['Nobody said anything', 'The kettle was still warm', 'The window was open a bit', 'The light was on in the hall'],
  acts: ['stood there for a while', 'said it out loud once', 'wrote it on the back of a docket', 'went out and came back in'],
  titles: ['{SUBJ}', 'The Whole Of It', 'Say It Plain', 'Half Past Six', 'Nobody Said Anything', 'Back Of A Docket'],
  verse: [
    ['{DETAIL}.', 'That is where it began.', 'It was {TIME}', 'and nobody had a plan.'],
    ['I have been thinking about {SUBJ}', 'more than I let on.', 'I {ACT}', 'and then the thought was gone.'],
    ['{PERSON} asked me about it.', 'I gave the shortest answer.', '{DETAIL}.', 'I am not much of a dancer.'],
    ['You want it said in one line.', 'I have got about four.', 'They all point at {SUBJ}', 'and they all end at the door.'],
    ['I keep the {PROP} where I see it.', 'That is deliberate.', 'It is not a shrine or anything.', 'It is just a bit of it.'],
  ],
  pre: [
    ['And it comes down to this,', 'whatever else it was.'],
    ['Here it is, then.', 'Here it is.'],
  ],
  chorus: [
    ['This is the whole of it:', '{SUBJ} and the rest.', 'This is the whole of it.', 'I have said it at its best.'],
    ['Say it plain, say it once,', 'and then let it stand.', 'Say it plain, say it once.', 'Put it in my hand.'],
    ['I am not going to dress it up.', 'It is {SUBJ}, that is all.', 'I am not going to dress it up.', 'It is written on the wall.'],
    ['{SUBJ}, and the light in the hall.', '{SUBJ}, and the kettle on.', '{SUBJ}, and the light in the hall,', 'and then the evening gone.'],
  ],
  bridge: [
    ['I had a better way to say this', 'somewhere on the way.', 'I lost it round the corner', 'and this is what I say.'],
    ['Nobody warned me about {SUBJ}.', 'They would not have known how.', 'You find out on a Tuesday', 'and you carry it from now.'],
  ],
  outro: [
    ['This is the whole of it.', 'That is all.'],
    ['Say it plain.', 'Say it once.'],
  ],
});

const DOMAIN_LIST = Object.values(DOMAINS);

/* ==========================================================================
   Rap bars — hip hop verses are a different shape, so they get their own
   bank. These pull the same domain pools, so the content still matches the
   theme; only the cadence changes. Bars run longer and rhyme in couplets.
   ========================================================================== */

const RAP_VERSE = [
  ['{DETAIL}, I am up before the light,',
    'same road, same gate, same fight,',
    'they ask me how it is going, I say it is going,',
    'that is the honest answer and they hate the knowing.'],
  ['They want the version where it worked out clean,',
    'no {PROP} on the table, no in-between,',
    'I have got receipts and a phone that rings,',
    '{PERSON} on the line asking after things.'],
  ['{TIME}, and I am still on it,',
    'wrote the whole plan out, put my name on it,',
    'nobody signed it off, nobody had to,',
    'I keep the copy on me, that is what I have got to.'],
  ['You can hear it in the room when the talking stops,',
    '{DETAIL}, and the temperature drops,',
    'I said what I said and I stood in it,',
    'took the long way home and I thought about it.'],
  ['I {ACT}, I do not need a chorus,',
    '{PERSON} knew before the rest of them saw us,',
    'they will tell it wrong, that is fine, let them,',
    'I know what it cost and I know who set them.'],
  ['Back of {PLACE}, nothing on,',
    'phone at four percent and the good years gone,',
    'I am not complaining, I am counting it out,',
    'that is the difference and that is the route.'],
];

const RAP_HOOK = [
  ['{SUBJ}, that is it, that is the whole thing.', 'No chorus, no strings, just the one thing.'],
  ['Say it once, say it plain, say it slow.', 'Say it once. Now you know.'],
  ['{TIME} and I am still on it.', 'Still on it. Still on it.'],
  ['They want it clean, I have got it true.', 'That is the trade. That is what I do.'],
];

/* ==========================================================================
   Theme routing
   ========================================================================== */

const STOPWORDS = new Set(['a', 'an', 'the', 'about', 'of', 'and', 'or', 'my', 'your', 'his', 'her',
  'their', 'our', 'is', 'was', 'are', 'were', 'to', 'in', 'on', 'at', 'for', 'with', 'that', 'this',
  'it', 'i', 'you', 'he', 'she', 'we', 'they', 'song', 'track', 'being', 'when', 'from', 'by',
  'without', 'telling', 'anyone', 'someone', 'something', 'been', 'have', 'has', 'had', 'not']);

/* Pick the one domain the theme is actually about.

   Longer keywords score higher, because they are the more specific signal:
   "the summer we had no money" mentions both summer and money, and it is a
   summer song. One domain wins outright — an earlier version blended the top
   two and produced songs with a verse about the beach and a chorus about a
   payslip. */
function routeTheme(theme) {
  const t = (theme || '').toLowerCase();
  const scored = DOMAIN_LIST
    .filter((d) => d.id !== 'universal')
    .map((d) => {
      let s = 0;
      d.match.forEach((m) => {
        if (t.includes(m)) s += m.length + (m.includes(' ') ? 6 : 0);
      });
      return { d, s };
    })
    .sort((a, b) => b.s - a.s);
  if (!scored.length || scored[0].s === 0) return DOMAINS.universal;
  return scored[0].d;
}

/* Pull the nouns the user actually typed, so their words end up in the song. */
function themeNouns(theme) {
  return (theme || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}
