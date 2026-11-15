/* Jakob 15.11.: Über das Ende (radius) hinausziehen = Sprinten. sprintMargin: kleine Toleranz, damit man nicht aus Versehen sprintet; sprintRing: wie weit der Knopf im Sprintbereich noch mitwandert. */
export const JOYSTICK=Object.freeze({radius:82,aimDead:6,moveStart:28,knobTravel:54,sprintMargin:6,sprintRing:44});
export function joystickInput(dx,dz,out={},sprinting=false){
 const distance=Math.hypot(dx,dz),aiming=distance>JOYSTICK.aimDead,nx=aiming?dx/distance:0,nz=aiming?dz/distance:0;
 const amount=Math.min(1,Math.max(0,(distance-JOYSTICK.moveStart)/(JOYSTICK.radius-JOYSTICK.moveStart))),speed=amount**1.2;
 const over=distance-JOYSTICK.radius,sprint=over>(sprinting?0:JOYSTICK.sprintMargin),travel=over<=0?Math.min(distance,JOYSTICK.knobTravel):JOYSTICK.knobTravel+Math.min(over,JOYSTICK.sprintRing);
 Object.assign(out,{x:nx*speed,z:nz*speed,aimX:nx,aimZ:nz,knobX:nx*travel,knobZ:nz*travel,speed,aiming,sprint});return out;
}
