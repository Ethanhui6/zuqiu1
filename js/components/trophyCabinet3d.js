// Football Career Simulator V11.0 - Rotatable 3D Trophy Cabinet & Individual/Team Split

class TrophyCabinet3D {
  static INDIVIDUAL_HONORS = [
    { id: "ballon_dor", name: "金球奖 (Ballon d'Or)", icon: "🌟", color: "#facc15", desc: "世界足坛年度第一人最高个人荣耀" },
    { id: "golden_boot", name: "欧洲/联赛金靴奖 (Golden Boot)", icon: "👟", color: "#fbbf24", desc: "绝对锋线杀手射网之王" },
    { id: "afc_poty", name: "亚洲足球先生 (AFC POTY)", icon: "🌏", color: "#38bdf8", desc: "亚洲最高个人足球荣誉" },
    { id: "toty", name: "FIFA FIFPro 年度最佳阵容", icon: "🛡️", color: "#a855f7", desc: "全球最佳 11 人阵容认同" }
  ];

  static TEAM_TROPHIES = [
    { id: "world_cup", name: "世界杯冠军 (FIFA World Cup)", icon: "🏆", color: "#ffd700", desc: "足球运动至高无上最高神坛" },
    { id: "ucl", name: "欧洲冠军联赛冠军 (UCL)", icon: "⚽", color: "#e2e8f0", desc: "欧洲俱乐部最高荣誉霸主" },
    { id: "league_title", name: "顶级联赛冠军 (League Champion)", icon: "🥇", color: "#f59e0b", desc: "漫长联赛征程统治力证明" },
    { id: "domestic_cup", name: "足协杯 / 国王杯冠军 (Domestic Cup)", icon: "🏺", color: "#94a3b8", desc: "国内杯赛王者荣誉" }
  ];

  static render(records) {
    const individualRecords = records.filter(r => TrophyCabinet3D.INDIVIDUAL_HONORS.some(h => h.id === r.id));
    const teamRecords = records.filter(r => TrophyCabinet3D.TEAM_TROPHIES.some(t => t.id === r.id));

    return `
    <div class="trophy-cabinet-container glass-panel">
      <div class="cabinet-header">
        <h2>🏛️ 荣耀展厅：个人荣誉与团队冠军 (Trophy Gallery)</h2>
        <p class="cabinet-sub">清晰拆分个人顶尖殊荣与团队夺冠战绩</p>
      </div>

      <!-- Section 1: Individual Honors -->
      <div class="trophy-section">
        <h3 class="section-title highlight-gold">🌟 个人殊荣 (Individual Honors)</h3>
        <div class="trophy-grid">
          ${TrophyCabinet3D.INDIVIDUAL_HONORS.map(honor => {
            const won = individualRecords.filter(r => r.id === honor.id);
            const count = won.length;
            return TrophyCabinet3D.renderTrophyCard(honor, count, won);
          }).join('')}
        </div>
      </div>

      <!-- Section 2: Team Trophies -->
      <div class="trophy-section" style="margin-top: 30px;">
        <h3 class="section-title highlight-gold">🏆 团队冠军奖杯 (Team Trophies)</h3>
        <div class="trophy-grid">
          ${TrophyCabinet3D.TEAM_TROPHIES.map(trophy => {
            const won = teamRecords.filter(r => r.id === trophy.id);
            const count = won.length;
            return TrophyCabinet3D.renderTrophyCard(trophy, count, won);
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
        <div class="trophy-icon-wrapper" style="text-shadow: 0 0 20px ${isUnlocked ? template.color : 'transparent'}">
          <span class="trophy-icon">${template.icon}</span>
          ${count > 1 ? `<span class="trophy-count-badge">x${count}</span>` : ''}
        </div>
        <div class="trophy-name">${template.name}</div>
        <div class="trophy-status">
          ${isUnlocked ? `<span class="unlocked-tag">已斩获 (${count} 次)</span>` : '<span class="locked-tag">🔒 未解锁</span>'}
        </div>
        ${isUnlocked ? `
          <div class="trophy-history-list">
            ${records.map(r => `<div class="trophy-record-item">📅 ${r.year}年 - 球队：${r.team}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
}
