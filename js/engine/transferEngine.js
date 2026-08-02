// Football Career Simulator V11.0 - Transfer Market & Club Count Tracking

class TransferEngine {
  static evaluateMarketOffers(playerState) {
    const ovr = playerState.ovr;
    const age = playerState.age;
    const fame = playerState.fame;
    const offers = [];

    REAL_TEAMS.forEach(team => {
      if (team.id === playerState.team.id) return;
      const tierConfig = GAME_CONFIG.TEAM_TIERS[team.tier] || GAME_CONFIG.TEAM_TIERS.C;
      
      let isEligible = false;
      if (ovr >= tierConfig.minOvr - 3) {
        if (age <= 23 || fame >= 30 || ovr >= tierConfig.minOvr) {
          isEligible = true;
        }
      }

      if (isEligible) {
        const wageMultiplier = 1 + (ovr - tierConfig.minOvr) * 0.15;
        const weeklyWage = Math.round(tierConfig.baseWeeklyWage * wageMultiplier);
        const transferFee = Math.round(ovr * ovr * 25000 * (32 - age > 0 ? (32 - age) / 10 : 0.5));

        offers.push({
          team: team,
          weeklyWage: weeklyWage,
          transferFee: transferFee,
          role: ovr >= team.rating ? "绝对核心主力" : "轮换阵容球员",
          pitch: `承诺围绕你打造战术阵型！`
        });
      }
    });

    return offers.sort((a, b) => b.weeklyWage - a.weeklyWage).slice(0, 5);
  }
}
