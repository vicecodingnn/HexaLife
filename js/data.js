/* ═══════════ DONNÉES v11 — économie française, succès, récompenses quotidiennes ═══════════
 * RÈGLE DE COMPATIBILITÉ : ne jamais réordonner ni supprimer les entrées existantes
 * (companies, cars, homes, foods… sont référencées par indice/id dans les sauvegardes).
 * Ajouts uniquement, en fin de liste.
 */
const DATA = {
  prenoms: ['Léa','Hugo','Emma','Lucas','Chloé','Nathan','Manon','Louis','Camille','Jules','Inès','Tom','Sarah','Théo','Lina','Gabriel','Zoé','Raphaël','Louise','Arthur','Nina','Ethan','Jade','Noah','Alice','Liam','Romane','Sacha','Eva','Mathis','Clara','Adam','Océane','Rayan','Margot','Enzo','Anaïs','Timéo','Juliette','Maxime'],
  noms: ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier','Morel','Girard','Andre','Mercier','Dupont','Lambert','Bonnet','Francois','Martinez','Legrand','Garnier','Faure','Rousseau','Blanc','Guerin','Muller','Henry','Roussel','Nicolas','Perrin'],

  form: [
    { id:'base', n:'Remise à niveau', cost:0, dur:20, tier:1, d:'Socle de compétences' },
    { id:'cap_bl', n:'CAP Boulangerie', cost:1200, dur:90, tier:2, d:'Métiers de bouche' },
    { id:'cap_cui', n:'CAP Cuisine', cost:1100, dur:90, tier:2, d:'Cuisinier' },
    { id:'bac_com', n:'Bac Pro Commerce', cost:900, dur:75, tier:2, d:'Vente' },
    { id:'dev', n:'Développeur Web', cost:1500, dur:120, tier:3, d:'Bootcamp' },
    { id:'amf', n:'Certification AMF', cost:2500, dur:150, tier:3, d:'Banque' },
    { id:'carteT', n:'Carte T', cost:4000, dur:150, tier:3, d:'Immobilier' },
    { id:'ec', n:'École de Commerce', cost:8000, dur:210, tier:4, d:'Consulting' },
    { id:'mf', n:'Master Finance', cost:12000, dur:270, tier:5, d:'Salle de marchés' },
    /* — ajoutés v11 — */
    { id:'droit', n:'Master Droit', cost:9500, dur:240, tier:4, d:'Notariat & juridique' },
    { id:'mba', n:'MBA Management', cost:20000, dur:330, tier:5, d:'Direction générale' }
  ],

  companies: [
    { n:'Boulangerie Au Levain', sec:'Artisanat', o:[['Apprenti boulanger',12.3,1],['Boulanger',13.6,2]] },
    { n:'Carrefour City', sec:'Distribution', o:[['Caissier',11.9,1],['Manager',16.4,3]] },
    { n:'Chronopost', sec:'Logistique', o:[['Livreur',12.2,1],['Agent de tri',12.0,1]] },
    { n:'Le Bistrot des Halles', sec:'Restauration', o:[['Serveur',12.1,1],['Cuisinier',14.8,2]] },
    { n:'La Poste', sec:'Service public', o:[['Facteur',12.1,1]] },
    { n:'Hôpital Saint-Louis', sec:'Santé', o:[['Agent entretien',12.4,1],['Aide-soignant',14.2,2]] },
    { n:'TechNova', sec:'Tech', o:[['Développeur',24.5,3],['Lead Dev',34.0,4]] },
    { n:'Banque Populaire', sec:'Banque', o:[['Conseiller',18.6,3],['Analyste',31.0,4]] },
    { n:'Agence Immo', sec:'Immobilier', o:[['Agent',21.0,3]] },
    { n:'Cabinet Delacroix', sec:'Conseil', o:[['Consultant',26.0,3],['Manager',39.0,4]] },
    { n:'Renault', sec:'Industrie', o:[['Opérateur',13.8,2],['Ingénieur',32.0,4]] },
    { n:'Société Générale', sec:'Finance', o:[['Trader',55.0,5],['Risk Manager',44.0,5]] },
    /* — ajoutées v11 — */
    { n:'EDF', sec:'Énergie', o:[['Technicien réseau',17.5,2],['Ingénieur production',33.5,4]] },
    { n:'Maison Lemoine', sec:'Luxe', o:[['Vendeur',14.5,1],['Chef de produit',38.0,5]] }
  ],

  foods: [
    { id:'eau', n:'Eau 1 L', p:0.85, f:0, s:18, ico:'💧' },
    { id:'cafe', n:'Café', p:2.10, f:4, s:8, ico:'☕' },
    { id:'baguette', n:'Baguette', p:1.20, f:12, s:0, ico:'🥖' },
    { id:'croissant', n:'Croissant', p:1.30, f:10, s:0, ico:'🥐' },
    { id:'jus', n:'Jus orange', p:2.80, f:0, s:16, ico:'🧃' },
    { id:'sandwich', n:'Sandwich', p:4.60, f:22, s:0, ico:'🥪' },
    { id:'kebab', n:'Kebab-frites', p:9.50, f:34, s:-2, ico:'🌯' },
    { id:'marche', n:'Panier marché', p:14.00, f:42, s:6, ico:'🥕' },
    { id:'traiteur', n:'Plateau traiteur', p:26.00, f:60, s:10, ico:'🍽️' },
    /* — ajoutés v11 — */
    { id:'ramen', n:'Ramen express', p:1.50, f:16, s:4, ico:'🍜' },
    { id:'pizza', n:'Pizza surgelée', p:3.90, f:26, s:-4, ico:'🍕' },
    { id:'gastro', n:'Menu gastronomique', p:75.00, f:70, s:14, ico:'🦞' }
  ],

  cars: [
    { n:'Dacia Sandero', p:12900, b:.02 }, { n:'Renault Clio', p:19990, b:.04 },
    { n:'Peugeot 208', p:21400, b:.04 }, { n:'Citroën C3', p:20300, b:.04 },
    { n:'Mégane E-Tech', p:39900, b:.06 }, { n:'Tesla Model 3', p:42990, b:.08 },
    /* — ajoutées v11 — */
    { n:'Peugeot 3008 Hybride', p:34500, b:.05 }, { n:'Alpine A110', p:76500, b:.10 }
  ],

  homes: [
    { n:'Studio St-Étienne', p:68000, c:40 }, { n:'T2 Lyon 7e', p:165000, c:90 },
    { n:'T3 Nantes', p:229000, c:110 }, { n:'Maison Bordeaux', p:315000, c:130 },
    { n:'Loft Paris 11e', p:520000, c:200 }, { n:'Villa Aix', p:890000, c:350 },
    /* — ajoutés v11 — */
    { n:'Penthouse Neuilly', p:1450000, c:620 }
  ],

  rentals: [ { n:'Chambre', loyer:380 }, { n:'Studio', loyer:560 }, { n:'T2', loyer:790 } ],

  insurers: [
    { id:'mma', n:'MMA', m:24, cov:.70, d:'Couvre 70 % des frais de santé.' },
    { id:'mnt', n:'MNT', m:18, cov:.60, d:'Mutuelle territoriale, 60 %.' },
    { id:'maif', n:'MAIF', m:22, cov:.75, d:'Assureur militant, 75 %.' },
    { id:'axa', n:'AXA', m:29, cov:.85, d:'Formule premium, 85 %.' },
    { id:'groupama', n:'Groupama', m:26, cov:.80, d:'Mutualiste, 80 %.' }
  ],

  banks: [
    { id:'ce', n:'Caisse d\'Épargne', lv:3.0, desc:'Réseau d\'épargne régional, Livret A solide et service de proximité.' },
    { id:'bp', n:'Banque Populaire', lv:2.9, desc:'Banque coopérative orientée artisans et commerçants.' },
    { id:'ca', n:'Crédit Agricole', lv:3.1, desc:'Premier financeur de l\'économie locale, meilleur Livret A.' },
    { id:'bnp', n:'BNP Paribas', lv:2.7, desc:'Grand réseau international, outils digitaux complets.' },
    { id:'sg', n:'Société Générale', lv:2.6, desc:'Banque universelle, forte présence urbaine.' },
    { id:'lbp', n:'La Banque Postale', lv:2.8, desc:'Banque citoyenne, accessible à tous.' }
  ],

  loans: [ { id:'immo', n:'Immo', rate:3.8 }, { id:'auto', n:'Auto', rate:4.9 }, { id:'conso', n:'Conso', rate:6.9 } ],

  doctors: [
    { id:'d1', n:'Dr Martin', spec:'Généraliste', fee:25, quality:0.8 },
    { id:'d2', n:'Dr Bernard', spec:'Généraliste', fee:30, quality:0.9 },
    { id:'d3', n:'Dr Dubois', spec:'Spécialiste', fee:55, quality:1.0 }
  ],
  vaccines: [
    { id:'v_grippe', n:'Vaccin grippe', cost:40, d:'Évite la grippe saisonnière.' },
    { id:'v_covid', n:'Vaccin covid', cost:60, d:'Protège des formes graves.' },
    { id:'v_hepat', n:'Vaccin hépatite', cost:50, d:'Protection longue durée.' }
  ],

  bizTypes: {
    boulangerie: {
      label:'Boulangerie', cost:25000, traffic:4.0, maxEmp:4,
      mats: { farine:{n:'Farine',p:0.32}, beurre:{n:'Beurre',p:0.65}, sucre:{n:'Sucre',p:0.42}, levure:{n:'Levure',p:0.15}, choco:{n:'Chocolat',p:1.05} },
      prods: [
        { id:'baguette', n:'Baguette', in:{farine:1,levure:1}, ref:1.20, w:5 },
        { id:'croissant', n:'Croissant', in:{farine:1,beurre:1}, ref:1.30, w:4 },
        { id:'parchoc', n:'Pain choc', in:{farine:1,choco:1}, ref:1.40, w:4 },
        { id:'tarte', n:'Tarte', in:{farine:2,sucre:1,beurre:1}, ref:9.90, w:1 }
      ]
    },
    magasin: {
      label:'Magasin', cost:18000, traffic:3.4, maxEmp:4,
      prods: [
        { id:'epicerie', n:'Épicerie', cost:2.6, ref:5.9, w:5 }, { id:'boissons', n:'Boissons', cost:1.4, ref:3.4, w:4 },
        { id:'hygiene', n:'Hygiène', cost:2.2, ref:5.2, w:2 }, { id:'snacks', n:'Snacks', cost:0.9, ref:2.3, w:5 }
      ]
    },
    immobilier: { label:'Agence immo', cost:40000, req:'carteT', maxEmp:3 },
    banque: { label:'Banque', cost:100000, req:'amf', maxEmp:4 }
  },

  ups: {
    boulangerie: [
      { id:'four', n:'Four à sole', d:'+1 fournée/s/niveau', cost:3500, max:3, grow:1.8 },
      { id:'mkt', n:'Pub locale', d:'+15 % clients/niveau', cost:2500, max:4, grow:1.7 },
      { id:'decor', n:'Terrasse', d:'+40 % réputation/niveau', cost:1800, max:3, grow:1.6 }
    ],
    magasin: [
      { id:'mkt', n:'Catalogue', d:'+15 % clients/niveau', cost:2200, max:4, grow:1.7 },
      { id:'caisses', n:'Caisses auto', d:'+10 % clients/niveau', cost:3000, max:3, grow:1.8 },
      { id:'rayons', n:'Rayons opt.', d:'+40 % réputation/niveau', cost:1600, max:3, grow:1.6 }
    ],
    immobilier: [
      { id:'reseau', n:'Apporteurs', d:'+25 % commissions/niveau', cost:5000, max:4, grow:1.8 },
      { id:'vitrine', n:'Vitrine', d:'+1 mandat gratuit/min/niveau', cost:8000, max:2, grow:2.0 }
    ],
    banque: [
      { id:'app', n:'App mobile', d:'Comptes +rapides', cost:9000, max:4, grow:1.8 },
      { id:'secu', n:'Anti-fraude', d:'-25 % défauts/niveau', cost:6000, max:3, grow:1.7 },
      { id:'trader', n:'Salle marchés', d:'+0,5 pt rendement', cost:15000, max:2, grow:2.0 }
    ]
  },

  mkt: {
    boulangerie: [
      { id:'flyers', n:'Tracts', cost:200, d:'Clients ×1,25 / 120 s', kind:'boost', mul:1.25, dur:120 },
      { id:'sociaux', n:'Réseaux sociaux', cost:600, d:'×1,35 / 120 s +5 rép', kind:'boost', mul:1.35, dur:120, rep:5 },
      { id:'flash', n:'Vente flash', cost:350, d:'Prix -10 % ×1,8 / 90 s', kind:'promo', dur:90 },
      { id:'fidelite', n:'Carte fidélité', cost:1500, d:'Permanent +8 % clients', kind:'perk', perk:'fidelite', once:true },
      { id:'enseigne', n:'Enseigne', cost:900, d:'+5 rép permanent', kind:'perk', perk:'enseigne', once:true, rep:5 }
    ],
    magasin: [
      { id:'flyers', n:'Prospectus', cost:200, d:'×1,25 / 120 s', kind:'boost', mul:1.25, dur:120 },
      { id:'sociaux', n:'Réseaux', cost:600, d:'×1,35 / 120 s +5 rép', kind:'boost', mul:1.35, dur:120, rep:5 },
      { id:'flash', n:'Promo flash', cost:350, d:'-10 % ×1,8 / 90 s', kind:'promo', dur:90 },
      { id:'fidelite', n:'Carte fidélité', cost:1500, d:'+8 % permanent', kind:'perk', perk:'fidelite', once:true },
      { id:'auto', n:'Réassort auto', cost:2000, d:'Rachète stocks bas', kind:'perk', perk:'autoRestock', once:true },
      { id:'vitrine', n:'Vitrine animée', cost:900, d:'+5 rép', kind:'perk', perk:'enseigne', once:true, rep:5 }
    ],
    immobilier: [
      { id:'portes', n:'Portes ouvertes', cost:400, d:'×1,8 / 90 s', kind:'boost', mul:1.8, dur:90 },
      { id:'annonces', n:'Annonces', cost:800, d:'×1,4 / 150 s', kind:'boost', mul:1.4, dur:150 },
      { id:'site', n:'Site web', cost:1200, d:'+10 % permanent', kind:'perk', perk:'fidelite', once:true }
    ],
    banque: [
      { id:'welcome', n:'Offre bienvenue', cost:2000, d:'+25 comptes', kind:'accounts' },
      { id:'spot', n:'Spot TV', cost:3000, d:'Recrutement accéléré', kind:'perk', perk:'pub', once:true },
      { id:'push', n:'Notifications', cost:1200, d:'+10 % PNB', kind:'perk', perk:'fidelite', once:true }
    ]
  },

  /* visuels : type de particules d'ambiance + teinte du ciel */
  weather: [
    { id:'soleil', n:'Ensoleillé', ico:'☀️', vis:'sun', d:'Les terrasses font le plein.', mul:{ boulangerie:1.15, magasin:1.0, immobilier:1.1, banque:1.0 } },
    { id:'pluie', n:'Pluie', ico:'🌧️', vis:'rain', d:'On consomme à l\'abri.', mul:{ boulangerie:0.9, magasin:1.15, immobilier:0.9, banque:1.0 } },
    { id:'canicule', n:'Canicule', ico:'🌡️', vis:'heat', d:'Soif accrue, commerces de boisson en hausse.', mul:{ boulangerie:0.95, magasin:1.2, immobilier:0.95, banque:1.0 } },
    { id:'neige', n:'Neige', ico:'❄️', vis:'snow', d:'Ralentissement général, l\'épargne grimpe.', mul:{ boulangerie:0.9, magasin:1.1, immobilier:0.85, banque:1.05 } }
  ],

  skills: [
    { id:'s_eff', n:'Efficace', d:'+10 % salaire', icon:'💼', maxLvl:5, costBase:500, costGrow:1.6 },
    { id:'s_faim', n:'Endurant', d:'-15 % perte faim/niveau', icon:'🍞', maxLvl:5, costBase:400, costGrow:1.5 },
    { id:'s_sante', n:'Robuste', d:'+10 % récup santé/niveau', icon:'❤️', maxLvl:5, costBase:600, costGrow:1.6 },
    { id:'s_rep', n:'Charismatique', d:'+20 % réputation gagnée/niveau', icon:'⭐', maxLvl:5, costBase:800, costGrow:1.7 },
    { id:'s_inv', n:'Négociateur', d:'-10 % coût améliorations/niveau', icon:'💰', maxLvl:5, costBase:1000, costGrow:1.8 },
    { id:'s_lotto', n:'Chanceux', d:'+2 % chance loto/niveau', icon:'🍀', maxLvl:3, costBase:1500, costGrow:2.0 }
  ],

  lotto: { cost:5, chance:0.06, min:200, max:5000, cd:30 },

  illEntry: 5000,
  ill: [
    { id:'contre', n:'Contrefaçons', d:'Montres/sacs', gain:[350,800], heat:12, cd:40, risk:.22, cost:300 },
    { id:'trafic', n:'Trafic', d:'Convoyer', gain:[700,1500], heat:20, cd:75, risk:.30, cost:600 },
    { id:'cyber', n:'Phishing', d:'E-mails bancaires', gain:[900,2200], heat:26, cd:90, risk:.34, cost:800 },
    { id:'blanch', n:'Blanchiment', d:'Via banque', gain:[2000,5000], heat:34, cd:180, risk:.38, cost:2500, reqBiz:'banque' },
    { id:'braquage', n:'Braquage', d:'Bijouterie', gain:[9000,24000], heat:55, cd:360, risk:.50, cost:3000 }
  ],

  packs: [
    { id:'p1', price:'4,99 €', amount:5000, n:'Pécule', stripe:'https://buy.stripe.com/test_5kQbJ27J33f1az44uodjO00' },
    { id:'p2', price:'9,99 €', amount:12000, n:'Capital', stripe:'https://buy.stripe.com/test_bJe7sMe7raHt22ye4YdjO01' },
    { id:'p3', price:'24,99 €', amount:35000, n:'Fortune', best:true, stripe:'https://buy.stripe.com/test_aFabJ27J35n9az44uodjO02' },
    { id:'p4', price:'49,99 €', amount:80000, n:'Dynastie', stripe:'https://buy.stripe.com/test_4gQ4gAaVf16TdLgbWQdjO03' }
  ],

  missions: [
    { id:'m_work', n:'Travailler 5 min', tgt:300, type:'work', rew:150 },
    { id:'m_eat', n:'Manger 3 fois', tgt:3, type:'eat', rew:60 },
    { id:'m_shop', n:'Acheter 4 articles', tgt:4, type:'shop', rew:80 },
    { id:'m_sell', n:'Vendre 25 articles', tgt:25, type:'sell', rew:200 },
    { id:'m_train', n:'Formation terminée', tgt:1, type:'train', rew:250 },
    { id:'m_cash', n:'5 000 € de solde', tgt:5000, type:'cash', rew:300 }
  ],

  quests: [
    { id:'q_work', n:'Travailler 10 min', tgt:600, type:'work', rew:300, xp:50 },
    { id:'q_eat', n:'Manger 5 fois', tgt:5, type:'eat', rew:100, xp:30 },
    { id:'q_sell', n:'Vendre 50 articles', tgt:50, type:'sell', rew:500, xp:80 },
    { id:'q_train', n:'Terminer une formation', tgt:1, type:'train', rew:400, xp:100 },
    { id:'q_cash', n:'Atteindre 10 000 €', tgt:10000, type:'cash', rew:600, xp:120 },
    { id:'q_lotto', n:'Jouer 3 fois', tgt:3, type:'lotto', rew:150, xp:40 }
  ],

  /* — v11 : récompense quotidienne (jour 1 → 7, puis cycle sur le jour 7) — */
  daily: [
    { day:1, amt:150, xp:20 }, { day:2, amt:300, xp:30 }, { day:3, amt:500, xp:40 },
    { day:4, amt:800, xp:50 }, { day:5, amt:1200, xp:60 }, { day:6, amt:2000, xp:80 },
    { day:7, amt:3500, xp:150 }
  ],

  /* — v11 : succès. check(G, ctx) avec ctx = helpers moteur — */
  ach: [
    { id:'a_tuto', n:'Diplômé de la vie', d:'Terminer le tutoriel', icon:'🎓', xp:20, check:G=>!!G.stats.tutoDone },
    { id:'a_job', n:'Premier contrat', d:'Signer un premier emploi', icon:'✍️', xp:30, check:G=>G.jobs.length > 0 },
    { id:'a_dip', n:'Sur les bancs de l\'école', d:'Obtenir un diplôme', icon:'📜', xp:40, check:G=>G.diplomas.length > 0 },
    { id:'a_dip5', n:'Tête bien pleine', d:'Obtenir 5 diplômes', icon:'🧠', xp:150, check:G=>G.diplomas.length >= 5 },
    { id:'a_biz', n:'Patron·ne', d:'Fonder une entreprise', icon:'🏪', xp:80, check:G=>G.biz.length > 0 },
    { id:'a_empire', n:'Empire', d:'Posséder 3 entreprises', icon:'🏙️', xp:200, check:G=>G.biz.length >= 3 },
    { id:'a_bank', n:'Compte en banque', d:'Ouvrir un compte bancaire', icon:'🏦', xp:30, check:G=>!!G.bank.bankId },
    { id:'a_bossbank', n:'Ma propre banque', d:'Fonder une banque', icon:'💳', xp:250, check:(G,c)=>G.biz.some(b=>b.type==='banque') },
    { id:'a_10k', n:'Épargnant', d:'Atteindre 10 000 €', icon:'💶', xp:60, check:(G,c)=>c.balance() >= 10000 },
    { id:'a_100k', n:'Cent mille', d:'Atteindre 100 000 €', icon:'💰', xp:150, check:(G,c)=>c.balance() >= 100000 },
    { id:'a_1m', n:'Millionnaire', d:'Atteindre 1 000 000 €', icon:'🤑', xp:400, check:(G,c)=>c.balance() >= 1000000 },
    { id:'a_home', n:'Chez soi', d:'Acheter un bien immobilier', icon:'🏠', xp:80, check:G=>G.houses.length > 0 },
    { id:'a_landlord', n:'Rentier', d:'Louer un bien à un locataire', icon:'🔑', xp:100, check:G=>G.houses.some(h=>h.tenant) },
    { id:'a_car', n:'Permis validé', d:'Acheter une voiture', icon:'🚗', xp:50, check:G=>G.cars.length > 0 },
    { id:'a_lvl5', n:'Citoyen confirmé', d:'Atteindre le niveau 5', icon:'📈', xp:60, check:(G,c)=>c.level(G.xp) >= 5 },
    { id:'a_lvl10', n:'Pilier de la ville', d:'Atteindre le niveau 10', icon:'🏅', xp:120, check:(G,c)=>c.level(G.xp) >= 10 },
    { id:'a_lvl20', n:'Légende locale', d:'Atteindre le niveau 20', icon:'👑', xp:300, check:(G,c)=>c.level(G.xp) >= 20 },
    { id:'a_lotto', n:'Jour de chance', d:'Gagner au loto', icon:'🍀', xp:40, check:G=>(G.stats.lottoWins||0) > 0 },
    { id:'a_m5', n:'Défi relevé', d:'Terminer 5 défis', icon:'🎯', xp:60, check:G=>(G.stats.missionsDone||0) >= 5 },
    { id:'a_m25', n:'Machine à défis', d:'Terminer 25 défis', icon:'🏹', xp:150, check:G=>(G.stats.missionsDone||0) >= 25 },
    { id:'a_tax', n:'Bon contribuable', d:'Verser 10 000 € d\'impôts', icon:'🏛️', xp:100, check:G=>(G.stats.tax||0) >= 10000 },
    { id:'a_sales', n:'Fonds de commerce', d:'Réaliser 1 000 ventes', icon:'🧾', xp:120, check:G=>(G.stats.sales||0) >= 1000 },
    { id:'a_orders', n:'Commandeur', d:'Honorer 10 commandes spéciales', icon:'📦', xp:100, check:G=>(G.stats.orders||0) >= 10 },
    { id:'a_vac', n:'Carnet de santé à jour', d:'Faire les 3 vaccins', icon:'💉', xp:60, check:G=>G.health.vaccines.length >= 3 },
    { id:'a_skillmax', n:'Maîtrise', d:'Maxer une compétence', icon:'⚡', xp:120, check:(G,c)=>DATA.skills.some(s=>(G.skills[s.id]||0) >= s.maxLvl) },
    { id:'a_noir', n:'De l\'autre côté', d:'Débloquer le marché noir', icon:'🕶️', xp:40, check:G=>!!G.ill.unlocked },
    { id:'a_jail', n:'Garde à vue', d:'Se faire interpeller', icon:'🚔', xp:30, check:G=>!!G.stats.jailed },
    { id:'a_braq', n:'Braqueur de service', d:'Réussir un braquage', icon:'💥', xp:150, check:G=>(G.stats.braquages||0) > 0 },
    { id:'a_daily7', n:'Assidu', d:'7 jours de suite en ville', icon:'📅', xp:150, check:G=>(G.daily && G.daily.streak || 0) >= 7 },
    { id:'a_transfert', n:'Généreux', d:'Envoyer de l\'argent à un joueur', icon:'🤝', xp:50, check:G=>(G.stats.transfersSent||0) > 0 }
  ],

  events: [
    { t:'good', m:'Prime employeur', ok:() => G.jobs.length > 0, f(){ const g = rnd(200,900); receive(g, 'Prime'); return '+'+eur(g); } },
    { t:'good', m:'Remboursement impôts', f(){ const g = rnd(120,420); receive(g, 'Remboursement'); return '+'+eur(g); } },
    { t:'good', m:'Billet trouvé', f(){ const g = rnd(5,40); receive(g, 'Gain'); return '+'+eur(g); } },
    { t:'good', m:'Concurrent faillite', ok:() => ownsBiz('boulangerie'), f(){ G.boost = { type:'boulangerie', mul:1.6, until: Date.now()+90000, label:'Concurrent faillite' }; return '×1,6 / 90 s'; } },
    { t:'good', m:'Buzz réseaux', ok:() => ownsBiz('magasin'), f(){ G.boost = { type:'magasin', mul:1.6, until: Date.now()+90000, label:'Buzz' }; return '×1,6 / 90 s'; } },
    { t:'good', m:'Foire immo', ok:() => ownsBiz('immobilier'), f(){ G.boost = { type:'immobilier', mul:2, until: Date.now()+60000, label:'Foire' }; return '×2 / 60 s'; } },
    { t:'good', m:'Héritage surprise', f(){ const g = rnd(500,3000); receive(g, 'Héritage'); return '+'+eur(g); } },
    /* — ajoutés v11 — */
    { t:'good', m:'Heures sup\' majorées', ok:() => G.jobs.length > 0, f(){ const g = rnd(80,320); receive(g, 'Heures sup'); return '+'+eur(g); } },
    { t:'good', m:'Cashback carte bleue', f(){ const g = rnd(15,90); receive(g, 'Cashback'); return '+'+eur(g); } },
    { t:'good', m:'Vide-grenier fructueux', f(){ const g = rnd(40,260); receive(g, 'Vide-grenier'); return '+'+eur(g); } },
    { t:'good', m:'Parrainage banque', ok:() => !!G.bank.bankId, f(){ const g = rnd(60,180); receive(g, 'Parrainage'); return '+'+eur(g); } },
    { t:'good', m:'Client fidèle pourboire', ok:() => G.biz.length > 0, f(){ const g = rnd(30,200); receive(g, 'Pourboire'); return '+'+eur(g); } },
    { t:'bad', m:'Grippe saisonnière', f(){ if (G.health.vaccines.includes('v_grippe')) return 'évité (vaccin)'; let c = rnd(90,180); c *= (1-cov()); pay(c, 'Frais grippe'); G.health.sick = true; G.vitals.sante -= 10; return '−'+eur(c); } },
    { t:'bad', m:'Panne voiture', ok:() => G.cars.length > 0, f(){ let c = rnd(200,600); c *= (1-cov()); pay(c, 'Réparation'); return '−'+eur(c); } },
    { t:'bad', m:'Contrôle fiscal', ok:() => G.stats.earned > 5000, f(){ const c = balance()*rnd(0.02,0.05); pay(c, 'Redressement'); G.stats.tax += c; return '−'+eur(c); } },
    { t:'bad', m:'Cambriolage', ok:() => balance() > 500, f(){ const c = balance()*rnd(0.01,0.03); pay(c, 'Vol'); return '−'+eur(c); } },
    { t:'bad', m:'Amende stationnement', f(){ pay(35, 'Amende'); return '−'+eur(35); } },
    /* — ajoutés v11 — */
    { t:'bad', m:'Dégât des eaux', ok:() => !!G.rental || G.houses.length > 0, f(){ let c = rnd(150,520); c *= (1-cov()); pay(c, 'Dégât des eaux'); return '−'+eur(c); } },
    { t:'bad', m:'Grève des transports', f(){ G.boost = { type:'toutes', mul:0.85, until: Date.now()+90000, label:'Grève' }; return '×0,85 / 90 s'; } },
    { t:'bad', m:'Coupure d\'électricité', ok:() => G.biz.length > 0, f(){ const c = rnd(60,240); pay(c, 'Pertes coupure'); return '−'+eur(c); } },
    { t:'bad', m:'Rappel de charges', ok:() => !!G.rental, f(){ const c = rnd(80,260); pay(c, 'Rappel charges'); return '−'+eur(c); } },
    { t:'bad', m:'Abonnement oublié', f(){ const c = rnd(12,45); pay(c, 'Abonnement'); return '−'+eur(c); } }
  ],

  news: [
    'Banque centrale maintient taux', 'Prix beurre hausse', 'Demande logements forte',
    'CAC 40 hésite', 'Record baguettes', 'Immo ancien couleurs',
    'Pénurie devs : salaires grimpent', 'Épargne française hausse',
    /* — ajoutés v11 — */
    'Le Livret A toujours plébiscité', 'Les artisans recrutent massivement',
    'Grève annoncée jeudi dans les transports', 'Le marché de l\'occasion explose',
    'Nouvelle prime rénovation votée', 'Les taux immobiliers se stabilisent',
    'Boom des commerces de proximité', 'L\'assurance santé renégocie ses tarifs',
    'Les loyers encadrés dans 3 nouvelles villes', 'Le télétravail dope les déménagements'
  ]
};
