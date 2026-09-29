# A2.2 — Zod `getParsedType`

**Library:** Zod 4.5.4
**Source:** `node_modules/zod/src/v4/core/util.ts`
**Function:** `getParsedType`
**Difficulty:** Medium

## My First-Pass Pseudocode

FUNCTION getParsedType

INPUTS:
- data — any value whose type needs to be identified

OUTPUT:
- A string naming the exact type of data: "undefined", "string", "number", "nan", "boolean", "function", "bigint", "symbol", "array", "null", "promise", "map", "set", "date", "file", or "object"

SIDE EFFECTS:
- None. The function only inspects data and never changes it.

FAILS WHEN:
- The built-in type of data is not one of the known types. It then throws an Error saying "Unknown data type". This should almost never happen in practice.

STEPS:

1. Get the basic built-in type of data.

2. If the basic type is string, boolean, function, bigint, symbol or undefined, return that same name.

3. If the basic type is number, return "nan" if the value is NaN, otherwise return "number".

4. If the basic type is object, check in this order and return the first match:
   a. data is an array, so return "array"
   b. data is null, so return "null"
   c. data has both a then and a catch function, so return "promise"
   d. data is a Map, so return "map"
   e. data is a Set, so return "set"
   f. data is a Date, so return "date"
   g. data is a File, so return "file"
   h. none of the above, so return "object"

5. For Map, Set, Date and File, first confirm that type exists in the current environment before checking.

6. If the basic type is anything else, throw an "Unknown data type" error.

## My Initial Understanding

This function gives a more accurate type name than JavaScript's built-in type check. The built-in check calls arrays, null, dates and maps all "object", and calls NaN a "number". This function separates those out so Zod can give clear error messages about what type of value it actually received. Simple types are returned straight away, and objects are checked one kind at a time until a match is found. The order matters, especially checking for null before looking at data.then, because null would crash that check.

## Questions / Things I Am Unsure About

- Why does it check for a promise by looking for then and catch instead of using instanceof Promise?
- Why check that Map, Set, Date and File exist before using instanceof on them? Is it for environments like Node where File doesn't exist?
- What would happen if the promise check ran before the null check?
- Why does the default case throw an error instead of returning "unknown"?
- Would an object with its own then and catch methods that isn't really a promise be labelled "promise" by mistake?

## AI Explanation Comparison

| Topic | My First-Pass Understanding | What the Source/AI Analysis Showed | Result |
| --- | --- | --- | --- |
| 1. Overall purpose | getParsedType provides more specific type information than JavaScript typeof. | Confirmed. `const t = typeof data` (line 464) then a `switch (t)`. `typeof` has 8 possible outputs for every value; this function returns one of 16 `ParsedTypes` (lines 67–83), splitting `typeof`'s single "object" into array/null/promise/map/set/date/file/object and its "number" into nan/number. | CORRECT |
| 2. Primitive dispatch | undefined, string, boolean, function, bigint and symbol return their corresponding type names immediately. | Confirmed. The switch cases for "undefined" (467–468), "string" (470–471), "boolean" (476–477), "function" (479–480), "bigint" (482–483) and "symbol" (485–486) each return directly with no further checks. | CORRECT |
| 3. Number / NaN handling | NaN returns "nan" while ordinary numbers return "number". | Confirmed at line 474: `Number.isNaN(data) ? "nan" : "number"`. Verified against the installed function: NaN → "nan"; 10 → "number"; Infinity → "number"; the string "NaN" → "string" (it is a string, so it never reaches the number branch). `Number.isNaN` is non-coercing, unlike the global `isNaN`. | CORRECT |
| 4. Object check order | array, null, promise-like, Map, Set, Date, File, then generic object. | Confirmed. Exact source order (lines 488–511): Array.isArray (489) → null (492) → then/catch promise check (495) → Map (498) → Set (501) → Date (504) → File (507) → fallback "object" (511). Matches my first-pass order exactly. | CORRECT |
| 5. Null safety | null must be checked before data.then because reading a property from null would throw. | Confirmed. Null returns at line 492–493, before the promise check at line 495. Reading `data.then` off null throws a TypeError before the `&&` short-circuit can help. Nuance: `Array.isArray(data)` (line 489) runs first, but `Array.isArray(null)` safely returns false, so the null check is still effective. | CORRECT |
| 6. Promise detection | Questioned why then/catch is checked instead of instanceof Promise. | Confirmed as structural duck-typing (lines 495–497): the object needs truthy function-valued `.then` and `.catch`. It recognises promise-like objects that are not native Promise instances. Runtime demonstration: a Promise created in another JavaScript realm fails `instanceof Promise` in the calling realm yet is still detected by the then/catch check. Note: this demonstration is runtime verification, not documented Zod intent — the source does not explain the reason. | CORRECT |
| 7. Fake promise-like object | Suspected `{ then(){}, catch(){} }` might be labelled "promise". | Confirmed by executing the installed function: it returns "promise". Also verified: object with only `then` → "object"; only `catch` → "object"; non-function `then`/`catch` → "object" (both must be truthy functions). | CORRECT |
| 8. Map, Set, Date, File existence guards | Questioned why the globals are checked before instanceof. | Confirmed the guards exist: `typeof Map !== "undefined" && data instanceof Map` (498), Set (501), Date (504), File (507–509). Referencing an undeclared identifier would throw a ReferenceError, so this pattern is the standard safe presence test. The likely environment-compatibility reason (e.g. File is not available globally in every runtime, such as older Node) is inference — Zod does not document the rationale. | CORRECT, rationale partly inferred |
| 9. First-match-wins behaviour | Object checks return on the first successful category. | Confirmed: an if/return chain, first successful check returns immediately. Interesting consequence: the promise-like check runs before Map/Set/Date/File, so a thenable that is also a Map/Set/Date/File subclass would be labelled "promise". | CORRECT |
| 10. Default branch | The default branch "should almost never happen in practice". | Imprecise. Under standard JavaScript semantics `typeof` returns exactly eight strings — "undefined", "string", "number", "boolean", "function", "bigint", "symbol", "object" — and all eight are handled by named cases. The default (513–514) is therefore effectively unreachable, defensive code, not merely rare. | PARTLY CORRECT / imprecise |
| 11. Side effects | None — the function only inspects data. | Confirmed: the function does not intentionally mutate state or perform I/O. Nuance: property reads such as `data.then`/`data.catch` could invoke getters or Proxy traps supplied by the input, but that is behaviour of the input, not a designed side effect of the function. | CORRECT, with nuance |

## What I Got Right

Most of my first-pass interpretation matched the implementation:

- The overall purpose: finer-grained type names than `typeof`.
- Primitive types (undefined, string, boolean, function, bigint, symbol) returning directly from the switch.
- The NaN / ordinary-number distinction using a non-coercing NaN test.
- The exact object-branch ordering: array, null, promise, Map, Set, Date, File, generic object.
- Null safety: null is checked before `data.then`, and that ordering prevents a crash.
- The environment guards before `instanceof` on Map/Set/Date/File.
- First-match-wins behaviour inside the object branch.
- The no-side-effects conclusion.
- The suspicion that an ordinary object with function-valued `then` and `catch` could be classified as "promise".

## What I Got Wrong or Oversimplified

- **Main correction:** I wrote that the default branch "should almost never happen in practice". That was imprecise — under standard JavaScript semantics it is effectively unreachable, because `typeof` has eight possible result strings and all eight are handled by the switch. It is defensive code for a broken or modified runtime.

Reasonable nuances, not mistakes:

- Promise detection is structural/duck-typed: it confirms a promise-*like* shape, not that the value is a genuine native Promise instance.
- The environment-compatibility reasoning behind the `typeof Map/Set/Date/File !== "undefined"` guards is partly inference unless Zod explicitly documents it.
- Getter/Proxy property reads mean the "perfectly pure" statement is slightly simplified: the function only reads, but reads can be observable if the input supplies exotic accessors.

## Answers to My Original Questions

1. **Why then/catch rather than instanceof Promise?**
   - Fact (source): lines 495–497 test `data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function"` — structural duck-typing, not an `instanceof` check.
   - Demonstrated: a Promise from another JavaScript realm can fail `instanceof Promise` in the calling realm yet still be recognised by the then/catch check, and a fake `{ then(){}, catch(){} }` object is recognised as "promise".
   - Inferred rationale (not documented): realm-independent detection and support for thenable objects without depending on the `Promise` global.

2. **Why check Map/Set/Date/File existence?**
   - Fact (source): lines 498, 501, 504 and 507–509 all guard `instanceof` with a `typeof Global !== "undefined"` presence test.
   - Inferred rationale (not documented): referencing an undeclared identifier throws a ReferenceError, so the guard is the safe way to test whether the global exists. File is an especially relevant example because it is not available globally in every runtime (for example, older Node versions).

3. **What would happen if the promise check ran before the null check?**
   - Fact: `typeof null` is "object", `Array.isArray(null)` is false, and null has no `then` property, so null would fall straight through to `data.then` and throw a TypeError. The null check (lines 492–493) is what keeps null out of the promise check. The source deliberately returns "null" first.

4. **Why throw in default instead of returning unknown?**
   - Fact (source): the v4 default branch throws `new Error("Unknown data type: ...")` (lines 513–514), and the v4 return type has no "unknown" member to return. The v3 implementation of getParsedType instead returns `ZodParsedType.unknown` in its default.
   - Inferred rationale (not documented): v4 chooses to fail loudly on an impossible input rather than silently label it. Under standard `typeof` semantics this branch can never be reached.

5. **Can a fake object with then/catch be labelled "promise"?**
   - Fact (source, verified by execution): yes. `{ then(){}, catch(){} }` returns "promise". Both `then` and `catch` must be truthy functions — an object with only `then`, only `catch`, or non-function `then`/`catch` returns "object".

## Revised Understanding

getParsedType is one coarse dispatcher over `typeof` plus a refinement step. For every non-object primitive it returns the matching name immediately, and for numbers it separates NaN out via the non-coercing `Number.isNaN`. The real work happens in the object branch, which is a first-match-wins filter chain: array, then null (before any property reads that would crash on null), then a duck-typed promise check that accepts promise-like objects and even plain objects that happen to expose function `then` and `catch`, then Map, Set, Date and File behind environment guards, and finally a generic "object" fallback. The default branch that throws is unreachable under standard JavaScript, so it is defensive rather than a normal failure path. Overall the function gives Zod a fine-grained category for any value with no side effects of its own.

## Evidence and Verification

- No dedicated unit test for `getParsedType` was found in the installed Zod 4.5.4 source tree.
- The tests named "parsedType" in the locale test files do NOT test this function — they test a different helper (`parsedType` at util.ts:962) that builds human-readable invalid-type labels. Do not cite them as getParsedType tests.
- Closest relevant test evidence in the installed tree:
  - `v4/classic/tests/index.test.ts` around lines 562–568 — `z.nan`: `Number.NaN` parses; `123` and `"NaN"` throw.
  - `v4/mini/tests/index.test.ts` around lines 630–636 — `z.nan`, same behaviour.
  - `v4/core/tests/compile.test.ts` around lines 186–188 — NaN/number/string differential test.
- Direct read-only execution of the installed getParsedType function verified representative cases: NaN → "nan"; ordinary numbers (10, 0, Infinity, -Infinity) → "number"; arrays → "array"; null → "null"; native Promise → "promise"; fake `{ then(){}, catch(){} }` → "promise"; Map → "map"; Set → "set"; Date → "date"; invalid Date → "date"; RegExp → "object"; Error → "object"; boxed primitives → "object". These direct probes are verification I ran, not official Zod unit tests.

## Key Surprising Behaviour

- A fake `{ then(){}, catch(){} }` object counts as "promise".
- The promise check runs before Map/Set/Date/File, so a thenable that is also one of those is labelled "promise".
- An invalid Date still counts as "date" (new Date(NaN) is a Date instance, so it matches Date before any value validity is considered).
- RegExp and Error fall back to "object".
- Boxed primitive objects (new Number(5), new String(5)) fall back to "object".
- The default switch branch is effectively unreachable under standard `typeof` semantics.