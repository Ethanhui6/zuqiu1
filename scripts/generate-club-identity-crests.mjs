import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLUB_CRESTS } from '../src/data/clubCrests.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataPath=path.join(root,'data','clubs.json');
const hash=value=>[...String(value)].reduce((total,char)=>(Math.imul(total^char.codePointAt(0),16777619))>>>0,2166136261);
const palette=[['#075985','#e0f2fe','#f8fafc'],['#9f1239','#ffe4e6','#fff7ed'],['#166534','#dcfce7','#fefce8'],['#4338ca','#e0e7ff','#faf5ff'],['#a16207','#fef3c7','#fffbeb'],['#9d174d','#fce7f3','#fff1f2'],['#0f766e','#ccfbf1','#f0fdfa'],['#7c2d12','#ffedd5','#fff7ed']];
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function badge(club){
  const seed=hash(club.id),[primary,secondary,ink]=palette[seed%palette.length],code=escape(String(club.code||club.id.split('-').at(-1)).slice(0,6).toUpperCase());
  const markA=14+seed%12,markB=22+(seed>>>5)%18,markC=18+(seed>>>11)%20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72" role="img" aria-label="${escape(club.cn||club.id)} club identity"><path d="M32 3 58 12v25c0 16-10 26-26 32C16 63 6 53 6 37V12z" fill="${primary}"/><path d="M32 8 53 16v20c0 12-8 21-21 27C19 57 11 48 11 36V16z" fill="${secondary}"/><path d="M12 ${markA}h40v7H12z" fill="${primary}" opacity=".9"/><circle cx="32" cy="${markB}" r="${6+seed%5}" fill="${ink}" opacity=".92"/><path d="m32 ${markB-5} 3 4-1 5h-4l-1-5zm-10 ${markC} 5 3-2 6-5-1zm20 0 5 3-2 6-5-1z" fill="${secondary}"/><text x="32" y="57" text-anchor="middle" fill="${ink}" font-family="Arial,sans-serif" font-size="7" font-weight="700">${code}</text></svg>`;
}

const data=JSON.parse(await fs.readFile(dataPath,'utf8'));
const clubs=data.clubs||data;
let generated=0;
for(const club of clubs){
  const mapped=CLUB_CRESTS[club.id];
  if(club.crest||mapped?.path){
    club.crest ??= mapped.path;
    club.crestSource ??= {repository:'FCLOGO/fclogo.top',sourcePage:mapped.sourcePage,license:'MIT repository license; club marks remain the property of their owners'};
    continue;
  }
  const relative=`assets/clubs/generated/${String(club.id).toLowerCase()}.svg`;
  await fs.mkdir(path.join(root,path.dirname(relative)),{recursive:true});
  await fs.writeFile(path.join(root,relative),badge(club),'utf8');
  club.crest=`./${relative}`;
  club.crestSource={repository:'Project-generated club identity',sourcePage:'scripts/generate-club-identity-crests.mjs',license:'Original project asset',generated:true};
  club.dataSource={...(club.dataSource||{}),crest:'project-generated deterministic club identifier'};
  generated++;
}
data.clubs=clubs;
await fs.writeFile(dataPath,`${JSON.stringify(data,null,2)}\n`,'utf8');
console.log(JSON.stringify({status:'PASS',clubs:clubs.length,generated},null,2));
