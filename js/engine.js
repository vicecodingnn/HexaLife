/* ═══════════ MOTEUR v11 — robuste, succès, quotidien, météo vivante ═══════════
 * Corrections majeures :
 *  - sanitize() : fusion profonde sûre (sauvegardes corrompues/anciens formats acceptés)
 *  - tick() protégé : une exception ne gèle plus la partie
 *  - tous les indices venant du DOM sont validés (fini les crashs undefined)
 *  - fireEvent : pool jamais vide
 *  - ops mailbox appliquées de façon isolée (plus de double-application)
 * Nouveautés : succès, récompense quotidienne, météo ↔ jauges, caution de garde à vue,
 *              journal typé, alertes de stock, historique d'indices toujours collecté.
 */
let G = null, W = null, TICK_TIMER = null;
const T = {
  cashDisp: 0, cashInit: false, hist: [], tab: 'vie', selBiz: -1, bizTab: 'overview',
  offer: null, offerMode: 'plein', cands: null, lastSaleFeed: 0,
  jobF: { sec: '', q: '', ok: false }, qT: null, netSign: 0, isAdmin: false,
  journalF: 'all', lastErr: {}, lastStockAlert: 0, shopSel: { kind: 'npc', id: 'superu', owner: '' }, shopsList: []
};
const SAVE_V = 11;

/* ── utilitaires ── */
const eur = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(typeof n === 'number' && isFinite(n) ? n : 0);
const eur0 = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(typeof n === 'number' && isFinite(n) ? n : 0);
const kfmt = n => Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + ' M€' : Math.abs(n) >= 1e4 ? (n / 1e3).toFixed(1) + ' k€' : eur(n);
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const foodById = id => DATA.foods.find(f => f.id === id);
const upLvl = (b, id) => (b && b.ups && b.ups[id]) || 0;
const perk = (b, id) => !!(b && b.perks && b.perks[id]);
const isPlayerBank = id => typeof id === 'string' && id.indexOf('player:') === 0;
const idxOk = (v, len) => { const i = parseInt(v, 10); return (isFinite(i) && i >= 0 && i < len) ? i : -1; };
const num = (v, dv, lo, hi) => {
  let n;
  if (typeof v === 'number' && isFinite(v)) n = v;
  else if (typeof v === 'string' && v.trim() !== '' && isFinite(+v)) n = +v; // ← les dataset DOM sont des chaînes !
  else n = dv;
  return (lo !== undefined || hi !== undefined) ? clamp(n, lo === undefined ? -Infinity : lo, hi === undefined ? Infinity : hi) : n;
};
/* Saisie utilisateur à la française : "1 200,50" → 1200.5 */
const parseAmount = v => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
};
const dayKey = t => new Date(t || Date.now()).toISOString().slice(0, 10);
function refresh() { UI.render(true); }

/* ── argent & journal ── */
function balance() { return G.bank.bankId ? G.bank.compte : G.cash; }
function netWorth() {
  return balance() + G.houses.reduce((a, h) => a + num(h.v, 0), 0) + G.bank.livret
    + G.cars.reduce((a, i) => a + (DATA.cars[i] ? DATA.cars[i].p * 0.6 : 0), 0);
}
function pushJ(label, amt, kind) {
  if (!Array.isArray(G.journal)) G.journal = [];
  G.journal.unshift({ t: Date.now(), label: String(label || ''), amt: num(amt, 0), kind: kind || (amt >= 0 ? 'in' : 'out') });
  if (G.journal.length > 100) G.journal.length = 100;
}
function receive(amt, label, kind) {
  amt = num(amt, 0);
  if (!(amt > 0)) return;
  if (G.bank.bankId) G.bank.compte += amt; else G.cash += amt;
  if (label) pushJ(label, amt, kind || 'in');
  UI.moneyFx(amt);
}
function pay(amt, label, kind) {
  amt = num(amt, 0);
  if (!(amt > 0)) return;
  if (G.bank.bankId) G.bank.compte -= amt; else G.cash -= amt;
  if (label) pushJ(label, -amt, kind || 'out');
  UI.moneyFx(-amt);
}

/* ── modificateurs admin ── */
function adminFactor() {
  if (!G.adminMod) return 1;
  if (Date.now() > G.adminMod.until) { G.adminMod = null; return 1; }
  return G.adminMod.type === 'boost' ? 1.5 : 0.5;
}

/* ── opérations reçues via mailbox (transferts / admin) — isolées par op ── */
function applyOp(op) {
  if (!op || typeof op !== 'object') return;
  try {
    if (op.type === 'credit') {
      const amt = num(op.amount, 0, 0, 1e12);
      receive(amt, 'Transfert reçu de ' + (op.from || '?'), 'in');
      UI.moneyRain(); FX.sound('cash');
      UI.toast('💸 ' + esc(op.from || 'Un joueur') + ' vous a envoyé ' + eur(amt), 'good');
    }
    else if (op.type === 'debit') {
      const amt = num(op.amount, 0, 0, 1e12);
      pay(amt, 'Transfert envoyé à ' + (op.to || '?'), 'out');
      UI.toast('Transfert de ' + eur(amt) + ' à ' + esc(op.to || '?') + ' confirmé', '');
    }
    else if (op.type === 'packCredit') {
      const pk = DATA.packs.find(x => x.id === op.pack);
      receive(num(op.amount, 0, 0, 1e9), 'Pack Stripe — ' + (pk ? pk.n : op.pack), 'in');
      G.stats.premium = num(G.stats.premium, 0) + num(op.amount, 0, 0, 1e9);
      UI.cardFx('Paiement Stripe confirmé', '+' + eur0(op.amount));
      UI.confetti(); FX.sound('win');
      UI.toast('💎 Paiement détecté automatiquement : +' + eur0(op.amount) + ' crédités !', 'good');
    }
    else if (op.type === 'shopDebit') {
      const f = foodById(op.food);
      const q = clamp(Math.floor(num(op.q, 1, 1, 99)), 1, 99);
      pay(num(op.amount, 0, 0, 1e12), op.label || 'Courses', 'food');
      if (f) G.inv[f.id] = (G.inv[f.id] || 0) + q;
      mission('shop', q); addXp(2 * q);
      FX.sound('buy');
      UI.toast('🛒 Course livrée : ' + (f ? f.ico + ' ' + esc(f.n) : 'article') + ' ×' + q + ' (−' + eur(op.amount) + ')', 'good');
    }
    else if (op.type === 'shopSale') {
      const b = G.biz[idxOk(op.idx, G.biz.length)];
      receive(num(op.amount, 0, 0, 1e12), 'Vente épicerie — ' + (b ? b.name : 'magasin'), 'biz');
      if (b && b.grocery) {
        b.grocery.stock = Math.max(0, b.grocery.stock - clamp(Math.floor(num(op.q, 0, 0, 1e9)), 0, 1e9));
        b.rev = num(b.rev, 0) + num(op.amount, 0, 0, 1e12);
        bizFeed(b, 'Vente épicerie · ' + String(op.from || 'client'), num(op.amount, 0, 0, 1e12));
      }
      FX.sound('cash');
      UI.toast('🛒 ' + esc(op.from || 'Un client') + ' a acheté dans votre magasin (+' + eur(op.amount) + ')', 'good');
    }
    else if (op.type === 'adminCredit') { receive(num(op.amount, 0, 0, 1e12), 'Bonus administrateur', 'in'); UI.confetti(); FX.sound('win'); UI.toast('🎁 Bonus admin +' + eur(op.amount), 'good'); }
    else if (op.type === 'adminDebit') { pay(num(op.amount, 0, 0, 1e12), 'Malus administrateur', 'out'); FX.sound('error'); UI.toast('⚠ Malus admin −' + eur(op.amount), 'bad'); }
    else if (op.type === 'deleteBiz') { G.biz = []; T.selBiz = -1; FX.sound('error'); UI.toast('🏚 Vos entreprises ont été supprimées par un admin', 'bad'); }
    else if (op.type === 'boost') { G.adminMod = { type: 'boost', until: Date.now() + 5 * 60 * 1000 }; UI.confetti(); FX.sound('win'); UI.toast('⚡ Boost admin : revenus ×1,5 pendant 5 min', 'good'); }
    else if (op.type === 'malus') { G.adminMod = { type: 'malus', until: Date.now() + 5 * 60 * 1000 }; FX.sound('warn'); UI.toast('🐌 Malus admin : revenus ×0,5 pendant 5 min', 'bad'); }
    else if (op.type === 'reset') {
      const name = G.name;
      G = sanitize(newGame(name));
      T.hist.length = 0; T.cashInit = false; T.cashDisp = 0; T.selBiz = -1;
      FX.sound('error'); UI.toast('♻ Progression réinitialisée par un admin', 'bad');
    }
  } catch (e) {
    if (UI && UI.reportError) UI.reportError(e, 'applyOp');
  }
}

/* ── monde ── */
function seedHist(base, vol, n) {
  const out = []; let v = base;
  for (let i = 0; i < n; i++) { v *= 1 + rnd(-vol, vol * 1.05); out.push(v); }
  return out;
}
function genWorld() {
  W = { npcs: [], biz: [], idx: { cac: 7842, immo: 100, conso: 100 }, t: 0, weather: { i: irnd(0, DATA.weather.length - 1), until: Date.now() + 180000 } };
  for (let i = 0; i < 800; i++) {
    const r = Math.random();
    W.npcs.push({ n: DATA.prenoms[irnd(0, DATA.prenoms.length - 1)] + ' ' + DATA.noms[irnd(0, DATA.noms.length - 1)], role: r < .78 ? 'client' : (r < .94 ? 'employé' : 'patron'), w: Math.round(rnd(600, 60000)) });
  }
  DATA.companies.forEach((c, i) => W.biz.push({ i, n: c.n, s: c.sec, sante: rnd(48, 96), boss: null }));
  W.npcs.filter(n => n.role === 'patron').forEach((p, k) => { const b = W.biz[k % W.biz.length]; if (b) b.boss = p.n; });
  // historique d'indices pré-généré : les graphiques sont vivants dès l'ouverture
  W.hCac = seedHist(7842, 0.004, 70); W.idx.cac = W.hCac[W.hCac.length - 1];
  W.hImmo = seedHist(100, 0.0025, 70); W.idx.immo = W.hImmo[W.hImmo.length - 1];
  W.hConso = seedHist(100, 0.003, 70); W.idx.conso = W.hConso[W.hConso.length - 1];
}

/* ── état joueur ── */
function newGame(name) {
  return {
    v: SAVE_V, name, created: Date.now(), last: Date.now(),
    cash: 2000, xp: 0, lottoCd: 0, adminMod: null,
    vitals: { sante: 92, faim: 70, soif: 65 },
    health: { doctor: null, vaccines: [], sick: false, rdv: 0 },
    jobs: [], training: null, diplomas: [],
    inv: {}, cars: [], houses: [], rental: null, insurances: [],
    bank: { bankId: null, bankName: null, playerRate: null, compte: 0, livret: 0, loans: [],
      cardCb: { plafond: 2000, frozen: false }, cardLivret: { frozen: false }, cardPremium: false },
    biz: [], ill: { unlocked: false, heat: 0, cd: {} },
    jail: 0, nextEvent: Date.now() + 120000, boost: null,
    missions: { list: [], refreshAt: 0 }, quests: { list: [], refreshAt: 0 },
    journal: [], tuto: 0, skills: {},
    ach: {}, daily: { lastDay: '', streak: 0 },
    market: { mult: {}, until: 0 }, histBal: [], carState: {}, sportCd: 0,
    stats: {
      earned: 0, tax: 0, spent: 0, sales: 0, premium: 0, events: 0, missionsDone: 0,
      jailed: false, orders: 0, lottoWins: 0, tutoDone: false, braquages: 0, transfersSent: 0, frozeOnce: false
    }
  };
}

/* Fusion sûre : n'accepte que des valeurs du bon type, dans les bornes du jeu. */
function sanitize(s) {
  s = (s && typeof s === 'object') ? s : {};
  const name = (typeof s.name === 'string' && s.name.trim()) ? s.name.trim().slice(0, 20) : 'Citoyen';
  const d = newGame(name);
  const out = d;
  out.v = SAVE_V;
  out.created = num(s.created, d.created, 0);
  out.last = num(s.last, d.last, 0);
  out.cash = num(s.cash, d.cash, -1e12, 1e12);
  out.xp = num(s.xp, 0, 0, 1e12);
  out.lottoCd = num(s.lottoCd, 0, 0);
  out.adminMod = (s.adminMod && typeof s.adminMod === 'object' && num(s.adminMod.until, 0) > Date.now())
    ? { type: s.adminMod.type === 'boost' ? 'boost' : 'malus', until: num(s.adminMod.until, 0) } : null;
  out.tuto = typeof s.tuto === 'number' && isFinite(s.tuto) ? s.tuto : -1;

  out.vitals = {
    sante: num(s.vitals && s.vitals.sante, d.vitals.sante, 0, 100),
    faim: num(s.vitals && s.vitals.faim, d.vitals.faim, 0, 200),
    soif: num(s.vitals && s.vitals.soif, d.vitals.soif, 0, 100)
  };
  const sh = (s.health && typeof s.health === 'object') ? s.health : {};
  out.health = {
    doctor: DATA.doctors.some(x => x.id === sh.doctor) ? sh.doctor : null,
    vaccines: Array.isArray(sh.vaccines) ? [...new Set(sh.vaccines.filter(v => DATA.vaccines.some(x => x.id === v)))].slice(0, DATA.vaccines.length) : [],
    sick: !!sh.sick,
    rdv: num(sh.rdv, 0, 0)
  };

  // emplois
  out.jobs = Array.isArray(s.jobs) ? s.jobs.filter(j => {
    return j && typeof j === 'object' && idxOk(j.c, DATA.companies.length) >= 0 &&
      DATA.companies[idxOk(j.c, DATA.companies.length)] &&
      idxOk(j.o, DATA.companies[idxOk(j.c, DATA.companies.length)].o.length) >= 0;
  }).slice(0, 4).map(j => {
    const co = DATA.companies[j.c].o[j.o];
    return {
      c: j.c, o: j.o, title: typeof j.title === 'string' ? j.title : co[0],
      h: num(j.h, co[1], 5, 500), mode: j.mode === 'partiel' ? 'partiel' : 'plein',
      since: num(j.since, Date.now(), 0), mins: num(j.mins, 0, 0), promo: !!j.promo, negAt: num(j.negAt, 0, 0)
    };
  }) : [];

  // formation
  if (s.training && typeof s.training === 'object' && DATA.form.some(f => f.id === s.training.id)) {
    out.training = { id: s.training.id, end: num(s.training.end, Date.now(), 0) };
  } else out.training = null;

  out.diplomas = Array.isArray(s.diplomas) ? [...new Set(s.diplomas.filter(id => DATA.form.some(f => f.id === id)))] : [];

  // inventaire (nouritures connues uniquement)
  out.inv = {};
  if (s.inv && typeof s.inv === 'object') {
    for (const k of Object.keys(s.inv)) {
      if (foodById(k)) { const q = Math.floor(num(s.inv[k], 0, 0, 9999)); if (q > 0) out.inv[k] = q; }
    }
  }

  out.cars = Array.isArray(s.cars) ? [...new Set(s.cars.map(i => idxOk(i, DATA.cars.length)).filter(i => i >= 0))].slice(0, DATA.cars.length) : [];

  out.houses = Array.isArray(s.houses) ? s.houses.filter(h => h && typeof h === 'object' && idxOk(h.i, DATA.homes.length) >= 0)
    .slice(0, 12).map(h => ({
      i: idxOk(h.i, DATA.homes.length), v: num(h.v, DATA.homes[idxOk(h.i, DATA.homes.length)].p, 1, 1e13),
      c: num(h.c, 0, 0, 1e7), rent: num(h.rent, 0, 0, 1e7), tenant: !!h.tenant
    })) : [];

  out.rental = (s.rental && typeof s.rental === 'object' && idxOk(s.rental.i, DATA.rentals.length) >= 0)
    ? { i: idxOk(s.rental.i, DATA.rentals.length), loyer: num(s.rental.loyer, DATA.rentals[idxOk(s.rental.i, DATA.rentals.length)].loyer, 0, 1e7) } : null;

  out.insurances = Array.isArray(s.insurances) ? [...new Set(s.insurances.filter(id => DATA.insurers.some(x => x.id === id)))] : [];

  // banque
  const sb = (s.bank && typeof s.bank === 'object') ? s.bank : {};
  const bankIdOk = (typeof sb.bankId === 'string') && (DATA.banks.some(b => b.id === sb.bankId) || isPlayerBank(sb.bankId));
  const scb = (sb.cardCb && typeof sb.cardCb === 'object') ? sb.cardCb : {};
  const slv = (sb.cardLivret && typeof sb.cardLivret === 'object') ? sb.cardLivret : {};
  out.bank = {
    bankId: bankIdOk ? sb.bankId : null,
    bankName: bankIdOk && typeof sb.bankName === 'string' ? sb.bankName.slice(0, 60) : null,
    playerRate: bankIdOk && isPlayerBank(sb.bankId) ? num(sb.playerRate, 2, 0, 5) : null,
    compte: num(sb.compte, 0, -1e12, 1e12),
    livret: num(sb.livret, 0, 0, 22950),
    loans: Array.isArray(sb.loans) ? sb.loans.filter(L => L && typeof L === 'object' && num(L.reste, 0) > 0).slice(0, 12)
      .map(L => ({ n: String(L.n || 'Crédit').slice(0, 30), total: num(L.total, 0, 0, 1e13), mens: num(L.mens, 0, 0, 1e10), reste: num(L.reste, 0, 0.01, 1e13) })) : [],
    cardCb: { plafond: num(scb.plafond, 2000, 100, 20000), frozen: !!scb.frozen },
    cardLivret: { frozen: !!slv.frozen },
    cardPremium: !!sb.cardPremium
  };

  // entreprises
  out.biz = Array.isArray(s.biz) ? s.biz.filter(b => b && typeof b === 'object' && DATA.bizTypes[b.type]).slice(0, 8).map(b => sanitizeBiz(b)) : [];

  // illégal
  const si = (s.ill && typeof s.ill === 'object') ? s.ill : {};
  out.ill = {
    unlocked: !!si.unlocked,
    heat: num(si.heat, 0, 0, 100),
    cd: {}
  };
  if (si.cd && typeof si.cd === 'object') for (const a of DATA.ill) out.ill.cd[a.id] = num(si.cd[a.id], 0, 0);

  out.jail = num(s.jail, 0, 0);
  out.nextEvent = Math.max(Date.now() + 20000, num(s.nextEvent, Date.now() + 60000));
  out.boost = (s.boost && typeof s.boost === 'object' && num(s.boost.until, 0) > Date.now() && num(s.boost.mul, 0) > 0)
    ? { type: String(s.boost.type || 'toutes').slice(0, 20), mul: num(s.boost.mul, 1, 0.1, 10), until: num(s.boost.until, 0), label: String(s.boost.label || 'Boost').slice(0, 40) } : null;

  // missions / quêtes : ne garder que celles connues dans DATA
  out.missions = sanitizeTaskList(s.missions, DATA.missions, 15 * 60 * 1000);
  out.quests = sanitizeTaskList(s.quests, DATA.quests, 24 * 3600 * 1000);

  out.journal = Array.isArray(s.journal) ? s.journal.filter(j => j && typeof j === 'object')
    .slice(0, 100).map(j => ({ t: num(j.t, Date.now(), 0), label: String(j.label || '').slice(0, 80), amt: num(j.amt, 0, -1e13, 1e13), kind: typeof j.kind === 'string' ? j.kind : (num(j.amt, 0) >= 0 ? 'in' : 'out') })) : [];

  out.skills = {};
  if (s.skills && typeof s.skills === 'object') for (const sk of DATA.skills) {
    const l = Math.floor(num(s.skills[sk.id], 0, 0, sk.maxLvl));
    if (l > 0) out.skills[sk.id] = l;
  }


  out.ach = {};
  if (s.ach && typeof s.ach === 'object') for (const a of DATA.ach) if (num(s.ach[a.id], 0) > 0) out.ach[a.id] = num(s.ach[a.id], 0);

  out.daily = {
    lastDay: (s.daily && typeof s.daily.lastDay === 'string') ? s.daily.lastDay.slice(0, 10) : '',
    streak: num(s.daily && s.daily.streak, 0, 0, 99999)
  };

  /* marché, historique de solde, usure voitures, sport (v11.1) */
  out.market = { mult: {}, until: num(s.market && s.market.until, 0, 0) };
  if (s.market && s.market.mult && typeof s.market.mult === 'object') {
    for (const f of DATA.foods) {
      const m = num(s.market.mult[f.id], 1, 0.3, 2);
      if (m !== 1) out.market.mult[f.id] = m;
    }
  }
  if (out.market.until < Date.now()) out.market.until = 0;
  out.histBal = Array.isArray(s.histBal) ? s.histBal.map(v => num(v, 0, -1e13, 1e13)).slice(-120) : [];
  out.carState = {};
  if (s.carState && typeof s.carState === 'object') for (const k of Object.keys(s.carState)) {
    const i = parseInt(k, 10);
    if (isFinite(i) && i >= 0 && i < DATA.cars.length) out.carState[i] = num(s.carState[k], 100, 5, 100);
  }
  out.sportCd = num(s.sportCd, 0, 0);

  const st = (s.stats && typeof s.stats === 'object') ? s.stats : {};
  out.stats = {};
  for (const k of Object.keys(d.stats)) {
    out.stats[k] = (typeof d.stats[k] === 'boolean') ? !!st[k] : num(st[k], d.stats[k], 0, 1e15);
  }
  if (out.tuto === -1) out.stats.tutoDone = true; // anciens saves : tutoriel déjà vu
  return out;
}
function sanitizeTaskList(src, defs, refreshMs) {
  const out = { list: [], refreshAt: num(src && src.refreshAt, 0, 0) };
  if (src && Array.isArray(src.list)) {
    for (const m of src.list) {
      if (!m || typeof m !== 'object') continue;
      const def = defs.find(x => x.id === m.id);
      if (!def) continue;
      out.list.push(Object.assign({}, def, { prog: num(m.prog, 0, 0, 1e12), claimed: !!m.claimed }));
    }
  }
  if (!out.refreshAt || out.refreshAt < Date.now()) out.refreshAt = Date.now() + refreshMs;
  return out;
}
function sanitizeBiz(b) {
  const bt = DATA.bizTypes[b.type];
  const out = {
    type: b.type,
    name: (typeof b.name === 'string' && b.name.trim()) ? b.name.trim().slice(0, 40) : bt.label,
    rep: num(b.rep, 50, 5, 100),
    stock: {}, mats: {}, prices: {}, emps: [], ups: {}, perks: {},
    hist: Array.isArray(b.hist) ? b.hist.map(v => num(v, 0, -1e12, 1e12)).slice(-60) : [],
    counters: {}, wagesTotal: num(b.wagesTotal, 0, 0, 1e13),
    rev: num(b.rev, 0, 0, 1e13), sold: num(b.sold, 0, 0, 1e12), profit: num(b.profit, 0, -1e13, 1e13),
    boostUntil: num(b.boostUntil, 0, 0), boostMul: num(b.boostMul, 1, 0.1, 10),
    promoUntil: num(b.promoUntil, 0, 0), order: null
  };
  if (bt.prods) {
    for (const p of bt.prods) {
      out.prices[p.id] = num(b.prices && b.prices[p.id], p.ref, 0.1, 10000);
      out.stock[p.id] = Math.floor(num(b.stock && b.stock[p.id], 0, 0, 1e9));
      out.counters[p.id] = Math.floor(num(b.counters && b.counters[p.id], 0, 0, 1e12));
    }
  }
  if (bt.mats) for (const m of Object.keys(bt.mats)) out.mats[m] = num(b.mats && b.mats[m], 0, 0, 1e9);
  if (Array.isArray(b.emps)) out.emps = b.emps.filter(e => e && typeof e === 'object')
    .slice(0, bt.maxEmp || 4).map(e => ({ n: String(e.n || 'Salarié').slice(0, 40), h: num(e.h, 14, 5, 500) }));
  for (const u of (DATA.ups[b.type] || [])) {
    const l = Math.floor(num(b.ups && b.ups[u.id], 0, 0, u.max));
    if (l > 0) out.ups[u.id] = l;
  }
  for (const m of (DATA.mkt[b.type] || [])) if (m.perk && b.perks && b.perks[m.perk]) out.perks[m.perk] = true;
  if (b.order && typeof b.order === 'object' && num(b.order.until, 0) > Date.now() && bt.prods && bt.prods.some(p => p.id === b.order.p)) {
    out.order = { p: b.order.p, pn: String(b.order.pn || '').slice(0, 40), qty: Math.floor(num(b.order.qty, 1, 1, 1000)), reward: num(b.order.reward, 0, 0, 1e10), until: num(b.order.until, 0) };
  }
  out.spoil = Math.floor(num(b.spoil, 0, 0, 1e12));
  out.theft = Math.floor(num(b.theft, 0, 0, 1e12));
  out.feed = Array.isArray(b.feed) ? b.feed.filter(x => x && typeof x === 'object').slice(-6)
    .map(x => ({ t: num(x.t, 0, 0), l: String(x.l || '').slice(0, 60), a: num(x.a, 0, -1e12, 1e12) })) : [];
  if (b.type === 'magasin') {
    const g = (b.grocery && typeof b.grocery === 'object') ? b.grocery : {};
    out.grocery = { margin: num(g.margin, 0.10, -0.5, 1), stock: Math.floor(num(g.stock, 0, 0, 1e9)) };
  }
  if (b.type === 'immobilier') out.mandats = Math.floor(num(b.mandats, 0, 0, 1e7));
  if (b.type === 'banque') {
    out.accounts = Math.floor(num(b.accounts, 0, 0, 1e9));
    out.deposits = num(b.deposits, 0, 0, 1e13);
    out.loans = num(b.loans, 10000, 0, 1e13);
    out.tauxCredit = num(b.tauxCredit, 6, 1, 12);
    out.tauxLivret = num(b.tauxLivret, 2, 0, 5);
    out.mkt = Math.floor(num(b.mkt, 1, 0, 1000));
  }
  return out;
}

/* ── fiscalité & bonus ── */
function tauxPAS(annuel) {
  const TR = [[11294, 0], [28797, .11], [82341, .30], [177106, .41], [Infinity, .45]];
  let prev = 0, tax = 0;
  annuel = Math.max(0, num(annuel, 0));
  for (const [lim, r] of TR) { if (annuel > lim) { tax += (lim - prev) * r; prev = lim; } else { tax += (annuel - prev) * r; break; } }
  return annuel > 0 ? tax / annuel : 0;
}
function skillLvl(id) { return (G.skills && G.skills[id]) || 0; }
function skillBonus(type) {
  if (type === 'salary') return 1 + skillLvl('s_eff') * 0.10;
  if (type === 'hunger') return 1 - skillLvl('s_faim') * 0.15;
  if (type === 'health') return 1 + skillLvl('s_sante') * 0.10;
  if (type === 'rep') return 1 + skillLvl('s_rep') * 0.20;
  if (type === 'upgrade') return 1 - skillLvl('s_inv') * 0.10;
  if (type === 'luck') return skillLvl('s_lotto') * 0.02;
  return 0;
}
function carBonus() { return G.cars.length ? Math.max(...G.cars.map(i => (DATA.cars[i] || { b: 0 }).b)) : 0; }
function carState(i) { return clamp(num(G.carState && G.carState[i], 100, 0, 100), 5, 100); }
function worstCarState() { return G.cars.length ? Math.min(...G.cars.map(carState)) : 100; }
function rollMarket() {
  const mult = {};
  DATA.foods.forEach(f => {
    let m = rnd(0.92, 1.12);
    if (Math.random() < 0.14) m = rnd(0.62, 0.85);        // promo
    else if (Math.random() < 0.10) m = rnd(1.15, 1.35);   // tension
    mult[f.id] = +m.toFixed(3);
  });
  G.market = { mult, until: Date.now() + 150000 };
}
function effPrice(f) { return +((f.p || 0) * num(G.market && G.market.mult && G.market.mult[f.id], 1, 0.3, 2)).toFixed(2); }
function comfort() { return Math.min(10, G.houses.reduce((a, h) => a + (DATA.homes[h.i] ? DATA.homes[h.i].p / 60000 : 0), 0)); }
function hasShelter() { return !!G.rental || G.houses.length > 0; }
function cov() { return G.insurances.reduce((m, id) => Math.max(m, (DATA.insurers.find(x => x.id === id) || {}).cov || 0), 0); }
function playerTier() { return G.diplomas.reduce((m, id) => { const f = DATA.form.find(x => x.id === id); return f ? Math.max(m, f.tier) : m; }, 1); }
function ownsBiz(t) { return G.biz.some(b => b.type === t); }
function inJail() { return G.jail > Date.now(); }
function level(xp) { return Math.floor(Math.sqrt(Math.max(0, num(xp, 0)) / 100)) + 1; }
function addXp(n) {
  n = Math.max(0, Math.floor(num(n, 0)));
  if (!n) return;
  const l0 = level(G.xp); G.xp += n; const l1 = level(G.xp);
  UI.xpFx(n);
  if (l1 > l0) {
    const bonus = l1 * 100;
    receive(bonus, 'Bonus niveau ' + l1, 'in');
    UI.levelUp(l1);
    FX.sound('level');
    UI.toast('Niveau ' + l1 + ' atteint ! Prime de ' + eur(bonus), 'good');
  }
}
function jobLoad(j) { return j && j.mode === 'plein' ? 1 : 0.5; }
function totalLoad() { return G.jobs.reduce((a, j) => a + jobLoad(j), 0); }
function canTake(mode) { return totalLoad() + (mode === 'plein' ? 1 : 0.5) <= 1.001; }
function jobNetHourly(h, mode) {
  const load = mode === 'plein' ? 1 : 0.5;
  const gross = h * load * skillBonus('salary'), cot = gross * 0.22, ni = gross - cot;
  return ni * (1 - tauxPAS(h * 2080 * load * 0.78));
}
function bankRate() {
  if (!G.bank.bankId) return 0;
  if (isPlayerBank(G.bank.bankId)) return num(G.bank.playerRate, 2, 0, 5);
  const b = DATA.banks.find(x => x.id === G.bank.bankId);
  return b ? b.lv : 0;
}
/* Garantit la présence des objets cartes (toutes sauvegardes / objets reconstruits) */
function ensureCards() {
  const b = G.bank;
  b.cardCb = (b.cardCb && typeof b.cardCb === 'object')
    ? { plafond: num(b.cardCb.plafond, 2000, 100, 20000), frozen: !!b.cardCb.frozen }
    : { plafond: 2000, frozen: false };
  b.cardLivret = (b.cardLivret && typeof b.cardLivret === 'object')
    ? { frozen: !!b.cardLivret.frozen } : { frozen: false };
  b.cardPremium = !!b.cardPremium;
}
/* ── cartes bancaires ── */
function cardFrozen(which) {
  if (which === 'livret') return !!(G.bank.cardLivret && G.bank.cardLivret.frozen);
  return !!(G.bank.cardCb && G.bank.cardCb.frozen);
}
function cardPlafond() { return num(G.bank.cardCb && G.bank.cardCb.plafond, 2000, 100, 20000); }
/* Paiements par carte : bloqués si carte bleue gelée (le retrait DAB reste possible) */
function guardCardPay() {
  if (G.bank.bankId && cardFrozen('cb')) {
    FX.sound('error');
    UI.toast('💳 Carte gelée : dégелеz-la au terminal, ou retirez des espèces au DAB.', 'warn');
    return false;
  }
  return true;
}
/* Gros achats : cérémonie sans contact (NFC) si une carte existe, sinon immédiat */
function payFlow(cost, label, act, data) {
  cost = num(cost, 0);
  if (!(cost > 0) || !G.bank.bankId) { A[act](data || {}); return; }
  UI.nfcPay({ cost, label, act, data: data || {} });
}
function srcBalance(src) {
  if (src === 'cash') return G.cash;
  if (src === 'compte') return G.bank.compte;
  if (src === 'livret') return G.bank.livret;
  return 0;
}
function moveMoneyWith(from, to, v) {
  if (!G.bank.bankId) { UI.toast('Ouvrez d’abord un compte.', 'warn'); return false; }
  if (from === to || !['cash', 'compte', 'livret'].includes(from) || !['cash', 'compte', 'livret'].includes(to)) {
    UI.toast('Transfert invalide.', 'bad'); return false;
  }
  v = Math.round(num(v, 0, 0, 1e12) * 100) / 100;
  if (!(v > 0)) { FX.sound('error'); UI.toast('Saisissez un montant (ex : 150 ou 150,50).', 'bad'); return false; }
  // gel de carte : les mouvements depuis un compte bancaire exigent la carte correspondante
  if (from !== 'cash' && cardFrozen(from === 'livret' ? 'livret' : 'cb')) {
    FX.sound('error'); UI.toast('💳 Carte ' + (from === 'livret' ? 'Livret' : 'bleue') + ' gelée : opération impossible.', 'warn'); return false;
  }
  if (srcBalance(from) < v) {
    FX.sound('error');
    UI.toast('Solde source insuffisant : ' + eur(srcBalance(from)) + ' disponibles.', 'bad'); return false;
  }
  if (to === 'livret' && G.bank.livret + v > 22950) {
    FX.sound('error'); UI.toast('Plafond Livret A : place restante ' + eur(Math.max(0, 22950 - G.bank.livret)) + '.', 'warn'); return false;
  }
  if ((from === 'compte' && to === 'cash') || (from === 'livret' && to === 'cash') || from === 'livret') {
    if (v > cardPlafond()) { FX.sound('error'); UI.toast('Plafond carte dépassé : ' + eur(cardPlafond()) + ' / opération. Modifiable au terminal.', 'warn'); return false; }
  }
  if (from === 'cash') G.cash -= v; else if (from === 'compte') G.bank.compte -= v; else G.bank.livret -= v;
  if (to === 'cash') G.cash += v; else if (to === 'compte') G.bank.compte += v; else G.bank.livret += v;
  const LBL = { cash: 'liquide', compte: 'compte', livret: 'Livret A' };
  pushJ(LBL[from] + ' → ' + LBL[to], (from === 'cash' ? v : -v), 'bank');
  return true;
}
function curWeather() { return DATA.weather[clamp(W && W.weather ? W.weather.i : 0, 0, DATA.weather.length - 1)]; }

/* ── succès ── */
const achCtx = () => ({ balance, netWorth, level });
function maybeAch() {
  if (!G || !G.ach) return;
  const ctx = achCtx();
  for (const a of DATA.ach) {
    if (G.ach[a.id]) continue;
    let ok = false;
    try { ok = !!a.check(G, ctx); } catch (e) { ok = false; }
    if (ok) unlockAch(a);
  }
}
function unlockAch(a) {
  G.ach[a.id] = Date.now();
  G.xp += a.xp || 0; // XP brut : pas de prime niveau pour les succès (évite les cascades)
  UI.achUnlock(a);
  FX.sound('ach');
}
function achCount() { return Object.keys(G.ach || {}).length; }

/* ── récompense quotidienne ── */
function canClaimDaily() { return !!G && !!G.daily && G.daily.lastDay !== dayKey(); }
function dailyIndex() {
  const yd = dayKey(Date.now() - 86400000);
  const streak = (G.daily.lastDay === yd) ? (G.daily.streak || 0) + 1 : 1;
  return Math.min(DATA.daily.length, streak) - 1;
}

/* ── missions & quêtes ── */
function rollMissions() {
  const pool = DATA.missions.slice(); const list = [];
  while (list.length < 3 && pool.length) list.push(Object.assign({}, pool.splice(irnd(0, pool.length - 1), 1)[0], { prog: 0, claimed: false }));
  G.missions = { list, refreshAt: Date.now() + 15 * 60 * 1000 };
}
function rollQuests() {
  const pool = DATA.quests.slice(); const list = [];
  while (list.length < 3 && pool.length) list.push(Object.assign({}, pool.splice(irnd(0, pool.length - 1), 1)[0], { prog: 0, claimed: false }));
  G.quests = { list, refreshAt: Date.now() + 24 * 3600 * 1000 };
}
function mission(type, amt) {
  if (G.missions && G.missions.list) G.missions.list.forEach(m => { if (m.type === type && !m.claimed) m.prog = (type === 'cash') ? Math.max(m.prog, num(amt, 0)) : m.prog + num(amt, 1, 0, 1e9); });
  if (G.quests && G.quests.list) G.quests.list.forEach(q => { if (q.type === type && !q.claimed) q.prog = (type === 'cash') ? Math.max(q.prog, num(amt, 0)) : q.prog + num(amt, 1, 0, 1e9); });
}

/* ── réglages (par navigateur) ── */
function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('hl_settings') || '{}'); } catch (e) { s = {}; }
  return { sound: s.sound !== false, particles: s.particles !== false, reduced: !!s.reduced };
}
function saveSettings(s) { try { localStorage.setItem('hl_settings', JSON.stringify(s)); } catch (e) {} }

/* ═══════════ BOUCLE DE JEU ═══════════ */
function tick() {
  if (!G || !W) return;
  try { tickInner(); }
  catch (e) {
    const key = String(e && e.message || e);
    const now = Date.now();
    if (!T.lastErr[key] || now - T.lastErr[key] > 60000) {
      T.lastErr[key] = now;
      if (UI && UI.reportError) UI.reportError(e, 'tick');
    }
  }
}
function tickInner() {
  const now = Date.now(); W.t++;
  if (!Array.isArray(W.hCac)) { W.hCac = []; W.hImmo = []; W.hConso = []; }
  const info = { rev: 0, chg: 0, tax: 0 };
  const af = adminFactor();

  /* salaires */
  G.jobs.forEach(j => {
    const load = jobLoad(j);
    const gross = (j.h / 60) * load * (1 + carBonus()) * skillBonus('salary');
    const cot = gross * 0.22, ni = gross - cot;
    const pas = ni * tauxPAS(j.h * 2080 * load * 0.78);
    receive(ni * af, 'Salaire — ' + j.title, 'in');
    pay(pas, 'PAS', 'tax');
    info.rev += ni * af; info.chg += pas; info.tax += cot + pas;
    G.stats.earned += ni - pas; G.stats.tax += cot + pas;
    mission('work', 1);
    j.mins = num(j.mins, 0) + 1;
    if (j.mins === 600 && !j.promo) { j.promo = true; j.h = +(j.h * 1.06).toFixed(2); UI.toast('📈 Promotion +6 % : ' + esc(j.title), 'good'); FX.sound('win'); }
  });

  /* jauges vitales (+ effets météo v11) */
  const w = curWeather();
  const f = hasShelter() ? 1 : 1.5;
  const hungerMul = Math.max(0.5, skillBonus('hunger'));
  const healthMul = Math.max(0.5, skillBonus('health'));
  const thirstMul = w.id === 'canicule' ? 1.7 : 1;
  G.vitals.faim = Math.max(0, G.vitals.faim - 0.10 * f * hungerMul - (G.vitals.faim > 100 ? 0.15 : 0));
  G.vitals.soif = Math.max(0, G.vitals.soif - 0.14 * f * thirstMul);
  if (G.vitals.faim <= 0) G.vitals.sante -= 0.45;
  if (G.vitals.soif <= 0) G.vitals.sante -= 0.60;
  if (G.vitals.faim > 100) G.vitals.sante -= (G.vitals.faim - 100) * 0.002;
  if (G.health.sick) G.vitals.sante -= 0.25;
  if (!hasShelter() && (w.id === 'neige' || w.id === 'pluie')) G.vitals.sante -= (w.id === 'neige' ? 0.10 : 0.05);
  if (G.vitals.faim > 40 && G.vitals.faim <= 100 && G.vitals.soif > 55 && !G.health.sick && G.vitals.sante < 100)
    G.vitals.sante = Math.min(100, G.vitals.sante + (0.22 + comfort() * 0.03 + (w.id === 'soleil' ? 0.04 : 0)) * healthMul);
  G.vitals.sante = clamp(G.vitals.sante, 0, 100);
  if (G.vitals.sante <= 0) hospital();

  /* formation */
  if (G.training && now >= G.training.end) {
    const fm = DATA.form.find(x => x.id === G.training.id);
    if (fm && !G.diplomas.includes(fm.id)) G.diplomas.push(fm.id);
    G.training = null; mission('train', 1); addXp(40);
    UI.confetti(); FX.sound('win');
    UI.toast('🎓 Formation terminée : ' + (fm ? fm.n : 'diplôme'), 'good');
    if (T.tab === 'carriere') refresh();
    maybeAch();
  }

  /* météo */
  if (now > W.weather.until) {
    W.weather.i = irnd(0, DATA.weather.length - 1);
    W.weather.until = now + 180000;
    const nw = curWeather();
    UI.setWeather(nw.vis);
    UI.feed('<b>Météo :</b> ' + nw.ico + ' ' + nw.n + ' — ' + nw.d);
  }

  /* entreprises */
  G.biz.forEach((b, bi) => { try { tickBiz(b, bi, info, now, af); } catch (e) { UI.reportError(e, 'tickBiz'); } });

  /* mensuel (60 s = 1 mois) */
  if (W.t % 60 === 0) monthly(info);

  /* immobilier : valeur + loyers */
  if (W.t % 6 === 0) G.houses.forEach(h => {
    h.v = num(h.v, 0) * (1 + rnd(-0.0006, 0.0009));
    if (h.tenant) { receive(num(h.rent, 0), 'Loyer perçu', 'in'); info.rev += num(h.rent, 0); }
  });

  /* indices : toujours collectés (graphiques vivants même hors onglet Économie) */
  W.idx.cac *= 1 + rnd(-0.0006, 0.0007); W.idx.immo *= 1 + rnd(-0.0004, 0.0005); W.idx.conso *= 1 + rnd(-0.0005, 0.0005);
  W.hCac.push(W.idx.cac); W.hImmo.push(W.idx.immo); W.hConso.push(W.idx.conso);
  if (W.hCac.length > 120) { W.hCac.shift(); W.hImmo.shift(); W.hConso.shift(); }
  if (W.t % 4 === 0) W.biz.forEach(b => { b.sante = clamp(b.sante + rnd(-1.4, 1.5), 20, 100); });
  if (W.t % 45 === 0) UI.buildTicker();

  /* marché des courses : prix dynamiques (promos / tensions) */
  if (!G.market || !G.market.until || now > G.market.until) {
    rollMarket();
    if (W.t > 5) UI.feed('<b>Marché :</b> les prix des courses viennent d’être mis à jour.');
  }
  /* usure des voitures */
  if (W.t % 3 === 0) G.cars.forEach(i => {
    G.carState[i] = clamp(num(G.carState[i], 100, 0, 100) - (0.05 + (G.jobs.length ? 0.03 : 0)), 5, 100);
  });
  /* historique de solde (graphiques) */
  G.histBal.push(balance());
  if (G.histBal.length > 120) G.histBal.shift();

  /* événements */
  if (now >= G.nextEvent) { G.nextEvent = now + rnd(100, 280) * 1000; fireEvent(); }
  if (G.boost && now > G.boost.until) G.boost = null;
  if (G.ill.heat > 0) G.ill.heat = Math.max(0, G.ill.heat - 0.06);

  /* IS (15 % du bénéfice cycle, chaque "mois") */
  if (W.t % 60 === 0) {
    const benef = G.biz.reduce((a, b) => a + Math.max(0, num(b.profit, 0)), 0);
    if (benef > 0.05) { const is = benef * 0.15; pay(is, 'IS 15 %', 'tax'); info.tax += is; info.chg += is; UI.toast('🏛 Impôt sur les sociétés −' + eur(is), 'warn'); }
    G.biz.forEach(b => b.profit = 0);
  }

  /* missions & quêtes */
  mission('cash', balance());
  if (G.missions.refreshAt && now > G.missions.refreshAt) { rollMissions(); UI.toast('🎯 Nouveaux défis disponibles !', 'good'); FX.sound('bell'); }
  if (!G.missions.list || !G.missions.list.length) rollMissions();
  if (G.quests.refreshAt && now > G.quests.refreshAt) { rollQuests(); UI.toast('📜 Nouvelles quêtes quotidiennes !', 'good'); FX.sound('bell'); }
  if (!G.quests.list || !G.quests.list.length) rollQuests();

  /* succès : vérification périodique légère */
  if (W.t % 10 === 0) maybeAch();

  G.tickInfo = info;
  T.hist.push(info.rev - info.chg); if (T.hist.length > 90) T.hist.shift();
  UI.tick();
  if (W.t % 5 === 0) save();
}

function boostMul(type) { return (G.boost && (G.boost.type === type || G.boost.type === 'toutes')) ? G.boost.mul : 1; }
function weatherMul(type) { return (curWeather().mul || {})[type] || 1; }

function tickBiz(b, bi, info, now, af) {
  let revTick = 0;
  const localMul = (b.boostUntil > now ? b.boostMul : 1) * (perk(b, 'fidelite') ? 1.08 : 1);
  const promoOn = b.promoUntil > now;

  if (b.type === 'boulangerie' || b.type === 'magasin') {
    const bt = DATA.bizTypes[b.type];
    if (b.type === 'magasin' && perk(b, 'autoRestock')) {
      bt.prods.forEach(p => {
        if ((b.stock[p.id] || 0) < 10 && balance() >= p.cost * 20) { pay(p.cost * 20, 'Réassort — ' + p.n, 'out'); b.stock[p.id] = (b.stock[p.id] || 0) + 20; }
      });
    }
    if (b.type === 'boulangerie') {
      /* pertes de fraîcheur chaque "jour" (60 ticks) */
      if (W.t % 60 === 0) {
        const rate = 0.15 * (1 - 0.5 * upLvl(b, 'frigo'));
        let lost = 0;
        bt.prods.forEach(pd => {
          const st = b.stock[pd.id] || 0;
          if (st > 0) { const l = Math.floor(st * rate); if (l > 0) { b.stock[pd.id] = st - l; lost += l; } }
        });
        if (lost > 0) { b.spoil = (b.spoil || 0) + lost; bizFeed(b, 'Pertes fraîcheur', -lost); }
      }
      const crafts = 1 + b.emps.length + upLvl(b, 'four');
      for (let k = 0; k < crafts; k++) {
        const rec = bt.prods[irnd(0, bt.prods.length - 1)];
        if (hasMats(b, rec)) { useMats(b, rec); b.stock[rec.id] = (b.stock[rec.id] || 0) + 1; }
      }
      if (!b.order && Math.random() < 0.012) {
        const p = bt.prods[irnd(0, bt.prods.length - 1)];
        const qty = irnd(10, 30);
        b.order = { p: p.id, pn: p.n, qty, reward: Math.round(p.ref * qty * 1.7), until: now + 120000 };
        UI.toast('📦 Commande spéciale : ' + qty + ' × ' + p.n + ' (' + eur(b.order.reward) + ')', 'good');
        FX.sound('bell');
      }
      if (b.order && now > b.order.until) b.order = null;
    }
    const mktMul = (1 + 0.15 * upLvl(b, 'mkt') + (b.type === 'magasin' ? 0.10 * upLvl(b, 'caisses') : 0)) * boostMul(b.type) * localMul * weatherMul(b.type) * (promoOn ? 1.8 : 1);
    const act = 0.85 + 0.3 * Math.sin(W.t / 70) + Math.random() * 0.3;
    const repF = 0.4 + b.rep / 80;
    const priceF = priceFactor(b) * (promoOn ? 1.12 : 1);
    const demand = Math.max(0, Math.round(bt.traffic * repF * priceF * act * mktMul * curSlot().m * rnd(0.5, 1.5) * (1 + b.emps.length * 0.08)));
    let sold = 0, rev = 0;
    for (let k = 0; k < demand; k++) {
      const p = pickProd(b);
      if ((b.stock[p.id] || 0) > 0) {
        b.stock[p.id]--;
        const unit = promoOn ? +(b.prices[p.id] * 0.9).toFixed(2) : b.prices[p.id];
        rev += unit; sold++; b.counters[p.id] = (b.counters[p.id] || 0) + 1;
        if (sold <= 3) bizFeed(b, 'Vente ' + p.n, unit);
        maybeSaleFeed(p.n, unit, b.name);
      } else b.rep = Math.max(5, b.rep - 0.05);
    }
    /* alerte stock épuisé (limitée à 1 / 90 s / entreprise) */
    const totalStock = bt.prods.reduce((a, p) => a + (b.stock[p.id] || 0), 0);
    if (demand > 0 && totalStock === 0 && now - (b.oosAt || 0) > 90000) {
      b.oosAt = now;
      UI.toast('📉 « ' + esc(b.name) + ' » : stock épuisé, les clients repartent !', 'warn');
      FX.sound('warn');
    }
    rev *= af;
    const repGain = (1 + 0.4 * upLvl(b, b.type === 'boulangerie' ? 'decor' : 'rayons')) * (perk(b, 'enseigne') ? 1.5 : 1) * skillBonus('rep');
    b.rep = clamp(b.rep + (sold ? 0.02 * sold * repGain : -0.03), 5, 100);
    if (rev > 0) { receive(rev, 'Ventes — ' + b.name, 'biz'); info.rev += rev; b.rev += rev; b.profit = num(b.profit, 0) + rev; revTick = rev; }
    G.stats.sales += sold; if (sold) mission('sell', sold);
    /* démarque : vols en rayon si pas de vidéosurveillance */
    const totalSt = bt.prods.reduce((a2, pd) => a2 + (b.stock[pd.id] || 0), 0);
    if (totalSt > 0 && Math.random() < 0.02 * (1 - 0.6 * upLvl(b, 'secu'))) {
      const pdv = pickProd(b);
      if (pdv && (b.stock[pdv.id] || 0) > 0) {
        const n = Math.min(b.stock[pdv.id], irnd(1, 2));
        b.stock[pdv.id] -= n; b.theft = (b.theft || 0) + n;
        bizFeed(b, 'Vols en rayon', -n);
      }
    }
    const wages = b.emps.reduce((a, e) => a + num(e.h, 0) / 60, 0);
    if (wages > 0) { pay(wages, 'Salaires — ' + b.name, 'out'); info.chg += wages; b.profit -= wages; b.wagesTotal += wages; }
  }
  else if (b.type === 'immobilier') {
    if (upLvl(b, 'vitrine') && W.t % 60 === 0) b.mandats = (b.mandats || 0) + upLvl(b, 'vitrine');
    let rev = (b.mandats || 0) * rnd(0.8, 2.2) * (1 + 0.25 * upLvl(b, 'reseau')) * (1 + 0.2 * upLvl(b, 'reno')) * (1 + 0.05 * b.emps.length) * localMul * boostMul('immobilier') * weatherMul('immobilier');
    rev *= af;
    if (rev > 0) { receive(rev, 'Commissions — ' + b.name, 'biz'); info.rev += rev; b.rev += rev; b.profit = num(b.profit, 0) + rev; revTick = rev; }
    const wages = b.emps.reduce((a, e) => a + num(e.h, 0) / 60, 0);
    if (wages > 0) { pay(wages, 'Salaires — ' + b.name, 'out'); info.chg += wages; b.profit -= wages; b.wagesTotal += wages; }
  }
  else if (b.type === 'banque') {
    const fees = b.accounts * (3 + 0.6 * upLvl(b, 'gab')) / 60 * (perk(b, 'fidelite') ? 1.1 : 1);
    const loanInc = b.loans * (b.tauxCredit + 0.5 * upLvl(b, 'trader')) / 100 / 3600 * (1 + 0.35 * upLvl(b, 'risque'));
    const depCost = b.deposits * b.tauxLivret / 100 / 3600;
    if (Math.random() < 0.05 + b.mkt * 0.012 + 0.02 * upLvl(b, 'app') + 0.01 * b.emps.length + (perk(b, 'pub') ? 0.03 : 0)) b.accounts += irnd(1, 3);
    b.deposits += b.accounts * rnd(0.4, 2.2);
    const dem = b.tauxCredit < 5 ? 1400 : (b.tauxCredit < 8 ? 750 : 220);
    b.loans += dem * Math.random();
    if (Math.random() < 0.008 * (1 + 0.5 * upLvl(b, 'risque')) * (1 - 0.25 * upLvl(b, 'secu'))) { const def = b.loans * rnd(0.005, 0.015); b.loans = Math.max(0, b.loans - def); bizFeed(b, 'Défaut de crédit', -def); }
    let net = (fees + loanInc - depCost) * af;
    if (net >= 0) { receive(net, 'PNB — ' + b.name, 'biz'); info.rev += net; revTick = net; }
    else { pay(-net, 'Charge — ' + b.name, 'out'); info.chg += -net; }
    b.rev += Math.max(0, net); b.profit = num(b.profit, 0) + net;
    const wages = b.emps.reduce((a, e) => a + num(e.h, 0) / 60, 0);
    if (wages > 0) { pay(wages, 'Salaires — ' + b.name, 'out'); info.chg += wages; b.profit -= wages; b.wagesTotal += wages; }
  }
  b.hist.push(revTick); if (b.hist.length > 60) b.hist.shift();
}

/* créneaux horaires (15 ticks chacun) : matin rush, midi creux, après-midi, soir */
const SLOTS = [
  { n: 'Matin (rush)', m: 1.3 }, { n: 'Midi', m: 0.9 }, { n: 'Après-midi', m: 1.1 }, { n: 'Soir', m: 1.25 }
];
function curSlot() { return SLOTS[Math.floor(W.t / 15) % 4]; }
function bizFeed(b, l, a) {
  if (!b.feed) b.feed = [];
  b.feed.push({ t: Date.now(), l, a });
  if (b.feed.length > 6) b.feed.shift();
}
function hasMats(b, rec) { return Object.entries(rec.in).every(([m, q]) => (b.mats[m] || 0) >= q); }
function useMats(b, rec) { Object.entries(rec.in).forEach(([m, q]) => b.mats[m] -= q); }
function priceFactor(b) {
  const bt = DATA.bizTypes[b.type];
  if (!bt || !bt.prods) return 1;
  let s = 0;
  bt.prods.forEach(p => { s += clamp(p.ref / (b.prices[p.id] || p.ref), 0.5, 1.4); });
  return s / bt.prods.length;
}
function pickProd(b) {
  const prods = DATA.bizTypes[b.type].prods;
  if (!prods || !prods.length) return null;
  const tot = prods.reduce((a, p) => a + p.w, 0); let r = Math.random() * tot;
  for (const p of prods) { r -= p.w; if (r <= 0) return p; }
  return prods[0];
}
function maybeSaleFeed(prod, prix, bizName) {
  const now = Date.now(); if (now - T.lastSaleFeed < 4000) return;
  T.lastSaleFeed = now;
  UI.feed('<b>' + esc(W.npcs[irnd(0, W.npcs.length - 1)].n) + '</b> achète « ' + esc(prod) + ' » à ' + esc(bizName) + ' <span class="money">+' + eur(prix) + '</span>');
}

function monthly(info) {
  if (G.rental) { pay(G.rental.loyer, 'Loyer', 'out'); info.chg += G.rental.loyer; }
  G.houses.forEach(h => { pay(num(h.c, 0), 'Charges — ' + (DATA.homes[h.i] ? DATA.homes[h.i].n : 'bien'), 'out'); info.chg += num(h.c, 0); });
  G.bank.loans = G.bank.loans.filter(L => {
    pay(L.mens, 'Crédit — ' + L.n, 'out'); info.chg += L.mens; L.reste -= L.mens;
    if (L.reste <= 0) { UI.toast('✅ Crédit « ' + esc(L.n) + ' » remboursé', 'good'); FX.sound('win'); maybeAch(); return false; }
    return true;
  });
  const rate = bankRate();
  if (G.bank.livret > 0 && rate > 0) { const i = G.bank.livret * rate / 100 / 12; G.bank.livret = Math.min(22950, G.bank.livret + i); pushJ('Intérêts Livret A', i, 'in'); }
  if (G.bank.cardPremium && G.bank.compte > 0) { const ip = G.bank.compte * 0.005 / 12; G.bank.compte += ip; pushJ('Intérêts compte Premium', ip, 'in'); }
  G.insurances.forEach(id => { const a = DATA.insurers.find(x => x.id === id); if (!a) return; pay(a.m, 'Assurance — ' + a.n, 'out'); info.chg += a.m; });
  const emp = G.biz.reduce((a, b) => a + b.emps.length, 0);
  if (emp > 0) { const u = emp * 45; pay(u, 'URSSAF', 'tax'); info.chg += u; info.tax += u; G.stats.tax += u; }
}

function fireEvent() {
  let pool = DATA.events.filter(e => { try { return !e.ok || e.ok(); } catch (err) { return false; } });
  if (!pool.length) pool = DATA.events.filter(e => !e.ok);
  if (!pool.length) return;
  const e = pool[irnd(0, pool.length - 1)];
  let delta = '';
  try { delta = e.f(); } catch (err) { UI.reportError(err, 'event'); return; }
  G.stats.events++;
  UI.toast(e.m + ' <span class="toast-amt">(' + esc(delta) + ')</span>', e.t === 'good' ? 'good' : 'warn');
  UI.feed('<b>Événement :</b> ' + esc(e.m) + ' <span class="money">' + esc(delta) + '</span>');
  UI.eventFx(e.t);
  FX.sound(e.t === 'good' ? 'win' : 'warn');
  if (e.t === 'good') UI.confetti();
  if (T.tab === 'sante') refresh();
  maybeAch();
}

function hospital() {
  let c = 800 * (1 - cov());
  pay(c, 'Hospitalisation', 'out');
  G.vitals = { sante: 35, faim: 70, soif: 65 };
  UI.screenShake(); FX.sound('jail');
  UI.toast('🚑 Hospitalisation −' + eur(c) + ' — pensez à manger et boire !', 'bad');
}

/* ═══════════ ACTIONS ═══════════ */
const A = {
  tab(d) { UI.setTab(d.id); },
  authTab(d) { UI.authTab(d.t); },

  openSendMoney() { UI.openSendMoney(); },
  doSendMoney() { UI.doSendMoney(); },
  openAnnounce() { UI.openAnnounce(); },
  doAnnounce() { UI.doAnnounce(); },
  openAdmin() { UI.openAdmin(); },
  adminDo(d) { UI.adminDo(d); },
  openSettings() { UI.openSettings(); },
  openHelp() { UI.openHelp(); },
  toggleSetting(d) {
    const s = loadSettings();
    const k = d.k;
    if (!(k in s)) return;
    s[k] = !s[k];
    saveSettings(s); FX.configure(s);
    FX.sound('click');
    if (k === 'sound' && s.sound) FX.sound('bell');
    // la modale réglages se rafraîchit elle-même ; sinon simple render silencieux
    if (document.querySelector('#modalRoot .set-row')) UI.openSettings();
    else UI.render(true);
  },
  setBankAmt(d) {
    if (!G) return;
    const isLoan = d.of === 'loan';
    const inp = document.getElementById(isLoan ? 'loanAmt' : 'bankAmt');
    if (!inp) return;
    let v = 0;
    if (d.v === 'max') {
      if (d.of === 'cash') v = G.cash;
      else if (d.of === 'compte') v = G.bank.compte;
      else if (d.of === 'livretCap') v = Math.max(0, Math.min(G.bank.compte, 22950 - G.bank.livret));
      else if (d.of === 'livret') v = G.bank.livret;
      else v = Math.max(0, Math.min(G.cash, G.bank.compte));
      v = Math.floor(v * 100) / 100;
    } else v = Math.floor(num(d.v, 0, 0, 1e9));
    inp.value = v > 0 ? String(v).replace('.', ',') : '';
    inp.focus();
    FX.sound('click');
  },
  journalF(d) { T.journalF = d.f || 'all'; FX.sound('click'); refresh(); },
  shopSel(d) {
    T.shopSel = { kind: d.kind || 'npc', id: d.id || 'superu', owner: d.owner || '' };
    FX.sound('click');
    refresh();
  },

  claimDaily() {
    if (!canClaimDaily()) return UI.toast('Récompense déjà réclamée aujourd’hui. Revenez demain !', 'warn');
    const yd = dayKey(Date.now() - 86400000);
    G.daily.streak = (G.daily.lastDay === yd) ? (G.daily.streak || 0) + 1 : 1;
    G.daily.lastDay = dayKey();
    const r = DATA.daily[Math.min(DATA.daily.length, G.daily.streak) - 1];
    receive(r.amt, 'Récompense quotidienne J' + G.daily.streak, 'in');
    addXp(r.xp);
    UI.confetti(); FX.sound('win');
    UI.toast('📅 Jour ' + G.daily.streak + ' : +' + eur(r.amt) + ' · +' + r.xp + ' XP', 'good');
    save(); maybeAch(); refresh();
  },

  buyFood(d) {
    const f = foodById(d.id); if (!f) return;
    if (!guardCardPay()) return;
    const q = clamp(Math.floor(num(d.q, 1, 1, 99)), 1, 99);
    const sel = T.shopSel || { kind: 'npc', id: 'superu', owner: '' };
    const kind = d.shopKind || sel.kind;
    if (!d.shopRef && sel.id) { d = Object.assign({}, d, { shopRef: sel.id, owner: sel.owner }); }

    /* achat chez un AUTRE joueur : le serveur fait foi (stock + prix du vendeur) */
    if (kind === 'player') {
      if (DB.mode() !== 'api') return UI.toast('Achats entre joueurs : mode serveur uniquement.', 'warn');
      UI.toast('⏳ Commande transmise au magasin…', '');
      DB.authFetch('/api/buyShop', { method: 'POST', body: JSON.stringify({ owner: d.owner, idx: +d.shopRef, food: f.id, q }) }).then(j => {
        if (j && j.ok) { FX.sound('buy'); UI.toast('🛒 Commande acceptée : débit et livraison automatiques.', 'good'); }
        else { FX.sound('error'); UI.toast((j && j.err) || 'Magasin indisponible.', 'bad'); }
      }).catch(() => { FX.sound('error'); UI.toast('Serveur injoignable.', 'bad'); });
      return;
    }

    /* PNJ ou mon propre magasin */
    let unit = effPrice(f), shopName = null, selfBiz = null;
    if (kind === 'self') {
      const i = idxOk(d.shopRef, G.biz.length);
      selfBiz = i >= 0 ? G.biz[i] : null;
      if (!selfBiz || selfBiz.type !== 'magasin') return UI.toast('Magasin introuvable.', 'bad');
      if (!selfBiz.grocery) selfBiz.grocery = { margin: 0.10, stock: 0 };
      if (selfBiz.grocery.stock < q) { FX.sound('error'); return UI.toast('Votre rayon épicerie est vide : réassortez-le (onglet Production).', 'warn'); }
      unit = +(f.p * (1 + num(selfBiz.grocery.margin, 0.10, -0.5, 1))).toFixed(2);
      shopName = selfBiz.name;
    } else {
      const npc = DATA.shopsNPC.find(x => x.id === (d.shopRef || 'superu')) || DATA.shopsNPC[0];
      unit = +(effPrice(f) * npc.mult).toFixed(2);
      shopName = npc.n;
    }
    const cost = +(unit * q).toFixed(2);
    if (balance() < cost) { FX.sound('error'); return UI.toast('Solde insuffisant : ' + eur(cost) + ' requis.', 'bad'); }
    pay(cost, 'Courses — ' + f.n + (q > 1 ? ' ×' + q : '') + ' (' + shopName + ')', 'food');
    G.stats.spent += cost;
    if (selfBiz) {
      selfBiz.grocery.stock -= q;
      selfBiz.rev = num(selfBiz.rev, 0) + cost; selfBiz.profit = num(selfBiz.profit, 0) + cost;
      bizFeed(selfBiz, 'Vente épicerie (vous)', cost);
    }
    G.inv[d.id] = (G.inv[d.id] || 0) + q;
    mission('shop', q); addXp(2 * q);
    FX.sound('buy');
    UI.toast(f.ico + ' ' + f.n + (q > 1 ? ' ×' + q : '') + ' · ' + esc(shopName) + ' (−' + eur(cost) + ')', 'good');
    refresh();
  },
  setMargin(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'magasin') return;
    if (!b.grocery) b.grocery = { margin: 0.10, stock: 0 };
    b.grocery.margin = clamp(+(num(b.grocery.margin, 0.10) + num(d.v, 0)).toFixed(2), -0.5, 1);
    FX.sound('click');
    UI.toast('Marge épicerie : ' + Math.round(b.grocery.margin * 100) + ' %', 'good');
    refresh();
  },
  restockGrocery(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'magasin') return;
    if (!b.grocery) b.grocery = { margin: 0.10, stock: 0 };
    const q = clamp(Math.floor(num(d.q, 50, 1, 5000)), 1, 5000);
    const cost = +(q * 2.2 * (1 - 0.12 * upLvl(b, 'fourn'))).toFixed(2);
    if (balance() < cost) { FX.sound('error'); return UI.toast('Fonds insuffisants : ' + eur(cost) + '.', 'bad'); }
    pay(cost, 'Réassort épicerie (' + q + ')', 'biz');
    b.grocery.stock += q;
    FX.sound('craft');
    UI.toast('Rayon épicerie réassorti : +' + q + ' (−' + eur(cost) + ')', 'good');
    refresh();
  },
  eat(d, el) {
    const f = foodById(d.id); if (!f) return;
    if ((G.inv[d.id] || 0) <= 0) { FX.sound('error'); return UI.toast('Vous n’en avez plus.', 'warn'); }
    if (el && el.closest) { const card = el.closest('.inv-card'); if (card) { card.classList.add('chomp'); FX.spark && sparkAt(card); } }
    G.inv[d.id]--;
    if (G.inv[d.id] <= 0) delete G.inv[d.id];
    const before = G.vitals.faim;
    G.vitals.faim = clamp(G.vitals.faim + f.f, 0, 200);
    G.vitals.soif = clamp(G.vitals.soif + f.s, 0, 100);
    mission('eat', 1); addXp(2);
    FX.sound('eat');
    if (f.f > 0) { UI.floatText('+' + f.f + ' Faim', 'var(--orange)'); UI.pulseVital('rowFaim'); }
    else if (f.f < 0) UI.floatText(f.f + ' Faim', 'var(--red)');
    if (f.s > 0) { UI.floatText('+' + f.s + ' Soif', 'var(--blue)'); UI.pulseVital('rowSoif'); }
    else if (f.s < 0) { UI.floatText(f.s + ' Soif', 'var(--red)'); UI.pulseVital('rowSoif'); }
    if (before <= 100 && G.vitals.faim > 140 && Math.random() < 0.35) { G.health.sick = true; UI.toast('🤢 Trouble alimentaire : trop mangé ! Consultez un médecin.', 'bad'); FX.sound('error'); }
    setTimeout(() => refresh(), 380);
  },

  train(d) {
    if (G.training) return UI.toast('Formation déjà en cours.', 'warn');
    const f = DATA.form.find(x => x.id === d.id); if (!f || G.diplomas.includes(d.id)) return;
    if (balance() < f.cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    payFlow(f.cost, 'Formation — ' + f.n, 'trainExec', d);
  },
  trainExec(d) {
    const f = DATA.form.find(x => x.id === d.id); if (!f || G.training) return;
    if (balance() < f.cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    if (f.cost > 0) { pay(f.cost, 'Formation — ' + f.n, 'out'); G.stats.spent += f.cost; }
    G.training = { id: f.id, end: Date.now() + f.dur * 1000 };
    FX.sound('buy');
    UI.toast('📚 Formation commencée : ' + f.n + ' (' + f.dur + ' s)', 'good'); refresh();
  },
  jobSec(d) { T.jobF.sec = d.v || ''; refresh(); },
  jobOk() { T.jobF.ok = !T.jobF.ok; refresh(); },
  offer(d) {
    const c = idxOk(d.c, DATA.companies.length); if (c < 0) return;
    const comp = DATA.companies[c];
    const o = idxOk(d.o, comp.o.length); if (o < 0) return;
    const job = comp.o[o];
    if (playerTier() < job[2]) return UI.toast('Diplôme insuffisant pour ce poste.', 'bad');
    if (totalLoad() >= 1) return UI.toast('Charge de travail à 100 %.', 'bad');
    T.offer = { c, o };
    T.offerMode = canTake('plein') ? 'plein' : 'partiel';
    FX.sound('click');
    offerModal();
  },
  pickMode(d) { if (!canTake(d.m)) return UI.toast('Charge de travail insuffisante.', 'warn'); T.offerMode = d.m; FX.sound('click'); offerModal(); },
  sign() {
    if (!T.offer) return;
    const c = idxOk(T.offer.c, DATA.companies.length); if (c < 0) { T.offer = null; return; }
    const comp = DATA.companies[c];
    const o = idxOk(T.offer.o, comp.o.length); if (o < 0) { T.offer = null; return; }
    const mode = T.offerMode;
    if (!canTake(mode)) return UI.toast('Charge dépassée.', 'bad');
    const job = comp.o[o];
    G.jobs.push({ c, o, title: job[0], h: job[1], mode, since: Date.now(), mins: 0, promo: false });
    T.offer = null;
    addXp(30); UI.closeModal();
    UI.confetti(); FX.sound('win');
    UI.toast('✍️ Contrat signé : ' + esc(job[0]) + ' chez ' + esc(comp.n), 'good');
    save(); maybeAch();
    UI.updateTop(); refresh();
  },
  quitJob(d) {
    const i = idxOk(d.i, G.jobs.length); if (i < 0) return;
    const j = G.jobs[i];
    G.jobs.splice(i, 1);
    FX.sound('back');
    UI.toast('Contrat rompu : ' + esc(j.title), 'warn');
    UI.updateTop(); refresh();
  },

  openCreate(d) {
    const bt = DATA.bizTypes[d.type]; if (!bt) return;
    if (bt.req && !G.diplomas.includes(bt.req)) return UI.toast('Formation requise : ' + esc((DATA.form.find(f => f.id === bt.req) || {}).n || ''), 'bad');
    if (balance() < bt.cost) { FX.sound('error'); return UI.toast('Capital insuffisant (' + eur(bt.cost) + ' requis).', 'bad'); }
    UI.modal('<h2>Fonder ' + esc(bt.label.toLowerCase()) + '</h2><div class="m-sub">Capital : ' + eur(bt.cost) + (bt.req ? ' · Diplôme requis obtenu ✓' : '') + '</div>' +
      '<label class="m-field">Nom de l’entreprise<input id="bizName" class="mini m-wide" maxlength="40" value="' + esc(bt.label + ' ' + G.name) + '"></label>' +
      '<div class="m-hint">La réputation démarre à 50/100. Pensez à recruter et à faire du marketing !</div>' +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Annuler</button>' +
      '<button class="btn btn-primary" data-act="createBiz" data-type="' + d.type + '">Fonder</button></div>');
  },
  createBiz(d) {
    const bt = DATA.bizTypes[d.type]; if (!bt) return UI.closeModal();
    if (bt.req && !G.diplomas.includes(bt.req)) { UI.closeModal(); return UI.toast('Formation requise.', 'bad'); }
    if (balance() < bt.cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    if (G.biz.length >= 8) return UI.toast('Maximum 8 entreprises.', 'warn');
    payFlow(bt.cost, 'Capital — ' + bt.label, 'createBizExec', d);
  },
  createBizExec(d) {
    const bt = DATA.bizTypes[d.type]; if (!bt) return UI.closeModal();
    if (balance() < bt.cost) { FX.sound('error'); UI.closeModal(); return UI.toast('Fonds insuffisants.', 'bad'); }
    if (G.biz.length >= 8) { UI.closeModal(); return UI.toast('Maximum 8 entreprises.', 'warn'); }
    const inp = document.getElementById('bizName');
    const name = ((inp && inp.value) || bt.label).trim().slice(0, 40) || bt.label;
    pay(bt.cost, 'Capital — ' + bt.label, 'out'); G.stats.spent += bt.cost;
    const b = sanitizeBiz({ type: d.type, name });
    G.biz.push(b); addXp(80);
    UI.closeModal(); UI.confetti(); FX.sound('win');
    UI.toast('🎉 ' + esc(bt.label) + ' « ' + esc(name) + ' » fondée !', 'good');
    save(); maybeAch();
    T.selBiz = G.biz.length - 1; T.bizTab = 'overview'; refresh();
  },
  selBiz(d) { const i = idxOk(d.i, G.biz.length); if (i < 0) return; T.selBiz = i; T.bizTab = 'overview'; FX.sound('click'); UI.render(); },
  backBiz() { T.selBiz = -1; FX.sound('back'); UI.render(); },
  bizTab(d) { if (!['overview', 'prod', 'mkt', 'hr', 'ups', 'compta'].includes(d.t)) return; T.bizTab = d.t; FX.sound('click'); UI.render(); },
  bizAt(d) { const i = idxOk(d.b, G.biz.length); return i >= 0 ? G.biz[i] : null; },

  buyMat(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'boulangerie') return;
    if (!guardCardPay()) return;
    const m = DATA.bizTypes.boulangerie.mats[d.m]; if (!m) return;
    const q = clamp(Math.floor(num(d.q, 10, 1, 10000)), 1, 10000);
    const cost = +(m.p * q * skillBonus('upgrade')).toFixed(2);
    if (balance() < cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(cost, 'Matières — ' + m.n, 'biz'); G.stats.spent += cost;
    b.mats[d.m] = num(b.mats[d.m], 0) + q;
    FX.sound('craft');
    UI.toast('+' + q + ' × ' + m.n, 'good'); refresh();
  },
  craft(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'boulangerie') return;
    const rec = DATA.bizTypes.boulangerie.prods.find(p => p.id === d.p); if (!rec) return;
    const q = clamp(Math.floor(num(d.q, 1, 1, 1000)), 1, 1000);
    let made = 0;
    for (let i = 0; i < q; i++) { if (!hasMats(b, rec)) break; useMats(b, rec); b.stock[rec.id] = (b.stock[rec.id] || 0) + 1; made++; }
    if (!made) { FX.sound('error'); UI.toast('Matières premières insuffisantes.', 'warn'); return; }
    FX.sound('craft');
    UI.toast('🥖 ' + made + ' × ' + rec.n + ' enfourné' + (made > 1 ? 's' : ''), 'good');
    refresh();
  },
  priceAdj(d) {
    const b = A.bizAt(d); if (!b || !b.prices || !(d.p in b.prices)) return;
    b.prices[d.p] = clamp(+(num(b.prices[d.p], 1) + num(d.v, 0)).toFixed(2), 0.1, 999);
    FX.sound('click');
    refresh();
  },
  buyStock(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'magasin') return;
    if (!guardCardPay()) return;
    const p = DATA.bizTypes.magasin.prods.find(x => x.id === d.p); if (!p) return;
    const q = clamp(Math.floor(num(d.q, 10, 1, 10000)), 1, 10000);
    const cost = +(p.cost * q).toFixed(2);
    if (balance() < cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(cost, 'Grossiste — ' + p.n, 'biz'); G.stats.spent += cost;
    b.stock[p.id] = (b.stock[p.id] || 0) + q;
    FX.sound('craft');
    UI.toast('+' + q + ' × ' + p.n, 'good'); refresh();
  },
  upgrade(d) {
    const b = A.bizAt(d); if (!b) return;
    if (!guardCardPay()) return;
    const u = (DATA.ups[b.type] || []).find(x => x.id === d.u); if (!u) return;
    const lvl = upLvl(b, u.id);
    if (lvl >= u.max) return UI.toast('Niveau maximum atteint.', 'warn');
    const cost = Math.round(u.cost * Math.pow(u.grow, lvl) * skillBonus('upgrade'));
    if (balance() < cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(cost, 'Upgrade — ' + u.n, 'biz'); b.ups[u.id] = lvl + 1; addXp(25);
    UI.confetti(); FX.sound('win');
    UI.toast('⬆ ' + u.n + ' niveau ' + (lvl + 1) + '/' + u.max, 'good');
    save(); refresh();
  },
  mktDo(d) {
    const b = A.bizAt(d); if (!b) return;
    if (!guardCardPay()) return;
    const a = (DATA.mkt[b.type] || []).find(x => x.id === d.a); if (!a) return;
    if (a.once && perk(b, a.perk)) return UI.toast('Déjà actif.', 'warn');
    if (balance() < a.cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(a.cost, 'Marketing — ' + a.n, 'biz');
    if (a.kind === 'boost') { b.boostUntil = Date.now() + a.dur * 1000; b.boostMul = a.mul; if (a.rep) b.rep = clamp(b.rep + a.rep, 5, 100); UI.toast('📣 ' + a.n + ' : ×' + a.mul + ' / ' + a.dur + ' s', 'good'); UI.confetti(); FX.sound('win'); }
    else if (a.kind === 'promo') { b.promoUntil = Date.now() + a.dur * 1000; UI.toast('⚡ Vente flash : -10 % ×1,8 / ' + a.dur + ' s', 'good'); FX.sound('win'); }
    else if (a.kind === 'perk') { b.perks[a.perk] = true; if (a.rep) b.rep = clamp(b.rep + a.rep, 5, 100); UI.toast('✓ ' + a.n + ' activé en permanence', 'good'); FX.sound('win'); }
    else if (a.kind === 'accounts') { b.accounts += 25; UI.toast('✓ +25 comptes clients', 'good'); FX.sound('win'); }
    addXp(15); save(); refresh();
  },
  orderFill(d) {
    const b = A.bizAt(d); if (!b) return;
    const o = b.order;
    if (!o) return UI.toast('Aucune commande en attente.', 'warn');
    if ((b.stock[o.p] || 0) < o.qty) { FX.sound('error'); return UI.toast('Stock insuffisant : ' + (b.stock[o.p] || 0) + '/' + o.qty + '.', 'bad'); }
    b.stock[o.p] -= o.qty;
    receive(o.reward, 'Commande — ' + o.pn, 'biz');
    b.rep = clamp(b.rep + 2, 5, 100); b.order = null;
    G.stats.orders = num(G.stats.orders, 0) + 1; addXp(20);
    UI.toast('📦 Commande honorée +' + eur(o.reward) + ' (+2 réputation)', 'good');
    UI.confetti(); FX.sound('cash');
    save(); maybeAch(); refresh();
  },
  hire(d) {
    const b = A.bizAt(d); if (!b) return;
    const max = (DATA.bizTypes[b.type] || {}).maxEmp || 4;
    if (b.emps.length >= max) return UI.toast('Effectif complet (' + max + ').', 'warn');
    T.cands = Array.from({ length: 4 }, () => ({ n: W.npcs[irnd(0, W.npcs.length - 1)].n, h: +rnd(12, 20).toFixed(1) }));
    UI.modal('<h2>Recruter — ' + esc(b.name) + '</h2><div class="m-sub">4 candidats se présentent. Salaire horaire négocié.</div>' +
      T.cands.map((c, i) => '<div class="rowline cand-row"><div class="cand-ava">' + esc(c.n.split(' ').map(x => x[0]).join('').slice(0, 2)) + '</div><div style="flex:1"><div class="lbl">' + esc(c.n) + '</div><div class="det">' + eur(c.h) + '/h · motivé·e</div></div>' +
        '<button class="btn btn-primary btn-sm" data-act="hireConfirm" data-b="' + d.b + '" data-i="' + i + '">Embaucher</button></div>').join('') +
      '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Fermer</button></div>');
  },
  hireConfirm(d) {
    const b = A.bizAt(d); if (!b) return UI.closeModal();
    const c = T.cands && T.cands[idxOk(d.i, (T.cands || []).length)]; if (!c) return;
    const max = (DATA.bizTypes[b.type] || {}).maxEmp || 4;
    if (b.emps.length >= max) return UI.toast('Effectif complet.', 'warn');
    b.emps.push({ n: c.n, h: c.h });
    UI.closeModal(); FX.sound('win');
    UI.toast('🤝 ' + esc(c.n) + ' rejoint l’équipe !', 'good');
    save(); refresh();
  },
  fire(d) {
    const b = A.bizAt(d); if (!b) return;
    const i = idxOk(d.i, b.emps.length); if (i < 0) return;
    const e = b.emps.splice(i, 1)[0];
    FX.sound('back');
    UI.toast((e ? esc(e.n) : 'Salarié') + ' a quitté l’entreprise.', 'warn'); refresh();
  },
  buyMandat(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'immobilier') return;
    if (!guardCardPay()) return;
    if (balance() < 300) { FX.sound('error'); return UI.toast('300 € requis par mandat.', 'bad'); }
    pay(300, 'Mandat de vente', 'biz'); b.mandats = num(b.mandats, 0) + 1;
    FX.sound('buy');
    UI.toast('🖊 Mandat signé (' + b.mandats + ' en portefeuille)', 'good'); refresh();
  },
  bankAdj(d) {
    const b = A.bizAt(d); if (!b || b.type !== 'banque') return;
    if (d.k === 'tc') b.tauxCredit = clamp(num(b.tauxCredit, 6) + num(d.v, 0), 1, 12);
    else if (d.k === 'tl') b.tauxLivret = clamp(num(b.tauxLivret, 2) + num(d.v, 0), 0, 5);
    else if (d.k === 'mkt') {
      if (balance() < 1000) { FX.sound('error'); return UI.toast('1 000 € requis par campagne.', 'bad'); }
      pay(1000, 'Campagne pub banque', 'biz'); b.mkt = num(b.mkt, 1, 0, 1000) + 1;
      UI.toast('📺 Campagne de recrutement lancée', 'good'); FX.sound('buy');
    }
    FX.sound('click');
    refresh();
  },

  buyHome(d) {
    const i = idxOk(d.i, DATA.homes.length); if (i < 0) return;
    const h = DATA.homes[i];
    if (balance() < h.p) { FX.sound('error'); return UI.toast('Apport insuffisant.', 'bad'); }
    payFlow(h.p, 'Achat — ' + h.n, 'buyHomeExec', d);
  },
  buyHomeExec(d) {
    const i = idxOk(d.i, DATA.homes.length); if (i < 0) return;
    const h = DATA.homes[i];
    if (balance() < h.p) { FX.sound('error'); return UI.toast('Apport insuffisant.', 'bad'); }
    pay(h.p, 'Achat — ' + h.n, 'out'); G.stats.spent += h.p;
    G.houses.push({ i, v: h.p, c: h.c, rent: +(h.p * 0.004 / 60).toFixed(2), tenant: false });
    addXp(60); UI.confetti(); FX.sound('win');
    UI.toast('🏠 Propriétaire : ' + esc(h.n), 'good');
    save(); maybeAch(); refresh();
  },
  rentHome(d) {
    const i = idxOk(d.i, DATA.rentals.length); if (i < 0) return;
    if (G.rental) return UI.toast('Vous avez déjà un bail en cours.', 'warn');
    G.rental = { i, loyer: DATA.rentals[i].loyer };
    FX.sound('buy');
    UI.toast('🔑 Bail signé : ' + esc(DATA.rentals[i].n) + ' (' + eur(DATA.rentals[i].loyer) + '/mois)', 'good');
    save(); refresh();
  },
  cancelRent() {
    if (!G.rental) return;
    G.rental = null; FX.sound('back');
    UI.toast('Bail résilié. Vous voilà sans domicile…', 'warn'); refresh();
  },
  sellHome(d) {
    const i = idxOk(d.i, G.houses.length); if (i < 0) return;
    const h = G.houses[i];
    const prix = num(h.v, 0) * 0.95;
    receive(prix, 'Vente — ' + (DATA.homes[h.i] ? DATA.homes[h.i].n : 'bien'), 'in');
    G.houses.splice(i, 1);
    UI.confetti(); FX.sound('cash');
    UI.toast('🏷 Bien vendu +' + eur(prix), 'good');
    save(); refresh();
  },
  rentOut(d) {
    const i = idxOk(d.i, G.houses.length); if (i < 0) return;
    const h = G.houses[i];
    if (h.tenant) { h.tenant = false; FX.sound('back'); UI.toast('Congé donné au locataire.', 'warn'); }
    else { h.tenant = true; h.rent = +(num(h.v, 0) * 0.004 / 60).toFixed(2); FX.sound('buy'); UI.toast('🔑 Bien mis en location (+' + eur(h.rent) + ' / min)', 'good'); maybeAch(); }
    refresh();
  },

  buyCar(d) {
    const i = idxOk(d.i, DATA.cars.length); if (i < 0) return;
    const c = DATA.cars[i];
    if (G.cars.includes(i)) return UI.toast('Vous possédez déjà ce modèle.', 'warn');
    if (balance() < c.p) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    payFlow(c.p, 'Achat — ' + c.n, 'buyCarExec', d);
  },
  buyCarExec(d) {
    const i = idxOk(d.i, DATA.cars.length); if (i < 0 || G.cars.includes(i)) return;
    const c = DATA.cars[i];
    if (balance() < c.p) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(c.p, 'Achat — ' + c.n, 'out'); G.stats.spent += c.p; G.cars.push(i); addXp(40);
    UI.confetti(); FX.sound('win');
    UI.toast('🚗 ' + esc(c.n) + ' livrée ! Productivité +' + Math.round(c.b * 100) + ' %', 'good');
    save(); maybeAch(); refresh();
  },
  sellCar(d) {
    const i = idxOk(d.i, DATA.cars.length); if (i < 0 || !G.cars.includes(i)) return;
    const c = DATA.cars[i];
    const st = carState(i);
    const prix = Math.round(c.p * 0.6 * (0.55 + 0.45 * st / 100));
    G.cars = G.cars.filter(x => x !== i);
    delete G.carState[i];
    receive(prix, 'Revente — ' + c.n, 'in');
    FX.sound('cash');
    UI.toast(c.n + ' revendue +' + eur(prix) + ' (état ' + Math.round(st) + ' %)', 'good'); refresh();
  },
  serviceCar(d) {
    const i = idxOk(d.i, DATA.cars.length); if (i < 0 || !G.cars.includes(i)) return;
    const c = DATA.cars[i];
    const st = carState(i);
    if (st >= 99) return UI.toast('Véhicule déjà en parfait état.', 'warn');
    const cost = Math.max(120, Math.round(c.p * 0.006 * (1 - st / 100) * 4) + 120);
    if (balance() < cost) { FX.sound('error'); return UI.toast('Révision à ' + eur(cost) + ' : solde insuffisant.', 'bad'); }
    pay(cost, 'Révision — ' + c.n, 'out');
    G.carState[i] = 100;
    FX.sound('craft');
    UI.toast('🔧 ' + c.n + ' révisée : état 100 % (−' + eur(cost) + ')', 'good');
    refresh();
  },
  sport() {
    const now = Date.now();
    if (now < num(G.sportCd, 0)) return UI.toast('Reprenez votre souffle : encore ' + Math.ceil((num(G.sportCd, 0) - now) / 1000) + ' s.', 'warn');
    G.sportCd = now + 90000;
    G.vitals.sante = clamp(G.vitals.sante + 4, 0, 100);
    G.vitals.faim = Math.max(0, G.vitals.faim - 4);
    G.vitals.soif = Math.max(0, G.vitals.soif - 4);
    UI.pulseVital('rowSante');
    UI.floatText('+4 Santé', 'var(--green)');
    FX.sound('craft');
    addXp(3);
    UI.toast('🏃 Séance de sport : +4 santé (faim/soif −4)', 'good');
    refresh();
  },
  negotiate(d) {
    const i = idxOk(d.i, G.jobs.length); if (i < 0) return;
    const j = G.jobs[i];
    const now = Date.now();
    if (now < num(j.negAt, 0)) return UI.toast('Votre employeur refuse de renégocier avant ' + Math.ceil((num(j.negAt, 0) - now) / 1000) + ' s.', 'warn');
    const chance = 0.30 + 0.06 * skillLvl('s_rep') + Math.min(0.25, num(j.mins, 0) / 2400);
    if (Math.random() < chance) {
      const old = j.h;
      j.h = +(j.h * 1.08).toFixed(2);
      j.negAt = now + 300000;
      UI.confetti(); FX.sound('win');
      UI.toast('💼 Négociation réussie : ' + eur(old) + ' → ' + eur(j.h) + ' brut/h !', 'good');
      addXp(10);
    } else {
      j.negAt = now + 120000;
      FX.sound('back');
      UI.toast('Refus de l’employeur. Retentez dans 2 min (' + Math.round(chance * 100) + ' % de chances).', 'warn');
    }
    UI.updateTop(); refresh();
  },

  openBank(d) {
    const known = DATA.banks.find(b => b.id === d.id);
    if (!known && !isPlayerBank(d.id)) return UI.toast('Banque inconnue.', 'bad');
    if (G.bank.bankId === d.id) return UI.toast('Vous êtes déjà client de cette banque.', 'warn');
    const switching = !!G.bank.bankId;
    G.bank.bankId = d.id;
    G.bank.bankName = (d.name || (known ? known.n : 'Banque')).slice(0, 60);
    G.bank.playerRate = isPlayerBank(d.id) ? clamp(num(parseFloat(d.rate), 2, 0, 5), 0, 5) : null;
    ensureCards();
    if (G.cash > 0) { G.bank.compte += G.cash; pushJ('Versement initial', G.cash, 'bank'); G.cash = 0; }
    UI.closeModal();
    UI.cardFx(switching ? 'Transfert de compte' : 'Ouverture de compte', eur(G.bank.compte));
    FX.sound('cash');
    UI.toast(switching ? '🏦 Compte transféré : ' + esc(G.bank.bankName) + ' (avoirs conservés)' : '🏦 Compte ouvert : ' + esc(G.bank.bankName), 'good');
    save(); maybeAch(); refresh();
  },
  leaveBank() {
    if (!G.bank.bankId) return UI.toast('Aucun compte à clôturer.', 'warn');
    const total = G.bank.compte + G.bank.livret;
    G.cash += total; pushJ('Clôture de compte', total, 'bank');
    G.bank = { bankId: null, bankName: null, playerRate: null, compte: 0, livret: 0, loans: G.bank.loans, cardCb: { plafond: num(G.bank.cardCb && G.bank.cardCb.plafond, 2000, 100, 20000), frozen: false }, cardLivret: { frozen: false }, cardPremium: false };
    UI.cardFx('Compte clôturé', '+' + eur(total));
    FX.sound('back');
    UI.toast('Compte clôturé, ' + eur(total) + ' récupérés en liquide.', 'warn');
    save(); refresh();
  },
  bankDetails(d) { UI.bankDetails(d); },
  _amt() { return Math.round(parseAmount(((document.getElementById('bankAmt') || {}).value)) * 100) / 100; },
  _termAmt() { return Math.round(parseAmount(((document.getElementById('termAmt') || document.getElementById('bankAmt') || {}).value)) * 100) / 100; },
  moveMoney(d) {
    const ok = moveMoneyWith(d.from, d.to, A._termAmt());
    if (ok) {
      const LBL = { cash: 'liquide', compte: 'compte', livret: 'Livret A' };
      UI.cardFx(LBL[d.from] + ' → ' + LBL[d.to], eur(A._termAmt()));
      FX.sound('cash');
      UI.toast('✓ Virement effectué : ' + LBL[d.from] + ' → ' + LBL[d.to], 'good');
      UI.termReceipt && UI.termReceipt(LBL[d.from] + ' → ' + LBL[d.to], A._termAmt());
      refresh();
    } else UI.termRefresh && UI.termRefresh();
  },
  sendToPlayer(d) {
    const to = String(d.to || ((document.getElementById('termTo') || {}).value || '')).trim();
    const v = Math.floor(num(d.v, parseAmount(((document.getElementById('termAmt') || {}).value)), 0, 1e12));
    if (!G.bank.bankId) { FX.sound('error'); return UI.toast('Ouvrez d’abord un compte.', 'warn'); }
    if (!to) { FX.sound('error'); return UI.toast('Entrez le pseudo du destinataire.', 'warn'); }
    if (!(v > 0)) { FX.sound('error'); return UI.toast('Montant invalide.', 'warn'); }
    if (cardFrozen('cb')) { FX.sound('error'); return UI.toast('💳 Carte bleue gelée : envoi impossible.', 'warn'); }
    if (v > cardPlafond()) { FX.sound('error'); return UI.toast('Plafond carte dépassé (' + eur(cardPlafond()) + ' / opération).', 'warn'); }
    if (v > balance()) { FX.sound('error'); return UI.toast('Solde insuffisant : ' + eur(balance()) + '.', 'bad'); }
    DB.authFetch('/api/transfer', { method: 'POST', body: JSON.stringify({ to, amount: v }) }).then(j => {
      if (j && j.ok) {
        G.stats.transfersSent = num(G.stats.transfersSent, 0) + 1;
        UI.moneyFly(); FX.sound('cash');
        UI.toast('💸 Envoi de ' + eur(v) + ' à ' + esc(to) + '…', 'good');
        UI.termReceipt && UI.termReceipt('Envoi → ' + to, v);
        UI.closeModal(); maybeAch();
      } else { FX.sound('error'); UI.toast((j && j.err) || 'Échec du transfert.', 'bad'); }
    }).catch(() => { FX.sound('error'); UI.toast('Transferts entre joueurs : mode serveur uniquement.', 'warn'); });
  },
  toggleFreeze(d) {
    const which = d.card === 'livret' ? 'livret' : 'cb';
    const c = which === 'livret' ? (G.bank.cardLivret = G.bank.cardLivret || { frozen: false }) : (G.bank.cardCb = G.bank.cardCb || { plafond: 2000, frozen: false });
    c.frozen = !c.frozen;
    if (c.frozen) G.stats.frozeOnce = true;
    FX.sound(c.frozen ? 'back' : 'win');
    UI.toast(c.frozen ? '❄ Carte ' + (which === 'livret' ? 'Livret' : 'bleue') + ' gelée : paiements par carte bloqués.' : '🔥 Carte ' + (which === 'livret' ? 'Livret' : 'bleue') + ' dégelée.', c.frozen ? 'warn' : 'good');
    save(); refresh();
  },
  setPlafond(d) {
    const v = Math.floor(num(d.v, 0, 100, 20000));
    if (!(v >= 100)) { FX.sound('error'); return UI.toast('Plafond : entre 100 € et 20 000 €.', 'bad'); }
    G.bank.cardCb = G.bank.cardCb || { plafond: 2000, frozen: false };
    G.bank.cardCb.plafond = v;
    FX.sound('click');
    UI.toast('🛡 Plafond carte fixé à ' + eur(v) + ' / opération.', 'good');
    save(); refresh();
  },
  claimPremium() {
    if (G.bank.cardPremium) return UI.toast('Carte premium déjà obtenue.', 'warn');
    if (!G.bank.bankId) return UI.toast('Ouvrez d’abord un compte.', 'warn');
    if (level(G.xp) < 10) { FX.sound('error'); return UI.toast('Carte premium réservée au niveau 10+ (vous : ' + level(G.xp) + ').', 'warn'); }
    G.bank.cardPremium = true;
    UI.confetti(); FX.sound('win');
    UI.toast('💎 Carte HEXAPAY Premium obtenue : compte rémunéré 0,5 %/an !', 'good');
    maybeAch(); save(); refresh();
  },
  nfcCancel() { UI.nfcClose(false); },
  openTerminal(d) { UI.openTerminal(d.which === 'livret' ? 'livret' : d.which === 'premium' ? 'premium' : 'cb'); },
  termEject() { UI.closeTerminal(true); },
  deposit() {
    const v = A._amt();
    if (moveMoneyWith('cash', 'compte', v)) { UI.cardFx('Dépôt sur compte', '+' + eur(v)); FX.sound('cash'); refresh(); }
  },
  withdraw() {
    const v = A._amt();
    if (moveMoneyWith('compte', 'cash', v)) { UI.cardFx('Retrait espèces', '−' + eur(v)); FX.sound('cash'); refresh(); }
  },
  toLivret() {
    const v = A._amt();
    if (moveMoneyWith('compte', 'livret', v)) { UI.cardFx('Vers Livret A', '−' + eur(v)); FX.sound('cash'); UI.toast('🏦 ' + eur(v) + ' placés sur le Livret A (' + bankRate() + ' %/an)', 'good'); refresh(); }
  },
  fromLivret() {
    const v = A._amt();
    if (moveMoneyWith('livret', 'compte', v)) { UI.cardFx('Livret A → compte', '+' + eur(v)); FX.sound('cash'); refresh(); }
  },
  loanTake(d) {
    if (!G.bank.bankId) return UI.toast('Ouvrez d’abord un compte.', 'warn');
    const v = Math.floor(parseAmount(((document.getElementById('loanAmt') || {}).value)));
    if (!(v >= 1000)) return UI.toast('Minimum : 1 000 € (ex : 10000).', 'bad');
    if (v > 5e6) return UI.toast('Maximum : 5 000 000 €.', 'warn');
    const L = DATA.loans.find(x => x.id === d.t); if (!L) return;
    if (G.bank.loans.length >= 6) return UI.toast('Maximum 6 crédits en cours.', 'warn');
    const mois = Math.max(12, Math.round(v / 800));
    const total = v * (1 + L.rate / 100 * mois / 12);
    G.bank.loans.push({ n: L.n, total, mens: +(total / mois).toFixed(2), reste: +total.toFixed(2) });
    receive(v, 'Crédit — ' + L.n, 'bank');
    UI.cardFx('Crédit ' + L.n, '+' + eur(v));
    FX.sound('cash');
    UI.toast('🏦 Crédit ' + L.n + ' accordé +' + eur(v) + ' (' + mois + ' mois à ' + eur(total / mois) + ')', 'good');
    refresh();
  },
  loanRepay(d) {
    const i = idxOk(d.i, G.bank.loans.length); if (i < 0) return;
    const L = G.bank.loans[i];
    if (balance() < L.reste) { FX.sound('error'); return UI.toast('Il reste ' + eur(L.reste) + ' à solder.', 'bad'); }
    pay(L.reste, 'Remboursement anticipé — ' + L.n, 'bank');
    G.bank.loans.splice(i, 1);
    UI.cardFx('Crédit soldé', '−' + eur(L.reste));
    FX.sound('win');
    UI.toast('✅ Crédit « ' + esc(L.n) + ' » soldé', 'good');
    maybeAch(); refresh();
  },

  insure(d) {
    const ins = DATA.insurers.find(x => x.id === d.id); if (!ins) return;
    const i = G.insurances.indexOf(d.id);
    if (i >= 0) { G.insurances.splice(i, 1); FX.sound('back'); UI.toast('Assurance résiliée : ' + ins.n, 'warn'); }
    else { G.insurances.push(d.id); FX.sound('buy'); UI.toast('🛡 Assuré·e chez ' + ins.n + ' (' + Math.round(ins.cov * 100) + ' % de couverture)', 'good'); }
    save(); refresh();
  },

  chooseDoctor(d) {
    const doc = DATA.doctors.find(x => x.id === d.id); if (!doc) return;
    G.health.doctor = d.id; FX.sound('click');
    UI.toast('🩺 Médecin traitant : ' + doc.n, 'good'); refresh();
  },
  buyVaccine(d) {
    const v = DATA.vaccines.find(x => x.id === d.id); if (!v) return;
    if (G.health.vaccines.includes(d.id)) return UI.toast('Déjà vacciné·e.', 'warn');
    if (balance() < v.cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(v.cost, 'Vaccin — ' + v.n, 'out'); G.health.vaccines.push(d.id);
    FX.sound('buy');
    UI.toast('💉 ' + v.n + ' administré', 'good');
    maybeAch(); refresh();
  },
  bookAppointment() {
    if (!G.health.doctor) return UI.toast('Choisissez d’abord un médecin traitant.', 'warn');
    if (!G.health.sick) return UI.toast('Vous n’êtes pas malade.', 'warn');
    const doc = DATA.doctors.find(x => x.id === G.health.doctor); if (!doc) return;
    const cost = doc.fee * (1 - cov());
    if (balance() < cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(cost, 'Consultation — ' + doc.n, 'out');
    G.health.sick = false; G.health.rdv = num(G.health.rdv, 0) + 1;
    G.vitals.sante = clamp(G.vitals.sante + 30 * doc.quality, 0, 100);
    UI.pulseVital('rowSante'); UI.confetti(); FX.sound('win');
    UI.toast('🩺 ' + doc.n + ' vous a soigné·e (−' + eur(cost) + ' après remboursement)', 'good');
    save(); refresh();
  },

  lotto() {
    const L = DATA.lotto;
    if (Date.now() < num(G.lottoCd, 0)) return UI.toast('Patientez avant le prochain tirage.', 'warn');
    if (balance() < L.cost) { FX.sound('error'); return UI.toast(L.cost + ' € requis.', 'bad'); }
    pay(L.cost, 'Ticket de loto', 'out'); G.lottoCd = Date.now() + L.cd * 1000; mission('lotto', 1);
    const chance = Math.min(0.5, L.chance + skillBonus('luck'));
    if (Math.random() < chance) {
      const g = rnd(L.min, L.max);
      receive(g, 'Gain loto', 'in'); G.stats.lottoWins = num(G.stats.lottoWins, 0) + 1; addXp(30);
      UI.confetti(); FX.sound('win');
      UI.toast('🍀 GAGNÉ ! +' + eur(g), 'good');
      maybeAch();
    } else { FX.sound('back'); UI.toast('🎱 Pas de chance cette fois…', ''); }
    refresh();
  },

  illUnlock() {
    if (G.ill.unlocked) return;
    if (balance() < DATA.illEntry) { FX.sound('error'); return UI.toast(DATA.illEntry + ' € de droit d’entrée requis.', 'bad'); }
    pay(DATA.illEntry, 'Droit d’entrée réseau', 'ill'); G.ill.unlocked = true;
    FX.sound('jail');
    UI.toast('🕶 Le réseau vous ouvre ses portes…', 'warn');
    maybeAch(); refresh();
  },
  illDo(d) {
    const a = DATA.ill.find(x => x.id === d.id); if (!a) return;
    if (!G.ill.unlocked) return UI.toast('Réseau non débloqué.', 'bad');
    if (a.reqBiz && !ownsBiz(a.reqBiz)) return UI.toast('Nécessite de posséder une banque.', 'bad');
    if (Date.now() < num(G.ill.cd[a.id], 0)) return UI.toast('Opération en recharge.', 'warn');
    if (balance() < a.cost) { FX.sound('error'); return UI.toast('Mise insuffisante (' + eur(a.cost) + ').', 'bad'); }
    pay(a.cost, 'Mise — ' + a.n, 'ill'); G.ill.cd[a.id] = Date.now() + a.cd * 1000;
    if (Math.random() < a.risk) {
      G.ill.heat = Math.min(100, G.ill.heat + a.heat * 1.5);
      const amende = a.cost * 1.5;
      pay(amende, 'Amende — échec ' + a.n, 'ill');
      UI.screenShake(); FX.sound('error');
      UI.toast('❌ ' + a.n + ' a échoué −' + eur(amende) + ' (chaleur +' + Math.round(a.heat * 1.5) + ')', 'bad');
    } else {
      const gain = rnd(a.gain[0], a.gain[1]);
      receive(gain, 'Gain — ' + a.n, 'ill');
      G.ill.heat = Math.min(100, G.ill.heat + a.heat);
      if (a.id === 'braquage') G.stats.braquages = num(G.stats.braquages, 0) + 1;
      FX.sound('cash');
      UI.toast('🕶 ' + a.n + ' réussi +' + eur(gain), 'good');
      maybeAch();
    }
    if (G.ill.heat >= 100) {
      G.jail = Date.now() + 60000; G.ill.heat = 30; G.stats.jailed = true;
      const am = Math.max(500, balance() * 0.1);
      pay(am, 'Amende interpellation', 'ill');
      UI.screenShake(); FX.sound('jail');
      UI.toast('🚔 GARDE À VUE — 60 s d’activités suspendues, amende de ' + eur(am), 'bad');
      maybeAch();
    }
    refresh();
  },
  bribe() {
    if (balance() < 800) { FX.sound('error'); return UI.toast('800 € requis pour le pot-de-vin.', 'bad'); }
    pay(800, 'Pot-de-vin', 'ill');
    G.ill.heat = Math.max(0, G.ill.heat - 35);
    FX.sound('buy');
    UI.toast('🤫 Chaleur −35. Discrétion retrouvée.', 'good'); refresh();
  },
  payBail() {
    if (!inJail()) return;
    const bail = Math.max(200, Math.round(Math.abs(balance()) * 0.1));
    if (balance() < bail) { FX.sound('error'); return UI.toast('Caution insuffisante : ' + eur(bail) + '.', 'bad'); }
    pay(bail, 'Caution de sortie', 'ill');
    G.jail = 0;
    FX.sound('win');
    UI.toast('💶 Caution payée (' + eur(bail) + ') : vous êtes libre !', 'good');
    refresh();
  },

  claimMission(d) {
    const i = idxOk(d.i, (G.missions.list || []).length); if (i < 0) return;
    const m = G.missions.list[i];
    if (!m || m.claimed || m.prog < m.tgt) return;
    m.claimed = true; G.stats.missionsDone = num(G.stats.missionsDone, 0) + 1;
    receive(m.rew, 'Défi — ' + m.n, 'in'); addXp(Math.round(m.rew / 2));
    UI.confetti(); FX.sound('win');
    UI.toast('🎯 Défi accompli +' + eur(m.rew), 'good');
    maybeAch(); refresh();
  },
  claimQuest(d) {
    const i = idxOk(d.i, (G.quests.list || []).length); if (i < 0) return;
    const q = G.quests.list[i];
    if (!q || q.claimed || q.prog < q.tgt) return;
    q.claimed = true;
    receive(q.rew, 'Quête — ' + q.n, 'in'); addXp(q.xp || 30);
    UI.confetti(); FX.sound('win');
    UI.toast('📜 Quête accomplie +' + eur(q.rew) + ' · +' + (q.xp || 30) + ' XP', 'good');
    maybeAch(); refresh();
  },

  buySkill(d) {
    const s = DATA.skills.find(x => x.id === d.id); if (!s) return;
    const lvl = skillLvl(s.id);
    if (lvl >= s.maxLvl) return UI.toast('Niveau maximum atteint.', 'warn');
    const cost = Math.round(s.costBase * Math.pow(s.costGrow, lvl));
    if (balance() < cost) { FX.sound('error'); return UI.toast('Fonds insuffisants.', 'bad'); }
    pay(cost, 'Compétence — ' + s.n, 'out'); G.skills[s.id] = lvl + 1; addXp(25);
    UI.confetti(); FX.sound('win');
    UI.toast(s.icon + ' ' + s.n + ' → niveau ' + (lvl + 1) + '/' + s.maxLvl, 'good');
    save(); maybeAch(); refresh();
  },

  /* Boutique : AUCUNE confirmation manuelle. Le crédit n'arrive que par le
     webhook Stripe signé (applyOp 'packCredit'). Sans Stripe configuré côté
     serveur, les paiements sont désactivés : impossible de se créditer soi-même. */
  buyPack(d) {
    const p = DATA.packs.find(x => x.id === d.id); if (!p) return;
    if (!(DB.hasStripe && DB.hasStripe())) {
      FX.sound('error');
      return UI.toast('🔒 Paiements désactivés : la vérification Stripe n’est pas configurée sur ce serveur (protection anti-fraude).', 'warn');
    }
    UI.toast('⏳ Ouverture de la session de paiement sécurisée…', '');
    DB.authFetch('/api/checkout', { method: 'POST', body: JSON.stringify({ pack: p.id }) }).then(j => {
      if (j && j.ok && j.url) {
        window.open(j.url, '_blank', 'noopener');
        UI.toast('🧾 Réglez dans l’onglet Stripe : la récompense sera créditée AUTOMATIQUEMENT à confirmation.', 'good');
      } else { FX.sound('error'); UI.toast((j && j.err) || 'Stripe indisponible.', 'bad'); }
    }).catch(() => { FX.sound('error'); UI.toast('Stripe injoignable.', 'bad'); });
  },

  deleteAccount() {
    if (!confirm('SUPPRIMER DÉFINITIVEMENT votre compte et toutes vos données ?')) return;
    if (!confirm('Cette action est irréversible. Confirmer la suppression ?')) return;
    DB.deleteAccount(DB.session()).then(() => location.reload());
  },

  tutoNext() { UI.tutoNext(); },
  tutoSkip() { UI.tutoSkip(); },
  closeModal() { UI.closeModal(); },
  resetSave() {
    if (!confirm('Effacer votre vie et recommencer à zéro ?')) return;
    DB.deleteSave(DB.session()); DB.logout(); location.reload();
  },
  logout() { save(); DB.logout(); location.reload(); }
};
function sparkAt(cardEl) {
  try {
    const r = cardEl.getBoundingClientRect();
    FX.spark(r.left + r.width / 2, r.top + r.height / 2, '#f3c76e', 12);
  } catch (e) {}
}

function offerModal() {
  if (!T.offer) return;
  const c = idxOk(T.offer.c, DATA.companies.length);
  if (c < 0) { T.offer = null; return; }
  const comp = DATA.companies[c];
  const o = idxOk(T.offer.o, comp.o.length);
  if (o < 0) { T.offer = null; return; }
  const job = comp.o[o];
  const netP = jobNetHourly(job[1], 'plein'), netT = jobNetHourly(job[1], 'partiel');
  const okP = canTake('plein'), okT = canTake('partiel');
  UI.modal('<h2>Contrat de travail</h2><div class="m-sub">' + esc(job[0]) + ' · ' + esc(comp.n) + ' · ' + eur(job[1]) + ' brut/h</div>' +
    '<div class="mode-cards">' +
    '<div class="mode-card ' + (T.offerMode === 'plein' ? 'sel' : '') + ' ' + (okP ? '' : 'dis') + '" data-act="pickMode" data-m="plein"><div class="m-t">Temps plein</div><div class="m-d">100 % · exclusif<br><b class="money">' + eur(netP) + '/h</b> net</div></div>' +
    '<div class="mode-card ' + (T.offerMode === 'partiel' ? 'sel' : '') + ' ' + (okT ? '' : 'dis') + '" data-act="pickMode" data-m="partiel"><div class="m-t">Temps partiel</div><div class="m-d">50 % · cumulable<br><b class="money">' + eur(netT) + '/h</b> net</div></div>' +
    '</div>' +
    '<table class="t"><tr><td>Charge actuelle</td><td class="mono">' + Math.round(totalLoad() * 100) + ' % / 100 %</td></tr>' +
    '<tr><td>Estimation mensuelle (temps choisi)</td><td class="money">' + eur(jobNetHourly(job[1], T.offerMode) * 151.67) + '</td></tr></table>' +
    '<div class="m-actions"><button class="btn btn-ghost" data-act="closeModal">Refuser</button>' +
    '<button class="btn btn-primary" data-act="sign">Signer en ' + (T.offerMode === 'plein' ? 'temps plein' : 'temps partiel') + '</button></div>');
}

const GUARDED = ['eat', 'buyFood', 'train', 'offer', 'sign', 'openCreate', 'createBiz', 'buyMat', 'craft', 'buyStock', 'priceAdj', 'hire', 'hireConfirm', 'fire', 'buyMandat', 'bankAdj', 'buyHome', 'rentHome', 'cancelRent', 'sellHome', 'rentOut', 'buyCar', 'sellCar', 'serviceCar', 'deposit', 'withdraw', 'toLivret', 'fromLivret', 'loanTake', 'loanRepay', 'illDo', 'bribe', 'upgrade', 'mktDo', 'orderFill', 'lotto', 'buySkill', 'claimMission', 'claimQuest', 'claimDaily', 'buyVaccine', 'bookAppointment', 'openBank', 'leaveBank', 'doSendMoney', 'doAnnounce', 'insure', 'buyPack', 'negotiate', 'moveMoney', 'sendToPlayer', 'toggleFreeze', 'setPlafond', 'claimPremium', 'openTerminal', 'trainExec', 'buyCarExec', 'buyHomeExec', 'createBizExec', 'nfcCancel', 'setMargin', 'restockGrocery', 'shopSel'];

/* ── sauvegarde ── */
let saveInFlight = false;
function save() {
  if (!G || saveInFlight) return;
  G.last = Date.now();
  saveInFlight = true;
  DB.saveGame(DB.session(), G).then(ok => {
    saveInFlight = false;
    if (ok) { G.lastSavedAt = Date.now(); UI.flashSave(); }
  }).catch(() => { saveInFlight = false; });
}

/* ── progression hors-ligne ── */
function offlineProgress(s) {
  try {
    let dt = (Date.now() - num(s && s.last, Date.now())) / 1000;
    if (!(dt >= 30)) return null;
    dt = Math.min(dt, 8 * 3600);
    const res = { dt, gains: 0, jobs: 0, biz: 0, loyers: 0, interets: 0 };
    const add = (g, bucket) => {
      g = Math.max(0, num(g, 0));
      if (s.bank && s.bank.bankId) s.bank.compte += g; else s.cash = num(s.cash, 0) + g;
      res.gains += g; if (bucket) res[bucket] += g;
    };
    (Array.isArray(s.jobs) ? s.jobs : []).forEach(j => {
      const load = j && j.mode === 'plein' ? 1 : 0.5;
      const net = (num(j && j.h, 12) / 60) * load * 0.78 * (1 - tauxPAS(num(j && j.h, 12) * 2080 * load * 0.78));
      add(net * dt * 0.5, 'jobs');
    });
    (Array.isArray(s.biz) ? s.biz : []).forEach(b => add(((Array.isArray(b && b.emps) ? b.emps.length : 0) + 1) * dt * 0.08, 'biz'));
    (Array.isArray(s.houses) ? s.houses : []).forEach(h => { if (h && h.tenant) add(num(h.rent, 0) * (dt / 6) * 0.5, 'loyers'); });
    if (s.bank && s.bank.bankId && num(s.bank.livret, 0) > 0) {
      const rate = isPlayerBank(s.bank.bankId) ? num(s.bank.playerRate, 2, 0, 5) : ((DATA.banks.find(x => x.id === s.bank.bankId) || {}).lv || 0);
      if (rate > 0) {
        const i = s.bank.livret * rate / 100 * (dt / (30 * 86400));
        s.bank.livret = Math.min(22950, s.bank.livret + i);
        res.interets += i; res.gains += i;
      }
    }
    if (s.vitals && typeof s.vitals === 'object') {
      s.vitals.faim = Math.max(15, num(s.vitals.faim, 70) - dt * 0.02);
      s.vitals.soif = Math.max(15, num(s.vitals.soif, 65) - dt * 0.025);
    }
    if (s.training && Date.now() >= num(s.training.end, Infinity)) {
      const fm = DATA.form.find(x => x.id === s.training.id);
      if (fm && Array.isArray(s.diplomas) && !s.diplomas.includes(fm.id)) s.diplomas.push(fm.id);
      s.training = null; res.diploma = fm ? fm.n : 'Formation';
    }
    return res;
  } catch (e) { return null; }
}
