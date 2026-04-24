# Concerns & Tech Debt

1. **Logic Duplication:** The AI handling logic is completely duplicated between `src/app/api/...` (for dev) and `electron/server.js` (for prod). Any change to models or prompts requires updating multiple files.
2. **Monolithic Component:** `src/app/room/page.tsx` is over 1,400 lines long. It handles UI, recording state, screen capture, STT, and API calls. It needs to be broken down into smaller custom hooks and components.
3. **Security:** Bundling the `GH_TOKEN` directly into the `.exe` makes the private repository vulnerable if the executable is ever shared publicly or reverse-engineered. This is currently acceptable since it's a private app, but is a major security flaw for public distribution.
