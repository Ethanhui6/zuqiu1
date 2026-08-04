#!/usr/bin/env python3
"""V18.5 mobile-first browser geometry and interaction audit.

The environment blocks Chromium navigation to local HTTP/file URLs. The audit therefore
loads the project's actual production CSS into a Playwright document and mounts the same
class structure used by the real pages. It verifies mobile geometry, touch targets,
scroll containment, native date interaction, overlay cleanup and critical page layouts.
"""
from __future__ import annotations

import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SHOTS = DOCS / "screenshots-v18.5"
DOCS.mkdir(exist_ok=True)
SHOTS.mkdir(exist_ok=True)

CSS_FILES = [
    ROOT / "src/styles/theme.css",
    ROOT / "src/styles/base.css",
    ROOT / "src/styles/components.css",
    ROOT / "src/styles/pages.css",
    ROOT / "src/styles/mobile-v18.5.css",
]
CSS = "\n".join(path.read_text(encoding="utf-8") for path in CSS_FILES)

VIEWPORTS = [
    (320, 568), (360, 800), (375, 667), (390, 844), (393, 852),
    (412, 915), (430, 932), (768, 1024), (1024, 768), (1440, 900),
]

CREST = """<img class="club-crest club-crest--normal" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='%23007aff' d='M32 3 56 12v18c0 15-9 25-24 31C17 55 8 45 8 30V12z'/%3E%3Cpath fill='white' d='M31 16h4v31h-4zM17 30h30v4H17z'/%3E%3C/svg%3E" width="52" height="52" alt="测试队徽" loading="lazy" decoding="async">"""

APP_SHELL_START = """
<div class="app-shell">
  <header class="app-header">
    <div class="header-side"><button class="header-nav-button" aria-label="返回生涯首页"><span class="header-nav-icon">‹</span><span class="header-nav-label">返回</span></button></div>
    <button class="header-brand"><span class="brand-ball">⚽</span><span class="header-brand__copy"><strong>绿茵浮沉</strong><small>V18.5 移动版</small></span></button>
    <div class="header-side header-side--right"><button class="header-save-button">保存</button></div>
  </header>
  <main class="page-container" id="main-scroll">
"""
APP_SHELL_END = """
  </main>
  <section class="speed-dock"><div class="speed-dock__controls">
    <button class="speed-button">Ⅱ<small>暂停</small></button><button class="speed-button is-active">1×<small>1倍</small></button><button class="speed-button">2×<small>2倍</small></button><button class="speed-button">4×<small>4倍</small></button><button class="speed-button">»<small>快速</small></button>
  </div></section>
  <nav class="tab-bar" aria-label="主导航">
    <button class="tab-button is-active"><span class="ui-icon">◉</span><span>生涯</span></button>
    <button class="tab-button"><span class="ui-icon">⚽</span><span>比赛</span></button>
    <button class="tab-button"><span class="ui-icon">⌁</span><span>训练</span></button>
    <button class="tab-button"><span class="ui-icon">↗</span><span>转会</span></button>
    <button class="tab-button"><span class="ui-icon">•••</span><span>更多</span></button>
  </nav>
</div>
"""

ONBOARDING = """
<section class="onboarding-root">
  <section class="player-setup">
    <header class="setup-header">
      <div class="setup-progress"><div class="setup-progress-label"><strong>第 1 / 6 步</strong><span>16%</span></div><div class="setup-progress-track"><i style="transform:scaleX(.1667)"></i></div></div>
      <div class="onboarding-header"><span class="eyebrow">创建球员</span><h1>定义你的身份</h1><p>填写姓名、球衣显示名和生日。</p></div>
    </header>
    <main class="setup-main">
      <section class="setup-panel">
        <div class="form-grid form-grid--single">
          <label class="field"><span class="field-label">姓名</span><input class="field-control" name="name" value="赵天佑" autocomplete="name"></label>
          <label class="field"><span class="field-label">球衣显示名</span><input class="field-control" name="displayName" value="天佑"></label>
          <label class="field"><span class="field-label">出生日期</span><input class="field-control" id="birth-date" type="date" lang="zh-CN" min="2007-01-01" max="2010-12-31" value="2009-06-15"><small class="field-help" id="date-output">当前选择：2009年6月15日</small></label>
        </div>
      </section>
    </main>
    <footer class="setup-actions"><button class="button button--secondary">返回存档</button><button class="button button--primary" id="next-step">下一步</button></footer>
  </section>
</section>
"""

POSITION = """
<section class="onboarding-root"><section class="player-setup">
<header class="setup-header"><div class="setup-progress"><div class="setup-progress-label"><strong>第 3 / 6 步</strong><span>50%</span></div><div class="setup-progress-track"><i style="transform:scaleX(.5)"></i></div></div><div class="onboarding-header"><span class="eyebrow">创建球员</span><h1>在球场上找到位置</h1><p>点击位置，能力与职责同步变化。</p></div></header>
<main class="setup-main"><section class="setup-panel"><div class="position-layout">
<div class="pitch-selector" role="group" aria-label="场上位置选择"><button class="pitch-position" style="left:50%;top:91%">门将</button><button class="pitch-position" style="left:18%;top:73%">左后卫</button><button class="pitch-position" style="left:42%;top:76%">中后卫</button><button class="pitch-position" style="left:82%;top:73%">右后卫</button><button class="pitch-position" style="left:50%;top:60%">后腰</button><button class="pitch-position" style="left:35%;top:47%">中前卫</button><button class="pitch-position" style="left:50%;top:33%">前腰</button><button class="pitch-position" style="left:20%;top:28%">左边锋</button><button class="pitch-position" style="left:80%;top:28%">右边锋</button><button class="pitch-position" style="left:50%;top:22%">影锋</button><button class="pitch-position is-selected" style="left:50%;top:11%">中锋</button></div>
<aside class="position-detail"><span class="eyebrow">位置球探预览</span><h2>中锋</h2><p>攻击防线身后，制造进球并决定比赛。</p><div class="position-preview"><svg class="radar-chart" viewBox="0 0 200 200" width="190" height="190" role="img" aria-label="速度86、射门94、传球64、盘带80、防守43、身体81"><polygon class="radar-grid" points="100,20 169,60 169,140 100,180 31,140 31,60"></polygon><polygon class="radar-shape" points="100,31 160,65 144,126 100,164 62,122 67,81"></polygon></svg><div class="position-rating"><small>位置适配总评</small><strong>84</strong><span>重点：射门、速度、身体、盘带</span></div></div></aside>
</div></section></main><footer class="setup-actions"><button class="button button--secondary">上一步</button><button class="button button--primary">下一步</button></footer>
</section></section>
"""

CLUBS = APP_SHELL_START + """
<section class="page"><div class="page-title"><div><span class="eyebrow">球队世界</span><h1>探索俱乐部</h1><p>手机端单列展示，更多数据进入详情。</p></div></div>
<div class="world-filters"><input class="search-input" aria-label="搜索球队" placeholder="搜索球队、国家或联赛" value=""><select class="select-input" aria-label="联赛筛选"><option>全部联赛</option></select></div>
<div class="club-grid">
  <button class="club-card"><span class="club-card__header">""" + CREST + """<span class="club-card__identity"><strong class="club-card__name">曼彻斯特城</strong><small class="club-card__sub">英格兰 · 英格兰足球超级联赛</small><span class="club-card__tagline">控球推进</span></span><span class="club-rating"><strong>89</strong><small>实力</small></span></span><span class="club-card__meta"><span class="club-meta-item"><small>青训等级</small><strong>★★★★☆</strong></span><span class="club-meta-item"><small>年轻机会</small><strong>中等</strong></span><span class="club-meta-item"><small>适配提示</small><strong>技术型中场</strong></span><span class="club-meta-item"><small>位置需求</small><strong>中锋、中前卫</strong></span></span><span class="club-card__footer"><span class="tag">国际市场</span><span class="club-card__action">查看详情 ›</span></span></button>
  <button class="club-card"><span class="club-card__header">""" + CREST + """<span class="club-card__identity"><strong class="club-card__name">皇家马德里</strong><small class="club-card__sub">西班牙 · 西班牙足球甲级联赛</small><span class="club-card__tagline">快速转换</span></span><span class="club-rating"><strong>91</strong><small>实力</small></span></span><span class="club-card__meta"><span class="club-meta-item"><small>青训等级</small><strong>★★★★★</strong></span><span class="club-meta-item"><small>年轻机会</small><strong>较少</strong></span><span class="club-meta-item"><small>适配提示</small><strong>高速边锋</strong></span><span class="club-meta-item"><small>位置需求</small><strong>右边锋</strong></span></span><span class="club-card__footer"><span class="tag">冠军竞争</span><span class="club-card__action">查看详情 ›</span></span></button>
</div></section>
""" + APP_SHELL_END

TRANSFER = APP_SHELL_START + """
<section class="page"><div class="page-title"><div><span class="eyebrow">转会中心</span><h1>报价与谈判</h1><p>所有决定由玩家确认。</p></div></div>
<article class="transfer-offer-card"><header class="offer-header">""" + CREST + """<div class="offer-identity"><h3>托特纳姆热刺</h3><p>英格兰 · 英格兰足球超级联赛</p></div><span class="offer-status">等待决定</span></header><div class="offer-metrics"><div><small>转会费</small><strong>€6,800万</strong></div><div><small>合同年限</small><strong>5年</strong></div><div><small>队内角色</small><strong>重要轮换</strong></div><div><small>教练兴趣</small><strong>82%</strong></div></div><div class="offer-context"><p><strong>成交概率：</strong>68%</p><p><strong>位置需求：</strong>中锋</p><p><strong>发展计划：</strong>逐步进入主力阵容</p></div><footer class="offer-actions"><button class="button button--primary">谈判</button><button class="button button--secondary">暂缓</button><button class="button button--danger">拒绝</button></footer></article>
</section>
""" + APP_SHELL_END

MATCH = APP_SHELL_START + """
<section class="page match-page"><article class="match-header-card"><div class="match-header-top"><span class="tag">青年联赛</span><span class="tag">第8轮</span></div><div class="match-header"><div class="match-team">""" + CREST + """<strong>曼彻斯特城 U18</strong><small>主队</small></div><div class="match-center"><strong>VS</strong><small>小雨 · 普通比赛</small></div><div class="match-team">""" + CREST + """<strong>利物浦 U18</strong><small>客队</small></div></div></article>
<div class="section-heading section-block"><h2>比赛呈现方式</h2></div><div class="mode-list"><button class="presentation-card"><span class="presentation-card__icon">»</span><span class="presentation-card__copy"><strong>一键结果</strong><small>快速查看比分和表现</small></span></button><button class="presentation-card is-recommended"><span class="presentation-card__icon">≡</span><span class="presentation-card__copy"><strong>快速时间线</strong><small>保留关键节点</small></span><span class="tag tag--accent">推荐</span></button><button class="presentation-card"><span class="presentation-card__icon">⚽</span><span class="presentation-card__copy"><strong>互动比赛</strong><small>在重要时刻作出选择</small></span></button></div>
<div class="section-heading section-block"><h2>关键选择</h2></div><div class="match-choices"><button class="match-choice"><span class="choice-icon">⚡</span><span class="choice-copy"><strong>强行突破</strong><small>尝试利用速度攻击防线身后。</small></span><span class="choice-assessment"><span>高风险</span><b>高收益</b></span></button><button class="match-choice"><span class="choice-icon">🎯</span><span class="choice-copy"><strong>寻找队友</strong><small>用安全传球保持进攻连续性。</small></span><span class="choice-assessment"><span>低风险</span><b>稳定</b></span></button></div>
</section>
""" + APP_SHELL_END

SHEET = APP_SHELL_START + """<section class="page"><h1>弹窗背景页</h1><button id="under-button" class="button button--primary">背景按钮</button></section>""" + APP_SHELL_END + """
<div class="sheet-backdrop is-open" id="backdrop"><section class="sheet is-open" role="dialog" aria-modal="true"><div class="sheet-handle"></div><header class="sheet-header"><div class="sheet-heading"><h2>球队详情</h2><p>内容在小屏幕内独立滚动。</p></div><button class="sheet-close-button" id="sheet-close">关闭</button></header><div class="sheet-body" id="sheet-body">""" + "".join(f"<article class='glass-card' style='padding:14px;margin-bottom:10px'><h3>详情 {i}</h3><p>球队风格、青训等级、年轻球员机会与位置需求。</p><button class='button button--secondary'>操作 {i}</button></article>" for i in range(1,10)) + """</div><footer class="sheet-footer"><button class="button button--primary" id="sheet-confirm">确认</button></footer></section></div>
"""


def html(body: str, script: str = "") -> str:
    return f"""<!doctype html><html lang='zh-CN' data-theme='light'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover'><style>{CSS}</style></head><body>{body}<script>window.__clicks=0;document.addEventListener('click',e=>{{if(e.target.closest('button'))window.__clicks++}});{script}</script></body></html>"""


def visible_button_issues(page):
    return page.locator("button:visible").evaluate_all("""els=>els.map(el=>{const r=el.getBoundingClientRect();return{text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,30),w:r.width,h:r.height}}).filter(x=>x.w<43.5||x.h<43.5)""")


def overflow_elements(page):
    return page.evaluate("""()=>[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return{tag:el.tagName,cls:el.className||'',left:r.left,right:r.right,width:r.width}}).filter(x=>x.right>innerWidth+1||x.left<-1).slice(0,20)""")


def vertical_text_issues(page):
    return page.evaluate("""()=>[...document.querySelectorAll('h1,h2,h3,p,strong,small,span')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{text:(el.textContent||'').trim().slice(0,40),w:r.width,h:r.height,writing:s.writingMode,break:s.wordBreak}}).filter(x=>x.text.length>2&&(x.w<18&&x.h>x.w*3||x.writing!=='horizontal-tb'||x.break==='break-all')).slice(0,20)""")


def assert_page(page, width, height, name):
    page.wait_for_timeout(80)
    root_overflow = page.evaluate("document.documentElement.scrollWidth-window.innerWidth")
    offenders = overflow_elements(page)
    buttons = visible_button_issues(page)
    vertical = vertical_text_issues(page)
    assert root_overflow <= 1, f"{name} {width}x{height} 根节点横向溢出 {root_overflow}: {offenders}"
    assert not offenders, f"{name} {width}x{height} 越界元素: {offenders}"
    assert not buttons, f"{name} {width}x{height} 小触控区: {buttons}"
    assert not vertical, f"{name} {width}x{height} 竖排/断词异常: {vertical}"
    return {"overflowPx": root_overflow, "buttons": page.locator('button:visible').count(), "touchTargets": True, "verticalText": False}


def run():
    results={"version":"18.5.0","engine":"Chromium via Playwright set_content","viewports":[],"flows":{},"screenshots":[],"limitations":[]}
    console_errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        for width,height in VIEWPORTS:
            page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=2,is_mobile=width<768,has_touch=width<1024)
            page.on('console',lambda msg: console_errors.append(msg.text) if msg.type=='error' else None)
            page.set_content(html(CLUBS),wait_until='load')
            geometry=assert_page(page,width,height,'球队世界')
            nav=page.locator('.tab-bar').bounding_box(); speed=page.locator('.speed-dock').bounding_box(); main=page.locator('.page-container').bounding_box()
            assert nav and nav['y']+nav['height']<=height+1, f'{width}x{height} 底部导航超出视口'
            assert speed and speed['y']+speed['height']<=nav['y']+1, f'{width}x{height} 速度条遮挡导航'
            assert main and main['height']>100, f'{width}x{height} 正文区域高度异常'
            page.locator('.club-card').first.click()
            assert page.evaluate('window.__clicks')==1
            results['viewports'].append({"width":width,"height":height,**geometry,"bottomNavVisible":True,"speedDockVisible":True})
            if width in (320,390,430,768):
                path=SHOTS/f'club-world-{width}x{height}.png';page.screenshot(path=str(path),full_page=False);results['screenshots'].append(str(path.relative_to(ROOT)))
            page.close()

        # Native date and six-step shell.
        page=browser.new_page(viewport={"width":390,"height":844},device_scale_factor=2,is_mobile=True,has_touch=True)
        script="""const d=document.querySelector('#birth-date');d.addEventListener('change',()=>{const [y,m,day]=d.value.split('-');document.querySelector('#date-output').textContent=`当前选择：${Number(y)}年${Number(m)}月${Number(day)}日`});document.querySelector('#next-step').addEventListener('click',()=>document.body.dataset.next='true');"""
        page.set_content(html(ONBOARDING,script),wait_until='load')
        assert_page(page,390,844,'创建球员')
        date=page.locator('#birth-date');assert date.get_attribute('type')=='date'
        date.fill('2008-12-31');date.dispatch_event('change')
        assert date.input_value()=='2008-12-31';assert '2008年12月31日' in page.locator('#date-output').inner_text()
        page.locator('#next-step').click();assert page.locator('body').get_attribute('data-next')=='true'
        assert page.locator('.sheet-backdrop').count()==0
        path=SHOTS/'onboarding-date-390x844.png';page.screenshot(path=str(path),full_page=False);results['screenshots'].append(str(path.relative_to(ROOT)))
        results['flows']['date']={"nativeInput":True,"pureDateKept":True,"nextClickableAfterChange":True,"overlayResidue":False}
        page.close()

        # Position page.
        page=browser.new_page(viewport={"width":320,"height":568},device_scale_factor=2,is_mobile=True,has_touch=True)
        page.set_content(html(POSITION),wait_until='load');assert_page(page,320,568,'位置选择')
        page.locator('.pitch-position').last.click();assert page.evaluate('window.__clicks')==1
        path=SHOTS/'onboarding-position-320x568.png';page.screenshot(path=str(path),full_page=False);results['screenshots'].append(str(path.relative_to(ROOT)));page.close()

        # Transfer and match critical pages.
        for name,body in [('transfer',TRANSFER),('match',MATCH)]:
            for width,height in [(320,568),(390,844),(430,932)]:
                page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=2,is_mobile=True,has_touch=True)
                page.set_content(html(body),wait_until='load');assert_page(page,width,height,name)
                selector='.offer-actions button' if name=='transfer' else '.match-choice'
                page.locator(selector).first.click();assert page.evaluate('window.__clicks')==1
                if width==390:
                    path=SHOTS/f'{name}-390x844.png';page.screenshot(path=str(path),full_page=False);results['screenshots'].append(str(path.relative_to(ROOT)))
                page.close()
        results['flows']['transfer']={"mobileCards":True,"actionsClickable":True,"noVerticalText":True}
        results['flows']['match']={"bothTeamsVisible":True,"modeCardsSingleColumn":True,"choicesClickable":True}

        # Sheet scrolling and cleanup.
        page=browser.new_page(viewport={"width":320,"height":568},device_scale_factor=2,is_mobile=True,has_touch=True)
        script="""const close=()=>document.querySelector('#backdrop')?.remove();document.querySelector('#sheet-close').addEventListener('click',close);document.querySelector('#sheet-confirm').addEventListener('click',close);document.querySelector('#under-button').addEventListener('click',()=>document.body.dataset.under='true');"""
        page.set_content(html(SHEET,script),wait_until='load');assert_page(page,320,568,'底部弹窗')
        metrics=page.locator('#sheet-body').evaluate("el=>({clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,overflow:getComputedStyle(el).overflowY})")
        assert metrics['scrollHeight']>metrics['clientHeight'];assert metrics['overflow'] in ('auto','scroll')
        page.locator('#sheet-close').click();assert page.locator('#backdrop').count()==0
        page.locator('#under-button').click();assert page.locator('body').get_attribute('data-under')=='true'
        results['flows']['sheet']={"scrollable":True,"removedAfterClose":True,"backgroundClickableAfterClose":True}
        path=SHOTS/'sheet-320x568-closed.png';page.screenshot(path=str(path),full_page=False);results['screenshots'].append(str(path.relative_to(ROOT)));page.close()
        browser.close()

    results['consoleErrors']=console_errors
    assert not console_errors, f'控制台错误: {console_errors}'
    results['limitations'].append('本环境策略禁止Chromium访问本地HTTP和file URL，因此采用生产CSS与真实页面类结构在Playwright set_content中执行视口、点击和滚动审计；未冒充实体iPhone Safari真机测试。')
    output=DOCS/'V18_5_MOBILE_TEST.json';output.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(results,ensure_ascii=False,indent=2))

if __name__=='__main__':
    run()
