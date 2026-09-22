/* ═══════════ HEXALIFE — Test fumée client (jsdom) ═══════════
 * Démarre le VRAI serveur, charge la VRAIE page (index.html + <script src>)
 * dans un DOM simulé, démarre une partie, fait tourner le moteur, visite chaque
 * onglet, déclenche chaque action et vérifie la robustesse aux sauvegardes
 * corrompues. Toute exception = échec (exit 1). Usage : node test/smoke.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// jsdom : cherché dans le projet, puis dans /tmp (bac à sable), sinon message clair.
let jsdomMod = null;
const __dirname0 = path.dirname(fileURLToPath(import.meta.url));
for (const base of [path.join(__dirname0, '..', 'package.json'), '/tmp/package.json', process.cwd() + '/package.json']) {
  try { jsdomMod = createRequire(base)('jsdom'); break; } catch (e) { /* base suivante */ }
}
if (!jsdomMod) { console.error('✗ jsdom introuvable. Installez-le : npm install --no-save jsdom'); process.exit(2); }
const { JSDOM, VirtualConsole } = jsdomMod;

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
async function freePort() {
  for (let tries = 0; tries < 20; tries++) {
    const p = 3200 + Math.floor(Math.random() * 2000);
    try { await fetch('http://localhost:' + p + '/api/health', { signal: AbortSignal.timeout(300) }); }
    catch (e) { return p; } // rien n'écoute → port libre
  }
  throw new Error('aucun port libre trouvé');
}
const PORT = await freePort();
const BASE = 'http://localhost:' + PORT;
const errors = [];
const seen = new Set();
function pushErr(label, e) {
  const msg = label + ': ' + (e && (e.stack || e.message || e));
  const lines = String(msg).split('\n');
  const key = lines[0] + '|' + (lines[1] || '');
  if (!seen.has(key)) { seen.add(key); errors.push(msg); }
}
process.on('unhandledRejection', e => pushErr('unhandledRejection', e));

// ── serveur réel ──
const srv = spawn(process.execPath, [path.join(ROOT, 'server/server.js')], {
  env: { ...process.env, PORT: String(PORT), DB_PATH: '/tmp/hl-test-db' },
  stdio: 'ignore',
});
srv.on('error', e => { console.error('serveur impossible à démarrer', e); process.exit(2); });
const quit = code => { try { srv.kill('SIGKILL'); } catch (e) {} process.exit(code); };

for (let i = 0; i < 60; i++) {
  try { const r = await fetch(BASE + '/api/health'); if (r.ok) break; } catch (e) {}
  await new Promise(r => setTimeout(r, 150));
}

const vc = new VirtualConsole();
vc.on('jsdomError', e => {
  const m = (e && e.message) || String(e);
  if (/Could not load|not implemented|css/i.test(m)) return; // bruit jsdom (fonts, css…)
  pushErr('jsdomError', e);
});

const dom = await JSDOM.fromFile(path.join(ROOT, 'index.html'), {
  url: BASE + '/',
  resources: 'usable',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    // Le jeu tourne en MODE LOCAL (pas d'API) : fetch rejeté => repli localStorage.
    window.fetch = () => Promise.reject(new Error('no network (test)'));
    window.matchMedia = q => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
    window.HTMLCanvasElement.prototype.getContext = function () {
      return new Proxy({}, {
        get: (t, p) => {
          if (p === 'canvas') return { width: 300, height: 150 };
          if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
          if (p === 'measureText') return () => ({ width: 10 });
          if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
          return () => {};
        },
        set: () => true,
      });
    };
    window.HTMLElement.prototype.scrollIntoView = function () {};
    window.scrollTo = () => {};
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
    window.confirm = () => true;
    window.alert = m => pushErr('alert() appelé', new Error(String(m)));
    window.open = () => null;
  },
});
const window = dom.window;
const sleep = ms => new Promise(r => setTimeout(r, ms));

for (let i = 0; i < 200 && !window.UI; i++) await sleep(50);
if (!window.UI) { console.error('✗ Scripts non chargés (window.UI absent après 10 s)'); quit(2); }

const run = (label, code) => { try { window.eval(code); } catch (e) { pushErr(label, e); } };
const runAsync = async (label, code) => { try { await window.eval('(async()=>{' + code + '})()'); } catch (e) { pushErr(label, e); } };

// ── entrer en jeu (mode local, sans réseau) ──
run('enterGame', `localStorage.setItem('hl_session','Testeur'); enterGame('Testeur', true);`);
await sleep(500);
run('vérif G', `if (!G) throw new Error('G non initialisé');`);

// ── 400 ticks moteur (mois, IS, météo, events, missions…) ──
run('tick x400', `for (let i=0;i<400;i++) tick();`);

// ── chaque onglet ──
for (const id of ['vie', 'inventaire', 'carriere', 'marche', 'entreprises', 'banque', 'immobilier', 'auto', 'assurances', 'sante', 'skills', 'economie', 'noir', 'plus', 'profil']) {
  run('tab ' + id, `UI.setTab('${id}')`);
  await sleep(15);
}

// ── clics réels (délégation) ──
run('clic nav réel', `
  UI.setTab('marche');
  const navBtn = document.querySelector('[data-id="marche"]');
  if (navBtn) navBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const buy = document.querySelector('[data-act="buyFood"]');
  if (buy) buy.dispatchEvent(new MouseEvent('click', { bubbles: true }));
`);
await sleep(50);

// ── actions de base ──
run('actions de base', `
  G.cash = 5e6; if (G.bank.bankId) G.bank.compte = 5e6;
  A.buyFood({id:'baguette'}); A.buyFood({id:'kebab', q:'5'}); A.buyFood({id:'zzz'});
  A.eat({id:'baguette'}, document.querySelector('[data-act="eat"]'));
  A.eat({id:'inexistant'});
  A.train({id:'base'});
  A.lotto(); G.lottoCd = 0; A.lotto();
  A.illUnlock(); A.illDo({id:'contre'}); A.illDo({id:'zzz'}); A.bribe();
  A.insure({id:'mma'}); A.insure({id:'inconnue'});
  A.chooseDoctor({id:'d1'});
  A.buyVaccine({id:'v_grippe'});
  A.buySkill({id:'s_eff'}); A.buySkill({id:'zzz'});
  A.buyCar({i:'0'}); A.buyCar({i:'0'}); A.buyCar({i:'99'});
  A.buyHome({i:'0'}); A.buyHome({i:'99'});
  A.rentOut({i:'0'}); A.rentOut({i:'9'});
  A.rentHome({i:'0'}); A.rentHome({i:'0'});
  A.cancelRent();
  A.buyPack({id:'p1'}); A.confirmPack(); A.cancelPack();
  A.openBank({id:'ce', name:"Caisse d'Épargne", rate:'3.0'});
  G.cash = 100000;
  A.setBankAmt({v:'100'}); A.deposit();
  A.setBankAmt({v:'max'}); A.withdraw(); A.toLivret(); A.fromLivret();
  A.setBankAmt({v:'5000', of:'loan'}); A.loanTake({t:'immo'}); A.loanTake({t:'zzz'}); A.loanRepay({i:'0'}); A.loanRepay({i:'9'});
  A.sellCar({i:'0'}); A.sellCar({i:'77'}); A.sellHome({i:'0'}); A.sellHome({i:'77'});
  A.quitJob({i:'99'});
  A.openSettings(); A.toggleSetting({k:'sound'}); A.toggleSetting({k:'particles'}); A.toggleSetting({k:'reduced'});
  A.toggleSetting({k:'sound'}); A.toggleSetting({k:'particles'}); A.toggleSetting({k:'reduced'});
  A.openHelp(); A.closeModal();
  A.journalF({f:'in'}); A.journalF({f:'out'}); A.journalF({f:'all'});
`);
await sleep(80);

// ── RÉGRESSIONS v11.1 : chaque bug signalé doit rester corrigé ──
run('régressions v11.1', `
  // 1) ×5 doit vraiment acheter 5 (dataset = chaîne de caractères)
  G.cash = 10000; G.bank.bankId = null; G.inv = {};
  const fCafe = foodById('cafe');
  const unit = effPrice(fCafe);
  const expectCost = +((unit * 5)).toFixed(2);
  A.buyFood({id:'cafe', q:'5'});
  if ((G.inv['cafe'] || 0) !== 5) throw new Error('×5 a acheté ' + (G.inv['cafe'] || 0));
  if (Math.abs((10000 - G.cash) - expectCost) > 0.011) throw new Error('coût ×5 faux : ' + (10000 - G.cash) + ' vs ' + expectCost);

  // 2) priceAdj / bankAdj / craft doivent agir (dataset chaînes)
  G.biz.push(sanitizeBiz({type:'magasin', name:'T'}));
  const bi = G.biz.length - 1;
  const p0 = G.biz[bi].prices['epicerie'];
  A.priceAdj({b:String(bi), p:'epicerie', v:'0.1'});
  if (Math.abs(G.biz[bi].prices['epicerie'] - (p0 + 0.1)) > 0.001) throw new Error('priceAdj inopérant');
  G.biz.push(sanitizeBiz({type:'banque', name:'B'}));
  const bb = G.biz.length - 1;
  const t0 = G.biz[bb].tauxCredit;
  A.bankAdj({b:String(bb), k:'tc', v:'0.5'});
  if (Math.abs(G.biz[bb].tauxCredit - (t0 + 0.5)) > 0.001) throw new Error('bankAdj inopérant');
  G.biz.push(sanitizeBiz({type:'boulangerie', name:'F'}));
  const bo = G.biz.length - 1;
  G.biz[bo].mats = { farine:50, levure:50 };
  A.craft({b:String(bo), p:'baguette', q:'10'});
  if ((G.biz[bo].stock['baguette'] || 0) !== 10) throw new Error('craft ×10 inopérant');

  // 3) Livret A : saisie avec virgule + Max contextuel + aller-retour complet
  G.bank = { bankId:'ce', bankName:'CE', playerRate:null, compte:2000, livret:0, loans:[] };
  G.cash = 500;
  const inp = document.createElement('input'); inp.id = 'bankAmt'; document.body.appendChild(inp);
  inp.value = '250,50';
  A.toLivret();
  if (Math.abs(G.bank.livret - 250.5) > 0.01) throw new Error('toLivret virgule : ' + G.bank.livret);
  A.setBankAmt({v:'max', of:'livretCap'});
  A.toLivret();
  if (G.bank.livret <= 250.5 || G.bank.compte !== 0) throw new Error('Max livretCap inopérant (' + G.bank.livret + '/' + G.bank.compte + ')');
  A.setBankAmt({v:'max', of:'livret'});
  A.fromLivret();
  if (G.bank.livret !== 0 || G.bank.compte <= 0) throw new Error('fromLivret Max inopérant');
  inp.remove();

  // 4) négociation salariale (succès forcé) + cooldown
  G.jobs.push({ c:0, o:0, title:'T', h:12, mode:'plein', since:Date.now(), mins:600, promo:false, negAt:0 });
  const h0 = G.jobs[G.jobs.length - 1].h;
  const ji = G.jobs.length - 1;
  const mr = Math.random; Math.random = () => 0.01;
  A.negotiate({i:String(ji)});
  Math.random = mr;
  if (G.jobs[ji].h <= h0) throw new Error('négociation forcée en échec');
  if (!(G.jobs[ji].negAt > Date.now())) throw new Error('cooldown négociation absent');

  // 5) sport + cooldown
  G.vitals.sante = 50; G.sportCd = 0;
  A.sport();
  if (G.vitals.sante !== 54) throw new Error('sport : ' + G.vitals.sante);
  if (!(G.sportCd > Date.now())) throw new Error('cooldown sport absent');

  // 6) révision voiture
  G.cars = [0]; G.carState = { 0: 30 }; G.cash = 100000;
  A.serviceCar({i:'0'});
  if (G.carState[0] !== 100) throw new Error('serviceCar : ' + G.carState[0]);

  // 7) marché dynamique présent et cohérent
  if (!G.market || !G.market.mult || !G.market.mult['baguette']) throw new Error('marché non initialisé');
  const fb = foodById('baguette');
  const ep = effPrice(fb);
  if (!(ep > 0) || Math.abs(ep - +(fb.p * G.market.mult['baguette']).toFixed(2)) > 0.001) throw new Error('effPrice incohérent');

  // 8) amende stationnement impossible sans voiture
  G.cars = [];
  const cashAv = balance();
  for (let i = 0; i < 200; i++) {
    const pool = DATA.events.filter(e => e.m === 'Amende stationnement' && (!e.ok || e.ok()));
    if (pool.length) throw new Error('amende stationnement proposée sans voiture');
  }

  // 9) nettoyage : les sections suivantes repartent d'un état déterministe
  G.jobs = []; G.biz = []; G.inv = {};
  G.bank = { bankId:null, bankName:null, playerRate:null, compte:0, livret:0, loans:[] };
  G.cash = 5e6;

  // 10) CARTES & TERMINAL : virements génériques, gel, plafond, premium
  A.openBank({id:'ce', name:"Caisse d'Épargne", rate:'3.0'});
  G.bank.compte = 5000; G.cash = 1000;
  if (!G.bank.cardCb || G.bank.cardCb.plafond !== 2000) throw new Error('carte CB non initialisée');
  const ti = document.createElement('input'); ti.id = 'termAmt'; document.body.appendChild(ti);
  ti.value = '1 200,50';
  A.moveMoney({from:'compte', to:'livret'});
  if (Math.abs(G.bank.livret - 1200.5) > 0.01) throw new Error('moveMoney virgule/espace : ' + G.bank.livret);
  A.moveMoney({from:'compte', to:'compte'}); // invalide : rien ne bouge
  if (Math.abs(G.bank.livret - 1200.5) > 0.01) throw new Error('moveMoney from==to a modifié quelque chose');
  // plafond : retrait DAB au-dessus du plafond refusé
  A.setPlafond({v:'300'});
  ti.value = '500';
  const cAv = G.bank.compte;
  A.moveMoney({from:'compte', to:'cash'});
  if (G.bank.compte !== cAv) throw new Error('plafond non respecté');
  A.setPlafond({v:'2000'});
  A.moveMoney({from:'compte', to:'cash'});
  if (G.bank.compte === cAv) throw new Error('retrait sous plafond refusé à tort');
  // gel : bloque les mouvements depuis le compte et les paiements carte
  A.toggleFreeze({card:'cb'});
  if (!G.stats.frozeOnce) throw new Error('stats.frozeOnce non marqué');
  const c2 = G.bank.compte;
  ti.value = '100';
  A.moveMoney({from:'compte', to:'livret'});
  if (G.bank.compte !== c2) throw new Error('gel non bloquant sur moveMoney');
  const invAv = JSON.stringify(G.inv);
  A.buyFood({id:'baguette'});
  if (JSON.stringify(G.inv) !== invAv) throw new Error('gel non bloquant sur achats');
  A.toggleFreeze({card:'cb'});
  A.buyFood({id:'baguette'});
  if (JSON.stringify(G.inv) === invAv) throw new Error('dégel : achat toujours bloqué');
  // terminal : ouverture / écran / fermeture (jsdom : rects nuls, chemins réduits)
  UI.openTerminal('cb');
  if (!document.querySelector('.term-ov')) throw new Error('terminal non ouvert');
  A.moveMoney({from:'cash', to:'compte'}); // via termAmt présent
  UI.closeTerminal(true);
  // premium : niveau requis puis obtention + intérêts mensuels
  A.claimPremium();
  if (G.bank.cardPremium) throw new Error('premium obtenu sans niveau 10');
  G.xp = 100 * 100;
  A.claimPremium();
  if (!G.bank.cardPremium) throw new Error('premium non obtenu au niveau 10');
  const cp = G.bank.compte;
  G.insurances = []; // isole l'effet : aucune cotisation pour masquer les intérêts
  monthly({ rev: 0, chg: 0, tax: 0 });
  if (!(G.bank.compte > cp)) throw new Error('intérêts premium absents');
  // sanitize conserve les cartes
  const sCard = sanitize(JSON.parse(JSON.stringify(G)));
  if (!sCard.bank.cardCb || sCard.bank.cardCb.plafond < 100 || !sCard.bank.cardPremium) throw new Error('sanitize cartes incomplet');
  ti.remove();
  G.bank.cardPremium = false; G.bank.livret = 0; G.bank.compte = 5e6; G.cash = 5e6;
`);
await sleep(1500); // laisse l'animation d'éjection se terminer
run('terminal fermé', `if (document.querySelector('.term-ov')) throw new Error('overlay terminal resté ouvert');`);
await sleep(80);
run('quotidien', `
  if (!canClaimDaily()) throw new Error('daily devrait être réclamable (nouvelle partie)');
  A.claimDaily();
  if (canClaimDaily()) throw new Error('daily déjà réclamé');
  A.claimDaily(); // doit avertir sans crash
  G.daily.lastDay = dayKey(Date.now() - 86400000); // hier
  if (!canClaimDaily()) throw new Error('daily réclamable le lendemain');
  const before = G.daily.streak;
  A.claimDaily();
  if (G.daily.streak !== before + 1) throw new Error('streak non incrémenté : ' + before + ' → ' + G.daily.streak);
`);
run('succès', `
  G.stats.tax = 20000; G.stats.sales = 2000; G.stats.missionsDone = 30; G.stats.orders = 12;
  G.xp = 100*100; // niveau 10+
  maybeAch();
  if (!G.ach['a_tax']) throw new Error('succès impôts non débloqué');
  if (!G.ach['a_lvl10']) throw new Error('succès niveau 10 non débloqué');
  if (!G.ach['a_m25']) throw new Error('succès défis non débloqué');
`);

// ── emploi ──
run('emploi', `
  A.offer({c:'0', o:'0'});
  A.pickMode({m:'partiel'});
  A.sign();
  if (G.jobs.length !== 1) throw new Error('contrat non signé');
  A.offer({c:'1', o:'0'});
  A.sign();
  if (G.jobs.length !== 2) throw new Error('2e contrat non signé');
  A.quitJob({i:'0'});
  if (G.jobs.length !== 1) throw new Error('démission échouée');
  A.offer({c:'99', o:'0'});   // borne invalide : doit être ignoré
  A.sign();                    // sans offre : ne doit rien faire
`);

// ── entreprises ──
run('entreprises', `
  G.diplomas.push('cap_bl','carteT','amf'); G.diplomas=[...new Set(G.diplomas)];
  A.openCreate({type:'boulangerie'}); A.createBiz({type:'boulangerie'});
  A.openCreate({type:'magasin'}); A.createBiz({type:'magasin'});
  A.openCreate({type:'immobilier'}); A.createBiz({type:'immobilier'});
  A.openCreate({type:'banque'}); A.createBiz({type:'banque'});
  if (G.biz.length !== 4) throw new Error('4 entreprises attendues, obtenu ' + G.biz.length);
  A.selBiz({i:'0'});
  ['overview','prod','mkt','hr','ups','compta'].forEach(t=>A.bizTab({t}));
  A.buyMat({b:'0', m:'farine', q:'50'}); A.buyMat({b:'0', m:'levure', q:'50'}); A.buyMat({b:'0', m:'beurre', q:'50'}); A.buyMat({b:'0', m:'sucre', q:'50'}); A.buyMat({b:'0', m:'choco', q:'50'});
  A.buyMat({b:'0', m:'zzz', q:'50'}); A.buyMat({b:'9', m:'farine', q:'50'});
  A.craft({b:'0', p:'baguette', q:'10'});
  A.craft({b:'0', p:'zzz', q:'10'});
  A.priceAdj({b:'0', p:'baguette', v:'0.1'});
  A.priceAdj({b:'0', p:'zzz', v:'0.1'});
  A.buyStock({b:'1', p:'epicerie', q:'50'});
  A.upgrade({b:'0', u:'four'}); A.upgrade({b:'0', u:'zzz'});
  A.mktDo({b:'0', a:'flyers'});
  A.mktDo({b:'0', a:'fidelite'});
  A.mktDo({b:'0', a:'flash'});
  A.mktDo({b:'0', a:'zzz'});
  A.hire({b:'0'}); A.hireConfirm({b:'0', i:'0'}); A.hireConfirm({b:'0', i:'9'});
  A.fire({b:'0', i:'0'}); A.fire({b:'0', i:'9'});
  A.buyMandat({b:'2'}); A.buyMandat({b:'0'});
  A.bankAdj({b:'3', k:'tc', v:'0.5'}); A.bankAdj({b:'3', k:'tl', v:'0.25'}); A.bankAdj({b:'3', k:'mkt'});
  G.biz[0].order = { p:'baguette', pn:'Baguette', qty:1, reward:10, until:Date.now()+60000 };
  G.biz[0].stock['baguette'] = 5;
  A.orderFill({b:'0'});
  A.orderFill({b:'0'});
  A.selBiz({i:'1'}); ['overview','prod','mkt','hr','ups','compta'].forEach(t=>A.bizTab({t}));
  A.selBiz({i:'2'}); ['overview','mkt','hr','ups','compta'].forEach(t=>A.bizTab({t}));
  A.selBiz({i:'3'}); ['overview','mkt','hr','ups','compta'].forEach(t=>A.bizTab({t}));
  A.selBiz({i:'99'});
  A.backBiz();
`);
await sleep(50);
run('ticks avec entreprises', `for (let i=0;i<300;i++) tick();`);

// ── missions / quêtes ──
run('missions', `
  G.missions.list.forEach((m,i)=>{ m.prog=m.tgt; A.claimMission({i:String(i)}); });
  G.quests.list.forEach((q,i)=>{ q.prog=q.tgt; A.claimQuest({i:String(i)}); });
  A.claimMission({i:'99'}); A.claimQuest({i:'99'});
`);

// ── garde à vue + caution ──
run('prison', `
  G.jail = Date.now() + 60000;
  if (!inJail()) throw new Error('inJail() devrait être vrai');
  A.payBail();
  if (inJail()) throw new Error('caution inefficace');
`);

// ── tutoriel ──
run('tutoriel', `
  G.tuto=0; UI.placeTuto();
  for(let i=0;i<11;i++) A.tutoNext();
  if (!G.stats.tutoDone) throw new Error('tutoDone non marqué');
  G.tuto=0; UI.placeTuto(); A.tutoSkip();
`);

// ── mailbox ops (admin/transferts) ──
run('applyOp', `
  const cash0 = balance();
  applyOp({ type:'credit', amount:500, from:'X' });
  applyOp({ type:'debit', amount:100, to:'Y' });
  applyOp({ type:'adminCredit', amount:500 });
  applyOp({ type:'adminDebit', amount:100 });
  applyOp({ type:'boost' });
  if (adminFactor() !== 1.5) throw new Error('boost admin inactif');
  applyOp({ type:'malus' });
  if (adminFactor() !== 0.5) throw new Error('malus admin inactif');
  applyOp({ type:'deleteBiz' });
  if (G.biz.length !== 0) throw new Error('deleteBiz inefficace');
  applyOp({ type:'reset' });
  if (G.cash !== 2000) throw new Error('reset inefficace');
  applyOp(null);
  applyOp({ type:'inconnu' });
  applyOp({ type:'credit', amount:NaN, from:'X' });
`);

// ── modales ──
run('modales', `
  G.cash = 1e6;
  A.openBank({id:'ce', name:"Caisse d'Épargne", rate:'3.0'});
  UI.openSendMoney(); UI.doSendMoney();
  A.openCreate({type:'magasin'}); A.createBiz({type:'magasin'});
  UI.openAnnounce(); UI.doAnnounce();
  UI.openAdmin();
  UI.modal('<h2>x</h2>'); UI.closeModal();
`);
await sleep(30);

// ── sauvegarde / recharge / offline ──
await runAsync('save+load+offline', `
  save();
  await new Promise(r=>setTimeout(r,120));
  const st = await DB.loadGame('Testeur');
  if (!st) throw new Error('sauvegarde locale introuvable');
  const s2 = sanitize(st);
  s2.last = Date.now() - 3*3600*1000;
  const off = offlineProgress(s2);
  if (!off || !(off.dt > 0)) throw new Error('offlineProgress invalide');
  const s3 = sanitize({ name:'X' });
  offlineProgress(s3);
  offlineProgress(null);
  const st2 = JSON.parse(JSON.stringify(st));
  const s4 = sanitize(st2);
  if (s4.v !== 11) throw new Error('version non migrée');
`);
await sleep(100);

// ── UI fx ──
run('UI fx', `
  UI.toast('test','good'); UI.toast('x','bad'); UI.toast('x','warn'); UI.toast('x','');
  UI.feed('<b>x</b>'); UI.floatText('+1','red');
  UI.moneyFx(10); UI.moneyFx(-10); UI.moneyFx(0.001);
  UI.cardFx('t','1 €'); UI.confetti();
  UI.moneyFly(); UI.moneyRain();
  UI.levelUp(3); UI.eventFx('good'); UI.eventFx('bad'); UI.screenShake();
  UI.achUnlock({ icon:'🏆', n:'Test', d:'d', xp:10 });
  UI.setWeather('rain'); UI.setWeather('snow'); UI.setWeather('sun'); UI.setWeather('heat');
  UI.reportError(new Error('test'), 'test');
  UI.flashSave(); UI.buildTicker(); UI.updateTop(); UI.render(true); UI.render();
  UI.pulseVital('rowFaim'); UI.pulseVital('zzz');
  FX.confetti(); FX.moneyRain(); FX.moneyFly(10,10); FX.spark(5,5,'#fff',4);
  FX.sound('click'); FX.sound('zzz'); FX.chart(null, [], 'rgb(1,2,3)');
`);
await sleep(300);

// ── événements forcés ──
run('fireEvent x60', `for (let i=0;i<60;i++) fireEvent();`);

// ── état corrompu (robustesse sanitize + render + tick) ──
run('sanitize corrompu', `
  const bad = { name:'X', biz:[{type:'boulangerie'},{type:'inconnu'},{type:'banque', accounts:-5, tauxCredit:99}], jobs:[{c:99,o:99},{c:0,o:0}], vitals:null, stats:{}, houses:[{i:99},{i:0,v:-100}], cars:[9,-3], inv:{zzz:2, baguette:-4, cafe:'x'}, insurances:['inconnu','mma'], bank:{bankId:'x', compte:'beaucoup', livret:1e9, loans:[{n:'L',reste:-5},{mens:10,reste:500}]}, diplomas:['inconnu','dev'], skills:{s_eff:99,zzz:3}, missions:{list:[{id:'zzz'},{id:'m_work',prog:'beaucoup'}]}, quests:{}, ach:{zzz:1,a_job:'x'}, daily:{lastDay:123,streak:-4}, journal:'pas-un-tableau', training:{id:'zzz'}, rental:{i:9}, ill:{heat:1e6,cd:'x'}, boost:{mul:-3,until:Date.now()+99999}, xp:-500, cash:NaN };
  const s = sanitize(bad);
  if (s.vitals.sante < 0 || s.vitals.sante > 100) throw new Error('vitals hors bornes');
  if (s.bank.livret > 22950) throw new Error('plafond livret non appliqué');
  if (s.jobs.length !== 1) throw new Error('emploi invalide conservé');
  if (s.biz.length !== 2) throw new Error('entreprises invalides non filtrées');
  if (s.cars.length !== 0) throw new Error('voitures invalides conservées');
  if (s.xp !== 0) throw new Error('xp négatif conservé');
  G = s;
  ['vie','inventaire','carriere','marche','entreprises','banque','immobilier','auto','assurances','sante','skills','economie','noir','plus','profil'].forEach(id=>UI.setTab(id));
  for (let i=0;i<120;i++) tick();
`);
await sleep(120);

// ── état minimal (sauvegarde vide) ──
run('sanitize vide', `
  G = sanitize({});
  UI.render();
  for (let i=0;i<30;i++) tick();
  G = sanitize(null);
`);
await sleep(50);

// ── fin ──
run('stop', `if (TICK_TIMER) { clearInterval(TICK_TIMER); TICK_TIMER = null; } FX.stop && FX.stop();`);
await sleep(80);
try { window.close(); } catch (e) {}

if (errors.length) {
  console.log('✗ ' + errors.length + ' ERREUR(S) :');
  errors.slice(0, 40).forEach(e => console.log('— ' + String(e).split('\n').slice(0, 4).join('\n  ')));
  quit(1);
} else {
  console.log('✓ Smoke test client passé — aucune erreur.');
  quit(0);
}
