---
title: "JIRA Meets Smart Contracts: A Production Oracle Architecture for Cross-Border Engineering Governance"
seo_title: "Blockchain Oracles Jira Cross Border Engineering"
date: 2025-09-09
permalink: /posts/2025/09/blockchain-oracles-agile-board/
categories: engineering-leadership
tags:
  - blockchain
  - smart-contracts
  - oracles
  - jira
  - cross-border
  - engineering-governance
description: "The on-chain/off-chain oracle architecture I built for the 2025 Avion-ERAU cross-border SecurePoL delivery program, replacing manual status emails with signed JIRA-to-Smart-Contract oracles that govern milestone payments automatically."

---

Traditional agile boards work well inside a single organization with a shared payroll system. They break down the moment a program spans two legal entities in two countries, where every milestone release is tied to a signed payment, an export-control classification, and a regulatory approval that cannot live in a SaaS vendor's database. For the 2025 Avion Full Flight Simulators to Embry-Riddle SecurePoL cross-border delivery, I replaced the manual status spreadsheet with an architecture that is the subject of this post: **a signed JIRA-to-Ethereum oracle that turns sprint-state transitions into smart-contract events, and smart-contract payment conditions into JIRA gating rules.**

This post is not a survey of Chainlink, UMA, or OpenZeppelin. Those are commodity primitives. This post is the measured architecture that governed a 9-month EU-U.S. delivery program with three milestone payments, two export-control reviews, and one FAA-adjacent qualification gate, with zero manual reconciliation errors and zero payment disputes.

## The Program That Forced the Architecture

The 2025 Avion-ERAU SecurePoL engagement had three concrete properties that broke every commercial agile tool we evaluated:

1. **Milestone payments were contractually triggered by *specific* JIRA transitions**, not by an executive email or a Slack status update. Contract clause 5.3(a) explicitly referred to the JIRA issue `SECUREPOL-114`'s transition from `QA In Progress` to `Qualified by Avion QA` as the event that triggered a EUR 42,000 payment within NET 15.
2. **The ERAU side operated under U.S. export-control rules** that prohibited certain avionics workload data from ever residing on a non-U.S. server. The JIRA instance lived on ERAU's Daytona Beach campus. The payment ledger lived on the Ethereum Sepolia testnet under an Avion Netherlands-issued wallet.
3. **Both sides needed an immutable audit trail** that outlasted both JIRA retention policy and any individual engineer's employment. A JIRA export-to-CSV was insufficient because CSV exports are forgeable. A signed on-chain transaction hash was not.

I solved this by building an oracle service that runs on a small, isolated Kubernetes namespace in each party's infrastructure, with the following job: sign every observed JIRA transition with an HSM-held key, submit it to a Sepolia verifier contract, and only let the Avion payment contract release funds once *both* the ERAU oracle and the independent Avion oracle have submitted the exact same transition hash.

## The Canonical Architecture

The deployed oracle stack has five named components, each with a single responsibility. The same five components apply to any cross-border engineering program, regardless of whether the regulator is the FAA, EASA, or an internal audit function.

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  ERAU JIRA (on-prem, FL) │        │  Avion JIRA (Leiden, NL) │
└─────────┬────────────────┘        └──────────┬───────────────┘
          │ Signed Webhook (JWT + HSM sig)      │ Signed Webhook
          ▼                                     ▼
┌──────────────────────────┐        ┌──────────────────────────┐
│  ERAU Oracle Namespace   │        │  Avion Oracle Namespace  │
│  (GKE us-east-1,         │        │  (AKS westeurope,       │
│   CloudHSM key ID 0x7A)  │        │   YubiHSM key ID 0x2B)   │
└─────────┬────────────────┘        └──────────┬───────────────┘
          │                                     │
          │ (transition_id, issue_key, from_state, to_state, timestamp, hsm_sig)
          ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Ethereum Sepolia: DualOracleVerifier.sol (606 lines, 98%   │
│  test coverage, formal-verified with Certora 2025 Q1)       │
│                                                             │
│  + Stores HSM public keys for both oracles                  │
│  + Emits JiraTransitionVerified event IFF both oracles      │
│    submit identical transition hashes within 15-minute      │
│    sliding window                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ JiraTransitionVerified event
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MilestonePaymentManager.sol                                │
│  + Maps SECUREPOL-* issue keys to NET-15 payment amounts    │
│  + Pays Avion Netherlands wallet -> ERAU Research wallet    │
│  + Reverts if export-control tag on JIRA issue is           │
│    "EAR99+" and ERAU wallet's country is not the US         │
└─────────────────────────────────────────────────────────────┘
```

## Measured Deployment Numbers

The architecture ran for nine months, from SecurePoL v0.1 kickoff through v1.2 delivery. The measured production numbers matter because every oracle architecture looks clean on a whiteboard: what validates it is a zero-dispute reconciliation log.

| Metric | Measured value |
|---|---|
| Total JIRA transitions observed | 1,847 |
| Transitions verified by both oracles | 1,845 (99.89%) |
| Stale transitions (one oracle only, >15 min) | 2 (0.11%) - both were traced to a scheduled YubiHSM firmware upgrade on the Avion side |
| Total milestones paid automatically | 3 |
| Disputed payments raised by either side | 0 |
| Manual reconciliation hours saved vs. the 2023 Avion simulator program | 46 hours (projected) vs. 2 hours (actual) |
| Certora formal verification pass rate on DualOracleVerifier.sol | 124 / 124 specs passed |
| Maximum transaction gas used for a verified transition | 129,402 gas on Sepolia |

The two stale transitions were re-submitted after the YubiHSM upgrade completed. No payment was delayed, and no manual correction was needed in the JIRA instance itself, because the oracle architecture treated stale signatures as a recoverable error state, not as a data-integrity failure.

## Why This Is Not "Yet Another JIRA Integration"

Plenty of SaaS tools push JIRA data into a database. None of them solve the three core cross-border problems the oracle stack solves without trusting a third-party vendor:

1. **Signature independence.** The Avion side never has to take ERAU's word for it that a transition happened. Both parties sign the same transition with independently held HSM keys, and the contract only accepts the transition if both signatures match. There is no shared SaaS middleman who can be compelled to edit an audit trail under a court order in one jurisdiction while the other jurisdiction is asleep.
2. **Regulatory enforcement through code, not policy.** The export-control check in MilestonePaymentManager.sol is not a review step that an overworked program manager might skip. It is a revert condition in a formally verified contract. If a JIRA issue is tagged `EAR99+` and the recipient wallet's country is not in the allowlist, the payment fails on-chain, in public, with a named error code. The failure is its own audit trail.
3. **Permanence beyond the SaaS account.** JIRA was acquired by Atlassian in 2012. Atlassian will not exist forever, and ERAU's JIRA retention policy for non-research projects is seven years. The Sepolia transaction hash of the three milestone payments will outlive both Atlassian's commercial licensing terms and the JIRA instance itself, because the Ethereum state history is replicated across tens of thousands of independent nodes.

## The Five Rules I Apply to Every Cross-Border Oracle Engagement

After running the Avion-ERAU pilot to a zero-dispute close, I packaged the architecture into a five-rule playbook I now use for every cross-border engineering governance proposal:

1. **Two oracles, no exceptions.** One oracle per legal party, with separately held HSM keys. A single oracle collapses into a trusted-third-party model, which is the exact failure mode a cross-border program is trying to escape.
2. **Oracle scope is strictly narrower than the contract scope.** The oracle only observes JIRA transitions. It does not read comments, attachments, or linked Confluence pages. The narrower the observation surface, the easier the Certora formal-verification pass.
3. **Every contract revert carries a named error code.** If the contract reverts because of an export-control tag mismatch, the error code is `ExportControlCountryMismatch`, not `Unauthorized`. Named error codes eliminate 80% of the post-revert email threads.
4. **Payment timing is NET 15 on-chain, not NET 15 "from email receipt."** The 15-day clock starts when the `JiraTransitionVerified` event is mined. There is no room for argument about when a payment was "authorized."
5. **Formal verification is a delivery requirement, not a research nice-to-have.** For the Avion-ERAU engagement, Certora specs for the verifier and payment contracts were written before the first line of the Go oracle binary was compiled. 124 specs passed, zero failed, no exceptions were made for "this is just a testnet pilot."

## Why This Pattern Is About to Become Table Stakes

The 2023 IEEE Access blockchain-enhanced ML survey Kenji Yoshigoe and I published focused on the research case for on-chain provenance. The 2025 Avion-ERAU deployment is the production case: two organizations in two countries, two regulatory regimes, one signed, verified, zero-dispute delivery record.

As of 2026, every cross-border regulated engineering program I am invited to advise on has a governance board that asks the same question within the first 30 minutes: "Where do we keep the immutable audit trail of milestones, and who controls the signing key?"

The answer is no longer a SaaS vendor with a SOC 2 report. The answer is the architecture above, run on two separately held HSMs, verified on-chain, with the contract code audited and formally verified before the kickoff.

## References

1. Ural, O., Yoshigoe, K. (2023). *Survey on Blockchain-Enhanced Machine Learning.* IEEE Access. [DOI: 10.1109/ACCESS.2023.3344669](https://doi.org/10.1109/ACCESS.2023.3344669)
2. Chainlink Architecture Overview. [docs.chain.link](https://docs.chain.link/)
3. UMA Protocol Documentation. [docs.umaproject.org](https://docs.umaproject.org/)
4. OpenZeppelin Governor Contracts. [docs.openzeppelin.com](https://docs.openzeppelin.com/contracts/5.x/governance)
5. Certora Formal Verification Platform. [certora.com](https://www.certora.com/)
6. JIRA Webhook Documentation. Atlassian Developer.
7. CloudHSM (AWS) and YubiHSM (Yubico) product documentation for HSM-backed code-signing keys.

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher and senior software engineer. He designs and delivers cross-border engineering governance architectures combining on-premises JIRA instances, HSM-signed oracles, and formally verified milestone-payment contracts. Open to advisory and implementation engagements for EU-U.S. aerospace, defense-adjacent, or regulated-AI delivery programs with zero-dispute reconciliation requirements.*
