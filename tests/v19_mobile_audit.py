from __future__ import annotations

import json
import mimetypes
import pathlib
from typing import Any

from playwright.sync_api import Page, Route, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHOTS = ROOT / "docs" / "screenshots-v19"
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
    ignored = (
        "Failed to load resource: the server responded with a status of 503",
    )
    return not any(item in text for item in ignored)


def mount_app(page: Page, *, career: bool = False, storage_name: str | None = None) -> None:
    page.route("http://app.local/**", route_local)
    if storage_name is not None:
        page.evaluate("value => { window.name=value; }", storage_name)
    if career:
        page.evaluate("location.hash='career'")
    page.set_content(INDEX_HTML, wait_until="load")
    page.wait_for_timeout(2200)


def audit_page(page: Page, label: str) -> dict[str, Any]:
    data = page.evaluate(
        r"""
        () => {
          const visible = node => {
            const r=node.getBoundingClientRect(), s=getComputedStyle(node);
            return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none';
          };
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
          const smallButtons=[...document.querySelectorAll('button')].filter(node=>{
            if(!visible(node))return false;const r=node.getBoundingClientRect();return r.width<43.5||r.height<43.5;
          }).map(node=>({text:(node.innerText||'').trim().slice(0,24),width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}));
          const nav=document.querySelector('.tab-bar');
          const navData=nav&&visible(nav)?(()=>{const r=nav.getBoundingClientRect(),s=getComputedStyle(nav);return{left:r.left,right:r.right,bottom:r.bottom,position:s.position,backdrop:s.backdropFilter||s.webkitBackdropFilter,borderRadius:s.borderRadius}})():null;
          const main=document.querySelector('.page-container');
          return{
            rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
            mainOverflow:main?main.scrollWidth-main.clientWidth:0,
            speedDockCount:document.querySelectorAll('.speed-dock,.speed-control,.speed-controls').length,
            transparentBlockers,giantLayers,smallButtons,nav:navData,
            guideVisible:Boolean(document.querySelector('.guidance-banner')),
            badges:document.querySelectorAll('.tab-badge:not([hidden])').length,
            viewport:{width:innerWidth,height:innerHeight}
          };
        }
        """
    )
    assert data["rootOverflow"] <= 1, f"{label}: 根节点横向溢出 {data['rootOverflow']}"
    assert data["mainOverflow"] <= 1, f"{label}: 正文横向溢出 {data['mainOverflow']}"
    assert data["speedDockCount"] == 0, f"{label}: 仍存在常驻速度控制栏"
    assert not data["transparentBlockers"], f"{label}: 透明遮挡层 {data['transparentBlockers']}"
    assert not data["giantLayers"], f"{label}: 巨型黑色/绿色遮挡层 {data['giantLayers']}"
    assert not data["smallButtons"], f"{label}: 小于44×44按钮 {data['smallButtons']}"
    if data["nav"]:
        nav=data["nav"]
        assert nav["position"] == "fixed", f"{label}: 底栏不是 fixed"
        assert nav["left"] >= 7 and nav["right"] <= data["viewport"]["width"] + 1, f"{label}: 底栏横向越界"
        assert nav["bottom"] <= data["viewport"]["height"] + 1, f"{label}: 底栏被裁切"
        assert nav["backdrop"] != "none", f"{label}: 底栏没有玻璃模糊"
        assert float(nav["borderRadius"].replace("px", "").split()[0]) >= 20, f"{label}: 底栏圆角不足"
    return data


def finish_onboarding(page: Page) -> None:
    date=page.locator("input[type=date]")
    date.click(); date.fill("2009-07-16"); date.dispatch_event("input"); date.dispatch_event("change"); page.keyboard.press("Tab")
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
    page.locator(".event-choice").first.click()
    page.get_by_role("heading",name="选择结果").wait_for()
    page.get_by_role("button",name="返回生涯",exact=True).click()
    page.get_by_role("heading",name="职业生涯控制台").wait_for()


def main() -> None:
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path="/usr/bin/chromium",args=["--no-sandbox","--disable-dev-shm-usage"])
        page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=1)
        page.set_default_timeout(15000)
        errors=[]
        page.on("console",lambda message:errors.append(message.text) if message.type=="error" and should_collect_console_error(message.text) else None)
        page.on("pageerror",lambda error:errors.append(str(error)))
        mount_app(page)
        page.get_by_role("button",name="创建新生涯").click()
        audit_page(page,"390×844 创建球员")
        finish_onboarding(page)
        career=audit_page(page,"390×844 生涯首页")
        assert career["guideVisible"] and career["badges"]>0
        page.wait_for_timeout(500)
        if page.locator(".scroll-hint.is-visible").count():
            page.locator(".scroll-hint.is-visible").click();page.wait_for_timeout(350)
            assert page.locator(".page-container").evaluate("node=>node.scrollTop>0")
            page.locator(".page-container").evaluate("node=>node.scrollTo(0,0)")
        page.screenshot(path=str(SHOTS/"career-guidance-390x844.png"),full_page=False)
        page.locator(".header-pace-button").click()
        page.get_by_role("heading",name="游戏节奏",exact=True).wait_for()
        page.get_by_role("button",name="2倍",exact=True).click()
        page.get_by_role("button",name="快速",exact=True).click()
        auto_training=page.get_by_role("checkbox",name="自动推进普通训练")
        if auto_training.is_checked():auto_training.uncheck()
        page.screenshot(path=str(SHOTS/"pace-settings-390x844.png"),full_page=False)
        page.get_by_role("button",name="关闭弹窗").click();page.wait_for_timeout(350)
        assert page.locator(".sheet-backdrop").count()==0 and "2倍" in page.locator(".header-pace-button").inner_text()
        stored=page.evaluate("JSON.parse(localStorage.getItem('green-pitch-v19-pace')||'null')")
        assert stored["speed"]=="fast" and stored["eventAnimationSpeed"]=="fast" and stored["autoTraining"] is False
        storage_name=page.evaluate("window.name")

        assert not errors,f"390×844 控制台错误：{errors}"
        page.close()

        # 使用相同本地存储重新创建浏览页面，等价验证刷新后存档与设置保持。
        reload_page=browser.new_page(viewport={"width":390,"height":844},is_mobile=True,has_touch=True,device_scale_factor=1)
        reload_page.set_default_timeout(15000)
        reload_errors=[]
        reload_page.on("console",lambda message:reload_errors.append(message.text) if message.type=="error" and should_collect_console_error(message.text) else None)
        reload_page.on("pageerror",lambda error:reload_errors.append(str(error)))
        mount_app(reload_page,career=True,storage_name=storage_name)
        reload_page.get_by_role("heading",name="职业生涯控制台").wait_for()
        assert "2倍" in reload_page.locator(".header-pace-button").inner_text()
        audit_page(reload_page,"390×844 重新载入")
        assert not reload_errors,f"390×844 重新载入控制台错误：{reload_errors}"
        reload_page.close()

        for width,height in [(320,568),(360,800),(375,667),(393,852),(412,915),(430,932),(768,1024)]:
            mobile=browser.new_page(viewport={"width":width,"height":height},is_mobile=width<768,has_touch=True,device_scale_factor=1)
            mobile.set_default_timeout(15000)
            local_errors=[]
            mobile.on("console",lambda message,bag=local_errors:bag.append(message.text) if message.type=="error" and should_collect_console_error(message.text) else None)
            mobile.on("pageerror",lambda error,bag=local_errors:bag.append(str(error)))
            mount_app(mobile,career=True,storage_name=storage_name)
            mobile.get_by_role("heading",name="职业生涯控制台").wait_for()
            geometry=audit_page(mobile,f"{width}×{height} 生涯首页")
            assert geometry["guideVisible"] and geometry["badges"]>0
            if width in (320,430,768):mobile.screenshot(path=str(SHOTS/f"career-{width}x{height}.png"),full_page=False)
            assert not local_errors,f"{width}×{height} 控制台错误：{local_errors}"
            results.append({"width":width,"height":height,"overflow":geometry["rootOverflow"],"badges":geometry["badges"],"guide":geometry["guideVisible"],"glassNav":bool(geometry["nav"])})
            mobile.close()
        browser.close()

    report={"status":"PASS","version":"19.1.0","engine":"系统 Chromium + Playwright 路由注入真实生产模块","fullFlow":["创建球员","开局事件","下一步引导","待办徽标","滚动提示","游戏节奏Sheet","设置立即生效","重新装载保持"],"viewports":results,"screenshots":str(SHOTS.relative_to(ROOT)),"physicalDevice":False,"networkNavigation":"运行环境策略阻止localhost导航，测试通过浏览器请求路由加载原始生产文件"}
    (ROOT/"docs"/"V19_MOBILE_TEST.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=="__main__":main()
