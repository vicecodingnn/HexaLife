/* ═══════════ HEXALIFE — serveur Node v11 (transferts, annonces, admin, classement) ═══════════
 * Corrections : corps de requête borné (413), comparaison de hachés sûre, sessions
 * expirantes, réservations de transfert persistées, résolution de pseudo robuste,
 * chemin statique strict. Nouveauté : /api/leaderboard + /api/save?token= (sendBeacon).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const API_ENABLED = process.env.API_DISABLED !== '1';
const ADMIN_NAME = (process.env.ADMIN_NAME || '').trim();
const VERSION = 11;
const SESSION_TTL = 30 * 86400 * 1000; // 30 jours
const MAX_TRANSFER = 1e9;
const TERMS_VERSION = '2025-09-01';
const INACTIVE_DELETE_MS = 5 * 86400 * 1000; // compte inactif 5 j -> suppression
const STRIPE_SK = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WS = process.env.STRIPE_WEBHOOK_SECRET || '';
const RATE_MULT = parseFloat(process.env.RATE_MULT || '1');
const PACKS = { p1: 5000, p2: 12000, p3: 35000, p4: 80000 };
const PACK_CENTS = { p1: 499, p2: 999, p3: 2499, p4: 4999 };

const UP_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const DB_KEY = process.env.DB_KEY || 'hexalife:db';
const USE_UPSTASH = !!(UP_URL && UP_TOKEN);

const DB_DIR = process.env.DB_PATH || __dirname;
const DB_FILE = path.join(DB_DIR, 'hexalife.db');

let DB = { users: {}, sessions: {}, saves: {}, holds: {} };
let PRESENCE = {};

async function upCommand(cmd) {
  const r = await fetch(UP_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + UP_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error('Upstash HTTP ' + r.status);
  const j = await r.json();
  return j.result;
}

function migrate(d) {
  if (!d || typeof d !== 'object') d = {};
  d.users = d.users || {};
  d.saves = d.saves || {};
  d.mailbox = d.mailbox || {};
  d.b2b = d.b2b || { offers: [], active: [] };
  d.announces = Array.isArray(d.announces) ? d.announces : [];
  d.announceCd = d.announceCd || {};
  d.holds = d.holds || {};
  // sessions : ancien format (token → name) → nouveau (token → {name, at})
  const s = d.sessions || {};
  for (const t of Object.keys(s)) {
    if (typeof s[t] === 'string') s[t] = { name: s[t], at: Date.now() };
    if (!s[t] || typeof s[t] !== 'object' || !s[t].name || Date.now() - (s[t].at || 0) > SESSION_TTL) delete s[t];
  }
  d.sessions = s;
  for (const u of Object.keys(d.users)) if (!d.users[u].lastActive) d.users[u].lastActive = d.users[u].created || Date.now();
  return d;
}

async function loadDB() {
  let d;
  if (USE_UPSTASH) {
    try {
      const raw = await upCommand(['GET', DB_KEY]);
      d = raw ? JSON.parse(raw) : null;
      if (raw) console.log('[DB] Base chargée depuis Upstash.');
    } catch (e) { console.error('[DB] Lecture Upstash échouée :', e.message); }
  } else {
    try {
      fs.mkdirSync(DB_DIR, { recursive: true });
      d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      console.log('[DB] Base chargée depuis fichier : ' + DB_FILE);
      if (!process.env.DB_PATH) console.warn('[DB] ⚠ fichier LOCAL ÉPHÉMÈRE sur Render gratuit (définir DB_PATH ou Upstash).');
    } catch (e) { d = null; }
  }
  return migrate(d);
}

async function persistNow() {
  const payload = JSON.stringify(DB);
  if (USE_UPSTASH) { await upCommand(['SET', DB_KEY, payload]); return; }
  fs.mkdirSync(DB_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, payload);
  fs.renameSync(tmp, DB_FILE); // écriture atomique
}
let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; persistNow().catch(e => console.error('[DB] Écriture échouée :', e.message)); }, 400);
}
setInterval(() => { persistNow().catch(() => {}); }, 30000);
setInterval(() => {
  const now = Date.now();
  for (const k in PRESENCE) { if (now - PRESENCE[k] > 120000) delete PRESENCE[k]; }
  for (const t in DB.sessions) { if (now - (DB.sessions[t].at || 0) > SESSION_TTL) delete DB.sessions[t]; }
}, 30000);
setInterval(purgeInactive, 30 * 60 * 1000);
process.on('SIGTERM', async () => { try { await persistNow(); } catch (e) {} process.exit(0); });
process.on('SIGINT', async () => { try { await persistNow(); } catch (e) {} process.exit(0); });

const hashPass = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a), 'hex'), bb = Buffer.from(String(b), 'hex');
  return ba.length === bb.length && ba.length > 0 && crypto.timingSafeEqual(ba, bb);
};
const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m || '');
const isAdminUser = n => !!ADMIN_NAME && n === ADMIN_NAME;
/* mot de passe fort : 8+ caracteres, minuscule, majuscule, chiffre */
function passPolicy(p) {
  p = String(p || '');
  if (p.length < 8) return 'Mot de passe : 8 caractères minimum.';
  if (!/[a-z]/.test(p)) return 'Mot de passe : au moins une minuscule.';
  if (!/[A-Z]/.test(p)) return 'Mot de passe : au moins une majuscule.';
  if (!/[0-9]/.test(p)) return 'Mot de passe : au moins un chiffre.';
  if (p.length > 128) return 'Mot de passe : 128 caractères maximum.';
  return null;
}
/* en-tetes de securite sur TOUTES les reponses */
const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};
/* rate limiting par IP (glissant 60 s) + verrou anti brute-force */
const RL = {};
const LOCK = {};
function rateOk(ip, cls, max) {
  const lim = Math.max(1, Math.round(max * RATE_MULT));
  const k = ip + '|' + cls;
  const now = Date.now();
  const e = RL[k] || (RL[k] = { n: 0, t: now });
  if (now - e.t > 60000) { e.n = 0; e.t = now; }
  e.n++;
  return e.n <= lim;
}
function locked(ip, user) {
  const e = LOCK[ip + '|' + String(user).toLowerCase()];
  return !!(e && e.until && Date.now() < e.until);
}
function failAuth(ip, user) {
  const k = ip + '|' + String(user).toLowerCase();
  const e = LOCK[k] || (LOCK[k] = { fails: 0, until: 0 });
  e.fails++;
  if (e.fails >= 8) { e.until = Date.now() + 15 * 60 * 1000; e.fails = 0; }
}
function okAuth(ip, user) { delete LOCK[ip + '|' + String(user).toLowerCase()]; }
setInterval(() => {
  const now = Date.now();
  for (const k in RL) if (now - RL[k].t > 120000) delete RL[k];
  for (const k in LOCK) if (LOCK[k].until && now - LOCK[k].until > 20 * 60 * 1000) delete LOCK[k];
}, 60000);
const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?';
/* validation sanitaire d'une sauvegarde entrante */
function saveSane(st) {
  if (!st || typeof st !== 'object' || Array.isArray(st)) return false;
  const fin = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  if ('cash' in st && !fin(st.cash, -1e12, 1e12)) return false;
  if ('xp' in st && !fin(st.xp, 0, 1e9)) return false;
  if (st.bank && typeof st.bank === 'object') {
    if (!fin(st.bank.compte == null ? 0 : st.bank.compte, -1e12, 1e12)) return false;
    if (!fin(st.bank.livret == null ? 0 : st.bank.livret, 0, 22950)) return false;
    if (Array.isArray(st.bank.loans) && st.bank.loans.length > 6) return false;
  }
  if (Array.isArray(st.jobs) && st.jobs.length > 4) return false;
  if (Array.isArray(st.biz) && st.biz.length > 8) return false;
  if (Array.isArray(st.houses) && st.houses.length > 12) return false;
  if (Array.isArray(st.cars) && st.cars.length > 8) return false;
  if (Array.isArray(st.journal) && st.journal.length > 100) return false;
  if (Array.isArray(st.histBal) && st.histBal.length > 120) return false;
  if (typeof st.name === 'string' && st.name.length > 20) return false;
  return true;
}
/* purge des comptes inactifs (5 jours) */
function purgeInactive() {
  const now = Date.now();
  let n = 0;
  for (const u of Object.keys(DB.users)) {
    const last = DB.users[u].lastActive || DB.users[u].created || 0;
    if (now - last > INACTIVE_DELETE_MS) {
      delete DB.users[u]; delete DB.saves[u]; delete DB.mailbox[u];
      delete DB.holds[u]; delete DB.announceCd[u]; delete PRESENCE[u];
      for (const t in DB.sessions) if (DB.sessions[t].name === u) delete DB.sessions[t];
      n++;
    }
  }
  if (n) { console.log('[SEC] purge inactivité : ' + n + ' compte(s) supprimé(s)'); persist(); }
}

function readBody(req) {
  return new Promise((res) => {
    let d = '';
    let dead = false;
    req.on('data', c => {
      d += c;
      if (d.length > 6e6 && !dead) { dead = true; res({ __tooBig: true }); try { req.destroy(); } catch (e) {} }
    });
    req.on('end', () => { if (!dead) { try { res(d ? JSON.parse(d) : {}); } catch (e) { res({}); } } });
    req.on('error', () => { if (!dead) res({}); });
  });
}
function json(res, code, obj) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SEC_HEADERS));
  res.end(JSON.stringify(obj));
}
function readRaw(req) {
  return new Promise(res => {
    let d = '';
    let done = false;
    req.on('data', c => { d += c; if (d.length > 1e6 && !done) { done = true; try { req.destroy(); } catch (e) {} res(d); } });
    req.on('end', () => { if (!done) res(d); });
    req.on('error', () => { if (!done) { done = true; res(d); } });
  });
}
function touchUser(name) { if (DB.users[name]) DB.users[name].lastActive = Date.now(); }
function authUser(req, query) {
  let token = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!token && query && query.token) token = String(query.token); // sendBeacon (pas d'en-têtes)
  if (!token) return null;
  const sess = DB.sessions[token];
  if (!sess) return null;
  sess.at = Date.now(); // session glissante
  return { token, name: sess.name };
}
function presenceSnapshot() {
  const now = Date.now();
  const names = [];
  for (const k in PRESENCE) { if (now - PRESENCE[k] < 60000) names.push(k); }
  return { count: names.length, names };
}
function isOnline(name) { return !!PRESENCE[name] && (Date.now() - PRESENCE[name] < 60000); }
function savesBalance(name) {
  const s = DB.saves[name];
  if (!s || typeof s !== 'object') return 0;
  const b = (s.bank && s.bank.bankId) ? (s.bank.compte || 0) : (s.cash || 0);
  return typeof b === 'number' && isFinite(b) ? b : 0;
}
function findUser(raw) {
  const name = String(raw || '').trim();
  if (DB.users[name] || DB.saves[name]) return name;
  const lower = name.toLowerCase();
  const hit = Object.keys(DB.users).find(k => k.toLowerCase() === lower);
  return hit || null;
}
const rid = () => crypto.randomBytes(6).toString('hex');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json'
};

function parseUrl(rawUrl) {
  const u = new URL(rawUrl, 'http://internal');
  return { pathname: u.pathname, query: Object.fromEntries(u.searchParams.entries()) };
}

const server = http.createServer(async (req, res) => {
  let pathname = '/', query = {};
  try { ({ pathname, query } = parseUrl(req.url || '/')); } catch (e) { return json(res, 400, { err: 'URL invalide.' }); }
  const url = pathname;
  try {
    if (url.startsWith('/api/')) {
      if (!API_ENABLED) return json(res, 404, { ok: false, err: 'API désactivée.' });
      const ip = clientIp(req);
      /* webhook Stripe : payload brut + verification de signature */
      if (url === '/api/stripe/webhook' && req.method === 'POST') {
        if (!STRIPE_WS || !STRIPE_SK) return json(res, 400, { err: 'Stripe non configuré.' });
        if (!rateOk(ip, 'webhook', 60)) return json(res, 429, { err: 'Trop de requêtes.' });
        const raw = await readRaw(req);
        const m = /t=(\d+),v1=([a-f0-9]+)/.exec(req.headers['stripe-signature'] || '');
        if (!m) return json(res, 400, { err: 'Signature manquante.' });
        if (Math.abs(Date.now() / 1000 - (+m[1])) > 300) return json(res, 400, { err: 'Signature expirée.' });
        const expect = crypto.createHmac('sha256', STRIPE_WS).update(m[1] + '.' + raw).digest('hex');
        if (!safeEqual(expect, m[2])) return json(res, 400, { err: 'Signature invalide.' });
        let ev = {}; try { ev = JSON.parse(raw); } catch (e) { return json(res, 400, { err: 'Payload invalide.' }); }
        if (ev.type === 'checkout.session.completed') {
          const sess = (ev.data && ev.data.object) || {};
          const user = sess.client_reference_id || (sess.metadata || {}).user;
          const pack = (sess.metadata || {}).pack;
          if (user && DB.users[user] && PACKS[pack]) {
            DB.mailbox[user] = DB.mailbox[user] || [];
            if (DB.mailbox[user].length < 200) {
              DB.mailbox[user].push({ id: rid(), type: 'packCredit', amount: PACKS[pack], pack, at: Date.now() });
              persist();
              console.log('[STRIPE] pack ' + pack + ' crédité à ' + user);
            }
          }
        }
        return json(res, 200, { received: true });
      }
      const body = (req.method === 'POST') ? await readBody(req) : {};
      if (body && body.__tooBig) return json(res, 413, { err: 'Charge trop volumineuse.' });
      if (!rateOk(ip, 'api', 600)) return json(res, 429, { err: 'Trop de requêtes, ralentissez.' });

      if (url === '/api/health')
        return json(res, 200, { ok: true, v: VERSION, mode: USE_UPSTASH ? 'upstash' : 'fichier', users: Object.keys(DB.users).length, uptime: Math.round(process.uptime()), stripe: !!STRIPE_SK, terms: TERMS_VERSION });

      if (url === '/api/terms') return json(res, 200, { ok: true, version: TERMS_VERSION });
      if (url === '/api/checkout' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        if (!rateOk(ip, 'checkout', 6)) return json(res, 429, { err: 'Trop de sessions de paiement.' });
        if (!STRIPE_SK) return json(res, 400, { err: 'Paiement Stripe non configuré : utilisez la confirmation manuelle.' });
        const pack = String(body.pack || '');
        if (!PACKS[pack]) return json(res, 400, { err: 'Pack inconnu.' });
        const origin = (req.headers.origin || ('https://' + (req.headers.host || 'localhost')));
        const params = new URLSearchParams();
        params.set('mode', 'payment');
        params.set('client_reference_id', a.name);
        params.set('metadata[user]', a.name);
        params.set('metadata[pack]', pack);
        params.set('success_url', origin + '/?pack=' + pack);
        params.set('cancel_url', origin + '/?pack=cancel');
        params.set('line_items[0][quantity]', '1');
        params.set('line_items[0][price_data][currency]', 'eur');
        params.set('line_items[0][price_data][unit_amount]', String(PACK_CENTS[pack]));
        params.set('line_items[0][price_data][product_data][name]', 'Pack HEXALIFE ' + pack);
        try {
          const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + STRIPE_SK, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.url) return json(res, 400, { err: (j.error && j.error.message) || 'Stripe : session impossible.' });
          return json(res, 200, { ok: true, url: j.url });
        } catch (e) { return json(res, 400, { err: 'Stripe injoignable.' }); }
      }

      /* ── Présence ── */
      if (url === '/api/ping' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        PRESENCE[a.name] = Date.now();
        touchUser(a.name);
        const snap = presenceSnapshot();
        snap.isAdmin = isAdminUser(a.name);
        return json(res, 200, snap);
      }
      if (url === '/api/presence') return json(res, 200, presenceSnapshot());

      /* ── Comptes ── */
      if (url === '/api/register' && req.method === 'POST') {
        const u = String(body.user || '').trim();
        const email = String(body.email || '').toLowerCase();
        const pass = String(body.pass || '');
        if (!rateOk(ip, 'auth', 12)) return json(res, 429, { err: 'Trop de tentatives, réessayez dans une minute.' });
        if (u.length < 3 || u.length > 20) return json(res, 400, { err: 'Pseudo : 3 à 20 caractères.' });
        if (!/^[a-zA-Z0-9_\-]+$/.test(u)) return json(res, 400, { err: 'Pseudo : lettres, chiffres, tirets uniquement.' });
        if (!validMail(email)) return json(res, 400, { err: 'Adresse e-mail invalide.' });
        const pp = passPolicy(pass);
        if (pp) return json(res, 400, { err: pp });
        if (body.acceptCgu !== true) return json(res, 400, { err: 'Vous devez accepter les conditions d’utilisation.' });
        if (body.termsVersion !== TERMS_VERSION) return json(res, 400, { err: 'Version des CGU obsolète : rechargez la page.' });
        if (DB.users[u]) return json(res, 400, { err: 'Ce compte existe déjà.' });
        if (Object.values(DB.users).some(x => x.email === email)) return json(res, 400, { err: 'Cet e-mail est déjà utilisé.' });
        const salt = crypto.randomBytes(8).toString('hex');
        DB.users[u] = { email, salt, hash: hashPass(pass, salt), created: Date.now(), lastActive: Date.now(), cgu: { v: TERMS_VERSION, at: Date.now() } };
        const token = crypto.randomBytes(24).toString('hex');
        DB.sessions[token] = { name: u, at: Date.now() };
        persist();
        return json(res, 200, { ok: true, token, name: u });
      }
      if (url === '/api/login' && req.method === 'POST') {
        const id = String(body.user || '').trim().toLowerCase();
        const pass = String(body.pass || '');
        if (!rateOk(ip, 'auth', 12)) return json(res, 429, { err: 'Trop de tentatives, réessayez dans une minute.' });
        if (!id || !pass) return json(res, 400, { err: 'Identifiants requis.' });
        if (locked(ip, id)) return json(res, 429, { err: 'Trop de tentatives : compte verrouillé 15 min.' });
        const name = Object.keys(DB.users).find(k => k.toLowerCase() === id || DB.users[k].email === id);
        if (!name) { failAuth(ip, id); return json(res, 400, { err: 'Identifiants incorrects.' }); }
        const rec = DB.users[name];
        let ok = false;
        try { ok = safeEqual(hashPass(pass, rec.salt), rec.hash); } catch (e) { ok = false; }
        if (!ok) { failAuth(ip, id); return json(res, 400, { err: 'Identifiants incorrects.' }); }
        okAuth(ip, id);
        const token = crypto.randomBytes(24).toString('hex');
        DB.sessions[token] = { name, at: Date.now() };
        PRESENCE[name] = Date.now();
        touchUser(name);
        persist();
        return json(res, 200, { ok: true, token, name });
      }
      if (url === '/api/me') {
        const a = authUser(req, query);
        return a ? json(res, 200, { ok: true, name: a.name, isAdmin: isAdminUser(a.name) }) : json(res, 401, { ok: false });
      }
      if (url === '/api/logout' && req.method === 'POST') {
        const a = authUser(req, query);
        if (a) { delete DB.sessions[a.token]; delete PRESENCE[a.name]; persist(); }
        return json(res, 200, { ok: true });
      }
      if (url === '/api/load') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        touchUser(a.name);
        return json(res, 200, { state: DB.saves[a.name] || null });
      }
      if (url === '/api/save' && req.method === 'POST') {
        const a = authUser(req, query); // token accepté en query pour navigator.sendBeacon
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        if (!rateOk(ip, 'save', 120)) return json(res, 429, { err: 'Sauvegardes trop rapprochées.' });
        if (!body.state || typeof body.state !== 'object' || !saveSane(body.state)) return json(res, 400, { err: 'Sauvegarde invalide ou hors limites.' });
        DB.saves[a.name] = body.state;
        touchUser(a.name);
        persist();
        return json(res, 200, { ok: true });
      }
      if (url === '/api/delete' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        delete DB.users[a.name]; delete DB.saves[a.name]; delete DB.sessions[a.token];
        delete DB.mailbox[a.name]; delete PRESENCE[a.name]; delete DB.holds[a.name]; delete DB.announceCd[a.name];
        persist();
        return json(res, 200, { ok: true });
      }

      /* ── Transferts d'argent entre joueurs ── */
      if (url === '/api/transfer' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        if (!rateOk(ip, 'transfer', 10)) return json(res, 429, { err: 'Transferts trop rapprochés.' });
        const to = findUser(body.to);
        const amount = Math.floor(+body.amount || 0);
        if (!to) return json(res, 400, { err: 'Joueur introuvable.' });
        if (to === a.name) return json(res, 400, { err: 'Destinataire invalide (vous-même).' });
        if (!(amount > 0) || amount > MAX_TRANSFER) return json(res, 400, { err: 'Montant invalide.' });
        let taxRate = 0.05;
        const sv0 = DB.saves[a.name];
        if (sv0 && sv0.bank && typeof sv0.bank.bankId === 'string' && sv0.bank.bankId.indexOf('player:') === 0) {
          const parts = sv0.bank.bankId.split(':');
          const ob = DB.saves[parts[1]] && Array.isArray(DB.saves[parts[1]].biz) ? DB.saves[parts[1]].biz[+parts[2]] : null;
          if (ob && ob.premiumCard) taxRate = 0; // Carte Premium : zéro frais de transfert
        }
        const tax = taxRate > 0 ? Math.max(1, Math.round(amount * taxRate)) : 0;
        const total = amount + tax;
        const avail = savesBalance(a.name) - (DB.holds[a.name] || 0);
        if (avail < total) return json(res, 400, { err: 'Solde insuffisant (montant + taxe de ' + tax + ' €).' });
        DB.mailbox[a.name] = DB.mailbox[a.name] || [];
        DB.mailbox[to] = DB.mailbox[to] || [];
        if (DB.mailbox[a.name].length > 200 || DB.mailbox[to].length > 200)
          return json(res, 429, { err: 'Boîte de réception saturée, réessayez plus tard.' });
        DB.mailbox[a.name].push({ id: rid(), type: 'debit', amount: total, to, at: Date.now() });
        DB.mailbox[to].push({ id: rid(), type: 'credit', amount, from: a.name, at: Date.now() });
        DB.holds[a.name] = (DB.holds[a.name] || 0) + total;
        persist();
        return json(res, 200, { ok: true, tax, total });
      }

      /* ── Mailbox (ops pendantes) ── */
      if (url === '/api/mailbox') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        return json(res, 200, { ops: DB.mailbox[a.name] || [] });
      }
      if (url === '/api/mailbox/ack' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        const ids = Array.isArray(body.ids) ? body.ids.slice(0, 300).map(String) : [];
        const idset = new Set(ids);
        const list = DB.mailbox[a.name] || [];
        list.filter(o => idset.has(o.id)).forEach(o => {
          if (o.type === 'debit') DB.holds[a.name] = Math.max(0, (DB.holds[a.name] || 0) - (o.amount || 0));
        });
        DB.mailbox[a.name] = list.filter(o => !idset.has(o.id));
        persist();
        return json(res, 200, { ok: true });
      }

      /* ── Annonces d'entreprise ── */
      if (url === '/api/announce' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        const s = DB.saves[a.name];
        if (!s || !Array.isArray(s.biz) || s.biz.length < 1) return json(res, 400, { err: 'Il faut posséder une entreprise.' });
        const now = Date.now();
        if (now - (DB.announceCd[a.name] || 0) < 3600000) return json(res, 400, { err: 'Une seule annonce par heure.' });
        const text = String(body.text || '').trim().slice(0, 200);
        if (!text) return json(res, 400, { err: 'Texte vide.' });
        const bizName = (s.biz[0] && s.biz[0].name) || a.name;
        DB.announces.push({ id: rid(), owner: a.name, biz: String(bizName).slice(0, 60), text, at: now });
        if (DB.announces.length > 30) DB.announces = DB.announces.slice(-30);
        DB.announceCd[a.name] = now;
        persist();
        return json(res, 200, { ok: true });
      }
      if (url === '/api/announce') {
        return json(res, 200, { list: DB.announces.filter(x => Date.now() - (x.at || 0) < 86400000) });
      }

      /* ── Contrats B2B entre joueurs ── */
      const purgeB2B = () => {
        const now = Date.now();
        DB.b2b.active = (DB.b2b.active || []).filter(c => c.until > now);
        DB.b2b.offers = (DB.b2b.offers || []).filter(o => now - o.at < 7 * 86400e3);
      };
      if (url === '/api/b2b/mine') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        purgeB2B();
        const hasBiz = n => { const sv = DB.saves[n]; return !!(sv && Array.isArray(sv.biz) && sv.biz.length); };
        const partners = Object.keys(DB.saves).filter(n => n !== a.name && hasBiz(n)).slice(0, 40)
          .map(n => ({ name: n, biz: DB.saves[n].biz.length, online: isOnline(n) }));
        return json(res, 200, {
          incoming: (DB.b2b.offers || []).filter(o => o.to === a.name),
          outgoing: (DB.b2b.offers || []).filter(o => o.from === a.name),
          active: (DB.b2b.active || []).filter(c => c.from === a.name || c.to === a.name)
            .map(c => ({ dir: c.from === a.name ? 'out' : 'in', pct: c.pct, until: c.until, with: c.from === a.name ? c.to : c.from })),
          partners
        });
      }
      if (url === '/api/b2b/offer' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        if (!rateOk(ip, 'b2b', 10)) return json(res, 429, { err: 'Trop d’offres.' });
        const to = findUser(body.to);
        const pct = Math.floor(+body.pct || 0);
        if (!to || to === a.name) return json(res, 400, { err: 'Partenaire invalide.' });
        if (![5, 10, 15, 20].includes(pct)) return json(res, 400, { err: 'Pourcentage invalide (5/10/15/20).' });
        const hasBiz = n => { const sv = DB.saves[n]; return !!(sv && Array.isArray(sv.biz) && sv.biz.length); };
        if (!hasBiz(a.name) || !hasBiz(to)) return json(res, 400, { err: 'Les deux joueurs doivent posséder une entreprise.' });
        purgeB2B();
        if ((DB.b2b.offers || []).some(o => o.from === a.name && o.to === to)) return json(res, 400, { err: 'Une offre est déjà en attente avec ce joueur.' });
        if ((DB.b2b.active || []).some(c => (c.from === a.name && c.to === to) || (c.from === to && c.to === a.name))) return json(res, 400, { err: 'Un contrat est déjà actif avec ce joueur.' });
        const fee = pct * 200;
        const offer = { id: rid(), from: a.name, to, pct, fee, at: Date.now() };
        DB.b2b.offers.push(offer);
        DB.mailbox[to] = DB.mailbox[to] || [];
        DB.mailbox[to].push({ id: rid(), type: 'b2bOffer', oid: offer.id, from: a.name, pct, fee, at: Date.now() });
        persist();
        return json(res, 200, { ok: true, fee });
      }
      if (url === '/api/b2b/accept' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        purgeB2B();
        const o = (DB.b2b.offers || []).find(x => x.id === String(body.id || ''));
        if (!o || o.to !== a.name) return json(res, 400, { err: 'Offre introuvable.' });
        const avail = savesBalance(o.from) - (DB.holds[o.from] || 0);
        if (avail < o.fee) return json(res, 400, { err: 'Le partenaire n’a plus les fonds pour payer ce contrat.' });
        const until = Date.now() + 24 * 3600e3;
        DB.b2b.offers = DB.b2b.offers.filter(x => x.id !== o.id);
        DB.b2b.active.push({ id: o.id, from: o.from, to: o.to, pct: o.pct, until });
        DB.mailbox[o.from] = DB.mailbox[o.from] || [];
        DB.mailbox[o.to] = DB.mailbox[o.to] || [];
        DB.mailbox[o.from].push({ id: rid(), type: 'b2bDebit', amount: o.fee, label: 'Contrat B2B (' + o.pct + ' % avec ' + o.to + ')', at: Date.now() });
        DB.mailbox[o.to].push({ id: rid(), type: 'b2bCredit', amount: o.fee, label: 'Contrat B2B (' + o.pct + ' % pour ' + o.from + ')', at: Date.now() });
        DB.mailbox[o.from].push({ id: rid(), type: 'b2bStart', dir: 'out', pct: o.pct, until, with: o.to, at: Date.now() });
        DB.mailbox[o.to].push({ id: rid(), type: 'b2bStart', dir: 'in', pct: o.pct, until, with: o.from, at: Date.now() });
        DB.holds[o.from] = (DB.holds[o.from] || 0) + o.fee;
        persist();
        return json(res, 200, { ok: true });
      }
      if (url === '/api/b2b/refuse' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        const before = (DB.b2b.offers || []).length;
        DB.b2b.offers = (DB.b2b.offers || []).filter(x => !(x.id === String(body.id || '') && x.to === a.name));
        persist();
        return json(res, 200, { ok: DB.b2b.offers.length < before });
      }

      /* ── Magasins joueurs (courses entre joueurs) ── */
      if (url === '/api/shops') {
        const shops = [];
        Object.keys(DB.saves).forEach(owner => {
          const sv = DB.saves[owner];
          if (sv && Array.isArray(sv.biz)) {
            sv.biz.forEach((b, idx) => {
              if (b && b.type === 'magasin') {
                const g = (b.grocery && typeof b.grocery === 'object') ? b.grocery : {};
                shops.push({
                  owner, idx,
                  name: String(b.name || ('Magasin ' + owner)).slice(0, 60),
                  margin: typeof g.margin === 'number' && isFinite(g.margin) ? Math.max(-0.5, Math.min(1, g.margin)) : 0.10,
                  stock: Math.max(0, Math.floor(g.stock || 0)),
                  online: isOnline(owner)
                });
              }
            });
          }
        });
        return json(res, 200, { shops: shops.slice(0, 50) });
      }
      /* ── Achat dans un magasin joueur : le serveur fait foi ── */
      if (url === '/api/buyShop' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        if (!rateOk(ip, 'buy', 30)) return json(res, 429, { err: 'Achats trop rapprochés.' });
        const owner = String(body.owner || '');
        const idx = Math.floor(+body.idx);
        const foodId = String(body.food || '');
        const q = Math.floor(+body.q || 0);
        if (!(q >= 1 && q <= 99)) return json(res, 400, { err: 'Quantité invalide.' });
        const FOODS = { eau:0.85, cafe:2.10, baguette:1.20, croissant:1.30, jus:2.80, sandwich:4.60, kebab:9.50, marche:14.00, traiteur:26.00, ramen:1.50, pizza:3.90, gastro:75.00 };
        if (!(foodId in FOODS)) return json(res, 400, { err: 'Produit inconnu.' });
        const sv = DB.saves[owner];
        if (!sv || !Array.isArray(sv.biz) || !sv.biz[idx] || sv.biz[idx].type !== 'magasin') return json(res, 400, { err: 'Magasin introuvable.' });
        if (owner === a.name) return json(res, 400, { err: 'Utilisez l’achat direct dans votre propre magasin.' });
        const g = (sv.biz[idx].grocery && typeof sv.biz[idx].grocery === 'object') ? sv.biz[idx].grocery : { margin: 0.10, stock: 0 };
        const margin = typeof g.margin === 'number' && isFinite(g.margin) ? Math.max(-0.5, Math.min(1, g.margin)) : 0.10;
        const stock = Math.max(0, Math.floor(g.stock || 0));
        if (stock < q) return json(res, 400, { err: 'Rayon du vendeur vide (' + stock + ' en stock).' });
        const price = +((FOODS[foodId] * (1 + margin)) * q).toFixed(2);
        const avail = savesBalance(a.name) - (DB.holds[a.name] || 0);
        if (avail < price) return json(res, 400, { err: 'Solde insuffisant (' + price + ' € requis).' });
        DB.mailbox[a.name] = DB.mailbox[a.name] || [];
        DB.mailbox[owner] = DB.mailbox[owner] || [];
        if (DB.mailbox[a.name].length > 200 || DB.mailbox[owner].length > 200) return json(res, 429, { err: 'Boîte saturée.' });
        DB.mailbox[a.name].push({ id: rid(), type: 'shopDebit', amount: price, q, food: foodId, label: 'Courses — ' + foodId + ' ×' + q + ' (' + String(sv.biz[idx].name || 'magasin') + ')', at: Date.now() });
        DB.mailbox[owner].push({ id: rid(), type: 'shopSale', amount: price, q, idx, from: a.name, at: Date.now() });
        DB.holds[a.name] = (DB.holds[a.name] || 0) + price;
        persist();
        return json(res, 200, { ok: true, price });
      }

      /* ── Banques joueurs ── */
      if (url === '/api/banks') {
        const banks = [];
        Object.keys(DB.saves).forEach(owner => {
          const s = DB.saves[owner];
          if (s && Array.isArray(s.biz)) {
            s.biz.forEach((b, idx) => {
              if (b && b.type === 'banque') banks.push({
                id: 'player:' + owner + ':' + idx,
                name: String(b.name || ('Banque ' + owner)).slice(0, 60),
                owner,
                livret: typeof b.tauxLivret === 'number' ? b.tauxLivret : 2,
                accounts: Math.floor(b.accounts || 0),
                premium: !!b.premiumCard
              });
            });
          }
        });
        return json(res, 200, { banks });
      }
      if (url === '/api/banks/clients') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        const prefix = 'player:' + a.name + ':';
        const clients = [];
        Object.keys(DB.saves).forEach(other => {
          const s = DB.saves[other];
          if (s && s.bank && typeof s.bank.bankId === 'string' && s.bank.bankId.indexOf(prefix) === 0) {
            clients.push({
              name: other,
              compte: s.bank.compte || 0, livret: s.bank.livret || 0,
              loans: (Array.isArray(s.bank.loans) ? s.bank.loans : []).map(L => ({ n: L.n, reste: L.reste || 0, mens: L.mens || 0 })),
              jobs: (Array.isArray(s.jobs) ? s.jobs : []).length,
              biz: (Array.isArray(s.biz) ? s.biz : []).length,
              online: isOnline(other)
            });
          }
        });
        return json(res, 200, { clients });
      }

      /* ── Classement de la ville ── */
      if (url === '/api/leaderboard') {
        const a = authUser(req, query);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        const rows = Object.keys(DB.saves).map(name => {
          const s = DB.saves[name] || {};
          const xp = typeof s.xp === 'number' && isFinite(s.xp) ? s.xp : 0;
          return {
            name,
            balance: savesBalance(name),
            level: Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1,
            biz: Array.isArray(s.biz) ? s.biz.length : 0,
            online: isOnline(name),
            me: name === a.name
          };
        });
        rows.sort((x, y) => y.balance - x.balance);
        const rank = rows.findIndex(r => r.me) + 1;
        return json(res, 200, { list: rows.slice(0, 10), rank: rank || null, total: rows.length });
      }

      /* ── Admin ── */
      if (url === '/api/admin/users') {
        const a = authUser(req, query);
        if (!a || !isAdminUser(a.name)) return json(res, 403, { err: 'Accès refusé.' });
        const users = Object.keys(DB.users).map(n => {
          const s = DB.saves[n] || {};
          const xp = typeof s.xp === 'number' && isFinite(s.xp) ? s.xp : 0;
          return {
            name: n, email: DB.users[n].email || '', online: isOnline(n),
            balance: savesBalance(n), biz: (Array.isArray(s.biz) ? s.biz.length : 0),
            level: Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1,
            created: DB.users[n].created || 0
          };
        });
        users.sort((x, y) => y.balance - x.balance);
        return json(res, 200, { users });
      }
      if (url === '/api/admin/action' && req.method === 'POST') {
        const a = authUser(req, query);
        if (!a || !isAdminUser(a.name)) return json(res, 403, { err: 'Accès refusé.' });
        if (!rateOk(ip, 'admin', 30)) return json(res, 429, { err: 'Trop d’actions admin.' });
        const target = findUser(body.target);
        const action = String(body.action || '');
        const amount = Math.floor(+body.amount || 0);
        if (!target) return json(res, 400, { err: 'Cible introuvable.' });
        if (target === a.name && action !== 'boost') return json(res, 400, { err: 'Action impossible sur vous-même.' });
        if (action === 'deleteAccount') {
          delete DB.users[target]; delete DB.saves[target]; delete DB.mailbox[target];
          delete PRESENCE[target]; delete DB.holds[target]; delete DB.announceCd[target];
          for (const t in DB.sessions) { if (DB.sessions[t].name === target) delete DB.sessions[t]; }
          persist();
          return json(res, 200, { ok: true });
        }
        DB.mailbox[target] = DB.mailbox[target] || [];
        if (DB.mailbox[target].length > 200) return json(res, 429, { err: 'Boîte saturée.' });
        const op = { id: rid(), at: Date.now() };
        if (action === 'addMoney') { if (!(amount > 0) || amount > MAX_TRANSFER) return json(res, 400, { err: 'Montant invalide.' }); op.type = 'adminCredit'; op.amount = amount; }
        else if (action === 'removeMoney') { if (!(amount > 0) || amount > MAX_TRANSFER) return json(res, 400, { err: 'Montant invalide.' }); op.type = 'adminDebit'; op.amount = amount; }
        else if (action === 'deleteBiz') op.type = 'deleteBiz';
        else if (action === 'boost') op.type = 'boost';
        else if (action === 'malus') op.type = 'malus';
        else if (action === 'reset') op.type = 'reset';
        else return json(res, 400, { err: 'Action inconnue.' });
        DB.mailbox[target].push(op);
        persist();
        return json(res, 200, { ok: true });
      }

      return json(res, 404, { err: 'Route inconnue.' });
    }

    /* ── Fichiers statiques ── */
    let clean;
    try { clean = decodeURIComponent(url); } catch (e) { return json(res, 400, { err: 'URL invalide.' }); }
    if (clean.includes('\0')) return json(res, 400, { err: 'URL invalide.' });
    let p = path.resolve(ROOT, '.' + path.posix.normalize(clean.replace(/^\/+/, '/')));
    if (p !== ROOT && !p.startsWith(ROOT + path.sep)) return json(res, 403, { err: 'Interdit.' });
    // zones interdites : données serveur (base, hachés de mots de passe) et métadonnées git
    const rel = path.relative(ROOT, p);
    if (rel === 'server' || rel.startsWith('server' + path.sep) ||
        rel === 'test' || rel.startsWith('test' + path.sep) ||
        rel.startsWith('.git') || rel.split(path.sep).some(s => s.startsWith('.') && s !== '.')) {
      return json(res, 403, { err: 'Interdit.' });
    }
    try {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 — introuvable');
      }
    } catch (e) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    res.writeHead(200, Object.assign({
      'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }, SEC_HEADERS));
    fs.createReadStream(p).pipe(res);
  } catch (e) {
    console.error('[HTTP]', e);
    if (!res.headersSent) json(res, 500, { err: 'Erreur serveur.' });
    else try { res.end(); } catch (x) {}
  }
});

(async () => {
  DB = await loadDB();
  server.listen(PORT, HOST, () => {
    console.log('HEXALIFE v' + VERSION + ' → http://' + HOST + ':' + PORT);
    console.log('Backend base : ' + (USE_UPSTASH ? 'Upstash Redis (persistant)' : 'fichier (' + DB_FILE + ')'));
    console.log('Admin : ' + (ADMIN_NAME ? ADMIN_NAME : 'aucun (définir ADMIN_NAME)'));
    console.log('Stripe : ' + (STRIPE_SK ? 'activé (détection automatique des paiements)' : 'non configuré (confirmation manuelle)'));
    purgeInactive();
  });
})();
