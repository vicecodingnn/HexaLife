/* ═══════════ COUCHE BASE DE DONNÉES v11 (API serveur hexalife.db / repli local) ═══════════
 * Améliorations v11 :
 *  - api() robuste : timeout, réponses non-JSON tolérées, erreurs normalisées { err }
 *  - init() avec délai maximal (l'intro ne peut plus rester bloquée)
 *  - saveGame : repli sendBeacon à la fermeture de l'onglet
 *  - clés localStorage de session/dédup scopées par utilisateur
 */
const DB = (() => {
  const UK = 'hl_users', SK = 'hl_session', TK = 'hl_token', TKU = 'hl_token_user';
  let mode = 'local';
  let stripeOn = false;
  let termsV = null;
  let token = localStorage.getItem(TK);

  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'x' + h.toString(36); };
  const users = () => { try { return JSON.parse(localStorage.getItem(UK) || '{}'); } catch (e) { return {}; } };
  const putUsers = u => { try { localStorage.setItem(UK, JSON.stringify(u)); } catch (e) {} };
  const validMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m || '');

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
    });
  }

  async function api(path, opts = {}, timeoutMs = 8000) {
    const r = await withTimeout(fetch(path, Object.assign({
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
      cache: 'no-store'
    }, opts)), timeoutMs);
    const text = await r.text();
    try { return JSON.parse(text); }
    catch (e) { return { ok: false, err: 'Réponse serveur invalide (' + r.status + ').' }; }
  }
  /* api() ne doit JAMAIS rejeter vers les écrans : normalise en { err } */
  async function safeApi(path, opts, timeoutMs) {
    try { return await api(path, opts, timeoutMs); }
    catch (e) { return { ok: false, err: 'Serveur injoignable.' }; }
  }

  return {
    mode: () => mode,
    hasStripe: () => stripeOn && mode === 'api',
    termsVersion: () => termsV,
    label: () => mode === 'api' ? 'Base : serveur hexalife.db (partagée)' : 'Base : locale navigateur',
    authFetch: (path, opts) => api(path, opts).catch(e => ({ ok: false, err: 'Serveur injoignable.' })),

    async init() {
      try {
        const j = await api('/api/health', {}, 3000);
        mode = (j && j.ok) ? 'api' : 'local';
        stripeOn = !!(j && j.stripe);
        termsV = (j && j.terms) || null;
        if (mode === 'api' && token) {
          try { const me = await api('/api/me', {}, 3000); if (!me.ok) { token = null; localStorage.removeItem(TK); } }
          catch (e) { /* réseau lent : on garde le token, /api/me tranchera plus tard */ }
        }
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
        const j = await safeApi('/api/register', { method: 'POST', body: JSON.stringify({ user: u, email, pass: p, acceptCgu: true, termsVersion: termsV }) });
        if (j.err || !j.token) return { err: j.err || 'Inscription impossible.' };
        token = j.token; localStorage.setItem(TK, token); localStorage.setItem(TKU, j.name); localStorage.setItem(SK, j.name);
        return { ok: true };
      }
      const all = users();
      if (all[u]) return { err: 'Ce compte existe déjà.' };
      if (Object.values(all).some(x => x.email === (email || '').toLowerCase())) return { err: 'Cet e-mail est déjà utilisé.' };
      all[u] = { pass: hash(p), email: (email || '').toLowerCase(), created: Date.now() };
      putUsers(all); localStorage.setItem(SK, u);
      return { ok: true };
    },

    async login(u, p) {
      if (mode === 'api') {
        const j = await safeApi('/api/login', { method: 'POST', body: JSON.stringify({ user: (u || '').trim(), pass: p }) });
        if (j.err || !j.token) return { err: j.err || 'Connexion impossible.' };
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
      if (mode === 'api' && token) safeApi('/api/logout', { method: 'POST' }, 2000);
      token = null; localStorage.removeItem(TK); localStorage.removeItem(TKU); localStorage.removeItem(SK);
    },

    async saveGame(u, state) {
      if (mode === 'api' && token) {
        try { const j = await api('/api/save', { method: 'POST', body: JSON.stringify({ state }) }, 6000); return !!j.ok; }
        catch (e) { return false; }
      }
      try { localStorage.setItem('hl_save_' + u, JSON.stringify(state)); return true; }
      catch (e) {
        if (e && (e.name === 'QuotaExceededError' || e.code === 22)) console.warn('[DB] Stockage local plein.');
        return false;
      }
    },
    /* Sauvegarde "dernière chance" synchrone (fermeture d'onglet) */
    saveGameBeacon(u, state) {
      try {
        if (mode === 'api' && token && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ state })], { type: 'application/json' });
          // sendBeacon n'envoie pas d'en-tête Authorization : on passe le token en query.
          navigator.sendBeacon('/api/save?token=' + encodeURIComponent(token), blob);
          return true;
        }
        localStorage.setItem('hl_save_' + u, JSON.stringify(state));
        return true;
      } catch (e) { return false; }
    },
    async loadGame(u) {
      if (mode === 'api' && token) {
        try { const j = await api('/api/load', {}, 6000); return (j && j.state) || null; } catch (e) { return null; }
      }
      try { return JSON.parse(localStorage.getItem('hl_save_' + u)); } catch (e) { return null; }
    },
    deleteSave(u) { try { localStorage.removeItem('hl_save_' + u); } catch (e) {} },

    async deleteAccount(u) {
      if (mode === 'api' && token) {
        try { await api('/api/delete', { method: 'POST' }, 6000); } catch (e) {}
        token = null; localStorage.removeItem(TK); localStorage.removeItem(TKU); localStorage.removeItem(SK);
        return true;
      }
      const all = users(); delete all[u]; putUsers(all);
      try { localStorage.removeItem('hl_save_' + u); localStorage.removeItem(SK); } catch (e) {}
      return true;
    }
  };
})();
