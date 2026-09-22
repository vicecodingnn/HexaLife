/* ═══════════ BOOT v3 — intro fiable, raccourcis clavier, erreurs surveillées ═══════════ */
(function () {
  const el = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function makeCity(container, n, hMin, hMax) {
    if (!container) return;
    let html = '';
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < n; i++) {
        const h = Math.round(hMin + Math.random() * (hMax - hMin));
        const w = Math.round(28 + Math.random() * 46);
        const lit = Math.random() < 0.55 ? ' lit' : '';
        html += '<div class="bld' + lit + '" style="height:' + h + 'px;width:' + w + 'px;--lit:' + (Math.random() * 4 + 2).toFixed(1) + 's"></div>';
      }
    container.innerHTML = html;
  }
  makeCity(el('cityFar'), 26, 60, 150);
  makeCity(el('cityNear'), 20, 90, 230);
  makeCity(el('authSky'), 30, 20, 110);
  makeCity(el('appSky'), 34, 30, 140);

  /* ── intro : le chargement FAIT avancer le marcheur et la ville ── */
  const STEPS = [
    [0,  'Connexion à la base de données…'],
    [18, 'Génération des 800 citoyens…'],
    [38, 'Préchauffage des fournils…'],
    [58, 'Calcul du barème fiscal…'],
    [76, 'Ouverture des agences bancaires…'],
    [92, 'Distribution des baguettes…']
  ];
  let prog = 0, dbReady = false, introDone = false;

  // DB.init() a son propre timeout : la promesse aboutit toujours,
  // l'intro ne peut plus rester bloquée.
  DB.init().then(() => { dbReady = true; }).catch(() => { dbReady = true; });
  setTimeout(() => { dbReady = true; }, 4000); // garde-fou ultime

  const loadTimer = setInterval(() => {
    if (!dbReady && prog > 14) prog = 14;           /* attend la détection de la base */
    else prog = Math.min(100, prog + 1.2 + Math.random() * 3.2);
    el('loadFill').style.width = prog + '%';
    el('loadPct').textContent = Math.floor(prog) + '%';
    /* le marcheur et la ville avancent avec le chargement */
    el('walker').style.left = (8 + prog * 0.72) + '%';
    el('cityNear').style.transform = 'translateX(' + (-prog * 4) + 'px)';
    el('cityFar').style.transform = 'translateX(' + (-prog * 1.6) + 'px)';
    el('introDawn').style.opacity = (prog / 100) * 0.9;
    let cur = 0; STEPS.forEach((s, i) => { if (prog >= s[0]) cur = i; });
    el('loadSteps').innerHTML = STEPS.map((s, i) =>
      '<div class="' + (i < cur ? 'ok' : i === cur ? 'cur' : '') + '">' + (i < cur ? '✓' : i === cur ? '▶' : '·') + ' ' + s[1] + '</div>').join('');
    if (prog >= 100 && !introDone) {
      introDone = true;
      clearInterval(loadTimer);
      el('walker').classList.add('done');
      const b = el('btnStart');
      b.classList.add('ready'); b.disabled = false;
      b.textContent = DB.session() ? 'Continuer ma vie' : 'Entrer en ville';
    }
  }, 120);

  el('btnStart').addEventListener('click', () => {
    if (DB.session()) enterGame(DB.session(), false);
    else show('scr-auth');
  });

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    el(id).classList.add('active');
    if (id === 'scr-auth') el('dbMode').textContent = DB.label();
  }

  /* ── auth animée (plus jamais de bouton bloqué) ── */
  function submitBtn(btn, on) { btn.classList.toggle('loading', on); btn.disabled = on; }

  el('formLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = el('li_btn'), m = el('authMsg');
    submitBtn(btn, true);
    try {
      await sleep(350);
      const r = await DB.login(el('li_user').value, el('li_pass').value);
      if (r.err) { m.textContent = r.err; m.classList.remove('ok'); m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg'); }
      else { m.textContent = 'Connexion réussie ✓'; m.classList.add('ok'); await sleep(300); enterGame(DB.session(), false); }
    } catch (err) {
      m.textContent = 'Erreur inattendue pendant la connexion.'; m.classList.remove('ok');
    } finally { submitBtn(btn, false); }
  });

  el('formReg').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = el('rg_btn'), m = el('regMsg');
    if (el('rg_pass').value !== el('rg_pass2').value) {
      m.textContent = 'Les mots de passe ne correspondent pas.'; m.classList.remove('ok');
      m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg');
      return;
    }
    submitBtn(btn, true);
    try {
      await sleep(350);
      const r = await DB.register(el('rg_user').value, el('rg_mail').value, el('rg_pass').value);
      if (r.err) { m.textContent = r.err; m.classList.remove('ok'); m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg'); }
      else { m.textContent = 'Citoyen créé ✓'; m.classList.add('ok'); await sleep(300); enterGame(DB.session(), true); }
    } catch (err) {
      m.textContent = 'Erreur inattendue pendant l’inscription.'; m.classList.remove('ok');
    } finally { submitBtn(btn, false); }
  });

  /* ── entrée en jeu ── */
  window.enterGame = async function (user, isNew) {
    try {
      genWorld();
      let s = await DB.loadGame(user);
      let off = null;
      if (s) { s = sanitize(s); off = offlineProgress(s); }
      else { s = newGame(user); isNew = true; }
      G = s; T.cashDisp = balance(); T.cashInit = true;
      if (!G.missions.list || !G.missions.list.length) rollMissions();
      if (!G.quests.list || !G.quests.list.length) rollQuests();

      // réglages + FX
      FX.configure(loadSettings());
      FX.init();
      UI.setWeather(curWeather().vis);

      show('scr-app');
      UI.buildRail(); UI.setTab('vie'); UI.buildTicker(); UI.updateTop();

      if (isNew) {
        UI.toast('Bienvenue, citoyen ' + esc(G.name) + '. Vous démarrez avec 2 000 €.', 'good');
        setTimeout(() => UI.toast('Le tutoriel vous guide : suivez les étapes.', ''), 2400);
      } else if (canClaimDaily()) {
        setTimeout(() => UI.toast('📅 Votre récompense quotidienne vous attend sur l’Accueil !', 'good'), 1200);
      }
      if (G.tuto >= 0) setTimeout(() => UI.placeTuto(), 400);
      maybeAch();

      if (off && off.dt > 60) {
        const h = Math.floor(off.dt / 3600), m = Math.floor(off.dt % 3600 / 60);
        UI.modal('<h2>⏳ Pendant votre absence…</h2><div class="m-sub">La ville a tourné ' + (h ? h + ' h ' : '') + m + ' min sans vous (activité réduite).</div>' +
          '<table class="t">' +
          (off.jobs > 0.5 ? '<tr><td>💼 Salaires (50 %)</td><td class="money">+' + eur(off.jobs) + '</td></tr>' : '') +
          (off.biz > 0.5 ? '<tr><td>🏪 Entreprises</td><td class="money">+' + eur(off.biz) + '</td></tr>' : '') +
          (off.loyers > 0.5 ? '<tr><td>🔑 Loyers perçus</td><td class="money">+' + eur(off.loyers) + '</td></tr>' : '') +
          (off.interets > 0.5 ? '<tr><td>🏦 Intérêts Livret A</td><td class="money">+' + eur(off.interets) + '</td></tr>' : '') +
          (off.diploma ? '<tr><td>🎓 Formation terminée</td><td><b>' + esc(off.diploma) + '</b></td></tr>' : '') +
          '<tr><td>Total crédité</td><td class="money"><b>+' + eur(off.gains) + '</b></td></tr>' +
          '<tr><td>Faim / soif</td><td>en légère baisse — pensez à manger !</td></tr>' +
          '</table><div class="m-actions"><button class="btn btn-primary" data-act="closeModal">Reprendre ma vie</button></div>');
        FX.moneyRain();
      }
      if (!TICK_TIMER) TICK_TIMER = setInterval(tick, 1000);
    } catch (e) {
      console.error('[HEXALIFE] enterGame', e);
      alert('Impossible de charger la partie : ' + (e && e.message || e));
    }
  };

  /* ── délégation globale des clics + effet ripple ── */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (!A[act]) return;
    e.preventDefault();
    if (t.classList && t.classList.contains('btn') && !t.disabled) {
      const r = t.getBoundingClientRect();
      const s = document.createElement('span');
      s.className = 'ripple';
      const size = Math.max(r.width, r.height) * 2.2;
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px';
      s.style.top = (e.clientY - r.top - size / 2) + 'px';
      t.appendChild(s);
      setTimeout(() => s.remove(), 620);
    }
    if (G && GUARDED.includes(act) && inJail()) { FX.sound('error'); return UI.toast('🚔 Impossible : vous êtes en garde à vue. Payez la caution ou patientez.', 'bad'); }
    try { A[act](t.dataset, t); }
    catch (err) { if (window.UI) UI.reportError(err, act); else console.error(err); }
  });

  /* ── clavier : Échap, F1, Alt+1..9, Espace/Entrée sur les switchs ── */
  const NAV_IDS = ['vie', 'inventaire', 'carriere', 'marche', 'entreprises', 'banque', 'immobilier', 'auto', 'assurances', 'sante', 'skills', 'economie', 'noir', 'plus', 'profil'];
  document.addEventListener('keydown', e => {
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
    if (e.key === 'Escape') { if (document.getElementById('termOv') || document.querySelector('.term-ov')) UI.closeTerminal(true); else UI.closeModal(); return; }
    if (!G) return;
    if (e.key === 'F1') { e.preventDefault(); A.openHelp(); return; }
    if (e.altKey && !inField && e.key >= '1' && e.key <= '9') {
      const id = NAV_IDS[+e.key - 1];
      if (id) { e.preventDefault(); UI.setTab(id); }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('set-row')) {
      e.preventDefault(); e.target.click();
    }
  });

  /* ── erreurs globales : visibles mais jamais bloquantes ── */
  window.addEventListener('error', e => { if (window.UI && G) UI.reportError(e.error || e.message, 'global'); });
  window.addEventListener('unhandledrejection', e => { if (window.UI && G) UI.reportError(e.reason, 'promise'); });

  /* ── sauvegardes de sécurité ── */
  window.addEventListener('beforeunload', () => { if (G) { G.last = Date.now(); DB.saveGameBeacon(DB.session(), G); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G) save(); });
  window.addEventListener('resize', () => { if (G && G.tuto >= 0) UI.placeTuto(); });

  window.UI = UI; window.A = A; window.T = T; window.FX = FX;
})();
