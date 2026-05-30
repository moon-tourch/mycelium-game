// mutation card deck — 60 cards, 6 categories
// cards can be held as terrain keys or discarded regardless of stage

const MUTATION_CARDS = [
  // substrate cards
  { id: 's01', name: 'Wood Specialist',       category: 'Substrate', power: 1, stage: 1,
    effect: '+3 Biomass when expanding into Forest regions. Boreal and Temperate count.' },
  { id: 's02', name: 'Soil Decomposer',       category: 'Substrate', power: 1, stage: 1,
    effect: '+2 Biomass per Grassland hex you control at end of each round.' },
  { id: 's03', name: 'Keratin Digester',      category: 'Substrate', power: 2, stage: 2,
    effect: 'Expand into Urban hexes for 1 Biomass instead of 2.' },
  { id: 's04', name: 'Dung Substrate',        category: 'Substrate', power: 1, stage: 1,
    effect: '+2 Biomass from Grassland. Prerequisite for Fecal-Oral Transmission.' },
  { id: 's05', name: 'Synthetic Materials',   category: 'Substrate', power: 2, stage: 2,
    effect: 'Colonize Urban hexes without triggering substrate stress.' },
  { id: 's06', name: 'Dead Wood Mastery',     category: 'Substrate', power: 2, stage: 2,
    effect: '+4 Biomass when you control 3+ Boreal Forest hexes.' },
  { id: 's07', name: 'Leaf Litter Network',   category: 'Substrate', power: 1, stage: 2,
    effect: '+1 Biomass per Forest hex controlled, applied each Growth phase.' },
  { id: 's08', name: 'Soil Persistence',      category: 'Substrate', power: 2, stage: 3,
    effect: 'Spores survive in soil. +1 MP per round passively.' },
  { id: 's09', name: 'Marine Substrate',      category: 'Substrate', power: 1, stage: 2,
    effect: '+2 Biomass from Coastal/Wetland hexes. Expand into Coastal for 1 Biomass.' },
  { id: 's10', name: 'Alpine Rock Colonizer', category: 'Substrate', power: 2, stage: 3,
    effect: 'Expand into Alpine hexes without triggering climate stress.' },

  // climate cards
  { id: 'c01', name: 'Thermotolerance',       category: 'Climate', power: 1, stage: 1,
    effect: 'Ignore heat wave events. Prerequisite for Mammalian Tolerance.' },
  { id: 'c02', name: 'Cold Adaptation',       category: 'Climate', power: 1, stage: 1,
    effect: 'Expand into Alpine and Boreal hexes without climate stress.' },
  { id: 'c03', name: 'Drought Resistance',    category: 'Climate', power: 2, stage: 2,
    effect: 'Immune to drought events. +1 Biomass in Desert hexes per round.' },
  { id: 'c04', name: 'Humidity Dependence',   category: 'Climate', power: 1, stage: 1,
    effect: '+3 Biomass when wet season or rain Environmental Card is drawn.' },
  { id: 'c05', name: 'Climate Flexibility',   category: 'Climate', power: 3, stage: 4,
    effect: 'Expand across any climate zone. Never trigger climate stress.' },
  { id: 'c06', name: 'Temperature Neutrality',category: 'Climate', power: 2, stage: 3,
    effect: 'Your species ignores temperature range limits entirely.' },
  { id: 'c07', name: 'Cryophilia',            category: 'Climate', power: 2, stage: 2,
    effect: '+2 Biomass in Alpine hexes. Immune to cold event card damage.' },
  { id: 'c08', name: 'Xerotolerance',         category: 'Climate', power: 2, stage: 2,
    effect: 'Survive extreme desiccation. +2 Biomass in Desert regions.' },
  { id: 'c09', name: 'Heat Shock Proteins',   category: 'Climate', power: 2, stage: 3,
    effect: '50% chance to ignore any heat-based environmental threat.' },
  { id: 'c10', name: 'Monsoon Adaptation',    category: 'Climate', power: 1, stage: 2,
    effect: '+2 Spores generated whenever a rainfall event card is drawn.' },

  // dispersal cards
  { id: 'd01', name: 'Airborne — Short',      category: 'Dispersal', power: 1, stage: 1,
    effect: 'Disperse Spores action: reach adjacent hexes for 1 Spore instead of 2.' },
  { id: 'd02', name: 'Airborne — Long',       category: 'Dispersal', power: 2, stage: 2,
    effect: 'Disperse to any hex within 3 steps for 3 Spores.' },
  { id: 'd03', name: 'Animal Vector',         category: 'Dispersal', power: 2, stage: 2,
    effect: 'Attach to passing animals. Move spores to an adjacent hex for free.' },
  { id: 'd04', name: 'Water-Borne',           category: 'Dispersal', power: 1, stage: 1,
    effect: '+2 dispersal range when using Coastal or Wetland routes.' },
  { id: 'd05', name: 'Wind Carried',          category: 'Dispersal', power: 2, stage: 2,
    effect: 'Gain a free Disperse Spores action whenever a Storm card is drawn.' },
  { id: 'd06', name: 'Explosive Launch',      category: 'Dispersal', power: 3, stage: 4,
    effect: 'Ballistic spore dispersal. Expansion survival roll always succeeds.' },
  { id: 'd07', name: 'Insect Carrier',        category: 'Dispersal', power: 2, stage: 3,
    effect: 'Use insects as vectors. Bypass quarantine Reckoning Cards.' },
  { id: 'd08', name: 'Human-Assisted',        category: 'Dispersal', power: 2, stage: 3,
    effect: 'Spores travel with human movement. +3 dispersal range in Urban hexes.' },
  { id: 'd09', name: 'Rain Splash',           category: 'Dispersal', power: 1, stage: 1,
    effect: 'Dispersal triggered by rain events. +2 Spores from wet weather cards.' },
  { id: 'd10', name: 'Migratory Vector',      category: 'Dispersal', power: 3, stage: 4,
    effect: 'Follow bird migration routes. Disperse to any Forest hex once per round.' },

  // vector cards
  { id: 'v01', name: 'Lung Invasion',         category: 'Vector', power: 1, stage: 1,
    effect: 'Respiratory infection pathway. First step toward human infection.' },
  { id: 'v02', name: 'Skin Penetration',      category: 'Vector', power: 1, stage: 1,
    effect: 'Dermal infection. No resistance check for immunocompromised hosts.' },
  { id: 'v03', name: 'Wound Entry',           category: 'Vector', power: 2, stage: 2,
    effect: 'Infect through open wounds. Bypass normal host defenses.' },
  { id: 'v04', name: 'Ingestion',             category: 'Vector', power: 2, stage: 2,
    effect: 'Oral infection pathway. Synergizes with toxin production mutations.' },
  { id: 'v05', name: 'Mammalian Tolerance',   category: 'Vector', power: 2, stage: 3,
    effect: 'Survive at 37°C. Required for Behavioral Control and Systemic Infection.' },
  { id: 'v06', name: 'Neural Interface',      category: 'Vector', power: 3, stage: 4,
    effect: 'Map mammalian nervous system. Required for Human Behavioral Control.' },
  { id: 'v07', name: 'Fecal-Oral Transmission',category:'Vector', power: 2, stage: 3,
    effect: 'Social transmission via contaminated material. Requires Dung Substrate.' },
  { id: 'v08', name: 'Blood-Borne',           category: 'Vector', power: 3, stage: 4,
    effect: 'Systemic infection through bloodstream. +3 Population Collapse progress.' },
  { id: 'v09', name: 'Immune Evasion',        category: 'Vector', power: 3, stage: 4,
    effect: '50% chance to avoid Medical Pressure Reckoning Cards each round.' },
  { id: 'v10', name: 'Spore Inhalation Boost',category: 'Vector', power: 2, stage: 3,
    effect: 'Respiratory infection deals +2 Population Collapse per Urban hex.' },

  // defense cards
  { id: 'df01', name: 'Antifungal Resistance',category: 'Defense', power: 2, stage: 2,
    effect: 'Immune to 1 Medical Pressure card per round. Negate its effect.' },
  { id: 'df02', name: 'UV Tolerance',         category: 'Defense', power: 1, stage: 1,
    effect: 'Immune to UV radiation events. Expand freely into exposed hexes.' },
  { id: 'df03', name: 'Spore Dormancy',       category: 'Defense', power: 2, stage: 2,
    effect: 'Spores survive years dormant. Immune to quarantine Reckoning Cards.' },
  { id: 'df04', name: 'Chemical Resistance',  category: 'Defense', power: 2, stage: 2,
    effect: '50% chance to ignore any chemical treatment environmental event.' },
  { id: 'df05', name: 'Thick Cell Wall',      category: 'Defense', power: 1, stage: 1,
    effect: 'Reduce all Environmental Pressure damage to your territories by 1.' },
  { id: 'df06', name: 'Melanin Shield',       category: 'Defense', power: 2, stage: 2,
    effect: 'Radiation resistance. Expand into Urban hexes without substrate stress.' },
  { id: 'df07', name: 'Biofilm Formation',    category: 'Defense', power: 3, stage: 4,
    effect: 'Fortified territories require 2 attacks to dislodge instead of 1.' },
  { id: 'df08', name: 'pH Tolerance',         category: 'Defense', power: 1, stage: 1,
    effect: 'Function in acid and alkaline environments. No terrain restrictions.' },
  { id: 'df09', name: 'Desiccation Survival', category: 'Defense', power: 2, stage: 3,
    effect: 'Survive drought and heat events without losing mutations or territory.' },
  { id: 'df10', name: 'Mycoprotection',       category: 'Defense', power: 3, stage: 4,
    effect: 'Share your defensive mutations with all adjacent controlled territories.' },

  // special cards
  { id: 'sp01', name: 'Behavioral Manipulation',category: 'Special', power: 3, stage: 4,
    effect: 'Infected hosts move toward your mycelium, spreading your spores.' },
  { id: 'sp02', name: 'Mycoparasitism',       category: 'Special', power: 3, stage: 4,
    effect: 'Attack rival mycelium directly. 50% chance to remove one enemy hex.' },
  { id: 'sp03', name: 'Bioluminescence',      category: 'Special', power: 1, stage: 1,
    effect: 'Attract insects at night. +1 Spore generated per round passively.' },
  { id: 'sp04', name: 'Rapid Growth',         category: 'Special', power: 2, stage: 2,
    effect: 'Expand once for free each round if you control 3 or more Forest hexes.' },
  { id: 'sp05', name: 'Network Communication',category: 'Special', power: 2, stage: 2,
    effect: 'Connected territories share resources. +1 Biomass per linked hex pair.' },
  { id: 'sp06', name: 'Mycotoxin Production', category: 'Special', power: 2, stage: 3,
    effect: 'Passively deal 1 Population Collapse damage per Urban hex per round.' },
  { id: 'sp07', name: 'Enzymatic Digestion',  category: 'Special', power: 2, stage: 2,
    effect: 'Break down synthetic materials. Expand into Urban for 1 Biomass.' },
  { id: 'sp08', name: 'Nematode Predation',   category: 'Special', power: 1, stage: 2,
    effect: 'Hunt soil organisms for energy. +2 Biomass per Grassland hex controlled.' },
  { id: 'sp09', name: 'Psilocybin Production',category: 'Special', power: 3, stage: 4,
    effect: 'Humans become willing cultivators. Skip resistance checks in Control path.' },
  { id: 'sp10', name: 'Hyphal Weaponization', category: 'Special', power: 2, stage: 3,
    effect: 'Hyphae immobilize prey. Prerequisite for boosted Mycoparasitism attacks.' },
];

const CATEGORY_COLORS = {
  Substrate: '#2E5C8A',
  Climate:   '#A06B1F',
  Dispersal: '#2E6B6B',
  Vector:    '#3A6B3A',
  Defense:   '#8B2E2E',
  Special:   '#5B3A6F',
};

function shuffleDeck(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MUTATION_CARDS, CATEGORY_COLORS, shuffleDeck };
}
