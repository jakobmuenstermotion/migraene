// Adjustable test balance: gathered flowers currently have no crafting recipes.
export const FLOWERS={
 daisy:{name:'Gänseblümchen',color:'#fff3d5',center:'#e7bd58',value:2,count:160,regen:[100,160],petals:9,height:.32},
 dandelion:{name:'Löwenzahn',color:'#edc750',center:'#d9a33c',value:2,count:160,regen:[100,160],petals:12,height:.37},
 clover:{name:'Wiesenklee',color:'#d7a0b1',center:'#edd3d7',value:2,count:160,regen:[110,180],petals:7,height:.28},
 bluebell:{name:'Glockenblume',color:'#969bd2',center:'#deddf1',value:50,count:0,regen:[900,1200],petals:5,height:.55},
 orchid:{name:'Wilde Orchidee',color:'#df9dbb',center:'#f4dc9b',value:50,count:0,regen:[1200,1600],petals:5,height:.5}
};
export function meadowAt(x,z){return z>29&&z<58&&Math.abs(x)<31&&Math.hypot(x/36,(z-44)/19)<1;}

// Outside the main meadow: fewer, small wildflower patches.
export const FLOWER_PATCHES={meadowSize:6,rareSize:2,radius:1.05,spacing:.25,outside:{daisy:48,dandelion:48,clover:48,bluebell:3,orchid:3}};

export const FLOWER_ITEMS={commonflower:{name:'Einfache Blumen',value:2,color:'#f1d58a'},rareflower:{name:'Besondere Blumen',value:50,color:'#c0a6df'}};
export const flowerItemKind=kind=>['daisy','dandelion','clover'].includes(kind)?'commonflower':['bluebell','orchid'].includes(kind)?'rareflower':kind;
