# MYCELIUM
### A Strategy Game of Fungal World Domination
*2-player browser prototype — Node.js / Socket.io*

---

## What This Is

Mycelium is a two-player online strategy game where each player commands a real fungal species competing for territorial dominance across a 19-region hex map. Players expand their mycelium, draw mutation cards, manage three resources (Biomass, Spores, and Mutation Points), and react to environmental events that shift global conditions each round.

This repository is a working browser prototype built for a final project in Professor Katherine Buse's Interactive Environments seminar at the University of Chicago, Spring 2026. The full game it's based on is a 1–14 player board game with 14 asymmetric species, 400+ mutation cards, and four distinct victory paths. This is the proof-of-concept version of that game — smaller, playable, and honest about what it is and isn't.

---

## To Run Locally

```
npm install
node server.js
```

Open `http://localhost:3001` in two browser windows. One player creates a room, shares the code, the other joins.

---

## Process Memo

### Why I Made This

The origin is embarrassingly specific. I was replaying *The Last of Us* while doing the SimEarth Daisyworld assignment for this class, and something clicked: the Cordyceps outbreak in that game isn't really a horror story about fungal invasion. It's a Gaian story about planetary rebalancing. The same recyclers that handle every other excess — dead wood, dead animals, excess phosphorus in the soil — turning toward an overgrown primate population. If you read Lovelock seriously, a fungal takeover doesn't look like an alien attack. It looks like the system correcting itself.

That realization fixed a problem I had been having with Daisyworld. Playing the scenario, watching the white daisies regulate global temperature through albedo shifts, I could see the self-regulating mechanism clearly. But I couldn't *feel* it. There was nothing to be inside of. Lovelock's hypothesis says the biosphere behaves like a single self-regulating system — but Daisyworld gives you the mechanism without giving you a mythology to attach to it. Pandemic Inc does something similar. You control a pathogen, but the framing is still conquest from the outside. I wanted a game where you are Gaia, not something acting on it.

That's the premise Mycelium is built on. In this game, you are the regulatory system. The fungal network is the planet doing something about the problem of too much accumulated animal biomass, too much atmospheric imbalance, too much human infrastructure. The four victory paths — Population Collapse, Control Network, Biomass Empire, Ecological Conquest — aren't horror outcomes. They are Gaian outcomes. The game asks what it feels like to be inside that logic.

I want to be honest about something this class made clear to me: Mycelium encodes Gaian assumptions and then produces Gaian results, the same way SimEarth does. When I wrote about Daisyworld in this assignment I said "a scientific model that encodes your theory as its rules cannot then be used to verify that theory." Mycelium does exactly that. The difference — the reason I think it's worth making anyway — is that Mycelium doesn't claim to be a scientific instrument. Wright's whole problem is the marketing: he calls SimEarth a "planetary spreadsheet" and a "system simulator" and then has to squirm around the fact that it's built on theoretical assumptions about how planetary systems work. I'm not making that claim. Mycelium is a consciousness technology, borrowing language my anthropology training gave me: a structured practice for accessing a form of cognition that ordinary analytical frameworks can't reach. The circular validation is the point, not a flaw to hide. You play as Gaia to feel what that logic is like from inside, not to prove it's real.

The moral weight of the Control Network path — where you're optimizing the neurological capture of human minds — comes from the same place. It's uncomfortable because it's grounded in what *Ophiocordyceps unilateralis* actually does to ant brains. But I'm not claiming that discomfort is scientifically derived. It's mythologically derived, the way *The Last of Us* derived it, just with more explicit biological scaffolding. What my background in anthropology and religious studies taught me is that a narrative people can inhabit does something a diagram cannot. Daisyworld left conceptual gaps because it had no character, no mythology, no interiority. Mycelium's argument is that the missing piece is exactly that: something to be inside of.

The browser prototype started as a logistics problem. The board game needs people in a room, long setup, and someone tracking eighteen rounds of state. So I pushed into servers and real-time communication, territory I didn't know — which is, if nothing else, thematically consistent with a game that rewards fungal species for growing into hostile environments.

### What I Learned

I came into this project knowing basic HTML and CSS. Server-side programming was entirely new.

The first thing I had to understand was the split between server and client. HTML lives on your machine and renders in your browser, and that mental model collapses the moment game state has to exist somewhere neutral that two players in different places can share. Node.js runs JavaScript outside the browser, on a machine both players connect to. Going from a file that renders to a program that listens was the first real adaptation.

Socket.io made the real-time connection workable through an event model: the server emits events to clients, clients emit events back. The distinction that mattered most was `io.emit` — broadcasting to everyone in a room — versus `socket.emit`, which sends to one player. In Mycelium your hand is hidden from your opponent, so the server has to build and send a different version of the game state to each player every time anything changes. Reasoning about that asymmetry was the hardest part of the project.

The terrain requirement system taught me server-side validation. Cards in a player's hand decide which terrain types they can expand into, and the server checks that before allowing any expansion. You can't trust the client to enforce rules — players can manipulate what they send. Everything has to be verified independently on the server, on every action.

The Spore Drift Pool forced me to think about shared state. Two players can't modify the same pool simultaneously without creating inconsistencies. Socket.io's single-threaded event loop handles that, but understanding *why* meant reading about how JavaScript processes events asynchronously.

The visual layer was its own hostile terrain. A hex map with correct geometry and clickable regions meant learning enough SVG to draw the tiles and enough CSS layout to hold a sidebar, a map, and a card area on one responsive screen. Visual design is not my primary language. I got it to functional, and I learned that functional and finished are not the same thing.

### What I'd Do Differently

This prototype does not demonstrate the game's central mechanic. The thing that makes Mycelium worth playing is expansion-triggered evolution: you push into hostile terrain, you come under pressure, you draw mutations and adapt. That's the loop the whole design is built on. The current version doesn't do it. The terrain requirement is a hard block — no Climate card, no alpine expansion — which is a locked door, not an evolutionary challenge. There's no survival roll. There's no drawing three mutations and keeping one. No installation. No moment where the species changes.

The deeper mistake was building everything at once rather than asking what the smallest version is that shows the part that makes it interesting. That version is two mutation slots each, one adaptation response when you expand into hostile terrain, one victory condition. That would have been a real demo. Instead I built the map, the cards, the environmental events, the drift pool — all real features of the game — before building the mechanic that gives any of them a reason to exist.

Playing Daisyworld actually showed me exactly this mistake in retrospect. The simulation works as a demonstration of Gaian self-regulation because the feedback loop — temperature rises, white daisy biomass expands, albedo increases, temperature drops — is intact and complete. When I tried to break it with ice meteors and volcanoes, I was testing the loop, which meant the loop existed to test. The loop is what made the experiment legible. My browser prototype has no equivalent loop. There's nothing to test and nothing to break because the core feedback cycle isn't there yet.

If I were starting over, I would build the mutation slot system first. One installed card that visibly changes your income. One expansion trigger that forces an adaptation draw. One win condition checked at round end. Then grow from there.

---

## Thanks

I couldn't have built this without the CS guidance of my husband **Omar** — who talked me through Node.js, helped me understand the socket event model, and answered a lot of questions late at night. This game exists because he lent me his brain.

This project also relies on the following open source tools and their creators:

- **[Node.js](https://nodejs.org/)** — Ryan Dahl and the OpenJS Foundation. The runtime that made a browser game with server-side state possible at all.
- **[Express](https://expressjs.com/)** — TJ Holowaychuk and contributors. Serving the static files and keeping the server simple.
- **[Socket.io](https://socket.io/)** — Guillermo Rauch and contributors. The real-time event layer that lets two players share a game state without polling.
- **[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)** — CodeMan38 on Google Fonts. The pixel font that gives the UI its game-y feel.

---

*MYCELIUM — Version 0.1 prototype — Spring 2026*
*University of Chicago, Interactive Environments seminar*
