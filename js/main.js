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

  /* ── INTRO v11.5 : le titre HEXALIFE, hyper stylé, simple et sûr ── */
  (function buildLogo() {
    const logo = el('inLogo');
    if (!logo) return;
    const sweep = logo.querySelector('.in-sweep');
    logo.innerHTML = 'HEXALIFE'.split('').map((ch, i) =>
      '<span class="L' + (i >= 4 ? ' gd' : '') + '" style="--i:' + i + '">' + ch + '</span>').join('');
    if (sweep) { sweep.textContent = 'HEXALIFE'; logo.appendChild(sweep); }
  })();

  const STEPS = [
    [0,  'Connexion à la base de données…'],
    [18, 'Génération des 800 citoyens…'],
    [38, 'Préchauffage des fournils…'],
    [58, 'Calcul du barème fiscal…'],
    [76, 'Ouverture des agences bancaires…'],
    [92, 'Distribution des baguettes…']
  ];
  let prog = 0, dbReady = false, introDone = false;

  DB.init().then(() => { dbReady = true; }).catch(() => { dbReady = true; });
  setTimeout(() => { dbReady = true; }, 4000); // garde-fou ultime

  const intro = el('scr-intro');
  const loadTimer = setInterval(() => {
    if (!dbReady && prog > 14) prog = 14;           /* attend la détection de la base */
    else prog = Math.min(100, prog + 1.2 + Math.random() * 3.2);
    el('loadFill').style.width = prog + '%';
    el('loadPct').textContent = Math.floor(prog) + '%';
    if (prog >= 4) intro.classList.add('p1');      /* lettres du titre */
    if (prog >= 35) intro.classList.add('p2');     /* tagline */
    let cur = 0; STEPS.forEach((st, i) => { if (prog >= st[0]) cur = i; });
    el('loadSteps').innerHTML = STEPS.map((st, i) =>
      '<div class="' + (i < cur ? 'ok' : i === cur ? 'cur' : '') + '">' + (i < cur ? '✓' : i === cur ? '▶' : '·') + ' ' + st[1] + '</div>').join('');
    if (prog >= 100 && !introDone) {
      introDone = true;
      clearInterval(loadTimer);
      const b = el('btnStart');
      b.classList.add('ready'); b.disabled = false;
      b.textContent = DB.session() ? 'Continuer ma vie' : 'Entrer en ville';
    }
  }, 120);

  el('btnStart').addEventListener('click', () => {
    const b = el('btnStart');
    b.classList.add('success');
    intro.classList.add('leave');
    FX.sound('win');
    setTimeout(() => {
      if (DB.session()) enterGame(DB.session(), false);
      else show('scr-auth');
    }, 430);
  });

  function show(id) {
    const cur = document.querySelector('.screen.active');
    const nxt = el(id);
    if (!nxt || cur === nxt) return;
    const activate = () => {
      nxt.classList.add('active', 'entering');
      setTimeout(() => nxt.classList.remove('entering'), 540);
      if (id === 'scr-auth') el('dbMode').textContent = DB.label();
    };
    if (cur) {
      cur.classList.add('leaving');
      setTimeout(() => { cur.classList.remove('active', 'leaving'); activate(); }, 380);
    } else activate();
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
      if (r.err) {
        m.textContent = r.err; m.classList.remove('ok');
        m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg');
        btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        FX.sound('error');
      } else {
        m.textContent = 'Connexion réussie ✓'; m.classList.add('ok');
        btn.classList.add('success'); btn.textContent = '✓ Bienvenue…';
        FX.sound('win');
        await sleep(520);
        enterGame(DB.session(), false);
      }
    } catch (err) {
      m.textContent = 'Erreur inattendue pendant la connexion.'; m.classList.remove('ok');
    } finally { submitBtn(btn, false); }
  });

  /* solidité du mot de passe + œil + CGU */
  const pwScore = v => {
    let sc = 0;
    if (v.length >= 8) sc++;
    if (/[a-z]/.test(v)) sc++;
    if (/[A-Z]/.test(v)) sc++;
    if (/[0-9]/.test(v)) sc++;
    if (/[^a-zA-Z0-9]/.test(v) && v.length >= 10) sc++;
    return sc;
  };
  const pwUpdate = () => {
    const v = el('rg_pass').value;
    const lvl = v ? pwScore(v) : 0;
    const bar = el('pwBar'), hint = el('pwHint');
    if (!bar || !hint) return;
    bar.style.width = (lvl * 20) + '%';
    bar.className = ['zero', 'weak', 'weak', 'mid', 'ok', 'strong'][lvl];
    hint.textContent = 'Force : ' + ['—', 'très faible', 'faible', 'moyenne', 'bonne', 'excellente'][lvl];
    hint.className = 'pw-hint ' + bar.className;
  };
  el('rg_pass').addEventListener('input', pwUpdate);
  const eye = el('eyePass');
  if (eye) eye.addEventListener('click', () => {
    const i = el('rg_pass');
    i.type = i.type === 'password' ? 'text' : 'password';
    i.focus();
  });

  el('formReg').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = el('rg_btn'), m = el('regMsg');
    if (!el('rg_cgu').checked) {
      m.textContent = 'Vous devez accepter les conditions d’utilisation.'; m.classList.remove('ok');
      m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg');
      return;
    }
    if (pwScore(el('rg_pass').value) < 4) {
      m.textContent = 'Mot de passe trop faible : 8 caractères min. avec majuscule, minuscule et chiffre.'; m.classList.remove('ok');
      m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg');
      return;
    }
    if (el('rg_pass').value !== el('rg_pass2').value) {
      m.textContent = 'Les mots de passe ne correspondent pas.'; m.classList.remove('ok');
      m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg');
      return;
    }
    submitBtn(btn, true);
    try {
      await sleep(350);
      const r = await DB.register(el('rg_user').value, el('rg_mail').value, el('rg_pass').value, el('rg_cgu').checked);
      if (r.err) {
        m.textContent = r.err; m.classList.remove('ok');
        m.classList.remove('shake-msg'); void m.offsetWidth; m.classList.add('shake-msg');
        btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        FX.sound('error');
      } else {
        m.textContent = 'Citoyen créé ✓'; m.classList.add('ok');
        btn.classList.add('success'); btn.textContent = '✓ Bienvenue…';
        FX.sound('win');
        await sleep(520);
        enterGame(DB.session(), true);
      }
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
