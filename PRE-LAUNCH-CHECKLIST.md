# Pre-Launch Checklist

## Technical

- [ ] All API keys removed from code
- [ ] Debug mode disabled (no `console.log` in production)
- [ ] Test data removed
- [ ] Error tracking configured (e.g., Sentry, Bugsnag)
- [ ] Analytics installed (GA4, GTM, or Shopify Analytics)
- [ ] CDN configured (Shopify CDN is automatic)
- [ ] Full site backup created
- [ ] Domain DNS configured and SSL active
- [ ] Service worker registered (if enabled in settings)
- [ ] 301 redirects set up for old URLs

## Content

- [ ] All placeholder text replaced with real content
- [ ] All demo images replaced with brand imagery
- [ ] Legal pages added:
  - [ ] Privacy Policy
  - [ ] Terms of Service
  - [ ] Refund Policy
  - [ ] Shipping Policy
- [ ] Contact information updated
- [ ] Social media links verified and working
- [ ] Copyright year correct in footer
- [ ] "Powered by Shopify" removed (if desired)
- [ ] Favicon uploaded
- [ ] Open Graph images set for social sharing

## Theme Configuration

- [ ] Style preset chosen (Minimal/Bold/Luxury/Playful)
- [ ] Brand colors set in color scheme
- [ ] Logo uploaded (regular + mobile sizes)
- [ ] Typography fonts selected
- [ ] Homepage sections configured
- [ ] Navigation menus created (main, footer, mobile)
- [ ] Collection pages organized
- [ ] Product page layout configured
- [ ] Cart page settings (shipping threshold, recommendations)
- [ ] 404 page customized
- [ ] Password page ready for maintenance mode

## Functionality Testing

- [ ] **Cart Operations**
  - [ ] Add to cart works from PDP
  - [ ] Add to cart works from quick view
  - [ ] Quantity update works
  - [ ] Remove item works
  - [ ] Cart drawer opens correctly
  - [ ] Free shipping bar updates
- [ ] **Checkout**
  - [ ] Checkout flow completes
  - [ ] Payment gateway processes test transaction
  - [ ] Order confirmation email received
- [ ] **Product Features**
  - [ ] Product images load and zoom works
  - [ ] Variant selection updates price/image
  - [ ] Add to cart with variants works
  - [ ] Out-of-stock variants show correctly
- [ ] **Navigation**
  - [ ] Desktop menu works
  - [ ] Mobile menu opens/closes
  - [ ] Search returns results
  - [ ] Breadcrumbs display correctly
- [ ] **Forms**
  - [ ] Contact form submits
  - [ ] Newsletter signup works
  - [ ] Account registration (if enabled)
  - [ ] Account login (if enabled)
- [ ] **Discount Codes**
  - [ ] Fixed amount codes work
  - [ ] Percentage codes work
  - [ ] Free shipping codes work
  - [ ] Gift cards redeem correctly

## Performance Verification

- [ ] Run Lighthouse audit on homepage (target: 90+)
- [ ] Run Lighthouse audit on product page (target: 90+)
- [ ] Run Lighthouse audit on collection page (target: 90+)
- [ ] Verify LCP < 2.5s on 3G throttled
- [ ] Verify no CLS issues (score < 0.1)
- [ ] Image optimization confirmed (WebP/AVIF)
- [ ] Lazy loading active on below-fold images
- [ ] Caching headers correct (check Network tab)
- [ ] No render-blocking resources in waterfall

## Cross-Browser Testing

- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop)
- [ ] Safari (desktop + iOS)
- [ ] Edge (desktop)
- [ ] Samsung Internet (mobile)
- [ ] Test at: 320px, 375px, 768px, 1024px, 1440px widths

## Accessibility Verification

- [ ] Tab through entire page - all interactive elements reachable
- [ ] Screen reader test (VoiceOver / NVDA)
- [ ] Color contrast check (4.5:1 minimum)
- [ ] All images have descriptive alt text
- [ ] Skip-to-content link present and works
- [ ] Forms have proper labels
- [ ] Error messages are announced to screen readers
- [ ] Modal focus trapping works (Escape to close)

## SEO Verification

- [ ] Run structured data testing tool
- [ ] Verify all pages have unique `<title>` tags
- [ ] Verify meta descriptions present
- [ ] Check canonical URLs are correct
- [ ] Test social sharing (Facebook debugger, Twitter validator)
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt allows crawling
- [ ] Check for broken links (Screaming Frog or similar)

## Security

- [ ] HTTPS enforced on all pages
- [ ] No sensitive data in client-side code
- [ ] Form inputs sanitized (XSS prevention)
- [ ] CSRF tokens on all forms (Shopify built-in)
- [ ] Content Security Policy headers considered
- [ ] Third-party scripts audited

## Post-Launch Monitoring

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure Google Search Console
- [ ] Set up Google Analytics conversion tracking
- [ ] Monitor Web Vitals in Search Console
- [ ] Set up abandoned cart recovery emails
- [ ] Enable order notification emails
- [ ] Test customer support workflow
- [ ] Schedule first content update / blog post

---

**Last Updated**: {{ "now" | date: "%Y-%m-%d" }}
**Theme Version**: Modern Theme v1.0.0 (Dawn v15.4.1 base)
