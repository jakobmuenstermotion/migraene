export const JOYSTICK=Object.freeze({radius:82,aimDead:6,moveStart:28,knobTravel:54});
export function joystickInput(dx,dz,out={}){
 const distance=Math.hypot(dx,dz),aiming=distance>JOYSTICK.aimDead,nx=aiming?dx/distance:0,nz=aiming?dz/distance:0;
 const amount=Math.min(1,Math.max(0,(distance-JOYSTICK.moveStart)/(JOYSTICK.radius-JOYSTICK.moveStart))),speed=amount**1.2;
 Object.assign(out,{x:nx*speed,z:nz*speed,aimX:nx,aimZ:nz,knobX:nx*Math.min(distance,JOYSTICK.knobTravel),knobZ:nz*Math.min(distance,JOYSTICK.knobTravel),speed,aiming});return out;
}
