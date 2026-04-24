# Integrations

## External APIs
- **Groq API**: Used for fast text generation. Supports multiple fallback keys (`GROQ_API_KEY_1`, `2`, `3`).
- **OpenRouter API**: Used for fallback models and larger context windows.
- **DashScope API**: Additional AI model integrations.

## System Services
- **Electron DesktopCapturer**: For taking screen screenshots to feed into vision models.
- **Electron AutoUpdater**: Connected to GitHub Releases via `GH_TOKEN` for seamless background updates.
- **SpeechRecognition**: Browser-native Speech-to-Text with fallback to Whisper APIs.
