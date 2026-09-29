# Reverse-Engineered Pseudocode — applyCoupon

## FUNCTION

applyCoupon

## INPUTS

- cart total: a value expected to be a number and a whole number of minor units. Required to be an integer (in the JavaScript sense) and zero or greater. It is the cost of the cart before the discount is applied.
- coupon: a single value representing the coupon. Must not be null or undefined. It is read for the following fields:
  - active: a field used as a truthiness flag. The coupon is treated as active only when this field is truthy.
  - discount type: a field that must be exactly the text "percentage" or "fixed". Decides which discount calculation is used.
  - discount value: a field used in numeric comparisons and arithmetic. For a "fixed" coupon it must be a whole number (integer) and zero or greater. For a "percentage" coupon it must be zero or greater and 100 or less.
  - expiry: a value compared against the current date using "equal to or later than". Its concrete type (for example, a date object or a date string) is not validated by the implementation and cannot be determined from the code.
  - minimum spend: a value compared against the cart total using "less than". Its type is not validated.
  - usage limit: a value used in the "greater than zero" check and compared against the customer's usage count. Its type is not validated.
- current date: a value compared against the coupon's expiry using "equal to or later than". Its concrete type is not validated and cannot be determined from the code.
- customer: a single value representing the customer. The implementation reads its usage count field from it. The customer value itself is not checked for existence before the field is read; providing null or undefined fails indirectly with a type error.

## OUTPUT

- When every condition below passes, the function returns the cart total minus the final discount, computed and capped as described in the steps. The result is a whole number of minor units whenever the inputs are numbers in the normal case.
- When any condition fails, the function stops by throwing an error instead of returning a value.
- If a percentage coupon has a discount value that is not a normal finite number, the returned value can be "not a number" (NaN) and is not capped.

## SIDE EFFECTS

- NONE. The function only reads its inputs and returns a value or throws an error. It does not modify the cart, the coupon, the customer, a usage count, or any external state. The only externally visible effect is throwing an error on failure.

## FAILS WHEN

1. The cart total is not a whole number of minor units — anything for which the integer check is false, such as a fraction, a non-number, or an infinite value.
2. The cart total is negative.
3. The coupon is null or undefined.
4. The coupon's active field is falsy — for example false, zero, an empty string, null, undefined, or NaN.
5. The discount type is neither the exact text "percentage" nor the exact text "fixed".
6. The discount value is negative.
7. The discount type is "fixed" and the discount value is not a whole number of minor units. (A non-number also fails this check.)
8. The discount type is "percentage" and the discount value is below zero or above 100. (Exactly zero and exactly 100 are accepted.)
9. The usage limit is zero or negative. (Note: a "not a number" usage limit slips through this check because "not a number" is neither equal to nor below zero via the less-than-or-equal comparison.)
10. The current date is equal to or later than the coupon expiry. (Exactly equal is treated as expired.)
11. The cart total is below the coupon's minimum spend. (Exactly equal passes. A missing minimum spend field also passes, because "cart total below undefined" is false.)
12. The customer's usage count is equal to or greater than the usage limit. (Exactly equal is treated as the limit reached. A missing usage count field also passes, because "undefined equal to or greater than the usage limit" is false.)
13. Indirectly, when the customer value is null or undefined: reading the usage count field then throws a type error, because the customer is not given the existence check the coupon receives.

## STEPS

1. Check whether the cart total is a whole number of minor units.
   a. If it is not, stop and throw an "invalid cart total" error.
2. Check whether the cart total is negative.
   a. If it is, stop and throw an "invalid cart total" error.
3. Check whether the coupon is null or undefined.
   a. If it is, stop and throw a "coupon does not exist" error.
4. Check whether the coupon's active field is truthy.
   a. If it is falsy, stop and throw an "inactive coupon" error.
5. Check whether the discount type is the exact text "percentage" or the exact text "fixed".
   a. If it is neither, stop and throw an "invalid coupon configuration" error.
6. Check whether the discount value is negative.
   a. If it is, stop and throw a "discount value" error.
7. Check whether the discount type is "fixed".
   a. If it is, check whether the discount value is a whole number of minor units.
   b. If the fixed discount value is not a whole number, stop and throw an error.
8. Check whether the discount type is "percentage".
   a. If it is, check whether the discount value is below zero or above 100.
   b. If the percentage is outside that range, stop and throw an error.
9. Check whether the usage limit is zero or negative.
   a. If it is, stop and throw a "usage limit" error.
10. Compare the current date with the coupon's expiry.
    a. If the current date is equal to or later than the expiry, stop and throw a "coupon has expired" error.
11. Check whether the cart total is below the coupon's minimum spend.
    a. If it is, stop and throw a "minimum spend" error.
12. Compare the customer's usage count with the usage limit.
    a. If the usage count is equal to or greater than the usage limit, stop and throw a "usage limit reached" error.
13. Check the discount type again.
    a. If it is "percentage", continue to step 14.
    b. Otherwise (it is "fixed"), set the discount to the coupon's discount value and go to step 16.
14. Multiply the cart total by the discount value.
15. Divide the product by 100 and round the result down to the nearest whole minor unit.
    a. Set the discount to this rounded value.
16. Check whether the discount is greater than the cart total.
    a. If it is, set the discount equal to the cart total.
    b. If it is not, leave the discount unchanged.
    (Exactly equal is not capped, which yields the same result either way.)
17. Subtract the final discount from the cart total.
18. Return the result of the subtraction as the new cart total.

## NOTED BEHAVIOURS AND UNCERTAIN POINTS

- The discount value for a percentage coupon is never checked to be a normal finite number. A value of "not a number" passes steps 6 and 8, turns every later arithmetic into "not a number", and is returned uncapped.
- The percentage discount is rounded down using a floor operation: any fraction of one minor unit produced by the multiplication and division is discarded.
- Relational comparisons in this implementation follow JavaScript numeric coercion. For example a percentage discount value supplied as a numeric string passes the range checks and is later coerced during arithmetic, while a fixed discount value supplied as a string fails the whole-number check. This behaviour is a consequence of the implementation and is not stated as an intended requirement.
- The types of the current date, the expiry, the minimum spend, and the usage limit are not validated by the implementation; which type of value the caller is expected to supply (for example, date objects versus date strings) cannot be determined from this code.
- The exact wording of the error messages is present in the code, but the meaning of each error is implied by its message text and the surrounding checks, not by the pseudocode standard here.