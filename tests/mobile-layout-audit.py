#!/usr/bin/env python3
"""Real CSS/DOM mobile layout smoke audit for V18.3.

Uses the project's actual CSS in a Chromium page created with set_content(), so it can
validate touch target geometry, horizontal overflow, dark-theme navigation, and
bottom-sheet scroll/safe-area behavior without relying on the blocked local HTTP
navigation policy of this runtime.
"""
from __future__ import annotations

import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SHOTS = DOCS / "screenshots"
DOCS.mkdir(exist_ok=True)
SHOTS.mkdir(exist_ok=True)

CSS_FILES = [
    ROOT / "src/styles/theme.css",
    ROOT / "src/styles/base.css",
    ROOT / "src/styles/components.css",
    ROOT / "src/styles/pages.css",
    ROOT / "src/styles/ux-v18.2.css",
    ROOT / "src/styles/pace-v18.3.css",
]
CSS = "\n".join(path.read_text(encoding="utf-8") for path in CSS_FILES)

APP_BODY = r"""
<div class="app-shell">
  <header class="app-header glass" data-route="world">
    <div class="header-side">
      <button class="header-nav-button" id="back-button">← 生涯首页</button>
    </div>
    <button class="header-brand"><span class="brand-ball">⚽</span><span><strong>绿茵生涯</strong><small>测试球员 · 17岁</small></span></button>
    <div class="header-side header-side--right">
      <button class="header-nav-button header-home" id="home-button" aria-label="返回主页">⌂</button>
      <button class="icon-button" aria-label="切换主题">◐</button>
    </div>
  </header>
  <main class="page-container" id="main-scroll">
    <section class="page page-enter">
      <div class="page-title"><div><p class="eyebrow">职业生涯</p><h1>准备迎接下一场挑战</h1><p>核心状态清晰显示，详细信息按需展开。</p></div><button class="button button--primary">继续比赛</button></div>
      <article class="glass-card player-card" style="--team-color:#1677ff">
        <div class="player-card__top"><div class="rating-block"><strong>73</strong><span>综合能力</span></div><div class="player-avatar">赵</div></div>
        <div class="player-card__identity"><h2>赵天佑</h2><p>17岁 · 中国 · 中锋 · U18</p></div>
        <div class="metric-grid"><div class="metric"><small>潜力</small><strong>91</strong></div><div class="metric"><small>体能</small><strong>88</strong></div><div class="metric"><small>士气</small><strong>76</strong></div><div class="metric"><small>教练信任</small><strong>63</strong></div></div>
      </article>

      <div class="section-heading section-block"><h2>球探评估报告</h2><button class="button button--secondary">重新抽取</button></div>
      <div class="talent-grid">
        <button class="talent-card is-selected" data-rarity="精英" style="--rarity-color:#8b5cf6">
          <div class="talent-card__top"><span class="talent-emblem">♛</span><span class="rarity-badge">精英</span><span class="talent-stars">★★★★☆</span></div>
          <h3>爆发型速度前锋</h3><p class="talent-card__subtitle">中锋 · 速度型前锋</p>
          <div class="talent-potential"><div><small>潜力区间</small><strong>88–94</strong></div><div><small>成长效率</small><strong>×1.18</strong></div></div>
          <ul class="scout-points"><li>启动速度基础突出</li><li>射门基础良好</li><li>盘带能力可塑</li></ul>
          <div class="scout-risk"><strong>风险：</strong>身体成长有限，需要加强背身能力。</div>
          <p class="scout-quote">“关键能力已经显出上限，正确培养有机会成长为球队核心。”</p>
        </button>
      </div>

      <div class="section-heading section-block"><h2>青年队邀请</h2></div>
      <button class="club-select-card is-selected" style="--club-color:hsl(210 62% 46%)">
        <span class="club-crest">海港</span>
        <div class="club-card__identity"><h3>上海海港</h3><p>中国 · 中超 · U18</p><div class="club-card__tags"><span class="club-mini-tag">青训 ★★★★☆</span><span class="club-mini-tag">控球推进</span><span class="club-mini-tag">机会 较多</span></div></div>
        <div class="club-select-card__side"><strong>¥2,800</strong><small>青年周薪</small><small>发展 ★★★★☆</small></div>
      </button>

      <div class="section-heading section-block"><h2>比赛事件</h2></div>
      <div class="event-sheet">
        <section class="event-scene" style="--event-color:#d70015"><div class="event-scene__top"><span class="event-scene__icon">⚽</span><div class="tag-row"><span class="tag tag--accent">比赛</span><span class="tag">高压力</span></div></div><h3>第88分钟 · 反击机会</h3><p class="event-description">比赛进入最后阶段，你在右侧获得快速推进空间。</p></section>
        <div class="event-choices">
          <button class="event-choice"><span class="choice-icon">⚡</span><span class="choice-copy"><strong>强行突破</strong><small>利用速度直接冲击防线。</small></span><span class="choice-assessment"><span>高风险</span><b>高回报</b></span></button>
          <button class="event-choice"><span class="choice-icon">🎯</span><span class="choice-copy"><strong>传给队友</strong><small>寻找位置更好的接应点。</small></span><span class="choice-assessment"><span>低风险</span><b>稳定</b></span></button>
        </div>
      </div>
      <div style="height:40px"></div>
    </section>
  </main>
  <section class="speed-dock glass" aria-label="时间推进速度"><div class="speed-dock__label"><small>职业节奏</small><strong>标准模式</strong></div><div class="speed-dock__controls"><button class="speed-button">Ⅱ<small>暂停</small></button><button class="speed-button is-active">1×<small>1倍</small></button><button class="speed-button">2×<small>2倍</small></button><button class="speed-button">4×<small>4倍</small></button><button class="speed-button">»<small>快速</small></button></div></section>
  <nav class="tab-bar glass" aria-label="主导航">
    <button class="tab-button is-active"><span class="ui-icon">◉</span><span>生涯</span></button>
    <button class="tab-button"><span class="ui-icon">⚽</span><span>比赛</span></button>
    <button class="tab-button"><span class="ui-icon">⌁</span><span>训练</span></button>
    <button class="tab-button"><span class="ui-icon">↗</span><span>转会</span></button>
    <button class="tab-button"><span class="ui-icon">◎</span><span>世界</span></button>
    <button class="tab-button"><span class="ui-icon">●</span><span>我的</span></button>
  </nav>
</div>
"""

SHEET_BODY = r"""
<div class="app-shell">
  <header class="app-header glass"><div class="header-side"><button class="header-nav-button">← 生涯首页</button></div><button class="header-brand"><strong>绿茵生涯</strong></button><div class="header-side header-side--right"><button class="header-nav-button header-home">⌂</button></div></header>
  <main class="page-container"><section class="page"><h1>弹窗测试</h1><button id="under-button" class="button button--primary">页面按钮</button></section></main>
  <section class="speed-dock"><div class="speed-dock__controls"><button class="speed-button">Ⅱ</button><button class="speed-button is-active">1×</button><button class="speed-button">2×</button><button class="speed-button">4×</button><button class="speed-button">»</button></div></section>
  <nav class="tab-bar"><button class="tab-button">生涯</button><button class="tab-button">比赛</button><button class="tab-button">训练</button><button class="tab-button">转会</button><button class="tab-button">世界</button><button class="tab-button">我的</button></nav>
</div>
<div class="sheet-backdrop is-open" role="presentation">
  <section class="sheet is-open" role="dialog" aria-modal="true" aria-label="事件详情">
    <header class="sheet-header"><div><p class="eyebrow">比赛事件</p><h2>关键选择</h2><p>弹窗内容必须在小屏幕内可滚动。</p></div><button class="icon-button" id="sheet-close" aria-label="关闭">×</button></header>
    <div class="sheet-body" id="sheet-body">
      <div class="event-sheet">
        <section class="event-scene"><h3>下半场的决定</h3><p>这是用于验证滚动区域的长内容。</p></section>
        <div class="event-choices">__CHOICES__</div>
      </div>
    </div>
    <footer class="sheet-footer"><button class="button button--primary button--large" id="sheet-confirm">确认选择</button></footer>
  </section>
</div>
"""

CHOICE = r"""<button class="event-choice"><span class="choice-icon">⚡</span><span class="choice-copy"><strong>完整可点击选项 __N__</strong><small>整个卡片都是触控区域，并显示风险与收益。</small></span><span class="choice-assessment"><span>中风险</span><b>长期收益</b></span></button>"""

VIEWPORTS = [
    {"name": "iphone-320", "width": 320, "height": 568},
    {"name": "iphone-375", "width": 375, "height": 667},
    {"name": "iphone-390", "width": 390, "height": 844},
    {"name": "iphone-430", "width": 430, "height": 932},
]


def html(body: str, theme: str = "light") -> str:
    return f"<!doctype html><html lang='zh-CN' data-theme='{theme}'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1,viewport-fit=cover'><style>{CSS}</style></head><body>{body}<script>window.__clicks=0;document.addEventListener('click',e=>{{if(e.target.closest('button'))window.__clicks++;}});</script></body></html>"


def assert_touch_targets(page, context: str):
    bad = page.locator("button:visible").evaluate_all(
        "els => els.map((el,i)=>{const r=el.getBoundingClientRect();return {i,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,40),w:r.width,h:r.height}}).filter(x=>x.w<43.5||x.h<43.5)"
    )
    assert not bad, f"{context}: 小于44px的按钮: {bad}"


def run():
    results = {"version": "18.3.0", "viewports": [], "sheet": {}, "dark": {}, "limitations": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox", "--disable-dev-shm-usage"])
        for vp in VIEWPORTS:
            page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]}, device_scale_factor=2, is_mobile=True, has_touch=True)
            page.set_content(html(APP_BODY), wait_until="load")
            page.wait_for_timeout(80)
            overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            assert overflow <= 1, f"{vp['name']}: 横向溢出 {overflow}px"
            assert_touch_targets(page, vp["name"])
            page.locator(".button--primary").first.click()
            assert page.evaluate("window.__clicks") == 1, f"{vp['name']}: 按钮点击事件未触发"
            speed_box = page.locator(".speed-dock").bounding_box()
            nav_box = page.locator(".tab-bar").bounding_box()
            header_box = page.locator(".app-header").bounding_box()
            assert nav_box and nav_box["y"] + nav_box["height"] <= vp["height"] + 1, f"{vp['name']}: 底部导航被遮挡"
            assert speed_box and speed_box["y"] + speed_box["height"] <= nav_box["y"] + 1, f"{vp['name']}: 速度控件遮挡底部导航"
            assert header_box and header_box["y"] >= -1, f"{vp['name']}: 顶部导航被遮挡"
            results["viewports"].append({
                **vp,
                "horizontalOverflowPx": overflow,
                "visibleButtons": page.locator("button:visible").count(),
                "allTouchTargetsAtLeast44": True,
                "buttonClickVerified": True,
                "headerVisible": True,
                "bottomNavigationVisible": True,
                "speedDockVisible": True,
            })
            if vp["width"] == 390:
                page.screenshot(path=str(SHOTS / "pace-mobile-390-light.png"), full_page=False)
            page.close()

        # Dark mode: navigation must remain discoverable and page must not be pure black.
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page.set_content(html(APP_BODY, "dark"), wait_until="load")
        bg = page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--page').trim()")
        assert bg.lower() not in {"#000", "#000000", "rgb(0, 0, 0)"}, f"暗色模式仍为纯黑: {bg}"
        assert page.locator("#back-button").is_visible() and page.locator("#home-button").is_visible(), "暗色模式缺少返回/主页"
        assert_touch_targets(page, "dark-390")
        results["dark"] = {"pageBackground": bg, "backVisible": True, "homeVisible": True, "touchTargets": True}
        page.screenshot(path=str(SHOTS / "pace-mobile-390-dark.png"), full_page=False)
        page.close()

        # Sheet: use enough real choice cards to force scrolling on 320x568.
        choices = "".join(CHOICE.replace("__N__", str(i)) for i in range(1, 8))
        page = browser.new_page(viewport={"width": 320, "height": 568}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page.set_content(html(SHEET_BODY.replace("__CHOICES__", choices)), wait_until="load")
        page.wait_for_timeout(80)
        assert_touch_targets(page, "sheet-320")
        sheet_box = page.locator(".sheet").bounding_box()
        body_metrics = page.locator("#sheet-body").evaluate("el=>({clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,overflow:getComputedStyle(el).overflowY})")
        footer_box = page.locator(".sheet-footer").bounding_box()
        assert sheet_box and sheet_box["height"] <= 568 + 1, f"Sheet超过视口: {sheet_box}"
        assert body_metrics["scrollHeight"] > body_metrics["clientHeight"], f"Sheet正文未形成滚动区: {body_metrics}"
        assert body_metrics["overflow"] in {"auto", "scroll"}, f"Sheet正文overflow错误: {body_metrics}"
        assert footer_box and footer_box["y"] + footer_box["height"] <= 569, f"Sheet底部按钮被遮挡: {footer_box}"
        page.locator("#sheet-confirm").click()
        assert page.evaluate("window.__clicks") == 1, "Sheet底部按钮无法点击"
        page.locator("#sheet-close").click()
        assert page.evaluate("window.__clicks") == 2, "Sheet关闭按钮无法点击"
        results["sheet"] = {
            "viewport": "320x568",
            "sheetHeight": round(sheet_box["height"], 2),
            "bodyClientHeight": body_metrics["clientHeight"],
            "bodyScrollHeight": body_metrics["scrollHeight"],
            "bodyScrollable": True,
            "footerInsideViewport": True,
            "buttonsClickable": True,
        }
        page.screenshot(path=str(SHOTS / "pace-sheet-320.png"), full_page=False)
        page.close()
        browser.close()

    results["limitations"].append("本运行环境无法通过浏览器导航访问本地HTTP地址，因此使用实际项目CSS与代表性DOM通过Playwright set_content执行几何和交互审计；这不是实体iPhone/Safari测试。")
    output = DOCS / "V18_3_MOBILE_TEST.json"
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    run()
