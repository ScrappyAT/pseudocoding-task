# A2.3 — Zod `visit`

**Library:** Zod 4.5.4
**Source:** `node_modules/zod/src/v4/core/visit.ts`
**Function:** `visit`
**Difficulty:** Difficult

## My First-Pass Pseudocode

FUNCTION visit

INPUTS:
- schema — the root Zod schema to walk through
- fnOrHandlers — either one function that is called on every node, or an object of handlers keyed by schema kind (e.g. "string", "object"), where each handler only runs on nodes of that kind

OUTPUT:
- A Zod schema. If nothing was changed, it is the original schema (same identity). If something was changed, it is a new schema with the changes applied, and only the branches that changed are copied.

SIDE EFFECTS:
- Fills an internal cache (a Map) during the walk. It is local to each call to visit and is thrown away afterwards.
- Does not change the original schemas. Changed nodes are cloned instead.
- Calls the user's function or handlers, which may do their own side effects.

FAILS WHEN:
- I don't see the function throwing its own errors. But a user handler could throw, and the original getter of a lazy schema could throw when it is called.
- The placeholder created for a cycle looks its result up in the cache when it is first used. If it is used before the walk has finished, the cache has no finished result for it yet, so it may return undefined.

STEPS:

### Main visit function

1. If fnOrHandlers is a function, use it directly as the visitor function (called fn).

2. If it is a handlers object, build fn like this: given a node and the rewritten flag, look up the handler for the node's kind. If a handler exists, call it with the node and the flag. If there is no handler, return the node unchanged.

3. Create an empty cache that maps each schema to its result, or to a "currently being processed" marker.

### run helper

4. Look up the schema in the cache.

5. If the cache holds the "currently being processed" marker, we have hit a cycle (the schema contains itself). Return a new lazy schema whose getter reads the finished result from the cache later, at parse time. Do not go deeper.

6. If the cache holds a finished result, return it (so a schema used in several places is only processed once).

7. Otherwise, put the "currently being processed" marker in the cache for this schema.

8. Call mapInner on the schema to process its children first. This gives inner, which is either the same schema or a clone with new children.

9. Call fn on inner. Pass rewritten as true if inner is a different object from the original schema, false if not.

10. Store the result of fn in the cache and return it.

### mapInner helper

Get the definition and the kind of the schema, then choose by kind. The general pattern: run each child, check whether any child came back different, and if so clone the schema with the new children. If nothing changed, return the original.

#### Object

- Run every property in the shape. Note if any changed.
- If a catchall schema exists, run it too and note if it changed.
- If anything changed, clone the schema with the new shape and catchall. Otherwise return the original.

#### Array

- Run the element schema. If it changed, clone with the new element. Otherwise return the original.

#### Tuple

- Run every item. If a rest schema exists, run it too.
- If anything changed, clone with the new items and rest. Otherwise return the original.

#### Record / Map

- Run the key type and the value type.
- If either changed, clone with the new key and value types. Otherwise return the original.

#### Set

- Run the value type. If it changed, clone with the new value type. Otherwise return the original.

#### Union

- Run every option. If any changed, clone with the new options. Otherwise return the original.

#### Intersection

- Run the left and the right side. If either changed, clone with the new sides. Otherwise return the original.

#### Optional / Nullable / Default / etc.

- These kinds (optional, nullable, default, prefault, catch, readonly, nonoptional, promise, success) all wrap one inner schema.
- Run the inner type. If it changed, clone with the new inner type. Otherwise return the original.

#### Pipe

- Run the input side and the output side.
- If either changed, clone with the new sides. Otherwise return the original.

#### Function

- Run the input schema and the output schema.
- If either changed, clone with the new ones. Otherwise return the original.

#### Lazy

- Do not call the getter now, because that would trigger the cycle check.
- Remove the saved (memoised) inner result from the definition so it does not shadow the new getter.
- Always clone, with a new getter that calls the original getter and then runs the result.

#### Leaf types

- Return the schema as it is. Leaves have no children to walk.
- This covers string, number, int, boolean, bigint, symbol, undefined, null, void, never, any, unknown, date, nan, enum, literal, file, transform and custom.
- template_literal is also treated as a leaf on purpose, because its parts are pieces of a regex and not data positions.

#### Unknown/default

- For a kind that is not listed, return the schema unchanged.
- The `satisfies never` line makes the code fail to compile if Zod adds a new built-in kind and nobody handles it here.

### Final step

- Call run on the root schema and return the result.

## My Initial Understanding

visit walks through a whole Zod schema tree from the bottom up and lets the caller replace or change any node. It works in three parts. visit sets up the visitor function (either the one function given, or a lookup into the handlers object) and the cache, then starts at the root. run is the manager for one node: it checks the cache, handles cycles, calls mapInner, then calls the visitor on the result and saves it. mapInner knows the shape of each kind of schema, so it knows where the children are. It runs each child, and only clones the parent if a child changed.

Because children are processed before their parent, the visitor sees a node after everything under it has been processed, and the rewritten flag tells it whether something below changed. The cache stops repeat work and stops infinite loops in schemas that refer to themselves, using a lazy placeholder. Unchanged branches keep the same identity, which keeps the result cheap and predictable.

## Questions / Things I Am Unsure About

- When a cycle is found, the placeholder is returned straight away, so I think fn is never called on it. Is that right?
- Why does the lazy case always clone, even when nothing changed? Is it only because calling the getter early would break the cycle check?
- What is `_cachedInner`, and what would go wrong if it was not removed?
- What exactly does `clone` copy, and does it keep the checks and refinements on the schema?
- What happens if a handler returns a schema of a completely different type than the node it received?
- Why is template_literal a leaf? Could that ever cause a bug if a template literal contains other schemas?

## AI Explanation Comparison

| Topic | My First-Pass Understanding | What the Source/AI Analysis Showed | Result |
| --- | --- | --- | --- |
| 1. Overall traversal | visit performs a bottom-up traversal. | Confirmed. `run` recurses into a node's children via `mapInner` (visit.ts:53, 59–190) before `fn` is ever called on that node (54). The probe recorded children firing before their parent (`lazy → optional → object`). | CORRECT |
| 2. Identity preservation | Unchanged branches preserve their original schema object identity. | Confirmed. Every non-lazy branch returns `s` itself when no child changed (e.g. 78, 82, 110, 140, 145, 152); the identity-callback test (deep-partial.test.ts:286–289) asserts `visit(schema, (s) => s) === schema`. | CORRECT |
| 3. Changed children | A parent is cloned when a traversed child comes back with a different identity. | Confirmed. Branches compare each child result with a strict identity check (e.g. `mapped !== oldShape[k]`, 70) and clone the parent via `clone(s, {...def, ...})` only when `changed` is true. | CORRECT |
| 4. Input mutation | visit itself does not mutate the original schema objects. | Confirmed. visit only reads `_zod.def`/children and builds new instances through `clone`; `clone` constructs a fresh instance (util.ts:532–536) and never writes to the original. The "does not mutate the source schema" test (deep-partial.test.ts:275–282) backs this at consumer level. | CORRECT |
| 5. Shared-node cache | The cache prevents the same schema object from being fully processed repeatedly within one visit() call. | Confirmed. `cache.get(s)` hit at line 51 returns the finished result without re-running `mapInner`/`fn`. The cache is created per call (line 40) and is local to that invocation. Test: "visits shared sub-schemas only once" counts exactly 3 calls for schema + shared inner + leaf (319–329); my probe reproduced 3. | CORRECT |
| 6. RESOLVING and cycles | RESOLVING detects a schema already being processed and prevents infinite recursion. | Confirmed. `cache.set(s, RESOLVING)` (52) marks in-flight; a re-entry finds `cached === RESOLVING` (44) and stops. A non-lazy cycle receives a temporary `$ZodLazy` placeholder whose getter reads the finished result (46–49). | CORRECT |
| 7. Cycle placeholder and fn | My question: is fn called on the placeholder? | fn is NOT called on the placeholder. The RESOLVING branch (44–50) returns before `fn` is reached (54). The placeholder is only ever attached to a parent's cloned tree. | CORRECT |
| 8. Cycle placeholder safety | My FAILS WHEN said the placeholder might return undefined if used before the walk finishes. | INCORRECT for normal supported execution. The placeholder getter is not invoked during the traversal, so it is never "used before the walk finishes"; by the time it normally runs (parse-time innerType access) the cache entry has been replaced with the finished mapped node. Only an aborted traversal caused by an exception could theoretically leave an unfinished RESOLVING state behind. | CORRECTION |
| 9. rewritten flag | rewritten tells the visitor whether something below the node changed. | Broadly correct with an important nuance: `rewritten` is literally `inner !== s` (54), calculated BEFORE fn runs, so it describes what `mapInner` did, not whether fn itself replaces the node. Lazy exception: `mapInner` always clones lazy schemas, so `rewritten` is always true for a lazy node even if no eventual child rewrite occurs. | CORRECT, with nuance |
| 10. General mapInner pattern | Recursively run children, compare child identities, clone parent if something changed, otherwise preserve identity. | Confirmed for the structural kinds. Exceptions: lazy always clones; leaves return identity; template_literal deliberately returns identity; unknown/default kinds return identity. | CORRECT |
| 11. Object | Shape children and catchall are traversed. | Confirmed. Each shape key is run (68–72), then `def.catchall` if truthy (73–77), cloning on any change. Test: "catchall is traversed like tuple rest" (365–369). | CORRECT |
| 12. Array | Element traversal. | Confirmed. `run(def.element)`, clone only if it changed (80–83). | CORRECT |
| 13. Tuple | Items and optional rest traversal. | Confirmed. Every item plus `def.rest` when present (84–99). | CORRECT |
| 14. Record / Map | keyType and valueType traversal. | Confirmed (100–107). | CORRECT |
| 15. Set | valueType traversal. | Confirmed (108–111). | CORRECT |
| 16. Union | options traversal. | Confirmed (112–122). | CORRECT |
| 17. Intersection | left/right traversal. | Confirmed (123–129). | CORRECT |
| 18. Wrapper kinds | optional, nullable, default, prefault, catch, readonly, nonoptional, promise, success traverse innerType. | Confirmed — all share one case that runs `def.innerType` (130–141). | CORRECT |
| 19. Pipe | in/out traversal. | Confirmed — both `def.in` and `def.out` are run (142–146). | CORRECT |
| 20. Function | input/output traversal. | Confirmed (147–153). | CORRECT |
| 21. Lazy schemas | Lazy always clones. | Confirmed (154–160). The original getter is not called during the walk; `_cachedInner` is removed from the new definition (158); the new getter later runs the original getter through `run()` (159). Copying `_cachedInner` into the clone would let the old memoized inner schema shadow the new getter and bypass the rewrite. | CORRECT |
| 22. clone() | My question: what does clone copy? | `clone(s, newDef)` does not mutate the original; it constructs a new instance using the original schema's constructor (`inst._zod.constr`, util.ts:533); it receives the new definition; non-replaced definition fields such as checks/refinements are preserved through the spread (`{...def, <children>}`); it is not a deep copy of every referenced value. | CORRECT |
| 23. Different-kind replacements | My question: handler returns a completely different type. | Allowed. `VisitFn`/handlers return `AnyZod` (17–18). The replacement is stored in the cache (`cache.set(s, mapped)`, 55) and supplied to the parent, which clones because the child identity changed. | CORRECT |
| 24. Replacement traversal | (not claimed in my pseudocode) | A schema returned by fn is NOT recursively traversed again. visit is a single pass over the original schema structure: if a number handler returns `z.object({ inner: z.string() })`, visit accepts that replacement without then visiting the new object or its string child (verified by probe — the replacement's string child and its own handler were never invoked). Recorded as an important behaviour clarified by the analysis, not a mistake in my original pseudocode. | IMPORTANT BEHAVIOUR |
| 25. template_literal | A leaf because its parts are regex fragments, not data positions. | PARTLY CORRECT / needs nuance. `def.parts` can contain schema objects, but those have already been consumed into the compiled regex the template-literal schema uses (core/schemas.ts:4577–4603). visit deliberately does not traverse those parts (visit.ts:161–163). | PARTLY CORRECT |
| 26. kind satisfies never | Exhaustiveness check. | Confirmed. `kind satisfies never` (186) provides TypeScript compile-time exhaustiveness; it has no runtime effect. Unknown runtime/user kinds still fall through and return the original schema (187). | CORRECT |
| 27. Side effects | Internal cache/changed flags/arrays; no mutation; callbacks may have their own effects. | Confirmed. Cache writes, changed flags and new arrays/objects are internal local state of one call; visit itself does not mutate the input schema; user callbacks and lazy getters may themselves cause external side effects. | CORRECT |

## What I Got Right

The substantial parts of my first-pass understanding that the source confirmed:

- Bottom-up traversal and child-before-parent processing (children go through `run` before `fn` is called on the parent).
- Identity preservation of unchanged branches.
- Clone-on-child-change: a parent is only re-created when a traversed child came back with a different identity.
- Non-mutation of the original schema objects by visit itself.
- The per-call cache and its deduplication of shared schema objects.
- Cycle detection via the RESOLVING marker and the lazy placeholder returned for non-lazy cycles.
- fn never being called on the cycle placeholder.
- The branch handling for every structural schema kind (object, array, tuple, record/map, set, union, intersection, wrappers, pipe, function).
- Lazy always cloning, and the `_cachedInner` shadow problem.
- Different-kind replacements being allowed.
- template_literal being intentionally treated as a leaf.
- `kind satisfies never` providing exhaustiveness checking.

## What I Got Wrong or Oversimplified

1. My FAILS WHEN concern that the cycle placeholder might normally return undefined is incorrect. In normal supported execution the placeholder getter only runs after the walk, when the cache holds the finished mapped node.
2. My explanation of `rewritten` as simply "something below changed" needs the lazy-schema caveat: lazy always returns a clone from `mapInner`, so `rewritten` is always true for a lazy node even when nothing below actually changed.
3. My description of template_literal as having no children was too simple. Its `parts` can contain schema objects, but visit deliberately treats those parts as non-traversable because the runtime behaviour has already been compiled into a regex at construction.
4. Replacement schemas returned by fn are not re-traversed. This is a newly clarified behaviour rather than a correction: my original pseudocode (steps 9–10 of run) never claimed replacements were re-walked.

## Answers to My Original Questions

1. **When a cycle is found, is fn called on the placeholder?**
   - Fact (source): No. The `cached === RESOLVING` branch (visit.ts:44–50) returns the placeholder before the `fn(...)` call (54). fn is only invoked in the normal path, after `mapInner`.
   - Inference: none needed — this is unambiguous in the code and confirmed by the getter-cycle test working without fn ever seeing the placeholder.

2. **Why does lazy always clone?**
   - Fact (source): `mapInner` never calls the original getter during the walk (visit.ts:155) and always returns `clone(s, {...rest, getter: () => run(original())})` (159). The comment gives the rationale: "Invoking the getter here would trip the cycle check, so lazy nodes always re-clone."
   - Inference: because it refuses to call the getter, it can never prove the inner schema is unchanged, so it cannot take the identity path. Deferring also avoids running user getter code during the walk and keeps the getter's inner traversal on a settled cache.

3. **What is `_cachedInner` and what happens if it is not removed?**
   - Fact (source): `_cachedInner` is a memo of the resolved inner schema stored on the lazy's shared def object (schemas.ts:4879–4883); visit drops it before cloning (visit.ts:158, comment: "Drop the memo, or it shadows the new getter forever").
   - Fact (source/tests): if it rode along, `if (!d._cachedInner)` would skip calling the new getter, so the old memoized inner schema would bypass the rewrite. Verified by the "already-resolved lazy is still rewritten" test (deep-partial.test.ts:371–379).

4. **What exactly does clone copy?**
   - Fact (source): `clone` calls `new inst._zod.constr(def)` (util.ts:533) — same constructor/class, fresh instance, original untouched. The new def is a spread of the old def with replaced children, so non-replaced fields (checks, refinements, metadata) are kept by reference and re-applied by `$ZodType.init` (schemas.ts:201–222).
   - Inference: because fields are shared by reference, this is not a deep clone; mutating a shared `checks` array afterwards would affect both.
   - Fact (source): `clone(s, newDef)` with `newDef` provided does not set `_zod.parent` (util.ts:534).

5. **What happens if a handler returns a completely different schema type?**
   - Fact (source): it is allowed (return type `AnyZod`) and simply stored as that node's mapping result (`cache.set(s, mapped)`, 55), then given to the parent.
   - Fact (probe + consumers): the parent clones because the child identity changed; the replacement's own children are not traversed (single pass). Consumers rely on this: `z.input`/`z.output` replace `pipe` nodes with their `in`/`out` side (classic/in-out.ts:29–44).

6. **Why is template_literal treated as a leaf, and could this skip schema objects?**
   - Fact (source): `parts` may contain schema objects (core/schemas.ts:4512–4535), but the constructor compiles them into a single RegExp at construction (4577–4603) and parsing only uses the regex.
   - Fact (source): visit returns the node unchanged (visit.ts:161–163) with the comment "`parts` are regex fragments, not data positions."
   - Inference: visiting would gain nothing, since the compiled regex is fixed at construction and visit does not recompile. Therefore schema objects inside parts are skipped by design, which could only "miss" a visitor that explicitly wanted to reach and edit those part schemas.

## Revised Understanding

visit takes the schema I built and walks it bottom-up. For each node, `run` consults the cache first — a finished result means the node was already processed (shared schemas are only handled once), and the "currently being processed" marker means I hit a cycle, so I get a lazy placeholder that will read the finished node later. Otherwise the node is marked in-flight, its children are processed through `mapInner` (which follows the general rule: run the children, identity-check each result, and only clone the parent when something differs), and then my visitor runs with `rewritten` telling me whether the node handed to me differs from the original. Lazy nodes break that pattern: they are always cloned with a deferred getter and their memo dropped.

The single most important rule is that visit makes only one pass over the original tree: a replacement I return becomes that node's final mapped result, and visit never walks the newly returned replacement. So bottom-up means bottom-up over the original structure, and cycles are where the cache takes over: the placeholder bridges back into the finished rewritten tree at parse time. Lazy and non-lazy cycles both resolve through the cache — lazy lazily, and non-lazy via the placeholder.

## Evidence from Zod Tests

Direct visit tests in `node_modules/zod/src/v4/classic/tests/deep-partial.test.ts`, describe block **"visit (internal)"** (approximately lines 285–380):

- "identity callback returns the input schema unchanged" (286–289) — a no-op visitor returns the root by identity.
- "empty handler map returns the input schema unchanged" (291–294) — no handlers → identity.
- "only nodes touched by a handler are re-cloned; siblings keep identity" (296–305) — untouched sibling `shape.a === a`; parent is a new clone.
- "callback: can target a specific def.type" (307–311) — generic visitor can filter by kind.
- "handler map: dispatches by kind; unhandled kinds pass through" (313–317) — handler-map dispatch.
- "visits shared sub-schemas only once" (319–329) — 3 calls total; cache deduplication.
- "root is cached: lazy self-reference does not re-invoke fn at parse-time" (331–341) — lazy recursion stays cached.
- "unknown def.type falls through unchanged (handler map form)" (343–348) — default/unknown kinds are identity.
- "non-lazy (getter) cycle resolves through the cache instead of throwing" (350–363) — cycle placeholder; recursion still rewritten.
- "catchall is traversed like tuple rest" (365–369) — catchall traversal.
- "an already-resolved lazy is still rewritten" (371–379) — the `_cachedInner` memo must not shadow the new getter.

Consumer evidence in `node_modules/zod/src/v4/classic/tests/in-out.test.ts` — `z.input`/`z.output` use visit with pipe replacement, and tests such as "a wrapper's stored value survives only on the side it belongs to" (114–129) and "a wrapper over a pipe-free schema keeps both its value and its identity" (131–139) demonstrate the `rewritten`-driven default/catch/prefault shedding and different-kind replacement.

Zod has no direct test for: re-traversal of handler-returned replacements (it does not happen), rewritten values for every node kind, or rewritten always being true for lazy. Those were established by source reading and the runtime probes, not by the test suite.

## Runtime Verification

Temporary read-only probes against the installed Zod 4.5.4 implementation (run outside the repos, not official Zod unit tests) confirmed representative behaviours: identity walk returns the exact same root; a number-to-string handler replacement clones the parent while untouched siblings keep identity; a subtree returned by a handler is not re-traversed (its string child was never visited); a shared sub-schema is processed once (3 visits); a lazy recursive schema parses without re-invoking fn at parse time; a non-lazy getter-based cycle parses with rewrites applied at depth; rewritten flags match expectations for leaves (false) and changed parents (true) with every lazy seen as rewritten=true; and a completely different-kind replacement is accepted and supplied to the parent.

## Key Surprising Behaviour

1. A cyclic placeholder eventually points into the FINISHED REWRITTEN tree via the cache — `cache.get(s)` returns the rewritten node, so recursion after a cycle continues through the newly rebuilt schema, not the original.
2. `rewritten` is computed before fn and does not describe what fn itself returns; and lazy nodes report `rewritten = true` unconditionally.
3. A whole schema subtree returned by a visitor is opaque to this visit pass — the replacement and its children are not traversed.