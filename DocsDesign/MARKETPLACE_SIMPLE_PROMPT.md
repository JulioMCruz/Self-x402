# Selfx402 Marketplace - Simple App Prompt

## What is this app?

A marketplace that connects **people who need APIs** with **people who sell APIs**. The special thing? Verified humans pay 1000x less than bots. Someone proves they're a real person once using their passport, then every API they use costs almost nothing.

---

## Who uses this app?

### Two types of users:

**1. Consumers (Buyers)**
- Regular people or developers who want to use AI tools, data services, or other APIs
- They want cheap access without getting scammed by bots hogging all the cheap prices
- They verify they're human ONE TIME, then pay tiny amounts forever

**2. Vendors (Sellers)**
- Developers or companies who built APIs and want to sell access
- They want to charge bots normal prices but give humans huge discounts
- They want instant payments without dealing with banks or subscriptions

---

## What does each user need to do?

### Consumer Journey:

**First time visiting:**
1. **Browse services** - See different APIs available (image generators, data lookup, AI chat, etc.)
2. **Pick a service** - Click on something interesting
3. **See the pricing** - Notice bot price is $1.00, human price is $0.001
4. **Decide to verify** - Click "Verify to Save 1000x"

**Verification (30 seconds, one-time):**
1. See a QR code on screen
2. Scan it with their Self mobile app
3. Their phone reads their passport chip (NFC, like contactless payment)
4. They approve sharing: "I'm 18+, not from sanctioned country, pass OFAC check"
5. Screen shows "You're verified! ✓"

**Using services after verified:**
1. Connect their crypto wallet (MetaMask)
2. Click "Send Request" on any service
3. Sign payment (takes 3 seconds, costs $0.001)
4. Get the API response back
5. See they saved $0.999 compared to bots

**Their dashboard shows:**
- How many requests they made
- How much money they saved vs bot pricing
- History of everything they used
- Their verification status and when it expires (90 days)

### Vendor Journey:

**Sign up:**
1. Create account with email
2. Pick membership tier (Free trial, $29/month, $99/month, $499/month)
3. Each tier gives different number of requests allowed per month

**Add their API to marketplace:**
1. Enter service details:
   - Name of their API
   - What it does
   - Category (AI, Data, Creative, etc.)
   - Their API endpoint URL
2. Set three prices:
   - Bot price: $1.00 (they choose)
   - Verified human: $0.001 (they choose, usually 1000x cheaper)
   - Premium human: $0.0005 (optional, even cheaper)
3. Set who can use it:
   - Minimum age? (18+, 21+, etc.)
   - Ban certain countries? (Yes/No)
   - Require OFAC check? (Yes/No)

**Install the payment code:**
1. Copy 5 lines of code
2. Paste into their API server
3. Test it works
4. Click "Go Live"

**Their dashboard shows:**
- How many requests they're getting
- How much money they're earning (in USDC cryptocurrency)
- Which tier users are using their service (bots vs humans)
- How close they are to monthly request limit
- Alerts if something breaks

---

## What screens exist?

### Public screens (anyone can see):

**Homepage**
- Big hero text: "Verify once, pay instantly, access everything"
- Show how much people are saving
- List of featured services

**Service Catalog**
- Grid of service cards (like app store)
- Search bar at top
- Filters on left: category, price range, ratings
- Each card shows: icon, name, bot price, human price, savings amount

**Service Detail Page**
- Service name and description
- Three-column pricing table (bot, human, premium)
- "Try Sample" button (free test, no payment)
- Documentation about how to use the API
- Reviews from other users

**Sign Up Pages**
- One for consumers
- One for vendors (different sign-up form)

### Consumer screens (logged in):

**Verify Screen**
- Big QR code in center
- Instructions: "Scan with Self app"
- Waiting spinner when they scanned
- Success celebration when done

**Dashboard**
- Total saved amount (big number, makes them happy)
- Total requests made
- Recent services used
- Quick links to favorite services

**Transaction History**
- Table of every request: date, service, cost, status
- Can download CSV

**Settings**
- Connect/disconnect wallet
- Manage notifications
- See verification expiry date

### Vendor screens (logged in):

**Onboarding Wizard**
- Step 1: Profile setup
- Step 2: Choose membership tier and pay
- Step 3: Add first service
- Step 4: Install middleware code
- Step 5: Test and go live

**Vendor Dashboard**
- Request count this month
- Revenue this month (USDC earned)
- Progress bar: "23,456 / 50,000 requests used (47%)"
- Chart: requests over time
- Chart: bot vs human traffic
- Alert box if something needs attention

**Service Management**
- List of all their services
- Click to edit pricing, requirements, description
- Turn service on/off
- View analytics for each service

**Analytics Page**
- Deep dive into numbers
- Who's using their API
- Peak usage times
- Error rates
- Response times

**Payouts**
- How much USDC they earned
- Withdraw to their wallet
- History of past payouts

---

## Key interactions (what happens when you click things)

**"Verify to Save" button:**
- Opens QR code modal
- Starts 5-minute countdown
- When user scans → shows "Waiting..."
- When proof received → shows "Success!" with confetti
- Then redirects back to service page

**"Send Request" button:**
- Opens MetaMask
- Shows signature request (no gas fee)
- User signs
- Shows "Processing..." spinner
- After 3-5 seconds shows response
- Toast notification: "Request successful, cost $0.001"

**Search bar:**
- Type and see instant suggestions
- Shows matching services while typing
- Click suggestion or hit Enter to see full results

**Price filters:**
- Move slider
- List updates immediately showing only services in that price range

**"Try Sample" button:**
- No payment needed
- Returns fake/demo data instantly
- Helps user understand what the API does

**Connect Wallet button:**
- Opens MetaMask popup
- After connecting, shows wallet address in header
- Shows USDC balance

---

## Important things users should always see:

**In the header (always visible):**
- Logo/home button
- Search bar (on catalog pages)
- Wallet connection status
- "Verified Human ✓" badge (if verified)
- User menu dropdown

**On every service:**
- The three-tier pricing (bot, human, premium) side-by-side
- Savings amount highlighted in green
- Verification status required (age, location, OFAC)
- Vendor name and rating

**Feedback for actions:**
- When payment sent: "Processing payment..."
- When payment done: "Success! ✓"
- When something fails: "Error: [reason]" with retry button
- When loading: spinner or skeleton

**Trust signals:**
- Number of verified humans on platform
- Total requests processed
- Vendor reputation scores
- "Audited" or "Secure" badges

---

## How money flows:

1. Consumer pays $0.001 USDC (cryptocurrency)
2. Payment goes directly to vendor's wallet
3. Platform takes membership fee from vendor ($29-$499/month) not a % of transaction
4. Settlement is instant (2-5 seconds on Celo blockchain)
5. No chargebacks, no banks, no waiting

---

## Privacy and security:

**What consumers share:**
- When verified: ONLY yes/no answers (Age 18+? Yes. Sanctioned country? No.)
- Passport data NEVER leaves their phone
- Vendors never see passport photo, name, number, etc.

**What vendors see:**
- User tier (bot, verified human, premium)
- Anonymous user ID (called nullifier)
- Request data (what the user asked for)
- Payment confirmation

**What the platform stores:**
- Verification proofs (encrypted)
- Transaction history
- Service listings
- User accounts (emails, encrypted)

---

## Why this matters:

**For consumers:** Stop paying 1000x more just because you're human. Verify once, save forever.

**For vendors:** Stop losing money to bots. Give real customers good prices, charge bots full price.

**For everyone:** No subscriptions, no accounts at each vendor, no KYC paperwork. Just instant micropayments and privacy-preserving verification.

---

## The feel of the app:

**Should feel:**
- Fast (everything loads quickly, payments take seconds)
- Simple (not overwhelming, clear next steps)
- Trustworthy (show security, show savings, show real numbers)
- Modern (looks like Stripe or Vercel, not old/clunky)
- Mobile-friendly (60% of users on phones)

**Should NOT feel:**
- Complicated (hide crypto complexity)
- Sketchy (be transparent about everything)
- Slow (no long waits)
- Confusing (every screen has clear purpose)

---

## What makes this different from normal marketplaces:

1. **Identity verification** - Uses passport scan once, not username/password every time
2. **Tiered pricing** - Same API costs different amounts based on proving you're human
3. **Instant payments** - Pay-per-request, not monthly subscriptions
4. **No platform fee on transactions** - Vendors pay flat monthly fee instead
5. **Privacy** - Zero-knowledge proofs mean vendors never see your passport

---

That's it. Simple marketplace connecting API buyers and sellers, with the twist that proving you're a real human unlocks massive discounts.
