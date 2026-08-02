// Football Career Simulator V11.0 - FUT Card & Peak OVR Distinction Badge

class PlayerCard {
  static render(player) {
    const avatarSvg = Avatar3D.createSVG(player);
    const scoutReport = PlayerCard.generateScoutReport(player);

    return `
    <div class="fut-card-wrapper">
      <!-- FUT Gold Card Container -->
      <div class="fut-card gold-card">
        <div class="fut-card-inner">
          <!-- Top Card Meta -->
          <div class="fut-top-meta">
            <div class="fut-ovr">${player.ovr}</div>
            <div class="fut-pos">${player.position}</div>
            <div class="fut-flag">${player.flag}</div>
            <div class="fut-badge">${player.teamName || '自由球员'}</div>
          </div>

          <!-- Peak OVR Distinction Badge -->
          <div class="peak-ovr-tag">
            <span>巅峰 OVR: ${player.peakOvr}</span>
          </div>

          <!-- Player Avatar Image -->
          <div class="fut-avatar-box">
            ${avatarSvg}
          </div>

          <!-- Player Name -->
          <div class="fut-player-name">${player.name}</div>

          <!-- Divider -->
          <div class="fut-card-divider"></div>

          <!-- FUT 6 Stats Grid -->
          <div class="fut-stats-grid">
            <div class="fut-stat"><span class="num">${player.stats.PAC}</span><span class="label">PAC 速度</span></div>
            <div class="fut-stat"><span class="num">${player.stats.DRI}</span><span class="label">DRI 盘带</span></div>
            <div class="fut-stat"><span class="num">${player.stats.SHO}</span><span class="label">SHO 射门</span></div>
            <div class="fut-stat"><span class="num">${player.stats.DEF}</span><span class="label">DEF 防守</span></div>
            <div class="fut-stat"><span class="num">${player.stats.PAS}</span><span class="label">PAS 传球</span></div>
            <div class="fut-stat"><span class="num">${player.stats.PHY}</span><span class="label">PHY 身体</span></div>
          </div>
        </div>
      </div>

      <!-- Scouting Report Panel -->
      <div class="scout-report-panel glass-panel">
        <div class="scout-header">
          <span class="scout-icon">📋</span>
          <h3>权威球探报告 (Scouting Report)</h3>
        </div>
        <div class="scout-content">
          <div class="scout-row">
            <span class="scout-label">球风模板：</span>
            <span class="scout-value highlight-gold">${scoutReport.template.name}</span>
          </div>
          <div class="scout-row">
            <span class="scout-label">核心特点：</span>
            <ul class="scout-traits-list">
              ${scoutReport.template.traits.map(t => `<li>✦ ${t}</li>`).join('')}
            </ul>
          </div>
          <div class="scout-row">
            <span class="scout-label">预测潜能范围：</span>
            <span class="scout-value potential-badge">POT ${scoutReport.potentialMin} - ${scoutReport.potentialMax}</span>
          </div>
          <div class="scout-row">
            <span class="scout-label">尚需提升：</span>
            <span class="scout-value weakness-text">${scoutReport.template.weakness}</span>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  static generateScoutReport(player) {
    const matchedTemplate = GAME_CONFIG.SCOUT_TEMPLATES.find(t => t.condition(player)) || GAME_CONFIG.SCOUT_TEMPLATES[GAME_CONFIG.SCOUT_TEMPLATES.length - 1];
    const currentAge = player.age || 17;
    const maxGrowth = Math.max(5, (30 - currentAge) * 2.5);
    const potentialMin = Math.min(99, Math.round(player.ovr + maxGrowth * 0.7));
    const potentialMax = Math.min(99, Math.round(player.ovr + maxGrowth * 1.3));

    return {
      template: matchedTemplate,
      potentialMin: potentialMin,
      potentialMax: potentialMax
    };
  }
}
