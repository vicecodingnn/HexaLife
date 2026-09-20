/* ═══════════ DONNÉES v4 ═══════════ */
const DATA = {
  prenoms: ['Léa','Hugo','Emma','Lucas','Chloé','Nathan','Manon','Louis','Camille','Jules','Inès','Tom','Sarah','Théo','Lina','Gabriel','Zoé','Raphaël','Louise','Arthur','Nina','Ethan','Jade','Noah','Alice','Liam','Romane','Sacha','Eva','Mathis','Clara','Adam','Océane','Rayan','Margot','Enzo','Anaïs','Timéo','Juliette','Maxime'],
  noms: ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier','Morel','Girard','Andre','Mercier','Dupont','Lambert','Bonnet','Francois','Martinez','Legrand','Garnier','Faure','Rousseau','Blanc','Guerin','Muller','Henry','Roussel','Nicolas','Perrin'],

  form: [
    { id:'base', n:'Remise à niveau — socle de compétences', cost:0, dur:20, tier:1, d:'Indispensable pour tout premier emploi.' },
    { id:'cap_bl', n:'CAP Boulangerie', cost:1200, dur:90, tier:2, d:'Métiers de bouche… et votre future boulangerie.' },
    { id:'cap_cui', n:'CAP Cuisine', cost:1100, dur:90, tier:2, d:'Cuisinier, commis, chef de partie.' },
    { id:'bac_com', n:'Bac Pro Commerce', cost:900, dur:75, tier:2, d:'Vente, caisse, management de rayon.' },
    { id:'dev', n:'Formation Développeur Web', cost:1500, dur:120, tier:3, d:'Bootcamp intensif. Le numérique recrute.' },
    { id:'amf', n:'Certification Bancaire AMF', cost:2500, dur:150, tier:3, d:'Sésame de la banque — prérequis pour fonder la vôtre.' },
    { id:'carteT', n:'Carte T — Transaction immobilière', cost:4000, dur:150, tier:3, d:'Exercer légalement comme agent immobilier.' },
    { id:'ec', n:'École de Commerce (Grande École)', cost:8000, dur:210, tier:4, d:'Consulting, management, réseau.' },
    { id:'mf', n:'Master Finance — Paris-Dauphine', cost:12000, dur:270, tier:5, d:'Salles de marchés, très hauts salaires.' }
  ],

  companies: [
    { n:'Boulangerie Au Levain d’Antan', sec:'Artisanat', o:[['Apprenti boulanger',12.3,1],['Boulanger confirmé',13.6,2]] },
    { n:'Carrefour City', sec:'Distribution', o:[['Caissier',11.9,1],['Manager de rayon',16.4,3]] },
    { n:'Chronopost', sec:'Logistique', o:[['Livreur',12.2,1],['Agent de tri',12.0,1]] },
    { n:'Le Bistrot des Halles', sec:'Restauration', o:[['Serveur',12.1,1],['Cuisinier',14.8,2]] },
    { n:'La Poste', sec:'Service public', o:[['Facteur',12.1,1]] },
    { n:'Hôpital Saint-Louis', sec:'Santé', o:[['Agent d’entretien',12.4,1],['Aide-soignant',14.2,2]] },
    { n:'TechNova', sec:'Tech', o:[['Développeur Web',24.5,3],['Lead Développeur',34.0,4]] },
    { n:'Banque Populaire', sec:'Banque', o:[['Conseiller clientèle',18.6,3],['Analyste financier',31.0,4]] },
    { n:'Agence Immo de France', sec:'Immobilier', o:[['Agent immobilier',21.0,3]] },
    { n:'Cabinet Delacroix & Associés', sec:'Conseil', o:[['Consultant junior',26.0,3],['Manager',39.0,4]] },
    { n:'Groupe Renault', sec:'Industrie', o:[['Opérateur de production',13.8,2],['Ingénieur produit',32.0,4]] },
    { n:'Société Générale — Salle des marchés', sec:'Finance', o:[['Trader',55.0,5],['Risk Manager',44.0,5]] }
  ],

  foods: [
    { id:'eau', n:'Bouteille d’eau 1 L', p:0.85, f:0, s:18, ico:'💧' },
    { id:'cafe', n:'Café au comptoir', p:2.10, f:4, s:8, ico:'☕' },
    { id:'baguette', n:'Baguette tradition', p:1.20, f:12, s:0, ico:'🥖' },
    { id:'croissant', n:'Croissant au beurre', p:1.30, f:10, s:0, ico:'🥐' },
    { id:'jus', n:'Jus d’orange pressé', p:2.80, f:0, s:16, ico:'🧃' },
    { id:'sandwich', n:'Sandwich jambon-beurre', p:4.60, f:22, s:0, ico:'🥪' },
    { id:'kebab', n:'Kebab-frites', p:9.50, f:34, s:-2, ico:'🌯' },
    { id:'marche', n:'Panier du marché', p:14.00, f:42, s:6, ico:'🥕' },
    { id:'traiteur', n:'Plateau traiteur', p:26.00, f:60, s:10, ico:'🍽️' }
  ],

  cars: [
    { n:'Dacia Sandero', p:12900, b:.02 }, { n:'Renault Clio V', p:19990, b:.04 },
    { n:'Peugeot 208', p:21400, b:.04 }, { n:'Citroën C3', p:20300, b:.04 },
    { n:'Renault Mégane E-Tech', p:39900, b:.06 }, { n:'Tesla Model 3', p:42990, b:.08 }
  ],

  homes: [
    { n:'Studio — Saint-Étienne', p:68000, c:40 }, { n:'Appartement T2 — Lyon 7e', p:165000, c:90 },
    { n:'Appartement T3 — Nantes', p:229000, c:110 }, { n:'Maison avec jardin — Bordeaux', p:315000, c:130 },
    { n:'Loft — Paris 11e', p:520000, c:200 }, { n:'Villa piscine — Aix-en-Provence', p:890000, c:350 }
  ],

  rentals: [ { n:'Chambre chez l’habitant', loyer:380 }, { n:'Studio meublé', loyer:560 }, { n:'T2 en centre-ville', loyer:790 } ],

  insurers: [
    { id:'mma', n:'MMA', m:24, cov:.70, d:'Couvre 70 % des frais de santé et sinistres.' },
    { id:'mnt', n:'MNT', m:18, cov:.60, d:'Mutuelle territoriale, couverture 60 %.' },
    { id:'maif', n:'MAIF', m:22, cov:.75, d:'Assureur militant, couverture 75 %.' },
    { id:'axa', n:'AXA', m:29, cov:.85, d:'Formule premium, couverture 85 %.' },
    { id:'groupama', n:'Groupama', m:26, cov:.80, d:'Assurance banque & mutualiste, 80 %.' }
  ],

  banks: [
    { id:'ce', n:'Caisse d’Épargne', lv:3.0 }, { id:'bp', n:'Banque Populaire', lv:2.9 },
    { id:'ca', n:'Crédit Agricole', lv:3.1 }, { id:'bnp', n:'BNP Paribas', lv:2.7 },
    { id:'sg', n:'Société Générale', lv:2.6 }, { id:'lbp', n:'La Banque Postale', lv:2.8 },
    { id:'gb', n:'Groupama Banque', lv:2.5 }
  ],

  loans: [ { id:'immo', n:'Prêt immobilier', rate:3.8 }, { id:'auto', n:'Prêt auto', rate:4.9 }, { id:'conso', n:'Prêt consommation', rate:6.9 } ],

  /* entreprises : trafic relevé en v4 pour des gains plus confortables */
  bizTypes: {
    boulangerie: {
      label:'Boulangerie', cost:25000, req:null, traffic:4.0, maxEmp:4,
      mats: { farine:{n:'Farine T65 (kg)',p:0.32}, beurre:{n:'Beurre AOP (kg)',p:0.65}, sucre:{n:'Sucre (kg)',p:0.42}, levure:{n:'Levure (dose)',p:0.15}, choco:{n:'Chocolat (kg)',p:1.05} },
      prods: [
        { id:'baguette', n:'Baguette tradition', in:{farine:1,levure:1}, ref:1.20, w:5 },
        { id:'croissant', n:'Croissant', in:{farine:1,beurre:1}, ref:1.30, w:4 },
        { id:'parchoc', n:'Pain au chocolat', in:{farine:1,choco:1}, ref:1.40, w:4 },
        { id:'tarte', n:'Tarte aux pommes', in:{farine:2,sucre:1,beurre:1}, ref:9.90, w:1 }
      ]
    },
    magasin: {
      label:'Magasin général', cost:18000, req:null, traffic:3.4, maxEmp:4,
      prods: [
        { id:'epicerie', n:'Épicerie', cost:2.6, ref:5.9, w:5 }, { id:'boissons', n:'Boissons', cost:1.4, ref:3.4, w:4 },
        { id:'hygiene', n:'Hygiène', cost:2.2, ref:5.2, w:2 }, { id:'snacks', n:'Snacks', cost:0.9, ref:2.3, w:5 }
      ]
    },
    immobilier: { label:'Agence immobilière', cost:40000, req:'carteT', maxEmp:3 },
    banque: { label:'Banque privée', cost:100000, req:'amf', maxEmp:4 }
  },

  ups: {
    boulangerie: [
      { id:'four', n:'Four à sole pierre', d:'+1 fournée auto / seconde par niveau', cost:3500, max:3, grow:1.8 },
      { id:'mkt', n:'Publicité locale', d:'+15 % de clients par niveau', cost:2500, max:4, grow:1.7 },
      { id:'decor', n:'Terrasse & déco', d:'Réputation gagnée +40 % par niveau', cost:1800, max:3, grow:1.6 }
    ],
    magasin: [
      { id:'mkt', n:'Catalogue promo', d:'+15 % de clients par niveau', cost:2200, max:4, grow:1.7 },
      { id:'caisses', n:'Caisses automatiques', d:'+10 % de clients par niveau', cost:3000, max:3, grow:1.8 },
      { id:'rayons', n:'Rayons optimisés', d:'Réputation gagnée +40 % par niveau', cost:1600, max:3, grow:1.6 }
    ],
    immobilier: [
      { id:'reseau', n:'Réseau d’apporteurs', d:'+25 % de commissions par niveau', cost:5000, max:4, grow:1.8 },
      { id:'vitrine', n:'Vitrine premium', d:'1 mandat gratuit / minute par niveau', cost:8000, max:2, grow:2.0 }
    ],
    banque: [
      { id:'app', n:'Application mobile', d:'Ouverture de comptes accélérée', cost:9000, max:4, grow:1.8 },
      { id:'secu', n:'Anti-fraude', d:'−25 % de défauts de prêt par niveau', cost:6000, max:3, grow:1.7 },
      { id:'trader', n:'Salle des marchés', d:'+0,5 pt de rendement des crédits', cost:15000, max:2, grow:2.0 }
    ]
  },

  /* ══ actions marketing par type d'entreprise (nouveau onglet) ══ */
  mkt: {
    boulangerie: [
      { id:'flyers', n:'Distribution de tracts', cost:200, d:'Clients ×1,25 pendant 120 s', kind:'boost', mul:1.25, dur:120 },
      { id:'sociaux', n:'Campagne réseaux sociaux', cost:600, d:'Clients ×1,35 pendant 120 s et +5 réputation', kind:'boost', mul:1.35, dur:120, rep:5 },
      { id:'flash', n:'Vente flash du matin', cost:350, d:'Prix −10 % mais clients ×1,8 pendant 90 s', kind:'promo', dur:90 },
      { id:'fidelite', n:'Carte de fidélité', cost:1500, d:'Permanent : +8 % de clients', kind:'perk', perk:'fidelite', once:true },
      { id:'enseigne', n:'Enseigne lumineuse', cost:900, d:'Permanent : +5 réputation, réputation plus rapide', kind:'perk', perk:'enseigne', once:true, rep:5 }
    ],
    magasin: [
      { id:'flyers', n:'Prospectus dans les boîtes', cost:200, d:'Clients ×1,25 pendant 120 s', kind:'boost', mul:1.25, dur:120 },
      { id:'sociaux', n:'Campagne réseaux sociaux', cost:600, d:'Clients ×1,35 pendant 120 s et +5 réputation', kind:'boost', mul:1.35, dur:120, rep:5 },
      { id:'flash', n:'Promo flash', cost:350, d:'Prix −10 % mais clients ×1,8 pendant 90 s', kind:'promo', dur:90 },
      { id:'fidelite', n:'Carte de fidélité', cost:1500, d:'Permanent : +8 % de clients', kind:'perk', perk:'fidelite', once:true },
      { id:'auto', n:'Réassort automatique', cost:2000, d:'Permanent : rachète seul les stocks bas (prix grossiste)', kind:'perk', perk:'autoRestock', once:true },
      { id:'vitrine', n:'Vitrine animée', cost:900, d:'Permanent : +5 réputation', kind:'perk', perk:'enseigne', once:true, rep:5 }
    ],
    immobilier: [
      { id:'portes', n:'Journée portes ouvertes', cost:400, d:'Commissions ×1,8 pendant 90 s', kind:'boost', mul:1.8, dur:90 },
      { id:'annonces', n:'Annonces premium', cost:800, d:'Commissions ×1,4 pendant 150 s', kind:'boost', mul:1.4, dur:150 },
      { id:'site', n:'Site vitrine en ligne', cost:1200, d:'Permanent : +10 % de commissions', kind:'perk', perk:'fidelite', once:true }
    ],
    banque: [
      { id:'welcome', n:'Offre de bienvenue', cost:2000, d:'+25 comptes clients immédiatement', kind:'accounts' },
      { id:'spot', n:'Spot publicitaire TV', cost:3000, d:'Permanent : recrutement de comptes accéléré', kind:'perk', perk:'pub', once:true },
      { id:'push', n:'Notifications push', cost:1200, d:'Permanent : +10 % de produit net bancaire', kind:'perk', perk:'fidelite', once:true }
    ]
  },

  /* météo : influence l'économie toutes les 3 minutes */
  weather: [
    { id:'soleil', n:'Ensoleillé', ico:'☀️', mul:{ boulangerie:1.15, magasin:1.0, immobilier:1.1, banque:1.0 } },
    { id:'pluie', n:'Pluie', ico:'🌧️', mul:{ boulangerie:0.9, magasin:1.15, immobilier:0.9, banque:1.0 } },
    { id:'canicule', n:'Canicule', ico:'🌡️', mul:{ boulangerie:0.95, magasin:1.2, immobilier:0.95, banque:1.0 } },
    { id:'neige', n:'Neige', ico:'❄️', mul:{ boulangerie:0.9, magasin:1.1, immobilier:0.85, banque:1.05 } }
  ],

  lotto: { cost:5, chance:0.06, min:200, max:5000, cd:30 },

  illEntry: 5000,
  ill: [
    { id:'contre', n:'Vente de contrefaçons', d:'Écouler montres et sacs falsifiés.', gain:[350,800], heat:12, cd:40, risk:.22, cost:300 },
    { id:'trafic', n:'Trafic de marchandises', d:'Convoyer des cartons sans poser de questions.', gain:[700,1500], heat:20, cd:75, risk:.30, cost:600 },
    { id:'cyber', n:'Arnaque au phishing', d:'Faux e-mails bancaires, vraies cartes.', gain:[900,2200], heat:26, cd:90, risk:.34, cost:800 },
    { id:'blanch', n:'Blanchiment via votre banque', d:'Nécessite de posséder une banque.', gain:[2000,5000], heat:34, cd:180, risk:.38, cost:2500, reqBiz:'banque' },
    { id:'braquage', n:'Braquage d’une bijouterie', d:'Le grand soir. Ou le grand saut.', gain:[9000,24000], heat:55, cd:360, risk:.50, cost:3000 }
  ],

  packs: [
    { id:'p1', price:'4,99 €', amount:5000, n:'Pécule' },
    { id:'p2', price:'9,99 €', amount:12000, n:'Capital' },
    { id:'p3', price:'24,99 €', amount:35000, n:'Fortune', best:true },
    { id:'p4', price:'49,99 €', amount:80000, n:'Dynastie' }
  ],

  missions: [
    { id:'m_work', n:'Travailler 5 minutes', tgt:300, type:'work', rew:150 },
    { id:'m_eat', n:'Manger ou boire 3 fois', tgt:3, type:'eat', rew:60 },
    { id:'m_shop', n:'Acheter 4 articles aux courses', tgt:4, type:'shop', rew:80 },
    { id:'m_sell', n:'Vendre 25 articles en entreprise', tgt:25, type:'sell', rew:200 },
    { id:'m_train', n:'Terminer une formation', tgt:1, type:'train', rew:250 },
    { id:'m_cash', n:'Atteindre 5 000 € de solde', tgt:5000, type:'cash', rew:300 }
  ],

  ach: [
    { id:'a_job', i:'💼', n:'Premier emploi', d:'Signer un contrat de travail', xp:30 },
    { id:'a_dip', i:'🎓', n:'Diplômé', d:'Obtenir un premier diplôme', xp:30 },
    { id:'a_biz', i:'🏪', n:'Entrepreneur', d:'Fonder une entreprise', xp:60 },
    { id:'a_10k', i:'💰', n:'Cinq chiffres', d:'Solde supérieur à 10 000 €', xp:50 },
    { id:'a_100k', i:'🏦', n:'Six chiffres', d:'Solde supérieur à 100 000 €', xp:100 },
    { id:'a_home', i:'🏠', n:'Chez soi', d:'Acheter un bien immobilier', xp:60 },
    { id:'a_sell100', i:'🛒', n:'Commerçant aimé', d:'100 articles vendus', xp:60 },
    { id:'a_bank', i:'🏛️', n:'Banquier', d:'Fonder votre banque', xp:120 },
    { id:'a_lvl5', i:'⭐', n:'Citoyen qui monte', d:'Atteindre le niveau 5', xp:80 },
    { id:'a_jail', i:'🚔', n:'Derrière les barreaux', d:'Survivre à une garde à vue', xp:40 },
    { id:'a_miss5', i:'🎯', n:'Chasseur de défis', d:'Réclamer 5 défis', xp:50 },
    { id:'a_noir', i:'🕶️', n:'L’ombre', d:'Entrer au marché noir', xp:40 },
    { id:'a_lotto', i:'🍀', n:'Veinard', d:'Gagner à la loto citoyenne', xp:50 },
    { id:'a_order', i:'📦', n:'Traiteur réputé', d:'Honorer 5 commandes spéciales', xp:70 }
  ],

  news: [
    'La Banque centrale maintient ses taux directeurs', 'Le prix du beurre repart à la hausse',
    'Forte demande de logements en province', 'Le CAC 40 hésite à l’ouverture',
    'Record de ventes de baguettes ce trimestre', 'L’immobilier ancien retrouve des couleurs',
    'Pénurie de développeurs : les salaires grimpent', 'Les Français épargnent davantage, selon l’INSEE'
  ]
};
