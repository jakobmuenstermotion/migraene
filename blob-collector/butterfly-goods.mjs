import {BUTTERFLIES} from './butterflies.mjs';
import {PRODUCT_NAMES} from './material-press.mjs';
// Jakob 6.11.: Gefangene Schmetterlinge sind Waren im Saugtank (Schlüssel bf_<id>): verkaufen (Geld erst beim Verkauf), als Fischköder
// werfen (seltene locken seltene Fische an), als Blobköder verwenden oder in die Vitrine stellen. Namen hier registrieren.
for(const [id,a]of Object.entries(BUTTERFLIES))PRODUCT_NAMES['bf_'+id]=a.name;
export const isButterflyItem=k=>typeof k==='string'&&k.startsWith('bf_')&&Boolean(BUTTERFLIES[k.slice(3)]);
export const butterflyOf=k=>BUTTERFLIES[k.slice(3)];
