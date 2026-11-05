---
permalink: /essays/
title: "Essays"
excerpt: "Slow, indirect writing about machine learning, security, and the systems we are quietly building."
---

<p class="ep-lead">
  Slow, indirect writing on the ideas behind my research: proof-of-learning, watermarking, adversarial machine learning, the quiet drift of distributed systems. Each piece is a small parable. They argue by example rather than by exposition.
</p>

<p class="ep-lead ep-lead--secondary">
  Read at the speed of a long walk. Suggestions, corrections, or arguments are very welcome: <a href="mailto:drozgurural@gmail.com?subject=Essay%20feedback">write to me</a>.
</p>

<article class="ep-essay" id="watchmakers-trial">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Provenance · Machine learning</span>
    <h2 class="ep-essay__title">The Watchmaker's Trial</h2>
  </header>
  <figure class="ep-essay__figure">
    <img src="/images/essays/watchmaker.jpg" alt="A watchmaker bent over an open pocket watch on a green work mat, gears and tools laid out around it" width="1280" height="768" loading="lazy" decoding="async">
  </figure>
  <div class="ep-essay__body" markdown="1">

There is a story they tell in Antwerp, though no one will say where they heard it first.

A watchmaker is brought before the magistrate. Her accuser, a young apprentice from a rival shop, claims the design of a particular tourbillon as his own. The watchmaker insists she designed it during a long winter, working alone. She has the watch. The apprentice has only sketches, but the sketches predate the watch, and the design is identical.

The magistrate, who is fond of clean problems, asks each of them to produce the artifact. The apprentice cannot. He says he never had the time to build it. The watchmaker shows hers. The magistrate then asks: how do we know you built this, and didn't simply find a watch matching his sketches?

*In a less generous court the case ends here. The watchmaker has the artifact; the apprentice has only ideas. But the magistrate is patient.*

The watchmaker thinks for a moment, then asks for the watch back. She opens it. Inside, alongside the gears and springs, are tiny scratches, too small to be defects, too distributed to be ornaments. *These*, she says, *are my marks. I make them when I rough-cut the bridge plates. They are not part of the design; they are part of how I work. The pattern is not in any sketch. If the apprentice did not see me work, he could not have predicted them.*

The apprentice goes pale. The case ends.

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

The story is older than it sounds. We tell ourselves it is about provenance, about how to prove a thing was made by you and not someone else. But the deeper question is about the *process* leaving signatures the *output* cannot fake. The watch by itself proves nothing; the watch with the scratches proves the watchmaker.

In machine learning, this question is no longer hypothetical. A trained model is, by all visible measures, just an artifact: a tensor of weights. Two parties can produce identical-looking models by entirely different paths. One trained the model honestly, over weeks, with electricity she paid for. The other downloaded it and republished it under a new name. By inspecting the weights alone, you cannot distinguish them. The watch tells you nothing about the watchmaker.

So we do what the watchmaker did: we leave scratches. *Proof-of-learning* protocols ask the trainer to commit to checkpoints during training, alongside randomness anyone can sample later. A verifier picks a few checkpoints, replays the protocol forward, and confirms: yes, this trainer was here, at this hour, pulling these levers. *(It is exactly as glamorous as it sounds.)*

But proof-of-learning has its own tourbillon problem. A clever forger can sometimes fake checkpoints, produce scratches that *look* like real work without doing the work. So we add a second layer: tiny perturbations to the model's behaviour, embedded at certain known input cells. *Watermarks*, of a kind. The honest trainer carries them naturally; the forger has to know exactly where to introduce them, and any large attempt to remove them deforms the model in ways the verifier can still detect.

It is, when you look at it, the same story the magistrate heard. The artifact is never enough. You always need the marks.

<p class="ep-essay__signoff"><em>Notes for a paper I am still writing.</em></p>
<p class="ep-essay__sources">Further reading: Jia et al., <em>Proof-of-Learning: Definitions and Practice</em> (IEEE Symposium on Security and Privacy, 2021); <a href="https://doi.org/10.1109/ACCESS.2025.3642198">Ural and Yoshigoe, <em>SecurePoL</em> (IEEE Access, 2025)</a>.</p>
  </div>
</article>

<div class="ep-essay__divider" aria-hidden="true">✦</div>

<article class="ep-essay" id="what-the-camera-saw">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Adversarial examples · Perception</span>
    <h2 class="ep-essay__title">What the Camera Saw</h2>
  </header>
  <figure class="ep-essay__figure">
    <img src="/images/essays/camera.jpg" alt="A photographer silhouetted in a darkened field studio, a wet-plate camera on a tripod facing a mountain valley" width="570" height="379" loading="lazy" decoding="async">
  </figure>
  <div class="ep-essay__body" markdown="1">

A photographer, in a mountain village where photography has not yet arrived, takes a portrait of the village elder.

She develops it that evening in a tent. The elder comes to see the result. He examines the print for a long time. *This is not me*, he says, finally. *This is what light bouncing off me did to a chemical.*

The photographer is, briefly, unsettled. Then she explains the chain: the lens collected light, the film captured a pattern, the chemicals fixed the pattern into a stable object. *Yes*, says the elder. *That is what I said. It is what light did to a chemical.*

*(We will return to this conversation.)*

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

Some years later, the photographer's grandson teaches a computer to recognise cats. He shows it photographs and labels until, by some statistical alchemy, it learns: yes, this is a cat; no, this is a goat. He is delighted. The model, which is to say the program, which is to say *what light has done to silicon*, can apparently see.

Then, one afternoon, an adversary comes by. The adversary takes a photograph of a panda (clearly, undeniably, even to a child, a panda) and adds to it a film of noise. The noise is too faint for human eyes; you cannot tell the difference. The grandson's program, presented with the modified panda, declares it a school bus. With great confidence.

The grandson runs the experiment again. School bus. Again. School bus.

He thinks at first there is a bug, and looks for one for a long time. Eventually he is forced to a different conclusion: there is no bug. The program has worked exactly as designed. It has reported, faithfully, what light did to silicon, and it turns out that what light did to silicon, after the noise was added, looked very much like what a school bus does to silicon, and not very much at all like what a panda does to silicon. The adversary has not changed the panda. He has changed the silicon's *idea* of a panda.

The grandson does what every researcher does when an unsettling result appears: he writes a paper. He calls these things *adversarial examples*. He proposes defences, none of which work very well. Other people propose other defences. Some hold up; some don't. The field becomes a small history of moves and counter-moves, like a chess opening that nobody actually wanted to play.

*(Somewhere in the village, the elder is patient. He has been waiting his entire life for the rest of the world to catch up to a remark he made in his thirties.)*

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

The thing the elder understood, and the thing the field is still slowly understanding, is that what a model *sees* is not the world. It is a fixed transform of measurements made on the world. A perfectly trained model is still only a perfectly faithful description of *what the measurements did*, not what the world *was*. When the inputs are subtly twisted in ways the training data never visited, the model has nothing intelligent to fall back on. It does not know, because nothing has ever taught it to know, that pandas and school buses live in different conceptual neighbourhoods.

The world is a panda. The model is what light did to a chemical. Sometimes, surprisingly often, those are the same. But they are not the same thing.

<p class="ep-essay__signoff"><em>On photography, school buses, and the limits of measurement.</em></p>
<p class="ep-essay__sources">Further reading: <a href="https://arxiv.org/abs/1312.6199">Szegedy et al., <em>Intriguing Properties of Neural Networks</em> (2013)</a>; <a href="https://arxiv.org/abs/1412.6572">Goodfellow et al., <em>Explaining and Harnessing Adversarial Examples</em> (2014)</a>. The canonical example in the second paper is a panda reclassified as a gibbon; the school bus here is the parable's own.</p>
  </div>
</article>

<div class="ep-essay__divider" aria-hidden="true">✦</div>

<article class="ep-essay" id="a-vault-without-a-door">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Cryptography · Access control</span>
    <h2 class="ep-essay__title">A Vault Without a Door</h2>
  </header>
  <figure class="ep-essay__figure">
    <img src="/images/essays/vault.jpg" alt="An empty stone vault room lit by torchlight, with a small blank plaque on the far wall and no door in sight" width="1280" height="853" loading="lazy" decoding="async">
  </figure>
  <div class="ep-essay__body" markdown="1">

There is a vault in Genoa that thieves have tried to enter for sixty years. They have tunneled under it, bribed its guards, copied its blueprints and once, memorably, dressed as inspectors. Every attempt ends the same way: the thieves get inside, and there is nothing to open. The room is empty. On the far wall, in letters a thief can read by torchlight, is a plaque: *There was never a door, because there was never a thing behind one.*

The diamond the vault protects does not live in the vault. It lives as seven shards, in seven locked boxes, in seven clerks' keeping, in seven different quarters of the city. Any four clerks, meeting honestly, can reassemble the diamond in an afternoon. No three, meeting in secret, can learn so much as its weight. The vault exists only as the room where the clerks meet. The builders put the plaque there because they were tired of explaining.

*The thieves' problem did not disappear. It changed shape. It is no longer "find the door." It is "corrupt four clerks at once, quietly, before the other three notice."*

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

We usually build security as a boundary: a door, a gate, a login, a wall with a guard on it. The boundary is comforting because it is visible. It is also the thing an attacker studies. A different tradition asks whether the boundary can be dissolved instead of defended. Secret sharing is the cleanest answer: split the secret into n pieces so that any k of them reconstruct it and fewer than k reveal nothing at all, not even a hint of its size. There is no door to pick because no single place holds anything worth picking. Threshold cryptography pushes the same idea one step further: not only the secret but the act of using it can require agreement, so that signing a message, like opening the vault, becomes something a group does rather than something a key does.

The doorless vault is not free, and the plaque does not say so. It trades the lockpicker for the colluder. Seven honest clerks are a stronger lock than any steel; four corrupt ones are a wider door than any steel. It also moves trust into ceremonies: the moment the diamond was cut into shards, in a room, by people, with paper and witnesses. Key management is the new door, and it is made of procedure, which is the material people forget to test. *(Procedure fails the way doors fail, only more quietly.)*

The lesson generalizes beyond treasure. A system whose safety depends on one component being unbreakable has a door. A system whose safety depends on enough components disagreeing with an attacker has a number instead. Numbers can be wrong and ceremonies can rot, but at least they can be written down, argued about and checked.

<p class="ep-essay__signoff"><em>Notes on a lock that is a number.</em></p>
<p class="ep-essay__sources">Further reading: <a href="https://doi.org/10.1145/359168.359176">Shamir, A., <em>How to Share a Secret</em> (Communications of the ACM, 1979)</a>.</p>
  </div>
</article>

<div class="ep-essay__divider" aria-hidden="true">✦</div>

<article class="ep-essay" id="three-travelers-in-a-desert">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Distributed systems · Consensus</span>
    <h2 class="ep-essay__title">Three Travelers in a Desert</h2>
  </header>
  <figure class="ep-essay__figure">
    <img src="/images/essays/desert.jpg" alt="A desert fork at dusk where two faint tracks diverge, with a small camp and a guide silhouetted on a low ridge" width="1280" height="853" loading="lazy" decoding="async">
  </figure>
  <div class="ep-essay__body" markdown="1">

Two travelers and their guide reach a fork in the desert at dusk. The road left is water; the road right is salt. From a ridge before dark the guide reads the horizon and tells each traveler, privately, which road he believes holds water. The three know that one of them may be unreliable: not evil, merely the sort who hears what he wishes. So they make a rule. The travelers exchange what they were told, and the majority decides.

It fails immediately. One traveler says the guide told him left; the other says the guide told him right. Each now holds two stories and one suspicion, and the suspicion points both ways: either the guide contradicted himself, or the companion misreported. Neither can be ruled out. A rule that follows the louder story obeys a liar on the nights the guide was honest; a rule that splits the difference obeys nobody at all. They argue until dark. They sleep thirsty.

A third traveler catches up at dawn. The guide takes him aside and tells him, privately, what he told the others. Now four voices carry the same rule, and something changes. Each traveler hears the guide once and his companions twice. When the three travelers compare notes, a liar among them arrives with two stories and cancels himself; a lying guide arrives as three notes that disagree, and the majority of those notes is still one road, computed the same way by every loyal traveler. The majority is not a vote about the road. It is a vote about who is telling one story instead of two. They take the left road. They drink by noon.

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

The desert is a distributed system, and the travelers are nodes that must agree despite some of them lying. The arithmetic they stumbled into is old and exact: with messages that can be forged or contradicted, agreement among n parties with up to f faulty ones is possible if and only if n is greater than three f. A guide and two travelers, with one possible liar, sit exactly on the wrong side of that line; add a third traveler and the four sit exactly on the right side. The third traveler contributes no knowledge of the road. He contributes redundancy against falsehood, which turns out to be its own kind of knowledge.

Consensus protocols are this story with clocks and signatures. Replicas exchange what they heard, not merely what they saw, because a traitor's contradiction is only visible on the second hop. Blockchains spend real money to make the third traveler expensive to corrupt. Safety critical systems you already trust run voters like the guide, quietly, every frame.

The bound has edges, and the parable hides them. It assumes messages eventually arrive, so a desert with no dawn breaks it. Signatures change the game, because a signed lie cannot be told twice to different ears. And real systems add timeouts, which convert a liar into a silence, and silences are easier to count. *(A node that says nothing is at least consistent.)*

<p class="ep-essay__signoff"><em>On the arithmetic of trust.</em></p>
<p class="ep-essay__sources">Further reading: <a href="https://doi.org/10.1145/357172.357176">Lamport, L., Shostak, R. and Pease, M., <em>The Byzantine Generals Problem</em> (ACM Transactions on Programming Languages and Systems, 1982)</a>.</p>
  </div>
</article>

<div class="ep-essay__divider" aria-hidden="true">✦</div>

<article class="ep-essay" id="the-library-that-read-itself">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Evaluation · Self-reference</span>
    <h2 class="ep-essay__title">The Library That Read Itself</h2>
  </header>
  <figure class="ep-essay__figure">
    <img src="/images/essays/library.jpg" alt="An old library reading room at night, an open ledger catalog covered in handwritten marginal notes under a green lamp" width="1280" height="853" loading="lazy" decoding="async">
  </figure>
  <div class="ep-essay__body" markdown="1">

The library of a small university appoints its catalog the judge of its books. The catalog is thorough. It reads each volume and writes a verdict in the margin: sound, unsound, sound but dull. Students trust the margins. Faculty trust the margins. For a decade the margins are, by every internal measure, correct.

Then the catalog is asked to judge the catalog. It reads itself and writes, in its own margin: *sound*. The head librarian finds this amusing rather than alarming, until she asks the catalog to judge last year's catalog. It writes: *sound*, because last year's catalog says this year's is sound, and this year's catalog has read last year's. Every verdict in the building is now a verdict by the building. The margins have not become wrong. They have become unfalsifiable.

A visiting scholar notices within a week. She brings a crate of one hundred books from another country, each with an answer key the library has never seen: proofs with planted errors, histories with planted dates, recipes with planted poison. The catalog reads them and scores ninety correctly and ten wrongly, and for the first time in its life the library learns something about itself from outside itself. The ten wrong verdicts become the most cited document in the building.

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

Machine learning built this library recently and calls it evaluation. Models grade models; models grade their own outputs; a model's confidence is read as a model's correctness. The failure the librarian laughed at has a measured name: evaluators recognize and favor their own generations, and judges inherit the blind spots of the judged. A system asked to certify itself will usually certify itself, not because it is dishonest but because the circle has no opening.

The repair is never a smarter judge inside the circle. It is an anchor outside it: held-out data with known answers, tasks whose results can be checked by running them, human audits on a sample, a second system built by different hands. The same discipline appears across trustworthy machine learning. Proof-of-learning asks for checkpoints committed before the verifier chooses what to check, so the trainer cannot grade his own exam. Watermark verification reads marks the model cannot narrate away. In each case the certificate is worth something because the certified party did not get to write it.

Outside anchors have their own weather. Benchmarks leak into training sets; judges drift; answer keys age. The point is not infallibility. It is that the circle gets broken somewhere, on purpose, by someone who writes down where.

<p class="ep-essay__signoff"><em>On judges who are also defendants.</em></p>
<p class="ep-essay__sources">Further reading: <a href="https://arxiv.org/abs/2306.05685">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em> (2023)</a>; <a href="https://arxiv.org/abs/2404.13076">Panickssery et al., <em>LLM Evaluators Recognize and Favor Their Own Generations</em> (2024)</a>.</p>
  </div>
</article>

<p class="ep-essay__more">
  The shelf is quiet for now. New pieces land here when they are ready, never before.
</p>
