function applyCoupon(cartTotal, coupon, currentDate, customer) {
  if (!Number.isInteger(cartTotal) || cartTotal < 0) {
    throw new Error("Invalid cart total: must be a non-negative whole number of minor units.");
  }

  if (coupon == null) {
    throw new Error("Coupon does not exist.");
  }

  if (!coupon.active) {
    throw new Error("Coupon is inactive or has been disabled.");
  }

  if (coupon.discountType !== "percentage" && coupon.discountType !== "fixed") {
    throw new Error("Invalid coupon configuration: discount type must be 'percentage' or 'fixed'.");
  }

  if (coupon.discountValue < 0) {
    throw new Error("Discount value must be zero or greater.");
  }

  if (coupon.discountType === "fixed" && !Number.isInteger(coupon.discountValue)) {
    throw new Error("Fixed discount value must be a whole number of minor units.");
  }

  if (coupon.discountType === "percentage" && (coupon.discountValue < 0 || coupon.discountValue > 100)) {
    throw new Error("Percentage discount must be between 0 and 100 inclusive.");
  }

  if (coupon.usageLimit <= 0) {
    throw new Error("Coupon usage limit must be greater than zero.");
  }

  if (currentDate >= coupon.expiry) {
    throw new Error("Coupon has expired.");
  }

  if (cartTotal < coupon.minSpend) {
    throw new Error("Cart total is below the minimum spend required.");
  }

  if (customer.usageCount >= coupon.usageLimit) {
    throw new Error("Usage limit reached for this customer.");
  }

  let discount;
  if (coupon.discountType === "percentage") {
    discount = Math.floor((cartTotal * coupon.discountValue) / 100);
  } else {
    discount = coupon.discountValue;
  }

  if (discount > cartTotal) {
    discount = cartTotal;
  }

  return cartTotal - discount;
}

module.exports = { applyCoupon };