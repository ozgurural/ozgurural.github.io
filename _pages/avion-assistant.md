---
permalink: /projects/avion-assistant/
title: "Avion Assistant"
description: "A RAG assistant for engineering documents that Dr. Ozgur Ural designed and built alone at Avion: cited answers, release checks and a governed data boundary."
---

<p class="ep-lead">Engineers at Avion ask the company's own documents a question in plain English and get an answer with its sources one click away: retrieval-augmented generation (RAG), built so that every answer can be checked. I designed and built it alone, from the first commit in September 2026: the ingestion, the search, the answering service, the interface, the deployment and the checks that keep it working. It is a proof of concept, in use by colleagues.</p>

<p><strong>Slides:</strong> <a href="/projects/avion-assistant/slides/">the presentation I gave inside the company</a>, with company details removed: names made generic, counts and addresses taken out, screens blurred. Click or press the right arrow for each step.</p>

<p><em>This page describes my role, the architecture and the engineering practice. It discloses no document, customer, model, hardware or security specifics of the company.</em></p>

## The problem

The answer to most engineering questions is already written down, spread over file shares in six formats, some of it scanned paper that no search can read. Finding it takes longer than knowing it. An assistant is only useful there if an engineer can check every answer against its page, and only acceptable if the company's documents stay where they are allowed to be.

## How it answers

<a href="/images/diagrams/avion-assistant.svg" title="Open the diagram at full size"><img src="/images/diagrams/avion-assistant.svg" alt="Documents are read, cleaned, checked for credentials, split by headings and indexed with a meaning vector and a keyword vector each. A question goes through hybrid search and reranking to five passages; a governance gateway decides whether they may leave the company. Restricted content is answered by a local model, public content may go to a hosted model. The answer is streamed with sources first and every claim cited. A ledger keeps every question, model call and rating." width="760" height="660" loading="lazy" decoding="async"></a>

- **Two searches, because neither is enough alone.** Engineering documents are full of identifiers: requirement numbers, part numbers, server names. Two requirement IDs that differ in one digit sit almost on top of each other in an embedding space, which is exactly wrong when that digit is the point. Each passage therefore carries a meaning vector and a keyword (BM25) vector, and the two rankings are fused by rank.
- **Five passages that answer, not five that resemble the question.** A cross-encoder reads each candidate against the question and keeps five. For the questions everyone tries first, passages checked by hand are placed first and marked as verified.
- **Sources before the answer.** The five source cards appear before the first word of the answer; the answer streams in with numbered citations, and a click opens the original page beside the conversation with the passage highlighted. A "not indexed" list names every file left out, and why.
- **Somebody always answers.** When one model is busy or out of quota, the next one answers.
- **What leaves the building.** Documents, the index, search and reranking stay on company machines. Files that contain credentials have them removed before indexing, or are held back. Only a question and five passages may go to a hosted model. On the lab deployment the governance gateway below decides whether they may, and restricted content is answered by a local model and marked as such.

The stack: Python, FastAPI and an embedded Qdrant index on the server, embeddings and reranking on CPU through ONNX Runtime, BM25, a SQLite ledger, and a SvelteKit and TypeScript interface served from the same port, so there is nothing to install.

## Measured, not assumed

Most of what made the retrieval good came from measuring things that looked fine. Nothing below was visible as an error.

- **The embedding model was reading less than half of every passage.** Embedding a long passage, then only its first *n* characters, shows where the two vectors become identical: everything after that point is ignored. The first model stopped at about 700 characters, and passages were 1,500. Semantic search had only ever seen the opening of each passage; the keyword search, which reads all of it, had been covering for it. The fix was a model that reads about 3,100 characters, at a third of the size and with the same vector length, so the index kept its shape.
- **Parallel embedding had never run.** The setting meant "all cores" when it was 0, and the code tested it as true or false, so every ingestion the project had run was single-process. A benchmark had reported a 1.75 times speed-up for that setting, but its input was smaller than one batch, so there was nothing to split: it was measuring nothing. Re-measured on real passages, multiprocessing lost outright, and the gain that held up was threading inside one process.
- **Retrieval is an evaluation, not an impression.** A fixed set of questions with the document that must come first; on the release that brought the reranking, the right document came first for 12 of 12 questions, against 9 of 12 before, under stricter expectations than the earlier run used.

## Shipping without breaking it

Colleagues use it every day, so the live service has to keep working through every change. New behaviour ships behind a setting that is off by default. Each deploy asks the new build the questions that must always work, each with the source it must cite and the fact its answer must contain; if a question loses its source, the deploy rolls itself back. A model answer missing its fact is reported but does not roll back on its own, because a hosted model being rate limited is no reason to take a working build down. The four suggested questions on the start screen once stopped working without any change aimed at them, which is why this gate exists.

## Feedback is evidence, not instruction

Of the first twenty ratings, four came with a note, and every fix that survived review came from one of those four; two ratings contradicted each other on the same answer. A loop that optimised agreement with ratings would have optimised against noise and reported its own metric improving. So a reported answer is replayed against every new build, and its status is measured, never ticked: a question that starts returning the complained-about source again shows as regressed, and the check fails loudly.

Explained complaints are judged against the documents by a model that sees only the retrieved passages, never its own knowledge, and no verdict is recorded without the quote it rests on, which is then checked against the retrieved text, since a model asked to copy a sentence will sometimes invent a plausible one. Run on the real reports, the judge was itself wrong once: the answer and the judge had each picked one row of a spreadsheet that could not answer the question. That is why the boundary is at the merge: the tooling triages, replays and proposes, and a person decides. The interface says "addressed", never "fixed".

## Governed autonomy (Avion-04)

The next step is assistants that act: agents that propose changes to engineering files. Whether that can be overseen in a way that is checkable afterwards is the question of Avion-04, *Development of autonomous engineering agents with verifiable oversight*, an R&amp;D project I prepared, architected and got approved under WBSO, the Dutch government's R&amp;D tax-credit programme. I am building it as a governance service under the agents; every screen a person uses stays inside the Assistant.

- **Admissibility.** For a proposed action on a given file version, the service answers proceed, human review or refuse, with its reasons and the evidence that is missing.
- **Approval bound to what the reviewer saw.** An approval is tied to a fingerprint of the state the reviewer looked at and authorises one execution; the decision is checked again at the moment of writing, by the only component that holds write access.
- **The outbound boundary.** Before a model call leaves the company, one gateway reads the restriction of every source in the request and refuses anything that is not public, with a local check for restricted text pasted in without its source. After a week in observe mode it has enforced the Assistant's model calls on the lab deployment since November 2026. If it cannot be reached, the call is logged and goes ahead: a proof-of-concept choice that keeps the service up, and one a production deployment would reverse.
- **Restore and impact.** When a file version is replaced or restored, the service lists which test results and approvals no longer apply.
- **A record that shows tampering.** Proposals, reviews, checks, approvals and outbound decisions are kept in a hash chain that can be verified.

The data is synthetic and the rules are first research designs, not reviewed decisions; no accuracy is claimed yet. Measuring the admissibility decisions needs reference decisions from an engineer who knows simulator qualification, and that review is the next step.

## Related

- [AI strategy and reference architecture](/enterprise-ai-architecture.html), the design this sits in, including the agents that are proposed rather than built.
- [Projects](/projects/), which separates published research, delivered software and proposals.
