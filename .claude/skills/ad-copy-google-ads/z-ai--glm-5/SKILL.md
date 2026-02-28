---
name: "ad-copy-google-ads"
description: "Writes Google Ads copy including RSA headlines, descriptions, extensions, DKI templates, and CTAs. Use when creating or optimizing Google Search campaigns, diagnosing Quality Score issues, or aligning ad copy with search intent."
---

## Domain Knowledge

### Character Limits — The Hard Constraints
- **Headlines: 30 characters** (including spaces, punctuation, em dashes, pipes — every character counts)
- **Descriptions: 90 characters**
- **Sitelink text: 25 characters**
- **Sitelink descriptions: 35 characters**
- **Callout extensions: 25 characters**
- **Structured snippet values: 25 characters**
- DKI default text + `{KeyWord:}` wrapper must fit within the headline's 30-char limit. The *longest keyword* in the ad group determines whether DKI is safe.

**Critical: LLMs consistently miscount characters by 1-3.** Never estimate. Count every character deterministically using a reliable method. "Expert cosmetic dentistry" = 25 chars, not 28. Recount before finalizing.

### Google-Approved Structured Snippet Headers (Exhaustive List)
Only these are valid: **Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types.** Anything else (e.g., "Features," "Integrations," "Coverage Options") will be rejected by Google.

### Quality Score — The Three Levers
1. **Expected CTR**: Driven by headline relevance to query + compelling language. Specific numbers and benefits > generic claims.
2. **Ad Relevance**: Keyword must appear naturally in headlines/descriptions. Not keyword stuffing — semantic alignment.
3. **Landing Page Experience**: Ad promise must match landing page content. If the ad says "Free Trial," the landing page must show a free trial above the fold.

### DKI Syntax and Capitalization
- `{KeyWord:Default Text}` — Title Case each word
- `{Keyword:Default Text}` — Sentence case
- `{keyword:default text}` — lowercase
- `{KEYWORD:DEFAULT TEXT}` — ALL CAPS
- Default text appears when the keyword is too long or would create policy violations.

### Search Intent → Copy Strategy Mapping
| Intent | User Mindset | Headline Approach | CTA Style |
|---|---|---|---|
| Informational | Learning | Educate, guide | "Learn More," "Read the Guide" |
| Commercial | Comparing | Differentiate, prove | "Compare Plans," "See Why We're #1" |
| Transactional | Buying | Sell, convert | "Buy Now," "Start Free Trial" |
| Navigational | Finding specific brand | Confirm identity, redirect | "Official Site," "Log In Here" |

### Non-Obvious Insights
- **Pinning headlines reduces Google's optimization ability.** Only pin when brand compliance or messaging control outweighs performance. Pin position 1 for brand terms, position 2 for CTAs if required.
- **Callouts should never repeat what's already in a typical headline.** "Free Shipping" as a callout is wasted if it also appears in headline rotation.
- **Each RSA description must work independently with ANY headline combination.** Descriptions that depend on a specific headline for context will produce incoherent ads 70%+ of the time.
- **Feature dumping kills CTR.** One specific benefit with a number ("Save 3 Hours/Week") beats listing five features.
- **Legitimate urgency converts; fake urgency violates policy.** "Offer Ends March 15" is valid. "Last Chance!" running perpetually is a policy violation.
- **CTR predictions should be grounded:** authority-based headlines (awards, stats) typically outperform emotional appeals for B2B; emotional and specificity approaches outperform for B2C impulse purchases.

## Quick Start

**Task: Write a complete RSA for a SaaS project management tool targeting "project management software"**

**Step 1 — Count characters BEFORE writing:**
Plan each headline to land at 25-29 chars. Never rely on estimation.

**Step 2 — Write 15 headlines with variety:**
```
Pin 1: "Project Management Software"  (28 chars) — keyword match
Pin 2: "Start Your Free Trial Today"   (27 chars) — CTA
     : "Trusted by 10,000+ Teams"      (24 chars) — social proof
     : "Cut Project Time by 40%"        (23 chars) — specific benefit
     : "All Tasks in One Dashboard"     (26 chars) — feature/benefit
     : "No Credit Card Required"        (23 chars) — objection handler
     : "Award-Winning PM Platform"      (25 chars) — authority
     : "Plans Starting at $9/Mo"        (22 chars) — price anchor
     : "See Results in Week One"        (23 chars) — speed
     : "Built for Remote Teams"         (22 chars) — audience
     : "Gantt Charts & Kanban"          (21 chars) — feature specific
     : "Replace Spreadsheet Chaos"      (25 chars) — pain point
     : "Enterprise-Grade Security"      (25 chars) — trust
     : "Integrate With 200+ Apps"       (24 chars) — ecosystem
     : "5-Star Rated on G2 & Capterra"  (29 chars) — social proof
```

**Step 3 — Write 4 descriptions (each independent, each under 90 chars):**
```
"Manage tasks, timelines & teams in one intuitive platform. Start free — no card needed." (88 chars)
"Join 10,000+ teams who cut project delivery time by 40%. See the difference in one week." (89 chars)
"Drag-and-drop Gantt charts, Kanban boards & real-time reporting. Plans from $9/month."    (86 chars)
"Rated 4.8/5 on G2. Integrates with Slack, Jira & 200+ tools. Try it free for 14 days."   (87 chars)
```

**Step 4 — Verify every character count.** Recount each headline and description character by character.

## Core Rules

1. **ALWAYS count characters deterministically for every headline, description, and extension before including it in output.** LLM estimation fails consistently by 1-3 characters. Count spaces, punctuation, and special characters. Report the count alongside each line.

2. **ALWAYS produce a complete response for every task, even under uncertainty.** If the prompt is ambiguous, state assumptions and deliver full output. Zero output is the worst possible outcome. If a subtask is unclear, produce a best-effort version with a caveat rather than skipping it.

3. **ALWAYS validate structured snippet headers against the approved list** before including them:
   ```
   IF header NOT IN [Amenities, Brands, Courses, Degree programs, 
   Destinations, Featured hotels, Insurance coverage, Models, 
   Neighborhoods, Service catalog, Shows, Styles, Types]:
       REJECT header
       SELECT closest valid alternative from approved list
       NOTE the substitution
   ```

4. **ALWAYS validate DKI safety with this process:**
   ```
   FOR each keyword in ad group:
       insertion = apply_capitalization(keyword, dki_format)
       full_headline = template.replace(dki_placeholder, insertion)
       char_count = count_characters(full_headline)
       IF char_count > 30: FLAG as overflow, default text will show
       IF insertion creates grammatical/semantic issues: FLAG
   PROVIDE at least 2 static non-DKI headline alternatives
   ```

5. **Prefer specific, quantified claims over generic value propositions when the advertiser has real data.** "Save 3 Hours/Week" beats "Save Time." "Trusted by 10,000+ Teams" beats "Trusted by Many." If no data exists, use specificity of mechanism ("Drag-and-Drop Gantt Charts") rather than vague benefits ("Easy to Use").

6. **ALWAYS differentiate ad groups by search intent, not just keywords.** Each ad group must target a distinct user need with messaging tailored to that need. If two ad groups could share the same ad copy, they should be merged.

7. **ALWAYS separate CTAs from urgency triggers.** CTA = action verb + specific outcome ("Start Free Trial," "Book a Demo"). Urgency = time/scarcity context ("Offer Ends March 15," "Only 3 Spots Left"). Combine them, but never confuse one for the other.

## Decision Tree

**If writing headlines:**
- If brand campaign → Pin brand name to position 1, use official brand terms
- If non-brand campaign → Pin highest-intent keyword headline to position 1
- If CTA is required → Pin CTA headline to position 2
- If unsure about pinning → Don't pin; let Google optimize

**If choosing DKI vs. static headlines:**
- If all keywords in ad group are ≤20 chars → DKI is safe (leaves room for template text)
- If any keyword > 22 chars → Test carefully; likely need static fallback
- If keywords include competitor names, misspellings, or sensitive terms → Use static only
- If ad group has >15 keywords with varied phrasing → DKI adds more risk than value; use static

**If diagnosing Quality Score issues:**
- If CTR is low but relevance is high → Headlines lack compelling hooks; add numbers, urgency, or social proof
- If relevance is low → Keyword doesn't appear in headlines/descriptions; restructure ad groups for tighter theme
- If landing page score is low → Check that ad promises match landing page H1, CTA, and above-fold content

**If classifying search intent:**
- If query contains "how to," "what is," "guide" → Informational
- If query contains "best," "vs," "review," "top" → Commercial investigation
- If query contains "buy," "price," "discount," "near me," "free trial" → Transactional
- If query contains a brand name + generic term → Navigational
- If query is ambiguous → Write copy that serves the most commercially valuable intent, with a secondary description covering the alternative intent

**If writing extensions:**
- If sitelinks → Each must link to a genuinely different page (not /features and /all-features)
- If callouts → Each must add a benefit NOT already in typical headlines
- If structured snippets → Select header from approved list first, then write values

**If writing urgency/CTAs:**
- If there's a real deadline → Use it explicitly: "Ends Dec 31"
- If there's genuine scarcity → State it: "Only 50 Seats Available"
- If no real urgency exists → Use value-based urgency: "Start Saving Today" (not fake countdowns)
- If the CTA is "Click Here," "Submit," or "Learn More" for a transactional query → Replace with specific action: "Get Your Free Quote," "Start Building Now"

## Edge Cases

### Character Count Miscounts
**Trap:** The agent writes "Best Noise Canceling Earbuds" and reports "30 chars." Actual count: 28.
**Correct handling:** Count each character: B-e-s-t-[space]-N-o-i-s-e-[space]-C-a-n-c-e-l-i-n-g-[space]-E-a-r-b-u-d-s = 28. Always recount. Report the count next to each line item.

### DKI Overflow
**Trap:** Template is `{KeyWord:Running Shoes}` (total 30 chars with longest keyword "lightweight waterproof running shoes"). DKI will overflow, but the agent doesn't flag it.
**Correct handling:** Calculate: "Lightweight Waterproof Running Shoes" = 36 chars. This exceeds 30. Flag it. Note the default "Running Shoes" will display instead (which works at 13 chars in the template context). Provide 2 static alternatives.

### Non-Approved Structured Snippet Headers
**Trap:** Agent uses "Features" or "Integrations" as a snippet header.
**Correct handling:** Neither exists in Google's approved list. Map "Features" → "Types" or "Service catalog." Map "Integrations" → "Brands" (if listing integration partner brands). Always state the mapping rationale.

### Descriptions That Depend on Specific Headlines
**Trap:** Headline: "Our Award-Winning Software" / Description: "It also comes with free support." ("It" has no clear referent if paired with a different headline like "Start Your Free Trial.")
**Correct handling:** Each description must be self-contained. Rewrite: "Award-winning software with free 24/7 support. Try it risk-free today."

### Mixed-Intent Keywords
**Trap:** "CRM software" could be informational (what is it?) or transactional (buy it). Agent writes purely transactional copy and alienates researchers.
**Correct handling:** Pin a keyword-rich headline to P1 for relevance. Include one description that educates ("See How CRM Centralizes Your Sales Pipeline") and one that converts ("Start Your 14-Day Free Trial — No Card Needed").

### Perpetual Urgency Violations
**Trap:** Ad copy says "Last Chance — Sale Ends Soon!" but runs indefinitely with no actual deadline.
**Correct handling:** This violates Google's misrepresentation policy. Replace with value-based urgency: "Start Saving on Your Plan Today" or tie to a real event: "Black Friday Pricing — Ends Nov 30."

### Ad Group Overlap
**Trap:** Two ad groups — "project management tool" and "project management software" — with nearly identical copy.
**Correct handling:** These should be one ad group. If kept separate, differentiate messaging: "tool" group emphasizes ease/simplicity, "software" group emphasizes enterprise features/integrations.

## Anti-Patterns

**DON'T estimate character counts.** Instead, count every character deterministically and report the count inline (e.g., `"Start Free Trial Today" (22 chars)`).

**DON'T return empty or partial responses when a task is complex.** Instead, state assumptions, break the task into parts, and deliver complete output for each part. Partial output with caveats > no output.

**DON'T invent structured snippet headers.** Instead, reference the 13 approved headers and select the closest match. If none fit, use "Types" or "Service catalog" as the most flexible defaults.

**DON'T write descriptions that only make sense with one specific headline.** Instead, read each description in isolation and ask: "Does this make complete sense paired with ANY of my 15 headlines?"

**DON'T keyword-stuff headlines.** Instead, include the primary keyword naturally in 2-3 headlines maximum. Use the remaining 12-13 headlines for benefits, proof, CTAs, and differentiation.

**DON'T use generic CTAs ("Click Here," "Learn More," "Submit") for transactional intent.** Instead, match the CTA to the conversion action: "Get Your Free Quote," "Book a Demo," "Start Your Trial."

**DON'T list features without connecting them to outcomes.** Instead of "Gantt Charts, Kanban Boards, Reports" write "Plan Projects Visually With Drag-and-Drop Gantt Charts."

**DON'T create fake urgency.** Instead, use legitimate deadlines, real scarcity, or value-based motivation. Fake countdown timers and perpetual "last chance" claims violate Google policy and erode trust.

**DON'T provide DKI templates without testing every keyword in the ad group against the character limit.** Instead, list each keyword, compute the resulting headline length, and flag any that overflow or produce awkward copy.