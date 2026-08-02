// Football Career Simulator V13.0 - World Map

class WorldMap {
  static render(transfersHistory) {
    return `
    <div class="glass-panel world-map-container">
      <h2>🗺️ 职业生涯洲际地图</h2>
      <div class="world-map-svg-box" style="margin-top: 15px;">
        <svg viewBox="0 0 800 400" width="100%" height="100%">
          <rect width="800" height="400" fill="#000000" rx="16"/>
          <circle cx="620" cy="170" r="8" fill="#e5c158"/> <text x="635" y="175" fill="#f1f5f9" font-size="12">中超基地</text>
          <circle cx="260" cy="120" r="8" fill="#38bdf8"/> <text x="275" y="125" fill="#f1f5f9" font-size="12">欧洲五大联赛</text>
          <path d="M 620,170 Q 420,80 260,120" stroke="#fa2d48" stroke-width="3" stroke-dasharray="6,6" fill="none"/>
        </svg>
      </div>
    </div>
    `;
  }
}
