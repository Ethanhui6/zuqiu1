const globalItems = [
  ['FX-001', '按钮按压', '全局', '按下主要按钮', '缩放与颜色反馈'], ['FX-002', '卡片选中', '全局', '选择卡片', '边框高亮与勾选'], ['FX-003', '卡片展开', '全局', '展开详情', '高度过渡'], ['FX-004', '页面切换', '全局', '切换底部导航', '页面进入'], ['FX-005', '标签切换', '全局', '切换筛选标签', '选中指示器移动'], ['FX-006', '滑块拖动', '设置', '调整音量或数值', '轨道与数值同步'], ['FX-007', '长按提示', '全局', '长按交互区域', '提示浮层'], ['FX-008', '返回手势', '全局', '关闭底部面板', '面板下滑退出'], ['FX-009', '面板打开', '全局', '打开底部面板', '面板上移'], ['FX-010', '面板关闭', '全局', '关闭底部面板', '面板下移'], ['FX-011', '提示进入', '全局', '产生即时反馈', '提示进入'], ['FX-012', '提示退出', '全局', '提示到时', '提示退出'], ['FX-013', '保存成功', '全局', '保存存档', '保存图标变色'], ['FX-014', '保存失败', '全局', '保存异常', '错误抖动'], ['FX-015', '待办高亮', '生涯', '存在强制待办', '待办脉冲']
];
const homeItems = ['赛季进度推进','下一节点出现','待办阻止推进','日期翻页','比赛日到达','转会窗开启','转会窗关闭','新赛季开始','赛季结束','当前周变化','保存状态变化','模式切换'].map((name,index)=>[`FX-${String(index+16).padStart(3,'0')}`,name,'生涯','对应状态变化','时间轴、状态条或按钮反馈']);
const growthItems = ['属性增加','属性减少','属性接近整数','属性整数升级','综合能力进度','综合能力升级','潜力变化','雷达图形变','状态上升','状态下降','教练信任变化','士气变化','身价变化','角色提升','主力身份变化'].map((name,index)=>[`FX-${String(index+28).padStart(3,'0')}`,name,'成长','成长引擎提交结果','数字、条形、雷达或徽章反馈']);
const gameNames = ['冲刺起跑','折返跑','射门靶区','点球训练','任意球训练','盘带绕桩','传球靶点','直塞训练','头球训练','抢断训练','身体对抗','反应灯训练','视觉扫描','战术判断','门将扑救','门将出击','门将高空球','门将开球','康复训练','核心稳定'];
const trainingItems = gameNames.flatMap((name,index)=>['操作','成功','失败','结算','新纪录'].map((phase,step)=>{
  const number=43+index*5+step; return [`FX-${String(number).padStart(3,'0')}`,`${name}${phase}反馈`,'训练',`触发${name}的${phase}阶段`,`${phase}表现与状态变化`];
}));
const matchNames = ['射门','传球','直塞','盘带','抢断','对抗','头球','点球','任意球','门将扑救','门将出击','门将高空球','门将开球','红黄牌','进球','越位','犯规','受伤','换人','终场'];
const matchItems = matchNames.map((name,index)=>[`FX-${String(143+index).padStart(3,'0')}`,`比赛${name}`,'比赛','比赛互动命中或结算','镜头、状态与音效反馈']);
const careerNames = ['普通事件','稀有事件','传奇事件','危机事件','选择确认','结果揭晓','事件链开启','后续事件到达','成就解锁','奖杯获得','合同签约','转会完成','转会失败','伤病发生','康复完成','新闻发布','球迷反应','赛季履历生成'];
const careerItems = careerNames.map((name,index)=>[`FX-${String(163+index).padStart(3,'0')}`,name,'事件与生涯','对应事件或奖励状态改变','结果层、徽章或时间轴反馈']);

export const INTERACTION_REGISTRY = Object.freeze([...globalItems,...homeItems,...growthItems,...trainingItems,...matchItems,...careerItems].map(([id,name,page,trigger,effect]) => Object.freeze({ id, name, page, trigger, effect, sound: true, affectsState: !['全局','设置'].includes(page), reducedMotion: '保留状态反馈，降低位移' })));
export const INTERACTION_COUNT = INTERACTION_REGISTRY.length;
export const interactionById = id => INTERACTION_REGISTRY.find(item => item.id === id) || null;

