import {ACCESSORIES} from './forest-blobs.mjs';
// Kleine gemalte Bilder der Accessoires für Menü und Blobkarten.
const svg=body=>`<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
const ART={
 partyhat:'<path d="M32 6 50 52q-18 8-36 0z" fill="#f08aa8" stroke="#c95c80" stroke-width="2"/><path d="M26 22q6 3 12 0M21 36q11 4 22 0" stroke="#fff3c8" stroke-width="5" fill="none"/><circle cx="32" cy="7" r="6" fill="#ffe08a"/>',
 hairbow:'<path d="M32 32 8 18q-4 14 0 28zM32 32l24-14q4 14 0 28z" fill="#ef7fa0" stroke="#c95c80" stroke-width="2"/><circle cx="32" cy="32" r="7" fill="#c95c80"/>',
 tophat:'<ellipse cx="32" cy="50" rx="27" ry="7" fill="#3a3540"/><path d="M15 14h34v36H15z" fill="#3a3540"/><path d="M15 38h34v9H15z" fill="#d9536c"/>',
 beanie:'<path d="M11 44a21 25 0 0 1 42 0z" fill="#e4674f"/><rect x="8" y="42" width="48" height="11" rx="5" fill="#fff3df"/><circle cx="32" cy="14" r="8" fill="#fff3df"/>',
 wizardhat:'<ellipse cx="32" cy="52" rx="28" ry="7" fill="#5a4a9c"/><path d="M34 4 50 50H14z" fill="#5a4a9c"/><path d="m31 26 2 4 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z" fill="#ffd76a"/>',
 starfish:'<path d="m32 6 7 18 19 1-15 12 5 19-16-11-16 11 5-19L6 25l19-1z" fill="#f39a6b" stroke="#d07a4e" stroke-width="2" stroke-linejoin="round"/>',
 blossom:'<g fill="#fbe6ef" stroke="#e7bfd0" stroke-width="2"><circle cx="32" cy="14" r="11"/><circle cx="49" cy="26" r="11"/><circle cx="43" cy="46" r="11"/><circle cx="21" cy="46" r="11"/><circle cx="15" cy="26" r="11"/></g><circle cx="32" cy="32" r="9" fill="#f7c948"/>',
 snaileyes:'<g stroke="#c9b48a" stroke-width="5" stroke-linecap="round"><path d="M22 52V30M42 52V26"/></g><g><circle cx="22" cy="24" r="9" fill="#fffdf6" stroke="#8a7a5a" stroke-width="2"/><circle cx="42" cy="20" r="9" fill="#fffdf6" stroke="#8a7a5a" stroke-width="2"/><circle cx="23" cy="26" r="4.2" fill="#26222c"/><circle cx="43" cy="22" r="4.2" fill="#26222c"/></g>',
 shades:'<g fill="#26222c"><rect x="6" y="22" width="24" height="20" rx="8"/><rect x="34" y="22" width="24" height="20" rx="8"/><rect x="26" y="26" width="12" height="4"/></g><path d="M11 27l7 8" stroke="#7f7a8c" stroke-width="3"/>',
 bowtie:'<path d="M32 32 8 18v28zM32 32l24-14v28z" fill="#d9536c" stroke="#a93c52" stroke-width="2"/><rect x="26" y="25" width="12" height="14" rx="4" fill="#a93c52"/>',
 scarf:'<path d="M8 24q24 14 48 0v13q-24 14-48 0z" fill="#e4674f"/><path d="M38 38h12v20H38z" fill="#e4674f"/><path d="M38 52h12v6H38z" fill="#fff3df"/>',
 straw:'<ellipse cx="32" cy="46" rx="28" ry="9" fill="#dcc58a"/><path d="M16 44q0-26 16-26t16 26z" fill="#e6d29b"/><path d="M16 40q16 7 32 0v6q-16 6-32 0z" fill="#d9536c"/>',
 mushroom:'<path d="M6 40a26 24 0 0 1 52 0z" fill="#bd829b"/><rect x="24" y="38" width="16" height="16" rx="5" fill="#f1dfbb"/><g fill="#fff3df"><circle cx="22" cy="28" r="4"/><circle cx="38" cy="24" r="5"/></g>',
 cap:'<path d="M32 6 52 52H12z" fill="#91acb5"/><rect x="9" y="46" width="46" height="9" rx="4" fill="#dfe8ea"/>',
 crown:'<path d="M9 50 6 18l15 12 11-20 11 20 15-12-3 32z" fill="#e4bf64" stroke="#b98a22" stroke-width="2"/>',
 leaf:'<path d="M12 52Q6 16 54 10q2 44-42 42z" fill="#679451"/><path d="M12 52 44 20" stroke="#3f6b33" stroke-width="3"/>',
 flowers:'<circle cx="32" cy="32" r="20" fill="none" stroke="#7da05c" stroke-width="5"/><g fill="#e8bfab"><circle cx="32" cy="12" r="7"/><circle cx="52" cy="32" r="7"/><circle cx="32" cy="52" r="7"/><circle cx="12" cy="32" r="7"/></g>',
 branch:'<path d="M14 56 46 10M28 36l16 2M22 44 8 36" stroke="#987a51" stroke-width="5" stroke-linecap="round"/>'
};
const shapeOf=id=>ACCESSORIES[id]?.shape??id;
export function accessoryArt(id){const a=ACCESSORIES[id];if(!a)return '';const art=ART[shapeOf(id)];if(art)return svg(art);const color=a.color??'#d5ba83';return a.category==='collar'?svg(`<circle cx="32" cy="32" r="22" fill="none" stroke="${color}" stroke-width="9"/>${id==='bell'?'<circle cx="32" cy="54" r="8" fill="#e3c16a" stroke="#b98a22" stroke-width="2"/>':''}`):svg(`<circle cx="32" cy="32" r="22" fill="${color}"/>`);}
