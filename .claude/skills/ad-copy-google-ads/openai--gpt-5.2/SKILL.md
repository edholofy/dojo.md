---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, CTAs, and intent-matched campaigns. Use when creating, auditing, or improving Google Search ad copy, ad groups, or extension assets."
---

## Domain Knowledge

### Character Limits (Memorize These — Violations Are the #1 Failure)
- **Headlines: 30 characters** (not words). Count every letter, space, and punctuation mark.
- **Descriptions: 90 characters**. Use 80+ to avoid wasting space; never exceed 90.
- **Sitelink text: 25 characters**. Sitelink descriptions: 35 characters each (2 lines).
- **Callouts: 25 characters**. No punctuation needed — they display as a list.
- **Structured snippet values: 25 characters** per value.
- **DKI headline with `{KeyWord:Default}`: The default text AND the longest keyword must each fit in 30 characters including the DKI syntax wrapper.**

### DKI Syntax — The Exact Rules
- Format: `{KeyWord:Default Text}` — the curly braces, colon, and capitalization pattern are all meaningful.
- Capitalization variants: `{keyword:default}` = lowercase, `{Keyword:default}` = title case first word, `{KeyWord:Default}` = title case all words, `{KEYWORD:DEFAULT}` = ALL CAPS.
- The entire `{KeyWord:Default Text}` token counts as the length of the **longest triggering keyword** OR the default text, whichever is longer, for character limit purposes.
- **Critical trap**: If your longest keyword is 28 characters, you have only 2 characters left in a 30-char headline. Most people forget to check this.

### DKI Risks Most People Miss
- Competitor brand names in keyword lists → your ad says "Buy [Competitor Name]" which violates trademark policy.
- Misspelled keywords (broad match) inserting into headlines → "Cheep Sofware" in your ad.
- Grammatically awkward insertions: "Get {KeyWord:Solutions} Today" + keyword "data analytics consulting services" → broken grammar.
- Sensitive/negative terms: keywords like "mold removal" or "debt relief" can create alarming ad copy in wrong context.
- **Always provide 2-3 static (non-DKI) headline alternatives** as safety nets.

### Quality Score — The Three Levers
1. **Expected CTR**: Driven by headline specificity, emotional triggers, numbers, and strong CTAs. Generic headlines ("Best Service Available") kill CTR.
2. **Ad Relevance**: The target keyword's core concept must appear naturally in at least 1 headline and 1 description. Not keyword stuffing — semantic alignment.
3. **Landing Page Experience**: The ad's promise must be fulfilled on the landing page. If the ad says "Free Trial," the landing page must show a free trial — not a pricing page. Recommend specific landing page content changes, not just "improve your landing page."

### Urgency That Passes Google Policy
- **Legitimate**: Real deadlines ("Ends March 31"), genuine inventory scarcity ("Only 12 Left in Stock"), seasonal relevance ("2024 Tax Season"), value-based ("Save Before Rates Rise").
- **Policy violations**: Fake countdown timers with no real deadline, perpetual "Last Chance" that runs year-round, "Only 3 Left!" when inventory is unlimited, excessive exclamation marks or ALL CAPS pressure.
- **Why urgency works (know the psychology)**: Loss aversion (losing a deal hurts 2x more than gaining equivalent value), FOMO (social proof + scarcity compound), commitment bias (small first step → larger conversion), temporal discounting (immediate reward valued over future benefit).

### Search Intent → Copy Strategy Matrix
| Intent | User Mindset | Headline Focus | Description Focus | CTA Style |
|---|---|---|---|---|
| Informational | Learning, researching | "How to…" / "Guide to…" | Educate, offer resource | "Download Guide," "Learn More" |
| Commercial | Comparing options | Differentiators, "vs," "Best" | Social proof, comparisons | "Compare Plans," "See Why" |
| Transactional | Ready to buy | Price, offer, product name | Urgency, guarantee, specifics | "Buy Now," "Start Free Trial" |
| Navigational | Looking for specific brand | Brand name + product | Direct to specific page | "Visit Official Site," "Log In" |

**Counter-intuitive insight**: Mixed-intent keywords (e.g., "best CRM software") need copy that bridges commercial AND transactional — compare in the headline, convert in the description. Don't force a single intent.

### RSA Headline Diversity Framework (15 Headlines Should Cover All 6 Categories)
1. **Keyword-rich** (2-3): Direct keyword match for relevance score
2. **Benefit-driven** (2-3): What the user gains — use specific numbers ("Save 40%," "In 24 Hours")
3. **CTA-driven** (2-3): Action verbs + specific next step
4. **Social proof** (2-3): Numbers, awards, ratings ("Trusted by 50K+ Teams")
5. **Urgency/offer** (1-2): Time-limited, genuine scarcity
6. **Differentiator** (1-2): What competitors can't claim

**Pinning tradeoff**: Pinning controls message but reduces Google's optimization combinations. Pin only when message sequence matters (e.g., pin brand name to H1 for branded campaigns). Never pin all 15 headlines.

### Description Writing — The Independence Rule
Every description must make sense paired with ANY headline combination. Test by reading Description 3 with Headline 7 — does it still work? If a description says "As mentioned above…" or depends on a specific headline, it fails.

Descriptions should cover **different angles**: one benefit-focused, one feature-focused, one social proof, one CTA-heavy. Not four versions of the same benefit.

### Ad Copy Formula Cheat Sheet
1. **Problem-Agitate-Solve**: State pain → amplify consequence → offer solution
2. **Before-After-Bridge**: Current state → desired state → your product is the bridge
3. **Feature-Advantage-Benefit**: What it is → why it matters → what user gets
4. **Social Proof Lead**: Authority/numbers first → then offer → then CTA
5. **Direct Response**: Offer first → qualifier → urgent CTA

Each formula genuinely changes tone and structure. Swapping two words between formulas is not "distinct" — the emotional arc must differ.

### CTR/Conversion Prediction Grounding
Don't guess randomly. Use these directional benchmarks:
- Social proof headlines typically lift CTR 10-20% over generic equivalents
- Specific numbers ("Save $247/mo") outperform vague claims ("Save Money") by ~30% CTR
- Urgency with real deadlines lifts CTR 15-25% but can reduce conversion quality if overused
- DKI headlines average 10-15% CTR improvement vs static when keywords are clean
- Transactional intent keywords convert 3-5x higher than informational, but cost 2-4x more per click

### Extensions — Non-Obvious Rules
- **Sitelinks must point to genuinely different pages**. "Pricing" and "Our Plans" going to the same URL is a waste. Each sitelink = distinct user journey.
- **Callouts should NOT repeat what's in headlines/descriptions**. If your headline says "Free Shipping," don't make a callout "Free Shipping." Use callouts for secondary benefits: "No Contract," "24/7 Support," "Family-Owned Since 2005."
- **Structured snippets use Google-approved headers only**: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. Pick the closest match — don't invent headers.

## Quick Start

**Input**: "Write a Google Search ad for an online project management tool targeting small businesses. Target keyword: project management software for small teams."

**Output**:

**Headlines** (each ≤30 chars, counted precisely):
1. `Project Management for Teams` (29) — keyword-rich, pin to H1
2. `Manage Projects Effortlessly` (29) — benefit
3. `Start Your Free Trial Today` (27) — CTA
4. `Trusted by 25,000+ Teams` (24) — social proof
5. `Plans Starting at $9/Month` (26) — differentiator
6. `Organize Tasks in Minutes` (25) — benefit
7. `No Credit Card Required` (23) — objection handling
8. `Built for Small Teams` (21) — keyword-rich
9. `See Why Teams Switch to Us` (26) — commercial bridge
10. `Collaborate From Anywhere` (26) — benefit
11. `Get Started in 5 Minutes` (25) — CTA
12. `4.8★ Rating on G2 Crowd` (23) — social proof
13. `Replace Messy Spreadsheets` (27) — problem-aware
14. `Simple, Powerful, Affordable` (29) — differentiator
15. `Try It Free — No Risk` (21) — CTA + objection

**Descriptions** (each ≤90 chars):
1. `Streamline your team's workflow with drag-and-drop task boards. Start free — no card needed.` — wait, that's 93. Let me recount.
1. `Streamline your team's workflow with drag-and-drop boards. Start free, no card needed.` (86) — feature + CTA
2. `Join 25,000+ small teams who ditched spreadsheets for faster project delivery. See plans.` (90) — social proof + CTA
3. `Assign tasks, set deadlines, and track progress in one place. Plans from $9/mo per user.` (89) — feature list + pricing
4. `Rated 4.8/5 by real users. Unlimited projects on every plan. Try free for 14 days today.` (89) — proof + offer + urgency

**Sitelinks** (text ≤25, descriptions ≤35 each):
| Sitelink Text | Desc Line 1 | Desc Line 2 | Destination |
|---|---|---|---|
| `See All Pricing Plans` (22) | `Plans from $9/mo per user.` (27) | `No hidden fees. Cancel anytime.` (31) | /pricing |
| `Watch 2-Min Demo` (17) | `See the tool in action fast.` (29) | `No signup needed to watch.` (26) | /demo |
| `Customer Success Stories` (24) | `Real results from small teams.` (31) | `Read case studies and reviews.` (31) | /case-studies |
| `Free Templates Library` (23) | `Project templates for teams.` (29) | `Download and use immediately.` (30) | /templates |

**Callouts** (each ≤25, none duplicating ad copy):
`Unlimited Storage` (17) · `SOC 2 Certified` (15) · `99.9% Uptime SLA` (16) · `Slack Integration` (17)

**Structured Snippets**:
Header: `Types`
Values: `Task Management` (15) · `Gantt Charts` (12) · `Team Dashboards` (15) · `Time Tracking` (13)

## Core Rules

1. **Count characters for every headline, description, sitelink, callout, and snippet value before outputting.** Show the count in parentheses. A single violation invalidates the entire ad. Headlines=30, Descriptions=90, Sitelinks=25, Sitelink descriptions=35, Callouts=25, Snippet values=25.

2. **When using DKI, calculate the longest keyword in the ad group and verify it fits within the 30-char headline limit.** Then list 2-3 specific keywords that would create awkward/misleading/grammatically broken copy if inserted, and provide static fallback headlines for each.

3. **When predicting CTR or conversion impact, cite the specific advertising principle driving the prediction.** "Social proof headlines lift CTR ~15% due to bandwagon effect" not "this one will perform better."
   - Step 1: Identify which psychological trigger the copy uses
   - Step 2: Reference directional benchmark from this document
   - Step 3: Adjust for industry/intent context
   - Step 4: State prediction with reasoning

4. **Every callout must pass the "does this already appear in my headlines/descriptions?" test.** If yes, replace it with a secondary benefit, trust signal, or logistical detail (shipping, support hours, certifications).

5. **When writing urgency triggers, state the factual basis.** If writing a sample ad, explicitly note whether the urgency is real or hypothetical. Never suggest perpetual urgency tactics (always-running "last chance" ads).

6. **Every RSA description must be tested against the independence rule: pair it mentally with your weakest/most different headline.** If it doesn't make sense standalone, rewrite it. Descriptions must cover at least 3 distinct angles across the set (benefits, features, proof, CTA, objection handling).

## Decision Tree

- **If the task is "write a complete ad/campaign"** → produce full RSA (15 headlines + 4 descriptions) + sitelinks + callouts + structured snippets + DKI variants + pinning strategy. Character counts on every element.

- **If the task is "audit/fix existing copy"** → identify the specific mistake category (generic copy, feature dumping, keyword stuffing, intent mismatch, character violation, policy violation) → rewrite with before/after → explain which Quality Score component improves and why.

- **If the keyword has mixed intent** → write headlines that bridge intents (commercial headline + transactional CTA) rather than forcing a single intent. Include ad group split recommendation if intents are too divergent.

- **If DKI is requested** → check all keywords for: (a) character overflow, (b) trademark/competitor names, (c) grammatical fit in the template, (d) sensitive/negative terms. Flag each risk with the specific problematic keyword.

- **If the product/service is in a restricted category** (health, finance, legal) → apply stricter urgency rules, avoid superlatives without qualification, ensure claims are substantiated, and note relevant Google Ads policy constraints.

- **If asked to apply ad copy formulas** → produce 5 genuinely distinct versions where the emotional arc, sentence structure, and messaging hierarchy differ — not surface-level word swaps. Map each formula to an audience segment with reasoning.

- **If writing CTAs** → match verb specificity to conversion goal: "Start Free Trial" (trial), "Get Custom Quote" (lead gen), "Shop [Category]" (ecommerce), "Book Your Call" (consultation). Never use "Click Here" or "Submit."

## Edge Cases

### DKI + Long Keywords
**Trap**: User provides keyword list where the longest keyword is "enterprise project management software" (41 chars). DKI headline `{KeyWord:Project Tools}` would overflow.
**Correct handling**: Flag the keyword explicitly — "At 41 characters, 'enterprise project management software' exceeds the 30-char headline limit and will trigger the default text. Verify your default text fits. Consider moving long-tail keywords to a separate ad group with static headlines."

### "Write 5 different formula versions" That Are Actually Different
**Trap**: Producing 5 versions that all open with a benefit and end with a CTA, just with different adjectives.
**Correct handling**: Each formula must change the **structural order** of elements:
- PAS: Opens with pain → "Tired of Missed Deadlines?"
- BAB: Opens with current state → "Still Using Spreadsheets?"
- FAB: Opens with feature → "AI-Powered Task Routing"
- Social Proof: Opens with authority → "Rated #1 by 50K Teams"
- Direct Response: Opens with offer → "Free 30-Day Trial"

### Callouts That Duplicate Ad Copy
**Trap**: Headline says "Free Shipping on All Orders" and callout says "Free Shipping."
**Correct handling**: Replace the callout with something NOT in the ad: "Easy Returns" / "Live Chat Support" / "Family-Owned Since 1998." Callouts expand the value proposition; they don't echo it.

### Sitelinks to the Same Page
**Trap**: "View Pricing" and "See Our Plans" both link to /pricing.
**Correct handling**: Each sitelink must represent a distinct user journey. Replace the duplicate with a genuinely different destination: /features, /case-studies, /demo, /about, /blog, /free-trial.

### Urgency That Violates Policy
**Trap**: Client says "add urgency" and you write "⚠️ LAST CHANCE — Only 2 Left! Act NOW!!!"
**Correct