// Football Career Simulator V13.0 - Main SPA Controller

let wizardState = { step: 1, data: { name: '自建新星', foot: '右脚', number: 10, seed: '20260801', birthplace: 'GD', talents: [] } };

document.addEventListener("DOMContentLoaded", () => {
  window.game = new GameEngine("20260801");
  
  // Tabs Navigation
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      tabBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      const tabName = e.target.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Advance Month Button
  document.getElementById("advanceMonthBtn").addEventListener("click", () => {
    if (window.game.state.age >= GAME_CONFIG.RETIRE_AGE) {
      renderSecondCareerOrSummary();
      return;
    }

    window.game.advanceMonth();
    
    if (window.game.state.month % 3 === 0) {
      triggerMatchPopup();
    } else {
      renderAll();
    }
  });

  renderAll();
});

function switchTab(tabName) {
  const views = ["careerTab", "socialTab", "transferTab", "lifeTab", "galleryTab"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === tabName) ? "block" : "none";
  });

  if (tabName === "socialTab") renderSocialFeed();
  if (tabName === "transferTab") renderTransferMarket();
  if (tabName === "lifeTab") renderLifeSimulator();
  if (tabName === "galleryTab") renderGallery();
}

function renderAll() {
  renderPlayerCardAndScout();
  renderStatusBar();
  renderMonthlyEvent();
  renderLogs();
}

function renderPlayerCardAndScout() {
  const cardContainer = document.getElementById("playerCardContainer");
  if (cardContainer) {
    cardContainer.innerHTML = PlayerCard.render(window.game.state);
  }
}

function renderStatusBar() {
  const s = window.game.state;
  document.getElementById("statusDate").innerText = `${s.year}年${s.month}月`;
  document.getElementById("statusAge").innerText = `${s.age} 岁`;
  document.getElementById("statusTeam").innerText = s.team.name;
  document.getElementById("statusWage").innerText = `€${s.weeklyWage.toLocaleString()}`;
  document.getElementById("statusMoney").innerText = `€${s.money.toLocaleString()}`;
  document.getElementById("statusFame").innerText = s.fame;
  document.getElementById("statusFans").innerText = s.fans.toLocaleString();
  document.getElementById("statusNational").innerText = s.nationalApps > 0 ? `🇨🇳 国足 ${s.nationalApps} 场` : '未进国足';
  document.getElementById("statusInnocence").innerText = `${s.innocence}%`;
  document.getElementById("currentSeedText").innerText = s.seed;
}

function renderMonthlyEvent() {
  const eventContainer = document.getElementById("eventContainer");
  const event = window.game.state.currentMonthEvent;

  if (!event) {
    eventContainer.innerHTML = `
      <div class="glass-panel event-card">
        <h3 class="event-title">📅 月度战术备战中</h3>
        <p class="event-desc">全队在基地准备下场比赛，请点击“模拟下个月”。</p>
      </div>
    `;
    return;
  }

  eventContainer.innerHTML = `
    <div class="glass-panel event-card">
      <div class="event-header">
        <span class="brand-badge">${event.category}</span>
        <h3 class="event-title" style="margin-top: 6px;">${event.title}</h3>
      </div>
      <p class="event-desc">${event.description}</p>

      <div class="options-container">
        ${event.options.map((opt, idx) => `
          <button class="option-btn" onclick="handleOptionSelect(${idx})">
            <span class="opt-tag">${opt.tag}</span>
            <span class="opt-text">${opt.text}</span>
            <span class="opt-effect">⚡ 预测影响：${opt.effectText}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function handleOptionSelect(idx) {
  const event = window.game.state.currentMonthEvent;
  const opt = event.options[idx];

  if (opt.triggerRoulette) {
    new RouletteWheel("rouletteContainer", (rouletteResult) => {
      window.game.selectEventOption(idx, rouletteResult);
      renderAll();
    });
  } else {
    window.game.selectEventOption(idx);
    renderAll();
  }
}

function triggerMatchPopup() {
  const opp = REAL_TEAMS[Math.floor(Math.random() * REAL_TEAMS.length)];
  const result = MatchEngine3D.simulateMatch(window.game.state, opp);

  const container = document.getElementById("matchModalContainer");
  container.innerHTML = MatchEngine3D.renderMatchModal(result);

  document.getElementById("closeMatchBtn").addEventListener("click", () => {
    container.innerHTML = "";
    window.game.addLog(`🏟️ 比赛哨响：母队 ${result.teamScore}-${result.oppScore} ${opp.name}，评分 ${result.rating}（进球 ${result.goals} / 助攻 ${result.assists}）`);
    renderAll();
  });
}

function renderSocialFeed() {
  const container = document.getElementById("socialTab");
  container.innerHTML = SocialFeed.renderFeed(window.game.state);
}

function renderTransferMarket() {
  const container = document.getElementById("transferTab");
  const offers = TransferEngine.evaluateMarketOffers(window.game.state);

  container.innerHTML = `
    <div class="glass-panel">
      <h2>💼 全球转会市场 (Transfer Market)</h2>
      <div class="options-container" style="margin-top: 12px;">
        ${offers.map(off => `
          <div class="option-btn" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <span class="brand-badge" style="background: #38bdf8; color: #000;">${off.team.league} · ${off.team.tier}级</span>
                <h3 style="margin-top: 4px; color: var(--gold-primary);">${off.team.country} ${off.team.name}</h3>
              </div>
              <button class="btn-primary" style="padding: 6px 14px; font-size: 0.85rem;" onclick="acceptTransfer('${off.team.id}', ${off.weeklyWage})">同意加盟</button>
            </div>
            <p class="opt-effect" style="color: #cbd5e1; margin-top: 6px;">定位：${off.role} | 周薪：€${off.weeklyWage.toLocaleString()}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function acceptTransfer(teamId, wage) {
  const newTeam = REAL_TEAMS.find(t => t.id === teamId);
  if (!newTeam) return;

  window.game.state.team = newTeam;
  window.game.state.teamName = newTeam.name;
  window.game.state.weeklyWage = wage;
  if (!window.game.state.clubList.includes(newTeam.name)) {
    window.game.state.clubList.push(newTeam.name);
  }

  window.game.addLog(`🎉 转会官宣：加盟【${newTeam.name}】，签署新周薪 €${wage.toLocaleString()}！`);
  alert(`成功加盟 ${newTeam.name}！`);
  
  switchTab("careerTab");
  document.querySelector('[data-tab="careerTab"]').classList.add("active");
  renderAll();
}

function renderLifeSimulator() {
  const container = document.getElementById("lifeTab");
  container.innerHTML = LifeSimulator.render(window.game.state);
}

function buyProperty(propId, cost) {
  if (window.game.state.money < cost) return;
  window.game.state.money -= cost;
  window.game.state.propertyId = propId;
  alert("购置成功！已搬入新住所！");
  renderLifeSimulator();
  renderAll();
}

function renderGallery() {
  const container = document.getElementById("galleryTab");
  container.innerHTML = AchievementGallery.render();
}

function renderLogs() {
  const feed = document.getElementById("logsFeed");
  feed.innerHTML = window.game.state.careerLogs.map(log => `
    <div class="log-item">
      <strong>[${log.date}]</strong> ${log.text}
    </div>
  `).join('');
}

function renderSecondCareerOrSummary() {
  const container = document.getElementById("careerTab");
  container.innerHTML = SecondCareer.renderOptions(window.game.state);
}

function startSecondCareer(careerId) {
  const career = GAME_CONFIG.SECOND_LIFE_CAREERS.find(c => c.id === careerId);
  alert(`开启第二人生：${career.name}！`);
  const container = document.getElementById("careerTab");
  container.innerHTML = SummaryCard.renderSummary(window.game.state);
}

// Wizard Modal Methods
function openWizardModal() {
  wizardState = { step: 1, data: { name: window.game.state.name, foot: window.game.state.foot || '右脚', number: window.game.state.number || 10, seed: window.game.state.seed, birthplace: 'GD', talents: [] } };
  const container = document.getElementById("wizardContainer");
  container.innerHTML = CharacterWizard.renderWizard(wizardState.step, wizardState.data);
}

function nextWizardStep(step) {
  if (step === 1) {
    const name = document.getElementById("wizName").value;
    const foot = document.getElementById("wizFoot").value;
    const number = document.getElementById("wizNumber").value;
    const seed = document.getElementById("wizSeed").value;
    wizardState.data = { ...wizardState.data, name, foot, number, seed };
  }
  wizardState.step = step + 1;
  const container = document.getElementById("wizardContainer");
  container.innerHTML = CharacterWizard.renderWizard(wizardState.step, wizardState.data);
}

function prevWizardStep(step) {
  wizardState.step = step - 1;
  const container = document.getElementById("wizardContainer");
  container.innerHTML = CharacterWizard.renderWizard(wizardState.step, wizardState.data);
}

function wizSelectBirthplace(code) {
  wizardState.data.birthplace = code;
  const container = document.getElementById("wizardContainer");
  container.innerHTML = CharacterWizard.renderWizard(wizardState.step, wizardState.data);
}

function wizToggleTalent(id) {
  if (!wizardState.data.talents) wizardState.data.talents = [];
  if (wizardState.data.talents.includes(id)) {
    wizardState.data.talents = wizardState.data.talents.filter(x => x !== id);
  } else {
    wizardState.data.talents.push(id);
  }
  const container = document.getElementById("wizardContainer");
  container.innerHTML = CharacterWizard.renderWizard(wizardState.step, wizardState.data);
}

function finishCharacterCreation() {
  const d = wizardState.data;
  window.game = new GameEngine(d.seed || "20260801");
  window.game.state.name = d.name || "自建新星";
  window.game.state.foot = d.foot || "右脚";
  window.game.state.number = d.number || 10;
  
  if (d.birthplace) window.game.setBirthplace(d.birthplace);
  if (d.talents) d.talents.forEach(tId => window.game.addTalent(tId));

  document.getElementById("wizardContainer").innerHTML = "";
  alert("角色建模与初始设定完成！开始全新职业生涯！");
  renderAll();
}

function exportSummaryCardImage() {
  alert("已生成 Apple 风格终极总结卡！可截图保存分享至社交平台。");
}
