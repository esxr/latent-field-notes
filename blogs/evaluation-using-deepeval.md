---
title: "Evaluation Using DeepEval — Everything you need to know"
date: "2024-10-18"
description: "How to turn LLM evaluations into repeatable tests with DeepEval, from setup to baselines and cost control."
tags:
  - evaluation
  - llm
---

# Evaluation Using DeepEval — Everything you need to know

DeepEval treats LLM evaluations like software tests. Instead of eyeballing answers, you codify expectations (faithfulness, relevance, toxicity, structure) as assertions, run them in CI, and diff results across branches or deployments.

## TL;DR
- Write assertions such as `assert_faithfulness` or custom judges and wrap them in normal test cases.
- Run locally or in CI; DeepEval stores baselines so you can detect regressions.
- Works well alongside RAG pipelines because you can feed questions, contexts, and answers directly.

## Installing and wiring it up
```bash
pip install deepeval
export OPENAI_API_KEY=sk-...
```

Define shared fixtures for your pipeline so tests stay short:
```python
from deepeval.test_case import LLMTestCase

def generate_answer(question: str) -> str:
    # call your RAG pipeline or model here
    ...

def build_test_case(question: str, contexts: list[str]) -> LLMTestCase:
    return LLMTestCase(
        input=question,
        actual_output=generate_answer(question),
        context=contexts,
    )
```

## A minimal battery of assertions
```python
from deepeval import assert_faithfulness, assert_relevance
from deepeval.metrics.toxicity import ToxicityMetric

def test_customer_chat():
    tc = build_test_case(
        "How do I rotate API keys?",
        ["Rotate keys in Settings > Security. Old keys expire after 24 hours."],
    )

    assert_faithfulness(tc, threshold=0.7)
    assert_relevance(tc, threshold=0.7)
    ToxicityMetric(threshold=0.1).measure(tc)
```

Run the suite:
```bash
deepeval run
```

## Comparing runs against a baseline
DeepEval can store a snapshot of your metrics (e.g., on `main`) and diff new runs:
```bash
deepeval baseline create --name main --run-command "pytest tests/evals"
deepeval baseline compare --name main --run-command "pytest tests/evals"
```
Use this in CI to block regressions when faithfulness or relevance dip.

## Custom judges and structured checks
Assertions don’t have to be canned metrics. You can write bespoke judges with LLM prompts:
```python
from deepeval.metrics import LLMTruthfulnessMetric

style_guard = LLMTruthfulnessMetric(
    model="gpt-4o-mini",
    criteria="Answer must be bullet points and reference at least one source URL from the context."
)

def test_release_notes_style():
    tc = build_test_case(
        "Summarize the new billing changes.",
        ["Docs: /billing#proration", "Docs: /billing#limits"],
    )
    style_guard.measure(tc)
```

You can also mix deterministic checks—like JSON schema validation—before or after LLM-based assertions to keep costs down.

## Good practices for reliable evals
- **Cache model calls:** configure DeepEval’s cache to avoid paying for repeated prompts during local development.
- **Keep contexts small:** pass only the retrieved chunks you expect the model to use; noisy contexts hurt both relevance and faithfulness scores.
- **Use thresholds with wiggle room:** models are stochastic. Start with looser thresholds (0.6–0.7), then tighten once you stabilize prompts.
- **Tag test data:** add metadata for domain, language, or difficulty so you can slice results and spot regressions in specific areas.
- **Sample over time:** schedule nightly runs against fresh traffic to catch drift in retrieval quality or model behavior.

## Where DeepEval shines vs. other tools
- **Test-runner ergonomics:** feels like pytest with assertions; easy to slot into existing CI.
- **Baselines built in:** you can diff against saved runs without wiring custom dashboards.
- **Customizable judges:** straightforward to express bespoke policies or format rules.
- **RAG-friendly:** accepts question/context/answer triples directly.

Ragas is faster for quick metric sweeps, while LangChain/LlamaIndex evaluators are handy if you already log traces there. DeepEval hits a nice middle ground for teams that want regression-style tests on top of LLM outputs.

## Cheatsheet
- Install: `pip install deepeval`
- Run tests: `deepeval run` (or `pytest` if you wrap assertions in pytest files)
- Create baseline: `deepeval baseline create --name main --run-command "deepeval run"`
- Compare to baseline: `deepeval baseline compare --name main --run-command "deepeval run"`
- Cost control: enable caching and mix deterministic checks with LLM-based metrics.

Treat evals like tests, and your LLM features will behave more like the rest of your software: measurable, regression-resistant, and easier to debug.
