# Pseudocoding Task

## Overview

This repository documents a pseudocoding exercise. The idea behind it is to treat pseudocode as an executable mental model — a detailed, plain-English specification written before code exists, and a checkable contract once code exists.

The exercise covers:

- pseudocoding existing functions
- tracing behaviour by hand
- comparing traces against real execution
- analysing open-source code
- implementing a feature from pseudocode
- comparing a human implementation with an AI implementation
- reverse-engineering AI-generated code back into pseudocode

The repository is organised into three parts (A, B, C), each with its own evidence files.

## Pseudocode Standard

Every pseudocode document in this repository follows the same structure:

- **FUNCTION** — the name of the function being described
- **INPUTS** — every input, its expected type, and its meaning
- **OUTPUT** — exactly what the function returns
- **SIDE EFFECTS** — externally visible effects, or NONE
- **FAILS WHEN** — every condition under which the function cannot produce its normal result
- **STEPS** — the numbered sequence of actions the function performs

Steps are numbered, written in plain English, and each step describes one action. Branches, loops, early exits, external calls, and state changes are identified explicitly rather than implied.

## Part A — Reading Code Through Pseudocode

### A1 — Functions From My Own Work

Part A1 documents three functions taken from my own projects, all written up in `part-a/pseudocode.md`:

1. **`prorate()`** — money logic that works out a credit for unused time on an old plan when a customer changes plans partway through a billing period.
2. **`WorkerProcess.process()`** — background job processing that runs a handler and resolves the job's outcome (success, retry, dead letter) while guarding on ownership.
3. **`POST()`** — the authentication sign-in handler, covering rate limiting, a dummy bcrypt hash for unknown emails, and email-verification gating.

Each function was pseudocoded from my own reading, then hand-traced with normal, edge, and invalid inputs. The traces were then compared against the real implementation's actual behaviour, and the discrepancies and corrections were recorded alongside the traces.

### A2 — Open-Source Functions

Part A2 applies the same approach to three functions from an open-source library. Zod 4.5.4 was used:

- **`isPlainObject`** — `part-a/a2-1-zod-isPlainObject.md`
- **`getParsedType`** — `part-a/a2-2-zod-getParsedType.md`
- **`visit`** — `part-a/a2-3-zod-visit.md`

The workflow for each one was: I wrote my own first-pass pseudocode from reading the source *before* asking for an AI explanation. I then compared the AI explanation with my own reading of the source, and checked any disagreements against the implementation and its tests.

The Zod source that was inspected came from the Zod dependency available in the sibling `auth-slice` project. This repository contains the analysis and evidence, but it does not vendor Zod or any `node_modules` directory.

### A3 — Planted Bug

**Status: Complete.**

- `part-a/a3-planted-bug.js` — the function under analysis, `calculateOrderTotal(items, discountPercent)`, which contains a planted bug
- `part-a/a3-planted-bug-analysis.md` — pseudocode of what the implementation actually does and what it should do, two hand traces, the identified difference, and the proposed fix

Both pseudocode specifications follow the repository standard, so the difference between them is reduced to the numbered steps. The trace without a discount matched the intended result. The trace with a discount produced 50 where the intended result was 200, and that difference is the planted bug: the discount branch replaces the subtotal with the discount amount instead of subtracting the discount from it.

`part-a/a3-planted-bug.js` is left unmodified, so the traced evidence still corresponds to the code as analysed.

## Part B — Implementing From Pseudocode

Part B covers a coupon-application feature. A coupon can apply a percentage or fixed discount to a cart total (in minor units), subject to expiry, minimum spend, and usage-limit checks. The feature is small enough to be fully specified up front.

### B1 — Specification and Hand Tracing

The full specification is in `part-b/coupon-pseudocode.md`. It defines the inputs (cart total, coupon, current date, customer), the output, the failure conditions, and the numbered steps, along with the decisions made after tracing (expiry boundary, percentage rounding, and others).

Five inputs were hand-traced before any implementation existed, using a mix of normal cases and edge/failure cases such as an expired coupon and a discount larger than the cart total.

### B2 — My Implementation

- `part-b/applyCoupon.js` — my implementation of the specified function
- `part-b/applyCoupon.test.js` — a test script that runs the five traced inputs
- `part-b/b2-trace-vs-test.md` — the evidence comparing traces against actual output

The same five hand-traced inputs were executed against the implementation, and all five matched the predicted behaviour (5/5).

## Part C — Human vs AI Implementation

### C1 — AI Implementation

`part-c/ai-applyCoupon.js` contains an implementation of `applyCoupon` produced by an AI, using the Part B pseudocode as the specification. It was written independently as a separate implementation to be compared against mine.

### C2 — Reverse Engineering

The AI-generated implementation was converted back into pseudocode in `part-c/reverse-engineered-pseudocode.md` **without** using the original pseudocode as the reference during the reverse-engineering pass. The two specifications were then compared line by line in `part-c/c2-difference-table.md`.

Comparing the original specification with the reverse-engineered one exposed ambiguities around interface details (property names, what "the coupon does not exist" means), validation, JavaScript coercion, and unusual numeric values such as NaN.

### C3 — Behaviour Comparison

`part-c/c3-comparison.test.js` runs both implementations against the same ten conceptual inputs and compares their behaviour. `part-c/c3-comparison.md` records the results and analysis.

The actual result was:

- 10 total comparison inputs
- 9 matched
- 1 disagreed

The disagreement was a percentage discount supplied as the string `"10"`. My implementation rejected it because the discount value must be a number. The AI implementation accepted it and applied the 10% discount, because JavaScript coercion allowed the string to participate in numeric comparisons and arithmetic. The desired contract is to require an actual finite numeric value rather than relying on coercion.

The comparison also exposed additional validation questions that both implementations shared, around NaN as a discount value and missing minimum-spend/usage-count fields.

### C4 — Explain Without Code

**Status: Complete.**

`part-c/c4-explanation.md` contains the evidence for this stage: the recording link (linked from inside the document), what I explained using only my pseudocode notes, and what a non-technical listener understood when she explained the feature back to me in her own words.

The recording runs approximately 7 minutes 30 seconds. That is over the five-minute maximum, and the overrun is recorded in the document rather than trimmed: the explanation continued into follow-up discussion and listener feedback.

## Running the Executable Checks

Node.js is required. There is no `package.json` or npm setup in this repository; the checks are plain Node scripts.

The Part B check runs the five hand-traced inputs against my implementation and prints each result:

```
node part-b/applyCoupon.test.js
```

The Part C check runs both implementations against the ten comparison inputs and prints a summary of matches and disagreements:

```
node part-c/c3-comparison.test.js
```

## Key Lessons

The exercise confirmed, with actual evidence, a few things I half-suspected before starting.

Pseudocode exposes assumptions before code is written. Tracing five inputs up front surfaced decisions — the expiry boundary, floor rounding, capping a discount at the cart total — that would otherwise have been made silently inside the implementation.

Precise input types matter. The C3 disagreement came down to a string `"10"` versus a number `10`. Nobody wrote that down in the spec, so two implementations split. If the type had been stated as "must be a finite number", the disagreement never happens.

Two implementations can agree and still share the same validation gap. Both my code and the AI's let a NaN discount value flow through and both accepted missing fields. Agreement between implementations is evidence that they interpret the spec the same way — not proof that the spec is complete.

JavaScript coercion can create behaviour that was never explicitly specified. The AI implementation didn't intend to accept `"10"`; it just never checked, and the language did the rest.

Reverse-engineering code back into pseudocode is a useful second pass. It forces you to describe what the code actually does rather than what you meant for it to do, which is exactly how the C2 comparison caught the interface ambiguities the original spec left open.

And reading Zod's `visit` function showed how much a short high-level description can hide. "Walks a schema tree and lets you replace nodes" sounds simple, but the real behaviour involved a caching layer, cycle handling with a lazy placeholder, identity preservation of unchanged branches, and a specific traversal order — none of it visible from the one-line summary.

## Remaining Work

None. Every stage in Parts A, B and C is complete and the evidence is committed.

## Repository Structure

```
pseudocoding-task/
├── README.md                                  this file
├── part-a/
│   ├── pseudocode.md                          A1: three functions pseudocoded, traced, compared
│   ├── a2-1-zod-isPlainObject.md              A2: isPlainObject analysis and comparison
│   ├── a2-2-zod-getParsedType.md              A2: getParsedType analysis and comparison
│   ├── a2-3-zod-visit.md                      A2: visit analysis and comparison
│   ├── a3-planted-bug.js                      A3: function under analysis (unmodified)
│   └── a3-planted-bug-analysis.md             A3: actual vs intended pseudocode, traces, planted bug
├── part-b/
│   ├── coupon-pseudocode.md                   B1: applyCoupon spec and five hand traces
│   ├── applyCoupon.js                         B2: my implementation
│   ├── applyCoupon.test.js                    B2: executable check for the five traced inputs
│   └── b2-trace-vs-test.md                    B2: trace-vs-implementation evidence
└── part-c/
    ├── ai-applyCoupon.js                      C1: AI implementation from the Part B spec
    ├── reverse-engineered-pseudocode.md       C2: AI code converted back into pseudocode
    ├── c2-difference-table.md                 C2: original vs reverse-engineered spec comparison
    ├── c3-comparison.test.js                  C3: executable 10-input comparison harness
    ├── c3-comparison.md                       C3: results and analysis
    └── c4-explanation.md                      C4: recording link and listener evidence
```