const { applyCoupon: myApplyCoupon } = require("../part-b/applyCoupon");
const { applyCoupon: aiApplyCoupon } = require("./ai-applyCoupon");

const currentDate = new Date("2026-09-29T10:00:00Z");

// Convert one conceptual coupon into the property names
// chosen by my B2 implementation.
function myCoupon(coupon) {
    if (coupon === null) return null;

    return {
        code: coupon.code,
        active: coupon.active,
        type: coupon.type,
        value: coupon.value,
        expiry: coupon.expiry,
        minimumSpend: coupon.minimumSpend,
        usageLimit: coupon.usageLimit,
    };
}

// Convert the same conceptual coupon into the property names
// chosen by the AI C1 implementation.
function aiCoupon(coupon) {
    if (coupon === null) return null;

    return {
        code: coupon.code,
        active: coupon.active,
        discountType: coupon.type,
        discountValue: coupon.value,
        expiry: coupon.expiry,
        minSpend: coupon.minimumSpend,
        usageLimit: coupon.usageLimit,
    };
}

function execute(fn, cartTotal, coupon, customer) {
    try {
        const result = fn(cartTotal, coupon, currentDate, customer);

        return {
            outcome: "RESULT",
            value: result,
        };
    } catch (error) {
        return {
            outcome: "ERROR",
            value: error.message,
        };
    }
}

function sameBehaviour(mine, ai) {
    // Both successfully returned a value.
    if (mine.outcome === "RESULT" && ai.outcome === "RESULT") {
        if (Number.isNaN(mine.value) && Number.isNaN(ai.value)) {
            return true;
        }

        return mine.value === ai.value;
    }

    // Both rejected the input.
    // Error wording is not treated as a behavioural disagreement because
    // the original pseudocode did not define every exact error message.
    if (mine.outcome === "ERROR" && ai.outcome === "ERROR") {
        return true;
    }

    return false;
}

function displayValue(result) {
    if (result.outcome === "RESULT" && Number.isNaN(result.value)) {
        return "RESULT: NaN";
    }

    return `${result.outcome}: ${result.value}`;
}

function runComparison(number, name, cartTotal, coupon, customer) {
    const mine = execute(
        myApplyCoupon,
        cartTotal,
        myCoupon(coupon),
        customer
    );

    const ai = execute(
        aiApplyCoupon,
        cartTotal,
        aiCoupon(coupon),
        customer
    );

    const match = sameBehaviour(mine, ai);

    console.log(`\nTest ${number} - ${name}`);
    console.log(`MY IMPLEMENTATION: ${displayValue(mine)}`);
    console.log(`AI IMPLEMENTATION: ${displayValue(ai)}`);
    console.log(`MATCH: ${match ? "YES" : "NO"}`);

    return { number, name, mine, ai, match };
}

const validBase = {
    code: "SAVE10",
    active: true,
    type: "percentage",
    value: 10,
    expiry: new Date("2026-12-31T23:59:59Z"),
    minimumSpend: 500000,
    usageLimit: 5,
};

const results = [];

// --------------------------------------------------
// ORIGINAL FIVE INPUTS FROM B1
// --------------------------------------------------

results.push(
    runComparison(
        1,
        "Normal percentage coupon",
        2000000,
        { ...validBase },
        { usageCount: 1 }
    )
);

results.push(
    runComparison(
        2,
        "Expired coupon",
        2000000,
        {
            ...validBase,
            type: "fixed",
            value: 300000,
            expiry: new Date("2026-09-01T00:00:00Z"),
        },
        { usageCount: 1 }
    )
);

results.push(
    runComparison(
        3,
        "Below minimum spend",
        450000,
        {
            ...validBase,
            minimumSpend: 500000,
        },
        { usageCount: 0 }
    )
);

results.push(
    runComparison(
        4,
        "Usage limit reached",
        1500000,
        {
            ...validBase,
            type: "fixed",
            value: 200000,
            usageLimit: 2,
        },
        { usageCount: 2 }
    )
);

results.push(
    runComparison(
        5,
        "Fixed discount larger than cart",
        500000,
        {
            ...validBase,
            type: "fixed",
            value: 800000,
            minimumSpend: 0,
        },
        { usageCount: 0 }
    )
);

// --------------------------------------------------
// FIVE NEW C3 INPUTS
// --------------------------------------------------

// Test 6: Missing coupon
results.push(
    runComparison(
        6,
        "Coupon does not exist",
        1000000,
        null,
        { usageCount: 0 }
    )
);

// Test 7: NaN percentage value
results.push(
    runComparison(
        7,
        "Percentage value is NaN",
        1000000,
        {
            ...validBase,
            value: NaN,
            minimumSpend: 0,
        },
        { usageCount: 0 }
    )
);

// Test 8: Missing minimum spend
results.push(
    runComparison(
        8,
        "Minimum spend is missing",
        1000000,
        {
            ...validBase,
            minimumSpend: undefined,
        },
        { usageCount: 0 }
    )
);

// Test 9: Percentage value supplied as a numeric string
results.push(
    runComparison(
        9,
        "Percentage value is string 10",
        1000000,
        {
            ...validBase,
            value: "10",
            minimumSpend: 0,
        },
        { usageCount: 0 }
    )
);

// Test 10: Missing customer usage count
results.push(
    runComparison(
        10,
        "Customer usage count is missing",
        1000000,
        {
            ...validBase,
            minimumSpend: 0,
        },
        {}
    )
);

// --------------------------------------------------
// SUMMARY
// --------------------------------------------------

const matches = results.filter((result) => result.match).length;
const disagreements = results.filter((result) => !result.match);

console.log("\n========================================");
console.log("C3 COMPARISON SUMMARY");
console.log("========================================");
console.log(`Total tests: ${results.length}`);
console.log(`Matches: ${matches}`);
console.log(`Disagreements: ${disagreements.length}`);

if (disagreements.length > 0) {
    console.log("\nDisagreement tests:");

    for (const result of disagreements) {
        console.log(`- Test ${result.number}: ${result.name}`);
    }
}