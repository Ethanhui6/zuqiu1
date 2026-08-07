const POSITION_ALIASES = Object.freeze({
  GK: 'GK', '门将': 'GK',
  CB: 'CB', '中后卫': 'CB',
  LB: 'LB', '左后卫': 'LB', '左翼卫': 'LB', '翼卫': 'LB',
  RB: 'RB', '右后卫': 'RB', '右翼卫': 'RB',
  CDM: 'CDM', DM: 'CDM', '后腰': 'CDM',
  CM: 'CM', '中场': 'CM', '中前卫': 'CM',
  CAM: 'CAM', AM: 'CAM', '前腰': 'CAM',
  LM: 'LW', '左前卫': 'LW',
  RM: 'RW', '右前卫': 'RW',
  LW: 'LW', '左边锋': 'LW', '边锋': 'LW',
  RW: 'RW', '右边锋': 'RW',
  SS: 'ST', '影锋': 'ST',
  ST: 'ST', '中锋': 'ST', '前锋': 'ST'
});

export const POSITION_EVENT_POOL = Object.freeze({
  GK: ['goalkeeper-save', 'goalkeeper-charge', 'penalty-save', 'aerial-claim', 'distribution', 'stoppage-decision'],
  CB: ['tackle', 'header', 'body-duel', 'passing-lane', 'stoppage-decision'],
  LB: ['tackle', 'passing-lane', 'dribble-dodge', 'through-ball', 'stoppage-decision'],
  RB: ['tackle', 'passing-lane', 'dribble-dodge', 'through-ball', 'stoppage-decision'],
  CDM: ['tackle', 'body-duel', 'passing-lane', 'through-ball', 'stoppage-decision'],
  CM: ['passing-lane', 'through-ball', 'body-duel', 'tackle', 'stoppage-decision'],
  CAM: ['through-ball', 'dribble-dodge', 'free-kick', 'shooting', 'stoppage-decision'],
  LW: ['dribble-dodge', 'through-ball', 'shooting', 'penalty', 'stoppage-decision'],
  RW: ['dribble-dodge', 'through-ball', 'shooting', 'penalty', 'stoppage-decision'],
  ST: ['shooting', 'penalty', 'one-on-one', 'header', 'free-kick', 'stoppage-decision']
});

const GROUPS = Object.freeze({ GK: 'keeper', CB: 'defense', LB: 'defense', RB: 'defense', CDM: 'midfield', CM: 'midfield', CAM: 'creative', LW: 'wide', RW: 'wide', ST: 'attack' });
const LABELS = Object.freeze({ GK: '门将', CB: '中后卫', LB: '左后卫', RB: '右后卫', CDM: '后腰', CM: '中前卫', CAM: '前腰', LW: '左边锋', RW: '右边锋', ST: '中锋' });

export class PositionResolver {
  resolve(position) {
    return POSITION_ALIASES[String(position || '').trim()] || 'CM';
  }

  profile(position) {
    const code = this.resolve(position);
    return { code, label: LABELS[code], group: GROUPS[code], interactions: POSITION_EVENT_POOL[code] };
  }

  fits(position, positions = []) {
    return positions.includes(this.resolve(position));
  }
}

export const positionResolver = new PositionResolver();
export const normalizePosition = position => positionResolver.resolve(position);
export const getPositionProfile = position => positionResolver.profile(position);
export const positionFits = (position, positions) => positionResolver.fits(position, positions);
