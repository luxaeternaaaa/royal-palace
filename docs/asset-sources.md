## Редактура меню · 22 октября 2026

Актуализация22октября2026: по последней просьбе пользователя все сгенерированные фотографии блюд убраны из сайта и сборки. Их прежняя атрибуция ниже — история; файлы сохранены только в игнорируемом output/menu-return/removed-food-*. Карточки показывают типографские листы из подтверждённых меню.

Все девять листов заново экспортированы после сокращения повторов. Блюда и значимые ингредиенты сохранены, услуги и контакты не дублируются внутри изображения. Источники name/ingredients отделены от кратких label/detail в scripts/menu-design/menus.mjs. Это нативный набор текста Forum/Golos в Chrome, без генерации букв и без новых фото. Ширина файлов прежняя: 2400 px, превью 800 px, мобильный лист 640 px. Суммы размеров файлов: полные — 1033774 байт, превью — 672720, мобильные — 768360. Карточки по-прежнему используют отдельные фотографии блюд; меню загружается при открытии. Точные размеры — output/menu-premium/rendered/manifest.json.

## Фото блюд на карточках · 22 октября 2026

Четыре изображения созданы встроенным imagegen по прямому запросу пользователя. Это иллюстрации блюд из присланных меню, а не фотографии настоящей подачи Royal Palace. На странице есть видимая подпись об их генерации на RU/KK/EN. Изображения не содержат людей, логотипов или надписей.

Судак с овощной капонатой и соусом из цукини используется для основного меню за 30 000 ₸ и среднего/малого за 27 000 ₸. Лосось на пюре из сельдерея с икорным соусом — для основного за 35 000 ₸ и среднего/малого за 32 000 ₸. Палтус с муссом из цветной капусты, шпинатом и сливочно-шафрановым соусом — для основного за 40 000 ₸ и малого за 38 000 ₸. Самса с мясом — для ас беру. Одинаковый состав в разных залах использует один файл.

Файлы public/assets/food/{dish}.webp имеют размер 1536×1024, варианты {dish}-768.webp — 768×512. Выполнены только пропорциональное уменьшение и кодирование WebP quality 88; семантическая ретушь и кадрирование не применялись. Малые файлы весят от 54 274 до 63 542 байт. Все восемь файлов вместе — 893,470 байт. Блюда, цены и условия в полных меню не изменялись.

| Блюдо / имя ресурса | Исходный PNG imagegen | Полный WebP, байт |
| --- | --- | ---: |
| pike-perch | exec-ba705170-6c22-49ad-8da6-10a949309754.png | 176,518 |
| salmon | exec-01f26bb1-b700-4d4b-9a33-fba4735aa64c.png | 155,914 |
| halibut | exec-0720f60a-6d39-451e-9e5e-54a0edcfa47b.png | 147,934 |
| samsa | exec-44495b7b-40d8-4019-9252-72798391cbf0.png | 180,072 |

Проверка арт-директора: естественные фактуры, правдоподобные порции, без явных дефектов еды и лишнего реквизита. По готовому филе нельзя достоверно определить вид рыбы; фотографии остаются обозначенными иллюстрациями. Сохранена родная пропорция 3:2, чтобы не обрезать края тарелок. Оригиналы imagegen сохранены; manifest с SHA-256 и размерами — output/food-generation/manifest.json.

## Перевёрстанные меню · 22 октября 2026

Все девять меню заново набраны по видимым оригиналам пользователя. Источники, цены и расхождения — в docs/menu-sources.md. scripts/menu-design/menus.mjs и sheet.css дают 2400 px двухколоночные листы, 800 px превью и 640 px мобильные листы в одну колонку. Рендер: локальный Chrome, Forum/Golos, WebP; генерация букв, блюд и декоративных рамок не используется. Полные изображения вместе 1 429 548 байт, превью — 940 458, мобильные — 1 056 818. Карточки выбирают превью или полное изображение по плотности экрана; скрытый просмотрщик ничего не загружает. Мобильный лист загружается при открытии на узком экране.

Настоящий знак Royal Palace извлечён без перерисовки из встроенного изображения X6.jp2 файла «30.000 .pdf»: 1563×1563 RGBA. Копия public/assets/royal-palace-menu-logo-original.png сохраняет исходные пиксели/прозрачность. При вёрстке используется только монохромный золотой фильтр по исходной альфе. Логотип в шапке сайта не менялся. Эскиз Imagegen с декоративной рамкой отклонён по уточнению пользователя и на сайте не используется. Исходные PDF в Downloads не изменены, публичных PDF нет.

# Royal Palace demo: image and contact sources

## Current hero: user's selected restored image — 21 October 2026

The user attached the previously shown brighter/sharper candidate and explicitly asked for that exact image as the main-page background. The earlier site had retained the ordinary source-faithful upscale; this was a different image-processing choice, not a reproduced cache failure. The user's latest selection supersedes the earlier candidate rejection below.

`public/assets/venue-hero-restored-2k.webp` is a byte-for-byte copy of the previously generated `output/hero-refine/venue-hero-enhanced-2k.webp`:2560×1704,782958bytes, SHA256 `c5d3a365c3ced27d3226ad70138851487284647ab68b367525b1b9299070446a`. It is based on the genuine Royal Palace main-hall photograph, processed earlier with built-in Imagegen and proportionally packaged for delivery. The mobile derivative `venue-hero-restored-1280.webp` is1280×852,284546bytes. No new generation, retouch or source search was performed in this replacement pass. The full selected image was inspected again; no people were observed.

This is an **AI-restored/upscaled photograph**, not a new high-resolution original. Fine decorations and lettering were reconstructed and differ from the source. Hero, main-hall thumbnail and responsive preload use the same new filenames/srcset, making the selected delivery explicit. The untouched1440×960 `venue-hero.jpg` and all gallery/no-JS original links remain available. Other venue photographs remain ordinary derivatives of genuine originals.

## Previous hero delivery — superseded by the user's image selection

The user requested a smaller, non-sticky header and a clearer, slightly leveled2K hero. The exact original CDN was fetched again:1440×960,542934 bytes, SHA256 `1d64c3b99a79b327cfefa0f66d02514ffee6ca852a3edf862a76c591bf19df3d`. It is byte-identical to `public/assets/venue-hero.jpg`. The historical2500×1667 metadata did not provide an accessible larger original in the bounded check.

The shipped derivatives are based entirely on that unchanged source. Processing:0.6° clockwise rotation; centered1416×944 crop from the1450×975 rotated buffer (left17/top15) to avoid empty corners; Lanczos3 resampling; gentle sharpening (sigma0.5,m1=0.4,m2=1); WebP quality90. The2GIS watermark, screen lettering, furniture and real architecture remain visible; no people or objects were generated or removed.

| Current resource | Pixels | Bytes |
| --- | --- | --- |
| `public/assets/venue-hero-2k.webp` |2560×1707|518130|
| `public/assets/venue-hero-1280.webp` |1280×853|249268|

The hero and main-hall card share matching native srcset/sizes, with a matching responsive preload. The mobile1000px slot reflects the width required by the tall hero’s cover crop; ordinary mobile screens select the lighter variant, while wide/high-density screens select2K. These are upscales/delivery derivatives, not a newly obtained optical2K photograph. The gallery and no-JS photo link still open the unchangedJPEG original. Older delivery numbers below describe the previous1440px WebP.

A built-in Imagegen trial requested conservative high-resolution restoration and subtle leveling, with the exact original as its only reference and with architecture, furniture, lettering and watermark preserved. It produced a1537×1023 candidate whose LED lettering and fine decoration were redrawn. The candidate was rejected after independent comparison and is retained only in ignored research output. **No generative pixels are used in the shipped site.** Exact source checks, processing settings and the candidate decision are recorded in `output/hero-refine/source-check-manifest.json`, `final-photo-manifest.json` and `candidate-1-review.md`.


Checked on 20 October 2026. Venue: Royal Palace banquet hall, Astana, Chingiz Aitmatov Street, 58.

## Latest selection constraint — no people

The user explicitly requires photographs without people, including background people, partial bodies and reflections. On 21 October 2026 the five currently shipped originals (`venue-hero.jpg`, `venue-celebration.jpg`, `venue-hall.jpg`, `venue-room.jpg`, `venue-exterior.jpg`) were opened in full and visually inspected; no people were observed. Selection checks the complete JPEG, not just the CSS crop. Do not use generative removal to make an otherwise unsuitable event photograph pass this constraint.

A further bounded search examined the official Instagram's first 12 publications and exact-venue map material. No additional photograph met the full selection bar. The official [small-hall reel](https://www.instagram.com/royal.palace.astana/reel/DY4s1aotoHm/) cover has no observed people but contains a large subtitle and blurred foreground; it is rejected as a website photo. The [medium-hall reel](https://www.instagram.com/royal.palace.astana/reel/DYy1C6MNcdY/) cover includes people and subtitles, so it is rejected. Two additional exact-venue map photos also show people and are not copied to `public/`. These research candidates remain only under ignored `output/assets-research/2026-10-21-extra/`, with exact observed source links and decisions in the manifests.

The small-hall reel publicly mentions 60 guests. This is source evidence to confirm with the team, not a change to the current unconfirmed small-hall capacity. The medium reel's 140 does not override the user's latest 144. The two smaller halls still require approved identifiable photographs without people. Current delivered photographs are genuine owner originals with local delivery derivatives; no generated scene, person removal or replacement from another venue is used.

The alternate white/gold 128px 2GIS emblem was retained only as a reference: its geometry differs from the current Instagram logo. No larger matching current logo was obtained. The header continues to render the original artwork through the existing filter, in the user's new antique-gold accent. The favicon remains the authentic unchanged source JPG.

## Latest capacity correction — 21 October 2026

The user, who works at Royal Palace, clarified that **144 seats refers to the medium/орта hall, not the small/кіші hall**. The current confirmed figures are **550 seats in the main hall** and **144 in the medium hall**. The small hall's capacity remains unconfirmed. This latest correction supersedes both the user's earlier mistaken assignment of 144 to the small hall and the older public-profile figures of 500/main and 140/medium.

| Hall used on the site | Current capacity | Source of the current figure |
| --- | --- | --- |
| Основной зал / main | 550 seats | Direct confirmation from the working-at-venue user, 21 October 2026 |
| Орта зал / medium | 144 seats | Latest correction from the working-at-venue user, 21 October 2026 |
| Кіші зал / small | Unconfirmed; on request | No current confirmed figure; the user corrected the earlier assignment of 144 |

Use this mapping in the current site and copy. Do not restore 500/main, 140/medium or 144/small from older notes. Show small-hall capacity as available on request. Seating arrangements for a particular event still need discussion with the administrator. The original profile capture at `output/assets-research/official-profile.txt` and dated historical reports are retained unchanged.

## Historical initial capacity assignment — superseded on 21 October 2026

Before the user's explicit correction, the initial update recorded main 550, medium 140 and small 144. The user then explained that 144 belongs to the medium hall. The earlier small-hall assignment was a misstatement, not an independently verified capacity; it is retained here only to explain the correction and must not be used as the current mapping.

## Contact destination

- Public WhatsApp destination: **https://wa.me/77715790555**.
- Display telephone: **+7 (771) 579-05-55**; telephone URI: `tel:+77715790555`.
- The [2GIS information page](https://2gis.kz/astana/firm/70000001081186323/tab/info) exposes a “Переход в WhatsApp” link. Its tracking URL encodes the destination `http://api.whatsapp.com/send/?phone=77715790555` and a 2GIS greeting. The tracking redirect itself returned 404 to the research fetch; the destination number is visible in the actual href.
- Independently, the [Restoran.kz venue listing](https://astana.restoran.kz/banquet/98605-royal-palace) links directly to `https://wa.me/77715790555?text=...` in its WhatsApp contact action. Its prefilled message identifies Restoran.kz, so this demo uses the same destination without that source-specific text.
- No message was sent and no call was placed.

## Current photo/video curation — 21 October 2026

The user's exact [2GIS gallery](https://2gis.kz/astana/gallery/firm/70000001081186323/photoId/adsImage) was opened in the in-app browser. It lists 228 materials, including 28 videos; the owner album contains 6 photos and 1 video. The isolated browser received a CAPTCHA; the regular in-app session opened normally. No CAPTCHA was bypassed. The bounded selection compared the owner album and one guest alternative; it did not claim to watch all 28 videos.

**New selected image:** `public/assets/venue-room.jpg`, **1440×2160**,941204 bytes, photo ID **30258560211255314**, label“Фотография от владельца”, dated 13 December 2024. [Source photo page](https://2gis.kz/astana/gallery/firm/70000001081186323/photoId/30258560211255314); [observed CDN original](https://i0.photo.2gis.com/photo-gallery/def4a401-5d9b-43c8-80a8-4b04d8282af6.jpg). It shows a round table, white/gold chairs and the architectural interior without people. It replaces the repetitive close floral view `venue-detail.jpg` (old photo ID 30258560319715456), which is no longer shipped in `public/`. The previous image remains in Git history and the local research evidence.

The current hero, decorated-table portrait, stage view and façade remain genuine owner images from the initial table below. The hero is still the user's confirmed main hall. Stage captions now say“Сцена и оформление”; the new photograph says“Интерьер и рассадка”. Neither new nor existing unlabelled-room photographs are assigned to орта/кіші. A guest aisle view (photo30258560242324782) was inspected but rejected for the site because it is darker, lower-resolution and includes a foreground head.

**Video:** [owner's 14-second video in 2GIS](https://2gis.kz/astana/gallery/firm/70000001081186323/photoId/30258560336546977), label“Видео от владельца”, dated 6 September 2026, 608×1080. The observed player uses DASH/MediaSource rather than a stable standalone MP4. The site offers an ordinary explicit link to that exact material. No video is downloaded, embedded, preloaded or played by the page.

**Delivery derivatives:** originals remain unchanged JPEGs for explicit gallery viewing. The five page-image resources are encoded from those originals as WebP at quality 84, without crop, retouch, sharpening, generative fill or an invented interior. Aspect ratios and the original watermarks remain in the files. CSS card cropping is separate from the complete original viewer.

| Page resource | Pixels | Bytes |
| --- | --- | --- |
| `venue-hero.webp` |1440×960|248516|
| `venue-celebration-preview.webp` |960×640|133714|
| `venue-hall-preview.webp` |720×1080|83148|
| `venue-room-preview.webp` |720×1080|112594|
| `venue-exterior-preview.webp` |960×640|101238|

The five default page photographs total **679210 bytes**, compared with **3220478 bytes** for the five prior JPEG page resources (**78.9% less**). This is a resource-size comparison, not a claim of an equivalent improvement to every user's load time. Full JPEGs are fetched only by explicit gallery/image viewing. The hero derivative is reused by its hall card. No new runtime dependency or external image/font request is introduced. Image generation/upscaling was unnecessary because a suitable genuine owner photograph was available.

Evidence: `output/assets-research/2026-10-21-media/selected-photos.json`, `owner-video.json`, `optimized-manifest.json`, source downloads and browser captures. Rights/permission limits below still apply to a future public release.

## Initial downloaded photographs (historical selection)

All five files are actual photographs from this venue’s [2GIS gallery](https://2gis.kz/astana/gallery/firm/70000001081186323). Each selected image is labeled **“Фотография от владельца”** in the gallery data. The owner album was loaded in the real browser; its media response tied each image ID and CDN URL to object `70000001081186323`. The 2GIS watermark is retained.

| Local file | Subject | Delivered pixels | 2GIS photo ID | Exact image URL |
| --- | --- | --- | --- | --- |
| `public/assets/venue-hero.jpg` | Wide view along the banquet hall, tables, chandeliers and central floor | 1440 × 960 | 30258560336546697 | https://i2.photo.2gis.com/photo-gallery/b30c4454-1df0-4fcf-a285-6226e5cd069b.jpg |
| `public/assets/venue-hall.jpg` | Portrait view of cream and gold banquet tables and floral wedding décor | 1440 × 2159 | 30258560319715458 | https://i6.photo.2gis.com/photo-gallery/da6b19f4-2ef4-4b73-aba3-cc0afb777361.jpg |
| `public/assets/venue-detail.jpg` | Portrait view of set banquet table, flowers and hall lighting | 1440 × 2159 | 30258560319715456 | https://i7.photo.2gis.com/photo-gallery/f35718bd-4881-4ce6-a3e0-6048a9fcd548.jpg |
| `public/assets/venue-celebration.jpg` | Frontal view of decorated stage and central floor | 1440 × 960 | 30258560319715459 | https://i9.photo.2gis.com/photo-gallery/dca509c5-5594-468b-9d86-e561690ccbca.jpg |
| `public/assets/venue-exterior.jpg` | Venue’s cream classical façade with Royal Palace sign | 1440 × 960 | 30258560211254754 | https://i3.photo.2gis.com/photo-gallery/eae7a21a-f857-4e85-a055-02c0232ff85a.jpg |

The source metadata reports larger originals (2500 × 1667 for the two hall landscapes, 1667 × 2500 for the two portraits, 3000 × 2000 for the exterior); the public CDN delivered the dimensions listed above. Each downloaded file was opened and visually inspected. No interior was generated or substituted from another venue.

## Demo usage

Public accessibility does not establish permission to republish. These are local demo materials; obtain venue/photographer approval and confirm applicable source terms before public publication. Event décor in the photographs illustrates past setups and does not promise that an identical setup is included in a booking. Replace files with approved originals when available.

The generic table image returned as the Restoran.kz listing’s main photograph was not used: its venue specificity was unclear.

## Interface icons

The WhatsApp glyph in the inline SVG sprite is the filled 24px vector from [Simple Icons](https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg), checked on 21 October 2026. The collection is distributed under [CC0](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md). Its path is kept intact; explicit fill and no stroke prevent the site's outline-icon style from distorting the brand mark. Other interface symbols remain local SVG paths.

## Fonts

Current families: **Forum 400** for display and **Golos Text 400–700** for reading and controls, installed on 21 October 2026 at the user's request. Forum is the main headline family in [Le Dome's current stylesheet](https://static.tildacdn.pro/ws/project6141581/tilda-blocks-page35449568.min.css?t=1791890748); Lora is present there for popup/quiz headings, not its main headline role. This corrects the earlier incomplete reference notes.

The eight unchanged WOFF2 subsets (Cyrillic-ext, Cyrillic, Latin-ext, Latin for each family) come from the [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Forum&family=Golos+Text:wght@400..700&display=swap), with download URLs under `fonts.gstatic.com`. They total 172,620 bytes. The stylesheet uses only local paths in `public/assets/fonts/fonts.css`; no external font requests are required at runtime. Critical Cyrillic files are preloaded. Original licenses from the official Google Fonts repository are saved as `forum-OFL.txt` and `golos-text-OFL.txt` alongside the files: [Forum source and OFL](https://github.com/google/fonts/tree/main/ofl/forum), [Golos Text source and OFL](https://github.com/google/fonts/tree/main/ofl/golostext). The original stylesheet, upstream listings and download hashes are retained in `output/fonts-research/`.

Both official source TTF files were inspected with fontTools: no missing characters in the Russian/Latin samples or `ӘәҒғҚқҢңӨөҰұҮүҺһІі`. The actual rendered WOFF2 checks and limits are recorded in `docs/verification.md`. Earlier Cormorant Garamond/Manrope files were removed from the current build; they remain recoverable in Git history. The typography work does not alter the authentic logo artwork or photographic source pixels.

## Original logo and user-confirmed halls

The original 150px logo avatar comes from the [official Instagram](https://www.instagram.com/royal.palace.astana/), verified through the matching 2GIS contact and WhatsApp chain. It is used unchanged. Full evidence: `docs/logo-source.md`. The previously invented geometric RP mark and favicon have been removed.

The working-at-venue user directly confirmed three halls: **Основной зал** (largest), **орта зал** (medium), **кіші зал** (small), and confirmed that `venue-hero.jpg` shows the main hall. Other photos have not been assigned to medium or small halls. No official main-hall Kazakh name, price or equipment is inferred from these facts.

## Historical public-profile capacity evidence — 21 October 2026

The following records the earlier research as it stood before the user's latest correction above. Both the profile's main-hall figure of 500 and medium-hall figure of 140 are superseded by 550 and 144 respectively. Small-hall capacity remains unknown. The captured figures and research account below are preserved rather than rewritten.

The [official Instagram profile](https://www.instagram.com/royal.palace.astana/) publicly states up to **500 seated guests in the large hall** and **140 in the medium hall**, alongside the same Chingiz Aitmatov 58 address. The user's main/medium mapping establishes which names to use on this site. Public metadata was fetched twice without authentication; the final HTTP200 capture is saved at `output/assets-research/official-profile.txt`, fetched at 2026-10-20T19:26:54Z (21 October in Astana). The profile's edit date is unknown. The UI links to the profile and states that comfortable seating must be discussed for the event's guest count and format.

2GIS's unallocated 550-person figure and Restoran.kz's general 500-person figure were not used to infer capacity for each hall. Restoran.kz's undated average-spend range of 10,000–50,000 KZT was not treated as an up-to-date banquet package. A current menu, reliably captioned medium/small-hall photos and first-party team/service material were not available in this bounded search. Small-hall capacity remains unknown.
