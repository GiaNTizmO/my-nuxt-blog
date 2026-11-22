import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { icons } from '../src/art.js';

export async function writeSocialPages({out, base, config, posts, escape}) {
  const template = await readFile(path.join(out, 'index.html'), 'utf8');
  const imageDir = path.join(out, 'previews');
  await mkdir(imageDir, {recursive: true});

  const svgRoot = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="DejaVu Sans, sans-serif">';
  const titleStyle = 'font-size="64" font-weight="bold"';
  function titleBlock(title) {
    const width = 804;
    const lines = [];
    let line = '';
    function measure(text) {
      const svg = `${svgRoot}<text y="80" ${titleStyle}>${escape(text)}</text></svg>`;
      return new Resvg(svg).getBBox()?.width || 0;
    }
    for (const word of title.trim().split(/\s+/)) {
      const candidate = line ? line + ' ' + word : word;
      if (line && measure(candidate) > width) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
    const leading = 78;
    const scale = Math.min(1, width / Math.max(...lines.map(measure)), 385 / (lines.length * leading));
    const baseline = 325 + scale * (23 - (lines.length - 1) * leading / 2);
    return `<g transform="translate(82 ${baseline}) scale(${scale})" ${titleStyle} fill="#f5f7ef">
      ${lines.map((text,i) => `<text y="${i * leading}">${escape(text)}</text>`).join('')}
    </g>`;
  }

  async function cover(post) {
    const key = Object.hasOwn(icons, post?.art) ? post.art : 'code';
    const icon = key === 'code'
      ? '<text x="50" y="62" text-anchor="middle" font-size="38" fill="currentColor">{ / }</text>'
      : icons[key].replace('<svg ', '<svg width="100" height="100" ');
    const brand = config.title.replace(/^./, c => c.toUpperCase());
    const svg = `${svgRoot}
      <rect width="1200" height="630" fill="#edf1e6"/>
      <rect x="24" y="24" width="1152" height="582" rx="24" fill="#2a5747"/>
      <text x="82" y="104" font-size="26" fill="#d3dfce">${escape(brand)}</text>
      ${titleBlock(post?.title || config.description)}
      <g transform="translate(906 215) scale(2)" color="#c4d9bd">${icon}</g>
    </svg>`;
    const png = new Resvg(svg).render().asPng();
    const hash = createHash('sha256').update(png).digest('hex').slice(0,12);
    const name = post ? `${post.lang}-${post.slug}` : 'home';
    const file = `previews/${name}-${hash}.png`;
    await writeFile(path.join(out, file), png);
    return new URL(file, base).href;
  }

  async function page(post) {
    const route = post ? `${post.lang}/post/${post.slug}/` : '';
    const url = new URL(route, base).href;
    const title = post?.title || config.title;
    const description = post?.description || config.description;
    const image = await cover(post);
    const fields = { 'og:type': post ? 'article' : 'website', 'og:site_name': config.title,
      'og:title': title, 'og:description': description, 'og:url': url, 'og:image': image,
      'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630',
      'og:locale': post?.lang === 'ru' ? 'ru_RU' : 'en_US', 'twitter:card': 'summary_large_image',
      'twitter:title': title, 'twitter:description': description, 'twitter:image': image };
    const tags = Object.entries(fields).map(([key,value]) =>
      `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escape(value)}">`).join('\n');
    const html = template.replace('<head>', post ? '<head>\n<base href="../../../">' : '<head>')
      .replace('<html lang="en">', `<html lang="${post?.lang || 'en'}">`)
      .replace('<body>', `<body data-route="/${route}">`)
      .replace(/<title>.*?<\/title>/, () => `<title>${escape(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${escape(description)}">\n<link rel="canonical" href="${escape(url)}">\n${tags}`);
    const dir = path.join(out, route);
    await mkdir(dir, {recursive:true});
    await writeFile(path.join(dir,'index.html'), html);
  }

  await page();
  for (const post of posts) await page(post);
}
