// Football Career Simulator V13.0 - FUT Gold Card & Scout Report Component

class PlayerCard {
  static render(player) {
    const avatarSvg = Avatar3D.createSVG(player);

    return `
    <div class="fut-card-wrapper">
      <div class="fut-card gold-card">
        <div class="fut-card-inner">
          <div class="fut-top-meta">
            <div class="fut-ovr">${player.ovr}</div>
            <div class="fut-pos">${player.position}</div>
            <div class="fut-flag">${player.flag}</div>
            <div class="fut-badge">${player.teamName || '自由球员'}</div>
          </div>

          <div class="peak-ovr-tag">
            <span>巅峰 OVR: ${player.peakOvr}</span>
          </div>

          <div class="fut-avatar-box">
            ${avatarSvg}
          </div>

          <div class="fut-player-name">${player.name}</div>
          <div class="fut-card-divider"></div>

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

      <div class="scout-report-panel glass-panel">
        <div class="scout-header">
          <span class="scout-icon">📋</span>
          <h3>球探报告 (Scouting Report)</h3>
        </div>
        <div class="scout-content">
          <div class="scout-row">
            <span class="scout-label">特质：</span>
            <span class="scout-value highlight-gold">${player.birthplace || '广东'}派系 · ${player.foot || '右脚'}</span>
          </div>
          <div class="scout-row">
            <span class="scout-label">激活天赋：</span>
            <span class="scout-value">${player.talents && player.talents.length > 0 ? player.talents.map(t => t.name).join(', ') : '无'}</span>
          </div>
        </div>
      </div>
    </div>
    `;
  }
}
