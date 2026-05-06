---
description: Chintu Project Context
---

# Chintu - Premium AI Interview Assistant

## Project Vision
Chintu is a sophisticated AI-powered interview preparation platform that helps candidates excel in technical interviews through personalized coaching, real-time feedback, and comprehensive practice sessions.

## Target Users
- **Primary**: Software developers preparing for technical interviews
- **Secondary**: Engineering managers conducting interviews
- **Tertiary**: HR professionals and recruitment agencies

## Core Features
1. **AI Interview Coach**: Real-time interview simulation with personalized feedback
2. **Resume Analysis**: Intelligent parsing and optimization suggestions
3. **Profile Management**: LinkedIn integration and bio structuring
4. **Subscription Management**: Premium features with Razorpay integration
5. **Secure Authentication**: Google, GitHub OAuth and encrypted email login

## Technical Stack
- **Frontend**: Next.js 14.2.35, React 18, TypeScript
- **Backend**: Express.js, Supabase (PostgreSQL)
- **Desktop**: Electron 41.1.0
- **UI**: TailwindCSS, Framer Motion, Lucide React
- **Authentication**: Clerk
- **Payments**: Razorpay, Stripe
- **AI Integration**: OpenAI, Google Generative AI, Groq

## Anti-Goals
- No social media integration beyond LinkedIn
- No mobile app (desktop/web only)
- No team collaboration features
- No video recording capabilities

## Constraints
- Must maintain Electron compatibility
- Preserve existing authentication flow
- Keep current file structure intact
- Maintain premium subscription model

## Rough Milestone Sequence
1. **GSD Integration**: Core auto mode infrastructure
2. **Database Setup**: SQLite and state management
3. **CLI Interface**: Command system implementation
4. **Auto Execution**: Planning and execution phases
5. **Dashboard Integration**: Visual progress tracking
6. **Verification System**: Quality gates and testing
7. **Documentation**: User guides and API docs

## Success Criteria
- Autonomous development workflow
- Clean git history with meaningful commits
- Real-time progress visualization
- Robust error recovery mechanisms
- Seamless integration with existing codebase
