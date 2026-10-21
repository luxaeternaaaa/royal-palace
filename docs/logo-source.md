# Original Royal Palace Astana logo

## Current file

`public/assets/royal-palace-logo-original.jpg` is the unchanged **150 × 150** avatar from the official [Instagram @royal.palace.astana](https://www.instagram.com/royal.palace.astana/). It shows the original white crown, laurel, RP initials and ROYAL PALACE text on dark green.

The file was obtained by independent public-source research and delivered locally as `C:/Users/foxal.DESKTOP-N1GCIEU/AppData/Local/Temp/royal-palace-brand-research/instagram-official-avatar-150.jpg`. It was opened and visually inspected before being copied unchanged into the project. An earlier independently retrieved 100px version showed the same original mark; the 150px file is used for better source density.

## Verification chain

The [2GIS card 70000001081186323](https://2gis.kz/astana/firm/70000001081186323/tab/info), Royal Palace at Chingiz Aitmatov 58, Astana, links to this Instagram profile alongside telephone +77715790555. The profile metadata identifies the Astana banquet venue, and the independently checked profile WhatsApp matches this contact.

The 2GIS card also has an authentic alternate avatar at [its CDN](https://ams2-cdn.2gis.com/previews/1208100815596683264/e6e8c5e6-51d1-4ede-b45a-9eb340961e5b/1/ru/image_128x128.png?api-version=2.0): a different white/gold composition. The current Instagram version was chosen consistently for header/favicon.

## Use and limitations

The original JPG is displayed as a compact header mark and used directly as the favicon. The source file has not been generated, traced, reconstructed, recolored, cropped or edited to remove its background. The invented geometric RP SVG was removed from `public/` and `dist/`. Generated replacement candidates were rejected because they changed the mark's geometry; none is used as the venue's logo.

For header rendering, CSS applies the SVG filter `brand-background-removal`. At the user’s later milk/gold request, its output RGB matches readable antique gold (#7a531e), and its alpha is derived from the original image's red channel: the dark green source background becomes transparent while the crown, laurel, RP initials and lettering remain visible as an antique-gold mark on the milk header. This operates on the displayed image, not on the JPG file, and does not lower the opacity of the entire mark. The favicon continues to use the unchanged JPG directly.

The current rendering was visually verified in Chrome at desktop and mobile widths and independently reviewed on 320px and 390px screens: the green square is absent and the original artwork remains visible on the light header; the later milk/gold pass changes only the filter’s output color. Screenshots: output/playwright/uiux-desktop-hero.png and uiux-mobile-hero.png.

No public vector/high-resolution brand artwork was obtained. Request the original asset from the venue for large or print use. Public accessibility does not itself establish a republication license; this remains a local demo for the venue.
