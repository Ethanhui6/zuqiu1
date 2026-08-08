export function createAppShell() {
  const root = document.createElement('div');
  root.className = 'app-shell';
  root.innerHTML = `
    <div class="app-topbar-host" data-topbar></div>
    <main class="app-main" data-page tabindex="-1"></main>
    <section class="app-action-dock" data-action-dock hidden aria-label="当前主要操作"></section>
    <div class="app-tabbar-host" data-tabbar></div>
  `;

  return {
    root,
    topbar: root.querySelector('[data-topbar]'),
    main: root.querySelector('[data-page]'),
    actionDock: root.querySelector('[data-action-dock]'),
    tabbar: root.querySelector('[data-tabbar]')
  };
}

export function renderAppShell(shell, { topbar, page, tabbar }) {
  shell.topbar.innerHTML = topbar;
  shell.main.replaceChildren(page);
  shell.tabbar.innerHTML = tabbar;

  const primaryAction = shell.main.querySelector('.page-fixed-action');
  shell.actionDock.replaceChildren();
  shell.actionDock.hidden = !primaryAction;
  if (primaryAction) shell.actionDock.append(primaryAction);
}

export function resetAppShellScroll(shell) {
  shell?.main.scrollTo({ top: 0, behavior: 'auto' });
  shell?.main.focus({ preventScroll: true });
}
