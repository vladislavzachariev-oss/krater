/* KRÁTER — ukázka stránky energetického nápoje (verze 2, vrstvené fotografie).
   Scéna = pozadí kráteru, záře, obří název, plechovka, ovoce a kameny jako samostatné obrázky.
   Přechody mezi příchutěmi běží přes Motion (motion.dev), klidový pohyb a paralaxa přes requestAnimationFrame.
   Původní 3D verze (three.js) je ve složce _v1-3d. */
(() => {
'use strict';

const FLAVORS = [
  {
    key: 'grep', name: 'ŽHAVÝ GREP', num: '01',
    accent: '#ff5a1f', hue: 0,
    kicker: 'Roztavená energie<br>na dlouhé noci',
    desc: 'Růžový grep, krvavý pomeranč a kapka chilli. Nejdřív to zahřeje, pak to probudí.',
    notes: 'grep · pomeranč · chilli',
    // x, y = střed kusu vůči středu plechovky (jednotka u = 1 % výšky okna), w = šířka v u, r = otočení, z < 0 = za plechovkou
    pieces: [
      { src: 'fruit_grep_1', x: -23, y: -12, w: 22, r: -14, z: 1 },
      { src: 'fruit_grep_2', x: 22, y: 6, w: 19, r: 16, z: 1.2 },
      { src: 'fruit_grep_3', x: 19, y: -23, w: 13, r: 24, z: -1 },
      { src: 'fruit_grep_4', x: -19, y: 15, w: 17, r: -28, z: 1.5 },
    ],
  },
  {
    key: 'plazma', name: 'MODRÁ PLAZMA', num: '02',
    accent: '#2f86ff', hue: 203,
    kicker: 'Studený výboj<br>na ranní start',
    desc: 'Borůvky a citron s ostrým, chladivým koncem. Na rána, kdy se nechce vstávat.',
    notes: 'borůvka · citron · máta',
    pieces: [
      { src: 'fruit_plazma_2', x: -23, y: -12, w: 21, r: -10, z: 1 },
      { src: 'fruit_plazma_1', x: 20, y: -22, w: 14, r: 18, z: -0.7 },
      { src: 'fruit_plazma_3', x: 17, y: 6, w: 7.5, r: 10, z: 1.4 },
      { src: 'fruit_plazma_4', x: -15, y: 14, w: 6.5, r: -20, z: 1.6 },
      { src: 'fruit_plazma_6', x: 26, y: -6, w: 5.5, r: 30, z: -1 },
      { src: 'fruit_plazma_5', x: 22, y: 17, w: 12, r: -15, z: 1.3 },
    ],
  },
  {
    key: 'nebula', name: 'TEMNÁ NEBULA', num: '03',
    accent: '#a259ff', hue: 251,
    kicker: 'Tichá síla<br>na dlouhé soustředění',
    desc: 'Černý rybíz, ostružiny a limetka. Tmavé, hladké a lehce kyselé. Na hodiny, kdy potřebujete klid v hlavě.',
    notes: 'černý rybíz · ostružina · limetka',
    pieces: [
      { src: 'fruit_nebula_2', x: 23, y: -10, w: 21, r: 12, z: 1 },
      { src: 'fruit_nebula_1', x: -21, y: -22, w: 13, r: -16, z: -0.8 },
      { src: 'fruit_nebula_4', x: -20, y: 9, w: 13, r: -8, z: 1.3 },
      { src: 'fruit_nebula_3', x: 16, y: 15, w: 8, r: 12, z: 1.5 },
      { src: 'fruit_nebula_5', x: -26, y: -4, w: 6.5, r: -24, z: -1 },
    ],
  },
];

const M = window.Motion || {};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const stage = $('#stage');
let current = 0;
let busy = false;
let accentNow = FLAVORS[0].accent;

/* ---------- Motion s pojistkou: bez knihovny (nebo s omezeným pohybem) se rovnou nastaví konečný stav ---------- */
async function anim(els, keyframes, opts) {
  const list = [].concat(els).filter(Boolean);
  if (!list.length) return;
  if (reduce || !M.animate) {
    list.forEach((el) => Object.entries(keyframes).forEach(([k, v]) => { el.style[k] = [].concat(v).at(-1); }));
    return;
  }
  const a = M.animate(list, keyframes, opts);
  try { await (a.finished || a); } catch (e) { /* zrušeno */ }
}

/* ---------- stavba scény ---------- */
const el = (cls, tag = 'div') => Object.assign(document.createElement(tag), { className: cls });
const img = (src, cls) => {
  const i = new Image();
  i.decoding = 'async';
  i.alt = '';
  i.draggable = false;
  if (cls) i.className = cls;
  i.src = src;
  return i;
};

const narrow = matchMedia('(max-width: 760px)');
const bgSrc = (f) => `img/bg_${f.key}${narrow.matches ? '_m' : ''}.jpg`;

const bgWrap = el('layer bg');
const plates = FLAVORS.map((f, i) => {
  const p = img(bgSrc(f), 'plate');
  p.style.opacity = i === 0 ? '1' : '0';
  bgWrap.append(p);
  return p;
});

const glow = el('glow');
const ghost = el('ghost');
ghost.textContent = FLAVORS[0].name;
const sparks = el('sparks', 'canvas');

/* plechovka: slot (vznášení + paralaxa) > obal (přechody Motion) > fotka; stín a protisvětlo dělají
   pseudo-elementy obalu, maskované tvarem téže fotky */
const canSlot = el('can-slot');
const cans = FLAVORS.map((f, i) => {
  const wrap = el('can');
  const src = `img/can_${f.key}.webp`;
  wrap.style.setProperty('--mask', `url(${src})`);
  wrap.style.setProperty('--accent', f.accent);
  wrap.append(img(src));
  wrap.style.opacity = i === 0 ? '1' : '0';
  canSlot.append(wrap);
  return wrap;
});
const shadow = el('can-shadow');

const rocks = el('rocks');
[['rocks_2', 'r-left'], ['rocks_1', 'r-mid'], ['rocks_3', 'r-right']].forEach(([s, c]) => rocks.append(img(`img/${s}.webp`, c)));

/* ovoce: každý kus = slot (vznášení, paralaxa) > img (přechody Motion) */
const sets = FLAVORS.map((f, fi) => f.pieces.map((p, k) => {
  const slot = el(`piece ${p.z < 0 ? 'back' : 'front'}${p.z >= 1.5 ? ' near' : ''}`);
  slot.append(img(`img/${p.src}.webp`));
  slot._p = p;
  slot._phase = k * 1.7 + fi;
  slot.style.visibility = fi === 0 ? 'visible' : 'hidden';
  return slot;
}));
const all = sets.flat();

stage.append(bgWrap, glow, ghost, sparks, ...all.filter((s) => s.classList.contains('back')),
  shadow, canSlot, rocks, ...all.filter((s) => s.classList.contains('front')), el('vignette'), el('grain'));

/* ---------- rozměry: jednotka u podle okna ---------- */
let U = 6, anchorX = 0, anchorY = 0;
function layout() {
  const w = innerWidth, h = innerHeight, phone = narrow.matches;
  U = phone ? Math.min(h / 100, w / 52) : Math.min(h / 100, w / 160);
  const canH = (phone ? 50 : 62) * U;
  const baseY = h * (phone ? 0.72 : 0.88);
  anchorX = w / 2;
  anchorY = baseY - canH / 2;                       // střed plechovky
  root.style.setProperty('--u', `${U}px`);
  root.style.setProperty('--can-h', `${canH}px`);
  root.style.setProperty('--ax', `${anchorX}px`);
  root.style.setProperty('--ay', `${anchorY}px`);
  root.style.setProperty('--base', `${baseY}px`);
  const kx = phone ? 0.8 : 1.08, ky = phone ? 0.9 : 1.05, kw = phone ? 0.85 : 1.15;
  all.forEach((s) => {
    const p = s._p;
    s.style.width = `${p.w * U * kw}px`;
    s._x = anchorX + p.x * U * kx;
    s._y = anchorY + p.y * U * ky;
  });
  plates.forEach((p, i) => { const want = bgSrc(FLAVORS[i]); if (!p.src.endsWith(want)) p.src = want; });
  sizeSparks();
}

/* ---------- klidový pohyb + paralaxa ---------- */
let mx = 0, my = 0, tmx = 0, tmy = 0;
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  tmx = (e.clientX / innerWidth - 0.5) * 2;
  tmy = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

function tick(t) {
  const s = t / 1000, k = reduce ? 0 : 1;
  mx += (tmx - mx) * 0.05;
  my += (tmy - my) * 0.05;
  bgWrap.style.transform = `translate3d(${-mx * 12 * k}px, ${-my * 7 * k}px, 0) scale(1.05)`;
  ghost.style.transform = `translate3d(calc(-50% + ${-mx * 18 * k}px), calc(-50% + ${-my * 8 * k}px), 0)`;
  const fy = Math.sin(s * 0.9) * 0.8 * U * k;
  canSlot.style.transform = `translate3d(${mx * 8 * k}px, ${fy + my * 5 * k}px, 0) rotate(${Math.sin(s * 0.6) * 0.7 * k}deg)`;
  shadow.style.transform = `translate(-50%, -50%) scale(${1 - fy / (U * 25)})`;
  rocks.style.transform = `translate3d(${mx * 16 * k}px, ${my * 6 * k}px, 0)`;
  for (const p of sets[current]) {
    const d = p._p, ph = p._phase;
    const bob = Math.sin(s * (0.7 + ph * 0.05) + ph) * U * 0.9 * k;
    const sway = Math.cos(s * 0.5 + ph) * 3 * k;
    p.style.transform = `translate3d(${p._x + mx * 20 * d.z * k}px, ${p._y + bob + my * 10 * d.z * k}px, 0) translate(-50%, -50%) rotate(${d.r + sway}deg)`;
  }
  drawSparks(s);
  requestAnimationFrame(tick);
}

/* ---------- jiskry: drobný prach stoupající ze záře ---------- */
let sctx, sparkList = [], lastS = 0;
function sizeSparks() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  sparks.width = innerWidth * dpr;
  sparks.height = innerHeight * dpr;
  sctx = sparks.getContext('2d');
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sparkList = Array.from({ length: reduce ? 0 : (narrow.matches ? 24 : 46) }, () => newSpark(true));
}
function newSpark(anywhere) {
  return {
    x: anchorX + (Math.random() - 0.5) * innerWidth * 0.7,
    y: anywhere ? innerHeight * (0.15 + Math.random() * 0.8) : innerHeight * (0.6 + Math.random() * 0.3),
    r: 0.5 + Math.random() * 1.5, v: 6 + Math.random() * 16, a: 0.15 + Math.random() * 0.5, w: Math.random() * 6.28,
  };
}
function drawSparks(s) {
  if (!sctx || !sparkList.length) return;
  const dt = Math.min(0.05, s - lastS || 0.016), H = innerHeight;
  lastS = s;
  sctx.clearRect(0, 0, innerWidth, H);
  sctx.fillStyle = accentNow;
  for (const p of sparkList) {
    p.y -= p.v * dt;
    p.x += Math.sin(s + p.w) * 4 * dt;
    if (p.y < H * 0.12) Object.assign(p, newSpark(false));
    const fade = Math.min(1, (p.y - H * 0.12) / (H * 0.2));
    sctx.globalAlpha = Math.max(0, p.a * fade * (0.6 + 0.4 * Math.sin(s * 3 + p.w)));
    sctx.beginPath();
    sctx.arc(p.x, p.y, p.r, 0, 6.283);
    sctx.fill();
  }
  sctx.globalAlpha = 1;
}

/* ---------- texty a ovládání ---------- */
async function swapCopy(f) {
  const els = [...document.querySelectorAll('.swap')];
  await anim(els, { opacity: [1, 0], transform: ['translateY(0px)', 'translateY(-10px)'] }, { duration: 0.28, ease: [0.4, 0, 1, 1] });
  $('#kicker').innerHTML = f.kicker;
  $('#desc').textContent = f.desc;
  $('#notes').textContent = f.notes;
  await anim(els, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] },
    { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: M.stagger && !reduce ? M.stagger(0.07) : 0 });
}

function syncChrome(i) {
  const f = FLAVORS[i];
  accentNow = f.accent;
  root.style.setProperty('--accent', f.accent);
  root.style.setProperty('--hue', `${f.hue}deg`);
  document.querySelectorAll('.flavors button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  $('#num').textContent = f.num;
  $('#bar').style.width = `${((i + 1) / FLAVORS.length) * 100}%`;
}

/* ---------- přepnutí příchuti ---------- */
const ease = { out: [0.16, 1, 0.3, 1], in: [0.7, 0, 0.84, 0], inOut: [0.65, 0, 0.35, 1] };

async function setFlavor(i, dir = 1) {
  if (busy || i === current) return;
  busy = true;
  const from = current, f = FLAVORS[i];
  syncChrome(i);
  swapCopy(f);

  // pozadí se prolne
  anim(plates[i], { opacity: [0, 1] }, { duration: 1.2, ease: ease.inOut });
  anim(plates[from], { opacity: [1, 0] }, { duration: 1.2, ease: ease.inOut });

  // obří název se rozplyne a složí znovu
  anim(ghost, { opacity: [1, 0], letterSpacing: ['0em', '0.06em'] }, { duration: 0.4, ease: ease.in })
    .then(() => { ghost.textContent = f.name; return anim(ghost, { opacity: [0, 1], letterSpacing: ['-0.05em', '0em'] }, { duration: 1, ease: ease.out }); });

  // staré ovoce odletí od plechovky
  sets[from].forEach((p) => {
    const d = p._p, len = Math.hypot(d.x, d.y) || 1;
    const dx = (d.x / len) * 26 * U, dy = (d.y / len) * 18 * U;
    anim(p.firstChild, {
      opacity: [1, 0], filter: ['blur(0px)', 'blur(6px)'],
      transform: ['translate(0px, 0px) scale(1) rotate(0deg)', `translate(${dx}px, ${dy}px) scale(0.7) rotate(${dir * 35}deg)`],
    }, { duration: 0.55, ease: ease.in });
  });

  // stará plechovka odjede stranou; nová vyjede dřív, než stará zmizí, aby scéna nebyla ani na chvíli prázdná
  const leaving = anim(cans[from], {
    opacity: [1, 0], filter: ['blur(0px)', 'blur(6px)'],
    transform: ['translate(0px, 0px) rotate(0deg) scale(1)', `translate(${-dir * 30 * U}px, ${4 * U}px) rotate(${-dir * 9}deg) scale(0.92)`],
  }, { duration: 0.6, ease: ease.in });
  if (!reduce) await new Promise((r) => setTimeout(r, 260));
  current = i;
  leaving.then(() => { if (current !== from) sets[from].forEach((p) => { p.style.visibility = 'hidden'; }); });

  // nové ovoce přiletí
  sets[i].forEach((p, k) => {
    const d = p._p;
    p.style.visibility = 'visible';
    anim(p.firstChild, {
      opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'],
      transform: [`translate(${dir * 28 * U - d.x * U * 0.4}px, ${6 * U - d.y * U * 0.4}px) scale(0.45) rotate(${-dir * 60}deg)`, 'translate(0px, 0px) scale(1) rotate(0deg)'],
    }, { duration: 1.1, ease: ease.out, delay: 0.05 + k * 0.06 });
  });

  // nová plechovka přijede z druhé strany
  await anim(cans[i], {
    opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'],
    transform: [`translate(${dir * 30 * U}px, ${4 * U}px) rotate(${dir * 9}deg) scale(0.92)`, 'translate(0px, 0px) rotate(0deg) scale(1)'],
  }, { duration: 1, ease: ease.out });
  await leaving;
  busy = false;
}

function wireControls() {
  const go = (i, dir) => { const n = FLAVORS.length; setFlavor((i + n) % n, dir); };
  let auto = reduce ? null : setInterval(() => go(current + 1, 1), 7000);
  const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };
  $('.prev').addEventListener('click', () => { stopAuto(); go(current - 1, -1); });
  $('.next').addEventListener('click', () => { stopAuto(); go(current + 1, 1); });
  document.querySelectorAll('.flavors button').forEach((b) => b.addEventListener('click', () => {
    stopAuto();
    const i = +b.dataset.i;
    go(i, i >= current ? 1 : -1);
  }));
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stopAuto(); go(current + 1, 1); }
    if (e.key === 'ArrowLeft') { stopAuto(); go(current - 1, -1); }
  });
  let x0 = null;
  addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) { stopAuto(); go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
  });
  let toastTimer;
  $('#order').addEventListener('click', () => {
    const t = $('#toast');
    t.textContent = 'Tohle je ukázka, objednávky tu zapnuté nejsou.';
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
  });
}

/* ---------- úvod: počkat na obrázky první příchuti, pak scénu odhalit ---------- */
async function intro() {
  const first = [plates[0], ...cans[0].querySelectorAll('img'), ...rocks.querySelectorAll('img'), ...sets[0].map((s) => s.firstChild)];
  await Promise.all(first.map((i) => (i.decode ? i.decode().catch(() => {}) : null)));
  document.body.classList.add('ready');
  anim(bgWrap, { opacity: [0, 1] }, { duration: 1.4, ease: ease.out });
  anim(glow, { opacity: [0, 1] }, { duration: 2, ease: ease.out, delay: 0.3 });
  anim(rocks, { opacity: [0, 1] }, { duration: 1.2, ease: ease.out, delay: 0.2 });
  anim(cans[0], { opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'], transform: [`translateY(${16 * U}px) scale(0.96)`, 'translateY(0px) scale(1)'] },
    { duration: 1.3, ease: ease.out, delay: 0.35 });
  sets[0].forEach((p, k) => anim(p.firstChild, {
    opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'], transform: ['scale(0.5) rotate(-30deg)', 'scale(1) rotate(0deg)'],
  }, { duration: 1.2, ease: ease.out, delay: 0.7 + k * 0.08 }));
  anim(ghost, { opacity: [0, 1] }, { duration: 1.6, ease: ease.out, delay: 0.5 });
  anim([...document.querySelectorAll('.ui > *')], { opacity: [0, 1] }, { duration: 1, ease: ease.out, delay: 0.9 });
}

layout();
addEventListener('resize', layout);
narrow.addEventListener('change', layout);
syncChrome(0);
wireControls();
requestAnimationFrame(tick);
intro();
window.__krater = { setFlavor: (i) => setFlavor(i, i >= current ? 1 : -1), get current() { return current; } };
})();
