// Football Career Simulator - Match Simulation Component

class MatchEngine3D {
  static simulateMatch(player, opponentTeam) {
    const weatherList = ["☀️ 晴朗舒适 (夜场)", "🌧️ 狂风暴雨", "❄️ 漫天大雪"];
    const weather = weatherList[Math.floor(Math.random() * weatherList.length)];
    const xG = ((player.stats.SHO * 0.02) + (player.stats.PAC * 0.015) + (Math.random() * 0.5)).toFixed(2);
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

  static renderMatchModal(result) {
    return `
    <div class="match-overlay">
      <div class="match-modal glass-panel">
        <div class="match-header">
          <span class="brand-badge">${result.weather}</span>
          <h2>🏟️ 本月对局：母队 VS ${result.opponent}</h2>
        </div>

        <div class="pitch-25d-view">
          <div class="pitch-lines"><div class="center-circle"></div></div>
          <div class="player-radar-dot" style="top: 45%; left: 60%;">⚽ 你 (${result.rating}分)</div>
        </div>

        <div class="match-stats-grid">
          <div class="m-stat"><span class="label">比分结果</span><span class="val highlight-gold">${result.teamScore} - ${result.oppScore}</span></div>
          <div class="m-stat"><span class="label">进球 / 助攻</span><span class="val">${result.goals} ⚽ / ${result.assists} 🅰️</span></div>
          <div class="m-stat"><span class="label">赛后评分</span><span class="val">${result.rating} ${result.isMVP ? '🏆 MVP' : ''}</span></div>
        </div>

        <button id="closeMatchBtn" class="btn-primary" style="margin-top: 16px; width: 100%;">收下赛果并继续</button>
      </div>
    </div>
    `;
  }
}
