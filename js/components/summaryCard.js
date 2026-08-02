// Football Career Simulator V13.0 - Summary Card Component

class SummaryCard {
  static renderSummary(state) {
    return `
    <div class="summary-card-modal glass-panel">
      <div class="summary-header">
        <span class="brand-badge">🏁 40岁传奇退役档案</span>
        <h2 style="color: #fff; margin-top: 8px;">${state.name} 职业生涯终极报告</h2>
      </div>

      <div class="summary-stats-grid">
        <div class="s-stat"><span class="label">巅峰 OVR</span><span class="val highlight-gold">${state.peakOvr}</span></div>
        <div class="s-stat"><span class="label">退役 OVR</span><span class="val">${state.ovr}</span></div>
        <div class="s-stat"><span class="label">效力俱乐部</span><span class="val">${state.clubList.length} 家</span></div>
        <div class="s-stat"><span class="label">国脚出场</span><span class="val">${state.nationalApps > 0 ? `🇨🇳 ${state.nationalApps} 场` : '未进国足'}</span></div>
      </div>

      <div class="summary-actions" style="margin-top: 20px; display: flex; gap: 10px;">
        <button class="btn-primary" onclick="exportSummaryCardImage()" style="flex: 1;">📷 生成并分享总结卡</button>
        <button class="tab-btn" onclick="location.reload()" style="flex: 1;">🔄 开启下一世重开</button>
      </div>
    </div>
    `;
  }
}
