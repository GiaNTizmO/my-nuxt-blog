import { icons } from './art.js';
import DOMPurify from './vendor/purify.es.mjs';
import { LANGS, DEFAULT_LANG, strings, feedFile } from './i18n.js';
import { createBackground } from './background.js';

const $ = s => document.querySelector(s);
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CATEGORIES = ['code', 'reverse', 'tools', 'life'];

let data = { posts: [], config: {} };
let selected = 'all';
let cleanupScene = () => {};
let renderVersion = 0;
let diagramVersion = 0;
let diagramRender = Promise.resolve();

// ---------- language ----------
// Routes look like #/en/archive or #/ru/post/slug. A route without a language
// prefix falls back to the saved preference, then to English.
const savedLang = () => { try { return localStorage.getItem('vglub-lang'); } catch { return null; } };
let lang = LANGS.includes(savedLang()) ? savedLang() : DEFAULT_LANG;
const t = () => strings[lang];

function parseHash() {
  const route = location.hash.startsWith('#/') ? location.hash.slice(1) : document.body.dataset.route || '/';
  const parts = route.split('/').filter(Boolean);
  if (LANGS.includes(parts[0])) lang = parts.shift();
  return '/' + parts.join('/');
}
const link = (path = '/') => `./#/${lang}${path === '/' ? '' : path}`;
const langPosts = () => data.posts.filter(p => p.lang === lang);

function setLang(next) {
  try { localStorage.setItem('vglub-lang', next); } catch {}
  const path = parseHash();
  lang = next;
  const translation = data.posts.find(p => p.lang === next && path === '/post/' + p.slug);
  location.href = translation ? articleHref(translation) : link(path);
}

// ---------- small helpers ----------
const catName = c => t().categories[c] || c;
const date = s => new Date(s + 'T12:00:00').toLocaleDateString(t().locale, { day: 'numeric', month: 'short' }).replace(' г.', '').replace('.', '');
const count = c => langPosts().filter(p => p.category === c).length;
const articleHref = p => `./${p.lang}/post/${encodeURIComponent(p.slug)}/`;
const meta = p => `<div class="meta"><time datetime="${escapeHTML(p.date)}">${date(p.date)} ${p.date.slice(0, 4)}</time><span class="dot">·</span><span>${t().minRead(p.minutes)}</span></div>`;

const thumb = p => `<div class="thumb ${escapeHTML(p.art || 'code')}" aria-hidden="true">${icons[p.art] || icons.code}</div>`;

const terminalArt = () => `<div class="terminal-art" aria-hidden="true"><div class="terminal-top"><i></i><i></i><i></i><span>hello_world.asm</span></div><div class="terminal-code"><span class="dim">01</span>  <span class="comment">; minimal program</span>
<span class="dim">02</span>  <span class="hl">section</span> .text
<span class="dim">03</span>  <span class="hl">global</span> _start
<span class="dim">04</span>
<span class="dim">05</span>  _start:
<span class="dim">06</span>      <span class="hl">mov</span>  rax, 0x01
<span class="dim">07</span>      <span class="hl">call</span> explore
<span class="dim">08</span>      <span class="cursor"></span></div><div class="terminal-glow"></div></div>`;

// ---------- static shell (header, footer, search dialog) ----------
function renderShell() {
  const s = t();
  document.documentElement.lang = lang;
  $('.skip-link').textContent = s.skip;
  $('.brand').href = link('/');
  $('.brand').setAttribute('aria-label', s.home);
  const nav = { home: [s.navPosts, '/'], archive: [s.navArchive, '/archive'], about: [s.navAbout, '/about'] };
  document.querySelectorAll('[data-nav]').forEach(a => { const [label, path] = nav[a.dataset.nav]; a.textContent = label; a.href = link(path); });
  $('#open-search').setAttribute('aria-label', s.searchLabel);
  $('#open-search span').textContent = s.search;
  $('#lang-toggle').textContent = lang === 'en' ? 'RU' : 'EN';
  $('#lang-toggle').setAttribute('aria-label', s.switchLang);
  $('#lang-toggle').title = s.switchLang;
  $('#search-title').textContent = s.searchTitle;
  $('#close-search').setAttribute('aria-label', s.closeSearch);
  $('#search-input').placeholder = s.searchPlaceholder;
  $('.search-foot span').textContent = s.searchFoot;
  $('.footer-brand').href = link('/');
  $('#footer-tagline').textContent = s.footerTagline;
  $('#footer-rss').href = feedFile(lang);
  $('link[type="application/rss+xml"]').href = feedFile(lang);
  if (!data.config.repository) { $('#footer-source').href = link('/about'); $('#footer-source').innerHTML = `${s.footerAbout} <span>↗</span>`; }
  const motion = $('#motion-toggle');
  motion.dataset.pause = s.pause; motion.dataset.play = s.play;
  background?.relabel();
  themeLabel();
}

// ---------- home ----------
const filters = () => `<div class="filters" aria-label="${t().filterLabel}">${['all', ...CATEGORIES].map(c => {
  const label = c === 'all' ? t().all : (t().short[c] || catName(c));
  return `<button class="filter ${selected === c ? 'active' : ''}" data-filter="${c}" aria-pressed="${selected === c}">${label}</button>`;
}).join('')}</div>`;

const featured = p => `<a class="featured" href="${articleHref(p)}"><div class="feature-copy"><span class="pill">↗ &nbsp; ${t().featured}${p.wip ? ` · ${t().wipShort}` : ''}</span><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description)}</p>${meta(p)}</div>${terminalArt()}</a>`;
const postRow = p => `<a class="post-row" href="${articleHref(p)}"><div><div class="category">${escapeHTML(catName(p.category))}${p.wip ? ` · ${t().wipShort}` : ''}</div><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description)}</p>${meta(p)}</div>${thumb(p)}</a>`;

function sidebar() {
  const s = t();
  return `<aside class="sidebar"><div><h3 class="aside-heading">${s.topics}</h3><div class="topic-list">${CATEGORIES.map(c => `<button class="topic-button" data-filter="${c}"><span>${catName(c)}</span><span>${String(count(c)).padStart(2, '0')} ↗</span></button>`).join('')}</div></div>`
    + `<div class="aside-note"><div class="asterisk" aria-hidden="true">✳</div><h3>${s.aboutBlog}</h3><p>${s.aboutBlogText}</p><a href="${link('/about')}">${s.moreAbout} <span>↗</span></a></div>`
    + `<div class="aside-small">${s.rssNote}<a href="${feedFile(lang)}">◔ &nbsp; ${s.readRss} <span>↗</span></a></div></aside>`;
}

function hero() {
  const s = t();
  return `<section class="hero" aria-labelledby="hero-title"><div><div class="eyebrow"><span class="status-dot"></span> ${s.eyebrow}</div><h1 id="hero-title">${s.heroTitle}</h1><p>${s.heroText}</p>`
    + `<div class="hero-actions"><a class="primary-button" href="#articles" data-scroll-articles>${s.readPosts} <span>↓</span></a><a class="text-link" href="${link('/about')}">${s.navAbout} <span>↗</span></a></div></div>`
    + `</section>`
    + `<div class="section-divider"><div>${s.strip.map(x => `<span class="mini">${x}</span>`).join('')}</div></div>`;
}

function renderFeed() {
  const s = t(), all = langPosts();
  const posts = selected === 'all' ? all : all.filter(p => p.category === selected);
  const top = posts.find(x => x.featured);
  const rows = posts.filter(x => x !== top);
  $('#feed-content').innerHTML = `${top ? featured(top) : ''}${all.length && all.every(x => x.demo) ? `<p class="featured-note">${s.demoFeed}</p>` : ''}`
    + `<div class="post-list">${rows.map(postRow).join('') || (!top ? `<div class="empty">${s.emptyCategory}</div>` : '')}</div>`
    + `<div class="feed-bottom"><span>${s.inSelection(posts.length)}</span><a href="${link('/archive')}">${s.fullArchive} <span>↗</span></a></div>`;
  $('#filter-host').innerHTML = filters();
  bindFilters();
}

function bindFilters() {
  document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => {
    selected = button.dataset.filter;
    renderFeed();
    if (button.classList.contains('topic-button')) $('#articles').scrollIntoView({ behavior: 'smooth' });
  });
}

async function home(version) {
  const s = t();
  $('#main').innerHTML = `<div class="wrap">${hero()}<section id="articles" class="content-layout" aria-labelledby="articles-title"><div><div class="section-title"><h2 id="articles-title">${s.latest}<span class="count">/ ${String(langPosts().length).padStart(2, '0')}</span></h2><a class="text-link" href="${link('/archive')}">${s.allPosts} <span>↗</span></a></div><div id="filter-host"></div><div id="feed-content"></div></div>${sidebar()}</section></div>`;
  renderFeed();
  $('[data-scroll-articles]').addEventListener('click', e => { e.preventDefault(); $('#articles').scrollIntoView({ behavior: 'smooth' }); });
}

// ---------- archive / about ----------
function archive() {
  const s = t(), posts = langPosts();
  const years = [...new Set(posts.map(p => p.date.slice(0, 4)))];
  const yearBlock = y => {
    const list = posts.filter(p => p.date.startsWith(y));
    return `<h2 class="archive-year">${y} <span> / ${s.yearCount(list.length)}</span></h2>`
      + list.map(p => `<a class="archive-row" href="${articleHref(p)}"><time datetime="${p.date}">${date(p.date)}</time><h2>${escapeHTML(p.title)}</h2><span class="category">${escapeHTML(catName(p.category))}</span><span>↗</span></a>`).join('');
  };
  $('#main').innerHTML = `<div class="wrap"><section class="page-intro"><div class="eyebrow">${s.archiveEyebrow}</div><h1>${s.archiveTitle}</h1><p>${s.archiveText}</p></section><section class="archive-list">${years.map(yearBlock).join('') || `<p class="empty">${s.noPosts}</p>`}</section></div>`;
}

function about() {
  const s = t(), repo = data.config.repository;
  $('#main').innerHTML = `<div class="wrap"><section class="page-intro"><div class="eyebrow">${s.aboutEyebrow}</div><h1>${s.aboutTitle}</h1><p>${s.aboutIntro}</p></section>`
    + `<div class="about-grid"><div class="prose"><h2>${s.aboutWhy}</h2><p>${s.aboutWhyText}</p><h2>${s.aboutWhat}</h2>`
    + `<ul>${CATEGORIES.map(c => `<li><strong>${catName(c)}.</strong> ${s.aboutList[c]}</li>`).join('')}</ul>`
    + `<h2>${s.links}</h2><ul><li>GitHub: <a href="https://github.com/GiaNTizmO" target="_blank" rel="noopener noreferrer">@GiaNTizmO ↗</a></li><li>Telegram: <a href="https://t.me/NtRaiseException" target="_blank" rel="noopener noreferrer">@NtRaiseException ↗</a></li><li>RSS: <a href="${feedFile(lang)}">${s.subscribeRss} ↗</a></li></ul>`
    + `${langPosts().some(p => p.demo) ? `<div class="demo-notice">${s.demoAbout}</div>` : ''}`
    + `${repo ? `<p><a href="${escapeHTML(repo)}" target="_blank" rel="noopener noreferrer">${s.sourceGithub} ↗</a></p>` : ''}</div>`
    + `<aside class="about-art"><span class="dim">$ whoami</span><div class="large" aria-hidden="true">gamania</div><div>stack = [<br>&nbsp; 'C# / ASP.NET',<br>&nbsp; 'Vue / Nuxt',<br>&nbsp; 'Flutter / Dart',<br>&nbsp; 'C / C++',<br>&nbsp; 'MSIL / CLR',<br>&nbsp; 'Linux · OpenWrt',<br>&nbsp; 'VoIP · FFmpeg'<br>];</div></aside></div></div>`;
}

// ---------- article ----------
function article(slug) {
  let p = data.posts.find(x => x.slug === slug && x.lang === lang);
  // No translation yet: show the other language version with a short notice.
  const fallback = !p && data.posts.find(x => x.slug === slug);
  if (fallback) p = fallback;
  if (!p) { notFound(); return; }
  const s = t(), repo = data.config.repository;
  document.title = `${p.title} — ${s.siteTitle.split(' — ')[0]}`;
  document.querySelector('meta[name=description]').content = p.description;
  const mdLink = repo
    ? `<a href="${escapeHTML(repo)}/blob/${encodeURIComponent(data.config.branch || 'main')}/content/posts/${p.file.split('/').map(encodeURIComponent).join('/')}" target="_blank" rel="noopener noreferrer">${s.mdGithub} ↗</a>`
    : `<a href="./content/posts/${p.file.split('/').map(encodeURIComponent).join('/')}" download>${s.mdDownload} ↓</a>`;
  $('#main').innerHTML = `<article class="wrap" lang="${p.lang}"><div class="article-top"><a class="back-link" href="${link('/')}">${s.back}</a>`
    + `${fallback ? `<div class="demo-notice">${s.onlyOtherLang}</div>` : ''}${p.wip ? `<div class="demo-notice">${s.wip}</div>` : ''}`
    + `<div class="category">${escapeHTML(catName(p.category))}</div><h1>${escapeHTML(p.title)}</h1><p class="dek">${escapeHTML(p.description)}</p>`
    + `<div class="article-meta">${meta(p)}<div class="article-actions"><button id="copy-link">${s.copyLink} ↗</button></div></div></div>`
    + `<div class="article-layout"><div><div class="prose" id="article-body"></div>${p.demo ? `<div class="demo-notice">${s.demoPost}</div>` : ''}`
    + `<div class="article-bottom"><a href="${link('/')}">${s.back}</a>${mdLink}</div><section class="comments" id="comments" aria-label="${s.comments}"></section></div>`
    + `<nav class="toc" aria-label="${s.onPage}"><h2 class="aside-heading">${s.onPage}</h2><div id="toc-links"></div></nav></div></article>`;
  $('#article-body').innerHTML = DOMPurify.sanitize(p.html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'button'], FORBID_ATTR: ['style'] });
  enhanceArticle(p);
  renderDiagrams();
  mountComments(p);
}

function renderDiagrams() {
  const body = $('#article-body');
  const diagrams = body?.querySelectorAll('.mermaid-diagram');
  if (!diagrams?.length) return;

  const version = ++diagramVersion;
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'neutral';
  const isCurrent = () => body.isConnected && version === diagramVersion;

  // Mermaid uses shared configuration, so finish each render before switching themes.
  diagramRender = diagramRender.then(async () => {
    if (!isCurrent()) return;
    const { default: mermaid } = await import('./vendor/mermaid/mermaid.esm.min.mjs');
    if (!isCurrent()) return;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      theme,
      htmlLabels: false,
      fontFamily: 'Golos Text, sans-serif',
      flowchart: { wrappingWidth: 190, rankSpacing: 28, nodeSpacing: 18, padding: 10 },
    });

    for (const [index, diagram] of diagrams.entries()) {
      if (!isCurrent()) return;
      const source = diagram.querySelector('pre');
      const output = diagram.querySelector('.mermaid-output');
      try {
        const { svg } = await mermaid.render(`mermaid-${version}-${index}`, source.querySelector('code').textContent);
        if (!isCurrent()) return;
        output.innerHTML = svg;
        source.hidden = true;
      } catch (error) {
        console.warn('Could not render a Mermaid diagram.', error);
      }
    }
  }).catch(error => console.warn('Could not load Mermaid.', error));
}

// ---------- comments (Giscus, backed by GitHub Discussions) ----------
const giscusTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark_dimmed' : 'light';
function mountComments(p) {
  const g = data.config.giscus;
  if (!g?.repoId || !g?.categoryId) return;   // not configured yet: no comments block
  const s = t(), host = $('#comments');
  host.innerHTML = `<h2 class="aside-heading">${s.comments}</h2>`;
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  // One discussion per article per language, e.g. "en/protecting-dotnet".
  Object.entries({
    repo: g.repo, 'repo-id': g.repoId, category: g.category, 'category-id': g.categoryId,
    mapping: 'specific', term: `${p.lang}/${p.slug}`, strict: '1', 'reactions-enabled': '1',
    'emit-metadata': '0', 'input-position': 'top', theme: giscusTheme(), lang: lang, loading: 'lazy',
  }).forEach(([k, v]) => script.setAttribute(`data-${k}`, v));
  host.append(script);
}
function syncGiscusTheme() {
  const frame = document.querySelector('iframe.giscus-frame');
  frame?.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app');
}

// Table of contents, external links and copy buttons for the rendered Markdown.
function enhanceArticle(p) {
  const s = t(), body = $('#article-body');
  const headings = [...body.querySelectorAll('h2,h3')];
  headings.forEach((h, i) => h.id = `section-${i + 1}`);
  $('#toc-links').innerHTML = headings.map(h => `<a href="#${h.id}" data-heading="${h.id}">${escapeHTML(h.textContent)}</a>`).join('');
  document.querySelectorAll('[data-heading]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); document.getElementById(a.dataset.heading).scrollIntoView({ behavior: 'smooth' }); }));
  body.querySelectorAll('a').forEach(a => { if (a.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } });
  body.querySelectorAll('pre').forEach(pre => {
    const b = document.createElement('button');
    b.className = 'code-copy'; b.textContent = s.copy; b.setAttribute('aria-label', s.copyCode);
    b.onclick = () => copy(pre.querySelector('code')?.textContent || '');
    pre.append(b);
  });
  $('#copy-link').onclick = () => copy(new URL(articleHref(p), document.baseURI).href);
}

function notFound() {
  const s = t();
  $('#main').innerHTML = `<div class="wrap error"><div class="eyebrow">${s.notFoundEyebrow}</div><h1>${s.notFoundTitle}</h1><p>${s.notFoundText}</p><a class="primary-button" href="${link('/')}">${s.backToPosts}</a></div>`;
}

// ---------- router ----------
function route() {
  cleanupScene(); cleanupScene = () => {};
  const version = ++renderVersion;
  const path = parseHash();
  if (location.hash.startsWith('#/') && path.startsWith('/post/')) {
    const post = langPosts().find(p => path === '/post/' + p.slug);
    if (post) { location.replace(articleHref(post)); return; }
  }
  renderShell();
  background?.setDim(path.startsWith('/post/') ? 0.35 : 1);
  document.title = t().siteTitle;
  document.querySelector('meta[name=description]').content = t().siteDescription;
  const section = path === '/archive' ? 'archive' : path === '/about' ? 'about' : 'home';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === section));
  if (path === '/') home(version);
  else if (path === '/archive') archive();
  else if (path === '/about') about();
  else if (path.startsWith('/post/')) { try { article(decodeURIComponent(path.slice(6))); } catch { notFound(); } }
  else notFound();
  window.scrollTo(0, 0);
  $('#reading-progress').style.width = '0%';
  if ($('#search-dialog').open) $('#search-dialog').close();
}

// ---------- copy / toast ----------
async function copy(text) {
  try { await navigator.clipboard.writeText(text); notify(t().copied); }
  catch { notify(t().copyFailed); }
}
let toastTimer;
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
}

// ---------- search (current language only) ----------
function search() {
  const s = t(), q = $('#search-input').value.trim().toLocaleLowerCase(s.locale);
  const matches = langPosts().filter(p => !q || `${p.title} ${p.description} ${catName(p.category)} ${p.tags.join(' ')} ${p.text}`.toLocaleLowerCase(s.locale).includes(q));
  $('#search-results').innerHTML = matches.length
    ? matches.map(p => `<a class="search-result" href="${articleHref(p)}"><span>${escapeHTML(catName(p.category))} / ${date(p.date)}</span><strong>${escapeHTML(p.title)}</strong></a>`).join('')
    : `<div class="empty"><h3>${s.nothingFound}</h3><p>${s.nothingFoundHint}</p></div>`;
  document.querySelectorAll('.search-result').forEach(a => a.onclick = () => $('#search-dialog').close());
}
function openSearch() { search(); $('#search-dialog').showModal(); $('#search-input').focus(); }

// ---------- theme ----------
function themeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('#theme-toggle').setAttribute('aria-label', dark ? t().themeLight : t().themeDark);
  $('#theme-toggle').setAttribute('aria-pressed', String(dark));
}

// ---------- wiring ----------
// The animated background lives for the whole session, independent of routes.
let background = null;
try { background = createBackground($('#motion-toggle')); } catch { $('#motion-toggle').hidden = true; }
if (!background) $('#motion-toggle').hidden = true;

$('.skip-link').onclick = e => { e.preventDefault(); $('#main').focus(); $('#main').scrollIntoView(); };
$('#open-search').onclick = openSearch;
$('#close-search').onclick = () => $('#search-dialog').close();
$('#search-input').addEventListener('input', search);
$('#search-dialog').addEventListener('click', e => {
  if (e.target !== $('#search-dialog')) return;
  const r = e.target.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close();
});
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search-dialog').open ? $('#search-dialog').close() : openSearch(); }
});
$('#lang-toggle').onclick = () => setLang(lang === 'en' ? 'ru' : 'en');
$('#theme-toggle').onclick = () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  try { localStorage.setItem('vglub-theme', dark ? 'dark' : 'light'); } catch {}
  themeLabel();
  document.dispatchEvent(new Event('themechange'));
  syncGiscusTheme();
  renderDiagrams();
};
window.addEventListener('hashchange', route);
window.addEventListener('scroll', () => {
  if (!document.querySelector('#article-body')) return;
  const available = document.documentElement.scrollHeight - innerHeight;
  $('#reading-progress').style.width = `${available > 0 ? Math.min(100, scrollY / available * 100) : 100}%`;
}, { passive: true });

try {
  const response = await fetch('./content.json');
  if (!response.ok) throw new Error('content');
  data = await response.json();
  if (data.config.repository) {
    const a = $('#footer-source');
    a.href = data.config.repository; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.innerHTML = 'GitHub <span>↗</span>';
  }
  route();
} catch {
  renderShell();
  const s = t();
  $('#main').innerHTML = `<div class="error wrap"><h1>${s.loadFailed}</h1><p>${s.loadFailedText}</p><button class="primary-button" id="retry">${s.retry}</button></div>`;
  $('#retry').onclick = () => location.reload();
}
