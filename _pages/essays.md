---
permalink: /essays/
title: "Essays"
excerpt: "Slow, indirect writing about machine learning, security, and the systems we are quietly building."
---

<p class="ep-lead">
  Slow, indirect writing on the ideas behind my research — proof-of-learning, watermarking, adversarial machine learning, the quiet drift of distributed systems. Each piece is a small parable. They argue by example rather than by exposition; meaning is meant to gather behind the eyes after the page is closed.
</p>

<p class="ep-lead ep-lead--secondary">
  Read at the speed of a long walk. Approximately one essay every couple of months. Suggestions, corrections, or arguments are very welcome — <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=essay-feedback&amp;title=Essay+feedback">open an issue</a> or <a href="mailto:drozgurural@gmail.com">write me</a>.
</p>

<article class="ep-essay" id="watchmakers-trial">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Provenance · Machine learning</span>
    <h2 class="ep-essay__title">The Watchmaker's Trial</h2>
  </header>
  <div class="ep-essay__body" markdown="1">

There is a story they tell in Antwerp, though no one will say where they heard it first.

A watchmaker is brought before the magistrate. Her accuser, a young apprentice from a rival shop, claims the design of a particular tourbillon as his own. The watchmaker insists she designed it during a long winter, working alone. She has the watch. The apprentice has only sketches — but the sketches predate the watch, and the design is identical.

The magistrate, who is fond of clean problems, asks each of them to produce the artifact. The apprentice cannot — he says he never had the time to build it. The watchmaker shows hers. The magistrate then asks: how do we know you built this, and didn't simply find a watch matching his sketches?

*In a less generous court the case ends here. The watchmaker has the artifact; the apprentice has only ideas. But the magistrate is patient.*

The watchmaker thinks for a moment, then asks for the watch back. She opens it. Inside, alongside the gears and springs, are tiny scratches — too small to be defects, too distributed to be ornaments. *These*, she says, *are my marks. I make them when I rough-cut the bridge plates. They are not part of the design — they are part of how I work. The pattern is not in any sketch. If the apprentice did not see me work, he could not have predicted them.*

The apprentice goes pale. The case ends.

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

The story is older than it sounds. We tell ourselves it is about provenance — about how to prove a thing was made by you and not someone else. But the deeper question is about the *process* leaving signatures the *output* cannot fake. The watch by itself proves nothing; the watch with the scratches proves the watchmaker.

In machine learning, this question is no longer hypothetical. A trained model is, by all visible measures, just an artifact: a tensor of weights. Two parties can produce identical-looking models by entirely different paths. One trained the model honestly, over weeks, with electricity she paid for. The other downloaded it and republished it under a new name. By inspecting the weights alone, you cannot distinguish them. The watch tells you nothing about the watchmaker.

So we do what the watchmaker did: we leave scratches. *Proof-of-learning* protocols ask the trainer to commit to checkpoints during training, alongside randomness anyone can sample later. A verifier picks a few checkpoints, replays the protocol forward, and confirms — yes, this trainer was here, at this hour, pulling these levers. *(It is exactly as glamorous as it sounds.)*

But proof-of-learning has its own tourbillon problem. A clever forger can sometimes fake checkpoints — produce scratches that *look* like real work without doing the work. So we add a second layer: tiny perturbations to the model's behaviour, embedded at certain known input cells. *Watermarks*, of a kind. The honest trainer carries them naturally; the forger has to know exactly where to introduce them, and any large attempt to remove them deforms the model in ways the verifier can still detect.

It is, when you look at it, the same story the magistrate heard. The artifact is never enough. You always need the marks.

<p class="ep-essay__signoff"><em>— Notes for a paper I am still writing.</em></p>
  </div>
</article>

<div class="ep-essay__divider" aria-hidden="true">✦</div>

<article class="ep-essay" id="what-the-camera-saw">
  <header class="ep-essay__header">
    <span class="ep-eyebrow">Adversarial examples · Perception</span>
    <h2 class="ep-essay__title">What the Camera Saw</h2>
  </header>
  <div class="ep-essay__body" markdown="1">

A photographer, in a mountain village where photography has not yet arrived, takes a portrait of the village elder.

She develops it that evening in a tent. The elder comes to see the result. He examines the print for a long time. *This is not me*, he says, finally. *This is what light bouncing off me did to a chemical.*

The photographer is, briefly, unsettled. Then she explains the chain: the lens collected light, the film captured a pattern, the chemicals fixed the pattern into a stable object. *Yes*, says the elder. *That is what I said. It is what light did to a chemical.*

*(We will return to this conversation.)*

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

Some years later, the photographer's grandson teaches a computer to recognise cats. He shows it photographs and labels until, by some statistical alchemy, it learns: yes, this is a cat; no, this is a goat. He is delighted. The model — which is to say the program, which is to say *what light has done to silicon* — can apparently see.

Then, one afternoon, an adversary comes by. The adversary takes a photograph of a panda — clearly, undeniably, even to a child, a panda — and adds to it a film of noise. The noise is too faint for human eyes; you cannot tell the difference. The grandson's program, presented with the modified panda, declares it a school bus. With great confidence.

The grandson runs the experiment again. School bus. Again. School bus.

He thinks at first there is a bug, and looks for one for a long time. Eventually he is forced to a different conclusion: there is no bug. The program has worked exactly as designed. It has reported, faithfully, what light did to silicon — and it turns out that what light did to silicon, after the noise was added, looked very much like what a school bus does to silicon, and not very much at all like what a panda does to silicon. The adversary has not changed the panda. He has changed the silicon's *idea* of a panda.

The grandson does what every researcher does when an unsettling result appears: he writes a paper. He calls these things *adversarial examples*. He proposes defences, none of which work very well. Other people propose other defences. Some hold up; some don't. The field becomes a small history of moves and counter-moves, like a chess opening that nobody actually wanted to play.

*(Somewhere in the village, the elder is patient. He has been waiting his entire life for the rest of the world to catch up to a remark he made in his thirties.)*

<div class="ep-essay__rule" aria-hidden="true">⋯</div>

The thing the elder understood — and the thing the field is still slowly understanding — is that what a model *sees* is not the world. It is a fixed transform of measurements made on the world. A perfectly trained model is still only a perfectly faithful description of *what the measurements did*, not what the world *was*. When the inputs are subtly twisted in ways the training data never visited, the model has nothing intelligent to fall back on. It does not know — because nothing has ever taught it to know — that pandas and school buses live in different conceptual neighbourhoods.

The world is a panda. The model is what light did to a chemical. Sometimes — surprisingly often — those are the same. But they are not the same thing.

<p class="ep-essay__signoff"><em>— On photography, school buses, and the limits of measurement.</em></p>
  </div>
</article>

<p class="ep-essay__more">
  More pieces are slowly in progress: a vault without a door, three travelers in a desert, the library that read itself. They land here when they're ready, never before.
</p>
