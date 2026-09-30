function calculateOrderTotal(items, discountPercent) {
    let subtotal = 0;

    for (const item of items) {
        subtotal += item.price * item.quantity;
    }

    if (discountPercent > 0) {
        subtotal = subtotal * (discountPercent / 100);
    }

    return Math.round(subtotal * 100) / 100;
}

module.exports = { calculateOrderTotal };