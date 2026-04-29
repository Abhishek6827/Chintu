# ROADMAP

## Milestone 1: SaaS Foundation & Auth
**Goal**: Implement user authentication and basic database setup.

- **Phase 1**: Clerk Auth Integration
  - Setup Clerk project.
  - Add Middleware for protected routes.
  - Create Sign-up/Sign-in pages.
- **Phase 2**: Supabase Database Setup
  - Setup Supabase project and schema.
  - Sync Clerk users with Supabase profiles via webhooks.

## Milestone 2: Payments & Subscriptions
**Goal**: Integrate Stripe and implement the three plans.

- **Phase 3**: Stripe Setup & Pricing UI
  - Create products in Stripe Dashboard.
  - Build the Pricing page in the app.
- **Phase 4**: Checkout & Webhooks
  - Implement Stripe Checkout session.
  - Setup webhooks to handle subscription events.

## Milestone 3: Credit System & UX
**Goal**: Implement the core business logic and dashboard.

- **Phase 5**: Credit Management Logic
  - Implement credit deduction on AI calls.
  - Add credit balance check to API routes.
- **Phase 6**: Usage Dashboard & Polish
  - Build user dashboard to show usage.
  - Add premium UI/UX enhancements.
