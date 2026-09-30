# MedScope 3.1 — Blank-screen hotfix

## What changed
- Replaced the React/Lucide frontend with a zero-dependency vanilla JavaScript client.
- Removed Vite React plugin and all client-side package resolution requirements.
- Vite now serves `client/` directly with a minimal config and `/api` proxy.
- Preserved the full core experience: Abstract Lab, literature search, batch comparison, claim ledger, history, benchmark lab, system/API view, exports, source Q&A, judge presentation mode, dark/light theme, and OpenAI-ready backend.

## Why
The previous build could display a blank page when React dependencies or Vite dependency optimization were unavailable/corrupted. The new client cannot hit that dependency failure mode.
