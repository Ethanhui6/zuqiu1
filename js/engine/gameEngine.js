// Football Career Simulator V14.0 - Core Engine (EXP Growth & Single Advance Lock)

class GameEngine {
  constructor(seed = "20260801") {
    this.seed = seed;
    this.rng = new SeedRNG(seed);
    this.isAdvanceLocked = false; // Prevents duplicate/infinite clicks
    this.resetState();
  }

  resetState() {
    const startingTeam = REAL_TEAMS.find(t => t.id === "zhejiang_fc") || REAL_TEAMS[REAL_TEAMS.length - 1];
    const defaultBirthplace = GAME_CONFIG.BIRTHPLACES[0];

    this.state = {
      seed: this.seed,
      name: "自建新星",
      foot: "右脚",
      number: 10,
      age: 15,
      year: GAME_CONFIG.START_YEAR,
      month: GAME_CONFIG.START_MONTH,
      position: "ST",
      
      pacingMode: "STANDARD",
      difficultyMode: "PRO",

      birthplace: defaultBirthplace.name,
      nationalityRegion: "ASIA",
      nationalityName: "中国",
      flag: "🇨🇳",

      team: startingTeam,
      teamName: startingTeam.name,
      teamColor: startingTeam.color,
      teamAccent: startingTeam.accent,
      clubList: [startingTeam.name],
      squadRole: "ROTATION", // 阵容角色 (STAR / ROTATION / BENCH / LOANED)

      talents: [],

      // Stats and EXP
      stats: { PAC: 66, SHO: 65, PAS: 62, DRI: 66, DEF: 42, PHY: 60 },
      exp: 0, // EXP toward next stat level
      ovr: 64,
      peakOvr: 64,

      innocence: 80,
      fame: 10,
      money: 50000 + defaultBirthplace.bonus.money,
      weeklyWage: 3000,
      pressure: 10,
      coachTrust: 50,
      teammateRel: 60,
      fans: 5000,
      scoutInterest: 15,
      nationalApps: 0,

      propertyId: "flat",
      vehicleId: "sedan",
      gear: { hairstyle: "modern", headband: false, wristband: true },
      isInjured: false,

      trophiesWon: [],
      careerLogs: [],
      currentMonthEvent: null
    };

    this.recalculateOVR();
  }

  setBirthplace(code) {
    const bp = GAME_CONFIG.BIRTHPLACES.find(b => b.code === code) || GAME_CONFIG.BIRTHPLACES[0];
    this.state.birthplace = bp.name;
    if (bp.bonus.DRI) this.state.stats.DRI += bp.bonus.DRI;
    if (bp.bonus.PHY) this.state.stats.PHY += bp.bonus.PHY;
    if (bp.bonus.PAC) this.state.stats.PAC += bp.bonus.PAC;
    if (bp.bonus.money) this.state.money += bp.bonus.money;
    if (bp.bonus.fame) this.state.fame += bp.bonus.fame;
    this.recalculateOVR();
  }

  addExp(statKey, amount) {
    this.state.exp += amount;
    while (this.state.exp >= GAME_CONFIG.EXP_PER_STAT_LEVEL) {
      this.state.exp -= GAME_CONFIG.EXP_PER_STAT_LEVEL;
      if (statKey && this.state.stats[statKey]) {
        this.state.stats[statKey] = Math.min(99, this.state.stats[statKey] + 1);
        this.addLog(`⭐ 累计经验爆发：【${statKey}】属性提升 +1！`);
      } else {
        this.boostRandomStat(1);
      }
    }
    this.recalculateOVR();
  }

  recalculateOVR() {
    const s = this.state.stats;
    if (this.state.position.includes("W") || this.state.position === "ST") {
      this.state.ovr = Math.round((s.PAC * 0.25 + s.SHO * 0.25 + s.DRI * 0.25 + s.PAS * 0.15 + s.PHY * 0.1));
    } else if (this.state.position.includes("M")) {
      this.state.ovr = Math.round((s.PAS * 0.25 + s.DRI * 0.25 + s.SHO * 0.15 + s.PAC * 0.15 + s.DEF * 0.1 + s.PHY * 0.1));
    } else {
      this.state.ovr = Math.round((s.DEF * 0.35 + s.PHY * 0.30 + s.PAC * 0.15 + s.PAS * 0.15 + s.DRI * 0.05));
    }

    if (this.state.ovr > this.state.peakOvr) {
      this.state.peakOvr = this.state.ovr;
    }

    // Evaluate Squad Role
    const ovrDiff = this.state.ovr - this.state.team.rating;
    if (ovrDiff >= 2) this.state.squadRole = "STAR";
    else if (ovrDiff >= -5) this.state.squadRole = "ROTATION";
    else this.state.squadRole = "BENCH";
  }

  boostRandomStat(amount = 1) {
    const statKeys = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const key = statKeys[Math.floor(Math.random() * statKeys.length)];
    this.state.stats[key] = Math.min(99, this.state.stats[key] + amount);
    this.recalculateOVR();
  }

  advanceMonth() {
    if (this.isAdvanceLocked || this.state.age >= GAME_CONFIG.RETIRE_AGE) return;
    this.isAdvanceLocked = true;

    this.state.month++;
    if (this.state.month > 12) {
      this.state.month = 1;
      this.state.year++;
      this.state.age++;

      if (this.state.age > 30) {
        this.state.stats.PAC = Math.max(40, this.state.stats.PAC - 1);
        this.state.stats.PHY = Math.max(40, this.state.stats.PHY - 1);
      }
    }

    this.state.money += this.state.weeklyWage * 4;

    const randomEvent = MONTHLY_EVENTS[Math.floor(this.rng.next() * MONTHLY_EVENTS.length)];
    this.state.currentMonthEvent = randomEvent;

    this.addLog(`进入 ${this.state.year}年${this.state.month}月 - 效力：${this.state.team.name} (${this.getSquadRoleText()})`);
  }

  unlockAdvance() {
    this.isAdvanceLocked = false;
  }

  selectEventOption(optionIndex, rouletteResult = null) {
    const event = this.state.currentMonthEvent;
    if (!event || !event.options[optionIndex]) return;

    const opt = event.options[optionIndex];
    opt.apply(this.state);

    this.recalculateOVR();
    this.state.currentMonthEvent = null;
    this.unlockAdvance();
  }

  getSquadRoleText() {
    if (this.state.squadRole === "STAR") return "核心主力";
    if (this.state.squadRole === "ROTATION") return "轮换球员";
    if (this.state.squadRole === "BENCH") return "边缘替补";
    if (this.state.squadRole === "LOANED") return "外租锻炼";
    return "主力";
  }

  addLog(text) {
    this.state.careerLogs.unshift({
      date: `${this.state.year}.${this.state.month}`,
      text: text
    });
  }
}
