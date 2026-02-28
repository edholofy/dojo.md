---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, CTAs, and complete search campaigns. Use when creating, reviewing, or fixing Google Search ad copy, matching search intent, improving Quality Score, or applying ad copywriting formulas."
---

## Domain Knowledge

### Character Limits — The Hard Constraints That Break Everything
- **RSA Headlines: 30 characters** (not words, not pixels — characters including spaces)
- **RSA Descriptions: 90 characters** (aim for 75-90; under 60 wastes space)
- **Sitelink titles: 25 characters**
- **Sitelink descriptions: 35 characters** (two lines available)
- **Callout extensions: 25 characters**
- **Structured snippet values: 25 characters**
- Count EVERY character including spaces and punctuation before finalizing. "Schedule Your Free Consultation Today" = 38 chars = REJECTED headline.

### DKI Syntax — The Exact Format
- Correct: `{KeyWord:Default Text}` — capitalizes Each Word
- `{keyword:default text}` — all lowercase
- `{KEYWORD:DEFAULT TEXT}` — ALL CAPS
- `{Keyword:Default text}` — First word capitalized
- The **default text** must fit within 30 chars for headlines (the entire `{KeyWord:Default}` token is replaced at serving)
- The **longest keyword in the ad group** must also fit within 30 chars when inserted — if "affordable enterprise cybersecurity solutions" is 46 chars, it overflows and the default fires
- DKI is dangerous with: competitor names (trademark issues), misspelled keywords, grammatically awkward phrases, sensitive topics (medical, legal), broad match keywords that could insert anything

### Quality Score — The Three Levers
1. **Expected CTR**: Driven by headline relevance to query, use of numbers, strong CTAs, emotional triggers. Fix: make the ad the most clickable result on the page.
2. **Ad Relevance**: Driven by keyword appearing naturally in headlines/descriptions, matching search intent. Fix: echo the keyword's language and intent, not just the keyword itself.
3. **Landing Page Experience**: Driven by page load speed, mobile optimization, content matching ad promise. Fix: ensure the ad doesn't promise what the page doesn't deliver. Recommend specific landing page changes.

### Search Intent — The Four Types and What They Demand
| Intent | Signal Keywords | Ad Approach | Wrong Approach |
|---|---|---|---|
| Informational | "how to," "what is," "guide" | Educate → lead magnet, free resource | Hard sell, "Buy Now" |
| Commercial | "best," "vs," "review," "top" | Compare, prove superiority, social proof | Generic brand awareness |
| Transactional | "buy," "price," "discount," "near me" | Direct CTA, price, urgency, offer | Educational content |
| Navigational | Brand names, specific products | Direct to exact page, defend brand | Competitor bashing |

Mixed intent (e.g., "best CRM software pricing") = lead with the dominant intent (commercial) but include transactional elements (pricing CTA).

### Urgency That Won't Get You Banned
- **Legitimate**: Real deadlines ("Enrollment Closes March 15"), genuine inventory ("Only 3 Spots Left This Month"), seasonal relevance ("2024 Tax Deadline Approaching")
- **Policy violation**: Fake countdown timers, perpetual "Last Chance!" that never expires, manufactured scarcity ("Only 2 Left!" when you have 2,000), misleading claims about availability
- **Why urgency works**: Loss aversion (2x stronger than gain motivation), FOMO (social proof of others acting), commitment bias (micro-commitments reduce friction). Name these mechanisms explicitly when analyzing.

### CTR and Conversion Predictions — Ground Them in Principles
- Headline formulas with specific numbers outperform vague claims by 30-40% CTR
- Problem-agitate-solve copy converts higher for pain-aware audiences
- Authority/social proof ("Trusted by 10,000+") lifts CTR 15-25% for unfamiliar brands
- Specificity ("Save 3.5 Hours/Week") beats generality ("Save Time") in both CTR and conversion
- Always tie predictions to the mechanism: "Higher CTR expected because the number creates curiosity and specificity signals credibility"

### Headline Formula Arsenal
- **Problem → Solution**: "Tired of X? → Try Y" (emotional audiences)
- **Number + Benefit**: "Save 47% on X" (deal-seekers)
- **Social Proof**: "Join 10,000+ Who X" (risk-averse buyers)
- **Direct CTA**: "Get Your Free X Today" (transactional intent)
- **Authority**: "#1 Rated X in 2024" (competitive markets)

Genuinely different = different tone, structure, AND messaging angle. "Save Money on Insurance" vs "Cut Insurance Costs" = superficial rewording, NOT different.

## Quick Start

**Task**: Write a complete RSA for "project management software" targeting transactional intent.

**Output**:

**Headlines** (15 provided, all ≤30 chars):
1. `Project Management Software` (30) — pin to H1 for relevance
2. `Try It Free for 14 Days` (23) — pin to H2 for CTA
3. `Trusted by 50,000+ Teams` (24) — social proof
4. `Plans Starting at $9/Mo` (23) — price anchor
5. `Set Up in Under 5 Minutes` (26) — objection handling
6. `Boost Team Productivity 40%` (28) — quantified benefit
7. `No Credit Card Required` (23) — friction reducer
8. `#1 Rated on G2 in 2024` (23) — authority
9. `Gantt Charts & Kanban` (21) — feature-specific
10. `Replace Spreadsheet Chaos` (26) — pain point
11. `Enterprise-Grade Security` (26) — trust signal
12. `Unlimited Projects & Users` (27) — value proposition
13. `Get Organized This Week` (23) — urgency + benefit
14. `See Why Teams Switch to Us` (26) — curiosity
15. `Custom Workflows Built-In` (25) — feature

**Descriptions** (4 provided, all ≤90 chars):
1. `Manage projects, track deadlines & collaborate in one platform. Start your free trial now.` (90) — comprehensive + CTA
2. `Join 50,000+ teams who cut project delays by 35%. No credit card needed to get started.` (89) — social proof + friction reducer
3. `Gantt charts, Kanban boards & time tracking included in every plan. See pricing instantly.` (90) — features + CTA
4. `Struggling with missed deadlines? Our tool keeps every project on track. Try it free today.` (90) — pain → solution → CTA

**Pinning rationale**: H1 pinned ensures keyword relevance for Quality Score. H2 pinned ensures every impression includes a CTA. H3 unpinned lets Google optimize from social proof/features/urgency pool. Tradeoff: pinning reduces Google's combination options from 32,760 to ~1,800, but guarantees relevance + action in every impression.

## Core Rules

1. **Count characters for EVERY piece of copy before presenting it.** Show the count in parentheses. Headlines ≤30, descriptions ≤90, sitelinks ≤25, sitelink descriptions ≤35, callouts ≤25, snippet values ≤25. A single violation invalidates the entire deliverable.

2. **When using DKI, always provide three things**: the DKI headline with correct `{KeyWord:Default}` syntax, a list of all ad group keywords with their character counts flagging any that exceed the limit, and at least 2 static fallback headlines for cases where DKI is risky.

3. **When applying headline formulas, produce five genuinely distinct versions.** Each must differ in emotional appeal (fear vs aspiration vs logic), structure (question vs statement vs command), and core message (price vs quality vs speed vs trust). Relabeling the same idea fails.

4. **Ground all CTR/conversion predictions in named advertising principles.** State the mechanism: "Loss aversion drives urgency CTAs to 15-20% higher CTR" not "This should perform well." Compare across the variants with relative rankings and reasoning.

5. **Every sitelink must point to a conceptually distinct page.** "Pricing," "Features," "Case Studies," "Free Trial" = good. "Our Services," "What We Offer," "Solutions," "Our Products" = four versions of the same page.

6. **Callouts must add information not present in headlines or descriptions.** If the headline says "Free Shipping," a callout saying "Free Delivery" adds zero value. Test: would removing this callout lose unique information?

7. **When analyzing urgency, name the psychological mechanism and flag any policy risk.** Every urgency element must be categorized as legitimate or potentially violating, with the specific Google Ads policy principle cited.

8. **For mixed-intent keywords, lead with the dominant intent and layer the secondary.** Structure: headline addresses primary intent, description bridges to secondary, CTA converts both. Never go so generic you convert neither.

## Decision Tree

If writing RSA headlines →
  Count every headline's characters → if >30, shorten (never truncate mid-word)
  → Ensure variety across: keyword-match, benefit, CTA, social proof, urgency, feature, objection-handler
  → Pin H1 only for keyword relevance, pin H2 only for CTA presence, leave H3 unpinned
  → Provide at least 15 headlines; minimum 11 to avoid "poor" ad strength

If writing RSA descriptions →
  Count every description's characters → target 75-90 range (under 60 = wasted space)
  → Each description must be self-contained (works with ANY headline combination)
  → Cover 4 angles minimum: benefit, social proof, feature detail, objection + CTA
  → End at least 2 descriptions with a specific CTA verb

If using DKI →
  Check longest keyword in ad group against 30-char limit
  → If any keyword >30 chars → flag it, it will trigger default
  → If keywords include competitor names → don't use DKI (trademark risk)
  → If keywords include misspellings or awkward phrases → don't use DKI
  → If broad match → don't use DKI (unpredictable insertions)
  → Always provide static alternatives alongside DKI headlines

If identifying search intent →
  Check for transactional signals first (buy, price, order, near me) → sell directly
  → Check for commercial signals (best, vs, review, top) → compare and prove
  → Check for informational signals (how, what, why, guide) → educate and capture
  → Check for navigational signals (brand names) → direct to exact destination
  → If mixed → identify dominant intent from context, serve that first, layer secondary

If fixing existing ad copy →
  Diagnose the SPECIFIC mistake (not "could be better") → name it (keyword stuffing, feature dumping, generic copy, wrong intent, policy violation, character overflow)
  → Rewrite to demonstrate the OPPOSITE of the error
  → Map each change to a Quality Score component (CTR, relevance, or landing page)
  → State the transferable principle the fix illustrates

If building complete campaign →
  Organize keywords into ad groups by shared intent (not just topic)
  → Each ad group gets: 1 RSA (15 headlines, 4 descriptions), sitelinks (4+), callouts (4+), structured snippets (1+ header with 4+ values)
  → Match landing pages to ad group intent (not homepage for everything)
  → Predict Quality Score per component with reasoning

## Edge Cases

### DKI with long keywords
**Trap**: Using `{KeyWord:Best Software}` when the ad group contains "best enterprise project management software" (47 chars). The keyword can't insert, default fires, but nobody checked if the default is compelling.
**Correct**: List all keywords with char counts. Flag overflow keywords. Ensure the default text is a strong standalone headline, not a throwaway like "Best Solution" — it may show most of the time.

### Callouts that duplicate headline content
**Trap**: Headline says "Free 30-Day Trial" and callout says "30-Day Free Trial." This wastes a callout slot.
**Correct**: Each callout must pass the uniqueness test. If the headline covers "free trial," callouts should cover different value: "24/7 Live Support" | "No Contract Required" | "SOC 2 Certified" | "99.9% Uptime SLA".

### Structured snippets with wrong headers
**Trap**: Using "Services" as a header but listing benefits ("Save Time," "Reduce Cost") instead of actual services.
**Correct**: Google-approved headers: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. Values must be concrete nouns/items, not benefits or adjectives.

### Mixed intent keywords
**Trap**: "best CRM software free trial" — is this commercial (best) or transactional (free trial)? Writing purely commercial copy misses the conversion moment.
**Correct**: Lead with commercial framing in H1 ("Top-Rated CRM Software"), bridge with transactional in H2 ("Start Your Free Trial Now"), description compares while driving action. Don't default to generic copy that serves neither.

### Urgency that crosses policy lines
**Trap**: "Only 2 Left!" as a perpetual callout when inventory is unlimited. This violates Google's misrepresentation policy.
**Correct**: Use time-bound urgency tied to real events: "Spring Sale Ends April 30" (if it actually ends). Or value-based urgency: "Lock In 2024 Pricing" (if prices are actually changing). Always ask: "Is this literally true tomorrow?"

### Superficially different headline formulas
**Trap**: Five "different" headlines that are all slight rewordings — "Save Money Today" / "Cut Costs Now" / "Reduce Spending Fast" / "Lower Your Bills" / "Spend Less Instantly." Same structure, same appeal, same message.
**Correct**: Vary the axis: (1) "Save 40% vs Competitors" (number + comparison), (2) "Tired of Overpaying?" (problem, question format), (3) "Trusted by 10,000 CFOs" (social proof, authority), (4) "Switch in 5 Minutes" (ease, objection handling), (5) "Your Free Audit Awaits" (CTA, curiosity).

### Descriptions that conflict with headlines
**Trap**: Headline says "Enterprise Solution" while description says "Perfect for freelancers and solopreneurs." These can appear together in any RSA combination.
**Correct**: Every description must be compatible with every headline. Before finalizing, mentally pair each description with each pinned headline. If any pairing creates a contradiction or incoherence, rewrite.

## Anti-Patterns

**DON'T** present copy without character counts. Instead, show `(27)` after every headline and `(88)` after every description. This is non-negotiable.

**DON'T** use generic CTAs like "Click Here," "Learn More," or "Submit." Instead, use specific action verbs tied to the conversion: "Start Free Trial," "Get Custom Quote," "Book Your Demo," "Download the Guide."

**DON'T** write DKI headlines without checking every keyword in the ad group for fit. Instead, list each keyword with its character count and flag any exceeding 30 characters or containing risky content.

**DON'T** create sitelinks that point to conceptually overlapping pages. Instead, ensure each sitelink represents a genuinely distinct user journey: pricing, features, case studies, contact — not four variations of "about us."

**DON'T** predict CTR or conversion rates as arbitrary numbers ("should get 5% CTR"). Instead, predict relative performance across variants with named psychological mechanisms as justification.

**DON'T** use perpetual urgency claims that aren't tied to real deadlines. Instead, use legitimate time-bound offers, genuine scarcity, or value-based urgency that would survive a Google policy review.

**DON'T** identify ad copy mistakes with vague language like "this could be improved." Instead, name the specific error pattern (keyword stuffing, feature dumping, intent mismatch, character overflow, policy violation) and state the transferable principle the fix demonstrates.

**DON'T** write all 15 headlines with the same emotional register. Instead, deliberately distribute across: 3 keyword-relevant, 3 benefit-focused, 3 CTA-driven, 2 social proof, 2 urgency/offer, 2 feature/objection-handling.

**DON'T** treat Quality Score as a single number to optimize. Instead, diagnose which of the three components