\# C3 — Own Implementation vs AI Implementation



\## Purpose



I compared my own B2 implementation of `applyCoupon` against the independent AI implementation created in C1.



Both implementations were tested with the same 10 conceptual inputs:



\- the original 5 inputs used during B1 and B2

\- 5 new edge-case inputs



Because the two implementations chose different property names from the original pseudocode, the test harness maps each conceptual coupon into the property names expected by each implementation. This allows the comparison to focus on behaviour rather than naming differences.



\## Results



| Test | Scenario | My Implementation | AI Implementation | Match |

|---|---|---|---|---|

| 1 | Normal 10% percentage coupon | 1,800,000 | 1,800,000 | Yes |

| 2 | Expired coupon | Error | Error | Yes |

| 3 | Below minimum spend | Error | Error | Yes |

| 4 | Usage limit reached | Error | Error | Yes |

| 5 | Fixed discount larger than cart | 0 | 0 | Yes |

| 6 | Coupon does not exist | Error | Error | Yes |

| 7 | Percentage value is `NaN` | `NaN` | `NaN` | Yes |

| 8 | Minimum spend is missing | 900,000 | 900,000 | Yes |

| 9 | Percentage value is string `"10"` | Error | 900,000 | \*\*NO\*\* |

| 10 | Customer usage count is missing | 900,000 | 900,000 | Yes |



\## Summary



\- Total inputs tested: 10

\- Matching behaviours: 9

\- Disagreements: 1



The disagreement occurred on Test 9.



\## Disagreement — Numeric String Percentage



\### Input



The cart total was:



`1,000,000` minor units



The percentage discount value was supplied as:



`"10"`



This is a string containing the characters `10`, rather than the number `10`.



\### My Implementation



My implementation rejected the input with:



`Invalid coupon: discount value must be a non-negative number.`



My implementation explicitly checks that the discount value has the JavaScript type `number`.



\### AI Implementation



The AI implementation accepted `"10"` and returned:



`900,000`



It did not explicitly validate that the percentage discount value was a number.



JavaScript therefore converted the numeric string during comparison and arithmetic, allowing `"10"` to behave like the number `10`.



\### Tracing the Disagreement Back to the Pseudocode



The original pseudocode describes the discount value as a number and describes percentage values as being between 0 and 100.



However, it does not explicitly state what should happen when a caller supplies a value of another runtime type that can be converted into a number, such as the string `"10"`.



Because of that, the two implementations made different assumptions.



My implementation interpreted the input description strictly and required an actual number.



The AI implementation relied on JavaScript's coercion behaviour, which allowed the numeric string to pass.



\### Which Behaviour Should Be Used?



For the intended contract, I would require `discountValue` to actually be a number rather than relying on JavaScript to convert strings automatically.



This makes the input contract predictable and avoids different behaviour depending on JavaScript coercion.



The pseudocode should therefore state explicitly:



> Check that the discount value is a finite number. If it is not a number, including when it is a numeric string such as `"10"`, stop and throw an error.



This removes the ambiguity exposed by Test 9.



\## Other Findings



Test 7 revealed that both implementations allow `NaN` to reach the percentage calculation and eventually return `NaN`.



This was not a disagreement between the implementations, but it exposes another weakness in the original specification and both implementations. A revised specification should explicitly require the discount value to be a finite number.



Test 8 showed that both implementations allow a missing minimum-spend value to pass the minimum-spend comparison.



Test 10 similarly showed that both implementations allow a missing customer usage count to pass the usage-limit comparison.



These matching behaviours do not necessarily mean that they are desirable. They show that both implementations relied on JavaScript comparison behaviour in areas where the original pseudocode did not fully define invalid input handling.



\## Actual Terminal Summary



```text

Total tests: 10

Matches: 9

Disagreements: 1



Disagreement tests:

\- Test 9: Percentage value is string 10

```



\## What I Learned



The two implementations agreed on the main coupon behaviour, including the five cases that were traced before implementation.



The most useful result came from an input that the original pseudocode did not define precisely enough.



A value that looks numeric to a person can still have a different runtime type. My implementation rejected `"10"`, while the AI implementation accepted it because JavaScript automatically converted it during arithmetic.



The disagreement showed me that pseudocode needs to define not only valid ranges, but also the expected input types and what should happen when those types are wrong.



It also showed that agreement between two implementations does not automatically prove that their behaviour is correct. Both implementations returned `NaN` for one edge case and accepted missing values in other cases, which exposed areas where the specification itself could be made more precise.

