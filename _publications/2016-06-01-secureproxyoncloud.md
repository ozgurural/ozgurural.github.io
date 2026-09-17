---
title: "Secure Proxy on Cloud"
collection: publications
permalink: /publication/SecureProxyCloud
excerpt: '2016 ICESC conference paper and demonstration documenting a cloud-native four-module secure proxy architecture. The policy-enforcement separation, streaming-normalization, and signed-audit patterns first published here now ship in the 2018 Comodo Secure Web Gateway product line and in Avion Level-D simulator data-egress pipelines.'
date: 2016-06-01
venue: 'International Conference on Engineering and Security (ICESC 2016)'
paperurl: 'https://doi.org/10.13140/RG.2.2.24058.08649'
category: conferences
citation: 'Ural, O. (2016). Secure Proxy on Cloud. Proceedings of the International Conference on Engineering and Security (ICESC 2016). DOI: 10.13140/RG.2.2.24058.08649.'
---
This 2016 ICESC conference paper and accompanying live demonstration introduced a transparent, horizontally scalable secure proxy architecture for shared public-cloud deployments. It was the earliest standalone publication of the four-module policy-enforcement pattern that later, in refined and reimplemented form, became the *Tenant Policy API*, the *ICAP decoupled DLP engine*, and the *signed audit egress* module in the 2018 Comodo Secure Web Gateway product line. The same architectural separation now governs data-egress policy enforcement in Avion Full Flight Simulator deployments under EASA CS-FSTD(H) qualification rules.

[Full demonstration video and post](/posts/2016/06/secure-proxy-on-cloud/) | [Download paper](https://doi.org/10.13140/RG.2.2.24058.08649)

## The Four-Module Architecture
1. **Tenant-scoped policy ingestion plane.** Signed REST interface with PostgreSQL-backed rule store.
2. **Transparent proxy injection layer.** HAProxy with a custom Lua module; enforcement happens in the network path, never in application runtime.
3. **DLP scan engine with streaming normalization.** 64 KB chunked HTTP-stream regex classification; full-file assembly is never required.
4. **Signed audit-log egress.** HSM-signed JSON records forwarded to a central SIEM; every rule match is independently re-hashable and verifiable.

## Measured Prototype Results (OpenStack Pike, 1 Gbps)
- Sustained throughput with 1,200 active DLP rules: 318 Mbps per node
- P99 latency on 100 MB multipart upload: 41 ms
- Post-filter false-positive rate on PII corpus: 0.7%
- Node-failure recovery: 4.1 seconds with Redis state sync

The paper deliberately reports these modest measured numbers with standard deviations across 30 runs rather than relying on qualitative claims of "near-zero latency" or "high throughput." Measured, citable results are what allow a conference prototype to graduate, five years later, into a regulated aerospace data-egress pipeline.

## Where the Patterns Still Ship
The 2016 paper's three durable design decisions are present, in different code, in 2026 deployments I architect:
1. **Network-path enforcement (not in-app SDK).** 2016 proxy to 2019 Havelsan DLP ICAP to 2024 SecurePoL Falco sidecar namespaces.
2. **Streaming normalization before classification.** 2016 OpenStack 64 KB chunks to 2025 Avion simulator cockpit-log 16 KB chunks.
3. **HSM-signed verifiable audit records.** 2016 YubiHSM to 2025 Avion-ERAU cross-border CloudHSM plus YubiHSM pair.
