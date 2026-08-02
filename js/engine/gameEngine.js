// Football Career Simulator V11.0 - Core Engine (Bug Fixes & Accurate Settlement)

class GameEngine {
  constructor() {
    this.resetState();
  }

  resetState() {
    const startingTeam = REAL_TEAMS.find(t => t.id === "zhejiang_fc") || REAL_TEAMS[REAL_TEAMS.length - 1];
    const defaultBirthplace = GAME_CONFIG.BIRTHPLACES[0]; // 广东

    this.state = {
      name: "自建新星",
      age: 15,
      year: GAME_CONFIG.START_YEAR,
      month: GAME_CONFIG.START_MONTH,
      position: "ST",
      
      // Mode decoupled
      pacingMode: "STANDARD",
      difficultyMode: "PRO",

      birthplace: defaultBirthplace.name,
      nationalityRegion: "ASIA",
      nationalityName: "中国",
      flag: "🇨🇳",

      // Current Club & Serviced Club List
      team: startingTeam,
      teamName: startingTeam.name,
      teamColor: startingTeam.color,
      teamAccent: startingTeam.accent,
      clubList: [startingTeam.name],

      // Attributes (PAC, SHO, PAS, DRI, DEF, PHY)
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

      // Metrics & Values
      innocence: 80, // 清白值
      fame: 10,
      money: 50000 + defaultBirthplace.bonus.money,
      weeklyWage: 3000,
      pressure: 10,
      coachTrust: 50,
      teammateRel: 60,
      fans: 5000,
      scoutInterest: 15,
      nationalApps: 0, // 修复 bug 1：精准追踪国足出场

      // Equipment & Lifestyle
      propertyId: "flat",
      vehicleId: "sedan",
      gear: { hairstyle: "modern", headband: false, wristband: true },
      isInjured: false,

      // Honors & History
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

    // 修复 Bug 4：正确更新巅峰 OVR
    if (this.state.ovr > this.state.peakOvr) {
      this.state.peakOvr = this.state.ovr;
    }
  }

  boostRandomStat(amount = 1) {
    const statKeys = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const key = statKeys[Math.floor(Math.random() * statKeys.length)];
    this.state.stats[key] = Math.min(99, this.state.stats[key] + amount);
    this.recalculateOVR();
  }

  advanceMonth() {
    if (this.state.age >= GAME_CONFIG.RETIRE_AGE) return;

    this.state.month++;
    if (this.state.month > 12) {
      this.state.month = 1;
      this.state.year++;
      this.state.age++;

      // Age Decay after 30
      if (this.state.age > 30) {
        this.state.stats.PAC = Math.max(40, this.state.stats.PAC - 1);
        this.state.stats.PHY = Math.max(40, this.state.stats.PHY - 1);
      }

      this.evaluateAnnualTrophies();
    }

    this.state.money += this.state.weeklyWage * 4;

    const randomEvent = MONTHLY_EVENTS[Math.floor(Math.random() * MONTHLY_EVENTS.length)];
    this.state.currentMonthEvent = randomEvent;

    this.addLog(`进入 ${this.state.year}年${this.state.month}月 - 效力：${this.state.team.name} (当前OVR: ${this.state.ovr} / 巅峰OVR: ${this.state.peakOvr})`);
  }

  selectEventOption(optionIndex, rouletteResult = null) {
    const event = this.state.currentMonthEvent;
    if (!event || !event.options[optionIndex]) return;

    const opt = event.options[optionIndex];
    opt.apply(this.state);

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
        this.state.isInjured = true;
        this.boostRandomStat(-1);
        this.addLog(`⚠️ 转盘挫折：突发【肌肉拉伤】，进入伤停保护状态！`);
      }
    } else {
      this.addLog(`做出抉择：${opt.tag} - ${opt.effectText}`);
    }

    this.recalculateOVR();
    this.state.currentMonthEvent = null;
  }

  evaluateAnnualTrophies() {
    if (this.state.ovr >= this.state.team.rating - 2 && Math.random() > 0.4) {
      this.awardTrophy("league_title", "国内顶级联赛冠军");
    }
    if (this.state.ovr >= 85 && Math.random() > 0.5) {
      this.awardTrophy("ucl", "欧洲冠军联赛冠军");
    }
    if (this.state.ovr >= 88 && Math.random() > 0.6) {
      this.awardTrophy("ballon_dor", "金球奖 (Ballon d'Or)");
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
    this.addLog(`🏆 荣获重磅荣誉：【${name}】！全网瞩目！`);
  }

  addLog(text) {
    this.state.careerLogs.unshift({
      date: `${this.state.year}.${this.state.month}`,
      text: text
    });
  }
}
