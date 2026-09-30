# MEDSCOPE — 90 SECOND HACKATHON PITCH

## The problem

Medical literature is not scarce. Attention is.

Researchers and clinicians face a flood of abstracts, but compression introduces a second problem: **interpretation drift**. A summary can accidentally remove a qualifier, lose a number, blur association into causation, or make an unresolved limitation disappear.

## The idea

MedScope is an **evidence compiler**, not a generic summarizer.

We compile each abstract into an inspectable evidence object:

**source → study DNA → atomic claims → exact anchors → numeric lock → boundary layer → drift audit**

That object becomes the interface for search, Q&A, comparison, and export.

## The wow moment

I click a result claim.

The interface does not merely show a generated sentence.

It opens the **exact source phrase** that supports it.

Then I look at the quantitative lock.

The sample size, duration, effect estimate, and confidence interval were preserved separately.

Then I look at the boundary layer.

MedScope shows what the abstract **does not establish**.

So we are not asking the user to “trust the AI.” We are giving them a way to inspect the evidence path.

## The second wow moment

Select several studies.

MedScope builds an Evidence Matrix that compares the study frame before it compares the prose.

If two papers look contradictory, the system first asks whether they actually studied the same population, intervention, endpoint, or time horizon.

## Technology

React + Vite frontend. Node/Express backend.

PubMed + Europe PMC + Crossref retrieval.

Optional OpenAI Responses API with structured output.

Deterministic evidence auditing around the AI layer.

## Why it is defensible

The hardest thing to demo is often “AI accuracy.” We intentionally do not fake that number.

Instead, MedScope ships a reproducible Benchmark Lab for preservation behaviors and creates a path toward expert-labelled external validation.

## Closing line

**Don't build another interface that hides the evidence inside the summary. Build the evidence layer that makes the summary inspectable.**
