// Football Career Simulator V12.0 - Virtual Social Media (Dongqiudi/Weibo) & Hot Search

class SocialFeed {
  static renderFeed(state) {
    const comments = [
      { user: "⚽ 足球老炮儿", text: `【热评】${state.name} 这个月在球场上的突破简直无解！国足需要这样的爆破手！`, likes: "1.2万" },
      { user: "战术大师阿白", text: `客观分析：${state.name} 在 ${state.team.name} 的进攻体系里战术自由度极高，巅峰 OVR 已达 ${state.peakOvr}！`, likes: "8,920" },
      { user: "吃瓜球迷小王", text: `听说豪门球探又出现在看台上了，期待冬窗重磅转会！`, likes: "5,410" },
      { user: "喷子退散666", text: `球踢得不错，就是场外生活也挺丰富啊哈哈哈！`, likes: "2,300" }
    ];

    return `
    <div class="glass-panel">
      <div class="scout-header">
        <span class="brand-badge" style="background:#38bdf8; color:#000;">⚽ 懂球圈 / 微博热搜榜</span>
        <h2 style="margin-top: 5px;">🔥 全网舆论热度与粉丝互动 (Social Feed)</h2>
      </div>

      <div class="hot-search-box" style="margin: 15px 0;">
        <div class="hot-tag">🔥 热搜 #1：${state.name} 绝杀展现球王潜质（热度 520万）</div>
        <div class="hot-tag">🔥 热搜 #2：${state.team.name} 续约谈判进展（热度 380万）</div>
      </div>

      <div class="options-container">
        ${comments.map(c => `
          <div class="option-btn" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: var(--gold-primary); font-size: 0.9rem;">${c.user}</strong>
              <span style="font-size: 0.78rem; color: var(--text-muted);">❤️ ${c.likes} 点赞</span>
            </div>
            <p style="font-size: 0.92rem; color: #cbd5e1; margin-top: 4px;">"${c.text}"</p>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }
}
