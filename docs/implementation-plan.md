# Royal Palace implementation plan

Goal: complete a local, polished Russian demo with actual venue photography and a reliable WhatsApp enquiry flow.

Architecture: dependency-free HTML/CSS/ES modules, Node 22 static server and copy build. Use the existing empty project directly as explicitly requested; preserve `.git`. User delegated design decisions and authorized immediate implementation, so no additional concept approval is required.

- [x] Add meaningful Node tests for date-only validation, unknown details, guest limits, message contents and safe WhatsApp URL encoding; see the missing implementation fail.
- [x] Implement `public/planner.mjs`, semantic `public/index.html`, tokenized `public/styles.css`, and `public/app.js` for enquiry, occasion selection, mobile navigation, FAQ and gallery.
- [x] Integrate verified venue photographs and self-hosted Cyrillic fonts. Record source evidence.
- [x] Run tests, syntax checks and production build. Start retained localhost preview and open in Codex.
- [x] Exercise desktop/mobile browser paths: form errors, valid and unknown dates, message preview, WhatsApp destination intercepted without visiting/sending, gallery keyboard dismissal, FAQ and navigation. Inspect screenshots, correct observed defects, save two useful images.
- [x] Obtain independent review of actual implementation and report verified results with exact local paths.

Review focus: date rollover in Astana, impossible/past dates, guest count decimals/zero, stale message after edits, keyboard focus/scroll on mobile overlays, photo attribution and no unverified business claims.

Execution record: 9 Node tests pass; syntax check and production copy build pass; 36 real Chrome browser checks pass. Reviewer identified a keyboard focus issue in the mobile menu: reproduced as a failing browser regression and fixed by closing on focus leaving the header. Mobile fields use 16px text and validation scrolling respects reduced motion. Native select/date decisions recorded in premium-ui.json.
