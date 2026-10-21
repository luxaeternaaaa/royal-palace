# Royal Palace: UX and formulaic-design review

## Evidence and scope

The existing live desktop/mobile implementation and its error states were inspected before editing. An independent reviewer confirmed the mobile enquiry landing problem, the small landscape photo in the lightbox, repeated emotional copy and missing FAQ actions. A second read-only review reproduced no-JS form submission leaking entered text into URL query parameters and gallery photo failures without recovery. These are different from subjective aesthetic judgments.

The user subsequently confirmed three halls and identified the hero photo as the main hall. The user rejected the invented RP mark and required the original venue logo. Both corrections are part of the current work.

## External primary sources, consulted for concrete criteria

1. [NN/g — AI Prototyping in Real Design Contexts](https://www.nngroup.com/articles/ai-prototyping/): real evaluations identify weak hierarchy/grouping, spacing, contrast and generic visual treatment even when the broad layout looks plausible. Applied here to tiny labels, long introductions before a selected task and repeated sections. A functioning prototype is not evidence of high design quality.
2. [Anthropic — Harness design for long-running application development](https://www.anthropic.com/research/harness-design-long-running-apps): documents the tendency toward predictable layouts and positive self-evaluation; treats coherence, originality and execution separately from verifiable functional correctness. Applied here through independent review and actual desktop/mobile inspection, without inventing a numerical beauty score.
3. [Figma — What is good design in the age of AI?](https://www.figma.com/blog/what-is-good-design-in-the-age-of-ai/): emphasizes design fundamentals and pragmatic judgment in AI output. Applied here to readable scale, clear action names and a composition grounded in the venue's real materials.
4. [Anthropic frontend-design skill, original source](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md): explicitly catalogs repeated single-word italic/color accents, uppercase kickers, generic cards, appended arrows and repeated movement. This is practitioner guidance, not a scientific detector. Applied selectively: removed repeated section italics/kickers and arrows on internal hall/FAQ links; kept a single hero accent and directional marks where they communicate external navigation.
5. [Impeccable's pattern catalog](https://impeccable.style/slop/): distinguishes design-review patterns from technical quality issues. Tiny UI text, excessive explanation, oversized headings and decorative elements were present; excessive animation and repeated rounded cards were **not** established defects here and are not claimed as fixes.
6. [NN/g — Aesthetic and Minimalist Design](https://www.nngroup.com/articles/aesthetic-minimalist-design/): reducing noise means preserving necessary task information, not arbitrarily deleting content or making everything sparse. Applied to retain real hall choices, useful form guidance, FAQ actions and contacts while removing duplicated persuasion.

These sources do not prove that green, serif fonts or any isolated pattern is intrinsically AI-generated. The mapping below is our contextual judgment about this site's usefulness.

Final external checklist: clear subject/action in first viewport; readable navigation/fields/errors; headings with distinct information rather than a repeated ornament; actual venue imagery/brand assets; each section supports a customer decision; context preserved across hall/FAQ actions; usable error/recovery states. The green palette is compatible with the authentic logo and actual cream/gold interior; it was not replaced solely to evade a catalog pattern.

## Findings and changes

| Finding in the original | Kind | Implemented change |
|---|---|---|
| Giant emotional heading fails to say what/where the venue is | Clarity | First screen explicitly identifies a banquet restaurant in Astana, then three halls, event types, address and next action |
| 11px navigation, 10px labels, 8px guidance and 9px errors | Readability | Navigation/labels 14px, primary body 16px, errors/help 13px, inputs 16px |
| Similar emotional blocks and a second event selector before the real form | Information architecture | Removed duplicate intro/event tabs; preserved event choice in one real form |
| Italic final word, tiny uppercase kicker and ornamental treatment repeated across sections | Contextual aesthetic judgment | Removed decorative kickers, seal, wordmark and repeated italic headings; retained a single hero accent |
| Invented RP mark was presented as venue branding | Authenticity defect | Removed the invented SVG from source/build; genuine Instagram avatar used unchanged in header/favicon; evidence in logo-source.md |
| Three halls were absent | New confirmed requirement | Compact named hall choices; truthful relative sizes; chosen hall flows into enquiry/WhatsApp without clearing existing fields |
| CTA lands ahead of long mobile introduction | Task friction | All enquiry CTAs target form heading; corrected additive scroll-padding and scroll-margin |
| Landscape lightbox has little useful detail on phone | Inspection limitation | Actual 2× image with native scroll, keyboard-compatible controls and direct full-file link |
| Failed gallery photo silently leaves a blank image | Recovery defect | Loading/error text, retry and next-photo actions |
| FAQ recommends contact without an immediate contextual action | Task friction | Menu/guest/viewing links add a visible question to the form without replacing user input |
| Unknown date still asks whether that date is free | Message defect | Conditional closing question with a dedicated regression test |
| No-JS form submits entered wishes through a GET URL | Privacy/function defect | Submit disabled in static HTML and enabled only after JS setup; no-JS direct contact remains available |
| WhatsApp is the only way to reuse the prepared text | Recovery gap | Copy action, clipboard-denied manual selection, visible phone alternative |

## Preserved

Actual venue photos, qualified décor captions, no invented capacity/prices/reviews, unknown date/guest options, preserved form values, preview before manual WhatsApp sending, simple dependency-free stack, Russian content and real contacts.

## Verification boundary

Automated tests prove behavior, not visual quality. Real Chrome desktop/mobile checks and screenshots are recorded in `docs/verification.md`. No screen-reader certification or physical iOS/Android coverage is claimed. Larger logo artwork and exact business conditions remain owner-supplied follow-up data.
