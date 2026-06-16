-- =============================================
-- SCRIPT SQL POUR SUPABASE — BatiShop Cameroun
-- Colle ce code dans Supabase > SQL Editor
-- =============================================

-- Table produits
CREATE TABLE IF NOT EXISTS produits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  prix INTEGER NOT NULL,         -- En FCFA (entier)
  prix_ancien INTEGER,
  categorie TEXT NOT NULL,
  sous_categorie TEXT,
  reference TEXT NOT NULL UNIQUE,
  stock INTEGER DEFAULT 0,
  unite TEXT DEFAULT 'pièce',
  image_url TEXT,
  badge TEXT CHECK (badge IN ('nouveau', 'promo', 'solaire')),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table commandes
CREATE TABLE IF NOT EXISTS commandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  client_nom TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  client_ville TEXT NOT NULL,
  client_adresse TEXT NOT NULL,
  notes TEXT,
  articles JSONB NOT NULL,       -- Liste des produits commandés
  total INTEGER NOT NULL,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'en_livraison', 'livree', 'annulee')),
  paiement_methode TEXT,
  paiement_statut TEXT DEFAULT 'en_attente' CHECK (paiement_statut IN ('en_attente', 'paye', 'echec')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);
CREATE INDEX IF NOT EXISTS idx_produits_actif ON produits(actif);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_telephone ON commandes(client_telephone);

-- Permissions (lecture publique pour les produits, écriture pour les commandes)
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produits visibles par tous" ON produits FOR SELECT USING (actif = true);
CREATE POLICY "Commandes créables par tous" ON commandes FOR INSERT WITH CHECK (true);
CREATE POLICY "Commandes lisibles par tous" ON commandes FOR SELECT USING (true);

-- =============================================
-- DONNÉES DE DÉMO — À supprimer en production
-- =============================================
INSERT INTO produits (nom, prix, prix_ancien, categorie, reference, stock, unite, badge) VALUES
('Ciment Portland CPA 42.5 — sac 50kg',     4500,  5200,  'maconnerie',     'CIM-CPA-50KG',    200, 'sac',    'promo'),
('Parpaing creux 15×20×40cm',               350,   NULL,  'maconnerie',     'MAC-PARP-15',     500, 'pièce',  NULL),
('Fer à béton ø12mm — barre 12m',           9200,  NULL,  'maconnerie',     'MAC-FER-12MM',    300, 'barre',  NULL),
('Tuyau PVC pression 110mm — 6m',           8700,  NULL,  'plomberie',      'PLB-PVC-110',     80,  'barre',  'nouveau'),
('Robinet mélangeur lavabo chromé',          12000, 15000, 'plomberie',      'PLB-ROB-LAV',     45,  'pièce',  'promo'),
('WC à poser blanc standard',               45000, NULL,  'plomberie',      'PLB-WC-POSE',     15,  'pièce',  NULL),
('Câble électrique 2,5mm² — rouleau 100m',  35000, NULL,  'electricite',    'ELC-CAB-25-100',  20,  'rouleau','nouveau'),
('Disjoncteur différentiel 40A 30mA',       15000, 18500, 'electricite',    'ELC-DDR-40A',     35,  'pièce',  'promo'),
('Carrelage grès cérame 60×60 beige',       12500, NULL,  'carrelage',      'CAR-GRS-6060-BG', 200, 'm²',     'nouveau'),
('Panneau solaire 300W monocristallin',      87000, NULL,  'photovoltaique', 'SOL-300W-MONO',   25,  'pièce',  'solaire'),
('Batterie solaire 200Ah 12V GEL',          125000,NULL,  'photovoltaique', 'SOL-BAT-200AH',   12,  'pièce',  'solaire'),
('Onduleur solaire 3000W hybride',          180000,NULL,  'photovoltaique', 'SOL-OND-3000W',   8,   'pièce',  'solaire'),
('Porte en bois massif 90×210cm',           85000, NULL,  'menuiserie',     'MEN-PTE-90210',   20,  'pièce',  NULL),
('Perceuse visseuse 18V sans fil',          45000, 55000, 'outillage',      'OUT-PER-18V',     30,  'pièce',  'promo'),
('Peinture acrylique ext. blanche 25L',     28000, NULL,  'peinture',       'PNT-ACR-BLN-25',  50,  'bidon',  NULL);
