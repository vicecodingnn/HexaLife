/* ═══════════ HEXALIFE — serveur Node zéro dépendance (Render + base persistante) ═══════════
   Backends de base de données (par priorité) :
     1) Upstash Redis  → si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN définis
                         (RECOMMANDÉ sur Render gratuit : survit aux restarts / spin-down)
     2) Fichier        → si DB_PATH défini (Persistent Disk Render, plan payant)
     3) Fichier local  → sinon (ÉPHÉMÈRE sur Render gratuit : déconseillé)
   Aucune donnée n'est jamais stockée dans le navigateur.
────────────────────────────────────────────────────────────────────────────────────────── */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const API_ENABLED = process.env.API_DISABLED !== '1';

/* ────────────────────────── CONFIGURATION DU STOCKAGE ────────────────────────── */
const UP_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const DB_KEY = process.env.DB_KEY || 'hexalife:db';
const USE_UPSTASH = !!(UP_URL && UP_TOKEN);

const DB_DIR = process.env.DB_PATH || __dirname;
const DB_FILE = path.join(DB_DIR, 'hexalife.db');

let DB = { users: {}, sessions: {}, saves: {} };

/* ────────────────────────── BACKEND UPSTASH (REST) ────────────────────────── */
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

/* ────────────────────────── CHARGEMENT / SAUVEGARDE ────────────────────────── */
async function loadDB() {
  if (USE_UPSTASH) {
    try {
      const raw = await upCommand(['GET', DB_KEY]);
      if (raw) { console.log('[DB] Base chargée depuis Upstash.'); return JSON.parse(raw); }
      console.log('[DB] Base Upstash vide → création.');
    } catch (e) { console.error('[DB] Lecture Upstash échouée :', e.message); }
    return { users: {}, sessions: {}, saves: {} };
  }
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const d = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    console.log('[DB] Base chargée depuis fichier : ' + DB_FILE);
    if (!process.env.DB_PATH) console.warn('[DB] ⚠ ATTENTION : fichier LOCAL ÉPHÉMÈRE sur Render gratuit. Configurez Upstash ou un Persistent Disk.');
    return d;
  } catch (e) {
    return { users: {}, sessions: {}, saves: {} };
  }
}

async function persistNow() {
  const payload = JSON.stringify(DB);
  if (USE_UPSTASH) { await upCommand(['SET', DB_KEY, payload]); return; }
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, payload);
}

let saveTimer = null;
function persist() {           /* debounce : évite d'écrire à chaque requête */
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persistNow().catch(e => console.error('[DB] Écriture échouée :', e.message));
  }, 400);
}

/* filet de sécurité : sauvegarde périodique + flush propre à l'arrêt */
setInterval(() => { persistNow().catch(() => {}); }, 30000);
process.on('SIGTERM', async () => { try { await persistNow(); } catch (e) {} process.exit(0); });
process.on('SIGINT', async () => { try { await persistNow(); } catch (e) {} process.exit(0); });

/* ────────────────────────── OUTILS ────────────────────────── */
const hashPass = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m || '');

function readBody(req) {
  return new Promise((res) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 6e6) req.destroy(); });
    req.on('end', () => { try { res(d ? JSON.parse(d) : {}); } catch (e) { res({}); } });
    req.on('error', () => res({}));
  });
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.replace('Bearer ', '');
  return DB.sessions[token] ? { token, name: DB.sessions[token] } : null;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8'
};

/* ────────────────────────── SERVEUR ────────────────────────── */
const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  try {
    /* ══════════ API ══════════ */
    if (url.startsWith('/api/')) {
      if (!API_ENABLED) return json(res, 404, { ok: false, err: 'API désactivée.' });
      const body = (req.method === 'POST') ? await readBody(req) : {};

      if (url === '/api/health')
        return json(res, 200, { ok: true, mode: USE_UPSTASH ? 'upstash' : 'fichier', users: Object.keys(DB.users).length });

      if (url === '/api/register' && req.method === 'POST') {
        const u = String(body.user || '').trim();
        const email = String(body.email || '').toLowerCase();
        const pass = String(body.pass || '');
        if (u.length < 3) return json(res, 400, { err: 'Pseudo trop court (3 caractères minimum).' });
        if (!/^[a-zA-Z0-9_\-]+$/.test(u)) return json(res, 400, { err: 'Pseudo : lettres, chiffres, tirets uniquement.' });
        if (!validMail(email)) return json(res, 400, { err: 'Adresse e-mail invalide.' });
        if (pass.length < 4) return json(res, 400, { err: 'Mot de passe : 4 caractères minimum.' });
        if (DB.users[u]) return json(res, 400, { err: 'Ce compte existe déjà.' });
        if (Object.values(DB.users).some(x => x.email === email)) return json(res, 400, { err: 'Cet e-mail est déjà utilisé.' });
        const salt = crypto.randomBytes(8).toString('hex');
        DB.users[u] = { email, salt, hash: hashPass(pass, salt), created: Date.now() };
        const token = crypto.randomBytes(16).toString('hex');
        DB.sessions[token] = u; persist();
        return json(res, 200, { ok: true, token, name: u });
      }

      if (url === '/api/login' && req.method === 'POST') {
        const id = String(body.user || '').trim().toLowerCase();
        const pass = String(body.pass || '');
        const name = Object.keys(DB.users).find(k => k.toLowerCase() === id || DB.users[k].email === id);
        if (!name) return json(res, 400, { err: 'Identifiants incorrects.' });
        const rec = DB.users[name];
        const ok = crypto.timingSafeEqual(Buffer.from(hashPass(pass, rec.salt), 'hex'), Buffer.from(rec.hash, 'hex'));
        if (!ok) return json(res, 400, { err: 'Identifiants incorrects.' });
        const token = crypto.randomBytes(16).toString('hex');
        DB.sessions[token] = name; persist();
        return json(res, 200, { ok: true, token, name });
      }

      if (url === '/api/me') {
        const a = authUser(req);
        return a ? json(res, 200, { ok: true, name: a.name }) : json(res, 401, { ok: false });
      }

      if (url === '/api/logout' && req.method === 'POST') {
        const a = authUser(req);
        if (a) { delete DB.sessions[a.token]; persist(); }
        return json(res, 200, { ok: true });
      }

      if (url === '/api/load') {
        const a = authUser(req);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        return json(res, 200, { state: DB.saves[a.name] || null });
      }

      if (url === '/api/save' && req.method === 'POST') {
        const a = authUser(req);
        if (!a) return json(res, 401, { err: 'Non connecté.' });
        DB.saves[a.name] = body.state; persist();
        return json(res, 200, { ok: true });
      }

      return json(res, 404, { err: 'Route inconnue.' });
    }

    /* ══════════ Fichiers statiques ══════════ */
    let p = path.normalize(path.join(ROOT, url === '/' ? 'index.html' : url));
    if (!p.startsWith(ROOT)) return json(res, 403, { err: 'Interdit.' });
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(p).pipe(res);
  } catch (e) {
    json(res, 500, { err: 'Erreur serveur.' });
  }
});

/* ────────────────────────── DÉMARRAGE (attend le chargement de la base) ────────────────────────── */
(async () => {
  DB = await loadDB();
  server.listen(PORT, HOST, () => {
    console.log('HEXALIFE → http://' + HOST + ':' + PORT);
    console.log('Backend base : ' + (USE_UPSTASH ? 'Upstash Redis (persistant)' : 'fichier (' + DB_FILE + ')'));
    console.log('API : ' + (API_ENABLED ? 'activée' : 'DÉSACTIVÉE'));
  });
})();
