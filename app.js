/* ════════════════════════════════════════════════════════════
   THE SECOND AUDIT — cinematic engine
   one particle field tells the story:
   chaos → the case sigil → the april loop ring → the break-out
   line → the word the reader owns. scroll is the projector.
   ════════════════════════════════════════════════════════════ */
(() => {
"use strict";

/* motion: ON by default (cinematic piece). explicit toggle in nav; persisted. */
const reduced = localStorage.getItem("sa-motion") === "off";
if (reduced) document.documentElement.classList.add("reduced");
const coarse  = matchMedia("(pointer: coarse)").matches;
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

/* ───────────────────────── cursor ───────────────────────── */
if (!coarse && !reduced) {
  const cur = $("#cursor"), dot = $("#cursor .dot"), ring = $("#cursor .ring");
  cur.style.opacity = "0";
  let mx=innerWidth/2, my=innerHeight/2, rx=mx, ry=my;
  addEventListener("pointermove", e => { cur.style.opacity="1"; mx=e.clientX; my=e.clientY; dot.style.left=mx+"px"; dot.style.top=my+"px"; });
  (function loop(){ rx+=(mx-rx)*.16; ry+=(my-ry)*.16; ring.style.left=rx+"px"; ring.style.top=ry+"px"; requestAnimationFrame(loop); })();
  $$("a, input, .finding, .ex-facts span").forEach(el => {
    el.addEventListener("pointerenter", () => document.body.classList.add("cur-link"));
    el.addEventListener("pointerleave", () => document.body.classList.remove("cur-link"));
  });
} else { const c=$("#cursor"); if(c) c.style.display="none"; }

/* motion toggle */
const mt = $("#motionToggle");
if (mt){
  mt.textContent = "MOTION: " + (reduced ? "OFF" : "ON");
  mt.addEventListener("click", () => {
    localStorage.setItem("sa-motion", reduced ? "on" : "off");
    location.reload();
  });
}

/* ───────────────────────── boot metadata type-on ───────────────────────── */
const bootLines = [
  "» AUDIT ENGINE v2 — initializing",
  "» subject: <b>ASADULELAH</b>",
  "» evidence indexed: 1,985 pages",
  "» classification: <b>PUBLIC</b>",
  "» opening case file…"
];
const bootMeta = $("#bootmeta");
bootLines.forEach((l, i) => setTimeout(() => {
  bootMeta.innerHTML += (i ? "<br>" : "") + l;
}, 350 + i*330));
setTimeout(() => document.body.classList.add("booted"), 2100);

/* ───────────────────────── particle engine ───────────────────────── */
let engine = null;
class ParticleEngine {
  constructor(canvas){
    this.N = coarse ? 5200 : 15000;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:false, powerPreference:"high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.setSize(innerWidth, innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 1, 600);
    this.camera.position.z = 130;

    const N = this.N;
    this.cur = new Float32Array(N*3);
    this.tgt = new Float32Array(N*3);
    this.spd = new Float32Array(N);
    const shade = new Float32Array(N), size = new Float32Array(N), phase = new Float32Array(N);
    for (let i=0;i<N;i++){
      this.cur[i*3]   = (Math.random()-.5)*500;
      this.cur[i*3+1] = (Math.random()-.5)*500;
      this.cur[i*3+2] = (Math.random()-.5)*300;
      this.spd[i] = .025 + Math.random()*.045;
      shade[i] = Math.random();
      size[i]  = .8 + Math.pow(Math.random(),2.4)*3.4;
      phase[i] = Math.random()*Math.PI*2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.cur, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aShade", new THREE.BufferAttribute(shade, 1));
    geo.setAttribute("aSize",  new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

    this.uni = {
      uTime:   { value: 0 },
      uHeat:   { value: .14 },
      uWobble: { value: 1.4 },
      uAlpha:  { value: 0 },
      uBone:   { value: new THREE.Color(0xEFE9DA) },
      uAmber:  { value: new THREE.Color(0xFF9C1A) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uni,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aShade; attribute float aSize; attribute float aPhase;
        uniform float uTime; uniform float uWobble;
        varying float vShade;
        void main(){
          vShade = aShade;
          vec3 p = position;
          p.x += sin(uTime*0.9 + aPhase)        * uWobble;
          p.y += cos(uTime*0.7 + aPhase*1.7)    * uWobble;
          p.z += sin(uTime*0.5 + aPhase*2.3)    * uWobble * 1.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (240.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform float uHeat; uniform float uAlpha;
        uniform vec3 uBone; uniform vec3 uAmber;
        varying float vShade;
        void main(){
          float d = length(gl_PointCoord - .5);
          float a = smoothstep(.5, .04, d);
          vec3 col = mix(uBone, uAmber, clamp(vShade*.35 + uHeat, 0., 1.));
          gl_FragColor = vec4(col, a * uAlpha * (0.45 + vShade*0.55));
        }`
    });
    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);

    this.spin = 0; this.spinTarget = 0;
    this.mouse = {x:0,y:0};
    if (!coarse) addEventListener("pointermove", e => {
      this.mouse.x = (e.clientX/innerWidth - .5);
      this.mouse.y = (e.clientY/innerHeight - .5);
    });
    addEventListener("resize", () => {
      this.camera.aspect = innerWidth/innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });

    this.targets = { nebula: this.makeNebula() };
    this.setState("nebula");
    this.clock = new THREE.Clock();
    this.velBoost = 0;
    this.t = 0;
    const tick = () => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      try{
        const dt = Math.min(this.clock.getDelta(), .05);
        this.step(dt);
        this.render();
      }catch(e){ (window.__errs=window.__errs||[]).push("tick: "+e.message); throw e; }
    };
    tick();
  }
  step(dt){
    this.t += dt;
    this.uni.uTime.value = this.t;
    this.velBoost *= .94;
    this.uni.uWobble.value = 1.1 + this.velBoost;
    const cur=this.cur, tgt=this.tgt, spd=this.spd, k=Math.min(dt*60,2);
    for (let i=0;i<this.N;i++){
      const s = spd[i]*k, j=i*3;
      cur[j]   += (tgt[j]  -cur[j]  )*s;
      cur[j+1] += (tgt[j+1]-cur[j+1])*s;
      cur[j+2] += (tgt[j+2]-cur[j+2])*s;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.spin += (this.spinTarget - 0)*dt;            // continuous spin while spinTarget>0
    this.points.rotation.z = this.spinTarget>0 ? this.spin : this.points.rotation.z*.94;
    if (this.spinTarget===0 && Math.abs(this.points.rotation.z)<.001){ this.points.rotation.z=0; this.spin=0; }
    this.camera.position.x += ((this.mouse.x*14) - this.camera.position.x)*.04;
    this.camera.position.y += ((-this.mouse.y*10) - this.camera.position.y)*.04;
    this.camera.lookAt(0,0,0);
  }
  render(){
    this.renderer.render(this.scene, this.camera);
  }
  makeNebula(){
    const N=this.N, a=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
      const r = 55 + Math.pow(Math.random(),1.6)*95;
      a[i*3]  = r*Math.sin(ph)*Math.cos(th)*1.45;
      a[i*3+1]= r*Math.sin(ph)*Math.sin(th)*.62;
      a[i*3+2]= r*Math.cos(ph)*.8 - 25;
    }
    return a;
  }
  makeRing(){
    const N=this.N, a=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const th=Math.random()*Math.PI*2;
      const r = 44 + (Math.random()-.5)*4.5;
      a[i*3]  = Math.cos(th)*r;
      a[i*3+1]= Math.sin(th)*r;
      a[i*3+2]= (Math.random()-.5)*5;
    }
    return a;
  }
  makeLine(){
    const N=this.N, a=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const t = Math.pow(Math.random(), .8);
      a[i*3]  = -10 + t*250;
      a[i*3+1]= 44 + t*14 + (Math.random()-.5)*3.5;
      a[i*3+2]= (Math.random()-.5)*4;
    }
    return a;
  }
  makeText(str, scalePx=270, width=120){
    const cw=1400, ch=420;
    const cv = document.createElement("canvas"); cv.width=cw; cv.height=ch;
    const cx = cv.getContext("2d");
    cx.fillStyle="#fff";
    cx.font = `800 ${scalePx}px "Big Shoulders Display", sans-serif`;
    cx.textAlign="center"; cx.textBaseline="middle";
    cx.fillText(str, cw/2, ch/2);
    const img = cx.getImageData(0,0,cw,ch).data;
    const pts=[];
    let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
    for(let y=0;y<ch;y+=3) for(let x=0;x<cw;x+=3)
      if (img[(y*cw+x)*4+3] > 120){
        pts.push([x,y]);
        if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
      }
    const N=this.N, a=new Float32Array(N*3);
    if (!pts.length) return this.makeNebula();
    /* normalize so the GLYPH (not the canvas) spans `width` world units */
    const gw = Math.max(maxX-minX,1), gh = Math.max(maxY-minY,1);
    const sc = width/gw, ox=(minX+maxX)/2, oy=(minY+maxY)/2;
    for(let i=0;i<N;i++){
      const p = pts[(i*97) % pts.length];
      a[i*3]  = (p[0]-ox)*sc + (Math.random()-.5)*.7;
      a[i*3+1]= -(p[1]-oy)*sc + (Math.random()-.5)*.7;
      a[i*3+2]= (Math.random()-.5)*5 - 18;
    }
    return a;
  }
  setState(name){
    if (!this.targets[name]) return;
    this.state = name;
    this.tgt.set(this.targets[name]);
  }
  burst(power=60){
    const cur=this.cur, tgt=this.tgt;
    for(let i=0;i<this.N;i++){
      const j=i*3, dx=cur[j], dy=cur[j+1], dz=cur[j+2];
      const m = Math.hypot(dx,dy,dz)||1, f=power*(0.4+Math.random());
      cur[j]+=dx/m*f; cur[j+1]+=dy/m*f; cur[j+2]+=dz/m*f;
    }
    const st=this.state;
    setTimeout(()=>{ if(this.state===st) this.tgt.set(this.targets[st]); }, 80);
  }
  heat(v, dur=1.2){ gsap.to(this.uni.uHeat, {value:v, duration:dur, overwrite:"auto"}); }
  alpha(v, dur=1.2){ gsap.to(this.uni.uAlpha, {value:v, duration:dur, overwrite:"auto"}); }
}

try {
  if (!reduced && window.THREE) engine = new ParticleEngine($("#gl"));
  else document.body.classList.add("no-webgl");
} catch(e){ window.__engineErr = (e && e.stack) || String(e); document.body.classList.add("no-webgl"); }

/* build font-dependent targets once Syne is ready */
const targetsReady = (async () => {
  if (!engine) return;
  try { await document.fonts.load('800 270px "Big Shoulders Display"'); } catch(e){}
  /* world-width visible at z=-18 ≈ 2*(130+18)*tan(fov/2)*aspect */
  const visW = 2 * 148 * Math.tan(25 * Math.PI/180) * (innerWidth/innerHeight);
  engine.targets.sigil = engine.makeText("2", 330, Math.min(58, visW*.42));
  engine.targets.ring  = engine.makeRing();
  engine.targets.line  = engine.makeLine();
  engine.targets.yours = engine.makeText("YOURS.", 250, Math.min(124, visW*.86));
  /* sit the verdict glyph low, behind the channels, clear of the headline */
  for (let i=0;i<engine.N;i++) engine.targets.yours[i*3+1] -= 26;
})();

/* ───────────────────────── intro (load choreography) ───────────────────────── */
async function intro(){
  if (reduced){ $$(".kicker,.coverquote,.scrollcue").forEach(e=>e.style.opacity=1); return; }
  await targetsReady;
  /* wrap title words for clip reveals */
  $$("h1 .w").forEach(w => { w.innerHTML = `<span class="wi" style="display:block">${w.innerHTML}</span>`; });
  gsap.set("h1 .wi", { yPercent: 118 });

  const tl = gsap.timeline({ defaults:{ ease:"expo.out" } });
  if (engine){
    engine.alpha(1, 2.2);
    tl.add(() => engine.setState("sigil"), .2);
    tl.add(() => engine.heat(.32, 2), .4);
  }
  tl.to("h1 .wi", { yPercent: 0, duration: 1.5, stagger: .13 }, 1.1)
    .to(".kicker", { opacity: 1, duration: 1.2 }, 1.3)
    .to(".coverquote", { opacity: 1, duration: 1.6 }, 2.0)
    .to(".scrollcue", { opacity: 1, duration: 1 }, 2.5);
}
intro().catch(e => { (window.__errs=window.__errs||[]).push("intro: " + (e && e.message)); });
window.__dbg = () => ({ engine: !!engine, state: engine && engine.state, alpha: engine && engine.uni.uAlpha.value, heat: engine && engine.uni.uHeat.value });
window.__engine = () => engine;
/* deterministic frame driver for automated visual verification (no-op in normal use) */
window.__step = (frames=240) => {
  if (window.ScrollTrigger) ScrollTrigger.update();
  let t = gsap ? gsap.ticker.time : 0;
  for (let i=0;i<frames;i++){
    t += 1/60;
    if (window.gsap) gsap.updateRoot(t);
    if (window.ScrollTrigger && i===2) ScrollTrigger.update();
    if (engine) engine.step(1/60);
  }
  if (engine) engine.render();
  return "stepped:" + frames;
};

/* ───────────────────────── scroll film ───────────────────────── */
if (!reduced && window.gsap && window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);

  /* global velocity → particle turbulence */
  ScrollTrigger.create({
    onUpdate(self){ if (engine) engine.velBoost = Math.min(Math.abs(self.getVelocity())/900, 4); }
  });

  /* nav progress + done-marks */
  const pct = $("#navpct");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate(self){ pct.textContent = String(Math.round(self.progress*100)).padStart(3,"0") + "%"; }
  });
  /* manual section spy — immune to pin-spacer offsets */
  const spyLinks = $$(".navtrack a").map(a => [a, $(a.getAttribute("href"))]).filter(([,s]) => s);
  const spy = () => {
    const mid = innerHeight*.5;
    let active = null;
    spyLinks.forEach(([a, s]) => {
      const r = s.getBoundingClientRect();
      a.classList.toggle("done", r.bottom < mid);
      if (r.top <= mid && r.bottom > mid) active = a;
    });
    spyLinks.forEach(([a]) => a.classList.toggle("active", a === active));
  };
  addEventListener("scroll", spy, { passive:true }); spy();

  /* SCENE 1 — boot: pin, scrub out */
  gsap.timeline({
    scrollTrigger: { trigger:"#boot", start:"top top", end:"+=160%", pin:"#boot .pinwrap", scrub: .6,
      onLeave(){ if(engine){ engine.setState("nebula"); engine.heat(.14); engine.alpha(.55,1.6);} },
      onEnterBack(){ if(engine){ engine.setState("sigil"); engine.heat(.32); engine.alpha(1,1.2);} }
    }
  })
  .to(".bootmeta", { opacity:0, duration:.2 }, 0)
  .to("#coverTitle", { yPercent:-34, scale:.86, duration:1 }, 0)
  .to(".coverquote", { yPercent:-80, opacity:0, duration:.7 }, .12)
  .to(".kicker", { opacity:0, duration:.4 }, .1)
  .to(".scrollcue", { opacity:0, duration:.25 }, 0)
  .to("#coverTitle", { opacity:0, duration:.5 }, .55);

  /* SCENE 2 — subject */
  $$("#subject .ln").forEach(ln => { ln.innerHTML = `<span style="display:block">${ln.innerHTML}</span>`; });
  gsap.from("#subject .ln > span", {
    yPercent: 110, duration: 1.1, stagger: .12, ease: "expo.out",
    scrollTrigger: { trigger:"#subject .statement", start:"top 72%" }
  });
  gsap.from(["#subject .serifnote", "#subject .mononote"], {
    opacity:0, y:34, duration:1, stagger:.18, ease:"power3.out",
    scrollTrigger: { trigger:"#subject .statement", start:"top 60%" }
  });
  gsap.from("#dossierCard", {
    opacity:0, y:60, rotateX:14, duration:1.3, ease:"expo.out",
    scrollTrigger: { trigger:"#dossierCard", start:"top 80%" }
  });
  /* dossier mouse tilt */
  if (!coarse){
    const card = $("#dossierCard");
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width -.5, py=(e.clientY-r.top)/r.height -.5;
      gsap.to(card, { rotateY: px*10, rotateX: -py*8, duration:.5, ease:"power2.out" });
    });
    card.addEventListener("pointerleave", () => gsap.to(card, { rotateX:0, rotateY:0, duration:.8, ease:"elastic.out(1,.5)" }));
  }

  /* SCENE 3 — telemetry horizontal */
  const track = $("#htrack");
  const hTween = gsap.to(track, {
    x: () => -(track.scrollWidth - innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger:"#telemetry", start:"top top",
      end: () => "+=" + (track.scrollWidth - innerWidth),
      pin:".hpin", scrub:.7, invalidateOnRefresh:true
    }
  });
  const fmt = n => n.toLocaleString("en-US");
  $$(".bignum").forEach(el => {
    ScrollTrigger.create({
      trigger: el, containerAnimation: hTween, start:"left 65%", once:true,
      onEnter(){
        const target = +el.dataset.count, o={v:0};
        gsap.to(o, { v: target, duration: 1.6, ease:"power3.out", onUpdate(){ el.textContent = fmt(Math.round(o.v)); } });
      }
    });
  });

  /* SCENE 4 — exhibits */
  $$(".exhibit").forEach(ex => {
    const visual = $(".tilt3d", ex), flip = ex.classList.contains("flip");
    gsap.fromTo(visual, { rotateY: flip? -22: 22, rotateX: 6, y: 80, opacity: 0 },
      { rotateY:0, rotateX:0, y:0, opacity:1, ease:"none",
        scrollTrigger:{ trigger: ex, start:"top 88%", end:"top 30%", scrub:.5 } });
    gsap.from($(".stamp", ex), {
      scale: 2.6, opacity: 0, rotate: 8, duration: .55, ease: "back.out(2.5)",
      scrollTrigger:{ trigger: ex, start:"top 62%" }
    });
    gsap.from($$(".ex-copy > *:not(.stamp)", ex), {
      opacity:0, y:30, duration:.9, stagger:.09, ease:"power3.out",
      scrollTrigger:{ trigger: ex, start:"top 58%" }
    });
  });

  /* SCENE 5 — findings */
  gsap.from(".finding", {
    opacity:0, y:50, duration:.9, stagger:{ each:.08, grid:"auto" }, ease:"power3.out",
    scrollTrigger:{ trigger:"#findingsGrid", start:"top 78%" }
  });

  /* SCENE 6 — testimony */
  gsap.to("#logfill", {
    scaleY:1, ease:"none",
    scrollTrigger:{ trigger:".log", start:"top 70%", end:"bottom 60%", scrub:.5 }
  });
  $$(".logline").forEach(l => gsap.from(l, {
    opacity:0, x:-36, duration:.9, ease:"power3.out",
    scrollTrigger:{ trigger:l, start:"top 76%" }
  }));

  /* SCENE 7 — adverse loop (the showpiece) */
  const phases = $$(".adv-phase");
  const showPhase = idx => phases.forEach((p,i) => {
    gsap.to(p, { opacity: i===idx?1:0, y: i===idx?0:(i<idx?-30:30), duration:.45, overwrite:"auto" });
  });
  const segs = [ [0,.16], [.16,.30], [.30,.44], [.44,.58], [.58,.78], [.78,1.01] ];
  ScrollTrigger.create({
    trigger:"#adverse", start:"top top", end:"+=420%", pin:"#adverse .pinwrap", scrub:true,
    onEnter(){ if(engine){ engine.setState("ring"); engine.alpha(1,1.2); engine.heat(.2); engine.spinTarget=.35; } },
    onEnterBack(){ if(engine){ engine.setState("line"); engine.alpha(1,1); } },
    onLeave(){ if(engine){ engine.setState("nebula"); engine.alpha(.5,1.4); engine.heat(.14); engine.spinTarget=0; } },
    onLeaveBack(){ if(engine){ engine.setState("nebula"); engine.alpha(.55,1.4); engine.heat(.14); engine.spinTarget=0; } },
    onUpdate(self){
      const p = self.progress;
      let idx = segs.findIndex(([a,b]) => p>=a && p<b); if (idx<0) idx = segs.length-1;
      if (self._idx !== idx){
        self._idx = idx;
        showPhase(idx);
        if (engine){
          if (idx<=3){ engine.setState("ring"); engine.spinTarget = .35 + idx*.5; engine.heat(.18 + idx*.16); }
          if (idx===4){ engine.setState("line"); engine.burst(26); engine.heat(1); engine.spinTarget=0; }
          if (idx===5){ engine.setState("line"); engine.heat(.5); }
        }
      }
    }
  });

  /* SCENE 8 — cross-exam */
  $$(".qa-item").forEach(item => {
    gsap.from($(".q", item), { opacity:0, x:-50, scale:1.06, duration:.8, ease:"power3.out",
      scrollTrigger:{ trigger:item, start:"top 74%" } });
    gsap.from($(".a", item), { opacity:0, y:30, duration:.9, delay:.12, ease:"power3.out",
      scrollTrigger:{ trigger:item, start:"top 74%" } });
  });

  /* SCENE 9 — verdict */
  ScrollTrigger.create({
    trigger:"#verdict", start:"top 60%",
    onEnter(){ if(engine){ engine.setState("yours"); engine.alpha(.7,1.4); engine.heat(.5); } },
    onLeaveBack(){ if(engine){ engine.setState("nebula"); engine.alpha(.5,1.2); engine.heat(.14); } }
  });
  gsap.from(".verdict-stage > *", {
    opacity:0, y:44, duration:1, stagger:.12, ease:"power3.out",
    scrollTrigger:{ trigger:"#verdict", start:"top 55%" }
  });
} else {
  /* reduced / no-gsap fallback: show everything */
  $$(".rv,.kicker,.coverquote,.scrollcue").forEach(e => { e.style.opacity=1; e.style.transform="none"; });
}

/* ───────────────────────── agent log live feed ───────────────────────── */
const logMsgs = [
  ["agent","lead #1182 enriched · source: instagram · confidence 0.93"],
  ["agent","follow-up drafted · tone: founder-to-founder · queued 09:00 IST"],
  ["agent","duplicate detected across 2 channels · merged, not re-messaged"],
  ["human","approved: invoice action · agent resumes"],
  ["agent","daily summary written · 14 changes · reasoning attached"]
];
const logEl = $("#agentlog");
if (logEl){
  let li=0;
  setInterval(() => {
    if (document.hidden) return;
    const m = logMsgs[li++ % logMsgs.length];
    const d = document.createElement("div");
    d.className="lnn";
    d.innerHTML = `<b>${m[0]}</b> » ${m[1]}`;
    logEl.appendChild(d);
    while (logEl.children.length > 4) logEl.removeChild(logEl.firstChild);
  }, 2300);
}

/* ───────────────────────── the verdict (the reader's move) ───────────────────────── */
const input = $("#verdictInput"), zone = $("#stampzone");
let stamps = 0;
if (input) input.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const text = input.value.trim();
  if (!text || stamps > 5) return;
  stamps++;
  const st = document.createElement("div");
  st.className = "stamped";
  st.textContent = text;
  const rot = (Math.random()*22-11).toFixed(1);
  st.style.left = (12 + Math.random()*46) + "%";
  st.style.top  = (16 + Math.random()*55) + "%";
  zone.appendChild(st);
  if (window.gsap){
    gsap.fromTo(st, { scale:3.4, opacity:0, rotate:rot }, { scale:1, opacity:1, rotate:rot, duration:.38, ease:"power4.in" });
    gsap.fromTo("#verdict .pinwrap", { x:0 }, { x:6, duration:.05, repeat:7, yoyo:true, delay:.36, clearProps:"x" });
    if (engine) setTimeout(() => engine.burst(34), 380);
  } else { st.style.transform = `rotate(${rot}deg)`; }
  input.value = "";
  input.placeholder = "noted. the file remembers.";
});
})();
