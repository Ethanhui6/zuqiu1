import { isGoalkeeperPosition } from '../core/positionResolver.js';

const OUTFIELD_KEYS=[['speed','速度'],['shooting','射门'],['passing','传球'],['dribbling','盘带'],['defending','防守'],['physical','身体']];
const KEEPER_KEYS=[['saves','扑救'],['reaction','反应'],['positioning','站位'],['handling','手控球'],['aerial','出击'],['distribution','开球']];
const center=110,radius=78;
const bounded=value=>{const number=Number(value);return Math.max(0,Math.min(100,Number.isFinite(number)?number:0))};
const point=(index,value)=>{const angle=-Math.PI/2+Math.PI*2*index/6,number=Number(value),distance=radius*(Math.max(0,Math.min(100,Number.isFinite(number)?number:0))/100);return[center+Math.cos(angle)*distance,center+Math.sin(angle)*distance]};
const polygon=values=>values.map((value,index)=>point(index,value).join(',')).join(' ');
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatValue=value=>Number.isInteger(Number(value))?String(Number(value)):Number(value).toFixed(2);
const signed=value=>`${Number(value)>=0?'+':''}${formatValue(value)}`;

function radarValues(source,keeper,keys){
  const stats=source?.stats||source||{},goalkeeping=source?.goalkeeping||stats.goalkeeping;
  return keys.map(([key])=>bounded(keeper?goalkeeping?.[key]??({saves:stats.defending,reaction:stats.speed,positioning:stats.defending,handling:stats.dribbling,aerial:stats.physical,distribution:stats.passing}[key]||0):stats[key]??0));
}

export function radarChart(current={},previous={},potential=80,position=''){
  const keeper=isGoalkeeperPosition(position),keys=keeper?KEEPER_KEYS:OUTFIELD_KEYS;
  const currentValues=radarValues(current,keeper,keys),previousValues=radarValues(previous,keeper,keys);
  const changed=currentValues.map((value,index)=>Math.abs(Number(value)-Number(previousValues[index]))>=.005);
  const rings=[20,40,60,80,100].map(level=>`<polygon class="radar-grid" points="${polygon(keys.map(()=>level))}"/>`).join('');
  const axes=keys.map((_,index)=>{const[x,y]=point(index,100);return`<line class="radar-axis" x1="${center}" y1="${center}" x2="${x}" y2="${y}"/>`}).join('');
  const labels=keys.map(([,label],index)=>{const[x,y]=point(index,116);return`<text class="radar-label ${changed[index]?'is-changed':''}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${label}</text>`}).join('');
  const morph=changed.some(Boolean)&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?`<animate attributeName="points" from="${polygon(previousValues)}" to="${polygon(currentValues)}" dur="720ms" fill="freeze"/>`:'';
  const aria=keys.map(([,label],index)=>`${label} ${Math.round(currentValues[index])}`).join('、');
  return`<div class="radar-wrap" data-radar-morph="${changed.some(Boolean)}"><svg class="radar ${keeper?'radar--keeper':''}" viewBox="0 0 220 220" role="img" aria-label="${keeper?'门将':'球员'}六维能力：${aria}">${rings}${axes}<polygon class="radar-potential" points="${polygon(keys.map(()=>bounded(potential)))}"/><polygon class="radar-prev" points="${polygon(previousValues)}"/><polygon class="radar-current" points="${polygon(currentValues)}">${morph}</polygon>${labels}</svg></div>`;
}

export function growthFeedback({before={},after={},beforeOvr=0,afterOvr=0,potential=80,position='',source='能力变化'}={}){
  const keeper=isGoalkeeperPosition(position),keys=keeper?KEEPER_KEYS:OUTFIELD_KEYS;
  const oldValues=radarValues(before,keeper,keys),newValues=radarValues(after,keeper,keys);
  const oldOverall=Number(beforeOvr)||0,newOverall=Number(afterOvr)||0,overallDelta=newOverall-oldOverall;
  const attributes=keys.map(([key,label],index)=>{const oldValue=Number(oldValues[index])||0,newValue=Number(newValues[index])||0,delta=Number((newValue-oldValue).toFixed(3)),changed=Math.abs(delta)>=.005;return`<div class="growth-attribute ${changed?'is-changed':''}" data-attribute="${key}" data-before="${oldValue}" data-after="${newValue}" data-delta="${delta}"><span>${label}</span><strong>${formatValue(oldValue)} <i aria-hidden="true">→</i> ${formatValue(newValue)}</strong><b>${signed(delta)}</b></div>`}).join('');
  return`<section class="growth-feedback" data-growth-feedback data-before-ovr="${oldOverall}" data-after-ovr="${newOverall}" data-ovr-delta="${overallDelta}"><div class="growth-feedback__heading"><span>${escapeHtml(source)}</span><div class="growth-overall"><small>OVR</small><b>${formatValue(oldOverall)}</b><i aria-hidden="true">→</i><strong>${formatValue(newOverall)}</strong><em class="${overallDelta<0?'is-negative':''}">${signed(overallDelta)}</em></div></div>${radarChart(after,before,potential,position)}<div class="growth-attributes">${attributes}</div></section>`;
}
