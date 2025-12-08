---
title: "What the heck are PPO, GRPO, and DPO"
date: "2025-09-05"
description: "Plain-English breakdown of preference-tuning algorithms, when to use each, and how they behave in production."
tags:
  - alignment
  - rlhf
---

# What the heck are PPO, GRPO, and DPO

Preference-tuning LLMs went from obscure papers to table-stakes production features in a few years. Today, three acronyms dominate conversations about aligning models with human preferences: PPO, GRPO, and DPO. They share the goal—make model outputs more helpful, harmless, and honest—but differ in math, data requirements, cost, and operational feel. This post unpacks each method, how they compare, and when to reach for one over the others.

## Quick summary if you’re in a hurry
- **PPO (Proximal Policy Optimization):** Reinforcement learning with a learned reward model; uses KL penalties to keep updates stable. Powerful but infrastructure-heavy.
- **GRPO (Group Relative Policy Optimization):** A lighter, relative version of PPO that compares candidates within a group and sidesteps explicit reward modeling; great when you have pairwise or listwise preferences.
- **DPO (Direct Preference Optimization):** Turns preference data directly into a supervised objective without rollouts or reward models; often the simplest and cheapest path.

## Preliminaries: preference data and baselines
Before tuning, you need a base model (often post-SFT) and preference signals. Typical sources:
- **Human preference pairs:** Annotators rank candidate completions (A better than B) for a prompt.
- **Implicit behavior logs:** Clicks, dwell time, or conversions mapped to prompts and completions.
- **Heuristic judges:** Rule-based or smaller LLM evaluators providing pairwise labels. Quality varies; calibrate carefully.
- **Safety policies:** Binary allow/deny labels that can mix with preference pairs.

You also need a reference policy (π_ref) to anchor updates. Many teams freeze the SFT model as π_ref and tune a copy.

## PPO: the workhorse of RLHF
PPO is a policy-gradient algorithm that constrains updates with a clipping or KL term to prevent catastrophic policy shifts. In RLHF for LLMs, the usual recipe is:
1) Collect prompt → responses.
2) Train a reward model (RM) on preference pairs.
3) Roll out the policy to generate samples; score them with the RM.
4) Update the policy with PPO, nudged toward higher rewards while penalizing divergence from π_ref.

Key ingredients:
- **Objective:** Maximize expected reward + β * KL(π || π_ref) (β may be adaptive).
- **Value function:** Optional baseline to reduce variance in advantage estimates.
- **Clipping:** Keeps ratio (π/π_old) within [1-ε, 1+ε] to stabilize updates.

Strengths:
- Handles long-horizon credit assignment when rewards are sparse.
- Can incorporate fine-grained reward signals (toxicity, factuality, personalization).
- Supports on-policy exploration; model can discover better outputs than seen in data.

Weaknesses:
- Expensive: needs rollouts, reward model training, and careful hyper-parameter tuning.
- Sensitive to reward hacking; the policy may exploit quirks of the RM.
- Infrastructure heavy: actors, learners, replay buffers, KL controllers, and eval harnesses.

When to use PPO:
- You have strong infra (distributed sampling, fast RM inference).
- You need exploration beyond observed data (creative writing, code synthesis with new APIs).
- You want to combine multiple reward terms (safety, brevity, policy compliance) in a weighted mixture.

## GRPO: relative scoring without a standalone reward model
Group Relative Policy Optimization modifies PPO to work with grouped preferences rather than absolute rewards. Instead of predicting a scalar reward, GRPO uses the relative rank of candidates within a group to form advantages.

How it works:
1) For each prompt, sample K candidate completions from the policy.
2) Use a judge (human or LLM) to rank them or pick a winner.
3) Compute relative rewards: winners get higher scores; losers get lower. These can be simple (winner=1, others=0) or listwise (e.g., normalized DCG-style gains).
4) Update the policy with a PPO-like step using these relative advantages.

Why it matters:
- **No explicit reward model:** You can sidestep training a separate RM if you can cheaply judge batches of candidates.
- **Better sample efficiency for listwise data:** When your labels say “A > B > C,” GRPO leverages the whole ordering instead of discarding information.
- **Aligned with tournament-style eval:** Many human-in-the-loop systems already compare small sets of answers; GRPO fits naturally.

Considerations:
- Still on-policy and still needs rollouts, but the judging step can be parallelized or LLM-automated.
- KL control remains important to prevent drift from π_ref.
- If the judge is noisy, variance can spike; using soft labels or Bradley–Terry-style probabilities can smooth learning.

When to use GRPO:
- You have plentiful pairwise or listwise labels but no high-quality RM.
- You want PPO-like stability with cheaper labeling.
- You care about relative quality more than absolute reward magnitudes (ranking assistants, search snippets, list summaries).

## DPO: preference tuning without RL machinery
Direct Preference Optimization reframes preference learning as pure supervised learning. Given pairs (x, y_winner, y_loser) from a reference model π_ref, DPO maximizes the likelihood of the preferred response relative to the dispreferred one with a temperature-scaled objective:

L = -E[log σ(β * (log π_θ(y_winner|x) - log π_θ(y_loser|x) - log π_ref(y_winner|x) + log π_ref(y_loser|x)))]

Intuition: make the new policy place more probability mass on winners than losers, adjusted by how surprising they were under π_ref.

Strengths:
- **Simplicity:** No reward model, no rollouts, no value function. Train with standard supervised pipelines.
- **Speed:** Often 2–5x faster wall clock than PPO for the same dataset.
- **Stability:** The objective is well-behaved; fewer moving parts to tune.

Limitations:
- **No exploration:** Stuck within the support of π_ref. If the data lacks great answers, DPO cannot discover them.
- **Label quality matters:** Garbage-in, garbage-out. LLM-graded or synthetic pairs need careful calibration to avoid reinforcing biases.
- **Long-horizon credit assignment:** Harder when the reward is about downstream effects (e.g., tool use success) instead of surface text quality.

When to use DPO:
- You have a decent SFT baseline and a pile of preference pairs.
- You want a fast, inexpensive alignment pass with minimal infra.
- You’re fine optimizing within the reference model’s behavior manifold.

## Comparing cost and complexity
| Aspect | PPO | GRPO | DPO |
| --- | --- | --- | --- |
| Rollouts needed? | Yes | Yes | No |
| Reward model? | Yes | No (relative judgments instead) | No |
| Infra complexity | High | Medium | Low |
| Sample efficiency | Medium | High on listwise data | High for pairs |
| Exploration | Yes | Yes | No |
| Typical training cost | Highest | Mid | Lowest |
| Risk of reward hacking | Medium–High | Medium | Low–Medium (label-dependent) |

## Practical training recipes
**PPO starter:**
- Initialize π and π_ref from the SFT model.
- Train RM on 50k–200k preference pairs; validate on held-out human labels.
- Use adaptive KL targeting (e.g., target 0.05–0.2 nats/token) with linearly increasing β if divergence spikes.
- Batch size: 512–2048 tokens per mini-batch; learning rate 1e-5–5e-6 for 7B–70B models.
- Run short rollouts (max 512–1024 tokens) to control variance; truncate at end-of-assistant message.
- Evaluate every N steps with static prompts and safety tests.

**GRPO starter:**
- For each prompt, sample 4–8 candidates.
- Judge with a small LLM using a strict rubric; optionally add one human-overseen pass for calibration.
- Convert ranks to gains (e.g., 1.0, 0.6, 0.3, 0.0) and normalize across batches.
- Apply PPO-style updates with KL control; consider entropy bonuses to keep diversity.

**DPO starter:**
- Curate 50k–300k high-quality pairs; de-duplicate by prompt and normalize lengths.
- Use β in [0.05, 0.2]; higher β enforces stronger separation from π_ref.
- Mix in a small fraction of supervised SFT loss to maintain fluency.
- Early-stop on validation accuracy over preference pairs and on win-rate vs π_ref.

## Evaluation: how to know it worked
- **Win-rate on held-out preferences:** Percentage of times the tuned model beats π_ref on a test set.
- **Human eval:** Small, high-quality studies on representative tasks; measure helpfulness, harmlessness, and honesty separately.
- **Safety regression tests:** Red-team prompts, jailbreak attempts, and policy compliance suites.
- **Task-specific metrics:** BLEU/ROUGE for summarization, exact match for QA, execution success for code + tool use.
- **Calibration:** Check if probabilities align with win likelihood; especially important for DPO where β can over-sharpen.

## Failure modes and mitigations
- **Reward hacking (PPO/GRPO):** Add auxiliary losses (length penalties, repetition penalties), randomize prompt formats, and audit RM correlations with spurious features.
- **Mode collapse:** Increase entropy bonus, lower β, or add diversity-promoting sampling (top-p annealing) during data collection.
- **Label leakage:** If prompts leak into labels ("A is preferred because…"), clean the data; otherwise the model learns shortcuts.
- **Overfitting to easy wins:** Mix safety + general helpfulness prompts to avoid a narrow skill set.
- **Prompt-format brittleness:** Train on multiple system prompts and sampling temperatures so the policy generalizes.

## Operational considerations
- **Cost vs. impact:** DPO is the fastest path to a decent uplift. PPO shines when exploration yields big gains, but expect higher bills. GRPO sits in the middle and can outperform PPO when listwise labels are abundant.
- **Data freshness:** Preferences drift. Re-train or refresh every few weeks, and monitor win-rates against recent traffic.
- **Shadow deployment:** Run tuned models in shadow mode to collect preferences before replacing production. Compare live metrics (CTR, deflection, latency) and safety signals.
- **Versioning:** Store π_ref, tuning datasets, β/ε schedules, and evaluation scores. You’ll need them when incidents or audits arise.
- **Tool use:** PPO/GRPO better capture long-horizon rewards like tool success; DPO may underperform unless you include tool-aware pairs.

## Choosing the right method
- Choose **DPO** when speed, simplicity, and low infra cost are key, and you have high-quality pairwise data.
- Choose **GRPO** when you collect ranked lists or want a middle ground: some exploration, no separate reward model.
- Choose **PPO** when you need exploration, multi-objective rewards, or fine-grained control over policy shifts—and you can afford the infra.

A useful rule of thumb: start with DPO for a quick win. If the ceiling is too low or you need better tool-use reliability, graduate to GRPO. Move to PPO when you have solid RMs, stable pipelines, and a need for exploration-driven gains.

## FAQs
- **Can I stack methods?** Yes. Many teams do SFT → DPO → short PPO or GRPO finetunes. DPO sets a strong baseline; PPO refines with exploration.
- **What about ORPO, IPO, KTO?** Variants like ORPO/IPO adjust the objective or KL handling; KTO targets specific offsets. They share DPO’s simplicity but vary in stability. The big trade-offs remain similar: exploration vs. simplicity.
- **How does temperature sampling interact?** Preference data often comes from a specific temperature. When deploying, calibrate sampling (top-p, temperature) to avoid distribution shift; you may need light temperature annealing to match training.
- **Do I need huge datasets?** DPO can work with ~10k–50k good pairs for noticeable gains on mid-size models. PPO/GRPO benefit from larger pools (100k+ prompts) to avoid overfitting to the RM or judge quirks.
- **How do I monitor drift?** Track win-rate vs. π_ref over recent traffic, safety violation rates, and calibration metrics. Sudden drops often indicate preference drift or judge/RM degradation.

## Implementation checklist
- [ ] Freeze π_ref; clone for tuning.
- [ ] Gather/clean preference data; dedupe and normalize lengths.
- [ ] Pick method (DPO/GRPO/PPO) and set β/ε schedules.
- [ ] Set up eval: static preference set, safety suite, task metrics.
- [ ] Train with small pilots; watch KL, win-rate, and loss curves.
- [ ] Shadow deploy; collect fresh feedback.
- [ ] Iterate or switch methods based on eval ceilings and cost.

Preference tuning is no longer a monolith. PPO remains the Swiss Army knife when you have the infrastructure and need exploration. GRPO trims that complexity with relative judgments. DPO turns preference alignment into a fast supervised pass. Picking the right tool—and knowing when to switch—is the difference between an expensive science project and a reliable, aligned model that users actually prefer.

## Further reading and experiments to try\n- Sweep β for DPO and watch calibration and win-rates; small changes can sharply alter sharpness.\n- Try self-play data augmentation: let the tuned model generate challengers against π_ref, then label with a judge for GRPO/PPO.\n- Evaluate with tool-use prompts and structured outputs; alignment methods can behave differently when the reward is downstream of tool success.\n- If you only have thumb-up/down feedback, bootstrap pairwise data by pairing positives with random negatives and see how far DPO can get.\n\n ### References\n - https://anukriti-ranjan.medium.com/preference-tuning-llms-ppo-dpo-grpo-a-simple-guide-135765c87090
### References
- https://anukriti-ranjan.medium.com/preference-tuning-llms-ppo-dpo-grpo-a-simple-guide-135765c87090
