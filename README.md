# HEXALIFE 🇫

**Simulateur de vie & d'économie française, en temps réel.**
Créez un citoyen, passez des diplômes, signez un CDI, fondez une boulangerie, une agence
immobilière ou votre propre banque — pendant que 800 citoyens vivent, consomment et font
tourner l'économie autour de vous. Fiscalité française réelle (barème IR 2024, PAS, IS 15 %,
URSSAF), météo vivante, marché noir, succès, récompenses quotidiennes et multijoueur via API.

![Aperçu](screenshots/06-accueil.png)

---

## ✨ Nouveautés de la v11 (refonte complète)

### 🩹 v11.1 — correctifs de gameplay & contenu par onglet
- **Bug racine corrigé** : les valeurs `data-*` du DOM (chaînes) étaient ignorées par le
  moteur → « ×5 » achetait 1, les boutons ± des prix/taux ne faisaient rien. Tout est
  désormais coercé + **saisie à virgule française acceptée** (« 150,50 »).
- **Banque** : panneau « Mouvements internes » repensé — 4 transferts (liquide↔compte,
  compte↔Livret A) avec solde source affiché, bouton **Max contextuel** par opération,
  boutons désactivés si source vide, messages d'erreur indiquant le disponible ;
  **graphique animé de l'historique de solde**.
- **Courses** : **prix dynamiques du marché** (promos −15/−38 % et tensions +15/35 %,
  refresh ~2 min) avec badges PROMO/+, prix barré, et achat ×5 fonctionnel.
- **Emploi** : **négociation salariale** (+8 % brut/h en cas de succès ; chances selon
  charisme + ancienneté, cooldowns), heures de service affichées.
- **Auto** : **usure des véhicules** (barre d'état), **révision** payante, revente et
  pannes indexées sur l'état — plus de panne de voiture sans voiture.
- **Santé** : **séance de sport** (+4 santé, −4 faim/soif, cooldown 90 s).
- **Entreprises** : **conseiller de prix** par produit (sous/sur le marché), halo
  pulsant sur les cartes sous campagne.
- **Immo** : rendement locatif %/an, plus-values colorées, **graphique du marché immo**.
- **Assurances** : **simulateur de reste à charge** (hôpital, grippe, consultation…).
- **Inventaire** : valeur totale du sac + nombre d'articles.
- **Événements cohérents** : amende stationnement & prime mobilité selon possession de
  voiture ; 3 nouveaux événements.
- **Animations** : effet *ripple* au clic, cœur qui bat sur jauges critiques, badges
  PROMO élastiques, +XP flottant près de la barre de niveau ; correctifs : voiture B de
  l'intro (hors champ), spinner de chargement centré, overlay NIVEAU au-dessus des modales.
- **Régressions verrouillées par tests** : 9 scénarios dédiés dans `test/smoke.mjs`
  (×5, prix, taux, Livret A virgule + Max, négociation, sport, révision, marché, amende).


### 🎬 Animations — beaucoup plus nombreuses, beaucoup plus fines
- **Moteur canvas dédié (`js/fx.js`)** : météo ambiante (pluie, neige, poussière dorée de
  canicule, braises de chaleur), étoiles scintillantes, confettis à physique réelle
  (gravité, traînée, rotation), pluie de billets, billets volants, étincelles.
- **Graphiques animés** : courbes lissées (splines) avec dégradé, point final pulsant,
  *morphing* fluide entre jeux de données — indices, performance nette, revenu d'entreprise.
- **Overlay « NIVEAU X »** : rayons rotatifs, anneau expansif, pop élastique + confettis.
- **Flash d'événement** plein écran (liseré doré/rouge), secousse d'écran (hôpital, arrestation).
- **Carte bancaire HEXAPAY 3D** qui suit le curseur (inclinaison perspective) + reflet balayé.
- **Micro-interactions partout** : boutons à reflet glissant, cartes qui se soulèvent,
  jauges à shimmer, badges pulsants, compteurs qui « bumpent », toasts avec barre de vie,
  modales élastiques, transitions d'onglets, apparition en cascade des panneaux.
- **Intro cinématique enrichie** : nuages dérivants, voitures à phares allumés, fenêtres
  qui s'allument et clignotent, aube progressive pilotée par le chargement.
- **Respect de `prefers-reduced-motion`** + réglage « animations réduites ».

### 🔊 Audio
- **Sons synthétisés WebAudio** (aucun fichier) : achats, ventes, niveaux, succès, sirène de
  garde à vue, cloche… Désactivables dans ⚙ Réglages.

### 🎮 Fonctionnalités ajoutées
- **30 succès** débloquables (toast dédié + XP + grille complète dans le Profil).
- **Récompense quotidienne** à séries (J1 → J7, jusqu'à 3 500 €), calendrier animé.
- **Classement de la ville** (API) : top 10 par patrimoine, votre rang, joueurs en ligne.
- **Caution de garde à vue** : sortez de prison immédiatement contre 10 % du solde.
- **Météo ↔ gameplay** : canicule = soif ×1,7 ; pluie/neige sans domicile = santé en baisse ;
  soleil = récupération accrue. Multiplicateurs d'entreprises selon la météo.
- **Journal de compte filtrable** (tout / entrées / sorties) avec icônes par type.
- **Alertes de stock épuisé** pour vos commerces, commandes spéciales mieux signalées.
- **Réglages** (sons / particules / animations réduites) + **modale d'aide** (F1).
- **Raccourcis clavier** : `Échap` fermer · `Alt+1..9` onglets · `F1` aide.
- **Contenu étendu** : 2 entreprises, 3 aliments, 2 voitures, 1 bien immobilier, 2 formations,
  10 événements et 10 brèves de ticker en plus.
- **Progression hors-ligne détaillée** : salaires, entreprises, loyers, intérêts Livret A.

### 🐞 Bugs corrigés (extraits de l'audit)
- `sanitize()` **crashait sur les sauvegardes corrompues** (`vitals: null`, tableaux invalides…)
  → fusion profonde typée et bornée ; migration v10 → v11 automatique.
- `A.offer`, `A.buyCar`, `A.craft`… **crashaient sur indices hors bornes** → tous validés.
- **Ops mailbox re-jouées en boucle** si l'une échouait → application isolée + ack garanti.
- **Modale banque jamais fermée** après ouverture de compte (`openBank`).
- Intro **bloquée à 14 %** si l'API ne répondait pas → timeouts internes + garde-fou 4 s.
- Boutons de connexion/inscription **gelés** sur erreur réseau → `try/finally` + messages.
- `fireEvent` crashait si le pool d'événements était vide → repli sûr.
- Historiques d'indices collectés **seulement sur l'onglet Économie** → désormais toujours
  (graphiques vivants dès l'ouverture) + historique pré-généré au lancement.
- Ticker **statique** → reconstruit toutes les 45 s avec données vivantes.
- Annonces vues dédupliquées **par navigateur** au lieu de **par joueur** → clé scopée.
- Re-render complet toutes les 5 s de l'onglet Marketing → comptes à rebours génériques
  `[data-until]` mis à jour sans re-render.
- `moneyFx` spammait un jeton par opération → **agrégation** toutes les 420 ms.
- Sauvegarde de fermeture d'onglet parfois perdue → `navigator.sendBeacon`.
- **Sécurité serveur** : `server/hexalife.db` (hachés de mots de passe + saves) était
  téléchargeable en HTTP → dossier `server/`, `test/` et fichiers cachés désormais interdits ;
  écriture atomique de la base ; sessions expirantes (30 j) ; corps de requête borné (413) ;
  comparaison de hachés à longueur constante ; résolution de pseudo insensible à la casse
  pour les transferts ; réservations (holds) persistées contre le double envoi.

### 🧪 Qualité — le projet est testé
- `npm test` lance **3 suites** :
  - `test/smoke.mjs` — le vrai client dans jsdom : 400+ ticks, 15 onglets, ~120 actions,
    sauvegardes corrompues, offline, FX… zéro exception tolérée.
  - `test/server.test.mjs` — **70 assertions API** : comptes, transferts, holds, annonces,
    banques joueurs, classement, admin, sécurité statique.
  - `test/browser.test.mjs` — session complète dans **Chromium headless** (inscription,
    tutoriel, achats, contrat, banque, entreprise, mobile…) + captures `screenshots/`.

---

## 🚀 Démarrer

```bash
npm install        # aucune dépendance runtime ! (Node ≥ 18 suffit)
npm start          # → http://localhost:3000
```

Sans serveur, `index.html` fonctionne aussi en **mode local** (base navigateur) :
tout le solo est jouable, seul le multijoueur (transferts, annonces, classement) nécessite l'API.

### Variables d'environnement serveur
| Variable | Rôle |
|---|---|
| `PORT` | port d'écoute (défaut 3000 — fourni automatiquement par Render) |
| `ADMIN_NAME` | pseudo disposant du panneau admin |
| `DB_PATH` | dossier du fichier `hexalife.db` (persistant) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | base Redis partagée (Render, etc.) |
| `API_DISABLED=1` | couper l'API (statique seul) |

### 🚢 Déployer sur Render + Upstash (testé, cf. `npm run test:upstash`)
1. **Upstash** : créez une base Redis (plan gratuit), copiez l'**URL REST** et le **token**
   (console Upstash → votre base → onglet REST API).
2. **Render** : New → **Web Service** → votre dépôt GitHub.
   - **Root Directory** : vide (racine du dépôt)
   - **Runtime** : Node
   - **Build Command** : vide (aucune dépendance) — ou `npm install`, instantané
   - **Start Command** : `node server/server.js` (strictement équivalent à `npm start`)
   - **Node version** : épinglée par `.nvmrc` (20) — sinon env var `NODE_VERSION=20`
   - Variables d'environnement : `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
     `ADMIN_NAME` (votre pseudo). `PORT` est injecté par Render.
   - Health check (optionnel) : `/api/health`
3. **Migration automatique** : si votre base Upstash contient déjà des données de
   l'ancienne version, elles sont migrées au démarrage (sessions chaîne → objet,
   champs `holds`/`mailbox` créés) et les sauvegardes `v10` des joueurs sont
   converties en `v11` côté client à la connexion — **personne ne perd sa vie**.
   Vérifié par `test/upstash.test.mjs` (16 assertions, dont un redémarrage complet
   simulant un redeploy).
4. **Sans Upstash** : repli sur fichier local — fonctionne, mais le disque des
   instances gratuites Render est éphémère (redéploiement = remise à zéro).
   Upstash est donc fortement recommandé en production.
5. Instance gratuite Render = veille après 15 min d'inactivité : le premier chargement
   peut prendre quelques secondes ; l'intro attend la détection de base sans jamais
   bloquer (timeout 3 s + garde-fou 4 s).

### Tests
```bash
npm test           # smoke client + intégration serveur
npm run test:client
npm run test:server
node test/browser.test.mjs   # navigateur réel (playwright-core + chromium)
npm run check      # vérification syntaxique de tous les modules
```

---

## 🗂 Architecture

```
index.html          écrans intro / auth / jeu + calques canvas FX
css/style.css       design system complet (tokens, animations, responsive)
js/db.js            couche base : API serveur ↔ repli localStorage, sendBeacon
js/data.js          données pures (emplois, recettes, succès, événements…) — AJOUTS ONLY
js/fx.js            moteur FX : canvas météo/particules, sons WebAudio, graphiques
js/engine.js        boucle de jeu (1 tick/s = 1 min), économie, fiscalité, sanitize v11
js/ui.js            rendu, vues, toasts, modales, tutoriel, présence réseau
js/main.js          boot, intro, délégation clics, raccourcis, erreurs globales
server/server.js    API Node sans dépendance : comptes, saves, transferts, annonces,
                    banques joueurs, classement, admin, statique sécurisé
test/               smoke jsdom, intégration API, session Chromium + captures
```

**Boucle de jeu** : 1 tick = 1 s réelle = 1 minute de vie ; 60 ticks = 1 mois
(loyers, charges, intérêts, URSSAF, IS). Les entreprises tournent en continu
(demande, réputation, prix, météo, marketing, salariés).

**Sauvegardes** : versionnées (`v: 11`), migrées automatiquement, assainies à la lecture —
une sauvegarde ancienne ou abîmée ne peut plus faire crasher le jeu.

## 🎯 Jouer vite fait
1. **Courses → Inventaire** : mangez avant que la faim ne tombe à 0.
2. **Emploi** : une formation (gratuite : « Remise à niveau ») puis un contrat partiel.
3. **Banque** : ouvrez un compte — salaires, impôts et transferts y passent.
4. **Entreprises** : boulangerie = production artisanale ; magasin = négoce ;
   agence immo = mandats ; banque = pilotage de taux et clients joueurs.
5. **Accueil** : défis, quêtes, récompense quotidienne, loto.
6. **Noir** 🔒 : rentable, mais la chaleur monte… et la caution aussi.

## 📄 Licence
MIT — amusez-vous, et vivez bien. 💛
