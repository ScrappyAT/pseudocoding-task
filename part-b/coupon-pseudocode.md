# Part B1 — Coupon Application Feature

## Pseudocode

FUNCTION applyCoupon

INPUTS:
- cart total: the total cost of the cart before the coupon is applied,
  represented as a non-negative whole number of minor units (kobo)

- coupon: the coupon being redeemed, including:
  - code
  - active status
  - discount type ("percentage" or "fixed")
  - discount value
  - expiry date/time
  - minimum spend in minor units
  - usage limit

- current date: the date/time the coupon is being applied

- customer: the customer applying the coupon, including how many times
  they have already used this coupon

OUTPUT:
- The new cart total after the discount is applied, represented as a
  whole number of minor units.
- The returned total is never less than zero.

SIDE EFFECTS:
- NONE.
- This function only calculates and returns the new total.
- It does not update the coupon, customer, usage count, cart, or database.

FAILS WHEN:
- The cart total is negative.
- The cart total is not a whole number of minor units.
- The coupon does not exist.
- The coupon is inactive or has been disabled.
- The discount type is neither "percentage" nor "fixed".
- The discount value is negative.
- A fixed discount value is not a whole number of minor units.
- A percentage discount is below 0% or above 100%.
- The coupon usage limit is zero or negative.
- The current date/time is equal to or later than the coupon expiry date/time.
- The cart total is below the coupon's minimum spend requirement.
- The customer has already used the coupon the maximum allowed number of times.

STEPS:

1. Validate the cart total.
   a. Check whether the cart total is a whole number of minor units.
   b. Check whether the cart total is zero or greater.
   c. If either check fails, stop and return an error.

2. Check whether the coupon exists.
   a. If the coupon does not exist, stop and return an error.

3. Check whether the coupon is active.
   a. If the coupon is inactive or disabled, stop and return an error.

4. Validate the coupon's discount type.
   a. Check whether the discount type is "percentage" or "fixed".
   b. If it is neither, stop and return an "invalid coupon configuration" error.

5. Validate the coupon's discount value.
   a. Check whether the discount value is zero or greater.
   b. If it is negative, stop and return an error.
   c. If the discount type is "fixed", check that the discount value is a
      whole number of minor units.
   d. If the fixed discount is not a whole number of minor units, stop and
      return an error.
   e. If the discount type is "percentage", check that the percentage is
      between 0% and 100% inclusive.
   f. If the percentage is outside that range, stop and return an error.

6. Validate the coupon's usage limit.
   a. Check whether the usage limit is greater than zero.
   b. If the usage limit is zero or negative, stop and return an error.

7. Check the coupon expiry.
   a. Compare the current date/time with the coupon expiry date/time.
   b. If the current date/time is equal to or later than the expiry date/time,
      stop and return a "coupon has expired" error.
   c. Otherwise, continue.

8. Check the minimum spend requirement.
   a. Compare the cart total with the coupon's minimum spend.
   b. If the cart total is below the minimum spend, stop and return an error.
   c. If the cart total is equal to or greater than the minimum spend, continue.

9. Check the customer's coupon usage.
   a. Compare the customer's usage count with the coupon's usage limit.
   b. If the usage count is equal to or greater than the usage limit,
      stop and return a "usage limit reached" error.
   c. Otherwise, continue.

10. Calculate the discount.
    a. If the discount type is "percentage":
       - Multiply the cart total by the percentage discount.
       - Divide the result by 100.
       - If the result contains a fraction of one minor unit, round down
         to the nearest whole minor unit.
    b. If the discount type is "fixed":
       - Use the fixed discount value directly.

11. Prevent the discount from making the cart total negative.
    a. Compare the calculated discount with the cart total.
    b. If the discount is greater than the cart total, set the discount
       equal to the cart total.
    c. Otherwise, leave the discount unchanged.

12. Calculate the new cart total.
    a. Subtract the final discount from the original cart total.

13. Return the new cart total.


## Decisions After Hand Tracing

1. Expiry boundary

If the current date/time is exactly equal to the coupon expiry date/time,
I will treat the coupon as expired and therefore not valid.

The check is that the current date/time must be before the expiry date/time.
The coupon stops working at the instant it expires.


2. Percentage rounding

When a percentage discount produces a fraction of one kobo, I will round
down (floor) to the nearest whole kobo.

This keeps all monetary values as whole minor units and ensures the calculated
discount does not exceed the percentage amount.


3. Invalid discount type

If the discount type is neither "percentage" nor "fixed", I will fail with
an "invalid coupon configuration" error rather than silently applying no
discount or guessing which type was intended.


4. Invalid cart total

If the cart total is negative or is not a whole number of kobo, I will fail
with an error before doing any other checks because an invalid cart total
indicates that something upstream is already wrong.


5. Invalid discount value

If the discount value is negative, I will fail with an error because a
negative discount could increase the cart total instead of reducing it.

For a fixed discount, the value must also be a whole number of minor units.


6. Percentage range

A percentage coupon must be between 0% and 100% inclusive.

A 0% coupon is allowed even though it produces no discount.

Anything above 100% or below 0% fails with an error.


7. Usage limit

If the usage limit is zero or negative, I will treat the coupon as unusable
and fail with an error whenever someone attempts to redeem it.


# Hand Traces

## Input 1 — Normal Percentage Coupon

Cart total:
2,000,000 kobo (₦20,000)

Coupon type:
percentage

Discount value:
10%

Minimum spend:
500,000 kobo (₦5,000)

Expiry:
30 November 2026

Current date:
15 November 2026

Usage limit:
3

Customer usage count:
1

Active:
yes

TRACE:

1. Cart total is 2,000,000 kobo.
   It is a non-negative whole number → pass.

2. Coupon exists → pass.

3. Coupon is active → pass.

4. Discount type is "percentage" → valid.

5. Discount value is 10%.
   It is non-negative and between 0% and 100% → pass.

6. Usage limit is 3.
   It is greater than zero → pass.

7. Current date (15 Nov) is before expiry (30 Nov) → not expired.

8. Cart total of 2,000,000 kobo meets the minimum spend of
   500,000 kobo → pass.

9. Customer usage count (1) is below usage limit (3) → pass.

10. Calculate percentage discount:

    2,000,000 × 10 ÷ 100
    = 200,000 kobo

    There is no fractional kobo to round.

11. Discount of 200,000 kobo does not exceed the cart total of
    2,000,000 kobo → no adjustment needed.

12. New total:

    2,000,000 − 200,000
    = 1,800,000 kobo

13. Return 1,800,000 kobo.

EXPECTED OUTPUT:

1,800,000 kobo (₦18,000)


## Input 2 — Expired Coupon

Cart total:
2,000,000 kobo (₦20,000)

Coupon type:
fixed

Discount value:
300,000 kobo (₦3,000)

Minimum spend:
500,000 kobo (₦5,000)

Expiry:
10 November 2026

Current date:
15 November 2026

Usage limit:
1

Customer usage count:
0

Active:
yes

TRACE:

1. Cart total is a valid non-negative whole number → pass.

2. Coupon exists → pass.

3. Coupon is active → pass.

4. Discount type is "fixed" → valid.

5. Fixed discount is 300,000 kobo.
   It is a non-negative whole number → pass.

6. Usage limit is 1 → valid.

7. Current date (15 Nov) is after expiry (10 Nov).

   Stop here.

EXPECTED OUTPUT:

Error — coupon has expired.

Cart total remains unchanged at:

2,000,000 kobo (₦20,000)


## Input 3 — Below Minimum Spend

Cart total:
450,000 kobo (₦4,500)

Coupon type:
percentage

Discount value:
20%

Minimum spend:
500,000 kobo (₦5,000)

Expiry:
30 November 2026

Current date:
15 November 2026

Usage limit:
2

Customer usage count:
0

Active:
yes

TRACE:

1. Cart total is a valid non-negative whole number → pass.

2. Coupon exists → pass.

3. Coupon is active → pass.

4. Discount type is "percentage" → valid.

5. Percentage is 20%.
   It is between 0% and 100% → pass.

6. Usage limit is 2 → valid.

7. Current date is before expiry → pass.

8. Cart total is 450,000 kobo.
   Minimum spend is 500,000 kobo.

   450,000 is below 500,000.

   Stop here.

EXPECTED OUTPUT:

Error — cart total is below the minimum spend required.

Cart total remains unchanged at:

450,000 kobo (₦4,500)


## Input 4 — Usage Limit Reached

Cart total:
1,500,000 kobo (₦15,000)

Coupon type:
fixed

Discount value:
200,000 kobo (₦2,000)

Minimum spend:
500,000 kobo (₦5,000)

Expiry:
30 November 2026

Current date:
15 November 2026

Usage limit:
2

Customer usage count:
2

Active:
yes

TRACE:

1. Cart total is a valid non-negative whole number → pass.

2. Coupon exists → pass.

3. Coupon is active → pass.

4. Discount type is "fixed" → valid.

5. Fixed discount is 200,000 kobo.
   It is a non-negative whole number → pass.

6. Usage limit is 2 → valid.

7. Current date is before expiry → pass.

8. Cart total meets the minimum spend → pass.

9. Customer usage count is 2.
   Usage limit is also 2.

   The customer has reached the usage limit.

   Stop here.

EXPECTED OUTPUT:

Error — usage limit reached for this customer.

Cart total remains unchanged at:

1,500,000 kobo (₦15,000)


## Input 5 — Discount Larger Than Cart Total

Cart total:
500,000 kobo (₦5,000)

Coupon type:
fixed

Discount value:
800,000 kobo (₦8,000)

Minimum spend:
100,000 kobo (₦1,000)

Expiry:
30 November 2026

Current date:
15 November 2026

Usage limit:
1

Customer usage count:
0

Active:
yes

TRACE:

1. Cart total is a valid non-negative whole number → pass.

2. Coupon exists → pass.

3. Coupon is active → pass.

4. Discount type is "fixed" → valid.

5. Fixed discount is 800,000 kobo.
   It is a non-negative whole number → pass.

6. Usage limit is 1 → valid.

7. Current date is before expiry → pass.

8. Cart total of 500,000 kobo meets the minimum spend of
   100,000 kobo → pass.

9. Customer usage count (0) is below usage limit (1) → pass.

10. Discount type is fixed.

    Calculated discount = 800,000 kobo.

11. Discount of 800,000 kobo is greater than the cart total of
    500,000 kobo.

    Cap the discount at 500,000 kobo.

12. New total:

    500,000 − 500,000
    = 0 kobo

13. Return 0 kobo.

EXPECTED OUTPUT:

0 kobo (₦0)

The discount is capped so the cart total cannot become negative.