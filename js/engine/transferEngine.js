// Football Career Simulator V10.0 - Real-World Transfer Market Engine

class TransferEngine {
  static evaluateMarketOffers(playerState) {
    const ovr = playerState.ovr;
    const age = playerState.age;
    const fame = playerState.fame;
    const offers = [];

    REAL_TEAMS.forEach(team => {
      // Skip current team
      if (team.id === playerState.team.id) return;

      const tierConfig = GAME_CONFIG.TEAM_TIERS[team.tier];
      
      // Eligibility check
      let isEligible = false;
      if (ovr >= tierConfig.minOvr - 3) {
        // High fame or young age boosts interest
        if (age <= 22 || fame >= 40 || ovr >= tierConfig.minOvr) {
          isEligible = true;
        }
      }

      if (isEligible) {
        // Calculate offered weekly wage based on tier & player OVR
        const wageMultiplier = 1 + (ovr - tierConfig.minOvr) * 0.15;
        const weeklyWage = Math.round(tierConfig.baseWeeklyWage * wageMultiplier);
        const transferFee = Math.round(ovr * ovr * 25000 * (32 - age > 0 ? (32 - age) / 10 : 0.5));

        // Pitch text
        let pitch = "";
        if (team.tier === "S") {
          pitch = "豪门邀请：承诺提供顶级竞技平台与冠军欧争竞争力！";
        } else if (team.tier === "A") {
          pitch = "绝对主力保障：围绕你打造核心进攻战术体系！";
        } else {
          pitch = "高薪丰厚战术核心地位诚意邀约！";
        }

        offers.push({
          team: team,
          weeklyWage: weeklyWage,
          transferFee: transferFee,
          role: ovr >= team.rating ? "绝对核心" : "主力轮换",
          pitch: pitch
        });
      }
    });

    // Sort by team tier and wage
    return offers.sort((a, b) => b.weeklyWage - a.weeklyWage).slice(0, 5);
  }
}
