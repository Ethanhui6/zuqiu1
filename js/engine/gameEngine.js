// Football Career Simulator V10.0 - Core Game State & Simulation Engine

class GameEngine {
  constructor() {
    this.resetState();
  }

  resetState() {
    const startingTeam = REAL_TEAMS.find(t => t.id === "zhejiang_fc") || REAL_TEAMS[REAL_TEAMS.length - 1];

    this.state = {
      name: "自建新星",
      age: 17,
      year: GAME_CONFIG.START_YEAR,
      month: GAME_CONFIG.START_MONTH,
      position: "ST",
      nationalityRegion: "ASIA",
      nationalityName: "中国",
      flag: "🇨🇳",
      team: startingTeam,
      teamName: startingTeam.name,
      teamColor: startingTeam.color,
      teamAccent: startingTeam.accent,
      
      // Attributes (PAC, SHO, PAS, DRI, DEF, PHY)
      stats: {
        PAC: 68,
        SHO: 66,
        PAS: 62,
        DRI: 67,
        DEF: 42,
        PHY: 60
      },
      ovr: 65,

      // Off-field Career Values
      fame: 10,
      money: 50000,
      weeklyWage: 3000,
      pressure: 10,
      coachTrust: 50,
      teammateRel: 60,
      fans: 5000,
      scoutInterest: 15,

      // History & Trophies
      trophiesWon: [],
      careerLogs: [],
      currentMonthEvent: null
    };

    this.recalculateOVR();
  }

  recalculateOVR() {
    const s = this.state.stats;
    // Weighted OVR based on position
    if (this.state.position.includes("W") || this.state.position === "ST") {
      this.state.ovr = Math.round((s.PAC * 0.25 + s.SHO * 0.25 + s.DRI * 0.25 + s.PAS * 0.15 + s.PHY * 0.1));
    } else if (this.state.position.includes("M")) {
      this.state.ovr = Math.round((s.PAS * 0.25 + s.DRI * 0.25 + s.SHO * 0.15 + s.PAC * 0.15 + s.DEF * 0.1 + s.PHY * 0.1));
    } else {
      this.state.ovr = Math.round((s.DEF * 0.35 + s.PHY * 0.30 + s.PAC * 0.15 + s.PAS * 0.15 + s.DRI * 0.05));
    }
  }

  boostRandomStat(amount = 1) {
    const statKeys = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const key = statKeys[Math.floor(Math.random() * statKeys.length)];
    this.state.stats[key] = Math.min(99, this.state.stats[key] + amount);
    this.recalculateOVR();
  }

  advanceMonth() {
    // Advance date
    this.state.month++;
    if (this.state.month > 12) {
      this.state.month = 1;
      this.state.year++;
      this.state.age++;

      // Annual summary & trophy opportunities
      this.evaluateAnnualTrophies();
    }

    // Monthly Salary
    this.state.money += this.state.weeklyWage * 4;

    // Pick random event for this month
    const randomEvent = MONTHLY_EVENTS[Math.floor(Math.random() * MONTHLY_EVENTS.length)];
    this.state.currentMonthEvent = randomEvent;

    // Log progress
    this.addLog(`进入 ${this.state.year}年${this.state.month}月 - 效力球队：${this.state.team.name} (OVR: ${this.state.ovr})`);
  }

  selectEventOption(optionIndex, rouletteResult = null) {
    const event = this.state.currentMonthEvent;
    if (!event || !event.options[optionIndex]) return;

    const opt = event.options[optionIndex];

    // Apply basic option effect
    opt.apply(this.state);

    // If roulette was triggered, apply roulette outcome
    if (rouletteResult) {
      if (rouletteResult.type === "NORMAL") {
        this.boostRandomStat(1);
        this.addLog(`🎲 转盘结果：触发【普通提升】，属性 +1！`);
      } else if (rouletteResult.type === "SUPER") {
        this.boostRandomStat(3);
        this.state.fame += 10;
        this.addLog(`🎰 转盘暴击：触发【基因突破】，属性 +3，声望 +10！`);
      } else if (rouletteResult.type === "EPIC") {
        this.boostRandomStat(5);
        this.state.fame += 25;
        this.addLog(`🌟 转盘神级表现：触发【高能蜕变】，属性 +5，声望 +25！`);
      } else if (rouletteResult.type === "BAD") {
        const statKeys = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
        const key = statKeys[Math.floor(Math.random() * statKeys.length)];
        this.state.stats[key] = Math.max(30, this.state.stats[key] - 1);
        this.addLog(`⚠️ 转盘挫折：突发【肌肉拉伤】，${key} -1！`);
      }
    } else {
      this.addLog(`做出抉择：${opt.tag} - ${opt.effectText}`);
    }

    this.recalculateOVR();
    this.state.currentMonthEvent = null;
  }

  evaluateAnnualTrophies() {
    // Check for league title
    if (this.state.ovr >= this.state.team.rating - 2 && Math.random() > 0.4) {
      this.awardTrophy("league_title", "国内顶级联赛冠军");
    }

    // High OVR trophy triggers
    if (this.state.ovr >= 85 && Math.random() > 0.5) {
      this.awardTrophy("ucl", "欧洲冠军联赛冠军");
    }
    if (this.state.ovr >= 88 && Math.random() > 0.6) {
      this.awardTrophy("ballon_dor", "金球奖 (Ballon d'Or)");
    }
    if (this.state.ovr >= 78 && this.state.nationalityName === "中国" && Math.random() > 0.5) {
      this.awardTrophy("afc_poty", "亚洲足球先生");
    }
  }

  awardTrophy(id, name) {
    this.state.trophiesWon.push({
      id: id,
      name: name,
      year: this.state.year,
      team: this.state.team.name
    });
    this.state.fame += 30;
    this.state.fans += 50000;
    this.addLog(`🏆 荣获重磅奖杯：【${name}】！全网瞩目！`);
  }

  addLog(text) {
    this.state.careerLogs.unshift({
      date: `${this.state.year}.${this.state.month}`,
      text: text
    });
  }
}
