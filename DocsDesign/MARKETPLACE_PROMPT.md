# Selfx402 Marketplace - AI Development Prompt

## Project Brief

Build a dual-sided marketplace web application connecting consumers seeking API services with vendors providing those services. The platform differentiates through **proof-of-unique-human verification** (Self Protocol zero-knowledge proofs) enabling **1000x cheaper pricing** for verified humans versus bots, combined with **instant cryptocurrency micropayments** (x402 protocol on Celo blockchain).

---

## Core Concept

**Consumer Side**: Browse API services, verify humanity once via passport scan, pay tiny amounts ($0.001 vs $1.00 for bots) per API call using crypto micropayments.

**Vendor Side**: Register API endpoints, set three-tier pricing (bot/verified-human/premium), install 5-line middleware, receive instant USDC payments.

**Platform Value**: Acts as discovery layer and trust broker - handles verification, payment facilitation, and marketplace dynamics without touching the actual API data flows.

---

## Application Structure

### Pages & Routes

**Public Pages:**
- `/` - Landing page with hero, value proposition, service showcase, savings calculator
- `/services` - Service catalog/marketplace with search, filters, categories
- `/services/:id` - Service detail page with pricing, docs, try-it-now, reviews
- `/about` - Platform story, how it works, trust & safety
- `/vendors` - Vendor sign-up landing page
- `/pricing` - Consumer and vendor pricing explainer

**Consumer Portal (Authenticated):**
- `/dashboard` - User dashboard with usage stats, savings tracker, recent requests
- `/verify` - Verification flow with QR code, Self app instructions, waiting state
- `/favorites` - Bookmarked services
- `/history` - Transaction history with filters, exports
- `/settings` - Account settings, wallet management, notifications

**Vendor Dashboard (Authenticated):**
- `/vendor/dashboard` - Overview metrics, charts, alerts, recent activity
- `/vendor/onboarding` - Multi-step registration flow
- `/vendor/services` - Service list, create/edit/manage endpoints
- `/vendor/services/:id` - Individual service analytics
- `/vendor/analytics` - Deep analytics, revenue tracking, user insights
- `/vendor/payouts` - Revenue dashboard, payout configuration, history
- `/vendor/settings` - Account settings, team management, API keys

---

## User Interface Requirements

### Visual Design Characteristics

**Overall Aesthetic:**
- Modern, clean, minimalist interface with generous whitespace
- Professional yet approachable - bridges Web2 familiarity with Web3 innovation
- Trust-building through clarity, not complexity
- Mobile-first responsive design (60% traffic expected from mobile)

**Typography:**
- Clear hierarchy: Large headings for scanning, readable body text (16px minimum)
- Monospace fonts for code examples, API endpoints, wallet addresses
- Variable font weights to establish information hierarchy

**Layout Patterns:**
- Card-based service listings (grid on desktop, stack on mobile)
- Sticky headers for navigation persistence
- Side-by-side comparison tables for pricing tiers
- Progressive disclosure: reveal complexity only when needed
- Generous tap targets (48x48px minimum for mobile)

**Interactive Elements:**
- Instant visual feedback on all interactions (hover states, loading indicators)
- Smooth transitions between states (no jarring changes)
- Optimistic UI updates (show action result immediately, sync in background)
- Clear disabled states with explanatory tooltips
- Loading skeletons instead of blank screens

**Data Visualization:**
- Line charts for trends (requests over time, revenue growth)
- Pie charts for distributions (tier breakdown, category split)
- Progress bars for quotas and limits
- Badge indicators for status (verified, active, paused)
- Sparklines for at-a-glance metrics

**Trust Indicators:**
- Security badges (SSL, audited, privacy-first)
- Social proof (user counts, transaction volumes, testimonials)
- Vendor reputation scores with visual indicators
- Verified checkmarks for authenticated entities
- Transparent pricing displays (no hidden fees)

---

## Key User Flows

### Consumer Journey: First Service Request

**Entry**: User lands on homepage, discovers a service they want to use

**Flow:**
1. **Discovery** - Browse catalog or search, find interesting service
2. **Detail Exploration** - View service detail page, see bot price ($1.00), see human price ($0.001), notice huge savings opportunity
3. **Decision Point** - User decides: verify now (unlock savings forever) or pay bot price (one-time, no verification)
4. **Verification Path** (if chosen):
   - Click "Verify to Save 1000x" button
   - See explainer modal: "30-second one-time process, works for ALL vendors"
   - Generate QR code with Self Protocol requirements
   - User scans with Self mobile app
   - App prompts: "Selfx402 wants to verify: Age 18+, Not sanctioned country, OFAC compliant"
   - User approves in Self app
   - Browser receives zero-knowledge proof
   - Celebration screen: "You're verified! You'll save $X,XXX over time"
5. **Payment Setup**:
   - Connect MetaMask wallet (if not already connected)
   - Check USDC balance on Celo mainnet
   - If insufficient, show "Get USDC" instructions
6. **Request Execution**:
   - Fill in API request parameters (form fields or JSON editor)
   - See price: "$0.001 USDC (Verified Human rate) - You save $0.999!"
   - Click "Send Request"
   - MetaMask popup: sign EIP-712 payment authorization (no gas fees)
   - Wait 2-5 seconds for settlement
   - Receive API response with formatted display
7. **Post-Request**:
   - Option to rate/review service
   - View updated transaction history
   - See cumulative savings counter increment

**Key UI Elements:**
- Persistent "savings unlocked" indicator in header after verification
- Progress breadcrumbs showing where user is in flow
- Clear "back" options at every step
- Help tooltips for technical terms (EIP-712, USDC, nullifier)

### Vendor Journey: Service Registration

**Entry**: Vendor hears about platform, wants to list their API

**Flow:**
1. **Sign-Up**:
   - Land on `/vendors` marketing page
   - Click "Start Selling"
   - Create account (email/password or wallet-based auth)
   - Verify email
2. **Membership Selection**:
   - View tier comparison table (Free/Starter/Pro/Enterprise)
   - See transaction limits, features, pricing
   - Select tier (can start with Free for testing)
   - If paid tier: enter payment method (card or USDC)
3. **Profile Setup**:
   - Upload vendor logo
   - Enter company name, bio, website
   - Add support contact info
4. **Service Configuration**:
   - Enter service name, description, category
   - Paste API endpoint URL
   - Define request/response schemas (JSON Schema editor with examples)
   - Upload sample request/response
   - Set pricing:
     - Bot tier: $1.00 (default, adjustable)
     - Human tier: $0.001 (suggested 1000x cheaper)
     - Premium tier: $0.0005 (optional)
   - Configure verification requirements:
     - Minimum age: 18
     - Excluded countries: multi-select
     - OFAC: toggle on/off
5. **Middleware Integration**:
   - View installation instructions for their framework (Express, Next.js, etc.)
   - Copy pre-filled code snippet with their API key
   - See testing instructions
   - Test connection (platform pings their endpoint)
6. **Testing Phase**:
   - Make test requests using platform's test mode
   - Verify payments work correctly
   - Check Self Protocol verification integrates properly
7. **Go Live**:
   - Review checklist (all green checkmarks)
   - Click "Publish Service"
   - Service now visible in marketplace
8. **Post-Launch**:
   - Redirected to vendor dashboard
   - See first request come in (demo or real)
   - Explore analytics and monitoring tools

**Key UI Elements:**
- Progress indicator showing onboarding steps (1/7, 2/7, etc.)
- Inline validation with helpful error messages
- "Save Draft" at every step (no lost work)
- Preview mode showing how service will appear to consumers
- Success celebrations at key milestones

---

## Critical Features Detail

### Search & Discovery System

**Search Bar:**
- Prominent placement (center of header on catalog page)
- Autocomplete with suggestions as user types
- Search history (recent searches, popular searches)
- Accepts natural language ("AI image generator under $0.01")
- Search scopes: service names, descriptions, vendor names, tags

**Filtering Panel:**
- Category checkboxes (AI/ML, Data APIs, Creative Tools, Compute, Finance, etc.)
- Price range slider (min/max bot price)
- Verification requirements filters (age, OFAC, nationality)
- Vendor reputation filter (4+ stars, 3+ stars, etc.)
- Response time filter (<100ms, <500ms, <1s)
- "Clear All Filters" quick action

**Sorting Options:**
- Relevance (default for search results)
- Price: Low to High
- Price: High to Low
- Most Popular (request volume)
- Highest Rated
- Newest First
- Biggest Savings (% discount human vs bot)

**Result Display:**
- Grid layout (3-4 columns desktop, 1-2 mobile)
- Each card shows: service icon, name, vendor, category tag, pricing comparison, rating, popularity indicator
- Hover shows quick preview (description snippet)
- Infinite scroll or pagination (configurable)
- Loading states (skeleton cards)
- Empty state with helpful suggestions if no results

### Verification System Integration

**QR Code Generation:**
- Large, high-contrast QR code (400x400px display size)
- Encoded data: Self Protocol app scope, verification endpoint, requirements (age, nationality, OFAC)
- Countdown timer (5-minute expiration)
- "Regenerate" button if expired
- "Can't scan?" help link

**Self App Instructions:**
- Step-by-step visual guide:
  1. "Open Self app on your phone"
  2. "Tap 'Scan QR Code' button"
  3. "Point camera at this code"
  4. "Review and approve verification request"
- Troubleshooting section (expandable):
  - Self app not installed → App store links
  - Passport not enrolled → Enrollment instructions
  - QR won't scan → Manual code entry option
  - Verification failed → Reason shown, retry instructions

**Waiting State:**
- Animated loading indicator
- Status message: "Waiting for Self app confirmation..."
- Real-time updates via WebSocket (or polling every 2 seconds)
- Estimated time: "Usually takes 5-10 seconds"
- Cancel option (returns to previous screen)

**Success Confirmation:**
- Celebration animation (confetti, checkmark pulse)
- Message: "You're Verified! 🎉"
- Savings preview: "Based on average usage, you'll save $X,XXX this year"
- Expiry notice: "Your verification is valid for 90 days"
- "Continue" button (returns to original flow)

**Error Handling:**
- Age requirement not met: "Sorry, this service requires age 18+. Your verification shows age 16."
- Nationality excluded: "This service is not available in your country due to legal restrictions."
- OFAC check failed: "Unable to complete verification due to sanctions screening."
- Network error: "Connection lost. Please try again."
- Each error shows: reason, what user can do next, support contact

### Payment Flow UX

**Wallet Connection:**
- "Connect Wallet" button (prominent in header when not connected)
- Supported wallets: MetaMask (primary), WalletConnect (fallback)
- Shows wallet address (truncated: 0x1234...5678) when connected
- Network indicator badge: "Celo Mainnet" (green if correct, red if wrong network)
- "Switch Network" button if user on wrong chain
- USDC balance display: "Balance: 5.23 USDC"

**Payment Authorization Flow:**
1. **Request Initiation**:
   - User fills parameters, clicks "Send Request"
   - Loading indicator appears
   - Background: API calculates cost, checks user tier
2. **Price Confirmation Screen**:
   - Large price display: "$0.001 USDC"
   - Tier badge: "Verified Human Rate"
   - Savings badge: "You save $0.999 (99.9%) vs bot price"
   - Breakdown: Service fee, platform fee (if any), total
   - "Confirm & Pay" button
3. **MetaMask Signature**:
   - MetaMask popup with EIP-712 typed data
   - User sees: recipient vendor address, amount, network, nonce, expiration
   - User clicks "Sign" (NOT a transaction, just a signature - no gas)
4. **Settlement Processing**:
   - Modal overlay: "Processing payment on Celo blockchain..."
   - Progress indicator (indeterminate spinner)
   - Timeout after 30 seconds → Error message with retry
5. **Request Execution**:
   - "Payment confirmed, calling API..."
   - Real-time status: "Waiting for response..."
   - Timeout based on service's expected response time + buffer
6. **Response Display**:
   - Success indicator: Green checkmark
   - Response time badge: "Responded in 234ms"
   - Formatted JSON response (syntax highlighting, expandable/collapsible)
   - "Copy Response" button
   - "Download as JSON" option
   - "Send Another Request" button (pre-fills parameters)
7. **Transaction Record**:
   - Auto-added to user's history
   - Toast notification: "Request successful - $0.001 spent"
   - Updated balance in header

**Error States:**
- Insufficient USDC: Show balance, needed amount, "Get USDC" button with instructions
- Network wrong: "Please switch to Celo Mainnet" with one-click switch button
- Payment rejected: "Payment cancelled. No charges made."
- API error (4xx/5xx): Show error message from API, "Request failed - you were NOT charged" (auto-refund)
- Timeout: "Request timed out. Checking payment status..." (may retry or refund automatically)

### Dashboard Analytics Display

**Consumer Dashboard:**

**Top Cards Row:**
- Total Spent (lifetime): "$12.34 USDC" with trend indicator
- Total Requests: "1,234 requests" with 7-day change
- Total Savings: "$1,221.66 saved vs bot pricing" (highlighted, makes user feel good)
- Favorite Service: Name + icon of most-used service

**Charts:**
- Spending over time (last 30 days): Line chart showing daily spending
- Requests by service: Horizontal bar chart, top 5 services
- Savings visualization: Stacked bar comparing what user paid vs what bots pay

**Recent Activity:**
- Table: Date/Time, Service Name, Cost, Status
- Clickable rows expand to show request/response details
- Filter: Date range, service, status (success/failed)
- Export CSV button

**Vendor Dashboard:**

**Metrics Cards:**
- Total Requests: "45,678 requests this month" with MoM% change
- Total Revenue: "$567.89 USDC earned" with trend
- Transaction Quota: Progress bar "45,678 / 50,000 (91%)" with color coding (green <80%, yellow 80-95%, red >95%)
- Average Response Time: "123ms median" with p95 in tooltip
- Success Rate: "99.2%" with error rate breakdown link

**Charts:**
- Requests over time: Line chart, toggleable timeframes (24h, 7d, 30d, all)
- Revenue over time: Line chart with same timeframe toggles
- Tier distribution: Donut chart showing bot/human/premium request percentages
- Geographic distribution: World map heatmap (if user nationality disclosed)

**Alerts Panel:**
- System-generated alerts:
  - "⚠️ 80% of monthly quota used. Consider upgrading."
  - "🔴 Service downtime detected at 2:34 PM - endpoint unreachable"
  - "⭐ New 5-star review posted on Image Generator API"
  - "💰 High traffic spike - 3x normal volume in last hour"
- Dismissible with "Mark as Read"
- Filter: All, Warnings, Errors, Info

**Recent Requests Feed:**
- Live updating table (WebSocket connection)
- Columns: Time, User Tier, Endpoint, Status, Response Time, Cost
- Color coding: Green (success), Red (error), Yellow (slow response)
- Click to expand: full request/response details for debugging

---

## Technical Architecture Notes

**Frontend Framework Agnostic:**
- Can be built with React, Vue, Next.js, SvelteKit, Solid, etc.
- Should use modern build tooling (Vite, Turbopack)
- Static generation for marketing pages (SEO)
- Client-side rendering for dashboards (authenticated)

**State Management:**
- User authentication state (wallet connected, verified status)
- Shopping cart equivalent (selected service, filled parameters)
- Transaction history cache
- Vendor service list and configurations

**API Communication:**
- REST APIs for CRUD operations (services, users, transactions)
- WebSocket for real-time updates (dashboard metrics, payment status)
- GraphQL optional (for complex dashboard queries)

**Data Fetching Patterns:**
- Optimistic updates (show result immediately, sync in background)
- Stale-while-revalidate (show cached data, fetch fresh in background)
- Pagination or infinite scroll for large lists
- Debounced search (wait 300ms after user stops typing)

**Wallet Integration:**
- Web3Modal or RainbowKit for wallet connection UI
- Wagmi/Viem for Ethereum interactions
- EIP-712 typed data signing for payments
- Network switching prompts (guide user to Celo mainnet)

**Self Protocol Integration:**
- QRCode generation library
- Polling or WebSocket to detect proof submission
- Proof validation (backend API call)
- Expiry tracking (90-day countdown)

**Payment Processing:**
- Call Selfx402Facilitator API for payment verification
- Call vendor API with X-Payment header
- Handle settlement confirmations
- Transaction receipt generation

---

## UX Micro-Interactions

**Delight Moments:**
- First verification: Confetti animation + savings counter
- Milestone achievements: "100th request! You've saved $99.90 total"
- Vendor first sale: Celebration modal "Your first payment received!"
- Service goes viral: "🔥 Trending - 10x normal traffic!"

**Feedback Loops:**
- Button clicks: Ripple effect, slight scale
- Form validation: Inline green checkmarks for valid fields
- Loading states: Skeleton screens, not blank white
- Success actions: Toast notifications (bottom-right, auto-dismiss 3s)
- Errors: Red toast, persist until dismissed, show action button

**Progress Indicators:**
- Multi-step forms: Breadcrumb with checkmarks for completed steps
- File uploads: Progress bar with percentage
- API requests: Spinner with elapsed time
- Long operations: Estimated time remaining

**Empty States:**
- No services found: Friendly illustration + "Try different filters" suggestion
- No transaction history yet: "Make your first request to see history here"
- Vendor dashboard (no requests): "Share your API to start receiving requests"

**Error States:**
- Network errors: "Connection lost. Retrying in 3 seconds..." with countdown
- 404 pages: Friendly message + "Return Home" button
- Forbidden: "You don't have access to this page. Sign in or verify identity."
- Rate limited: "Slow down! Too many requests. Try again in X seconds."

---

## Accessibility Requirements

**Keyboard Navigation:**
- All interactive elements focusable via Tab
- Logical tab order (top-to-bottom, left-to-right)
- Skip navigation links ("Skip to main content")
- Keyboard shortcuts for power users (? for help modal)

**Screen Reader Support:**
- Semantic HTML (header, nav, main, article, aside, footer)
- ARIA labels for icons and complex widgets
- ARIA live regions for dynamic content (dashboard updates)
- Alt text for all images (decorative: empty alt)

**Visual Accessibility:**
- Minimum contrast ratio 4.5:1 (WCAG AA)
- Text resizable up to 200% without breaking layout
- No information conveyed by color alone
- Focus indicators visible and high-contrast

**Motor Accessibility:**
- Touch targets minimum 48x48px (mobile)
- Click targets minimum 44x44px (desktop)
- No required drag-and-drop (provide alternatives)
- Ample time for interactions (adjustable timeouts)

---

## Mobile-Specific Considerations

**Responsive Breakpoints:**
- Mobile: <640px (single column, stacked layout)
- Tablet: 640px-1024px (2-column grid, condensed navigation)
- Desktop: >1024px (3-4 column grid, full navigation)

**Touch Optimizations:**
- Large tap targets (48x48px minimum)
- Swipe gestures (swipe to delete in lists, swipe between dashboard tabs)
- Pull-to-refresh on dashboards
- Bottom navigation bar (easier thumb reach)

**Performance on Mobile:**
- Lazy load images (intersection observer)
- Code splitting (load dashboard code only when needed)
- Minimize JavaScript bundle (<200KB initial)
- Use native inputs (date pickers, number steppers)

**Mobile-Specific Features:**
- Deep links (open specific services from notifications)
- Add to Home Screen (PWA manifest)
- Push notifications (quota warnings, new reviews)
- Camera access for QR scanning (if Self app not installed)

---

## Internationalization (i18n)

**Supported Languages (Initial):**
- English (en-US) - Primary
- Spanish (es) - Phase 2
- French (fr) - Phase 2

**Translatable Content:**
- All UI text (buttons, labels, messages)
- Marketing copy (landing page, about)
- Error messages and help text
- Email notifications

**Not Translated:**
- User-generated content (service descriptions, reviews)
- Vendor names and branding
- Code examples
- API documentation (vendor responsibility)

**Localization Considerations:**
- Date/time formats (MM/DD/YYYY vs DD/MM/YYYY)
- Number formats (1,234.56 vs 1.234,56)
- Currency display (USDC is always USD, but format varies)
- Right-to-left (RTL) support (future: Arabic, Hebrew)

---

## Performance Budgets

**Page Load Targets:**
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.5s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

**Bundle Size Limits:**
- Initial JavaScript: <200KB (gzipped)
- Initial CSS: <50KB (gzipped)
- Per-route chunk: <100KB (gzipped)
- Images: WebP format, lazy loaded, <500KB each

**Runtime Performance:**
- Dashboard re-renders: <16ms (60fps)
- Search debounce: 300ms
- Scroll performance: Maintain 60fps
- Animation frame budget: <10ms per frame

---

## SEO & Marketing

**Meta Tags:**
- Unique title and description per page
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs to prevent duplicates

**Structured Data:**
- Schema.org markup for services (Product, Offer, Review)
- Breadcrumb markup
- Organization markup (for vendor profiles)

**Sitemap:**
- Dynamic sitemap.xml generation
- Include all public services (not user dashboards)
- Update frequency: daily
- Submit to Google Search Console

**Content Strategy:**
- Blog section (SEO content, tutorials, case studies)
- Help documentation (searchable, indexed)
- Changelog (product updates, transparency)

---

## Integration Points with Existing System

**Selfx402Facilitator (Backend Service):**
- POST `/verify-celo` - Verify EIP-712 payment signature
- POST `/settle-celo` - Execute USDC transfer on-chain
- GET `/supported` - Check service health and supported networks

**Self Protocol:**
- QR Code generation (frontend SDK)
- Proof verification (backend SDK call)
- Nullifier management (database lookups)

**Celo Blockchain:**
- USDC balance checks (read-only RPC calls)
- Transaction status polling (for settlement confirmations)
- Block explorer links (for transparency)

**Vendor APIs:**
- Health checks (ping endpoint to verify uptime)
- Sample requests (for testing and preview)
- Actual API calls (proxied through platform with payment headers)

---

## Success Criteria for MVP

**Launch-Ready Checklist:**
- [ ] Consumer can browse 10+ services without authentication
- [ ] Consumer can verify identity via Self Protocol QR flow
- [ ] Consumer can connect wallet and pay for API requests
- [ ] Consumer sees 3-tier pricing (bot/human/premium) clearly
- [ ] Vendor can register account and list one service
- [ ] Vendor can configure pricing and verification requirements
- [ ] Vendor can install middleware and receive payments
- [ ] Vendor dashboard shows basic analytics (requests, revenue)
- [ ] Search works with filters and sorting
- [ ] Mobile responsive on iOS and Android
- [ ] Payment flow completes in <10 seconds
- [ ] Error states handled gracefully
- [ ] Help documentation accessible
- [ ] Terms of Service and Privacy Policy published

**Post-Launch Metrics (30 days):**
- 100+ verified humans
- 10+ active vendors
- 10,000+ total requests
- <5% error rate
- >80% verification completion rate (users who start QR flow)
- >60% return user rate (users who make 2nd request)
- <3s average page load time
- >50 NPS score

---

## Open Questions for AI Implementation

**Design Decisions:**
- What visual style best conveys trust while remaining modern? (Reference examples: Stripe, Linear, Vercel for inspiration)
- How to balance feature density with simplicity? (Show power-user features only when needed?)
- Mobile-first or desktop-first design approach? (Given 60% mobile traffic expected)

**Technical Choices:**
- Framework recommendation? (Next.js for SEO + React, SvelteKit for performance, Astro for static+islands?)
- State management? (Zustand, Jotai for simplicity vs Redux for complex state?)
- Styling approach? (Tailwind for rapid development vs CSS-in-JS for component encapsulation?)
- Database schema? (Tables: users, vendors, services, transactions, verifications, reviews, etc.)

**Product Strategy:**
- Should MVP include reviews/ratings or launch without social proof initially?
- Free tier limits to prevent abuse while enabling testing?
- How to handle vendor misconduct (slow APIs, downtime, fraud)?
- Refund policy automation or manual approval process?

---

## End of Prompt

This document describes the **what** and **why** of the Selfx402 marketplace. Implementation details (colors, fonts, specific component libraries, backend APIs) are left to the AI implementation agent or human development team. Focus is on user experience, functionality, and business logic rather than visual aesthetics or technical stack constraints.

The marketplace must feel seamless, trustworthy, and delightful while solving real problems: expensive API access for humans, Sybil attacks for vendors, and payment friction for both sides.
