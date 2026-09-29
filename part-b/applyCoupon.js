function applyCoupon(cartTotal, coupon, currentDate, customer) {
    // Step 1: Validate the cart total
    if (!Number.isInteger(cartTotal) || cartTotal < 0) {
        throw new Error(
            "Invalid cart total: must be a non-negative whole number of kobo."
        );
    }

    // Step 2: Check whether the coupon exists
    if (!coupon) {
        throw new Error("Coupon does not exist.");
    }

    // Step 3: Check whether the coupon is active
    if (!coupon.active) {
        throw new Error("Coupon is not active.");
    }

    // Step 4: Validate the coupon's discount type
    if (coupon.type !== "percentage" && coupon.type !== "fixed") {
        throw new Error(
            "Invalid coupon configuration: discount type must be 'percentage' or 'fixed'."
        );
    }

    // Step 5: Validate the coupon's discount value
    if (typeof coupon.value !== "number" || coupon.value < 0) {
        throw new Error(
            "Invalid coupon: discount value must be a non-negative number."
        );
    }

    if (coupon.type === "fixed" && !Number.isInteger(coupon.value)) {
        throw new Error(
            "Invalid coupon: fixed discount must be a whole number of kobo."
        );
    }

    if (coupon.type === "percentage" && coupon.value > 100) {
        throw new Error(
            "Invalid coupon: percentage discount must be between 0 and 100."
        );
    }

    // Step 6: Validate the coupon's usage limit
    if (coupon.usageLimit <= 0) {
        throw new Error(
            "Coupon is not usable: usage limit is zero or negative."
        );
    }

    // Step 7: Check the coupon expiry
    if (currentDate >= coupon.expiry) {
        throw new Error("Coupon has expired.");
    }

    // Step 8: Check the minimum spend requirement
    if (cartTotal < coupon.minimumSpend) {
        throw new Error(
            "Cart total does not meet the coupon's minimum spend requirement."
        );
    }

    // Step 9: Check the customer's coupon usage
    if (customer.usageCount >= coupon.usageLimit) {
        throw new Error("Usage limit reached for this customer.");
    }

    // Step 10: Calculate the discount
    let discount;

    if (coupon.type === "percentage") {
        discount = Math.floor(cartTotal * (coupon.value / 100));
    } else {
        discount = coupon.value;
    }

    // Step 11: Prevent the discount from making the cart total negative
    if (discount > cartTotal) {
        discount = cartTotal;
    }

    // Step 12: Calculate the new cart total
    const newTotal = cartTotal - discount;

    // Step 13: Return the new cart total
    return newTotal;
}

module.exports = { applyCoupon };