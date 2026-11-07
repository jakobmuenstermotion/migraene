// Blob-Freundschaft (Jakob 31.10., Testwerte): Streicheln füllt bis zu fünf Herzen. Herzen machen den Blob flinker und bringen morgens Geschenke.
export const FRIEND_RULES={steps:[8,20,38,62,100],max:100,perDay:5,cooldown:4,speedPerHeart:.03,pickPerHeart:.05,giftChance:.15};
const GIFTS={wald:['wood','moss','mushroom','stone'],kueste:['shell','seagrass','sand'],berg:['frostwood','frostmoss','frostflower'],vulkan:['clay','cactusfibre','coloredearth'],spezial:['rope','board','paper']};
export const blobHearts=b=>FRIEND_RULES.steps.filter(n=>(b.friend??0)>=n).length;
export const friendSpeed=b=>1+blobHearts(b)*FRIEND_RULES.speedPerHeart;
export const friendPick=b=>1-blobHearts(b)*FRIEND_RULES.pickPerHeart;
export function petBlob(s,b){b.petUntil=s.time+2.4;b.emoteUntil=0;const day=s.round?.day??1;if(b.petDay!==day){b.petDay=day;b.petsToday=0;}if(s.time<(b.petNext??0)||b.petsToday>=FRIEND_RULES.perDay)return false;b.petNext=s.time+FRIEND_RULES.cooldown;b.petsToday++;const before=blobHearts(b);b.friend=Math.min(FRIEND_RULES.max,(b.friend??0)+1);if(blobHearts(b)>before)s.events?.push('caught');return true;}
export function morningGifts(s,group,title){const f=s.forestBlobs,out=[];if(!f)return out;for(const b of f.roster){const h=blobHearts(b);if(h<1||Math.random()>h*FRIEND_RULES.giftChance)continue;const list=GIFTS[group(b)]??GIFTS.wald,kind=list[Math.floor(Math.random()*list.length)],n=h*3;s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+n;s.stored=(s.stored??0)+n;out.push({name:title(b),kind,n});}return out.slice(0,4);}

// Jakob 3.11.: Höchstens 100 Zuneigung. Ab drei Herzen grüßen arbeitende Blobs draußen, wenn du vorbeikommst (nur Darstellung).
export function friendGreetings(s){const p=s.player,t=s.time;for(const b of s.forestBlobs?.roster??[]){const h=blobHearts(b),w=b.work?.position;if(h<3||!b.active||!w||t<(b.greetNext??0)||Math.hypot(w.x-p.x,w.z-p.z)>3)continue;b.greetUntil=t+(h>=5?2.2:1.4);b.greetNext=t+25-h*3;}}
