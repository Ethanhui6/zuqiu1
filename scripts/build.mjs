import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.resolve(root,'dist'),client=path.join(dist,'client');
if(dist===root||!dist.startsWith(`${root}${path.sep}`))throw new Error('拒绝清理非项目输出目录');
await fs.rm(dist,{recursive:true,force:true});await fs.mkdir(client,{recursive:true});
const files=['index.html','styles.css','icon.svg','manifest.webmanifest','sw.js','_headers','_redirects'];
const directories=['assets','data','src'];
for(const file of files){await fs.copyFile(path.join(root,file),path.join(dist,file));await fs.copyFile(path.join(root,file),path.join(client,file))}
for(const directory of directories){await fs.cp(path.join(root,directory),path.join(dist,directory),{recursive:true});await fs.cp(path.join(root,directory),path.join(client,directory),{recursive:true})}
await fs.cp(path.join(root,'server'),path.join(dist,'server'),{recursive:true});
await fs.cp(path.join(root,'functions'),path.join(dist,'functions'),{recursive:true});
await fs.copyFile(path.join(root,'server','worker.js'),path.join(dist,'server','index.js'));
await fs.mkdir(path.join(dist,'server','shared'),{recursive:true});
await fs.copyFile(path.join(root,'src','systems','scoring','scoringSystem.js'),path.join(dist,'server','shared','scoringSystem.js'));
for(const file of [path.join(dist,'server','leaderboard','leaderboardService.js'),path.join(dist,'server','antiCheat','validateSubmission.js'),path.join(dist,'server','authority','authorityService.js'),path.join(dist,'server','authority','authoritativeEngine.js')]){
  const source=await fs.readFile(file,'utf8');
  await fs.writeFile(file,source.replace('../../src/systems/scoring/scoringSystem.js','../shared/scoringSystem.js'));
}
await fs.mkdir(path.join(dist,'.openai','drizzle'),{recursive:true});
await fs.copyFile(path.join(root,'.openai','hosting.json'),path.join(dist,'.openai','hosting.json'));
await fs.cp(path.join(root,'drizzle'),path.join(dist,'.openai','drizzle'),{recursive:true});
const legacyLeak=[];
async function scan(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory())await scan(target);else if(/(^|[\\/])(app\.js|manifest\.json|ux-v18\.2\.css|pace-v18\.3\.css)$/i.test(target))legacyLeak.push(path.relative(dist,target))}}
await scan(dist);if(legacyLeak.length)throw new Error(`生产构建混入旧文件：${legacyLeak.join('、')}`);
await fs.access(path.join(dist,'server','index.js'));await fs.access(path.join(dist,'client','index.html'));await fs.access(path.join(dist,'.openai','drizzle','0000_leaderboard.sql'));await fs.access(path.join(dist,'.openai','drizzle','0001_authoritative_runs.sql'));
console.log(JSON.stringify({status:'PASS',output:'dist',files:(await fs.readdir(dist)).length,worker:'server/index.js',client:'client/index.html',migrations:['0000_leaderboard.sql','0001_authoritative_runs.sql'],legacyLeak},null,2));
