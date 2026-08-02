// Football Career Simulator V12.0 - World Map Component

class WorldMap {
  static render(transfersHistory) {
    return `
    <div class="glass-panel world-map-container">
      <div class="scout-header">
        <h2>🗺️ 职业生涯洲际地图 (Global Footprint)</h2>
      </div>

      <div class="world-map-svg-box">
        <svg viewBox="0 0 800 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="400" fill="#000000" rx="16"/>
          <circle cx="620" cy="170" r="8" fill="#e5c158"/> <text x="635" y="175" fill="#f1f5f9" font-size="12">中超 / 亚冠基地</text>
          <circle cx="260" cy="120" r="8" fill="#38bdf8"/> <text x="275" y="125" fill="#f1f5f9" font-size="12">西甲 / 皇马巴萨</text>
          <circle cx="230" cy="100" r="8" fill="#10b981"/> <text x="170" y="95" fill="#f1f5f9" font-size="12">英超 / 曼城阿森纳</text>
          <path d="M 620,170 Q 420,80 260,120" stroke="#fa2d48" stroke-width="3" stroke-dasharray="6,6" fill="none"/>
        </svg>
      </div>
    </div>
    `;
  }
}
