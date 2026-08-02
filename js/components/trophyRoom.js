// Football Career Simulator V10.0 - Trophy Cabinet & Honors Gallery

class TrophyCabinet {
  static ALL_TROPHIES = [
    { id: "world_cup", name: "世界杯冠军 (FIFA World Cup)", icon: "🏆", color: "#ffd700", desc: "足球运动的最高至尊荣誉" },
    { id: "ucl", name: "欧洲冠军联赛冠军 (UCL)", icon: "⚽", color: "#e2e8f0", desc: "欧洲俱乐部层面最高水准竞争" },
    { id: "league_title", name: "顶级联赛冠军 (League Champion)", icon: "🥇", color: "#f59e0b", desc: "代表整季漫长征程的统治力" },
    { id: "ballon_dor", name: "金球奖 (Ballon d'Or)", icon: "🌟", color: "#facc15", desc: "世界足坛年度第一人的至高无上象征" },
    { id: "golden_boot", name: "联赛/欧洲金靴奖 (Golden Boot)", icon: "👟", color: "#fbbf24", desc: "绝对锋线杀手的终极射手荣誉" },
    { id: "afc_poty", name: "亚洲足球先生 (AFC Player of Year)", icon: "🌏", color: "#38bdf8", desc: "亚洲足坛最高个人荣誉" },
    { id: "toty", name: "年度最佳阵容 (FIFA FIFPro World 11)", icon: "🛡️", color: "#a855f7", desc: "同位置全球最强球星认可" }
  ];

  static render(trophiesWon) {
    return `
    <div class="trophy-cabinet-container glass-panel">
      <div class="cabinet-header">
        <h2>🏛️ 荣耀奖杯陈列室 (Trophy Cabinet)</h2>
        <p class="cabinet-sub">记录你伟大职业生涯中捧起的每一座闪耀奖杯与至高荣誉</p>
      </div>

      <div class="trophy-grid">
        ${TrophyCabinet.ALL_TROPHIES.map(trophyTemplate => {
          const wonRecords = trophiesWon.filter(t => t.id === trophyTemplate.id);
          const count = wonRecords.length;
          const isUnlocked = count > 0;

          return `
            <div class="trophy-card ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="trophy-icon-wrapper" style="text-shadow: 0 0 15px ${isUnlocked ? trophyTemplate.color : 'transparent'}">
                <span class="trophy-icon">${trophyTemplate.icon}</span>
                ${count > 1 ? `<span class="trophy-count-badge">x${count}</span>` : ''}
              </div>
              <div class="trophy-name">${trophyTemplate.name}</div>
              <div class="trophy-status">
                ${isUnlocked ? `<span class="unlocked-tag">已解锁 (${count} 次)</span>` : '<span class="locked-tag">🔒 未解锁</span>'}
              </div>

              ${isUnlocked ? `
                <div class="trophy-history-list">
                  ${wonRecords.map(r => `<div class="trophy-record-item">📅 ${r.year}年 - 效力球队：${r.team}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
    `;
  }
}
