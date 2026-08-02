// Football Career Simulator V12.0 - 3D Trophy Cabinet (Individual vs Team Honors Split)

class TrophyCabinet3D {
  static INDIVIDUAL_HONORS = [
    { id: "ballon_dor", name: "金球奖 (Ballon d'Or)", icon: "🌟", color: "#facc15" },
    { id: "golden_boot", name: "欧洲/联赛金靴奖", icon: "👟", color: "#fbbf24" },
    { id: "afc_poty", name: "亚洲足球先生", icon: "🌏", color: "#38bdf8" },
    { id: "toty", name: "FIFA FIFPro 年度最佳阵容", icon: "🛡️", color: "#a855f7" }
  ];

  static TEAM_TROPHIES = [
    { id: "world_cup", name: "世界杯冠军 (FIFA World Cup)", icon: "🏆", color: "#ffd700" },
    { id: "ucl", name: "欧洲冠军联赛冠军 (UCL)", icon: "⚽", color: "#e2e8f0" },
    { id: "league_title", name: "顶级联赛冠军", icon: "🥇", color: "#f59e0b" },
    { id: "domestic_cup", name: "国内足协杯/国王杯冠军", icon: "🏺", color: "#94a3b8" }
  ];

  static render(records) {
    const individualRecords = records.filter(r => TrophyCabinet3D.INDIVIDUAL_HONORS.some(h => h.id === r.id));
    const teamRecords = records.filter(r => TrophyCabinet3D.TEAM_TROPHIES.some(t => t.id === r.id));

    return `
    <div class="trophy-cabinet-container glass-panel">
      <div class="cabinet-header">
        <h2>🏛️ 荣耀展厅：个人殊荣与团队冠军解耦拆分</h2>
      </div>

      <div class="trophy-section">
        <h3 class="section-title highlight-gold">🌟 个人殊荣 (Individual Honors)</h3>
        <div class="trophy-grid">
          ${TrophyCabinet3D.INDIVIDUAL_HONORS.map(honor => {
            const won = individualRecords.filter(r => r.id === honor.id);
            return TrophyCabinet3D.renderTrophyCard(honor, won.length, won);
          }).join('')}
        </div>
      </div>

      <div class="trophy-section" style="margin-top: 25px;">
        <h3 class="section-title highlight-gold">🏆 团队冠军奖杯 (Team Trophies)</h3>
        <div class="trophy-grid">
          ${TrophyCabinet3D.TEAM_TROPHIES.map(trophy => {
            const won = teamRecords.filter(r => r.id === trophy.id);
            return TrophyCabinet3D.renderTrophyCard(trophy, won.length, won);
          }).join('')}
        </div>
      </div>
    </div>
    `;
  }

  static renderTrophyCard(template, count, records) {
    const isUnlocked = count > 0;
    return `
      <div class="trophy-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="trophy-icon-wrapper">
          <span class="trophy-icon">${template.icon}</span>
          ${count > 1 ? `<span class="trophy-count-badge">x${count}</span>` : ''}
        </div>
        <div class="trophy-name">${template.name}</div>
        <div class="trophy-status">
          ${isUnlocked ? `<span class="unlocked-tag">已斩获 (${count} 次)</span>` : '<span class="locked-tag">🔒 未解锁</span>'}
        </div>
      </div>
    `;
  }
}
