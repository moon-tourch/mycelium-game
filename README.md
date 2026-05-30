# MYCELIUM
### A Strategy Game of Fungal World Domination
*2-player browser prototype — Node.js / Socket.io*

---

## What This Is

Mycelium is a two-player online strategy game where each player commands a real fungal species competing for territorial dominance across a 19-region hex map. Players expand their mycelium, draw mutation cards, manage three resources (Biomass, Spores, and Mutation Points), and react to environmental events that shift global conditions each round.

This is a browser prototype built as the final project for Professor Katherine Buse's Interactive Environments seminar at the University of Chicago, Spring 2026. The full game it's based on is a 1–14 player board game with 14 asymmetric species and four distinct victory paths. This is the proof-of-concept version — smaller, playable, and honest about what it is and isn't yet.

---

## How to Run It (in your terminal)

You'll need [Node.js](https://nodejs.org/) installed (any recent version works). Then:

```bash
# 1. Download or clone this repository
# 2. In your terminal, navigate to the folder:
cd mycelium-game

# 3. Install dependencies (one time only):
npm install

# 4. Start the server:
node server.js

# 5. Open http://localhost:3001 in your browser
```

To play with two players on one machine, open **two separate browser tabs** (or two different browsers) both pointed at `http://localhost:3001`. In the first tab, click **Create Room** — it will show a 4-letter code. In the second tab, click **Join Room** and enter that code. Both players then pick a species and the game begins.

The server runs locally on your machine — no internet connection needed once Node is installed.

---

## Process Memo

### Why I Made This

The origin is an accidental collision. I was replaying *The Last of Us* while working through the Daisyworld scenario for this course's SimEarth assignment.

 SimEarth positions the player as what I'd call a god-simulator: you are outside the system, dropping meteors and triggering volcanoes, watching graphs respond. N. Katherine Hayles, describes computational systems as "consciousness technologies" — structures that can expand what human cognition is capable of. Daisyworld is smart, but it expands your understanding of Gaia by showing you the mechanism from the outside. It does not ask you to become any part of it.

The Cordyceps outbreak in the last of us however is horrifying not because you're watching a pathogen spread on a map but because you experience the aftermath of it through human characters, through story and through game play. The game gives you enough narrative architecture to feel what it might mean for that a sentient mushroom, a mushroom with will - the will to take over the world to become gia to exsist. Patient, distributed, indifferent to individual survival, optimizing at the scale of populations over decades. 

That is what Mycelium is trying to do. The goal is not to simulate fungal ecology from the outside but to create the conditions for temporarily inhabiting a non-human cognitive position from the inside — what my background in anthropology and religious studies would call a consciousness technology in the older sense of the term. The fourteen playable species aren't character classes with stat sheets. They're epistemological positions: each species has a  different relationship to terrain, to other organisms, and to human civilization. Playing *Armillaria ostoyae* requires thinking in terms of distributed underground networks and decades-long territory accumulation. Playing *Psilocybe cubensis* requires asking whether the transcendence you're inducing in human hosts is something you're doing to them or something they're grateful for.

This is where I think Mycelium does something structurally different from SimEarth, not better, but different. SimEarth's problem, which I identified in the daisyworld assignment, is circular validation: it encodes Gaia theory as its foundational rules and then generates Gaian outcomes, which feel like evidence but are actually just the assumptions running their course. Wright even acknowledges this by listing Gaia theory as a "bias" in the manual. The game cannot escape this because it is trying to be a scientific model, a "planetary spreadsheet," in Wright's words, and scientific models that encode their conclusions as premises are epistemically circular no matter how sophisticated their mathematics.

Mycelium is not trying to be a scientific model. It is asking a speculative question: *what if mushrooms wanted to take over the world?* . Robin Wall Kimmerer, in *Braiding Sweetgrass*, describes Indigenous forms of environmental knowledge as participatory rather than observational, knowledge that comes from being in relationship with non-human intelligence rather than studying it from outside. Mycelium's method reaches toward a methodology closer to that tradition than to Wright's. It creates the conditions for briefly thinking the way such an intelligence might think, and asking what that reveals about an imagined world, in order to play Gia.

### The Mechanical DNA

The game's mechanics are drawn from games that already solved specific design problems well.

**Catan** provides the territorial expansion core. Adjacent mycelium spread mirrors road-building; resource generation from controlled territories is the same basic engine, adapted for biological conquest. The hex map is directly borrowed from that tradition.

**Wingspan** provided the engine-building logic. Species begin with limited abilities and develop increasingly powerful mutation combinations over the course of the game. The escalating costs for unlocking mutation slots (2 MP → 5 MP → 8 MP → 12 MP) mirror the way Wingspan's bird placement costs increase as habitats fill.

**Plague Inc.** contributed the asymmetric tech trees and the human countermeasure escalation — the two-threshold structure (Tipping Point, then Final Victory) mirrors Plague Inc.'s infection-spread-lethality progression, and the medical response cards parallel its cure research mechanics. But there is a crucial structural difference: in Plague Inc. you are still an external controller. You design the pathogen. You watch it spread on a world map. The player's position is the god-simulation paradigm. In Mycelium, you are not controlling a fungus — you are *being* one, which means the cognitive demands of the game are different. The expansion-triggered evolution system tries to make this concrete: you don't just spend resources to upgrade your abilities; you grow into hostile territory, get pressured, and adapt, the way actual organisms do.

**Race for the Galaxy** influenced the Spore Drift Pool — cards as both abilities and resources, a shared discard pile that creates economic opportunity from other players' decisions.

 Wilensky and Resnick's "Thinking in Levels" describes the difference between pseudo-emergence (complex-appearing behaviors that are really just embedded assumptions running their course, which is what Daisyworld does) and genuine emergence (system outcomes that exceed and can surprise the individual component rules). The expansion-triggered evolution system is an attempt at the latter: when a *Psilocybe* player develops fecal-oral transmission and hits the "College Students Observe Deer Behavior" Reckoning Card at the right moment, the outcome emerges from the intersection of multiple independent systems rather than from a predetermined script. Whether it actually achieves genuine emergence is something only sustained playtesting could tell me, and I haven't done that playtesting yet.

Daniel Botkin's *Discordant Harmonies*, argues that ecological systems operate through dynamic disequilibrium, change is intrinsic, not exceptional. The expansion-triggered evolution system is designed around that principle: players don't reach a stable configuration and hold it; every expansion decision reopens the question of what the species is becoming.

### What I Learned

I came into this project knowing basic HTML and CSS. Server-side programming was entirely new.

The first thing I had to understand was the split between server and client. HTML renders on your machine; game state shared between two players has to live somewhere neutral. Node.js runs JavaScript outside the browser, on a machine both players connect to. Going from "a file that renders" to "a program that listens" was the first real conceptual adaptation.

Socket.io made the real-time connection workable. The distinction that mattered most was `io.emit` (broadcast to everyone in a room) versus `socket.emit` (send to one player only). In Mycelium, your hand is hidden from your opponent — so the server has to build and send a *different* version of the game state to each player every time anything changes. Reasoning about that asymmetry was the hardest part of the project.

The terrain requirement system taught me server-side validation. Cards in your hand determine which terrain types you can expand into, and the server checks this before allowing any expansion. You cannot trust the client to enforce rules — players can modify what they send. Everything has to be re-verified on the server on every action.

The visual layer — a hex map with correct flat-top hexagonal geometry, interactive SVG regions, a working card hand and drift pool — required learning enough SVG and CSS layout to hold all of it on one responsive screen. I got it to functional. I learned that functional and finished are not the same thing.

### What I'd Do Differently

This prototype does not demonstrate the game's central mechanic. The whole design is built on expansion-triggered evolution: you push into hostile terrain, you get pressured, you draw mutations and adapt. That's what distinguishes Mycelium epistemologically from Plague Inc. and SimEarth, the player is inside the adaptive pressure, not administering it from outside. The current version doesn't do that. The terrain requirement is a hard gate: no Climate card means no alpine expansion. That's a locked door, not an evolutionary challenge.

The deeper mistake was trying to build the whole game at once instead of asking what the minimum version is that demonstrates the thing that makes it interesting. Looking back at Daisyworld: the reason that scenario works as a demonstration, even a circular one, is that the core feedback loop, temperature rises, white daisy biomass expands, albedo increases, temperature drops, is complete and intact. You can test it, break it with meteors, watch it recover. There's a loop to interact with. My browser prototype has no equivalent. Without the mutation slot system there is no loop to test just yet...

If I were starting over: build the mutation slot system first. One installed card that visibly changes your income. One expansion trigger that forces an adaptation draw. One win condition. Prove the loop works before building anything else (closer to what you suggested at the start...)

---

## Thanks

I couldn't have done this without the CS guidance of my husband **Omar** — who walked me through Node.js, helped me understand the socket event model, and was patient with a lot of late-night questions. This game exists because he lent me his brain.

This project also relies on the following open source tools:

- **[Node.js](https://nodejs.org/)** — Ryan Dahl and the OpenJS Foundation
- **[Express](https://expressjs.com/)** — TJ Holowaychuk and contributors
- **[Socket.io](https://socket.io/)** — Guillermo Rauch and contributors
- **[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)** — CodeMan38 on Google Fonts

---

*MYCELIUM — Version 0.1 prototype — Spring 2026*
*University of Chicago, Interactive Environments seminar — Professor Katherine Buse*
