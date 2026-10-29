# Header motion
AntiSlop during. User supplied tiket.com train page and AutoBuyCars header screenshot. Exact requested behavior was ambiguous; optional clarification unanswered, so announced compact sticky header interpretation.
Header transitions64px to56px after96px scroll, returns at24px to avoid oscillation. Existing navigation remains visible.220ms size and shadow transition; brand scales to96%. Mobile minimum56px retains controls. Reduced-motion removes transitions. Scroll observation uses passive listener, requestAnimationFrame and cleanup.
Delivery gate PASS for scope: build passed. Browser desktop1440px verified64px at top,56px after scroll, sticky top0. Screenshot /tmp/autobuycars-compact-header.png. No new assets, menu entries or unsupported claims.

## Homepage reference correction
User clarified https://www.tiket.com/id-id. Direct browser inspection shows dark hero-integrated header at top transitioning to white sticky navigation below. Replaced the earlier size reduction with catalogue-only blue-to-white colour transition240ms; header height stays64px desktop/60px phone to avoid shifting content. Dark mode uses existing dark surface on scroll. Updated icon/account contrast at top. Browser verified scrolled background rgb255,255,255, height64px and top0. Build passed. Screenshot /tmp/autobuycars-header-colour.png.

## Fade refinement
User explicitly requested fade. Header surface now crossfades through an opacity layer over360ms with matching icon/text colour transitions; controls never fade out. Reduced-motion disables this transition. Browser verified layer opacity0 at top,1 after scroll, header opacity remains1; computed duration0.36s. Production build passed. Screenshot /tmp/autobuycars-header-fade.png.
