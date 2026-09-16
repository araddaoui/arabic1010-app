const fs = require("fs");
const p = 'src/data/letterAnimations.ts';
const t = fs.readFileSync(p, 'utf8');
const s = t.indexOf('  yaa: `');
if (s < 0) { throw new Error('yaa not found'); }
const e = t.indexOf('</svg>`', s);
if (e < 0) { throw new Error('end not found'); }
const block = t.slice(s, e + 6);
const pretty = block.replace(/></g, '>' + '\n' + '<');
fs.writeFileSync('tmp_yaa_full.txt', pretty, 'utf8');
console.log('wrote tmp_yaa_full.txt ' + pretty.length + ' chars');
