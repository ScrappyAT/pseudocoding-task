# C4 — The Explanation Test

## Purpose

The purpose of this exercise was to test whether I understood the AI-generated coupon implementation well enough to explain it without relying on the source code.

I used my pseudocode as my reference while explaining the feature rather than walking through the implementation code.

## Recording Evidence

[View the C4 pseudocode explanation recording](https://drive.google.com/file/d/174i05jb6QYc9XBmsHQpKK2rATwyqKpOo/view?usp=sharing)

Recording duration: approximately 7 minutes 30 seconds.

The recording exceeded the five-minute target because the discussion continued into follow-up explanation and listener feedback.

## What I Explained

Using my pseudocode as notes, I walked through the coupon feature and explained:

- what the coupon function is responsible for
- the inputs it receives
- the validation performed before applying a coupon
- when a coupon should be rejected
- coupon expiry
- minimum-spend requirements
- percentage discounts
- fixed discounts
- how the discount is calculated
- how the final amount is determined
- what happens when a validation condition fails

The goal was to explain the behaviour of the implementation rather than read or translate the source code line by line.

## Non-Technical Listener Test

After the explanation, I asked a non-technical listener to explain the feature back to me in her own words.

Her responses showed that she understood several of the main rules.

### Coupon Expiry

She explained that a coupon can have a stipulated period during which it is valid.

She gave an example of a coupon that could be used during January. Once the user moves into February or March, the coupon would have expired and should therefore be rejected.

### Minimum Spend

She also explained that a coupon could have a minimum cart-value requirement.

Her example was that if a coupon required a cart value of 5,000 and the customer's cart had not reached that amount, the customer should not be allowed to use the coupon.

### Validation

She recalled that the function performs checks before applying the coupon.

In her explanation, she mentioned checking the values supplied to the function and checking that the coupon exists and is active before the discount is applied.

### Discount

She also remembered that part of the function's responsibility is to calculate the discount associated with the coupon.

## What I Learned From Her Response

The listener was able to explain important parts of the feature without seeing the implementation herself.

What stood out to me was that she did not simply repeat my explanation word for word. She created her own examples for coupon expiry and minimum-spend requirements.

That gave me a better indication that she understood the behaviour I was trying to communicate.

Her explanation was not always technically precise, which was also useful. It showed me that understanding the implementation myself is only one part of the problem. I also need to communicate the logic clearly enough that someone without a programming background can understand the important decisions.

## What I Learned From C4

This exercise made the difference between being able to run AI-generated code and actually understanding it more obvious to me.

Without looking at the implementation, I had to rely on the pseudocode to explain the sequence of decisions:

1. Validate the input.
2. Check whether the coupon can be used.
3. Reject it when a required condition fails.
4. Determine the type of discount.
5. Calculate the discount.
6. Calculate the final amount.
7. Return the result.

Having another person explain the feature back to me was a useful final check.

It showed me that pseudocode is not only useful before implementation. It can also be used after implementation to verify that I understand what was generated well enough to communicate it independently.