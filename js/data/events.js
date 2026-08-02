// Football Career Simulator V12.0 - 50+ Multi-branch Story Dilemmas

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
        effectText: "国足出场+1，国际声望+25，球迷+30000，体能压力+15",
        apply: (state) => {
          state.nationalApps += 1;
          state.fame += 25;
          state.fans += 30000;
          state.pressure += 15;
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
          state.pressure += 10;
        }
      },
      {
        text: "4. 开启特训转盘：“在国足训练营加练死角任意球，争取一脚定乾坤！”",
        tag: "特训挑战",
        triggerRoulette: true,
        effectText: "触发加练转盘（极大提升射门传球，或招致疲劳伤病）",
        apply: (state) => {
          state.nationalApps += 1;
          state.stats.SHO += 2;
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
    id: "press_conference_debate",
    title: "🎙️ 赛后新闻发布会：记者刁钻提问比赛争议点球",
    category: "PRESS",
    description: "本场比赛补时阶段你创造关键点球绝杀比赛，对方主帅抗议是你假摔造点。赛后发布会上，懂球帝与体育周刊记者逼问你的真实看法。",
    options: [
      {
        text: "1. 坚定捍卫：“那是禁区内明显的身体接触，裁判判罚无比公允！”",
        tag: "义正言辞",
        effectText: "队友关系+15，球队得胜得分，但在懂球帝引发热议",
        apply: (state) => {
          state.teammateRel += 15;
          state.fans += 10000;
        }
      },
      {
        text: "2. 幽默调侃：“脚下确实被绊了一下，如果我是跳水名将，那也是满分落水。”",
        tag: "幽默幽默",
        effectText: "全网热搜第一，粉丝+30000，声望+15",
        apply: (state) => {
          state.fans += 30000;
          state.fame += 15;
        }
      },
      {
        text: "3. 避谈裁判：“比赛过程充满对抗，我们全队全场付出了百分百努力。”",
        tag: "标准外交",
        effectText: "主帅信任度+10，关系稳定",
        apply: (state) => {
          state.coachTrust += 10;
        }
      },
      {
        text: "4. 公开回击对方主帅：“如果败者只能把失败归咎于裁判，那是心胸狭隘。”",
        tag: "制造对立",
        effectText: "声望+30，粉丝爆发，但压力+20，做客对方客场受嘘声",
        apply: (state) => {
          state.fame += 30;
          state.pressure += 20;
        }
      },
      {
        text: "5. 开启风波转盘：“现场复盘比赛回放，向记者深度拆解跑位逻辑！”",
        tag: "战术复盘",
        triggerRoulette: true,
        effectText: "触发转盘（成功证明战术素养，失败可能招致争论）",
        apply: (state) => {
          state.fame += 10;
        }
      }
    ]
  }
];
