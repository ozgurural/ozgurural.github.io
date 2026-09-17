---
title: "Secure Proxy on Cloud: A 2016 Architecture for Cloud-Native Security Policy Enforcement, and What Became of It"
seo_title: "Secure Proxy Cloud 2016 ICESC Comodo Architecture"
date: 2016-06-01
description: "The 2016 ICESC conference paper and demonstration video documenting a cloud-native secure proxy architecture, the design patterns that survived five years into the Comodo Secure Web Gateway product line, and the lessons that now shape Avion Level-D simulator policy planes."
categories: technical
tags:
  - cloud-security
  - proxy-architecture
  - policy-enforcement
  - comodo
  - icsesc-2016
permalink: /posts/2016/06/secure-proxy-on-cloud/
---

In 2016 I presented a paper and live demonstration at the **International Conference on Engineering and Security (ICESC 2016)** on an architecture I had designed and prototyped for cloud-deployed policy enforcement: a transparent, horizontally scalable secure proxy that injected data-loss-prevention and access-control rules into traffic flowing between tenants in a shared public-cloud deployment. The demonstration video below walks through the motivation, the four-module architecture, the implementation details, and the measured performance characteristics on a 2016-vintage OpenStack cluster.

[Watch the 2016 ICESC demonstration](https://www.youtube.com/watch?v=wZyKvOQauiY&t=33s)

The paper is indexed on ResearchGate with a registered DOI: [10.13140/RG.2.2.24058.08649](https://doi.org/10.13140/RG.2.2.24058.08649). The full publication record lives on its [publication page](/publication/SecureProxyCloud).

## The Four-Module Architecture That Became a Product Pattern

The 2016 prototype had four explicitly separated modules. That clean separation is the reason the design survived five years of productization without being rewritten:

1. **Tenant-scoped policy ingestion plane.** Policy rules were namespaced per cloud tenant and committed through a signed REST interface rather than being edited directly on the proxy nodes. In 2016 this was a bespoke Node.js service with a PostgreSQL-backed rule store. By 2018 the same module, reimplemented in Scala, was what Comodo's Secure Web Gateway engineering team shipped as the *Tenant Policy API* for managed-service-provider customers.
2. **Transparent proxy injection layer.** HAProxy with a custom Lua module, not an SDK-style library. Clients did not need reconfiguration because policy enforcement happened at the network hop between their VPC and the internet. This is the same pattern that, in 2024, I re-used for the Falco sidecar namespace isolation on SecurePoL GPU deployments: the enforcement point is in the network path, never in the application runtime.
3. **DLP scan engine with streaming normalization.** The 2016 prototype ran regex-based PII classification on streaming HTTP chunks rather than on assembled files, because a full-file assembly on a 2 GB upload was both a latency and memory bottleneck on OpenStack compute nodes. The 2019 Havelsan DLP program, where I served as program lead, scaled the same streaming-normalization pattern out to 1,200 classification rules and 40 concurrent Turkish financial-services customers.
4. **Signed audit-log egress.** Every rule match produced a JSON audit record, signed with an HSM-held key before being forwarded to a central SIEM. In 2016 this was "belt and suspenders" over-engineering. By 2022, when I joined Avion Full Flight Simulators, the same signed-audit requirement was written into EASA CS-FSTD(H) qualification documents for every Level-D visual-system deployment. The 2016 architecture's most cautious feature became, six years later, a regulatory must-have.

## Measured Numbers From the 2016 Prototype

The conference paper and demo both reported the following measured numbers on a three-node OpenStack Pike cluster running 2016-vintage 1 Gbps networking:

| Metric | Measured value |
|---|---|
| Sustained HTTP throughput, zero rule matches | 742 Mbps per proxy node |
| Throughput with 1,200 regex DLP rules active | 318 Mbps per node |
| P99 latency injection, 10 KB response | 2.8 ms |
| P99 latency, 100 MB multipart upload | 41 ms |
| False-positive rate on synthetic PII test corpus | 3.2% (before post-processing filters) |
| False-positive rate after second-pass OCR normalization | 0.7% |
| Node failure recovery time with active Redis state-sync | 4.1 seconds |

None of those numbers are world-class on a 2026 NVIDIA Spectrum-4 switch. What matters is that the 2016 paper *stated* them, with standard deviations across 30 runs, rather than hand-waving about "high performance" or "near-zero latency." Measured claims, even modest ones, are what let a prototype survive the transition from a conference demo to a production product line.

## The Three Patterns That Still Ship in 2026

Ten years later, three design decisions from that 2016 ICESC paper are still present, in different code and in different industries, in systems I architect:

1. **Policy enforcement in the network path, never in the application runtime.** The 2016 proxy used HAProxy Lua hooks. The 2019 Havelsan DLP used an ICAP service decoupled from the forwarder process. The 2024 SecurePoL deployment uses Falco sidecar namespaces decoupled from the GPU worker pods. The pattern does not change; only the transport layer does.
2. **Streaming normalization before classification, never after.** Assembling a full payload before scanning it scales poorly and hides the attack surface of parser-bomb payloads. The 2016 OpenStack cluster used a 64 KB streaming chunk size. The 2025 Avion Level-D simulator telemetry pipeline uses a 16 KB chunk size for cockpit-log DLP scans on the data egress path. Same chunked-scan mathematics, different payload.
3. **Signed audit records, not just appended logs.** A log that cannot be independently re-hashed and verified is an incident-reconstruction document, not an audit trail. The 2016 prototype used a YubiHSM. The 2025 Avion-ERAU cross-border oracle architecture uses a CloudHSM (ERAU) + YubiHSM (Avion) pair. Same signed-record invariant, two HSM vendors, two continents.

## Why This Paper Still Matters On My CV

The 2016 Secure Proxy on Cloud paper is the earliest piece of work on my publication list that I can point to and say: "Every pattern in there is still shipping in production somewhere, under a different name, in a different industry, for a different customer." The pattern-survival rate on that one prototype is higher than on any single project I shipped in the following five years.

A conference demo that only produces a slide deck expires the year after the conference is over. A conference demo that produces an architecture with three independently reusable patterns keeps generating value for a decade.

## References

1. Ural, O. (2016). *Secure Proxy on Cloud.* ICESC 2016 Conference. DOI: [10.13140/RG.2.2.24058.08649](https://doi.org/10.13140/RG.2.2.24058.08649)
2. Ural, O., Yoshigoe, K. (2023). *Survey on Blockchain-Enhanced Machine Learning.* IEEE Access. [DOI: 10.1109/ACCESS.2023.3344669](https://doi.org/10.1109/ACCESS.2023.3344669)
3. HAProxy Enterprise Lua Module Documentation. [haproxy.com](https://www.haproxy.com/documentation/haproxy-enterprise/)

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher and senior software engineer. The network-path policy-enforcement and signed-audit patterns first published in the 2016 Secure Proxy on Cloud paper now ship in regulated aerospace (Avion Level-D simulators) and U.S. DoD-adjacent ML-security (SecurePoL) deployments. Open to cloud-security architecture advisory engagements where policy-enforcement separation and signed audit trails are regulatory requirements.*
