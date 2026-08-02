// Football Career Simulator - Transfer Engine

class TransferEngine {
  static evaluateMarketOffers(playerState) {
    const ovr = playerState.ovr;
    const offers = [];

    REAL_TEAMS.forEach(team => {
      if (team.id === playerState.team.id) return;
      if (ovr >= team.rating - 6) {
        const weeklyWage = Math.round(team.rating * 1200);
        offers.push({
          team: team,
          weeklyWage: weeklyWage,
          role: ovr >= team.rating ? "绝对主力" : "轮换球员"
        });
      }
    });

    return offers.sort((a, b) => b.weeklyWage - a.weeklyWage).slice(0, 5);
  }
}
