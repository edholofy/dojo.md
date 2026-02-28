---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines/descriptions, extensions, DKI, CTAs, and intent-matched messaging. Use when creating, auditing, or optimizing Google Search ad campaigns from keyword research through final copy with extensions."
---

## Domain Knowledge

### Character Limits — The Non-Negotiable Numbers
- **Headlines**: 30 characters (aim for 25-30; under 20 wastes space)
- **Descriptions**: 90 characters (aim for 75-90; under 60 is underutilized)
- **Sitelink text**: 25 characters
- **Sitelink descriptions**: 35 characters each (2 lines)
- **Callouts**: 25 characters
- **Structured snippet values**: 25 characters
- **DKI default text + syntax overhead**: the longest keyword in the ad group + `{KeyWord:}` wrapper must fit within the 30-char headline limit. Count the literal longest keyword, not the default.

### Quality Score — The Three Levers
Quality Score = Expected CTR + Ad Relevance + Landing Page Experience. Each is rated Above Average / Average / Below Average. The critical insight: **these are relative to other advertisers bidding on the same keyword**, not absolute metrics.

- **Expected CTR**: Driven by headline specificity, numbers, and strong CTAs. Generic headlines ("Best Service Available") kill CTR.
- **Ad Relevance**: The target keyword's core intent must appear semantically in the ad copy — not just keyword-stuffed, but meaningfully addressed. If the keyword is "emergency plumber near me," the ad must signal immediacy and locality, not just contain those words.
- **Landing Page Experience**: The ad's promise must be fulfilled on the landing page. If the ad says "Free Quote in 60 Seconds," the landing page must have a visible, fast quote form — not a generic homepage.

### DKI — The Traps Nobody Warns About
`{KeyWord:Default Text}` capitalization variants: `{keyword:}` = lowercase, `{Keyword:}` = title case first word, `{KeyWord:}` = title case all words, `{KEYWORD:}` = ALL CAPS. The default text must itself be compelling ad copy, not placeholder garbage like "Our Product." Always calculate: longest keyword in the ad group + any static text in that headline ≤ 30 chars. Risky keywords for DKI: competitor brand names (trademark violations), misspellings, long-tail queries that read awkwardly as headlines, anything with "cheap" or "free" that could misrepresent the offer.

### Urgency That Passes Policy Review
Google rejects: fake countdown timers, perpetual "last chance" claims, fabricated scarcity ("Only 2 left!" when inventory is unlimited). Google accepts: real enrollment deadlines, seasonal offers with actual end dates, genuine capacity limits, value-based urgency ("Prices increase Jan 1"). The psychology: **loss aversion** (fear of missing a deal) outperforms **gain framing** (excitement about getting a deal) by ~2x in CTR for transactional intent. But loss aversion applied to informational intent feels manipulative and tanks trust.

### Search Intent Alignment — The Multiplier Most People Ignore
- **Informational** ("how to fix leaky faucet"): Educate first, soft CTA. Headlines: "How to Fix a Leaky Faucet" / "DIY Plumbing Guide." Selling hard here wastes spend.
- **Commercial investigation** ("best CRM for startups"): Compare, differentiate, prove. Headlines: "Top-Rated CRM for Startups" / "See Why 10K Teams Switched."
- **Transactional** ("buy running shoes online"): Sell directly. Price, offer, CTA. Headlines: "Running Shoes From $59" / "Free Shipping Today."
- **Navigational** ("Nike store login"): Don't compete unless you're the brand. If you are, direct them. If you aren't, you're burning money.

Mismatched intent is the #1 silent budget killer. A transactional ad on informational keywords gets clicks that never convert.

### Headline Formula Cheat Sheet (Proven Performers)
1. **Problem-Solution**: "Stop [Pain Point] | [Solution] Today"
2. **Social Proof**: "[Number] [Users] Trust [Brand]"
3. **Specificity**: "[Exact Benefit] in [Timeframe]"
4. **Authority**: "[Credential] — [Promise]"
5. **Emotional**: "[Desired Outcome] Without [Fear]"

Each formula resonates with different segments: authority works for B2B/high-consideration, emotional for B2C/impulse, specificity for comparison shoppers.

### CTR and Conversion Predictions — Grounding in Reality
Don't guess arbitrarily. Base predictions on these benchmarks:
- Average Google Ads CTR across industries: ~3.17% for search
- Top performers: 6-7%+ CTR
- Headline with a number vs without: +15-20% CTR lift
- Intent-matched ad vs generic: +25-50% CTR lift
- Strong CTA vs weak/absent CTA: +10-20% conversion lift
- Always state your reasoning chain when predicting: "This ad targets transactional intent with a specific price point and urgency deadline, so I'd estimate CTR in the 5-7% range for this keyword set, above the 3.2% industry average because..."

### Extension Strategy — Not Just Extra Text
- **Sitelinks**: Each must point to a genuinely different page (Pricing, Features, Case Studies, Contact — not four versions of the homepage). They expand your ad's real estate and provide 4 additional click targets.
- **Callouts**: Unique value props NOT already in your headline/description. If your headline says "Free Shipping," don't repeat it as a callout. Use callouts for secondary proof: "24/7 Support" / "No Contract Required" / "Since 2010."
- **Structured snippets**: Must use Google-approved headers (Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types). Values must be specific nouns/items, not marketing claims.

## Quick Start

**Task**: Write a complete RSA for the keyword "project management software for teams"

**Output**:

Headlines (15 required, each ≤30 chars):
1. `Project Management for Teams` (30) — pin to H1 for relevance
2. `Plan Projects 2x Faster` (23)
3. `Trusted by 50K+ Teams` (22)
4. `Try It Free for 14 Days` (24)
5. `All Tasks in One Platform` (25)
6. `No Credit Card Required` (23)
7. `Collaborate in Real Time` (24)
8. `See Why Teams Switch to Us` (26)
9. `Built for Remote Teams` (22)
10. `Gantt Charts & Kanban Boards` (29)
11. `Cut Meeting Time by 40%` (23)
12. `Top-Rated on G2 & Capterra` (27)
13. `Onboard Your Team in 1 Day` (27)
14. `Enterprise-Grade Security` (26)
15. `Custom Workflows & Reports` (27)

Descriptions (4 required, each ≤90 chars):
1. `Manage projects, deadlines & teams in one place. Start your free trial — no card needed.` (89)
2. `Join 50,000+ teams who deliver projects on time. Gantt, Kanban & real-time collaboration.` (90)
3. `Rated 4.8/5 on G2. Automate workflows, track progress & reduce status meetings by 40%.` (88)
4. `From planning to launch in one tool. Get custom reports, integrations & 24/7 live support.` (90)

**Why this works**: H1 pinned for keyword relevance (Ad Relevance score). Headlines span benefit, social proof, feature, CTA, and urgency angles. Descriptions each stand alone — any combination with any headline reads coherently. Character limits respected with high utilization.

## Core Rules

1. **Prefer data-grounded CTR predictions over gut estimates.** Always anchor to the ~3.17% search average, then adjust with explicit reasoning: intent match (+25-50%), specificity/numbers (+15-20%), strong CTA (+10-20%). State the reasoning chain, not just the number.

2. **When writing extensions, verify every character count before finalizing.** Count each sitelink (≤25), sitelink description (≤35), callout (≤25), and snippet value (≤25) individually. A single violation invalidates the extension. When in doubt, cut a word rather than exceed.

3. **Prefer Google-approved structured snippet headers over invented ones.** The approved list: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. If your business doesn't fit these, use callouts instead — don't force a bad header match.

4. **When writing urgency triggers, require a verifiable real-world basis.** Before writing "Limited Time" or "Only X Left," ask: is this a real deadline or genuine scarcity? If you can't point to a specific date, event, or inventory constraint, use value-based urgency instead ("Prices increase after enrollment closes March 15" or "Lock in 2024 pricing").

5. **When writing descriptions, fill 75-90 of the 90 characters.** Under 60 characters means wasted ad real estate. Over 90 is rejected. Each description must function independently — assume it could pair with any headline combination.

## Decision Tree

- If **keyword is informational intent** → Lead with education/value in headline, soft CTA ("Learn More" / "Free Guide"), landing page should be content not product page
- If **keyword is commercial investigation** → Lead with differentiation/social proof, comparison CTA ("See Why Teams Switch"), landing page should be comparison or features page
- If **keyword is transactional** → Lead with offer/price/urgency, hard CTA ("Buy Now" / "Start Free Trial"), landing page should be purchase or signup page
- If **keyword is navigational** → Only bid if you own the brand; direct to exact destination
- If **keyword is mixed intent** → Write headlines covering both intents, pin the most common intent to H1, let Google optimize the rest; avoid being so generic you convert nobody
- If **using DKI** → Calculate longest keyword + static text ≤ 30 chars. If it exceeds, either shorten static text or don't use DKI for that headline. Always provide at least one non-DKI static headline as fallback
- If **keyword would read awkwardly in DKI** (competitor names, misspellings, long-tail questions) → Use static headlines instead; DKI is not mandatory
- If **ad group has >20 keywords** → Split into tighter ad groups before writing copy; broad ad groups make relevant copy impossible
- If **callout duplicates headline content** → Replace the callout with a secondary benefit not mentioned elsewhere
- If **Quality Score diagnosis shows low Ad Relevance** → Tighten keyword-to-ad semantic match; the keyword's core intent must be directly addressed, not just mentioned
- If **Quality Score diagnosis shows low Expected CTR** → Add numbers, specificity, stronger CTA, or emotional hook to headlines
- If **Quality Score diagnosis shows low Landing Page Experience** → Ensure ad promise matches landing page content; recommend specific LP changes

## Edge Cases

### DKI Overflow
**Trap**: Ad group contains keyword "project management software for enterprises" (46 chars). Using `{KeyWord:PM Software}` in a headline with any additional text overflows 30 chars even with the default.
**Correct handling**: Flag the overflow risk explicitly. Use the DKI headline only if the default text alone fits (e.g., `{KeyWord:PM Software}` = 11 char default is safe, but the inserted keyword will be truncated to the default). Provide a static alternative: `Enterprise PM Software` (22 chars).

### Structured Snippets with No Good Header Match
**Trap**: A SaaS company wants structured snippets but doesn't fit Amenities, Brands, Destinations, etc.
**Correct handling**: Use "Types" (e.g., "Types: Task Management, Time Tracking, Reporting") or "Service catalog." If neither fits naturally, skip structured snippets and add more callouts instead. Never force "Styles" or "Models" for a service business.

### Urgency for Evergreen Products
**Trap**: Client sells an always-available SaaS product and wants urgency language.
**Correct handling**: Use value-based urgency, not fake scarcity. "Start Today — See Results This Week" (commitment urgency), "Your Competitors Already Use It" (FOMO based on competitive pressure, not fake inventory). Never: "Only 3 Spots Left" or "Offer Ends Soon" without a real end date.

### Five "Distinct" Formula Variations That Aren't
**Trap**: Writing 5 versions that all say "Great software, try it free" with different word order.
**Correct handling**: Each formula must change the **emotional appeal and message structure**: (1) Problem→Solution→Result, (2) Social proof→Credibility→CTA, (3) Specific number→Benefit→Timeframe, (4) Question→Pain point→Answer, (5) Emotional outcome→Without fear→Action. The tone, hook, and psychological lever must differ, not just the vocabulary.

### Audience-Formula Mapping
**Trap**: Claiming all formulas work equally for all audiences.
**Correct handling**: Be specific — authority/credential formulas outperform for B2B decision-makers and high-consideration purchases. Emotional/outcome formulas outperform for B2C and impulse-adjacent decisions. Specificity/number formulas outperform for comparison shoppers actively evaluating options. State which segment and why.

### Description Independence Failure
**Trap**: Description 1 says "As mentioned above..." or Description 3 says "Plus everything in our starter plan" — these require context from other descriptions or headlines.
**Correct handling**: Every description must be a complete, standalone value proposition. Test by reading it paired with a random headline — does it still make sense? If it references other copy, rewrite.

## Anti-Patterns

- **DON'T use generic CTAs like "Click Here" or "Learn More" for transactional intent.** Instead, use conversion-specific verbs: "Start Free Trial," "Get Your Quote," "Book a Demo," "Shop Now."

- **DON'T keyword-stuff headlines.** "Project Management Project Tool Projects" tanks CTR and looks spammy. Instead, use the keyword naturally once (pin to H1) and use the other 14 headlines for benefits, proof, and CTAs.

- **DON'T dump features without benefits.** "AI-Powered, Cloud-Based, SOC 2 Compliant" means nothing to most searchers. Instead, translate: "Automate 80% of Manual Tasks" / "Access From Any Device" / "Enterprise-Grade Security."

- **DON'T repeat headline content in descriptions.** If H1 is "Free 14-Day Trial," don't start Description 1 with "Try us free for 14 days." Instead, use descriptions to add new information: proof, features, or objection handling.

- **DON'T assign arbitrary CTR predictions like "this will get 5% CTR."** Instead, anchor to the industry baseline (~3.17% for search), explain what factors push it higher or lower, and give a reasoned range.

- **DON'T use DKI in every headline.** 1-2 DKI headlines per RSA maximum, with 13-14 static headlines as the backbone. Over-reliance on DKI creates fragile, awkward ads.

- **DON'T create sitelinks that all go to the same page or page type.** "Our Services" / "What We Offer" / "Solutions" / "Our Products" = four links to essentially one page. Instead, diversify: "Pricing Plans" / "Case Studies" / "Free Demo" / "Integration Docs."

- **DON'T explain urgency psychology vaguely.** "This creates urgency" is not analysis. Instead, name the specific mechanism: "This leverages loss aversion — the prospect fears losing the discounted price more than they desire the product itself, which typically increases CTR by 10-15% on transactional keywords."