/* ═══════════ FX v1 — moteur d'animations canvas + sons synthétisés + graphiques ═══════════
 * Deux calques canvas :
 *   #fxCanvas  (fond)  : ambiance météo (pluie, neige, soleil, chaleur) + étoiles
 *   #fxTop     (dessus): confettis physiques, pluie de billets, billets volants, étincelles
 * + FX.sound() : bips synthétisés WebAudio (aucun fichier externe)
 * + FX.chart() : graphiques ligne animés (morphing fluide entre jeux de données)
 * Tout respecte FX.configure({sound, particles, reduced}).
 */
const FX = (() => {
  let cfg = { sound: true, particles: true, reduced: false };
  let bg = null, bgc = null, top = null, topc = null;
  let W = 0, H = 0, DPR = 1;
  let raf = 0, last = 0, running = false;
  let weather = null;            // 'sun' | 'rain' | 'snow' | 'heat' | null
  let weatherAlpha = 0;          // fondu d'apparition
  let ambient = [];              // particules d'ambiance
  let stars = [];
  let bursts = [];               // confettis / billets / étincelles
  let audio = null, masterGain = null, audioReady = false;
  const prefersReduced = () => (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function reduced() { return cfg.reduced || prefersReduced(); }

  function ensureCanvas() {
    if (bg) return true;
    bg = document.getElementById('fxCanvas');
    top = document.getElementById('fxTop');
    if (!bg || !top) return false;
    bgc = bg.getContext('2d');
    topc = top.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    return true;
  }
  function resize() {
    if (!bg || !top) return;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    [bg, top].forEach(c => { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    if (bgc) bgc.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (topc) topc.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
  }
  function buildStars() {
    stars = [];
    const n = Math.round(Math.min(70, W / 22));
    for (let i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.42, r: Math.random() * 1.2 + 0.3, p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.1 });
  }

  function start() {
    if (running || !ensureCanvas()) return;
    running = true; last = performance.now();
    const loop = t => {
      if (!running) return;
      const dt = Math.min(64, t - last); last = t;
      if (!document.hidden) { drawBg(dt, t); drawTop(dt); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* ── Ambiance météo ── */
  function spawnAmbient() {
    ambient = [];
    if (!weather) return;
    if (weather === 'rain') {
      const n = Math.round(Math.min(130, W / 11));
      for (let i = 0; i < n; i++) ambient.push({ x: Math.random() * (W + 200) - 100, y: Math.random() * H, l: 9 + Math.random() * 14, v: 340 + Math.random() * 260, a: 0.14 + Math.random() * 0.2 });
    } else if (weather === 'snow') {
      const n = Math.round(Math.min(90, W / 15));
      for (let i = 0; i < n; i++) ambient.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.4, v: 22 + Math.random() * 40, ph: Math.random() * Math.PI * 2, sw: 12 + Math.random() * 26, a: 0.35 + Math.random() * 0.5 });
    } else if (weather === 'sun') {
      const n = Math.round(Math.min(46, W / 30));
      for (let i = 0; i < n; i++) ambient.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2, v: 5 + Math.random() * 14, ph: Math.random() * Math.PI * 2, a: 0.08 + Math.random() * 0.22 });
    } else if (weather === 'heat') {
      const n = Math.round(Math.min(40, W / 34));
      for (let i = 0; i < n; i++) ambient.push({ x: Math.random() * W, y: H * (0.55 + Math.random() * 0.5), r: 1 + Math.random() * 2.6, v: -(14 + Math.random() * 30), ph: Math.random() * Math.PI * 2, a: 0.07 + Math.random() * 0.16, life: Math.random() });
    }
  }

  function drawBg(dt, t) {
    if (!bgc) return;
    bgc.clearRect(0, 0, W, H);
    const dtS = dt / 1000;
    // étoiles scintillantes (toujours, très discrètes)
    if (cfg.particles && !reduced()) {
      for (const s of stars) {
        const tw = 0.35 + 0.3 * Math.sin(t / 900 * s.s + s.p);
        bgc.globalAlpha = tw * 0.5;
        bgc.fillStyle = '#cfe3ef';
        bgc.beginPath(); bgc.arc(s.x, s.y, s.r, 0, 6.2832); bgc.fill();
      }
      bgc.globalAlpha = 1;
    }
    if (!cfg.particles || reduced()) { weatherAlpha = 0; return; }
    const target = weather ? 1 : 0;
    weatherAlpha += (target - weatherAlpha) * Math.min(1, dtS * 1.6);
    if (weatherAlpha < 0.02 || !weather) { if (!weather) ambient.length = 0; return; }
    bgc.globalAlpha = weatherAlpha;
    if (weather === 'rain') {
      bgc.strokeStyle = 'rgba(140,185,220,1)'; bgc.lineWidth = 1.1; bgc.lineCap = 'round';
      for (const p of ambient) {
        p.y += p.v * dtS; p.x -= p.v * 0.16 * dtS;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * (W + 200) - 100; }
        bgc.globalAlpha = weatherAlpha * p.a;
        bgc.beginPath(); bgc.moveTo(p.x, p.y); bgc.lineTo(p.x + p.l * 0.16, p.y - p.l); bgc.stroke();
      }
    } else if (weather === 'snow') {
      bgc.fillStyle = '#eef6fb';
      for (const p of ambient) {
        p.ph += dtS * 1.4; p.y += p.v * dtS; p.x += Math.sin(p.ph) * p.sw * dtS;
        if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
        if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
        bgc.globalAlpha = weatherAlpha * p.a;
        bgc.beginPath(); bgc.arc(p.x, p.y, p.r, 0, 6.2832); bgc.fill();
      }
    } else if (weather === 'sun') {
      for (const p of ambient) {
        p.ph += dtS * 0.8; p.y -= p.v * dtS * 0.35; p.x += Math.sin(p.ph) * 7 * dtS;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        bgc.globalAlpha = weatherAlpha * p.a * (0.6 + 0.4 * Math.sin(p.ph * 2));
        bgc.fillStyle = '#f3d9a0';
        bgc.beginPath(); bgc.arc(p.x, p.y, p.r, 0, 6.2832); bgc.fill();
      }
    } else if (weather === 'heat') {
      for (const p of ambient) {
        p.ph += dtS * 2; p.y += p.v * dtS; p.life += dtS * 0.25;
        if (p.y < H * 0.35 || p.life > 1) { p.y = H * (0.7 + Math.random() * 0.35); p.x = Math.random() * W; p.life = 0; }
        bgc.globalAlpha = weatherAlpha * p.a * (1 - p.life);
        bgc.fillStyle = '#e8a04b';
        bgc.beginPath(); bgc.arc(p.x + Math.sin(p.ph) * 9, p.y, p.r, 0, 6.2832); bgc.fill();
      }
    }
    bgc.globalAlpha = 1;
  }

  /* ── Éclats : confettis, billets, étincelles ── */
  const COLORS = ['#e8b04b', '#f3c76e', '#4bb380', '#54a3d8', '#e0873f', '#d45a4a', '#c58ae0'];
  function confetti(opts) {
    if (reduced() || !cfg.particles) return;
    if (!ensureCanvas()) return;
    start();
    const o = opts || {};
    const cx = o.x != null ? o.x : W / 2, cy = o.y != null ? o.y : H * 0.18;
    const n = Math.min(o.count || 90, 160), power = o.power || 1;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, sp = (120 + Math.random() * 420) * power;
      bursts.push({
        k: 'c', x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 160 * power,
        w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 12,
        col: COLORS[(Math.random() * COLORS.length) | 0], life: 2.4 + Math.random() * 1.2, t: 0
      });
    }
    capBursts(560);
  }
  function moneyRain() {
    if (reduced() || !cfg.particles) return;
    if (!ensureCanvas()) return;
    start();
    for (let i = 0; i < 46; i++) {
      bursts.push({
        k: 'b', x: Math.random() * W, y: -30 - Math.random() * H * 0.6,
        vx: (Math.random() - 0.5) * 40, vy: 90 + Math.random() * 160,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 5,
        size: 16 + Math.random() * 16, life: 4.5, t: 0, txt: Math.random() < 0.7 ? '€' : '💶'
      });
    }
    capBursts(560);
  }
  function moneyFly(x, y) {
    if (reduced() || !cfg.particles) return;
    if (!ensureCanvas()) return;
    start();
    const cx = x != null ? x : W / 2, cy = y != null ? y : H * 0.6;
    for (let i = 0; i < 16; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.7, sp = 180 + Math.random() * 280;
      bursts.push({
        k: 'b', x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8,
        size: 14 + Math.random() * 12, life: 1.5 + Math.random() * 0.6, t: 0, txt: '€', grav: 260
      });
    }
    capBursts(560);
  }
  function spark(x, y, color, n) {
    if (reduced() || !cfg.particles) return;
    if (!ensureCanvas()) return;
    start();
    for (let i = 0; i < (n || 10); i++) {
      const ang = Math.random() * 6.2832, sp = 40 + Math.random() * 150;
      bursts.push({ k: 's', x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 1 + Math.random() * 2.2, col: color || '#f3c76e', life: 0.5 + Math.random() * 0.5, t: 0 });
    }
    capBursts(560);
  }
  function capBursts(max) { if (bursts.length > max) bursts.splice(0, bursts.length - max); }

  function drawTop(dt) {
    if (!topc) return;
    topc.clearRect(0, 0, W, H);
    if (!bursts.length) return;
    const dtS = dt / 1000;
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.t += dtS;
      if (p.t >= p.life) { bursts.splice(i, 1); continue; }
      const k = 1 - p.t / p.life;
      if (p.k === 'c') {
        p.vy += 420 * dtS; p.vx *= 1 - 1.1 * dtS; p.vy *= 1 - 0.35 * dtS;
        p.x += p.vx * dtS; p.y += p.vy * dtS; p.rot += p.vr * dtS;
        topc.save(); topc.translate(p.x, p.y); topc.rotate(p.rot);
        topc.globalAlpha = Math.min(1, k * 2.2);
        topc.fillStyle = p.col;
        topc.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.55 + 0.45 * Math.abs(Math.sin(p.rot * 1.7))));
        topc.restore();
      } else if (p.k === 'b') {
        p.vy += (p.grav || 120) * dtS; p.x += p.vx * dtS + Math.sin(p.t * 3 + p.rot) * 22 * dtS; p.y += p.vy * dtS; p.rot += p.vr * dtS;
        if (p.y > H + 40) { bursts.splice(i, 1); continue; }
        topc.save(); topc.translate(p.x, p.y); topc.rotate(Math.sin(p.rot) * 0.5);
        topc.globalAlpha = Math.min(1, k * 2.5);
        topc.font = '800 ' + p.size + 'px "IBM Plex Mono", monospace';
        topc.fillStyle = '#f3c76e';
        topc.shadowColor = 'rgba(232,176,75,.55)'; topc.shadowBlur = 10;
        topc.fillText(p.txt || '€', -p.size / 3, 0);
        topc.restore();
      } else {
        p.x += p.vx * dtS; p.y += p.vy * dtS; p.vx *= 1 - 2 * dtS; p.vy *= 1 - 2 * dtS;
        topc.globalAlpha = k;
        topc.fillStyle = p.col;
        topc.beginPath(); topc.arc(p.x, p.y, p.r * k + 0.4, 0, 6.2832); topc.fill();
      }
    }
    topc.globalAlpha = 1;
  }

  /* ── Sons synthétisés (WebAudio, aucun asset) ── */
  const SND = {
    click:  { type:'square',   seq:[[740,0,.045]], vol:.16 },
    back:   { type:'square',   seq:[[520,0,.05]],  vol:.12 },
    buy:    { type:'triangle', seq:[[523,0,.06],[784,.055,.09]], vol:.3 },
    sell:   { type:'triangle', seq:[[659,0,.05],[880,.05,.05],[1174,.1,.11]], vol:.28 },
    cash:   { type:'triangle', seq:[[880,0,.05],[1318,.05,.09]], vol:.24 },
    error:  { type:'sawtooth', seq:[[220,0,.09],[150,.08,.14]], vol:.14 },
    warn:   { type:'square',   seq:[[330,0,.07],[262,.08,.1]], vol:.12 },
    level:  { type:'triangle', seq:[[523,0,.09],[659,.09,.09],[784,.18,.09],[1047,.27,.22]], vol:.34 },
    win:    { type:'triangle', seq:[[784,0,.08],[988,.08,.08],[1319,.16,.2]], vol:.3 },
    jail:   { type:'sawtooth', seq:[[392,0,.16],[294,.16,.16],[392,.32,.16],[294,.48,.24]], vol:.16 },
    craft:  { type:'sine',     seq:[[392,0,.05],[523,.04,.07]], vol:.2 },
    eat:    { type:'sine',     seq:[[300,0,.045],[230,.05,.06]], vol:.22 },
    ach:    { type:'triangle', seq:[[659,0,.08],[880,.09,.08],[1319,.18,.26]], vol:.32 },
    bell:   { type:'sine',     seq:[[1047,0,.3]], vol:.14 },
    nfc:    { type:'sine',     seq:[[2093,0,.06],[2093,.09,.06]], vol:.26 },
    nfcOk:  { type:'triangle', seq:[[1319,0,.07],[1760,.09,.14]], vol:.3 }
  };
  const lastPlay = {};
  function sound(name) {
    try {
      if (!cfg.sound || reduced()) return;
      const def = SND[name]; if (!def) return;
      const now = performance.now();
      if (lastPlay[name] && now - lastPlay[name] < 45) return;
      lastPlay[name] = now;
      if (!audio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audio = new AC();
        masterGain = audio.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audio.destination);
      }
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      if (!audioReady) { audioReady = true; }
      const t0 = audio.currentTime + 0.001;
      for (const [freq, off, dur] of def.seq) {
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = def.type; osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0 + off);
        g.gain.exponentialRampToValueAtTime(def.vol, t0 + off + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + dur);
        osc.connect(g); g.connect(masterGain);
        osc.start(t0 + off); osc.stop(t0 + off + dur + 0.03);
      }
    } catch (e) { /* audio non disponible : silencieux */ }
  }

  /* ── Graphiques ligne animés (morphing, reveal, axes, tooltip) ── */
  function chart(cv, data, color, opts) {
    if (!cv || !cv.getContext) return;
    const o = opts || {};
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth || 240, h = cv.clientHeight || 110;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    const c = cv.getContext('2d');
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const src = (data || []).map(v => (typeof v === 'number' && isFinite(v)) ? v : 0);
    const prev = Array.isArray(cv.__fxPrev) ? cv.__fxPrev : null;
    cv.__fxPrev = src.slice();
    if (cv.__fxRaf) cancelAnimationFrame(cv.__fxRaf);

    let from = src.slice();
    if (prev && prev.length && !reduced()) {
      from = src.map((_, i) => {
        const j = prev.length === 1 ? 0 : Math.round(i * (prev.length - 1) / Math.max(1, src.length - 1));
        return prev[Math.min(prev.length - 1, j)];
      });
    } else if (!prev && !reduced()) {
      from = src.map(() => src.length ? src[src.length - 1] : 0);
    }
    const first = !cv.__fxRevealed;
    const t0 = performance.now(), dur = reduced() ? 0 : (o.fast ? 240 : 460);

    function frame(now) {
      const ctx2 = cv.getContext('2d');
      if (!ctx2) return;
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.clearRect(0, 0, w, h);
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - k, 3);
      const vals = src.map((v, i) => from[i] + (v - from[i]) * e);
      const reveal = first ? e : 1;
      drawChartFrame(ctx2, vals, color, w, h, o, reveal, cv.__fxHover);
      cv.__fxLast = { vals, color, w, h, o };
      if (k < 1) cv.__fxRaf = requestAnimationFrame(frame);
      else { cv.__fxRaf = 0; cv.__fxRevealed = true; }
    }
    cv.__fxRaf = requestAnimationFrame(frame);

    /* survol : crosshair + tooltip (une seule fois par canvas) */
    if (!cv.__fxBound && !o.noHover) {
      cv.__fxBound = true;
      cv.style.cursor = 'crosshair';
      cv.addEventListener('mousemove', ev => {
        const L = cv.__fxLast; if (!L || !L.vals || L.vals.length < 2) return;
        const r = cv.getBoundingClientRect();
        const pad = 5;
        const x = ev.clientX - r.left;
        const i = Math.round((x - pad) / ((r.width - pad * 2) / (L.vals.length - 1)));
        cv.__fxHover = Math.max(0, Math.min(L.vals.length - 1, i));
        const ctx3 = cv.getContext('2d');
        if (ctx3) { ctx3.setTransform(dpr, 0, 0, dpr, 0, 0); ctx3.clearRect(0, 0, L.w, L.h); drawChartFrame(ctx3, L.vals, L.color, L.w, L.h, L.o, 1, cv.__fxHover); }
      });
      cv.addEventListener('mouseleave', () => {
        cv.__fxHover = null;
        const L = cv.__fxLast; const ctx3 = cv.getContext('2d');
        if (L && ctx3) { ctx3.setTransform(dpr, 0, 0, dpr, 0, 0); ctx3.clearRect(0, 0, L.w, L.h); drawChartFrame(ctx3, L.vals, L.color, L.w, L.h, L.o, 1, null); }
      });
    }
  }

  function drawChartFrame(c, vals, color, w, h, o, reveal, hover) {
    const pad = 5;
    const fmtV = o.fmt || (v => Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + ' k' : Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2));
    // grille + axes
    c.strokeStyle = 'rgba(255,255,255,.055)';
    c.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      c.beginPath(); c.moveTo(0, Math.round(h * i / 4) + .5); c.lineTo(w, Math.round(h * i / 4) + .5); c.stroke();
    }
    if (!vals || vals.length < 2) {
      c.fillStyle = 'rgba(139,161,172,.5)';
      c.font = '11px "IBM Plex Sans", sans-serif';
      c.fillText('collecte des données…', 8, h / 2);
      return;
    }
    let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (o.zero) { min = Math.min(0, min); max = Math.max(0, max); }
    const span = (max - min) || Math.abs(max) || 1;
    const px = i => pad + i * (w - pad * 2) / (vals.length - 1);
    const py = v => h - pad - ((v - min) / span) * (h - pad * 2 - 4);

    // étiquettes d'axe (max / min)
    c.fillStyle = 'rgba(139,161,172,.55)';
    c.font = '9px "IBM Plex Mono", monospace';
    c.textAlign = 'left';
    c.fillText(fmtV(max), 3, 9);
    c.fillText(fmtV(min), 3, h - 3);

    // reveal clip (premier affichage)
    c.save();
    if (reveal < 1) { c.beginPath(); c.rect(0, 0, Math.max(2, w * reveal), h); c.clip(); }

    // remplissage dégradé
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, hexA(color, 0.22)); grad.addColorStop(1, hexA(color, 0.0));
    c.beginPath();
    c.moveTo(px(0), py(vals[0]));
    for (let i = 1; i < vals.length; i++) {
      const xm = (px(i - 1) + px(i)) / 2;
      c.bezierCurveTo(xm, py(vals[i - 1]), xm, py(vals[i]), px(i), py(vals[i]));
    }
    c.lineTo(px(vals.length - 1), h); c.lineTo(px(0), h); c.closePath();
    c.fillStyle = grad; c.fill();

    // ligne : passe large translucide + cœur lumineux
    const path = () => {
      c.beginPath();
      c.moveTo(px(0), py(vals[0]));
      for (let i = 1; i < vals.length; i++) {
        const xm = (px(i - 1) + px(i)) / 2;
        c.bezierCurveTo(xm, py(vals[i - 1]), xm, py(vals[i]), px(i), py(vals[i]));
      }
    };
    path();
    c.strokeStyle = hexA(color, 0.22); c.lineWidth = 4.5; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
    path();
    c.strokeStyle = color; c.lineWidth = 1.8;
    c.shadowColor = hexA(color, 0.55); c.shadowBlur = 7;
    c.stroke();
    c.shadowBlur = 0;

    // ligne zéro
    if (o.zero && min < 0 && max > 0) {
      c.strokeStyle = 'rgba(255,255,255,.16)'; c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(0, py(0)); c.lineTo(w, py(0)); c.stroke(); c.setLineDash([]);
    }
    c.restore();

    // crosshair + tooltip au survol
    if (hover != null && vals[hover] != null) {
      const hx = px(hover), hy = py(vals[hover]);
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.setLineDash([2, 3]);
      c.beginPath(); c.moveTo(hx, 0); c.lineTo(hx, h); c.stroke(); c.setLineDash([]);
      c.fillStyle = color; c.beginPath(); c.arc(hx, hy, 3.2, 0, 6.2832); c.fill();
      const label = (o.hoverLabel ? o.hoverLabel(hover) : '#' + (hover + 1)) + '  ' + fmtV(vals[hover]);
      c.font = '10px "IBM Plex Mono", monospace';
      const tw = c.measureText(label).width + 12;
      const bx = Math.min(w - tw - 2, Math.max(2, hx - tw / 2));
      const by = Math.max(2, hy - 24);
      c.fillStyle = 'rgba(10,16,19,.92)';
      c.strokeStyle = hexA(color, 0.5); c.lineWidth = 1;
      roundRect(c, bx, by, tw, 17, 4); c.fill(); c.stroke();
      c.fillStyle = '#e9eef1'; c.textAlign = 'left';
      c.fillText(label, bx + 6, by + 12);
    }

    // point final + étiquette de valeur
    const lx = px(vals.length - 1), ly = py(vals[vals.length - 1]);
    const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 380);
    c.fillStyle = hexA(color, 0.25 * pulse * (reveal || 1));
    c.beginPath(); c.arc(lx, ly, 6.5, 0, 6.2832); c.fill();
    c.fillStyle = color;
    c.beginPath(); c.arc(lx, ly, 2.4, 0, 6.2832); c.fill();
    const lv = fmtV(vals[vals.length - 1]);
    c.font = '700 10px "IBM Plex Mono", monospace';
    c.textAlign = 'right';
    c.fillStyle = hexA(color, 0.95);
    c.fillText(lv, w - 3, Math.max(10, Math.min(h - 4, ly - 8)));
    c.textAlign = 'left';
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function hexA(rgb, a) {
    // rgb: 'rgb(r,g,b)' ou '#rrggbb'
    let r = 200, g = 170, b = 90;
    const m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb || '');
    if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    else if (/^#/.test(rgb || '')) {
      const s = rgb.length === 4 ? rgb.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : rgb;
      r = parseInt(s.slice(1, 3), 16); g = parseInt(s.slice(3, 5), 16); b = parseInt(s.slice(5, 7), 16);
    }
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ── API publique ── */
  return {
    configure(c) {
      cfg = Object.assign(cfg, c || {});
      if (masterGain) masterGain.gain.value = cfg.sound ? 0.5 : 0;
      if (!cfg.particles || reduced()) { ambient.length = 0; if (bgc) bgc.clearRect(0, 0, W, H); }
      else start();
      document.documentElement.classList.toggle('reduced-motion', reduced());
      document.documentElement.classList.toggle('no-particles', !cfg.particles);
    },
    settings: () => Object.assign({}, cfg),
    init() { if (ensureCanvas()) start(); },
    setWeather(vis) {
      if (vis !== weather) { weather = vis || null; weatherAlpha = 0; spawnAmbient(); }
      if (weather && cfg.particles && !reduced()) start();
    },
    confetti, moneyRain, moneyFly, spark, chart, sound,
    get running() { return running; },
    stop
  };
})();
