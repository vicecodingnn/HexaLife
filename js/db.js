/* ═══════════ COUCHE BASE DE DONNÉES v8 (API serveur .db / repli local) ═══════════ */
const DB = (() => {
  const UK = 'hl_users', SK = 'hl_session', TK = 'hl_token', TKU = 'hl_token_user';
  let mode = 'local';
  let token = localStorage.getItem(TK);

  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'x' + h.toString(36); };
  const users = () => { try { return JSON.parse(localStorage.getItem(UK) || '{}'); } catch (e) { return {}; } };
  const putUsers = u => localStorage.setItem(UK, JSON.stringify(u));
  const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m || '');

  async function api(path, opts = {}) {
    const r = await fetch(path, Object.assign({
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
      cache: 'no-store'
    }, opts));
    return r.json();
  }

  return {
    mode: () => mode,
    label: () => mode === 'api' ? 'Base : serveur hexalife.db (partagée)' : 'Base : locale navigateur',

    async init() {
      try {
        const j = await api('/api/health');
        mode = (j && j.ok) ? 'api' : 'local';
        if (mode === 'api' && token) { try { const me = await api('/api/me'); if (!me.ok) { token = null; localStorage.removeItem(TK); } } catch (e) { token = null; } }
      } catch (e) { mode = 'local'; }
      return mode;
    },

    async register(u, email, p) {
      u = (u || '').trim();
      if (u.length < 3) return { err: 'Pseudo trop court (3 caractères minimum).' };
      if (!/^[a-zA-Z0-9_\-]+$/.test(u)) return { err: 'Pseudo : lettres, chiffres, tirets uniquement.' };
      if (!validMail(email)) return { err: 'Adresse e-mail invalide.' };
      if ((p || '').length < 4) return { err: 'Mot de passe : 4 caractères minimum.' };
      if (mode === 'api') {
        const j = await api('/api/register', { method: 'POST', body: JSON.stringify({ user: u, email, pass: p }) });
        if (j.err) return { err: j.err };
        token = j.token; localStorage.setItem(TK, token); localStorage.setItem(TKU, j.name); localStorage.setItem(SK, j.name);
        return { ok: true };
      }
      const all = users();
      if (all[u]) return { err: 'Ce compte existe déjà.' };
      if (Object.values(all).some(x => x.email === (email||'').toLowerCase())) return { err: 'Cet e-mail est déjà utilisé.' };
      all[u] = { pass: hash(p), email: (email||'').toLowerCase(), created: Date.now() };
      putUsers(all); localStorage.setItem(SK, u);
      return { ok: true };
    },

    async login(u, p) {
      if (mode === 'api') {
        const j = await api('/api/login', { method: 'POST', body: JSON.stringify({ user: (u || '').trim(), pass: p }) });
        if (j.err) return { err: j.err };
        token = j.token; localStorage.setItem(TK, token); localStorage.setItem(TKU, j.name); localStorage.setItem(SK, j.name);
        return { ok: true };
      }
      const all = users(); const key = (u || '').trim().toLowerCase();
      const name = Object.keys(all).find(k => k.toLowerCase() === key || all[k].email === key);
      if (!name || all[name].pass !== hash(p || '')) return { err: 'Identifiants incorrects.' };
      localStorage.setItem(SK, name);
      return { ok: true };
    },

    session() { return localStorage.getItem(SK); },
    logout() {
      if (mode === 'api' && token) api('/api/logout', { method: 'POST' }).catch(() => {});
      token = null; localStorage.removeItem(TK); localStorage.removeItem(TKU); localStorage.removeItem(SK);
    },

    async saveGame(u, state) {
      if (mode === 'api' && token) {
        try { const j = await api('/api/save', { method: 'POST', body: JSON.stringify({ state }) }); return !!j.ok; }
        catch (e) { return false; }
      }
      try { localStorage.setItem('hl_save_' + u, JSON.stringify(state)); return true; } catch (e) { return false; }
    },
    async loadGame(u) {
      if (mode === 'api' && token) {
        try { const j = await api('/api/load'); return j.state || null; } catch (e) { return null; }
      }
      try { return JSON.parse(localStorage.getItem('hl_save_' + u)); } catch (e) { return null; }
    },
    deleteSave(u) { localStorage.removeItem('hl_save_' + u); },

    async deleteAccount(u) {
      if (mode === 'api' && token) {
        try { await api('/api/delete', { method: 'POST' }); } catch (e) {}
        token = null; localStorage.removeItem(TK); localStorage.removeItem(TKU); localStorage.removeItem(SK);
        return true;
      }
      const all = users(); delete all[u]; putUsers(all);
      localStorage.removeItem('hl_save_' + u); localStorage.removeItem(SK);
      return true;
    }
  };
})();
