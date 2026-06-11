/* COMPONENT BEHAVIORS — THE SECOND AUDIT (safe without GSAP; respects motion toggle) */
(() => {
"use strict";
const $  = (s,c=document) => c.querySelector(s);
const $$ = (s,c=document) => [...c.querySelectorAll(s)];
const reduced = document.documentElement.classList.contains("reduced");
const once = (el, fn, opts={threshold:.4}) => {
  if (!el) return;
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting){ io.disconnect(); fn(); } }, opts);
  io.observe(el);
};

/* A · dossier: rows type themselves, then the stamp lands */
const dossier = $("#dossierCard");
if (dossier && !reduced){
  const rows = $$(".typein", dossier).map(el => { const t = el.textContent; el.textContent = ""; return [el, t]; });
  once(dossier, () => {
    let i = 0;
    const typeRow = () => {
      if (i >= rows.length){ const st = $("#dossierStamp"); if (st) st.classList.add("show"); return; }
      const [el, text] = rows[i++];
      el.classList.add("typing");
      let c = 0;
      const iv = setInterval(() => {
        c += 2 + Math.floor(Math.random()*2);
        el.textContent = text.slice(0, c);
        if (c >= text.length){ el.textContent = text; el.classList.remove("typing"); clearInterval(iv); setTimeout(typeRow, 60); }
      }, 24);
    };
    typeRow();
  }, {threshold:.5});
} else if (dossier){ const st = $("#dossierStamp"); if (st) st.classList.add("show"); }

/* B · the agent operates the CRM mock */
const crm = $("#crmMain"), agentCur = $("#agentCursor");
if (crm && agentCur && !reduced && window.gsap){
  let visible = false, leads = 47, actions = 12;
  new IntersectionObserver(es => visible = es[0].isIntersecting, {threshold:.35}).observe(crm);
  const logEl = $("#agentlog");
  const pushLog = (who, msg) => {
    if (!logEl) return;
    const d = document.createElement("div");
    d.className = "lnn"; d.innerHTML = `<b>${who}</b> » ${msg}`;
    logEl.appendChild(d);
    while (logEl.children.length > 4) logEl.removeChild(logEl.firstChild);
  };
  const pos = el => {
    const r = el.getBoundingClientRect(), m = crm.getBoundingClientRect();
    return { x: r.left - m.left + r.width*.72, y: r.top - m.top + r.height*.55 };
  };
  const move = el => new Promise(res => { const p = pos(el); gsap.to(agentCur, { x:0, y:0, left:p.x, top:p.y, duration:1.15, ease:"power2.inOut", onComplete:res }); });
  const click = el => { agentCur.classList.add("click"); el && el.classList.add("hl"); setTimeout(() => { agentCur.classList.remove("click"); }, 160); setTimeout(() => el && el.classList.remove("hl"), 1300); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rows = $$(".crm-row", crm), statL = $("#statLeads"), statA = $("#statActions");
  const script = [
    async () => { await move(rows[0]); click(rows[0]); pushLog("agent", `lead #${1180+leads} enriched · source: instagram · confidence 0.9${Math.floor(Math.random()*9)}`); },
    async () => { await move(statL); statL.classList.add("tick"); statL.textContent = ++leads; setTimeout(()=>statL.classList.remove("tick"), 700); },
    async () => { await move(rows[1]); click(rows[1]); pushLog("agent", "follow-up drafted · tone: founder-to-founder · queued 09:00 IST"); },
    async () => { await move(statA); statA.classList.add("tick"); statA.textContent = ++actions; setTimeout(()=>statA.classList.remove("tick"), 700); pushLog("agent", "duplicate detected across 2 channels · merged, not re-messaged"); },
    async () => { await move(rows[2]); pushLog("agent", "approval requested · destructive op · waiting for the human"); await sleep(900); pushLog("human", "approved · agent resumes"); },
  ];
  (async function loop(){
    let step = 0;
    gsap.set(agentCur, { opacity: 0 });
    for(;;){
      if (!visible || document.hidden){ await sleep(700); continue; }
      gsap.to(agentCur, { opacity: 1, duration: .4 });
      await script[step % script.length]();
      step++;
      await sleep(1500);
    }
  })();
}

/* C · remediation composite fires with adverse phase 5 */
const remed = $("#remedPanel");
if (remed){
  const phase5 = $('.adv-phase[data-phase="5"]');
  if (reduced || !phase5){ remed.classList.add("go"); const st=$(".vstamp",remed); if(st) st.classList.add("show"); }
  else {
    setInterval(() => {
      const on = parseFloat(getComputedStyle(phase5).opacity) > .5;
      remed.classList.toggle("go", on);
      const st = $(".vstamp", remed);
      if (st){ if (on) setTimeout(() => st.classList.add("show"), 2200); else st.classList.remove("show"); }
    }, 400);
  }
}

/* E · the vault as a living graph */
const gcv = $("#brainGraph");
if (gcv){
  const ctx = gcv.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 1.6);
  let W, H, nodes = [], links = [], vis = false, t = 0;
  const LABELS = ["PEOPLE","PRUTTO","FRAMEWORKS","FAITH","CLIENTS","JOURNAL"];
  const build = () => {
    W = gcv.clientWidth; H = gcv.clientHeight || 300;
    gcv.width = W*dpr; gcv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes = []; links = [];
    const N = 30;
    for (let i=0;i<N;i++) nodes.push({
      x: 30+Math.random()*(W-60), y: 26+Math.random()*(H-52),
      r: 1.5+Math.random()*2.2, p: Math.random()*Math.PI*2,
      label: i<LABELS.length ? LABELS[i] : null, hub: i===0
    });
    nodes.forEach((n,i) => {
      const near = nodes.map((m,j)=>[Math.hypot(n.x-m.x,n.y-m.y),j]).sort((a,b)=>a[0]-b[0]).slice(1,3);
      near.forEach(([,j]) => { if (!links.some(l=>(l[0]===j&&l[1]===i))) links.push([i,j]); });
    });
  };
  build();
  addEventListener("resize", build);
  new IntersectionObserver(es => vis = es[0].isIntersecting, {threshold:.2}).observe(gcv);
  (function draw(){
    requestAnimationFrame(draw);
    if (!vis || document.hidden) return;
    t += .016;
    ctx.clearRect(0,0,W,H);
    const px = n => n.x + Math.sin(t*.7+n.p)*4, py = n => n.y + Math.cos(t*.55+n.p*1.6)*4;
    ctx.strokeStyle = "rgba(239,233,218,.13)"; ctx.lineWidth = 1;
    links.forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(px(nodes[a]),py(nodes[a])); ctx.lineTo(px(nodes[b]),py(nodes[b])); ctx.stroke(); });
    nodes.forEach(n => {
      const x = px(n), y = py(n);
      if (n.hub){
        const pulse = 5 + Math.sin(t*2.4)*1.6;
        ctx.fillStyle = "rgba(255,178,36,.18)"; ctx.beginPath(); ctx.arc(x,y,pulse+6,0,7); ctx.fill();
        ctx.fillStyle = "#FFB224"; ctx.beginPath(); ctx.arc(x,y,4,0,7); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(239,233,218,.6)"; ctx.beginPath(); ctx.arc(x,y,n.r,0,7); ctx.fill();
      }
      if (n.label){
        ctx.fillStyle = "rgba(124,154,174,.85)";
        ctx.font = "8.5px 'Courier Prime', monospace";
        ctx.fillText(n.label, x+8, y+3);
      }
    });
  })();
}

/* F · the chat plays itself */
const chat = $("#chatPlay");
if (chat){
  const bubs = $$(".bub", chat);
  if (reduced){ /* leave static */ }
  else once(chat, () => {
    chat.classList.add("armed");
    const show = (el, d) => setTimeout(() => el.classList.add("shown"), d);
    const hide = (el, d) => setTimeout(() => el.classList.remove("shown"), d);
    const [sys1, out, typing, inn, sys2] = bubs;
    show(sys1, 300); show(out, 1300); show(typing, 2400); hide(typing, 3900); show(inn, 4000); show(sys2, 4900);
  }, {threshold:.45});
}

/* G · night terminal queue */
const night = $("#nightTerm");
if (night){
  if (reduced) night.classList.add("play");
  else once(night, () => {
    night.classList.add("play");
    const qn = $("#qnum");
    if (qn) setTimeout(() => {
      let n = 0;
      const iv = setInterval(() => { n += 2; if (n >= 38){ n = 38; clearInterval(iv); } qn.textContent = n + "/38"; }, 100);
    }, 2500);
  }, {threshold:.45});
}

/* I · rulings stamp in */
$$(".ruling").forEach(r => {
  if (reduced){ r.classList.add("show"); return; }
  once(r.closest(".qa-item") || r, () => setTimeout(() => r.classList.add("show"), 900), {threshold:.5});
});
})();
