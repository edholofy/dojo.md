---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, and CTAs mapped to search intent. Use when creating or optimizing Google Search campaigns, diagnosing Quality Score issues, or building complete ad groups from keyword research through final copy."
---

## Domain Knowledge

### Character Limits — The Numbers That Matter
- **Headlines: 30 characters.** Not 35, not "about 30." Exactly 30. Count every character including spaces, hyphens, em dashes, ampersands.
- **Descriptions: 90 characters.** Use at least 72+ (80%) to avoid wasting premium real estate.
- **Sitelink titles: 25 characters.** Sitelink descriptions: 35 characters each (two lines).
- **Callouts: 25 characters.** Each callout must be a distinct benefit not already in your headline/description.
- **Structured snippet values: 25 characters.** Must use Google-approved headers (Amenities, Brands, Courses, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types).

### Character Counting Traps
- Em dashes (—) = 1 character. Hyphens (-) = 1 character. Ampersands (&) = 1 character.
- "Free" = 4 chars. "100%" = 4 chars. Common miscounts happen on words with double letters.
- A headline reading "Transform Your Business Today" = 30 chars exactly. "Transform Your Business Today!" = 31 — VIOLATION.
- **LLMs cannot reliably count characters by estimation.** You must count letter-by-letter, every time, no exceptions.

### Quality Score — The Three Levers
1. **Expected CTR:** Driven by headline specificity, strong CTAs, numbers, and emotional triggers. Generic headlines like "Best Service Available" kill CTR.
2. **Ad Relevance:** The target keyword's core meaning must appear naturally in at least 1-2 headlines and 1 description. This is about semantic match, not keyword stuffing.
3. **Landing Page Experience:** The ad's promise must be fulfilled on the landing page. If your ad says "Free Trial," the landing page must show a free trial — not a pricing page with a buried trial link.

### Search Intent — The Four Types and What They Demand
| Intent | User Mindset | Ad Strategy | CTA Style |
|---|---|---|---|
| Informational | "I want to learn" | Educate, offer guides/resources | "Learn More," "Get the Guide" |
| Commercial | "I'm comparing options" | Differentiate, use social proof | "See Why 10K+ Choose Us," "Compare Plans" |
| Transactional | "I'm ready to buy" | Sell directly, urgency, price | "Buy Now," "Start Free Trial" |
| Navigational | "I want that specific brand" | Redirect to correct page, reinforce brand | "Visit Official Site," "Log In" |

Mismatching intent wastes spend. An informational searcher seeing "Buy Now — 50% Off" bounces. A transactional searcher seeing "Learn About Our Philosophy" doesn't convert.

### DKI — When It Helps and When It Breaks
- Correct syntax: `{KeyWord:Default Text}` — capital K and W = Title Case insertion.
- `{keyword:default}` = lowercase. `{KEYWORD:DEFAULT}` = ALL CAPS.
- The **default text** must fit within 30 characters for headlines, and the **longest keyword in the ad group** must also fit. If your longest keyword is "professional accounting software" (35 chars), DKI in a headline will overflow and fall back to default.
- DKI is dangerous with competitor names (trademark violations), misspelled queries, awkward phrases ("buy cheap dentist near me"), and sensitive topics.

### RSA Pinning Strategy
- Pin your highest-relevance keyword headline to Position 1 (what they searched for).
- Pin your strongest CTA headline to Position 3 (the action driver).
- Leave Position 2 unpinned to let Google optimize for differentiation/benefits.
- Pinning all three positions eliminates Google's machine learning advantage. Only pin when you have a strategic reason.

### Urgency That's Legitimate vs. Policy-Violating
- **Legitimate:** Real deadlines ("Offer Ends March 31"), genuine scarcity ("Only 3 Spots Left This Month" — if true), seasonal relevance ("2024 Tax Season Filing").
- **Policy-violating:** Fake countdown timers, perpetual "Last Chance" claims, invented scarcity ("Only 2 Left!" on a digital product), misleading discount origins ("Was $999" when it was never $999).
- Google's Misrepresentation policy catches these. Disapproved ads tank account-level quality.

### Headline Formula Diversity — Not Cosmetic, Structural
Five formulas that produce genuinely different ads:
1. **Problem-Solution-Result:** "Tired of X? [Product] Delivers Y"
2. **Authority/Proof:** "[Number] Clients Trust Us | [Credential]"
3. **Specificity/Numbers:** "Save $X in Y Days | [Precise Benefit]"
4. **Emotional/Aspirational:** "Finally, [Desired Outcome] Without [Pain Point]"
5. **Direct CTA/Urgency:** "Get [Offer] — [Deadline/Scarcity]"

Swapping adjectives between formulas is not diversity. Each formula targets a different psychological trigger.

## Quick Start

**Task:** Write an RSA for the keyword "project management software" (transactional intent).

**Headlines (15 required, all ≤30 chars):**

| # | Headline | Chars | Pin |
|---|---|---|---|
| 1 | Project Management Software | 28 | Pin 1 |
| 2 | Start Your Free Trial Today | 27 | Pin 3 |
| 3 | Trusted by 50,000+ Teams | 24 | — |
| 4 | Plans Starting at $9/Month | 26 | — |
| 5 | Streamline Every Project | 24 | — |
| 6 | Gantt Charts & Kanban Boards | 28 | — |
| 7 | See Results in Week One | 23 | — |
| 8 | No Credit Card Required | 23 | — |
| 9 | Rated #1 by G2 Users | 20 | — |
| 10 | Cut Project Delays by 40% | 25 | — |
| 11 | All-in-One PM Platform | 22 | — |
| 12 | Real-Time Team Collaboration | 29 | — |
| 13 | Free 14-Day Trial Available | 27 | — |
| 14 | Built for Agile & Waterfall | 27 | — |
| 15 | Migrate Free From Any Tool | 26 | — |

**Descriptions (4 required, all ≤90 chars):**

| # | Description | Chars |
|---|---|---|
| 1 | Manage tasks, timelines, and teams in one place. Start your free trial — no card needed. | 89 |
| 2 | Trusted by 50,000+ teams worldwide. Gantt charts, Kanban boards, and real-time reporting. | 90 |
| 3 | Reduce project delays by 40% with automated workflows. Plans from $9/mo. Try it free. | 87 |
| 4 | Switch from your current tool in minutes. Free migration support and 24/7 live chat help. | 89 |

**Validation pass:** Every element re-counted character-by-character. Descriptions cover: feature/CTA, social proof/features, results/pricing, onboarding/support — four distinct angles. Any headline + any description = coherent ad.

## Core Rules

1. **ALWAYS count characters by spelling out each character position (1-by-1) for every headline, description, sitelink, callout, and snippet value before including it in output.** LLM estimation is unreliable and consistently produces violations at the boundary. When in doubt, recount.

2. **ALWAYS run a separate adversarial validation pass after generating all copy.** Re-count every element from scratch. Flag anything within 2 characters of the limit for triple-checking. Mark each element with its exact character count. Do not copy-paste your earlier count — recount independently.

3. **When predicting performance metrics (CTR, conversion rates, improvement percentages), explicitly state these are directional estimates based on general advertising principles, not sourced data.**
   ```
   Step 1: Generate the prediction
   Step 2: Check — is there a specific, citable source?
   Step 3a: If yes → cite it
   Step 3b: If no → prefix with "Directionally, based on general
            advertising principles..." and avoid false-precision
            ranges like "17.3-22.1%"
   ```

4. **Before generating output involving psychological concepts, enumerate all required concepts from the task brief, define each one precisely, then address each distinctly.**
   ```
   Step 1: List every psychological concept requested
   Step 2: Write a 1-sentence clinical definition of each
   Step 3: Verify no two definitions overlap or conflate
   Step 4: In output, address each under its own label with
           its distinct mechanism explained
   ```

5. **Prefer maximizing character usage (80%+ of limit) over brevity when writing headlines and descriptions.** A 19-character headline in a 30-character space wastes 11 characters of paid real estate. After drafting, review any element under 80% utilization and strengthen it with qualifying specifics, stronger verbs, or additional value — unless brevity is deliberately chosen for emphasis (e.g., "Try It Free" as a punchy CTA).

## Decision Tree

**If** writing a headline →
  **If** it contains DKI syntax → verify longest keyword in ad group + DKI wrapper fits ≤30 chars. **If** it doesn't fit → use static headline instead.
  **If** it's for Pin Position 1 → include primary keyword or closest semantic match.
  **If** it's for Pin Position 3 → use action-oriented CTA with specific verb.
  **If** character count is ≤24 → attempt to add meaningful specificity to reach 25-30 range.

**If** writing a description →
  **If** character count is <72 → revise to use more of the 90-char space.
  **If** description echoes a headline verbatim → rewrite with a complementary angle.
  **If** all descriptions cover the same angle → redistribute across: benefits, features, social proof, CTA, objection handling.

**If** classifying search intent →
  **If** keyword contains "buy," "price," "coupon," "order," "deal" → transactional.
  **If** keyword contains "best," "vs," "review," "compare," "top" → commercial investigation.
  **If** keyword contains "how to," "what is," "guide," "tutorial" → informational.
  **If** keyword contains a brand name → navigational.
  **If** keyword is ambiguous (e.g., "CRM software") → treat as mixed commercial/transactional, write copy that bridges both, lead with value comparison but include transactional CTA.

**If** writing extensions →
  **If** sitelink → each must point to a genuinely distinct page (not /pricing and /plans if they're the same page).
  **If** callout → must not duplicate what's already in any headline or description in the same ad group.
  **If** structured snippet → must use an approved Google header. **If** the business doesn't fit any approved header naturally → skip structured snippets rather than force-fitting.

**If** using urgency or scarcity →
  **If** the deadline/limit is real and verifiable → use it.
  **If** the scarcity is manufactured or applies to a digital/unlimited product → do not use. Switch to value-based urgency ("Start Saving This Week").
  **If** the offer is evergreen → use time-value urgency ("Every Day Without X Costs You Y") not fake deadlines.

**If** diagnosing Quality Score →
  **If** low Expected CTR → problem is weak headlines — add specificity, numbers, stronger CTAs.
  **If** low Ad Relevance → problem is keyword-to-ad mismatch — ensure target keyword appears naturally in headlines/descriptions.
  **If** low Landing Page Experience → problem is ad-to-page mismatch — recommend landing page changes that fulfill ad promises.

## Edge Cases

### Trap: Self-validated character counts that are wrong
The agent writes "Transform Your Business Now ✅ (28 chars)" when it's actually 29 characters. The checkmark creates false confidence.
**Correct handling:** Spell it out: T-r-a-n-s-f-o-r-m (9) + space (10) + Y-o-u-r (14) + space (15) + B-u-s-i-n-e-s-s (23) + space (24) + N-o-w (27). Actually 27. But the point is: count explicitly every time, don't trust gut estimation.

### Trap: DKI with long keywords
Ad group contains "affordable project management software for small teams" (52 chars). Agent uses `{KeyWord:PM Software}` in headline. The default fits (11 chars), but when the keyword inserts, it overflows catastrophically.
**Correct handling:** Calculate max keyword length in the ad group. If any keyword exceeds 30 chars minus DKI wrapper overhead, either exclude those keywords from DKI ad groups or use only static headlines. Always provide a non-DKI headline variant as a safety net.

### Trap: Sitelinks that look different but go to the same page
"View Pricing" → /pricing and "See Our Plans" → /pricing#plans. These are functionally the same destination.
**Correct handling:** Each sitelink must represent a genuinely distinct user journey: Pricing, Case Studies, Free Trial, Contact Us — four different pages, four different user needs.

### Trap: Callouts that repeat headline content
Headline: "Free Shipping on All Orders." Callout: "Free Shipping." This wastes a callout slot.
**Correct handling:** Callouts must add net-new information not present anywhere else in the ad. If "Free Shipping" is in a headline, the callout should say "No Minimum Order" or "24/7 Support" — adjacent but distinct value.

### Trap: "Diverse" headlines that are cosmetically different
"Save Money Today" / "Cut Costs Now" / "Reduce Spending Fast" — three headlines, one idea.
**Correct handling:** Diversity means different *types* of appeal: one benefit, one proof point, one CTA, one feature, one urgency trigger. Not synonym swapping.

### Trap: Fabricating specific CTR predictions
"This headline formula typically achieves 15-25% higher CTR based on industry benchmarks."
**Correct handling:** "Based on general advertising principles, specificity-driven headlines (with numbers and concrete benefits) directionally outperform generic alternatives. Actual CTR impact will depend on your specific market, competition, and audience."

### Trap: Conflating psychological concepts
Agent explains "loss aversion" but describes FOMO, or calls "commitment bias" what is actually "sunk cost fallacy."
**Correct handling:**
- **Loss aversion:** People weigh losses ~2x more than equivalent gains (Kahneman & Tversky). "Don't lose your spot" > "Get a spot."
- **FOMO (Fear of Missing Out):** Social/experiential anxiety about others having what you don't. "Join 50,000 marketers already inside."
- **Commitment bias:** Once someone takes a small step, they're more likely to continue (foot-in-the-door). "Start your free trial" → paid conversion.
- **Sunk cost fallacy:** Continuing because of already-invested resources. Different from commitment bias in that it's retrospective, not prospective.

## Anti-Patterns

**DON'T** estimate character counts and mark them as verified. Instead, count each character position explicitly (or use a deterministic function) for every single piece of copy, every time.

**DON'T** write sitelinks as variations of the same concept ("Our Services," "What We Offer," "Service Overview"). Instead, make each sitelink a distinct destination serving a different user need (Pricing, Case Studies, Free Demo, About Us).

**DON'T** present fabricated statistics with false precision ("18-24% CTR improvement"). Instead, describe expected directional impact and qualify that specific numbers depend on market context.

**DON'T** create "diverse" headlines by swapping synonyms across the same message structure. Instead, use structurally different formulas (problem-solution, social proof, specificity, emotional, CTA) that target different psychological triggers.

**DON'T** use DK