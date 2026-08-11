/* Bundles the app into one self-contained HTML file.
   Optional — index.html runs fine as-is. This is only for handing someone a
   single file, or publishing where the loose assets can't follow.

     node build-standalone.js  [outfile]
*/

const fs = require('fs');
const path = require('path');

const here = __dirname;
const out = process.argv[2] || path.join(here, 'take-one.html');
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');

const SCRIPTS = ['data-genres.js', 'data-artists.js', 'data-lexicon.js', 'engine.js', 'app.js'];

let html = read('index.html');

/* inline the stylesheet */
/* replacer functions, not replacement strings — the bundled source contains
   "$&" (a regex escape in engine.js) and String.replace would expand it */
html = html.replace(
  /<link rel="stylesheet" href="style\.css" \/>/,
  () => '<style>\n' + read('style.css') + '\n</style>'
);

/* inline the scripts, in load order, in place of the last script tag */
const bundle = SCRIPTS
  .map((f) => '/* ===== ' + f + ' ===== */\n' + read(f))
  .join('\n\n');

html = html.replace(
  /<script src="data-genres\.js"><\/script>[\s\S]*?<script src="app\.js"><\/script>/,
  () => '<script>\n' + bundle + '\n</script>'
);

/* nothing should be left pointing at a neighbouring file */
const dangling = html.match(/(?:src|href)="(?!data:)[^"]+"/g);
if (dangling) {
  console.error('Unbundled reference left in output:', dangling.join(', '));
  process.exit(1);
}

fs.writeFileSync(out, html);
console.log('wrote ' + out + '  (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
