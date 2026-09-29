# C2 — Difference Table: Original Pseudocode vs Reverse-Engineered Pseudocode

## Sources compared

- **Original:** `part-b/coupon-pseudocode.md` (the pseudocode written before implementation).
- **Reverse-engineered:** `part-c/reverse-engineered-pseudocode.md` (derived only from `part-c/ai-applyCoupon.js`).

## Difference Table

| # | Original pseudocode | Reverse-engineered behaviour | Classification | Why it matters |
| --- | --- | --- | --- | --- |
| 1 | Steps repeatedly say "stop and return an error" (e.g. steps 1c, 2a, 3a, 5b, 7b, 9b); the hand traces show "EXPECTED OUTPUT: Error — coupon has expired." No error mechanism is ever defined; the success output ("return the new cart total") is the only return value described. | Every failure "stops" by **throwing a JavaScript Error object**; success returns a plain number. Nothing is ever "returned" on failure (reverse doc: OUTPUT "throws an error instead of returning a value"; SIDE EFFECTS lists throwing as the only externally visible effect). | AI INTERPRETED AMBIGUOUSLY | The failure contract is the whole shape of the function's interface: callers and tests must either catch exceptions or check a returned error value. The original lets either be reasonable; the implementation had to pick one. |
| 2 | Coupon inputs are listed as "including: code, active status, discount type, discount value, expiry date/time, minimum spend, usage limit" — concepts only, no object property names or object shape. | Coupon is read as a single object with camelCase properties: `active`, `discountType`, `discountValue`, `expiry`, `minSpend`, `usageLimit` (and `code`, though `code` is never read). | AI INTERPRETED AMBIGUOUSLY | Anyone building a coupon (callers, tests) must guess the property keys. snake_case (`discount_type`, `min_spend`), nested shapes, or a different "minimum spend" name would silently fail or mis-validate. |
| 3 | Customer is described only as "the customer applying the coupon, including how many times they have already used this coupon" — no field name, no structure. | Customer is read as a single value with the property `usageCount`, compared numerically against the usage limit (reverse doc FAILS WHEN 12, STEPS 12). | AI INTERPRETED AMBIGUOUSLY | The customer's shape is a guess; tests constructing a customer must match `usageCount` exactly. |
| 4 | FAILS WHEN lists "The coupon does not exist" and step 2 says "If the coupon does not exist, stop and return an error" — but never defines what "does not exist" is (null? undefined? a missing record? an unknown code?). | Failure fires when the coupon value is **null or undefined** (`coupon == null` in the code; reverse doc FAILS WHEN 3, STEPS 3). | AI INTERPRETED AMBIGUOUSLY | The representation of "no coupon" is a guess; the implementation chose null/undefined and treats any other provided value (no matter how malformed) as "exists". |
| 5 | No statement anywhere that the customer could be absent; no failure case for a missing customer (all FAILS WHEN entries concern the coupon, the cart total, or the usage count). | No existence check is applied to the customer; a null/undefined customer fails **indirectly** with a raw type error when `usageCount` is read (reverse doc FAILS WHEN 13: "reading the usage count field then throws a type error"). | AI INTERPRETED AMBIGUOUSLY | The original's silence forced a choice: guard the customer like the coupon, or read it unguarded. The implementation chose the latter, producing a crash that is not one of the intended error messages and is easy to miss in tests. |
| 6 | Coupon "active status" is described functionally: "If the coupon is inactive or disabled, stop and return an error." No statement that `active` must be a boolean. | `active` is applied as a **truthiness** check: any falsy value (false, 0, empty string, null, undefined, NaN) or a missing `active` field is treated as inactive (reverse doc FAILS WHEN 4, STEPS 4). | AI INTERPRETED AMBIGUOUSLY | With a genuine boolean this behaves identically to a strict `=== true` check, but the implementation also rejects falsy non-booleans and an absent field. The original never said `active` is boolean, so the strictness is an implementation choice. |
| 7 | Inputs are "current date (the date/time the coupon is being applied)" and "expiry date/time" — the value representation (Date object, ISO string, epoch number) is not specified. | `currentDate` and `expiry` are compared directly with `>=` and their types are never validated; which concrete types produce correct ordering is left to the caller (reverse doc INPUTS, NOTED BEHAVIOURS). | AI INTERPRETED AMBIGUOUSLY | Date objects and date strings do not always compare identically, and timezone handling differs across representations; the implementation inherits whichever semantics the caller's values invoke. |
| 8 | The original names exactly three error messages — "invalid coupon configuration" (step 4b), "coupon has expired" (step 7b), "usage limit reached" (step 9b). For every other failure only "an error" is mentioned. | The implementation reproduces those three messages (with slightly fuller wording) and invents the wording for all the others (e.g. "Invalid cart total: must be a non-negative whole number of minor units.", "Coupon does not exist.", "Coupon is inactive or has been disabled."), in sentence case (reverse doc NOTED BEHAVIOURS). | AI INTERPRETED AMBIGUOUSLY | Message text is externally visible and may be asserted by callers/tests; capitalisation and phrasing were free choices wherever the original gave no wording. |
| 9 | FAILS WHEN: "The discount value is negative" and "A percentage discount is below 0% or above 100%." No mention of non-finite or non-numeric values, and no requirement about what happens to a percentage discount value that is "not a number". | A NaN percentage discount value passes both the negative check and the 0–100 range check (NaN compares false both ways), so the discount becomes NaN, the cap comparison is skipped, and the function **returns NaN** (reverse doc OUTPUT: "the returned value can be 'not a number' and is not capped"; NOTED BEHAVIOURS). | AI ADDED | The implementation's semantics let an invalid monetary value flow all the way through to the result with no failure — behaviour the original neither required nor sanctioned, and that contradicts the spirit of "never less than zero". |
| 10 | FAILS WHEN: "The coupon usage limit is zero or negative." | The check is `<= 0`, so a usage limit that is NaN is neither zero nor negative and passes; the reverse doc calls this out explicitly (FAILS WHEN 9 note: "'not a number' usage limit slips through"). | AI ADDED | An unusable non-numeric limit is treated as usable instead of failing, which the original's intent ("unusable coupon") appears to forbid. |
| 11 | FAILS WHEN: "The cart total is below the coupon's minimum spend requirement." Minimum spend is described as an input in minor units. | The check is `cartTotal < coupon.minSpend`; with a missing `minSpend` field, `cartTotal < undefined` is false, so the check **passes** with no failure (reverse doc FAILS WHEN 11 note: "A missing minimum spend field also passes"). | AI ADDED | A coupon with no minimum-spend field silently bypasses the minimum-spend requirement rather than failing, which is a semantics the original did not specify. |
| 12 | FAILS WHEN: "The customer has already used the coupon the maximum allowed number of times." Implies the usage count is present. | The check is `customer.usageCount >= coupon.usageLimit`; with a missing `usageCount`, `undefined >= limit` is false, so the check **passes** (reverse doc FAILS WHEN 12 note: "a missing usage count field also passes"). | AI ADDED | A customer with no recorded usage is treated as not having reached the limit; behaviour the original did not define. |
| 13 | All monetary/percentage values are described as numbers ("non-negative whole number of minor units", "5% discount", "between 0% and 100%"). No statement that strings or other coercible values are acceptable. | JavaScript comparison and arithmetic coercion kicks in: a percentage `discountValue` supplied as the string "10" passes the range checks and is coerced during multiplication; a fixed `discountValue` string like "200000" fails the integer check; missing/string `minSpend` and `usageCount` values also coerce (reverse doc NOTED BEHAVIOURS). | AI ADDED | The same value expressed as a string vs a number can succeed or fail depending on the branch — implementation-specific coercion behaviour that no caller could predict from the original. |

## Genuine Ambiguity Found

**Chosen ambiguity: how failures are reported (the error mechanism).**

1. **What the original pseudocode said.**
   The original repeatedly says "stop and return an error" (steps 1c, 2a, 3a, 5b, 7b, 9b, and the FAILS WHEN list), and the hand traces write "EXPECTED OUTPUT: Error — coupon has expired." / "Error — cart total is below the minimum spend required." / "Error — usage limit reached for this customer." It never states whether the "error" is an exception that halts execution, a value returned from the function, or some other signal. The only concrete output contract given is for the success path: "return the new cart total."

2. **Why more than one reasonable implementation was possible.**
   "Return an error" is satisfiable in at least three common ways in JavaScript:
   - Throw a JavaScript `Error` (the function outputs nothing on failure; callers use `try/catch`).
   - Return a structured error value, e.g. `{ ok: false, error: "coupon has expired" }` or a discriminated union `{ ok: true, value } | { ok: false, error }`.
   - Return a sentinel/number with a separate status channel (e.g. return `-1` or `{ total, error }`).
   All three are faithful readings of "stop and return an error" + "RETURN the new cart total", and the traces do not disambiguate them (they only label the expected outcome as an "Error").

3. **What the AI implementation chose.**
   The implementation throws a JavaScript `Error` for every failure and, on success, returns a plain number. It never returns an error value; the function either returns the total or throws. This is a complete, coherent contract, but it is one of several that were open.

4. **What behaviour we actually want.**
   A single, unambiguous contract that tests and callers can rely on. A thrown `Error` on every failure is acceptable and matches common Node practice, but only if the spec states it plainly — otherwise a future implementer may "return an error object" and produce subtly different and hard-to-catch test failures. The spec should also state the exact message for every failure so error text is not a guessing game, and should pin the success type (a whole-number value in minor units).

5. **How the original pseudocode should be rewritten.**
   The following replaces the ambiguous OUTPUT / FAILS WHEN / error wording. The algorithmic steps themselves are unchanged:

```
FUNCTION: applyCoupon

INPUTS:
- cart total: number, a non-negative whole number of minor units (kobo).
- coupon: an object with these properties:
  - code: string
  - active: boolean (true = active, false = inactive/disabled)
  - discountType: "percentage" or "fixed"
  - discountValue: number (non-negative; for "fixed", a whole number of minor units; for "percentage", between 0 and 100 inclusive)
  - expiry: Date (the coupon stops working at this instant)
  - minSpend: number (non-negative whole number of minor units)
  - usageLimit: number (a positive integer)
- currentDate: Date (when the coupon is being applied)
- customer: an object with this property:
  - usageCount: number (non-negative whole number of times the customer has used this coupon)

OUTPUT:
- On success, return the new cart total as a whole number of minor units that is never less than zero.
- On failure, THROW a JavaScript Error whose message is exactly one of the strings listed in FAILS WHEN below.
- The function never returns an error value; it either returns the total or throws.

SIDE EFFECTS:
- NONE. This function only calculates and returns the new total. It does not update the coupon, customer, usage count, cart, or database.

FAILS WHEN (throw an Error with the exact message in quotes):
- The cart total is negative or is not a whole number of minor units. ("Invalid cart total.")
- The coupon is null or undefined (i.e. it does not exist). ("Coupon does not exist.")
- The coupon is inactive (active is false or the field is missing). ("Coupon is inactive or has been disabled.")
- The discountType is neither "percentage" nor "fixed". ("Invalid coupon configuration.")
- The discountValue is negative. ("Discount value must be zero or greater.")
- The discountValue is not a finite number. ("Discount value must be a finite number.")
- For a "fixed" coupon, the discountValue is not a whole number of minor units. ("Fixed discount value must be a whole number of minor units.")
- For a "percentage" coupon, the discountValue is below 0 or above 100. ("Percentage discount must be between 0 and 100 inclusive.")
- The usageLimit is zero, negative, or not a positive finite number. ("Coupon usage limit must be greater than zero.")
- The currentDate is equal to or later than the expiry. ("Coupon has expired.")
- The cartTotal is below the minSpend. ("Cart total is below the minimum spend required.")
- The customer is null or undefined. ("Customer does not exist.")
- The usageCount is equal to or greater than the usageLimit. ("Usage limit reached for this customer.")

STEPS: (unchanged from the original, preserving order, floor rounding, and discount capping as written)
```

## Summary

- **AI ADDED differences:** 5 (rows 9–13: NaN percentage discount value returning NaN; NaN usage limit passing; missing `minSpend` passing the check; missing `usageCount` passing the check; JavaScript coercion of non-number inputs).
- **AI OMITTED differences:** 0 (every behavioural requirement of the original — validation order, discount type/value/limit/expiry/minimum-spend/usage checks, percentage rounding down, discount capping, and the non-negative return — is present in the implementation).
- **AI INTERPRETED AMBIGUOUSLY differences:** 8 (rows 1–8: error mechanism; coupon property names; customer representation; the meaning of "coupon does not exist"; customer-existence handling; `active` truthiness vs boolean; date/expiry representation; error message wording).
- **Most important difference:** the error mechanism (row 1). It defines the entire failure interface of the function and is what tests and callers must program against; all other differences are about input shape or edge-value details that are easy to adapt, whereas a wrong error contract invalidates every error-path expectation.
- **Was the original precise enough to reproduce identical behaviour?** For the happy path and the arithmetic itself, yes: validation order, inclusive/ exclusive boundaries (expiry at equality, usage limit at equality, 0% and 100% allowed, exact cap boundary), floor rounding, and capping are all unambiguous and were reproduced identically. For the interface and edge-type handling, no: the error mechanism, property naming, customer shape, and the treatment of non-finite/missing values required implementation-specific assumptions that a second implementer would likely resolve differently.