// Football Career Simulator - Achievements Gallery

class AchievementGallery {
  static render() {
    return `
    <div class="glass-panel">
      <div class="scout-header">
        <h2>🏆 50+ 结局与成就图鉴墙</h2>
      </div>

      <div class="trophy-grid">
        ${ALL_ACHIEVEMENTS.map(ach => `
          <div class="trophy-card unlocked">
            <div class="trophy-icon-wrapper"><span class="trophy-icon">${ach.icon}</span></div>
            <div class="trophy-name">${ach.title}</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${ach.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }
}
