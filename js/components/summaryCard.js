// Football Career Simulator V11.0 - End-of-Career Summary Card Component & Canvas Export

class SummaryCard {
  static renderSummary(state) {
    const clubCount = state.clubList ? state.clubList.length : 1;
    const endingTitle = SummaryCard.calculateEndingTitle(state);

    return `
    <div class="summary-card-modal glass-panel">
      <div class="summary-header">
        <span class="brand-badge">🏁 40岁传奇挂靴退役档案</span>
        <h2 style="color: var(--gold-primary); margin-top: 8px;">${state.name} 职业生涯终极报告</h2>
        <p class="scout-label">终极评级称号：<strong class="highlight-gold">${endingTitle}</strong></p>
      </div>

      <div class="summary-stats-grid">
        <div class="s-stat"><span class="label">巅峰 OVR</span><span class="val highlight-gold">${state.peakOvr}</span></div>
        <div class="s-stat"><span class="label">退役时 OVR</span><span class="val">${state.ovr}</span></div>
        <div class="s-stat"><span class="label">服役赛季</span><span class="val">${state.year - GAME_CONFIG.START_YEAR} 个赛季</span></div>
        <div class="s-stat"><span class="label">效力俱乐部</span><span class="val">${clubCount} 家</span></div>
        <div class="s-stat"><span class="label">国脚生涯出场</span><span class="val">${state.nationalApps > 0 ? `🇨🇳 国足 ${state.nationalApps} 场` : '未进入国家队'}</span></div>
        <div class="s-stat"><span class="label">生涯总结总资产</span><span class="val">€${state.money.toLocaleString()}</span></div>
      </div>

      <div class="summary-honors-box" style="margin-top: 15px;">
        <h4 style="color: var(--gold-primary);">🏆 荣誉收官汇总：</h4>
        <p style="font-size: 0.9rem; color: #cbd5e1;">个人荣誉：${state.trophiesWon.filter(t => ["ballon_dor","golden_boot","afc_poty","toty"].includes(t.id)).length} 项 | 团队冠军：${state.trophiesWon.filter(t => ["world_cup","ucl","league_title","domestic_cup"].includes(t.id)).length} 座</p>
      </div>

      <div class="summary-actions" style="margin-top: 20px; display: flex; gap: 10px;">
        <button class="btn-primary" onclick="exportSummaryCardImage()" style="flex: 1;">📷 生成高颜值图片并分享</button>
        <button class="tab-btn" onclick="location.reload()" style="flex: 1;">🔄 开启下一世重开</button>
      </div>
    </div>
    `;
  }

  static calculateEndingTitle(state) {
    if (state.peakOvr >= 90 && state.trophiesWon.some(t => t.id === "ballon_dor")) return "⚽ 全球 GOAT 级球王传奇";
    if (state.peakOvr >= 85) return "🌟 欧陆豪门大满贯超级巨星";
    if (state.money >= 5000000) return "💰 财富自由 · 商业投资大亨";
    if (state.nationalApps >= 20) return "🇨🇳 国家队功勋骨干队长";
    return "⚽ 兢兢业业的职业足球战士";
  }
}
