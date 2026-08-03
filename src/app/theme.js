import {THEME_MODES} from './config.js';
const KEY='fc18:theme';
export function getTheme(){const v=localStorage.getItem(KEY)||'system';return THEME_MODES.includes(v)?v:'system'}
export function applyTheme(mode=getTheme()){document.documentElement.dataset.theme=mode;localStorage.setItem(KEY,mode);return mode}
export function cycleTheme(){const now=getTheme(),next=THEME_MODES[(THEME_MODES.indexOf(now)+1)%THEME_MODES.length];return applyTheme(next)}
