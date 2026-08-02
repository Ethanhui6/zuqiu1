// Football Career Simulator - Clean Onboarding Creation Wizard

class CharacterWizard {
  static renderWizard(currentStep = 1, formData = {}) {
    return `
    <div class="wizard-overlay">
      <div class="wizard-modal glass-panel">
        <div class="wizard-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="brand-badge">✨ 角色建模 (${currentStep}/4)</span>
          <span class="scout-label">重构版</span>
        </div>
        <h2 style="margin-top: 10px; color: #1c1c1e; font-size: 1.2rem;">${CharacterWizard.getStepTitle(currentStep)}</h2>

        <div class="wizard-body" style="margin: 16px 0;">
          ${CharacterWizard.renderStepContent(currentStep, formData)}
        </div>

        <div class="wizard-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 12px;">
          ${currentStep > 1 ? `<button class="tab-btn" onclick="prevWizardStep(${currentStep})">◀ 上一步</button>` : '<div></div>'}
          ${currentStep < 4 ? `<button class="btn-primary" onclick="nextWizardStep(${currentStep})">下一步 ▶</button>` : `<button class="btn-primary" onclick="finishCharacterCreation()">🚀 踏上生涯征程</button>`}
        </div>
      </div>
    </div>
    `;
  }

  static getStepTitle(step) {
    if (step === 1) return "1. 基础资料与随机 Seed 种子";
    if (step === 2) return "2. 选择出身地与球场位置";
    if (step === 3) return "3. 抽选 Roguelike 初始天赋";
    if (step === 4) return "4. 六边形雷达图与数值预览";
    return "";
  }

  static renderStepContent(step, formData) {
    if (step === 1) {
      return `
        <div class="options-container">
          <div class="form-group">
            <label class="scout-label">球员姓名：</label>
            <input type="text" id="wizName" class="ios-input" value="${formData.name || '自建新星'}">
          </div>
          <div class="form-group">
            <label class="scout-label">惯用脚：</label>
            <select id="wizFoot" class="ios-input">
              <option value="右脚" ${formData.foot === '右脚' ? 'selected' : ''}>右脚 (Right Foot)</option>
              <option value="左脚" ${formData.foot === '左脚' ? 'selected' : ''}>左脚 (Left Foot)</option>
              <option value="双脚均衡" ${formData.foot === '双脚均衡' ? 'selected' : ''}>双脚均衡 (Both Feet)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="scout-label">球衣号码：</label>
            <input type="number" id="wizNumber" class="ios-input" value="${formData.number || 10}">
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="scout-label">Seed 种子：</label>
              <button class="tab-btn" style="padding: 2px 8px; font-size: 0.75rem;" onclick="rerollWizSeed()">🎲 随机刷新 Seed</button>
            </div>
            <input type="text" id="wizSeed" class="ios-input" value="${formData.seed || '20260801'}">
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="options-container">
          <label class="scout-label">选择出身地 (属性加成明示)：</label>
          ${GAME_CONFIG.BIRTHPLACES.map(bp => `
            <div class="option-btn ${(formData.birthplace || 'GD') === bp.code ? 'active-opt' : ''}" onclick="wizSelectBirthplace('${bp.code}')">
              <span class="opt-tag">${bp.flag} ${bp.name}</span>
              <span class="opt-text">${bp.trait}</span>
              <span class="opt-effect">✦ ${bp.desc}</span>
            </div>
          `).join('')}

          <label class="scout-label" style="margin-top: 12px;">选择场上位置：</label>
          <select id="wizPosition" class="ios-input">
            ${GAME_CONFIG.POSITIONS.map(p => `<option value="${p.code}">${p.name} - ${p.desc}</option>`).join('')}
          </select>
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div class="options-container">
          <label class="scout-label">抽选 Roguelike 天赋词条（点击选择）：</label>
          ${GAME_CONFIG.STARTING_TALENTS.map(t => `
            <div class="option-btn ${(formData.talents || []).includes(t.id) ? 'active-opt' : ''}" onclick="wizToggleTalent('${t.id}')">
              <span class="opt-tag" style="background: ${t.quality === 'GOLD' ? 'var(--gold-primary)' : 'var(--apple-red)'}; color:#fff;">${t.quality}</span>
              <span class="opt-text">${t.name}</span>
              <span class="opt-effect">${t.desc}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div class="options-container" style="text-align: center;">
          <p class="scout-label" style="margin-bottom: 8px;">初始六边形属性雷达图评估</p>
          <div style="width: 200px; height: 200px; margin: 0 auto;">
            <canvas id="wizRadarCanvas" width="200" height="200"></canvas>
          </div>
          <p class="opt-effect" style="margin-top: 8px; color: var(--apple-blue);">基于出身地、位置与激活天赋生成预估模板</p>
        </div>
      `;
    }
  }
}
