// Football Career Simulator V13.0 - Clean Multi-Step Character Creation Wizard

class CharacterWizard {
  static renderWizard(currentStep = 1, formData = {}) {
    return `
    <div class="wizard-overlay">
      <div class="wizard-modal glass-panel">
        <div class="wizard-header">
          <span class="brand-badge">✨ 足球生涯 V13.0 角色建模向导 (${currentStep}/4)</span>
          <h2 style="margin-top: 8px;">${CharacterWizard.getStepTitle(currentStep)}</h2>
        </div>

        <div class="wizard-body" style="margin: 20px 0;">
          ${CharacterWizard.renderStepContent(currentStep, formData)}
        </div>

        <div class="wizard-footer" style="display: flex; justify-content: space-between; align-items: center;">
          ${currentStep > 1 ? `<button class="tab-btn" onclick="prevWizardStep(${currentStep})">◀ 上一步</button>` : '<div></div>'}
          ${currentStep < 4 ? `<button class="btn-primary" onclick="nextWizardStep(${currentStep})">下一步 ▶</button>` : `<button class="btn-primary" onclick="finishCharacterCreation()">🚀 正式开启全新足球生涯</button>`}
        </div>
      </div>
    </div>
    `;
  }

  static getStepTitle(step) {
    if (step === 1) return "1. 基础信息与随机 Seed 种子";
    if (step === 2) return "2. 选择出身地与球场位置";
    if (step === 3) return "3. Roguelike 初始天赋抽卡";
    if (step === 4) return "4. 游戏节奏与难度模式配置";
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
            <label class="scout-label">随机 Seed 种子：</label>
            <input type="text" id="wizSeed" class="ios-input" value="${formData.seed || '20260801'}">
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="options-container">
          <label class="scout-label">选择出身地 (加成已明示)：</label>
          ${GAME_CONFIG.BIRTHPLACES.map(bp => `
            <div class="option-btn ${formData.birthplace === bp.code ? 'active-opt' : ''}" onclick="wizSelectBirthplace('${bp.code}')">
              <span class="opt-tag">${bp.flag} ${bp.name}</span>
              <span class="opt-text">${bp.trait}</span>
              <span class="opt-effect">✦ 明示加成：${bp.desc}</span>
            </div>
          `).join('')}

          <label class="scout-label" style="margin-top: 15px;">选择场上位置：</label>
          <select id="wizPosition" class="ios-input">
            ${GAME_CONFIG.POSITIONS.map(p => `<option value="${p.code}">${p.name} - ${p.desc}</option>`).join('')}
          </select>
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div class="options-container">
          <label class="scout-label">抽取 3 个初始高阶天赋词条（点击选择）：</label>
          ${GAME_CONFIG.STARTING_TALENTS.map(t => `
            <div class="option-btn ${(formData.talents || []).includes(t.id) ? 'active-opt' : ''}" onclick="wizToggleTalent('${t.id}')">
              <span class="opt-tag" style="background: ${t.quality === 'GOLD' ? 'var(--gold-primary)' : 'var(--apple-red)'}; color:#000;">${t.quality} 品质</span>
              <span class="opt-text">${t.name}</span>
              <span class="opt-effect">${t.desc}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div class="options-container">
          <label class="scout-label">选择游戏节奏：</label>
          <select id="wizPacing" class="ios-input">
            <option value="STANDARD">标准模式 (月进度 - 深度沉浸)</option>
            <option value="ANNUAL">逐年模式 (年进度 - 极速快进)</option>
            <option value="CINEMA">电影模式 (全自动演播)</option>
          </select>

          <label class="scout-label" style="margin-top: 15px;">选择游戏难度：</label>
          <select id="wizDifficulty" class="ios-input">
            <option value="PRO">职业模式 (标准平衡)</option>
            <option value="ROOKIE">新星模式 (简单顺风)</option>
            <option value="HARDCORE">残酷模式 (硬核反腐与伤病)</option>
          </select>
        </div>
      `;
    }
  }
}
