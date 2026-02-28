---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, CTAs, and complete campaign builds. Use when creating or optimizing Google Search ads, diagnosing Quality Score issues, or aligning ad copy with search intent."
---

## Domain Knowledge

### Character Limits — The Non-Negotiable Numbers
- **RSA Headlines: 30 characters** (not words, not pixels — characters including spaces)
- **RSA Descriptions: 90 characters** (aim for 75-90; under 60 wastes opportunity)
- **Sitelink titles: 25 characters**
- **Sitelink descriptions: 35 characters per line**
- **Callout extensions: 25 characters each**
- **Structured snippet values: 25 characters each**

**Count every character before outputting.** The #1 recurring failure is exceeding limits by 1-5 characters. "Get Started With Your Free Trial Today" = 39 chars, busted headline. Always count, always verify, always show the count.

### DKI Syntax — Exact Format
```
{KeyWord:Default Text}
```
- `KeyWord` = Title Case insertion. `Keyword` = Sentence case. `keyword` = lowercase. `KEYWORD` = ALL CAPS.
- **The default text + `{KeyWord:}` wrapper does NOT count toward the limit — only the longest possible inserted keyword does.**
- Critical: if your longest keyword is "affordable project management software" (41 chars), it blows a 30-char headline. You MUST check the longest keyword in the ad group against the 30-char ceiling.
- Always provide static fallback headlines alongside DKI headlines. DKI is never the only strategy.

### DKI Risks Most People Miss
- Competitor names inserting into your ads (policy violation)
- Misspelled search queries appearing as headlines
- Negative/awkward terms: "cheap divorce lawyer" as a headline feels wrong
- Grammatical breakage: "Best {KeyWord:Shoes} Near You" + keyword "running shoe" = "Best running shoe Near You"
- **Rule: if any keyword in the ad group would read awkwardly, don't use DKI for that group**

### Quality Score — The Three Levers
1. **Expected CTR**: Driven by headline specificity, numbers, CTAs, and emotional triggers. Fix: make headlines irresistibly clickable for the exact query.
2. **Ad Relevance**: The ad must echo the keyword's language and intent. Fix: mirror the keyword naturally in headline 1, reinforce in description 1.
3. **Landing Page Experience**: The ad's promise must be fulfilled on the page. Fix: ensure the landing page headline matches the ad's primary claim; page load speed matters too.

**Counter-intuitive insight**: Improving ad relevance without improving landing page alignment can LOWER Quality Score because you attract more clicks that bounce.

### Search Intent Framework
| Intent Type | User Mindset | Ad Strategy | CTA Style |
|---|---|---|---|
| Informational | Learning, researching | Educate, offer guide/resource | "Download Free Guide," "Learn How" |
| Commercial | Comparing options | Differentiate, prove superiority | "See Why Teams Switch," "Compare Plans" |
| Transactional | Ready to buy | Remove friction, create urgency | "Start Free Trial," "Buy Now — Ships Today" |
| Navigational | Looking for specific brand | Confirm brand, direct efficiently | "Official Site," "Log In Here" |

**Mixed intent is common.** "best CRM software" = commercial + transactional. Lead with comparison angle, include transactional CTA as secondary.

### Urgency That Won't Get You Banned
**Legitimate urgency**: Real deadlines ("Offer Ends March 31"), genuine scarcity ("Only 3 Spots Left This Month" — if true), seasonal relevance ("File Before Tax Day"), value-based ("Every Day Without X Costs You Y").

**Policy violations**: Fake countdown timers, perpetual "Last Chance" claims, "Only 2 left!" when inventory is unlimited, manufactured deadlines that reset.

**The psychology**: Loss aversion (2x stronger than equivalent gain), FOMO (social proof + scarcity), commitment bias (small first step lowers resistance). Name the mechanism when recommending a technique.

### Headline Formula Arsenal
1. **Problem-Agitate-Solve**: "Tired of [Problem]?" → "Fix [Problem] in [Timeframe]"
2. **Social Proof**: "[Number] [Users] Trust [Brand]" or "Rated [Score] by [Source]"
3. **Specificity**: "Save [Exact Amount] on [Exact Thing]" — concrete numbers always beat vague claims
4. **Authority**: "[Award/Certification] [Product Category]"
5. **Direct Benefit**: "[Verb] [Desirable Outcome] [Qualifier]" — "Slash Payroll Time 50%"

Each formula resonates differently: authority works on risk-averse B2B buyers; emotional/problem-focused works on pain-driven consumers; specificity works universally but especially on comparison shoppers.

### Extension Strategy
- **Sitelinks**: Each must point to a genuinely DIFFERENT page (Pricing, Features, Case Studies, Free Trial — not "About Product" and "Product Info")
- **Callouts**: Communicate benefits NOT already in the headline/description. If the ad says "Free Shipping," the callout shouldn't also say "Free Shipping." Use for: "24/7 Support," "No Contract," "SOC 2 Certified"
- **Structured snippets**: Use Google-approved headers only: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. Values must be specific instances, not descriptions.

## Quick Start

**Task: Write an RSA for the keyword "project management software for teams"**

```
HEADLINES (15 required, each ≤30 chars — COUNTED):
H1:  Team Project Management Tool  [30] — PIN to Position 1 (keyword relevance)
H2:  Plan, Track & Deliver Faster  [29] — PIN to Position 2 (benefit)
H3:  Start Your Free Trial Today   [27] — PIN to Position 3 (CTA)
H4:  Trusted by 10,000+ Teams      [26]
H5:  Manage Projects in One Place   [29]
H6:  Cut Project Delays by 40%     [27]
H7:  Built for Remote Teams         [22]
H8:  #1 Rated on G2 for 2024       [25]
H9:  See Plans Starting at $9/Mo   [29]
H10: Assign Tasks in Seconds        [24]
H11: Real-Time Team Collaboration   [30]
H12: Free 14-Day Trial—No Card     [28]
H13: Gantt Charts & Kanban Boards   [29]
H14: Replace Spreadsheet Chaos      [27]
H15: Enterprise-Grade Security      [27]

DESCRIPTIONS (4 required, each ≤90 chars — COUNTED):
D1: Streamline your team's workflow with drag-and-drop boards, automated reminders & reports. [91 — TOO LONG, fix:]
D1: Streamline your team's workflow with drag-and-drop boards, reminders & custom reports.    [86] ✓
D2: Join 10,000+ teams who cut project delivery time by 40%. Start your free trial in 2 min. [90] ✓
D3: No credit card needed. Unlimited projects on every plan. Cancel anytime—zero risk.        [86] ✓
D4: Compare our Starter, Pro & Enterprise plans. Find the perfect fit for your team's needs.  [90] ✓
```

**Notice**: D1 was caught and fixed at 91 chars. Always count, always verify, always correct before finalizing.

## Core Rules

1. **ALWAYS count characters for every headline, description, and extension value. Display the count in brackets.** Character limit violations are the most common failure across all scenarios.

2. **ALWAYS provide static (non-DKI) headline alternatives alongside any DKI headlines.** DKI fails silently with long keywords, awkward terms, or competitor names.

3. **When writing 15 RSA headlines, ensure genuine variety across these categories: keyword-match, benefit, CTA, social proof, urgency, feature, price/offer, differentiation.** Producing 15 slight rewordings of the same message kills Google's optimization ability.

4. **When writing descriptions, ensure every description works independently with ANY headline combination.** Test by reading D3 with H7 and H12 — does it still make sense? No description should start with "As mentioned above" or assume a specific headline.

5. **When predicting CTR/conversion differences between ad formulas, ground predictions in specific principles.** "Formula A predicts ~15% higher CTR because specificity (exact numbers) outperforms vague claims in commercial-intent queries per Google's own best practice data." Not: "Formula A is probably better."

6. **When writing extensions, verify each sitelink points to a conceptually distinct page, each callout is unique from ad body AND other callouts, and structured snippets use only Google-approved headers.**

7. **When creating urgency, name the psychological mechanism and confirm the claim is verifiable.** "Offer ends [date]" requires an actual end date. "Limited spots" requires actual capacity limits.

8. **When diagnosing Quality Score, map every recommended change to exactly one of: Expected CTR, Ad Relevance, or Landing Page Experience.** Never say "this improves Quality Score" without specifying which component.

9. **When building complete campaigns, differentiate ad groups by search intent — not just by keyword similarity.** "project management tools" (commercial/comparison) and "buy project management software" (transactional) need different messaging even though they're topically identical.

10. **Prefer pinning only positions 1-3 with one headline each, leaving remaining headlines unpinned.** Over-pinning destroys Google's machine learning optimization. Pin position 1 = keyword-relevant headline, position 2 = benefit/value prop, position 3 = CTA.

## Decision Tree

**If writing a headline** → Count characters → If >30 → Shorten by cutting articles ("the," "a"), using "&" for "and," abbreviating ("Mgmt" for "Management"), or using numerals ("50%" not "Fifty Percent") → Recount → If still >30 → Restructure entirely

**If using DKI** → List all keywords in ad group → Find longest keyword → Count chars → If longest keyword >30 chars → Do NOT use DKI in headlines (use in descriptions if ≤90) → Scan for awkward/competitor/negative terms → If any found → Exclude DKI for that ad group → Always add 2+ static fallback headlines

**If identifying search intent** → Check for transactional signals ("buy," "price," "coupon," "order," "sign up") → If yes → Transactional copy with friction-reducing CTA → Check for commercial signals ("best," "vs," "review," "compare," "top") → If yes → Differentiation copy with comparison CTA → Check for informational signals ("how to," "what is," "guide," "tips") → If yes → Educational copy with resource CTA → Check for brand/navigational signals (specific brand name, "login," "official") → If yes → Brand-confirming copy with direct navigation CTA → **If mixed** → Lead with the dominant intent, include secondary intent in descriptions

**If creating extensions** → Sitelinks: brainstorm 8+ distinct landing pages → Select 4-6 most valuable → Write titles ≤25 chars → Write 2 description lines each ≤35 chars → Callouts: list all value props NOT in ad body → Select 4-6 most compelling → Verify each ≤25 chars → Structured snippets: identify which approved header fits the business → List 4-6 specific values ≤25 chars each

**If diagnosing a poor ad** → Check: Does headline 1 contain/mirror the target keyword? (Ad Relevance) → Check: Are headlines specific, numerical, benefit-driven? (Expected CTR) → Check: Does ad promise match landing page content? (Landing Page Experience) → Fix the weakest component first → Map every change to its component

**If writing CTAs** → Identify conversion goal (purchase, trial, demo, download, call) → Match verb to goal: Purchase → "Order/Buy/Shop" | Trial → "Start Free Trial" | Demo → "Book Your Demo" | Download → "Get Your Free [Resource]" | Call → "Call Now for [Benefit]" → Never use "Click Here," "Submit," or "Learn More" as primary CTAs

## Edge Cases

### DKI + Character Overflow
**Trap**: Using `{KeyWord:Project Tools}` in a headline when the ad group contains "enterprise project management platform" (43 chars).
**Correct handling**: Check longest keyword FIRST. If it exceeds 30 chars, either (a) move DKI to descriptions where 90-char limit applies, or (b) restructure ad groups so all keywords fit. Always show the math: "Longest keyword: 'enterprise project management platform' = 43 chars > 30 char limit → DKI unsafe for headlines in this ad group."

### Callout Duplicating Ad Body
**Trap**: Ad headline says "Free Shipping on All Orders" and callout says "Free Shipping."
**Correct handling**: Callouts must add NET NEW information. Replace with something the ad doesn't already say: "Easy 30-Day Returns" or "Price Match Guarantee."

### Structured Snippet Wrong Header
**Trap**: Using "Features" as a structured snippet header (not a Google-approved header).
**Correct handling**: Only use approved headers. For features, use "Types" or "Service catalog" depending on context. Example: Header "Types" → "Project Planning, Task Tracking, Time Logging, Resource Mgmt"

### 15 Headlines That Are Really 3 Headlines × 5 Rewordings
**Trap**: H1 "Save Time on Projects" / H2 "Save Time Managing Projects" / H3 "Project Time Savings" — these are the same headline.
**Correct handling**: Each headline must bring a genuinely different message dimension. Categorize as you write: keyword-match (2-3), benefit (2-3), CTA (2-3), social proof (2), specificity/numbers (2), feature (2), urgency/offer (1-2).

### Urgency That Violates Google Policy
**Trap**: "Only 2 Left! Buy Now Before It's Gone!" when selling a SaaS product with unlimited capacity.
**Correct handling**: SaaS has no inventory scarcity. Use value-based urgency instead: "Lock In 2024 Pricing Before Rates Increase" (if true) or "Start Today — Your Competitors Already Have." Flag the policy issue explicitly.

### Mixed Intent Keywords
**Trap**: Writing pure transactional copy for "best project management software" (commercial intent).
**Correct handling**: Lead with comparison/differentiation messaging ("See Why 10K Teams Switched"), include transactional CTA as secondary ("Start Free Trial"). Description should bridge: "Compare features side-by-side. Rated #1 for ease of use. Try free for 14 days."

### Comparative CTR Predictions Without Evidence
**Trap**: "Ad version A will get 25% higher CTR" with no reasoning.
**Correct handling**: Ground every prediction: "Version A's specificity ('Save 12 Hours/Week') typically outperforms vague benefits ('Save Time') by 15-30% CTR based on the concreteness principle — specific numbers create credibility and set clear expectations. Version B's social proof ('Trusted by 50K Teams') performs strongest in commercial-intent queries where buyers seek validation, predicting 10-20% CTR lift over generic claims."

## Anti-Patterns

**DON'T assume a headline is under 30 characters by eyeballing it.** Instead, count every character including spaces and show `[XX]` after each headline.

**DON'T write DKI headlines without checking every keyword in the ad group against the character limit.** Instead, list the longest keyword, count its characters, and explicitly confirm it fits or flag the overflow.

**DON'T use "Click Here" or "Learn More" as your primary CTA.** Instead, use specific action verbs tied to the conversion goal: "Start Your Free Trial," "Get Your Custom Quote," "Book a 15-Min Demo."

**DON'T create urgency with unverifiable claims ("Limited Time!" with no date).** Instead, attach urgency to a specific, real constraint: "Offer Ends Jan 31" or "Only 5 Onboarding Slots Left in Q1."

**DON'T list the same benefit in slightly different words across all 15 headlines.** Instead, categorize headlines by purpose (keyword-match, benefit, CTA, social proof, feature, urgency) and ensure at least 5 distinct categories are represented.

**DON