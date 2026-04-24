# Architecture

## Runtime Modes
The application has a dual-mode execution architecture:
1. **Development Mode (`npm run electron:dev`)**: Electron spawns and loads `localhost:3000`. The Next.js dev server handles both the frontend and the AI API routes (`/api/answer`, `/api/answer-vision`).
2. **Production Mode (Packaged `.exe`)**: Next.js is statically exported (`next build`). Electron's `main.js` launches an embedded Express server (`electron/server.js`) that serves the static files and actively mimics the Next.js API endpoints to handle AI requests.

## Inter-Process Communication (IPC)
The frontend (`src/app/room/page.tsx`) communicates with the desktop host (`electron/main.js`) via `electron/preload.js`. Features managed by IPC include:
- Ghost Mode (Window transparency, click-through, and hiding from screen capture)
- taking screenshots
- Fetching app version and update statuses.
