// Football Career Simulator V10.0 - 5-Option Month-by-Month Events DB

const MONTHLY_EVENTS = [
  {
    id: "media_interview_star",
    title: "🎙️ 赛后焦点媒体采访",
    category: "MEDIA",
    description: "在上周末的焦点战中，你打入了一粒精彩的绝杀进球。赛后新闻发布会上，数十家体育媒体将麦克风对准了你，问你对目前球队战术和自身未来发展的看法。",
    options: [
      {
        text: "1. 谦逊回应：“这是全队配合的功劳，我只是完成了最后的临门一脚。”",
        tag: "低调稳健",
        effectText: "教练信任度 +10，队友关系 +15，心态压力 -5",
        apply: (state) => {
          state.coachTrust += 10;
          state.teammateRel += 15;
          state.pressure = Math.max(0, state.pressure - 5);
        }
      },
      {
        text: "2. 霸气放话：“我就是为大场面而生的，金球奖只是时间问题！”",
        tag: "高调狂妄",
        effectText: "声望 +20，球迷 +10000，触发突破转盘，压力 +15",
        triggerRoulette: true,
        apply: (state) => {
          state.fame += 20;
          state.fans += 10000;
          state.pressure += 15;
        }
      },
      {
        text: "3. 巧妙避开：“我们只专注于下一场比赛，不讨论个人荣誉。”",
        tag: "滴水不漏",
        effectText: "关系稳定，教练信任度 +5，获得商业关注",
        apply: (state) => {
          state.coachTrust += 5;
          state.money += 20000;
        }
      },
      {
        text: "4. 幽默解铁：“其实那球我是想传来着，没想到直接踢进了，哈哈！”",
        tag: "幽默风趣",
        effectText: "球迷 +15000，声望 +10，队友关系 +5",
        apply: (state) => {
          state.fans += 15000;
          state.fame += 10;
          state.teammateRel += 5;
        }
      },
      {
        text: "5. 制造新闻：“某些媒体之前对我质疑不断，现在被打脸的感觉如何？”",
        tag: "制造对立",
        effectText: "声望 +35，粉丝爆增 +30000，但媒体关系严峻，压力 +25",
        apply: (state) => {
          state.fame += 35;
          state.fans += 30000;
          state.pressure += 25;
        }
      }
    ]
  },
  {
    id: "tactical_adjustment",
    title: "📋 关键战前夕的主教练关门沟通",
    category: "TACTICS",
    description: "下周就是决定本赛季夺冠走向的争冠天王山之战，主教练在办公室把你叫住，希望听听你对你在场上位置和战术安排的看法。",
    options: [
      {
        text: "1. 主动主动请缨：“把我放在最擅长的主力位置，我保证攻破对方防线！”",
        tag: "积极自信",
        effectText: "能力全属性 +1，教练信任度 +10，出场顺位提升",
        apply: (state) => {
          state.coachTrust += 10;
          state.boostRandomStat(1);
        }
      },
      {
        text: "2. 服从安排：“只要能帮球队赢球，让我踢任何位置甚至干脏活累活我都愿意。”",
        tag: "团队至上",
        effectText: "防守/身体属性提升，队友关系 +20，教练信任度 +15",
        apply: (state) => {
          state.stats.DEF += 1;
          state.stats.PHY += 1;
          state.teammateRel += 20;
          state.coachTrust += 15;
        }
      },
      {
        text: "3. 开启高强度加练：“教练，今晚我想在基地加练 200 次射门和死角任意球！”",
        tag: "特训挑战",
        effectText: "触发加练转盘（可能暴击加能力，也可能肌肉拉伤）",
        triggerRoulette: true,
        apply: (state) => {
          state.stats.SHO += 2;
        }
      },
      {
        text: "4. 分析对方防线漏洞：“我研究了对方中卫的比赛录像，他们的转身速度是致命弱点。”",
        tag: "战术大师",
        effectText: "传球 +2，盘带 +1，教练信任度 +20",
        apply: (state) => {
          state.stats.PAS += 2;
          state.stats.DRI += 1;
          state.coachTrust += 20;
        }
      },
      {
        text: "5. 提出体能警报：“教练，最近连续一周双赛体能透支严重，我建议这半场替补出战。”",
        tag: "自我保护",
        effectText: "伤病风险大大降低，压力 -20，体能储备回满",
        apply: (state) => {
          state.pressure = Math.max(0, state.pressure - 20);
        }
      }
    ]
  },
  {
    id: "commercial_sponsor",
    title: "👟 顶级体育品牌巨额代言邀约",
    category: "COMMERCIAL",
    description: "凭借你在球场上的吸睛表现，国际一线体育运动品牌为你开出了一份高达数百万欧元的代言赞助合同，但赞助商希望你在本月参加多场商业推介会。",
    options: [
      {
        text: "1. 全盘接受：“没问题，球场内外的商业价值我都要抓！”",
        tag: "商业强人",
        effectText: "资金 +200,000，粉丝 +25000，但训练精力分散（体能压力 +15）",
        apply: (state) => {
          state.money += 200000;
          state.fans += 25000;
          state.pressure += 15;
        }
      },
      {
        text: "2. 婉拒多余活动：“只签约，但我必须把 95% 的精力留在足球训练场上。”",
        tag: "职业专注",
        effectText: "资金 +100,000，训练成果保留（速度+1，射门+1），教练信任度 +10",
        apply: (state) => {
          state.money += 100000;
          state.stats.PAC += 1;
          state.stats.SHO += 1;
          state.coachTrust += 10;
        }
      },
      {
        text: "3. 捐赠部分代言费：“将 30% 的赞助金捐赠给当地青训基地和慈善基金会。”",
        tag: "慈善典范",
        effectText: "声望 +30，获得‘慈善先锋’称号，粉丝 +40000",
        apply: (state) => {
          state.fame += 30;
          state.fans += 40000;
          state.money += 70000;
        }
      },
      {
        text: "4. 谈判加价：“我现在的潜力和曝光度远不止这个价，要求合同金额翻倍！”",
        tag: "高风险博弈",
        effectText: "触发谈判转盘（大赢或赞助告吹）",
        triggerRoulette: true,
        apply: (state) => {
          state.money += 150000;
        }
      },
      {
        text: "5. 分享给队友：“带上球队里的几位青训小将一起拍摄宣传海报。”",
        tag: "更衣室领袖",
        effectText: "队友关系 +30，资金 +80,000，声望 +10",
        apply: (state) => {
          state.teammateRel += 30;
          state.money += 80000;
          state.fame += 10;
        }
      }
    ]
  },
  {
    id: "scout_and_transfer_rumor",
    title: "🔍 欧洲豪门球探出现在看台上",
    category: "SCOUT",
    description: "本场比赛看台上出现了皇家马德里和曼城的资深高级球探，你的经纪人发来微信透露：这是你打响欧洲名堂的绝佳机会！",
    options: [
      {
        text: "1. 拿出招牌绝技：“今天我要在边路把防线彻底过穿！”",
        tag: "极尽个人表演",
        effectText: "盘带 +2，速度 +1，豪门关注度 +25，压力 +10",
        apply: (state) => {
          state.stats.DRI += 2;
          state.stats.PAC += 1;
          state.scoutInterest += 25;
          state.pressure += 10;
        }
      },
      {
        text: "2. 团队组织穿针引线：“展现我的足球智商，用精准传球串联全队。”",
        tag: "战术核武器",
        effectText: "传球 +2，防守 +1，豪门关注度 +20，队友关系 +10",
        apply: (state) => {
          state.stats.PAS += 2;
          state.stats.DEF += 1;
          state.scoutInterest += 20;
          state.teammateRel += 10;
        }
      },
      {
        text: "3. 开启幸运转盘挑战：“在球探面前尝试一脚 35 米外的超级世界波！”",
        tag: "惊天世界波",
        effectText: "触发转盘（成功声望大爆，失败可能被批评胡乱起脚）",
        triggerRoulette: true,
        apply: (state) => {
          state.scoutInterest += 15;
        }
      },
      {
        text: "4. 表态忠诚当前球队：“不管谁来看比赛，我现在的唯一目标是帮母队拿冠军。”",
        tag: "忠肝义胆",
        effectText: "本土球迷 +30000，球队队长袖标概率提升，队友关系 +20",
        apply: (state) => {
          state.fans += 30000;
          state.teammateRel += 20;
          state.coachTrust += 10;
        }
      },
      {
        text: "5. 赛后私下会见球探：“让经纪人赛后安排与豪门代表简短寒暄。”",
        tag: "私下接触",
        effectText: "豪门关注度 +30，周薪预估 +20%，但若曝光可能招致本土球迷不满",
        apply: (state) => {
          state.scoutInterest += 30;
          state.pressure += 15;
        }
      }
    ]
  }
];
