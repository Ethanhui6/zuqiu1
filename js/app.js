// Football Career Simulator V12.0 - Apple Music Edition Main Controller

document.addEventListener("DOMContentLoaded", () => {
  window.game = new GameEngine("20260801");
  
  // Navigation Tabs
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

  // Initial Render
  renderAll();
});

function switchTab(tabName) {
  const views = ["careerTab", "talentTab", "socialTab", "transferTab", "lifeTab", "galleryTab"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === tabName) ? "block" : "none";
  });

  if (tabName === "talentTab") renderTalentsView();
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
        <h3 class="event-title">📅 月度战术训练与备战中</h3>
        <p class="event-desc">全队在基地准备下场比赛，请点击“模拟下个月”推进进程。</p>
      </div>
    `;
    return;
  }

  eventContainer.innerHTML = `
    <div class="glass-panel event-card">
      <div class="event-header">
        <span class="brand-badge">${event.category}</span>
        <h3 class="event-title" style="margin-top: 8px;">${event.title}</h3>
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

function renderTalentsView() {
  const container = document.getElementById("talentListContainer");
  container.innerHTML = GAME_CONFIG.STARTING_TALENTS.map(t => {
    const isSelected = window.game.state.talents.some(x => x.id === t.id);
    return `
      <div class="option-btn" style="cursor: default; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="opt-tag" style="background: ${t.quality === 'GOLD' ? 'var(--gold-primary)' : 'var(--apple-red)'}; color:#000;">${t.quality} 品质</span>
          <span class="opt-text" style="margin-top: 4px; display: block;">${t.name}</span>
          <p class="opt-effect" style="color: #cbd5e1;">${t.desc}</p>
        </div>
        ${isSelected ? '<span class="brand-badge" style="background:#10b981; color:#000;">已激活</span>' : `<button class="btn-primary" style="padding: 6px 14px; font-size: 0.85rem;" onclick="activateTalent('${t.id}')">选择激活</button>`}
      </div>
    `;
  }).join('');
}

function activateTalent(id) {
  window.game.addTalent(id);
  alert("已激活该天赋词条属性加成！");
  renderTalentsView();
  renderAll();
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
      <h2>💼 全球转会市场 (Global Transfer Market)</h2>
      <div class="options-container" style="margin-top: 15px;">
        ${offers.map(off => `
          <div class="option-btn" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <span class="brand-badge" style="background: #38bdf8; color: #000;">${off.team.league} · ${off.team.tier}级</span>
                <h3 style="margin-top: 5px; color: var(--gold-primary);">${off.team.country} ${off.team.name}</h3>
              </div>
              <button class="btn-primary" style="padding: 8px 16px; font-size: 0.9rem;" onclick="acceptTransfer('${off.team.id}', ${off.weeklyWage})">同意加盟</button>
            </div>
            <p class="opt-effect" style="color: #cbd5e1; margin-top: 8px;">定位：${off.role} | 周薪：€${off.weeklyWage.toLocaleString()}</p>
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

function promptCustomSeed() {
  const input = prompt("请输入您想使用的游戏 Seed 种子（例如 20260801）：", window.game.state.seed);
  if (input) {
    window.game = new GameEngine(input);
    alert(`已重置为 Seed 种子：${input}`);
    renderAll();
  }
}

function exportSummaryCardImage() {
  alert("已生成 Apple 拟态终极总结卡！可截图保存分享至社交平台。");
}
