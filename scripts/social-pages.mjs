import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { icons } from '../src/art.js';

export async function writeSocialPages({out, base, config, posts, escape}) {
  const template = await readFile(path.join(out, 'index.html'), 'utf8');
  const images = new Map();
  const imageDir = path.join(out, 'previews');
  await mkdir(imageDir, {recursive: true});

  async function cover(art) {
    const key = Object.hasOwn(icons, art) ? art : 'code';
    if (images.has(key)) return images.get(key);
    const icon = key === 'code'
      ? '<text x="50" y="62" text-anchor="middle" font-size="38" fill="currentColor">{ / }</text>'
      : icons[key].replace('<svg ', '<svg width="100" height="100" ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" font-family="DejaVu Sans, sans-serif">
      <rect width="1200" height="630" fill="#edf1e6"/>
      <rect x="48" y="48" width="1104" height="534" rx="28" fill="#2a5747"/>
      <g transform="translate(680 108) scale(4)" color="#edf1e6">${icon}</g>
      <text x="105" y="350" font-size="82" font-weight="bold" fill="#edf1e6">${escape(config.title)}</text>
    </svg>`;
    const file = 'previews/' + key + '.png';
    await writeFile(path.join(out, file), new Resvg(svg).render().asPng());
    const url = new URL(file, base).href;
    images.set(key, url);
    return url;
  }

  async function page(post) {
    const route = post ? `${post.lang}/post/${post.slug}/` : '';
    const url = new URL(route, base).href;
    const title = post?.title || config.title;
    const description = post?.description || config.description;
    const image = await cover(post?.art);
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
