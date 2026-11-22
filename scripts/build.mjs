import {mkdir,readFile,writeFile,cp,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import { writeSocialPages } from './social-pages.mjs';
import matter from 'gray-matter';
import {marked} from 'marked';
import hljs from 'highlight.js';
const root=process.cwd(),out=path.join(root,'dist');
const config=JSON.parse(await readFile('site.config.json','utf8'));
const repo=process.env.GITHUB_REPOSITORY;
if(repo){config.repository=`https://github.com/${repo}`;}
if(process.env.SITE_URL){
 const deployment=new URL(process.env.SITE_URL);
 if(deployment.host===new URL(config.url).host)deployment.protocol=new URL(config.url).protocol;
 config.url=deployment.href;
}
if(config.url&&!/^https?:\/\//.test(config.url))throw new Error('site.config.json: url must use http(s)');
const escape=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
marked.use({renderer:{code({text,lang}){
 const language=(lang||'').split(/\s/)[0];
 const value=language&&hljs.getLanguage(language)?hljs.highlight(text,{language}).value:escape(text);
 const block=`<pre><code class="hljs language-${escape(language)}">${value}</code></pre>`;
 return language==='mermaid'? `<div class="mermaid-diagram"><div class="mermaid-output"></div>${block}</div>` : block;
}}});
const posts=[];
const postAssets=new Set();
// Posts live in content/posts/<lang>/<slug>.md. The same slug in both folders = translations of one article.
const LANGS=['en','ru'];
const files=[];for(const lang of LANGS){for(const f of (await readdir(path.join('content/posts',lang)).catch(()=>[])).filter(f=>f.endsWith('.md')).sort())files.push({lang,file:`${lang}/${f}`});}
for(const {lang,file} of files){const raw=await readFile(path.join('content/posts',file),'utf8');const {data,content}=matter(raw);if(data.draft)continue;
 const slug=data.slug||path.basename(file,'.md');if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error(`Invalid slug: ${file}`);
 for(const key of ['title','date','description','category'])if(!data[key])throw new Error(`Missing ${key}: ${file}`);
 const date=data.date instanceof Date?data.date.toISOString().slice(0,10):String(data.date);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))throw new Error(`Invalid date: ${file}`);
 const allowed=['code','reverse','tools','life'];if(!allowed.includes(data.category))throw new Error(`Unknown category: ${file}`);
 const text=content.replace(/```[\s\S]*?```/g,' ').replace(/[#*`>\[\]()]/g,' ').replace(/\s+/g,' ').trim();
 const html=marked.parse(content,{
  walkTokens(token){
   if(token.type!=='image'||!/^(?:assets\/|\.\.\/(?:ru|en)\/assets\/)/.test(token.href))return;
   const assetPath=path.posix.normalize(path.posix.join(lang,token.href));
   if(!/^(?:ru|en)\/assets\//.test(assetPath))throw new Error(`Invalid image path in ${file}: ${token.href}`);
   const relativePath=`content/posts/${assetPath}`;
   postAssets.add(relativePath);
   token.href=`./${relativePath.split('/').map(encodeURIComponent).join('/')}`;
  },
 });
 posts.push({slug,lang,file,title:String(data.title),description:String(data.description),category:data.category,date,tags:Array.isArray(data.tags)?data.tags:[],featured:Boolean(data.featured),demo:Boolean(data.demo),wip:Boolean(data.wip),art:data.art||'code',minutes:Math.max(1,Math.ceil(content.split(/\s+/).length/180)),html,text});
}
if(new Set(posts.map(p=>p.lang+'/'+p.slug)).size!==posts.length)throw new Error('Duplicate post slug');
posts.sort((a,b)=>b.date.localeCompare(a.date));await rm(out,{recursive:true,force:true});await mkdir(path.join(out,'vendor'),{recursive:true});await cp('src',out,{recursive:true});
await cp('node_modules/three/build/three.module.js',path.join(out,'vendor/three.module.js'));await cp('node_modules/three/build/three.core.js',path.join(out,'vendor/three.core.js'));await cp('node_modules/dompurify/dist/purify.es.mjs',path.join(out,'vendor/purify.es.mjs'));
await cp('node_modules/three/LICENSE',path.join(out,'vendor/THREE-LICENSE.txt'));await cp('node_modules/dompurify/LICENSE',path.join(out,'vendor/DOMPURIFY-LICENSE.txt'));
const mermaidDist='node_modules/mermaid/dist';
const mermaidOut=path.join(out,'vendor/mermaid');
await cp(path.join(mermaidDist,'mermaid.esm.min.mjs'),path.join(mermaidOut,'mermaid.esm.min.mjs'));
await cp(path.join(mermaidDist,'chunks/mermaid.esm.min'),path.join(mermaidOut,'chunks/mermaid.esm.min'),{
 recursive:true,
 filter:source=>!source.endsWith('.map'),
});
await cp('node_modules/mermaid/LICENSE',path.join(mermaidOut,'LICENSE.txt'));
for(const lang of LANGS)await mkdir(path.join(out,'content/posts',lang),{recursive:true});for(const p of posts)await cp(path.join('content/posts',p.file),path.join(out,'content/posts',p.file));
for(const asset of postAssets)await cp(asset,path.join(out,asset));
await writeFile(path.join(out,'content.json'),JSON.stringify({config,posts}));await writeFile(path.join(out,'.nojekyll'),'');
// Custom domain for GitHub Pages (e.g. gamania.me), taken from the site URL.
const host=new URL(config.url).hostname;if(!host.endsWith('github.io'))await writeFile(path.join(out,'CNAME'),host+String.fromCharCode(10));
const base=config.url.replace(/\/$/,'')+'/';
await writeSocialPages({out,base,config,posts,escape});
const feeds={en:{file:'feed.xml',description:config.description},ru:{file:'feed.ru.xml',description:config.descriptionRu||config.description}};
const catNames={en:{code:'Programming',reverse:'Reverse engineering',tools:'IT & tools',life:'Life'},ru:{code:'Программирование',reverse:'Реверс-инжиниринг',tools:'IT и инструменты',life:'Жизнь'}};
for(const [lang,f] of Object.entries(feeds)){const items=posts.filter(p=>p.lang===lang);await writeFile(path.join(out,f.file),`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${escape(config.title)}</title><link>${escape(base)}</link><description>${escape(f.description)}</description><language>${lang}</language>${items.map(p=>`<item><title>${escape(p.title)}</title><link>${escape(base+lang+'/post/'+p.slug+'/')}</link><guid>${escape(base+'#/'+lang+'/post/'+p.slug)}</guid><description>${escape(p.description)}</description><pubDate>${new Date(p.date+'T12:00:00Z').toUTCString()}</pubDate><category>${escape(catNames[lang][p.category])}</category></item>`).join('')}</channel></rss>`);}
console.log(`Built ${posts.length} Markdown posts → dist/ (base: ${base})`);
