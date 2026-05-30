const socket = io();
let mySocketId = null;
let mySpecies  = null;
let oppSpecies = null;
let gameState  = null;
let players    = [];

const SVG_NS = 'http://www.w3.org/2000/svg';

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('btn-to-lobby').addEventListener('click', () => show('screen-lobby'));

document.getElementById('btn-create').addEventListener('click', () => socket.emit('create-room'));
document.getElementById('btn-show-join').addEventListener('click', () => {
  const f = document.getElementById('join-form');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
  if (f.style.display === 'block') document.getElementById('join-code-input').focus();
});

function doJoin() {
  const code = document.getElementById('join-code-input').value.trim();
  if (code.length !== 4) { setLobbyErr('Enter the 4-letter room code.'); return; }
  socket.emit('join-room', { code });
}
document.getElementById('btn-join').addEventListener('click', doJoin);
document.getElementById('join-code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') doJoin();
});
function setLobbyErr(msg) { document.getElementById('lobby-error').textContent = msg; }

socket.on('connect', () => { mySocketId = socket.id; });
socket.on('room-created', ({ code }) => {
  document.getElementById('display-code').textContent = code;
  show('screen-waiting');
});
socket.on('join-error', ({ message }) => setLobbyErr(message));

socket.on('start-selection', () => { buildSpeciesGrid(); show('screen-select'); });

function buildSpeciesGrid() {
  const grid = document.getElementById('species-grid');
  grid.innerHTML = '';
  SPECIES.forEach(s => {
    const d = document.createElement('div');
    d.className = 'species-card';
    d.dataset.id = s.id;
    const ecoIds = ['cordyceps-ophioglossoides','pleurotus-ostreatus','psilocybe-cubensis','amanita-phalloides','armillaria-ostoyae'];
    const deckType = ecoIds.includes(s.id) ? 'Eco deck: Substrate · Special · Vector' : 'Env deck: Climate · Dispersal · Defense';
    d.innerHTML = `
      <div class="sc-name">${s.name}</div>
      <span class="sc-cat" style="background:${s.categoryColor}">${s.category}</span>
      <div class="sc-tagline">${s.tagline}</div>
      <div class="sc-victory" style="margin-top:0.35rem;">→ ${s.victoryAffinity}</div>
      <div class="sc-victory" style="color:var(--muted)">${deckType}</div>`;
    d.addEventListener('click', () => pickSpecies(s.id));
    grid.appendChild(d);
  });
}

function pickSpecies(id) {
  if (mySpecies) return;
  mySpecies = SPECIES.find(s => s.id === id);
  document.querySelectorAll('.species-card').forEach(c =>
    c.dataset.id === id ? c.classList.add('selected') : c.classList.add('disabled'));
  document.getElementById('select-status').textContent = `Selected: ${mySpecies.name}. Waiting…`;
  socket.emit('select-species', { speciesId: id });
}
socket.on('opponent-selected', () => {
  document.getElementById('opponent-select-status').textContent = 'Opponent has chosen.';
});

socket.on('game-start', ({ selections, players: sp }) => {
  players = sp;
  const oppId = sp.find(id => id !== mySocketId);
  mySpecies  = SPECIES.find(s => s.id === selections[mySocketId]);
  oppSpecies = SPECIES.find(s => s.id === selections[oppId]);
  renderSpeciesPanels();
  show('screen-game');
});

function renderSpeciesPanels() {
  el('my-species-name').textContent = mySpecies.name;
  styleEl('my-species-cat', mySpecies);
  el('opp-species-name').textContent = oppSpecies.name;
  styleEl('opp-species-cat', oppSpecies);
}
function styleEl(id, sp) {
  const e = el(id);
  e.textContent = sp.category;
  e.style.background = sp.categoryColor;
}
function el(id) { return document.getElementById(id); }

socket.on('state-update', (state) => {
  gameState = state;
  players = state.players;
  renderAll(state);
});

function renderAll(state) {
  updateTurnBanner(state.turn, state.drawnThisTurn);
  updateResources(state.resources);
  updateHexMap(state.hexOwner, state.hexGrowth, state.turn, state.myHand);
  renderHand(state.myHand, state.turn);
  renderDeck(state.deckCount);
  renderDriftPool(state.driftPool, state.turn);
  el('round-label').textContent = `Round ${state.round}`;
  el('opp-hand-count').textContent = state.oppHandCount;
  const oppId = players.find(p => p !== mySocketId);
  const myC   = Object.values(state.hexOwner).filter(v => v === mySocketId).length;
  const oppC  = Object.values(state.hexOwner).filter(v => v === oppId).length;
  el('my-hex-count').textContent  = myC;
  el('opp-hex-count').textContent = oppC;
}

function updateTurnBanner(turn, drawnThisTurn) {
  const isMe = turn === mySocketId;
  const banner = el('turn-banner');
  banner.textContent = isMe ? 'YOUR TURN' : "Opponent's Turn";
  banner.className   = 'turn-banner ' + (isMe ? 'your-turn' : 'their-turn');
  el('btn-end-turn').disabled = !isMe;
  el('btn-draw').disabled = !isMe || drawnThisTurn;
  el('btn-draw').title = (isMe && drawnThisTurn) ? 'Already drew this turn' : '';
}

function updateResources(resources) {
  const mine  = resources[mySocketId] || {};
  const oppId = players.find(p => p !== mySocketId);
  const opp   = resources[oppId] || {};
  el('my-biomass').textContent  = mine.biomass ?? '—';
  el('my-spores').textContent   = mine.spores  ?? '—';
  el('my-mp').textContent       = mine.mp      ?? '—';
  el('opp-biomass').textContent = opp.biomass  ?? '—';
  el('opp-spores').textContent  = opp.spores   ?? '—';
  el('opp-mp').textContent      = opp.mp       ?? '—';
}

function updateHexMap(hexOwner, hexGrowth, currentTurn, myHand) {
  const svg    = el('hex-map');
  svg.innerHTML = '';
  const isMyTurn = currentTurn === mySocketId;
  const oppId    = players.find(p => p !== mySocketId);
  const myOwned  = MAP_HEXES.filter(h => hexOwner[h.id] === mySocketId).map(h => h.id);

  MAP_HEXES.forEach(hex => {
    const { x: cx, y: cy } = axialToPixel(hex.q, hex.r);
    const terrain  = TERRAIN[hex.terrain];
    const owner    = hexOwner[hex.id];
    const growth   = hexGrowth[hex.id];
    const adjacent = hasAdjacentOwned(hex.q, hex.r, myOwned);
    const meetsReq = meetsTerrainRequirement(hex.terrain, myHand);
    const canExpand = isMyTurn && !owner && adjacent && meetsReq;
    const blocked   = isMyTurn && !owner && adjacent && !meetsReq;

    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('hex-region');

    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', hexPointsStr(cx, cy, HEX_SIZE));
    poly.setAttribute('fill', terrain.color);
    poly.classList.add('hex-poly');
    if (owner === mySocketId)  poly.classList.add('owned-p1');
    else if (owner === oppId)  poly.classList.add('owned-p2');
    else if (canExpand)        poly.classList.add('expandable');
    else if (blocked)          poly.classList.add('blocked');
    else                       poly.classList.add('neutral');
    g.appendChild(poly);

    const tMain = svgText(cx, cy - 5, hex.name, 'hex-label-main');
    const tSub  = svgText(cx, cy + 5, terrain.label, 'hex-label-terrain');
    g.appendChild(tMain);
    g.appendChild(tSub);

    SUB_HEX_OFFSETS.forEach((off, slotIdx) => {
      const sx = cx + off.dx;
      const sy = cy + off.dy;
      const sg = document.createElementNS(SVG_NS, 'g');
      sg.classList.add('sub-hex');

      const slotFilled = growth && growth.slots[slotIdx];
      const ownedByMe  = owner === mySocketId;
      const growable   = isMyTurn && ownedByMe && growth?.slots[0] && !slotFilled && slotIdx > 0;

      if (growable) sg.classList.add('growable');

      const sp = document.createElementNS(SVG_NS, 'polygon');
      sp.setAttribute('points', hexPointsStr(sx, sy, SUB_HEX_SIZE));

      if (slotFilled) {
        const fillColor = growth.owner === mySocketId ? 'var(--p1-color)' : 'var(--p2-color)';
        sp.setAttribute('fill', fillColor);
        sp.setAttribute('stroke', 'rgba(0,0,0,0.3)');
        sp.setAttribute('stroke-width', '0.8');
        sp.setAttribute('opacity', '0.9');
      } else if (ownedByMe) {
        sp.setAttribute('fill', 'rgba(230,126,34,0.12)');
        sp.setAttribute('stroke', growable ? 'var(--success)' : 'rgba(230,126,34,0.3)');
        sp.setAttribute('stroke-width', growable ? '1.2' : '0.8');
        sp.setAttribute('stroke-dasharray', growable ? '2 1' : '1 1');
      } else if (owner === oppId) {
        sp.setAttribute('fill', 'rgba(52,152,219,0.12)');
        sp.setAttribute('stroke', 'rgba(52,152,219,0.3)');
        sp.setAttribute('stroke-width', '0.8');
        sp.setAttribute('stroke-dasharray', '1 1');
      } else {
        sp.setAttribute('fill', 'rgba(255,255,255,0.04)');
        sp.setAttribute('stroke', 'rgba(255,255,255,0.12)');
        sp.setAttribute('stroke-width', '0.5');
      }
      sg.appendChild(sp);

      if (growable) {
        sg.addEventListener('click', (e) => {
          e.stopPropagation();
          socket.emit('grow-subhex', { hexId: hex.id, slotIndex: slotIdx });
        });
      }
      g.appendChild(sg);
    });

    g.addEventListener('click', () => onHexClick(hex, hexOwner, currentTurn, myOwned, meetsReq));
    g.addEventListener('mouseenter', e => showHexTooltip(e, hex, hexOwner, growth, canExpand, blocked, terrain));
    g.addEventListener('mouseleave', hideHexTooltip);
    svg.appendChild(g);
  });
}

function svgText(x, y, text, cls) {
  const t = document.createElementNS(SVG_NS, 'text');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  t.classList.add(cls);
  t.textContent = text;
  return t;
}

function onHexClick(hex, hexOwner, turn, myOwned, meetsReq) {
  if (turn !== mySocketId) return;
  if (hexOwner[hex.id]) return;
  if (!hasAdjacentOwned(hex.q, hex.r, myOwned)) {
    showActionError('You can only expand into adjacent hexes.'); return;
  }
  if (!meetsReq) {
    const req = TERRAIN[hex.terrain].reqLabel;
    showActionError(req); return;
  }
  socket.emit('expand-hex', { hexId: hex.id });
}

function showHexTooltip(e, hex, hexOwner, growth, canExpand, blocked, terrain) {
  const tt     = el('hex-tooltip');
  const owner  = hexOwner[hex.id];
  const oppId  = players.find(p => p !== mySocketId);
  const ownerLabel = owner === mySocketId ? 'You' : owner === oppId ? 'Opponent' : 'Neutral';
  const stage  = growth ? growth.slots.filter(Boolean).length : 0;
  const bonus  = TERRAIN_BONUS[hex.terrain] || [];
  const bonusTxt = bonus.length
    ? bonus.map(id => SPECIES.find(s => s.id === id)?.name.split(' ')[0]).join(', ')
    : 'None';

  tt.innerHTML = `
    <strong>${hex.name}</strong>
    ${terrain.label}
    <br/><span style="color:var(--muted)">🌡 ${terrain.temp} · 💧 ${terrain.moisture}</span>
    <br/><span style="color:var(--muted)">🦋 ${terrain.dispersal}</span>
    <br/><span style="color:var(--muted)">Bonus species: ${bonusTxt}</span>
    <br/><span style="color:var(--muted)">Owner: ${ownerLabel}</span>
    ${stage > 0 ? `<br/><span style="color:var(--muted)">Growth: ${stage}/3 slots</span>` : ''}
    ${canExpand ? '<br/><span style="color:var(--success)">Click to expand — costs 2 Biomass</span>' : ''}
    ${blocked   ? `<br/><span style="color:var(--danger)">${terrain.reqLabel}</span>` : ''}
    ${owner === mySocketId && stage < 3 ? '<br/><span style="color:#3498db">Click a sub-hex dot to grow — 1 Spore</span>' : ''}
    ${owner === mySocketId && stage === 3 ? '<br/><span style="color:var(--success)">Fully colonized — +1 Biomass/round</span>' : ''}`;

  positionTooltip(tt, e);
  tt.style.display = 'block';
}
function hideHexTooltip() { el('hex-tooltip').style.display = 'none'; }

function positionTooltip(tt, e) {
  const wrap = document.querySelector('.game-map-wrap').getBoundingClientRect();
  const mx = e.clientX - wrap.left + 10;
  const my = e.clientY - wrap.top  + 10;
  tt.style.left = Math.min(mx, wrap.width - 200) + 'px';
  tt.style.top  = Math.min(my, wrap.height - 150) + 'px';
}

function renderHand(hand, turn) {
  const container = el('player-hand');
  el('hand-count').textContent = `(${hand.length})`;
  const isMyTurn = turn === mySocketId;
  container.innerHTML = '';
  hand.forEach((card, idx) => {
    const cardEl = buildCardEl(card, isMyTurn);
    cardEl.style.animationDelay = (idx * 0.04) + 's';
    container.appendChild(cardEl);
  });
}

function buildCardEl(card, canDiscard) {
  const div = document.createElement('div');
  div.className = 'mutation-card';
  if (canDiscard) div.classList.add('can-discard');
  div.dataset.cardId = card.id;
  const catColor = CATEGORY_COLORS[card.category] || '#555';
  div.innerHTML = `
    <div class="mc-power">${'★'.repeat(card.power || 1)}</div>
    <div class="mc-name">${card.name}</div>
    <span class="mc-cat" style="background:${catColor}">${card.category}</span>
    <div class="mc-effect">${card.effect}</div>
    ${canDiscard ? '<div class="mc-discard-hint">Click to discard →</div>' : ''}`;

  div.addEventListener('mouseenter', e => showCardDetail(e, card, canDiscard));
  div.addEventListener('mouseleave', hideCardDetail);
  div.addEventListener('mousemove', e => {
    const popup = el('card-detail-popup');
    if (popup.style.display !== 'none') moveCardDetail(e);
  });

  if (canDiscard) {
    div.addEventListener('click', () => discardCard(card.id, div));
  }
  return div;
}

function discardCard(cardId, elem) {
  if (!gameState || gameState.turn !== mySocketId) return;
  hideCardDetail();
  elem.classList.add('card-leaving');
  elem.addEventListener('animationend', () => socket.emit('discard-card', { cardId }), { once: true });
}

function showCardDetail(e, card, canDiscard) {
  const popup = el('card-detail-popup');
  const catColor = CATEGORY_COLORS[card.category] || '#555';
  el('cdp-name').textContent   = card.name;
  const catEl = el('cdp-cat');
  catEl.textContent = card.category;
  catEl.style.background = catColor;
  el('cdp-power').textContent  = '★'.repeat(card.power || 1) + ' Power ' + (card.power || 1);
  el('cdp-effect').textContent = card.effect;
  el('cdp-hint').textContent   = canDiscard ? 'Click card to discard → Spore Drift Pool' : '';
  moveCardDetail(e);
  popup.style.display = 'block';
}
function moveCardDetail(e) {
  const popup = el('card-detail-popup');
  const x = e.clientX + 14;
  const y = e.clientY - 20;
  popup.style.left = Math.min(x, window.innerWidth - 240) + 'px';
  popup.style.top  = Math.max(8, Math.min(y, window.innerHeight - 200)) + 'px';
}
function hideCardDetail() { el('card-detail-popup').style.display = 'none'; }

function renderDeck(count) {
  el('deck-count').textContent = `${count} cards`;
}

function renderDriftPool(pool, turn) {
  const pile  = el('drift-pile');
  const count = el('drift-count');
  count.textContent = `${pool.length} card${pool.length !== 1 ? 's' : ''}`;

  Array.from(pile.children).forEach(c => {
    if (!c.classList.contains('drift-empty-msg')) c.remove();
  });

  const empty    = el('drift-empty');
  const isMyTurn = turn === mySocketId;

  if (pool.length === 0) { empty.style.display = 'flex'; return; }
  empty.style.display = 'none';

  const top = pool[0];
  const catColor = CATEGORY_COLORS[top.category] || '#555';
  const card = document.createElement('div');
  card.className = 'drift-top-card';
  card.innerHTML = `
    <div class="drift-card-name">${top.name}</div>
    <div class="drift-card-cat" style="color:${catColor}">${top.category}</div>
    <div class="drift-card-effect">${top.effect}</div>
    ${isMyTurn ? `<div class="drift-scavenge-hint">Scavenge (1 MP)</div>` : ''}`;

  card.addEventListener('mouseenter', e => showCardDetail(e, top, false));
  card.addEventListener('mouseleave', hideCardDetail);
  if (isMyTurn) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => socket.emit('scavenge-card', { cardId: top.id }));
  }
  pile.appendChild(card);
}

document.getElementById('btn-draw').addEventListener('click', () => {
  if (!gameState || gameState.turn !== mySocketId) return;
  socket.emit('draw-card');
});
document.getElementById('btn-end-turn').addEventListener('click', () => {
  socket.emit('end-turn');
  el('btn-end-turn').disabled = true;
});

socket.on('card-drawn', ({ playerId }) => {
  if (playerId === mySocketId) {
    const deck = el('deck-pile');
    deck.style.transform = 'scale(0.93)';
    setTimeout(() => deck.style.transform = '', 180);
  }
});

socket.on('environmental-event', (card) => {
  const modal = el('env-modal');
  el('env-cat').textContent    = card.category;
  el('env-icon').textContent   = card.icon;
  el('env-name').textContent   = card.name;
  el('env-flavor').textContent = card.flavor;
  el('env-effect').textContent = card.effectText;

  const bar = el('env-timer-bar');
  bar.style.animation = 'none';
  bar.getBoundingClientRect();
  bar.style.animation = 'timerDown 6s linear forwards';

  modal.style.display = 'flex';

  const autoClose = setTimeout(() => dismissEnv(), 6000);
  function dismissEnv() {
    clearTimeout(autoClose);
    modal.style.display = 'none';
    el('btn-dismiss-env').removeEventListener('click', dismissEnv);
  }
  el('btn-dismiss-env').addEventListener('click', dismissEnv, { once: true });
});

document.getElementById('btn-rules-popup').addEventListener('click', () => {
  el('rules-modal').style.display = 'flex';
});
document.getElementById('btn-close-rules').addEventListener('click', () => {
  el('rules-modal').style.display = 'none';
});
el('rules-modal').addEventListener('click', e => {
  if (e.target === el('rules-modal')) el('rules-modal').style.display = 'none';
});

socket.on('action-error', ({ message }) => showActionError(message));
function showActionError(msg) {
  const e = el('action-error');
  e.textContent = msg;
  clearTimeout(e._t);
  e._t = setTimeout(() => e.textContent = '', 3500);
}

socket.on('player-left', () => show('screen-disconnected'));
