import { isGoalkeeperPosition } from '../core/positionResolver.js';

const OUTFIELD_KEYS=[['speed','速度'],['shooting','射门'],['passing','传球'],['dribbling','盘带'],['defending','防守'],['physical','身体']];
const KEEPER_KEYS=[['saves','扑救'],['reaction','反应'],['positioning','站位'],['handling','手控球'],['aerial','出击'],['distribution','开球']];
const center=110, radius=78;
const point=(index,value)=>{ const a=(-Math.PI/2)+(Math.PI*2*index/6); const number=Number(value); const r=radius*(Math.max(0,Math.min(100,Number.isFinite(number)?number:0))/100); return [center+Math.cos(a)*r,center+Math.sin(a)*r]; };
const polygon=values=>values.map((v,i)=>point(i,v).join(',')).join(' ');

export function radarChart(current={},previous={},potential=80,position=''){
  const keeper=isGoalkeeperPosition(position);
  const KEYS=keeper?KEEPER_KEYS:OUTFIELD_KEYS;
  const values=(source,keys)=>keys.map(([key])=>keeper?source.goalkeeping?.[key]??({saves:source.defending,reaction:source.speed,positioning:source.defending,handling:source.dribbling,aerial:source.physical,distribution:source.passing}[key]||0):source[key]??0);
  const rings=[20,40,60,80,100].map(level=>`<polygon class="radar-grid" points="${polygon(KEYS.map(()=>level))}"/>`).join('');
  const axes=KEYS.map((_,i)=>{const [x,y]=point(i,100);return `<line class="radar-axis" x1="${center}" y1="${center}" x2="${x}" y2="${y}"/>`;}).join('');
  const labels=KEYS.map(([,label],i)=>{const [x,y]=point(i,116);return `<text class="radar-label" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${label}</text>`;}).join('');
  return `<div class="radar-wrap"><svg class="radar ${keeper?'radar--keeper':''}" viewBox="0 0 220 220" role="img" aria-label="${keeper?'门将六维能力雷达图':'六维能力雷达图'}">${rings}${axes}<polygon class="radar-potential" points="${polygon(KEYS.map(()=>potential))}"/><polygon class="radar-prev" points="${polygon(values(previous,KEYS))}"/><polygon class="radar-current" points="${polygon(values(current,KEYS))}"/>${labels}</svg></div>`;
}
