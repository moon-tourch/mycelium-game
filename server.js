const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const { MUTATION_CARDS, shuffleDeck } = require('./public/cards.js');
const { ENV_CARDS, shuffleEnvDeck }   = require('./public/env_cards.js');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

// each species spawns at a specific starting hex
const SPECIES_HOME = {
  'cryptococcus-gattii':       'coastal-delta',
  'coccidioides-immitis':      'dust-flats',
  'stachybotrys-chartarum':    'industrial-zone',
  'penicillium-expansum':      'city-sprawl',
  'cordyceps-ophioglossoides': 'rainforest-basin',
  'pleurotus-ostreatus':       'oak-woodland',
  'psilocybe-cubensis':        'southern-plains',
  'amanita-phalloides':        'ancient-grove',
  'armillaria-ostoyae':        'boreal-heartland',
};

// eco specialists draw from different card pools than generalists
const ECO_CATS = ['Substrate', 'Special', 'Vector'];
const ENV_CATS = ['Climate', 'Dispersal', 'Defense'];
const ECO_SPECIES = [
  'cordyceps-ophioglossoides','pleurotus-ostreatus','psilocybe-cubensis',
  'amanita-phalloides','armillaria-ostoyae',
];

function getStartingResources(speciesId) {
  return ECO_SPECIES.includes(speciesId)
    ? { biomass: 8, spores: 2, mp: 8 }
    : { biomass: 6, spores: 4, mp: 6 };
}

function getDeckForSpecies(speciesId) {
  const cats = ECO_SPECIES.includes(speciesId) ? ECO_CATS : ENV_CATS;
  return shuffleDeck(MUTATION_CARDS.filter(c => cats.includes(c.category)));
}

// terrain requirements mirror map.js but needed here for server-side validation
const TERRAIN_REQS = {
  alpine:    ['Climate'],
  boreal:    ['Climate', 'Substrate'],
  tropical:  ['Dispersal', 'Substrate'],
  temperate: null,
  grassland: null,
  desert:    ['Climate'],
  urban:     ['Substrate', 'Special'],
  coastal:   ['Dispersal'],
};

const HEX_TERRAIN = {
  'northern-peaks':'alpine','boreal-heartland':'boreal','rainforest-basin':'tropical',
  'oak-woodland':'temperate','pine-reaches':'boreal','ancient-grove':'temperate',
  'coastal-delta':'coastal','dust-flats':'desert','open-prairie':'grassland',
  'great-forest':'temperate','southern-plains':'grassland','tidal-marshes':'coastal',
  'badlands':'desert','dry-steppe':'grassland','fertile-valley':'grassland',
  'industrial-zone':'urban','high-ridge':'alpine','city-sprawl':'urban','arid-wastes':'desert',
};

function meetsReq(hexId, hand) {
  const req = TERRAIN_REQS[HEX_TERRAIN[hexId]];
  if (!req) return true;
  return hand.some(c => req.includes(c.category));
}

function applyEnvEffect(room, card) {
  const [p1, p2] = room.players;

  const ownedBy = (pid, terrain) =>
    Object.entries(room.hexOwner)
      .filter(([hid, owner]) => owner === pid && HEX_TERRAIN[hid] === terrain).length;

  const totalOwned = (pid) => Object.values(room.hexOwner).filter(v => v === pid).length;

  const clamp = (pid, key) => {
    room.resources[pid][key] = Math.max(0, Math.min(20, room.resources[pid][key]));
  };

  for (const pid of [p1, p2]) {
    const r = room.resources[pid];
    const hand = room.hands[pid] || [];

    switch (card.effectType) {
      case 'biomass_loss_terrain': {
        const n = ownedBy(pid, card.params.terrain);
        r.biomass -= n * card.params.amount;
        break;
      }
      case 'hurricane': {
        const coastal = ownedBy(pid, 'coastal');
        r.biomass -= coastal * card.params.biomassLoss;
        if (coastal > 0) r.spores += card.params.sporesGain;
        break;
      }
      case 'unlock_terrain_bonus': {
        const urban = ownedBy(pid, 'urban');
        if (urban > 0) r.biomass += card.params.biomassBonus;
        break;
      }
      case 'boreal_freeze': {
        if (hand.some(c => c.category === 'Climate')) {
          r.mp += card.params.mpBonus;
        } else {
          r.biomass -= ownedBy(pid, 'boreal') * card.params.biomassLoss;
        }
        break;
      }
      case 'elnino': {
        r.biomass += ownedBy(pid, 'desert') * 2;
        r.spores  += ownedBy(pid, 'tropical') * 2;
        break;
      }
      case 'coastal_flood': {
        const coastal = ownedBy(pid, 'coastal');
        r.biomass -= coastal * card.params.biomassLoss;
        r.spores  += totalOwned(pid);
        break;
      }
      case 'drought': {
        r.biomass -= ownedBy(pid, 'grassland') * card.params.grasslandLoss;
        r.biomass -= ownedBy(pid, 'coastal')   * card.params.coastalLoss;
        break;
      }
      case 'dust_storm': {
        r.spores += card.params.sporesBase;
        if (hand.some(c => c.category === 'Dispersal')) r.spores += card.params.sporesBonus;
        break;
      }
      case 'monsoon': {
        r.spores += card.params.sporesAll;
        if (ownedBy(pid,'coastal') + ownedBy(pid,'tropical') > 0) r.biomass += card.params.biomassBonus;
        break;
      }
      case 'deforestation': {
        if (hand.some(c => c.category === 'Substrate')) r.biomass += card.params.biomassBonus;
        break;
      }
      case 'volcanic': {
        r.biomass -= ownedBy(pid, 'alpine') * 5;
        r.mp += card.params.mpGain;
        break;
      }
      case 'heatwave': {
        if (hand.some(c => c.category === 'Climate')) r.biomass += card.params.biomassGain;
        else                                           r.biomass -= card.params.biomassLoss;
        break;
      }
      case 'surge':
        r.mp += card.params.mpGain;
        r.biomass += card.params.biomassGain;
        break;
      case 'pollution': {
        r.biomass -= ownedBy(pid, 'urban') * card.params.biomassLoss;
        if (hand.some(c => c.category === 'Defense')) r.biomass += card.params.defenseBonus;
        break;
      }
      case 'rewilding': {
        r.biomass += ownedBy(pid, 'grassland') * card.params.biomassBonus;
        if (hand.some(c => c.category === 'Dispersal')) r.spores += card.params.sporesBonus;
        break;
      }
      case 'media_outbreak': {
        r.mp -= card.params.mpLoss;
        if (hand.some(c => c.category === 'Vector')) r.mp += card.params.vectorBonus;
        break;
      }
      case 'ocean_acid': {
        const coastal = ownedBy(pid, 'coastal');
        r.spores += coastal * card.params.sporesBonus;
        if (coastal > 0) r.mp += card.params.mpBonus;
        break;
      }
      case 'global_frost': {
        r.biomass -= ownedBy(pid, 'tropical')  * card.params.tropicalLoss;
        r.biomass -= ownedBy(pid, 'temperate') * card.params.temperateLoss;
        break;
      }
      case 'network_discovery': {
        r.mp += card.params.mpGain;
        break;
      }
    }

    // network_discovery bonus goes to whoever controls the most hexes
    if (card.effectType === 'network_discovery') {
      const counts = [p1, p2].map(p => totalOwned(p));
      const maxCount = Math.max(...counts);
      if (totalOwned(pid) === maxCount) room.resources[pid].biomass += card.params.bonusBiomass;
    }

    clamp(pid, 'biomass');
    clamp(pid, 'spores');
    clamp(pid, 'mp');
  }
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms[code]);
  return code;
}

function broadcastState(room) {
  const [p1, p2] = room.players;
  for (const me of [p1, p2]) {
    const opp = me === p1 ? p2 : p1;
    io.to(me).emit('state-update', {
      myHand:        room.hands[me] || [],
      oppHandCount:  (room.hands[opp] || []).length,
      deckCount:     (room.decks[me] || []).length,
      driftPool:     room.driftPool,
      hexOwner:      room.hexOwner,
      hexGrowth:     room.hexGrowth,
      resources:     room.resources,
      turn:          room.turn,
      round:         room.round,
      players:       room.players,
      selections:    room.selections,
      drawnThisTurn: !!room.drawnThisTurn[me],
    });
  }
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('create-room', () => {
    const code = generateCode();
    rooms[code] = {
      code, players: [socket.id], selections: {}, state: 'waiting',
      decks: {}, driftPool: [], hands: {}, hexOwner: {}, hexGrowth: {},
      resources: {}, turn: null, round: 1,
      drawnThisTurn: {},
      envDeck: shuffleEnvDeck(ENV_CARDS),
    };
    socket.join(code);
    socket.roomCode = code;
    socket.emit('room-created', { code });
  });

  socket.on('join-room', ({ code }) => {
    const upper = (code || '').toUpperCase().trim();
    const room = rooms[upper];
    if (!room)                    { socket.emit('join-error', { message: 'Room not found.' }); return; }
    if (room.players.length >= 2) { socket.emit('join-error', { message: 'Room is full.' });   return; }
    room.players.push(socket.id);
    socket.join(upper);
    socket.roomCode = upper;
    room.state = 'selecting';
    io.to(upper).emit('start-selection', { code: upper });
  });

  socket.on('select-species', ({ speciesId }) => {
    const room = rooms[socket.roomCode];
    if (!room || room.state !== 'selecting') return;
    room.selections[socket.id] = speciesId;
    socket.to(socket.roomCode).emit('opponent-selected');

    if (Object.keys(room.selections).length === 2) {
      const [p1, p2] = room.players;
      room.state = 'playing';
      room.turn = p1;

      for (const pid of [p1, p2]) {
        room.decks[pid] = getDeckForSpecies(room.selections[pid]);
        room.hands[pid] = room.decks[pid].splice(0, 3);
        room.resources[pid] = getStartingResources(room.selections[pid]);
        const homeHex = SPECIES_HOME[room.selections[pid]] || (pid === p1 ? 'city-sprawl' : 'boreal-heartland');
        room.hexOwner[homeHex] = pid;
        room.hexGrowth[homeHex] = { owner: pid, slots: [true, false, false] };
      }

      io.to(socket.roomCode).emit('game-start', {
        selections: room.selections,
        players: room.players,
      });
      broadcastState(room);
    }
  });

  socket.on('draw-card', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.turn !== socket.id) return;
    if (room.drawnThisTurn[socket.id]) {
      socket.emit('action-error', { message: 'You can only draw one card per turn.' }); return;
    }
    const res  = room.resources[socket.id];
    if (res.mp < 2) { socket.emit('action-error', { message: 'Need 2 MP to draw a card.' }); return; }
    const deck = room.decks[socket.id] || [];
    if (deck.length === 0) { socket.emit('action-error', { message: 'Your deck is empty.' }); return; }

    res.mp -= 2;
    const card = deck.shift();
    room.hands[socket.id].push(card);
    room.drawnThisTurn[socket.id] = true;

    io.to(socket.roomCode).emit('card-drawn', { playerId: socket.id, card });
    broadcastState(room);
  });

  socket.on('discard-card', ({ cardId }) => {
    const room = rooms[socket.roomCode];
    if (!room || room.turn !== socket.id) return;
    const hand = room.hands[socket.id];
    const idx  = hand.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    const [card] = hand.splice(idx, 1);
    room.driftPool.unshift(card);
    if (room.driftPool.length > 15) room.driftPool.length = 15;
    io.to(socket.roomCode).emit('card-discarded', { playerId: socket.id, card });
    broadcastState(room);
  });

  socket.on('scavenge-card', ({ cardId }) => {
    const room = rooms[socket.roomCode];
    if (!room || room.turn !== socket.id) return;
    const res = room.resources[socket.id];
    if (res.mp < 1) { socket.emit('action-error', { message: 'Need 1 MP to scavenge.' }); return; }
    const idx = room.driftPool.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    res.mp -= 1;
    const [card] = room.driftPool.splice(idx, 1);
    room.hands[socket.id].push(card);
    io.to(socket.roomCode).emit('card-scavenged', { playerId: socket.id, card });
    broadcastState(room);
  });

  socket.on('expand-hex', ({ hexId }) => {
    const room = rooms[socket.roomCode];
    if (!room || room.turn !== socket.id) return;
    if (room.hexOwner[hexId]) { socket.emit('action-error', { message: 'Already occupied.' }); return; }

    const res = room.resources[socket.id];
    if (res.biomass < 2) { socket.emit('action-error', { message: 'Need 2 Biomass to expand.' }); return; }

    if (!meetsReq(hexId, room.hands[socket.id])) {
      const terrain = HEX_TERRAIN[hexId];
      const req = TERRAIN_REQS[terrain];
      socket.emit('action-error', { message: `Need a ${req.join(' or ')} card to expand into ${terrain} terrain.` });
      return;
    }

    res.biomass -= 2;
    room.hexOwner[hexId] = socket.id;
    room.hexGrowth[hexId] = { owner: socket.id, slots: [true, false, false] };

    io.to(socket.roomCode).emit('hex-expanded', { playerId: socket.id, hexId });
    broadcastState(room);
  });

  socket.on('grow-subhex', ({ hexId, slotIndex }) => {
    const room = rooms[socket.roomCode];
    if (!room || room.turn !== socket.id) return;
    const growth = room.hexGrowth[hexId];
    if (!growth || growth.owner !== socket.id) {
      socket.emit('action-error', { message: "You don't control this hex." }); return;
    }
    if (growth.slots[slotIndex]) {
      socket.emit('action-error', { message: 'Slot already grown.' }); return;
    }
    if (!growth.slots[0] && slotIndex !== 0) {
      socket.emit('action-error', { message: 'Grow from the first slot outward.' }); return;
    }

    const res = room.resources[socket.id];
    if (res.spores < 1) { socket.emit('action-error', { message: 'Need 1 Spore to grow.' }); return; }

    res.spores -= 1;
    growth.slots[slotIndex] = true;
    broadcastState(room);
  });

  socket.on('end-turn', () => {
    const room = rooms[socket.roomCode];
    if (!room || room.turn !== socket.id) return;

    const [p1, p2] = room.players;
    const next = room.turn === p1 ? p2 : p1;
    room.drawnThisTurn[socket.id] = false;

    // income: +1 MP, +biomass per owned hex, +1 extra per fully grown hex
    for (const pid of [p1, p2]) {
      const owned = Object.values(room.hexOwner).filter(v => v === pid).length;
      const fullGrown = Object.entries(room.hexGrowth)
        .filter(([, g]) => g.owner === pid && g.slots.every(Boolean)).length;
      room.resources[pid].mp      = Math.min(20, room.resources[pid].mp + 1);
      room.resources[pid].biomass = Math.min(20, room.resources[pid].biomass + owned + fullGrown);
      room.resources[pid].spores  = Math.min(20, room.resources[pid].spores);
    }

    // env card drawn at the end of each full round (after p2's turn)
    if (room.turn === p2) {
      room.round += 1;
      if (room.envDeck.length > 0) {
        const envCard = room.envDeck.shift();
        applyEnvEffect(room, envCard);
        io.to(socket.roomCode).emit('environmental-event', envCard);
        if (room.envDeck.length === 0) room.envDeck = shuffleEnvDeck(ENV_CARDS);
      }
    }

    room.turn = next;
    broadcastState(room);
  });

  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (code && rooms[code]) {
      io.to(code).emit('player-left');
      delete rooms[code];
    }
    console.log('Disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`\nMycelium running at http://localhost:${PORT}\n`));
