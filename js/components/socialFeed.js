// Football Career Simulator V13.0 - Social Feed Component

class SocialFeed {
  static renderFeed(state) {
    const comments = [
      { user: "⚽ 足球老炮儿", text: `【热评】${state.name} 这个月状态火热！巅峰 OVR 已飙升至 ${state.peakOvr}！`, likes: "1.2万" },
      { user: "战术大师阿白", text: `分析：${state.name} 在 ${state.team.name} 的进攻体系里作用显著！`, likes: "8,920" }
    ];

    return `
    <div class="glass-panel">
      <div class="scout-header">
        <span class="brand-badge">⚽ 懂球圈热搜</span>
        <h2 style="margin-top: 5px;">🔥 全网舆论热度 (Social Feed)</h2>
      </div>

      <div class="hot-search-box" style="margin: 15px 0;">
        <div class="hot-tag">🔥 热搜 #1：${state.name} 场上表现强劲（热度 520万）</div>
      </div>

      <div class="options-container">
        ${comments.map(c => `
          <div class="option-btn" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: var(--gold-primary); font-size: 0.9rem;">${c.user}</strong>
              <span style="font-size: 0.78rem; color: var(--text-muted);">❤️ ${c.likes}</span>
            </div>
            <p style="font-size: 0.92rem; color: #e5e5ea; margin-top: 4px;">"${c.text}"</p>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }
}
