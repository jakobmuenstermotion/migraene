// Die Neugestaltung läuft auf demselben Ursprung wie das Hauptspiel.
// Alle Schlüssel bekommen deshalb ein eigenes Präfix: Der echte Spielstand wird weder gelesen noch geschrieben.
export const STORAGE_PREFIX='blob-redesign:';
const backing=()=>globalThis.localStorage;
export const gameStorage={
 getItem:key=>backing().getItem(STORAGE_PREFIX+key),
 setItem:(key,value)=>backing().setItem(STORAGE_PREFIX+key,value),
 removeItem:key=>backing().removeItem(STORAGE_PREFIX+key)
};
