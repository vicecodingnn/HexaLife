/* ═══════════ MOTEUR v4 : marketing, commandes spéciales, météo, loto, équilibre revu ═══════════ */
let G = null, W = null, TICK_TIMER = null;
const T = { cashDisp: 0, hist: [], tab: 'vie', selBiz: -1, bizTab: 'overview', offer: null, offerMode: 'plein', cands: null, lastSaleFeed: 0, jobF: { sec:'', q:'', ok:false }, qT: null, netSign: 0 };

const eur = n => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:2 }).format(n || 0);
const eur0 = n => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 }).format(n || 0);
const kfmt = n => Math.abs(n) >= 1e6 ? (n/1e6).toFixed(2)+' M€' : Math.abs(n) >= 1e4 ? (n/1e3).toFixed(1)+' k€' : eur(n);
const rnd = (a,b) => a + Math.random()*(b-a);
const irnd = (a,b) => Math.floor(rnd(a,b+1));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const foodById = id => DATA.foods.find(f => f.id === id);
const upLvl = (b,id) => (b.ups && b.ups[id]) || 0;
const perk = (b,id) => !!(b.perks && b.perks[id]);

/* ── argent : compte bancaire prioritaire, sinon liquide ── */
function balance() { return G.bank.bankId ? G.bank.compte : G.cash; }
function pushJ(label, amt) {
  if (!G.journal) G.journal = [];
  G.journal.unshift({ t: Date.now(), label, amt });
  if (G.journal.length > 80) G.journal.length = 80;
}
function receive(amt, label) {
  if (!(amt > 0)) return;
  if (G.bank.bankId) G.bank.compte += amt; else G.cash += amt;
  if (label) pushJ(label, amt);
  UI.moneyFx(amt);
}
function pay(amt, label) {
  if (!(amt > 0)) return;
  if (G.bank.bankId) G.bank.compte -= amt; else G.cash -= amt;
  if (label) pushJ(label, -amt);
  UI.moneyFx(-amt);
}

/* ── monde ── */
function genWorld() {
  W = { npcs: [], biz: [], idx: { cac: 7842, immo: 100, conso: 100 }, t: 0, weather: { i: irnd(0,3), until: Date.now() + 180000 } };
  for (let i = 0; i < 800; i++) {
    const r = Math.random();
    W.npcs.push({ n: DATA.prenoms[irnd(0,39)] + ' ' + DATA.noms[irnd(0,39)], role: r < .78 ? 'client' : (r < .94 ? 'employé' : 'patron'), w: Math.round(rnd(600,60000)) });
  }
  DATA.companies.forEach((c,i) => W.biz.push({ i, n: c.n, s: c.sec, sante: rnd(48,96), boss: null }));
  W.npcs.filter(n => n.role === 'patron').forEach((p,k) => { const b = W.biz[k % W.biz.length]; if (b) b.boss = p.n; });
}

/* ── nouvelle partie & migrations ── */
function newGame(name) {
  return {
    v: 4, name, created: Date.now(), last: Date.now(),
    cash: 2000, xp: 0, lottoCd: 0,
    vitals: { sante: 92, faim: 70, soif: 65 },
    jobs: [], training: null, diplomas: [],
    inv: {}, cars: [], houses: [], rental: null, insurances: [],
    bank: { bankId: null, compte: 0, livret: 0, loans: [] },
    biz: [], ill: { unlocked: false, heat: 0, cd: {} },
    jail: 0, nextEvent: Date.now() + 120000, boost: null,
    missions: { list: [], refreshAt: 0 },
    journal: [], ach: [], tuto: 0,
    stats: { earned: 0, tax: 0, spent: 0, sales: 0, premium: 0, events: 0, missionsDone: 0, jailed: false, orders: 0, lottoWins: 0 }
  };
}
function sanitize(s) {
  const d = newGame(s.name || 'Citoyen');
  const out = Object.assign(d, s);
  out.vitals = Object.assign(d.vitals, s.vitals || {});
  out.bank = Object.assign(d.bank, s.bank || {});
  out.ill = Object.assign(d.ill, s.ill || {});
  out.stats = Object.assign(d.stats, s.stats || {});
  out.missions = Object.assign(d.missions, s.missions || {});
  if (typeof out.tuto !== 'number') out.tuto = -1;
  if (typeof out.xp !== 'number') out.xp = 0;
  if (typeof out.lottoCd !== 'number') out.lottoCd = 0;
  if (!Array.isArray(out.journal)) out.journal = [];
  if (!Array.isArray(out.ach)) out.ach = [];
  if (!Array.isArray(out.jobs)) {
    out.jobs = out.job ? [{ c: out.job.c, o: out.job.o, title: out.job.title, h: out.job.h, mode: 'plein', mins: out.job.mins || 0, promo: !!out.job.promo, since: out.job.since || Date.now() }] : [];
  }
  delete out.job;
  if (out.v < 3 && out.bank.bankId && out.cash > 0) { out.bank.compte += out.cash; out.cash = 0; }
  out.v = 4;
  out.biz.forEach(b => {
    if (!b.ups) b.ups = {};
    if (!b.perks) b.perks = {};
    if (!b.hist) b.hist = [];
    if (!b.counters) b.counters = {};
    if (typeof b.wagesTotal !== 'number') b.wagesTotal = 0;
    if (typeof b.boostUntil !== 'number') b.boostUntil = 0;
    if (typeof b.boostMul !== 'number') b.boostMul = 1;
    if (typeof b.promoUntil !== 'number') b.promoUntil = 0;
    if (b.order === undefined) b.order = null;
  });
  return out;
}

/* ── fiscalité ── */
function tauxPAS(annuel) {
  const TR = [[11294,0],[28797,.11],[82341,.30],[177106,.41],[Infinity,.45]];
  let prev = 0, tax = 0;
  for (const [lim,r] of TR) { if (annuel > lim) { tax += (lim-prev)*r; prev = lim; } else { tax += (annuel-prev)*r; break; } }
  return annuel > 0 ? tax/annuel : 0;
}

/* ── helpers ─ */
function carBonus() { return G.cars.length ? Math.max(...G.cars.map(i => DATA.cars[i].b)) : 0; }
function comfort() { return Math.min(10, G.houses.reduce((a,i) => a + DATA.homes[i].p/60000, 0)); }
function hasShelter() { return !!G.rental || G.houses.length > 0; }
function cov() { return G.insurances.reduce((m,id) => Math.max(m, DATA.insurers.find(x => x.id === id).cov), 0); }
function playerTier() { return G.diplomas.reduce((m,id) => Math.max(m, DATA.form.find(f => f.id === id).tier), 1); }
function ownsBiz(t) { return G.biz.some(b => b.type === t); }
function inJail() { return G.jail > Date.now(); }
function level(xp) { return Math.floor(Math.sqrt(xp/100)) + 1; }
function addXp(n) {
  const l0 = level(G.xp); G.xp += n; const l1 = level(G.xp);
  if (l1 > l0) { const bonus = l1*100; receive(bonus, 'Bonus de niveau ' + l1); UI.toast('Niveau ' + l1 + ' atteint ! Bonus +' + eur(bonus), 'good'); }
}

/* ── jobs ─ */
function jobLoad(j) { return j.mode === 'plein' ? 1 : 0.5; }
function totalLoad() { return G.jobs.reduce((a,j) => a + jobLoad(j), 0); }
function canTake(mode) { return totalLoad() + (mode === 'plein' ? 1 : 0.5) <= 1.001; }
function jobNetHourly(h, mode) {
  const load = mode === 'plein' ? 1 : 0.5;
  const gross = h * load, cot = gross*0.22, ni = gross - cot;
  return ni * (1 - tauxPAS(h*2080*load*0.78));
}

/* ── missions & succès ── */
function rollMissions() {
  const pool = DATA.missions.slice(); const list = [];
  while (list.length < 3 && pool.length) list.push(Object.assign({}, pool.splice(irnd(0,pool.length-1),1)[0], { prog:0, claimed:false }));
  G.missions = { list, refreshAt: Date.now() + 15*60*1000 };
}
function mission(type, amt) {
  if (!G.missions || !G.missions.list) return;
  G.missions.list.forEach(m => { if (m.type === type && !m.claimed) m.prog = (type === 'cash') ? Math.max(m.prog, amt) : m.prog + (amt || 1); });
}
function checkAch() {
  const C = {
    a_job: G.jobs.length > 0, a_dip: G.diplomas.length > 0, a_biz: G.biz.length > 0,
    a_10k: balance() >= 10000, a_100k: balance() >= 100000, a_home: G.houses.length > 0,
    a_sell100: G.stats.sales >= 100, a_bank: ownsBiz('banque'), a_lvl5: level(G.xp) >= 5,
    a_jail: !!G.stats.jailed, a_miss5: (G.stats.missionsDone||0) >= 5, a_noir: !!G.ill.unlocked,
    a_lotto: (G.stats.lottoWins||0) >= 1, a_order: (G.stats.orders||0) >= 5
  };
  DATA.ach.forEach(a => {
    if (C[a.id] && !G.ach.includes(a.id)) { G.ach.push(a.id); addXp(a.xp); UI.toast('🏆 Succès débloqué : ' + a.n + ' (+' + a.xp + ' XP)', 'good'); }
  });
}

/* ═══════════ TICK ═══════════ */
function tick() {
  if (!G || !W) return;
  const now = Date.now(); W.t++;
  const info = { rev: 0, chg: 0, tax: 0 };

  G.jobs.forEach(j => {
    const load = jobLoad(j);
    const gross = (j.h/60) * load * (1 + carBonus());
    const cot = gross*0.22, ni = gross - cot;
    const pas = ni * tauxPAS(j.h*2080*load*0.78);
    receive(ni, 'Salaire net — ' + j.title);
    pay(pas, 'Impôt sur le revenu (PAS)');
    info.rev += ni; info.chg += pas; info.tax += cot + pas;
    G.stats.earned += ni - pas; G.stats.tax += cot + pas;
    mission('work', 1);
    j.mins = (j.mins || 0) + 1;
    if (j.mins === 600 && !j.promo) { j.promo = true; j.h = +(j.h*1.06).toFixed(2); UI.toast('Promotion ! +6 % de salaire : ' + j.title, 'good'); }
  });

  const f = hasShelter() ? 1 : 1.5;
  G.vitals.faim = Math.max(0, G.vitals.faim - 0.10*f);
  G.vitals.soif = Math.max(0, G.vitals.soif - 0.14*f);
  if (G.vitals.faim <= 0) G.vitals.sante -= 0.45;
  if (G.vitals.soif <= 0) G.vitals.sante -= 0.60;
  if (G.vitals.faim > 55 && G.vitals.soif > 55 && G.vitals.sante < 100)
    G.vitals.sante = Math.min(100, G.vitals.sante + 0.22 + comfort()*0.03);
  if (G.vitals.sante <= 0) hospital();

  if (G.training && now >= G.training.end) {
    const fm = DATA.form.find(x => x.id === G.training.id);
    G.diplomas.push(fm.id); G.training = null; mission('train', 1); addXp(40);
    UI.toast('Formation terminée : ' + fm.n + ' ✓', 'good');
    if (T.tab === 'carriere') UI.render();
  }

  /* météo */
  if (now > W.weather.until) {
    W.weather.i = irnd(0, DATA.weather.length - 1);
    W.weather.until = now + 180000;
    const w = DATA.weather[W.weather.i];
    UI.feed('<b>Météo :</b> ' + w.ico + ' ' + w.n + ' — effets sur les commerces pendant 3 min');
  }

  G.biz.forEach((b,bi) => tickBiz(b, bi, info, now));

  if (W.t % 60 === 0) monthly(info);
  if (W.t % 6 === 0) G.houses.forEach(h => { h.v *= 1 + rnd(-0.0006,0.0009); if (h.tenant) { receive(h.rent, 'Loyer perçu'); info.rev += h.rent; } });

  W.idx.cac *= 1 + rnd(-0.0006,0.0007); W.idx.immo *= 1 + rnd(-0.0004,0.0005); W.idx.conso *= 1 + rnd(-0.0005,0.0005);
  if (W.t % 4 === 0) W.biz.forEach(b => { b.sante = clamp(b.sante + rnd(-1.4,1.5), 20, 100); });

  if (now >= G.nextEvent) { G.nextEvent = now + rnd(100,280)*1000; fireEvent(); }
  if (G.boost && now > G.boost.until) { UI.toast('Opportunité terminée : ' + G.boost.label, ''); G.boost = null; }
  if (G.ill.heat > 0) G.ill.heat = Math.max(0, G.ill.heat - 0.06);

  if (W.t % 60 === 0) {
    const benef = G.biz.reduce((a,b) => a + Math.max(0, b.profit || 0), 0);
    if (benef > 0.05) { const is = benef*0.15; pay(is, 'Impôt sur les sociétés (15 %)'); info.tax += is; info.chg += is; UI.toast('Impôt sur les sociétés prélevé : −' + eur(is), 'warn'); }
    G.biz.forEach(b => b.profit = 0);
  }

  mission('cash', balance());
  if (G.missions.refreshAt && now > G.missions.refreshAt) { rollMissions(); UI.toast('Nouveaux défis disponibles !', 'good'); }
  if (!G.missions.list || !G.missions.list.length) rollMissions();
  if (W.t % 5 === 0) checkAch();

  G.tickInfo = info;
  T.hist.push(info.rev - info.chg); if (T.hist.length > 90) T.hist.shift();
  UI.tick();
  if (W.t % 5 === 0) save();
}

function boostMul(type) { return (G.boost && (G.boost.type === type || G.boost.type === 'toutes')) ? G.boost.mul : 1; }
function weatherMul(type) { return (DATA.weather[W.weather.i].mul || {})[type] || 1; }

function tickBiz(b, bi, info, now) {
  let revTick = 0;
  const localMul = (b.boostUntil > now ? b.boostMul : 1) * (perk(b,'fidelite') ? 1.08 : 1);
  const promoOn = b.promoUntil > now;

  if (b.type === 'boulangerie' || b.type === 'magasin') {
    const bt = DATA.bizTypes[b.type];

    /* réassort automatique (perk magasin) */
    if (b.type === 'magasin' && perk(b,'autoRestock')) {
      bt.prods.forEach(p => {
        if ((b.stock[p.id]||0) < 10 && balance() >= p.cost*20) {
          pay(p.cost*20, 'Réassort auto — ' + p.n);
          b.stock[p.id] = (b.stock[p.id]||0) + 20;
        }
      });
    }

    /* production : four de base (1/s) + salariés + upgrades */
    if (b.type === 'boulangerie') {
      const crafts = 1 + b.emps.length + upLvl(b,'four');
      for (let k = 0; k < crafts; k++) {
        const rec = bt.prods[irnd(0, bt.prods.length-1)];
        if (hasMats(b, rec)) { useMats(b, rec); b.stock[rec.id] = (b.stock[rec.id]||0)+1; }
      }
      /* commandes spéciales */
      if (!b.order && Math.random() < 0.012) {
        const p = bt.prods[irnd(0, bt.prods.length-1)];
        const qty = irnd(10, 30);
        b.order = { p: p.id, pn: p.n, qty, reward: Math.round(p.ref*qty*1.7), until: now + 120000 };
        UI.toast('📦 Commande spéciale reçue : ' + qty + ' × ' + p.n + ' (' + eur(b.order.reward) + ')', 'good');
      }
      if (b.order && now > b.order.until) { b.order = null; UI.toast('Commande spéciale expirée.', 'warn'); }
    }

    const mktMul = (1 + 0.15*upLvl(b,'mkt') + (b.type === 'magasin' ? 0.10*upLvl(b,'caisses') : 0)) * boostMul(b.type) * localMul * weatherMul(b.type) * (promoOn ? 1.8 : 1);
    const act = 0.85 + 0.3*Math.sin(W.t/70) + Math.random()*0.3;
    const repF = 0.4 + b.rep/80;
    const priceF = priceFactor(b) * (promoOn ? 1.12 : 1);
    const demand = Math.max(0, Math.round(bt.traffic * repF * priceF * act * mktMul * rnd(0.5,1.5) * (1 + b.emps.length*0.08)));
    let sold = 0, rev = 0;
    for (let k = 0; k < demand; k++) {
      const p = pickProd(b);
      if ((b.stock[p.id] || 0) > 0) {
        b.stock[p.id]--;
        const unit = promoOn ? +(b.prices[p.id]*0.9).toFixed(2) : b.prices[p.id];
        rev += unit; sold++; b.counters[p.id] = (b.counters[p.id]||0)+1;
        maybeSaleFeed(p.n, unit, b.name);
      } else b.rep = Math.max(5, b.rep - 0.05);
    }
    const repGain = (1 + 0.4*upLvl(b, b.type === 'boulangerie' ? 'decor' : 'rayons')) * (perk(b,'enseigne') ? 1.5 : 1);
    b.rep = clamp(b.rep + (sold ? 0.02*sold*repGain : -0.03), 5, 100);
    if (rev > 0) { receive(rev, 'Ventes — ' + b.name); info.rev += rev; b.rev += rev; b.profit = (b.profit||0)+rev; revTick = rev; }
    G.stats.sales += sold; if (sold) mission('sell', sold);
    const wages = b.emps.reduce((a,e) => a + e.h/60, 0);
    if (wages > 0) { pay(wages, 'Salaires — ' + b.name); info.chg += wages; b.profit -= wages; b.wagesTotal += wages; }
  }
  else if (b.type === 'immobilier') {
    if (upLvl(b,'vitrine') && W.t % 60 === 0) b.mandats = (b.mandats||0) + upLvl(b,'vitrine');
    const rev = (b.mandats||0) * rnd(0.8,2.2) * (1 + 0.25*upLvl(b,'reseau')) * (1 + 0.05*b.emps.length) * localMul * boostMul('immobilier') * weatherMul('immobilier');
    if (rev > 0) { receive(rev, 'Commissions — ' + b.name); info.rev += rev; b.rev += rev; b.profit = (b.profit||0)+rev; revTick = rev; }
    const wages = b.emps.reduce((a,e) => a + e.h/60, 0);
    if (wages > 0) { pay(wages, 'Salaires — ' + b.name); info.chg += wages; b.profit -= wages; b.wagesTotal += wages; }
  }
  else if (b.type === 'banque') {
    const fees = b.accounts * 3/60 * (perk(b,'fidelite') ? 1.1 : 1);
    const loanInc = b.loans * (b.tauxCredit + 0.5*upLvl(b,'trader')) / 100 / 3600;
    const depCost = b.deposits * b.tauxLivret / 100 / 3600;
    if (Math.random() < 0.05 + b.mkt*0.012 + 0.02*upLvl(b,'app') + 0.01*b.emps.length + (perk(b,'pub') ? 0.03 : 0)) b.accounts += irnd(1,3);
    b.deposits += b.accounts * rnd(0.4,2.2);
    const dem = b.tauxCredit < 5 ? 1400 : (b.tauxCredit < 8 ? 750 : 220);
    b.loans += dem * Math.random();
    if (Math.random() < 0.008 * (1 - 0.25*upLvl(b,'secu'))) { const def = b.loans * rnd(0.005,0.015); b.loans = Math.max(0, b.loans - def); UI.toast('Défaut de prêt : −' + eur(def), 'warn'); }
    const net = fees + loanInc - depCost;
    if (net >= 0) { receive(net, 'PNB — ' + b.name); info.rev += net; revTick = net; }
    else { pay(-net, 'Charge de ressource — ' + b.name); info.chg += -net; }
    b.rev += Math.max(0,net); b.profit = (b.profit||0)+net;
    const wages = b.emps.reduce((a,e) => a + e.h/60, 0);
    if (wages > 0) { pay(wages, 'Salaires — ' + b.name); info.chg += wages; b.profit -= wages; b.wagesTotal += wages; }
  }
  b.hist.push(revTick); if (b.hist.length > 60) b.hist.shift();
}

function hasMats(b, rec) { return Object.entries(rec.in).every(([m,q]) => (b.mats[m]||0) >= q); }
function useMats(b, rec) { Object.entries(rec.in).forEach(([m,q]) => b.mats[m] -= q); }
function priceFactor(b) {
  const prods = DATA.bizTypes[b.type].prods; let s = 0;
  prods.forEach(p => { s += clamp(p.ref / (b.prices[p.id] || p.ref), 0.5, 1.4); });
  return s / prods.length;
}
function pickProd(b) {
  const prods = DATA.bizTypes[b.type].prods; const tot = prods.reduce((a,p) => a + p.w, 0); let r = Math.random()*tot;
  for (const p of prods) { r -= p.w; if (r <= 0) return p; }
  return prods[0];
}
function maybeSaleFeed(prod, prix, bizName) {
  const now = Date.now(); if (now - T.lastSaleFeed < 4000) return;
  T.lastSaleFeed = now;
  UI.feed('<b>' + W.npcs[irnd(0,799)].n + '</b> achète « ' + prod + ' » à votre ' + esc(bizName) + ' <span class="money">+' + eur(prix) + '</span>');
}

function monthly(info) {
  if (G.rental) { pay(G.rental.loyer, 'Loyer principal'); info.chg += G.rental.loyer; UI.toast('Loyer prélevé sur le compte : −' + eur(G.rental.loyer), 'warn'); }
  G.houses.forEach(h => { pay(h.c, 'Charges de copropriété'); info.chg += h.c; });
  G.bank.loans = G.bank.loans.filter(L => {
    pay(L.mens, 'Mensualité crédit — ' + L.n); info.chg += L.mens; L.reste -= L.mens;
    if (L.reste <= 0) { UI.toast('Crédit « ' + L.n + ' » remboursé ✓', 'good'); return false; }
    return true;
  });
  const bd = DATA.banks.find(x => x.id === G.bank.bankId);
  if (bd && G.bank.livret > 0) { const i = G.bank.livret * bd.lv/100/12; G.bank.livret += i; pushJ('Intérêts Livret A', i); }
  G.insurances.forEach(id => { const a = DATA.insurers.find(x => x.id === id); pay(a.m, 'Cotisation assurance — ' + a.n); info.chg += a.m; });
  const emp = G.biz.reduce((a,b) => a + b.emps.length, 0);
  if (emp > 0) { const u = emp*45; pay(u, 'Cotisations URSSAF'); info.chg += u; info.tax += u; UI.toast('URSSAF prélevée (' + emp + ' salarié·s) : −' + eur(u), 'warn'); }
}

function fireEvent() {
  const pool = [
    { t:'good', m:'Prime exceptionnelle de votre employeur', ok:() => G.jobs.length > 0, f(){ const g = rnd(200,900); receive(g, 'Prime employeur'); return '+'+eur(g); } },
    { t:'good', m:'Remboursement d’impôts reçu', f(){ const g = rnd(120,420); receive(g, 'Remboursement d’impôts'); return '+'+eur(g); } },
    { t:'good', m:'Vous trouvez un billet sur le trottoir', f(){ const g = rnd(5,40); receive(g, 'Gain divers'); return '+'+eur(g); } },
    { t:'good', m:'Concurrent en faillite : votre boulangerie attire la foule', ok:() => ownsBiz('boulangerie'), f(){ G.boost = { type:'boulangerie', mul:1.6, until: Date.now()+90000, label:'Concurrent en faillite' }; return 'clients ×1,6 pendant 90 s'; } },
    { t:'good', m:'Votre magasin devient viral sur les réseaux', ok:() => ownsBiz('magasin'), f(){ G.boost = { type:'magasin', mul:1.6, until: Date.now()+90000, label:'Buzz en ligne' }; return 'clients ×1,6 pendant 90 s'; } },
    { t:'good', m:'Foire immobilière : commissions doublées', ok:() => ownsBiz('immobilier'), f(){ G.boost = { type:'immobilier', mul:2, until: Date.now()+60000, label:'Foire immobilière' }; return 'commissions ×2 pendant 60 s'; } },
    { t:'bad', m:'Grippe : consultation et médicaments', f(){ let c = rnd(90,180); c *= (1-cov()); pay(c, 'Frais de santé'); G.vitals.sante = Math.max(5, G.vitals.sante-12); return '−'+eur(c); } },
    { t:'bad', m:'Panne de voiture', ok:() => G.cars.length > 0, f(){ let c = rnd(200,600); c *= (1-cov()); pay(c, 'Réparation automobile'); return '−'+eur(c); } },
    { t:'bad', m:'Contrôle fiscal : redressement', ok:() => G.stats.earned > 5000, f(){ const c = Math.max(20, balance())*rnd(0.02,0.05); pay(c, 'Redressement fiscal'); G.stats.tax += c; return '−'+eur(c); } },
    { t:'bad', m:'Cambriolage : une partie du solde a disparu', ok:() => balance() > 500, f(){ const c = balance()*rnd(0.01,0.03); pay(c, 'Vol par effraction'); return '−'+eur(c); } }
  ].filter(e => !e.ok || e.ok());
  const e = pool[irnd(0, pool.length-1)];
  const delta = e.f(); G.stats.events++;
  UI.toast(e.m + ' (' + delta + ')', e.t === 'good' ? 'good' : 'warn');
  UI.feed('<b>Événement :</b> ' + e.m + ' <span class="money">' + delta + '</span>');
}

function hospital() {
  let c = 800; c *= (1 - cov());
  pay(c, 'Frais hospitaliers'); G.vitals = { sante: 35, faim: 40, soif: 40 };
  UI.toast('Hospitalisation d’urgence ! −' + eur(c) + (cov() ? ' (assurance : ' + Math.round(cov()*100) + ' % pris en charge)' : ''), 'bad');
}

/* ═══════════ ACTIONS ═══════════ */
const A = {
  tab(d) { UI.setTab(d.id); },
  authTab(d) { UI.authTab(d.t); },

  buyFood(d) {
    const f = foodById(d.id); if (!f) return;
    if (balance() < f.p) return UI.toast('Solde insuffisant.', 'bad');
    pay(f.p, 'Courses — ' + f.n); G.stats.spent += f.p;
    G.inv[d.id] = (G.inv[d.id]||0)+1;
    mission('shop', 1); addXp(2);
    UI.toast(f.n + ' acheté (' + eur(f.p) + ') → inventaire', 'good');
    UI.render();
  },
  eat(d, el) {
    const f = foodById(d.id); if (!f) return;
    if ((G.inv[d.id]||0) <= 0) return UI.toast('Vous n’en avez plus dans votre sac.', 'warn');
    if (el && el.closest) { const card = el.closest('.inv-card'); if (card) card.classList.add('chomp'); }
    G.inv[d.id]--;
    G.vitals.faim = clamp(G.vitals.faim + f.f, 0, 100);
    G.vitals.soif = clamp(G.vitals.soif + f.s, 0, 100);
    mission('eat', 1); addXp(2);
    if (f.f > 0) { UI.floatText('+' + f.f + ' Faim', 'var(--orange)'); UI.pulseVital('rowFaim'); }
    if (f.s > 0) { UI.floatText('+' + f.s + ' Soif', 'var(--blue)'); UI.pulseVital('rowSoif'); }
    UI.toast('Vous consommez : ' + f.n, 'good');
    setTimeout(() => UI.render(), 380);
  },

  train(d) {
    if (G.training) return UI.toast('Une formation est déjà en cours.', 'warn');
    const f = DATA.form.find(x => x.id === d.id); if (!f || G.diplomas.includes(d.id)) return;
    if (balance() < f.cost) return UI.toast('Fonds insuffisants (' + eur(f.cost) + ' requis).', 'bad');
    pay(f.cost, 'Frais de formation — ' + f.n); G.stats.spent += f.cost;
    G.training = { id: d.id, end: Date.now() + f.dur*1000 };
    UI.toast('Formation commencée : ' + f.n, 'good'); UI.render();
  },

  jobSec(d) { T.jobF.sec = d.v; UI.render(); },
  jobOk() { T.jobF.ok = !T.jobF.ok; UI.render(); },

  offer(d) {
    const c = +d.c, o = +d.o, job = DATA.companies[c].o[o];
    if (playerTier() < job[2]) return UI.toast('Diplôme insuffisant (tier ' + job[2] + ' requis).', 'bad');
    if (totalLoad() >= 1) return UI.toast('Charge de travail déjà à 100 %. Quittez un poste ou passez en partiel.', 'bad');
    T.offer = { c, o };
    T.offerMode = canTake('plein') ? 'plein' : 'partiel';
    offerModal();
  },
  pickMode(d) {
    if (!canTake(d.m)) return UI.toast('Charge de travail insuffisante pour ce mode.', 'warn');
    T.offerMode = d.m; offerModal();
  },
  sign() {
    if (!T.offer) return;
    const mode = T.offerMode;
    if (!canTake(mode)) return UI.toast('Charge de travail dépassée.', 'bad');
    const c = T.offer.c, o = T.offer.o, job = DATA.companies[c].o[o];
    G.jobs.push({ c, o, title: job[0], h: job[1], mode, since: Date.now(), mins: 0, promo: false });
    addXp(30); UI.closeModal();
    UI.toast('Contrat signé (' + (mode === 'plein' ? 'temps plein' : 'temps partiel') + ') : ' + job[0] + ' chez ' + DATA.companies[c].n, 'good');
    UI.updateTop(); UI.render();
  },
  quitJob(d) {
    const i = +d.i; const j = G.jobs[i]; if (!j) return;
    G.jobs.splice(i, 1);
    UI.toast('Vous avez quitté : ' + j.title, 'warn'); UI.updateTop(); UI.render();
  },

  openCreate(d) {
    const bt = DATA.bizTypes[d.type];
    if (bt.req && !G.diplomas.includes(bt.req)) return UI.toast('Formation requise : ' + DATA.form.find(f => f.id === bt.req).n, 'bad');
    if (balance() < bt.cost) return UI.toast('Capital insuffisant (' + eur(bt.cost) + ' requis).', 'bad');
    UI.modal('<h2>Fonder une ' + bt.label.toLowerCase() + '</h2><div class="m-sub">Capital social : ' + eur(bt.cost) + ' · prélevé sur votre compte · prérequis validés ✓</div>' +
      '<label style="font-size:12.5px;color:var(--mut)">Nom de l’entreprise<input id="bizName" class="mini" style="width:100%;margin-top:6px" maxlength="40" value="' + esc(bt.label + ' ' + G.name) + '"></label>' +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Annuler</button>' +
      '<button class="btn btn-primary" data-act="createBiz" data-type="' + d.type + '">Signer les statuts</button></div>');
  },
  createBiz(d) {
    const bt = DATA.bizTypes[d.type];
    if (balance() < bt.cost) return UI.toast('Fonds insuffisants.', 'bad');
    const name = ((document.getElementById('bizName') || {}).value || bt.label).trim();
    pay(bt.cost, 'Capital social — ' + bt.label); G.stats.spent += bt.cost;
    const b = { type: d.type, name, rep: 50, stock: {}, mats: {}, prices: {}, emps: [], ups: {}, perks: {}, hist: [], counters: {}, wagesTotal: 0, rev: 0, sold: 0, profit: 0, boostUntil: 0, boostMul: 1, promoUntil: 0, order: null };
    if (d.type === 'boulangerie' || d.type === 'magasin') bt.prods.forEach(p => { b.prices[p.id] = p.ref; b.stock[p.id] = 0; });
    if (d.type === 'immobilier') b.mandats = 0;
    if (d.type === 'banque') Object.assign(b, { accounts: 0, deposits: 0, loans: 10000, tauxCredit: 6, tauxLivret: 2, mkt: 1 });
    G.biz.push(b); addXp(80);
    UI.closeModal(); UI.toast(bt.label + ' « ' + name + ' » créée !', 'good');
    T.selBiz = G.biz.length - 1; T.bizTab = 'overview'; UI.render();
  },
  selBiz(d) { T.selBiz = +d.i; T.bizTab = 'overview'; UI.render(); },
  backBiz() { T.selBiz = -1; UI.render(); },
  bizTab(d) { T.bizTab = d.t; UI.render(); },

  buyMat(d) {
    const b = G.biz[+d.b], m = DATA.bizTypes.boulangerie.mats[d.m];
    const q = +d.q, cost = m.p*q;
    if (balance() < cost) return UI.toast('Fonds insuffisants.', 'bad');
    pay(cost, 'Matières premières — ' + m.n); G.stats.spent += cost;
    b.mats[d.m] = (b.mats[d.m]||0)+q;
    UI.toast('+' + q + ' × ' + m.n, 'good'); UI.render();
  },
  craft(d) {
    const b = G.biz[+d.b], rec = DATA.bizTypes.boulangerie.prods.find(p => p.id === d.p);
    for (let i = 0; i < +d.q; i++) { if (!hasMats(b, rec)) break; useMats(b, rec); b.stock[rec.id] = (b.stock[rec.id]||0)+1; }
    UI.render();
  },
  priceAdj(d) { const b = G.biz[+d.b]; b.prices[d.p] = Math.max(0.1, +((b.prices[d.p]||1) + +d.v).toFixed(2)); UI.render(); },
  buyStock(d) {
    const b = G.biz[+d.b], p = DATA.bizTypes.magasin.prods.find(x => x.id === d.p);
    const q = +d.q, cost = p.cost*q;
    if (balance() < cost) return UI.toast('Fonds insuffisants.', 'bad');
    pay(cost, 'Achat grossiste — ' + p.n); G.stats.spent += cost;
    b.stock[p.id] = (b.stock[p.id]||0)+q;
    UI.toast('+' + q + ' × ' + p.n, 'good'); UI.render();
  },
  upgrade(d) {
    const b = G.biz[+d.b], u = DATA.ups[b.type].find(x => x.id === d.u);
    const lvl = upLvl(b, u.id);
    if (lvl >= u.max) return UI.toast('Niveau maximum atteint.', 'warn');
    const cost = Math.round(u.cost * Math.pow(u.grow, lvl));
    if (balance() < cost) return UI.toast('Fonds insuffisants (' + eur(cost) + ').', 'bad');
    pay(cost, 'Amélioration — ' + u.n); b.ups[u.id] = lvl+1; addXp(25);
    UI.toast(u.n + ' → niveau ' + (lvl+1), 'good'); UI.render();
  },

  /* ══ marketing (nouveau) ══ */
  mktDo(d) {
    const b = G.biz[+d.b];
    const a = (DATA.mkt[b.type] || []).find(x => x.id === d.a);
    if (!a) return;
    if (a.once && perk(b, a.perk)) return UI.toast('Déjà actif.', 'warn');
    if (balance() < a.cost) return UI.toast('Fonds insuffisants (' + eur(a.cost) + ').', 'bad');
    pay(a.cost, 'Marketing — ' + a.n);
    if (a.kind === 'boost') { b.boostUntil = Date.now() + a.dur*1000; b.boostMul = a.mul; if (a.rep) b.rep = clamp(b.rep + a.rep, 5, 100); UI.toast('📣 ' + a.n + ' lancée : clients ×' + a.mul + ' pendant ' + a.dur + ' s', 'good'); }
    else if (a.kind === 'promo') { b.promoUntil = Date.now() + a.dur*1000; UI.toast('⚡ Vente flash : prix −10 %, clients ×1,8 pendant ' + a.dur + ' s', 'good'); }
    else if (a.kind === 'perk') { b.perks[a.perk] = true; if (a.rep) b.rep = clamp(b.rep + a.rep, 5, 100); UI.toast('✓ ' + a.n + ' : effet permanent actif', 'good'); }
    else if (a.kind === 'accounts') { b.accounts += 25; UI.toast('✓ +25 comptes clients ouverts', 'good'); }
    addXp(15);
    UI.render();
  },

  /* ══ commande spéciale boulangerie ══ */
  orderFill(d) {
    const b = G.biz[+d.b]; const o = b.order;
    if (!o) return UI.toast('Plus de commande en cours.', 'warn');
    if ((b.stock[o.p]||0) < o.qty) return UI.toast('Stock insuffisant : ' + (b.stock[o.p]||0) + '/' + o.qty + ' × ' + o.pn, 'bad');
    b.stock[o.p] -= o.qty;
    receive(o.reward, 'Commande spéciale — ' + o.pn);
    b.rep = clamp(b.rep + 2, 5, 100);
    b.order = null;
    G.stats.orders = (G.stats.orders||0) + 1;
    addXp(20);
    UI.toast('📦 Commande honorée : +' + eur(o.reward) + ' et +2 réputation', 'good');
    UI.render();
  },

  hire(d) {
    const b = G.biz[+d.b], max = (DATA.bizTypes[b.type] || {}).maxEmp || 4;
    if (b.emps.length >= max) return UI.toast('Effectif complet.', 'warn');
    T.cands = Array.from({ length: 4 }, () => ({ n: W.npcs[irnd(0,799)].n, h: +rnd(12,20).toFixed(1) }));
    UI.modal('<h2>Recruter — ' + esc(b.name) + '</h2><div class="m-sub">Salaires versés en continu depuis le compte. URSSAF : 45 €/mois/salarié.</div>' +
      T.cands.map((c,i) => '<div class="rowline"><div><div class="lbl">' + esc(c.n) + '</div><div class="det">Prétentions : ' + eur(c.h) + '/h</div></div>' +
      '<button class="btn btn-primary btn-sm" data-act="hireConfirm" data-b="' + d.b + '" data-i="' + i + '">Embaucher</button></div>').join('') +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Fermer</button></div>');
  },
  hireConfirm(d) { const b = G.biz[+d.b], c = T.cands[+d.i]; if (!c) return; b.emps.push({ n: c.n, h: c.h }); UI.closeModal(); UI.toast(c.n + ' rejoint ' + b.name + ' !', 'good'); UI.render(); },
  fire(d) { const b = G.biz[+d.b]; const e = b.emps.splice(+d.i, 1); UI.toast((e[0] ? e[0].n : 'Salarié') + ' a été licencié·e.', 'warn'); UI.render(); },
  buyMandat(d) {
    const b = G.biz[+d.b];
    if (balance() < 300) return UI.toast('Un mandat coûte 300 €.', 'bad');
    pay(300, 'Mandat de vente'); b.mandats = (b.mandats||0)+1;
    UI.toast('Nouveau mandat signé.', 'good'); UI.render();
  },
  bankAdj(d) {
    const b = G.biz[+d.b];
    if (d.k === 'tc') b.tauxCredit = clamp(b.tauxCredit + +d.v, 1, 12);
    if (d.k === 'tl') b.tauxLivret = clamp(b.tauxLivret + +d.v, 0, 5);
    if (d.k === 'mkt') { if (balance() < 1000) return UI.toast('Campagne : 1 000 €.', 'bad'); pay(1000, 'Campagne publicitaire'); b.mkt++; UI.toast('Campagne lancée.', 'good'); }
    UI.render();
  },

  buyHome(d) {
    const h = DATA.homes[+d.i];
    if (balance() < h.p) return UI.toast('Apport insuffisant. Pensez au prêt immobilier !', 'bad');
    pay(h.p, 'Achat immobilier — ' + h.n); G.stats.spent += h.p;
    G.houses.push({ i: +d.i, v: h.p, c: h.c, rent: +(h.p*0.004/60).toFixed(2), tenant: false });
    addXp(60); UI.toast('Vous êtes propriétaire : ' + h.n, 'good'); UI.render();
  },
  rentHome(d) { G.rental = { i: +d.i, loyer: DATA.rentals[+d.i].loyer }; UI.toast('Bail signé : ' + DATA.rentals[+d.i].n + ' (' + eur(G.rental.loyer) + '/mois)', 'good'); UI.render(); },
  cancelRent() { G.rental = null; UI.toast('Bail résilié.', 'warn'); UI.render(); },
  sellHome(d) { const h = G.houses[+d.i]; const prix = h.v*0.95; receive(prix, 'Vente immobilière'); G.houses.splice(+d.i,1); UI.toast('Bien vendu (5 % de frais) : +' + eur(prix), 'good'); UI.render(); },
  rentOut(d) {
    const h = G.houses[+d.i];
    if (h.tenant) { h.tenant = false; UI.toast('Congé donné au locataire.', 'warn'); }
    else { h.tenant = true; h.rent = +(h.v*0.004/60).toFixed(2); UI.toast('Bien mis en location : ' + eur(h.rent) + '/s', 'good'); }
    UI.render();
  },

  buyCar(d) {
    const c = DATA.cars[+d.i];
    if (G.cars.includes(+d.i)) return;
    if (balance() < c.p) return UI.toast('Fonds insuffisants. Le prêt auto existe !', 'bad');
    pay(c.p, 'Achat véhicule — ' + c.n); G.stats.spent += c.p; G.cars.push(+d.i); addXp(40);
    UI.toast(c.n + ' livrée ! Bonus productivité +' + Math.round(c.b*100) + ' %', 'good'); UI.render();
  },
  sellCar(d) { const i = +d.i, c = DATA.cars[i]; G.cars = G.cars.filter(x => x !== i); receive(c.p*0.6, 'Vente véhicule — ' + c.n); UI.toast(c.n + ' revendue : +' + eur(c.p*0.6), 'good'); UI.render(); },

  openBank(d) {
    G.bank.bankId = d.id;
    if (G.cash > 0) { G.bank.compte += G.cash; pushJ('Versement initial du liquide', G.cash); G.cash = 0; }
    UI.cardFx('Ouverture de compte', eur(0));
    UI.toast('Compte ouvert chez ' + DATA.banks.find(b => b.id === d.id).n + '. Salaires et prélèvements passeront par là.', 'good');
    UI.render();
  },
  deposit() {
    const v = +((document.getElementById('bankAmt')||{}).value || 0);
    if (v <= 0 || G.cash < v) return UI.toast('Montant invalide (liquidité insuffisante).', 'bad');
    G.cash -= v; G.bank.compte += v; pushJ('Dépôt de liquide', v);
    UI.cardFx('Dépôt sur compte', '+' + eur(v));
    UI.render();
  },
  withdraw() {
    const v = +((document.getElementById('bankAmt')||{}).value || 0);
    if (v <= 0 || G.bank.compte < v) return UI.toast('Montant invalide.', 'bad');
    G.bank.compte -= v; G.cash += v; pushJ('Retrait d’espèces', -v);
    UI.cardFx('Retrait d’espèces', '−' + eur(v));
    UI.render();
  },
  toLivret() {
    const v = +((document.getElementById('bankAmt')||{}).value || 0);
    if (v <= 0 || G.bank.compte < v) return UI.toast('Montant invalide.', 'bad');
    if (G.bank.livret + v > 22950) return UI.toast('Plafond du Livret A : 22 950 €.', 'warn');
    G.bank.compte -= v; G.bank.livret += v; pushJ('Virement vers Livret A', -v);
    UI.cardFx('Vers Livret A', '−' + eur(v));
    UI.render();
  },
  fromLivret() {
    const v = +((document.getElementById('bankAmt')||{}).value || 0);
    if (v <= 0 || G.bank.livret < v) return UI.toast('Montant invalide (Livret A insuffisant).', 'bad');
    G.bank.livret -= v; G.bank.compte += v; pushJ('Retrait Livret A vers compte', v);
    UI.cardFx('Livret A → compte', '+' + eur(v));
    UI.render();
  },
  loanTake(d) {
    const v = +((document.getElementById('loanAmt')||{}).value || 0);
    if (v < 1000) return UI.toast('Minimum : 1 000 €.', 'bad');
    const L = DATA.loans.find(x => x.id === d.t);
    const mois = Math.max(12, Math.round(v/800));
    const total = v * (1 + L.rate/100 * mois/12);
    G.bank.loans.push({ n: L.n, total, mens: +(total/mois).toFixed(2), reste: +total.toFixed(2) });
    receive(v, 'Crédit versé — ' + L.n);
    UI.cardFx('Crédit ' + L.n, '+' + eur(v));
    UI.toast('Crédit accordé : +' + eur(v) + ' · mensualité ' + eur(total/mois) + '/mois (prélevée sur le compte)', 'good');
    UI.render();
  },
  loanRepay(d) {
    const L = G.bank.loans[+d.i];
    if (balance() < L.reste) return UI.toast('Il reste ' + eur(L.reste) + ' à solder.', 'bad');
    pay(L.reste, 'Remboursement anticipé — ' + L.n); G.bank.loans.splice(+d.i,1);
    UI.cardFx('Crédit soldé', '−' + eur(L.reste));
    UI.toast('Crédit soldé par anticipation ✓', 'good'); UI.render();
  },

  insure(d) {
    const i = G.insurances.indexOf(d.id);
    if (i >= 0) { G.insurances.splice(i,1); UI.toast('Assurance résiliée.', 'warn'); }
    else { G.insurances.push(d.id); UI.toast('Vous êtes assuré·e chez ' + DATA.insurers.find(x => x.id === d.id).n, 'good'); }
    UI.render();
  },

  /* ══ loto citoyenne ══ */
  lotto() {
    const L = DATA.lotto;
    if (Date.now() < (G.lottoCd || 0)) return UI.toast('Ticket déjà pris, patientez.', 'warn');
    if (balance() < L.cost) return UI.toast('Il faut ' + eur(L.cost) + '.', 'bad');
    pay(L.cost, 'Ticket de loto');
    G.lottoCd = Date.now() + L.cd*1000;
    if (Math.random() < L.chance) {
      const g = rnd(L.min, L.max);
      receive(g, 'Gain loto citoyenne');
      G.stats.lottoWins = (G.stats.lottoWins||0)+1;
      addXp(30);
      UI.toast('🍀 GAGNÉ ! La loto vous rapporte +' + eur(g), 'good');
    } else {
      UI.toast('Tirage… pas de chance cette fois.', '');
    }
    UI.render();
  },

  illUnlock() {
    if (balance() < DATA.illEntry) return UI.toast('Il faut ' + eur(DATA.illEntry) + ' pour acheter le silence.', 'bad');
    pay(DATA.illEntry, 'Droit d’entrée réseau'); G.ill.unlocked = true;
    UI.toast('Le réseau vous ouvre ses portes. Soyez discret.', 'warn'); UI.render();
  },
  illDo(d) {
    const a = DATA.ill.find(x => x.id === d.id);
    if (a.reqBiz && !ownsBiz(a.reqBiz)) return UI.toast('Nécessite de posséder une banque.', 'bad');
    if (Date.now() < (G.ill.cd[a.id]||0)) return UI.toast('Action en recharge.', 'warn');
    if (balance() < a.cost) return UI.toast('Mise de départ insuffisante.', 'bad');
    pay(a.cost, 'Mise — ' + a.n); G.ill.cd[a.id] = Date.now() + a.cd*1000;
    if (Math.random() < a.risk) {
      G.ill.heat = Math.min(100, G.ill.heat + a.heat*1.5);
      const amende = a.cost*1.5; pay(amende, 'Amende policière');
      UI.toast('Échec ! La police rôde. Amende : −' + eur(amende), 'bad');
    } else {
      const gain = rnd(a.gain[0], a.gain[1]); receive(gain, 'Gain illicite — ' + a.n);
      G.ill.heat = Math.min(100, G.ill.heat + a.heat);
      UI.toast(a.n + ' réussi : +' + eur(gain), 'good');
    }
    if (G.ill.heat >= 100) {
      G.jail = Date.now() + 60000; G.ill.heat = 30; G.stats.jailed = true;
      const am = Math.max(500, balance()*0.1); pay(am, 'Amende d’interpellation');
      UI.toast('INTERPELLATION ! Garde à vue 60 s, amende −' + eur(am), 'bad');
    }
    UI.render();
  },
  bribe() {
    if (balance() < 800) return UI.toast('Un pot-de-vin correct coûte 800 €.', 'bad');
    pay(800, 'Pot-de-vin'); G.ill.heat = Math.max(0, G.ill.heat - 35);
    UI.toast('L’inspecteur n’a rien vu. Chaleur −35.', 'good'); UI.render();
  },

  claimMission(d) {
    const m = G.missions.list[+d.i];
    if (!m || m.claimed || m.prog < m.tgt) return;
    m.claimed = true; G.stats.missionsDone = (G.stats.missionsDone||0)+1;
    receive(m.rew, 'Récompense de défi — ' + m.n); addXp(Math.round(m.rew/2));
    UI.toast('Défi accompli : +' + eur(m.rew), 'good'); UI.render();
  },

  buyPack(d) {
    const p = DATA.packs.find(x => x.id === d.id);
    UI.modal('<h2>Paiement sécurisé</h2><div class="m-sub">Pack « ' + p.n + ' » — ' + p.price + ' → <span class="money">' + eur0(p.amount) + '</span> en jeu</div>' +
      '<label style="font-size:12.5px;color:var(--mut)">Titulaire de la carte<input id="ccName" class="mini" style="width:100%;margin-top:6px" placeholder="Jean Dupont"></label>' +
      '<label style="font-size:12.5px;color:var(--mut);margin-top:12px;display:block">Numéro de carte<input id="ccNum" class="mini" style="width:100%;margin-top:6px" maxlength="19" placeholder="4242 4242 4242 4242"></label>' +
      '<div style="display:flex;gap:12px;margin-top:12px"><label style="flex:1;font-size:12.5px;color:var(--mut)">Expiration<input class="mini" style="width:100%;margin-top:6px" placeholder="12/28"></label>' +
      '<label style="flex:1;font-size:12.5px;color:var(--mut)">CVC<input class="mini" style="width:100%;margin-top:6px" maxlength="3" placeholder="123"></label></div>' +
      '<div style="margin-top:16px;font-size:11px;color:var(--dim)">⚠ Mode démo : aucun paiement réel n’est effectué.</div>' +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Annuler</button>' +
      '<button class="btn btn-primary" data-act="payConfirm" data-id="' + d.id + '" id="payBtn">Payer ' + p.price + '</button></div>');
  },
  payConfirm(d) {
    const btn = document.getElementById('payBtn');
    btn.disabled = true; btn.textContent = 'Traitement…';
    setTimeout(() => {
      const p = DATA.packs.find(x => x.id === d.id);
      receive(p.amount, 'Crédit pack — ' + p.n); G.stats.premium += p.amount;
      UI.closeModal();
      UI.cardFx('Achat pack ' + p.n, '+' + eur0(p.amount));
      UI.toast('+' + eur0(p.amount) + ' crédités sur votre compte. Merci !', 'good');
    }, 1600);
  },

  tutoNext() { UI.tutoNext(); },
  tutoSkip() { UI.tutoSkip(); },
  closeModal() { UI.closeModal(); },
  resetSave() { if (!confirm('Effacer définitivement votre vie et recommencer ?')) return; DB.deleteSave(DB.session()); DB.logout(); location.reload(); },
  logout() { save(); DB.logout(); location.reload(); }
};

function offerModal() {
  const c = T.offer.c, o = T.offer.o, job = DATA.companies[c].o[o];
  const netP = jobNetHourly(job[1], 'plein'), netT = jobNetHourly(job[1], 'partiel');
  const okP = canTake('plein'), okT = canTake('partiel');
  UI.modal('<h2>Contrat de travail</h2><div class="m-sub">' + esc(job[0]) + ' · ' + esc(DATA.companies[c].n) + ' · ' + eur(job[1]) + ' brut/h · choisissez votre régime</div>' +
    '<div class="mode-cards">' +
    '<div class="mode-card ' + (T.offerMode === 'plein' ? 'sel' : '') + ' ' + (okP ? '' : 'dis') + '" data-act="pickMode" data-m="plein"><div class="m-t">Temps plein</div><div class="m-d">Charge 100 % · exclusif<br>Net estimé : ' + eur(netP) + '/h</div></div>' +
    '<div class="mode-card ' + (T.offerMode === 'partiel' ? 'sel' : '') + ' ' + (okT ? '' : 'dis') + '" data-act="pickMode" data-m="partiel"><div class="m-t">Temps partiel</div><div class="m-d">Charge 50 % · cumulable<br>Net estimé : ' + eur(netT) + '/h</div></div>' +
    '</div>' +
    '<table class="t"><tr><td>Cotisations salariales</td><td class="mono">≈22 %</td></tr>' +
    '<tr><td>Prélèvement à la source</td><td class="mono">prélevé sur le compte à chaque versement</td></tr>' +
    '<tr><td>Charge de travail actuelle</td><td class="mono">' + Math.round(totalLoad()*100) + ' % / 100 %</td></tr></table>' +
    '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Refuser</button>' +
    '<button class="btn btn-primary" data-act="sign">Signer en ' + (T.offerMode === 'plein' ? 'temps plein' : 'temps partiel') + '</button></div>');
}

const GUARDED = ['eat','buyFood','train','offer','sign','openCreate','createBiz','buyMat','craft','buyStock','priceAdj','hire','hireConfirm','buyHome','rentHome','buyCar','deposit','withdraw','toLivret','fromLivret','loanTake','illDo','bribe','upgrade','mktDo','orderFill','lotto'];

function save() {
  if (!G) return;
  G.last = Date.now();
  DB.saveGame(DB.session(), G).then(ok => { if (ok) UI.flashSave(); });
}

function offlineProgress(s) {
  let dt = (Date.now() - (s.last || Date.now())) / 1000;
  if (dt < 30) return null;
  dt = Math.min(dt, 8*3600);
  const res = { dt, gains: 0 };
  const add = g => { if (s.bank.bankId) s.bank.compte += g; else s.cash += g; res.gains += g; };
  s.jobs.forEach(j => { const load = j.mode === 'plein' ? 1 : 0.5; const net = (j.h/60)*load*0.78*(1 - tauxPAS(j.h*2080*load*0.78)); add(net*dt*0.5); });
  s.biz.forEach(b => add((b.emps.length+1)*dt*0.08));
  s.vitals.faim = Math.max(15, s.vitals.faim - dt*0.02);
  s.vitals.soif = Math.max(15, s.vitals.soif - dt*0.025);
  if (s.training && Date.now() >= s.training.end) { const fm = DATA.form.find(x => x.id === s.training.id); s.diplomas.push(fm.id); s.training = null; res.diploma = fm.n; }
  return res;
}
