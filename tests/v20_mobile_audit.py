from __future__ import annotations

import json
import mimetypes
import pathlib
import re
from typing import Any

from playwright.sync_api import Page, Route, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHOTS = ROOT / "docs" / "screenshots-v20"
SHOTS.mkdir(parents=True, exist_ok=True)

STORAGE_PRELUDE = r"""
<script>
(() => {
  const empty = () => ({local:{}, session:{}});
  const read = () => { try { return JSON.parse(window.name || JSON.stringify(empty())); } catch { return empty(); } };
  const makeStorage = type => ({
    getItem(key) { return read()[type][key] ?? null; },
    setItem(key, value) { const data=read(); data[type][key]=String(value); window.name=JSON.stringify(data); },
    removeItem(key) { const data=read(); delete data[type][key]; window.name=JSON.stringify(data); },
    clear() { const data=read(); data[type]={}; window.name=JSON.stringify(data); },
    key(index) { return Object.keys(read()[type])[index] ?? null; },
    get length() { return Object.keys(read()[type]).length; }
  });
  Object.defineProperty(window, 'localStorage', {value:makeStorage('local'), configurable:true});
  Object.defineProperty(window, 'sessionStorage', {value:makeStorage('session'), configurable:true});
  history.pushState = state => { window.__historyState=state; };
  history.replaceState = state => { window.__historyState=state; };
  Object.defineProperty(navigator, 'serviceWorker', {value:{
    getRegistrations:async()=>[], register:async()=>({waiting:null,addEventListener(){}}), addEventListener(){}
  }, configurable:true});
})();
</script>
"""

INDEX_HTML = (ROOT / "index.html").read_text(encoding="utf-8").replace(
    "<head>", '<head><base href="http://app.local/">' + STORAGE_PRELUDE, 1
)


def route_local(route: Route) -> None:
    url = route.request.url
    relative = url.split("http://app.local/", 1)[1].split("?", 1)[0].split("#", 1)[0]
    if relative.startswith("api/"):
        route.fulfill(status=503, content_type="application/json", body='{"error":"当前无法连接排名服务器"}', headers={"Access-Control-Allow-Origin":"*"})
        return
    target = (ROOT / relative).resolve()
    if not str(target).startswith(str(ROOT)) or not target.is_file():
        route.fulfill(status=404, body="Not Found")
        return
    content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    route.fulfill(status=200, body=target.read_bytes(), content_type=content_type, headers={"Access-Control-Allow-Origin":"*"})


def should_collect_console_error(text: str) -> bool:
    return "Failed to load resource: the server responded with a status of 503" not in text


def mount_app(page: Page, *, career: bool = False, storage_name: str | None = None) -> None:
    page.route("http://app.local/**", route_local)
    if storage_name is not None:
        page.evaluate("value => { window.name=value; }", storage_name)
    if career:
        page.evaluate("location.hash='career'")
    page.set_content(INDEX_HTML, wait_until="load")
    page.wait_for_timeout(1800)


def close_sheet(page: Page) -> None:
    """关闭当前 Sheet，并等待过渡和滚动锁完整释放。"""
    for _ in range(4):
        backdrops = page.locator(".sheet-backdrop")
        if backdrops.count() == 0:
            return
        current = backdrops.last
        close = current.get_by_role("button", name="关闭弹窗")
        if close.count():
            close.click()
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(460)
    assert page.locator(".sheet-backdrop").count() == 0


def audit_page(page: Page, label: str) -> dict[str, Any]:
    data = page.evaluate(
        r"""
        () => {
          const visible = node => {
            const r=node.getBoundingClientRect(), s=getComputedStyle(node);
            return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none';
          };
          const smallButtons=[...document.querySelectorAll('button')].filter(node=>{
            if(!visible(node))return false;const r=node.getBoundingClientRect();return r.width<43.5||r.height<43.5;
          }).map(node=>({text:(node.innerText||node.getAttribute('aria-label')||'').trim().slice(0,32),width:rnd(node.getBoundingClientRect().width),height:rnd(node.getBoundingClientRect().height)}));
          function rnd(v){return Math.round(v*10)/10}
          const transparentBlockers=[...document.querySelectorAll('body *')].filter(node=>{
            if(!visible(node))return false; const s=getComputedStyle(node),r=node.getBoundingClientRect();
            return ['fixed','absolute'].includes(s.position)&&Number(s.opacity)<.05&&s.pointerEvents!=='none'&&r.width>innerWidth*.7&&r.height>innerHeight*.5;
          }).map(node=>node.className||node.tagName);
          const giantLayers=[...document.querySelectorAll('body *')].filter(node=>{
            if(!visible(node)||node.matches('.sheet-backdrop,.animation-layer,.overlay-root,.toast-root'))return false;
            const s=getComputedStyle(node),r=node.getBoundingClientRect(),c=s.backgroundColor.match(/[\d.]+/g)?.map(Number)||[];
            const alpha=c.length>=4?c[3]:1;
            const dark=alpha>.2&&c.length>=3&&c[0]<55&&c[1]<55&&c[2]<55;
            const green=alpha>.2&&c.length>=3&&c[1]>75&&c[1]>c[0]*1.35&&c[1]>c[2]*1.2;
            return ['fixed','absolute'].includes(s.position)&&r.width>innerWidth*.75&&r.height>innerHeight*.45&&(dark||green);
          }).map(node=>node.className||node.tagName);
          const badText=['[object Object]','undefined','null','NaN','World Explorer','Loading','Continue'].filter(token=>document.body.innerText.includes(token));
          const nav=document.querySelector('.v20-tab-bar');
          const navRect=nav&&visible(nav)?nav.getBoundingClientRect():null;
          const main=document.querySelector('.v20-main-viewport');
          return{
            viewport:{width:innerWidth,height:innerHeight},
            rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            mainOverflow:main?main.scrollWidth-main.clientWidth:0,
            smallButtons,transparentBlockers,giantLayers,badText,
            overlays:document.querySelectorAll('.sheet-backdrop,.animation-layer').length,
            nav:navRect?{left:rnd(navRect.left),right:rnd(navRect.right),bottom:rnd(navRect.bottom),height:rnd(navRect.height),backdrop:getComputedStyle(nav).backdropFilter||getComputedStyle(nav).webkitBackdropFilter}:null
          };
        }
        """
    )
    assert data["rootOverflow"] <= 1, f"{label}: 根节点横向溢出 {data['rootOverflow']}"
    assert data["mainOverflow"] <= 1, f"{label}: 正文横向溢出 {data['mainOverflow']}"
    assert not data["smallButtons"], f"{label}: 小于44×44按钮 {data['smallButtons']}"
    assert not data["transparentBlockers"], f"{label}: 透明遮挡层 {data['transparentBlockers']}"
    assert not data["giantLayers"], f"{label}: 巨型遮挡层 {data['giantLayers']}"
    assert not data["badText"], f"{label}: 异常文字 {data['badText']}"
    if data["nav"]:
        assert data["nav"]["left"] >= 7 and data["nav"]["right"] <= data["viewport"]["width"] + 1
        assert data["nav"]["bottom"] <= data["viewport"]["height"] + 1
        assert data["nav"]["backdrop"] != "none"
    return data


def finish_onboarding(page: Page) -> None:
    page.get_by_role("button", name="创建新生涯").click()
    date=page.locator("input[type=date]")
    date.click();date.fill("2009-07-16");date.dispatch_event("input");date.dispatch_event("change");page.keyboard.press("Tab")
    assert date.input_value()=="2009-07-16" and page.locator(".sheet-backdrop").count()==0
    page.get_by_role("button",name="下一步",exact=True).click()
    page.get_by_role("button",name="下一步",exact=True).click()
    page.get_by_role("button",name="中前卫",exact=True).click()
    page.get_by_role("button",name="下一步",exact=True).click()
    page.locator(".selection-card").first.click()
    page.get_by_role("button",name="下一步",exact=True).click()
    page.locator(".talent-card").first.click()
    page.get_by_role("button",name="下一步",exact=True).click()
    page.locator(".club-select-card").first.click()
    page.get_by_role("button",name="快速模式").click()
    page.get_by_role("button",name="开始职业生涯",exact=True).click()
    page.get_by_role("heading",name="关键职业事件").wait_for()
    page.locator(".v20-choice-card").first.click()
    page.get_by_role("heading",name="选择结果").wait_for()
    page.get_by_role("button",name="留在生涯首页",exact=True).click()
    page.locator(".v20-career-console").wait_for()


def main() -> None:
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
        page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=1)
        page.set_default_timeout(18000)
        errors=[]
        page.on("console",lambda message:errors.append(message.text) if message.type=="error" and should_collect_console_error(message.text) else None)
        page.on("pageerror",lambda error:errors.append(str(error)))
        mount_app(page)
        finish_onboarding(page)
        home=audit_page(page,"390×844 生涯首页")
        assert page.locator(".v20-focus-card").count()==1
        assert page.locator(".v20-career-pair").count()==1
        assert page.locator(".v20-home-mini-card").count()==2
        assert page.locator(".v20-training-reminder").count()==1
        page.screenshot(path=str(SHOTS/"career-home-390x844.png"),full_page=False)

        # 赛季目标：选择后保持在详情。
        page.locator(".v20-home-mini-card").nth(0).click()
        page.get_by_role("heading",name="赛季目标").wait_for()
        objective_cards=page.locator(".v20-objective-card")
        if objective_cards.count():
            objective_cards.first.click();page.wait_for_timeout(350)
            assert page.get_by_role("heading",name="赛季目标").count()==1
        close_sheet(page)

        # 数据设施中心与数据分析。
        page.locator(".v20-home-mini-card").nth(1).click()
        page.get_by_role("heading",name="数据与设施中心").wait_for()
        assert page.locator(".v20-facility-tile").count()==4
        page.locator(".v20-facility-tile").nth(0).click()
        page.get_by_role("heading",name="数据分析室").wait_for()
        assert page.locator(".v20-sparkline").count()>=1
        page.screenshot(path=str(SHOTS/"data-analysis-390x844.png"),full_page=False)
        close_sheet(page)

        # 医疗方案。
        page.locator(".v20-home-mini-card").nth(1).click();page.get_by_role("heading",name="数据与设施中心").wait_for()
        page.locator(".v20-facility-tile").nth(1).click();page.get_by_role("heading",name="医疗中心").wait_for()
        plan=page.locator(".v20-plan-card:not([disabled])").first
        assert plan.count()==1
        plan.click();page.get_by_role("heading",name="医疗方案已更新").wait_for();close_sheet(page)

        # 更衣室选择。
        page.locator(".v20-home-mini-card").nth(1).click();page.get_by_role("heading",name="数据与设施中心").wait_for()
        page.locator(".v20-facility-tile").nth(2).click();page.get_by_role("heading",name="更衣室",exact=True).wait_for()
        action=page.locator(".v20-plan-card:not([disabled])").first
        if action.count():
            action.click();page.get_by_role("heading",name="更衣室互动结果").wait_for();close_sheet(page)
        else: close_sheet(page)

        # 训练页与真实训练卡。
        page.get_by_role("button",name="训练",exact=True).click();page.wait_for_timeout(500)
        assert page.locator(".training-plan-grid").count()==1
        assert page.locator(".training-plan-card").count()>=4
        audit_page(page,"390×844 训练页")
        page.screenshot(path=str(SHOTS/"training-390x844.png"),full_page=False)

        # 转会页：窗口关闭也有内容，球队详情共用地图。
        page.get_by_role("button",name="转会",exact=True).click();page.wait_for_timeout(500)
        assert page.locator(".v20-transfer-strategy-grid").count()==1
        assert page.locator(".v20-club-mini-card").count()>=1
        page.locator(".v20-club-mini-card").first.click();page.locator(".v20-club-detail").wait_for()
        assert page.locator(".v20-club-map").count()==1
        page.screenshot(path=str(SHOTS/"club-detail-390x844.png"),full_page=False)
        close_sheet(page)
        audit_page(page,"390×844 转会页")

        # 更多页与真实消息/设施入口。
        page.get_by_role("button",name="更多",exact=True).click();page.wait_for_timeout(500)
        assert page.locator(".v20-settings-group").count()>=5
        messages=page.get_by_role("button",name=re.compile(r"^消息中心"))
        if messages.count():
            messages.first.click();page.get_by_role("heading",name="消息中心").wait_for();close_sheet(page)
        page.screenshot(path=str(SHOTS/"more-390x844.png"),full_page=False)

        # 世界地图逐级进入球队详情。
        page.get_by_role("button",name=re.compile(r"^球队世界")).first.click();page.wait_for_timeout(500)
        page.locator(".v20-world-page").wait_for()
        for _ in range(4):
            if page.locator(".v20-world-map-card").count():
                break
            page.get_by_role("button",name="返回上一级").click();page.wait_for_timeout(250)
        assert page.locator(".v20-world-map-card").count()==1
        page.locator(".v20-map-region").first.click();page.locator(".v20-country-card").first.wait_for();page.locator(".v20-country-card").first.click()
        page.locator(".v20-league-card").first.wait_for();page.locator(".v20-league-card").first.click()
        page.locator(".club-card").first.wait_for();page.locator(".club-card").first.click();page.locator(".v20-club-detail").wait_for();close_sheet(page)
        audit_page(page,"390×844 足球世界")
        page.screenshot(path=str(SHOTS/"world-390x844.png"),full_page=False)

        # 比赛页可用，双方信息不裁切。
        page.get_by_role("button",name="比赛",exact=True).click();page.wait_for_timeout(500)
        assert page.locator(".match-header-card,.upcoming-card").count()>=1
        audit_page(page,"390×844 比赛页")
        page.screenshot(path=str(SHOTS/"match-390x844.png"),full_page=False)

        storage_name=page.evaluate("window.name")
        assert not errors,f"390×844 控制台错误：{errors}"
        page.close()

        for width,height in [(320,568),(360,800),(375,667),(390,844),(393,852),(412,915),(430,932)]:
            mobile=browser.new_page(viewport={"width":width,"height":height},is_mobile=True,has_touch=True,device_scale_factor=1)
            mobile.set_default_timeout(18000)
            local_errors=[]
            mobile.on("console",lambda message,bag=local_errors:bag.append(message.text) if message.type=="error" and should_collect_console_error(message.text) else None)
            mobile.on("pageerror",lambda error,bag=local_errors:bag.append(str(error)))
            mount_app(mobile,career=True,storage_name=storage_name)
            mobile.locator(".v20-career-console").wait_for()
            geometry=audit_page(mobile,f"{width}×{height} 生涯首页")
            assert mobile.locator(".v20-focus-card").count()==1
            assert mobile.locator(".v20-home-mini-card").count()==2
            assert not local_errors,f"{width}×{height} 控制台错误：{local_errors}"
            if width in (320,430):mobile.screenshot(path=str(SHOTS/f"career-{width}x{height}.png"),full_page=False)
            results.append({"width":width,"height":height,"rootOverflow":geometry["rootOverflow"],"mainOverflow":geometry["mainOverflow"],"smallButtons":len(geometry["smallButtons"]),"badText":geometry["badText"],"glassNav":bool(geometry["nav"])})
            mobile.close()
        browser.close()

    report={"status":"PASS","version":"20.0.0","engine":"系统 Chromium + Python Playwright 路由注入生产模块","flows":["六步建档与原生日期","开局事件","首页首屏","赛季目标","数据分析","医疗方案","更衣室互动","训练","转会与球队详情","更多与消息中心","世界地图四级探索","比赛页","刷新后存档保持"],"viewports":results,"screenshots":str(SHOTS.relative_to(ROOT)),"physicalDevice":False,"consoleErrors":0}
    (ROOT/"docs"/"V20_MOBILE_TEST.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=="__main__":main()
