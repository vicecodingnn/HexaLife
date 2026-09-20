/* ═══════════ HEXALIFE — serveur Node zéro dépendance ═══════════
   Lance :  node server/server.js   puis  http://localhost:3000
   Crée/lit le fichier  server/hexalife.db  (comptes + sauvegardes de TOUS les utilisateurs).
   Sert aussi les fichiers statiques du jeu (dossier parent).
────────────────────────────────────────────────────────────── */
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(__dirname, 'hexalife.db');
const PORT = process.env.PORT || 3000;
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.json':'application/json', '.md':'text/plain; charset=utf-8' };

let DB = load();
function load() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch (e) { return { users: {}, sessions: {}, saves: {} }; }
}
let writeQueued = false;
function persist() {
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => { writeQueued = false; fs.writeFileSync(DB_FILE, JSON.stringify(DB)); }, 250);
}
const hashPass = (pass, salt) => crypto.scryptSync(String(pass), salt, 32).toString('hex');
const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m || '');
function readBody(req) {
  return new Promise((res, rej) => {
    let d = ''; req.on('data', c => { d += c; if (d.length > 6e6) rej(new Error('too big')); });
    req.on('end', () => { try { res(d ? JSON.parse(d) : {}); } catch (e) { res({}); } });
  });
}
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); }
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.replace('Bearer ', '');
  return DB.sessions[token] ? { token, name: DB.sessions[token] } : null;
}

http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];
  try {
    if (url.startsWith('/api/')) {
      const body = (req.method === 'POST') ? await readBody(req) : {};
      if (url === '/api/health') return json(res, 200, { ok: true, mode: 'hexalife.db', users: Object.keys(DB.users).length });

      if (url === '/api/register' && req.method === 'POST') {
        const u = String(body.user || '').trim(), email = String(body.email || '').toLowerCase(), pass = String(body.pass || '');
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
        const id = String(body.user || '').trim().toLowerCase(), pass = String(body.pass || '');
        const name = Object.keys(DB.users).find(k => k.toLowerCase() === id || DB.users[k].email === id);
        if (!name) return json(res, 400, { err: 'Identifiants incorrects.' });
        const rec = DB.users[name];
        const test = crypto.timingSafeEqual(Buffer.from(hashPass(pass, rec.salt), 'hex'), Buffer.from(rec.hash, 'hex'));
        if (!test) return json(res, 400, { err: 'Identifiants incorrects.' });
        const token = crypto.randomBytes(16).toString('hex');
        DB.sessions[token] = name; persist();
        return json(res, 200, { ok: true, token, name });
      }

      if (url === '/api/me') { const a = authUser(req); return a ? json(res, 200, { ok: true, name: a.name }) : json(res, 401, { ok: false }); }
      if (url === '/api/logout' && req.method === 'POST') { const a = authUser(req); if (a) { delete DB.sessions[a.token]; persist(); } return json(res, 200, { ok: true }); }

      if (url === '/api/load') { const a = authUser(req); if (!a) return json(res, 401, { err: 'Non connecté.' }); return json(res, 200, { state: DB.saves[a.name] || null }); }

      if (url === '/api/save' && req.method === 'POST') {
        const a = authUser(req); if (!a) return json(res, 401, { err: 'Non connecté.' });
        DB.saves[a.name] = body.state; persist();
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { err: 'Route inconnue.' });
    }

    /* statiques */
    let p = path.normalize(path.join(ROOT, url === '/' ? 'index.html' : url));
    if (!p.startsWith(ROOT)) return json(res, 403, { err: 'Interdit.' });
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  } catch (e) { json(res, 500, { err: 'Erreur serveur.' }); }
}).listen(PORT, () => console.log('HEXALIFE → http://localhost:' + PORT + '  (base : ' + DB_FILE + ')'));
