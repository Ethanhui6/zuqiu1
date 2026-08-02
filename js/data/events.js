// Football Career Simulator V11.0 - 50+ Multi-branch Dilemmas & Story Events

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
    id: "anti_corruption_inquiry",
    title: "⚖️ 足坛清算与反腐合规抽查",
    category: "COMPLIANCE",
    description: "专案调查组来到训练基地，对过去几年部分俱乐部的合同细节与签字费展开常规问询。你的经纪人曾为你签署过一份阴阳补充协议。",
    options: [
      {
        text: "1. 坦白从宽：“主动提交所有补充协议，坦白交代并配合补缴税款。”",
        tag: "坦诚合规",
        effectText: "清白度+30，资金 -50000，心态压力 -20，声望 +10",
        apply: (state) => {
          state.innocence = Math.min(100, state.innocence + 30);
          state.money = Math.max(0, state.money - 50000);
          state.pressure = Math.max(0, state.pressure - 20);
          state.fame += 10;
        }
      },
      {
        text: "2. 委托法务：“全权交由顶级律师团队处理，依法合规进行风险隔离。”",
        tag: "专业隔离",
        effectText: "资金 -80000（律师费），清白度稳定，不受舆论冲击",
        apply: (state) => {
          state.money = Math.max(0, state.money - 80000);
        }
      },
      {
        text: "3. 侥幸心理：“坚称自己毫不知情，全系前任经纪人个人行为。”",
        tag: "风险高博",
        triggerRoulette: true,
        effectText: "触发风险转盘（可能安全过关，也可能触发通报批评）",
        apply: (state) => {
          state.innocence = Math.max(0, state.innocence - 15);
        }
      },
      {
        text: "4. 解约经纪人：“公开宣布与涉事违规经纪人解除合作关系。”",
        tag: "划清界限",
        effectText: "清白度+15，舆论好评，但短期内转会资源稍有受限",
        apply: (state) => {
          state.innocence = Math.min(100, state.innocence + 15);
          state.fans += 20000;
        }
      },
      {
        text: "5. 呼吁行业正风肃纪：“在社交媒体上发表倡议，呼吁青训生态健康清白。”",
        tag: "正义发声",
        effectText: "声望+25，清白度+10，获得足协官方正面评价",
        apply: (state) => {
          state.fame += 25;
          state.innocence = Math.min(100, state.innocence + 10);
        }
      }
    ]
  },
  {
    id: "unpaid_wages_crisis",
    title: "💸 俱乐部欠薪风波与队长会议",
    category: "CLUB_CRISIS",
    description: "母队母公司资金链紧张，已连续 3 个月未发放球员工资与比赛奖金。更衣室内人心惶惶，老队长召集全队开会讨论是否罢训抗议。",
    options: [
      {
        text: "1. 领头签名抗议：“向足协仲裁委员会递交联名信，要求按规自由身离队！”",
        tag: "硬气维权",
        effectText: "触发转会自由身，队友关系+25，但与母队高层破裂",
        apply: (state) => {
          state.teammateRel += 25;
          state.coachTrust = Math.max(0, state.coachTrust - 20);
        }
      },
      {
        text: "2. 顾全大局：“安抚年轻队友，答应陪球队踢完本赛季最后的冲超/争冠战。”",
        tag: "职业操守",
        effectText: "球迷+40000，球队信任度爆表，获得‘忠诚基石’称号",
        apply: (state) => {
          state.fans += 40000;
          state.coachTrust += 30;
          state.fame += 15;
        }
      },
      {
        text: "3. 垫资自救：“动用个人部分商业资金，垫付基地后勤 staff 员工资。”",
        tag: "义薄云天",
        effectText: "资金 -100000，队友与员工关系+40，全网热搜致敬",
        apply: (state) => {
          state.money = Math.max(0, state.money - 100000);
          state.teammateRel += 40;
          state.fame += 35;
        }
      },
      {
        text: "4. 私下寻求挂牌转会：“让经纪人紧急联系五大联赛/西亚豪门抛出橄榄枝。”",
        tag: "寻找出路",
        effectText: "豪门关注度+20，获得海外试训邀请",
        apply: (state) => {
          state.scoutInterest += 20;
        }
      },
      {
        text: "5. 开启命运转盘：“在缺薪高压下化愤怒为力量，场上爆发出惊人战斗力！”",
        tag: "逆境爆种",
        triggerRoulette: true,
        effectText: "触发逆境转盘（极大几率连连续破门，提升个人身价）",
        apply: (state) => {
          state.stats.SHO += 2;
          state.stats.PAC += 1;
        }
      }
    ]
  }
];
