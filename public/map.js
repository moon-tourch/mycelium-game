// Hex grid — 19 hexes, radius-2 flat-top layout
// Terrain requirements use card categories (null = always open)

const HEX_SIZE = 42;
const SVG_W    = 400;
const SVG_H    = 430;
const MAP_CX   = 200;
const MAP_CY   = 215;

// Sub-hex positions relative to large hex center
// Triangle arrangement (like Catan roads from a vertex)
const SUB_HEX_OFFSETS = [
  { dx:  0, dy: -14 },   // slot 0 — top (auto-claimed on expansion)
  { dx: -12, dy:  7 },   // slot 1 — bottom-left
  { dx:  12, dy:  7 },   // slot 2 — bottom-right
];
const SUB_HEX_SIZE = 9; // radius of each sub-hex

const TERRAIN = {
  alpine:    { label: 'Alpine',            color: '#6b7a8d', textColor: '#eee',
               temp: 'Freezing', moisture: 'Low', dispersal: 'Wind — High',
               requirement: ['Climate'],
               reqLabel: 'Needs Climate card' },
  boreal:    { label: 'Boreal Forest',     color: '#1b4332', textColor: '#d4edda',
               temp: 'Cold', moisture: 'Moderate', dispersal: 'Animal — Medium',
               requirement: ['Climate', 'Substrate'],
               reqLabel: 'Needs Climate or Substrate card' },
  tropical:  { label: 'Tropical Forest',   color: '#40916c', textColor: '#d4edda',
               temp: 'Hot', moisture: 'Very High', dispersal: 'Animal — High',
               requirement: ['Dispersal', 'Substrate'],
               reqLabel: 'Needs Dispersal or Substrate card' },
  temperate: { label: 'Temperate Forest',  color: '#2d6a4f', textColor: '#d4edda',
               temp: 'Mild', moisture: 'High', dispersal: 'Wind — Medium',
               requirement: null,
               reqLabel: 'Open terrain — no card required' },
  grassland: { label: 'Grassland',         color: '#7fb069', textColor: '#1a1a1a',
               temp: 'Mild', moisture: 'Moderate', dispersal: 'Wind — High',
               requirement: null,
               reqLabel: 'Open terrain — no card required' },
  desert:    { label: 'Desert / Arid',     color: '#c9a84c', textColor: '#1a1a1a',
               temp: 'Scorching', moisture: 'Very Low', dispersal: 'Wind — Extreme',
               requirement: ['Climate'],
               reqLabel: 'Needs Climate card' },
  urban:     { label: 'Urban',             color: '#4a5568', textColor: '#f0f0f0',
               temp: 'Warm', moisture: 'Low', dispersal: 'Human — High',
               requirement: ['Substrate', 'Special'],
               reqLabel: 'Needs Substrate or Special card' },
  coastal:   { label: 'Coastal / Wetland', color: '#2d6a8a', textColor: '#f0f0f0',
               temp: 'Mild', moisture: 'Very High', dispersal: 'Water — High',
               requirement: ['Dispersal'],
               reqLabel: 'Needs Dispersal card' },
};

// Which species get a home terrain bonus here
const TERRAIN_BONUS = {
  alpine:    [],
  boreal:    ['armillaria-ostoyae'],
  tropical:  ['cordyceps-ophioglossoides'],
  temperate: ['pleurotus-ostreatus', 'amanita-phalloides'],
  grassland: ['psilocybe-cubensis'],
  desert:    ['coccidioides-immitis'],
  urban:     ['stachybotrys-chartarum', 'penicillium-expansum'],
  coastal:   ['cryptococcus-gattii'],
};

const MAP_HEXES = [
  { q:-2, r:0,  id:'northern-peaks',   terrain:'alpine',    name:'Northern Peaks'    },
  { q:-2, r:1,  id:'boreal-heartland', terrain:'boreal',    name:'Boreal Heartland'  },
  { q:-2, r:2,  id:'rainforest-basin', terrain:'tropical',  name:'Rainforest Basin'  },
  { q:-1, r:-1, id:'oak-woodland',     terrain:'temperate', name:'Oak Woodland'      },
  { q:-1, r:0,  id:'pine-reaches',     terrain:'boreal',    name:'Pine Reaches'      },
  { q:-1, r:1,  id:'ancient-grove',    terrain:'temperate', name:'Ancient Grove'     },
  { q:-1, r:2,  id:'coastal-delta',    terrain:'coastal',   name:'Coastal Delta'     },
  { q:0,  r:-2, id:'dust-flats',       terrain:'desert',    name:'Dust Flats'        },
  { q:0,  r:-1, id:'open-prairie',     terrain:'grassland', name:'Open Prairie'      },
  { q:0,  r:0,  id:'great-forest',     terrain:'temperate', name:'Great Forest'      },
  { q:0,  r:1,  id:'southern-plains',  terrain:'grassland', name:'Southern Plains'   },
  { q:0,  r:2,  id:'tidal-marshes',    terrain:'coastal',   name:'Tidal Marshes'     },
  { q:1,  r:-2, id:'badlands',         terrain:'desert',    name:'Badlands'          },
  { q:1,  r:-1, id:'dry-steppe',       terrain:'grassland', name:'Dry Steppe'        },
  { q:1,  r:0,  id:'fertile-valley',   terrain:'grassland', name:'Fertile Valley'    },
  { q:1,  r:1,  id:'industrial-zone',  terrain:'urban',     name:'Industrial Zone'   },
  { q:2,  r:-2, id:'high-ridge',       terrain:'alpine',    name:'High Ridge'        },
  { q:2,  r:-1, id:'city-sprawl',      terrain:'urban',     name:'City Sprawl'       },
  { q:2,  r:0,  id:'arid-wastes',      terrain:'desert',    name:'Arid Wastes'       },
];

function axialToPixel(q, r) {
  return {
    x: MAP_CX + HEX_SIZE * 1.5 * q,
    y: MAP_CY + HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r),
  };
}

// SVG points for a flat-top hex centered at (cx, cy) with given size
function hexPointsStr(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function isAdjacent(q1, r1, q2, r2) {
  const dq = q2 - q1, dr = r2 - r1;
  return [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].some(([a,b]) => a === dq && b === dr);
}

function hasAdjacentOwned(q, r, ownedHexIds) {
  return MAP_HEXES.some(h => ownedHexIds.includes(h.id) && isAdjacent(q, r, h.q, h.r));
}

// Check if player's hand satisfies terrain expansion requirement
function meetsTerrainRequirement(terrain, hand) {
  const req = TERRAIN[terrain]?.requirement;
  if (!req) return true;                       // open terrain
  return hand.some(c => req.includes(c.category));
}
