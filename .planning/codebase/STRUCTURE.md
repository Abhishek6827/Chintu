# Directory Structure

- `/.github/workflows/` - CI/CD pipeline (`build.yml`) for automated building and publishing.
- `/.planning/` - GSD project management and mapping artifacts.
- `/electron/` - Desktop core:
  - `main.js`: Window lifecycle, IPC handlers, tray setup.
  - `preload.js`: Secure IPC bridge to the frontend.
  - `server.js`: Express server mimicking the API routes for the packaged app.
- `/src/app/` - Next.js frontend:
  - `room/page.tsx`: The primary heavy-lifting UI component handling recording, STT, chat, and vision.
  - `api/`: Next.js endpoints active during development mode.
- `/src/components/` - Shared UI components (`AnswerDisplay`, `ProfileModal`).
- `/scripts/` - Build scripts like `publish.js`.
