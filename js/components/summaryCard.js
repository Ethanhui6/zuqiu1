// Football Career Simulator V12.0 - End-of-Career Summary Card Component

class SummaryCard {
  static renderSummary(state) {
    const clubCount = state.clubList ? state.clubList.length : 1;

    return `
    <div class="summary-card-modal glass-panel">
      <div class="summary-header">
        <span class="brand-badge">🏁 40岁传奇挂靴退役档案</span>
        <h2 style="color: var(--gold-primary); margin-top: 8px;">${state.name} 职业生涯终极报告</h2>
      </div>

      <div class="summary-stats-grid">
        <div class="s-stat"><span class="label">巅峰 OVR</span><span class="val highlight-gold">${state.peakOvr}</span></div>
        <div class="s-stat"><span class="label">退役时 OVR</span><span class="val">${state.ovr}</span></div>
        <div class="s-stat"><span class="label">效力俱乐部</span><span class="val">${clubCount} 家</span></div>
        <div class="s-stat"><span class="label">国脚生涯出场</span><span class="val">${state.nationalApps > 0 ? `🇨🇳 国足 ${state.nationalApps} 场` : '未进入国家队'}</span></div>
      </div>

      <div class="summary-actions" style="margin-top: 20px; display: flex; gap: 10px;">
        <button class="btn-primary" onclick="exportSummaryCardImage()" style="flex: 1;">📷 生成高颜值图片并分享</button>
        <button class="tab-btn" onclick="location.reload()" style="flex: 1;">🔄 开启下一世重开</button>
      </div>
    </div>
    `;
  }
}
