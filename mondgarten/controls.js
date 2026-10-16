export class GardenControls {
  constructor(canvas,joystick,scene,{blocked=()=>false,onBank=()=>{}}={}){
    this.scene=scene;this.keys=new Set();this.stick={x:0,z:0};this.target=null;this.blocked=blocked;this.joystick=joystick;this.pointer=null;
    const clear=()=>this.stop();
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
    window.addEventListener('keydown',e=>{if(blocked()||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){e.preventDefault();if(key===' '){onBank();return;}this.keys.add(key);this.target=null;}});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0||blocked()||this.pointer!==null)return;
      e.preventDefault();this.pointer=e.pointerId;this.origin={x:e.clientX,y:e.clientY};this.target=null;
      canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
      const r=joystick.parentElement.getBoundingClientRect();
      joystick.style.left=(e.clientX-r.left)+'px';joystick.style.top=(e.clientY-r.top)+'px';joystick.classList.add('active');
    });
    canvas.addEventListener('pointermove',e=>{
      if(e.pointerId!==this.pointer)return;if(blocked()){this.stop();return;}
      const dx=e.clientX-this.origin.x,dz=e.clientY-this.origin.y,len=Math.hypot(dx,dz),limit=28;
      const strength=len<5?0:Math.min(1,(len-5)/(limit-5));
      this.stick={x:len?dx/len*strength:0,z:len?dz/len*strength:0};
      joystick.firstElementChild.style.transform=`translate(${this.stick.x*limit}px,${this.stick.z*limit}px)`;
    });
    const end=e=>{if(e.pointerId===this.pointer)this.stop();};
    canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  }
  stop(){this.keys.clear();this.target=null;this.stick={x:0,z:0};this.pointer=null;this.joystick.classList.remove('active');this.joystick.firstElementChild.style.transform='';}
  direction(player){
    if(this.blocked())return{x:0,z:0};
    let x=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0)+this.stick.x;
    let z=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0)+this.stick.z;
    if(x||z)this.target=null;
    else if(this.target){x=this.target.x-player.x;z=this.target.z-player.z;if(Math.hypot(x,z)<.15){this.target=null;return{x:0,z:0};}}
    const distance=Math.hypot(x,z),divisor=Math.max(1,distance);return{x:x/divisor,z:z/divisor};
  }
}
