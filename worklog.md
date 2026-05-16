---
Task ID: 1
Agent: Main Developer
Task: Create premium OTT Hero Ads slider system for Xtube

Work Log:
- Updated HeroAdsSlider.tsx with correct responsive heights (80vh/65vh/50vh)
- Changed autoplay delay to 30 minutes (1,800,000ms) as specified
- Added max 6 hero ads limit with MAX_VISIBLE_ADS constant
- Added cinematic placeholder when no hero ads exist (animated Megaphone icon, "No Hero Ads Available" text, dark grid background, red glow orb)
- Added impression/click tracking via PUT /api/hero-ads
- Added fullscreen video control button
- Added red edge glow on hover
- Added Sponsored badge with glassmorphism pill
- Updated page.tsx to use HeroAdsSlider instead of HeroBanner
- Added heroAds and footerAds state + fetch logic to page.tsx
- Added FooterAds component integration to home view
- Added 'hero-ads' admin section to store.ts (AdminSection type)
- Added HeroAdsPage lazy import and routing to AdminPanel.tsx
- Added 'Hero Ads' nav item in AdminPanel sidebar under Ads Manager
- Fixed lint error: replaced useState impressionFired with useRef to avoid setState in effect
- Pushed Prisma schema and regenerated client
- Verified all APIs return 200 (hero-ads, footer-ads, videos, categories, ads)

Stage Summary:
- HeroAdsSlider.tsx: Fully rebuilt with 80vh/65vh/50vh, 30-min autoplay, max 6 ads, cinematic placeholder
- page.tsx: Now uses HeroAdsSlider + FooterAds with real API data
- AdminPanel.tsx: Added HeroAdsPage route and sidebar nav entry
- store.ts: Added 'hero-ads' to AdminSection type
- All APIs verified working (200 status codes)
- HeroAdsPage.tsx already existed with full CRUD (1411 lines)
