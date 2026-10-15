export class GardenControls {
  constructor(canvas,joystick,scene,{blocked=()=>false,onBank=()=>{}}={}){
    this.scene=scene;this.keys=new Set();this.stick={x:0,z:0};this.target=null;this.down=false;this.blocked=blocked;
    const clear=()=>{this.keys.clear();this.down=false;this.resetStick(joystick);};
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
    window.addEventListener('keydown',e=>{if(blocked()||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){e.preventDefault();if(key===' '){onBank();return;}this.keys.add(key);this.target=null;}});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    const aim=e=>{if(blocked())return;const r=canvas.getBoundingClientRect(),p=scene.screenToWorld(e.clientX-r.left,e.clientY-r.top);if(p)this.target=p;};
    canvas.addEventListener('pointerdown',e=>{if(e.button!==0||blocked())return;this.down=true;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});aim(e);});
    canvas.addEventListener('pointermove',e=>{if(this.down)aim(e);});
    canvas.addEventListener('pointerup',()=>this.down=false);canvas.addEventListener('pointercancel',()=>this.down=false);
    let joyId=null;
    const move=e=>{const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dz),limit=r.width*.26,k=Math.min(len,limit);this.stick={x:len?dx/len*k/limit:0,z:len?dz/len*k/limit:0};joystick.firstElementChild.style.transform=`translate(${this.stick.x*limit}px,${this.stick.z*limit}px)`;this.target=null;};
    joystick.addEventListener('pointerdown',e=>{if(blocked())return;e.preventDefault();joyId=e.pointerId;joystick.setPointerCapture(joyId);move(e);});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)move(e);});
    const end=()=>{joyId=null;this.resetStick(joystick);};joystick.addEventListener('pointerup',end);joystick.addEventListener('pointercancel',end);
  }
  resetStick(joystick){this.stick={x:0,z:0};if(joystick)joystick.firstElementChild.style.transform='';}
  stop(){this.keys.clear();this.target=null;this.stick={x:0,z:0};}
  direction(player){
    if(this.blocked())return{x:0,z:0};
    let x=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0)+this.stick.x;
    let z=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0)+this.stick.z;
    if(x||z)this.target=null;
    else if(this.target){x=this.target.x-player.x;z=this.target.z-player.z;const distance=Math.hypot(x,z);if(distance<.15){this.target=null;return{x:0,z:0};}}
    const distance=Math.hypot(x,z),divisor=Math.max(1,distance);return{x:x/divisor,z:z/divisor};
  }
}
