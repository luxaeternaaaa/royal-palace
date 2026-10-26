import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const modules=process.argv[2];
if(!modules)throw new Error('Pass the tooling node_modules directory containing sharp.');
const {default:sharp}=await import(pathToFileURL(resolve(modules,'sharp/dist/index.mjs')));
const assets=resolve(import.meta.dirname,'../../public/assets');
const source=resolve(assets,'venue-hero-restored-2k.webp');
const metadata=await sharp(source).metadata();
assert.equal(metadata.width,2560);assert.equal(metadata.height,1704);
// Preserve the existing 60% horizontal focal point while removing unseen side pixels.
for(const width of [800,1600])for(const format of ['avif','webp']) {
 const image=sharp(source).extract({left:576,top:0,width:1600,height:1704}).resize({width});
 await image[format]({quality:format==='avif'?58:84,effort:6}).toFile(resolve(assets,`hero-mobile-${width}.${format}`));
}
await sharp(resolve(assets,'royal-palace-menu-logo-original.png')).resize(162,162)
 .webp({lossless:true,effort:6}).toFile(resolve(assets,'menu-crest.webp'));
