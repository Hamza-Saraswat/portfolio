# Article outlines

Working outlines for the pieces listed on `/writing/`. These are not published —
the writing page lists them as in progress, and each becomes a real post by
setting `draft: false` and adding a `pubDate` in
`src/content/writing/<slug>.md`.

Ordering here matches the `order` field in each entry's frontmatter.

Ground rules, same as the case studies: every number traces to something in a
repository or a report, colleagues are credited by role rather than name, and
nothing gets stated as a measured result when it was a target.

---

## 1. I Hand-Reviewed All 422 of My AI Bot's June Answers

**Source:** Juju · **Angle:** measurement integrity

The strongest piece in the list, because almost nobody publishes this.

- Open on the number I was reporting — a solve rate in the low nineties — and
  where it came from: nobody followed up after an answer, so the answer counted
  as good.
- Why that is a metric measuring politeness. In Slack, silence usually means the
  person gave up and asked a colleague instead.
- The audit itself: every question from June, graded by hand, twice. Strict
  grading (did this fully answer the question) gave 48%. Generous grading
  (did it move the person forward) gave 66%.
- Publishing the correction, and what it cost versus what it bought. The
  uncomfortable part is real and worth being honest about.
- What changed afterwards: the coverage gaps the audit exposed, the categories
  where retrieval consistently failed, the questions that should have escalated.
- Close on the cheap version anyone can run: ten answers, graded by hand, every
  week, from week one.

---

## 2. The LLM Never Writes the Email

**Source:** Jarvis · **Angle:** architecture for high-stakes automation

- Set the stakes: payment notices, where a wrong dollar amount or a leaked
  customer name is a different class of failure from a slightly-off support
  reply.
- The inversion: the model classifies and extracts, and the reply body is copied
  verbatim from a template registry. A hallucinated sentence is not unlikely,
  it is structurally impossible.
- What follows from it — template ids validated against the real registry, a
  model-populated denylist used by the *next* stage rather than trusted, and a
  missing required field producing no draft rather than a guess.
- The two hazards found in review before anything deployed: an approve-and-send
  button with no recipient that would have emailed the payment processor, and
  alerts posting raw notices with internal identifiers.
- Where this pattern is worth the constraint, and where it is overkill.

---

## 3. Five Stages of Fail-Closed

**Source:** Relay · **Angle:** publishing LLM output safely

- The problem: rewriting internal support notes into something safe for a public
  page that has no login.
- Why suppression is not the answer — a page that hides everything tells the
  customer nothing. "Sanitize, don't suppress" as the actual requirement.
- The five stages, and the rule that every one of them falls back to a safe
  line rather than publishing something unverified.
- Verify-then-publish: a second model call checking the rewrite against the
  source, and why that is different from asking the first model to be careful.
- The evaluation harness, including the part that matters most — five
  adversarial cases the faithfulness gate has to catch. An eval suite that never
  fails is not measuring anything.
- The shadow run: 26 tickets re-cleaned read-only and diffed against live, which
  is what turned "should be better" into evidence.

---

## 4. A Second Model Decides Whether the First Gets to Send

**Source:** Email Support Agent · **Angle:** calibration

- Self-reported confidence from a language model is worth nothing, and why that
  is predictable rather than surprising.
- The judge: a separate call scoring faithfulness, coverage and fit against the
  snippets that were actually retrieved.
- Why the scores are combined in code rather than in the prompt. The weights are
  a decision, and decisions belong somewhere reviewable and testable.
- The hard cap, which matters more than the weights: one unsupported claim caps
  confidence regardless of how well the reply scores elsewhere. Without it, a
  well-written reply with one fabricated detail averages its way to a pass.
- Running the same scorer live and in the offline suite, so the offline number
  is measuring the thing production does.
- Where it is miscalibrated — it is stricter than a human reviewer, which is the
  right direction to be wrong in, and still worth measuring.

---

## 5. Shipping Production Software with a Fleet of Coding Agents

**Source:** Onboarding platform · **Angle:** process

- The setup: parallel agents in isolated worktrees, a written playbook in the
  repository, and a dashboard specified as twenty-six independently executable
  tickets.
- The claim people expect — this makes you faster — and the more useful one:
  it makes your test suite and your review gate load-bearing in a way they
  were not before.
- What made tickets safe to parallelise, and what did not.
- Where it went wrong, and what that cost.
- Honest accounting of what still needed a human.

---

## 6. The Bakeoff That Made Me Rebuild Our Bot

**Source:** Juju · **Angle:** architecture decisions

- The maintenance bill on a working RAG pipeline: embeddings drifting from
  weekly-changing docs, reranker quotas, upstream model swaps.
- Rather than argue it, seven representative questions run through both
  architectures and scored side by side.
- The result was nearly a tie, and the pattern underneath the tie is what
  decided it: MCP won on freshness and never served a stale answer, the custom
  pipeline won wherever internal wiki content mattered.
- How that one finding wrote the v2 spec — go MCP-based, keep a direct path to
  the internal wiki.
- On running small evaluations to settle architecture arguments instead of
  having the argument.

---

## 7. Your Test Email Isn't Production

**Source:** Jarvis · **Angle:** testing

- The finding: a byte-identical email body classified differently depending only
  on the sender address.
- Why sender turned out to be a load-bearing signal, and why that is reasonable
  behaviour rather than a bug.
- The consequence: self-sent test messages cannot reproduce the thing you are
  trying to verify, and every test that passed that way proved nothing.
- The failure mode was safe — it routed to review rather than drafting — which
  is the only reason this was a finding and not an incident.
- Generalising: which parts of a message your pipeline treats as signal, and
  whether your fixtures preserve them.
