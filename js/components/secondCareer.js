// Football Career Simulator V12.0 - Post-Retirement 2nd Life Career System

class SecondCareer {
  static renderOptions(state, onSelectCareer) {
    return `
    <div class="glass-panel" style="text-align: center;">
      <span class="brand-badge">🏁 40岁挂靴 · 开启第二人生传奇</span>
      <h2 style="color: var(--gold-primary); margin-top: 8px;">传奇不熄：请选择你的退役转型道路</h2>
      <p class="scout-label" style="margin-bottom: 20px;">凭你巅峰 OVR ${state.peakOvr} 与累计资金 €${state.money.toLocaleString()}，开启后球员时代的第二次伟大征程</p>

      <div class="options-container">
        ${GAME_CONFIG.SECOND_LIFE_CAREERS.map(c => `
          <button class="option-btn" onclick="startSecondCareer('${c.id}')">
            <span class="opt-tag" style="background: var(--accent-purple); color: #fff;">第二职业</span>
            <span class="opt-text">${c.name}</span>
            <span class="opt-effect">${c.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>
    `;
  }
}
