/* ═══════════ INTERFACE v4 : onglet marketing, carte bleue animée, loto, météo ═══════════ */
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
    economie:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 14 L6 9 L9 11.5 L15 4 M11 4 h4 v4"/></svg>',
    noir:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="6"/><path d="M4 4 l9 9"/></svg>',
    plus:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="8.5" r="6"/><path d="M8.5 5.5 v6 M5.5 8.5 h6"/></svg>',
    profil:'<svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8.5" cy="6" r="2.6"/><path d="M3 14.5 c0-3 2.5-4.5 5.5-4.5 s5.5 1.5 5.5 4.5"/></svg>'
  };
  const NAV = [
    ['vie','Accueil'],['inventaire','Inventaire'],['carriere','Formation & Emploi'],['marche','Courses'],
    ['entreprises','Mes entreprises'],['banque','Banque'],['immobilier','Immobilier'],['auto','Concessionnaire'],
    ['assurances','Assurances'],['economie','Économie'],['noir','Marché noir',true],['plus','Boutique +'],['profil','Profil']
  ];

  const TUTO = [
    { sel:null, t:'Bienvenue dans HEXALIFE', x:'Vous êtes un nouveau citoyen avec 2 000 € en liquide. Ouvrez vite un compte bancaire : salaires, impôts et factures passeront par là. Ce tutoriel vous guide en 9 étapes.' },
    { sel:'.vitals', t:'Vos jauges vitales', x:'Santé, faim, soif baissent en continu. Mangez et buvez depuis l’Inventaire, sinon hôpital garanti.' },
    { sel:'.tb-money', t:'Votre argent', x:'Le compteur doré est votre solde (compte bancaire ou liquide), animé à chaque entrée ou sortie d’euros. Le + ouvre la boutique.' },
    { sel:'.strip', t:'Vos flux en direct', x:'Revenus, charges, net par seconde : tout vit en temps réel, sans rechargement.' },
    { sel:'[data-id="carriere"]', t:'Formation & Emploi', x:'Formez-vous gratuitement puis signez un CDI : temps plein exclusif, ou partiel pour cumuler deux jobs.' },
    { sel:'[data-id="marche"]', t:'Les courses', x:'Achetez nourriture et boissons : tout part dans l’Inventaire.' },
    { sel:'[data-id="inventaire"]', t:'L’inventaire', x:'Cliquez sur un aliment pour le consommer, avec animation sur vos jauges.' },
    { sel:'[data-id="entreprises"]', t:'Vos entreprises', x:'Panneau complet : vue d’ensemble, production, marketing, RH, améliorations, compta.' },
    { sel:null, t:'À vous de jouer !', x:'Défis, succès, loto, météo, opportunités flash… et méfiez-vous du marché noir. Bonus : 100 €.' }
  ];

  let feedItems = [];

  function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.innerHTML = msg;
    el('toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 4500);
  }
  function feed(html) {
    feedItems.unshift({ html, t: new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) });
    feedItems = feedItems.slice(0, 40);
    if (T.tab === 'economie' || T.tab === 'vie') renderFeedZone();
  }
  function floatText(txt, color) {
    const d = document.createElement('div');
    d.className = 'float-txt'; d.style.color = color; d.textContent = txt;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1300);
  }
  function pulseVital(rowId) { const r = el(rowId); if (!r) return; r.classList.remove('pulse'); void r.offsetWidth; r.classList.add('pulse'); }

  function moneyFx(amt) {
    const host = el('tbMoney'); if (!host) return;
    while (host.querySelectorAll('.money-fx').length > 5) host.querySelector('.money-fx').remove();
    const d = document.createElement('span');
    d.className = 'money-fx ' + (amt >= 0 ? 'up' : 'down');
    d.textContent = (amt >= 0 ? '+' : '−') + eur(Math.abs(amt));
    d.style.right = (44 + Math.random()*40) + 'px';
    host.appendChild(d);
    setTimeout(() => d.remove(), 1200);
    const c = el('tbCash'); if (c) { c.style.transform = 'scale(1.06)'; setTimeout(() => c.style.transform = '', 180); }
  }

  /* ══ animation carte bleue ══ */
  function cardFx(txt, amt) {
    const d = document.createElement('div');
    d.className = 'cardfx';
    d.innerHTML = '<div class="cardfx-card">' +
      '<div class="cf-top"><div class="cf-chip"></div><span class="cf-brand">HEXAPAY</span></div>' +
      '<div class="cf-num">•••• •••• •••• 4242</div>' +
      '<div class="cf-bottom"><div class="cf-txt">' + esc(txt) + '</div><div class="cf-amt">' + esc(amt || '') + '</div></div>' +
      '</div>';
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1600);
  }

  function modal(html) {
    el('modalRoot').innerHTML = '<div class="m-back"><div class="m-card">' + html + '</div></div>';
    el('modalRoot').querySelector('.m-back').addEventListener('click', e => { if (e.target.classList.contains('m-back')) closeModal(); });
  }
  function closeModal() { el('modalRoot').innerHTML = ''; }
  function flashSave() {
    const s = el('tbSave'); if (!s) return;
    s.textContent = '✓ Sauvegardé'; s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse');
    setTimeout(() => s.textContent = 'Sauvegarde auto active', 1500);
  }

  function buildRail() {
    const claimable = G.missions.list ? G.missions.list.filter(m => m.prog >= m.tgt && !m.claimed).length : 0;
    el('rail').innerHTML = NAV.map(([id,lbl,lock]) =>
      '<button class="nav-btn' + (T.tab === id ? ' active' : '') + '" data-act="tab" data-id="' + id + '">' + ICONS[id] +
      '<span class="lbl">' + lbl + '</span>' + (lock ? '<span class="lock">🔒</span>' : '') +
      (id === 'vie' && claimable ? '<span class="bdg">' + claimable + '</span>' : '') + '</button>').join('');
  }
  function setTab(id) { T.tab = id; T.selBiz = -1; buildRail(); render(); el('view').scrollTop = 0; if (G.tuto >= 0) setTimeout(placeTuto, 60); }
  function updateTop() {
    el('tbName').textContent = G.name;
    el('tbJob').textContent = G.jobs.length ? G.jobs.map(j => j.title + (j.mode === 'partiel' ? ' (50 %)' : '')).join(' + ') : (G.training ? 'En formation…' : 'Sans emploi');
    const l = level(G.xp), cur = G.xp - 100*(l-1)*(l-1), need = 100*l*l - 100*(l-1)*(l-1);
    el('tbLvl').textContent = 'Niv. ' + l;
    el('tbXp').style.width = clamp(cur/need*100, 0, 100) + '%';
  }
  function authTab(t) {
    el('authTabs').classList.toggle('reg', t === 'reg');
    document.querySelectorAll('.atab').forEach(b => b.classList.toggle('active', b.dataset.t === t));
    const fl = el('formLogin'), fr = el('formReg');
    fl.hidden = t !== 'login'; fr.hidden = t !== 'reg';
    const shown = t === 'login' ? fl : fr;
    shown.classList.remove('anim'); void shown.offsetWidth; shown.classList.add('anim');
  }

  function placeTuto() {
    const ov = el('tutoOv');
    if (!G || G.tuto < 0 || G.tuto >= TUTO.length) { ov.hidden = true; document.querySelectorAll('.tuto-hl').forEach(x => x.classList.remove('tuto-hl')); return; }
    ov.hidden = false;
    const st = TUTO[G.tuto];
    document.querySelectorAll('.tuto-hl').forEach(x => x.classList.remove('tuto-hl'));
    el('tutoStepLbl').textContent = (G.tuto+1) + '/' + TUTO.length;
    el('tutoTitle').textContent = st.t;
    el('tutoText').textContent = st.x;
    el('tutoNext').textContent = G.tuto === TUTO.length-1 ? 'Terminer ✓' : 'Suivant →';
    const card = el('tutoCard');
    const target = st.sel ? document.querySelector(st.sel) : null;
    if (target) {
      target.classList.add('tuto-hl');
      const r = target.getBoundingClientRect();
      let left = r.right + 18;
      if (left + 330 > window.innerWidth) left = Math.max(10, r.left - 340);
      card.style.left = left + 'px';
      card.style.top = clamp(r.top, 70, window.innerHeight - 240) + 'px';
    } else {
      card.style.left = (window.innerWidth/2 - 160) + 'px';
      card.style.top = (window.innerHeight*0.38) + 'px';
    }
  }
  function tutoNext() {
    G.tuto++;
    if (G.tuto >= TUTO.length) { G.tuto = -1; receive(100, 'Bonus de tutoriel'); addXp(50); toast('Tutoriel terminé ! Bonus +100 €', 'good'); save(); }
    placeTuto();
  }
  function tutoSkip() { G.tuto = -1; placeTuto(); toast('Tutoriel passé.', ''); save(); }

  function render() {
    updateTop();
    const R = { vie:rVie, inventaire:rInv, carriere:rCarriere, marche:rMarche, entreprises:rEntreprises, banque:rBanque, immobilier:rImmo, auto:rAuto, assurances:rAssur, economie:rEco, noir:rNoir, plus:rPlus, profil:rProfil };
    el('view').innerHTML = (R[T.tab] || rVie)();
    if (T.tab === 'vie' || T.tab === 'economie') renderFeedZone();
    if (T.tab === 'economie') drawCharts();
    if (T.tab === 'entreprises' && T.selBiz >= 0 && G.biz[T.selBiz] && (T.bizTab === 'overview' || T.bizTab === 'compta'))
      spark(el('bChart'), G.biz[T.selBiz].hist, 'rgb(232,176,75)');
  }
  function renderFeedZone() {
    const z = el('feedZone');
    if (z) z.innerHTML = feedItems.length ? feedItems.map(f => '<div class="feed-item"><span class="tm">' + f.t + '</span>' + f.html + '</div>').join('') : '<div class="empty">Le journal est vide pour l’instant.</div>';
  }

  function goals() {
    const g = [];
    if (!G.diplomas.length && !G.training) g.push('Suivre votre première formation (gratuite)');
    if (!G.jobs.length) g.push('Signer un premier contrat (plein ou partiel)');
    if (!G.bank.bankId) g.push('Ouvrir un compte bancaire (salaires & impôts)');
    if (!hasShelter()) g.push('Vous loger : location ou achat');
    if (!G.biz.length) g.push('Fonder votre première entreprise');
    if (!ownsBiz('banque')) g.push('Fonder votre propre banque');
    return g;
  }
  function missionRows() {
    return G.missions.list.map((m,i) => {
      const pct = clamp(m.prog/m.tgt*100, 0, 100), done = m.prog >= m.tgt;
      return '<div class="rowline"><div style="flex:1"><div class="lbl">' + m.n + '</div>' +
        '<div style="display:flex;align-items:center;margin-top:6px"><div class="bar b-gold" style="margin:0"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<span class="mono" style="font-size:11px;margin-left:8px">' + Math.min(m.prog,m.tgt) + '/' + m.tgt + '</span></div></div>' +
        (m.claimed ? '<span class="chip green">RÉCLAMÉ</span>' : done ? '<button class="btn btn-primary btn-sm" data-act="claimMission" data-i="' + i + '">+' + eur(m.rew) + '</button>' : '<span class="money">' + eur(m.rew) + '</span>') + '</div>';
    }).join('');
  }
  function weatherChip() { const w = DATA.weather[W.weather.i]; return w.ico + ' ' + w.n; }

  function rVie() {
    const l = level(G.xp), cur = G.xp - 100*(l-1)*(l-1), need = 100*l*l - 100*(l-1)*(l-1);
    const bal = balance();
    const lottoCd = Math.max(0, Math.ceil(((G.lottoCd||0) - Date.now())/1000));
    return '<h1>Bonjour, ' + esc(G.name) + '.</h1>' +
      '<div class="sub">Chaque seconde réelle = 1 minute de vie · Météo actuelle : <b>' + weatherChip() + '</b> (influence vos commerces) · salaires versés sur le compte, impôts prélevés dessus.</div>' +
      '<div class="grid3"><div class="kpi"><div class="k-lbl">' + (G.bank.bankId ? 'Compte bancaire' : 'Liquidités') + '</div><div class="k-val" style="color:' + (bal < 0 ? 'var(--red)' : 'var(--gold)') + '">' + eur(bal) + '</div></div>' +
      '<div class="kpi"><div class="k-lbl">Niveau citoyen ' + l + '</div><div class="k-val">' + Math.round(cur/need*100) + ' %<div class="bar b-gold" style="margin:8px 0 0"><div class="fill" style="width:' + (cur/need*100) + '%"></div></div></div></div>' +
      '<div class="kpi"><div class="k-lbl">Impôts & cotisations versés</div><div class="k-val" style="color:var(--red)">' + eur(G.stats.tax) + '</div></div></div>' +
      '<div class="grid2" style="margin-top:18px"><div class="panel"><h2>Défis du moment</h2>' + missionRows() + '</div>' +
      '<div class="panel"><h2>Loto citoyenne</h2><div class="rowline"><div><div class="lbl">Tenter votre chance</div><div class="det">Ticket ' + eur(DATA.lotto.cost) + ' · ' + Math.round(DATA.lotto.chance*100) + ' % de gagner ' + eur0(DATA.lotto.min) + ' à ' + eur0(DATA.lotto.max) + ' · 1 ticket / 30 s</div></div>' +
      '<span class="mono" style="color:var(--mut)" id="lottoCd"' + (lottoCd <= 0 ? ' hidden' : '') + '>' + lottoCd + ' s</span>' +
      '<button class="btn btn-primary btn-sm" id="lottoBtn" data-act="lotto"' + (lottoCd > 0 ? ' hidden' : '') + '>Acheter un ticket</button></div>' +
      '<div class="rowline"><div class="det">Gains cumulés : ' + (G.stats.lottoWins||0) + ' tirage(s) gagné(s)</div></div></div></div>' +
      '<div class="grid2"><div class="panel"><h2>Objectifs du citoyen</h2>' + (goals().length ? goals().map(g => '<div class="rowline"><div class="lbl">▸ ' + g + '</div></div>').join('') : '<div class="empty">Tous les objectifs sont atteints.</div>') + '</div>' +
      '<div class="panel"><h2>Journal de bord</h2><div id="feedZone"></div></div></div>';
  }

  function rInv() {
    const entries = Object.entries(G.inv).filter(([,q]) => q > 0);
    if (!entries.length) return '<h1>Inventaire</h1><div class="sub">Votre sac est vide. Achetez de quoi manger et boire : vos jauges baissent en continu.</div>' +
      '<div class="panel" style="text-align:center;padding:40px"><div style="font-size:38px">🎒</div><p class="empty">Rien à consommer pour l’instant.</p>' +
      '<button class="btn btn-primary" data-act="tab" data-id="marche">Aller aux courses</button></div>';
    return '<h1>Inventaire</h1><div class="sub">Cliquez sur un aliment pour le consommer immédiatement (animation sur les jauges en bas à gauche).</div>' +
      '<div class="inv-grid">' + entries.map(([id,q],k) => { const f = foodById(id);
        return '<div class="inv-card" style="animation-delay:' + (k*0.04) + 's"><span class="qty">×' + q + '</span><div style="font-size:30px">' + f.ico + '</div>' +
        '<div class="nm">' + f.n + '</div><div class="fx">' + (f.f ? 'Faim +' + f.f : '') + (f.f && f.s ? ' · ' : '') + (f.s ? 'Soif +' + f.s : '') + '</div>' +
        '<button class="btn btn-primary btn-sm btn-block" data-act="eat" data-id="' + id + '">Consommer</button></div>'; }).join('') + '</div>';
  }

  function rMarche() {
    return '<h1>Courses</h1><div class="sub">Prix TTC (TVA 20 % incluse). Paiement par carte : débité de votre compte bancaire.</div><div class="panel">' +
      DATA.foods.map(f => '<div class="rowline"><div><div class="lbl">' + f.ico + ' ' + f.n + '</div><div class="det">' + (f.f ? 'Faim +' + f.f : '') + (f.f && f.s ? ' · ' : '') + (f.s ? 'Soif +' + f.s : '') + ' · en sac : ' + (G.inv[f.id]||0) + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:12px"><span class="money">' + eur(f.p) + '</span>' +
      '<button class="btn btn-sm btn-primary" data-act="buyFood" data-id="' + f.id + '">Acheter</button></div></div>').join('') + '</div>';
  }

  function rCarriere() {
    let mine;
    if (G.jobs.length) {
      mine = G.jobs.map((j,i) => '<div class="rowline"><div><div class="lbl">' + esc(j.title) + ' — ' + esc(DATA.companies[j.c].n) + '</div>' +
        '<div class="det">' + eur(j.h) + ' brut/h · ' + (j.mode === 'plein' ? 'temps plein (100 %)' : 'temps partiel (50 %)') + ' · net ≈ ' + eur(jobNetHourly(j.h, j.mode)) + '/h · minutes : ' + (j.mins||0) + (j.promo ? ' · +6 % promotion' : '') + '</div></div>' +
        '<button class="btn btn-sm btn-danger" data-act="quitJob" data-i="' + i + '">Quitter</button></div>').join('');
    } else mine = '<div class="empty">Aucun poste. Consultez le tableau des offres ci-dessous.</div>';
    const loadPct = Math.round(totalLoad()*100);
    const secs = [''].concat([...new Set(DATA.companies.map(c => c.sec))]);
    const q = (T.jobF.q || '').toLowerCase();
    const list = DATA.companies.map((c,ci) => ({ c, ci }))
      .filter(x => (!T.jobF.sec || x.c.sec === T.jobF.sec))
      .filter(x => (!q || x.c.n.toLowerCase().includes(q) || x.c.o.some(o => o[0].toLowerCase().includes(q))))
      .filter(x => (!T.jobF.ok || x.c.o.some(o => o[2] <= playerTier())));
    const cards = list.map((x,k) => '<div class="job-card" style="animation-delay:' + (k*0.05) + 's"><h4>' + esc(x.c.n) + '</h4><span class="chip">' + esc(x.c.sec) + '</span>' +
      x.c.o.map((o,oi) => { const tierOk = playerTier() >= o[2], loadOk = totalLoad() < 1;
        return '<div class="offer-row"><div><div class="o-n">' + esc(o[0]) + '</div><div class="o-d">' + eur(o[1]) + ' brut/h · tier ' + o[2] + '</div></div>' +
        '<button class="btn btn-sm ' + (tierOk && loadOk ? 'btn-primary' : '') + '" data-act="offer" data-c="' + x.ci + '" data-o="' + oi + '" ' + (tierOk && loadOk ? '' : 'disabled') + '>' +
        (!tierOk ? 'Diplôme req.' : !loadOk ? 'Charge pleine' : 'Choisir') + '</button></div>'; }).join('') + '</div>').join('') || '<div class="empty">Aucune offre ne correspond aux filtres.</div>';
    let train = '';
    if (G.training) { const f = DATA.form.find(x => x.id === G.training.id);
      train = '<div class="panel"><h2>Formation en cours</h2><div class="rowline"><div><div class="lbl">' + f.n + '</div><div class="det">Terminée dans <span class="mono" id="trainRest">' + Math.max(0, Math.ceil((G.training.end - Date.now())/1000)) + ' s</span></div></div><span class="chip gold">EN COURS</span></div></div>'; }
    const forms = DATA.form.map(f => { const done = G.diplomas.includes(f.id);
      return '<div class="rowline"><div><div class="lbl">' + f.n + '</div><div class="det">' + f.d + ' · ' + (f.cost ? eur(f.cost) : 'Gratuit') + ' · tier ' + f.tier + '</div></div>' +
      (done ? '<span class="chip green">OBTENU</span>' : '<button class="btn btn-sm btn-primary" data-act="train" data-id="' + f.id + '">S’inscrire</button>') + '</div>'; }).join('');
    return '<h1>Formation & Emploi</h1><div class="sub">Tier actuel : ' + playerTier() + ' · Temps plein = 1 seul job · Temps partiel = cumulable (charge totale 100 % max).</div>' +
      train +
      '<div class="panel"><h2>Mes postes</h2><div style="display:flex;align-items:center;margin-bottom:10px"><span style="font-size:12px;color:var(--mut)">Charge de travail</span><div class="bar b-gold"><div class="fill" style="width:' + loadPct + '%"></div></div><span class="mono" style="font-size:12px">' + loadPct + ' %</span></div>' + mine + '</div>' +
      '<div class="panel"><h2>Tableau des offres</h2>' +
      '<div class="job-filters"><select class="mini" data-act="jobSec">' + secs.map(s => '<option value="' + esc(s) + '"' + (T.jobF.sec === s ? ' selected' : '') + '>' + (s ? esc(s) : 'Tous les secteurs') + '</option>').join('') + '</select>' +
      '<input type="text" data-act="jobQ" placeholder="Rechercher un poste ou une entreprise…" value="' + esc(T.jobF.q) + '">' +
      '<label class="chk"><input type="checkbox" data-act="jobOk"' + (T.jobF.ok ? ' checked' : '') + '> Accessibles à mon tier</label></div>' +
      '<div class="job-grid">' + cards + '</div></div>' +
      '<div class="panel"><h2>Catalogue des formations</h2>' + forms + '</div>';
  }

  function rEntreprises() {
    if (T.selBiz >= 0 && G.biz[T.selBiz]) return rBizDetail(G.biz[T.selBiz], T.selBiz);
    const owned = G.biz.map((b,i) => '<div class="panel" style="cursor:pointer" data-act="selBiz" data-i="' + i + '"><h2>' + esc(b.name) + ' <span class="chip gold">' + DATA.bizTypes[b.type].label.toUpperCase() + '</span></h2><div class="sub" style="margin:0">Réputation ' + Math.round(b.rep) + '/100 · ' + b.emps.length + ' salarié·s · CA cumulé ' + eur(b.rev) + ' · cliquez pour ouvrir le panneau</div></div>').join('') || '<div class="panel"><div class="empty">Vous ne possédez encore aucune entreprise.</div></div>';
    const create = Object.entries(DATA.bizTypes).map(([type,bt]) => '<div class="rowline"><div><div class="lbl">' + bt.label + '</div><div class="det">Capital : ' + eur(bt.cost) + (bt.req ? ' · Requis : ' + DATA.form.find(f => f.id === bt.req).n : '') + '</div></div><button class="btn btn-sm btn-primary" data-act="openCreate" data-type="' + type + '">Fonder</button></div>').join('');
    return '<h1>Mes entreprises</h1><div class="sub">Panneaux complets : vue d’ensemble, production, marketing, RH, améliorations, compta. IS 15 % et URSSAF prélevés sur le compte.</div>' + owned + '<div class="panel"><h2>Créer une entreprise</h2>' + create + '</div>';
  }

  function bizTabs(b) {
    const tabs = [['overview','Vue d’ensemble']];
    if (b.type === 'boulangerie' || b.type === 'magasin') tabs.push(['prod','Production & stocks']);
    tabs.push(['mkt','Marketing']); tabs.push(['hr','RH']); tabs.push(['ups','Améliorations']); tabs.push(['compta','Compta']);
    return '<div class="biz-tabs">' + tabs.map(([id,lbl]) => '<button class="biz-tab' + (T.bizTab === id ? ' active' : '') + '" data-act="bizTab" data-t="' + id + '">' + lbl + '</button>').join('') + '</div>';
  }
  function activeChips(b) {
    const now = Date.now(); let s = '';
    if (b.boostUntil > now) s += '<span class="chip gold" style="margin-right:6px">📣 Boost ×' + b.boostMul + ' — ' + Math.ceil((b.boostUntil-now)/1000) + ' s</span>';
    if (b.promoUntil > now) s += '<span class="chip red" style="margin-right:6px">⚡ Vente flash — ' + Math.ceil((b.promoUntil-now)/1000) + ' s</span>';
    if (perk(b,'fidelite')) s += '<span class="chip green" style="margin-right:6px">Carte fidélité</span>';
    if (perk(b,'autoRestock')) s += '<span class="chip green" style="margin-right:6px">Réassort auto</span>';
    if (perk(b,'enseigne')) s += '<span class="chip green" style="margin-right:6px">Enseigne</span>';
    if (perk(b,'pub')) s += '<span class="chip green" style="margin-right:6px">Spot TV</span>';
    return s;
  }

  function rBizDetail(b,i) {
    let body = '';
    if (T.bizTab === 'overview') {
      const top = Object.entries(b.counters || {}).sort((a,b2) => b2[1]-a[1]).slice(0,3)
        .map(([pid,n]) => { const p = (DATA.bizTypes[b.type].prods || []).find(x => x.id === pid); return p ? '<span class="chip gold" style="margin-right:6px">' + p.n + ' ×' + n + '</span>' : ''; }).join('');
      body = '<div style="margin-bottom:12px">' + activeChips(b) + '</div>' +
        '<div class="grid3"><div class="kpi"><div class="k-lbl">CA cumulé</div><div class="k-val" style="color:var(--gold)">' + eur(b.rev) + '</div></div>' +
        '<div class="kpi"><div class="k-lbl">Réputation</div><div class="k-val">' + Math.round(b.rep) + '/100</div></div>' +
        '<div class="kpi"><div class="k-lbl">Salaires versés</div><div class="k-val" style="color:var(--red)">' + eur(b.wagesTotal||0) + '</div></div></div>' +
        '<h3>Revenu des 60 dernières secondes</h3><canvas class="chart" id="bChart" style="height:130px"></canvas>' +
        (top ? '<h3>Meilleures ventes</h3><div>' + top + '</div>' : '') +
        (b.type === 'boulangerie' ? '<h3>Commande spéciale</h3>' + (b.order
          ? '<div class="rowline"><div><div class="lbl">📦 ' + b.order.qty + ' × ' + esc(b.order.pn) + ' — récompense ' + eur(b.order.reward) + '</div><div class="det">Expire dans ' + Math.max(0, Math.ceil((b.order.until - Date.now())/1000)) + ' s · stock actuel : ' + Math.floor(b.stock[b.order.p]||0) + '</div></div>' +
            '<button class="btn btn-primary btn-sm" data-act="orderFill" data-b="' + i + '"' + ((b.stock[b.order.p]||0) < b.order.qty ? ' disabled' : '') + '>Honorer</button></div>'
          : '<div class="empty">Les traiteurs et comités d’entreprise passent commande de temps en temps…</div>') : '') +
        (b.type === 'immobilier' ? '<h3>Mandats</h3><div class="rowline"><div><div class="lbl">Mandats actifs : ' + (b.mandats||0) + '</div><div class="det">Commission 0,8–2,2 €/s chacun, boostée par le réseau et la météo.</div></div><button class="btn btn-primary btn-sm" data-act="buyMandat" data-b="' + i + '">Signer (300 €)</button></div>' : '') +
        (b.type === 'banque' ? '<h3>Pilotage des taux</h3>' +
          '<div class="rowline"><div><div class="lbl">Taux crédit client</div><div class="det">Élevé = plus de marge, moins de demande.</div></div><div style="display:flex;gap:8px;align-items:center"><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tc" data-v="-0.5">−</button><span class="money">' + b.tauxCredit.toFixed(1) + ' %</span><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tc" data-v="0.5">+</button></div></div>' +
          '<div class="rowline"><div><div class="lbl">Taux servi aux dépôts</div></div><div style="display:flex;gap:8px;align-items:center"><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tl" data-v="-0.25">−</button><span class="money">' + b.tauxLivret.toFixed(2) + ' %</span><button class="btn btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="tl" data-v="0.25">+</button></div></div>' +
          '<div class="rowline"><div><div class="lbl">Campagne publicitaire</div></div><button class="btn btn-primary btn-sm" data-act="bankAdj" data-b="' + i + '" data-k="mkt">Lancer (1 000 €)</button></div>' +
          '<div class="grid3" style="margin-top:12px"><div class="kpi"><div class="k-lbl">Comptes</div><div class="k-val">' + b.accounts + '</div></div><div class="kpi"><div class="k-lbl">Dépôts</div><div class="k-val">' + kfmt(b.deposits) + '</div></div><div class="kpi"><div class="k-lbl">Crédits</div><div class="k-val">' + kfmt(b.loans) + '</div></div></div>' : '');
    }
    else if (T.bizTab === 'prod') {
      if (b.type === 'boulangerie') {
        const bt = DATA.bizTypes.boulangerie;
        body = '<h3>Entrepôt de matières premières</h3>' +
          Object.entries(bt.mats).map(([id,m]) => '<div class="rowline"><div><div class="lbl">' + m.n + '</div><div class="det">Stock : ' + Math.floor(b.mats[id]||0) + ' · ' + eur(m.p) + '/unité</div></div><div style="display:flex;gap:8px"><button class="btn btn-sm" data-act="buyMat" data-b="' + i + '" data-m="' + id + '" data-q="10">+10 (' + eur(m.p*10) + ')</button><button class="btn btn-sm btn-primary" data-act="buyMat" data-b="' + i + '" data-m="' + id + '" data-q="50">+50 (' + eur(m.p*50) + ')</button></div></div>').join('') +
          '<h3>Fournil — production & prix</h3>' + bt.prods.map(p => '<div class="rowline"><div><div class="lbl">' + p.n + '</div><div class="det">Stock : ' + Math.floor(b.stock[p.id]||0) + ' · vendus : ' + (b.counters[p.id]||0) + ' · réf. ' + eur(p.ref) + '</div></div><div style="display:flex;gap:8px;align-items:center"><button class="btn btn-sm" data-act="craft" data-b="' + i + '" data-p="' + p.id + '" data-q="1">Cuire ×1</button><button class="btn btn-sm" data-act="craft" data-b="' + i + '" data-p="' + p.id + '" data-q="10">×10</button><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="-0.1">−</button><span class="money">' + eur(b.prices[p.id]) + '</span><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="0.1">+</button></div></div>').join('') +
          '<div class="det" style="margin-top:8px">Le four de base produit 1 article/s, puis +1 par salarié et par niveau de four.</div>';
      } else {
        body = '<div style="margin-bottom:12px">' + (perk(b,'autoRestock') ? '<span class="chip green">Réassort automatique actif</span>' : '<span class="chip">Réassort manuel — voir onglet Marketing pour l’automatiser</span>') + '</div>' +
          '<h3>Approvisionnement & rayons</h3>' + DATA.bizTypes.magasin.prods.map(p => '<div class="rowline"><div><div class="lbl">' + p.n + '</div><div class="det">Stock : ' + Math.floor(b.stock[p.id]||0) + ' · vendus : ' + (b.counters[p.id]||0) + ' · grossiste ' + eur(p.cost) + '</div></div><div style="display:flex;gap:8px;align-items:center"><button class="btn btn-sm" data-act="buyStock" data-b="' + i + '" data-p="' + p.id + '" data-q="10">+10 (' + eur(p.cost*10) + ')</button><button class="btn btn-sm btn-primary" data-act="buyStock" data-b="' + i + '" data-p="' + p.id + '" data-q="50">+50</button><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="-0.1">−</button><span class="money">' + eur(b.prices[p.id]) + '</span><button class="btn btn-sm" data-act="priceAdj" data-b="' + i + '" data-p="' + p.id + '" data-v="0.1">+</button></div></div>').join('');
      }
    }
    else if (T.bizTab === 'mkt') {
      body = '<div style="margin-bottom:12px">' + (activeChips(b) || '<span class="chip">Aucune campagne active</span>') + '</div>' +
        ((DATA.mkt[b.type] || []).map(a => { const owned = a.once && perk(b, a.perk);
          return '<div class="rowline"><div><div class="lbl">' + a.n + (owned ? ' <span class="chip green">ACTIF</span>' : '') + '</div><div class="det">' + a.d + '</div></div>' +
          (owned ? '' : '<button class="btn btn-sm btn-primary" data-act="mktDo" data-b="' + i + '" data-a="' + a.id + '">' + eur(a.cost) + '</button>') + '</div>'; }).join('') || '<div class="empty">Rien à afficher.</div>');
    }
    else if (T.bizTab === 'hr') {
      const empList = b.emps.map((e,ei) => '<div class="rowline"><div><div class="lbl">' + esc(e.n) + '</div><div class="det">' + eur(e.h) + '/h</div></div><button class="btn btn-sm btn-danger" data-act="fire" data-b="' + i + '" data-i="' + ei + '">Licencier</button></div>').join('') || '<div class="empty">Aucun salarié.</div>';
      body = '<div class="rowline"><div><div class="lbl">Effectif : ' + b.emps.length + ' / ' + ((DATA.bizTypes[b.type]||{}).maxEmp || 4) + '</div><div class="det">Chaque salarié produit (boulangerie), attire (magasin/banque) ou commissionne (agence).</div></div><button class="btn btn-primary" data-act="hire" data-b="' + i + '">Recruter</button></div>' + empList;
    }
    else if (T.bizTab === 'ups') {
      body = (DATA.ups[b.type] || []).map(u => { const lvl = upLvl(b,u.id), maxed = lvl >= u.max; const cost = Math.round(u.cost*Math.pow(u.grow,lvl));
        return '<div class="rowline"><div><div class="lbl">' + u.n + ' <span class="chip gold">Niv. ' + lvl + '/' + u.max + '</span></div><div class="det">' + u.d + '</div></div>' +
        (maxed ? '<span class="chip green">MAX</span>' : '<button class="btn btn-sm btn-primary" data-act="upgrade" data-b="' + i + '" data-u="' + u.id + '">' + eur(cost) + '</button>') + '</div>'; }).join('') || '<div class="empty">Aucune amélioration.</div>';
    }
    else {
      body = '<table class="t"><tr><td>Chiffre d’affaires cumulé</td><td class="money">' + eur(b.rev) + '</td></tr>' +
        '<tr><td>Unités vendues / ventes</td><td>' + (b.sold || Object.values(b.counters||{}).reduce((a,x)=>a+x,0)) + '</td></tr>' +
        '<tr><td>Masse salariale versée</td><td class="money neg">−' + eur(b.wagesTotal||0) + '</td></tr>' +
        '<tr><td>Bénéfice du cycle en cours</td><td>' + eur(b.profit||0) + '</td></tr>' +
        '<tr><td>Impôt sur les sociétés</td><td>15 % du bénéfice, prélevé chaque minute sur le compte</td></tr></table>' +
        '<h3>Revenu des 60 dernières secondes</h3><canvas class="chart" id="bChart" style="height:130px"></canvas>';
    }
    return '<button class="btn btn-ghost btn-sm" data-act="backBiz">← Toutes mes entreprises</button>' +
      '<h1 style="margin-top:14px">' + esc(b.name) + '</h1><div class="sub">' + DATA.bizTypes[b.type].label + ' · panneau de pilotage · météo actuelle : ' + weatherChip() + '</div>' +
      bizTabs(b) + '<div class="panel">' + body + '</div>';
  }

  function rBanque() {
    if (!G.bank.bankId) return '<h1>Ouvrir un compte bancaire</h1><div class="sub">Indispensable : votre salaire y sera versé et <b>tous les impôts, taxes, loyers et mensualités y seront prélevés automatiquement</b>. Tant que vous n’en avez pas, tout se paie en liquide.</div><div class="panel">' + DATA.banks.map(b => '<div class="rowline"><div><div class="lbl">' + b.n + '</div><div class="det">Livret A rémunéré ' + b.lv + ' %/an · ouverture gratuite</div></div><button class="btn btn-sm btn-primary" data-act="openBank" data-id="' + b.id + '">Ouvrir un compte</button></div>').join('') + '</div>';
    const bd = DATA.banks.find(b => b.id === G.bank.bankId);
    const loans = G.bank.loans.map((L,i) => '<div class="rowline"><div><div class="lbl">' + L.n + '</div><div class="det">Reste dû ' + eur(L.reste) + ' · mensualité ' + eur(L.mens) + '/mois prélevée sur le compte</div></div><button class="btn btn-sm" data-act="loanRepay" data-i="' + i + '">Solder</button></div>').join('') || '<div class="empty">Aucun crédit en cours.</div>';
    const prelev = [];
    if (G.rental) prelev.push(['Loyer principal', G.rental.loyer]);
    G.houses.forEach(h => prelev.push(['Charges — ' + DATA.homes[h.i].n, h.c]));
    G.insurances.forEach(id => { const a = DATA.insurers.find(x => x.id === id); prelev.push(['Assurance ' + a.n, a.m]); });
    G.bank.loans.forEach(L => prelev.push(['Crédit ' + L.n, L.mens]));
    const emp = G.biz.reduce((a,b) => a + b.emps.length, 0);
    if (emp) prelev.push(['URSSAF (' + emp + ' salarié·s)', emp*45]);
    const jrn = (G.journal || []).slice(0, 18).map(j => '<tr><td class="mono" style="color:var(--dim)">' + new Date(j.t).toLocaleTimeString('fr-FR') + '</td><td>' + esc(j.label) + '</td><td class="money ' + (j.amt < 0 ? 'neg' : '') + '">' + (j.amt >= 0 ? '+' : '−') + eur(Math.abs(j.amt)) + '</td></tr>').join('') || '<tr><td colspan="3" class="empty">Aucune opération.</td></tr>';
    return '<h1>Banque — ' + esc(bd.n) + '</h1><div class="sub">Tout votre argent vit ici : versements, prélèvements, épargne et crédits. Chaque mouvement déclenche l’animation de carte.</div>' +
      '<div class="grid3"><div class="kpi"><div class="k-lbl">Compte courant</div><div class="k-val" style="color:' + (G.bank.compte < 0 ? 'var(--red)' : 'var(--gold)') + '">' + eur(G.bank.compte) + '</div></div>' +
      '<div class="kpi"><div class="k-lbl">Livret A (' + bd.lv + ' %/an)</div><div class="k-val">' + eur(G.bank.livret) + ' <span style="font-size:11px;color:var(--dim)">/ 22 950 €</span></div></div>' +
      '<div class="kpi"><div class="k-lbl">Liquidités en poche</div><div class="k-val">' + eur(G.cash) + '</div></div></div>' +
      '<div class="grid2" style="margin-top:18px"><div class="panel"><h2>Mouvements entre poches</h2><input type="number" class="mini" id="bankAmt" placeholder="Montant €" min="1">' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn" data-act="deposit">Liquide → compte</button><button class="btn" data-act="withdraw">Compte → liquide</button><button class="btn btn-primary" data-act="toLivret">Compte → Livret A</button><button class="btn btn-primary" data-act="fromLivret">Livret A → compte</button></div>' +
      '<h3>Prélèvements mensuels (toutes les 60 s)</h3>' + (prelev.length ? prelev.map(([l,m]) => '<div class="rowline"><div class="lbl">' + l + '</div><span class="money neg">−' + eur(m) + '</span></div>').join('') : '<div class="empty">Aucun prélèvement récurrent.</div>') + '</div>' +
      '<div class="panel"><h2>Crédits</h2><input type="number" class="mini" id="loanAmt" placeholder="Montant emprunté €" min="1000"><div style="display:flex;gap:8px;margin-top:12px">' + DATA.loans.map(l => '<button class="btn btn-sm" data-act="loanTake" data-t="' + l.id + '">' + l.n + ' (' + l.rate + ' %)</button>').join('') + '</div><h3>En cours</h3>' + loans + '</div></div>' +
      '<div class="panel"><h2>Relevé de compte (dernières opérations)</h2><table class="t"><tr><th>Heure</th><th>Libellé</th><th>Montant</th></tr>' + jrn + '</table></div>';
  }

  function rImmo() {
    const owned = G.houses.map((h,i) => { const hd = DATA.homes[h.i];
      return '<div class="rowline"><div><div class="lbl">' + hd.n + '</div><div class="det">Valeur <span class="money" id="pv' + i + '">' + eur(h.v) + '</span> · charges ' + eur(h.c) + '/mois · loyer ' + eur(h.rent) + '/s ' + (h.tenant ? '· <span class="chip green">LOUÉ</span>' : '') + '</div></div><div style="display:flex;gap:8px"><button class="btn btn-sm" data-act="rentOut" data-i="' + i + '">' + (h.tenant ? 'Donner congé' : 'Mettre en location') + '</button><button class="btn btn-sm btn-danger" data-act="sellHome" data-i="' + i + '">Vendre</button></div></div>'; }).join('') || '<div class="empty">Aucun bien en portefeuille.</div>';
    return '<h1>Immobilier</h1><div class="sub">Les prix évoluent en continu. Achetez bas, revendez haut, ou encaissez des loyers versés sur le compte.</div>' +
      (G.rental ? '<div class="panel"><h2>Votre location actuelle</h2><div class="rowline"><div class="lbl">' + DATA.rentals[G.rental.i].n + ' — ' + eur(G.rental.loyer) + '/mois</div><button class="btn btn-sm btn-danger" data-act="cancelRent">Résilier le bail</button></div></div>'
       : '<div class="panel"><h2>Se loger — locations</h2>' + DATA.rentals.map((r,i) => '<div class="rowline"><div class="lbl">' + r.n + '</div><div style="display:flex;gap:10px;align-items:center"><span class="money">' + eur(r.loyer) + '/mois</span><button class="btn btn-sm btn-primary" data-act="rentHome" data-i="' + i + '">Signer le bail</button></div></div>').join('') + '</div>') +
      '<div class="panel"><h2>Votre patrimoine</h2>' + owned + '</div>' +
      '<div class="panel"><h2>Biens en vente</h2>' + DATA.homes.map((h,i) => '<div class="rowline"><div><div class="lbl">' + h.n + '</div><div class="det">Charges ' + eur(h.c) + '/mois · confort +' + Math.min(10, h.p/60000).toFixed(1) + '</div></div><div style="display:flex;gap:10px;align-items:center"><span class="money">' + eur(h.p) + '</span><button class="btn btn-sm btn-primary" data-act="buyHome" data-i="' + i + '">Acheter</button></div></div>').join('') + '</div>';
  }

  function rAuto() {
    return '<h1>Concessionnaire</h1><div class="sub">Une voiture améliore votre productivité — et peut tomber en panne.</div>' +
      (G.cars.length ? '<div class="panel"><h2>Votre garage</h2>' + G.cars.map(i => '<div class="rowline"><div class="lbl">' + DATA.cars[i].n + '</div><div style="display:flex;gap:10px;align-items:center"><span class="chip green">+' + Math.round(DATA.cars[i].b*100) + ' %</span><button class="btn btn-sm btn-danger" data-act="sellCar" data-i="' + i + '">Revendre (' + eur(DATA.cars[i].p*0.6) + ')</button></div></div>').join('') + '</div>' : '') +
      '<div class="panel">' + DATA.cars.map((c,i) => '<div class="rowline"><div><div class="lbl">' + c.n + '</div><div class="det">Bonus productivité +' + Math.round(c.b*100) + ' %</div></div><div style="display:flex;gap:10px;align-items:center"><span class="money">' + eur(c.p) + '</span><button class="btn btn-sm btn-primary" data-act="buyCar" data-i="' + i + '" ' + (G.cars.includes(i) ? 'disabled' : '') + '>Acheter</button></div></div>').join('') + '</div>';
  }

  function rAssur() {
    return '<h1>Assurances & mutuelles</h1><div class="sub">Couverture contre frais de santé, pannes et sinistres. Cotisation prélevée chaque mois sur le compte.</div><div class="panel">' +
      DATA.insurers.map(a => { const on = G.insurances.includes(a.id);
        return '<div class="rowline"><div><div class="lbl">' + a.n + '</div><div class="det">' + a.d + '</div></div><div style="display:flex;gap:10px;align-items:center"><span class="money">' + eur(a.m) + '/mois</span><button class="btn btn-sm ' + (on ? 'btn-danger' : 'btn-primary') + '" data-act="insure" data-id="' + a.id + '">' + (on ? 'Résilier' : 'Souscrire') + '</button></div></div>'; }).join('') + '</div>' +
      '<div class="panel"><h2>Couverture actuelle</h2><div class="sub" style="margin:0">Prise en charge : <b style="color:var(--green)">' + Math.round(cov()*100) + ' %</b></div></div>';
  }

  function rEco() {
    return '<h1>Économie nationale</h1><div class="sub">800 citoyens actifs · météo actuelle : <b>' + weatherChip() + '</b> (modifie la fréquentation des commerces toutes les 3 min).</div>' +
      '<div class="grid3"><div class="kpi"><div class="k-lbl">Indice HL-CAC</div><div class="k-val" id="idxCac">' + W.idx.cac.toFixed(0) + '</div><canvas class="chart" id="chCac"></canvas></div>' +
      '<div class="kpi"><div class="k-lbl">Indice Immobilier</div><div class="k-val" id="idxImmo">' + W.idx.immo.toFixed(1) + '</div><canvas class="chart" id="chImmo"></canvas></div>' +
      '<div class="kpi"><div class="k-lbl">Indice Consommation</div><div class="k-val" id="idxConso">' + W.idx.conso.toFixed(1) + '</div><canvas class="chart" id="chConso"></canvas></div></div>' +
      '<div class="panel" style="margin-top:18px"><h2>Votre performance nette (90 dernières secondes)</h2><canvas class="chart" id="chNet" style="height:150px"></canvas></div>' +
      '<div class="grid2"><div class="panel"><h2>Entreprises de la ville</h2><table class="t"><tr><th>Entreprise</th><th>Secteur</th><th>Direction</th><th>Santé</th></tr>' +
      W.biz.map(b => '<tr><td>' + esc(b.n) + '</td><td style="color:var(--mut)">' + esc(b.s) + '</td><td style="color:var(--mut)">' + esc(b.boss||'—') + '</td><td><div style="display:flex;align-items:center"><div class="bar ' + (b.sante > 60 ? 'b-green' : b.sante > 35 ? 'b-orange' : 'b-red') + '" style="margin:0"><div class="fill" style="width:' + b.sante + '%"></div></div><span class="mono" style="margin-left:8px;font-size:11px">' + Math.round(b.sante) + '</span></div></td></tr>').join('') + '</table></div>' +
      '<div class="panel"><h2>Journal économique en direct</h2><div id="feedZone"></div></div></div>';
  }

  function rNoir() {
    if (!G.ill.unlocked) return '<h1>Quartier interdit</h1><div class="sub">Un réseau opère en marge de la ville. L’entrée se paie, cash ou compte.</div><div class="panel" style="text-align:center;padding:44px"><div style="font-size:40px">🔒</div><p style="color:var(--mut);margin:14px 0 22px">Corrompre les bonnes personnes : <b class="money">' + eur(DATA.illEntry) + '</b></p><button class="btn btn-primary btn-lg" data-act="illUnlock">Payer le droit d’entrée</button></div>';
    return '<h1>Marché noir</h1><div class="sub">Gains élevés, chaleur élevée. À 100 : garde à vue.</div>' +
      '<div class="panel"><h2>Chaleur policière</h2><div style="display:flex;align-items:center"><div class="bar b-red"><div class="fill" id="heatBar" style="width:' + G.ill.heat + '%"></div></div><span class="mono" id="heatNum">' + Math.round(G.ill.heat) + '/100</span></div><div style="margin-top:12px"><button class="btn btn-sm" data-act="bribe">Pot-de-vin (800 € → −35 chaleur)</button></div></div>' +
      '<div class="panel">' + DATA.ill.map(a => { const ready = Date.now() >= (G.ill.cd[a.id]||0); const lock = a.reqBiz && !ownsBiz(a.reqBiz);
        return '<div class="rowline"><div><div class="lbl">' + a.n + '</div><div class="det">' + a.d + ' · Mise ' + eur(a.cost) + ' · Gain ' + eur0(a.gain[0]) + '–' + eur0(a.gain[1]) + ' · Risque ' + Math.round(a.risk*100) + ' %' + (lock ? ' · <b style="color:var(--red)">Nécessite une banque</b>' : '') + '</div></div><button class="btn btn-sm btn-primary" data-act="illDo" data-id="' + a.id + '" ' + ((!ready||lock) ? 'disabled' : '') + '>' + (ready ? 'Exécuter' : 'Recharge…') + '</button></div>'; }).join('') + '</div>';
  }

  function rPlus() {
    return '<h1>Boutique +</h1><div class="sub">Convertissez de vrais euros en capital de jeu. <b>Mode démo : paiements simulés.</b></div><div class="grid3">' +
      DATA.packs.map(p => '<div class="panel" style="text-align:center;position:relative">' + (p.best ? '<span class="chip gold" style="position:absolute;top:-9px;left:50%;transform:translateX(-50%)">MEILLEURE OFFRE</span>' : '') + '<h2 style="margin-top:6px">' + p.n + '</h2><div style="font-family:var(--mono);font-size:30px;font-weight:700;color:var(--gold);margin:12px 0">' + eur0(p.amount) + '</div><div style="color:var(--mut);margin-bottom:16px">' + p.price + '</div><button class="btn btn-primary btn-block" data-act="buyPack" data-id="' + p.id + '">Acheter</button></div>').join('') + '</div>';
  }

  function rProfil() {
    const age = Math.floor((Date.now() - G.created)/60000);
    return '<h1>Profil citoyen</h1><div class="sub">Citoyen depuis ' + age + ' minute(s) réelle(s) · ' + esc(DB.label()) + '</div>' +
      '<div class="grid2"><div class="panel"><h2>Statistiques</h2><table class="t"><tr><td>Revenus nets gagnés</td><td class="money">' + eur(G.stats.earned) + '</td></tr><tr><td>Impôts & cotisations</td><td class="money neg">' + eur(G.stats.tax) + '</td></tr><tr><td>Articles vendus</td><td>' + G.stats.sales + '</td></tr><tr><td>Commandes spéciales honorées</td><td>' + (G.stats.orders||0) + '</td></tr><tr><td>XP totale</td><td>' + G.xp + '</td></tr><tr><td>Postes actifs</td><td>' + G.jobs.length + ' (' + Math.round(totalLoad()*100) + ' % de charge)</td></tr><tr><td>Entreprises</td><td>' + G.biz.length + '</td></tr><tr><td>Biens immobiliers</td><td>' + G.houses.length + '</td></tr></table></div>' +
      '<div class="panel"><h2>Compte</h2><div class="rowline"><div class="lbl">Pseudo</div><div>' + esc(G.name) + '</div></div><div class="rowline"><div class="lbl">Succès</div><div>' + G.ach.length + ' / ' + DATA.ach.length + '</div></div><div style="margin-top:16px;display:flex;gap:10px"><button class="btn btn-ghost" data-act="logout">Se déconnecter</button><button class="btn btn-danger" data-act="resetSave">Réinitialiser ma vie</button></div></div></div>' +
      '<div class="panel"><h2>Succès (' + G.ach.length + '/' + DATA.ach.length + ')</h2><div class="ach-grid">' +
      DATA.ach.map(a => { const on = G.ach.includes(a.id);
        return '<div class="ach ' + (on ? 'on' : 'off') + '"><div class="a-i">' + a.i + '</div><div class="a-n">' + a.n + '</div><div class="a-d">' + a.d + ' · +' + a.xp + ' XP</div></div>'; }).join('') + '</div></div>';
  }

  function spark(cv, data, color) {
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 200, h = cv.clientHeight || 100;
    cv.width = w*dpr; cv.height = h*dpr;
    const c = cv.getContext('2d'); c.scale(dpr,dpr); c.clearRect(0,0,w,h);
    c.strokeStyle = 'rgba(255,255,255,.06)';
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, h*i/4); c.lineTo(w, h*i/4); c.stroke(); }
    if (!data || data.length < 2) return;
    const min = Math.min(...data), max = Math.max(...data), span = (max-min)||1;
    c.beginPath();
    data.forEach((v,i) => { const x = i/(data.length-1)*w, y = h-6-((v-min)/span)*(h-12); i ? c.lineTo(x,y) : c.moveTo(x,y); });
    c.strokeStyle = color; c.lineWidth = 1.6; c.stroke();
    c.lineTo(w,h); c.lineTo(0,h); c.closePath();
    c.fillStyle = color.replace(')', ',.08)').replace('rgb','rgba'); c.fill();
  }
  const histCac = [], histImmo = [], histConso = [];
  function drawCharts() {
    spark(el('chNet'), T.hist, 'rgb(232,176,75)');
    spark(el('chCac'), histCac.slice(-60), 'rgb(84,163,216)');
    spark(el('chImmo'), histImmo.slice(-60), 'rgb(75,179,128)');
    spark(el('chConso'), histConso.slice(-60), 'rgb(224,135,63)');
  }

  function tickUI() {
    const bal = balance();
    T.cashDisp += (bal - T.cashDisp)*0.18;
    if (Math.abs(T.cashDisp - bal) < 0.01) T.cashDisp = bal;
    const c = el('tbCash');
    c.textContent = eur(T.cashDisp);
    c.classList.toggle('neg', bal < 0);
    el('tbCashLbl').textContent = G.bank.bankId ? 'compte bancaire' : 'liquide en poche';
    const v = G.vitals;
    el('barSante').style.width = v.sante + '%'; el('numSante').textContent = Math.round(v.sante);
    el('barFaim').style.width = v.faim + '%'; el('numFaim').textContent = Math.round(v.faim);
    el('barSoif').style.width = v.soif + '%'; el('numSoif').textContent = Math.round(v.soif);
    const st = el('vStatus');
    if (bal < 0) { st.textContent = '⚠ Compte à découvert'; st.className = 'v-status bad'; }
    else if (!hasShelter()) { st.textContent = '⚠ Sans domicile — jauges accélérées'; st.className = 'v-status bad'; }
    else if (v.faim < 20 || v.soif < 20) { st.textContent = '⚠ Vous devriez manger / boire'; st.className = 'v-status warn'; }
    else { st.textContent = 'Citoyen en bonne santé'; st.className = 'v-status'; }
    const inf = G.tickInfo || { rev:0, chg:0, tax:0 };
    el('stRev').textContent = '+' + eur(inf.rev);
    el('stChg').textContent = '−' + eur(inf.chg);
    const net = inf.rev - inf.chg;
    const sign = net >= 0 ? 1 : -1;
    if (T.netSign && sign !== T.netSign) { const sn = el('stNet'); sn.classList.remove('flash'); void sn.offsetWidth; sn.classList.add('flash'); }
    T.netSign = sign;
    el('stNet').textContent = (sign > 0 ? '+' : '−') + eur(Math.abs(net));
    el('stNet').style.color = sign > 0 ? 'var(--green)' : 'var(--red)';
    el('stTax').textContent = eur(G.stats.tax);
    updateTop();
    const jo = el('jailOv');
    if (G.jail > Date.now()) { jo.hidden = false; el('jailT').textContent = Math.ceil((G.jail - Date.now())/1000); }
    else jo.hidden = true;
    const bb = el('boostBar');
    if (G.boost) { bb.hidden = false; el('boostTxt').textContent = '⚡ Opportunité : ' + G.boost.label + ' — ' + G.boost.type + ' ×' + G.boost.mul; el('boostCd').textContent = Math.max(0, Math.ceil((G.boost.until - Date.now())/1000)) + ' s'; }
    else bb.hidden = true;
    /* loto : countdown live */
    const lb = el('lottoBtn'), lc = el('lottoCd');
    if (lb && lc) { const cd = Math.max(0, Math.ceil(((G.lottoCd||0) - Date.now())/1000)); lb.hidden = cd > 0; lc.hidden = cd <= 0; lc.textContent = cd + ' s'; }
    if (T.tab === 'carriere' && G.training) { const e = el('trainRest'); if (e) e.textContent = Math.max(0, Math.ceil((G.training.end - Date.now())/1000)) + ' s'; }
    if (T.tab === 'economie') {
      const set = (id,val) => { const e = el(id); if (e) e.textContent = val; };
      set('idxCac', W.idx.cac.toFixed(0)); set('idxImmo', W.idx.immo.toFixed(1)); set('idxConso', W.idx.conso.toFixed(1));
      histCac.push(W.idx.cac); histImmo.push(W.idx.immo); histConso.push(W.idx.conso);
      if (W.t % 2 === 0) drawCharts();
    }
    if (T.tab === 'noir' && G.ill.unlocked) { const hb = el('heatBar'); if (hb) hb.style.width = G.ill.heat + '%'; const hn = el('heatNum'); if (hn) hn.textContent = Math.round(G.ill.heat) + '/100'; }
    if (T.tab === 'immobilier') G.houses.forEach((h,i) => { const e = el('pv'+i); if (e) e.textContent = eur(h.v); });
    if (T.tab === 'entreprises' && T.selBiz >= 0 && T.bizTab === 'mkt' && W.t % 5 === 0) render();
  }

  function buildTicker() {
    const items = DATA.news.concat(W.biz.slice(0,6).map(b => b.n + ' : ' + (b.sante > 65 ? '<span class="up">en forme</span>' : '<span class="dn">ralentit</span>'))).map(x => '◆ ' + x).join('&nbsp;&nbsp;&nbsp;');
    el('ticker').innerHTML = '<b>HEXALIFE ÉCO</b>&nbsp;&nbsp;&nbsp;' + items + '&nbsp;&nbsp;&nbsp;◆ CAC HL ' + W.idx.cac.toFixed(0);
  }

  document.addEventListener('change', e => {
    const t = e.target.closest('[data-act]'); if (!t || !G) return;
    if (t.dataset.act === 'jobSec') { T.jobF.sec = t.value; UI.render(); }
    if (t.dataset.act === 'jobOk') { T.jobF.ok = t.checked; UI.render(); }
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-act]'); if (!t || !G) return;
    if (t.dataset.act === 'jobQ') { clearTimeout(T.qT); T.qT = setTimeout(() => { T.jobF.q = t.value; UI.render(); const inp = document.querySelector('[data-act="jobQ"]'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }, 300); }
  });

  return { toast, feed, floatText, pulseVital, moneyFx, cardFx, modal, closeModal, flashSave, buildRail, setTab, render, updateTop, tick: tickUI, buildTicker, drawCharts, authTab, tutoNext, tutoSkip, placeTuto };
})();
