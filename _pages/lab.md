---
permalink: /lab/
title: "Lab"
excerpt: "Six short puzzles in distributed systems, cryptography, and machine learning security. Simple questions, sharp answers."
---

<p class="ep-lead">
  Six short puzzles at the intersection of distributed systems, cryptography, and ML security. The questions are deliberately simple. The right answers require knowing the field. Each wrong option is something a thoughtful but partially-informed person might pick — the explanations take all four answers seriously, so even if you don't know the area you may leave knowing more.
</p>

<p class="ep-lead ep-lead--secondary">
  No tracking, no scoreboard, no time limit. Pick an answer; the page tells you whether it was right and why every other option fails. <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Discuss or suggest one</a>.
</p>

<section class="lab-puzzle" id="puzzle-byzantine-3" data-correct="b">
  <span class="ep-eyebrow">Distributed systems · Byzantine faults</span>
  <h2>1 · The Faulty General</h2>
  <p class="lab-puzzle__scenario">
    Three generals — A, B, C — must agree on whether to attack or retreat. The communication channel is reliable: every message arrives undisturbed. But one of the three (you don't know which) is possibly a traitor — and a traitor can send arbitrary or contradictory messages to different recipients.
  </p>
  <p class="lab-puzzle__question">Can the three reach guaranteed consensus?</p>
  <div class="lab-puzzle__choices" role="radiogroup" aria-labelledby="puzzle-byzantine-3">
    <button class="lab-puzzle__choice" data-choice="a" type="button"><span class="lab-puzzle__letter">a</span><span>Yes — by simple majority vote.</span></button>
    <button class="lab-puzzle__choice" data-choice="b" type="button"><span class="lab-puzzle__letter">b</span><span>No — not in the worst case.</span></button>
    <button class="lab-puzzle__choice" data-choice="c" type="button"><span class="lab-puzzle__letter">c</span><span>Yes — by exchanging timestamped messages.</span></button>
    <button class="lab-puzzle__choice" data-choice="d" type="button"><span class="lab-puzzle__letter">d</span><span>Yes — but only if the traitor's identity is known beforehand.</span></button>
  </div>
  <div class="lab-puzzle__explain" hidden>
    <h3>Answer · (b) No, not in the worst case.</h3>
    <p>This is Lamport, Shostak &amp; Pease (1982). Byzantine consensus over plain (unauthenticated) channels requires <code>n ≥ 3f + 1</code> nodes to tolerate <code>f</code> faulty ones. Three generals can tolerate exactly <em>zero</em> Byzantine faults; you would need at least four.</p>
    <p class="lab-puzzle__why-not">Why the others fail</p>
    <ul>
      <li><strong>(a)</strong> Majority vote breaks when the traitor sends contradictory votes — "attack" to A, "retreat" to B. Each loyal general sees a tied tally and cannot tell which peer is the liar.</li>
      <li><strong>(c)</strong> Timestamps don't help: the traitor can lie about timestamps too. <em>Authenticated</em> Byzantine agreement (with unforgeable cryptographic signatures) does change the bound to <code>n ≥ f + 2</code>, so 3 generals can tolerate 1 Byzantine fault — but timestamps alone aren't authentication.</li>
      <li><strong>(d)</strong> Knowing the traitor's identity makes the problem trivial — you just ignore them. The hard problem is when you don't.</li>
    </ul>
  </div>
</section>

<section class="lab-puzzle" id="puzzle-2pc-block" data-correct="c">
  <span class="ep-eyebrow">Distributed systems · 2PC</span>
  <h2>2 · The Coordinator Goes Dark</h2>
  <p class="lab-puzzle__scenario">
    Three databases run a classic two-phase commit. The coordinator sends <code>PREPARE</code>; all three reply <code>YES</code>. Then the coordinator crashes before sending <code>COMMIT</code> or <code>ABORT</code>. The three databases are now waiting, holding row-level locks on the affected rows. What is the safe behaviour?
  </p>
  <p class="lab-puzzle__question">What can the participants safely do, on their own, without the coordinator?</p>
  <div class="lab-puzzle__choices" role="radiogroup">
    <button class="lab-puzzle__choice" data-choice="a" type="button"><span class="lab-puzzle__letter">a</span><span>Commit. Everyone voted YES, so the only consistent outcome is COMMIT.</span></button>
    <button class="lab-puzzle__choice" data-choice="b" type="button"><span class="lab-puzzle__letter">b</span><span>Abort. Without an explicit COMMIT message, default to abort.</span></button>
    <button class="lab-puzzle__choice" data-choice="c" type="button"><span class="lab-puzzle__letter">c</span><span>Wait — possibly indefinitely — until the coordinator recovers.</span></button>
    <button class="lab-puzzle__choice" data-choice="d" type="button"><span class="lab-puzzle__letter">d</span><span>Elect a new coordinator and re-run the protocol from PREPARE.</span></button>
  </div>
  <div class="lab-puzzle__explain" hidden>
    <h3>Answer · (c) Wait, indefinitely if necessary.</h3>
    <p>This is the famous <strong>blocking problem</strong> of 2PC. Even though all participants voted YES, none of them knows what the coordinator already did with those votes — for example, whether some other participant in a larger system has already received and acted on a COMMIT before the coordinator died. Until the coordinator (or its log) returns, neither committing nor aborting is safe.</p>
    <p class="lab-puzzle__why-not">Why the others fail</p>
    <ul>
      <li><strong>(a)</strong> "We all voted YES, so commit" risks divergence: the coordinator might have decided ABORT after collecting votes (e.g., on a timeout or local rule).</li>
      <li><strong>(b)</strong> Defaulting to abort is symmetric: maybe COMMIT was already sent to <em>some</em> participant we can't currently reach.</li>
      <li><strong>(d)</strong> A new coordinator inherits no knowledge of what the old one already sent. Three-Phase Commit and Paxos exist precisely to remove this blocking — they are <em>not</em> 2PC.</li>
    </ul>
  </div>
</section>

<section class="lab-puzzle" id="puzzle-commitment" data-correct="b">
  <span class="ep-eyebrow">Cryptography · Commitment schemes</span>
  <h2>3 · The Sealed Bid</h2>
  <p class="lab-puzzle__scenario">
    Alice is bidding in a sealed-bid auction. She must commit to her bid <em>now</em>, without revealing it; reveal it after the auction closes; and the auctioneer must be sure she cannot change her mind in between. Anyone should be able to verify the revealed bid matches the original commitment.
  </p>
  <p class="lab-puzzle__question">Which scheme satisfies all three properties?</p>
  <div class="lab-puzzle__choices" role="radiogroup">
    <button class="lab-puzzle__choice" data-choice="a" type="button"><span class="lab-puzzle__letter">a</span><span>Encrypt the bid with Alice's own public key. Reveal her private key later.</span></button>
    <button class="lab-puzzle__choice" data-choice="b" type="button"><span class="lab-puzzle__letter">b</span><span>Send <code>H(bid&nbsp;‖&nbsp;random_salt)</code>. Reveal both <code>bid</code> and <code>random_salt</code> later.</span></button>
    <button class="lab-puzzle__choice" data-choice="c" type="button"><span class="lab-puzzle__letter">c</span><span>Sign the bid with Alice's private key and publish the signature.</span></button>
    <button class="lab-puzzle__choice" data-choice="d" type="button"><span class="lab-puzzle__letter">d</span><span>Send <code>bid&nbsp;⊕&nbsp;random_pad</code>. Reveal the pad later.</span></button>
  </div>
  <div class="lab-puzzle__explain" hidden>
    <h3>Answer · (b) Hash with salt.</h3>
    <p>That's a textbook <strong>cryptographic commitment</strong>. The hash is</p>
    <ul>
      <li><strong>hiding</strong> — the function is one-way, and the salt prevents brute-forcing low-entropy bids;</li>
      <li><strong>binding</strong> — collision-resistance prevents Alice from finding a different (bid′, salt′) hashing to the same value.</li>
    </ul>
    <p class="lab-puzzle__why-not">Why the others fail</p>
    <ul>
      <li><strong>(a)</strong> Encrypting with your own key is reversible by you alone. You can re-decrypt and "reveal" any bid you like by claiming a different ciphertext. Not binding.</li>
      <li><strong>(c)</strong> Signing reveals the message — anyone with the public key can recover the bid from the signature. Not hiding.</li>
      <li><strong>(d)</strong> A one-time pad is perfectly hiding but <em>completely un-binding</em>. After the auction Alice can pick any pad′ such that <code>bid′&nbsp;⊕&nbsp;pad′</code> equals the published ciphertext — claiming any "bid" she wants.</li>
    </ul>
  </div>
</section>

<section class="lab-puzzle" id="puzzle-timing" data-correct="b">
  <span class="ep-eyebrow">Security · Side channels</span>
  <h2>4 · The Slow Equals Sign</h2>
  <p class="lab-puzzle__scenario">
    A web service checks passwords with <code>if (input == storedPassword) login()</code>. The library's string equality compares character by character, returning <code>false</code> on the first mismatch. Each character compared takes about ten nanoseconds. The service rate-limits to one attempt per second per IP.
  </p>
  <p class="lab-puzzle__question">What attack does this enable?</p>
  <div class="lab-puzzle__choices" role="radiogroup">
    <button class="lab-puzzle__choice" data-choice="a" type="button"><span class="lab-puzzle__letter">a</span><span>None — string equality is always safe.</span></button>
    <button class="lab-puzzle__choice" data-choice="b" type="button"><span class="lab-puzzle__letter">b</span><span>A timing attack: response latency leaks how many leading characters matched.</span></button>
    <button class="lab-puzzle__choice" data-choice="c" type="button"><span class="lab-puzzle__letter">c</span><span>A buffer overflow if <code>input</code> is longer than the stored password.</span></button>
    <button class="lab-puzzle__choice" data-choice="d" type="button"><span class="lab-puzzle__letter">d</span><span>SQL injection if <code>input</code> contains quotes.</span></button>
  </div>
  <div class="lab-puzzle__explain" hidden>
    <h3>Answer · (b) A timing attack.</h3>
    <p>A short-circuit comparison leaks: ~10 ns response means character 1 was wrong; ~20 ns means characters 1–2 matched and character 2 was wrong; and so on. Over millions of measurements the search collapses from exponential <code>O(charset<sup>n</sup>)</code> to linear <code>O(charset · n)</code> — even rate-limited at 1 attempt/sec, an 8-character lowercase password falls in days, not millennia.</p>
    <p>The fix is <strong>constant-time comparison</strong>: walk every character regardless of mismatch and OR-accumulate the result. Every serious crypto library exposes this primitive — <code>hmac.compare_digest</code>, <code>crypto/subtle.ConstantTimeCompare</code>, <code>CRYPTO_memcmp</code>.</p>
    <p class="lab-puzzle__why-not">Why the others fail</p>
    <ul>
      <li><strong>(a)</strong> Equality is "safe" only if you control the timing. As soon as the comparator's timing depends on the inputs, you have a side channel.</li>
      <li><strong>(c)</strong> Modern languages bounds-check string equality. This isn't a memory-safety issue.</li>
      <li><strong>(d)</strong> SQL injection requires query construction, not equality checking — different vulnerability class.</li>
    </ul>
  </div>
</section>

<section class="lab-puzzle" id="puzzle-adv-margin" data-correct="b">
  <span class="ep-eyebrow">ML security · Adversarial examples</span>
  <h2>5 · The 99.9% Classifier</h2>
  <p class="lab-puzzle__scenario">
    A vision model achieves 99.9% accuracy on the CIFAR-10 test set. Yet a researcher finds an adversarial example for <em>every</em> test image: adding noise of magnitude ε = 0.01 (imperceptible to a human eye) flips the predicted label.
  </p>
  <p class="lab-puzzle__question">How can both facts be true at once?</p>
  <div class="lab-puzzle__choices" role="radiogroup">
    <button class="lab-puzzle__choice" data-choice="a" type="button"><span class="lab-puzzle__letter">a</span><span>The model is overfitting — a regularisation issue.</span></button>
    <button class="lab-puzzle__choice" data-choice="b" type="button"><span class="lab-puzzle__letter">b</span><span>Test accuracy and adversarial robustness measure different geometries on the same model.</span></button>
    <button class="lab-puzzle__choice" data-choice="c" type="button"><span class="lab-puzzle__letter">c</span><span>The test set must have been contaminated with adversarial examples during evaluation.</span></button>
    <button class="lab-puzzle__choice" data-choice="d" type="button"><span class="lab-puzzle__letter">d</span><span>There is a numerical bug in the softmax layer.</span></button>
  </div>
  <div class="lab-puzzle__explain" hidden>
    <h3>Answer · (b) Different geometries.</h3>
    <p>A trained classifier carves the input space into decision regions. <strong>Test accuracy</strong> asks: do <em>natural</em> images land in the correct region? Yes, 99.9% of them do. <strong>Adversarial robustness</strong> asks something quite different: from any given natural image, how far do you have to travel before crossing a decision boundary? In high-dimensional input spaces those boundaries lie startlingly close to most natural points (Goodfellow, Shlens &amp; Szegedy, 2014). A barely-perceptible perturbation can cross one.</p>
    <p>Two different geometries on the same model. One looks excellent on a leaderboard. The other governs the security story.</p>
    <p class="lab-puzzle__why-not">Why the others fail</p>
    <ul>
      <li><strong>(a)</strong> Overfitting predicts <em>low</em> test accuracy. We have the opposite — the failure mode is structural, not statistical.</li>
      <li><strong>(c)</strong> Test contamination would degrade test accuracy, not preserve it.</li>
      <li><strong>(d)</strong> A softmax bug would break clean accuracy first, not adversarial robustness specifically.</li>
    </ul>
  </div>
</section>

<section class="lab-puzzle" id="puzzle-idempotent" data-correct="b">
  <span class="ep-eyebrow">Systems · Reliability</span>
  <h2>6 · The Retry</h2>
  <p class="lab-puzzle__scenario">
    An RPC client times out and retries. The server may have processed the original request, or it may not. The two parties cannot coordinate to find out.
  </p>
  <p class="lab-puzzle__question">Without an idempotency key or any other coordination, which operation is safe to retry blindly?</p>
  <div class="lab-puzzle__choices" role="radiogroup">
    <button class="lab-puzzle__choice" data-choice="a" type="button"><span class="lab-puzzle__letter">a</span><span><code>transfer(from, to, amount)</code> — debit one account, credit another.</span></button>
    <button class="lab-puzzle__choice" data-choice="b" type="button"><span class="lab-puzzle__letter">b</span><span><code>set(key, value)</code> — overwrite a key in a key-value store.</span></button>
    <button class="lab-puzzle__choice" data-choice="c" type="button"><span class="lab-puzzle__letter">c</span><span><code>append(key, value)</code> — append a value to a list.</span></button>
    <button class="lab-puzzle__choice" data-choice="d" type="button"><span class="lab-puzzle__letter">d</span><span><code>increment(key)</code> — atomically add 1 to a counter.</span></button>
  </div>
  <div class="lab-puzzle__explain" hidden>
    <h3>Answer · (b) <code>set</code>.</h3>
    <p><strong>Idempotent</strong> means: applying the operation twice has the same effect as applying it once. <code>set(k, v)</code> qualifies — writing the same value again is a no-op. The other three are <em>cumulative</em>: each duplicate retry produces a duplicate effect.</p>
    <p>Production systems wrap non-idempotent operations with <strong>idempotency keys</strong>: a client-generated unique ID; the server dedupes by it. Stripe's <code>Idempotency-Key</code> header, AWS's request IDs, and most well-built REST APIs use this pattern. The deeper takeaway is that pure-CRUD APIs (PUT, DELETE) are easier to make reliable than command-style APIs (POST <code>/transfer</code>) — a structural reason REST drew its boundaries the way it did.</p>
    <p class="lab-puzzle__why-not">Why the others fail</p>
    <ul>
      <li><strong>(a)</strong> A retried transfer sends the money twice. The bug shows up in incident reports.</li>
      <li><strong>(c)</strong> A retried append adds another item to the list each time.</li>
      <li><strong>(d)</strong> A retried increment adds another tick to the counter each time. Even an "atomic" increment is not idempotent — atomicity and idempotence are independent properties.</li>
    </ul>
  </div>
</section>

<section class="lab-footer">
  <p>Got a sharper take on any of these, a correction, or an idea for a new puzzle? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
