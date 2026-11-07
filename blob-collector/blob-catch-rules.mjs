// Fangversuch (Jakob 31.10., Testwerte): Ab dem ersten Saugkontakt läuft die Zeit. Dauert es zu lange, ist der Blob weg, und ein neuer kommt erst am nächsten Tag.
// Jakob 7.11.: Fangen dauerte zu kurz (≈1 s). Alle Fangzeiten ×2,5 (Testwert).
export const CATCH_SLOW=2.5;
export const SIZE_CATCH=[1,1,1.35,1.8,1.8];
export const CATCH_LIMIT={moss:10,forest:10,sand:12,tide:12,snow:14,crystal:14,ash:16,lava:16,forget:7};
export const attemptLimit=b=>(CATCH_LIMIT[b.species]??10)*SIZE_CATCH[b.stage??1];
