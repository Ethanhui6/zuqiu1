const KEY='fc18:theme';
export function getTheme(){return 'light'}
export function applyTheme(){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';localStorage.setItem(KEY,'light');return 'light'}
export function cycleTheme(){return applyTheme()}
