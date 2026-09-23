/* ═══════════ HEXALIFE — Test d'intégration serveur ═══════════
 * Démarre le serveur sur un port dédié (base temporaire) et exerce TOUTES les
 * routes API + le statique (y compris les interdictions de sécurité).
 * Usage : node test/server.test.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
async function freePort() {
  for (let tries = 0; tries < 20; tries++) {
    const p = 3400 + Math.floor(Math.random() * 2000);
    try { await fetch('http://localhost:' + p + '/api/health', { signal: AbortSignal.timeout(300) }); }
    catch (e) { return p; }
  }
  throw new Error('aucun port libre trouvé');
}
const PORT = await freePort();
const BASE = 'http://localhost:' + PORT;
const TMPDB = '/tmp/hl-srvtest-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; failures.push(label); console.log('  ✗ ' + label); }
}
async function j(url, opts = {}, token) {
  const r = await fetch(BASE + url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch (e) { body = null; }
  return { status: r.status, body };
}

const srv = spawn(process.execPath, [path.join(ROOT, 'server/server.js')], {
  env: { ...process.env, PORT: String(PORT), DB_PATH: TMPDB, ADMIN_NAME: 'AdminTest', RATE_MULT: '100', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake' },
  stdio: 'ignore',
});
const quit = code => { try { srv.kill('SIGKILL'); } catch (e) {} try { fs.rmSync(TMPDB, { recursive: true, force: true }); } catch (e) {} process.exit(code); };
process.on('unhandledRejection', e => { console.error('REJET', e); quit(2); });

// attente démarrage
let up = false;
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(BASE + '/api/health'); if (r.ok) { up = true; break; } } catch (e) {}
  await new Promise(r => setTimeout(r, 150));
}
if (!up) { console.error('✗ Serveur non démarré'); quit(2); }

console.log('▶ HEXALIFE — tests serveur');

/* ── santé & statique ── */
{
  const h = await j('/api/health');
  ok(h.status === 200 && h.body.ok === true && h.body.v === 11, 'health ok v11');

  const idx = await fetch(BASE + '/');
  ok(idx.status === 200 && (idx.headers.get('content-type') || '').includes('text/html'), 'index servi');

  const jsf = await fetch(BASE + '/js/engine.js');
  ok(jsf.status === 200 && (jsf.headers.get('content-type') || '').includes('javascript'), 'engine.js servi');

  const db = await fetch(BASE + '/server/hexalife.db');
  ok(db.status === 403, 'hexalife.db BLOQUÉ (403) — reçu ' + db.status);

  const trav = await fetch(BASE + '/%2e%2e%2f%2e%2e%2fetc%2fpasswd');
  ok(trav.status === 403 || trav.status === 404, 'traversée de chemin bloquée');

  const nf = await fetch(BASE + '/zzz-inexistant.png');
  ok(nf.status === 404, '404 fichier inconnu');

  const api404 = await j('/api/zzz');
  ok(api404.status === 404, '404 route API inconnue');
}

/* ── comptes ── */
let tA = null, tB = null, tAdmin = null;
const TERMS = (await j('/api/terms')).body.version;
ok(!!TERMS, 'endpoint /api/terms expose une version');
{
  const r1 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'ab', email: 'x@x.fr', pass: 'Abcd1234!' }) });
  ok(r1.status === 400 && !!r1.body.err, 'register : pseudo trop court refusé');

  const r2 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Alice', email: 'invalide', pass: 'Abcd1234!' }) });
  ok(r2.status === 400, 'register : email invalide refusé');

  const r3 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Alice', email: 'a@a.fr', pass: 'x', acceptCgu: true, termsVersion: TERMS }) });
  ok(r3.status === 400, 'register : mot de passe court refusé');
  const rWeak = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Faible', email: 'f@f.fr', pass: 'abcdefgh', acceptCgu: true, termsVersion: TERMS }) });
  ok(rWeak.status === 400, 'register : mot de passe sans majuscule/chiffre refusé');
  const rNoCgu = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'SansCgu', email: 's@s.fr', pass: 'Abcd1234!' }) });
  ok(rNoCgu.status === 400, 'register : sans acceptation CGU refusé');

  const ra = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Alice', email: 'a@a.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  ok(ra.status === 200 && ra.body.token, 'register Alice ok');
  tA = ra.body.token;

  const dup = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Alice', email: 'b@b.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  ok(dup.status === 400, 'register : doublon refusé');
  const dupMail = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Alicia', email: 'a@a.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  ok(dupMail.status === 400, 'register : email doublon refusé');

  const rb = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Bob', email: 'b@b.fr', pass: 'Bcde1234!', acceptCgu: true, termsVersion: TERMS }) });
  ok(rb.status === 200 && rb.body.token, 'register Bob ok');
  tB = rb.body.token;

  const radm = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'AdminTest', email: 'ad@a.fr', pass: 'Admin1234!', acceptCgu: true, termsVersion: TERMS }) });
  ok(radm.status === 200, 'register admin ok');
  tAdmin = radm.body.token;

  const bad = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'Alice', pass: 'Zzzz9999!' }) });
  ok(bad.status === 400, 'login : mauvais mot de passe refusé');
  const byMail = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'a@a.fr', pass: 'Abcd1234!' }) });
  ok(byMail.status === 200 && byMail.body.name === 'Alice', 'login par e-mail ok');
  const noWho = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'Ghost', pass: 'Abcd1234!' }) });
  ok(noWho.status === 400, 'login : utilisateur inconnu refusé');

  const me = await j('/api/me', {}, tA);
  ok(me.status === 200 && me.body.name === 'Alice', 'me authentifié');
  const meNo = await j('/api/me');
  ok(meNo.status === 401, 'me sans token : 401');
  const meBad = await j('/api/me', {}, 'faux-token');
  ok(meBad.status === 401, 'me faux token : 401');
}

/* ── sauvegarde / chargement ── */
{
  const st = { v: 11, name: 'Alice', cash: 1234.5, biz: [{ type: 'banque', name: 'Bque Alice', tauxLivret: 2.4, accounts: 7 }], xp: 10000 };
  const sv = await j('/api/save', { method: 'POST', body: JSON.stringify({ state: st }) }, tA);
  ok(sv.status === 200 && sv.body.ok, 'save ok');
  const ld = await j('/api/load', {}, tA);
  ok(ld.status === 200 && ld.body.state && ld.body.state.cash === 1234.5, 'load round-trip');
  const svNoAuth = await j('/api/save', { method: 'POST', body: JSON.stringify({ state: st }) });
  ok(svNoAuth.status === 401, 'save sans token : 401');

  // mode beacon : token en query
  const st2 = JSON.parse(JSON.stringify(st)); st2.cash = 2000;
  const beacon = await fetch(BASE + '/api/save?token=' + encodeURIComponent(tA), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: st2 }),
  });
  const bj = await beacon.json();
  ok(beacon.status === 200 && bj.ok === true, 'save via token query (sendBeacon)');
  const ld2 = await j('/api/load', {}, tA);
  ok(ld2.body.state.cash === 2000, 'save beacon persisté');

  // Bob sans entreprise + solde
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'Bob', cash: 500, biz: [] } }) }, tB);
}

/* ── transferts + mailbox + holds ── */
{
  const bad1 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'Nobody', amount: 10 }) }, tA);
  ok(bad1.status === 400, 'transfer : destinataire inconnu refusé');
  const bad2 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'Alice', amount: 10 }) }, tA);
  ok(bad2.status === 400, 'transfer : soi-même refusé');
  const bad3 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'Bob', amount: -5 }) }, tA);
  ok(bad3.status === 400, 'transfer : montant négatif refusé');
  const bad4 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'Bob', amount: 1e12 }) }, tA);
  ok(bad4.status === 400, 'transfer : montant astronomique refusé');
  const bad5 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'Bob', amount: 999999 }) }, tA);
  ok(bad5.status === 400, 'transfer : solde insuffisant refusé');

  // Alice a 2000 ; Bob est trouvable en minuscules (résolution de casse)
  const t1 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'bob', amount: 300 }) }, tA);
  ok(t1.status === 200 && t1.body.ok, 'transfer ok (pseudo minuscules résolu)');
  ok(t1.body.tax === 15 && t1.body.total === 315, 'taxe de transfert 5 % calculée (15 € pour 300 €)');

  const mbB = await j('/api/mailbox', {}, tB);
  ok(mbB.status === 200 && mbB.body.ops.length === 1 && mbB.body.ops[0].type === 'credit' && mbB.body.ops[0].amount === 300, 'mailbox Bob : crédit 300');
  const mbA = await j('/api/mailbox', {}, tA);
  ok(mbA.body.ops.length === 1 && mbA.body.ops[0].type === 'debit', 'mailbox Alice : débit');

  // hold : 2000 - 300 détenus = 1700 dispo ; 1800 doit échouer
  const t2 = await j('/api/transfer', { method: 'POST', body: JSON.stringify({ to: 'Bob', amount: 1800 }) }, tA);
  ok(t2.status === 400, 'transfer : hold pris en compte (double dépense refusée)');

  // ack Alice libère le hold du débit
  const ackA = await j('/api/mailbox/ack', { method: 'POST', body: JSON.stringify({ ids: mbA.body.ops.map(o => o.id) }) }, tA);
  ok(ackA.status === 200, 'ack Alice ok');
  const mbA2 = await j('/api/mailbox', {}, tA);
  ok(mbA2.body.ops.length === 0, 'mailbox Alice vidée');

  // ack Bob
  const ackB = await j('/api/mailbox/ack', { method: 'POST', body: JSON.stringify({ ids: mbB.body.ops.map(o => o.id) }) }, tB);
  ok(ackB.status === 200, 'ack Bob ok');

  // ack d'ids inconnus : sans effet
  const ackX = await j('/api/mailbox/ack', { method: 'POST', body: JSON.stringify({ ids: ['zzz'] }) }, tB);
  ok(ackX.status === 200, 'ack ids inconnus toléré');
}

/* ── annonces ── */
{
  const noBiz = await j('/api/announce', { method: 'POST', body: JSON.stringify({ text: 'hello' }) }, tB);
  ok(noBiz.status === 400, 'announce sans entreprise refusé');

  const empty = await j('/api/announce', { method: 'POST', body: JSON.stringify({ text: '   ' }) }, tA);
  ok(empty.status === 400, 'announce texte vide refusé');

  const a1 = await j('/api/announce', { method: 'POST', body: JSON.stringify({ text: 'Promo baguettes !' }) }, tA);
  ok(a1.status === 200 && a1.body.ok, 'announce ok (Alice a une banque)');
  const a2 = await j('/api/announce', { method: 'POST', body: JSON.stringify({ text: 'Encore !' }) }, tA);
  ok(a2.status === 400, 'announce : cooldown 1 h appliqué');

  const list = await j('/api/announce');
  ok(list.status === 200 && list.body.list.some(x => x.text === 'Promo baguettes !' && x.biz === 'Bque Alice'), 'announce list contient le message + nom d’entreprise');
}

/* ── banques joueurs & clients ── */
{
  const banks = await j('/api/banks');
  ok(banks.status === 200 && banks.body.banks.some(b => b.owner === 'Alice' && b.livret === 2.4), 'banks : banque d’Alice listée');
  const bankId = banks.body.banks.find(b => b.owner === 'Alice').id;

  // Bob devient client de la banque d'Alice
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'Bob', cash: 10, biz: [], bank: { bankId, compte: 490, livret: 0, loans: [{ n: 'Conso', reste: 200, mens: 20 }] } } }) }, tB);
  const clients = await j('/api/banks/clients', {}, tA);
  ok(clients.status === 200 && clients.body.clients.length === 1 && clients.body.clients[0].name === 'Bob' && clients.body.clients[0].compte === 490, 'banks/clients : Bob client d’Alice');
  const clientsNo = await j('/api/banks/clients');
  ok(clientsNo.status === 401, 'banks/clients sans token : 401');
}

/* ── classement ── */
{
  const lb = await j('/api/leaderboard', {}, tA);
  ok(lb.status === 200 && Array.isArray(lb.body.list) && lb.body.list.length === 2, 'leaderboard : 2 joueurs');
  ok(lb.body.list[0].name === 'Alice' && lb.body.list[0].me === true, 'leaderboard : Alice première + flag me');
  ok(lb.body.rank === 1 && lb.body.total === 2, 'leaderboard : rang + total');
  const lbNo = await j('/api/leaderboard');
  ok(lbNo.status === 401, 'leaderboard sans token : 401');
}

/* ── admin ── */
{
  const forbidden = await j('/api/admin/users', {}, tA);
  ok(forbidden.status === 403, 'admin/users : non-admin refusé');

  const users = await j('/api/admin/users', {}, tAdmin);
  ok(users.status === 200 && users.body.users.length === 3, 'admin/users : 3 utilisateurs');

  const self = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'AdminTest', action: 'addMoney', amount: 10 }) }, tAdmin);
  ok(self.status === 400, 'admin : action sur soi-même refusée (hors boost)');
  const selfBoost = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'AdminTest', action: 'boost' }) }, tAdmin);
  ok(selfBoost.status === 200, 'admin : boost sur soi autorisé');

  const add = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'Bob', action: 'addMoney', amount: 250 }) }, tAdmin);
  ok(add.status === 200, 'admin addMoney ok');
  const mb = await j('/api/mailbox', {}, tB);
  ok(mb.body.ops.some(o => o.type === 'adminCredit' && o.amount === 250), 'admin : adminCredit dans la mailbox de Bob');

  const badAmt = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'Bob', action: 'addMoney', amount: 0 }) }, tAdmin);
  ok(badAmt.status === 400, 'admin addMoney montant 0 refusé');
  const unknown = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'Bob', action: 'zzz' }) }, tAdmin);
  ok(unknown.status === 400, 'admin action inconnue refusée');
  const noTarget = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'Nobody', action: 'boost' }) }, tAdmin);
  ok(noTarget.status === 400, 'admin cible inconnue refusée');

  const del = await j('/api/admin/action', { method: 'POST', body: JSON.stringify({ target: 'Bob', action: 'deleteAccount' }) }, tAdmin);
  ok(del.status === 200, 'admin deleteAccount ok');
  const gone = await j('/api/me', {}, tB);
  ok(gone.status === 401, 'compte supprimé : session révoquée');
}

/* ── sauvegarde insane refusée ── */
{
  const bad = await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, cash: 1e15 } }) }, tA);
  ok(bad.status === 400, 'save : valeur hors limites refusée (anti-triche)');
  const bad2 = await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, biz: new Array(9).fill({ type: 'banque' }) } }) }, tA);
  ok(bad2.status === 400, 'save : trop d’entreprises refusé');
}

/* ── webhook Stripe : signature vérifiée ── */
{
  const crypto = await import('node:crypto');
  const t = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: { client_reference_id: 'Alice', metadata: { user: 'Alice', pack: 'p1' } } } });
  const sig = 't=' + t + ',v1=' + crypto.createHmac('sha256', 'whsec_fake').update(t + '.' + payload).digest('hex');
  const r = await fetch(BASE + '/api/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': sig }, body: payload });
  ok(r.status === 200, 'webhook Stripe signature valide accepté');
  const mb = await j('/api/mailbox', {}, tA);
  ok((mb.body.ops || []).some(o => o.type === 'packCredit' && o.amount === 5000), 'webhook : pack crédité automatiquement dans la mailbox');
  const badSig = await fetch(BASE + '/api/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=' + t + ',v1=' + '0'.repeat(64) }, body: payload });
  ok(badSig.status === 400, 'webhook Stripe signature invalide refusé');
  const noSig = await fetch(BASE + '/api/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
  ok(noSig.status === 400, 'webhook sans signature refusé');
}

/* ── aucune limitation du nombre de sessions/comptes ── */
{
  await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'MultiSession', email: 'ms@ms.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  const tokens = [];
  for (let i = 0; i < 7; i++) {
    const r = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'MultiSession', pass: 'Abcd1234!' }) });
    if (r.status === 200) tokens.push(r.body.token);
  }
  ok(tokens.length === 7, '7 connexions simultanées acceptées (aucune limite de sessions)');
  let allOk = true;
  for (const t of tokens) { const me = await j('/api/me', {}, t); if (me.status !== 200) allOk = false; }
  ok(allOk, 'toutes les sessions restent valides (aucune déconnexion forcée)');
}

/* ── achats dans un magasin joueur ── */
{
  const ro = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'ShopOwner', email: 'so@so.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  const tO = ro.body.token;
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'ShopOwner', cash: 0, biz: [{ type: 'magasin', name: 'Mag de ShopOwner', grocery: { margin: 0.20, stock: 5 } }] } }) }, tO);
  const rb2 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'Buyer', email: 'bu@bu.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  const tBu = rb2.body.token;
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'Buyer', cash: 100 } }) }, tBu);
  const shops = await j('/api/shops');
  ok(shops.status === 200 && shops.body.shops.some(x => x.owner === 'ShopOwner' && x.stock === 5 && Math.abs(x.margin - 0.2) < 1e-9), 'shops : magasin joueur listé avec marge+stock');
  const buy = await j('/api/buyShop', { method: 'POST', body: JSON.stringify({ owner: 'ShopOwner', idx: 0, food: 'eau', q: 2 }) }, tBu);
  ok(buy.status === 200 && Math.abs(buy.body.price - 2.04) < 1e-9, 'buyShop : prix = base × (1+marge) × q (2,04 €)');
  const mbB = await j('/api/mailbox', {}, tBu);
  ok((mbB.body.ops || []).some(o => o.type === 'shopDebit'), 'buyShop : débit acheteur en mailbox');
  const mbO = await j('/api/mailbox', {}, tO);
  ok((mbO.body.ops || []).some(o => o.type === 'shopSale' && o.q === 2), 'buyShop : crédit vendeur en mailbox');
  const buyToo = await j('/api/buyShop', { method: 'POST', body: JSON.stringify({ owner: 'ShopOwner', idx: 0, food: 'eau', q: 9 }) }, tBu);
  ok(buyToo.status === 400, 'buyShop : stock insuffisant refusé');
  const buySelf = await j('/api/buyShop', { method: 'POST', body: JSON.stringify({ owner: 'ShopOwner', idx: 0, food: 'eau', q: 1 }) }, tO);
  ok(buySelf.status === 400, 'buyShop : achat sur soi-même refusé');
}

/* ── contrats B2B entre joueurs ── */
{
  const r1 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'B2BA', email: 'a@b2b.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  const r2 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'B2BB', email: 'b@b2b.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  const tA2 = r1.body.token, tB2 = r2.body.token;
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'B2BA', cash: 5000, biz: [{ type: 'magasin', name: 'A' }] } }) }, tA2);
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'B2BB', cash: 100, biz: [{ type: 'magasin', name: 'B' }] } }) }, tB2);
  const offBad = await j('/api/b2b/offer', { method: 'POST', body: JSON.stringify({ to: 'B2BB', pct: 7 }) }, tA2);
  ok(offBad.status === 400, 'b2b : pct hors barème refusé');
  const off = await j('/api/b2b/offer', { method: 'POST', body: JSON.stringify({ to: 'B2BB', pct: 10 }) }, tA2);
  ok(off.status === 200 && off.body.fee === 2000, 'b2b : offre créée (frais 2 000 €)');
  const mineB = await j('/api/b2b/mine', {}, tB2);
  ok(mineB.body.incoming.length === 1 && mineB.body.incoming[0].from === 'B2BA', 'b2b : offre reçue visible');
  const accPoor = await j('/api/b2b/accept', { method: 'POST', body: JSON.stringify({ id: mineB.body.incoming[0].id }) }, tA2);
  ok(accPoor.status === 400, 'b2b : acceptation par un non-destinataire refusée');
  // B2BB accepte mais le payeur (B2BA) a les fonds : c'est B2BA qui paie → accept par B2BB ok
  const acc = await j('/api/b2b/accept', { method: 'POST', body: JSON.stringify({ id: mineB.body.incoming[0].id }) }, tB2);
  ok(acc.status === 200, 'b2b : acceptation ok (payeur solvable)');
  const mbA = await j('/api/mailbox', {}, tA2);
  ok((mbA.body.ops || []).some(o => o.type === 'b2bDebit' && o.amount === 2000) && (mbA.body.ops || []).some(o => o.type === 'b2bStart' && o.dir === 'out'), 'b2b : débit + start chez le payeur');
  const mbB = await j('/api/mailbox', {}, tB2);
  ok((mbB.body.ops || []).some(o => o.type === 'b2bCredit' && o.amount === 2000), 'b2b : crédit chez le bénéficiaire');
  const mineA = await j('/api/b2b/mine', {}, tA2);
  ok(mineA.body.active.length === 1 && mineA.body.active[0].dir === 'out' && mineA.body.active[0].with === 'B2BB', 'b2b : contrat actif listé');
  const dup = await j('/api/b2b/offer', { method: 'POST', body: JSON.stringify({ to: 'B2BB', pct: 5 }) }, tA2);
  ok(dup.status === 400, 'b2b : second contrat avec même joueur refusé');
  // refuse path (3e joueur pour éviter le contrat déjà actif)
  const r3 = await j('/api/register', { method: 'POST', body: JSON.stringify({ user: 'B2BC', email: 'c@b2b.fr', pass: 'Abcd1234!', acceptCgu: true, termsVersion: TERMS }) });
  const tC2 = r3.body.token;
  await j('/api/save', { method: 'POST', body: JSON.stringify({ state: { v: 11, name: 'B2BC', cash: 0, biz: [{ type: 'magasin', name: 'C' }] } }) }, tC2);
  const off2 = await j('/api/b2b/offer', { method: 'POST', body: JSON.stringify({ to: 'B2BA', pct: 5 }) }, tC2);
  ok(off2.status === 200, 'b2b : offre d’un 3e joueur créée');
  const mineA2 = await j('/api/b2b/mine', {}, tA2);
  const incId = (mineA2.body.incoming || [])[0] && mineA2.body.incoming[0].id;
  const ref = await j('/api/b2b/refuse', { method: 'POST', body: JSON.stringify({ id: incId }) }, tA2);
  ok(ref.status === 200 && ref.body.ok === true, 'b2b : refus d’offre ok');
}

/* ── présence & ping ── */
{
  const p1 = await j('/api/ping', { method: 'POST' }, tA);
  ok(p1.status === 200 && p1.body.count >= 1 && p1.body.isAdmin === false, 'ping Alice : count + isAdmin false');
  const p2 = await j('/api/ping', { method: 'POST' }, tAdmin);
  ok(p2.body.isAdmin === true, 'ping admin : isAdmin true');
  const pres = await j('/api/presence');
  ok(pres.status === 200 && pres.body.names.includes('Alice'), 'presence contient Alice');
}

/* ── logout & suppression ── */
{
  const lo = await j('/api/logout', { method: 'POST' }, tA);
  ok(lo.status === 200, 'logout ok');
  const after = await j('/api/me', {}, tA);
  ok(after.status === 401, 'session invalidée après logout');

  const relog = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'Alice', pass: 'Abcd1234!' }) });
  const tA2 = relog.body.token;
  const del = await j('/api/delete', { method: 'POST' }, tA2);
  ok(del.status === 200, 'delete account ok');
  const relog2 = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'Alice', pass: 'Abcd1234!' }) });
  ok(relog2.status === 400, 'compte supprimé : login impossible');
}

/* ── corps invalide toléré ── */
{
  const r = await fetch(BASE + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{json-casse' });
  ok(r.status === 400, 'JSON cassé : 400 propre (pas de 500)');
}

/* ── rate limiting (serveur dédié, limites réelles) ── */
{
  const PORT2 = PORT + 1;
  const srv2 = spawn(process.execPath, [path.join(ROOT, 'server/server.js')], {
    env: { ...process.env, PORT: String(PORT2), DB_PATH: TMPDB + '-rl' }, stdio: 'ignore',
  });
  const B2 = 'http://localhost:' + PORT2;
  let up2 = false;
  for (let i = 0; i < 40; i++) { try { const r = await fetch(B2 + '/api/health'); if (r.ok) { up2 = true; break; } } catch (e) {} await new Promise(r => setTimeout(r, 120)); }
  if (up2) {
    let got429 = false;
    for (let i = 0; i < 16; i++) {
      const r = await fetch(B2 + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: 'nobody', pass: 'Abcd1234!' }) });
      if (r.status === 429) { got429 = true; break; }
    }
    ok(got429, 'rate-limit auth : 429 après rafale');
  } else ok(false, 'serveur rate-limit démarré');
  try { srv2.kill('SIGKILL'); } catch (e) {}
  try { fs.rmSync(TMPDB + '-rl', { recursive: true, force: true }); } catch (e) {}
}

console.log(fail ? '✗ ' + fail + ' échec(s) / ' + (pass + fail) : '✓ ' + pass + ' assertions serveur passées');
failures.forEach(f => console.log('  — ' + f));
quit(fail ? 1 : 0);
