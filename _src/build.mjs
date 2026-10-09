// Builds xorkathewild/xorkathewild.html from the parts in _src/parts. The game is standalone: no shared stamps, no CDN, no fonts.
import fs from 'node:fs';
const here=new URL('.',import.meta.url);
const order=['00_head.html','05_util.js','10_gl.js','15_text.js','18_audio.js','20_world.js','30_player.js','35_things.js','40_story.js','50_render.js','60_ui.js','70_main.js','99_tail.html'];
const html=order.map(f=>fs.readFileSync(new URL('parts/'+f,here),'utf8')).join('\n');
const out=new URL('../xorkathewild.html',here);fs.writeFileSync(out,html);
console.log('built',html.length,'bytes');
