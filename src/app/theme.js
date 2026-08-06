const KEY='fc18:theme';
export const THEME_MODES=['system','dark','light'];
let systemQuery;
export function getTheme(){const saved=localStorage.getItem(KEY);return THEME_MODES.includes(saved)?saved:'light'}
export function resolveTheme(preference=getTheme()){if(preference!=='system')return preference;return window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark'}
function watchSystemTheme(){if(systemQuery||typeof window==='undefined'||!window.matchMedia)return;systemQuery=window.matchMedia('(prefers-color-scheme: light)');const sync=()=>{if(getTheme()==='system')applyTheme('system')};if(systemQuery.addEventListener)systemQuery.addEventListener('change',sync);else systemQuery.addListener?.(sync)}
export function applyTheme(preference=getTheme()){const mode=THEME_MODES.includes(preference)?preference:'light';const resolved=resolveTheme(mode);document.documentElement.dataset.theme=resolved;document.documentElement.dataset.themePreference=mode;document.documentElement.style.colorScheme=resolved;localStorage.setItem(KEY,mode);watchSystemTheme();return resolved}
export function cycleTheme(){const next=THEME_MODES[(THEME_MODES.indexOf(getTheme())+1)%THEME_MODES.length];applyTheme(next);return next}
