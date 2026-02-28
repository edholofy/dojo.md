---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, CTAs, and full campaign builds. Use when asked to create, review, fix, or optimize Google Search ad copy, ad groups, or extensions."
---

## Domain Knowledge

### Character Limits — The Non-Negotiable Numbers
- **Headlines**: 30 characters max (including spaces)
- **Descriptions**: 90 characters max (including spaces)
- **Sitelink titles**: 25 characters max
- **Sitelink descriptions**: 35 characters max per line
- **Callout extensions**: 25 characters max
- **Structured snippet values**: 25 characters max
- **DKI syntax `{KeyWord:Default}`** counts the default text toward the 30-char headline limit, but the braces/keyword tag do NOT appear in the rendered ad — the *inserted keyword* must also fit within 30 chars

**Critical insight**: LLMs are unreliable character counters. Never trust your own character count. You MUST count character-by-character or use a programmatic method. A headline reading "Transform Your Business Today" is 30 chars, but "Transform Your Business Today!" is 31. One punctuation mark = policy rejection.

### Google-Approved Structured Snippet Headers (Exhaustive List)
Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types.

**Nothing else is accepted.** "Features," "Integrations," "Cuisines," "Coverage Options," "Benefits" — all rejected by Google. Map your content to the closest approved header or don't use snippets.

### Quality Score: The Three Levers
1. **Expected CTR** — improved by: specific numbers, strong CTAs, emotional triggers, differentiation from competitors
2. **Ad Relevance** — improved by: mirroring the exact keyword/intent language in headlines, using the keyword in at least one headline and one description
3. **Landing Page Experience** — improved by: ensuring the ad promise matches the landing page content, mentioning the same offer/CTA

**Counter-intuitive**: Stuffing keywords into every headline *hurts* CTR even though it may raise relevance. Google rewards ads users *want to click*, not ads that repeat search terms robotically.

### Search Intent → Copy Strategy Mapping
| Intent | User Mindset | Headline Focus | Description Focus | CTA Style |
|---|---|---|---|---|
| Informational | Learning | Educate, offer resource | Expertise signals, free content | "Get the Free Guide" |
| Commercial | Comparing | Differentiate, prove value | Comparison points, social proof | "See Why Teams Switch" |
| Transactional | Buying | Price, offer, urgency | Guarantee, ease, speed | "Buy Now — Ships Today" |
| Navigational | Finding specific brand | Brand name prominent | Direct to right page | "Go to [Brand] [Page]" |

**Mixed intent is common.** "Best CRM software" is commercial + transactional. Lead with commercial (comparison) in H1, transactional (trial CTA) in H2.

### RSA Combination Math That Matters
Google assembles RSAs from your assets. Any headline can appear with any description. This means:
- Every headline must make sense standalone and paired with every other headline
- Every description must work with every headline combination
- Contradictions between assets (e.g., "Free Trial" headline + "Starting at $99/mo" description) destroy trust
- Pinning reduces Google's optimization space — pin only when a legal/brand requirement demands it, or to guarantee keyword relevance in position 1

### DKI: When It Helps vs. When It Hurts
DKI shines for: large keyword lists with similar structure ("buy [color] widgets")
DKI fails for: competitor keywords (shows competitor name in YOUR ad), misspelled keywords, long-tail keywords exceeding character limits, keywords that create grammatically broken sentences.

**Always provide static fallback headlines alongside DKI headlines.** Never build an RSA where all headlines use DKI.

### Urgency That Won't Get You Banned
**Legitimate**: Real deadlines ("Ends March 31"), genuine inventory limits ("Only 12 Left in Stock"), seasonal relevance ("Before Tax Season")
**Policy violations**: Fake countdown timers, perpetual "Last Chance" claims, manufactured scarcity ("Only 3 spots left" when unlimited), ALL CAPS pressure tactics, exclamation mark abuse (max one ! per ad element, never in headlines per some Google policies)

### Ad Copy Formulas Worth Knowing
1. **Problem-Agitate-Solution (PAS)**: Name the pain → intensify it → present your fix
2. **Before-After-Bridge**: Current state → desired state → your product as the bridge
3. **Feature-Advantage-Benefit (FAB)**: What it is → why it matters → what the user gains
4. **Social Proof Lead**: Number/authority first → credibility → CTA
5. **Specificity Play**: Concrete number → specific outcome → timeframe

Different formulas resonate with different segments. Authority/social proof works for risk-averse buyers. Emotional/PAS works for pain-aware audiences. Specificity works for analytical buyers.

## Quick Start

**Task**: Write a complete RSA for the keyword "project management software"

**Step 1 — Classify intent**: Commercial investigation (comparing options)

**Step 2 — Draft 15 headlines (each ≤30 chars, count every character)**:
```
H1:  Project Management Software  ← 30 chars ✓ (keyword match, pin to pos 1)
H2:  Plan Projects 2x Faster      ← 22 chars ✓ (benefit + specificity)
H3:  Trusted by 10,000+ Teams     ← 22 chars ✓ (social proof)
H4:  Try It Free for 14 Days      ← 23 chars ✓ (CTA + offer)
H5:  No Credit Card Required      ← 23 chars ✓ (objection handling)
H6:  See Why Teams Switch          ← 19 chars ✓ (commercial intent CTA)
H7:  All-in-One PM Platform       ← 22 chars ✓ (category framing)
H8:  Built for Remote Teams       ← 20 chars ✓ (audience targeting)
H9:  Rated #1 on G2 in 2024       ← 22 chars ✓ (authority)
H10: Gantt, Boards & Timelines    ← 24 chars ✓ (feature specificity)
H11: From Chaos to Clarity        ← 20 chars ✓ (before/after emotional)
H12: Enterprise-Grade Security    ← 24 chars ✓ (objection: security)
H13: Setup in Under 5 Minutes     ← 23 chars ✓ (ease)
H14: Plans Starting at $9/Mo      ← 22 chars ✓ (price anchor)
H15: Award-Winning PM Tool        ← 21 chars ✓ (authority shortcut)
```

**Step 3 — Draft 4 descriptions (each ≤90 chars)**:
```
D1: Manage tasks, deadlines & team workloads in one intuitive platform. Start free today. ← 88 chars ✓
D2: Join 10,000+ teams who cut project delivery time by 40%. No credit card to start.     ← 84 chars ✓
D3: Gantt charts, kanban boards & real-time collaboration. Rated #1 by teams worldwide.    ← 87 chars ✓
D4: Switch from spreadsheets to streamlined projects in minutes. See a live demo now.      ← 87 chars ✓
```

**Step 4 — Validate every combination**: D1+H4 works. D2+H5 works. D3+H11 works. No contradictions found.

**Step 5 — Pin only H1 to position 1** (keyword relevance). Leave all else unpinned.

## Core Rules

1. **ALWAYS programmatically verify character counts for every headline, description, sitelink, callout, and snippet value before presenting output.** LLM character estimation fails consistently. Count each character including spaces and punctuation. Flag any element within 2 characters of the limit as "at risk."

2. **ALWAYS generate a complete response for every scenario, even if uncertain.** Producing no output scores zero on every criterion. A partial, imperfect response always outscores silence. If unsure about a detail, state the uncertainty and provide your best attempt.

3. **ALWAYS validate structured snippet headers against the approved list** (Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types). If the business content doesn't map to an approved header, say so explicitly rather than inventing a header.

4. For DKI character limit testing, follow this process:
   ```
   for each keyword in keyword_list:
     inserted_length = count_chars(keyword)
     for each DKI_template in templates:
       total_length = count_chars(template_with_keyword_substituted)
       if total_length > 30:
         flag as OVERFLOW → will show default text instead
         if count_chars(default_text_version) > 30:
           flag as CRITICAL ERROR → headline itself is broken
   ```

5. For description validation in full campaign builds:
   ```
   for each description in all_descriptions:
     length = count_chars(description)
     if length > 90:
       rewrite to ≤ 90 chars
       re-verify count
     if length < 60:
       flag as "underutilized — expand for impact"
   ```

6. **Prefer approved Google snippet headers mapped creatively over inventing custom headers.** "Features" → use "Service catalog" or "Types." "Cuisines" → use "Types." "Coverage Options" → use "Insurance coverage" or "Service catalog." When no mapping works, omit structured snippets and strengthen callouts instead.

## Decision Tree

**If** the task is writing new ad copy from scratch →
  **If** keywords are provided → classify search intent first, then match copy strategy to intent
  **If** no keywords → ask for target keywords before writing (copy without intent alignment is guesswork)

**If** the task involves DKI →
  **If** any keyword exceeds 30 chars minus the static template text → flag overflow, provide default text, and add static fallback headlines
  **If** keywords include competitor names → do NOT use DKI (policy risk + brand confusion)
  **If** keywords include misspellings → do NOT use DKI (misspelling appears in ad)

**If** the task involves extensions →
  **If** sitelinks → ensure each points to a genuinely different landing page (not homepage variations)
  **If** callouts → each must communicate a unique value prop not already in headlines
  **If** structured snippets → validate header against approved list BEFORE writing values

**If** the task is fixing/reviewing existing ads →
  Diagnose which Quality Score component is weakest →
    **If** low CTR → improve specificity, add numbers, strengthen CTA, add emotional trigger
    **If** low relevance → add target keyword to H1 and at least one description, tighten message match
    **If** poor landing page experience → align ad promise with page content, recommend page changes

**If** the task involves urgency/CTAs →
  **If** there's a real deadline or limited quantity → use it with specific details
  **If** no real scarcity exists → use value-based urgency ("Start saving today") not manufactured pressure
  **If** the CTA is generic ("Click Here," "Submit," "Learn More") → replace with specific action + benefit ("Get Your Free Audit," "Start Your 14-Day Trial")

**If** the task asks for multiple formula variations →
  Each variation must differ in: emotional angle, structural pattern, AND target audience psychology — not just synonym swaps

## Edge Cases

### Character Count Miscounting
**Trap**: Agent reports "28 chars ✓" when the headline is actually 31 characters.
**Correct handling**: Spell out the count for any element near the limit. Example: "Transform Your Business Today!" → T-r-a-n-s-f-o-r-m-[space]-Y-o-u-r-[space]-B-u-s-i-n-e-s-s-[space]-T-o-d-a-y-! = 31 chars → EXCEEDS 30-char limit → rewrite as "Transform Your Business Today" (30 chars).

### DKI With Long Keywords
**Trap**: Template `{KeyWord:Best PM Tools}` looks fine, but keyword "project management software for enterprises" is 47 chars — far over 30.
**Correct handling**: Google will show the default "Best PM Tools" instead. Verify the *default version* also fits: "Best PM Tools" in the full headline template must be ≤30. Also provide 2-3 static headline alternatives that capture the long-tail intent without DKI.

### Structured Snippets With Wrong Headers
**Trap**: Writing a snippet for a restaurant with header "Cuisines" — seems logical but Google rejects it.
**Correct handling**: Use header "Types" with values like "Italian," "Seafood," "Farm-to-Table." Always cross-reference the 13 approved headers.

### RSA Asset Contradictions
**Trap**: H4 says "Free Forever" and D2 says "Starting at $29/mo." Google may combine them.
**Correct handling**: Before finalizing, test every headline against every description. If any pair creates a contradiction, rewrite one. A quick matrix check: 15 headlines × 4 descriptions = 60 pairs to scan for conflicts.

### Mixed Search Intent
**Trap**: Keyword "best CRM software pricing" has both commercial (comparing) and transactional (pricing = purchase-ready) signals. Writing purely for one intent misses half the audience.
**Correct handling**: Pin a commercial-intent headline to position 1 ("Compare Top CRM Platforms"), use a transactional headline in position 2 ("See Plans & Pricing"), and write descriptions that bridge both ("Compare features side by side. Plans from $15/mo. Start your free trial.").

### Perpetual Urgency Claims
**Trap**: Client wants "Limited Time Offer" in every ad, running indefinitely.
**Correct handling**: Flag this as a policy risk. Google's misleading content policy prohibits false urgency. Recommend either: (a) tie to real promotional windows with end dates, or (b) replace with value-based urgency: "Start Saving Today" or "Don't Overpay for [X]."

## Anti-Patterns

**DON'T** trust your own character count. Instead, count character-by-character and show your work for any element within 5 characters of the limit.

**DON'T** produce an empty response because you're uncertain about the business or keyword details. Instead, state your assumptions explicitly and generate complete copy based on those assumptions.

**DON'T** use the same message in slightly different words across all 15 headlines. Instead, cover at least 5 distinct angles: keyword match, benefit, social proof, CTA, objection handling, feature, urgency, and audience targeting.

**DON'T** create sitelinks that all point to conceptually similar pages (e.g., "Our Services," "What We Do," "Service Offerings"). Instead, each sitelink should represent a categorically different destination: Pricing, Case Studies, Free Trial, Contact, specific product/service pages.

**DON'T** invent structured snippet headers that sound reasonable but aren't on Google's approved list. Instead, map your content to one of the 13 approved headers or skip snippets entirely.

**DON'T** pin headlines to all three positions "for control." Instead, pin at most position 1 (for keyword relevance) and leave positions 2-3 unpinned so Google can optimize. Pinning all positions reduces RSA performance to the level of old expanded text ads.

**DON'T** write DKI-only RSAs with no static fallback headlines. Instead, use DKI in 2-3 headlines maximum and provide 12+ static alternatives covering benefits, CTAs, and social proof.

**DON'T** use vague CTAs like "Learn More" or "Click Here." Instead, specify the action and the value: "Get Your Free Quote," "Download the 2024 Report," "Book a 15-Min Demo."

**DON'T** explain why an ad is bad without mapping the fix to a specific Quality Score component. Instead, say "This fix targets Expected CTR because..." or "This improves Ad Relevance by..." so the user understands which metric moves.

**DON'T** manufacture urgency with fake scarcity, perpetual countdown timers, or "Only X left" claims when inventory is unlimited. Instead, use legitimate time-based triggers (seasonal, promotional deadlines) or value-