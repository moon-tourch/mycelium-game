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

Mycelium started with a question my game design class posed: *what if mushrooms wanted to take over the world?* That sounds like a horror premise, and it is — but it's also a real epistemological question. Fungi are among the largest organisms on Earth. They run the planet's decomposition cycles, form underground communication networks that dwarf the internet in geographic scale, and have been manipulating animal behavior for millions of years. The game asks what happens when you're made to *inhabit* that logic from the inside.

The central design argument is that fungal biology should be the game's engine, not its flavor. Most science-themed games use real-world detail as decoration on top of abstract mechanics. Mycelium inverts that — spore dispersal modes determine movement range, host specificity determines victory paths, environmental tolerance determines survival. The psychological discomfort of certain strategies (like the Control Network path, where you're optimizing neurological subjugation of human consciousness) should feel earned, because it's grounded in what *Ophiocordyceps unilateralis* actually does to ant brains. The game tests whether biological accuracy can generate moral weight without moralizing.

The browser prototype grew out of a logistical problem: the board game requires people in a room, setup time, and someone to track state across 18 rounds. Playtesting at the scale the design requires is hard. So I expanded into unfamiliar territory — servers, real-time communication, state management — the same way the game's mechanics reward fungal species for pushing into hostile environments. You can't evolve by staying in terrain you already understand.

### What I Learned

I came into this project knowing basic HTML and CSS. Server-side programming was entirely new.

The first thing I had to understand was the difference between a server and a client. HTML lives on your computer and renders in your browser — that mental model breaks completely when game state has to exist *somewhere neutral*, shared between two players who might be in different places. Node.js runs JavaScript outside the browser, on a machine both players connect to. That shift — from a file that renders to a program that listens — was the first real adaptation.

Socket.io made the real-time connection manageable. It uses an event model: the server emits events to clients, clients emit events back. The most important thing I learned was the difference between `io.emit` (broadcasting to everyone in a room) and `socket.emit` (sending to one player only). In Mycelium, your hand is hidden from your opponent — which means the server has to construct and send *different versions* of the game state to each player every time anything changes. That asymmetry was the hardest problem to reason about.

The terrain requirement system taught me server-side validation. Cards in a player's hand determine which terrain types they can expand into; the server checks this before allowing any expansion action. You cannot trust the client to enforce rules. Players can manipulate what they send to the server. Everything has to be verified independently on the server on every action.

The Spore Drift Pool mechanic required thinking about shared state. Two players can't modify the same pool simultaneously without creating inconsistencies. Socket.io's single-threaded event loop handles this naturally, but understanding *why* required reading about how JavaScript processes events asynchronously.

The visual layer was its own terrain. A hex map rendered in the browser with accurate geometry and interactive regions required learning enough SVG to draw hexagonal tiles correctly, and enough CSS layout to hold a sidebar, a map, and a card area in a responsive screen at the same time. Visual design is not my primary language. I learned enough to make it functional, and I learned that "functional" and "finished" are very different things.

### What I'd Do Differently

The honest account: this prototype does not demonstrate the game's central mechanic. The game's argument — the thing that makes it interesting — is the expansion-triggered evolution system. You expand into hostile terrain, you get pressured, you draw mutations and adapt. Biology as game engine. The current browser version does not do that. The terrain requirement is a hard block: no Climate card means you can't enter alpine terrain, full stop. That's not adaptation under pressure. There's no survival roll. There's no drawing three mutations and choosing one. It's a locked door rather than an evolutionary challenge.

The deeper problem is that I tried to build everything at once instead of asking: *what is the smallest version of this that demonstrates the thing that makes it interesting?* The answer is a two-player game with two mutation slots each, one adaptation response when you expand into hostile terrain, and one working victory condition. That would be a real demo. Instead I built the map, the cards, the environmental events, the drift pool — all real features of the game — before I built the mechanic that makes all of them matter.

If I were starting over, I would build the mutation slot system first. One installed card that visibly changes your income. One expansion trigger that forces an adaptation draw. One win condition checked at round end. Then expand from there. Ambitious games are built incrementally. You prove the core loop first.

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
