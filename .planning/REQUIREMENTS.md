# SaaS Transformation Requirements

## 1. User Authentication (Auth)
- **Goal**: Allow users to create accounts and log in securely.
- **Provider**: Clerk (Recommended for Next.js).
- **Features**:
  - Sign-up/Sign-in pages.
  - User profile management.
  - Session management in Electron.

## 2. Database & State (DB)
- **Goal**: Persist user data, subscription status, and credits.
- **Provider**: Supabase (PostgreSQL).
- **Schema**:
  - `profiles` table: `id`, `email`, `full_name`.
  - `subscriptions` table: `id`, `user_id`, `plan_id`, `status`, `current_period_end`.
  - `credits` table: `id`, `user_id`, `balance`.

## 3. Subscription Plans (Payments)
- **Goal**: Implement 3 tiers of access.
- **Provider**: Stripe.
- **Plans**:
  - **Free**: 10 credits/month.
  - **Pro Monthly**: 500 credits/month ($10/mo).
  - **Pro Annual**: 6000 credits/year ($100/yr).
- **Checkout Flow**: Redirect to Stripe Checkout for payments.
- **Webhooks**: Listen for `checkout.session.completed` and `invoice.paid` to update credits.

## 4. Credit System Logic
- **Goal**: Control access based on credits.
- **Logic**:
  - Middleware to check if user is authenticated.
  - API wrapper to check `credits.balance > 0` before AI calls.
  - Deduct 1 credit per AI interaction.
  - UI notification when credits are low or empty.

## 5. UI/UX
- **Goal**: Premium SaaS feel.
- **Components**:
  - Pricing Table.
  - Usage Dashboard (Credit bar).
  - Subscription management button (Stripe Billing Portal).
