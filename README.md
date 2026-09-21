# HEXALIFE 🇫

**Simulateur de vie & d'économie française, en temps réel.**
Créez un citoyen, passez des diplômes, signez un CDI, fondez une boulangerie, une agence
immobilière ou votre propre banque — pendant que 800 citoyens vivent, consomment et font
tourner l'économie autour de vous. Fiscalité française réelle (barème IR 2024, PAS, IS 15 %,
URSSAF), météo vivante, marché noir, succès, récompenses quotidiennes et multijoueur via API.

![Aperçu](screenshots/06-accueil.png)

---

## ✨ Nouveautés de la v11 (refonte complète)

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
| `PORT` | port d'écoute (défaut 3000) |
| `ADMIN_NAME` | pseudo disposant du panneau admin |
| `DB_PATH` | dossier du fichier `hexalife.db` (persistant) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | base Redis partagée (Render, etc.) |
| `API_DISABLED=1` | couper l'API (statique seul) |

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
