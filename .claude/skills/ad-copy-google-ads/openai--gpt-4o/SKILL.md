---
name: "ad-copy-google-ads"
description: "Writes and audits Google Ads copy including RSA headlines/descriptions, ad extensions, DKI syntax, CTA/urgency language, and Quality Score diagnosis. Use when asked to create search ad copy, optimize existing ads, write callout/sitelink extensions, implement dynamic keyword insertion, or troubleshoot Quality Score issues."
---

# ad-copy-google-ads

## 1. Quick Start

**Most common task: Write a complete RSA with extensions.**

Input: "Write search ads for a plumbing company targeting emergency plumbing services, $150 avg ticket."

**Correct output pattern:**

Headlines (30 chars max each — count every character including spaces):
1. Emergency Plumber 24/7 (22) ✓
2. Licensed & Insured Plumbers (28) ✓
3. Same-Day Plumbing Service (25) ✓
4. {KeyWord:Plumbing Service} (24 default) ✓
5. Call Now — We're On Our Way (27) ✓

Descriptions (90 chars max each):
1. Burst pipe? We arrive in 60 min. Licensed plumbers serving your area. Call now. (80) ✓
2. Flat-rate pricing. No surprises. $150 avg repair. Book online or call 24/7. (76) ✓

Pinning recommendation: Pin headline 1 (emergency/availability) to Position 1. Do NOT pin all — Google needs flexibility to optimize.

Callout extensions (25 chars max each):
- 24/7 Emergency Service (22) ✓
- Licensed & Insured (18) ✓
- Same-Day Availability (21) ✓
- Upfront Flat Pricing (20) ✓

**What agents get wrong:** Skipping character counts, over-pinning headlines, writing generic callouts that duplicate headline text.

---

## 2. Core Rules

**HIGH freedom rules (these cover all failure patterns):**

**Character limits are non-negotiable — always verify counts:**
- Headline: 30 chars max (count it: "Save Money Today!" = 17 ✓, "Get The Best Deals Online Now!" = 30 ✓)
- Description: 90 chars max
- Callout extension: 25 chars max
- Sitelink headline: 25 chars max
- Sitelink description lines: 35 chars max each

**Prefer specific data over vague claims when comparative analysis is needed:**
- DON'T: "Better than competitors" (unverifiable, low CTR)
- DO: "Rated 4.9★ — 2,000+ Reviews" (specific, credible, 28 chars ✓)

**Prefer real urgency triggers over filler urgency when writing CTAs:**
- Real urgency: deadline ("Sale Ends Sunday"), scarcity ("3 Spots Left"), consequence ("Before Prices Rise")
- Fake urgency: "Act Now!", "Don't Wait!", "Limited Time!" — these underperform and Google may limit impression share

**Prefer strategic pinning guidance over no pinning guidance for RSAs:**
- Pin only when message order is legally required or brand-critical
- Recommend 1 pin max; explain the flexibility trade-off
- Default: no pins, let Google optimize

**Prefer DKI with tested fallback defaults over DKI without character validation:**
- Syntax: {KeyWord:Default Text}
- Always verify the default text fits the character limit independently
- Flag if top keywords exceed limit: "Note: If keyword 'Emergency Plumbing Repair Service' (38 chars) triggers DKI in a 30-char headline, it will fall back to default."

**Prefer aligned landing page signals when diagnosing Quality Score:**
- Check: Does ad copy keyword appear in landing page H1/title?
- Check: Does CTA in ad match CTA on landing page?
- Low Expected CTR → fix headlines (specificity, numbers, urgency)
- Below Average Ad Relevance → match headline keywords to ad group theme tightly
- Below Average Landing Page Experience → flag content/keyword mismatch to user

---

## 3. Decision Tree

If writing headlines → count characters on every single headline before outputting. If over 30, rewrite.

If writing descriptions → count characters. If over 90, trim. Cut filler words first ("that", "which", "very").

If asked about pinning → recommend strategic minimum pinning (1 headline max), explain CTR impact of over-pinning.

If using DKI → validate default text fits limit independently. List 3 sample keywords and check if they'd exceed limit.

If writing callouts → make each callout add unique value not already in headlines/descriptions. If it duplicates, replace.

If diagnosing Quality Score → identify which of 3 components is flagged (CTR, Ad Relevance, Landing Page Experience) and give component-specific fix, not generic advice.

If asked to compare ad approaches → use real metrics or directional data ("RSAs typically outperform ETAs by 10-15% CTR per Google internal data"), not subjective preference.

If urgency language requested → ask or infer: is there a real deadline or scarcity signal? If yes, use it. If no, use benefit-forward CTA instead of fabricated urgency.

If sitelink extensions requested → each sitelink must navigate to a distinct, relevant page. Flag if user asks for sitelinks that point to the homepage for all.

---

## 4. Edge Cases

**Scenario: rsa-headline-writing (Strategic pinning + compelling headlines)**

Trap: Writing 15 vague headlines ("Best Service", "Call Us Today", "We Can Help") and recommending no pins.

Correct handling:
- Write headlines with genuine differentiation: mix proof points (ratings, years), features (24/7, same-day), and CTAs
- Provide 15 headlines minimum for full RSA coverage
- Pinning guidance: "Pin headline [X] to Position 1 only if [specific reason]. Pinning reduces Google's ability to optimize combinations — expect 5-15% lower impression volume."

---

**Scenario: ad-extensions-copy (Character limits + unique callouts)**

Trap: Writing callout "24/7 Customer Service Available" (31 chars — OVER LIMIT) or repeating headline content.

Correct handling:
- Hard stop at 25 chars for callouts. Always verify.
- Callouts must add info absent from main ad. If headline says "24/7 Service", callout should say "No Overtime Fees" (16 ✓), not "Available 24/7" (repeat).

---

**Scenario: complete-search-ad (Character limit compliance throughout)**

Trap: Treating character limits as approximate. "Around 30 is fine."

Correct handling: Exact counts. Show count in parentheses next to every headline and description. Example output format:
- Headline: "Free Same-Day Estimates" (23) ✓
- Description: "Call our licensed team for fast, affordable repairs. No hidden fees. Book now." (77) ✓

---

**Scenario: cta-and-urgency (Accurate urgency psychology)**

Trap: Defaulting to "Act Now!" or "Limited Time!" without real trigger.

Correct handling:
- Deadline urgency: "Sale Ends Dec 31" — works when true
- Scarcity urgency: "Only 5 Units Left" — works when true
- Consequence urgency: "Prices Rise in January" — works when true
- No real trigger → use benefit CTA: "Get Your Free Quote Today" outperforms hollow urgency

---

**Scenario: dynamic-keyword-insertion (DKI character testing + risk identification)**

Trap: Implementing DKI without checking if actual keywords in the ad group exceed the slot's character limit.

Correct handling:
Format: `{KeyWord:Affordable Plumber}` (default: "Affordable Plumber" = 18 chars ✓)

Always flag risks:
- "Keywords over 30 chars will fall back to default — verify your keyword list"
- "DKI in description slots (90 chars) is lower-risk; DKI in headline slots (30 chars) requires careful keyword length audit"
- "Avoid DKI if your keyword list includes branded competitor terms — policy violation risk"

---

**Scenario: ad-copy-formulas (Data-informed comparative analysis)**

Trap: Recommending one formula (AIDA, PAS, etc.) subjectively without referencing performance context.

Correct handling:
- PAS (Problem-Agitate-Solution): Strong for high-intent pain-point searches ("emergency", "broken", "not working")
- AIDA: Strong for consideration-stage searches ("best", "top", "reviews")
- Feature-Benefit-CTA: Default for transactional searches ("buy", "order", "get")
- When comparing approaches, cite directional data or Google's own RSA performance guidance, not personal preference

---

**Scenario: quality-score-fundamentals (Accurate diagnosis + landing page alignment)**

Trap: Diagnosing "low Quality Score" generically without identifying which component is failing.

Correct handling — always decompose:

| Component | Below Average Signal | Fix |
|---|---|---|
| Expected CTR | Low CTR history | Add numbers, urgency, specificity to headlines |
| Ad Relevance | Keywords not in ad copy | Mirror exact match keyword in headline 1 |
| Landing Page Exp | High bounce, slow load, mismatch | Ensure page H1 matches ad headline keyword |

Never say "improve your Quality Score" without specifying which component and what exact change addresses it.

---

## 5. Anti-Patterns

DON'T output headlines without character counts. Instead, show count in parentheses next to every headline and description line.

DON'T write callouts that repeat information already in headlines or descriptions. Instead, treat each extension type as a distinct information layer.

DON'T recommend pinning all or most RSA headlines. Instead, recommend 0-1 pins with explicit justification, noting the impression volume trade-off.

DON'T implement DKI without auditing keyword lengths against the slot's character limit. Instead, list sample keywords and flag any that exceed limits.

DON'T write urgency CTAs without a real deadline or scarcity signal. Instead, use benefit-forward CTAs or ask the user if a real trigger exists.

DON'T diagnose Quality Score without identifying the specific failing component. Instead, check all three components and prescribe component-specific fixes.

DON'T write comparative ad copy claims without data backing. Instead, use specific, verifiable proof points (ratings, years, units, percentages).

DON'T exceed 25 characters on callout extensions. If it doesn't fit at 25 chars, cut words — not a guideline, a hard platform limit.