import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const clubs=(await read('data/clubs.json')).clubs.sort((a,b)=>Number(b.rep)-Number(a.rep)).slice(0,75);
const existing=(await read('data/players.json')).filter(player=>player.sourceName!=='Wikidata');
const headers={'User-Agent':'ZuqiuCareerSimulator/20.18 (personal offline roster snapshot)'};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const overrides={
  'ESP1-ATH':{wikidataId:'Q8687',wikidataLabel:'Athletic Club'},
  'KSA1-AHL':{wikidataId:'Q44441',wikidataLabel:'Al Ahli FC'},
  'TUR1-FEN':{wikidataId:'Q6601875',wikidataLabel:'Fenerbahçe football team'},
  'TUR1-GAL':{wikidataId:'Q495299',wikidataLabel:'Galatasaray football team'}
};
let cached=[];try{cached=(await read('data/player-snapshot-sources.json')).clubs||[]}catch{}
const cachedByClub=new Map(cached.map(item=>[item.clubId,item]));

async function fetchJson(url,retries=6){
  for(let attempt=1;attempt<=retries;attempt++){
    const response=await fetch(url,{headers});
    if(response.ok)return response.json();
    if(attempt===retries)throw new Error(`${response.status} ${response.statusText}: ${url}`);
    const retryAfter=Number(response.headers.get('retry-after')||0)*1000;
    await sleep(Math.max(retryAfter,attempt*2500));
  }
}

async function findClub(club){
  const known=overrides[club.id]||cachedByClub.get(club.id);
  if(known)return {clubId:club.id,clubName:club.cn,wikidataId:known.wikidataId,wikidataLabel:known.wikidataLabel,sourceReference:`https://www.wikidata.org/wiki/${known.wikidataId}`};
  for(const [host,title] of [['en.wikipedia.org',club.native||club.en],['zh.wikipedia.org',club.cn]]){
    const query=new URLSearchParams({action:'query',prop:'pageprops',ppprop:'wikibase_item',redirects:'1',titles:title,format:'json',origin:'*'});
    const data=await fetchJson(`https://${host}/w/api.php?${query}`),page=Object.values(data.query?.pages||{})[0],wikidataId=page?.pageprops?.wikibase_item;
    if(wikidataId)return {clubId:club.id,clubName:club.cn,wikidataId,wikidataLabel:page.title,sourceReference:`https://www.wikidata.org/wiki/${wikidataId}`};
  }
  const query=new URLSearchParams({action:'wbsearchentities',search:club.native||club.en||club.cn,language:'en',uselang:'en',type:'item',limit:'10',format:'json',origin:'*'});
  const data=await fetchJson(`https://www.wikidata.org/w/api.php?${query}`);
  const football=data.search.find(item=>/football|soccer|association|futebol|fußball/i.test(`${item.label} ${item.description||''}`)&&!/women|reserve|\bII\b|\bB team\b|youth|European football/i.test(`${item.label} ${item.description||''}`));
  if(!football)throw new Error(`No football entity found for ${club.id} ${club.native}`);
  return {clubId:club.id,clubName:club.cn,wikidataId:football.id,wikidataLabel:football.label,sourceReference:`https://www.wikidata.org/wiki/${football.id}`};
}

async function rosterBatch(mappings){
  const values=mappings.map(item=>`wd:${item.wikidataId}`).join(' ');
  const query=`SELECT DISTINCT ?club ?player ?playerLabelEn ?playerLabelZh ?dob ?countryLabelZh ?positionLabelEn WHERE {
    VALUES ?club { ${values} }
    ?player p:P54 ?membership .
    ?membership ps:P54 ?club ; wikibase:rank wikibase:PreferredRank .
    FILTER NOT EXISTS { ?membership pq:P582 ?end . }
    OPTIONAL { ?player wdt:P569 ?dob . }
    FILTER(!BOUND(?dob) || YEAR(?dob) >= 1985)
    OPTIONAL { ?player wdt:P27 ?country . ?country rdfs:label ?countryLabelZh . FILTER(LANG(?countryLabelZh) = "zh") }
    OPTIONAL { ?player wdt:P413 ?position . ?position rdfs:label ?positionLabelEn . FILTER(LANG(?positionLabelEn) = "en") }
    OPTIONAL { ?player rdfs:label ?playerLabelEn . FILTER(LANG(?playerLabelEn) = "en") }
    OPTIONAL { ?player rdfs:label ?playerLabelZh . FILTER(LANG(?playerLabelZh) = "zh") }
  }`;
  const params=new URLSearchParams({query,format:'json'});
  return (await fetchJson(`https://query.wikidata.org/sparql?${params}`)).results.bindings;
}

const position=value=>{
  const label=String(value||'').toLowerCase();
  if(label.includes('goalkeeper'))return'GK';
  if(label.includes('centre-back')||label.includes('center-back')||label.includes('central defender'))return'CB';
  if(label.includes('left-back'))return'LB';if(label.includes('right-back'))return'RB';
  if(label.includes('defensive midfield'))return'CDM';if(label.includes('attacking midfield'))return'CAM';
  if(label.includes('left wing'))return'LW';if(label.includes('right wing'))return'RW';
  if(label.includes('forward')||label.includes('striker'))return'ST';return'CM';
};
const hash=value=>{let result=2166136261;for(const char of value)result=Math.imul(result^char.codePointAt(0),16777619);return result>>>0};
const key=(clubId,name)=>`${clubId}|${String(name).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase()}`;

const mappings=[];
for(const club of clubs)mappings.push(await findClub(club));
const byQid=new Map(mappings.map(item=>[item.wikidataId,item]));
const rows=[];
for(let index=0;index<mappings.length;index+=10){rows.push(...await rosterBatch(mappings.slice(index,index+10)));await sleep(500)}

const deduped=new Map();
for(const row of rows){
  const playerId=row.player.value.split('/').at(-1),clubQid=row.club.value.split('/').at(-1),mapping=byQid.get(clubQid),name=row.playerLabelEn?.value||row.playerLabelZh?.value;
  if(!mapping||!name)continue;
  const id=`wikidata-${playerId}`,pos=position(row.positionLabelEn?.value),age=row.dob?.value?2026-Number(row.dob.value.slice(0,4)):25;
  const player={id,clubId:mapping.clubId,cn:row.playerLabelZh?.value||name,name,pos,ovr:Math.max(58,Math.min(90,Number(clubs.find(club=>club.id===mapping.clubId)?.rep||70)-8+hash(id)%9)),nation:row.countryLabelZh?.value||'',birthDate:row.dob?.value?.slice(0,10)||null,isReal:true,snapshotSeason:2026,simulatedEndSeason:2026+Math.max(3,Math.min(15,35-age)),sourceName:'Wikidata',sourceReference:`https://www.wikidata.org/wiki/${playerId}`,lastVerifiedAt:'2026-08-08',confidence:.9,dataOrigin:{identity:'verified-public',ratings:'estimated'}};
  const previous=deduped.get(key(player.clubId,player.name));
  if(!previous||position(row.positionLabelEn?.value)!=='CM')deduped.set(key(player.clubId,player.name),player);
}

const existingKeys=new Set(existing.map(player=>key(player.clubId,player.name||player.cn)));
const added=[...deduped.values()].filter(player=>!existingKeys.has(key(player.clubId,player.name)));
const players=[...existing,...added];
const counts=Object.fromEntries(clubs.map(club=>[club.id,players.filter(player=>player.clubId===club.id).length]));
const metadata={snapshotSeason:2026,capturedAt:'2026-08-08',source:'Wikidata',sourceUrl:'https://query.wikidata.org/',license:'CC0-1.0',method:'Preferred-rank P54 club memberships without an end date; player identity is public data and ratings are project estimates.',clubs:mappings.map(item=>({...item,players:counts[item.clubId]}))};
await fs.writeFile(path.join(root,'data/players.json'),`${JSON.stringify(players)}\n`);
await fs.writeFile(path.join(root,'data/player-snapshot-sources.json'),`${JSON.stringify(metadata,null,2)}\n`);
console.log(JSON.stringify({status:'PASS',candidateClubs:clubs.length,mappedClubs:mappings.length,queryRows:rows.length,addedPlayers:added.length,totalPlayers:players.length,coveredClubs:Object.values(counts).filter(Boolean).length,minPlayers:Math.min(...Object.values(counts))},null,2));
