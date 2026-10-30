/* Original sets for Deadline. The Matrix is a narrative lens, not evidence.
 * A window closes, work queues, a stale observation travels, then the camera
 * exposes a shared resource. Every pose is computed from authored time.
 * No footage, character likeness, code rain or decorative glitch is used. */
import { THREE, lerp, ramp, ease, win } from './engine.js?v=deadline-matrix-20261030';

const GREEN = 0x7bffb1, AMBER = 0xffbe69, RED = 0xff635b, IVORY = 0xe0e8d7;
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const smooth = (t, a, b) => ease.inOutCubic(ramp(t, a, b));
function solid(color, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .55,
    emissive, emissiveIntensity: intensity });
}
function mesh(parent, geometry, material, p = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material); m.position.set(...p);
  m.castShadow = !material.transparent; m.receiveShadow = !material.transparent; parent.add(m); return m;
}
function box(parent, w, h, d, material, p) { return mesh(parent, new THREE.BoxGeometry(w, h, d), material, p); }
function tube(parent, points, material, radius = .025) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, radius, 8, false), material);
}
function group(parent) { const g = new THREE.Group(); parent.add(g); return g; }

export function deadlineDoorState(t, T) {
  const first=t<T.beat;
  const origin=t<T.think?T.beat:T.think;
  const cycle=first?t:(t-origin)%4.5;
  const deadline=first?3.65:2.7;
  const arrival=first?4.4:t<T.think+4.5?2:3.45;
  return {first,cycle,deadline,arrival,ready:cycle>=arrival};
}

export function buildDeadlineStage(ctx) {
  const { scene, renderer } = ctx;
  scene.background = new THREE.Color(0x020906);
  scene.fog = new THREE.FogExp2(0x020906, .025);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight(0xabcbb0, 0x07100b, 2.0));
  const key = new THREE.DirectionalLight(0xe3eddc, 4); key.position.set(-3, 7, 5);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .5, far: 20 });
  key.shadow.bias = -.0005; key.shadow.normalBias = .025; scene.add(key);
  const rim = new THREE.PointLight(GREEN, 12, 12, 2); rim.position.set(3, 2, -3); scene.add(rim);

  const metal = solid(0x14271e), edge = solid(0x8ba68d), pale = solid(IVORY);
  const black = solid(0x07120d), green = solid(0x81c79a, GREEN, .8);
  const amber = solid(0xb98345, AMBER, .65), red = solid(0x9f3d38, RED, .7);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x91bea0, metalness: .2,
    roughness: .18, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false });

  // One tangible door, with a finite permission window. Its key is a plan,
  // not a character or an assertion that this simulates a physical robot.
  const door = group(scene);
  box(door, 3.7, .18, 3.4, metal, [0, -1.57, 0]);
  box(door, .22, 3.2, .42, pale, [-1.03, .0, 0]);
  box(door, .22, 3.2, .42, pale, [1.03, .0, 0]);
  box(door, 2.28, .22, .42, pale, [0, 1.49, 0]);
  const left = box(door, .94, 2.84, .16, metal, [-.48, -.02, 0]);
  const right = box(door, .94, 2.84, .16, metal, [.48, -.02, 0]);
  const doorGlow = green.clone();
  const leftLine = box(left, .018, 2.72, .035, doorGlow, [.45, 0, .1]);
  const rightLine = box(right, .018, 2.72, .035, doorGlow, [-.45, 0, .1]);
  const window = box(door, 1.82, .055, .05, doorGlow, [0, 1.25, .28]);
  const keyToken = group(door);
  const keyRing = mesh(keyToken, new THREE.TorusGeometry(.16, .055, 12, 40), green);
  box(keyToken, .075, .38, .09, edge, [0, -.3, 0]);
  box(keyToken, .14, .055, .09, edge, [.055, -.46, 0]);
  tube(door, [v(-1.7,-1.42,1.2),v(-.9,-1.42,.6),v(0,-1.42,-.8)], green, .012);
  // Receding portal frames explain that access is a path, not just one lock.
  const corridors = [];
  for (let i = 0; i < 3; i++) {
    const portal = group(door); portal.position.z = -1.1 - i * .85;
    box(portal, .055, 2.8, .06, edge, [-.86, -.04, 0]);
    box(portal, .055, 2.8, .06, edge, [.86, -.04, 0]);
    box(portal, 1.76, .055, .06, edge, [0, 1.36, 0]); corridors.push(portal);
  }

  // The original clock and AI polyhedron become machines in a cutaway set.
  const machine = group(scene), floor = box(machine, 4.5, .18, 2.5, metal, [0, -1.22, 0]);
  const controller = group(machine); controller.position.set(-1.15, -.02, .15);
  const clockBody = mesh(controller, new THREE.CylinderGeometry(.8, .8, .25, 64), black);
  clockBody.rotation.x = Math.PI / 2;
  mesh(controller, new THREE.TorusGeometry(.76, .035, 10, 96), edge, [0, 0, .16]);
  const ticks = [];
  for (let i = 0; i < 36; i++) {
    const a = Math.PI/2-i*Math.PI/18, m = green.clone();
    const tick = box(controller, .022, .11, .025, m, [.68*Math.cos(a), .68*Math.sin(a), .18]);
    tick.rotation.z = a - Math.PI/2; ticks.push(tick);
  }
  const hand = group(controller);
  box(hand, .025, .65, .025, pale, [0, .29, .23]);
  const schedule = group(controller);
  const scheduleMat = new THREE.MeshBasicMaterial({color: GREEN,transparent:true,opacity:.45});
  box(schedule,.015,.69,.016,scheduleMat,[0,.30,.25]);
  const hub = mesh(controller, new THREE.SphereGeometry(.08, 20, 12), green.clone(), [0, 0, .26]);
  box(controller, 1.2, .22, .6, metal, [0,-.98,-.02]);
  const ai = group(machine); ai.position.set(1.25,.08,.0);
  const aiSurface = solid(0x8d9f8c); aiSurface.roughness=.52; aiSurface.metalness=.25;
  const aiBody = mesh(ai, new THREE.IcosahedronGeometry(.63, 0), aiSurface);
  const aiEdges = new THREE.LineSegments(new THREE.EdgesGeometry(aiBody.geometry),
    new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: .65 })); ai.add(aiEdges);
  box(ai, 1.4, .2, .9, edge, [0,-1.05,0]);
  const receiver = box(machine, .42,.52,.18, glass, [-.28,.05,.12]);
  const receiveFrame = new THREE.LineSegments(new THREE.EdgesGeometry(receiver.geometry),
    new THREE.LineBasicMaterial({ color: GREEN })); receiveFrame.position.copy(receiver.position); machine.add(receiveFrame);
  const direct = tube(machine,[v(1.25,-.05,0),v(.15,-.2,.08),v(-1.15,-.1,.15)],amber,.016);
  const proposalPath = tube(machine,[v(1.25,.0,0),v(.45,.38,.12),v(-.28,.05,.12)],green,.016);
  const admitPath = tube(machine,[v(-.28,.05,.12),v(-.7,-.1,.2),v(-1.15,0,.2)],green,.016);
  const packets = [];
  for (let i=0;i<16;i++) packets.push(mesh(machine,new THREE.OctahedronGeometry(.075,0),green.clone()));

  // A queue is a row of distinct pending jobs that stops at the blocked actor.
  const queue = [];
  for(let i=0;i<7;i++) queue.push(box(machine,.16,.10,.24,amber.clone(),[-.75-i*.23,-1.05,.7]));

  // A proposal carries a snapshot. Current context moves; the old tile stays.
  const context = group(machine);
  const observed = box(context,.85,.62,.035,glass, [.85,.52,.62]);
  const oldDot = mesh(context,new THREE.SphereGeometry(.07,16,10),amber.clone(),[.58,.55,.68]);
  const currentDot = mesh(context,new THREE.SphereGeometry(.095,20,12),green,[.58,.55,.68]);
  const history = tube(context,[v(.58,.55,.67),v(.86,.68,.65),v(1.16,.55,.65)],amber,.012);
  const actionGate = group(machine); actionGate.position.set(-.62,.0,.2);
  box(actionGate,.035,.85,.08,amber,[0,.0,0]);
  box(actionGate,.23,.035,.08,amber,[.1,.41,0]);
  const rejected = mesh(actionGate,new THREE.OctahedronGeometry(.1,0),red);

  // Two process walls rise from one base. The reveal is the dependency below.
  const shared = group(machine);
  const glassA = box(shared,1.9,2.18,1.4,glass,[-1.12,.02,0]);
  const glassB = box(shared,1.6,1.9,1.4,glass,[1.18,.12,0]);
  const poolMat = solid(0x36563e, GREEN,.25);
  const pool = box(shared,4.5,.3,2.5,poolMat,[0,-1.46,0]);
  const cableA = tube(shared,[v(-1.15,-.96,.0),v(-1.15,-1.47,.0),v(0,-1.47,0)],green,.035);
  const cableB = tube(shared,[v(1.25,-.96,0),v(1.25,-1.47,0),v(0,-1.47,0)],green,.035);
  const splitA = box(shared,2.1,.3,2.5,poolMat.clone(),[-1.2,-1.46,0]);
  const splitB = box(shared,1.7,.3,2.5,poolMat.clone(),[1.3,-1.46,0]);

  const world = { door,left,right,doorGlow,window,keyToken,keyRing,corridors,
    machine,floor,controller,ai,aiBody,aiEdges,ticks,hand,schedule,hub,receiver,receiveFrame,
    direct,proposalPath,admitPath,packets,queue,context,observed,oldDot,currentDot,history,
    actionGate,rejected,shared,glassA,glassB,pool,poolMat,cableA,cableB,splitA,splitB };
  ctx.deadlineWorld = world;
  return world;
}

export function frameDeadlineStage(t, ctx, state, T) {
  const w = ctx.deadlineWorld, {camera,wide,grade} = ctx;
  const opening = t < T.wait;
  w.door.visible = opening;
  w.machine.visible = !opening && t < T.card+.4;
  const {first,cycle,deadline,arrival}=deadlineDoorState(t,T);
  const open = win(cycle,first ? 1 : .2,deadline,.6,.25);
  w.left.position.x = -.48 - open*.84; w.right.position.x = .48 + open*.84;
  w.doorGlow.color.setHex(cycle > deadline ? AMBER : GREEN);
  w.doorGlow.emissive.setHex(cycle > deadline ? AMBER : GREEN);
  w.window.scale.x = Math.max(.008,1-ramp(cycle,first?1.6:.3,deadline));
  w.keyToken.position.set(lerp(-1.25,-.08,smooth(cycle,first?.7:0,arrival)), .1,
    lerp(1.35,.28,smooth(cycle,first?.7:0,arrival)) - (arrival < deadline ? ramp(cycle,arrival,deadline)*1.8 : 0));
  w.keyToken.rotation.set(.0,.15,lerp(-.45,0,smooth(cycle,first?.7:0,arrival)));
  // The key arrives after the aperture closes, then becomes the AI proposal.
  const transition=smooth(t,T.wait-.7,T.wait+.6);
  w.door.scale.setScalar(1-transition*.08);
  w.door.position.y=transition*.1;

  const split = smooth(t,T.split,T.split+1.2), reveal=smooth(t,T.share-1,T.share+2);
  const isolated=smooth(t,state.isolateAt,state.isolateAt+1.3);
  w.direct.visible = t < T.split+.4;
  w.proposalPath.visible = t >= T.split;
  w.admitPath.visible = t >= T.split;
  w.receiver.visible=w.receiveFrame.visible=t>=T.split;
  w.context.visible=t>=T.stale&&t<T.limits;
  w.actionGate.visible=t>=T.contract&&t<T.share;
  w.actionGate.rotation.y=state.fresh&&!(t>=T.limits&&state.lastProposalBad)?Math.PI/2:0;
  w.receiveFrame.material.color.setHex(t>=T.contract&&!state.fresh?AMBER:GREEN);
  w.shared.visible=t>=T.share-.8;
  w.floor.visible=t<T.share+.6;
  // Once separation begins, draw only the two replacement surfaces. Drawing
  // the original base underneath them produced coplanar depth flicker.
  w.pool.visible=isolated===0;
  w.splitA.visible=w.splitB.visible=isolated>0;
  w.splitA.scale.x=isolated===1?1:lerp(2.5/2.1,1,isolated);
  w.splitB.scale.x=isolated===1?1:lerp(2/1.7,1,isolated);
  w.splitA.position.x=isolated===1?-1.2-isolated*.28:lerp(-1,-1.48,isolated);
  w.splitB.position.x=isolated===1?1.3+isolated*.28:lerp(1.25,1.58,isolated);
  w.cableA.visible=w.cableB.visible=isolated<.75;
  w.glassA.scale.set(1,reveal,1); w.glassB.scale.set(1,reveal,1);
  w.poolMat.color.setHex(state.blocked?0x381c18:0x294333);
  w.poolMat.emissive.setHex(state.blocked?RED:GREEN);
  w.poolMat.emissiveIntensity=state.blocked?.09:.035;
  w.aiBody.rotation.set(.22,t*.10,.14);
  w.aiEdges.rotation.copy(w.aiBody.rotation);
  w.aiBody.scale.setScalar(state.busy?1.04:1);
  w.aiEdges.scale.copy(w.aiBody.scale);
  w.hand.rotation.z=-state.handTime*Math.PI*2/18;
  w.schedule.rotation.z=-t*Math.PI*2/18;
  w.schedule.visible=state.blocked;
  w.hub.material.emissive.setHex(state.blocked?RED:GREEN);
  w.hub.material.color.setHex(state.blocked?RED:GREEN);
  for(let i=0;i<36;i++) {
    const phase=((Math.floor(t/.5)-i)%36+36)%36;
    w.ticks[i].material.emissiveIntensity=phase<2?.9:.05;
    w.ticks[i].material.color.setHex(state.blocked&&phase<5?RED:state.fresh?GREEN:AMBER);
  }
  const pending=state.blocked?Math.min(7,2+Math.floor((t-state.handTime)*3)):0;
  w.queue.forEach((p,i)=>{p.visible=i<pending;p.scale.y=1;});
  // Packets use the actual authored plan flights rather than random traffic.
  w.packets.forEach((m,i)=>{
    const p=state.plans[i];
    m.visible=!!p&&t>=p.e&&t<p.a+.35;
    if(!m.visible)return;
    const u=ramp(t,p.e,p.a),dest=p.async?-.28:-1.15;
    m.position.set(lerp(1.25,dest,u),.06+Math.sin(Math.PI*u)*(.18+.17*split),.21);
    m.rotation.set(0,u*2,Math.PI/4);
    m.material.color.setHex(p.bad&&t>=T.limits?RED:GREEN);
  });
  // The snapshot does not follow the new state. Their separation is the point.
  const changed=smooth(t,T.stale+1,T.stale+3.2);
  w.currentDot.position.x=lerp(.58,1.16,changed);
  const admittedContext = t >= T.contract && state.contextMatches;
  w.oldDot.position.set(admittedContext ? w.currentDot.position.x : .58,.55,.68);
  w.oldDot.material.color.setHex(t >= T.contract && state.fresh ? GREEN : AMBER);
  w.oldDot.material.emissive.setHex(t >= T.contract && state.fresh ? GREEN : AMBER);
  w.history.visible=changed>.1&&!admittedContext;
  const falling = state.rejection ? ramp(t,state.rejection.a,state.rejection.a+1.6) : 0;
  w.rejected.position.set(.15+falling*.1,-falling*.7,.1);
  w.rejected.visible=!!state.rejection&&t>=T.limits+2;

  // The camera changes what can be known: first a door, then the actors,
  // finally their common foundation. It never shakes or wanders decoratively.
  let px,py,pz,tx,ty,tz;
  if(opening) {
    const turn=smooth(t,.0,4.8);
    px=lerp(2.25,1.15,turn);py=lerp(1.4,.8,turn);pz=wide?11:17.2;
    tx=0;ty=-.1;tz=0;
  } else {
    px=lerp(1.65,2.25,reveal);py=lerp(1.15,3.3,reveal);pz=wide?11.2:17.5;
    tx=0;ty=lerp(-.1,-.45,reveal);tz=0;
  }
  camera.position.set(px,py,pz);camera.lookAt(tx,ty,tz);
  ctx.setViewShift(wide?.23:0,wide?-.035:0);
  const closing=smooth(t,T.close-.2,T.close+1.1);
  w.machine.scale.setScalar(lerp(1,.94,closing));
  grade.uniforms.uFade.value=(1-closing*.83)*(1-ramp(t,T.card-.1,T.card+.8)*.75);
  ctx.stage.dataset.world=opening?'door':t<T.split?'queue':t<T.stale?'handoff':t<T.contract?'snapshot':t<T.limits?'admission':t<T.share?'action-gate':isolated>.8?'isolated':'shared';
  ctx.stage.dataset.window=cycle<deadline?'open':'closed';
  ctx.stage.dataset.arrival=arrival<deadline?'timely':'late';
  ctx.stage.dataset.pending=String(pending);
}
