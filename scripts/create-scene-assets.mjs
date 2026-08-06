import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENE_REGISTRY } from '../src/data/sceneRegistry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'assets', 'scenes');
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const palette = ['#eaf3ff', '#f6f1ff', '#edf8f1', '#fff4e6', '#fff0f1'];

function svg(scene, index) {
  const bg = palette[index % palette.length];
  const x = 30 + (index * 37) % 220;
  const y = 62 + (index * 19) % 50;
  const extra = scene.motif === 'rain' ? '<path d="M20 25l-8 14m38-18-8 14m40-10-8 14m40-11-8 14m40-12-8 14m40-11-8 14m40-9-8 14m40-10-8 14" stroke="#79a8cf" stroke-width="3" opacity=".7"/>'
    : scene.motif === 'snow' ? '<g fill="#fff"><circle cx="58" cy="38" r="4"/><circle cx="128" cy="24" r="3"/><circle cx="214" cy="45" r="4"/><circle cx="292" cy="28" r="3"/></g>'
      : scene.motif === 'night' ? '<circle cx="264" cy="34" r="16" fill="#fff4c2"/><path d="M0 132h320" stroke="#6c7b90" stroke-width="3"/>'
        : '<path d="M0 124h320" stroke="#b6c8d8" stroke-width="3"/>';
  const objects = {
    microphone: `<rect x="${x}" y="70" width="12" height="45" rx="6" fill="${scene.accent}"/><circle cx="${x + 6}" cy="60" r="15" fill="${scene.accent}"/><path d="M${x - 10} 61a16 16 0 0 0 32 0M${x + 6} 76v16M${x - 8} 92h28" fill="none" stroke="#5b6c83" stroke-width="3"/>`,
    press: `<rect x="44" y="48" width="232" height="74" rx="8" fill="#fff" stroke="#aabbd0" stroke-width="3"/><path d="M60 72h200M60 92h160" stroke="${scene.accent}" stroke-width="6" opacity=".8"/><circle cx="84" cy="58" r="8" fill="${scene.accent}"/>`,
    camera: `<rect x="${x}" y="70" width="55" height="33" rx="5" fill="#50647b"/><circle cx="${x + 42}" cy="86" r="12" fill="#d5e4f2"/><path d="M${x + 55} 78l28-14v44l-28-14z" fill="${scene.accent}"/>`,
    screen: `<rect x="62" y="32" width="196" height="98" rx="8" fill="#28425d" stroke="${scene.accent}" stroke-width="4"/><path d="M80 104c24-32 40 24 62-10s44-4 64-28" fill="none" stroke="#7ee0b1" stroke-width="6"/>`,
    paper: `<rect x="88" y="38" width="144" height="95" rx="4" fill="#fff" stroke="#c4ccd7" stroke-width="3"/><path d="M102 58h116M102 76h100M102 94h76" stroke="${scene.accent}" stroke-width="8"/><circle cx="202" cy="108" r="12" fill="${scene.accent}"/>`,
    phone: `<rect x="124" y="26" width="72" height="112" rx="12" fill="#fff" stroke="#5d7088" stroke-width="4"/><rect x="136" y="42" width="48" height="64" rx="5" fill="${scene.accent}" opacity=".75"/><circle cx="160" cy="120" r="6" fill="#5d7088"/>`,
    crowd: `<g fill="#5d7088"><circle cx="48" cy="92" r="18"/><circle cx="88" cy="82" r="18"/><circle cx="128" cy="96" r="18"/><circle cx="168" cy="82" r="18"/><circle cx="208" cy="94" r="18"/><circle cx="248" cy="82" r="18"/></g><path d="M20 122h280" stroke="${scene.accent}" stroke-width="8"/>`,
    alert: `<rect x="50" y="42" width="220" height="78" rx="12" fill="#fff" stroke="${scene.accent}" stroke-width="5"/><path d="M160 58l22 39h-44z" fill="${scene.accent}"/><rect x="157" y="72" width="6" height="13" fill="#fff"/><circle cx="160" cy="92" r="3" fill="#fff"/>`,
    weights: `<rect x="42" y="94" width="236" height="10" rx="5" fill="#7890a8"/><path d="M92 40v62M228 40v62" stroke="#7890a8" stroke-width="8"/><circle cx="70" cy="108" r="20" fill="${scene.accent}"/><circle cx="250" cy="108" r="20" fill="${scene.accent}"/>`,
    track: `<path d="M0 128C70 56 250 56 320 128" fill="none" stroke="${scene.accent}" stroke-width="20" opacity=".7"/><path d="M0 128C70 56 250 56 320 128" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 12"/>`,
    mat: `<rect x="58" y="87" width="204" height="42" rx="20" fill="#94c8b5"/><circle cx="160" cy="76" r="26" fill="${scene.accent}"/><path d="M132 88l-22 26m56-26 22 26" stroke="#5d7088" stroke-width="8"/>`,
    board: `<rect x="55" y="28" width="210" height="106" rx="8" fill="#f9fcff" stroke="#aabbd0" stroke-width="4"/><path d="M76 54h168M76 80h112M76 106h150" stroke="${scene.accent}" stroke-width="6"/><circle cx="212" cy="78" r="18" fill="${scene.accent}"/>`,
    goal: `<path d="M65 125V50h190v75M65 50l32 75M255 50l-32 75M65 125l190-75" fill="none" stroke="#71869e" stroke-width="4"/><circle cx="${x}" cy="${y}" r="12" fill="${scene.accent}"/>`,
    keeper: `<rect x="80" y="48" width="160" height="78" rx="10" fill="#dfeaf4" stroke="#7890a8" stroke-width="4"/><circle cx="160" cy="88" r="18" fill="${scene.accent}"/><path d="M136 88H96m88 0h40" stroke="${scene.accent}" stroke-width="8"/>`,
    wall: `<path d="M64 118V58h192v60" fill="none" stroke="#71869e" stroke-width="5"/><g fill="#e8b94e"><circle cx="96" cy="72" r="10"/><circle cx="128" cy="72" r="10"/><circle cx="160" cy="72" r="10"/><circle cx="192" cy="72" r="10"/><circle cx="224" cy="72" r="10"/></g>`,
    cones: `<g fill="${scene.accent}"><path d="M70 125l12-42 12 42zM140 125l12-42 12 42zM210 125l12-42 12 42z"/></g><path d="M50 78c80 50 140-50 220 20" fill="none" stroke="#7890a8" stroke-width="4" stroke-dasharray="7 7"/>`,
    lanes: `<path d="M54 44v84M108 44v84M162 44v84M216 44v84M270 44v84" stroke="#a4b8ca" stroke-width="5"/><g fill="${scene.accent}"><circle cx="80" cy="76" r="12"/><circle cx="188" cy="108" r="12"/><circle cx="244" cy="66" r="12"/></g>`,
    medical: `<rect x="76" y="45" width="168" height="84" rx="20" fill="#fff" stroke="#9cc7b0" stroke-width="4"/><path d="M160 59v56M132 87h56" stroke="${scene.accent}" stroke-width="12" stroke-linecap="round"/>`,
    tunnel: `<path d="M48 128V54Q160-12 272 54v74" fill="#dce8f3" stroke="#7890a8" stroke-width="4"/><path d="M94 128V70Q160 32 226 70v58" fill="#526b83"/><circle cx="160" cy="94" r="14" fill="${scene.accent}"/>`,
    warmup: `<path d="M36 120h248" stroke="#8cb3ca" stroke-width="20"/><g fill="${scene.accent}"><circle cx="100" cy="76" r="16"/><circle cx="160" cy="92" r="16"/><circle cx="220" cy="68" r="16"/></g>`,
    penalty: `<path d="M60 128V52h200v76M60 52l34 76M260 52l-34 76" fill="none" stroke="#71869e" stroke-width="4"/><circle cx="160" cy="108" r="13" fill="${scene.accent}"/><path d="M104 106h112" stroke="#fff" stroke-width="4"/>`,
    celebrate: `<circle cx="110" cy="72" r="18" fill="${scene.accent}"/><circle cx="160" cy="58" r="18" fill="#e8b94e"/><circle cx="210" cy="72" r="18" fill="#55a9c9"/><path d="M84 119c12-30 40-30 52 0m0 0c12-30 40-30 52 0m0 0c12-30 40-30 52 0" fill="none" stroke="#71869e" stroke-width="9"/>`,
    save: `<path d="M64 125V54h192v71M64 54l40 71m152-71-40 71" fill="none" stroke="#71869e" stroke-width="5"/><circle cx="${x}" cy="${y}" r="14" fill="${scene.accent}"/>`,
    card: `<rect x="100" y="35" width="50" height="84" rx="5" fill="#fff" stroke="#f0aa47" stroke-width="5" transform="rotate(-12 125 77)"/><rect x="170" y="35" width="50" height="84" rx="5" fill="#fff" stroke="#d95065" stroke-width="5" transform="rotate(12 195 77)"/>`,
    clock: `<circle cx="160" cy="82" r="48" fill="#fff" stroke="${scene.accent}" stroke-width="7"/><path d="M160 82V53m0 29 24 14" stroke="#5d7088" stroke-width="6" stroke-linecap="round"/>`,
    locker: `<rect x="70" y="34" width="70" height="96" rx="5" fill="#9ab3c7"/><rect x="150" y="34" width="70" height="96" rx="5" fill="#7f9db4"/><circle cx="128" cy="82" r="7" fill="${scene.accent}"/><circle cx="208" cy="82" r="7" fill="${scene.accent}"/>`,
    wave: `<path d="M20 105c30-35 54-35 84 0s54 35 84 0 54-35 112 0" fill="none" stroke="${scene.accent}" stroke-width="9"/><circle cx="70" cy="67" r="15" fill="#71869e"/><circle cx="250" cy="67" r="15" fill="#71869e"/>`,
    desk: `<rect x="56" y="92" width="208" height="24" rx="8" fill="#9a7d62"/><rect x="90" y="38" width="140" height="70" rx="8" fill="#f9fcff" stroke="#7890a8" stroke-width="4"/><circle cx="160" cy="73" r="16" fill="${scene.accent}"/>`,
    talk: `<circle cx="120" cy="74" r="24" fill="${scene.accent}"/><circle cx="200" cy="74" r="24" fill="#5d89aa"/><path d="M88 117c8-27 56-27 64 0m16 0c8-27 56-27 64 0" fill="none" stroke="#71869e" stroke-width="9"/>`,
    dispute: `<path d="M92 55l56 42m80-42-56 42" stroke="${scene.accent}" stroke-width="9"/><circle cx="92" cy="55" r="20" fill="#71869e"/><circle cx="228" cy="55" r="20" fill="#71869e"/>`,
    birthday: `<circle cx="160" cy="79" r="34" fill="${scene.accent}"/><path d="M130 112h60" stroke="#71869e" stroke-width="10"/><path d="M132 48l8-18m22 18V24m22 24 10-18" stroke="#e8b94e" stroke-width="7"/>`,
    agent: `<rect x="82" y="42" width="156" height="86" rx="9" fill="#fff" stroke="${scene.accent}" stroke-width="4"/><path d="M104 68h112m-112 22h80" stroke="#7890a8" stroke-width="7"/><circle cx="201" cy="104" r="14" fill="${scene.accent}"/>`,
    contract: `<path d="M86 32h148v96H86z" fill="#fff" stroke="#7890a8" stroke-width="4"/><path d="M108 58h104m-104 22h94m-94 22h52" stroke="${scene.accent}" stroke-width="7"/><path d="m177 106 12 12 26-31" fill="none" stroke="#22a06b" stroke-width="7"/>`,
    negotiate: `<circle cx="124" cy="80" r="28" fill="${scene.accent}"/><circle cx="196" cy="80" r="28" fill="#5d89aa"/><path d="M146 80h28" stroke="#e8b94e" stroke-width="10"/><path d="M99 118h122" stroke="#71869e" stroke-width="8"/>`,
    bus: `<rect x="40" y="48" width="240" height="82" rx="18" fill="#789db6" stroke="#50647b" stroke-width="5"/><path d="M64 68h192" stroke="#dce8f3" stroke-width="20"/><circle cx="88" cy="132" r="15" fill="#344b63"/><circle cx="232" cy="132" r="15" fill="#344b63"/>`,
    airport: `<path d="M160 25v105M54 94h212M68 77l92 17 92-17M160 94 102 44m58 50 58-50" stroke="${scene.accent}" stroke-width="7" fill="none"/>`,
    award: `<path d="M128 51h64v62h-64z" fill="#e8b94e"/><path d="M128 64H98c0 34 30 37 30 37m64-37h30c0 34-30 37-30 37" fill="none" stroke="#c9941a" stroke-width="9"/><path d="M160 113v17m-30 0h60" stroke="#9a7d62" stroke-width="9"/>`,
    champion: `<path d="M122 42h76l-12 76h-52z" fill="#e8b94e" stroke="#c9941a" stroke-width="5"/><path d="M122 60H88c0 34 34 37 34 37m76-37h34c0 34-34 37-34 37" fill="none" stroke="#c9941a" stroke-width="9"/><circle cx="160" cy="60" r="8" fill="#fff4c2"/>`,
    home: `<path d="M76 75 160 27l84 48v57H76z" fill="#fff" stroke="#7890a8" stroke-width="4"/><path d="M144 132V91h32v41" fill="${scene.accent}"/><path d="M102 84h34v25h-34zm82 0h34v25h-34z" fill="#dce8f3"/>`,
    studio: `<rect x="50" y="34" width="220" height="94" rx="8" fill="#e5d7c4"/><rect x="92" y="65" width="136" height="48" rx="6" fill="#fff"/><circle cx="160" cy="62" r="24" fill="${scene.accent}"/>`,
    charity: `<path d="M160 120V58M80 80h160" stroke="#7890a8" stroke-width="5"/><path d="M160 32c14 25 33 39 53 43-20 7-38 23-53 45-15-22-33-38-53-45 20-4 39-18 53-43z" fill="${scene.accent}"/>`,
    fans: `<g fill="#7890a8"><circle cx="68" cy="88" r="18"/><circle cx="116" cy="70" r="18"/><circle cx="204" cy="70" r="18"/><circle cx="252" cy="88" r="18"/></g><circle cx="160" cy="64" r="28" fill="${scene.accent}"/><path d="M54 125h212" stroke="#e8b94e" stroke-width="8"/>`,
    food: `<rect x="70" y="50" width="180" height="78" rx="12" fill="#fff" stroke="#9cc7b0" stroke-width="4"/><circle cx="128" cy="89" r="22" fill="#7cbf83"/><circle cx="188" cy="89" r="22" fill="#f0b34e"/><circle cx="218" cy="89" r="22" fill="${scene.accent}"/>`,
    storm: `<path d="M40 62h240v62H40z" fill="#fff" stroke="#d95065" stroke-width="5"/><path d="M72 82h172m-172 20h130" stroke="#aabbd0" stroke-width="7"/><path d="M188 114h54" stroke="${scene.accent}" stroke-width="8"/>`,
    sponsor: `<path d="M58 56h204v72H58z" fill="#fff" stroke="${scene.accent}" stroke-width="5"/><circle cx="110" cy="92" r="22" fill="#e8b94e"/><path d="M152 79h82m-82 23h64" stroke="#7890a8" stroke-width="8"/>`,
    city: `<path d="M48 128V76h28v52m18 0V48h36v80m20 0V67h34v61m18 0V35h40v93" fill="#8fa5b8" stroke="#617990" stroke-width="3"/><circle cx="160" cy="32" r="16" fill="${scene.accent}"/>`,
    national: `<path d="M160 28v102M160 38l68 22-68 22" stroke="#7890a8" stroke-width="6"/><path d="M160 45v30" stroke="${scene.accent}" stroke-width="20"/>`
  }[scene.motif] || `<circle cx="160" cy="80" r="44" fill="${scene.accent}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" role="img" aria-label="${esc(scene.name)}"><rect width="320" height="180" rx="18" fill="${bg}"/><path d="M0 132h320v48H0z" fill="#d8e5ef" opacity=".72"/>${extra}${objects}<rect x="12" y="12" width="${Math.min(150, 38 + scene.name.length * 5)}" height="22" rx="11" fill="#fff" opacity=".82"/><text x="24" y="27" font-family="sans-serif" font-size="10" font-weight="700" fill="#41546a">${esc(scene.name)}</text></svg>`;
}

await fs.mkdir(target, { recursive: true });
await Promise.all(SCENE_REGISTRY.map((scene, index) => fs.writeFile(path.join(target, `${scene.id}.svg`), svg(scene, index), 'utf8')));
console.log(`generated ${SCENE_REGISTRY.length} self-authored scene assets`);

