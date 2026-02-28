---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI, CTAs, and intent-matched campaigns. Use when creating, reviewing, or fixing Google Search ad copy, building complete ad groups, or optimizing Quality Score through copywriting."
---

## Domain Knowledge

### Character Limits — The Hard Constraints That Keep Failing

These are absolute. Count every character including spaces before outputting:

| Element | Limit | Sweet Spot |
|---|---|---|
| RSA Headline | **30 chars** | 25–30 chars (use the space) |
| RSA Description | **90 chars** | 75–90 chars (short = wasted opportunity) |
| Sitelink title | **25 chars** | 20–25 chars |
| Sitelink description | **35 chars** | 30–35 chars |
| Callout extension | **25 chars** | 15–25 chars |
| Structured snippet value | **25 chars** | 15–25 chars |

**Critical**: Count characters *after* DKI keyword substitution. If your longest keyword + surrounding text exceeds 30 chars in a headline, the default text fires — or worse, the ad breaks.

### DKI — The Syntax That Must Be Exact

Format: `{KeyWord:Default Text}` — capitalization matters:

- `{keyword:default}` → all lowercase
- `{Keyword:Default}` → First word capitalized
- `{KeyWord:Default}` → Each Word Capitalized (most common for headlines)
- `{KEYWORD:DEFAULT}` → ALL CAPS (rarely appropriate)

**DKI risks most people miss:**
- Competitor names in keyword lists → your ad says "Buy [Competitor]" (policy violation)
- Misspelled keywords → misspelled ads
- Long-tail keywords exceeding character limits → default text fires unpredictably
- Grammatically awkward insertions: "Get {KeyWord:Services} Today" + keyword "plumber near me" → "Get Plumber Near Me Today"
- **Always provide 2–3 static (non-DKI) headline variants as safety nets**

### Quality Score — The Three Levers

1. **Expected CTR**: Driven by headline specificity, numbers, strong CTAs. Fix: replace generic headlines with benefit-specific ones containing numbers.
2. **Ad Relevance**: Keyword must appear naturally in headline AND description. Fix: mirror the exact search intent language, not synonyms.
3. **Landing Page Experience**: Ad promise must match page content. Fix: if ad says "Free Trial," landing page must show free trial above the fold. Recommend specific landing page changes, not vague "improve your page."

**Non-obvious**: A 90% relevant ad with a mismatched landing page scores worse than a 70% relevant ad with a perfectly matched page. Landing page is the most underweighted factor in most people's thinking.

### Search Intent → Copy Strategy Mapping

| Intent Type | User Mindset | Headline Focus | Description Focus | CTA Style |
|---|---|---|---|---|
| Informational | Learning | "How to..." / "Guide to..." | Educate, offer resource | "Download Guide" / "Learn More" |
| Commercial | Comparing | Differentiators, "vs," "Best" | Social proof, comparisons | "Compare Plans" / "See Why" |
| Transactional | Buying | Price, offer, product name | Urgency, guarantees, trust | "Buy Now" / "Start Free Trial" |
| Navigational | Finding specific brand | Brand name, exact match | Direct to right page | "Visit Official Site" |

**Mixed intent is real**: "best CRM software" is commercial + transactional. Lead with comparison angle, include transactional CTA. Don't go so generic you convert nobody.

### Urgency Psychology — What's Legitimate vs. Policy Violation

**Legitimate urgency triggers:**
- Real deadlines: "Offer Ends March 31" (must be true)
- Genuine scarcity: "Only 3 Spots Left" (must reflect real inventory)
- Value-based urgency: "Save $200 When You Start This Week"
- Loss aversion framing: "Don't Miss Your Q4 Window"

**Policy violations (Google will reject):**
- Fake countdown timers with no real deadline
- Perpetual "Last Chance" or "Final Sale" that never ends
- "Act Now Before It's Too Late" with no specific consequence
- Exclamation marks in headlines (Google disapproves multiple !!!)
- ALL CAPS words for fake urgency

**Why each works (the psychology):**
- Loss aversion: Losing $100 feels ~2x worse than gaining $100 (Kahneman). Frame savings as "Don't lose X" not just "Save X."
- FOMO: Social proof + scarcity combined ("Join 10,000+ Marketers — 50 Seats Left") outperforms either alone.
- Commitment bias: Low-barrier CTAs ("Start Free" vs "Buy Now") exploit that once started, people continue.

### Headline Formulas That Actually Differentiate

Five genuinely distinct approaches (not surface rewording):

1. **Problem-Solution**: Name the pain → offer the fix. Best for: pain-aware audiences. "Stop Wasting Ad Spend | AI-Powered Optimization"
2. **Authority/Social Proof**: Credibility-first. Best for: skeptical/comparison shoppers. "Trusted by 50,000 Brands | #1 Rated Platform"
3. **Specificity/Numbers**: Concrete outcomes. Best for: analytical buyers. "Cut CPA 37% in 30 Days | See How"
4. **Emotional/Aspirational**: Identity and transformation. Best for: B2C, lifestyle. "Build the Business You Deserve"
5. **Direct Offer**: Lead with the deal. Best for: transactional, price-sensitive. "Plans from $29/mo | No Setup Fee"

**For comparative analysis**: Authority headlines typically show 15–25% higher CTR but lower conversion rates than direct offer headlines. Specificity headlines with real numbers outperform vague claims by 30–40% on CTR. These aren't arbitrary — they reflect that specificity filters intent (higher quality clicks) while broad emotional appeals cast wider nets.

### Extension Copy — Distinct, Not Redundant

**Sitelinks**: Each must represent a genuinely different landing page destination. Bad: "Our Services" / "What We Offer" / "Our Solutions." Good: "Pricing Plans" / "Case Studies" / "Free Demo" / "Integration Docs."

**Callouts**: Must add value NOT already in headlines/descriptions. Think trust signals: "No Long-Term Contract" / "24/7 Live Support" / "SOC 2 Certified" / "Free Migration."

**Structured snippets**: Use Google-approved headers only: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. Values must be specific items, not descriptions.

### Common Mistakes — The Diagnostic Framework

| Mistake | Symptom | Fix Principle |
|---|---|---|
| Generic copy | Could apply to any competitor | Include specific numbers, brand differentiators, exact outcomes |
| Feature dumping | Lists features without benefits | Each feature needs a "so that..." benefit |
| Keyword stuffing | Awkward repetition, low readability | 1 exact keyword mention + natural variations |
| No CTA | Description ends without direction | Every description ends with specific action verb |
| Headline repetition | 15 headlines saying the same thing 15 ways | Use the 5 formula types above, each genuinely different |
| Mismatched intent | Selling to someone still researching | Match copy tone to where they are in the funnel |

## Quick Start

**Input**: "Write RSA headlines for a project management SaaS targeting 'project management software for teams'"

**Output** (note: every headline is ≤30 chars, counted):

```
Pin 1 (keyword-rich):
H1: "Team Project Management Tool"    [30] ✓
H2: "Project Software for Teams"      [28] ✓

Pin 2 (benefit/differentiator):
H3: "Cut Project Delays by 40%"       [26] ✓
H4: "See All Projects in One View"    [29] ✓

Unpinned (variety):
H5:  "Trusted by 12,000+ Teams"       [24] ✓
H6:  "Start Free — No Card Needed"    [28] ✓
H7:  "Assign, Track & Deliver Fast"   [29] ✓
H8:  "Replace Spreadsheet Chaos"      [26] ✓
H9:  "Plans Starting at $9/User"      [26] ✓
H10: "4.8★ on G2 — See Reviews"       [24] ✓
H11: "#1 Rated by PCMag 2024"         [22] ✓
H12: "Onboard Your Team in 1 Day"     [27] ✓
H13: "Built-In Gantt & Kanban"        [23] ✓
H14: "Get Your Free 14-Day Trial"     [27] ✓
H15: "Integrates w/ Slack & Jira"     [27] ✓
```

**Pinning rationale**: H1/H2 pinned to Position 1 ensures keyword relevance for Quality Score. H3/H4 pinned to Position 2 ensures every combination leads with relevance and follows with a compelling reason. Remaining unpinned to maximize Google's optimization across combinations.

**Character count verification**: Every headline individually counted. Longest is 30 characters. ✓

## Core Rules

1. **ALWAYS count characters of every headline, description, and extension element before outputting.** Display the count in brackets. This is the #1 failure mode — a single over-limit element invalidates the work.

2. **When writing comparative analysis of ad formulas:**
   - Ground CTR predictions in specific principles: "Specificity headlines with numbers typically achieve 15–25% higher CTR than generic equivalents because they pre-qualify clicks"
   - Never assign arbitrary percentages without stating the reasoning mechanism
   - Reference loss aversion, social proof, commitment bias, or specificity bias by name with brief explanation of mechanism

3. **When using DKI:**
   - List every keyword that will be inserted
   - Calculate max character count: longest keyword + surrounding static text
   - Flag any keyword that creates grammatical awkwardness, policy risk, or exceeds limits
   - Always include 2–3 non-DKI static headline alternatives

4. **When writing urgency/CTA copy:**
   - Every urgency claim must be verifiable or framed as conditional ("If you sign up this week" vs "Last chance ever")
   - Name the specific psychology principle powering each technique
   - Include at least one rejected example with explicit policy violation explanation

5. **When writing descriptions, ensure each stands alone.** Test: pair description D3 with headline H7 — does it make sense? Is there redundancy? Contradiction? Every combination must be coherent.

6. **Prefer using 85–90 chars in descriptions over stopping at 50–60 chars.** Short descriptions waste paid real estate. Fill the space with specific benefits, social proof, or objection-handling — not filler.

## Decision Tree

- If task involves keyword insertion → check DKI syntax, verify every keyword fits within character limits after substitution, provide static fallbacks
- If task involves writing headlines → count every character, verify ≤30, ensure 5+ genuinely different angles (not surface rewording), specify pinning rationale
- If task involves extensions → verify sitelinks point to distinct pages, callouts don't repeat headline content, snippet headers are Google-approved
- If task involves intent matching → classify intent first, then write copy matching that stage, call out if intent is mixed and handle both
- If task involves fixing existing ads → diagnose the specific mistake by name, explain performance impact (CTR/QS/conversion), show before/after with the principle
- If task involves Quality Score → identify which of the 3 components is weakest, target fixes to that specific component, include landing page recommendations
- If task involves urgency → verify every claim is policy-compliant, name the psychology principle, include a rejected/non-compliant example for contrast
- If task asks for a "complete" ad build → deliver: keyword grouping → ad groups → full RSAs (15 headlines + 4 descriptions) → extensions (sitelinks, callouts, snippets) → DKI variants → pinning strategy → landing page recommendations → QS predictions with reasoning

## Edge Cases

### DKI with dangerous keywords
**Trap**: Client's keyword list includes competitor brand names, misspellings, or long-tail phrases. Agent uses DKI without auditing.
**Correct handling**: Scan every keyword. Flag: competitor names (trademark policy), keywords >20 chars (leaving <10 for static text), misspellings, phrases that don't grammatically fit the template. Exclude those from DKI ad groups, serve them static ads instead.

### Mixed search intent
**Trap**: "best accounting software free trial" — is this commercial (comparing "best") or transactional (wants "free trial")?
**Correct handling**: Acknowledge mixed intent explicitly. Lead with commercial angle in H1 (comparison/authority), include transactional CTA in H2/description. Don't collapse to one intent.

### Ad formula comparative analysis without data
**Trap**: Asked to predict CTR/conversion for different formulas, agent invents specific percentages (e.g., "this will get 4.2% CTR").
**Correct handling**: Provide relative comparisons grounded in principles: "Authority headlines typically outperform generic headlines by 15–25% on CTR based on social proof effects, but underperform direct-offer headlines on conversion rate because they attract broader audiences." Never claim exact CTR without test data.

### Structured snippets with wrong headers
**Trap**: Using "Features" or "Benefits" as snippet headers — these aren't Google-approved.
**Correct handling**: Only use: Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types. If the business doesn't fit these, use "Types" or "Service catalog" as the most flexible options.

### Callouts that duplicate headline content
**Trap**: Headline says "Free Shipping" and callout also says "Free Shipping."
**Correct handling**: Callouts must add NEW information. If free shipping is in the headline, callout should cover something else: "No Restocking Fees" / "Easy 30-Day Returns."

### Description character limit — the utilization trap
**Trap**: Writing descriptions of 40–50 characters that technically comply but waste 50% of available space.
**Correct handling**: Target 75–90 characters. Fill with specific proof points, objection handlers, or secondary CTAs. "Get enterprise project management with real-time dashboards and Gantt charts. Start your free 14-day trial today." (90 chars) beats "Manage projects better. Try it free." (35 chars).

## Anti-Patterns

- **DON'T** output ad copy without character counts in brackets. Instead, count and display `[27]` after every headline and description.
- **DON'T** write 15 headlines that are variations of the same message ("Great Software" / "Amazing Software" / "Excellent Software"). Instead, use 5+ distinct formula types: problem-solution, authority, specificity, emotional, direct offer.
- **DON'T** use vague CTAs like "Click Here" or "Learn More" as defaults. Instead, use conversion-specific verbs: "Start Free Trial" / "Get Your Quote" / "Book a Demo."
- **DON'T** claim urgency without a verifiable basis. Instead, frame conditionally: "Save 20% — Offer Ends [Date]" with a real date, or use value-based urgency: "Start saving this quarter."
- **DON'T** assign arbitrary CTR predictions like "this will get 3.7% CTR." Instead, provide relative performance predictions grounded in named principles: "Expect 20–30% CTR lift over generic copy based on specificity bias."
- **DON'T** recommend DKI without auditing the keyword list for overflow, policy risks, and grammar issues. Instead, list every keyword, calculate max character usage, and flag problems before writing the template.
- **DON'T** write sitelinks that point to conceptually identical pages. Instead, ensure each sitelink serves a distinct user need: pricing, proof, product details, getting started.
- **DON'T** diagnose ad problems as "could be better." Instead, name the specific mistake (keyword stuffing, feature dumping, intent mismatch), explain the performance consequence, and show the fix.
- **DON'T** skip landing page alignment when discussing Quality Score. Instead, specify what must appear on the landing page to match the ad's promise — "If the ad says 'Free 14-Day Trial,' the landing page needs a trial signup form above the fold