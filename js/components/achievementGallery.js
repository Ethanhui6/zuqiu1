// Football Career Simulator V12.0 - 50+ Achievements & Endings Gallery Wall

class AchievementGallery {
  static render(unlockedIds = []) {
    return `
    <div class="glass-panel">
      <div class="scout-header">
        <h2>🏆 50+ 结局与终极成就图鉴墙 (Achievements Gallery)</h2>
      </div>
      <p class="scout-label" style="margin-bottom: 20px;">记录你所有历史重开生涯中打通的成就与终极称号</p>

      <div class="trophy-grid">
        ${ALL_ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlockedIds.includes(ach.id) || true; // Demo unlocked preview
          return `
            <div class="trophy-card ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="trophy-icon-wrapper">
                <span class="trophy-icon">${ach.icon}</span>
              </div>
              <div class="trophy-name">${ach.title}</div>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 5px;">${ach.desc}</p>
              <div class="trophy-status" style="margin-top: 8px;">
                ${isUnlocked ? '<span class="unlocked-tag">✨ 已解锁图鉴</span>' : '<span class="locked-tag">🔒 未解锁</span>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    `;
  }
}
