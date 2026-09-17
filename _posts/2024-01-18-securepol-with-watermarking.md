---
categories: technical
permalink: /blog/securepol-with-watermarking
title: "SecurePoL with Watermarking: The Jupyter Notebook Suite Behind Three IEEE Access Papers and a European FFS Deployment"
seo_title: "SecurePoL Watermarking IEEE Access Code Repository"
date: 2024-01-18
description: "The official repository of Jupyter notebooks implementing the three watermarking strategies compared across the SecurePoL line of work, with the measured spoofing-resistance numbers reported in the IEEE Access 2024 and 2025 papers and the 2025 Embry-Riddle doctoral dissertation."
header:
  og_image: "lab-og/og-pol.png"
---
This is the code repository and living documentation for the **SecurePoL dual-layer verification framework**: the combination of Proof-of-Learning training-trajectory verification with three orthogonal model watermarking strategies, published across two IEEE Access papers (2024 and 2025), a 2025 Embry-Riddle doctoral dissertation, and deployed in 2025-2026 as the checkpoint-verification layer inside a European flight-simulator vendor's AI-assisted instructor-evaluation pipeline.

The dissertation write-up lives at [Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking](/publication/2025-dissertation). The peer-reviewed publications are:
1. [*Enhancing Security of Proof-of-Learning against Spoofing Attacks using Feature-Based Model Watermarking*](/publication/2024-ieee-access-watermarking) (IEEE Access 2024, first instantiation of the feature-based mark).
2. [*SecurePoL: Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks*](/publication/2025-secureproofoflearning) (IEEE Access 2025, full three-strategy framework with full measured cost table).

The notebooks are on GitHub: [github.com/ozgurural/SecurePoL-with-Watermarking](https://github.com/ozgurural/SecurePoL-with-Watermarking). The [watermarking lab film](/lab/watermarking-comparison/) animates why each strategy falls to a different class of attacker.

## The Three Watermarking Strategies Implemented

The repository compares three watermarking strategies, not one, because the threat model for spoofed Proof-of-Learning checkpoints has three distinct attacker capabilities. Each strategy targets a different point in the training pipeline:

| Strategy name | Notebook entry point | Where the mark lives | Survivability profile | Baseline accuracy cost (ResNet-20, CIFAR-10) |
|---|---|---|---|---|
| **Feature-based trigger watermarking** | `01_feature_based_watermark.ipynb` | Internal activation statistics of penultimate feature layer | Survives 40% structured pruning; survives transfer learning and ordinary fine-tuning | +0.00 pp (no measurable drop) |
| **Sparse parameter perturbation** | `02_sparse_parameter_watermark.ipynb` | L0-regularized sparse delta on the convolutional weight tensors | Survives quantization to INT8; falls to full retraining from random init | +0.03 pp |
| **Non-intrusive auxiliary head** | `03_auxiliary_head_watermark.ipynb` | A small, frozen auxiliary classifier head attached after layer 13 | Robust to fine-tuning of the base; falls to head-pruning attacks | +0.58 pp |

The three-strategy comparison is the substantive contribution of the 2025 SecurePoL paper. The 2024 paper evaluated only the feature-based strategy; the 2024-2025 repository extends that comparison to all three and, crucially, evaluates them *jointly with Proof-of-Learning trajectory verification*, not as standalone ownership marks.

## The Four Spoofing Attack Baselines Reproduced

A watermarking repository is only useful if the attacker it claims to defeat has been reproduced and measured. The repository ships with four working reference attacks, kept on a separate `attack-reference/` branch so defensive experiments never silently use a broken attacker:

1. **Blindfold Top-Q gradient reconstruction.** The attacker reconstructs a training trajectory by sampling the top-Q loss gradients from a held-out surrogate set, without ever seeing the legitimate training data. This is the headline attack from the original 2021 Proof-of-Learning paper.
2. **Infinitesimal-update tolerance drift.** The attacker walks each checkpoint by sub-tolerance steps, one epoch at a time, so every individual batch passes the plain PoL tolerance check but the final model has drifted by 2.4% in feature-space angular distance.
3. **Surrogate-training watermark approximation.** The attacker fine-tunes the stolen final weights on a public surrogate dataset to approximate the feature-layer signature without holding the embedding key.
4. **Transfer-learning repackaging.** The attacker strips the auxiliary classification head and re-packages the base feature extractor as part of a different model family, hoping the ownership mark is confined to the head's classification layer.

Running all four attacks against the three strategies on a single NVIDIA A10G takes ~9 hours. The repository's `run_all.sh` script produces the same measurement table published in the IEEE Access 2025 paper, with standard deviations over 12 independent runs.

## Measured Spoofing-Resistance Numbers

The repository's headlined results, as reported in the 2025 SecurePoL paper, are:

| Attack | Plain PoL success rate | SecurePoL (any one mark) success rate | SecurePoL (all three marks required) success rate |
|---|---|---|---|
| Blindfold Top-Q (CIFAR-10, ResNet-20) | 42.8% of runs | < 10E-5 | < 10E-6 |
| Infinitesimal-update tolerance drift | 38.1% of runs | 1.4% of runs | < 10E-6 |
| Surrogate-training watermark approximation | Not applicable (no mark) | 3.8% of runs | 0.2% of runs |
| Transfer-learning head-pruning | Not applicable | 6.2% of runs | 0.0% of runs |

The "all three marks required" column is the configuration that ships in the European flight-simulator vendor's 2025 AI-assisted instructor-evaluation pipeline. The A10G inference-time cost per checkpoint verification is 0.6% overhead for feature-only verification, up to 17.3% for the three-mark auxiliary-head path, and proof logs stay under 12 MB each.

## How the Repository Is Used Beyond the Lab

The repository is not an academic artefact frozen at submission time. It has three active users in 2026:

1. **European flight-simulator vendor, 2025-present.** The `01_feature_based_watermark.ipynb` inference code (not the training code) is compiled into a C++ service that verifies every instructor-evaluation model checkpoint before it is loaded into a Level-D qualified simulator host.
2. **ERAU CASE Center Undergraduate Research Program, 2024-2025 cohort.** The four reference attacks on the `attack-reference/` branch are used as the lab practical for the CASE 417 ML Security course. Undergrads who successfully reproduce the 2024 feature-based paper's numbers get co-authorship credit on follow-on workshop submissions.
3. **Low-resource Turkish CTI feed, 2025.** The same repository's `02_sparse_parameter_watermark.ipynb` notebook was adapted, in 2025, to watermark entity-extractor models used in a European MSSP's Turkish-language threat-intelligence pipeline. This is a cross-domain reuse that was never planned at submission time; the sparse-parameter strategy turned out to work equally well for Turkish BERT-sized transformers as it did for CIFAR-10 ResNet-20s.

## Running the Notebooks

The repository's README contains exact environment pinning. The short version:
- Python 3.11.7, PyTorch 2.2.1, CUDA 12.1 on an A10G or equivalent.
- `pip install -r requirements.lock` to reproduce the exact dependency hashes used for the 2025 paper submission.
- `./run_all.sh attacks defenses metrics` to regenerate the measurement table from scratch.
- `./run_all.sh lab-figures` to output the exact figures used in the three IEEE Access papers and the dissertation, with identical seed values.

## Why This Repository Structure Has Held Up For Three Years

Every paper submission repository looks clean the day it is uploaded to arXiv. What matters is whether the structure survives a new attacker, a new code reviewer, and a production deployment three years later.

The SecurePoL repository survived all three because of two structural decisions that are not visible in the notebook filenames:
1. **Attacks and defenses are on separate git branches**, with a CI gate that re-runs the attack reference against the defense on every pull request. A new defensive commit that cannot defeat the *existing* reference attacker is rejected before it reaches main.
2. **Every measured table has a `generate_table.py` script, not a static CSV.** The 2024 paper's table, the 2025 paper's table, and the 2025 dissertation's appendix table are all generated by the same script; the numbers cannot drift between documents because there is only one source of truth.

Those two decisions are what let the code graduate from a lab prototype into a signed verification service inside a Level-D simulator deployment, without being rewritten.

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher and senior software engineer. The SecurePoL repository is the reference implementation used in three IEEE Access publications, a doctoral dissertation, two ERAU lab courses, and one regulated European aerospace deployment. Open to codebase-audit and integration engagements where measured spoofing-resistance of ML checkpoints is a delivery requirement.*
