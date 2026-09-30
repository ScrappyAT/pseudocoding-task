# A3 — Planted Bug Analysis

## Function

`calculateOrderTotal(items, discountPercent)` calculates an order subtotal from item prices and quantities and is intended to apply an optional percentage discount.

## Intended Behaviour

The function should:

1. Start the subtotal at 0.
2. Multiply each item's price by its quantity.
3. Add each item total to the subtotal.
4. If a discount is greater than 0, reduce the subtotal by that percentage.
5. Round the final amount to two decimal places.
6. Return the amount the customer should pay.

## My Pseudocode of the Actual Implementation

This is what the code in `part-a/a3-planted-bug.js` actually does, described before looking for anything wrong with it.

FUNCTION calculateOrderTotal

INPUTS:
- items (a list of order items, in the shape `{ price, quantity }`, where price is the
  price of one unit of the item and quantity is how many units of it were ordered).
  The list and its items are read but never changed.
- discountPercent (an optional number, the discount to apply as a percentage, so 20 means
  20% off). It is optional in the sense that a caller may leave it out; the function never
  checks whether it was supplied.

OUTPUT:
- A number, the order total rounded to two decimal places. This is meant to be the amount
  the customer should pay, but when a discount greater than zero is supplied it is the
  value of the discount instead.

SIDE EFFECTS:
- NONE. The function does not modify the items list or any item, does not modify the
  discount percentage, prints nothing, and makes no external calls. The only value it
  changes is its own local subtotal variable.

FAILS WHEN:
- It fails to produce the amount the customer should pay whenever the discount percentage
  is greater than zero. It replaces the subtotal with the discount amount instead of
  removing the discount from it, so it returns the wrong value for every discounted order.
  This is the planted bug.
- It never checks its inputs. If the items list is missing or is not a list, the loop
  cannot start and the function throws. If an item's price or quantity is missing or is
  not a number, the arithmetic produces a value that is not a money amount, and that
  value is returned as though it were valid.

STEPS:

1. Start a running subtotal at zero.

2. Take each item from the items list, one at a time, in the order the list gives them.

3. Multiply that item's price by that item's quantity to get the item's line total.

4. Add that line total to the running subtotal.

5. Repeat steps 3 and 4 until every item has been processed. The running subtotal now
   holds the full cost of the order before any discount.

6. If the discount percentage is greater than zero, take the discount branch: divide the
   discount percentage by 100 to express it as a decimal fraction.

7. Multiply the running subtotal by that decimal fraction.

8. Replace the running subtotal with the result of that multiplication. This step keeps the
   discount fraction of the subtotal rather than removing the discount from it.

9. If the discount percentage is zero or less, skip steps 6 to 8 and leave the running
   subtotal as the sum of the line totals.

10. Multiply the running subtotal by 100.

11. Round that value to the nearest whole number.

12. Divide by 100 to put the value back to two decimal places.

13. Return that rounded amount.

END

## My Pseudocode of the Intended Implementation

This is what the same function should do, so the two specifications can be compared step
by step. The only intentional difference is step 8.

FUNCTION calculateOrderTotal

INPUTS:
- items (a list of order items, in the shape `{ price, quantity }`, where price is a
  number giving the price of one unit of the item and quantity is a number giving how many
  units of it were ordered). The list and its items are read but never changed.
- discountPercent (an optional number, the discount to apply as a percentage, so 20 means
  20% off). When it is not supplied, or is zero or less, no discount is applied.

OUTPUT:
- A number, the amount the customer should pay, rounded to two decimal places.

SIDE EFFECTS:
- NONE. The function does not modify the items list or any item, does not modify the
  discount percentage, prints nothing, and makes no external calls. The only value it
  changes is its own local subtotal variable.

FAILS WHEN:
- It never checks its inputs. If the items list is missing or is not a list, the loop
  cannot start and the function throws. If an item's price or quantity is missing or is
  not a number, the arithmetic produces a value that is not a money amount, and that
  value is returned as though it were valid.
- On the discount path it is not expected to fail at all: the discount is removed from the
  subtotal and the discounted total is returned. Failing to do this is the planted bug in
  the actual implementation.

STEPS:

1. Start a running subtotal at zero.

2. Take each item from the items list, one at a time, in the order the list gives them.

3. Multiply that item's price by that item's quantity to get the item's line total.

4. Add that line total to the running subtotal.

5. Repeat steps 3 and 4 until every item has been processed. The running subtotal now
   holds the full cost of the order before any discount.

6. If the discount percentage is greater than zero, work out the discount amount: divide
   the discount percentage by 100 to express it as a decimal fraction, then multiply the
   running subtotal by that fraction. The result is the amount to take off, not the amount
   to keep.

7. Subtract that discount amount from the running subtotal, so the subtotal now holds the
   amount the customer still has to pay.

8. Alternatively, and equivalently, work out the fraction that remains after the discount
   — one minus the discount fraction — and multiply the running subtotal by that remaining
   fraction instead of subtracting.

9. If the discount percentage is zero or less, skip steps 6 to 8 and leave the running
   subtotal as the full cost of the order.

10. Multiply the running subtotal by 100.

11. Round that value to the nearest whole number.

12. Divide by 100 to put the value back to two decimal places.

13. Return that rounded amount.

END

## Hand Trace 1 — No Discount

Input:

items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
]

discountPercent = 0

Expected:
250

Trace:

- Start subtotal = 0
- First item: 100 × 2 = 200
- subtotal = 200
- Second item: 50 × 1 = 50
- subtotal = 250
- discountPercent > 0 is false
- Round 250 to two decimal places
- Return 250

Actual:
250

The no-discount path behaves as intended.

## Hand Trace 2 — With Discount

Input:

items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
]

discountPercent = 20

Expected:
200

Trace:

- Start subtotal = 0
- First item: 100 × 2 = 200
- subtotal = 200
- Second item: 50 × 1 = 50
- subtotal = 250
- 20 > 0, so enter the discount branch
- subtotal = 250 × (20 ÷ 100)
- subtotal = 250 × 0.2
- subtotal = 50
- Round 50 to two decimal places
- Return 50

Actual:
50

## Actual vs Intended Behaviour

The function works correctly when there is no discount.

When a discount is supplied, however, the implementation returns the value of the discount itself instead of the amount the customer should pay.

For a subtotal of 250 with a 20% discount:

Discount amount:
250 × 0.20 = 50

Expected final amount:
250 - 50 = 200

Actual final amount:
50

The two pseudocode specifications agree on every step except one. Step 8 of the actual implementation replaces the subtotal with the discount amount (step 6 of the intended implementation computes the same number, but step 7 of the intended implementation subtracts it instead of keeping it). That single difference is the planted bug.

## Bug I Identified

The bug is in this calculation:

subtotal = subtotal * (discountPercent / 100)

This calculates the discount amount and replaces the subtotal with that value.

For a 20% discount, it keeps 20% of the subtotal instead of removing 20% from the subtotal.

## Proposed Fix

The calculation should keep the percentage remaining after the discount:

subtotal = subtotal * (1 - discountPercent / 100)

For a subtotal of 250 and a 20% discount:

1 - 0.20 = 0.80

250 × 0.80 = 200

The function would therefore return the correct final amount of 200.

## What I Learned

Writing pseudocode for the actual implementation made the problem easier to see.

If I had described the intended behaviour as "apply the discount", the logic could have looked correct at a high level. Writing the exact calculation exposed that the code was calculating the discount amount rather than the final price.

The hand trace then made the difference measurable: expected 200, actual 50.

This showed me why pseudocode and hand tracing are useful for debugging. They force me to follow what the code actually does instead of what I assume it does.
