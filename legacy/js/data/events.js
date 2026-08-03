// Football Career Simulator - 60+ Career Life Story Dilemmas

const MONTHLY_EVENTS = [
  {
    id: "national_team_callup",
    title: "🇨🇳 国家队重磅征召：世预赛生死战发来提名单",
    category: "NATIONAL",
    description: "国足主教练将你列入世界杯亚洲区预选赛 18 人大名单！临行前，母队主帅提醒你：本月俱乐部有争冠生死战，过度劳累有拉伤风险。",
    options: [
      {
        text: "1. 报效祖国：“穿上国足战袍是我终极梦想，必定拼尽最后一滴汗水！”",
        tag: "家国情怀",
        effectText: "国足出场+1，国际声望+25，球迷+30000，体能经验+50",
        apply: (state) => {
          state.nationalApps += 1;
          state.fame += 25;
          state.fans += 30000;
          state.addExp("PHY", 50);
        }
      },
      {
        text: "2. 战术轮换：“跟国足主帅沟通，只踢关键的下半场 45 分钟。”",
        tag: "理性沟通",
        effectText: "国足出场+1，保存体能，教练信任度+10",
        apply: (state) => {
          state.nationalApps += 1;
          state.coachTrust += 10;
        }
      },
      {
        text: "3. 请求留队：“俱乐部争冠处于关头，申请请假留在母队参加争冠战。”",
        tag: "俱乐部至上",
        effectText: "母队信任度+20，争冠奖金+50000，但可能招致部分网民口诛笔伐",
        apply: (state) => {
          state.coachTrust += 20;
          state.money += 50000;
        }
      },
      {
        text: "4. 开启特训转盘：“在国足训练营加练死角任意球，争取一脚定乾坤！”",
        tag: "特训挑战",
        triggerRoulette: true,
        effectText: "触发加练转盘（获得大幅经验，或招致疲劳伤病）",
        apply: (state) => {
          state.nationalApps += 1;
          state.addExp("SHO", 80);
        }
      },
      {
        text: "5. 捐出津贴：“将国家队全部比赛津贴捐赠给贫困山区校园足球。”",
        tag: "慈善模范",
        effectText: "清白度+10，声望+30，获得全网高口碑评价，粉丝+50000",
        apply: (state) => {
          state.nationalApps += 1;
          state.innocence = Math.min(100, state.innocence + 10);
          state.fame += 30;
          state.fans += 50000;
        }
      }
    ]
  },
  {
    id: "squad_role_loan_dilemma",
    title: "👔 主教练谈话：由于能力尚处于磨砺期，建议租借外租",
    category: "CAREER_LOAN",
    description: "鉴于你目前处于成长突破期，一队主力竞争激烈，主教练与经纪人建议你租借至中下游球队打满主力，或留在母队当替补待命。",
    options: [
      {
        text: "1. 同意外租：“只要能保证周周踢上主力比赛，去任何球队我都愿意！”",
        tag: "主动外租",
        effectText: "队内角色调整为外租锻炼，出场时间保障，比赛经验+100",
        apply: (state) => {
          state.squadRole = "LOANED";
          state.addExp("PAC", 100);
          state.addExp("SHO", 100);
        }
      },
      {
        text: "2. 留队争夺替补：“留在豪门替补席训练，向世界级主力学习跑位！”",
        tag: "豪门沉淀",
        effectText: "队内角色调整为边缘替补，主帅信任度+15，战术智商增加",
        apply: (state) => {
          state.squadRole = "BENCH";
          state.coachTrust += 15;
          state.addExp("PAS", 60);
        }
      },
      {
        text: "3. 开启高强度加练：“用训练场上的惊人爆发，打消主教练的外租念头！”",
        tag: "加练逆袭",
        triggerRoulette: true,
        effectText: "触发加练转盘（极大几率直接上位主力，或引发体能透支）",
        apply: (state) => {
          state.addExp("PHY", 80);
        }
      },
      {
        text: "4. 要求增加合同保障条约：“要求经纪人在新合同中加入最少 15 场出场保证条款。”",
        tag: "条款博弈",
        effectText: "主帅信任度稍微波动，但合同有底线保障",
        apply: (state) => {
          state.coachTrust += 5;
        }
      },
      {
        text: "5. 呼吁球迷支持：“在懂球圈发表状态，表达对球队的热爱与留队决心。”",
        tag: "舆论支持",
        effectText: "粉丝+20000，舆论支持率上涨，管理层给予更多信任",
        apply: (state) => {
          state.fans += 20000;
          state.coachTrust += 10;
        }
      }
    ]
  }
];
