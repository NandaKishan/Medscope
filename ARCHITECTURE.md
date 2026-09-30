# MedScope 3.0 Architecture

## Architectural thesis

The core unit is not a paragraph. It is the **evidence object**.

```text
                         ┌──────────────┐
                         │ Public Corpus │
                         │ PubMed / EPC │
                         │ Crossref     │
                         └──────┬───────┘
                                │
                         retrieval / resolve
                                │
                                ▼
                       ┌──────────────────┐
                       │ Source normalizer│
                       └────────┬─────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ Evidence Engine │
                        │  PICO / claims  │
                        │ numbers / edges │
                        └────────┬────────┘
                                 │
               ┌─────────────────┼───────────────────┐
               ▼                 ▼                   ▼
        ┌─────────────┐   ┌──────────────┐   ┌───────────────┐
        │ OpenAI layer │   │ Drift guard  │   │ Integrity     │
        │ optional     │   │ deterministic │   │ vector        │
        └──────┬──────┘   └──────┬───────┘   └──────┬────────┘
               └──────────────────┼───────────────────┘
                                  ▼
                         ┌─────────────────┐
                         │ Evidence object │
                         │ claim → anchor  │
                         │ type → boundary │
                         └────────┬────────┘
                                  │
             ┌────────────────────┼─────────────────────┐
             ▼                    ▼                     ▼
       ┌──────────┐       ┌─────────────┐       ┌────────────┐
       │ Q&A      │       │ Matrix      │       │ Export/API │
       └──────────┘       └─────────────┘       └────────────┘
```

## Server modules

`server/src/index.js` contains the HTTP boundary and rate limiting.

`server/src/evidence.js` is the deterministic safety/evidence layer. It performs text normalization, sentence segmentation, PICO extraction, numeric extraction, claim generation, integrity auditing, drift detection, and graph construction.

`server/src/openai.js` contains the optional LLM adapter using the OpenAI Responses API and structured JSON schema output.

`server/src/pubmed.js`, `server/src/europepmc.js`, and `server/src/crossref.js` are source adapters.

`server/src/compare.js` is the deterministic cross-paper comparison layer.

## Why the fallback engine matters

A hackathon demo should not collapse because one external secret is missing. The local engine guarantees a functional path for:

- demo mode
- tests
- offline judging
- deterministic regression checks

When OpenAI is configured, the generated evidence object is still passed through the deterministic integrity audit.

## Security posture

- API keys live on the server by default.
- Request body size is capped.
- Abstract/question sizes are bounded.
- Batch size is capped at ten.
- Basic request-rate limiting is included.
- Source text is explicitly treated as untrusted content in the OpenAI instructions to reduce prompt-injection risk.
- No patient database is created.

## Evaluation philosophy

Do not claim “92% medically accurate” without an expert-labelled dataset.

MedScope instead exposes a traceability-oriented integrity vector:

- anchor coverage
- numeric fidelity
- uncertainty coverage
- study-frame completeness
- claim discipline

The Benchmark Lab uses synthetic regression cases to demonstrate these mechanisms. A production evaluation suite should add blinded expert review and clinically meaningful, task-specific metrics.
