/* ═══════════ HEXALIFE — Test compatibilité Upstash + migration legacy ═══════════
 * Simule l'API REST Upstash en local, y dépose une base au FORMAT ANCIEN (v10 :
 * sessions en chaînes, saves v10), démarre le vrai serveur en mode Upstash et
 * vérifie : lecture, migration, persistance après redémarrage (redeploy Render).
 * Usage : node test/upstash.test.mjs
 */
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 0; // port libre pour le mock
const GAME_PORT = await freePort();
const BASE = 'http://localhost:' + GAME_PORT;

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) pass++; else { fail++; console.log('  ✗ ' + label); } }
async function freePort() {
  for (let t = 0; t < 20; t++) {
    const p = 4200 + Math.floor(Math.random() * 2000);
    try { await fetch('http://localhost:' + p + '/api/health', { signal: AbortSignal.timeout(300) }); }
    catch (e) { return p; }
  }
  throw new Error('pas de port libre');
}
async function j(url, opts = {}, token) {
  const r = await fetch(BASE + url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  });
  let body = null; try { body = await r.json(); } catch (e) {}
  return { status: r.status, body };
}

/* ── mock Upstash REST : POST / avec ["GET",k] ou ["SET",k,v] → { result } ── */
const store = new Map();
let setCount = 0;
const mock = http.createServer((req, res) => {
  let d = '';
  req.on('data', c => d += c);
  req.on('end', () => {
    let cmd = [];
    try { cmd = JSON.parse(d); } catch (e) {}
    let result = null;
    if (cmd[0] === 'GET') result = store.has(cmd[1]) ? store.get(cmd[1]) : null;
    else if (cmd[0] === 'SET') { store.set(cmd[1], cmd[2]); result = 'OK'; setCount++; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result }));
  });
});
await new Promise(r => mock.listen(PORT, r));
const mockPort = mock.address().port;
const UP_URL = 'http://localhost:' + mockPort;
const UP_TOKEN = 'faux-token-upstash';
const DB_KEY = 'hexalife:db';

/* ── base legacy (format AVANT la v11) déposée dans le mock ── */
const salt = crypto.randomBytes(8).toString('hex');
const hash = crypto.scryptSync('ancienpass', salt, 32).toString('hex');
const legacyDB = {
  users: { VieuxPote: { email: 'vieux@pote.fr', salt, hash, created: Date.now() - 9e8 } },
  sessions: { 'token-legacy-123': 'VieuxPote' },          // ancien format : chaîne
  saves: {
    VieuxPote: {                                          // ancienne save v10
      v: 10, name: 'VieuxPote', created: Date.now() - 9e8, last: Date.now() - 3600e3,
      cash: 4242.42, xp: 2500, vitals: { sante: 80, faim: 60, soif: 50 },
      jobs: [{ c: 0, o: 0, title: 'Apprenti boulanger', h: 12.3, mode: 'plein', since: 1, mins: 10, promo: false }],
      biz: [{ type: 'boulangerie', name: 'Mon Fournil', rep: 61, stock: { baguette: 3 }, mats: { farine: 9 }, prices: { baguette: 1.2 }, emps: [{ n: 'Lea Martin', h: 14 }], ups: { four: 1 }, perks: {}, hist: [1, 2], counters: { baguette: 4 }, wagesTotal: 5, rev: 40, sold: 4, profit: 3, boostUntil: 0, boostMul: 1, promoUntil: 0, order: null }],
      bank: { bankId: 'ce', bankName: null, playerRate: null, compte: 900, livret: 100, loans: [] },
      diplomas: ['base'], skills: { s_eff: 2 }, journal: [{ t: Date.now(), label: 'Salaire', amt: 5 }],
      missions: { list: [], refreshAt: 0 }, quests: { list: [], refreshAt: 0 },
      ill: { unlocked: false, heat: 0, cd: {} }, stats: { earned: 900, tax: 40, spent: 10, sales: 4 },
    },
  },
  mailbox: {}, announces: [], announceCd: {},
  // pas de "holds" : champ apparu après → doit être créé par migrate()
};
store.set(DB_KEY, JSON.stringify(legacyDB));

/* ── démarrage du vrai serveur en mode Upstash ── */
function startGame() {
  return spawn(process.execPath, [path.join(ROOT, 'server/server.js')], {
    env: { ...process.env, PORT: String(GAME_PORT), UPSTASH_REDIS_REST_URL: UP_URL, UPSTASH_REDIS_REST_TOKEN: UP_TOKEN, DB_KEY },
    stdio: 'ignore',
  });
}
async function waitHealth() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + '/api/health'); if (r.ok) return await r.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}
let srv = startGame();
let health = await waitHealth();

console.log('▶ HEXALIFE — tests Upstash / Render / migration legacy');
ok(!!health && health.ok === true, 'serveur démarré');
ok(health && health.mode === 'upstash', 'mode = upstash détecté (reçu : ' + (health && health.mode) + ')');

/* ── login sur un compte legacy ── */
const login = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'VieuxPote', pass: 'ancienpass' }) });
ok(login.status === 200 && login.body.token, 'login compte legacy ok');
const tk = login.body.token;

/* ── load : la save v10 revient intacte (le client la migrera) ── */
const load = await j('/api/load', {}, tk);
ok(load.status === 200 && load.body.state && load.body.state.v === 10 && load.body.state.cash === 4242.42, 'save v10 relue depuis Upstash');
ok(load.body.state.biz && load.body.state.biz[0].name === 'Mon Fournil', 'entreprise legacy présente');

/* ── save v11 → SET Upstash → le mock contient la base migrée ── */
const migrated = JSON.parse(JSON.stringify(load.body.state));
migrated.v = 11; migrated.ach = { a_job: Date.now() }; migrated.daily = { lastDay: '', streak: 0 };
const sv = await j('/api/save', { method: 'POST', body: JSON.stringify({ state: migrated }) }, tk);
ok(sv.status === 200 && sv.body.ok, 'save v11 acceptée');
await new Promise(r => setTimeout(r, 700)); // laisse le debounce persist() partir vers Upstash
const raw = store.get(DB_KEY);
ok(!!raw, 'SET Upstash reçu (persistance)');
const persisted = raw ? JSON.parse(raw) : {};
ok(persisted.holds && typeof persisted.holds === 'object', 'migrate() : champ holds créé');
ok(persisted.sessions && persisted.sessions['token-legacy-123'] && persisted.sessions['token-legacy-123'].name === 'VieuxPote',
  'migrate() : session legacy (chaîne) convertie en objet {name, at}');
ok(persisted.saves.VieuxPote.v === 11 && persisted.saves.VieuxPote.ach && persisted.saves.VieuxPote.ach.a_job > 0, 'save v11 persistée sur Upstash');
ok(persisted.users.VieuxPote.hash === hash, 'haché mot de passe préservé');

/* ── classement + présence passent aussi par la base Upstash ── */
const lb = await j('/api/leaderboard', {}, tk);
ok(lb.status === 200 && lb.body.list.length === 1 && lb.body.list[0].name === 'VieuxPote', 'leaderboard sur base Upstash');

/* ── redémarrage (simule un redeploy Render) : rien ne doit être perdu ── */
srv.kill('SIGKILL');
await new Promise(r => setTimeout(r, 400));
srv = startGame();
health = await waitHealth();
ok(!!health && health.mode === 'upstash', 'redémarrage : reconnexion Upstash');
const login2 = await j('/api/login', { method: 'POST', body: JSON.stringify({ user: 'VieuxPote', pass: 'ancienpass' }) });
ok(login2.status === 200, 'login après redeploy ok');
const load2 = await j('/api/load', {}, login2.body.token);
ok(load2.body.state && load2.body.state.v === 11 && load2.body.state.biz[0].name === 'Mon Fournil', 'données intactes après redeploy');
const ping = await j('/api/ping', { method: 'POST' }, login2.body.token);
ok(ping.status === 200 && ping.body.count >= 1, 'présence ok après redeploy');

/* ── sans Upstash configuré : repli fichier (mode local Render sans Redis) ── */
srv.kill('SIGKILL');
await new Promise(r => setTimeout(r, 300));
mock.close();

console.log(fail ? '✗ ' + fail + ' échec(s) / ' + (pass + fail) : '✓ ' + pass + ' assertions Upstash/migration passées');
process.exit(fail ? 1 : 0);
