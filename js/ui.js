/* ═══════════ INTERFACE v11 — animations fines, succès, quotidien, classement ═══════════
 * Améliorations :
 *  - moneyFx agrégé (plus de spam visuel), toasts avec icône + barre de vie + clic pour fermer
 *  - compte à rebours générique [data-until] : les vues ne se re-renderent plus pour rien
 *  - graphiques animés (FX.chart), carte bancaire 3D au curseur, transitions d'onglets
 *  - succès, récompense quotidienne, classement serveur, journal filtrable, réglages & aide
 *  - présence/mailbox/annonces : requêtes sûres, ack garanti, clés scopées par joueur
 */
const UI = (() => {
  const el = id => document.getElementById(id);

  const ICONS = {
    vie:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8 L8.5 2.5 L15 8 M4 7 v7 h9 v-7"/></svg>',
    inventaire:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6 h11 v8 H3 Z M3 6 l1.5-3 h8 L14 6 M8.5 6 v8"/></svg>',
    carriere:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="13" height="8" rx="1"/><path d="M6 6 V4.5 a1 1 0 0 1 1-1 h3 a1 1 0 0 1 1 1 V6"/></svg>',
    marche:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5 h11 l-1.2 9 H4.2 Z M6 5 a2.5 2.5 0 0 1 5 0"/></svg>',
    entreprises:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="6" height="12"/><rect x="9" y="7" width="6" height="8"/><path d="M4 6 h2 M4 9 h2 M11 10 h2 M11 12.5 h2"/></svg>',
    banque:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 6 L8.5 2 L15 6 M3 6 v7 M6.8 6 v7 M10.2 6 v7 M14 6 v7 M2 14.5 h13"/></svg>',
    immobilier:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="11" height="11"/><path d="M3 8 h11 M8 4 v11"/></svg>',
    auto:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 10 l1.5-4 h10 L15 10 v3 h-2 M2 10 h13"/><circle cx="5" cy="13" r="1.4"/><circle cx="12" cy="13" r="1.4"/></svg>',
    assurances:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 2 L14 4 v4 c0 4-2.5 6-5.5 7 C5.5 14 3 12 3 8 V4 Z"/></svg>',
    sante:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="11" height="11" rx="2"/><path d="M8.5 5.5 v6 M5.5 8.5 h6"/></svg>',
    economie:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 14 L6 9 L9 11.5 L15 4 M11 4 h4 v4"/></svg>',
    skills:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="6"/><path d="M8.5 5 v4 l3 2"/></svg>',
    noir:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="6"/><path d="M4 4 l9 9"/></svg>',
    plus:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="6"/><path d="M8.5 5.5 v6 M5.5 8.5 h6"/></svg>',
    profil:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="6" r="2.6"/><path d="M3 14.5 c0-3 2.5-4.5 5.5-4.5 s5.5 1.5 5.5 4.5"/></svg>'
  };

  const NAV = [
    ['vie','Accueil'],['inventaire','Inventaire'],['carriere','Emploi'],['marche','Courses'],
    ['entreprises','Entreprises'],['banque','Banque'],['immobilier','Immo'],['auto','Auto'],
    ['assurances','Assurances'],['sante','Santé'],['skills','Compétences'],
    ['economie','Économie'],['noir','Noir',true],['plus','Boutique +'],['profil','Profil']
  ];

  const TUTO = [
    { tab:'vie', sel:null, t:'Bienvenue dans HEXALIFE', x:'Votre nouvelle vie française commence ici : 2 000 € en poche, 800 citoyens autour de vous. 14 étapes rapides pour tout maîtriser.' },
    { tab:'vie', sel:'.vitals', t:'Vos jauges vitales', x:'Santé, faim et soif baissent en continu (la météo aussi joue). Mangez depuis l’Inventaire, buvez, et soignez-vous dans Santé. À 0 de santé : hôpital.' },
    { tab:'vie', sel:'.daily-panel', t:'La récompense quotidienne', x:'Chaque jour réel, réclamerez votre récompense ici. Revenez jour après jour : la série monte jusqu’à 3 500 € au jour 7.' },
    { tab:'vie', sel:'.strip', t:'Vos flux en direct', x:'Revenus, charges et net par seconde : votre économie personnelle vit en temps réel sous vos yeux.' },
    { tab:'marche', sel:'.view .panel', t:'Les courses & le marché', x:'Les prix fluctuent : guettez les badges PROMO verts. Achetez par 1 ou par 5 — tout part dans l’Inventaire. Trop manger rend malade !' },
    { tab:'inventaire', sel:'.view .panel', t:'Votre inventaire', x:'Consommez vos articles pour remonter faim et soif. La valeur totale du sac s’affiche en haut.' },
    { tab:'carriere', sel:'.view .panel', t:'Formations & emplois', x:'La « Remise à niveau » est gratuite : c’est votre premier diplôme. Ensuite, signez un contrat (temps plein exclusif ou partiel cumulable) et négociez votre salaire avec 💼.' },
    { tab:'banque', sel:'.bank-offer', t:'Choisissez votre banque', x:'Cliquez sur une banque pour la comparer, puis ouvrez un compte : salaires, impôts et virements passeront par là.' },
    { tab:'banque', sel:'.wallet', t:'Vos cartes & le terminal 3D', x:'Carte bleue pour le compte, carte ROUGE pour le Livret A. Cliquez sur une carte : elle s’insère dans le terminal 3D pour toutes vos opérations.' },
    { tab:'banque', sel:'.tr-grid', t:'Virements internes', x:'Liquide ↔ compte ↔ Livret A : saisissez un montant (virgule acceptée) ou cliquez Max, puis choisissez le sens. Le ticket s’imprime au terminal.' },
    { tab:'entreprises', sel:'.view .panel', t:'Vos entreprises', x:'Boulangerie, magasin, agence immo ou banque : produisez, fixez vos prix, recrutez, faites du marketing. Les gros achats se paient en sans contact : glissez votre carte sur le lecteur !' },
    { tab:'sante', sel:'.view .panel', t:'Votre santé', x:'Choisissez un médecin traitant, vaccinez-vous, et courrez 🏃 pour regagner de la santé quand vous allez bien.' },
    { tab:'vie', sel:'.tb-money', t:'Votre solde animé', x:'En haut à droite, votre solde défile en continu vers sa nouvelle valeur, avec un halo vert (entrée) ou rouge (sortie). Les soldes de vos cartes s’animent pareil.' },
    { tab:'vie', sel:null, t:'À vous de jouer !', x:'Défis, quêtes, succès, loto, marché noir… et votre carte premium au niveau 10. Bonus de départ : 100 €. Bonne vie, citoyen !' }
  ];

  let feedItems = [];
  let presenceStarted = false;
  let seenAnnounces = [];
  let seenLoadedFor = null;
  let expiredFlag = false;

  function loadSeen() {
    const key = 'hl_seenAnn_' + (DB.session() || 'x');
    if (seenLoadedFor === key) return;
    seenLoadedFor = key;
    try { seenAnnounces = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { seenAnnounces = []; }
    if (!Array.isArray(seenAnnounces)) seenAnnounces = [];
  }
  function saveSeen() {
    try { localStorage.setItem('hl_seenAnn_' + (DB.session() || 'x'), JSON.stringify(seenAnnounces.slice(-60))); } catch (e) {}
  }

  /* ── Toasts : icône, barre de vie, clic pour fermer, empilement limité ── */
  const TICO = { good:'✓', bad:'✕', warn:'⚠', '':'◆' };
  function toast(msg, type = '') {
    const host = el('toasts'); if (!host) return;
    while (host.children.length >= 4) host.firstChild.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<span class="toast-ico">' + (TICO[type] || '◆') + '</span><div class="toast-body">' + msg + '</div><div class="toast-life"></div>';
    let done = false;
    const dismiss = () => { if (done) return; done = true; t.classList.add('out'); setTimeout(() => t.remove(), 320); };
    t.addEventListener('click', dismiss);
    host.appendChild(t);
    setTimeout(dismiss, 4800);
  }

  function feed(html) {
    feedItems.unshift({ html, t: new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) });
    feedItems = feedItems.slice(0, 40);
    if (T.tab === 'economie' || T.tab === 'vie') renderFeedZone();
  }
  function floatText(txt, color, anchor) {
    const d = document.createElement('div');
    d.className = 'float-txt'; d.style.color = color; d.textContent = txt;
    const a = anchor || document.querySelector('.vitals');
    if (a) { const r = a.getBoundingClientRect(); d.style.left = (r.left + 20 + Math.random() * Math.max(30, r.width - 60)) + 'px'; d.style.top = (r.top - 12) + 'px'; d.style.bottom = 'auto'; }
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1300);
  }
  let xpLast = 0, xpAgg = 0;
  function xpFx(n) {
    xpAgg += n;
    const now = Date.now();
    if (now - xpLast < 800) return;
    xpLast = now;
    const v = xpAgg; xpAgg = 0;
    floatText('+' + v + ' XP', 'var(--gold)', document.querySelector('.tb-lvl'));
  }
  function pulseVital(rowId) { const r = el(rowId); if (!r) return; r.classList.remove('pulse'); void r.offsetWidth; r.classList.add('pulse'); }

  function confetti() { FX.confetti({ x: window.innerWidth / 2, y: window.innerHeight * 0.16, count: 90 }); }
  function moneyFly() {
    const m = el('tbMoney');
    if (m) { const r = m.getBoundingClientRect(); FX.moneyFly(r.left + r.width / 2, r.top + r.height / 2); }
    else FX.moneyFly();
  }
  function moneyRain() { FX.moneyRain(); }

  /* moneyFx agrégé : un seul jeton toutes les ~420 ms (fini le spam) */
  let fxAgg = 0, fxTimer = 0;
  function moneyFx(amt) {
    amt = +amt || 0;
    fxAgg += amt;
    if (fxTimer) return;
    fxTimer = setTimeout(() => {
      fxTimer = 0;
      const v = fxAgg; fxAgg = 0;
      if (Math.abs(v) < 0.005) return;
      const host = el('tbMoney'); if (!host) return;
      while (host.querySelectorAll('.money-fx').length > 3) host.querySelector('.money-fx').remove();
      const d = document.createElement('span');
      d.className = 'money-fx ' + (v >= 0 ? 'up' : 'down');
      d.textContent = (v >= 0 ? '+' : '−') + eur(Math.abs(v));
      d.style.right = (40 + Math.random() * 34) + 'px';
      host.appendChild(d);
      setTimeout(() => d.remove(), 1250);
    }, 420);
  }

  function cardFx(txt, amt) {
    const d = document.createElement('div');
    d.className = 'cardfx';
    d.innerHTML = '<div class="cardfx-card"><div class="cf-holo"></div><div class="cf-top"><div class="cf-chip"></div><span class="cf-brand">HEXAPAY</span></div><div class="cf-num">•••• •••• •••• 4242</div><div class="cf-bottom"><div class="cf-txt">' + esc(txt) + '</div><div class="cf-amt">' + esc(amt || '') + '</div></div></div>';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1800);
  }

  /* Flash plein écran pour les événements (liseré doré / rouge) */
  function eventFx(t) {
    const d = document.createElement('div');
    d.className = 'eventfx ' + (t === 'good' ? 'good' : 'bad');
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 950);
  }

  function screenShake() {
    const app = el('scr-app'); if (!app) return;
    app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
    setTimeout(() => app.classList.remove('shake'), 520);
  }

  function levelUp(l) {
    const ov = el('lvlOv'); if (!ov) return;
    const n = ov.querySelector('.lvl-n'); if (n) n.textContent = l;
    ov.classList.remove('show'); void ov.offsetWidth; ov.classList.add('show');
    FX.confetti({ x: window.innerWidth / 2, y: window.innerHeight * 0.4, count: 130, power: 1.25 });
    setTimeout(() => ov.classList.remove('show'), 2400);
  }

  function achUnlock(a) {
    T.achNew = (T.achNew || 0) + 1;
    toast('<div class="toast-ach"><span class="ta-ico">' + a.icon + '</span><div><b>Succès débloqué !</b><div class="ta-n">' + esc(a.n) + ' · +' + (a.xp || 0) + ' XP</div></div></div>', 'good');
    FX.spark(window.innerWidth - 60, window.innerHeight - 60, '#f3c76e', 16);
    buildRail();
  }

  let lastReport = 0;
  function reportError(e, ctx) {
    try { console.error('[HEXALIFE] ' + (ctx || '?') + ' :', e); } catch (x) {}
    const now = Date.now();
    if (now - lastReport > 60000) {
      lastReport = now;
      toast('⚠ Une erreur interne a été ignorée (' + esc(ctx || 'jeu') + '). La partie continue.', 'warn');
    }
  }

  function setWeather(vis) {
    FX.setWeather(vis);
    document.querySelectorAll('[data-weather-chip]').forEach(x => {
      const w = curWeather();
      x.innerHTML = w.ico + ' ' + esc(w.n);
      x.title = w.d;
    });
  }

  /* Popup annonce plein écran */
  function showAnnounce(a) {
    const ov = document.createElement('div');
    ov.className = 'ann-ov';
    ov.innerHTML =
      '<div class="ann-glow"></div>' +
      '<div class="ann-card">' +
        '<div class="ann-ring"></div>' +
        '<div class="ann-mega">📣</div>' +
        '<div class="ann-biz">' + esc(a.biz) + '</div>' +
        '<div class="ann-text">' + esc(a.text) + '</div>' +
        '<div class="ann-by">par ' + esc(a.owner) + '</div>' +
        '<button class="btn btn-primary ann-close">Fermer</button>' +
      '</div>';
    document.body.appendChild(ov);
    confetti(); FX.sound('bell');
    let closed = false;
    const close = () => { if (closed) return; closed = true; ov.classList.add('out'); setTimeout(() => ov.remove(), 400); };
    ov.querySelector('.ann-close').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    setTimeout(close, 9000);
  }

  function modal(html) {
    const root = el('modalRoot'); if (!root) return;
    root.innerHTML = '<div class="m-back"><div class="m-card"><button class="m-x" data-act="closeModal" title="Fermer" aria-label="Fermer">✕</button>' + html + '</div></div>';
    root.querySelector('.m-back').addEventListener('click', e => { if (e.target.classList.contains('m-back')) closeModal(); });
    FX.sound('click');
    const focusable = root.querySelector('input:not([type=hidden]), textarea, select, .btn-primary');
    if (focusable) setTimeout(() => { try { focusable.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function closeModal() { const root = el('modalRoot'); if (root && root.innerHTML) { root.innerHTML = ''; FX.sound('back'); } }

  function flashSave() {
    const s = el('tbSave'); if (!s) return;
    s.textContent = '✓ Sauvegardé';
    s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse');
    setTimeout(() => { s.textContent = 'Sauvegarde auto active'; }, 1500);
  }

  /* ── Présence réseau ── */
  function ensureOnlineBadge() {
    if (el('tbOnline')) return;
    const lvl = document.querySelector('.tb-lvl');
    if (!lvl || !lvl.parentNode) return;
    const d = document.createElement('div');
    d.className = 'tb-online'; d.id = 'tbOnline'; d.title = 'Joueurs connectés en direct';
    d.innerHTML = '<span class="on-dot"></span><span id="tbOnlineN">…</span>';
    lvl.parentNode.insertBefore(d, lvl.nextSibling);
  }
  async function pingNow() {
    try {
      const j = await DB.authFetch('/api/ping', { method: 'POST' });
      const n = el('tbOnlineN');
      if (j && typeof j.count === 'number') {
        if (n) n.textContent = j.count;
        const dot = document.querySelector('.on-dot'); if (dot) dot.classList.add('live');
        T.isAdmin = !!j.isAdmin;
      } else if (n) n.textContent = '0';
    } catch (e) {
      const n = el('tbOnlineN'); if (n) n.textContent = '0';
    }
  }
  async function pollMailbox() {
    try {
      const j = await DB.authFetch('/api/mailbox');
      const ops = (j && Array.isArray(j.ops)) ? j.ops : [];
      if (!ops.length) return;
      ops.forEach(op => { try { applyOp(op); } catch (e) { reportError(e, 'mailbox'); } });
      // ack quoi qu'il arrive : une op toxique ne peut plus se rejouer en boucle
      await DB.authFetch('/api/mailbox/ack', { method: 'POST', body: JSON.stringify({ ids: ops.map(o => o && o.id).filter(Boolean) }) });
      UI.render(true);
    } catch (e) {}
  }
  async function pollAnnounce() {
    try {
      loadSeen();
      const j = await DB.authFetch('/api/announce');
      const list = (j && Array.isArray(j.list)) ? j.list : [];
      let fresh = null;
      list.forEach(a => {
        if (a && a.id && !seenAnnounces.includes(a.id)) {
          seenAnnounces.push(a.id);
          if (a.owner !== G.name) fresh = a; // pas de popup pour sa propre annonce
        }
      });
      saveSeen();
      if (fresh) showAnnounce(fresh);
    } catch (e) {}
  }
  function startPresence() {
    if (presenceStarted) return;
    presenceStarted = true;
    loadSeen();
    pingNow(); pollMailbox(); pollAnnounce();
    setInterval(pingNow, 20000);
    setInterval(pollMailbox, 8000);
    setInterval(pollAnnounce, 12000);
  }

  /* ── Navigation ── */
  function buildRail() {
    const rail = el('rail'); if (!rail) return;
    const claimable = (G.missions.list || []).filter(m => m.prog >= m.tgt && !m.claimed).length
      + (G.quests.list || []).filter(q => q.prog >= q.tgt && !q.claimed).length;
    rail.innerHTML = NAV.map(([id, lbl, lock]) =>
      '<button class="nav-btn' + (T.tab === id ? ' active' : '') + '" data-act="tab" data-id="' + id + '" title="' + lbl + '">' + ICONS[id] +
      '<span class="lbl">' + lbl + '</span>' +
      (lock ? '<span class="lock">🔒</span>' : '') +
      (id === 'vie' && claimable ? '<span class="bdg">' + claimable + '</span>' : '') +
      (id === 'vie' && canClaimDaily() ? '<span class="bdg daily-bdg">📅</span>' : '') +
      (id === 'profil' && T.achNew ? '<span class="bdg ach-bdg">' + T.achNew + '</span>' : '') +
      '</button>').join('');
  }
  function setTab(id) {
    if (T.tab === id && el('view') && el('view').innerHTML) { /* même onglet : on refresh quand même */ }
    T.tab = id; T.selBiz = -1;
    buildRail();
    const v = el('view');
    if (v) { v.classList.remove('view-in'); void v.offsetWidth; v.classList.add('view-in'); }
    render();
    if (v) v.scrollTop = 0;
    FX.sound('click');
    if (G.tuto >= 0) setTimeout(placeTuto, 80);
  }
  function updateTop() {
    const n = el('tbName'); if (n) n.textContent = G.name;
    const j = el('tbJob');
    if (j) j.textContent = G.jobs.length ? G.jobs.map(x => x.title + (x.mode === 'partiel' ? ' (50 %)' : '')).join(' + ') : (G.training ? 'En formation…' : (G.biz.length ? 'Entrepreneur·e' : 'Sans emploi'));
    const l = level(G.xp), cur = G.xp - 100 * (l - 1) * (l - 1), need = 100 * l * l - 100 * (l - 1) * (l - 1);
    const ln = el('tbLvl'); if (ln) ln.textContent = 'Niv. ' + l;
    const xp = el('tbXp'); if (xp) xp.style.width = clamp(cur / need * 100, 0, 100) + '%';
  }
  function authTab(t) {
    const tabs = el('authTabs'); if (tabs) tabs.classList.toggle('reg', t === 'reg');
    document.querySelectorAll('.atab').forEach(b => b.classList.toggle('active', b.dataset.t === t));
    const fl = el('formLogin'), fr = el('formReg');
    if (!fl || !fr) return;
    fl.hidden = t !== 'login'; fr.hidden = t !== 'reg';
    const shown = t === 'login' ? fl : fr;
    shown.classList.remove('anim'); void shown.offsetWidth; shown.classList.add('anim');
    FX.sound('click');
  }

  /* ── Tutoriel ── */
  /* ── Tutoriel : placement robuste, changement d'onglet auto, scroll centré ── */
  let tutoPlacing = false;
  function placeTuto() {
    const ov = el('tutoOv'); if (!ov) return;
    if (!G || G.tuto < 0 || G.tuto >= TUTO.length) { ov.hidden = true; document.querySelectorAll('.tuto-hl').forEach(x => x.classList.remove('tuto-hl')); return; }
    const st = TUTO[G.tuto];
    // changement d'onglet demandé par l'étape : on navigue puis on replace
    if (st.tab && T.tab !== st.tab && !tutoPlacing) {
      tutoPlacing = true;
      UI.setTab(st.tab);
      setTimeout(() => { tutoPlacing = false; placeTuto(); }, 140);
      return;
    }
    ov.hidden = false;
    document.querySelectorAll('.tuto-hl').forEach(x => x.classList.remove('tuto-hl'));
    el('tutoStepLbl').textContent = (G.tuto + 1) + '/' + TUTO.length;
    el('tutoTitle').textContent = st.t;
    el('tutoText').textContent = st.x;
    el('tutoNext').textContent = G.tuto === TUTO.length - 1 ? 'Terminer ✓' : 'Suivant →';
    const card = el('tutoCard');
    let target = null;
    try { target = st.sel ? document.querySelector(st.sel) : null; } catch (e) { target = null; }
    const visible = target && target.offsetParent !== null;
    if (visible) {
      try { target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }); } catch (e) {}
      target.classList.add('tuto-hl');
      const r = target.getBoundingClientRect();
      const cw = 330, ch = card.offsetHeight || 220;
      let left = r.right + 18;
      if (left + cw > window.innerWidth - 8) left = Math.max(8, r.left - cw - 18);
      if (left < 8) left = Math.max(8, (window.innerWidth - cw) / 2);
      let top = clamp(r.top + r.height / 2 - ch / 2, 70, Math.max(70, window.innerHeight - ch - 20));
      card.style.left = left + 'px';
      card.style.top = top + 'px';
    } else {
      const cw = 330, ch = card.offsetHeight || 220;
      card.style.left = Math.max(10, (window.innerWidth - cw) / 2) + 'px';
      card.style.top = Math.max(70, (window.innerHeight - ch) * 0.4) + 'px';
    }
    const dots = el('tutoDots');
    if (dots) dots.innerHTML = TUTO.map((_, i) => '<span class="t-dot' + (i === G.tuto ? ' on' : '') + (i < G.tuto ? ' done' : '') + '"></span>').join('');
  }
  function tutoNext() {
    if (!G || G.tuto < 0) return; // tutoriel déjà terminé : ne se réarme pas
    G.tuto++;
    FX.sound('click');
    if (G.tuto >= TUTO.length) {
      G.tuto = -1; G.stats.tutoDone = true;
      receive(100, 'Bonus tutoriel', 'in'); addXp(50);
      toast('🎓 Tutoriel terminé ! +100 € · +50 XP', 'good');
      confetti(); FX.sound('win');
      maybeAch(); save();
    }
    placeTuto();
  }
  function tutoSkip() {
    G.tuto = -1; G.stats.tutoDone = true;
    placeTuto(); toast('Tutoriel passé. Retrouvez l’aide via « ? » en haut à droite.', ''); save();
  }

  /* ── Carte bancaire 3D (inclinaison au curseur) ── */
  let tiltRaf = 0;
  document.addEventListener('mousemove', e => {
    const card = e.target.closest && e.target.closest('.bankcard[data-tilt], .pcard[data-tilt]');
    document.querySelectorAll('.bankcard[data-tilt], .pcard[data-tilt]').forEach(c => {
      if (c !== card) c.style.transform = '';
    });
    if (!card || reducedMotion()) return;
    if (tiltRaf) return;
    tiltRaf = requestAnimationFrame(() => {
      tiltRaf = 0;
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      card.style.transform = 'perspective(900px) rotateY(' + (dx * 9).toFixed(2) + 'deg) rotateX(' + (-dy * 7).toFixed(2) + 'deg) scale(1.02)';
    });
  });
  function reducedMotion() { const s = loadSettings(); return s.reduced || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function bankCardHTML(bal, bankName, holder, small) {
    return '<div class="bankcard' + (small ? ' small' : '') + '" data-tilt><div class="bc-shine"></div>' +
      '<div class="bc-top"><div class="bc-chip"></div><span class="bc-brand">HEXAPAY</span></div>' +
      '<div class="bc-num">•••• •••• •••• 4242</div>' +
      '<div class="bc-bottom"><div><div class="bc-lbl">Titulaire</div><div class="bc-name">' + esc(holder) + '</div></div>' +
      '<div style="text-align:right"><div class="bc-lbl">' + esc(bankName) + '</div><div class="bc-bal">' + eur(bal) + '</div></div></div></div>';
  }

  /* ── Rendu principal ── */
  const R = {};
  function render(silent) {
    if (!G) return;
    updateTop();
    ensureOnlineBadge();
    startPresence();
    if (!T.cashInit) { T.cashDisp = balance(); T.cashInit = true; }
    const v = el('view'); if (!v) return;
    const st = v.scrollTop;
    const savedInputs = {};
    if (silent) {
      v.classList.add('no-anim');
      v.querySelectorAll('input, select, textarea').forEach(i => { if (i.id) savedInputs[i.id] = i.value; });
    }
    const fn = R[T.tab] || R.vie;
    try { v.innerHTML = fn(); }
    catch (e) { reportError(e, 'render:' + T.tab); v.innerHTML = '<h1>Oups…</h1><div class="panel"><div class="empty">Cette vue a rencontré un problème. Les autres onglets restent accessibles.</div></div>'; }
    v.scrollTop = st;
    if (silent) {
      Object.keys(savedInputs).forEach(id => { const e2 = el(id); if (e2 && document.activeElement !== e2) e2.value = savedInputs[id]; });
      requestAnimationFrame(() => v.classList.remove('no-anim'));
    }
    if (T.tab === 'vie' || T.tab === 'economie') renderFeedZone();
    if (T.tab === 'economie') { drawCharts(); loadLeaderboard(); }
    if (T.tab === 'entreprises' && T.selBiz >= 0 && G.biz[T.selBiz] && (T.bizTab === 'overview' || T.bizTab === 'compta'))
      FX.chart(el('bChart'), G.biz[T.selBiz].hist, 'rgb(232,176,75)');
    if (T.tab === 'banque' && G) FX.chart(el('chBal'), (G.histBal || []).slice(-90), 'rgb(84,163,216)');
    if (T.tab === 'immobilier' && W) FX.chart(el('chImmoLocal'), (W.hImmo || []).slice(-70), 'rgb(75,179,128)');
    if (T.tab === 'banque') loadPlayerBanks();
    if (T.tab === 'entreprises' && T.selBiz >= 0 && G.biz[T.selBiz] && G.biz[T.selBiz].type === 'banque') loadExtClients();
    if (T.tab === 'profil') T.achNew = 0;
    if (T.tab === 'profil') buildRail();
    updateCountdowns();
    startCashLoop();
    updateBalEls();
  }
  R.vie = rVie; R.inventaire = rInv; R.carriere = rCarriere; R.marche = rMarche;
  R.entreprises = rEntreprises; R.banque = rBanque; R.immobilier = rImmo; R.auto = rAuto;
  R.assurances = rAssur; R.sante = rSante; R.skills = rSkills;
  R.economie = rEco; R.noir = rNoir; R.plus = rPlus; R.profil = rProfil;

  function renderFeedZone() {
    const z = el('feedZone');
    if (z) z.innerHTML = feedItems.length ? feedItems.map(f => '<div class="feed-item"><span class="tm">' + f.t + '</span>' + f.html + '</div>').join('') : '<div class="empty">Le journal est vide pour le moment.</div>';
  }

  /* ── Données asynchrones (banques joueurs, clients, classement) ── */
  function skeleton(n) { return '<div class="skel-wrap">' + Array(n || 3).fill('<div class="skel"></div>').join('') + '</div>'; }
  function loadPlayerBanks() {
    const host = el('playerBanksList'); if (!host) return;
    host.innerHTML = skeleton(2);
    DB.authFetch('/api/banks').then(j => {
      if (!host.isConnected) return;
      const list = ((j && j.banks) || []).filter(b => b.owner !== G.name);
      host.innerHTML = list.length ? list.map(b =>
        '<div class="bank-offer" data-act="bankDetails" data-id="' + esc(b.id) + '" data-name="' + esc(b.name) + '" data-rate="' + num(b.livret, 2, 0, 5) + '" data-owner="' + esc(b.owner) + '" data-accounts="' + Math.floor(num(b.accounts, 0, 0)) + '">' +
        '<div class="bo-name">🏦 ' + esc(b.name) + '</div><div class="bo-det">par ' + esc(b.owner) + ' · Livret ' + num(b.livret, 2, 0, 5) + ' % · ' + Math.floor(num(b.accounts, 0, 0)) + ' comptes</div></div>'
      ).join('') : '<div class="empty">Aucune banque fondée par un autre joueur pour le moment.</div>';
    }).catch(() => { if (host.isConnected) host.innerHTML = '<div class="empty">Banques de joueurs indisponibles hors-ligne.</div>'; });
  }
  function loadExtClients() {
    const host = el('extClients'); if (!host) return;
    host.innerHTML = skeleton(2);
    DB.authFetch('/api/banks/clients').then(j => {
      if (!host.isConnected) return;
      const list = (j && j.clients) || [];
      host.innerHTML = list.length ? list.map(c =>
        '<div class="rowline"><div style="flex:1"><div class="lbl">' + esc(c.name) + (c.online ? ' <span class="chip green">EN LIGNE</span>' : '') + '</div>' +
        '<div class="det">Compte : <span class="money">' + eur(c.compte) + '</span> · Livret : <span class="money">' + eur(c.livret) + '</span></div>' +
        '<div class="det">' + Math.floor(num(c.jobs, 0, 0)) + ' job(s) · ' + Math.floor(num(c.biz, 0, 0)) + ' entreprise(s)</div>' +
        (Array.isArray(c.loans) && c.loans.length ? '<div class="det">Prêts : ' + c.loans.map(L => esc(L.n) + ' (reste ' + eur(L.reste) + ')').join(' · ') + '</div>' : '<div class="det">Aucun prêt</div>') +
        '</div><span class="chip gold">CLIENT</span></div>'
      ).join('') : '<div class="empty">Aucun joueur externe inscrit à votre banque.</div>';
    }).catch(() => { if (host.isConnected) host.innerHTML = '<div class="empty">Clients externes indisponibles hors-ligne.</div>'; });
  }
  function loadLeaderboard() {
    const host = el('lbZone'); if (!host) return;
    if (DB.mode() !== 'api') { host.innerHTML = '<div class="empty">Classement disponible en mode serveur (base partagée).</div>'; return; }
    host.innerHTML = skeleton(4);
    DB.authFetch('/api/leaderboard').then(j => {
      if (!host.isConnected) return;
      const list = (j && j.list) || [];
      if (!list.length) { host.innerHTML = '<div class="empty">Aucun citoyen classé pour l’instant.</div>'; return; }
      host.innerHTML = '<div class="lb-list">' + list.map((u, i) =>
        '<div class="lb-row' + (u.me ? ' me' : '') + '"><span class="lb-rank">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)) + '</span>' +
        '<div style="flex:1"><div class="lbl">' + esc(u.name) + (u.me ? ' <span class="chip gold">VOUS</span>' : '') + (u.online ? ' <span class="on-dot live" style="display:inline-block"></span>' : '') + '</div>' +
        '<div class="det">Niv. ' + Math.floor(num(u.level, 1, 1)) + ' · ' + Math.floor(num(u.biz, 0, 0)) + ' entreprise(s)</div></div>' +
        '<span class="money">' + kfmt(u.balance) + '</span></div>').join('') + '</div>' +
        (j.rank ? '<div class="det" style="margin-top:8px;text-align:center">Votre rang : <b class="money">#' + j.rank + '</b> sur ' + j.total + '</div>' : '');
    }).catch(() => { if (host.isConnected) host.innerHTML = '<div class="empty">Classement indisponible.</div>'; });
  }

  /* ── Modales métier ── */
  function openSendMoney() {
    if (!G.bank.bankId) return toast('Ouvrez d’abord un compte bancaire.', 'warn');
    modal('<h2>💸 Envoyer de l’argent</h2><div class="m-sub">Transfert instantané entre joueurs (mode serveur).</div>' +
      '<label class="m-field">Pseudo du destinataire<input id="smTo" class="mini m-wide" maxlength="20" placeholder="Pseudo"></label>' +
      '<label class="m-field">Montant (€)<input id="smAmt" class="mini m-wide" type="text" inputmode="decimal" placeholder="100"></label>' +
      '<div class="m-hint">Solde disponible : <b class="money">' + eur(balance()) + '</b></div>' +
      '<div id="smOnline" style="margin-top:12px"><div class="det">Joueurs en ligne : chargement…</div></div>' +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Annuler</button>' +
      '<button class="btn btn-primary" data-act="doSendMoney">Envoyer</button></div>');
    DB.authFetch('/api/presence').then(j => {
      const host = el('smOnline'); if (!host || !host.isConnected) return;
      const names = ((j && j.names) || []).filter(n => n !== G.name);
      host.innerHTML = '<div class="det">Joueurs en ligne :</div><div class="chip-row">' +
        (names.length ? names.map(n => '<button class="chip gold sm-chip" data-name="' + esc(n) + '" style="cursor:pointer">' + esc(n) + '</button>').join('') : '<span class="det">aucun autre joueur en ligne</span>') + '</div>';
      host.querySelectorAll('.sm-chip').forEach(b => b.addEventListener('click', () => { const i = el('smTo'); if (i) { i.value = b.dataset.name; i.focus(); } }));
    }).catch(() => {});
  }
  function doSendMoney() {
    const to = ((el('smTo') || {}).value || '').trim();
    const amount = Math.floor(parseAmount(((el('smAmt') || {}).value)));
    A.sendToPlayer({ to, v: amount });
  }

  function openAnnounce() {
    if (!G.biz.length) return toast('Il faut posséder une entreprise pour communiquer.', 'warn');
    modal('<h2>📣 Annonce publique</h2><div class="m-sub">Diffusée en popup chez TOUS les joueurs. Une seule par heure.</div>' +
      '<label class="m-field">Message (200 caractères max)<textarea id="anText" class="mini m-wide m-area" maxlength="200" placeholder="Promo du jour, recrutement, événement…"></textarea></label>' +
      '<div class="m-hint" style="text-align:right"><span id="anCount">0</span>/200</div>' +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Annuler</button>' +
      '<button class="btn btn-primary" data-act="doAnnounce">Diffuser</button></div>');
    const ta = el('anText'), cnt = el('anCount');
    if (ta && cnt) ta.addEventListener('input', () => { cnt.textContent = ta.value.length; });
  }
  function doAnnounce() {
    const text = ((el('anText') || {}).value || '').trim();
    if (!text) return toast('Message vide.', 'warn');
    loadSeen();
    DB.authFetch('/api/announce', { method: 'POST', body: JSON.stringify({ text }) }).then(j => {
      if (j && j.ok) { toast('📣 Annonce diffusée à toute la ville !', 'good'); closeModal(); confetti(); FX.sound('win'); }
      else { FX.sound('error'); toast((j && j.err) || 'Échec de l’annonce.', 'bad'); }
    }).catch(() => { FX.sound('error'); toast('Annonce indisponible hors-ligne.', 'bad'); });
  }

  function openAdmin() {
    DB.authFetch('/api/admin/users').then(j => {
      const users = (j && j.users) || [];
      modal('<h2>🛡 Panneau Administrateur</h2><div class="m-sub">Montant des actions + / − : <input id="adAmt" class="mini" type="number" min="1" value="1000" style="width:110px"></div>' +
        '<div class="admin-list">' +
        (users.length ? users.map(u =>
          '<div class="admin-row"><div class="admin-id"><div class="lbl">' + esc(u.name) + (u.online ? ' <span class="chip green">EN LIGNE</span>' : '') + '</div>' +
          '<div class="det">Solde : <span class="money">' + eur(u.balance) + '</span> · ' + Math.floor(num(u.biz, 0, 0)) + ' entreprise(s)</div></div>' +
          '<div class="admin-acts">' +
          '<button class="btn btn-sm" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="addMoney" title="Créditer">+€</button>' +
          '<button class="btn btn-sm" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="removeMoney" title="Débiter">−€</button>' +
          '<button class="btn btn-sm" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="boost" title="Boost ×1,5 (5 min)">⚡</button>' +
          '<button class="btn btn-sm" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="malus" title="Malus ×0,5 (5 min)">🐌</button>' +
          '<button class="btn btn-sm btn-danger" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="deleteBiz" title="Supprimer les entreprises">🏚</button>' +
          '<button class="btn btn-sm btn-danger" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="reset" title="Réinitialiser la progression">♻</button>' +
          '<button class="btn btn-sm btn-danger" data-act="adminDo" data-target="' + esc(u.name) + '" data-action="deleteAccount" title="Supprimer le compte">✖</button>' +
          '</div></div>').join('') : '<div class="empty">Aucun utilisateur.</div>') + '</div>' +
        '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Fermer</button></div>');
    }).catch(() => toast('Panneau admin indisponible.', 'bad'));
  }
  function adminDo(d) {
    const amount = Math.floor(+((el('adAmt') || {}).value || 0));
    DB.authFetch('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: d.target, action: d.action, amount }) }).then(j => {
      if (j && j.ok) { toast('Action « ' + d.action + ' » appliquée à ' + esc(d.target), 'good'); openAdmin(); }
      else { FX.sound('error'); toast((j && j.err) || 'Action refusée.', 'bad'); }
    }).catch(() => toast('Action indisponible.', 'bad'));
  }

  function openSettings() {
    const s = loadSettings();
    const row = (k, ico, title, desc) =>
      '<div class="set-row" data-act="toggleSetting" data-k="' + k + '" role="switch" aria-checked="' + !!s[k] + '" tabindex="0">' +
      '<div style="flex:1"><div class="lbl">' + ico + ' ' + title + '</div><div class="det">' + desc + '</div></div>' +
      '<div class="switch' + (s[k] ? ' on' : '') + '"><div class="sw-knob"></div></div></div>';
    modal('<h2>Réglages</h2><div class="m-sub">Préférences enregistrées sur ce navigateur.</div>' +
      row('sound', '🔊', 'Sons & effets audio', 'Bips synthétisés : achats, gains, niveaux, sirènes…') +
      row('particles', '✨', 'Particules & météo animée', 'Pluie, neige, poussière dorée, confettis, billets.') +
      row('reduced', '🐢', 'Animations réduites', 'Limite les mouvements (accessibilité, confort).') +
      '<div class="m-hint">Astuce : le système respecte aussi « prefers-reduced-motion » de votre OS.</div>' +
      '<div class="m-actions"><button class="btn btn-primary" data-act="closeModal">Fermer</button></div>');
  }
  function openHelp() {
    modal('<h2>Aide & raccourcis</h2><div class="m-sub">Tout savoir pour bien vivre en ville.</div>' +
      '<div class="help-grid">' +
      '<div class="help-card"><b>🍞 Survivre</b><p>Mangez et buvez (Inventaire/Courses). Sans domicile, vos jauges chutent plus vite. Santé à 0 : hôpital.</p></div>' +
      '<div class="help-card"><b>💼 Gagner</b><p>Formations → emplois (temps plein exclusif, partiel cumulable) → entreprises → banque. 1 mois = 60 s.</p></div>' +
      '<div class="help-card"><b>🏦 Banque</b><p>Le compte centralise salaires et achats. Livret A plafonné à 22 950 €, intérêts mensuels.</p></div>' +
      '<div class="help-card"><b>🕶 Marché noir</b><p>Risqué : la chaleur monte, à 100 c’est la garde à vue. Pot-de-vin ou caution pour s’en sortir.</p></div>' +
      '<div class="help-card"><b>🎯 Progression</b><p>Défis (15 min), quêtes (24 h), succès, récompense quotidienne : de l’XP et des euros.</p></div>' +
      '<div class="help-card"><b>⌨ Raccourcis</b><p><span class="key">Échap</span> fermer · <span class="key">Alt</span>+<span class="key">1..9</span> onglets · <span class="key">F1</span> aide</p></div>' +
      '</div>' +
      '<div class="m-actions"><button class="btn btn-primary" data-act="closeModal">Compris !</button></div>');
  }

  /* ── Vues ── */
  function goals() {
    const g = [];
    if (!G.diplomas.length && !G.training) g.push('Suivre votre première formation');
    if (!G.jobs.length) g.push('Signer un contrat de travail');
    if (!G.bank.bankId) g.push('Ouvrir un compte bancaire');
    if (!hasShelter()) g.push('Vous loger (location ou achat)');
    if (!G.biz.length) g.push('Fonder une entreprise');
    if (!Object.keys(G.ach || {}).length) g.push('Débloquer votre premier succès');
    return g;
  }
  function taskRows(list, actName) {
    return (list || []).map((m, i) => {
      const pct = clamp(m.prog / m.tgt * 100, 0, 100), done = m.prog >= m.tgt;
      return '<div class="rowline' + (done && !m.claimed ? ' row-glow' : '') + '"><div style="flex:1"><div class="lbl">' + esc(m.n) + '</div>' +
        '<div class="task-prog"><div class="bar b-gold"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<span class="mono task-num">' + fmtProg(m) + '</span></div></div>' +
        (m.claimed ? '<span class="chip green">RÉCLAMÉ</span>' : done ? '<button class="btn btn-primary btn-sm btn-pop" data-act="' + actName + '" data-i="' + i + '">+' + eur(m.rew) + '</button>' : '<span class="money">' + eur(m.rew) + (m.xp ? ' <span class="det">+' + m.xp + ' XP</span>' : '') + '</span>') + '</div>';
    }).join('') || '<div class="empty">Rien à faire pour l’instant.</div>';
  }
  function fmtProg(m) {
    if (m.type === 'cash') return kfmt(Math.min(m.prog, m.tgt)) + ' / ' + kfmt(m.tgt);
    return Math.min(Math.floor(m.prog), m.tgt) + ' / ' + m.tgt;
  }
  function weatherCard() {
    const w = curWeather();
    return '<div class="wcard w-' + w.vis + '"><div class="w-ico">' + w.ico + '</div><div style="flex:1"><div class="w-name">' + esc(w.n) + '</div><div class="w-desc">' + esc(w.d) + '</div></div>' +
      '<div class="w-cd cd" data-until="' + W.weather.until + '">…</div></div>';
  }
  function dailyCard() {
    const dk = dayKey();
    const claimed = G.daily.lastDay === dk;
    const streak = G.daily.streak || 0;
    const nextIdx = dailyIndex();
    const cells = DATA.daily.map((r, i) => {
      const isClaimed = claimed ? i < streak : i < (G.daily.lastDay === dayKey(Date.now() - 86400000) ? streak : 0);
      const isToday = !claimed && i === nextIdx;
      return '<div class="d-day' + (isClaimed ? ' claimed' : '') + (isToday ? ' today' : '') + '"><span class="d-n">J' + r.day + '</span><span class="d-amt">' + (r.amt >= 1000 ? (r.amt / 1000) + ' k' : r.amt) + ' €</span></div>';
    }).join('');
    return '<div class="panel daily-panel"><h2>Récompense quotidienne</h2>' +
      '<div class="daily-days">' + cells + '</div>' +
      '<div class="rowline" style="border:0;padding-top:14px"><div><div class="lbl">Série en cours : <b class="money">' + streak + ' jour(s)</b></div>' +
      '<div class="det">Revenez chaque jour : la récompense augmente jusqu’au jour 7 (3 500 €).</div></div>' +
      (claimed ? '<span class="chip green">RÉCLAMÉ ✓</span>' : '<button class="btn btn-primary btn-pop" data-act="claimDaily">Réclamer ' + eur(DATA.daily[nextIdx].amt) + '</button>') + '</div></div>';
  }
  function achPreview() {
    const keys = Object.keys(G.ach || {}).sort((a, b) => G.ach[b] - G.ach[a]).slice(0, 3);
    const items = keys.map(id => { const a = DATA.ach.find(x => x.id === id); return a ? '<span class="ach-mini" title="' + esc(a.n) + '">' + a.icon + '</span>' : ''; }).join('');
    return '<div class="panel"><h2>Succès</h2><div class="rowline" style="border:0"><div><div class="lbl">' + achCount() + ' / ' + DATA.ach.length + ' débloqués</div>' +
      '<div class="det">' + (items || 'Aucun succès pour l’instant — jouez, ils viendront !') + '</div></div>' +
      '<button class="btn btn-sm" data-act="tab" data-id="profil">Voir tout</button></div>' +
      '<div class="bar b-gold" style="margin-top:10px"><div class="fill" style="width:' + (achCount() / DATA.ach.length * 100) + '%"></div></div></div>';
  }

  function rVie() {
    const l = level(G.xp), cur = G.xp - 100 * (l - 1) * (l - 1), need = 100 * l * l - 100 * (l - 1) * (l - 1);
    const bal = balance();
    const lottoCd = Math.max(0, Math.ceil((num(G.lottoCd, 0) - Date.now()) / 1000));
    const hour = new Date().getHours();
    const salut = hour < 6 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    const card = G.bank.bankId ? walletHTML() :
      '<div class="panel" style="text-align:center;padding:26px"><div style="font-size:34px">💳</div><p class="empty" style="margin:10px 0 14px">Ouvrez un compte pour obtenir vos cartes HEXAPAY (bleue) et Livret A (rouge).</p><button class="btn btn-primary btn-sm" data-act="tab" data-id="banque">Choisir ma banque</button></div>';
    return '<div class="vie-head"><div><h1>' + salut + ', ' + esc(G.name) + '.</h1>' +
      '<div class="sub" style="margin-bottom:0">Niveau ' + l + ' · ' + Math.round(cur / need * 100) + ' % d’XP' +
      (G.health.sick ? ' · <b style="color:var(--red)">🤢 malade</b>' : '') +
      (inJail() ? ' · <b style="color:var(--red)">🚔 garde à vue</b>' : '') +
      (G.adminMod ? ' · <b style="color:var(--gold)">' + (G.adminMod.type === 'boost' ? '⚡ boost admin' : '🐌 malus admin') + '</b>' : '') + '</div></div>' +
      '<div data-weather-chip class="w-chip">' + curWeather().ico + ' ' + esc(curWeather().n) + '</div></div>' +
      weatherCard() +
      card +
      '<div class="grid2" style="margin-top:18px">' +
      '<div class="kpi"><div class="k-lbl">Patrimoine net</div><div class="k-val gold">' + kfmt(netWorth()) + '</div>' +
      '<div class="k-lbl" style="margin-top:10px">Impôts & cotisations versés</div><div class="k-val" style="color:var(--red);font-size:16px">' + eur(G.stats.tax) + '</div></div>' +
      '<div class="kpi"><div class="k-lbl">Compte courant</div><div class="k-val" data-bal="cb">' + eur(G.bank.compte) + '</div>' +
      '<div class="k-lbl" style="margin-top:10px">Livret A · ' + bankRate() + ' %</div><div class="k-val" style="color:var(--red)" data-bal="livret">' + eur(G.bank.livret) + '</div>' +
      '<div class="bar b-gold" style="margin:10px 0 0"><div class="fill" style="width:' + (cur / need * 100) + '%"></div></div>' +
      '<div class="det" style="margin-top:6px">Niveau ' + l + ' — ' + Math.round(cur / need * 100) + ' %</div></div></div>' +
      dailyCard() +
      '<div class="grid2"><div class="panel"><h2>Défis du moment</h2>' + taskRows(G.missions.list, 'claimMission') +
      '<div class="det" style="margin-top:8px">Renouvelés dans <span class="cd" data-until="' + G.missions.refreshAt + '">…</span></div></div>' +
      '<div class="panel"><h2>Quêtes quotidiennes</h2>' + taskRows(G.quests.list, 'claimQuest') +
      '<div class="det" style="margin-top:8px">Renouvelées dans <span class="cd" data-until="' + G.quests.refreshAt + '">…</span></div></div></div>' +
      '<div class="grid2"><div class="panel"><h2>Loto citoyenne</h2><div class="rowline"><div><div class="lbl">Tenter votre chance</div><div class="det">' + eur(DATA.lotto.cost) + ' le ticket · ' + Math.round(Math.min(50, (DATA.lotto.chance + skillBonus('luck')) * 100)) + ' % de gagner ' + eur0(DATA.lotto.min) + '–' + eur0(DATA.lotto.max) + '</div></div>' +
      '<span class="mono cd" id="lottoCd" data-until="' + num(G.lottoCd, 0) + '"' + (lottoCd <= 0 ? ' hidden' : '') + '>…</span>' +
      '<button class="btn btn-primary btn-sm" id="lottoBtn" data-act="lotto"' + (lottoCd > 0 ? ' hidden' : '') + '>Acheter 🎟</button></div></div>' +
      '<div class="panel"><h2>Objectifs</h2>' + (goals().length ? goals().map(g => '<div class="rowline"><div class="lbl">▸ ' + esc(g) + '</div></div>').join('') : '<div class="empty">Tous atteints. Bravo, citoyen modèle ! 🏅</div>') + '</div></div>' +
      '<div class="grid2">' + achPreview() +
      '<div class="panel"><h2>Journal de bord</h2><div id="feedZone" class="feed-scroll"></div></div></div>';
  }

  function rInv() {
    const entries = Object.entries(G.inv).filter(([id, q]) => q > 0 && foodById(id));
    const total = entries.reduce((a, [id, q]) => a + effPrice(foodById(id)) * q, 0);
    if (!entries.length) return '<h1>Inventaire</h1><div class="sub">Votre sac est vide.</div>' +
      '<div class="panel empty-big"><div class="empty-ico">🎒</div><p class="empty">Rien à consommer pour l’instant.</p>' +
      '<button class="btn btn-primary" data-act="tab" data-id="marche">Aller aux courses</button></div>';
    return '<h1>Inventaire</h1><div class="sub"><span class="chip gold">' + entries.reduce((a, [, q]) => a + q, 0) + ' article(s)</span> <span class="chip">valeur ' + eur(total) + '</span> — cliquez « Consommer » pour manger ou boire. Au-delà de 100 de faim : risque de trouble alimentaire.</div>' +
      '<div class="inv-grid">' + entries.map(([id, q], k) => {
        const f = foodById(id);
        return '<div class="inv-card" style="animation-delay:' + (k * 0.04) + 's"><span class="qty">×' + q + '</span><div class="inv-ico">' + f.ico + '</div>' +
        '<div class="nm">' + esc(f.n) + '</div><div class="fx">' + (f.f ? '<span class="' + (f.f > 0 ? 'pos' : 'negx') + '">Faim ' + (f.f > 0 ? '+' : '') + f.f + '</span>' : '') + (f.f && f.s ? ' · ' : '') + (f.s ? '<span class="' + (f.s > 0 ? 'posb' : 'negx') + '">Soif ' + (f.s > 0 ? '+' : '') + f.s + '</span>' : '') + '</div>' +
        '<button class="btn btn-primary btn-sm btn-block" data-act="eat" data-id="' + id + '">Consommer</button></div>';
      }).join('') + '</div>';
  }

  function rMarche() {
    return '<h1>Courses</h1><div class="sub">Prix du marché mis à jour toutes les ~2 min : guettez les <span class="chip green">PROMO</span> et évitez les <span class="chip red">tensions</span>. Achats par 1 ou par 5.</div><div class="panel">' +
      DATA.foods.map((f, k) => {
        const p = effPrice(f);
        const ratio = p / f.p;
        const tag = ratio <= 0.9 ? '<span class="chip green price-tag">PROMO −' + Math.round((1 - ratio) * 100) + ' %</span>'
          : ratio >= 1.12 ? '<span class="chip red price-tag">+' + Math.round((ratio - 1) * 100) + ' %</span>' : '';
        return '<div class="rowline" style="animation:panelIn .4s ' + (k * 0.03) + 's both"><div style="display:flex;align-items:center;gap:12px"><span class="food-ico">' + f.ico + '</span><div><div class="lbl">' + esc(f.n) + ' ' + tag + '</div>' +
        '<div class="det">' + (f.f ? '<span class="' + (f.f > 0 ? 'pos' : 'negx') + '">faim ' + (f.f > 0 ? '+' : '') + f.f + '</span>' : '') + (f.f && f.s ? ' · ' : '') + (f.s ? '<span class="' + (f.s > 0 ? 'posb' : 'negx') + '">soif ' + (f.s > 0 ? '+' : '') + f.s + '</span>' : '') + ' · en sac : <b>' + (G.inv[f.id] || 0) + '</b></div></div></div>' +
        '<div class="buy-zone">' + (ratio <= 0.9 || ratio >= 1.12 ? '<span class="price-old">' + eur(f.p) + '</span>' : '') + '<span class="money">' + eur(p) + '</span>' +
        '<button class="btn btn-sm btn-primary" data-act="buyFood" data-id="' + f.id + '" data-q="1">Acheter</button>' +
        '<button class="btn btn-sm" data-act="buyFood" data-id="' + f.id + '" data-q="5" title="Acheter 5 d’un coup">×5</button></div></div>';
      }).join('') + '</div>';
  }

  function rCarriere() {
    const mine = G.jobs.length ? G.jobs.map((j, i) => {
      const comp = DATA.companies[j.c] || { n: 'Entreprise' };
      const negCd = num(j.negAt, 0) > Date.now();
      return '<div class="rowline"><div style="flex:1"><div class="lbl">' + esc(j.title) + ' — ' + esc(comp.n) + '</div>' +
      '<div class="det">' + eur(j.h) + ' brut/h · ' + (j.mode === 'plein' ? 'temps plein' : 'temps partiel') + ' · net ≈ <b class="money">' + eur(jobNetHourly(j.h, j.mode)) + '/h</b> · ⏱ ' + Math.floor(num(j.mins, 0) / 60) + ' h de service' + (j.promo ? ' · <span class="chip gold">+6 % promo</span>' : '') + '</div></div>' +
      '<div class="btn-row">' + (negCd
        ? '<span class="cd chip" data-until="' + num(j.negAt, 0) + '">négociation…</span>'
        : '<button class="btn btn-sm" data-act="negotiate" data-i="' + i + '" title="Demander une augmentation (chances selon charisme et ancienneté)">💼 Négocier</button>') +
      '<button class="btn btn-sm btn-danger" data-act="quitJob" data-i="' + i + '">Quitter</button></div></div>';
    }).join('') : '<div class="empty">Aucun poste. Signez votre premier contrat !</div>';
    const loadPct = Math.round(totalLoad() * 100);
    const secs = [''].concat([...new Set(DATA.companies.map(c => c.sec))]);
    const q = (T.jobF.q || '').toLowerCase();
    const list = DATA.companies.map((c, ci) => ({ c, ci }))
      .filter(x => (!T.jobF.sec || x.c.sec === T.jobF.sec))
      .filter(x => (!q || x.c.n.toLowerCase().includes(q) || x.c.o.some(o => o[0].toLowerCase().includes(q))))
      .filter(x => (!T.jobF.ok || x.c.o.some(o => o[2] <= playerTier())));
    const cards = list.map((x, k) => '<div class="job-card" style="animation-delay:' + (k * 0.045) + 's"><h4>' + esc(x.c.n) + '</h4><span class="chip">' + esc(x.c.sec) + '</span>' +
      x.c.o.map((o, oi) => {
        const tierOk = playerTier() >= o[2], loadOk = totalLoad() < 1;
        return '<div class="offer-row"><div><div class="o-n">' + esc(o[0]) + '</div><div class="o-d">' + eur(o[1]) + ' brut/h · tier ' + o[2] + ' · net ≈ ' + eur(jobNetHourly(o[1], 'plein')) + '</div></div>' +
        '<button class="btn btn-sm ' + (tierOk && loadOk ? 'btn-primary' : '') + '" data-act="offer" data-c="' + x.ci + '" data-o="' + oi + '" ' + (tierOk && loadOk ? '' : 'disabled') + '>' +
        (!tierOk ? 'Diplôme req.' : !loadOk ? 'Charge pleine' : 'Choisir') + '</button></div>';
      }).join('') + '</div>').join('') || '<div class="empty">Aucune offre ne correspond à vos filtres.</div>';
    let train = '';
    if (G.training) {
      const f = DATA.form.find(x => x.id === G.training.id);
      if (f) {
        const pct = clamp(100 - (G.training.end - Date.now()) / (f.dur * 10), 0, 100);
        train = '<div class="panel train-panel"><h2>📚 Formation en cours</h2><div class="rowline" style="border:0"><div style="flex:1"><div class="lbl">' + esc(f.n) + '</div>' +
          '<div class="det">Diplôme dans <span class="cd mono" id="trainRest" data-until="' + G.training.end + '">…</span></div>' +
          '<div class="bar b-gold" style="margin-top:8px"><div class="fill" style="width:' + pct + '%"></div></div></div><span class="chip gold">EN COURS</span></div></div>';
      }
    }
    const forms = DATA.form.map(f => {
      const done = G.diplomas.includes(f.id);
      const tierCol = f.tier >= 5 ? 'gold' : '';
      return '<div class="rowline"><div><div class="lbl">' + esc(f.n) + (tierCol ? ' <span class="chip ' + tierCol + '">TIER ' + f.tier + '</span>' : ' <span class="chip">TIER ' + f.tier + '</span>') + '</div><div class="det">' + esc(f.d) + ' · ' + (f.cost ? eur(f.cost) : 'Gratuit') + ' · ' + f.dur + ' s</div></div>' +
      (done ? '<span class="chip green">OBTENU ✓</span>' : '<button class="btn btn-sm btn-primary" data-act="train" data-id="' + f.id + '"' + (G.training ? ' disabled' : '') + '>S’inscrire</button>') + '</div>';
    }).join('');
    return '<h1>Formation & Emploi</h1><div class="sub">Tier actuel : <b class="money">' + playerTier() + '</b> · Temps plein = exclusif · Temps partiel = cumulable (2 × 50 %).</div>' +
      train +
      '<div class="panel"><h2>Mes postes</h2><div class="load-row"><span class="det">Charge de travail</span><div class="bar b-gold"><div class="fill" style="width:' + loadPct + '%"></div></div><span class="mono" style="font-size:12px">' + loadPct + ' %</span></div>' + mine + '</div>' +
      '<div class="panel"><h2>Offres d’emploi</h2><div class="job-filters"><select class="mini" data-act="jobSec">' + secs.map(s => '<option value="' + esc(s) + '"' + (T.jobF.sec === s ? ' selected' : '') + '>' + (s ? esc(s) : 'Tous secteurs') + '</option>').join('') + '</select>' +
      '<input type="text" data-act="jobQ" placeholder="Rechercher un poste ou une entreprise…" value="' + esc(T.jobF.q) + '">' +
      '<label class="chk"><input type="checkbox" data-act="jobOk"' + (T.jobF.ok ? ' checked' : '') + '> Accessibles uniquement</label></div>' +
      '<div class="job-grid">' + cards + '</div></div>' +
      '<div class="panel"><h2>Formations & diplômes</h2>' + forms + '</div>';
  }

  function rEntreprises() {
    if (T.selBiz >= 0 && G.biz[T.selBiz]) return rBizDetail(G.biz[T.selBiz], T.selBiz);
    const owned = G.biz.length ? '<div class="biz-grid">' + G.biz.map((b, i) => {
      const bt = DATA.bizTypes[b.type] || { label: b.type };
      const lastRev = (b.hist || []).slice(-20).reduce((a, x) => a + x, 0);
      return '<div class="panel biz-card' + (b.boostUntil > Date.now() || b.promoUntil > Date.now() ? ' boosted' : '') + '" data-act="selBiz" data-i="' + i + '" style="animation-delay:' + (i * 0.05) + 's" role="button" tabindex="0">' +
        '<div class="biz-top"><h2 style="border:0;padding:0;margin:0">' + esc(b.name) + '</h2><span class="chip gold">' + esc(bt.label) + '</span></div>' +
        '<div class="biz-stats"><div><span class="det">Réputation</span><div class="bar b-gold biz-bar"><div class="fill" style="width:' + b.rep + '%"></div></div><span class="mono mini-num">' + Math.round(b.rep) + '</span></div>' +
        '<div class="biz-kpis"><span title="CA cumulé">CA <b class="money">' + kfmt(b.rev) + '</b></span><span title="Salariés">👥 <b>' + b.emps.length + '</b></span><span title="Revenu 20 s">⚡ <b class="money">' + eur(lastRev) + '</b></span></div></div>' +
        (activeChips(b) ? '<div class="biz-chips">' + activeChips(b) + '</div>' : '') +
        '</div>';
    }).join('') + '</div>' : '<div class="panel empty-big"><div class="empty-ico">🏗</div><p class="empty">Aucune entreprise. Fondez votre premier commerce !</p></div>';
    const create = Object.entries(DATA.bizTypes).map(([type, bt]) => {
      const req = bt.req ? DATA.form.find(f => f.id === bt.req) : null;
      const reqOk = !req || G.diplomas.includes(req.id);
      const afford = balance() >= bt.cost;
      return '<div class="rowline"><div><div class="lbl">' + esc(bt.label) + '</div><div class="det">Capital : <b class="money">' + eur(bt.cost) + '</b>' +
        (req ? ' · Requis : ' + esc(req.n) + (reqOk ? ' <span class="chip green">✓</span>' : ' <span class="chip red">manquant</span>') : '') +
        ' · ' + (bt.maxEmp || 4) + ' salariés max</div></div>' +
        '<button class="btn btn-sm ' + (reqOk && afford ? 'btn-primary' : '') + '" data-act="openCreate" data-type="' + type + '"' + (reqOk ? '' : ' disabled') + '>Fonder</button></div>';
    }).join('');
    return '<h1>Mes entreprises</h1><div class="sub">Cliquez sur une entreprise pour ouvrir son panneau complet.</div>' +
      (G.biz.length ? '<div class="ann-row"><button class="btn btn-primary" data-act="openAnnounce">📣 Annonce publique à toute la ville</button></div>' : '') +
      owned + '<div class="panel"><h2>Créer une entreprise</h2>' + create + '</div>';
  }

  function bizTabs(b) {
    const tabs = [['overview', 'Vue d’ensemble']];
    if (b.type === 'boulangerie' || b.type === 'magasin') tabs.push(['prod', 'Production']);
    tabs.push(['mkt', 'Marketing']); tabs.push(['hr', 'RH']); tabs.push(['ups', 'Améliorations']); tabs.push(['compta', 'Compta']);
    return '<div class="biz-tabs">' + tabs.map(([id, lbl]) => '<button class="biz-tab' + (T.bizTab === id ? ' active' : '') + '" data-act="bizTab" data-t="' + id + '">' + lbl + '</button>').join('') + '</div>';
  }
  function activeChips(b) {
    const now = Date.now(); let s = '';
    if (b.boostUntil > now) s += '<span class="chip gold">📣 ×' + b.boostMul + ' <span class="cd" data-until="' + b.boostUntil + '">…</span></span>';
    if (b.promoUntil > now) s += '<span class="chip red">⚡ Flash <span class="cd" data-until="' + b.promoUntil + '">…</span></span>';
    if (perk(b, 'fidelite')) s += '<span class="chip green">Fidélité</span>';
    if (perk(b, 'autoRestock')) s += '<span class="chip green">Réassort auto</span>';
    if (perk(b, 'enseigne')) s += '<span class="chip green">Enseigne</span>';
    if (perk(b, 'pub')) s += '<span class="chip green">Spot TV</span>';
    return s;
  }

  function priceAdvice(b, p) {
    const ref = p.ref || p.cost || 1;
    const r = (b.prices[p.id] || ref) / ref;
    if (r < 0.95) return '<span class="chip green">📈 sous le marché : forte demande</span>';
    if (r > 1.1) return '<span class="chip red">📉 au-dessus du marché : clients rebutés</span>';
    return '<span class="chip green">✓ prix optimal</span>';
  }
  function rBizDetail(b, i) {
    let body = '';
    const bt = DATA.bizTypes[b.type] || {};
    if (T.bizTab === 'overview') {
      const top = Object.entries(b.counters || {}).sort((a, b2) => b2[1] - a[1]).slice(0, 3)
        .map(([pid, n]) => { const p = (bt.prods || []).find(x => x.id === pid); return p && n > 0 ? '<span class="chip gold">' + esc(p.n) + ' ×' + n + '</span>' : ''; }).join(' ');
      body = '<div class="biz-chips">' + (activeChips(b) || '<span class="chip">Aucun effet actif</span>') + '</div>' +
        '<div class="grid3"><div class="kpi"><div class="k-lbl">CA cumulé</div><div class="k-val gold">' + kfmt(b.rev) + '</div></div>' +
        '<div class="kpi"><div class="k-lbl">Réputation</div><div class="k-val">' + Math.round(b.rep) + '<span class="k-sub">/100</span></div><div class="bar b-gold" style="margin:8px 0 0"><div class="fill" style="width:' + b.rep + '%"></div></div></div>' +
        '<div class="kpi"><div class="k-lbl">Salaires versés</div><div class="k-val" style="color:var(--red)">' + kfmt(b.wagesTotal || 0) + '</div></div></div>' +
        '<h3>Revenu · 60 dernières secondes</h3><canvas class="chart" id="bChart"></canvas>' +
        (top ? '<h3>Meilleures ventes</h3><div class="chip-row">' + top + '</div>' : '') +
        (b.type === 'boulangerie' ? '<h3>Commande spéciale</h3>' + (b.order
          ? '<div class="rowline' + ((b.stock[b.order.p] || 0) >= b.order.qty ? ' row-glow' : '') + '"><div><div class="lbl">📦 ' + b.order.qty + ' × ' + esc(b.order.pn) + ' — <b class="money">' + eur(b.order.reward) + '</b></div>' +
            '<div class="det">Expire dans <span class="cd mono" data-until="' + b.order.until + '">…</span> · stock : ' + (b.stock[b.order.p] || 0) + '/' + b.order.qty + '</div></div>' +
            '<button class="btn btn-primary btn-sm" data-act="orderFill" data-b="' + i + '"' + ((b.stock[b.order.p] || 0) < b.order.qty ? ' disabled' : '') + '>Honorer</button></div>'
          : '<div class="empty">Aucune commande. Elles apparaissent au fil de la journée.</div>') : '') +
        (b.type === 'immobilier' ? '<h3>Mandats de vente</h3><div class="rowline"><div><div class="lbl">' + (b.mandats || 0) + ' mandat(s) en portefeuille</div><div class="det">Chaque mandat génère des commissions automatiques.</div></div><button class="btn btn-primary btn-sm" data-act="buyMandat" data-b="' + i + '">Signer (300 €)</button></div>' : '') +
        (b.type === 'banque' ? '<h3>Pilotage</h3>' +
          '<div class="rowline"><div><div class="lbl">Taux crédit</div><div class="det">Bas = plus de demande</div></div><div class="stepper"><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tc" data-v="-0.5">−</button><span class="money step-val">' + num(b.tauxCredit, 6).toFixed(1) + ' %</span><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tc" data-v="0.5">+</button></div></div>' +
          '<div class="rowline"><div><div class="lbl">Taux livret (clients)</div><div class="det">Coût : dépôts × taux</div></div><div class="stepper"><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tl" data-v="-0.25">−</button><span class="money step-val">' + num(b.tauxLivret, 2).toFixed(2) + ' %</span><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tl" data-v="0.25">+</button></div></div>' +
          '<div class="rowline"><div><div class="lbl">Campagne de recrutement</div><div class="det">Niveau ' + Math.floor(num(b.mkt, 1, 0)) + ' · +comptes/s</div></div><button class="btn btn-primary btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="mkt">1 000 €</button></div>' +
          '<div class="grid3" style="margin-top:12px"><div class="kpi"><div class="k-lbl">Comptes</div><div class="k-val">' + Math.floor(num(b.accounts, 0, 0)) + '</div></div><div class="kpi"><div class="k-lbl">Dépôts</div><div class="k-val">' + kfmt(b.deposits) + '</div></div><div class="kpi"><div class="k-lbl">Encours crédit</div><div class="k-val">' + kfmt(b.loans) + '</div></div></div>' +
          '<h3>Clients joueurs de votre banque</h3><div id="extClients">' + skeleton(2) + '</div>' : '');
    }
    else if (T.bizTab === 'prod') {
      if (b.type === 'boulangerie') {
        body = '<h3>Matières premières</h3>' +
          Object.entries(DATA.bizTypes.boulangerie.mats).map(([id, m]) => '<div class="rowline"><div><div class="lbl">' + esc(m.n) + '</div><div class="det">Stock : <b class="mono">' + Math.floor(b.mats[id] || 0) + '</b> · ' + eur(m.p) + '/unité</div></div><div class="btn-row"><button class="btn btn-sm" data-act="buyMat" data-b="' + i + '" data-m="' + id + '" data-q="10">+10</button><button class="btn btn-sm btn-primary" data-act="buyMat" data-b="' + i + '" data-m="' + id + '" data-q="50">+50</button></div></div>').join('') +
          '<h3>Recettes & production</h3>' + DATA.bizTypes.boulangerie.prods.map(p => {
            const ing = Object.entries(p.in).map(([m, q]) => q + '× ' + DATA.bizTypes.boulangerie.mats[m].n).join(', ');
            return '<div class="rowline"><div><div class="lbl">' + esc(p.n) + ' ' + priceAdvice(b, p) + '</div><div class="det">' + esc(ing) + ' · stock <b class="mono">' + Math.floor(b.stock[p.id] || 0) + '</b> · vendus ' + Math.floor(b.counters[p.id] || 0) + '</div></div>' +
          '<div class="btn-row"><button class="btn btn-sm" data-act="craft" data-b="' + i + '" data-p="' + p.id + '" data-q="1">×1</button><button class="btn btn-sm" data-act="craft" data-b="' + i + '" data-p="' + p.id + '" data-q="10">×10</button>' +
            '<span class="price-ctl"><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="-0.1">−</button><span class="money">' + eur(b.prices[p.id]) + '</span><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="0.1">+</button></span></div></div>';
          }).join('');
      } else if (b.type === 'magasin') {
        body = '<div class="biz-chips">' + (perk(b, 'autoRestock') ? '<span class="chip green">Réassort automatique actif</span>' : '<span class="chip">Réassort manuel</span>') + '</div>' +
          '<h3>Rayons</h3>' + DATA.bizTypes.magasin.prods.map(p => '<div class="rowline"><div><div class="lbl">' + esc(p.n) + ' ' + priceAdvice(b, p) + '</div><div class="det">Grossiste ' + eur(p.cost) + ' · stock <b class="mono">' + Math.floor(b.stock[p.id] || 0) + '</b> · vendus ' + Math.floor(b.counters[p.id] || 0) + '</div></div>' +
          '<div class="btn-row"><button class="btn btn-sm" data-act="buyStock" data-b="' + i + '" data-p="' + p.id + '" data-q="10">+10</button><button class="btn btn-sm btn-primary" data-act="buyStock" data-b="' + i + '" data-p="' + p.id + '" data-q="50">+50</button>' +
          '<span class="price-ctl"><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="-0.1">−</button><span class="money">' + eur(b.prices[p.id]) + '</span><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="0.1">+</button></span></div></div>').join('');
      } else body = '<div class="empty">Pas de production pour ce type d’entreprise.</div>';
    }
    else if (T.bizTab === 'mkt') {
      body = '<div class="biz-chips">' + (activeChips(b) || '<span class="chip">Aucune campagne active</span>') + '</div>' +
        ((DATA.mkt[b.type] || []).map(a => {
          const owned = a.once && perk(b, a.perk);
          return '<div class="rowline"><div><div class="lbl">' + esc(a.n) + (owned ? ' <span class="chip green">ACTIF</span>' : '') + '</div><div class="det">' + esc(a.d) + '</div></div>' +
          (owned ? '' : '<button class="btn btn-sm btn-primary" data-act="mktDo" data-b="' + i + '" data-a="' + a.id + '">' + eur(a.cost) + '</button>') + '</div>';
        }).join('') || '<div class="empty">Aucune campagne disponible.</div>') +
        '<div class="ann-row"><button class="btn btn-primary" data-act="openAnnounce">📣 Annonce publique (tous les joueurs)</button></div>';
    }
    else if (T.bizTab === 'hr') {
      const max = bt.maxEmp || 4;
      const empList = b.emps.map((e, ei) => '<div class="rowline"><div style="display:flex;align-items:center;gap:12px"><span class="cand-ava">' + esc(String(e.n).split(' ').map(x => x[0]).join('').slice(0, 2)) + '</span><div><div class="lbl">' + esc(e.n) + '</div><div class="det">' + eur(e.h) + '/h · ' + eur(e.h * 151.67) + '/mois</div></div></div><button class="btn btn-sm btn-danger" data-act="fire" data-b="' + i + '" data-i="' + ei + '">Licencier</button></div>').join('') || '<div class="empty">Aucun salarié.</div>';
      body = '<div class="rowline"><div><div class="lbl">Effectif : ' + b.emps.length + ' / ' + max + '</div><div class="det">Masse salariale : <b class="money">' + eur(b.emps.reduce((a, e) => a + e.h * 151.67, 0)) + '</b>/mois · +8 % de demande par salarié</div></div>' +
        '<button class="btn btn-primary' + (b.emps.length >= max ? '' : ' btn-pop') + '" data-act="hire" data-b="' + i + '"' + (b.emps.length >= max ? ' disabled' : '') + '>Recruter</button></div>' + empList;
    }
    else if (T.bizTab === 'ups') {
      body = (DATA.ups[b.type] || []).map(u => {
        const lvl = upLvl(b, u.id), maxed = lvl >= u.max;
        const cost = Math.round(u.cost * Math.pow(u.grow, lvl) * skillBonus('upgrade'));
        return '<div class="rowline"><div><div class="lbl">' + esc(u.n) + ' <span class="chip gold">Niv ' + lvl + '/' + u.max + '</span></div><div class="det">' + esc(u.d) + '</div>' +
          '<div class="bar b-gold up-bar"><div class="fill" style="width:' + (lvl / u.max * 100) + '%"></div></div></div>' +
          (maxed ? '<span class="chip green">MAX</span>' : '<button class="btn btn-sm btn-primary" data-act="upgrade" data-b="' + i + '" data-u="' + u.id + '"' + (balance() < cost ? ' disabled' : '') + '>' + eur(cost) + '</button>') + '</div>';
      }).join('') || '<div class="empty">Aucune amélioration disponible.</div>';
    }
    else {
      const sold = Object.values(b.counters || {}).reduce((a, x) => a + x, 0);
      body = '<table class="t"><tr><td>CA cumulé</td><td class="money">' + eur(b.rev) + '</td></tr>' +
        '<tr><td>Articles vendus</td><td class="mono">' + Math.floor(sold) + '</td></tr>' +
        '<tr><td>Masse salariale versée</td><td class="money neg">−' + eur(b.wagesTotal || 0) + '</td></tr>' +
        '<tr><td>Bénéfice du cycle (avant IS 15 %)</td><td class="money' + (num(b.profit, 0) < 0 ? ' neg' : '') + '">' + eur(b.profit || 0) + '</td></tr></table>' +
        '<h3>Revenu · 60 dernières secondes</h3><canvas class="chart" id="bChart"></canvas>';
    }
    return '<button class="btn btn-ghost btn-sm" data-act="backBiz">← Mes entreprises</button>' +
      '<div class="biz-head"><h1>' + esc(b.name) + '</h1><div class="sub" style="margin:0">' + esc(bt.label || '') + ' · <span data-weather-chip>' + curWeather().ico + ' ' + esc(curWeather().n) + '</span></div></div>' +
      bizTabs(b) + '<div class="panel">' + body + '</div>';
  }

  function rBanque() {
    if (!G.bank.bankId) {
      return '<h1>Choisir sa banque</h1><div class="sub">Cliquez sur une banque pour la découvrir, puis ouvrez votre compte. Salaires, impôts et transferts y passeront.</div>' +
        '<div class="grid2"><div>' + DATA.banks.map((b, k) =>
          '<div class="bank-offer" style="animation-delay:' + (k * 0.04) + 's" data-act="bankDetails" data-id="' + b.id + '" data-name="' + esc(b.n) + '" data-rate="' + b.lv + '"><div class="bo-name">🏦 ' + esc(b.n) + '</div><div class="bo-det">Livret A ' + b.lv + ' %/an · ' + esc(b.desc) + '</div></div>').join('') + '</div>' +
        '<div><h3 class="sec-h">Banques fondées par les joueurs</h3><div id="playerBanksList">' + skeleton(2) + '</div></div></div>';
    }
    const bd = isPlayerBank(G.bank.bankId) ? null : DATA.banks.find(b => b.id === G.bank.bankId);
    const bankName = G.bank.bankName || (bd ? bd.n : 'Banque');
    const loans = G.bank.loans.length ? G.bank.loans.map((L, i) => '<div class="rowline"><div><div class="lbl">' + esc(L.n) + '</div><div class="det">Reste <b class="money">' + eur(L.reste) + '</b> · ' + eur(L.mens) + '/mois</div></div><button class="btn btn-sm" data-act="loanRepay" data-i="' + i + '">Solder</button></div>').join('') : '<div class="empty">Aucun crédit en cours.</div>';
    const prelev = [];
    if (G.rental) prelev.push(['Loyer', G.rental.loyer]);
    G.houses.forEach(h => prelev.push(['Charges ' + ((DATA.homes[h.i] || {}).n || ''), h.c]));
    G.insurances.forEach(id => { const a = DATA.insurers.find(x => x.id === id); if (a) prelev.push(['Assurance ' + a.n, a.m]); });
    G.bank.loans.forEach(L => prelev.push(['Crédit ' + L.n, L.mens]));
    const emp = G.biz.reduce((a, b) => a + b.emps.length, 0);
    if (emp) prelev.push(['URSSAF (' + emp + ' salarié·e·s)', emp * 45]);
    const jrn = journalRows(30);
    return '<h1>Banque — ' + esc(bankName) + '</h1><div class="sub">Votre portefeuille de cartes, votre terminal et vos crédits.</div>' +
      walletHTML() +
      '<div class="grid2" style="margin-top:18px"><div>' +
      '<div class="kpi"><div class="k-lbl">Compte courant</div><div class="k-val" data-bal="cb">' + eur(G.bank.compte) + '</div><div class="det" style="margin-top:4px">Liquide en poche : <span data-bal="cash">' + eur(G.cash) + '</span></div></div>' +
      '<div class="kpi" style="margin-top:12px"><div class="k-lbl">Livret A · ' + bankRate() + ' %/an</div><div class="k-val gold" data-bal="livret">' + eur(G.bank.livret) + '</div><div class="det" style="margin-top:4px">Plafond 22 950 € · place restante ' + eur(Math.max(0, 22950 - G.bank.livret)) + '</div></div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn btn-primary" data-act="openSendMoney">💸 Envoyer de l’argent</button>' +
      '<button class="btn btn-danger btn-sm" data-act="leaveBank">Clôturer le compte</button></div></div>' +
      '<div class="kpi"><div class="k-lbl">Prélèvements mensuels (60 s)</div>' +
      (prelev.length ? prelev.map(([l, m]) => '<div class="rowline thin"><div class="lbl sm">' + esc(l) + '</div><span class="money neg">−' + eur(m) + '</span></div>').join('') : '<div class="empty">Aucun prélèvement.</div>') + '</div></div>' +
      '<div class="grid2" style="margin-top:18px"><div class="panel"><h2>Mouvements internes</h2>' +
      '<label class="m-field">Montant (€) — virgule acceptée<div class="btn-row" style="margin-top:6px"><input type="text" inputmode="decimal" class="mini amt-input" id="bankAmt" placeholder="0,00" autocomplete="off">' +
      '<button class="btn btn-sm" data-act="setBankAmt" data-v="100">+100</button><button class="btn btn-sm" data-act="setBankAmt" data-v="500">+500</button><button class="btn btn-sm" data-act="setBankAmt" data-v="1000">+1000</button></div></label>' +
      '<div class="tr-grid">' +
      trRow('🪙 → 🏦', 'Déposer du liquide', 'Poche : ' + eur(G.cash), 'cash', 'deposit', G.cash > 0, 'Liquide → compte') +
      trRow('🏦 → 🪙', 'Retirer des espèces', 'Compte : ' + eur(G.bank.compte), 'compte', 'withdraw', G.bank.compte > 0, 'Compte → liquide') +
      trRow('🏦 → 📈', 'Placer sur le Livret A (' + bankRate() + ' %)', 'Compte : ' + eur(G.bank.compte) + ' · place : ' + eur(Math.max(0, 22950 - G.bank.livret)), 'livretCap', 'toLivret', G.bank.compte > 0 && G.bank.livret < 22950, '→ Livret A') +
      trRow('📈 → ', 'Récupérer du Livret', 'Livret : ' + eur(G.bank.livret), 'livret', 'fromLivret', G.bank.livret > 0, 'Livret A →') +
      '</div>' +
      '<h3>Historique de votre solde</h3><canvas class="chart" id="chBal"></canvas>' +
      '</div>' +
      '<div class="panel"><h2>Crédits</h2><label class="m-field">Montant du crédit (€)<div class="btn-row" style="margin-top:6px"><input type="text" inputmode="numeric" class="mini amt-input" id="loanAmt" placeholder="10 000" autocomplete="off">' +
      '<button class="btn btn-sm" data-act="setBankAmt" data-v="5000" data-of="loan">5 k€</button><button class="btn btn-sm" data-act="setBankAmt" data-v="50000" data-of="loan">50 k€</button></div></label>' +
      '<div class="btn-row" style="margin-top:10px;flex-wrap:wrap">' + DATA.loans.map(l => '<button class="btn btn-sm" data-act="loanTake" data-t="' + l.id + '">' + l.n + ' · ' + l.rate + ' %</button>').join('') + '</div><h3>En cours</h3>' + loans + '</div></div>' +
      '<div class="panel"><h2>Relevé de compte</h2>' +
      '<div class="jf-row"><button class="jf-btn' + (T.journalF === 'all' ? ' active' : '') + '" data-act="journalF" data-f="all">Tout</button>' +
      '<button class="jf-btn' + (T.journalF === 'in' ? ' active' : '') + '" data-act="journalF" data-f="in">Entrées</button>' +
      '<button class="jf-btn' + (T.journalF === 'out' ? ' active' : '') + '" data-act="journalF" data-f="out">Sorties</button></div>' +
      '<div class="journal-scroll"><table class="t"><tr><th>Heure</th><th>Libellé</th><th style="text-align:right">Montant</th></tr>' + jrn + '</table></div></div>';
  }
  const KIND_ICO = { in: '📥', out: '📤', tax: '🏛', bank: '🏦', biz: '🏪', food: '🥖', ill: '🕶', event: '✦' };
  function trRow(ico, title, src, of, act, enabled, btnLabel) {
    return '<div class="tr-row"><div class="tr-ico">' + ico + '</div><div style="flex:1"><div class="lbl sm">' + title + '</div><div class="det">' + src + '</div></div>' +
      '<button class="btn btn-sm" data-act="setBankAmt" data-v="max" data-of="' + of + '" title="Remplir avec le maximum transférable">Max</button>' +
      '<button class="btn btn-sm btn-primary" data-act="' + act + '"' + (enabled ? '' : ' disabled') + '>' + btnLabel + '</button></div>';
  }
  function journalRows(limit) {
    let rows = (G.journal || []).slice();
    if (T.journalF === 'in') rows = rows.filter(j => j.amt >= 0);
    if (T.journalF === 'out') rows = rows.filter(j => j.amt < 0);
    rows = rows.slice(0, limit || 30);
    return rows.map(j => '<tr><td class="mono dim">' + new Date(j.t).toLocaleTimeString('fr-FR') + '</td>' +
      '<td>' + (KIND_ICO[j.kind] || '•') + ' ' + esc(j.label) + '</td>' +
      '<td class="money ' + (j.amt < 0 ? 'neg' : '') + '" style="text-align:right">' + (j.amt >= 0 ? '+' : '−') + eur(Math.abs(j.amt)) + '</td></tr>').join('') ||
      '<tr><td colspan="3" class="empty">Aucune opération' + (T.journalF !== 'all' ? ' pour ce filtre' : '') + '.</td></tr>';
  }

  /* ═══════════ PORTEFEUILLE DE CARTES & TERMINAL BANCAIRE 3D ═══════════ */
  let term = null; // { which, el, clone, inserted, lastReceipt }

  function pcard(which, skin, subtitle, bal, frozen, brand) {
    return '<div class="pcard ' + skin + (frozen ? ' frozen' : '') + '" data-card="' + which + '" data-act="openTerminal" data-which="' + which + '" data-tilt role="button" tabindex="0" title="Cliquer pour insérer la carte dans le terminal">' +
      (frozen ? '<div class="pcard-ice">❄ GELÉE</div>' : '') +
      '<div class="bc-shine"></div><div class="bc-top"><div class="bc-chip"></div><span class="bc-brand">' + esc(brand) + '</span></div>' +
      '<div class="bc-num">•••• •••• •••• ' + (which === 'livret' ? '7701' : '4242') + '</div>' +
      '<div class="bc-bottom"><div><div class="bc-lbl">Titulaire</div><div class="bc-name">' + esc(G.name) + '</div></div>' +
      '<div style="text-align:right"><div class="bc-lbl">' + esc(subtitle) + '</div><div class="bc-bal" data-bal="' + which + '">' + eur(bal) + '</div></div></div></div>';
  }
  function lockedCard() {
    const ok = level(G.xp) >= 10;
    return '<div class="pcard skin-locked' + (ok ? ' claimable' : '') + '"' + (ok ? ' data-act="claimPremium" role="button" tabindex="0" title="Réclamer votre carte premium"' : '') + '>' +
      '<div class="lock-ico">' + (ok ? '💎' : '🔒') + '</div><div class="lock-t">HEXAPAY PREMIUM</div>' +
      '<div class="lock-d">' + (ok ? 'Niveau atteint — cliquez pour réclamer' : 'Compte rémunéré 0,5 %/an · débloquée au niveau 10 (vous : ' + level(G.xp) + ')') + '</div></div>';
  }
  function walletHTML() {
    if (!G.bank.bankId) return '';
    return '<div class="wallet">' +
      pcard('cb', G.bank.cardPremium ? 'skin-black' : 'skin-blue', G.bank.bankName || 'Banque', G.bank.compte, cardFrozen('cb'), G.bank.cardPremium ? 'HEXAPAY PREMIUM' : 'HEXAPAY') +
      pcard('livret', 'skin-red', 'Livret A · ' + bankRate() + ' %/an', G.bank.livret, cardFrozen('livret'), 'LIVRET A') +
      (!G.bank.cardPremium ? lockedCard() : '') +
      '</div>' +
      '<div class="wallet-hint"> Cliquez sur une carte : elle s’insère dans le terminal 3D pour réaliser vos opérations.</div>';
  }

  function termScreenHTML() {
    const which = term.which;
    const frozen = cardFrozen(which === 'livret' ? 'livret' : 'cb');
    const brand = which === 'livret' ? 'LIVRET A' : (G.bank.cardPremium ? 'HEXAPAY PREMIUM' : 'HEXAPAY');
    const bal = which === 'livret' ? G.bank.livret : G.bank.compte;
    if (frozen) {
      return '<div class="ts-head warn">❄ CARTE GELÉE</div>' +
        '<div class="ts-body">Les opérations sont suspendues pour cette carte.</div>' +
        '<div class="ts-grid"><button class="ts-btn ok" data-term="freeze">🔥 Dégeler la carte</button>' +
        '<button class="ts-btn" data-term="eject">⏏ Éjecter</button></div>' +
        '<div class="ts-status" id="termStatus">Authentification refusée.</div>';
    }
    const rows = [];
    if (which !== 'livret') {
      rows.push('<button class="ts-btn" data-term="act" data-from="cash" data-to="compte">🪙 Dépôt espèces</button>');
      rows.push('<button class="ts-btn" data-term="act" data-from="compte" data-to="cash">💵 Retrait DAB</button>');
    }
    rows.push('<button class="ts-btn" data-term="act" data-from="compte" data-to="livret">📈 Compte → Livret A</button>');
    rows.push('<button class="ts-btn" data-term="act" data-from="livret" data-to="compte">📉 Livret A → compte</button>');
    if (which !== 'livret') rows.push('<button class="ts-btn" data-term="sendform">💸 Envoyer à un joueur</button>');
    rows.push('<button class="ts-btn" data-term="statement">📜 Relevé d’opérations</button>');
    rows.push('<button class="ts-btn" data-term="dues">📅 Échéances mensuelles</button>');
    return '<div class="ts-head">' + (which === 'livret' ? '🔴' : G.bank.cardPremium ? '⚫' : '🔵') + ' ' + esc(brand) + ' <span class="ts-bal">' + eur(bal) + '</span></div>' +
      '<div class="ts-sub">' + esc(G.bank.bankName || 'Banque') + ' · titulaire ' + esc(G.name) + ' · plafond ' + eur(cardPlafond()) + '/op</div>' +
      '<label class="ts-amt">Montant (€)<input id="termAmt" inputmode="decimal" autocomplete="off" placeholder="0,00"></label>' +
      '<div class="ts-grid">' + rows.join('') + '</div>' +
      '<div class="ts-status" id="termStatus">Prêt. Sélectionnez une opération.</div>';
  }
  function termRefresh() {
    if (!term) return;
    const scr = term.el.querySelector('.term-screen');
    if (scr && term.inserted) {
      const amt = (document.getElementById('termAmt') || {}).value || '';
      scr.innerHTML = termScreenHTML();
      const ni = document.getElementById('termAmt');
      if (ni && amt) ni.value = amt;
    }
  }
  function termReceipt(label, amt) {
    if (!term || !term.el) return;
    term.lastReceipt = { label, amt, t: Date.now(), code: Math.floor(100000 + Math.random() * 899999) };
    const slot = term.el.querySelector('.term-receipt');
    if (!slot) return;
    const r = document.createElement('div');
    r.className = 'receipt';
    r.innerHTML = '<div class="rc-brand">HEXAPAY T-800</div><div class="rc-line">' + esc(label) + '</div>' +
      '<div class="rc-amt">' + eur(amt) + '</div>' +
      '<div class="rc-line dim2">' + new Date().toLocaleString('fr-FR') + ' · AUTH ' + term.lastReceipt.code + '</div>' +
      '<div class="rc-line dim2">MERCI DE VOTRE CONFIANCE</div>';
    slot.innerHTML = '';
    slot.appendChild(r);
    setTimeout(() => { r.classList.add('fade'); setTimeout(() => r.remove(), 700); }, 4200);
    const st = term.el.querySelector('#termStatus');
    if (st) { st.textContent = '✓ Opération autorisée — ' + label + ' · ' + eur(amt); st.className = 'ts-status ok'; }
  }
  function termRender(view) {
    if (!term) return;
    const scr = term.el.querySelector('.term-screen');
    if (!scr) return;
    if (view === 'statement') {
      const rows = (G.journal || []).slice(0, 10).map(j => '<div class="ts-row"><span class="dim2">' + new Date(j.t).toLocaleTimeString('fr-FR') + '</span><span style="flex:1">' + esc(j.label) + '</span><span class="' + (j.amt < 0 ? 'negx' : 'pos') + '">' + (j.amt >= 0 ? '+' : '−') + eur(Math.abs(j.amt)) + '</span></div>').join('') || '<div class="ts-body">Aucune opération.</div>';
      scr.innerHTML = '<div class="ts-head">📜 RELEVÉ</div><div class="ts-scroll">' + rows + '</div>' +
        '<div class="ts-grid"><button class="ts-btn" data-term="menu">← Menu</button><button class="ts-btn" data-term="eject">⏏ Éjecter</button></div>';
    } else if (view === 'dues') {
      const prelev = [];
      if (G.rental) prelev.push(['Loyer', G.rental.loyer]);
      G.houses.forEach(h => prelev.push(['Charges ' + ((DATA.homes[h.i] || {}).n || ''), h.c]));
      G.insurances.forEach(id => { const a = DATA.insurers.find(x => x.id === id); if (a) prelev.push(['Assurance ' + a.n, a.m]); });
      G.bank.loans.forEach(L => prelev.push(['Crédit ' + L.n, L.mens]));
      const emp = G.biz.reduce((a, b) => a + b.emps.length, 0);
      if (emp) prelev.push(['URSSAF', emp * 45]);
      scr.innerHTML = '<div class="ts-head">📅 ÉCHÉANCES (60 s)</div><div class="ts-scroll">' +
        (prelev.length ? prelev.map(([l, m]) => '<div class="ts-row"><span style="flex:1">' + esc(l) + '</span><span class="negx">−' + eur(m) + '</span></div>').join('') : '<div class="ts-body">Aucune échéance.</div>') +
        '</div><div class="ts-grid"><button class="ts-btn" data-term="menu">← Menu</button><button class="ts-btn" data-term="eject">⏏ Éjecter</button></div>';
    } else if (view === 'sendform') {
      scr.innerHTML = '<div class="ts-head">💸 ENVOI JOUEUR</div>' +
        '<label class="ts-amt">Pseudo<input id="termTo" autocomplete="off" placeholder="Pseudo du destinataire"></label>' +
        '<label class="ts-amt">Montant (€)<input id="termAmt" inputmode="decimal" autocomplete="off" placeholder="0,00"></label>' +
        '<div class="ts-grid"><button class="ts-btn ok" data-term="send">Envoyer</button><button class="ts-btn" data-term="menu">← Menu</button></div>' +
        '<div class="ts-status" id="termStatus">Plafond : ' + eur(cardPlafond()) + ' / opération.</div>';
    } else if (view === 'plafond') {
      scr.innerHTML = '<div class="ts-head">🛡 PLAFOND CARTE</div><div class="ts-body">Actuel : ' + eur(cardPlafond()) + ' / opération</div>' +
        '<div class="ts-grid">' + [500, 1000, 2000, 5000, 10000].map(v => '<button class="ts-btn" data-term="plafondSet" data-v="' + v + '">' + eur0(v) + '</button>').join('') + '</div>' +
        '<div class="ts-grid"><button class="ts-btn" data-term="menu">← Menu</button></div>';
    } else {
      scr.innerHTML = termScreenHTML();
    }
  }

  function openTerminal(which) {
    if (!G || !G.bank.bankId) return toast('Ouvrez d’abord un compte bancaire.', 'warn');
    if (term) return;
    which = which === 'livret' ? 'livret' : 'cb';
    FX.sound('click');
    const ov = document.createElement('div');
    ov.className = 'term-ov';
    ov.innerHTML =
      '<div class="term-back"></div>' +
      '<div class="term-scene">' +
        '<div class="term-device">' +
          '<div class="term-top"><span class="term-brand">HEXAPAY&nbsp;T-800</span><span class="term-led"></span></div>' +
          '<div class="term-slot"><div class="term-slot-lip"></div></div>' +
          '<div class="term-screen off"></div>' +
          '<div class="term-keypad">' +
            '<button class="tkey" data-term="menu" title="Menu">☰</button>' +
            '<button class="tkey" data-term="receiptLast" title="Dernier ticket">🧾</button>' +
            '<button class="tkey" data-term="plafond" title="Plafond">🛡</button>' +
            '<button class="tkey cold" data-term="freeze" title="Geler / dégeler la carte">❄</button>' +
            '<button class="tkey" data-term="statement" title="Relevé">📜</button>' +
            '<button class="tkey danger" data-term="eject" title="Éjecter la carte">⏏</button>' +
          '</div>' +
          '<div class="term-receipt"></div>' +
        '</div>' +
        '<div class="term-side"><div class="term-hint" id="termHint">🖱 Saisissez votre carte et approchez-la du lecteur…</div>' +
        '<div class="term-side-cards" id="termSideCards"></div></div>' +
      '</div>';
    document.body.appendChild(ov);
    term = { which, el: ov, inserted: false, clone: null, lastReceipt: null };

    // clone 3D de la carte source (FLIP)
    const srcEl = document.querySelector('[data-card="' + which + '"]');
    const clone = document.createElement('div');
    clone.className = 'term-clone-wrap';
    const skin = which === 'livret' ? 'skin-red' : (G.bank.cardPremium ? 'skin-black' : 'skin-blue');
    clone.innerHTML = '<div class="pcard ' + skin + ' clone">' + (cardFrozen(which) ? '<div class="pcard-ice">❄ GELÉE</div>' : '') +
      '<div class="bc-shine"></div><div class="bc-top"><div class="bc-chip"></div><span class="bc-brand">' + (which === 'livret' ? 'LIVRET A' : 'HEXAPAY') + '</span></div>' +
      '<div class="bc-num">•••• •••• •••• ' + (which === 'livret' ? '7701' : '4242') + '</div>' +
      '<div class="bc-bottom"><div><div class="bc-lbl">Titulaire</div><div class="bc-name">' + esc(G.name) + '</div></div></div></div>';
    ov.appendChild(clone);
    term.clone = clone;
    const slot = ov.querySelector('.term-slot');

    const fly = () => {
      if (!ov.isConnected || !term || term.el !== ov) return;
      const sr = slot.getBoundingClientRect();
      clone.classList.add('fly');
      clone.style.left = (sr.left + sr.width / 2 - 130) + 'px';
      clone.style.top = (sr.top - 74) + 'px';
      clone.style.transform = 'scale(.86) rotateY(14deg) rotateX(24deg)';
    };
    const insert = () => {
      if (!ov.isConnected || !term || term.el !== ov) return;
      clone.style.opacity = ''; // rend la main aux classes CSS (.insert → opacity 0)
      clone.classList.add('insert');
      slot.classList.add('glow');
      FX.sound('craft');
      setTimeout(() => {
        if (!ov.isConnected || !term || term.el !== ov) return;
        term.inserted = true;
        const scr = ov.querySelector('.term-screen');
        scr.classList.remove('off');
        scr.classList.add('on');
        termRender('menu');
        const hint = el('termHint');
        if (hint) hint.innerHTML = '✅ Carte authentifiée. Choisissez une opération — le ticket s’imprime à chaque validation.';
        // mini-portefeuille latéral (autres cartes accessibles)
        const side = el('termSideCards');
        if (side) side.innerHTML = walletHTML();
      }, reducedMotion() ? 0 : 480);
    };
    if (srcEl && !reducedMotion()) {
      const r = srcEl.getBoundingClientRect();
      clone.style.left = r.left + 'px';
      clone.style.top = r.top + 'px';
      clone.style.opacity = '1';
      srcEl.style.visibility = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(fly));
      setTimeout(insert, reducedMotion() ? 0 : 620);
    } else {
      if (srcEl) srcEl.style.visibility = 'hidden';
      clone.style.opacity = '0';
      insert();
    }
  }

  function closeTerminal(eject) {
    if (!term) return;
    const t = term; term = null;
    const srcEl = document.querySelector('[data-card="' + t.which + '"]');
    const finish = () => {
      if (srcEl) srcEl.style.visibility = '';
      t.el.classList.add('out');
      setTimeout(() => t.el.remove(), 380);
      FX.sound('back');
      refresh(true);
    };
    if (eject && t.clone && !reducedMotion()) {
      t.clone.classList.remove('insert');
      t.clone.classList.add('ejecting');
      const slot = t.el.querySelector('.term-slot');
      slot && slot.classList.remove('glow');
      FX.sound('craft');
      setTimeout(() => {
        if (srcEl) {
          const r = srcEl.getBoundingClientRect();
          t.clone.classList.remove('fly');
          t.clone.classList.add('fly');
          t.clone.style.left = r.left + 'px';
          t.clone.style.top = r.top + 'px';
          t.clone.style.transform = 'none';
        }
        setTimeout(finish, 520);
      }, 260);
    } else finish();
  }

  /* délégation des touches du terminal */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-term]');
    if (!b || !term) return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.term;
    FX.sound('click');
    if (a === 'eject') return closeTerminal(true);
    if (a === 'menu') return termRender('menu');
    if (a === 'statement') return termRender('statement');
    if (a === 'dues') return termRender('dues');
    if (a === 'sendform') return termRender('sendform');
    if (a === 'plafond') return termRender('plafond');
    if (a === 'plafondSet') { A.setPlafond({ v: b.dataset.v }); return termRender('plafond'); }
    if (a === 'freeze') { A.toggleFreeze({ card: term.which === 'livret' ? 'livret' : 'cb' }); return termRefresh(), termRender('menu'); }
    if (a === 'receiptLast') {
      if (term.lastReceipt) termReceipt(term.lastReceipt.label, term.lastReceipt.amt);
      else { const st = term.el.querySelector('#termStatus'); if (st) st.textContent = 'Aucun ticket précédent.'; }
      return;
    }
    if (a === 'act') {
      const st = term.el.querySelector('#termStatus');
      if (st) { st.textContent = '⏳ Traitement en cours…'; st.className = 'ts-status'; }
      setTimeout(() => A.moveMoney({ from: b.dataset.from, to: b.dataset.to }), reducedMotion() ? 0 : 420);
      return;
    }
    if (a === 'send') {
      const st = term.el.querySelector('#termStatus');
      if (st) { st.textContent = '⏳ Connexion au réseau interbancaire…'; st.className = 'ts-status'; }
      setTimeout(() => A.sendToPlayer({ to: ((document.getElementById('termTo') || {}).value || ''), v: parseAmount(((document.getElementById('termAmt') || {}).value)) }), reducedMotion() ? 0 : 420);
      return;
    }
  });

  /* ═══════════ PAIEMENT SANS CONTACT (NFC) — glisser la carte sur le lecteur ═══════════ */
  let nfc = null;
  function nfcPay(o) {
    if (nfc || !G) return;
    FX.sound('click');
    const ov = document.createElement('div');
    ov.className = 'nfc-ov';
    const skin = G.bank.cardPremium ? 'skin-black' : 'skin-blue';
    ov.innerHTML =
      '<div class="nfc-back"></div>' +
      '<div class="nfc-scene">' +
        '<div class="nfc-pad" id="nfcPad">' +
          '<div class="nfc-waves"><i></i><i></i><i></i></div>' +
          '<div class="nfc-sym">)))</div>' +
          '<div class="nfc-amt">' + eur(o.cost) + '</div>' +
          '<div class="nfc-lbl">' + esc(o.label || 'Paiement') + '</div>' +
          '<div class="nfc-state" id="nfcState">Approchez votre carte…</div>' +
        '</div>' +
      '</div>' +
      '<div class="nfc-card" id="nfcCard"><div class="pcard ' + skin + ' nfc-pcard">' +
        '<div class="bc-shine"></div><div class="bc-top"><div class="bc-chip"></div><span class="bc-brand">' + (G.bank.cardPremium ? 'HEXAPAY PREMIUM' : 'HEXAPAY') + '</span></div>' +
        '<div class="bc-num">•••• •••• •••• 4242</div>' +
        '<div class="bc-bottom"><div><div class="bc-lbl">Titulaire</div><div class="bc-name">' + esc(G.name) + '</div></div></div>' +
      '</div></div>' +
      '<div class="nfc-hint">' + (reducedMotion() ? 'Confirmez le paiement sur le lecteur.' : '🖱 Faites <b>glisser la carte</b> sur le lecteur pour payer en sans contact') + '</div>' +
      '<button class="btn btn-ghost nfc-cancel" data-act="nfcCancel">Annuler l’achat</button>';
    document.body.appendChild(ov);
    const pad = ov.querySelector('#nfcPad');
    const card = ov.querySelector('#nfcCard');
    nfc = { cost: o.cost, label: o.label, act: o.act, data: o.data || {}, el: ov, pad, card, done: false, dragging: false };

    // position de repos de la carte (à droite du lecteur)
    const home = () => {
      const pr = pad.getBoundingClientRect();
      return { x: Math.min(window.innerWidth - 280, pr.right + 70), y: pr.top + pr.height / 2 - 81 };
    };
    const h0 = home();
    card.style.left = h0.x + 'px'; card.style.top = h0.y + 'px';
    nfc.home = h0;

    if (!reducedMotion()) {
      let ox = 0, oy = 0;
      const onMove = e => {
        if (!nfc || !nfc.dragging || nfc.done) return;
        const x = e.clientX - ox, y = e.clientY - oy;
        card.style.left = x + 'px'; card.style.top = y + 'px';
        const pr = pad.getBoundingClientRect();
        const over = e.clientX > pr.left - 14 && e.clientX < pr.right + 14 && e.clientY > pr.top - 14 && e.clientY < pr.bottom + 14;
        pad.classList.toggle('hover', over);
        card.style.setProperty('--tilt', Math.max(-10, Math.min(10, (e.movementX || 0) * 0.6)) + 'deg');
      };
      const onUp = e => {
        if (!nfc || !nfc.dragging || nfc.done) return;
        nfc.dragging = false;
        card.classList.remove('drag');
        pad.classList.remove('hover');
        const pr = pad.getBoundingClientRect();
        const cx = e.clientX, cy = e.clientY;
        if (cx > pr.left - 14 && cx < pr.right + 14 && cy > pr.top - 14 && cy < pr.bottom + 14) nfcTap();
        else { card.classList.add('home'); card.style.left = nfc.home.x + 'px'; card.style.top = nfc.home.y + 'px'; setTimeout(() => card && card.classList.remove('home'), 450); }
      };
      card.addEventListener('pointerdown', e => {
        if (!nfc || nfc.done) return;
        nfc.dragging = true;
        const r = card.getBoundingClientRect();
        ox = e.clientX - r.left; oy = e.clientY - r.top;
        card.classList.add('drag');
        e.preventDefault();
      });
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      // nettoyage des listeners à la fermeture
      const clean = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
      ov.addEventListener('remove', clean);
      nfc.clean = clean;
    }
    // repli accessible : cliquer le lecteur = payer
    pad.addEventListener('click', () => nfcTap());
  }
  function nfcTap() {
    if (!nfc || nfc.done) return;
    nfc.done = true;
    const { card, pad, el } = nfc;
    const pr = pad.getBoundingClientRect();
    card.classList.add('tap');
    card.style.left = (pr.left + pr.width / 2 - 110) + 'px';
    card.style.top = (pr.top + pr.height / 2 - 68) + 'px';
    pad.classList.add('active');
    FX.sound('nfc');
    setTimeout(() => FX.sound('nfcOk'), 240);
    const st = el.querySelector('#nfcState');
    if (st) { st.textContent = '✓ Paiement accepté — ' + eur(nfc.cost); st.classList.add('ok'); }
    setTimeout(() => FX.spark(pr.left + pr.width / 2, pr.top + pr.height / 2, '#4bb380', 18), 300);
    setTimeout(() => {
      if (!nfc) return;
      const { act, data } = nfc;
      nfcClose(true);
      if (act && A[act]) A[act](data);
    }, 950);
  }
  function nfcForce() { // tests & accessibilité : exécute immédiatement, sans animation
    if (!nfc) return;
    const { act, data, el, clean } = nfc;
    nfc = null;
    if (clean) clean();
    el.remove();
    if (act && A[act]) A[act](data);
  }
  function nfcClose(executed) {
    if (!nfc) return;
    const n = nfc; nfc = null;
    if (n.clean) n.clean();
    n.el.classList.add('out');
    setTimeout(() => n.el.remove(), 350);
    if (!executed) FX.sound('back');
  }

  /* ═══════════ SOLDES ANIMÉS (cartes & KPI) + COMPTEUR HAUT-DROIT 60 fps ═══════════ */
  const balDisp = {};
  function updateBalEls() {
    if (!G) return;
    document.querySelectorAll('[data-bal]').forEach(e2 => {
      const k = e2.dataset.bal;
      const target = k === 'cb' ? G.bank.compte : k === 'livret' ? G.bank.livret : k === 'cash' ? G.cash : k === 'net' ? netWorth() : 0;
      let cur = (k in balDisp) ? balDisp[k] : target;
      const diff = target - cur;
      if (Math.abs(diff) < 0.005) cur = target; else cur += diff * 0.22;
      balDisp[k] = cur;
      const txt = eur(cur);
      if (e2.__lastTxt !== txt) {
        e2.__lastTxt = txt; e2.textContent = txt;
        if (Math.abs(diff) >= 0.5) {
          e2.classList.remove('bal-up', 'bal-down'); void e2.offsetWidth;
          e2.classList.add(diff > 0 ? 'bal-up' : 'bal-down');
        }
      }
    });
  }
  let cashRaf = 0, cashPrevT = 0;
  function startCashLoop() {
    if (cashRaf) return;
    const loop = t => {
      cashRaf = requestAnimationFrame(loop);
      const dt = Math.min(50, t - (cashPrevT || t)); cashPrevT = t;
      if (!G || document.hidden) return;
      const bal = balance();
      const diff = bal - T.cashDisp;
      if (Math.abs(diff) < 0.005) T.cashDisp = bal;
      else T.cashDisp += diff * Math.min(1, dt * 0.0075);
      const c = el('tbCash');
      if (!c) return;
      const txt = eur(T.cashDisp);
      if (c.__lastTxt !== txt) { c.__lastTxt = txt; c.textContent = txt; }
      const flowing = Math.abs(diff) >= 0.5;
      const cls = flowing ? (diff > 0 ? 'flow-up' : 'flow-down') : '';
      if (c.__flowCls !== cls) {
        c.__flowCls = cls;
        c.classList.remove('flow-up', 'flow-down');
        if (cls) c.classList.add(cls);
      }
      c.classList.toggle('neg', bal < 0);
    };
    cashRaf = requestAnimationFrame(loop);
  }

  function bankDetails(d) {
    const isP = isPlayerBank(d.id);
    const pnj = isP ? null : DATA.banks.find(b => b.id === d.id);
    if (!isP && !pnj) return;
    const desc = isP ? ('Banque privée fondée par le joueur ' + (d.owner || '?') + '. Elle accueille les comptes des autres citoyens : son taux de Livret dépend de sa gestion.') : (pnj ? pnj.desc : '');
    modal('<h2>' + esc(d.name) + '</h2><div class="m-sub">' + (isP ? 'Banque de joueur' : 'Banque partenaire') + '</div>' +
      '<p class="m-desc">' + esc(desc) + '</p>' +
      '<table class="t"><tr><td>Livret A</td><td class="mono">' + num(parseFloat(d.rate), 0, 0, 5) + ' %/an</td></tr>' +
      (isP ? '<tr><td>Fondateur</td><td>' + esc(d.owner) + '</td></tr><tr><td>Comptes clients</td><td class="mono">' + Math.floor(num(d.accounts, 0, 0)) + '</td></tr>' : '<tr><td>Type</td><td>Réseau national</td></tr>') +
      (G.bank.bankId ? '<tr><td>Votre banque actuelle</td><td>' + esc(G.bank.bankName || '') + '</td></tr>' : '') +
      '</table>' +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Fermer</button>' +
      '<button class="btn btn-primary" data-act="openBank" data-id="' + esc(d.id) + '" data-name="' + esc(d.name) + '" data-rate="' + num(parseFloat(d.rate), 0, 0, 5) + '">' + (G.bank.bankId ? 'Transférer mon compte ici' : 'Ouvrir un compte ici') + '</button></div>');
  }

  function rImmo() {
    const owned = G.houses.length ? G.houses.map((h, i) => {
      const hd = DATA.homes[h.i] || { n: 'Bien' };
      const delta = num(h.v, 0) - hd.p;
      const mois = num(h.rent, 0) * 10;
      return '<div class="rowline"><div style="flex:1"><div class="lbl">' + esc(hd.n) + (h.tenant ? ' <span class="chip green">LOUÉ</span>' : '') + '</div>' +
        '<div class="det">Valeur <b class="money" data-house-v="' + i + '">' + eur(h.v) + '</b> <span class="' + (delta >= 0 ? 'pos' : 'negx') + '">' + (delta >= 0 ? '+' : '') + eur(delta) + '</span>' +
        ' · charges ' + eur(h.c) + '/mois' + (h.tenant ? ' · loyers <span class="pos">+' + eur(mois) + '/mois</span>' : ' · rendement locatif potentiel ' + (hd.p ? (mois * 12 / hd.p * 100).toFixed(1) : '0') + ' %/an') + '</div></div>' +
        '<div class="btn-row"><button class="btn btn-sm" data-act="rentOut" data-i="' + i + '">' + (h.tenant ? 'Congé' : 'Louer') + '</button><button class="btn btn-sm btn-danger" data-act="sellHome" data-i="' + i + '">Vendre</button></div></div>';
    }).join('') : '<div class="empty">Aucun bien. Le patrimoine se construit pas à pas.</div>';
    return '<h1>Immobilier</h1><div class="sub">Les prix évoluent en continu. Louer rapporte, revendre coûte 5 %.</div>' +
      (G.rental
        ? '<div class="panel"><h2>Ma location</h2><div class="rowline"><div><div class="lbl">' + esc(DATA.rentals[G.rental.i].n) + '</div><div class="det">Loyer <b class="money neg">−' + eur(G.rental.loyer) + '</b>/mois — vous protège des intempéries</div></div><button class="btn btn-sm btn-danger" data-act="cancelRent">Résilier le bail</button></div></div>'
        : '<div class="panel"><h2>Se loger</h2><div class="m-hint" style="margin-bottom:10px">⚠ Sans domicile, vos jauges baissent 1,5× plus vite et la pluie/neige abîme votre santé.</div>' + DATA.rentals.map((r, i) => '<div class="rowline"><div><div class="lbl">' + esc(r.n) + '</div><div class="det">Charges comprises</div></div><div class="buy-zone"><span class="money">' + eur(r.loyer) + '/mois</span><button class="btn btn-sm btn-primary" data-act="rentHome" data-i="' + i + '">Signer le bail</button></div></div>').join('') + '</div>') +
      '<div class="panel"><h2>Mon patrimoine</h2>' + owned + '</div>' +
      '<div class="panel"><h2>Marché immobilier local</h2><canvas class="chart" id="chImmoLocal"></canvas><div class="det" style="margin-top:6px">Indice immo : ' + W.idx.immo.toFixed(1) + ' — les valeurs de vos biens suivent ce marché.</div></div>' +
      '<div class="panel"><h2>Biens en vente</h2>' + DATA.homes.map((h, i) => '<div class="rowline"><div><div class="lbl">' + esc(h.n) + '</div><div class="det">Charges ' + eur(h.c) + '/mois · confort +' + (h.p / 60000).toFixed(1) + '</div></div><div class="buy-zone"><span class="money">' + eur(h.p) + '</span><button class="btn btn-sm btn-primary" data-act="buyHome" data-i="' + i + '"' + (balance() < h.p ? ' disabled' : '') + '>Acheter</button></div></div>').join('') + '</div>';
  }

  function rAuto() {
    return '<h1>Concessionnaire</h1><div class="sub">Une voiture augmente votre productivité jusqu’à +' + Math.round(Math.max(...DATA.cars.map(c => c.b)) * 100) + ' %. Elle s’use en roulant : entretenez-la pour éviter les pannes coûteuses et bien la revendre.</div>' +
      (G.cars.length ? '<div class="panel"><h2>Mon garage</h2>' + G.cars.map(i => {
        const c = DATA.cars[i]; if (!c) return '';
        const st = carState(i);
        const resale = Math.round(c.p * 0.6 * (0.55 + 0.45 * st / 100));
        return '<div class="rowline"><div style="flex:1"><div class="lbl">🚗 ' + esc(c.n) + ' <span class="chip ' + (st > 60 ? 'green' : st > 30 ? 'gold' : 'red') + '">état ' + Math.round(st) + ' %</span></div>' +
          '<div class="bar ' + (st > 60 ? 'b-green' : st > 30 ? 'b-orange' : 'b-red') + ' car-bar"><div class="fill" style="width:' + st + '%"></div></div>' +
          '<div class="det">Productivité +' + Math.round(c.b * 100) + ' % · revente actuelle : ' + eur(resale) + '</div></div>' +
          '<div class="btn-row"><button class="btn btn-sm" data-act="serviceCar" data-i="' + i + '"' + (st >= 99 ? ' disabled' : '') + '>🔧 Réviser</button><button class="btn btn-sm btn-danger" data-act="sellCar" data-i="' + i + '">Revendre</button></div></div>';
      }).join('') + '</div>' : '') +
      '<div class="panel"><h2>Catalogue</h2>' + DATA.cars.map((c, i) => '<div class="rowline"><div><div class="lbl">' + esc(c.n) + '</div><div class="det">Productivité +' + Math.round(c.b * 100) + ' %</div></div><div class="buy-zone"><span class="money">' + eur(c.p) + '</span><button class="btn btn-sm btn-primary" data-act="buyCar" data-i="' + i + '" ' + (G.cars.includes(i) ? 'disabled' : '') + '>' + (G.cars.includes(i) ? 'Possédée ✓' : 'Acheter') + '</button></div></div>').join('') + '</div>';
  }

  function rAssur() {
    return '<h1>Assurances</h1><div class="sub">Elles remboursent vos frais de santé et sinistres (le meilleur taux s’applique). Prélèvement mensuel.</div>' +
      '<div class="grid2" style="align-items:start"><div class="panel">' +
      DATA.insurers.map(a => {
        const on = G.insurances.includes(a.id);
        return '<div class="rowline"><div><div class="lbl">' + esc(a.n) + (on ? ' <span class="chip green">SOUSCRIT</span>' : '') + '</div><div class="det">' + esc(a.d) + '</div></div><div class="buy-zone"><span class="money">' + eur(a.m) + '/mois</span><button class="btn btn-sm ' + (on ? 'btn-danger' : 'btn-primary') + '" data-act="insure" data-id="' + a.id + '">' + (on ? 'Résilier' : 'Souscrire') + '</button></div></div>';
      }).join('') + '</div>' +
      '<div class="kpi"><div class="k-lbl">Couverture actuelle</div><div class="k-val" style="color:var(--green);font-size:34px">' + Math.round(cov() * 100) + ' %</div>' +
      '<div class="bar b-green" style="margin:10px 0 0"><div class="fill" style="width:' + (cov() * 100) + '%"></div></div>' +
      '<div class="det" style="margin-top:10px">Le meilleur taux souscrit s’applique.</div></div>' +
      '<div class="panel"><h2>Simulateur de remboursement</h2><table class="t"><tr><th>Scénario</th><th>Facture</th><th style="text-align:right">Votre reste à charge</th></tr>' +
      [['🚑 Hospitalisation', 800], ['🤢 Grippe saisonnière', 135], ['🩺 Consultation généraliste', 30], ['🚗 Panne voiture', 400], ['💉 Vaccin', 50]]
        .map(([l, c]) => '<tr><td>' + l + '</td><td class="mono">' + eur(c) + '</td><td class="money" style="text-align:right">' + eur(c * (1 - cov())) + '</td></tr>').join('') +
      '</table><div class="det" style="margin-top:8px">Avec votre couverture actuelle (' + Math.round(cov() * 100) + ' %).</div></div></div>';
  }

  function rSante() {
    const doc = G.health.doctor ? DATA.doctors.find(x => x.id === G.health.doctor) : null;
    const v = G.vitals;
    const vitalBar = (lbl, val, max, cls, ico) =>
      '<div class="vital-big"><div class="vb-top"><span>' + ico + ' ' + lbl + '</span><span class="mono">' + Math.round(val) + '/' + max + '</span></div>' +
      '<div class="bar ' + cls + ' vb-bar"><div class="fill" style="width:' + clamp(val / max * 100, 0, 100) + '%"></div></div></div>';
    return '<h1>Santé</h1><div class="sub">Médecin traitant, vaccins et rendez-vous. Trop manger (> 100) peut rendre malade ; la météo agit aussi sur vos jauges.</div>' +
      '<div class="grid2"><div class="panel"><h2>État général</h2>' +
      vitalBar('Santé', v.sante, 100, 'b-green', '♥') +
      vitalBar('Faim', v.faim, 200, v.faim > 100 ? 'b-red' : 'b-orange', '◆') +
      vitalBar('Soif', v.soif, 100, 'b-blue', '◈') +
      '<div class="rowline" style="margin-top:10px"><div class="lbl">Maladie</div>' + (G.health.sick ? '<span class="chip red">🤢 MALADE</span>' : '<span class="chip green">En forme</span>') + '</div>' +
      (G.health.sick ? '<div style="margin-top:12px"><button class="btn btn-primary btn-block btn-pop" data-act="bookAppointment">🩺 Prendre rendez-vous' + (doc ? ' (' + eur(doc.fee * (1 - cov())) + ' après remboursement)' : '') + '</button></div>' : '') +
      '<div class="rowline" style="margin-top:12px;border:0"><div><div class="lbl">🏃 Séance de sport</div><div class="det">+4 santé · −4 faim · −4 soif · toutes les 90 s</div></div>' +
      (Date.now() < num(G.sportCd, 0)
        ? '<span class="cd chip" data-until="' + num(G.sportCd, 0) + '">récupération…</span>'
        : '<button class="btn btn-sm btn-primary" data-act="sport">Courir</button>') + '</div>' +
      '</div>' +
      '<div class="panel"><h2>Médecin traitant</h2>' + DATA.doctors.map(dd =>
        '<div class="rowline"><div><div class="lbl">' + esc(dd.n) + '</div><div class="det">' + esc(dd.spec) + ' · ' + eur(dd.fee) + '/consultation · qualité ' + Math.round(dd.quality * 100) + ' %</div></div>' +
        (G.health.doctor === dd.id ? '<span class="chip green">CHOISI ✓</span>' : '<button class="btn btn-sm" data-act="chooseDoctor" data-id="' + dd.id + '">Choisir</button>') + '</div>').join('') +
      '<div class="det" style="margin-top:10px">Consultations passées : ' + Math.floor(num(G.health.rdv, 0, 0)) + '</div></div></div>' +
      '<div class="panel"><h2>Vaccins</h2>' + DATA.vaccines.map(v2 => {
        const on = G.health.vaccines.includes(v2.id);
        return '<div class="rowline"><div><div class="lbl">💉 ' + esc(v2.n) + '</div><div class="det">' + esc(v2.d) + '</div></div>' +
        (on ? '<span class="chip green">VACCINÉ ✓</span>' : '<div class="buy-zone"><span class="money">' + eur(v2.cost) + '</span><button class="btn btn-sm btn-primary" data-act="buyVaccine" data-id="' + v2.id + '">Se vacciner</button></div>') + '</div>';
      }).join('') + '</div>';
  }

  function rEco() {
    const w = curWeather();
    return '<h1>Économie</h1><div class="sub">800 citoyens vivent et consomment autour de vous · ' + w.ico + ' ' + esc(w.n) + '</div>' +
      '<div class="grid3">' +
      '<div class="kpi idx-kpi"><div class="k-lbl">CAC HL</div><div class="k-val" id="idxCac">' + W.idx.cac.toFixed(0) + '</div><canvas class="chart" id="chCac"></canvas></div>' +
      '<div class="kpi idx-kpi"><div class="k-lbl">Indice Immo</div><div class="k-val" id="idxImmo">' + W.idx.immo.toFixed(1) + '</div><canvas class="chart" id="chImmo"></canvas></div>' +
      '<div class="kpi idx-kpi"><div class="k-lbl">Indice Conso</div><div class="k-val" id="idxConso">' + W.idx.conso.toFixed(1) + '</div><canvas class="chart" id="chConso"></canvas></div></div>' +
      '<div class="panel" style="margin-top:18px"><h2>Votre performance nette · 90 s</h2><canvas class="chart" id="chNet" style="height:150px"></canvas></div>' +
      '<div class="panel"><h2>Historique de votre solde</h2><canvas class="chart" id="chBal" style="height:130px"></canvas></div>' +
      '<div class="grid2"><div class="panel"><h2>Classement de la ville</h2><div id="lbZone">' + skeleton(4) + '</div></div>' +
      '<div class="panel"><h2>Journal de la ville</h2><div id="feedZone" class="feed-scroll"></div></div></div>' +
      '<div class="panel"><h2>Santé des entreprises locales</h2><table class="t"><tr><th>Entreprise</th><th>Secteur</th><th style="width:38%">Santé</th></tr>' +
      W.biz.map(b => '<tr><td>' + esc(b.n) + '</td><td class="det">' + esc(b.s) + '</td><td><div class="health-cell"><div class="bar ' + (b.sante > 60 ? 'b-green' : b.sante > 35 ? 'b-orange' : 'b-red') + '"><div class="fill" style="width:' + b.sante + '%"></div></div><span class="mono" style="font-size:11px">' + Math.round(b.sante) + '</span></div></td></tr>').join('') + '</table></div>';
  }

  function rSkills() {
    return '<h1>Compétences</h1><div class="sub">Bonus permanents pour toute votre vie. Les coûts augmentent à chaque niveau.</div><div class="grid2">' +
      DATA.skills.map((s, k) => {
        const lvl = skillLvl(s.id), maxed = lvl >= s.maxLvl;
        const cost = maxed ? 0 : Math.round(s.costBase * Math.pow(s.costGrow, lvl));
        return '<div class="skill-card' + (maxed ? ' maxed' : '') + '" style="animation-delay:' + (k * 0.05) + 's"><div class="sk-head"><div class="sk-icon">' + s.icon + '</div><div style="flex:1"><div class="sk-name">' + esc(s.n) + '</div><div class="sk-desc">' + esc(s.d) + '</div></div>' +
          '<span class="chip gold">Niv ' + lvl + '/' + s.maxLvl + '</span></div>' +
          '<div class="sk-dots">' + Array.from({ length: s.maxLvl }, (_, i) => '<span class="sk-dot' + (i < lvl ? ' on' : '') + '"></span>').join('') + '</div>' +
          (maxed ? '<div class="chip green" style="margin-top:10px">MAÎTRISÉ ✓</div>' : '<button class="btn btn-primary btn-block" style="margin-top:12px" data-act="buySkill" data-id="' + s.id + '"' + (balance() < cost ? ' disabled' : '') + '>Améliorer · ' + eur(cost) + '</button>') + '</div>';
      }).join('') + '</div>';
  }

  function rNoir() {
    if (!G.ill.unlocked) {
      return '<h1>Quartier interdit</h1><div class="sub">Un réseau opère en marge de la ville. L’entrée se paie… et se mérite.</div>' +
        '<div class="panel empty-big noir-gate"><div class="empty-ico">🔒</div>' +
        '<p style="color:var(--mut);margin:14px 0 6px">Contrefaçon, trafic, cyber-escroquerie, blanchiment, braquage…</p>' +
        '<p class="empty">Droit d’entrée : <b class="money">' + eur(DATA.illEntry) + '</b></p>' +
        '<button class="btn btn-primary btn-lg" style="margin-top:16px" data-act="illUnlock"' + (balance() < DATA.illEntry ? ' disabled' : '') + '>Payer et entrer</button></div>';
    }
    const heat = num(G.ill.heat, 0, 0, 100);
    const heatCls = heat > 75 ? 'danger' : heat > 45 ? 'warn' : '';
    return '<h1>Marché noir</h1><div class="sub">Chaque opération fait monter la chaleur. À 100 : garde à vue immédiate. La chaleur retombe lentement.</div>' +
      '<div class="panel"><h2>Chaleur policière <span class="chip ' + (heat > 75 ? 'red' : heat > 45 ? 'gold' : 'green') + '">' + Math.round(heat) + '/100</span></h2>' +
      '<div class="bar b-red heat-bar ' + heatCls + '"><div class="fill" id="heatBar" style="width:' + heat + '%"></div></div>' +
      '<div class="det mono" id="heatNum" hidden>' + Math.round(heat) + '/100</div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn btn-sm" data-act="bribe"' + (balance() < 800 ? ' disabled' : '') + '>🤫 Pot-de-vin (800 € → chaleur −35)</button></div></div>' +
      '<div class="panel">' + DATA.ill.map(a => {
        const ready = Date.now() >= num(G.ill.cd[a.id], 0);
        const lock = a.reqBiz && !ownsBiz(a.reqBiz);
        return '<div class="rowline"><div><div class="lbl">' + esc(a.n) + '</div><div class="det">' + esc(a.d) + ' · mise ' + eur(a.cost) + ' · gain ' + eur0(a.gain[0]) + '–' + eur0(a.gain[1]) + ' · <span class="' + (a.risk > 0.35 ? 'negx' : 'pos') + '">' + Math.round(a.risk * 100) + ' % de risque</span> · chaleur +' + a.heat + (lock ? ' · <b style="color:var(--red)">nécessite une banque</b>' : '') + '</div></div>' +
          (ready
            ? '<button class="btn btn-sm btn-primary" data-act="illDo" data-id="' + a.id + '"' + (lock ? ' disabled' : '') + '>Exécuter</button>'
            : '<span class="cd chip" data-until="' + num(G.ill.cd[a.id], 0) + '">recharge…</span>') + '</div>';
      }).join('') + '</div>';
  }

  function rPlus() {
    const stripe = !!(DB.hasStripe && DB.hasStripe());
    return '<h1>Boutique +</h1><div class="sub">' + (stripe ? 'Paiement Stripe sécurisé : la récompense est créditée <b class="pos">automatiquement</b> dès confirmation du paiement (webhook signé). Aucune manipulation manuelle : infalsifiable.' : 'Les paiements réels sont <b>désactivés</b> sur ce serveur : sans vérification Stripe côté serveur, aucun pack ne peut être crédité — personne ne peut se donner d’argent.') + '</div>' +
      (stripe ? '' : '<div class="panel" style="border-color:var(--gold-dk)"><div class="rowline" style="border:0"><div><div class="lbl">🔒 Vérification des paiements</div><div class="det">Pour activer la boutique : renseignez <span class="mono">STRIPE_SECRET_KEY</span> et <span class="mono">STRIPE_WEBHOOK_SECRET</span> côté serveur (Render). Le crédit devient alors automatique et vérifié par signature Stripe.</div></div></div></div>') +
      '<div class="pack-grid">' + DATA.packs.map((p, k) =>
        '<div class="pack-card" style="animation-delay:' + (k * 0.08) + 's">' + (p.best ? '<span class="pack-best">MEILLEURE OFFRE</span>' : '') +
        '<div class="pack-glow"></div><div class="pack-amt">' + eur0(p.amount) + '</div><div class="pack-name">' + esc(p.n) + '</div>' +
        '<div class="pack-price">' + p.price + '</div><button class="btn btn-primary pack-btn" data-act="buyPack" data-id="' + p.id + '"' + (stripe ? '' : ' disabled') + '>' + (stripe ? 'Payer via Stripe' : 'Indisponible') + '</button></div>').join('') + '</div>';
  }

  function rProfil() {
    const ageMin = Math.max(1, Math.floor((Date.now() - num(G.created, Date.now())) / 60000));
    const ageTxt = ageMin >= 1440 ? Math.floor(ageMin / 1440) + ' jour(s)' : ageMin >= 60 ? Math.floor(ageMin / 60) + ' h ' + (ageMin % 60) + ' min' : ageMin + ' minute(s)';
    const l = level(G.xp);
    const achSorted = DATA.ach.map(a => ({ a, at: (G.ach || {})[a.id] || 0 })).sort((x, y) => y.at - x.at);
    return '<h1>Profil</h1><div class="sub">Citoyen depuis ' + ageTxt + ' · ' + esc(DB.label()) + '</div>' +
      '<div class="grid2"><div class="panel profil-id"><div class="p-ava">' + esc(G.name.slice(0, 2).toUpperCase()) + '</div>' +
      '<div><div class="p-name">' + esc(G.name) + '</div><div class="det">Niveau ' + l + ' · ' + achCount() + '/' + DATA.ach.length + ' succès · ' + G.xp + ' XP</div>' +
      '<div class="bar b-gold" style="margin-top:8px"><div class="fill" style="width:' + clamp((G.xp - 100 * (l - 1) * (l - 1)) / (100 * l * l - 100 * (l - 1) * (l - 1)) * 100, 0, 100) + '%"></div></div></div></div>' +
      '<div class="panel"><h2>Statistiques</h2><table class="t">' +
      '<tr><td>Revenus nets perçus</td><td class="money">' + eur(G.stats.earned) + '</td></tr>' +
      '<tr><td>Impôts & cotisations</td><td class="money neg">' + eur(G.stats.tax) + '</td></tr>' +
      '<tr><td>Dépenses</td><td class="money neg">' + eur(G.stats.spent) + '</td></tr>' +
      '<tr><td>Articles vendus</td><td class="mono">' + Math.floor(num(G.stats.sales, 0, 0)) + '</td></tr>' +
      '<tr><td>Événements vécus</td><td class="mono">' + Math.floor(num(G.stats.events, 0, 0)) + '</td></tr>' +
      '<tr><td>Défis terminés</td><td class="mono">' + Math.floor(num(G.stats.missionsDone, 0, 0)) + '</td></tr>' +
      '<tr><td>Postes / charge</td><td class="mono">' + G.jobs.length + ' (' + Math.round(totalLoad() * 100) + ' %)</td></tr>' +
      '<tr><td>Entreprises / biens / voitures</td><td class="mono">' + G.biz.length + ' / ' + G.houses.length + ' / ' + G.cars.length + '</td></tr>' +
      '<tr><td>Patrimoine net</td><td class="money">' + eur(netWorth()) + '</td></tr>' +
      '</table></div></div>' +
      '<div class="panel"><h2>Succès (' + achCount() + '/' + DATA.ach.length + ')</h2><div class="ach-grid">' +
      achSorted.map(({ a, at }) => '<div class="ach-card' + (at ? ' on' : '') + '" title="' + (at ? 'Débloqué le ' + new Date(at).toLocaleDateString('fr-FR') : esc(a.d)) + '">' +
        '<div class="ach-ico">' + (at ? a.icon : '🔒') + '</div><div class="ach-n">' + esc(a.n) + '</div><div class="ach-d">' + esc(a.d) + ' · +' + a.xp + ' XP</div></div>').join('') +
      '</div></div>' +
      '<div class="panel"><h2>Compte</h2>' +
      '<div class="btn-row" style="flex-wrap:wrap">' +
      '<button class="btn" data-act="openSettings">⚙ Réglages</button>' +
      '<button class="btn" data-act="openHelp">❓ Aide</button>' +
      '<button class="btn btn-ghost" data-act="logout">Déconnexion</button>' +
      '<button class="btn btn-danger" data-act="resetSave">Réinitialiser ma vie</button>' +
      '<button class="btn btn-danger" data-act="deleteAccount">Supprimer mon compte</button>' +
      (T.isAdmin ? '<button class="btn btn-primary" data-act="openAdmin">🛡 Panneau admin</button>' : '') +
      '</div></div>';
  }

  /* ── Graphiques ── */
  function drawCharts() {
    if (!W) return;
    FX.chart(el('chNet'), T.hist.slice(-60), 'rgb(232,176,75)', { zero: true, fast: true });
    FX.chart(el('chCac'), (W.hCac || []).slice(-70), 'rgb(84,163,216)', { fast: true });
    FX.chart(el('chImmo'), (W.hImmo || []).slice(-70), 'rgb(75,179,128)', { fast: true });
    FX.chart(el('chConso'), (W.hConso || []).slice(-70), 'rgb(224,135,63)', { fast: true });
    if (el('chBal') && G) FX.chart(el('chBal'), (G.histBal || []).slice(-90), 'rgb(84,163,216)', { fast: true });
  }

  /* ── Comptes à rebours génériques [data-until] ── */
  function fmtLeft(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    if (s >= 3600) return Math.floor(s / 3600) + ' h ' + Math.floor((s % 3600) / 60) + ' min';
    if (s >= 120) return Math.floor(s / 60) + ' min ' + (s % 60) + ' s';
    return s + ' s';
  }
  function updateCountdowns() {
    expiredFlag = false;
    document.querySelectorAll('[data-until]').forEach(s => {
      const until = +s.dataset.until || 0;
      const left = until - Date.now();
      const txt = until > 0 ? fmtLeft(left) : '—';
      if (s.textContent !== txt) s.textContent = txt;
      if (left <= 0 && !s.dataset.expired) { s.dataset.expired = '1'; expiredFlag = true; }
    });
  }

  /* ── Tick UI (chaque seconde) ── */
  let lastCashTxt = '';
  function tickUI() {
    if (!G) return;
    const bal = balance();
    updateBalEls();
    { const lbl = el('tbCashLbl'); if (lbl) lbl.textContent = G.bank.bankId ? 'compte' : 'liquide'; }
    const v = G.vitals;
    const setBar = (id, n, val, low) => {
      const b = el(id); if (b) b.style.width = clamp(val, 0, 100) + '%';
      const nn = el(n); if (nn) nn.textContent = Math.round(val);
      const row = b && b.closest('.v-row');
      if (row) row.classList.toggle('low', val <= (low || 25));
    };
    setBar('barSante', 'numSante', v.sante, 30);
    setBar('barFaim', 'numFaim', Math.min(v.faim, 100), 20);
    setBar('barSoif', 'numSoif', v.soif, 20);
    const st = el('vStatus');
    if (st) {
      let txt, cls = '';
      if (inJail()) { txt = '🚔 Garde à vue'; cls = 'bad'; }
      else if (bal < 0) { txt = '⚠ Compte à découvert'; cls = 'bad'; }
      else if (G.health.sick) { txt = '🤢 Malade — consultez'; cls = 'bad'; }
      else if (!hasShelter()) { txt = '⚠ Sans domicile'; cls = 'bad'; }
      else if (v.faim > 100) { txt = '⚠ Trop plein digestif'; cls = 'warn'; }
      else if (v.faim < 20 || v.soif < 20) { txt = '⚠ ' + (v.soif < v.faim ? 'Buvez !' : 'Mangez !'); cls = 'warn'; }
      else { txt = '✓ Citoyen en bonne santé'; }
      if (st.textContent !== txt) { st.textContent = txt; }
      st.className = 'v-status' + (cls ? ' ' + cls : '');
    }
    const inf = G.tickInfo || { rev: 0, chg: 0, tax: 0 };
    const sRev = el('stRev'), sChg = el('stChg'), sNet = el('stNet'), sTax = el('stTax');
    if (sRev) sRev.textContent = '+' + eur(inf.rev);
    if (sChg) sChg.textContent = '−' + eur(inf.chg);
    if (sNet) {
      const net = inf.rev - inf.chg;
      const sign = net >= 0 ? 1 : -1;
      if (T.netSign && sign !== T.netSign) { sNet.classList.remove('flash'); void sNet.offsetWidth; sNet.classList.add('flash'); }
      T.netSign = sign;
      sNet.textContent = (sign > 0 ? '+' : '−') + eur(Math.abs(net));
      sNet.style.color = sign > 0 ? 'var(--green)' : 'var(--red)';
    }
    if (sTax) sTax.textContent = eur(G.stats.tax);
    updateTop();

    /* garde à vue */
    const jo = el('jailOv');
    if (jo) {
      if (inJail()) {
        jo.hidden = false;
        el('jailT').textContent = Math.ceil((G.jail - Date.now()) / 1000);
        const jb = el('jailBail');
        if (jb) jb.hidden = false;
      } else if (!jo.hidden) { jo.hidden = true; }
    }

    /* boost */
    const bb = el('boostBar');
    if (bb) {
      if (G.boost && G.boost.until > Date.now()) {
        bb.hidden = false;
        el('boostTxt').textContent = '⚡ ' + G.boost.label + ' ×' + G.boost.mul;
        el('boostCd').textContent = Math.max(0, Math.ceil((G.boost.until - Date.now()) / 1000)) + ' s';
      } else bb.hidden = true;
    }

    /* loto */
    const lb = el('lottoBtn'), lc = el('lottoCd');
    if (lb && lc) {
      const cd = Math.max(0, Math.ceil((num(G.lottoCd, 0) - Date.now()) / 1000));
      lb.hidden = cd > 0; lc.hidden = cd <= 0;
    }

    /* comptes à rebours + expirations */
    updateCountdowns();
    if (expiredFlag && (T.tab === 'entreprises' || T.tab === 'vie' || T.tab === 'noir')) render(true);

    /* immobilier : valeurs vivantes */
    if (T.tab === 'immobilier') document.querySelectorAll('[data-house-v]').forEach(e2 => {
      const h = G.houses[+e2.dataset.houseV];
      if (h) e2.textContent = eur(h.v);
    });

    /* économie : indices + graphiques */
    if (T.tab === 'economie') {
      const set = (id, val) => { const e2 = el(id); if (e2) e2.textContent = val; };
      set('idxCac', W.idx.cac.toFixed(0)); set('idxImmo', W.idx.immo.toFixed(1)); set('idxConso', W.idx.conso.toFixed(1));
      if (W.t % 3 === 0) drawCharts();
    }
    if (T.tab === 'banque' && W.t % 3 === 0 && el('chBal')) FX.chart(el('chBal'), (G.histBal || []).slice(-90), 'rgb(84,163,216)', { fast: true });
    if (T.tab === 'immobilier' && W.t % 3 === 0 && el('chImmoLocal')) FX.chart(el('chImmoLocal'), (W.hImmo || []).slice(-70), 'rgb(75,179,128)', { fast: true });
    if (T.tab === 'entreprises' && T.selBiz >= 0 && G.biz[T.selBiz] && (T.bizTab === 'overview' || T.bizTab === 'compta') && W.t % 3 === 0)
      FX.chart(el('bChart'), G.biz[T.selBiz].hist, 'rgb(232,176,75)', { fast: true });

    /* chaleur marché noir */
    if (T.tab === 'noir' && G.ill.unlocked) {
      const hb = el('heatBar'); if (hb) hb.style.width = G.ill.heat + '%';
    }
  }

  function buildTicker() {
    if (!W) return;
    const t = el('ticker'); if (!t) return;
    const items = [];
    const w = curWeather();
    items.push(w.ico + ' ' + w.n + ' sur la ville');
    DATA.news.slice(0, 8).forEach(n => items.push('◆ ' + esc(n)));
    W.biz.slice(0, 8).forEach(b => items.push(esc(b.n) + ' : ' + (b.sante > 65 ? '<span class="up">en forme</span>' : b.sante > 40 ? '<span>stable</span>' : '<span class="dn">ralentit</span>')));
    items.push('CAC HL ' + W.idx.cac.toFixed(0) + ' · Immo ' + W.idx.immo.toFixed(1) + ' · Conso ' + W.idx.conso.toFixed(1));
    const half = items.join('&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;');
    t.innerHTML = '<b>HEXALIFE ÉCO</b>&nbsp;&nbsp;&nbsp;' + half + '&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;' + half;
  }

  /* ── Filtres emploi (événements natifs) ── */
  document.addEventListener('change', e => {
    const t = e.target.closest('[data-act]'); if (!t || !G) return;
    if (t.dataset.act === 'jobSec') { T.jobF.sec = t.value; UI.render(true); }
    if (t.dataset.act === 'jobOk') { T.jobF.ok = t.checked; UI.render(true); }
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-act]'); if (!t || !G) return;
    if (t.dataset.act === 'jobQ') {
      clearTimeout(T.qT);
      T.qT = setTimeout(() => {
        T.jobF.q = t.value;
        UI.render(true);
        const inp = document.querySelector('[data-act="jobQ"]');
        if (inp) { inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (x) {} }
      }, 300);
    }
  });

  return {
    toast, feed, floatText, pulseVital, moneyFx, cardFx, confetti, moneyFly, moneyRain,
    modal, closeModal, flashSave, buildRail, setTab, render, updateTop, tick: tickUI,
    buildTicker, drawCharts, authTab, tutoNext, tutoSkip, placeTuto, bankDetails,
    openSendMoney, doSendMoney, openAnnounce, doAnnounce, openAdmin, adminDo,
    openSettings, openHelp, setWeather, reportError, levelUp, achUnlock, eventFx, screenShake,
    loadLeaderboard, xpFx, openTerminal, closeTerminal, termRefresh, termReceipt, walletHTML,
    nfcPay, nfcClose, nfcForce, updateBalEls
  };
})();
