---
name: grill
description: Proactively clarify product direction through one concrete, consequential question at a time, using illustrated A/B/C alternatives when visual examples help. Record the approved gameplay, frontend, architecture, and quality decisions in the owning repository before implementation issues are written.
---

# Grill

Turn the owner's informal intent into a durable specification that future agents can implement without inventing a smaller MVP. This is a direct human-to-agent skill, not another work loop or issue queue.

## Prepare

1. Identify the owning repository and the intended outcome. Read its `AGENTS.md`, installed conventions, existing vision/roadmap, ADRs, relevant issues, and code where needed. Repository-local authority wins; reuse established documentation rather than creating a competing source.
2. Summarize what is already decided, what the owner wants, and the *consequential* unknowns. When visible product progress is stagnant or the desired user experience is unclear, proactively establish what the owner should see, do, and feel in the frontend before agents choose implementation shortcuts. Architecture and mechanics remain legitimate questions, but do not let them displace an undefined user-facing target.
3. Look for missing expectations that would otherwise produce a misleading "done": target behavior, representative workflows, expected scale, responsiveness or performance constraints, interoperability, quality floor, exclusions, and reference artifacts. For requested features, identify an initial independently useful workflow the owner can actually try on GitHub Pages or an equivalent product interface, rather than planning only backend stages. Ask only when the expected experience is genuinely unresolved. Do not invent thresholds or requirements.
4. For an existing visual product, inspect the real Pages experience and available project screenshots or recordings when tools permit. Compare it to the intended experience rather than measuring progress by PR or issue counts. Never claim to have inspected a page, prototype, or image unless you actually did.

## Ask

- **Initiate the missing questions yourself** when a consequential product choice is unclear; do not require the owner to repeatedly ask to be grilled or to write a detailed specification. Begin with the user-visible milestone, first-minute experience, key interaction, or visual identity when those are the actual unknowns.
- Ask **one question per turn**, normally resolving at most **3–5 consequential decisions per session**. For an owner-requested extended or daily session (such as 8–12 questions), continue only while the questions resolve real choices. Stop earlier when the next questions would not change the design or when the owner asks to wrap up. Do not continue indefinitely to fill a quota.
- Ask only about a genuine fork with materially different consequences. Do not offer false opposites, options where one subsumes another, or a forced choice when the design space is open. Offer distinct alternatives and a brief recommendation when useful, or ask an open-ended question.
- Make options **specific and imaginable**: usually label 2–3 distinctly different outcomes **A/B/C**, describe what the user/player would actually see or do, and explain the relevant trade-off briefly. Recommend one option with a concrete reason when evidence supports it, without presenting the recommendation as an owner decision.
- **Illustrate visual choices** when image presentation is supported: show one relevant reference picture alongside each option, with comparable size, short alt description, and clearly different visual or interaction goals. Prefer existing project screenshots, owner-provided references, or attributable external inspiration. Use image search/rendering only when appropriate and available; label references as *inspiration*, not screenshots of the current product or a promise of exact assets. Never commit third-party imagery to the repo without rights. When image tools are unavailable, provide concise descriptive examples or links instead; do not pretend images were shown.
- State just enough context and trade-off to make a decision. Do not ask what repository instructions, code, or prior decisions already answer. Avoid large questionnaires.
- In driving/voice conversations, keep turns short and omit code and long lists. Speak the concise A/B/C descriptions even if visual references are also available in the text interface; images must not be required to answer. Track prior answers within the session, and ask the next consequential question after each answer.
- Distinguish an owner decision from an agent-inferable implementation detail. Record nonblocking unknowns rather than grilling about them.

## Persist the result

Write changes to the **owning repository** once the consequential decisions are settled or the owner asks to stop. Preserve existing structure and content; make targeted updates, not a full product rewrite. Owner-approved product decisions and the resulting current explicit specification are authoritative; an independent acceptance agent verifies that updated tests faithfully express those decisions, but does not approve or veto the owner's product intent (see `acceptance-contract`).

- **Product vision / roadmap:** Describe the intended end state, important user or gameplay scenarios, target scale, quality bar, explicit non-goals, and staged outcomes. An intermediate MVP is a milestone only when the owner explicitly accepts it, not a silent substitute for the target.
- **ADR / architecture documentation:** Record consequential architecture or mechanics choices with their rationale, constraints, ownership/seams, and rejected alternatives when relevant. Follow the repository's existing ADR convention.
- **Verification references:** Link supplied screenshots, videos, prototypes, recorded interactions, fixtures, benchmarks, or other observable examples. Distinguish an illustrative option image from an explicitly approved appearance or asset. For new features, specify the first owner-checkable Pages/demo workflow, entrypoint, actions, and expected visible result. Translate expectations into measurable acceptance criteria where feasible, without making up budgets or evidence. Prioritize executable architecture invariants over unenforceable structural prose where practical; the owning repository retains its tests.
- **Uncertainty:** Mark open decisions, assumptions, and intentionally deferred concerns explicitly. Identify which ones block implementation; do not recast undecided choices as requirements.

Prefer one concise existing document for each kind of information over duplicate prose. Do not create implementation issues by default; create bounded issues when the owner asks for them, using `issue-preflight`. Issues reference the durable specification instead of restating the product vision.

Finish with a short recap of decisions, documents changed, unresolved questions, and any issues created. If repository write access is unavailable, supply a ready-to-apply draft and state that it was not persisted.

## Invocation and presentation

- **Claude Code / Codex:** `/grill <project> <product decision>` where skills are linked in the agent's skills directory.
- **ChatGPT with GitHub access:** ask, for example, "Use the `grill` skill from `moritzbrantner/dotfiles/skills/grill/SKILL.md` to clarify ARPG combat. Show illustrative A/B/C images and ask me one concrete question at a time." Fetch the current skill text from GitHub and follow it. A GitHub Markdown file is **not** automatically an installed ChatGPT slash command.
- Use illustrated choices for visual experience questions, not as filler for backend or architecture questions. No images are required in voice-only sessions.

**Example question format (illustrative, not a product decision):** "What should the first playable demo prove?" A — satisfying combat (animated hit reactions); B — complete five-minute quest (exploration and rewards); C — compelling world presentation (environment and lighting). Accompany each with an appropriately labeled reference picture when supported, give a short reasoned recommendation, and end with **"A, B, or C?"**
