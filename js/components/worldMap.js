// Football Career Simulator V11.0 - Transcontinental Career World Map Component

class WorldMap {
  static render(transfersHistory) {
    return `
    <div class="glass-panel world-map-container">
      <div class="scout-header">
        <h2>🗺️ 职业生涯足迹地图 (Global Career Footprint)</h2>
      </div>
      <p class="scout-label" style="margin-bottom: 15px;">纪录你从青训基地起步，跨越洲际征战世界各大联赛的足迹路线</p>

      <div class="world-map-svg-box">
        <svg viewBox="0 0 800 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="400" fill="#0c1017" rx="16"/>
          
          <!-- Continent Outlines (Stylized SVG Grid) -->
          <path d="M 150,120 Q 220,100 280,160 Q 230,280 180,220 Z" fill="#1e293b" opacity="0.6"/> <!-- Europe/Asia -->
          <path d="M 450,100 Q 600,80 720,150 Q 650,280 500,220 Z" fill="#1e293b" opacity="0.6"/> <!-- Asia -->
          <path d="M 80,180 Q 140,160 160,260 Q 100,350 70,280 Z" fill="#1e293b" opacity="0.6"/> <!-- South America -->

          <!-- Map Nodes for Major Clubs -->
          <g id="mapNodes">
            <circle cx="620" cy="170" r="8" fill="#e5c158" class="map-node-pulse"/> <text x="635" y="175" fill="#f1f5f9" font-size="12">中超 / 亚冠基地 (上海/北京)</text>
            <circle cx="260" cy="120" r="8" fill="#38bdf8"/> <text x="275" y="125" fill="#f1f5f9" font-size="12">西甲 / 皇马巴萨 (马德里)</text>
            <circle cx="230" cy="100" r="8" fill="#10b981"/> <text x="170" y="95" fill="#f1f5f9" font-size="12">英超 / 曼城阿森纳 (伦敦)</text>
          </g>

          <!-- Flight Connection Line -->
          <path d="M 620,170 Q 420,80 260,120" stroke="#e5c158" stroke-width="3" stroke-dasharray="6,6" fill="none"/>
        </svg>
      </div>

      <div class="transfer-footprint-list" style="margin-top: 15px;">
        <h4 style="color: var(--gold-primary); margin-bottom: 8px;">✈️ 转会履历履历航线：</h4>
        ${transfersHistory.map(t => `<div class="log-item">📅 ${t.year}年：加盟 【${t.teamName}】（签约周薪 €${t.wage.toLocaleString()}）</div>`).join('')}
      </div>
    </div>
    `;
  }
}
