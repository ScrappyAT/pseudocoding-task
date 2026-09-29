# B2 — Trace vs Implementation

## Purpose

Before implementing `applyCoupon`, I wrote the pseudocode and manually traced five different inputs in B1.

After implementing the function, I ran the same five inputs against the actual code to check whether the implementation behaved exactly as predicted.

## Test Results

| Test | Scenario | Hand-Traced Result | Actual Code Result | Match |
|---|---|---|---|---|
| 1 | Normal percentage coupon | 1,800,000 kobo | 1,800,000 kobo | Yes |
| 2 | Expired coupon | Error: coupon expired | Error: Coupon has expired. | Yes |
| 3 | Cart below minimum spend | Error: minimum spend not met | Error: Cart total does not meet the coupon's minimum spend requirement. | Yes |
| 4 | Customer usage limit reached | Error: usage limit reached | Error: Usage limit reached for this customer. | Yes |
| 5 | Fixed discount larger than cart total | 0 kobo | 0 kobo | Yes |

## Test Details

### Test 1 — Normal Percentage Coupon

- Cart total: 2,000,000 kobo
- Coupon type: percentage
- Coupon value: 10%
- Expected discount: 200,000 kobo
- Expected total: 1,800,000 kobo
- Actual total: 1,800,000 kobo
- Result: MATCH

### Test 2 — Expired Coupon

- Cart total: 2,000,000 kobo
- Coupon type: fixed
- Coupon value: 300,000 kobo
- Coupon expiry was before the current date.
- Expected result: reject the coupon as expired.
- Actual result: `Coupon has expired.`
- Result: MATCH

### Test 3 — Below Minimum Spend

- Cart total: 450,000 kobo
- Minimum spend: 500,000 kobo
- Expected result: reject the coupon because the cart does not meet the minimum spend.
- Actual result: `Cart total does not meet the coupon's minimum spend requirement.`
- Result: MATCH

### Test 4 — Usage Limit Reached

- Cart total: 1,500,000 kobo
- Coupon usage limit: 2
- Customer usage count: 2
- Expected result: reject the coupon because the usage limit has been reached.
- Actual result: `Usage limit reached for this customer.`
- Result: MATCH

### Test 5 — Discount Larger Than Cart

- Cart total: 500,000 kobo
- Fixed discount: 800,000 kobo
- Expected behaviour: cap the discount at the cart total.
- Expected total: 0 kobo
- Actual total: 0 kobo
- Result: MATCH

## Actual Terminal Output

```text
Test 1 - Normal percentage: RESULT = 1800000 kobo
Test 2 - Expired coupon: ERROR = Coupon has expired.
Test 3 - Below minimum spend: ERROR = Cart total does not meet the coupon's minimum spend requirement.
Test 4 - Usage limit reached: ERROR = Usage limit reached for this customer.
Test 5 - Discount larger than cart: RESULT = 0 kobo
```

## Comparison

All five implementation results matched the behaviour I predicted during the B1 hand-tracing exercise.

**Final result: 5/5 traces matched the implementation.**

No changes to the pseudocode were required as a result of these five tests.

## What I Learned

Writing and tracing the pseudocode before implementation made the coding stage more mechanical. Most of the decisions about validation, expiry behaviour, usage limits, percentage rounding, and preventing a negative cart total had already been made before I started writing the function.

The test results also showed that the pseudocode was specific enough to predict the behaviour of the implementation across normal, edge, and failure cases.