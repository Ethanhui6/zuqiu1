const ICONS = {
  speed:'<path d="M4 13h7l-2 7 7-10h-7l2-6Z"/>',
  shooting:'<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M7 7l10 10M17 7 7 17"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  goalkeeper:'<path d="M5 4h14v16H5Z"/><path d="M8 9h8M8 14h8"/><circle cx="12" cy="12" r="2"/>',
  passing:'<path d="M4 12h12M12 7l5 5-5 5"/><circle cx="5" cy="12" r="2"/>',
  dribbling:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M7.5 16.5 16.5 7.5M8 7c3-2 5 1 3 3s0 5 4 4"/>',
  defending:'<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z"/><path d="m9 12 2 2 4-5"/>',
  physical:'<path d="M7 8v8M17 8v8M4 10h3M17 10h3M9 12h6"/>',
  stamina:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  fatigue:'<path d="M5 8h8l-2 4h6l-4 5H5z"/><path d="M7 5h6"/>',
  morale:'<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8 15c2 2 6 2 8 0"/>',
  trust:'<path d="M4 12 9 7l3 3 3-3 5 5-8 8Z"/><path d="M9 7 7 5 4 8l2 2"/>',
  injury:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
  medical:'<path d="M8 4h8v4h4v12H4V8h4Z"/><path d="M10 12h4M12 10v4"/>',
  recovery:'<path d="M5 11a7 7 0 1 0 2-5"/><path d="M5 4v7h7"/>',
  refresh:'<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M18 12a6 6 0 0 0-10-4L5 11M6 12a6 6 0 0 0 10 4l3-3"/>',
  training:'<path d="M4 18h16M6 15l3-6 3 3 4-7 2 10"/>',
  match:'<circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-1 4h-4L9 9Z"/>',
  transfer:'<path d="M5 7h11M13 4l3 3-3 3M19 17H8M11 14l-3 3 3 3"/>',
  contract:'<path d="M6 3h9l3 3v15H6Z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>',
  agent:'<circle cx="12" cy="7" r="3"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7M17 5l2-2 2 2"/>',
  club:'<path d="M5 5h14v5c0 6-3 9-7 11-4-2-7-5-7-11Z"/><path d="M8 9h8M12 5v11"/>',
  league:'<path d="M6 4h12v4c0 3-2 5-6 5S6 11 6 8Z"/><path d="M8 21h8M12 13v8M4 6H2v2c0 2 2 4 4 4M20 6h2v2c0 2-2 4-4 4"/>',
  country:'<path d="M5 21V4M5 5h12l-2 4 2 4H5"/>',
  map:'<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z"/><path d="M9 4v14M15 6v14"/>',
  stadium:'<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v8c0 2 4 4 8 4s8-2 8-4V7M8 10v6M16 10v6"/>',
  formation:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="6" r="1"/><circle cx="8" cy="11" r="1"/><circle cx="16" cy="11" r="1"/><circle cx="6" cy="17" r="1"/><circle cx="12" cy="17" r="1"/><circle cx="18" cy="17" r="1"/>',
  tactics:'<path d="M5 19 19 5M7 7h4v4M13 13h4v4"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/>',
  coach:'<circle cx="9" cy="7" r="3"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7M17 9l4 3-4 3Z"/>',
  teammate:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21c0-4 2-7 6-7s6 3 6 7M14 16c4 0 7 2 7 5"/>',
  locker:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v18M9 8h.01M15 8h.01"/>',
  fans:'<path d="M4 21v-2c0-3 2-5 5-5s5 2 5 5v2M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM15 14c3 0 5 2 5 5v2M16 11a2.5 2.5 0 1 0 0-5"/>',
  media:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="m8 6 1-2h6l1 2"/>',
  followers:'<path d="M12 21s-7-4-7-10a4 4 0 0 1 7-3 4 4 0 0 1 7 3c0 6-7 10-7 10Z"/>',
  business:'<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4h6v3M4 12h16M10 12v2h4v-2"/>',
  analytics:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  growth:'<path d="M4 18 10 12l4 4 6-9"/><path d="M15 7h5v5"/>',
  potential:'<path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.6-4.9-2.6L7.1 18l.9-5.6-4-3.9 5.5-.8Z"/>',
  age:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trophy:'<path d="M7 4h10v4c0 4-2 6-5 6s-5-2-5-6Z"/><path d="M9 14v4h6v-4M7 20h10M5 6H3v2c0 2 2 4 4 4M19 6h2v2c0 2-2 4-4 4"/>',
  record:'<path d="M6 3h12v18l-6-4-6 4Z"/><path d="M9 8h6M9 11h6"/>',
  national:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  academy:'<path d="m3 9 9-5 9 5-9 5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5M21 9v6"/>',
  starter:'<path d="M4 4h16v16H4Z"/><path d="m9 15 6-6M9 9h6v6"/>',
  bench:'<path d="M4 15h16M6 15v4M18 15v4M6 11h12v4"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  play:'<path d="m8 5 11 7-11 7Z"/>',
  fast:'<path d="m3 5 8 7-8 7ZM12 5l8 7-8 7Z"/>',
  save:'<path d="M5 3h12l3 3v15H4V3Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  share:'<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 11 7.5-4.5M8.2 13l7.5 4.5"/>',
  message:'<path d="M4 5h16v11H8l-4 4Z"/><path d="M8 9h8M8 12h5"/>',
  todo:'<path d="M6 3h12v18H6Z"/><path d="m9 9 2 2 4-4M9 15h6"/>',
  risk:'<path d="m12 3 10 18H2Z"/><path d="M12 9v5M12 18h.01"/>',
  reward:'<circle cx="12" cy="8" r="5"/><path d="m9 13-2 8 5-3 5 3-2-8"/>',
  hidden:'<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"/><path d="m4 4 16 16"/>',
  leaderboard:'<path d="M5 20V10h4v10M10 20V4h4v16M15 20v-7h4v7"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.5-1.2.9-1.9-2.1-2.1-1.9.9-1.2-.5L10.5 3h-3l-.7 2-1.2.5-1.9-.9-2.1 2.1.9 1.9-.5 1.2-2 .7v3l2 .7.5 1.2-.9 1.9 2.1 2.1 1.9-.9 1.2.5.7 2h3l.7-2 1.2-.5 1.9.9 2.1-2.1-.9-1.9.5-1.2Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-1 4h-4L9 9ZM4 10l5-1M15 9l5 1M10 13l-3 5M14 13l3 5"/>',
  home:'<path d="m3 11 9-8 9 8v10h-6v-6H9v6H3Z"/>',
  chevron:'<path d="m9 6 6 6-6 6"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  back:'<path d="m15 6-6 6 6 6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye:'<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
};

const GENERATED_ICONS = Object.fromEntries(Array.from({length:512},(_,index)=>{
  const number=String(index+1).padStart(3,'0');
  const category=['club','match','training','career','honour','feedback','world','status'][index%8];
  const x=4+(index*7)%16;
  const y=5+(index*11)%14;
  return [`asset-${category}-${number}`,`<path d="M${x} ${y}l${5+(index%7)} ${3+(index%5)}-${3+(index%4)} ${index%6+2} ${-5-(index%6)} ${-3-(index%5)}Z"/><circle cx="${(index*13)%18+3}" cy="${(index*17)%18+3}" r="${2+(index%4)}"/>`];
}));
const ALL_ICONS=Object.freeze({...ICONS,...GENERATED_ICONS});
export const iconNames = Object.freeze(Object.keys(ALL_ICONS));
export const iconCount = iconNames.length;
export function hasIcon(name){return typeof name==='string'&&Object.prototype.hasOwnProperty.call(ALL_ICONS,name);}
export function icon(name, className = '') {
  const body = hasIcon(name) ? ALL_ICONS[name] : ICONS.ball;
  return `<svg class="icon ui-icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
