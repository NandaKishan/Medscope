# MedScope source map

The application intentionally uses documented public scholarly services rather than embedding a large corpus.

## PubMed / NCBI E-utilities

ESearch is used for query → PMID discovery. EFetch is used for PMID → structured article retrieval.

Official documentation:
https://www.ncbi.nlm.nih.gov/books/NBK25499/

## Europe PMC

The REST API is used for complementary publication search and core metadata/abstract retrieval. Its `resultType=core` records can provide richer metadata, abstracts, MeSH and links.

Official documentation:
https://europepmc.org/RestfulWebService

## Crossref

The REST API is used for DOI lookup and bibliographic enrichment. The public API requires no registration; a `mailto` parameter is recommended for the polite pool.

Official documentation:
https://www.crossref.org/documentation/retrieve-metadata/rest-api/

## OpenAI

The optional AI layer uses the server-side OpenAI JavaScript SDK and Responses API. Structured JSON output is used so the model returns the same evidence-object shape as the deterministic engine.

Official quickstart:
https://platform.openai.com/docs/quickstart/make-your-first-api-request

## Copyright / data handling note

The repository contains synthetic benchmark abstracts and UI demo copy. It does not ship a scraped medical-paper corpus. Public literature is retrieved at runtime from public scholarly APIs, and source URLs/identifiers are retained for provenance.
