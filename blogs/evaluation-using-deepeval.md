# Evaluation Using Deepeval - Everything you need to know

Mar 15, 2024

DeepEval aims to make LLM evaluation feel like writing tests: assertions, fixtures, and baselines you can gate in CI. This guide walks through why DeepEval matters, how to set it up, the core metrics, and battle-tested patterns for keeping your models honest.

## Why another evaluator?
LLM teams need more than offline BLEU scores. They need:
- Reproducible regression tests that engineers can run before merging.
- Metrics that reflect human judgment (faithfulness, relevance, safety) without bespoke pipelines.
- Baseline comparison to track drift as prompts, models, or retrieval change.
- Cheap enough runs to fit in nightly/CI budgets.
DeepEval delivers these by wrapping LLM-as-a-judge prompts and heuristics inside a familiar testing harness.

## Core concepts
- **Assertions:** Functions like `assert_faithfulness` or `assert_relevance` that run checks on model output and raise failures if thresholds are missed.
- **LLM judge:** The model that scores outputs; can be OpenAI, Anthropic, or a self-hosted compatible endpoint.
- **Baseline runs:** Stored scores from a previous version to diff against current runs.
- **Test cases:** Inputs (e.g., questions) plus expected grounding context. You structure them like unit tests.

## Installing and configuring
```bash
pip install deepeval
```
Configure your provider key via env vars (e.g., `OPENAI_API_KEY`). For local or self-hosted models, point the OpenAI-compatible endpoint using `OPENAI_BASE_URL`.

### Minimal project layout
```
project/
  tests/
    test_rag.py
  data/
    rag_samples.jsonl
```

### Sample test case
```python
from deepeval import assert_faithfulness
from my_rag_pipeline import answer_question

SAMPLE = {
    "question": "Who wrote The Left Hand of Darkness?",
    "contexts": [
        "The Left Hand of Darkness is a science fiction novel by Ursula K. Le Guin.",
        "It was published in 1969 and won the Hugo and Nebula awards."
    ],
}

def test_rag_faithfulness():
    result = answer_question(SAMPLE["question"])
    assert_faithfulness(
        output=result.answer,
        context=SAMPLE["contexts"],
        model="gpt-4o",
        threshold=0.75,
    )
```
Run with `pytest` or the DeepEval CLI; failures show the score and judge rationale.

## What metrics come out of the box?
- **Faithfulness:** Does the answer stick to provided context? Uses LLM judges by default; thresholded 0–1.
- **Answer relevance:** Does the answer address the question? Helpful for hallucination/rambling detection.
- **Context relevance:** Are the retrieved chunks relevant to the question?
- **Toxicity / safety:** Flags unsafe content; depends on judge prompt and provider.
- **Custom assertions:** You can write your own by composing a judge prompt and scoring function.

## Writing robust assertions
Tips:
- Set thresholds with headroom. Start with 0.7 for faithfulness; adjust after looking at failures.
- Limit context length to what you’d accept in production; overly long context inflates scores.
- Add deterministic guards (regex checks, length bounds) alongside LLM judges to catch formatting issues.
- Include rationales in failure messages so developers see *why* a test failed.

Example custom assertion for JSON validity + faithfulness:
```python
from deepeval import assert_faithfulness
import json

def assert_json_faithfulness(output, context, model="gpt-4o", threshold=0.7):
    try:
        parsed = json.loads(output)
    except Exception as exc:
        raise AssertionError(f"Output not valid JSON: {exc}\n{output}")
    assert_faithfulness(
        output=json.dumps(parsed),
        context=context,
        model=model,
        threshold=threshold,
    )
```

## Baselines and regressions
DeepEval can store previous run results and compare current scores:
- **Baseline creation:** `deepeval baseline create --name=main --tests=tests/`
- **Comparison:** `deepeval baseline compare --name=main --tests=tests/`
- **CI gating:** Fail the job if current < baseline by a tolerance.
This is vital when prompts, models, or retrieval parameters change silently. Baselines catch silent regressions early.

## Integrating with RAG pipelines
1) Instrument your pipeline to expose the final answer and the contexts used.
2) Build fixtures with representative questions and the expected supporting chunks.
3) Add faithfulness + context relevance assertions.
4) For citations, write a custom judge that verifies each cited span exists in context.
5) Run a fast subset in PRs; run the full suite nightly.

### Example: PR vs. nightly split
- **PR checks:** 10–20 critical prompts; 1–2 metrics each; use smaller/quicker judge (e.g., GPT-4o-mini).
- **Nightly:** 200+ prompts; full metrics (faithfulness, relevance, toxicity); use stronger judge (GPT-4o or Claude Sonnet) with caching.

## Caching and cost control
- Enable caching with `DEEPEVAL_CACHE_DIR` or your own in-memory cache. Repeat runs skip judge calls.
- Use smaller judges for frequent runs; reserve big models for weekly audits.
- Batch prompts where possible; DeepEval supports async patterns to amortize latency.
- Cap max tokens in judge prompts to avoid runaway bills.

## Dealing with judge variance
LLM judges are non-deterministic. Mitigations:
- Fix seeds and temperature where supported.
- Majority vote across 2–3 judges for critical tests.
- Keep prompts short and specific; avoid open-ended criteria that invite drift.
- Record judge rationales; inspect disagreements to refine prompts.

## Structuring datasets
- **Balance domains:** Include easy and hard questions, long/short contexts, and edge cases (dates, numbers, negation).
- **Label ownership:** Note who approved each test. This helps triage disagreements later.
- **Version control:** Check datasets into git; diffs make changes obvious.
- **Synthetic data:** Acceptable to bootstrap, but human-review a slice to avoid bias amplification.

## Common pitfalls
- **Thresholds too strict:** Flaky tests that fail on harmless wording changes. Start looser, tighten with evidence.
- **Context leakage:** Tests use context the live system won’t have. Mirror production retrieval.
- **Ignoring latency:** Judges add seconds; if CI becomes slow, move heavy tests to scheduled jobs.
- **No ground truth for safety:** Toxicity prompts vary; calibrate on real user logs and audit outcomes.

## Example end-to-end flow
```python
from deepeval import assert_faithfulness, assert_relevance
from my_rag_pipeline import answer_question
from pathlib import Path
import json

SAMPLES = [json.loads(line) for line in Path("data/rag_samples.jsonl").read_text().splitlines()]

for sample in SAMPLES:
    output = answer_question(sample["question"])
    assert_relevance(
        output=output.answer,
        input=sample["question"],
        model="gpt-4o-mini",
        threshold=0.65,
    )
    assert_faithfulness(
        output=output.answer,
        context=output.contexts,
        model="gpt-4o-mini",
        threshold=0.7,
    )
```

## CI integration sketch
- Add a `make eval` target that runs `deepeval` tests.
- Cache dependencies and judge responses to keep runtimes predictable.
- Fail fast on assertion errors; print top-5 failing samples with rationales.
- Upload artifacts (JSON/HTML) with scores and rationales for review.
- Track average scores per metric over time; alert on drops.

## Working with other stacks
- **LangChain:** Wrap your chain call, capture `contexts` and `answer`, then plug into assertions. You can also evaluate LangSmith traces offline.
- **LlamaIndex:** Use `query_engine.query` outputs; pass source nodes as context. Add node IDs to failure logs.
- **Custom pipelines:** As long as you can provide question, answer, and context, DeepEval is agnostic.

## Safety and policy checks
- Use toxicity assertions for known sensitive intents.
- Add policy prompts ("Is the assistant refusing disallowed content?") as custom judges.
- Mix in jailbreak attempts and refuse scenarios; assertions should expect refusals.
- Log refusals separately to ensure you don’t regress safety while improving helpfulness.

## Measuring and reducing flakiness
- Track test failure rates over multiple runs; flakiness often comes from judge variance or brittle thresholds.
- Stabilize by caching, lowering temperature, or using majority vote.
- Rewrite unclear test instructions; judges perform better with explicit rubrics.

## Extending DeepEval
- **Custom judge prompts:** Provide task-specific rubrics (e.g., factual accuracy for finance, citation quality for medical RAG).
- **Hybrid metrics:** Combine regex/deterministic checks with LLM judges (e.g., JSON schema validation + faithfulness).
- **Structured outputs:** Add assertions that parse and validate JSON/YAML/XML and then run content checks.
- **Plugging in open-source judges:** Point to a local model endpoint; experiment with distilling the judge to cut costs.

## Observability and debugging
- Store judge rationales next to scores; developers skim them to understand failures.
- Link failures to the exact retriever query, retrieved documents, and prompts. DeepEval doesn’t force a format—add IDs to failure messages yourself.
- Sample failures weekly for human review; adjust tests or data accordingly.

## Playbook for adopting DeepEval
1) Start with 20–50 high-value test cases and a single metric (faithfulness or relevance).
2) Set lenient thresholds (0.6–0.7) and gather a week of runs to understand variance.
3) Add toxicity or formatting checks for risky surfaces (customer support, finance, healthcare).
4) Split test suites: fast PR checks with small judges; slower nightly checks with stronger judges.
5) Baseline on main; require new branches to beat or match baseline.
6) Rotate in fresh real-user prompts monthly to fight data staleness.

## Frequently asked questions
- **Can I use DeepEval without pytest?** Yes—call assertions from any Python script or CLI.
- **What about multilingual tests?** Provide bilingual contexts and questions; ensure your judge prompt supports the languages. Calibrate thresholds per language.
- **Does it replace human eval?** No. Use it to catch regressions quickly; keep periodic human evals for calibration.
- **How big should the test set be?** Enough to cover critical intents—start small but diverse. Expand once the pipeline stabilizes.
- **What if scores swing wildly?** Lower temperature, pin judge models, add caching, and consider majority voting.

## Checklist you can paste into your repo
- [ ] Install DeepEval and configure API keys/local judge endpoint.
- [ ] Create 20–50 seed test cases with question, context, expected behaviors.
- [ ] Add faithfulness + relevance assertions; optionally toxicity/formatting.
- [ ] Set thresholds and cache directory; document them in README.
- [ ] Create a baseline on main.
- [ ] Wire fast subset to PR CI; full suite to nightly.
- [ ] Log scores + rationales; review failures weekly.
- [ ] Refresh datasets monthly; re-tune thresholds quarterly.

DeepEval makes evals feel like tests rather than bespoke research scripts. By pairing LLM judges with assertions, baselines, and caching, you get a repeatable harness for RAG and non-RAG systems alike. Start small, gate critical paths, and iterate—your users will thank you for the quiet reliability.

## How DeepEval compares to other options
- **Vs. Ragas:** Ragas is metrics-first and great for quick snapshots. DeepEval trades some speed for a testing mindset (assertions, baselines, CI gates). Use both: Ragas for broad sweeps, DeepEval for gates on critical intents.
- **Vs. LangChain/LlamaIndex evaluators:** Those shine with trace UIs. DeepEval is lightweight and framework-agnostic; no vendor lock-in, less boilerplate.
- **Vs. bespoke scripts:** You could roll your own judge prompts, but DeepEval keeps teams consistent and prevents silent metric drift.

## Case study: tightening a support chatbot
1) **Initial state:** A support chatbot built on RAG with ~65% correct responses and occasional hallucinations about refund policy.
2) **DeepEval setup:** 40 test cases from real tickets; faithfulness threshold at 0.65; context relevance at 0.6; toxicity check for abusive content.
3) **First run:** 18 failures—mostly faithfulness. Rationales showed missing citations and overconfident policy statements.
4) **Fixes informed by tests:**
   - Raised retrieval top-k from 3→6 and added a reranker.
   - Added citation enforcement to the prompt.
   - Trimmed context to reduce noise.
5) **Second run:** Faithfulness average 0.78, relevance 0.82, toxicity clean. Failures concentrated on billing edge cases.
6) **Outcome:** Gated PRs on those tests; new regressions are caught before hitting customers. Nightly runs use a stronger judge; PR runs use a cheaper one for speed.

## Advanced patterns
- **Multi-turn conversations:** Store turns as context; assert that later answers remain consistent with earlier commitments. Add a custom judge prompt that penalizes contradictions.
- **Tool use outputs:** Validate both the natural-language answer and the tool call trace (e.g., SQL). Combine schema validation with faithfulness.
- **Personalization:** If answers depend on user profile, include profile snippets in context and assert that profile-sensitive facts are respected.
- **Structured outputs:** Pair JSON schema validation with semantic checks on fields (dates in range, amounts positive).
- **Shadow evaluation:** Run DeepEval against production logs asynchronously; file issues for failures that slip past CI.

## Keeping tests maintainable
- **Label drift:** Review failing tests monthly; retire or update prompts that no longer represent production traffic.
- **Ownership:** Assign owners to test files; they triage flakes and tune thresholds.
- **Documentation:** Keep a short README near tests explaining metrics, thresholds, and judge models. Future you will forget why 0.72 mattered.
- **Versioning judge prompts:** Store custom judge prompts in git. When they change, re-baseline; otherwise comparisons become noisy.
- **Budgeting:** Track cost per run. If it creeps up, lower temperature, swap in smaller judges, or trim long contexts.

## Signal sanity checks
- Spot-check 10% of failures manually to see if the judge is right. If not, adjust prompts or swap models.
- Plot score distributions instead of only averages; fat tails often reveal rare-but-bad behaviors.
- Correlate scores with latency and token counts; sometimes performance drops when responses are truncated.
- Monitor the delta between PR and nightly runs; widening gaps signal overfitting to the small PR set.

## Wrapping up
DeepEval won’t replace careful product judgment, but it gives engineers a repeatable, code-native way to watch for regressions. Treat assertions like any other test: keep them small, cheap, and relevant to real traffic. Pair fast PR checks with richer nightly suites, cache aggressively, and keep judge prompts versioned. Do that, and evaluation becomes a habit rather than a heroic event, catching issues long before customers do.

### References
- https://codemaker2016.medium.com/understanding-deepeval-a-practical-guide-for-evaluating-large-language-models-d7272b6c2634
