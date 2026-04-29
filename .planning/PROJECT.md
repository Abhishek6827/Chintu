# Chintu SaaS Transformation

## What This Is

Chintu is an AI-powered assistant built with Next.js and Electron. This project aims to transform it into a multi-tenant SaaS application that allows different users to sign up, subscribe to plans (Monthly/Annual), and use the app based on a credit-based system.

## Core Value

Enable monetization and multi-user access through a secure, credit-based SaaS infrastructure.

## Requirements

### Validated

- ✓ Core AI interaction logic (Gemini, Groq, OpenAI) — existing
- ✓ Desktop integration via Electron — existing

### Active

- [ ] User Authentication and Management (via Clerk)
- [ ] Database integration for user profiles and credits (via Supabase)
- [ ] Stripe integration for Monthly and Annual subscription plans
- [ ] Credit-based usage tracking logic
- [ ] SaaS Dashboard for users to manage subscriptions and view credits

### Out of Scope

- [ ] Mobile app version — focusing on Desktop (Electron) first.
- [ ] Team/Organization accounts — focusing on individual users first.

## Context

Chintu is currently a single-user desktop application. To scale, it needs a backend that can handle authentication, billing, and state management across different installations. The app uses Next.js 14 (App Router) and Tailwind CSS.

## Constraints

- **Tech Stack**: Must remain compatible with Next.js 14 and Electron.
- **Security**: User data and API keys must be handled securely (Clerk/Supabase).
- **Complexity**: Minimize friction for users during the signup/payment flow.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clerk for Auth | Best-in-class DX for Next.js and handles multi-tenancy seamlessly. | — Pending |
| Supabase for DB | Fast to setup, includes PostgreSQL and built-in support for Row Level Security (RLS). | — Pending |
| Stripe for Payments | Standard for SaaS subscriptions and handles global payments/taxes. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after initialization*
