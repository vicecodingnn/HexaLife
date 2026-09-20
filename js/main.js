/* ═══════════ BOOT v2 : intro pilotée par le chargement, auth animée, démarrage ═══════════ */
(function () {
  const el = id => document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function makeCity(container, n, hMin, hMax) {
    if (!container) return;
    let html = '';
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < n; i++) {
        const h = Math.round(hMin + Math.random()*(hMax-hMin));
        const w = Math.round(28 + Math.random()*46);
        html += '<div class="bld" style="height:' + h + 'px;width:' + w + 'px"></div>';
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
  let prog = 0, stepIdx = -1, dbReady = false;

  DB.init().then(() => { dbReady = true; });

  const loadTimer = setInterval(() => {
    if (!dbReady && prog > 14) prog = 14;           /* attend la détection de la base */
    else prog = Math.min(100, prog + 1.2 + Math.random()*3.2);
    el('loadFill').style.width = prog + '%';
    el('loadPct').textContent = Math.floor(prog) + '%';
    /* le marcheur et la ville avancent avec le chargement */
    el('walker').style.left = (8 + prog*0.72) + '%';
    el('cityNear').style.transform = 'translateX(' + (-prog*4) + 'px)';
    el('cityFar').style.transform = 'translateX(' + (-prog*1.6) + 'px)';
    el('introDawn').style.opacity = (prog/100)*0.9;
    let cur = 0; STEPS.forEach((s,i) => { if (prog >= s[0]) cur = i; });
    el('loadSteps').innerHTML = STEPS.map((s,i) =>
      '<div class="' + (i < cur ? 'ok' : i === cur ? 'cur' : '') + '">' + (i < cur ? '✓' : i === cur ? '▶' : '·') + ' ' + s[1] + '</div>').join('');
    if (prog >= 100) {
      clearInterval(loadTimer);
      el('walker').classList.add('done');
      el('btnStart').classList.add('ready'); el('btnStart').disabled = false;
      el('btnStart').textContent = DB.session() ? 'Continuer ma vie' : 'Entrer en ville';
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

  /* ── auth animée ── */
  function submitBtn(btn, on) { btn.classList.toggle('loading', on); btn.disabled = on; }

  el('formLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = el('li_btn'), m = el('authMsg');
    submitBtn(btn, true); await sleep(450);
    const r = await DB.login(el('li_user').value, el('li_pass').value);
    submitBtn(btn, false);
    if (r.err) { m.textContent = r.err; m.classList.remove('ok'); }
    else { m.textContent = 'Connexion réussie ✓'; m.classList.add('ok'); await sleep(350); enterGame(DB.session(), false); }
  });

  el('formReg').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = el('rg_btn'), m = el('regMsg');
    if (el('rg_pass').value !== el('rg_pass2').value) { m.textContent = 'Les mots de passe ne correspondent pas.'; m.classList.remove('ok'); return; }
    submitBtn(btn, true); await sleep(450);
    const r = await DB.register(el('rg_user').value, el('rg_mail').value, el('rg_pass').value);
    submitBtn(btn, false);
    if (r.err) { m.textContent = r.err; m.classList.remove('ok'); }
    else { m.textContent = 'Citoyen créé ✓'; m.classList.add('ok'); await sleep(350); enterGame(DB.session(), true); }
  });

  /* ── entrée en jeu ── */
  window.enterGame = async function (user, isNew) {
    genWorld();
    let s = await DB.loadGame(user);
    let off = null;
    if (s) { s = sanitize(s); off = offlineProgress(s); }
    else { s = newGame(user); isNew = true; }
    G = s; T.cashDisp = G.cash;
    if (!G.missions.list || !G.missions.list.length) rollMissions();
    show('scr-app');
    UI.buildRail(); UI.setTab('vie'); UI.buildTicker(); UI.updateTop();
    if (isNew) {
      UI.toast('Bienvenue, citoyen ' + G.name + '. Vous démarrez avec 2 000 €.', 'good');
      setTimeout(() => UI.toast('Le tutoriel vous guide : suivez les étapes.', ''), 2200);
    }
    if (G.tuto >= 0) setTimeout(() => UI.placeTuto(), 400);
    if (off && off.dt > 60) {
      const h = Math.floor(off.dt/3600), m = Math.floor(off.dt % 3600 / 60);
      UI.modal('<h2>Pendant votre absence…</h2><div class="m-sub">Durée : ' + (h ? h + ' h ' : '') + m + ' min</div><table class="t"><tr><td>Gains accumulés (activité réduite)</td><td class="money">+' + eur(off.gains) + '</td></tr>' + (off.diploma ? '<tr><td>Formation terminée</td><td><b>' + off.diploma + '</b></td></tr>' : '') + '<tr><td>Faim / Soif</td><td>en légère baisse</td></tr></table><div class="m-actions"><button class="btn btn-primary" data-act="closeModal">Reprendre ma vie</button></div>');
    }
    if (!TICK_TIMER) TICK_TIMER = setInterval(tick, 1000);
  };

  /* ── délégation globale ── */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (!A[act]) return;
    e.preventDefault();
    if (G && GUARDED.includes(act) && inJail()) return UI.toast('Impossible : vous êtes en garde à vue.', 'bad');
    A[act](t.dataset, t);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeModal(); });
  window.addEventListener('beforeunload', () => { if (G) save(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G) save(); });
  window.addEventListener('resize', () => { if (G && G.tuto >= 0) UI.placeTuto(); });

  window.UI = UI; window.A = A; window.T = T;
})();
