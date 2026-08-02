// Football Career Simulator V13.0 - V13 Engine

class GameEngine {
  constructor(seed = "20260801") {
    this.seed = seed;
    this.rng = new SeedRNG(seed);
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

      talents: [],

      stats: {
        PAC: 66,
        SHO: 65,
        PAS: 62,
        DRI: 66,
        DEF: 42,
        PHY: 60
      },
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
  }

  advanceMonth() {
    if (this.state.age >= GAME_CONFIG.RETIRE_AGE) return;

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

    this.addLog(`进入 ${this.state.year}年${this.state.month}月 - 效力：${this.state.team.name} (OVR: ${this.state.ovr} / 巅峰: ${this.state.peakOvr})`);
  }

  selectEventOption(optionIndex, rouletteResult = null) {
    const event = this.state.currentMonthEvent;
    if (!event || !event.options[optionIndex]) return;

    const opt = event.options[optionIndex];
    opt.apply(this.state);

    this.recalculateOVR();
    this.state.currentMonthEvent = null;
  }

  addLog(text) {
    this.state.careerLogs.unshift({
      date: `${this.state.year}.${this.state.month}`,
      text: text
    });
  }
}
