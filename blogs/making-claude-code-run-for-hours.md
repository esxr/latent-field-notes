---
title: "Making Claude Code Run for Hours"
date: "2025-11-25"
description: "Hard-won patterns for sustaining multi-hour Claude coding sessions without drift or stalls."
tags:
  - agents
  - workflows
---

# Making Claude Code Run for Hours

Large projects rarely finish in a single message. The teams getting the most out of Claude (and other frontier models) treat it like a tireless junior engineer strapped into a reliable runtime. This guide collects hard-won lessons on making Claude keep coding for hours without stalling, losing context, or silently drifting away from your intent.

## Why long-running sessions matter
- You get compounding gains: Claude remembers earlier design decisions, naming patterns, and trade-offs.
- Multi-file refactors and data migrations need sustained attention across tens or hundreds of edits.
- Long sessions amortize prompt-engineering overhead and give you time to notice regressions before shipping.

## Quick mental model
Running Claude for hours is a systems problem, not just a prompt problem. You need:
1) a durable interaction loop (input/output plumbing, checkpoints),
2) an execution sandbox Claude can control safely,
3) correctness signals (tests, diff review, telemetry), and
4) a recovery plan for when the context or tool state goes sideways.

## Session scaffolding
- **Start with a crisp contract.** Define the target state, constraints (tech stack, latency, security), and explicit out-of-scope areas. Claude performs better when the finish line is clear.
- **Give it a minimal map.** Add repo overviews, architectural boundaries, and the names of critical files. Fewer follow-up questions → more time coding.
- **Choose the right context holder.** Conversational context, ephemeral file previews, and external memory (notes, scratchpad files, vector stores) should all be in play. Pin canonical decisions in a running "session memo" that you update after milestones.

## Tooling loop: proven pattern
- **Single source of truth:** Ask Claude to keep an authoritative task list and update it after each change. Store it in-repo (e.g., `notes/session.md`) to make it durable across restarts.
- **Diff-first edits:** Prefer applying patches and showing small diffs. Claude reasons better about precise changes than whole-file rewrites, and you avoid accidental truncation.
- **Tight validation loop:** After each logical chunk, run the smallest relevant checks: `npm test file.test.ts`, a targeted `pytest`, or a type check. Surface the exact command and output back to Claude.
- **Deterministic formatting:** Enforce formatter + linter upfront (`prettier`, `ruff`, `gofmt`). Claude then edits against a stable baseline, reducing churn and merge noise.
- **Explicit checkpoints:** Every 30–60 minutes, summarize the state, record outstanding risks, and confirm priorities. If the session restarts, paste the last checkpoint to regain footing quickly.

## Keeping the context clean
- **Summaries > raw logs.** Instead of pasting massive build logs, summarize failures with the top stack frame, error message, and any suspicious diff. Claude can then ask for the missing detail explicitly.
- **Selective file streaming.** Send only the touched sections plus immediate context (e.g., +/- 30 lines). Include filenames and line numbers so Claude can anchor references.
- **De-duplicate instructions.** If constraints change (e.g., new API key policy), update the session memo and tell Claude which old instructions are obsolete.
- **Guardrails against hallucinated files.** When Claude proposes creating or editing a file, require it to restate the full path and purpose. Reject edits to paths that do not exist unless explicitly approved.

## Prompt patterns that extend endurance
- **Stateful recap prompt:** After each chunk, ask Claude: "Restate the goal, what changed in this chunk, and what you’ll do next." This keeps the plan synchronized with reality.
- **Ambiguity checks:** Periodically ask, "List uncertainties or missing information blocking you." Resolving these early prevents hours of drift.
- **Resource awareness:** Remind Claude of limits: memory, API quotas, job timeouts. Encourage incremental, resumable scripts (idempotent migrations, chunked jobs with checkpoints).
- **Verification-first edits:** Prompt: "Before changing code, outline the intended diff, the tests you’ll run, and the rollback plan." Claude then codes with validation in mind.

## File- and repo-scale strategies
- **Sharded tasks:** Split large refactors into directory-level passes. Example for a monorepo: UI package → service layer → infra configs. Claude can complete one shard, run checks, then proceed.
- **Interface freezes:** Lock core interfaces or schemas during a session. Tell Claude to request approval before modifying them. This reduces cascading breakage.
- **Golden examples:** Keep 2–3 exemplar files that represent preferred style, patterns, and naming. Ask Claude to imitate those when touching new areas.
- **Migration harnesses:** For data changes, build dry-run + metrics logging into scripts. Claude can then observe progress and adjust without risking production data.

## Long-running code execution safety
- **Sandbox everything.** Use containers or ephemeral VMs. Claude should never have direct prod access. Mount secrets read-only and scope tokens narrowly.
- **Time-bounded commands.** Default to commands with timeouts (e.g., `timeout 900s`). If a job must run longer, add heartbeats and partial outputs.
- **Idempotence as a rule.** For scripts that may be retried, store checkpoints (processed IDs, last page token) and guard against duplicate writes.
- **Rate limiting and backoff.** Claude should call APIs through a small wrapper that enforces qps and retries with jitter, so you avoid getting rate-limited mid-session.

## Keeping Claude focused under drift
- **Reground regularly:** After context-heavy steps, restate architecture and constraints. Ask Claude to re-derive the plan from current files to catch divergence.
- **Compare diff to intent:** Have Claude explain how each diff moves the goal forward. If the explanation is weak, revisit the change before it lands.
- **Use adversarial checks:** Ask Claude to find ways the current change might break things (edge inputs, concurrency, permissions). Fix the most plausible risks immediately.

## Telemetry for multi-hour sessions
- **Basic metrics:** Track test durations, failure counts, and flake rates per chunk. Share trends with Claude so it can triage hotspots.
- **Logging discipline:** Standardize log structure (correlation IDs, request/response shape) so Claude can parse logs quickly and propose filters.
- **Smoke tests on a schedule:** Run lightweight smoke tests every 30–60 minutes even if no large changes landed. This catches hidden coupling early.
- **Diff heatmaps:** Visualize which files changed most to spot risky concentrations. Claude can then target extra tests or reviews there.

## When the model stalls
- **Symptoms:** Short, generic responses; refusing to edit; repeating plans; hallucinating missing context.
- **Fixes:**
  - Refresh with a concise session memo + current diffs.
  - Ask for a bullet plan with owners and estimated effort.
  - Reduce scope temporarily; ship a small win to restore momentum.
  - If repetition persists, start a fresh thread but paste the memo, task list, and last checkpoint.

## Recovery from tool or environment failures
- **Broken commands:** Provide Claude the exact stderr and environment (OS, shell, versions). Ask it to propose a minimal repro and fix.
- **Merge conflicts:** Ask Claude to restate the conflict, desired winner per file, and propose the merged diff. Validate locally before applying.
- **Lost work:** Keep autosaves of Claude’s proposed patches (e.g., apply to a temp branch). If the session dies, you can reapply diffs selectively.

## Prompt starter pack for hour-long runs
- "You are an engineer-in-residence. Maintain a task list at the top of the session memo. After every change, update tasks, list risks, and propose the next two checks."
- "When editing, prefer patches. State: file path, intent, patch, tests to run."
- "After any failure, summarize root cause, the minimal fix, and a verification command."
- "Every 45 minutes, summarize progress, blockers, and any deviations from constraints."
- "If a file is missing, ask for it. Do not invent content for unknown files."

## Real-world example: emergent automation loop
Inspired by teams like Emergent (see reference), a simple automation loop that keeps Claude coding for hours:
1) Operator describes the milestone and uploads repo snapshot.
2) Claude drafts a plan, sharded by package.
3) Operator approves; Claude edits via patches and runs targeted tests after each shard.
4) Claude logs actions to `session-log.md` and keeps a TODO list with statuses.
5) Every 45 minutes, Claude posts a checkpoint summary and asks for scope adjustments.
6) If a command fails or stalls, Claude proposes a fix or alternative path before retrying.
7) At the end, Claude writes a changelog and suggests follow-up hardening tasks.

This loop works because it enforces rhythm: plan → edit → verify → checkpoint. It creates hooks for humans to intervene without losing state.

## Checklists you can paste into Claude
**Before starting**
- [ ] State the final goal and hard constraints
- [ ] Share repo map + critical files
- [ ] Enable formatter + linter
- [ ] Create `session memo` + task list
- [ ] Define validation commands (tests, linters, smoke)

**During the session**
- [ ] Small, patch-based diffs
- [ ] After each chunk: recap + next tests
- [ ] Run targeted checks; surface exact outputs
- [ ] Keep tasks updated with timestamps
- [ ] Periodic re-grounding of constraints

**When things break**
- [ ] Summarize the failure and likely cause
- [ ] Propose the smallest fix + verification
- [ ] If stuck, reduce scope and ship a small win
- [ ] Refresh the session with memo + checkpoints

## Common failure modes and how to prevent them
- **Context dilution:** Too many raw logs; fix by summarizing and pinning canonical decisions.
- **Spec drift:** Requirements change mid-session; fix by rewriting the session memo and re-deriving the plan.
- **Over-editing:** Claude rewrites entire files; fix by demanding patches and enforcing formatters.
- **Tool flakiness:** Commands fail intermittently; fix with retries, cached dependencies, and smaller test targets.
- **Silent regressions:** No tests for the changed surface; fix by adding lightweight assertions or integration checks before moving on.

## Building a Claude-friendly workspace
- **Clear structure:** Keep `src/`, `tests/`, `scripts/`, `docs/` predictable. Claude navigates known conventions faster.
- **Self-documenting configs:** Comment on custom tooling (bespoke CI steps, secret mounts) so Claude does not guess.
- **Fast feedback:** Cache deps (`pip cache`, `npm ci`), pre-warm containers, and keep test data small. The faster the loop, the longer you can sustain attention.
- **Safe experimentation:** Provide feature flags and mock services so Claude can explore without risking prod systems.

## Extending to multi-agent setups
Some teams pair Claude with smaller models or scripts:
- **Supervisor + worker:** Claude supervises a smaller local model or script that executes simple edits/tests, letting the big model focus on reasoning.
- **Spec drafting agent:** One agent drafts specs/tests while Claude implements. This keeps coding sessions grounded.
- **CI-aware agent:** A bot watches CI and feeds failures + logs back to Claude in structured form.

## How to know you’re succeeding
- Sustained velocity over hours with low rework.
- Reduced human clarification pings: Claude anticipates needs and asks sharper questions.
- Shorter time-to-green on CI because tests are run early and often.
- Fewer surprises at review: diffs match the agreed plan and style.

## Wrapping a long session safely
- Land small, independent commits instead of a giant mega-diff.
- Write a crisp changelog: what changed, why, risks, follow-up items.
- Archive the session memo and checkpoints for future runs; they become onboarding material for the next agent or engineer.

Long-running Claude sessions are less about hero prompts and more about disciplined scaffolding: clear goals, patch-based edits, tight validation, and periodic re-grounding. Build that loop, and Claude can code for hours without losing the plot.

## Quick FAQ
- **Can I let Claude push to main?** Only if protected by branch rules, required checks, and manual approvals. Safer pattern: Claude prepares PRs, humans review and merge.\n- **What about sensitive code?** Keep secrets out of prompts, scrub logs, and restrict file access. Use redaction proxies or local models for secret-adjacent work.\n- **Does Claude handle binary or large files?** No—summarize the intent, describe the binary’s role, and adjust surrounding code. Keep Claude away from direct binary edits.\n- **How do I avoid style drift?** Pin formatters, share exemplar files, and periodically ask Claude to diff its output against the exemplars. If drift appears, rewrite the session memo to emphasize style constraints.\n- **How do I pause and resume?** End a session with a checkpoint memo: goals, completed work, diffs merged, open risks, and the next 2–3 steps. Paste that memo into the next thread to resume within minutes.\n
### References
- https://claude.com/customers/emergent
