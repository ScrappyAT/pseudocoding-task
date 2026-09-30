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

START

SET subtotal to 0

FOR EACH item in items
    ADD (item.price × item.quantity) to subtotal
END FOR

IF discountPercent is greater than 0
    SET subtotal to subtotal × (discountPercent ÷ 100)
END IF

SET subtotal to ROUND(subtotal × 100) ÷ 100

RETURN subtotal

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
