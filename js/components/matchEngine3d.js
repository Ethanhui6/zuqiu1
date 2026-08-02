// Football Career Simulator V11.0 - 2.5D Interactive Match Engine (xG, Weather, MVP)

class MatchEngine3D {
  static simulateMatch(player, opponentTeam) {
    const weatherList = [
      { name: "☀️ 晴朗舒适 (夜场大灯)", impact: "适合灵动传控与远射" },
      { name: "🌧️ 狂风暴雨", impact: "场地湿滑，远射与失误率剧增" },
      { name: "❄️ 漫天大雪", impact: "体能消耗加倍，对抗优势凸显" }
    ];
    const weather = weatherList[Math.floor(Math.random() * weatherList.length)];

    // xG (Expected Goals) calculation
    const baseShooting = player.stats.SHO;
    const basePace = player.stats.PAC;
    const xG = ((baseShooting * 0.02) + (basePace * 0.015) + (Math.random() * 0.5)).toFixed(2);

    // Score & Performance Simulation
    const teamScore = Math.floor(Math.random() * 3) + (player.ovr > 75 ? 1 : 0);
    const oppScore = Math.floor(Math.random() * 3);
    const goalsScored = (Math.random() < parseFloat(xG)) ? Math.floor(Math.random() * 2) + 1 : 0;
    const assistsMade = (Math.random() < (player.stats.PAS * 0.012)) ? 1 : 0;
    const rating = (6.0 + goalsScored * 1.8 + assistsMade * 1.1 + (Math.random() * 0.8)).toFixed(1);

    const isMVP = parseFloat(rating) >= 8.5;

    return {
      opponent: opponentTeam.name,
      teamScore: teamScore,
      oppScore: oppScore,
      weather: weather,
      xG: xG,
      goals: goalsScored,
      assists: assistsMade,
      rating: rating,
      isMVP: isMVP
    };
  }

  static renderMatchModal(result, onClose) {
    return `
    <div class="match-overlay">
      <div class="match-modal glass-panel">
        <div class="match-header">
          <span class="brand-badge">${result.weather.name}</span>
          <h2>🏟️ 本月焦点对决：母队 VS ${result.opponent}</h2>
        </div>

        <!-- 2.5D Pitch Radar View -->
        <div class="pitch-25d-view">
          <div class="pitch-lines">
            <div class="penalty-box-left"></div>
            <div class="center-circle"></div>
            <div class="penalty-box-right"></div>
          </div>
          <div class="player-radar-dot" style="top: 45%; left: 60%;">⚽ 你 (${result.rating}分)</div>
        </div>

        <div class="match-stats-grid">
          <div class="m-stat"><span class="label">比分结果</span><span class="val highlight-gold">${result.teamScore} - ${result.oppScore}</span></div>
          <div class="m-stat"><span class="label">个人 xG 期望进球</span><span class="val">${result.xG}</span></div>
          <div class="m-stat"><span class="label">进球 / 助攻</span><span class="val">${result.goals} ⚽ / ${result.assists} 🅰️</span></div>
          <div class="m-stat"><span class="label">赛后评分</span><span class="val ${result.isMVP ? 'highlight-gold' : ''}">${result.rating} ${result.isMVP ? '🏆 MVP' : ''}</span></div>
        </div>

        <button id="closeMatchBtn" class="btn-primary" style="margin-top: 20px; width: 100%;">收下赛果并继续</button>
      </div>
    </div>
    `;
  }
}
