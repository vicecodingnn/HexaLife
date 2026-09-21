/* ═══════════ HEXALIFE — Test visuel navigateur réel (Playwright) ═══════════
 * Ouvre la page dans Chromium headless, joue une vraie session via l'UI,
 * capture les erreurs console et prend des captures d'écran (screenshots/).
 * Usage : node test/browser.test.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire('/tmp/package.json');
let pw;
try { pw = require('playwright-core'); } catch (e) { console.error('playwright-core manquant (npm i playwright-core dans /tmp)'); process.exit(2); }
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
async function freePort() {
  for (let tries = 0; tries < 20; tries++) {
    const p = 3600 + Math.floor(Math.random() * 2000);
    try { await fetch('http://localhost:' + p + '/api/health', { signal: AbortSignal.timeout(300) }); }
    catch (e) { return p; }
  }
  throw new Error('aucun port libre trouvé');
}
const PORT = await freePort();
const BASE = 'http://localhost:' + PORT;
const TMPDB = '/tmp/hl-browser-db-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
const SHOTS = path.join(ROOT, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const errors = [];
const srv = spawn(process.execPath, [path.join(ROOT, 'server/server.js')], {
  env: { ...process.env, PORT: String(PORT), DB_PATH: TMPDB },
  stdio: 'ignore',
});
const quit = code => { try { srv.kill('SIGKILL'); } catch (e) {} try { fs.rmSync(TMPDB, { recursive: true, force: true }); } catch (e) {} process.exit(code); };

for (let i = 0; i < 60; i++) {
  try { const r = await fetch(BASE + '/api/health'); if (r.ok) break; } catch (e) {}
  await new Promise(r => setTimeout(r, 150));
}

const msDir = '/tmp/.cache/ms-playwright';
const exeDir = fs.existsSync(msDir) ? fs.readdirSync(msDir).find(d => d.startsWith('chromium')) : null;
let exePath;
if (exeDir) {
  const sub = path.join(msDir, exeDir);
  const cand = [
    path.join(sub, 'chrome-linux', 'headless_shell'),
    path.join(sub, 'chrome-headless-shell-linux64', 'chrome-headless-shell'),
    path.join(sub, 'chrome-linux', 'chrome'),
  ];
  exePath = cand.find(p => fs.existsSync(p));
}
const browser = await pw.chromium.launch({
  executablePath: exePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|favicon|ERR_FAILED.*fonts/i.test(m.text())) errors.push('console: ' + m.text()); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = async name => { await page.screenshot({ path: path.join(SHOTS, name + '.png') }); };

try {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(600);
  await shot('01-intro-debut');

  // attente fin de chargement intro
  await page.waitForFunction(() => !document.getElementById('btnStart').disabled, { timeout: 15000 });
  await shot('02-intro-pret');

  await page.click('#btnStart');
  await sleep(600);
  await shot('03-auth');

  // inscription via le formulaire réel
  await page.click('.atab[data-t="reg"]');
  await sleep(400);
  await page.fill('#rg_user', 'MarieTest');
  await page.fill('#rg_mail', 'marie@test.fr');
  await page.fill('#rg_pass', 'test1234');
  await page.fill('#rg_pass2', 'test1234');
  await shot('04-auth-inscription');
  await page.click('#rg_btn');
  await page.waitForFunction(() => document.getElementById('scr-app').classList.contains('active'), { timeout: 10000 });
  await sleep(1400);
  await shot('05-jeu-accueil-tuto');

  // tutoriel : aller au bout
  for (let i = 0; i < 9; i++) {
    const btn = await page.$('#tutoNext');
    if (!btn) break;
    await btn.click();
    await sleep(220);
  }
  await sleep(500);
  await shot('06-accueil');

  // argent de test + actions UI réelles
  await page.evaluate(() => { G.cash = 250000; if (G.bank.bankId) G.bank.compte = 250000; UI.render(true); });

  // courses → achat → inventaire → consommation
  await page.click('[data-id="marche"]');
  await sleep(500);
  await shot('07-courses');
  await page.click('[data-act="buyFood"][data-id="baguette"]');
  await sleep(300);
  await page.click('[data-act="buyFood"][data-id="kebab"][data-q="5"]');
  await sleep(300);
  await page.click('[data-id="inventaire"]');
  await sleep(500);
  await shot('08-inventaire');
  await page.click('[data-act="eat"]');
  await sleep(700);

  // emploi : signer un contrat via la modale
  await page.click('[data-id="carriere"]');
  await sleep(500);
  await shot('09-emploi');
  const offerBtn = await page.$('.offer-row button.btn-primary');
  if (offerBtn) {
    await offerBtn.click();
    await sleep(500);
    await shot('10-contrat-modale');
    await page.click('[data-act="sign"]');
    await sleep(600);
  }

  // banque : ouvrir un compte
  await page.click('[data-id="banque"]');
  await sleep(700);
  await shot('11-banque-choix');
  await page.click('.bank-offer >> nth=2');
  await sleep(500);
  await shot('12-banque-modale');
  await page.click('[data-act="openBank"]');
  await sleep(900);
  await shot('13-banque-compte');

  // entreprise : fonder une boulangerie
  await page.evaluate(() => { G.diplomas.push('cap_bl'); G.cash = 0; G.bank.compte = 250000; UI.render(true); });
  await page.click('[data-id="entreprises"]');
  await sleep(500);
  await page.click('[data-act="openCreate"][data-type="boulangerie"]');
  await sleep(400);
  await page.click('[data-act="createBiz"]');
  await sleep(900);
  await shot('14-entreprise-detail');
  // onglet production : acheter matières + fabriquer
  await page.click('[data-act="bizTab"][data-t="prod"]');
  await sleep(400);
  await page.click('[data-act="buyMat"][data-m="farine"][data-q="50"]');
  await sleep(250);
  await page.click('[data-act="buyMat"][data-m="levure"][data-q="50"]');
  await sleep(250);
  await page.click('[data-act="craft"][data-p="baguette"][data-q="10"]');
  await sleep(400);
  await shot('15-production');
  await page.click('[data-act="bizTab"][data-t="overview"]');
  await sleep(1500); // laisse le graphe s'animer + ventes tourner
  await shot('16-entreprise-overview');

  // économie : graphiques + classement
  await page.click('[data-id="economie"]');
  await sleep(2500);
  await shot('17-economie');

  // compétences + succès
  await page.click('[data-id="skills"]');
  await sleep(500);
  await shot('18-competences');
  await page.click('[data-id="profil"]');
  await sleep(600);
  await shot('19-profil');

  // réglages
  await page.click('[data-act="openSettings"]');
  await sleep(500);
  await shot('20-reglages');
  await page.click('.set-row[data-k="sound"]');
  await sleep(300);
  await page.keyboard.press('Escape');
  await sleep(300);

  // aide
  await page.click('[data-act="openHelp"]');
  await sleep(400);
  await shot('21-aide');
  await page.keyboard.press('Escape');
  await sleep(200);

  // level up forcé (overlay)
  await page.evaluate(() => { UI.levelUp(5); });
  await sleep(400);
  await shot('22-levelup');
  await sleep(2200);

  // annonces + pluie de billets
  await page.evaluate(() => { UI.moneyRain(); UI.confetti(); });
  await sleep(500);
  await shot('23-fx-confettis');
  await sleep(1800);

  // météo : forcer la pluie pour voir le canvas d'ambiance
  await page.evaluate(() => { W.weather.i = 1; UI.setWeather('rain'); });
  await page.click('[data-id="vie"]');
  await sleep(2200);
  await shot('24-meteo-pluie');

  // marché noir
  await page.evaluate(() => { G.ill.unlocked = true; UI.render(); });
  await page.click('[data-id="noir"]');
  await sleep(600);
  await shot('25-marche-noir');

  // garde à vue
  await page.evaluate(() => { G.jail = Date.now() + 15000; UI.tick(); });
  await sleep(400);
  await shot('26-prison');
  await page.click('#jailBail');
  await sleep(400);

  // boutique
  await page.click('[data-id="plus"]');
  await sleep(600);
  await shot('27-boutique');

  // raccourci clavier Alt+2
  await page.keyboard.press('Alt+2');
  await sleep(500);
  const tabAfterShortcut = await page.evaluate(() => T.tab);
  if (tabAfterShortcut !== 'inventaire') errors.push('raccourci Alt+2 : onglet = ' + tabAfterShortcut);

  // mobile
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  mob.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mob.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await mob.waitForFunction(() => !document.getElementById('btnStart').disabled, { timeout: 15000 });
  await mob.click('#btnStart');
  await sleep(500);
  // session existante (même navigateur ? non, nouveau contexte) → inscription rapide
  await mob.click('.atab[data-t="reg"]');
  await mob.fill('#rg_user', 'MobTest');
  await mob.fill('#rg_mail', 'mob@test.fr');
  await mob.fill('#rg_pass', 'test1234');
  await mob.fill('#rg_pass2', 'test1234');
  await mob.click('#rg_btn');
  await mob.waitForFunction(() => document.getElementById('scr-app').classList.contains('active'), { timeout: 10000 }).catch(() => {});
  await sleep(1200);
  for (let i = 0; i < 9; i++) { const b = await mob.$('#tutoNext'); if (!b) break; await b.click(); await sleep(150); }
  await sleep(400);
  await mob.screenshot({ path: path.join(SHOTS, '28-mobile-accueil.png') });
  await mob.click('[data-id="marche"]').catch(() => {});
  await sleep(600);
  await mob.screenshot({ path: path.join(SHOTS, '29-mobile-courses.png') });
  await mob.close();

  // vérification finale : aucune erreur interne non gérée signalée par l'app
  const internalErr = await page.evaluate(() => [...document.querySelectorAll('.toast')].filter(t => /erreur interne/i.test(t.textContent)).length);
  console.log('toasts d’erreur interne visibles : ' + internalErr);
  if (internalErr > 0) errors.push(internalErr + ' toast(s) d’erreur interne');
} catch (e) {
  errors.push('TEST: ' + (e.stack || e.message));
  await shot('zz-crash').catch(() => {});
}

await browser.close();

if (errors.length) {
  console.log('✗ ' + errors.length + ' ERREUR(S) navigateur :');
  [...new Set(errors)].slice(0, 25).forEach(e => console.log('— ' + e));
  quit(1);
} else {
  console.log('✓ Test navigateur passé — aucune erreur console/page. Captures dans screenshots/');
  quit(0);
}
