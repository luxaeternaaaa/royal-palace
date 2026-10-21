# Royal Palace demo: image and contact sources

Checked on 20 October 2026. Venue: Royal Palace banquet hall, Astana, Chingiz Aitmatov Street, 58.

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

## Downloaded photographs

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

Cormorant Garamond (display) and Manrope (body) are self-hosted WOFF2 files fetched from Google Fonts. Their original stylesheet is preserved with local paths in `public/assets/fonts/fonts.css`; OFL license files are saved alongside the fonts. No external font requests are needed at runtime.

## Original logo and user-confirmed halls

The original 150px logo avatar comes from the [official Instagram](https://www.instagram.com/royal.palace.astana/), verified through the matching 2GIS contact and WhatsApp chain. It is used unchanged. Full evidence: `docs/logo-source.md`. The previously invented geometric RP mark and favicon have been removed.

The working-at-venue user directly confirmed three halls: **Основной зал** (largest), **орта зал** (medium), **кіші зал** (small), and confirmed that `venue-hero.jpg` shows the main hall. Other photos have not been assigned to medium or small halls. No official main-hall Kazakh name, price or equipment is inferred from these facts.

## Historical public-profile capacity evidence — 21 October 2026

The following records the earlier research as it stood before the user's latest correction above. Both the profile's main-hall figure of 500 and medium-hall figure of 140 are superseded by 550 and 144 respectively. Small-hall capacity remains unknown. The captured figures and research account below are preserved rather than rewritten.

The [official Instagram profile](https://www.instagram.com/royal.palace.astana/) publicly states up to **500 seated guests in the large hall** and **140 in the medium hall**, alongside the same Chingiz Aitmatov 58 address. The user's main/medium mapping establishes which names to use on this site. Public metadata was fetched twice without authentication; the final HTTP200 capture is saved at `output/assets-research/official-profile.txt`, fetched at 2026-10-20T19:26:54Z (21 October in Astana). The profile's edit date is unknown. The UI links to the profile and states that comfortable seating must be discussed for the event's guest count and format.

2GIS's unallocated 550-person figure and Restoran.kz's general 500-person figure were not used to infer capacity for each hall. Restoran.kz's undated average-spend range of 10,000–50,000 KZT was not treated as an up-to-date banquet package. A current menu, reliably captioned medium/small-hall photos and first-party team/service material were not available in this bounded search. Small-hall capacity remains unknown.
