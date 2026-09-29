const { applyCoupon } = require("./applyCoupon");

function runTest(name, cartTotal, coupon, currentDate, customer) {
    try {
        const result = applyCoupon(cartTotal, coupon, currentDate, customer);
        console.log(`${name}: RESULT = ${result} kobo`);
    } catch (error) {
        console.log(`${name}: ERROR = ${error.message}`);
    }
}

const currentDate = new Date("2026-09-29T10:00:00Z");

// TEST 1: Normal percentage coupon
runTest(
    "Test 1 - Normal percentage",
    2000000,
    {
        code: "SAVE10",
        type: "percentage",
        value: 10,
        active: true,
        expiry: new Date("2026-12-31T23:59:59Z"),
        minimumSpend: 500000,
        usageLimit: 5,
    },
    currentDate,
    {
        usageCount: 1,
    }
);

// TEST 2: Expired coupon
runTest(
    "Test 2 - Expired coupon",
    2000000,
    {
        code: "OLD3000",
        type: "fixed",
        value: 300000,
        active: true,
        expiry: new Date("2026-09-01T00:00:00Z"),
        minimumSpend: 500000,
        usageLimit: 5,
    },
    currentDate,
    {
        usageCount: 1,
    }
);

// TEST 3: Below minimum spend
runTest(
    "Test 3 - Below minimum spend",
    450000,
    {
        code: "MINIMUM",
        type: "percentage",
        value: 10,
        active: true,
        expiry: new Date("2026-12-31T23:59:59Z"),
        minimumSpend: 500000,
        usageLimit: 5,
    },
    currentDate,
    {
        usageCount: 0,
    }
);

// TEST 4: Usage limit reached
runTest(
    "Test 4 - Usage limit reached",
    1500000,
    {
        code: "LIMITED",
        type: "fixed",
        value: 200000,
        active: true,
        expiry: new Date("2026-12-31T23:59:59Z"),
        minimumSpend: 500000,
        usageLimit: 2,
    },
    currentDate,
    {
        usageCount: 2,
    }
);

// TEST 5: Fixed discount larger than cart
runTest(
    "Test 5 - Discount larger than cart",
    500000,
    {
        code: "BIGDISCOUNT",
        type: "fixed",
        value: 800000,
        active: true,
        expiry: new Date("2026-12-31T23:59:59Z"),
        minimumSpend: 0,
        usageLimit: 5,
    },
    currentDate,
    {
        usageCount: 0,
    }
);

module.exports = { applyCoupon };