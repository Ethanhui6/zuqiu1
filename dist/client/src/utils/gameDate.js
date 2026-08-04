const DATE_RE=/^(\d{4})-(\d{2})-(\d{2})$/;

export function parseGameDate(value){
  const match=DATE_RE.exec(String(value||''));
  if(!match)throw new Error('游戏日期格式无效');
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new Error('游戏日期不存在');
  return{year,month,day};
}
export function formatGameDateParts({year,month,day}){
  return`${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
export function formatGameDate(value,{short=false}={}){
  const {year,month,day}=parseGameDate(value);
  return short?`${month}月${day}日`:`${year}年${month}月${day}日`;
}
function toEpochDay(value){
  const {year,month,day}=parseGameDate(value);
  return Math.floor(Date.UTC(year,month-1,day)/86400000);
}
function fromEpochDay(value){
  const date=new Date(value*86400000);
  return formatGameDateParts({year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()});
}
export function addGameDays(value,days){return fromEpochDay(toEpochDay(value)+Number(days||0))}
export function addGameWeeks(value,weeks){return addGameDays(value,Number(weeks||0)*7)}
export function daysInGameMonth(year,month){return new Date(Date.UTC(year,month,0)).getUTCDate()}
export function addGameMonths(value,months){
  const {year,month,day}=parseGameDate(value),total=year*12+(month-1)+Number(months||0),nextYear=Math.floor(total/12),nextMonth=(total%12+12)%12+1;
  return formatGameDateParts({year:nextYear,month:nextMonth,day:Math.min(day,daysInGameMonth(nextYear,nextMonth))});
}
export function daysBetween(start,end){return toEpochDay(end)-toEpochDay(start)}
export function compareGameDates(a,b){return Math.sign(toEpochDay(a)-toEpochDay(b))}
export function minGameDate(a,b){return compareGameDates(a,b)<=0?a:b}
export function maxGameDate(a,b){return compareGameDates(a,b)>=0?a:b}
export function startOfGameMonth(value){const p=parseGameDate(value);return formatGameDateParts({...p,day:1})}
export function endOfGameMonth(value){const p=parseGameDate(value);return formatGameDateParts({...p,day:daysInGameMonth(p.year,p.month)})}
export function getCalendarWeek(value){
  const {year}=parseGameDate(value),jan1=formatGameDateParts({year,month:1,day:1});
  return Math.floor(daysBetween(jan1,value)/7)+1;
}
export function isSameGameDate(a,b){return String(a)===String(b)}
