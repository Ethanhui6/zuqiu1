const ZONE_POSITION = {
  defensive: { player: [25, 50], opponent: [67, 42], ball: [43, 52] },
  middle: { player: [49, 50], opponent: [67, 42], ball: [57, 48] },
  attacking: { player: [73, 50], opponent: [55, 42], ball: [78, 47] }
};

const pointStyle = ([x, y]) => `left:${x}%;top:${y}%`;

export function createMatchMiniPitch({ state, highlight } = {}) {
  const node = document.createElement('div');
  node.className = 'match-mini-pitch';
  node.setAttribute('aria-label', '比赛场上位置示意');
  node.update = (nextState = state, nextHighlight = highlight) => {
    const positions = ZONE_POSITION[nextState?.zone] || ZONE_POSITION.middle;
    node.innerHTML = `<span class="mini-pitch-half"></span><span class="mini-pitch-circle"></span><span class="mini-pitch-box mini-pitch-box--left"></span><span class="mini-pitch-box mini-pitch-box--right"></span><i class="mini-pitch-dot mini-pitch-dot--player" style="${pointStyle(positions.player)}"></i><i class="mini-pitch-dot mini-pitch-dot--opponent" style="${pointStyle(positions.opponent)}"></i><i class="mini-pitch-ball" style="${pointStyle(positions.ball)}"></i><div class="mini-pitch-caption"><strong>${nextHighlight?.title || '比赛进行中'}</strong><span>${nextHighlight?.copy || '等待下一次比赛镜头。'}</span></div>`;
  };
  node.update(state, highlight);
  return node;
}
