// Football Career Simulator V13.0 - Post-Retirement Second Career Component

class SecondCareer {
  static renderOptions(state) {
    return `
    <div class="glass-panel" style="text-align: center;">
      <span class="brand-badge">🏁 40岁挂靴 · 第二人生传奇</span>
      <h2 style="color: #fff; margin-top: 8px;">请选择你的退役转型道路</h2>
      <p class="scout-label" style="margin-bottom: 20px;">巅峰 OVR ${state.peakOvr} | 累计资金 €${state.money.toLocaleString()}</p>

      <div class="options-container">
        ${GAME_CONFIG.SECOND_LIFE_CAREERS.map(c => `
          <button class="option-btn" onclick="startSecondCareer('${c.id}')">
            <span class="opt-tag" style="background: var(--apple-red); color: #fff;">第二职业</span>
            <span class="opt-text">${c.name}</span>
            <span class="opt-effect">${c.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>
    `;
  }
}
