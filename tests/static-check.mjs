import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ignored=new Set(['node_modules','dist','legacy','.git']);
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.isDirectory()&&ignored.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
const files=await walk(root);const js=files.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'));
const missing=[];
for(const file of js){const text=await fs.readFile(file,'utf8');for(const match of text.matchAll(/(?:from\s*|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g)){let target=path.resolve(path.dirname(file),match[1]);if(!path.extname(target))target+='.js';try{await fs.access(target)}catch{missing.push(`${path.relative(root,file)} -> ${match[1]}`)}}}
assert.deepEqual(missing,[],'存在失效的相对导入');
const html=await fs.readFile(path.join(root,'index.html'),'utf8');for(const ref of [...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)/g)].map(x=>x[1])){const target=path.resolve(root,ref);await fs.access(target)}
const source=(await Promise.all(files.filter(f=>f.includes(`${path.sep}src${path.sep}`)&&f.endsWith('.js')).map(f=>fs.readFile(f,'utf8')))).join('\n');
assert.equal(source.includes('Math.random'),false,'关键源码不得使用 Math.random');
for(const banned of ['Season Complete','Career Complete','Transfer Offer','Continue','Loading'])assert.equal(source.includes(banned),false,`用户界面存在未翻译文字：${banned}`);
const sw=await fs.readFile(path.join(root,'sw.js'),'utf8');assert.match(sw,/clients\.claim/);assert.match(sw,/skipWaiting/);assert.match(sw,/career-v20-shell/);assert.match(sw,/fetch\(event\.request\)/);
for(const ref of [...sw.matchAll(/'\.\/([^']+)'/g)].map(x=>x[1]).filter(x=>!x.includes('${'))){const target=path.join(root,ref);try{await fs.access(target)}catch{if(![''].includes(ref))missing.push(`sw.js -> ${ref}`)}}
assert.deepEqual(missing,[],'Service Worker 预缓存存在缺失文件');
console.log(JSON.stringify({status:'PASS',files:files.length,javascript:js.length,relativeImports:'全部有效',mathRandom:'未发现',serviceWorker:'通过'},null,2));
