import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.resolve(root,process.argv[2]||'dist');
const metadata=JSON.parse(await fs.readFile(path.join(target,'build-meta.json'),'utf8'));
const packageJson=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
for(const key of ['version','commitSha','shortCommitSha','branch','buildTime','deploymentTarget']){
  if(typeof metadata[key]!=='string'||!metadata[key])throw new Error(`invalid build metadata: ${key}`);
}
if(metadata.version!==packageJson.version)throw new Error('build version does not match package');
if(metadata.shortCommitSha!==(metadata.commitSha==='local'?'local':metadata.commitSha.slice(0,7)))throw new Error('short commit does not match commit');
if(Number.isNaN(Date.parse(metadata.buildTime)))throw new Error('invalid build time');
for(const [env,key] of [['GITHUB_SHA','commitSha'],['GITHUB_REF_NAME','branch'],['DEPLOYMENT_TARGET','deploymentTarget']]){
  if(process.env[env]&&metadata[key]!==process.env[env])throw new Error(`${key} does not match ${env}`);
}
const [worker,index]=await Promise.all([fs.readFile(path.join(target,'sw.js'),'utf8'),fs.readFile(path.join(target,'index.html'),'utf8')]);
const buildId=`${metadata.shortCommitSha}-${metadata.buildTime.replace(/\D/g,'')}`;
if(!worker.includes(`career-${buildId}`)||worker.includes('__BUILD_ID__'))throw new Error('worker cache does not match metadata');
if(!/src=["']\.\/src\/main\.js/.test(index))throw new Error('production entry is not src/main.js');
console.log(JSON.stringify({status:'PASS',target:path.relative(root,target),version:metadata.version,commitSha:metadata.commitSha,buildId},null,2));
