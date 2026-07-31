---
title: "Survey on Blockchain-Enhanced Machine Learning"
collection: publications
category: manuscripts
permalink: /publication/2023-ieee-access-survey
excerpt: "Comprehensive survey of blockchain-enhanced machine learning: consensus-driven data provenance, federated learning on-chain, and incentive mechanisms across 120+ papers."
date: 2023-12-15
venue: "IEEE Access"
paperurl: "https://doi.org/10.1109/ACCESS.2023.3344669"
citation: "Ural, O. and Yoshigoe, K. (2023). Survey on Blockchain-Enhanced Machine Learning. IEEE Access, pp. 145331-145362. DOI: 10.1109/ACCESS.2023.3344669."
---

Machine learning has three problems a distributed ledger is unusually well suited to. Training data can be poisoned by contributors who still collect a reward. Models leak the data they were trained on. And a finished set of weights records nothing about what happened to it. This survey works through what a ledger actually buys in each case, and is deliberately balanced: it presents the limitations alongside the opportunities.

## What goes on the chain, and what does not

Recording every transaction tied to the training process makes tampering evident rather than invisible. The important detail is what stays off the chain. Raw data remains with its owner, while parameters, the transactions around them, and validation results are shared. That division is what makes the arrangement privacy-preserving rather than merely public.

It is also worth being precise about the guarantee. A record of the process is evidence of what happened. It is not a judgement of whether the data was any good, and that takes a separate mechanism.

## Consensus that trains instead of hashing

Proof of Work reaches agreement by making every participant hash until someone gets lucky, and that computation is worthless the moment it is spent. The survey reviews the alternatives that point the same electricity at something useful:

- **Proof of Learning** makes the training run itself the work that earns consensus.
- **Proof of Deep Learning** extends this to the integrity and authenticity of the resulting model.
- **Proof of Training Quality** asks the network to agree not merely that work happened, but that the contribution was good.

Each buys a trained model with the same energy, and each inherits one hard question in exchange: how do you verify the claimed work was actually performed?

## Paying for the improvement, not the volume

In the Sharing Updatable Model framework, a smart contract called CollaborativeTrainer accepts data, runs an incentive mechanism, and updates the model in one place. The prediction-market reward moves a contributor's balance by the improvement their data caused:

*b<sub>t</sub> = b<sub>t−1</sub> + L(h<sub>t−1</sub>, D) − L(h<sub>t</sub>, D)*

that is, the loss on a held-out set before the update minus the loss after it. Submit noise and the term is negative. A companion mechanism makes the stake real: deposit currency when submitting, receive a refund after a waiting period if the data holds up, and forfeit it when the model disagrees with the label. In simulation the honest and dishonest populations separate cleanly while accuracy is preserved.

## What the prototypes actually measured

The survey's most useful contribution is refusing to stop at the argument. **DeepChain** was built and measured as a Corda prototype trained on MNIST, with parties uploading local gradients and workers paid through a processing contract. Accuracy improves as more parties join, exactly as the argument predicts, but throughput falls as the gradient count grows and total training time climbs with every party added.

**LearningChain** shows the companion trade-off from another angle. Differential-privacy noise buys real privacy and costs real test accuracy, while an l-nearest aggregation rule blunts Byzantine workers rather than eliminating them.

## Where the seams are

The survey closes on challenges rather than on a promise: scalability, energy cost, and the need for consensus mechanisms designed for machine learning rather than inherited from cryptocurrency. One of those seams, verifying that a claimed training run really happened, became the subject of my [dissertation](/publication/2025-dissertation) and the [SecurePoL](/publication/2025-secureproofoflearning) paper.

There is an [animated explainer](/lab/blockchain-ml/) of this survey in the Research Lab.
