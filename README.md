# MedScope 3.1 — Evidence OS

MedScope is an evidence-first medical-literature compiler prototype. It turns a raw abstract into an inspectable evidence object: Study DNA, atomic claims, quantitative facts, source anchors, boundaries, limitations, and an integrity audit. It also supports public literature retrieval, batch comparison, local history, exports, a deterministic regression harness, and an optional server-side OpenAI layer.

## 3.1 stability fix
The client is now **zero-dependency vanilla JavaScript**. This avoids the React dependency/Vite optimization blank-screen failure mode from earlier prototypes.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The API server runs on `http://localhost:8787`.

## Optional OpenAI
Copy `server/.env.example` to `server/.env` and set:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5
```

The API key remains server-side.

## Demo
Open the app and click **Launch judge demo**. The benchmark abstract is synthetic and safe to use for presentations.

## Notes
The prototype is designed for public abstracts and synthetic inputs. It should not be used with protected health information. The benchmark score is a deterministic software regression score, not a clinical-accuracy claim.
