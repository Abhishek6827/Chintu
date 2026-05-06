---
trigger: always_on
---
# Project-specific rules

- The EXE app header (Electron / PIP) and the web landing header
  are **separate systems**.
- On the web landing page:
  - Do NOT render the main PIP/app UI.
  - Only show marketing, auth, and pricing flows.

- If a feature already works correctly in the EXE app header:
  - Treat that implementation as the **source of truth**.
  - Reuse that logic from the web side instead of inventing new behavior.---
trigger: manual
---

