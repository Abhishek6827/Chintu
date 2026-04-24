# Coding Conventions

- **Languages:** TypeScript (`.ts`, `.tsx`) is strictly used in the `/src` folder (Next.js). Plain JavaScript (`.js`) is used in the `/electron` folder.
- **Styling:** Utility-first CSS using Tailwind CSS. Global base styles and clamp-based fluid typography are defined in `globals.css`.
- **Environment Variables:** Loaded via `dotenv` in both Next.js and Electron to maintain consistency between dev and prod environments. Variables are packaged directly into the `.exe` during the build process to simplify deployment.
- **UI/UX:** The app heavily prioritizes a "Ghost Mode" interface (glassmorphism, no window frames, invisible to screen capture) to serve as a stealth copilot.
