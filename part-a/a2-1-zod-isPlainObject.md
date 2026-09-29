# A2.1 — Zod `isPlainObject`

**Library:** Zod 4.5.4  
**Source:** `node_modules/zod/src/v4/core/util.ts`  
**Function:** `isPlainObject`

## My First-Pass Pseudocode

FUNCTION isPlainObject

INPUTS:
- o (any value, of unknown type)

OUTPUT:
- true if o is a plain object (like {} or Object.create(null)), otherwise false

SIDE EFFECTS:
- None. The function only reads properties and never changes o or anything else.

FAILS WHEN:
- It never throws an error. Anything that is not a plain object (null, undefined, numbers, strings, arrays, dates, class instances) returns false.

STEPS:

1. If o is not an object (checked with the isObject helper), return false.

2. Get the constructor of o. If it is missing (undefined) or is not a function, return true, because o is a bare or simple key-value object.

3. Get the prototype of that constructor. If the prototype is not an object, return false.

4. Check whether that prototype has its own "isPrototypeOf" method. Only the base Object prototype owns it, so if it does not, return false.

5. Otherwise, return true.

## My Initial Understanding

This function checks whether a value is a plain object, meaning a simple key-value object like `{ a: 1 }`, and not an array, a Date, or an instance of a class. It works by tracing the value back to the thing that created it (its constructor) and then to that constructor's blueprint (its prototype). Every kind of object inherits the `isPrototypeOf` method, but only the blueprint of the original `Object` owns it. So if the blueprint owns that method, the object was made by plain `Object`. If not, it was made by something else. Objects with no constructor at all (`Object.create(null)`) are treated as plain too.

## Questions / Things I Am Unsure About

- What exactly does the `isObject` helper check? I assume it rules out null and arrays, but it isn't in this snippet.
- Why does it check the constructor's prototype instead of just testing `o.constructor === Object`?
- Why use `Object.prototype.hasOwnProperty.call(...)` and not `prot.hasOwnProperty(...)` directly?
- Why does it return true when the constructor is missing or is not a function? Is this to handle objects made with `Object.create(null)` or with an overwritten constructor property?
- Would this still work for a plain object created in another window or iframe, which has its own separate `Object`?

## AI Explanation Comparison

Compare my original first-pass understanding against the analysis of the actual
Zod 4.5.4 implementation and its tests.

| Topic | My First-Pass Understanding | What the Source/AI Analysis Showed | Result |
| --- | --- | --- | --- |
| Basic purpose of `isPlainObject` | Distinguishes plain key-value objects from arrays, Date objects, Maps, and ordinary class instances | Confirmed. It isolates plain records; arrays, dates, maps, sets, boxed primitives, functions, and nullish values all return false | ✅ Correct |
| `isObject` helper | I assumed it ruled out null and arrays, but hadn't seen it | Source (`util.ts` 400–402) is exactly `typeof data === "object" && data !== null && !Array.isArray(data)`. It does **not** itself reject Date, Map, Set, boxed primitives, or class instances — those pass `isObject` and are handled later | ✅ My guess correct, now pinned down |
| Missing constructor | `Object.create(null)` is accepted | Confirmed. `if (ctor === undefined) return true` (`util.ts` 429) catches it, and the tests assert `Object.create(null)` → true | ✅ Correct |
| Non-function constructor | I said this returns true, treating it as a bare key-value object | Confirmed and it is an important nuance: if constructor exists but is not a function, `isPlainObject` returns true (`util.ts` 431). Tests cover `constructor: "string"/123/null/true/{}/[]` (all → true), plus `constructor: undefined` | ✅ Correct, but I under-weighted it |
| Constructor prototype | The function inspects the constructor's prototype | Confirmed: `const prot = ctor.prototype; if (isObject(prot) === false) return false` (`util.ts` 434–435) | ✅ Correct |
| `isPrototypeOf` ownership check | The prototype must *own* `isPrototypeOf`, not merely inherit it | Confirmed. `Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")` (`util.ts` 438). `Object.prototype` owns it; `Date.prototype`, `Map.prototype`, and class prototypes inherit it and therefore fail | ✅ Correct |
| Safe `hasOwnProperty` call | I asked why not `prot.hasOwnProperty(...)` | The indirect call avoids a missing/overwritten/shadowed/untrusted `hasOwnProperty`. A hostile object could set `prot.hasOwnProperty` to anything, or to nothing, and a direct call would throw or lie | ✅ Explained |
| Why not `o.constructor === Object` | I asked why the prototype test is used | Three reasons: `Object.create(null)` has no constructor; the constructor property can be overwritten (a `=== Object` test would reject those); direct Object identity fails across JavaScript realms | ✅ Explained |
| Cross-realm question | I asked whether it works across windows/iframes | Structural compatibility: a foreign realm's `Object.prototype` still *owns* its own `isPrototypeOf`, so the hasOwnProperty check passes for plain objects from other realms (I verified `vm`-context plain objects → true). **No explicit iframe/cross-realm test or doc comment exists in the repo** — I confirmed by searching the whole `zod/src` tree. So this is inference from structure, not established by Zod's own tests | ⚠️ Compatible by inference; not explicitly tested |
| Side effects | None; the function only reads properties | Confirmed. It reads `constructor` and `prototype`, never assigns, never mutates, never calls user code | ✅ Correct |

## What I Got Right

The core idea was correct and held up against the source:

- `isPlainObject` really is a "trace the object back to what built it" test, and
  the trace is constructor → prototype → own `isPrototypeOf`.
- The `isObject` helper rules out null and arrays; the source confirmed my guess
  exactly, including that it is a purely structural check.
- `Object.create(null)` (no constructor) counts as plain.
- A missing constructor returns true, and a non-function constructor returns true
  too — I already described the "missing or not a function" branch as a bare
  key-value object.
- The discriminator is *ownership* of `isPrototypeOf`, not mere inheritance. My
  "only the base Object prototype owns it" phrasing turned out to be accurate.
- No side effects. The function only reads.
- `{}` → true, `[]` → false, `new Date()` → false, null/undefined/primitives →
  false, class instances → false: all match what the tests and my probe assert.

## What I Got Wrong or Oversimplified

These are the specific places where my first-pass interpretation drifted from
what the implementation actually does. I am recording them as differences
between my first understanding and what I learned from inspecting the code,
not rewriting what I originally wrote:

- I described `isObject` as a step on the way to identifying plain objects, but
  it is much weaker than that name suggests: it only filters out primitives,
  null, arrays, and functions. Date, Map, Set, boxed primitives, and class
  instances all pass it. The plain-object test does the real work *after* it.
- My "FAILS WHEN" line said "Anything that is not a plain object … returns
  false" — too broad. Objects whose constructor is a non-function
  **deliberately return true** even though they are not conventional `{}`
  objects. An object carrying `constructor: "hello"` is classified as plain.
- Relatedly, the implementation is more permissive around modified constructor
  properties than the name `isPlainObject` initially suggests. I treated
  "missing or non-function constructor → true" as one bland branch; the tests
  elevate it to nine separate cases, each deliberately asserted, and the
  adjacent `shallowClone` test shows the behavior is relied upon for cloning
  real user data.
- I never stated the destructive edge of the wrapper: an object whose prototype
  passes `isObject` but does not own `isPrototypeOf` (class instances, Dates) is
  rejected, but that rejection happens *through* `Array.isArray` and the
  prototype checks — I did not previously tie the mechanism to
  `Object.prototype.hasOwnProperty.call` specifically.

## Answers to My Original Questions

**Q: What exactly does the `isObject` helper check? I assume it rules out null and arrays, but it isn't in this snippet.**

Your assumption was exactly right. `util.ts:400–402`:

```ts
export function isObject(data: any): data is Record<PropertyKey, unknown> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
```

It is a purely structural, cheap test: primitives (which fail `typeof === "object"`), null, and arrays are out; everything else object-like is in — including Dates, Maps, Sets, boxed primitives, and class instances. It is a filter, not a plain-object detector. Those non-plain object types pass `isObject` and are only rejected later by the prototype checks.

**Q: Why does it check the constructor's prototype instead of just testing `o.constructor === Object`?**

A direct `o.constructor === Object` identity test would break on three fronts, each handled by the prototype approach:

1. `Object.create(null)` has no constructor at all — there is no `Object` to compare against, but it must count as plain.
2. The constructor property is a writable, shadowable data property on ordinary objects. Someone can set `{ constructor: "whatever" }`, and an identity test would reject a value the tests explicitly want accepted.
3. An object created in another realm has a distinct constructor function object, so identity against the *local* `Object` would fail even though the object is perfectly plain.

Tracing through `ctor.prototype` and asking the prototype the ownership question sidesteps all three: it does not care which specific `Object` function was involved, only whether the prototype used to build the object is "the base object prototype kind" — recognized by owning `isPrototypeOf` rather than inheriting it. (Every realm's base Object prototype owns its own `isPrototypeOf`, which is what makes this scheme cross-realm-compatible.)

**Q: Why use `Object.prototype.hasOwnProperty.call(...)` and not `prot.hasOwnProperty(...)` directly?**

Because `hasOwnProperty` is itself a property that can be missing, overwritten, shadowed, or otherwise untrusted — and the value under inspection here is a *prototype*, which is exactly the kind of object you are least entitled to trust. If `prot` has no own `hasOwnProperty` it still inherits one from `Object.prototype`, so a direct `prot.hasOwnProperty(...)` call works in the benign case. But if something redefined or removed it, a direct call either throws or returns a lie. Routing the call through `Object.prototype.hasOwnProperty` and passing the object explicitly sidesteps whatever the object's own property chain says. This is the standard safe-hasOwnProperty idiom, and it also reads the *own* flag directly, which the whole test hinges on.

**Q: Why does it return true when the constructor is missing or is not a function? Is this to handle objects made with `Object.create(null)` or with an overwritten constructor property?**

Yes, both cases, and the tests make it explicit. The `ctor === undefined` return at `util.ts:429` is the `Object.create(null)` path (asserted true at test line 864). The `typeof ctor !== "function"` return at `util.ts:431` is the overwritten-constructor path, asserted for `"string"`, `123`, `null`, `undefined`, `true`, `{}`, and `[]` (lines 872–878). The rationale seems to be: if the constructor slot is not a function, then the object was not produced by some exotic built-in machinery — its blueprint story is "plain by default". A string in the constructor slot is just user data, and rejecting it would make `isPlainObject` useless for records shaped like `{ constructor: "something", ... }`. The `shallowClone` test (lines 881–903) leans on exactly that: it spreads such objects into clones and expects byte-identical results.

**Q: Would this still work for a plain object created in another window or iframe, which has its own separate `Object`?**

I can give a structural answer backed by execution: the check that matters is `Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")`. A plain object from another realm has a constructor whose prototype is that realm's own `Object.prototype`, and per the ECMAScript spec every realm's `Object.prototype` owns its own `isPrototypeOf` method. So the own-property probe succeeds and the foreign plain object is classified as plain. I confirmed empirically with `vm.runInNewContext('({ a: 1 })')` and `vm.runInNewContext('Object.create(null)')` — both returned true — while noting the foreign constructor does not equal the local `Object`. What I must flag honestly: I searched the entire `node_modules/zod/src` tree and there is **no** iframe/cross-realm test and **no** documentation comment making that promise. So "it works across realms" is an inference from the implementation's structure and a personal probe, not something Zod's own test suite establishes.

## Revised Understanding

What I now understand: `isPlainObject` is a three-stage filter. First, `isObject` drops everything that is not a non-null, non-array object — a cheap gate that lets plenty of non-plain objects through. Second, the constructor slot is examined; if it is absent the object is a null-prototype record and counts as plain, and if it is not a function the constructor slot is merely user data and the object counts as plain too. Third, the constructor's prototype must be an object that *owns* `isPrototypeOf` rather than inheriting it — that ownership is the fingerprint of a base object prototype, and everything built on top of it (Dates, Maps, Sets, class instances, boxed primitives) is rejected at this final stage. The function performs no work beyond reading three properties, has no side effects, and can be fooled in exactly one interesting direction: it trusts that a missing or non-function constructor means "plain", which is why `{ constructor: "hello" }` is deliberately classified as a plain record rather than rejected. Ownership of `isPrototypeOf` is what makes the check robust across realms without any special-casing.

## Evidence from Zod Tests

Primary:

`node_modules/zod/src/v4/classic/tests/index.test.ts` — approximately lines 862–879

The `isPlainObject` test explicitly establishes:

- `{}` → true
- `Object.create(null)` → true
- `[]` → false
- `new Date()` → false
- `null` / `undefined` / primitives (`"string"`, `123`, `Symbol()`) → false
- objects whose constructor is a non-function →
  - `constructor: "string"` → true
  - `constructor: 123` → true
  - `constructor: null` → true
  - `constructor: undefined` → true
  - `constructor: true` → true
  - `constructor: {}` → true
  - `constructor: []` → true

The adjacent `shallowClone` test — approximately lines 881–903 — supports the
same intent from the other direction. It clones objects whose constructor field
is a string, number, null, boolean, plain object, or array, and asserts the clone
equals the original and is a *new* object. Since `shallowClone` routes anything
`isPlainObject` accepts through `{ ...o }`, the test only produces sane clones
because `isPlainObject` classifies those constructor-manipulated records as
plain. That is not a comment asserting the behavior is correct — it is a
behavioral use of the behavior, which is the strongest practical confirmation a
test suite can give.

I cross-checked every row above against the real evaluation at runtime, not just
by reading: `z.core.util.isPlainObject` from the installed Zod 4.5.4 returned
the same verdicts the test asserts, `Object.prototype` owns `isPrototypeOf`
while `Date.prototype`, `Map.prototype`, `Set.prototype`, and a class
prototype only inherit it, and a `vm`-context plain object (cross-realm) also
returned true.