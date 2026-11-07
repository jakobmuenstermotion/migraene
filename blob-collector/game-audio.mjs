import {windVector} from './world-wind.mjs';
import {preferences} from './preferences.mjs';
import {resourceArea} from './blob-workers.mjs';
import {blobTagPoints} from './blob-motion.mjs';
import {daylightAt} from './daylight.mjs';
// Alles wird erzeugt: wiederverwendete Rausch- und Motorschleifen, dazu kurze Einzeltöne. Keine Downloads.
const TOOLS={
 ground:{wave:'sine',pitch:112,type:'lowpass',cut:720,q:.7,air:.085,motor:.03,flutter:[1.1,50]},
 focus:{wave:'triangle',pitch:430,type:'bandpass',cut:1900,q:2.4,air:.11,motor:.012,flutter:[3.2,90]},
 fan:{wave:'sine',pitch:172,type:'lowpass',cut:2700,q:.3,air:.1,motor:.016,flutter:[9,320]},
 power:{wave:'sawtooth',pitch:60,type:'lowpass',cut:470,q:1.6,air:.1,motor:.018,flutter:[.9,40]},
 vortex:{wave:'triangle',pitch:214,type:'bandpass',cut:1350,q:1.8,air:.12,motor:.016,flutter:[1.7,650]}
};
const MOODS={
 sunny:{root:261.6,scale:[0,2,4,7,9],step:.62,wave:'triangle'},
 steinbach:{root:293.7,scale:[0,2,4,7,9],step:.7,wave:'triangle'},
 mooswald:{root:220,scale:[0,3,5,7,10],step:.78,wave:'triangle'},
 pilzhain:{root:246.9,scale:[0,3,5,8,10],step:.86,wave:'sine'},
 coast:{root:293.7,scale:[0,2,4,7,11],step:.54,wave:'sine'},
 ice:{root:392,scale:[0,2,7,9,14],step:1.1,wave:'sine'},
 volcano:{root:146.8,scale:[0,1,5,7,10],step:.92,wave:'triangle'},
 home:{root:329.6,scale:[0,4,7,9,12],step:.8,wave:'sine'}
};
const CHORDS=[0,-3,5,-5];
// Jakob 3.11.: im Wald ruhiges Klavier. Eigene Komposition in a-Moll, Viertel je Schritt, null = Ton klingt weiter.
const FOREST_SONG={
 melody:[76,null,72,74, 72,null,69,null, 67,null,76,74, 74,null,71,null, 69,72,76,null, 77,76,72,null, 74,null,67,71, 69,null,null,null,
         72,null,74,76, 77,null,76,74, 72,null,71,72, 74,null,null,null, 76,null,74,72, 72,null,69,72, 71,null,68,71, 69,null,null,null],
 bass:[45,41,48,43, 45,41,43,45, 41,45,48,43, 45,41,40,45]
};
const midi=n=>440*2**((n-69)/12);
const FOREST=new Set(['sunny','steinbach','mooswald','pilzhain']);
const AMBIENCE={
 sunny:{type:'bandpass',cut:950,q:.5,gain:.012},steinbach:{type:'bandpass',cut:2300,q:.45,gain:.028},mooswald:{type:'bandpass',cut:800,q:.6,gain:.014},pilzhain:{type:'bandpass',cut:600,q:.8,gain:.014},
 coast:{type:'lowpass',cut:680,q:.3,gain:.028,swell:[4.6,.026]},ice:{type:'bandpass',cut:1550,q:3,gain:.02,swell:[7,.018]},volcano:{type:'lowpass',cut:170,q:.8,gain:.11,swell:[5,.03]},home:{type:'lowpass',cut:300,q:.3,gain:0}
};
const coo=species=>{let h=0;for(const c of String(species))h=(h*31+c.charCodeAt(0))%97;return 1+h/97*.5;};
export class GameAudio{
 constructor(getState){this.getState=getState;this.context=null;this.lastTool='';this.nextNote=0;this.nextCritter=0;this.nextCoo=0;this.step=0;this.degree=2;this.pet='';globalThis.document?.addEventListener('visibilitychange',()=>{if(document.hidden&&this.context)this.master.gain.setTargetAtTime(0,this.context.currentTime,.05);});}
 start(){const p=preferences(this.getState());if(!p.sound)return;try{if(this.context){this.resume();return;}const C=globalThis.AudioContext??globalThis.webkitAudioContext;if(!C)return;const c=this.context=new C(),master=c.createGain(),air=c.createGain(),motor=c.createGain(),filter=c.createBiquadFilter(),osc=c.createOscillator(),noise=c.createBufferSource(),buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),samples=buffer.getChannelData(0);let last=0;for(let i=0;i<samples.length;i++){last=(last+(Math.random()*2-1)*.025)/1.015;samples[i]=last*4;}noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=1000;air.gain.value=motor.gain.value=0;master.gain.value=p.volume;noise.connect(filter).connect(air).connect(master);osc.type='sine';osc.connect(motor).connect(master);master.connect(c.destination);noise.start();osc.start();
  const world=c.createBufferSource(),worldFilter=c.createBiquadFilter(),worldGain=c.createGain(),music=c.createGain(),effects=c.createGain();world.buffer=buffer;world.loop=true;world.playbackRate.value=.83;worldGain.gain.value=0;music.gain.value=0;effects.gain.value=1;world.connect(worldFilter).connect(worldGain).connect(master);music.connect(master);effects.connect(master);world.start();
  this.master=master;this.air=air;this.motor=motor;this.filter=filter;this.osc=osc;this.worldFilter=worldFilter;this.worldGain=worldGain;this.music=music;this.effects=effects;this.nextNote=c.currentTime+.6;this.nextCritter=c.currentTime+3;this.nextCoo=c.currentTime+4;}catch{this.context=null;}}
 // Jakob 7.11.: Gebrabbel wie bei Animal Crossing. Jeder Buchstabe ein kurzer, gefilterter Silbenlaut; Vokale klingen offen,
 // Konsonanten kurz und spitz, die Tonhöhe folgt grob dem Buchstaben, damit gleiche Wörter gleich klingen.
 babble(ch){if(!this.context||!preferences(this.getState()).sound)return;const c=this.context,at=c.currentTime,code=ch.toLowerCase().charCodeAt(0),vowel='aeiouäöü'.includes(ch.toLowerCase()),base=370+((code*37)%9)*28,o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),len=vowel?.085:.05;o.type='square';o.frequency.setValueAtTime(base*(vowel?1:1.25),at);o.frequency.exponentialRampToValueAtTime(base*(vowel?.86:1.05),at+len);f.type='bandpass';f.frequency.value=vowel?1100+((code*13)%5)*180:2400;f.Q.value=vowel?3:5;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(vowel?.05:.03,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+len);o.connect(f).connect(g).connect(this.effects);o.start(at);o.stop(at+len+.02);}
 // iOS hält den Ton nach Tabwechsel oder Anruf an (suspended/interrupted), er läuft nur per resume weiter.
 resume(){if(this.context&&this.context.state!=='running')this.context.resume()?.catch?.(()=>{});}
 note(freq,{end=freq,at=this.context.currentTime,length=.3,volume=.04,wave='sine',bus=this.effects}={}){const c=this.context,osc=c.createOscillator(),gain=c.createGain();osc.type=wave;osc.frequency.setValueAtTime(freq,at);if(end!==freq)osc.frequency.exponentialRampToValueAtTime(end,at+length);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+Math.min(.03,length*.2));gain.gain.exponentialRampToValueAtTime(.0001,at+length);osc.connect(gain).connect(bus);osc.start(at);osc.stop(at+length+.02);}
 piano(freq,at,length,volume){const c=this.context,g=c.createGain(),f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=Math.min(5200,freq*7);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(volume,at+.012);g.gain.exponentialRampToValueAtTime(volume*.35,at+.35);g.gain.exponentialRampToValueAtTime(.0001,at+length);g.connect(f).connect(this.music);for(const [mul,wave,level]of [[1,'sine',1],[2,'triangle',.22],[3,'sine',.08],[1.003,'sine',.35]]){const o=c.createOscillator(),og=c.createGain();o.type=wave;o.frequency.value=freq*mul;og.gain.value=level;o.connect(og).connect(g);o.start(at);o.stop(at+length+.05);}}
 playPiano(night,t){const beat=night?.78:.62;while(this.nextNote<t+.15){const at=Math.max(this.nextNote,t),len=FOREST_SONG.melody.length,i=(this.pianoStep??0)%(len+16);if(i<len){const n=FOREST_SONG.melody[i];if(n)this.piano(midi(n),at,beat*3.2,.05);if(i%4===0){const root=FOREST_SONG.bass[i/4%FOREST_SONG.bass.length];this.piano(midi(root),at,beat*4.4,.04);this.piano(midi(root+7),at+beat,beat*2.6,.022);this.piano(midi(root+12),at+beat*2,beat*2.4,.018);this.piano(midi(root+7),at+beat*3,beat*2,.016);}}this.pianoStep=(this.pianoStep??0)+1;this.nextNote=at+beat;}}
 playMusic(mood,night,t){while(this.nextNote<t+.15){const at=Math.max(this.nextNote,t),bar=this.step%64,resting=bar>=48,chord=CHORDS[Math.floor(bar/16)%4],base=mood.root*2**(chord/12);if(this.step%8===0&&!resting){this.note(base/2,{at,length:mood.step*7,volume:.05,wave:'sine',bus:this.music});this.note(base*.75,{at:at+.02,length:mood.step*6,volume:.022,wave:'sine',bus:this.music});}if(!resting&&Math.random()<(night?.38:.58)){this.degree=Math.max(0,Math.min(mood.scale.length*2-1,this.degree+Math.round((Math.random()-.5)*4)));const octave=Math.floor(this.degree/mood.scale.length),tone=mood.scale[this.degree%mood.scale.length];this.note(base*2**((tone+octave*12)/12),{at,length:mood.step*2.4,volume:.05,wave:mood.wave,bus:this.music});}this.step++;this.nextNote=at+mood.step*(night?1.25:1);}}
 critters(area,night,t){if(t<this.nextCritter)return;const r=Math.random();if(area==='home'){this.nextCritter=t+30;return;}if(area==='coast'){this.note(1250,{end:800,length:.34,volume:.012,wave:'triangle'});this.note(1150,{end:760,at:t+.42,length:.3,volume:.01,wave:'triangle'});this.nextCritter=t+9+r*14;return;}if(area==='ice'){for(let i=0;i<3;i++)this.note(2400+r*900+i*340,{at:t+i*.11,length:.42,volume:.009});this.nextCritter=t+7+r*11;return;}if(area==='volcano'){for(let i=0;i<4;i++)this.note(90+Math.random()*90,{at:t+i*.06*Math.random()*3,length:.06,volume:.03,wave:'square'});this.nextCritter=t+2.5+r*6;return;}if(night){for(let i=0;i<5;i++)this.note(4300,{at:t+i*.085,length:.05,volume:.0055});this.nextCritter=t+1.6+r*3;return;}const base=2100+r*1300;for(let i=0;i<2+Math.floor(r*3);i++)this.note(base*(1+i%2*.14),{end:base*(1.2-i%2*.14),at:t+i*.14,length:.1,volume:.0075});this.nextCritter=t+3.5+r*8;}
 blobs(s,t){const pet=s.forestBlobs?.roster?.find(b=>(b.petUntil??0)>s.time)?.id??'';if(pet&&pet!==this.pet)for(let i=0;i<3;i++)this.note(620+i*150,{end:880+i*150,at:t+i*.12,length:.15,volume:.035});this.pet=pet;if(t<this.nextCoo)return;this.nextCoo=t+2.5+Math.random()*5;let near=null,gap=8;for(const q of blobTagPoints){const d=Math.hypot(q.x-s.player.x,q.z-s.player.z);if(d<gap){gap=d;near=q;}}if(!near)return;const f=(620-(near.b.stage??1)*110)*coo(near.b.species),loud=.03*(1-gap/8)+.004;this.note(f,{end:f*1.45,length:.13,volume:loud,wave:'triangle'});if(Math.random()<.5)this.note(f*1.3,{end:f*.95,at:t+.15,length:.14,volume:loud*.8,wave:'triangle'});}
 update(s,paused){const c=this.context;if(!c)return;const p=preferences(s),visible=!globalThis.document?.hidden,on=p.sound&&visible&&!paused&&s.suctionActive&&!s.charging,t=c.currentTime,tool=TOOLS[s.vacuumId]??TOOLS.ground,hot=s.vacuumId==='power'?Math.max(0,Math.min(1,Number(s.heat?.value??s.heat)||0)):0;this.master.gain.setTargetAtTime(p.sound&&visible?p.volume:0,t,.12);if(this.lastTool!==s.vacuumId){this.lastTool=s.vacuumId;this.filter.type=tool.type;this.filter.Q.value=tool.q;this.osc.type=tool.wave;}const flutter=Math.sin(s.time*tool.flutter[0]*Math.PI*2)*tool.flutter[1];this.osc.frequency.setTargetAtTime(tool.pitch*(1+hot*.6)+Math.sin(s.time*1.5)*2,t,.12);this.filter.frequency.setTargetAtTime(tool.cut+flutter,t,.05);this.air.gain.setTargetAtTime(on?tool.air:!paused?windVector(s).strength*.025:0,t,.09);this.motor.gain.setTargetAtTime(on?tool.motor:0,t,.12);
  const indoors=s.home?.interior||s.nursery?.interior||s.cave?.interior,area=indoors?'home':s.testWorld?.enabled?'sunny':resourceArea(s.player.x,s.player.z),world=AMBIENCE[area]??AMBIENCE.sunny,swell=world.swell?Math.sin(t/world.swell[0]*Math.PI*2)*world.swell[1]:0;this.worldFilter.type=world.type;this.worldFilter.frequency.setTargetAtTime(world.cut,t,.5);this.worldFilter.Q.setTargetAtTime(world.q,t,.5);this.worldGain.gain.setTargetAtTime(visible?Math.max(0,world.gain+swell):0,t,.4);
  this.music.gain.setTargetAtTime(p.music===false||!visible?0:.8,t,.6);if(!visible||!p.sound)return;const night=daylightAt(s.time+(s.daylightOffset??0)).night>.6;if(p.music!==false&&FOREST.has(area))this.playPiano(night,t);else if(p.music!==false)this.playMusic(MOODS[area]??MOODS.sunny,night,t);else this.nextNote=t;if(!paused){this.critters(area,night,t);this.blobs(s,t);}}
 dispose(){this.context?.close();this.context=null;}
}
