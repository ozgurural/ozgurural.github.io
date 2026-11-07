---
title: "Proof of Learning: Building Trust in Future Machine Learning"
seo_title: "Proof of Learning: Building Trust"
date: 2025-09-09
permalink: /posts/2025/09/proof-of-learning-future/
categories: technical
tags:
  - proof-of-learning
  - security
  - machine-learning
description: "Proof of Learning (PoL) proposes a record of training that others can re-check. Its robustness is contested, which is why my work adds a second, independent check."

header:
  og_image: "lab-og/og-pol.png"
---

Proof of Learning (PoL) proposes a record of the training process that others can re-check, so that a party can show it trained a model rather than copied one. Its robustness is contested: Fang et al. (IEEE EuroS&P 2023) show that current PoL verification can be spoofed and argue that a provably robust version needs a better understanding of deep-learning optimisation. That is why my work does not rely on the training record alone.

## Why PoL Matters in Practice

1. **Model provenance:** PoL aims to link a model to the training process that produced it, which would deter plagiarism and unauthorized reuse. That matters, for example, to a buyer comparing model vendors who needs evidence that a model is not a repackaged public checkpoint.
2. **Regulatory compliance:** Governments and industries are moving toward regulations that demand auditable machine learning pipelines.
3. **Economic incentives:** Integrating PoL with blockchain allows useful training work to replace wasteful mining computations [5].

## What Our Research Adds

Our research explores model watermarking to protect PoL against spoofing attacks. Feature-based watermarking embeds an ownership mark during training, so a forged training record must also reproduce a mark the forger never embedded; against the attacks we tested this raises the cost of forgery, without making it impossible [1]. The dissertation extends these findings and offers deployment guidelines for secure PoL pipelines [2], while earlier survey work examines how blockchain mechanisms complement PoL in decentralized learning environments [3].

## Future Outlook

Emerging blockchain protocols employ PoL as a form of Proof-of-Useful-Work, proposing that verifiable training could help secure decentralized networks while advancing machine learning [4,5]. I expect the next wave of projects to pair PoL attestations with lightweight compliance dashboards so that technical and policy stakeholders share the same view of model lineage. If its robustness can be established, verifiable training could underpin open model markets, verifiable federated learning, and energy-efficient consensus systems.

## References

[1] Dr. Ozgur Ural and Yoshigoe, K. (2024). *Enhancing Security of Proof-of-Learning Against Spoofing Attacks Using Feature-Based Model Watermarking*. IEEE Access.
[2] Dr. Ozgur Ural (2025). *Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking*. Doctoral Dissertation, Embry-Riddle Aeronautical University.
[3] Dr. Ozgur Ural and Yoshigoe, K. (2023). *Survey on Blockchain-Enhanced Machine Learning*. IEEE Access.
[4] Lan, Y., Liu, Y., and Li, B. (2020). *Proof of Learning (PoLe): Empowering Machine Learning with Consensus Building on Blockchains*. arXiv:2007.15145.
[5] Zhao, Z., Fang, Z., Wang, X., Chen, X., Su, H., Xiao, H., and Zhou, Y. (2024). *Proof-of-Learning with Incentive Security*. arXiv:2404.09005.
