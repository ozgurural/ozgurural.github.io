---
title: "An Experiment with AI Music Generation"
date: 2026-06-17
permalink: /posts/2026/06/ai-music-generation/
categories: technical
description: "An unedited AI-generated music sample, with questions about listening quality, evaluation, and provenance."
tags:
  - ai
  - Generative Models
  - Music
header:
  og_image: "lab-og/og-gd.png"
---

I experimented with AI music generation by providing structural prompts and listening to the result. The unedited track below is a sample from that experiment.

<div style="display: flex; justify-content: center; margin: 2rem 0;">
  <iframe src="https://www.youtube-nocookie.com/embed/uL5CJdqNCYQ" title="AI-generated music experiment" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; max-width: 500px; aspect-ratio: 1 / 1; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.2);"></iframe>
</div>

A listening example can show what a particular output sounds like. It cannot establish how the model was trained, whether its outputs are consistently original, or how reliable it is across prompts.

## Questions for a more systematic evaluation

I would separate listening quality from provenance. An evaluation could examine whether the piece follows the requested structure, remains coherent over its duration, and contains audible artifacts. A provenance investigation would need separate evidence about the model, its inputs, and any watermarking method.

My [doctoral research](/publication/2025-dissertation) examines Proof-of-Learning and model watermarking. Applying related ideas to generated audio would require a new method and experiments specific to audio.

**Open research direction of the author, not yet published.** No audio-watermark benchmark or deployment result is reported here.
