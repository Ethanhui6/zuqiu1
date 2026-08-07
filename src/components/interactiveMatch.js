import { advanceMatchState } from '../core/matchState.js';
import { createMatchMiniPitch } from './matchMiniPitch.js';
import { activateMiniGame, createMiniGameSession, resolveMiniGame } from '../core/miniGameLibrary.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

const DIRECTIONS = ['left', 'center', 'right'];
const directionLabel = { left: '左侧', center: '中路', right: '右侧' };

function seedNumber(seed, offset = 0) {
  return Math.abs((Number(seed) || 0) + offset * 17) % 997;
}

function directions(seed) {
  return DIRECTIONS[seedNumber(seed) % 3];
}

function button(label, attrs = '') {
  return `<button class="game-control" type="button" ${attrs}>${label}</button>`;
}

export function createInteractiveMatch({ option, player, seed = 0, matchState, highlight, onComplete, onSkip } = {}) {
  const node = document.createElement('div');
  node.className = 'interactive-match';
  let miniGame = createMiniGameSession(matchState?.miniGame?.id || option?.mechanic, 'interactiveMatch');
  const updateMiniGame = next => { miniGame = next; node.dataset.miniGameState = miniGame.status; };
  updateMiniGame(miniGame);
  let liveState = structuredClone(matchState || { matchMinute: 0, possession: 50, teamMomentum: 50, pressure: 50, player: { energy: player?.fitness || 80, rating: 6 }, zone: 'middle' });
  node.innerHTML = `
    <div class="game-intro">
      <span class="badge blue">${option?.name || '比赛互动'}</span>
      <span class="badge green">${statLabel(option?.stat)} · ${player?.position || ''}</span>
      ${matchState?.miniGame?.difficulty ? `<span class="badge orange">难度 ${matchState.miniGame.difficulty}</span>` : ''}
    </div>
    <div class="match-live-state" data-match-live-state aria-live="polite"></div>
    <div data-mini-pitch-host></div>
    <p class="card-copy game-instruction">${option?.copy || '完成一次比赛中的关键操作。'}</p>
    <div class="game-countdown" data-countdown aria-live="polite" hidden>3</div>
    <div class="game-area" data-game-area></div>
    <div class="game-feedback" data-game-feedback aria-live="polite">准备观察局势</div>
    <div class="game-footer"><button class="app-button ghost" type="button" data-skip>跳过本次互动</button><span class="card-copy" data-time-left></span></div>`;

  const area = node.querySelector('[data-game-area]');
  const countdown = node.querySelector('[data-countdown]');
  const feedback = node.querySelector('[data-game-feedback]');
  const timeLeft = node.querySelector('[data-time-left]');
  const liveStateNode = node.querySelector('[data-match-live-state]');
  const pitch = createMatchMiniPitch({ state: liveState, highlight });
  node.querySelector('[data-mini-pitch-host]')?.append(pitch);
  const cleanups = [];
  let ended = false;
  let raf = 0;
  let timer = 0;
  let ticker = 0;

  const listen = (target, type, handler, options) => {
    target?.addEventListener(type, handler, options);
    if (target) cleanups.push(() => target.removeEventListener(type, handler, options));
  };
  const setFeedback = text => { if (feedback) feedback.textContent = text; };
  const renderLiveState = () => {
    if (!liveStateNode) return;
    liveStateNode.innerHTML = `<span><small>比赛时间</small><strong>${liveState.matchMinute}′</strong></span><span><small>控球</small><strong>${Math.round(liveState.possession)}%</strong></span><span><small>动量</small><strong>${Math.round(liveState.teamMomentum)}</strong></span><span><small>评分</small><strong>${liveState.player?.rating?.toFixed?.(1) || '6.0'}</strong></span>`;
  };
  renderLiveState();
  const stopAnimation = () => {
    if (raf) cancelAnimationFrame(raf);
    if (timer) clearTimeout(timer);
    if (ticker) clearInterval(ticker);
    cleanups.splice(0).forEach(cleanup => cleanup());
  };
  const finish = (score, detail = '') => {
    if (ended) return;
    ended = true;
    stopAnimation();
    const finalScore = Math.round(clamp(score));
    liveState = advanceMatchState(liveState, highlight, { score: finalScore, success: finalScore >= 60 });
    updateMiniGame(resolveMiniGame(miniGame, { score: finalScore, detail, skipped: false }));
    liveState.miniGame = { ...liveState.miniGame, status: miniGame.status, result: miniGame.result };
    pitch.update(liveState);
    renderLiveState();
    node.dataset.result = finalScore >= 60 ? 'success' : 'failure';
    setFeedback(`${finalScore >= 60 ? '处理成功' : '处理失误'} · ${finalScore} 分${detail ? ` · ${detail}` : ''}`);
    node.classList.add(finalScore >= 60 ? 'game-success' : 'game-failure');
    window.setTimeout(() => onComplete?.({ score: finalScore, detail, skipped: false, matchState: liveState, miniGame }), 260);
  };
  const skip = () => {
    if (ended) return;
    ended = true;
    stopAnimation();
    liveState = advanceMatchState(liveState, highlight, { score: 50, skipped: true });
    updateMiniGame(resolveMiniGame(activateMiniGame(miniGame), { score: 50, detail: 'skipped', skipped: true }));
    liveState.miniGame = { ...liveState.miniGame, status: miniGame.status, result: miniGame.result };
    pitch.update(liveState);
    renderLiveState();
    node.dataset.result = 'skipped';
    setFeedback('已跳过，按中性表现结算');
    onSkip?.({ score: 50, detail: 'skipped', skipped: true, matchState: liveState, miniGame });
  };
  listen(node.querySelector('[data-skip]'), 'click', skip);
  node.destroy = () => { ended = true; stopAnimation(); };

  function beginCountdown() {
    let remaining = 3;
    ticker = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(ticker);
        ticker = 0;
        countdown.hidden = true;
        area.hidden = false;
        startGame();
        return;
      }
      countdown.textContent = String(remaining);
    }, 700);
  }

  function timedOut(seconds = 7) {
    const started = Date.now();
    const update = () => {
      const left = Math.max(0, seconds - (Date.now() - started) / 1000);
      if (timeLeft) timeLeft.textContent = `${left.toFixed(1)}s`;
      if (!ended && left > 0) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    timer = window.setTimeout(() => finish(35, '超时'), seconds * 1000);
  }

  function movingTarget({ header = false } = {}) {
    const sweet = header ? 58 : 50;
    area.innerHTML = `<div class="game-meter"><span class="game-meter-zone" style="left:${sweet - 12}%"></span><span class="game-meter-zone game-meter-zone--good" style="left:${sweet - 4}%"></span><button class="game-pointer" data-hit aria-label="停住指针"></button></div><button class="app-button primary" data-action-hit>停住指针</button>`;
    const pointer = area.querySelector('[data-hit]');
    let position = 4;
    let direction = 1;
    const move = () => {
      position += direction * .9;
      if (position >= 96 || position <= 4) direction *= -1;
      pointer.style.left = `${position}%`;
      if (!ended) raf = requestAnimationFrame(move);
    };
    raf = requestAnimationFrame(move);
    listen(area.querySelector('[data-action-hit]'), 'click', () => finish(100 - Math.abs(position - sweet) * 2.2, header ? '争顶高度已计算' : '射门落点已记录'));
    timedOut(6);
  }

  function aimPower() {
    area.innerHTML = `<div class="game-options">${DIRECTIONS.map((dir, i) => button(directionLabel[dir], `data-direction="${dir}" ${i === 1 ? 'class="game-control is-selected"' : ''}`)).join('')}</div><label class="game-range">力度 <input type="range" min="0" max="100" value="58" data-power></label><button class="app-button primary" data-submit>完成点球</button>`;
    let selected = 'center';
    area.querySelectorAll('[data-direction]').forEach(control => listen(control, 'click', () => {
      selected = control.dataset.direction;
      area.querySelectorAll('[data-direction]').forEach(item => item.classList.toggle('is-selected', item === control));
      setFeedback(`已瞄准${directionLabel[selected]}，调整力度后提交`);
    }));
    listen(area.querySelector('[data-submit]'), 'click', () => {
      const power = Number(area.querySelector('[data-power]').value);
      const ideal = 42 + seedNumber(seed, 1) % 36;
      finish((selected === directions(seed, 1) ? 58 : 22) + 42 - Math.abs(power - ideal) * .72, '门将已做出预判');
    });
    timedOut(8);
  }

  function curve() {
    area.innerHTML = `<div class="game-sliders"><label>弧线 <input type="range" min="0" max="100" value="62" data-curve></label><label>旋转 <input type="range" min="0" max="100" value="48" data-spin></label><label>力度 <input type="range" min="0" max="100" value="66" data-force></label></div><div class="wall-preview"><span class="wall"></span><span class="curve-ball"></span></div><button class="app-button primary" data-submit>踢出弧线球</button>`;
    listen(area.querySelector('[data-submit]'), 'click', () => {
      const values = ['curve', 'spin', 'force'].map(key => Number(area.querySelector(`[data-${key}]`).value));
      const targets = [62 + seedNumber(seed, 1) % 15, 44 + seedNumber(seed, 2) % 18, 56 + seedNumber(seed, 3) % 20];
      finish(100 - values.reduce((sum, value, i) => sum + Math.abs(value - targets[i]) * .9, 0), '人墙与门将参与判定');
    });
    timedOut(9);
  }

  function decision() {
    const goalkeeper = option.id === 'goalkeeper-charge';
    const choices = goalkeeper ? [['hold', '留在门线'], ['charge', '出击摘球'], ['block', '封堵角度']] : [['push', '推射远角'], ['chip', '挑射'], ['round', '过门将']];
    const ideal = choices[seedNumber(seed, 1) % choices.length][0];
    area.innerHTML = `<div class="decision-grid">${choices.map(([id, label]) => button(label, `data-decision="${id}"`)).join('')}</div><p class="card-copy">${goalkeeper ? '观察来球速度与队友回防距离。' : '门将站位会在倒计时结束前改变。'}</p>`;
    area.querySelectorAll('[data-decision]').forEach(control => listen(control, 'click', () => finish(control.dataset.decision === ideal ? 90 : 52, control.textContent)));
    timedOut(6);
  }

  function lane() {
    const safe = seedNumber(seed, 2) % 3;
    area.innerHTML = `<div class="lane-grid">${['左路', '中路', '右路'].map((label, i) => button(label, `data-lane="${i}"`)).join('')}</div><div class="defender-dots"><i></i><i></i><i></i></div>`;
    area.querySelectorAll('[data-lane]').forEach(control => listen(control, 'click', () => finish(Number(control.dataset.lane) === safe ? 92 : 38, Number(control.dataset.lane) === safe ? '线路安全' : '线路被封堵')));
    timedOut(5);
  }

  function movingLine() {
    area.innerHTML = `<div class="offside-board"><span class="offside-line" data-line></span><span class="runner" data-runner>跑位</span></div><button class="app-button primary" data-submit>现在直塞</button>`;
    const line = area.querySelector('[data-line]');
    const runner = area.querySelector('[data-runner]');
    let x = 12;
    let step = 1;
    const move = () => { x += step * .75; if (x >= 82 || x <= 12) step *= -1; line.style.left = `${x}%`; runner.style.left = `${Math.min(88, x + 10)}%`; if (!ended) raf = requestAnimationFrame(move); };
    raf = requestAnimationFrame(move);
    listen(area.querySelector('[data-submit]'), 'click', () => finish(100 - Math.abs(x - 52) * 1.9, '越位线已更新'));
    timedOut(6);
  }

  function sequence() {
    const expected = Array.from({ length: 4 }, (_, index) => ['left', 'right', 'center'][(seedNumber(seed, index) + index) % 3]);
    let index = 0;
    area.innerHTML = `<div class="sequence-display" data-sequence-display>观察防守方向</div><div class="game-options">${DIRECTIONS.map(dir => button(directionLabel[dir], `data-sequence="${dir}"`)).join('')}</div>`;
    const display = area.querySelector('[data-sequence-display]');
    const update = () => { display.textContent = `第 ${index + 1}/4 步 · 防守者向${directionLabel[expected[index]]}移动`; };
    update();
    area.querySelectorAll('[data-sequence]').forEach(control => listen(control, 'click', () => {
      if (control.dataset.sequence !== expected[index]) { finish(index * 25 + 18, '被防守者截停'); return; }
      index += 1;
      if (index === expected.length) finish(96, '连续变向成功'); else update();
    }));
    listen(node, 'keydown', event => { const key = { ArrowLeft: 'left', ArrowUp: 'center', ArrowRight: 'right' }[event.key]; if (key) area.querySelector(`[data-sequence="${key}"]`)?.click(); });
    timedOut(8);
  }

  function timing() {
    area.innerHTML = `<div class="game-meter"><span class="game-meter-zone" style="left:58%"></span><button class="game-pointer" data-hit aria-label="抢断"></button></div><button class="app-button primary" data-action-hit>出脚抢断</button>`;
    const pointer = area.querySelector('[data-hit]');
    let position = 3;
    let step = 1;
    const move = () => { position += step * 1.1; if (position >= 97 || position <= 3) step *= -1; pointer.style.left = `${position}%`; if (!ended) raf = requestAnimationFrame(move); };
    raf = requestAnimationFrame(move);
    listen(area.querySelector('[data-action-hit]'), 'click', () => finish(100 - Math.abs(position - 68) * 2.1, position < 30 ? '过早出脚，犯规风险上升' : '触球暴露时完成抢断'));
    timedOut(6);
  }

  function rhythm() {
    let hits = 0;
    let beat = 0;
    area.innerHTML = `<div class="rhythm-track"><span data-beat></span></div><button class="app-button primary" data-rhythm>跟拍对抗</button><p class="card-copy">在白色节拍点亮起时点击，共三拍。</p>`;
    const beatNode = area.querySelector('[data-beat]');
    ticker = window.setInterval(() => { beat = (beat + 1) % 4; beatNode.style.transform = `translateX(${beat * 25}%)`; }, 650);
    listen(area.querySelector('[data-rhythm]'), 'click', () => { hits += 1; setFeedback(`身体重心稳定 ${hits}/3`); if (hits >= 3) finish(82, '连续节奏保持'); });
    timedOut(6);
  }

  function direction() {
    const target = directions(seed, 3);
    area.innerHTML = `<p class="game-clue">射门者的支撑脚指向${directionLabel[target]}</p><div class="direction-grid">${DIRECTIONS.map(dir => button(directionLabel[dir], `data-dir="${dir}"`)).join('')}</div>`;
    area.querySelectorAll('[data-dir]').forEach(control => listen(control, 'click', () => finish(control.dataset.dir === target ? 94 : 42, control.dataset.dir === target ? '扑救成功' : '判断晚了一步')));
    timedOut(4);
  }

  function directionClue() {
    const target = directions(seed, 4);
    area.innerHTML = `<p class="game-clue">助跑节奏：${['短、短、长', '均匀、快速', '先慢后快'][seedNumber(seed, 5) % 3]} · 脚型线索指向${directionLabel[target]}</p><div class="direction-grid">${DIRECTIONS.map(dir => button(directionLabel[dir], `data-dir="${dir}"`)).join('')}</div>`;
    area.querySelectorAll('[data-dir]').forEach(control => listen(control, 'click', () => finish(control.dataset.dir === target ? 96 : 36, control.dataset.dir === target ? '点球被扑出' : '方向判断错误')));
    timedOut(5);
  }

  function positionWindow() {
    let positioned = false;
    area.innerHTML = `<div class="decision-grid">${button('近门柱站位', 'data-position="near"')}${button('中央站位', 'data-position="center"')}${button('后点站位', 'data-position="far"')}</div><div data-aerial hidden></div>`;
    const aerial = area.querySelector('[data-aerial]');
    area.querySelectorAll('[data-position]').forEach(control => listen(control, 'click', () => {
      positioned = control.dataset.position === ['near', 'center', 'far'][seedNumber(seed, 6) % 3];
      area.querySelector('.decision-grid').hidden = true;
      aerial.hidden = false;
      aerial.innerHTML = `<div class="game-meter"><span class="game-meter-zone" style="left:55%"></span><button class="game-pointer" data-aerial-hit aria-label="起跳摘球"></button></div><button class="app-button primary" data-jump>起跳摘球</button>`;
      const pointer = aerial.querySelector('[data-aerial-hit]');
      let x = 6, step = 1;
      const move = () => { x += step; if (x > 94 || x < 6) step *= -1; pointer.style.left = `${x}%`; if (!ended) raf = requestAnimationFrame(move); };
      raf = requestAnimationFrame(move);
      listen(aerial.querySelector('[data-jump]'), 'click', () => finish((positioned ? 55 : 25) + (100 - Math.abs(x - 62) * 2) * .45, positioned ? '站位与起跳窗口匹配' : '站位偏离落点'));
    }));
    timedOut(9);
  }

  function targetPower() {
    let target = 'left';
    area.innerHTML = `<div class="game-options">${DIRECTIONS.map(dir => button(directionLabel[dir], `data-target="${dir}"`)).join('')}</div><label class="game-range">力度 <input type="range" min="0" max="100" value="60" data-power></label><button class="app-button primary" data-submit>出球</button>`;
    target = directions(seed, 7);
    area.querySelectorAll('[data-target]').forEach(control => listen(control, 'click', () => { target = control.dataset.target; area.querySelectorAll('[data-target]').forEach(item => item.classList.toggle('is-selected', item === control)); }));
    listen(area.querySelector('[data-submit]'), 'click', () => { const power = Number(area.querySelector('[data-power]').value); const ideal = 52 + seedNumber(seed, 8) % 30; finish((target === directions(seed, 7) ? 60 : 24) + 40 - Math.abs(power - ideal) * .7, '队友目标与出球力度共同判定'); });
    timedOut(8);
  }

  function strategyMeter() {
    area.innerHTML = `<div class="game-meter"><span class="game-meter-zone" style="left:55%"></span><span class="strategy-pointer" data-strategy-pointer></span></div><div class="decision-grid">${button('控球拖延', 'data-strategy="slow"')}${button('冒险进攻', 'data-strategy="attack"')}${button('稳守反击', 'data-strategy="counter"')}</div><button class="app-button primary" data-submit>执行选择</button>`;
    let current = 'slow', meter = 50, step = 1;
    const pointer = area.querySelector('[data-strategy-pointer]');
    const move = () => { meter += step * .8; if (meter > 94 || meter < 6) step *= -1; pointer.style.left = `${meter}%`; if (!ended) raf = requestAnimationFrame(move); };
    raf = requestAnimationFrame(move);
    area.querySelectorAll('[data-strategy]').forEach(control => listen(control, 'click', () => { current = control.dataset.strategy; area.querySelectorAll('[data-strategy]').forEach(item => item.classList.toggle('is-selected', item === control)); }));
    listen(area.querySelector('[data-submit]'), 'click', () => { const ideal = meter > 68 ? 'counter' : meter < 38 ? 'attack' : 'slow'; finish(current === ideal ? 90 : 48, `${current === ideal ? '局势匹配' : '局势变化'} · 比分与时间已计入`); });
    timedOut(8);
  }

  function startGame() {
    updateMiniGame(activateMiniGame(miniGame));
    switch (option?.mechanic) {
      case 'moving-target': movingTarget({ header: option.id === 'header' }); break;
      case 'aim-power': aimPower(); break;
      case 'curve': curve(); break;
      case 'decision': decision(); break;
      case 'lane': lane(); break;
      case 'moving-line': movingLine(); break;
      case 'sequence': sequence(); break;
      case 'timing': timing(); break;
      case 'rhythm': rhythm(); break;
      case 'direction': direction(); break;
      case 'direction-clue': directionClue(); break;
      case 'position-window': positionWindow(); break;
      case 'target-power': targetPower(); break;
      case 'strategy-meter': strategyMeter(); break;
      default: finish(50, '中性结算');
    }
  }

  area.hidden = true;
  countdown.hidden = false;
  beginCountdown();
  return node;
}

function statLabel(value) {
  return { speed: '速度', shooting: '射门', passing: '传球', dribbling: '盘带', defending: '防守', physical: '身体' }[value] || '比赛';
}
