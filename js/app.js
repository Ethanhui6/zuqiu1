// Football Career Simulator V10.0 - Main SPA Controller

document.addEventListener("DOMContentLoaded", () => {
  window.game = new GameEngine();
  
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
    window.game.advanceMonth();
    renderAll();
  });

  // Initial Render
  renderAll();
});

function switchTab(tabName) {
  const views = ["careerTab", "transferTab", "trophyTab", "setupTab"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === tabName) ? "block" : "none";
  });

  if (tabName === "transferTab") renderTransferMarket();
  if (tabName === "trophyTab") renderTrophyRoom();
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
  document.getElementById("statusWage").innerText = `€${s.weeklyWage.toLocaleString()}/周`;
  document.getElementById("statusMoney").innerText = `€${s.money.toLocaleString()}`;
  document.getElementById("statusFame").innerText = s.fame;
  document.getElementById("statusFans").innerText = s.fans.toLocaleString();
  document.getElementById("statusCoach").innerText = `${s.coachTrust}%`;
  document.getElementById("statusPressure").innerText = `${s.pressure}%`;
}

function renderMonthlyEvent() {
  const eventContainer = document.getElementById("eventContainer");
  const event = window.game.state.currentMonthEvent;

  if (!event) {
    eventContainer.innerHTML = `
      <div class="glass-panel event-card">
        <h3 class="event-title">📅 月度休整与例行训练中</h3>
        <p class="event-desc">本月球队暂无重大社会热点事件，全队正在训练基地按部就班备战联赛。请点击“模拟下个月”推进职业生涯线。</p>
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
    // Open Roulette Modal
    new RouletteWheel("rouletteContainer", (rouletteResult) => {
      window.game.selectEventOption(idx, rouletteResult);
      renderAll();
    });
  } else {
    window.game.selectEventOption(idx);
    renderAll();
  }
}

function renderTransferMarket() {
  const container = document.getElementById("transferTab");
  const offers = TransferEngine.evaluateMarketOffers(window.game.state);

  container.innerHTML = `
    <div class="glass-panel">
      <h2>💼 转会市场与球队求购报价 (Transfer Market)</h2>
      <p class="scout-label" style="margin-bottom: 20px;">基于你当前的 OVR (${window.game.state.ovr})、声望、年龄与赛季数据发来的真实邀约</p>

      <div class="options-container">
        ${offers.length === 0 ? '<p class="event-desc">暂无其他球队对你发出转会邀约，请继续在比赛中证明自己。</p>' : ''}
        ${offers.map(off => `
          <div class="option-btn" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <div>
                <span class="brand-badge" style="background: #38bdf8; color: #000;">${off.team.league} · ${off.team.tier}级球队</span>
                <h3 style="margin-top: 5px; color: var(--gold-primary);">${off.team.country} ${off.team.name}</h3>
              </div>
              <button class="btn-primary" style="padding: 8px 16px; font-size: 0.9rem;" onclick="acceptTransfer('${off.team.id}', ${off.weeklyWage})">接受加盟</button>
            </div>
            <p class="opt-effect" style="color: #cbd5e1; margin-top: 8px;">意向战术定位：${off.role} | 预计周薪：€${off.weeklyWage.toLocaleString()}</p>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${off.pitch}</p>
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
  window.game.state.teamColor = newTeam.color;
  window.game.state.teamAccent = newTeam.accent;
  window.game.state.weeklyWage = wage;
  window.game.state.fame += 20;

  window.game.addLog(`🎉 转会重磅官宣：正式加盟【${newTeam.name}】，签署新周薪 €${wage.toLocaleString()}！`);
  alert(`成功加盟 ${newTeam.name}！预祝新赛季大放异彩！`);
  
  switchTab("careerTab");
  document.querySelector('[data-tab="careerTab"]').classList.add("active");
  renderAll();
}

function renderTrophyRoom() {
  const container = document.getElementById("trophyTab");
  container.innerHTML = TrophyCabinet.render(window.game.state.trophiesWon);
}

function renderLogs() {
  const feed = document.getElementById("logsFeed");
  feed.innerHTML = window.game.state.careerLogs.map(log => `
    <div class="log-item">
      <strong>[${log.date}]</strong> ${log.text}
    </div>
  `).join('');
}
