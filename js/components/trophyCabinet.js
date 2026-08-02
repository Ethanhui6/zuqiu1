// Football Career Simulator - Trophy Cabinet

class TrophyCabinet3D {
  static INDIVIDUAL_HONORS = [
    { id: "ballon_dor", name: "金球奖 (Ballon d'Or)", icon: "🌟" },
    { id: "golden_boot", name: "欧洲/联赛金靴奖", icon: "👟" },
    { id: "afc_poty", name: "亚洲足球先生", icon: "🌏" }
  ];

  static TEAM_TROPHIES = [
    { id: "world_cup", name: "世界杯冠军 (FIFA World Cup)", icon: "🏆" },
    { id: "ucl", name: "欧洲冠军联赛冠军 (UCL)", icon: "⚽" },
    { id: "league_title", name: "顶级联赛冠军", icon: "🥇" }
  ];

  static render(records) {
    return `
    <div class="trophy-cabinet-container glass-panel">
      <div class="cabinet-header">
        <h2>🏛️ 荣耀展厅：个人殊荣与团队冠军拆分</h2>
      </div>

      <div class="trophy-section">
        <h3 class="section-title highlight-gold">🌟 个人殊荣</h3>
        <div class="trophy-grid">
          ${TrophyCabinet3D.INDIVIDUAL_HONORS.map(h => `<div class="trophy-card unlocked"><span class="trophy-icon">${h.icon}</span><div class="trophy-name">${h.name}</div></div>`).join('')}
        </div>
      </div>

      <div class="trophy-section" style="margin-top: 20px;">
        <h3 class="section-title highlight-gold">🏆 团队冠军奖杯</h3>
        <div class="trophy-grid">
          ${TrophyCabinet3D.TEAM_TROPHIES.map(t => `<div class="trophy-card unlocked"><span class="trophy-icon">${t.icon}</span><div class="trophy-name">${t.name}</div></div>`).join('')}
        </div>
      </div>
    </div>
    `;
  }
}
