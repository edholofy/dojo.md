---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, and CTAs optimized for Quality Score and search intent. Use when creating, auditing, or rewriting Google Search ad campaigns from keyword research through final copy with extensions."
---

# Google Ads Copywriting

## Domain Knowledge

### Character Limits (Memorize These)
| Element | Limit | Min Utilization Target |
|---|---|---|
| RSA Headline | 30 chars | 27+ chars (90%) |
| RSA Description | 90 chars | 83+ chars (92%) |
| Sitelink title | 25 chars | 22+ chars |
| Sitelink description | 35 chars | 31+ chars |
| Callout extension | 25 chars | 20+ chars |
| Structured snippet value | 25 chars | 20+ chars |

**Word budgets for drafting (constraint-first method):**
- 30 chars ≈ 5–6 words. Think in 5-word phrases.
- 90 chars ≈ 15–17 words. Think in 2 short sentences or 1 punchy sentence.
- 25 chars ≈ 4 words. Think in fragments.
- 35 chars ≈ 5–6 words.

### Character Counting Traps
- Em dash (—) = count as **1 character** in Google Ads interface, but verify platform behavior.
- **Default rule when ambiguous:** count special characters at their maximum possible byte length to avoid violations.
- Smart quotes (" ") vs straight quotes (" ') — use straight quotes; they're consistently 1 char.
- Spaces count. Pipes count. Ampersands count.
- **Never trust your own manual count.** Always recount each item letter-by-letter as a final gate. If you produce 15 headlines, recount all 15 individually at the end.

### DKI Syntax & Rules
- Correct format: `{KeyWord:Default Text}` — the entire token including braces must fit within 30 chars.
- Capitalization variants: `{keyword:default}` (lowercase), `{Keyword:Default}` (title case first word), `{KeyWord:Default}` (title case all words), `{KEYWORD:DEFAULT}` (all caps).
- The **default text** appears when the triggering keyword is too long or unavailable. It must be compelling standalone copy, not a throwaway like "Click Here."
- **Critical check:** Take your longest keyword in the ad group and substitute it into the DKI slot. Does the full headline exceed 30 chars? If yes, shorten the default or restructure.
- DKI risks: competitor names inserting, misspelled queries appearing, grammatically broken sentences ("Buy Best Running Shoes Near Me Today"), sensitive/inappropriate terms.
- **Always provide 2+ static non-DKI headline alternatives** as safety variants.

### Quality Score — The Three Levers
1. **Expected CTR:** Specific numbers beat vague claims. "Save 47%" > "Save Big." Strong CTAs with action verbs. Emotional triggers.
2. **Ad Relevance:** The target keyword (or close variant) should appear naturally in at least 1 pinned headline and 1 description. Mirror the searcher's language exactly.
3. **Landing Page Experience:** The ad's promise must be immediately visible above the fold on the landing page. If you write "Free 14-Day Trial," the landing page must show that trial offer without scrolling.

**Non-obvious insight:** Quality Score is calculated per keyword, not per ad. The same RSA can score differently for different keywords in the same ad group. This is why tight ad group theming matters more than brilliant copy.

### Search Intent → Copy Strategy
| Intent | Signal Keywords | Copy Approach | CTA Style |
|---|---|---|---|
| Informational | how, what, why, guide | Educate → lead magnet | "Get Free Guide," "Learn How" |
| Commercial | best, vs, review, top | Compare → differentiate | "See Plans," "Compare Options" |
| Transactional | buy, order, price, discount | Sell → convert | "Buy Now," "Get 50% Off Today" |
| Navigational | [brand name], login | Redirect → confirm | "Visit Official Site," "Log In" |

**Non-obvious:** Mixed-intent keywords (e.g., "best CRM software pricing") are commercial AND transactional. Write headlines that compare AND sell. Don't pick one intent—bridge them.

### Urgency & CTAs Without Policy Violations
**Legitimate urgency:** Real deadlines ("Offer Ends Dec 31"), genuine scarcity ("Only 12 Spots Left" if true), seasonal relevance ("Get Ready for Tax Season"), value-based ("Start Saving Today").

**Policy violations (Google will disapprove):** Fake countdown timers, perpetual "Last Chance" claims that never expire, "Only 1 Left!" when inventory isn't actually limited, excessive exclamation marks in headlines (zero allowed in headlines; one max in descriptions).

**CTA hierarchy by conversion strength:** "Start Your Free Trial" > "Get Started" > "Learn More" > "Click Here" > "Submit." Always match the CTA to the actual next step—don't say "Buy Now" if the landing page is a lead form.

### Extension Strategy
- **Sitelinks:** Each must point to a genuinely different page (Pricing, Features, Case Studies, Contact — not "Learn More 1" and "Learn More 2").
- **Callouts:** Unique value props NOT already in headlines/descriptions. If headline says "Free Shipping," callout should say "24/7 Support" not "Fast Free Shipping."
- **Structured snippets:** Use Google-approved headers only: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. Values must be specific nouns/noun phrases, not sentences.

### Headline Formula Toolkit
1. **Problem-Solution-Result:** "{Problem}? {Solution} → {Result}" — "Messy Data? AutoClean Fixes It"
2. **Social Proof:** "{Number} {Users} Trust {Brand}" — "10,000+ Teams Use DataSync"
3. **Specificity:** Concrete numbers always — "Cut Costs 37%" not "Reduce Costs"
4. **Authority:** Credentials/awards — "Award-Winning CRM Platform"
5. **Emotional:** Fear of loss or aspiration — "Stop Losing Leads Today"

**Audience mapping:** Authority and social proof convert skeptical B2B buyers. Emotional and urgency convert B2C impulse buyers. Specificity converts comparison shoppers across both.

### Common Mistakes (Ranked by Impact)
1. **Generic copy** — "Best Solution for Your Needs" tells nobody anything. Fix: name the specific outcome.
2. **Feature dumping** — listing specs without connecting to benefits. Fix: "Feature → So What?" test.
3. **Keyword stuffing** — cramming exact match into every headline. Fix: 1–2 keyword-rich headlines pinned; rest focus on value.
4. **Ignoring the competition** — writing in a vacuum. Fix: search your keyword, read competing ads, differentiate.
5. **Weak descriptions** — treating them as an afterthought. Fix: descriptions do the heavy selling; headlines grab attention.

## Quick Start

**Task:** Write an RSA for "project management software" targeting transactional intent.

**Step 1 — Set word budgets:**
Headlines: 5–6 words each (≤30 chars). Descriptions: 15–17 words each (≤90 chars).

**Step 2 — Draft 15 headlines (varied angles):**
```
Pin 1: Project Management Software  [28c] ← keyword match
Pin 1: Best Project Management Tools [30c] ← keyword variant
Pin 2: Start Your Free Trial Today   [28c] ← CTA
Pin 2: Try It Free for 14 Days       [25c] ← CTA variant
       Trusted by 50,000+ Teams      [24c] ← social proof
       Plan Projects 3x Faster       [23c] ← specific benefit
       All Tasks in One Dashboard     [27c] ← feature-benefit
       No Credit Card Required        [24c] ← objection removal
       Cut Project Delays by 40%      [26c] ← specificity
       Award-Winning PM Platform      [28c] ← authority
       Collaborate in Real Time       [25c] ← feature-benefit
       See Why Teams Switch to Us     [26c] ← curiosity
       Built for Agile Teams          [22c] ← audience targeting
       Gantt Charts & Kanban Boards   [27c] ← feature proof
       Get Started in Under 5 Min     [26c] ← ease
```

**Step 3 — Draft 4 descriptions:**
```
D1: Manage tasks, timelines & teams in one platform. Start your free 14-day trial now.  [84c]
D2: Trusted by 50,000+ teams worldwide. Cut project delivery time by 40% on average.    [85c]
D3: Drag-and-drop Gantt charts, real-time collaboration & automated workflows included.  [87c]
D4: No credit card needed to start. See why teams switch from Monday & Asana every day.  [87c]
```

**Step 4 — Final character count verification (every item individually).**

**Step 5 — Pin strategy:** Pin keyword headlines to Position 1 (relevance). Pin CTA headlines to Position 2 (action). Leave Position 3 unpinned (let Google optimize). Acknowledge tradeoff: pinning reduces Google's optimization flexibility but ensures keyword relevance and CTA presence.

## Core Rules

1. **ALWAYS use constraint-first composition.** Before writing any copy element, state the character limit and word budget (e.g., "30 chars ≈ 5 words"). Draft within the budget, then count. Never draft freely and trim later—it produces weaker copy and wastes iterations.

2. **ALWAYS run a final character-count verification pass on every single output item.** Count each headline, description, sitelink, callout, and snippet value individually, character by character. Reject and rewrite anything exceeding the limit. Do not batch-verify or spot-check.

3. **ALWAYS run a utilization optimization pass after compliance checking.** Flag any headline using <27 of 30 chars or any description using <83 of 90 chars. For each flagged item, expand with specific numbers, stronger verbs, or additional value propositions. Minimum utilization: 90% of available characters.

4. **When counting special characters, apply maximum-length assumption.**
   ```
   For each special character (em dash, smart quotes, etc.):
     Check if platform-specific counting rules are known
     If known → apply those rules
     If unknown → count at maximum possible length
     Flag the character in output with a note
   ```

5. **ALWAYS provide static non-DKI alternatives alongside every DKI headline.** DKI can break with long keywords, competitor names, or misspelled queries. Provide at least 2 static headlines per DKI headline as safety nets.

6. **ALWAYS validate keyword-to-headline length for DKI.**
   ```
   For each DKI headline:
     Identify longest keyword in the ad group
     Substitute it into the DKI slot
     Count total characters including all static text
     If > 30 chars → shorten surrounding text or flag for removal
     If grammatically awkward when substituted → flag as risky
   ```

## Decision Tree

**If creating a new RSA from scratch →**
Identify target keywords → classify search intent → select appropriate copy strategy from intent table → draft 15 headlines (constraint-first) → draft 4 descriptions → verify all character counts → run utilization optimization → apply pinning strategy → add extensions.

**If search intent is mixed →**
Write headlines covering both intents (e.g., comparison AND purchase). Pin the dominant intent headline to Position 1. Let Google test the secondary intent headlines in other positions.

**If using DKI →**
Check longest keyword fits within 30 chars after substitution → verify no competitor names in keyword list → verify no misspelled keywords → test grammatical correctness with 3+ keyword substitutions → provide static fallbacks → set meaningful default text.

**If writing extensions →**
Sitelinks: Confirm each links to a genuinely different page. Callouts: Confirm no overlap with headlines/descriptions. Snippets: Confirm header is from Google's approved list. Then character-count each element.

**If auditing/fixing existing ads →**
Diagnose which Quality Score component is weak → if CTR: improve specificity, numbers, emotional triggers → if Relevance: add keyword to headline, mirror search language → if Landing Page: align ad promises with page content, recommend page changes.

**If writing urgency/CTAs →**
Is the deadline real? → Yes → use it with specific date. Is the scarcity genuine? → Yes → state exact quantity. Neither? → Use value-based urgency ("Start Saving Today") rather than manufactured pressure.

**If a headline exceeds 30 characters →**
Replace words with shorter synonyms → remove articles (a, the) → use ampersand (&) instead of "and" → use numerals instead of spelled numbers → use common abbreviations (24/7, CRM, PM) → if still over, restructure the entire headline rather than creating an awkward truncation.

## Edge Cases

### Sitelink descriptions at 35 chars (not 25)
**Trap:** Confusing sitelink *titles* (25 chars) with sitelink *descriptions* (35 chars). Easy to apply the wrong limit.
**Correct handling:** Always state both limits explicitly before drafting: "Title: ≤25 chars. Description: ≤35 chars." Draft titles first, then descriptions separately.

### DKI with brand competitor keywords
**Trap:** Ad group contains competitor brand names as keywords. DKI inserts "Buy Competitor X" into your headline — potential trademark violation and policy disapproval.
**Correct handling:** Audit keyword list before applying DKI. Exclude any ad group containing competitor brand names from DKI usage. Use static headlines instead.

### "No exclamation marks in headlines" rule
**Trap:** Using "!" in a Google Ads headline causes disapproval. Descriptions allow one exclamation mark maximum.
**Correct handling:** Zero "!" in any headline. Maximum one "!" across all descriptions. Use periods or no punctuation instead.

### Structured snippet headers
**Trap:** Using non-approved headers like "Features" or "Benefits" (not on Google's list).
**Correct handling:** Only use these approved headers: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. If your content doesn't fit these, use callouts instead.

### Descriptions that contradict headlines when randomly paired
**Trap:** Description says "No Setup Fee" but a headline says "Setup in Minutes" — paired together, the user wonders what setup exists if there's no fee for it.
**Correct handling:** Read every description against every headline. Each combination must be coherent. Avoid references that depend on a specific headline being present.

### Character count discrepancy at boundaries
**Trap:** A headline counts as exactly 30 characters by your count but gets rejected by Google Ads. Usually caused by invisible characters, encoding differences, or miscounted special characters.
**Correct handling:** For any element at exactly the limit (30/30, 90/90, 25/25), shorten by 1 character as a safety margin. The lost character is never worth the risk.

## Anti-Patterns

**DON'T** write headlines in isolation and descriptions in isolation. Instead, draft them as a system — write 3 headline-description combos first, then expand to 15 headlines and 4 descriptions while maintaining coherence across all combinations.

**DON'T** compose freely and then trim to fit character limits. Instead, start with the word budget (5 words for 30 chars) and compose within the constraint from the beginning. Trimmed copy reads like trimmed copy.

**DON'T** repeat the same message across headlines with slightly different wording ("Save Money Today" / "Cut Your Costs Now" / "Reduce Expenses Fast"). Instead, cover distinct angles: keyword match, CTA, social proof, specificity, objection removal, authority, emotional trigger, feature-benefit.

**DON'T** use generic CTAs like "Click Here," "Learn More," or "Submit." Instead, match the CTA to the exact conversion action: "Start Free Trial," "Get Custom Quote," "Book Demo Call," "Download Report."

**DON'T** manufacture urgency with perpetual deadlines or fake scarcity. Instead, use value-based urgency ("Start Saving Today"), seasonal relevance, or only reference genuinely time-limited offers with specific end dates.

**DON'T** pin headlines to all three positions. Instead, pin Positions 1 and 2 only (keyword relevance and C