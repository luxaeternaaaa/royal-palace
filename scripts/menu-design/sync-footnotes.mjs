import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MENUS } from '../../public/menu-data.mjs';
import { getMenuFooterNotes } from '../../public/menu-locales.mjs';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function syncMenuFootnotesHtml(html) {
  return html.replace(/<article class="menu-offer">([\s\S]*?)<\/article>/g, (article, contents) => {
    const id = contents.match(/\bdata-menu-id="([^"]+)"/)?.[1];
    const menu = MENUS.find(item => item.id === id);
    if (!menu) return article;
    const withoutOld = contents.replace(/<details class="content-disclosure menu-conditions">[\s\S]*?<\/details>/g, '')
      .replace(/<p class="sr-only" id="menu-notes-[^"]+" data-menu-footnotes="[^"]+">[\s\S]*?<\/p>/g, '')
      .replace(/ aria-describedby="menu-notes-[^"]+"/g, '');
    const descriptionId = `menu-notes-${id}`;
    const card = withoutOld.replace(/(<a class="menu-card"[^>]*)(>)/, `$1 aria-describedby="${escapeHtml(descriptionId)}"$2`);
    const notes = `<p class="sr-only" id="${escapeHtml(descriptionId)}" data-menu-footnotes="${escapeHtml(id)}">${escapeHtml(getMenuFooterNotes(menu, 'ru').join(' '))}</p>`;
    return `<article class="menu-offer">${card.trimEnd()}${notes}</article>`;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const indexPath = resolve(import.meta.dirname, '../../public/index.html');
  await writeFile(indexPath, syncMenuFootnotesHtml(await readFile(indexPath, 'utf8')));
}
