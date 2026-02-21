# Jyotish API – Phase 1 SaaS Implementation Plan

Goal: Launch a production-grade Astrology API SaaS that serves:
1. End users (credit-based usage)
2. Astrologers (advanced credit packs)
3. Aggregators / Apps (monthly API subscriptions)
4. White-label clients

This is Phase 1 only (fast to market, revenue-first approach).

---

# 1. Phase 1 Feature Scope (High Demand Endpoints)

Focus only on most requested, monetizable features.

## Core Endpoints (V1)

### 1. /v1/planetary-positions
Returns:
- Sun to Saturn longitudes
- Rahu/Ketu
- Rashi
- Nakshatra
- Pada
- Retrograde status

Why?
Used in:
- Astrology apps
- Chart visualizers
- Panchang apps
- Horoscope engines

Difficulty: Medium  
Revenue Potential: High

---

### 2. /v1/moon-sign
Returns:
- Moon Rashi
- Nakshatra
- Pada

Why?
Most common astrology query globally.

Difficulty: Low  
Revenue Potential: Very High

---

### 3. /v1/vimshottari-dasha
Returns:
- Mahadasha
- Antardasha
- Balance at birth
- Timeline list

Why?
Astrologers heavily rely on this.

Difficulty: Medium-High  
Revenue Potential: High

---

### 4. /v1/panchang
Returns:
- Tithi
- Nakshatra
- Yoga
- Karana
- Sunrise
- Sunset
- Rahu Kaal

Why?
Daily usage product.
Great for mobile apps.

Difficulty: Medium  
Revenue Potential: High recurring use

---

### 5. /v1/basic-kundli
Returns:
- Lagna
- Planet house positions
- Rashi chart data (JSON only, no images yet)

Why?
Enough for 80% of astrology apps.
You don't need divisional charts yet.

Difficulty: Medium  

---

# 2. Core Calculation Engine

DO NOT build astronomical math from scratch.

Use:
Swiss Ephemeris

Architecture:

Client → API Layer (Hono) → Core Engine → Formatter → Response

Core Engine Responsibilities:
- Timezone normalization
- Latitude/Longitude parsing
- Ayanamsa config (default: Lahiri)
- Planetary calculations
- Nakshatra calculation
- Dasha seed calculation

Make this a separate internal module:
src/core/engine.ts

Keep it isolated so:
- Easy to upgrade
- Easy to scale into microservice later

---

# 3. Tech Stack

Backend:
- Node.js + Hono
- Docker
- Deploy on Render (initially)

Database:
- Postgres (Supabase or Neon)

Cache / Rate Limit:
- Redis (Upstash)

Payments:
- Stripe subscriptions + credit topups

Docs:
- OpenAPI + Swagger UI

---

# 4. SaaS Architecture

User
 ↓
Stripe Checkout
 ↓
Webhook → Activate Plan
 ↓
Generate API Key
 ↓
User Calls API
 ↓
API Middleware:
  - Validate key
  - Check credits
  - Rate limit
 ↓
Core Engine
 ↓
Log usage
 ↓
Deduct credits
 ↓
Return JSON

---

# 5. Credit System Model

Instead of request counting, use weighted credits.

Example:

Moon Sign → 1 credit  
Planetary Positions → 3 credits  
Panchang → 2 credits  
Dasha → 5 credits  
Basic Kundli → 8 credits  

Why?
Lets you scale pricing without complex infra.

---

# 6. Pricing Strategy

You will have 3 segments.

---

## A. End Users (Credit Packs)

Sold via website.

₹199 → 50 credits  
₹499 → 150 credits  
₹999 → 400 credits  

Best for:
- Individuals
- Hobby users

---

## B. Astrologers (Advanced Credit Packs)

₹2,999 → 2,000 credits  
₹4,999 → 4,000 credits  
₹9,999 → 10,000 credits  

Add:
- Bulk discount
- Priority support

---

## C. API Subscription (Aggregators)

Monthly pricing:

Starter – ₹2,999/month
- 10,000 credits

Pro – ₹7,999/month
- 50,000 credits

Business – ₹19,999/month
- 200,000 credits

Enterprise:
Custom SLA + dedicated instance

---

## D. White Label Plan

₹1.5L – ₹5L setup fee
+
Monthly infra charge

Includes:
- Custom domain
- Logo replacement
- Dedicated API base URL
- Separate DB schema

---

# 7. API Key System

Tables:

users
- id
- email
- role (user / astrologer / aggregator)
- stripe_customer_id

api_keys
- id
- user_id
- key
- credits_remaining
- monthly_limit
- expires_at

usage_logs
- user_id
- endpoint
- credits_used
- timestamp

---

# 8. Rate Limiting Strategy

Per API key:
- 60 req/min default
- 300 req/min pro

Use Redis sliding window.

Prevents abuse.

---

# 9. Scaling Strategy

Phase 1:
Single instance on Render

Phase 2 (when >100k calls/day):
- Move core engine to separate container
- Add horizontal scaling
- Add Redis cluster
- Use managed Postgres

Keep API stateless.

---

# 10. Selling Strategy

Step 1:
Launch landing page:
“Developer-first Jyotish API”

Step 2:
List on:
- RapidAPI
- Indie Hackers
- Product Hunt

Step 3:
Direct outreach:
- Astrology mobile apps
- Matrimony platforms
- Spiritual SaaS startups

Pitch:
"Integrate accurate Vedic astrology in 15 minutes via API."

---

# 11. Validation Before Full Build

Before building everything:

Build:
- Moon sign
- Planetary positions
- Dasha

Launch.
Sell first 5 clients.

Then expand.

Never build all 5 endpoints without revenue proof.

---

# 12. Revenue Projection

Conservative:

20 astrologers × ₹3,000/month = ₹60,000  
10 aggregators × ₹8,000/month = ₹80,000  

= ₹1.4L/month recurring

At 100 clients:
₹5L–₹10L/month realistic

---

# 13. Biggest Risk

Not technical.

Risk is:
- Accuracy mismatch with traditional astrologers
- Wrong Dasha balance
- Timezone bugs

Spend extra time testing.

---

# 14. Execution Timeline

Month 1:
Planetary positions + Moon sign + Auth + Credits

Month 2:
Dasha + Panchang

Month 3:
Basic Kundli + Payments + Public Launch

---

# Final Advice

This is not just an API.
It is Astrology-as-a-Service.

Keep:
- Core logic private
- Pricing flexible
- Credits weighted
- Infra simple at start

Launch fast.
Monetize early.
Scale after validation.
